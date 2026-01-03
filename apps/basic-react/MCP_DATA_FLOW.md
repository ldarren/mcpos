# MCP Apps Data Flow: From Iframe to Server and Back

This document explains the complete data flow when a React MCP app calls `app.callServerTool()`, tracing the message journey from the sandboxed iframe to the MCP server and back.

## Architecture Overview

The MCP Apps system consists of three main components:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React App     │    │    MCP Host     │    │   MCP Server    │
│   (Iframe)      │    │   (mcpos)       │    │  (server.ts)    │
│                 │    │                 │    │                 │
│  app.tsx        │◄──►│  Communication  │◄──►│  Tool Handler   │
│  + MCP SDK      │    │  Bridge         │    │  + Resources    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Complete Data Flow Breakdown

### Phase 1: User Interaction in React App

**File: `apps/basic-react/src/mcp-app.tsx` (line 75-85)**

```typescript
const handleGetTime = useCallback(async () => {
  try {
    log.info("Calling get-time tool...");
    const result = await app.callServerTool({ name: "get-time", arguments: {} });
    log.info("get-time result:", result);
    setServerTime(extractTime(result));
  } catch (e) {
    log.error(e);
    setServerTime("[ERROR]");
  }
}, [app]);
```

**What happens:**
1. User clicks "Get Server Time" button
2. React calls `handleGetTime()`
3. Function calls `app.callServerTool({ name: "get-time", arguments: {} })`
4. This is where the MCP communication begins

### Phase 2: MCP SDK Serializes and Sends Message

**File: React App (using `@modelcontextprotocol/ext-apps/react`)**

**Step 2.1: Message Serialization**
```javascript
// The MCP SDK internally creates a JSON-RPC message:
{
  "jsonrpc": "2.0",
  "id": "request-123",
  "method": "tools/call",
  "params": {
    "name": "get-time",
    "arguments": {}
  }
}
```

**Step 2.2: PostMessage to Host**
```javascript
// The React app (running in iframe) sends message to parent
parent.postMessage({
  type: 'mcp-tool-call',
  payload: jsonRpcMessage
}, '*');
```

### Phase 3: Host Receives and Forwards Message

**File: MCP Host (mcpos) - not visible in this codebase but running as the parent**

**Step 3.1: Message Reception**
```javascript
// Host receives postMessage from iframe
window.addEventListener('message', (event) => {
  if (event.data.type === 'mcp-tool-call') {
    forwardToMcpServer(event.data.payload);
  }
});
```

**Step 3.2: Transport Selection**
The host determines how to communicate with the MCP server:
- **HTTP Transport**: Makes HTTP request to server endpoint
- **Stdio Transport**: Sends via standard input/output

### Phase 4: Server Transport Layer Receives Request

**File: `apps/basic-react/src/server-utils.ts`**

**For HTTP Transport (line 65-91):**
```typescript
expressApp.all("/mcp", async (req: Request, res: Response) => {
  // Create fresh server and transport for each request (stateless mode)
  const server = createServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });

  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    // Error handling...
  }
});
```

**For Stdio Transport (line 39-43):**
```typescript
export async function startStdioServer(
  createServer: () => McpServer,
): Promise<void> {
  await createServer().connect(new StdioServerTransport());
}
```

**What happens:**
1. Transport layer receives the JSON-RPC message
2. Creates a fresh server instance (for HTTP) or uses existing (for stdio)
3. Forwards the message to the MCP server core

### Phase 5: MCP Server Processes Tool Call

**File: `apps/basic-react/server.ts` (line 25-37)**

**Step 5.1: Tool Registration (Server Startup)**
```typescript
registerAppTool(server,
  "get-time",
  {
    title: "Get Time",
    description: "Returns the current server time as an ISO 8601 string.",
    inputSchema: {},
    _meta: { [RESOURCE_URI_META_KEY]: resourceUri },
  },
  async (): Promise<CallToolResult> => {
    const time = new Date().toISOString();
    return { content: [{ type: "text", text: time }] };
  },
);
```

**Step 5.2: Tool Execution**
```javascript
// Server receives JSON-RPC call for "get-time"
{
  "jsonrpc": "2.0",
  "id": "request-123",
  "method": "tools/call",
  "params": {
    "name": "get-time",
    "arguments": {}
  }
}

// Server looks up tool handler and executes it
const toolHandler = registeredTools["get-time"];
const result = await toolHandler(); // Returns: { content: [{ type: "text", text: "2024-01-01T12:00:00.000Z" }] }
```

**Step 5.3: Response Generation**
```javascript
// Server creates JSON-RPC response
{
  "jsonrpc": "2.0",
  "id": "request-123",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "2024-01-01T12:00:00.000Z"
      }
    ]
  }
}
```

### Phase 6: Response Journey Back to React App

**Step 6.1: Transport Layer Returns Response**
- **HTTP**: Sends JSON response back to host's HTTP request
- **Stdio**: Writes JSON to stdout for host to read

**Step 6.2: Host Forwards Response to Iframe**
```javascript
// Host receives response from server and forwards to iframe
iframe.contentWindow.postMessage({
  type: 'mcp-tool-response',
  payload: jsonRpcResponse
}, '*');
```

**Step 6.3: MCP SDK Receives and Deserializes**
```javascript
// React app's MCP SDK receives the message
window.addEventListener('message', (event) => {
  if (event.data.type === 'mcp-tool-response') {
    const response = event.data.payload;
    // Resolves the original callServerTool() promise
    resolvePromise(response.result);
  }
});
```

### Phase 7: React App Updates UI

**File: `apps/basic-react/src/mcp-app.tsx` (line 78-80)**

```typescript
// The awaited promise resolves with the server response
const result = await app.callServerTool({ name: "get-time", arguments: {} });
log.info("get-time result:", result);
setServerTime(extractTime(result)); // Updates React state
```

**Step 7.1: Data Extraction**
```typescript
function extractTime(callToolResult: CallToolResult): string {
  const { text } = callToolResult.content?.find((c) => c.type === "text")!;
  return text; // Returns: "2024-01-01T12:00:00.000Z"
}
```

**Step 7.2: UI Update**
```typescript
// React re-renders with new state
<strong>Server Time:</strong> <code id="server-time">{serverTime}</code>
// Displays: Server Time: 2024-01-01T12:00:00.000Z
```

## Message Flow Diagram

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React App     │    │    MCP Host     │    │   MCP Server    │
│   (Iframe)      │    │    (mcpos)      │    │  (server.ts)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │ 1. User clicks button │                       │
         │                       │                       │
         │ 2. app.callServerTool │                       │
         │ { name: "get-time",   │                       │
         │   arguments: {} }     │                       │
         │                       │                       │
         │ 3. postMessage()      │                       │
         │ JSON-RPC request      │                       │
         │─────────────────────→ │                       │
         │                       │                       │
         │                       │ 4. Forward request    │
         │                       │ (HTTP/Stdio)          │
         │                       │─────────────────────→ │
         │                       │                       │
         │                       │                       │ 5. Look up tool
         │                       │                       │    "get-time"
         │                       │                       │
         │                       │                       │ 6. Execute handler
         │                       │                       │    new Date().toISOString()
         │                       │                       │
         │                       │ 7. Return result      │
         │                       │ JSON-RPC response     │
         │                       │ ←─────────────────────│
         │                       │                       │
         │ 8. postMessage()      │                       │
         │ Tool result           │                       │
         │ ←─────────────────────│                       │
         │                       │                       │
         │ 9. Promise resolves   │                       │
         │    Update React state │                       │
         │                       │                       │
         │10. UI re-renders      │                       │
         │   Display new time    │                       │
         │                       │                       │
```

## Transport Methods Explained

### 1. HTTP Transport (Default)

**Configuration:**
```typescript
// server-utils.ts - starts HTTP server on port 3001
const port = parseInt(process.env.PORT ?? "3001", 10);
expressApp.all("/mcp", async (req, res) => { ... });
```

**Message Flow:**
```
React App → postMessage → Host → HTTP POST /mcp → Server
Server → HTTP Response → Host → postMessage → React App
```

**Benefits:**
- Stateless (each request creates fresh server)
- Easy to debug with HTTP tools
- Works across network boundaries
- CORS support for browser testing

### 2. Stdio Transport

**Configuration:**
```bash
# Start server with stdio transport
npm run serve -- --stdio
```

**Message Flow:**
```
React App → postMessage → Host → stdin → Server
Server → stdout → Host → postMessage → React App
```

**Benefits:**
- Lower latency (no HTTP overhead)
- Persistent connection
- Standard MCP transport method
- Suitable for direct process communication

## Error Handling

### React App Error Handling

```typescript
try {
  const result = await app.callServerTool({ name: "get-time", arguments: {} });
  setServerTime(extractTime(result));
} catch (e) {
  log.error(e);
  setServerTime("[ERROR]"); // Fallback display
}
```

### Server Error Handling

```typescript
// server-utils.ts
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
```

### Common Error Scenarios

1. **Tool Not Found**: Server returns `method_not_found` error
2. **Invalid Arguments**: Server validates input schema
3. **Network Issues**: HTTP transport timeout or connection failure
4. **Iframe Security**: PostMessage blocked by CORS or CSP
5. **Server Crash**: Transport layer catches and returns error response

## Event Handlers and Callbacks

### React App Event Handlers

```typescript
const { app } = useApp({
  appInfo: IMPLEMENTATION,
  capabilities: {},
  onAppCreated: (app) => {
    // Called when app connects to host
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
```

**Event Types:**
- **`ontoolresult`**: Fired when tool execution completes
- **`ontoolinput`**: Fired when tool receives input (for debugging)
- **`onerror`**: Fired when communication errors occur
- **`onteardown`**: Fired when app is being closed

## Security Considerations

### Iframe Sandbox

The React app runs in a sandboxed iframe with limited permissions:

```html
<iframe
  src="mcp-app.html"
  sandbox="allow-scripts allow-same-origin"
  referrerpolicy="no-referrer">
</iframe>
```

### Message Validation

All messages are validated at multiple layers:
1. **MCP SDK**: Validates JSON-RPC format
2. **Transport**: Validates HTTP/stdio protocol
3. **Server**: Validates tool names and arguments

### Resource Access

The server controls what the React app can access:

```typescript
// Only registered tools are accessible
registerAppTool(server, "get-time", ...);  // ✅ Accessible
// unregistered tools return "method_not_found" // ❌ Blocked
```

## Performance Considerations

### Stateless HTTP Mode

Each HTTP request creates a fresh server instance:

```typescript
// New server per request - ensures isolation but adds overhead
const server = createServer();
const transport = new StreamableHTTPServerTransport();
```

**Trade-offs:**
- ✅ **Isolation**: Each request is independent
- ✅ **Memory**: No long-lived connections
- ❌ **Performance**: Server creation overhead per request
- ❌ **State**: Cannot maintain session data

### Message Size

Large tool responses may impact performance:
- **JSON serialization** time for large objects
- **PostMessage** overhead for large payloads
- **Network** transfer time for HTTP transport

## Testing and Debugging

### Console Logging

The React app includes comprehensive logging:

```typescript
const log = {
  info: console.log.bind(console, "[APP]"),
  warn: console.warn.bind(console, "[APP]"),
  error: console.error.bind(console, "[APP]"),
};
```

**Example Output:**
```
[APP] Calling get-time tool...
[APP] get-time result: {content: [{type: "text", text: "2024-01-01T12:00:00.000Z"}]}
```

### Server Logging

```bash
# HTTP transport logs
Server listening on http://localhost:3001/mcp

# Tool execution logs (add to your tool handlers)
console.log("Executing get-time tool");
```

### Browser DevTools

1. **Network Tab**: View HTTP requests to `/mcp`
2. **Console Tab**: See React app logs with `[APP]` prefix
3. **Application Tab**: Inspect iframe structure and postMessage events

### Testing Tool Calls

```javascript
// Test tool call directly in browser console
// (when iframe has focus)
app.callServerTool({ name: "get-time", arguments: {} })
  .then(result => console.log("Tool result:", result))
  .catch(error => console.error("Tool error:", error));
```

## Advanced Use Cases

### Multiple Tool Calls

```typescript
const handleMultipleTools = async () => {
  const [time, weather, news] = await Promise.all([
    app.callServerTool({ name: "get-time", arguments: {} }),
    app.callServerTool({ name: "get-weather", arguments: { city: "SF" } }),
    app.callServerTool({ name: "get-news", arguments: { category: "tech" } })
  ]);

  // Process results...
};
```

### Tool Call with Complex Arguments

```typescript
const result = await app.callServerTool({
  name: "analyze-data",
  arguments: {
    dataset: "sales-2024",
    filters: {
      startDate: "2024-01-01",
      endDate: "2024-12-31",
      region: "US"
    },
    options: {
      includeCharts: true,
      format: "json"
    }
  }
});
```

### Error Recovery Patterns

```typescript
const callWithRetry = async (toolName: string, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await app.callServerTool({ name: toolName, arguments: {} });
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
};
```

This comprehensive data flow shows how MCP Apps bridge the gap between user interfaces and server-side functionality through a well-defined, secure, and performant communication protocol.