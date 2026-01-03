/**
 * @file Document Translation App - Multi-page routing based on build-time configuration
 * Supports both MCP App mode and Standalone mode
 */
import type { App } from "@modelcontextprotocol/ext-apps";
import { useApp } from "@modelcontextprotocol/ext-apps/react";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { StrictMode, useState, useEffect } from "react";
import { createRoot } from "react-dom/client";

import UploadDocumentPage from "./components/UploadDocumentPage";
import TranslationHistoryPage from "./components/TranslationHistoryPage";
import GlossaryPage from "./components/GlossaryPage";

const IMPLEMENTATION = { name: "Document Translation App", version: "1.0.0" };

const log = {
  info: console.log.bind(console, "[DOC-TRANSLATOR]"),
  warn: console.warn.bind(console, "[DOC-TRANSLATOR]"),
  error: console.error.bind(console, "[DOC-TRANSLATOR]"),
};

// Detect if we're running in MCP mode or standalone mode
function isMcpMode(): boolean {
  // Check if we're in an iframe and have a parent that looks like an MCP host
  try {
    return (
      window.parent !== window &&
      window.parent.postMessage !== undefined &&
      // Check if we're in a sandboxed iframe (typical for MCP apps)
      window.location !== window.parent.location
    );
  } catch (e) {
    // If we get a security error trying to access parent, we're likely in an iframe
    return true;
  }
}

// Mock MCP App for standalone mode
function createMockApp(): App {
  return {
    callServerTool: async ({ name, arguments: args }: { name: string; arguments: any }): Promise<CallToolResult> => {
      log.info(`[MOCK] Calling tool: ${name}`, args);

      // Simulate server responses for different tools
      switch (name) {
        case "translate-document":
          return {
            content: [{
              type: "text",
              text: `Mock: Translation job ${args.jobId || 'mock-job'} started successfully.`
            }]
          };

        case "get-translation-history":
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                count: 2,
                items: [
                  {
                    id: "mock-1",
                    fileName: "demo-document.pdf",
                    originalSize: "1.2 MB",
                    sourceLang: "en",
                    targetLang: "es",
                    status: "completed",
                    translatedAt: new Date().toISOString(),
                    wordCount: 500,
                    translationTime: "2.1 minutes"
                  }
                ]
              }, null, 2)
            }]
          };

        case "get-glossary":
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                count: 1,
                entries: [
                  {
                    id: "mock-glossary-1",
                    sourceTerm: "artificial intelligence",
                    targetTerm: "inteligencia artificial",
                    sourceLang: "en",
                    targetLang: "es",
                    category: "Technical",
                    confidence: 95,
                    usage_count: 15,
                    lastUsed: new Date().toISOString(),
                    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
                  }
                ]
              }, null, 2)
            }]
          };

        case "get-translation-memory":
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                count: 1,
                segments: [
                  {
                    id: "mock-tm-1",
                    sourceText: "Welcome to our translation service.",
                    targetText: "Bienvenido a nuestro servicio de traducción.",
                    sourceLang: "en",
                    targetLang: "es",
                    confidence: 98,
                    context: "Website welcome message",
                    lastUsed: new Date().toISOString(),
                    usageCount: 3
                  }
                ]
              }, null, 2)
            }]
          };

        default:
          return {
            content: [{
              type: "text",
              text: `Mock response for tool: ${name}`
            }]
          };
      }
    },

    sendMessage: async (message: any) => {
      log.info("[MOCK] Send message:", message);
      return { isError: false };
    },

    sendLog: async (logEntry: any) => {
      log.info("[MOCK] Send log:", logEntry);
    },

    openLink: async ({ url }: { url: string }) => {
      log.info("[MOCK] Open link:", url);
      window.open(url, '_blank');
      return { isError: false };
    },

    // Mock event handlers
    onteardown: null,
    ontoolinput: null,
    ontoolresult: null,
    onerror: null,
  } as unknown as App;
}

function DocumentTranslatorApp() {
  const [toolResult, setToolResult] = useState<CallToolResult | null>(null);
  const [mode, setMode] = useState<"mcp" | "standalone" | "detecting">("detecting");
  const [mockApp, setMockApp] = useState<App | null>(null);

  // MCP mode setup
  const { app: mcpApp, error: mcpError } = useApp({
    appInfo: IMPLEMENTATION,
    capabilities: {},
    onAppCreated: (app) => {
      log.info("MCP App connected successfully");
      setMode("mcp");

      app.onteardown = async () => {
        log.info("App is being torn down");
        return {};
      };

      app.ontoolinput = async (input) => {
        log.info("Received tool call input:", input);
      };

      app.ontoolresult = async (result) => {
        log.info("Received tool call result:", result);
        setToolResult(result);
      };

      app.onerror = log.error;
    },
  });

  // Detect mode on component mount
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!mcpApp && !mcpError) {
        // If we haven't connected to MCP after a reasonable timeout, assume standalone mode
        log.info("No MCP host detected, switching to standalone mode");
        setMode("standalone");
        setMockApp(createMockApp());
      }
    }, 2000); // Wait 2 seconds for MCP connection

    return () => clearTimeout(timeoutId);
  }, [mcpApp, mcpError]);

  // Update mode when MCP connection changes
  useEffect(() => {
    if (mcpError) {
      log.warn("MCP connection failed, switching to standalone mode:", mcpError.message);
      setMode("standalone");
      setMockApp(createMockApp());
    } else if (mcpApp && mode !== "mcp") {
      setMode("mcp");
    }
  }, [mcpApp, mcpError, mode]);

  // Render different states
  if (mode === "detecting") {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div>Initializing...</div>
        <div style={{ fontSize: '14px', color: '#666' }}>
          Detecting MCP host environment...
        </div>
      </div>
    );
  }

  if (mode === "standalone" && !mockApp) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh'
      }}>
        <div>Setting up standalone mode...</div>
      </div>
    );
  }

  if (mode === "mcp" && mcpError) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div><strong>MCP Connection Error:</strong></div>
        <div style={{ color: '#d32f2f' }}>{mcpError.message}</div>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '8px 16px',
            background: '#007acc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (mode === "mcp" && !mcpApp) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh'
      }}>
        <div>Connecting to MCP host...</div>
      </div>
    );
  }

  // Get the appropriate app instance
  const app = mode === "mcp" ? mcpApp! : mockApp!;

  return <DocumentTranslatorAppInner app={app} toolResult={toolResult} mode={mode} />;
}

interface DocumentTranslatorAppInnerProps {
  app: App;
  toolResult: CallToolResult | null;
  mode: "mcp" | "standalone";
}

function DocumentTranslatorAppInner({ app, toolResult, mode }: DocumentTranslatorAppInnerProps) {
  // Add mode indicator
  const modeIndicator = (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: mode === 'mcp' ? '#4caf50' : '#ff9800',
      color: 'white',
      padding: '4px 8px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: '500',
      zIndex: 1000
    }}>
      {mode === 'mcp' ? 'MCP Mode' : 'Standalone Mode'}
    </div>
  );

  // App header (only shown in standalone mode)
  const appHeader = mode === 'standalone' && (
    <div style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      padding: '16px 20px',
      textAlign: 'center',
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <h1 style={{
          margin: 0,
          fontSize: '24px',
          fontWeight: '600',
          letterSpacing: '-0.5px'
        }}>
          📄 Document Translation Suite
        </h1>
        <p style={{
          margin: '4px 0 0 0',
          fontSize: '14px',
          opacity: 0.9
        }}>
          Upload, translate, and manage your multilingual documents
        </p>
      </div>
    </div>
  );

  // Navigation tabs (only shown in standalone mode)
  const navigationTabs = mode === 'standalone' && (
    <div style={{
      background: 'white',
      borderBottom: '1px solid #eee',
      padding: '0 20px',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <div style={{
        display: 'flex',
        gap: '0',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <TabButton
          label="📄 Upload"
          isActive={__ACTIVE_ROUTE__ === 'upload'}
          href="/upload/upload.html"
          description="Upload documents for translation"
        />
        <TabButton
          label="📊 History"
          isActive={__ACTIVE_ROUTE__ === 'history'}
          href="/history/history.html"
          description="View translation history"
        />
        <TabButton
          label="📚 Glossary"
          isActive={__ACTIVE_ROUTE__ === 'glossary'}
          href="/glossary/glossary.html"
          description="Manage terminology & translation memory"
        />
      </div>
    </div>
  );

  // Route to the correct page based on build-time environment variable
  const renderPage = () => {
    switch (__ACTIVE_ROUTE__) {
      case "upload":
        return <UploadDocumentPage app={app} toolResult={toolResult} />;
      case "history":
        return <TranslationHistoryPage app={app} toolResult={toolResult} />;
      case "glossary":
        return <GlossaryPage app={app} toolResult={toolResult} />;
      default:
        return <div>Unknown route: {__ACTIVE_ROUTE__}</div>;
    }
  };

  return (
    <main>
      {modeIndicator}
      {appHeader}
      {navigationTabs}
      <div style={{ paddingTop: navigationTabs ? '0' : '0' }}>
        {renderPage()}
      </div>
    </main>
  );
}

// Tab button component
interface TabButtonProps {
  label: string;
  isActive: boolean;
  href: string;
  description: string;
}

function TabButton({ label, isActive, href, description }: TabButtonProps) {
  const [isNavigating, setIsNavigating] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isActive && !isNavigating) {
      setIsNavigating(true);
      // Add a small delay to show the loading state
      setTimeout(() => {
        window.location.href = href;
      }, 100);
    }
  };

  return (
    <a
      href={href}
      onClick={handleClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '16px 24px',
        textDecoration: 'none',
        color: isActive ? '#007acc' : isNavigating ? '#999' : '#666',
        background: isActive ? '#f0f8ff' : 'transparent',
        borderBottom: isActive ? '3px solid #007acc' : '3px solid transparent',
        fontWeight: isActive ? '600' : '500',
        fontSize: '14px',
        transition: 'all 0.2s ease',
        position: 'relative',
        cursor: isActive ? 'default' : isNavigating ? 'wait' : 'pointer',
        opacity: isNavigating ? 0.7 : 1,
      }}
      onMouseEnter={(e) => {
        if (!isActive && !isNavigating) {
          (e.target as HTMLElement).style.background = '#f8f9fa';
          (e.target as HTMLElement).style.color = '#333';
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive && !isNavigating) {
          (e.target as HTMLElement).style.background = 'transparent';
          (e.target as HTMLElement).style.color = '#666';
        }
      }}
      title={description}
    >
      {isNavigating ? (
        <span style={{ marginRight: '8px' }}>⏳</span>
      ) : null}
      {label}
    </a>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <DocumentTranslatorApp />
  </StrictMode>,
);