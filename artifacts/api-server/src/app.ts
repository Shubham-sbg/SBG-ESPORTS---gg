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

// Health check endpoints for Cloud Run / load balancers
app.get(["/healthz", "/health", "/api/healthz", "/api/health"], (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/json");
  res.status(200).json({ status: "ok", service: "sbg-esports-api", uptime: process.uptime(), timestamp: Date.now() });
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

if (existsSync(path.join(staticDir, "index.html"))) {
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
  // Standalone API Gateway mode (e.g. Render backend service deployment)
  app.get("/", (req: Request, res: Response) => {
    if (req.accepts("html", "json") === "json" || req.query.format === "json") {
      res.setHeader("Content-Type", "application/json");
      return res.status(200).json({
        status: "ok",
        service: "sbg-esports-api",
        message: "SBG Esports Backend API Service is active and operational",
        uptime: process.uptime(),
        timestamp: Date.now(),
        endpoints: {
          health: "/healthz",
          settings: "/api/db/settings",
          posts: "/api/db/posts",
          tournaments: "/api/db/tournaments",
          players: "/api/db/players",
          auth: "/api/auth/login",
          playerAuth: "/api/player-auth/login",
          media: "/api/media/list",
        },
      });
    }

    const uptimeSec = Math.floor(process.uptime());
    const hours = Math.floor(uptimeSec / 3600);
    const minutes = Math.floor((uptimeSec % 3600) / 60);
    const seconds = uptimeSec % 60;
    const uptimeStr = `${hours}h ${minutes}m ${seconds}s`;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SBG Esports — Backend API Gateway</title>
  <style>
    :root {
      --bg: #07070a;
      --card-bg: #0f0f16;
      --gold: #d4af37;
      --gold-dim: rgba(212, 175, 55, 0.15);
      --gold-border: rgba(212, 175, 55, 0.3);
      --text: #e2e8f0;
      --text-muted: #94a3b8;
      --green: #10b981;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body {
      background-color: var(--bg);
      color: var(--text);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .container {
      max-width: 680px;
      width: 100%;
      background: var(--card-bg);
      border: 1px solid var(--gold-border);
      border-radius: 16px;
      padding: 32px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.6);
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.3);
      color: var(--green);
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 16px;
    }
    .indicator {
      width: 8px;
      height: 8px;
      background: var(--green);
      border-radius: 50%;
      box-shadow: 0 0 10px var(--green);
    }
    h1 {
      font-size: 26px;
      font-weight: 800;
      color: #fff;
      letter-spacing: -0.02em;
      margin-bottom: 8px;
    }
    h1 span { color: var(--gold); }
    p.sub {
      color: var(--text-muted);
      font-size: 14px;
      line-height: 1.5;
      margin-bottom: 24px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 12px;
      margin-bottom: 24px;
    }
    .stat-box {
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 10px;
      padding: 12px 14px;
    }
    .stat-label {
      font-size: 11px;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .stat-value {
      font-size: 15px;
      font-weight: 700;
      color: #fff;
      margin-top: 4px;
    }
    .endpoints {
      background: #09090e;
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 10px;
      padding: 16px;
      margin-bottom: 24px;
    }
    .endpoints-title {
      font-size: 12px;
      font-weight: 700;
      color: var(--gold);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 12px;
    }
    .endpoint-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 0;
      border-bottom: 1px solid rgba(255,255,255,0.04);
      font-size: 13px;
    }
    .endpoint-item:last-child { border-bottom: none; }
    .method {
      background: var(--gold-dim);
      color: var(--gold);
      font-size: 11px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
      margin-right: 8px;
    }
    .endpoint-link {
      color: var(--text);
      text-decoration: none;
      font-family: monospace;
    }
    .endpoint-link:hover { color: var(--gold); }
    .footer-note {
      font-size: 12px;
      color: var(--text-muted);
      text-align: center;
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="badge">
      <span class="indicator"></span>
      Service Operational
    </div>
    <h1>SBG ESPORTS <span>API GATEWAY</span></h1>
    <p class="sub">Production Backend API Server powering SBG ARMY Esports data, real-time WebSocket sync, and admin management.</p>
    
    <div class="grid">
      <div class="stat-box">
        <div class="stat-label">Service</div>
        <div class="stat-value">REST & WS API</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Server Uptime</div>
        <div class="stat-value">${uptimeStr}</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Health Check</div>
        <div class="stat-value" style="color: var(--green);">200 OK</div>
      </div>
    </div>

    <div class="endpoints">
      <div class="endpoints-title">Quick Endpoints</div>
      <div class="endpoint-item">
        <div><span class="method">GET</span><a class="endpoint-link" href="/healthz">/healthz</a></div>
        <span style="color: var(--text-muted); font-size: 11px;">Health Monitor</span>
      </div>
      <div class="endpoint-item">
        <div><span class="method">GET</span><a class="endpoint-link" href="/api/db/settings">/api/db/settings</a></div>
        <span style="color: var(--text-muted); font-size: 11px;">Site Settings</span>
      </div>
      <div class="endpoint-item">
        <div><span class="method">GET</span><a class="endpoint-link" href="/api/db/tournaments">/api/db/tournaments</a></div>
        <span style="color: var(--text-muted); font-size: 11px;">Tournaments</span>
      </div>
      <div class="endpoint-item">
        <div><span class="method">GET</span><a class="endpoint-link" href="/api/db/players">/api/db/players</a></div>
        <span style="color: var(--text-muted); font-size: 11px;">Roster</span>
      </div>
    </div>

    <p class="footer-note">
      This service is the live backend API for SBG Esports. Web traffic from your frontend application connects automatically via <code>${req.protocol}://${req.get('host')}/api</code>.
    </p>
  </div>
</body>
</html>`);
  });

  // Catch-all for any unmatched non-API routes when staticDir is not present
  app.use((req: Request, res: Response) => {
    if (req.path.startsWith("/api")) {
      res.setHeader("Content-Type", "application/json");
      return res.status(404).json({ ok: false, error: "API endpoint not found" });
    }
    res.redirect("/");
  });
}

// Ensure the Express server explicitly listens on process.env.PORT and binds to '0.0.0.0'
// when app.ts is executed directly (e.g., on Render).
import { fileURLToPath } from 'node:url';
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const isProd = process.env.NODE_ENV === "production" || process.env.RENDER;
  const port = isProd ? Number(process.env.PORT || 3000) : Number(process.env.API_PORT || 8081);
  app.listen(port, "0.0.0.0", () => {
    logger.info({ port, host: "0.0.0.0" }, "Express server explicitly listening on 0.0.0.0 (app.ts fallback)");
  });
}

export default app;
