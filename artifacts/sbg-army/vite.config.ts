import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

const isReplit = process.env.REPL_ID !== undefined;
const port = 3000;
const basePath = process.env.BASE_PATH || "/";

export default defineConfig(async () => {
  let replitPlugins: any[] = [];
  if (isReplit) {
    try {
      replitPlugins = [
        await import("@replit/vite-plugin-runtime-error-modal").then((m) =>
          m.default()
        ),
        ...(process.env.NODE_ENV !== "production"
          ? [
              await import("@replit/vite-plugin-cartographer").then((m) =>
                m.cartographer({
                  root: path.resolve(import.meta.dirname, ".."),
                })
              ),
              await import("@replit/vite-plugin-dev-banner").then((m) =>
                m.devBanner()
              ),
            ]
          : []),
      ];
    } catch {
      replitPlugins = [];
    }
  }

  return {
    base: basePath,
    plugins: [react(), tailwindcss(), ...replitPlugins],
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "src"),
        "@assets": path.resolve(
          import.meta.dirname,
          "..",
          "..",
          "attached_assets"
        ),
      },
      dedupe: ["react", "react-dom"],
    },
    root: path.resolve(import.meta.dirname),
    build: {
      outDir: path.resolve(import.meta.dirname, "dist/public"),
      emptyOutDir: true,
      cssCodeSplit: true,
      chunkSizeWarningLimit: 1200,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('three')) {
                return 'vendor-three';
              }
              if (id.includes('framer-motion')) {
                return 'vendor-framer-motion';
              }
              if (id.includes('recharts') || id.includes('d3-')) {
                return 'vendor-charts';
              }
              if (id.includes('lucide-react') || id.includes('react-icons')) {
                return 'vendor-icons';
              }
              if (id.includes('@radix-ui')) {
                return 'vendor-radix';
              }
              if (id.includes('react') || id.includes('wouter') || id.includes('@tanstack')) {
                return 'vendor-core';
              }
            }
          },
        },
      },
    },
    server: {
      port,
      host: "0.0.0.0",
      allowedHosts: true,
      proxy: {
        "/api": {
          target: "http://localhost:8081",
          changeOrigin: true,
          timeout: 30000,
          configure: (proxy, _options) => {
            proxy.on("error", (err, _req, res) => {
              if (res && !res.headersSent && "writeHead" in res) {
                res.writeHead(502, { "Content-Type": "application/json" });
                res.end(
                  JSON.stringify({
                    success: false,
                    error: "Proxy connection error",
                    code: "PROXY_ERROR",
                  })
                );
              }
            });
          },
        },
        "/ws": {
          target: "ws://localhost:8081",
          ws: true,
          changeOrigin: true,
          configure: (proxy, _options) => {
            proxy.on("error", (_err) => {
              // Silently handle proxy websocket disconnects
            });
          },
        },
      },
      fs: {
        strict: true,
        deny: ["**/.*"],
      },
    },
    preview: {
      port,
      host: "0.0.0.0",
      allowedHosts: true,
    },
  };
});
