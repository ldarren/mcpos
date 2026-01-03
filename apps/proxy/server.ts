/**
 * MCPOS Sandbox Proxy Server
 *
 * A secure Express server that serves the sandbox.html proxy for MCP tool UIs.
 * This server runs on a separate origin from the main MCPOS host to provide
 * security isolation through the double-iframe sandbox architecture.
 *
 * Security Features:
 * - Serves on separate origin for iframe isolation
 * - Sets comprehensive Content Security Policy headers
 * - CORS configured for MCPOS host origins
 * - Static file serving with security headers
 */

import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Default port for the sandbox proxy (can be overridden by PORT env var)
const DEFAULT_PORT = 8081;
const port = parseInt(process.env.PORT ?? DEFAULT_PORT.toString(), 10);

// Create Express application
const app = express();

// CORS configuration - allow MCPOS host origins
// In production, you should restrict this to your specific host domains
const corsOptions = {
  origin: [
    "http://localhost:3000",
    "http://localhost:8080",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:8080",
    /^https?:\/\/.*\.mcpos\.local(:|\/|$)/,
    // Add your production domains here
  ],
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// Security headers middleware
app.use((_: express.Request, res: express.Response, next: express.NextFunction) => {
  // Comprehensive Content Security Policy for the sandbox proxy
  // This is more restrictive than the inner iframe's CSP
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'", // Allow inline scripts for sandbox.ts
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "frame-src 'none'", // Prevent nested iframes at proxy level
    "object-src 'none'",
    "base-uri 'self'",
    "frame-ancestors 'self' http://localhost:* http://127.0.0.1:* https://*.mcpos.local",
  ];

  res.setHeader("Content-Security-Policy", cspDirectives.join("; "));

  // Additional security headers
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=()");

  next();
});

// Serve static files from the dist directory (built by Vite)
const distPath = path.join(__dirname, "dist");
app.use(express.static(distPath));

// Serve sandbox.html as the default route
app.get("/", (_: express.Request, res: express.Response) => {
  res.sendFile(path.join(distPath, "sandbox.html"));
});

// Explicit route for sandbox.html
app.get("/sandbox.html", (_: express.Request, res: express.Response) => {
  res.sendFile(path.join(distPath, "sandbox.html"));
});

// Health check endpoint
app.get("/health", (_: express.Request, res: express.Response) => {
  res.json({
    status: "healthy",
    service: "mcpos-sandbox-proxy",
    timestamp: new Date().toISOString(),
    port,
  });
});

// 404 handler
app.use((req: express.Request, res: express.Response) => {
  res.status(404).json({
    error: "Not Found",
    message: `Path ${req.path} not found on MCPOS Sandbox Proxy`,
    service: "mcpos-sandbox-proxy",
  });
});

// Error handler
app.use((err: Error, _: express.Request, res: express.Response) => {
  console.error("MCPOS Sandbox Proxy Error:", err);
  res.status(500).json({
    error: "Internal Server Error",
    message: "An error occurred in the sandbox proxy",
    service: "mcpos-sandbox-proxy",
  });
});

// Graceful shutdown handling
const server = app.listen(port, "0.0.0.0", () => {
  console.log(`🔒 MCPOS Sandbox Proxy server listening on http://localhost:${port}`);
  console.log(`📄 Sandbox HTML available at: http://localhost:${port}/sandbox.html`);
  console.log(`💚 Health check available at: http://localhost:${port}/health`);
  console.log("");
  console.log("🛡️  Security Features:");
  console.log("   - Content Security Policy enforced");
  console.log("   - CORS configured for MCPOS hosts");
  console.log("   - Frame isolation for untrusted content");
  console.log("   - Comprehensive security headers");
});

// Graceful shutdown
const shutdown = (signal: string) => {
  console.log(`\n🔄 Received ${signal}, shutting down MCPOS Sandbox Proxy gracefully...`);
  server.close(() => {
    console.log("✅ MCPOS Sandbox Proxy server closed");
    process.exit(0);
  });

  // Force shutdown after 5 seconds
  setTimeout(() => {
    console.error("❌ Forced shutdown of MCPOS Sandbox Proxy");
    process.exit(1);
  }, 5000);
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception in MCPOS Sandbox Proxy:", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection in MCPOS Sandbox Proxy:", reason);
  process.exit(1);
});

export default app;