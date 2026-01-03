# MCP Apps Message Flow Documentation

## Overview

This document explains the complete message flow in the MCP (Model Context Protocol) Apps system, specifically for the basic-react implementation. The system consists of three main components:

1. **React App (Sandbox)** - UI running in an iframe sandbox
2. **MCP Host (mcpos)** - Mediates communication between app and server
3. **MCP Server** - Provides tools and resources

## Architecture Components

### 1. MCP Server (`server.ts`)

The server is responsible for:
- Registering tools that can be called by the React app
- Registering resources (the bundled HTML/JS for the React app)
- Handling tool execution and returning results

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerAppTool, registerAppResource, RESOURCE_MIME_TYPE, RESOURCE_URI_META_KEY } from "@modelcontextprotocol/ext-apps/server";

function createServer(): McpServer {
  const server = new McpServer({
    name: "Basic MCP App Server (React)",
    version: "1.0.0",
  });

  const resourceUri = "ui://get-time/mcp-app.html";

  // Register a tool with UI metadata
  registerAppTool(server,
    "get-time",
    {
      title: "Get Time",
      description: "Returns the current server time as an ISO 8601 string.",
      inputSchema: {},
      _meta: { [RESOURCE_URI_META_KEY]: resourceUri }, // Links to UI resource
    },
    async (): Promise<CallToolResult> => {
      const time = new Date().toISOString();
      return { content: [{ type: "text", text: time }] };
    },
  );

  // Register the resource that serves the React app
  registerAppResource(server,
    resourceUri,
    resourceUri,
    { mimeType: RESOURCE_MIME_TYPE, _meta: { ui: {} }, },
    async (): Promise<ReadResourceResult> => {
      const html = await fs.readFile(path.join(DIST_DIR, "mcp-app.html"), "utf-8");
      return {
        contents: [
          { uri: resourceUri, mimeType: RESOURCE_MIME_TYPE, text: html },
        ],
      };
    },
  );

  return server;
}
```

### 2. React App (`src/mcp-app.tsx`)

The React app runs in a sandboxed iframe and communicates with the MCP host through the `@modelcontextprotocol/ext-apps/react` SDK.

```typescript
import { useApp } from "@modelcontextprotocol/ext-apps/react";
import type { App } from "@modelcontextprotocol/ext-apps";

function GetTimeApp() {
  const [toolResult, setToolResult] = useState<CallToolResult | null>(null);

  const { app, error } = useApp({
    appInfo: { name: "Get Time App", version: "1.0.0" },
    capabilities: {},
    onAppCreated: (app) => {
      // Set up event handlers
      app.ontoolresult = async (result) => {
        log.info("Received tool call result:", result);
        setToolResult(result);
      };

      app.ontoolinput = async (input) => {
        log.info("Received tool call input:", input);
      };

      app.onerror = log.error;
    },
  });

  if (error) return <div><strong>ERROR:</strong> {error.message}</div>;
  if (!app) return <div>Connecting...</div>;

  return <GetTimeAppInner app={app} toolResult={toolResult} />;
}
```

## Complete Message Flow

### Phase 1: Initialization

```
1. MCP Host loads tool definitions from server
2. Host discovers "get-time" tool with resource URI
3. Host loads resource URI → gets bundled React app HTML
4. Host creates iframe sandbox and loads React app
5. React app connects to host via postMessage API
6. useApp() hook establishes bidirectional communication
```

**Code Example - Server Registration:**
```typescript
// server.ts - Tool registration links tool to UI resource
registerAppTool(server, "get-time", {
  title: "Get Time",
  description: "Returns the current server time as an ISO 8601 string.",
  inputSchema: {},
  _meta: { [RESOURCE_URI_META_KEY]: resourceUri }, // Key connection point
});
```

### Phase 2: User Interaction → Tool Call

```
User clicks "Get Server Time" button
    ↓
React handleGetTime() function called
    ↓
app.callServerTool({ name: "get-time", arguments: {} })
    ↓
Message sent to MCP Host via postMessage
    ↓
Host forwards tool call to MCP Server
    ↓
Server executes registered tool handler
```

**Code Example - Tool Call:**
```typescript
// src/mcp-app.tsx - User interaction triggers tool call
const handleGetTime = useCallback(async () => {
  try {
    log.info("Calling get-time tool...");
    const result = await app.callServerTool({
      name: "get-time",
      arguments: {}
    });
    log.info("get-time result:", result);
    setServerTime(extractTime(result));
  } catch (e) {
    log.error(e);
    setServerTime("[ERROR]");
  }
}, [app]);
```

### Phase 3: Tool Execution on Server

```
MCP Server receives tool call
    ↓
Looks up "get-time" tool handler
    ↓
Executes: async (): Promise<CallToolResult> => {
  const time = new Date().toISOString();
  return { content: [{ type: "text", text: time }] };
}
    ↓
Returns CallToolResult with current timestamp
```

**Code Example - Tool Handler:**
```typescript
// server.ts - The actual tool implementation
registerAppTool(server, "get-time",
  { /* metadata */ },
  async (): Promise<CallToolResult> => {
    const time = new Date().toISOString();
    return { content: [{ type: "text", text: time }] };
  }
);
```

### Phase 4: Result Propagation Back to UI

```
Server returns result to MCP Host
    ↓
Host forwards result back to React app iframe
    ↓
React app receives result via postMessage
    ↓
useApp() hook triggers event handlers
    ↓
ontoolresult callback fires (if using event approach)
    ↓
OR awaited promise resolves (if using direct approach)
    ↓
UI state updates with new server time
    ↓
DOM re-renders with updated timestamp
```

**Code Example - Result Handling:**
```typescript
// Two approaches for handling results:

// Approach 1: Event-driven (via ontoolresult)
app.ontoolresult = async (result) => {
  log.info("Received tool call result:", result);
  setToolResult(result);
};

// Approach 2: Direct await (current implementation)
const result = await app.callServerTool({ name: "get-time", arguments: {} });
setServerTime(extractTime(result));
```

## Message Flow Diagram

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React App     │    │    MCP Host     │    │   MCP Server    │
│   (Sandbox)     │    │    (mcpos)      │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │ 1. User clicks button │                       │
         │                       │                       │
         │ 2. app.callServerTool │                       │
         │─────────────────────→ │                       │
         │                       │ 3. Forward tool call  │
         │                       │─────────────────────→ │
         │                       │                       │ 4. Execute tool
         │                       │                       │    handler
         │                       │ 5. Return result      │
         │                       │ ←─────────────────────│
         │ 6. Forward result     │                       │
         │ ←─────────────────────│                       │
         │ 7. Update UI state    │                       │
         │                       │                       │
```

## Key Communication Mechanisms

### 1. Tool-Resource Linking

The connection between tools and UI is established through metadata:

```typescript
// Server links tool to resource via _meta
_meta: { [RESOURCE_URI_META_KEY]: resourceUri }

// This tells the host: "When this tool is called, load this resource as UI"
```

### 2. PostMessage Communication

The React app communicates with the host using the browser's `postMessage` API, abstracted by the MCP SDK:

```typescript
// Abstracted by useApp() hook - handles postMessage internally
const { app } = useApp({
  // Configuration
});
```

### 3. Event Handlers

Multiple event handlers can be set up for different stages:

```typescript
app.ontoolresult = async (result) => { /* Handle results */ };
app.ontoolinput = async (input) => { /* Handle inputs */ };
app.onteardown = async () => { /* Cleanup */ };
app.onerror = (error) => { /* Error handling */ };
```

## Implementation Guide for Developers

### Step 1: Create MCP Server with Tools

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerAppTool, registerAppResource } from "@modelcontextprotocol/ext-apps/server";

function createServer(): McpServer {
  const server = new McpServer({
    name: "Your App Server",
    version: "1.0.0",
  });

  const resourceUri = "ui://your-tool/app.html";

  // Register your tool
  registerAppTool(server,
    "your-tool-name",
    {
      title: "Your Tool",
      description: "Description of what your tool does",
      inputSchema: {
        type: "object",
        properties: {
          // Define input parameters here
        }
      },
      _meta: { [RESOURCE_URI_META_KEY]: resourceUri },
    },
    async (args): Promise<CallToolResult> => {
      // Your tool implementation here
      return { content: [{ type: "text", text: "result" }] };
    }
  );

  // Register the UI resource
  registerAppResource(server,
    resourceUri,
    resourceUri,
    { mimeType: RESOURCE_MIME_TYPE, _meta: { ui: {} } },
    async (): Promise<ReadResourceResult> => {
      const html = await fs.readFile("path/to/your/built/app.html", "utf-8");
      return {
        contents: [
          { uri: resourceUri, mimeType: RESOURCE_MIME_TYPE, text: html }
        ],
      };
    }
  );

  return server;
}
```

### Step 2: Create React App with MCP Integration

```typescript
import { useApp } from "@modelcontextprotocol/ext-apps/react";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

function YourApp() {
  const [result, setResult] = useState<CallToolResult | null>(null);

  const { app, error } = useApp({
    appInfo: { name: "Your App", version: "1.0.0" },
    capabilities: {},
    onAppCreated: (app) => {
      app.ontoolresult = async (result) => {
        setResult(result);
      };
      app.onerror = console.error;
    },
  });

  const handleCallTool = useCallback(async () => {
    try {
      const result = await app.callServerTool({
        name: "your-tool-name",
        arguments: { /* your arguments */ }
      });
      // Process result
    } catch (error) {
      console.error("Tool call failed:", error);
    }
  }, [app]);

  if (error) return <div>Error: {error.message}</div>;
  if (!app) return <div>Connecting...</div>;

  return (
    <div>
      <button onClick={handleCallTool}>Call Tool</button>
      {result && <div>{/* Display result */}</div>}
    </div>
  );
}
```

### Step 3: Build and Bundle

```json
{
  "scripts": {
    "build": "tsc --noEmit && vite build",
    "serve": "tsx server.ts"
  }
}
```

The build process creates a single HTML file containing your React app, which gets served as a resource.

## Common Patterns

### 1. Error Handling

Always implement comprehensive error handling:

```typescript
// In React app
app.onerror = (error) => {
  console.error("App error:", error);
  // Update UI to show error state
};

// In tool calls
try {
  const result = await app.callServerTool(params);
} catch (error) {
  // Handle specific tool call errors
}
```

### 2. Loading States

Provide feedback during async operations:

```typescript
const [loading, setLoading] = useState(false);

const handleCall = async () => {
  setLoading(true);
  try {
    const result = await app.callServerTool(params);
    // Process result
  } finally {
    setLoading(false);
  }
};
```

### 3. Input Validation

Validate inputs before sending to server:

```typescript
const handleCall = async () => {
  if (!validateInput(userInput)) {
    setError("Invalid input");
    return;
  }

  const result = await app.callServerTool({
    name: "tool-name",
    arguments: { input: userInput }
  });
};
```

## Security Considerations

1. **Sandbox Isolation**: React app runs in iframe sandbox with limited permissions
2. **Input Validation**: Always validate inputs on both client and server side
3. **Error Messages**: Don't expose sensitive information in error messages
4. **Resource Access**: Server controls what resources the app can access

## Debugging Tips

### 1. Enable Logging

```typescript
const log = {
  info: console.log.bind(console, "[APP]"),
  warn: console.warn.bind(console, "[APP]"),
  error: console.error.bind(console, "[APP]"),
};
```

### 2. Inspect Message Flow

Use browser DevTools to monitor postMessage communication:

```typescript
// Add to React app for debugging
useEffect(() => {
  const handler = (event) => {
    console.log("Message received:", event.data);
  };
  window.addEventListener("message", handler);
  return () => window.removeEventListener("message", handler);
}, []);
```

### 3. Server-Side Logging

Add logging to your server tool handlers:

```typescript
registerAppTool(server, "tool-name", {}, async (args) => {
  console.log("Tool called with args:", args);
  const result = { /* ... */ };
  console.log("Tool returning result:", result);
  return result;
});
```

This documentation provides a complete understanding of the MCP Apps message flow and serves as a comprehensive guide for implementing similar systems.