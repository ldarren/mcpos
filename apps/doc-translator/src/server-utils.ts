/**
 * Shared utilities for running MCP servers with various transports.
 */

import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import cors from "cors";
import type { Request, Response } from "express";
import express from "express";
import * as path from "path";

/**
 * Starts an MCP server using the appropriate transport based on command-line arguments.
 *
 * If `--stdio` is passed, uses stdio transport. Otherwise, uses Streamable HTTP transport.
 *
 * @param createServer - Factory function that creates a new McpServer instance.
 */
export async function startServer(
  createServer: () => McpServer,
): Promise<void> {
  try {
    if (process.argv.includes("--stdio")) {
      await startStdioServer(createServer);
    } else {
      await startStreamableHttpServer(createServer);
    }
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

/**
 * Starts an MCP server with stdio transport.
 *
 * @param createServer - Factory function that creates a new McpServer instance.
 */
export async function startStdioServer(
  createServer: () => McpServer,
): Promise<void> {
  await createServer().connect(new StdioServerTransport());
}

/**
 * Starts an MCP server with Streamable HTTP transport in stateless mode.
 *
 * Each request creates a fresh server and transport instance, which are
 * closed when the response ends (no session tracking).
 *
 * The server listens on the port specified by the PORT environment variable,
 * defaulting to 3001 if not set.
 *
 * @param createServer - Factory function that creates a new McpServer instance per request.
 */
export async function startStreamableHttpServer(
  createServer: () => McpServer,
): Promise<void> {
  const port = parseInt(process.env.PORT ?? "4001", 10);
  const DIST_DIR = path.resolve(process.cwd(), "dist");

  // Express app - bind to all interfaces for development/testing
  const expressApp = createMcpExpressApp({ host: "0.0.0.0" });
  expressApp.use(cors());

  // Serve static files from dist directories (for testing the HTML files)
  expressApp.use('/upload', express.static(path.join(DIST_DIR, 'upload')));
  expressApp.use('/history', express.static(path.join(DIST_DIR, 'history')));
  expressApp.use('/glossary', express.static(path.join(DIST_DIR, 'glossary')));

  // Simple status endpoint
  expressApp.get('/status', (req: Request, res: Response) => {
    res.json({
      status: 'running',
      server: 'Document Translation MCP Server',
      version: '1.0.0',
      tools: [
        'translate-document',
        'get-translation-history',
        'download-translation',
        'delete-translation',
        'get-glossary',
        'get-translation-memory',
        'add-glossary-entry',
        'delete-glossary-entry'
      ],
      pages: {
        upload: `http://localhost:${port}/upload/upload.html`,
        history: `http://localhost:${port}/history/history.html`,
        glossary: `http://localhost:${port}/glossary/glossary.html`
      }
    });
  });

  expressApp.all("/mcp", async (req: Request, res: Response) => {
    // Create fresh server and transport for each request (stateless mode)
    const server = createServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });

    // Clean up when response ends
    res.on("close", () => {
      transport.close().catch(() => {});
      server.close().catch(() => {});
    });

    try {
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      console.error("MCP error:", error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: { code: -32603, message: "Internal server error" },
          id: null,
        });
      }
    }
  });

  const { promise, resolve, reject } = Promise.withResolvers<void>();

  const httpServer = expressApp.listen(port, (err?: Error) => {
    if (err) return reject(err);
    console.log(`Server listening on http://localhost:${port}/mcp`);
    resolve();
  });

  const shutdown = () => {
    console.log("\nShutting down...");
    httpServer.close(() => process.exit(0));
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  return promise;
}