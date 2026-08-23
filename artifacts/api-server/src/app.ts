import express, { type Express, type Request, type Response } from "express";
import cors from "cors";
import compression from "compression";
import pinoHttp from "pino-http";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { clerkMiddleware } from "@clerk/express";
import { publishableKeyFromHost } from "@clerk/shared/keys";
import cookieParser from "cookie-parser";
import {
  CLERK_PROXY_PATH,
  clerkProxyMiddleware,
  getClerkProxyHost,
} from "./middlewares/clerkProxyMiddleware.js";

// ── Clerk availability ────────────────────────────────────────────────────────
// Clerk keys are OPTIONAL. When absent the server starts normally and serves
// all features (JSON store, admin panel, uploads, WebSockets). Only the
// Clerk-based player-login flow is disabled. Set CLERK_SECRET_KEY +
// CLERK_PUBLISHABLE_KEY in your host's environment to enable it.
const CLERK_ENABLED = Boolean(process.env.CLERK_SECRET_KEY);
import router from "./routes/index.js";
import { logger } from "./lib/logger.js";
import { readCol } from "./lib/store.js";
import path from "path";
import { fileURLToPath } from "url";
import { existsSync } from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);

app.set("trust proxy", 1);

app.use(compression());

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: false,
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 2000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    const p = req.path.toLowerCase();
    return p.startsWith('/admin') || p.startsWith('/auth') || p.includes('login') || p.includes('verify') || p.includes('theme') || p.startsWith('/uploads');
  },
  handler: (_req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.status(429).json({ ok: false, error: "Too many requests, please try again later." });
  },
});
app.use("/api", limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: "Too many auth attempts, please try again later." },
});
app.use("/api/__clerk", authLimiter);

app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());

// CORS_ORIGIN: comma-separated list of allowed origins for split deployments
// (e.g. frontend on Vercel, backend on Render). Leave unset to reflect any
// request origin (current same-origin Replit deployment behavior).
const corsOrigins = process.env.CORS_ORIGIN?.split(",").map((o) => o.trim()).filter(Boolean);
app.use(cors({ credentials: true, origin: corsOrigins && corsOrigins.length > 0 ? corsOrigins : true }));
app.use(cookieParser());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Apply Clerk auth middleware only when keys are present.
// When disabled every request proceeds without a Clerk session — routes that
// check req.auth?.userId will simply see an unauthenticated user.
if (CLERK_ENABLED) {
  app.use(
    clerkMiddleware((req) => ({
      publishableKey: publishableKeyFromHost(
        getClerkProxyHost(req) ?? "",
        process.env.CLERK_PUBLISHABLE_KEY,
      ),
    })),
  );
}

interface LoginDiagnosticLog {
  timestamp: string;
  path: string;
  method: string;
  requestBody: Record<string, any>;
  authMiddlewareResult: {
    databaseStatus: string;
    credentialCheckResult: string;
    authStep: string;
    accountFound: boolean;
    isDatabaseConnected: boolean;
  };
  error: {
    message: string;
    stack?: string;
    name?: string;
  };
}

let lastLoginDiagnosticLog: LoginDiagnosticLog | null = null;

// Diagnostic endpoint to check recorded 500 errors and stack traces during admin login
app.get(["/api/diagnostic/login", "/api/diagnostic", "/api/admin/diagnostic"], (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/json");
  res.json({
    success: true,
    status: "ok",
    timestamp: new Date().toISOString(),
    lastLoginDiagnosticError: lastLoginDiagnosticLog || "No 500 errors recorded during admin login.",
  });
});

app.use("/api", router);

// Global error handler for /api routes to explicitly log stack traces and request body when 500 occurs
app.use("/api", async (err: any, req: Request, res: Response, _next: any) => {
  const isLoginPath = Boolean(req.originalUrl?.includes("login") || req.path?.includes("login"));
  const sanitizedBody = req.body && typeof req.body === "object" ? { ...req.body } : {};
  if (sanitizedBody.password) {
    sanitizedBody.password = "[REDACTED]";
  }

  // Probe database status and credentials matching for diagnostic analysis
  let dbConnected = false;
  let dbDetails = "Unknown database status";
  let accountFound = false;

  try {
    const rawAccounts = await readCol("staffAccounts");
    if (Array.isArray(rawAccounts)) {
      dbConnected = true;
      dbDetails = `Connected: ${rawAccounts.length} staff account(s) loaded from database`;
      if (sanitizedBody.email && typeof sanitizedBody.email === "string") {
        const searchEmail = sanitizedBody.email.trim().toLowerCase();
        accountFound = rawAccounts.some(
          (acc: any) => acc?.email && String(acc.email).trim().toLowerCase() === searchEmail
        );
      }
    } else {
      dbDetails = "Database returned non-array payload for staffAccounts";
    }
  } catch (dbErr: any) {
    dbDetails = `Database connection/read error: ${dbErr?.message || String(dbErr)}`;
  }

  const authStep = err?.authStep || err?.authMiddlewareResult?.step || "unhandled_middleware_error";
  const credentialCheckResult = err?.authMiddlewareResult?.category ||
    (!dbConnected
      ? "DATABASE_CONNECTION_FAILURE"
      : !accountFound
      ? "ACCOUNT_NOT_FOUND_IN_DB"
      : "INCORRECT_CREDENTIALS_OR_HASH_MISMATCH");

  const authMiddlewareResult = {
    databaseStatus: err?.dbStatus || dbDetails,
    credentialCheckResult,
    authStep,
    accountFound,
    isDatabaseConnected: dbConnected,
  };

  const diagnosticEntry: LoginDiagnosticLog = {
    timestamp: new Date().toISOString(),
    path: req.originalUrl || req.path,
    method: req.method,
    requestBody: sanitizedBody,
    authMiddlewareResult,
    error: {
      message: err?.message || String(err),
      stack: err?.stack,
      name: err?.name || "Error",
    },
  };

  if (isLoginPath) {
    lastLoginDiagnosticLog = diagnosticEntry;
    logger.error(
      {
        err,
        stack: err?.stack,
        authMiddlewareResult,
        requestBody: sanitizedBody,
        path: req.originalUrl,
      },
      "CRITICAL: 500 Error during Admin Login process - Auth Middleware Diagnostic captured"
    );
  } else {
    logger.error({ err, stack: err?.stack, path: req.originalUrl }, "API Error caught");
  }

  if (!res.headersSent) {
    res.setHeader("Content-Type", "application/json");
    res.status(500).json({
      success: false,
      error: err?.message || "Internal server error",
      ...(isLoginPath ? { diagnostic: diagnosticEntry } : {}),
    });
  }
});

// Root health check endpoints for Cloud Run / load balancers
app.get(["/healthz", "/health", "/api/healthz", "/api/health"], (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/json");
  res.status(200).json({ status: "ok", uptime: process.uptime(), timestamp: Date.now() });
});

// Explicit JSON 404 handler for unmatched /api routes so HTML index is never returned for API requests
app.use("/api", (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/json");
  res.status(404).json({ ok: false, error: "API endpoint not found" });
});

// ── Serve SBG ARMY frontend (production only) ─────────────────────────────────
// In dev the Vite dev server handles the frontend on a separate port.
// In production (deployment) the API server is the only process, so it also
// serves the pre-built static assets from the sbg-army dist directory.
const possibleStaticDirs = [
  path.resolve(__dirname, "../../sbg-army/dist/public"),
  path.resolve(__dirname, "../../sbg-army/dist"),
  path.resolve(process.cwd(), "artifacts/sbg-army/dist/public"),
  path.resolve(process.cwd(), "artifacts/sbg-army/dist"),
  path.resolve(process.cwd(), "dist/public"),
  path.resolve(process.cwd(), "dist"),
];
const staticDir = possibleStaticDirs.find((d) => existsSync(path.join(d, "index.html"))) || possibleStaticDirs[0];

// SEO & GSC endpoints
app.get(/^\/google[a-zA-Z0-9_-]+\.html$/,  async (req, res, next) => {
  const settings = (await readCol('settings') || {}) as any;
  if (settings.gscHtmlFile && req.path.slice(1) === settings.gscHtmlFile) {
    res.send(`google-site-verification: ${settings.gscHtmlFile}`);
  } else {
    next();
  }
});
app.get('/robots.txt',  async (req, res, next) => {
  const settings = (await readCol('settings') || {}) as any;
  if (settings.robotsTxt) {
    res.type('text/plain');
    res.send(settings.robotsTxt);
  } else {
    next();
  }
});
app.get('/sitemap.xml',  async (req, res, next) => {
  const settings = (await readCol('settings') || {}) as any;
  if (settings.sitemapXml) {
    res.type('application/xml');
    res.send(settings.sitemapXml);
  } else {
    next();
  }
});

if (existsSync(staticDir)) {
  app.use(
    express.static(staticDir, {
      maxAge: "1d",
      setHeaders: (res, filePath) => {
        if (filePath.includes("/assets/") || filePath.match(/\.[0-9a-f]{8,}\.(js|css|woff2?|png|jpg|jpeg|svg|webp)$/i)) {
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        } else if (filePath.endsWith("index.html")) {
          res.setHeader("Cache-Control", "no-cache, must-revalidate");
        }
      },
    })
  );
  // SPA fallback — send index.html for any non-API route so React Router works
  app.use((_req: Request, res: Response) => {
    res.setHeader("Cache-Control", "no-cache, must-revalidate");
    res.sendFile(path.join(staticDir, "index.html"));
  });
  logger.info({ staticDir }, "Serving SBG ARMY frontend static files");
} else {
  // If static directory not yet created, render a clean fallback
  app.use((_req: Request, res: Response) => {
    res.send("<!DOCTYPE html><html><head><title>SBG Esports</title></head><body><div id='root'></div><script>console.log('App loading...');</script></body></html>");
  });
}

export default app;
