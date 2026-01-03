# Dual-Mode React App: MCP + Standalone

This app now supports **two modes of operation**:

1. **MCP App Mode** - Runs inside an MCP host (like Claude with MCP support)
2. **Standalone Mode** - Runs as a normal React app in any browser

## How It Works

### Automatic Mode Detection

The app automatically detects which environment it's running in:

```typescript
// Detects if running in MCP host iframe vs standalone browser
function isMcpMode(): boolean {
  try {
    return (
      window.parent !== window &&
      window.parent.postMessage !== undefined &&
      window.location !== window.parent.location
    );
  } catch (e) {
    return true; // Security error = likely in iframe
  }
}
```

### Mode Switching Logic

1. **App starts** → Shows "Initializing..."
2. **Attempts MCP connection** for 2 seconds
3. **If MCP connects** → Switches to MCP Mode
4. **If no MCP host** → Switches to Standalone Mode with mock data

### Visual Features

**Mode Indicator**: A colored badge in the top-right corner shows current mode:
- 🟢 **Green "MCP Mode"** - Connected to real MCP server
- 🟠 **Orange "Standalone Mode"** - Using mock data

**Navigation Tabs** (Standalone Mode Only):
- Beautiful header with app title and description
- Interactive tab navigation between all 3 pages
- Active tab highlighting with visual indicators
- Hover effects and loading states during navigation
- Sticky navigation that stays visible when scrolling

## Testing Both Modes

### Standalone Mode (Browser)
```bash
# Start the server
npm run serve

# Open in any browser:
http://localhost:3001/upload/upload.html     # Upload page
http://localhost:3001/history/history.html   # History page
http://localhost:3001/glossary/glossary.html # Glossary page
```

**Features in Standalone Mode:**
- ✅ Full UI functionality
- ✅ Mock data for all features
- ✅ Interactive elements work
- ✅ Form submissions (with fake responses)
- ✅ **Navigation tabs** connecting all 3 pages
- ✅ **App header** with branding and description
- ✅ Console logging shows "[MOCK]" prefix

### MCP App Mode (Within MCP Host)
```bash
# When loaded by an MCP client (like Claude):
# - Detects iframe environment
# - Connects to real MCP server
# - Uses actual server tools and data
```

**Features in MCP Mode:**
- ✅ Real server communication
- ✅ Actual tool execution
- ✅ Data persistence (if server supports it)
- ✅ Full MCP protocol support

## Mock Data in Standalone Mode

### Upload Page
- ✅ File drag & drop works
- ✅ Language selection works
- ✅ Shows mock translation progress
- ✅ Displays fake job status updates

### History Page
- ✅ Shows sample translation history
- ✅ Search and filtering work
- ✅ Download/delete buttons show mock responses
- ✅ Statistics display sample data

### Glossary Page
- ✅ Sample glossary entries
- ✅ Mock translation memory
- ✅ Add/edit/delete operations work
- ✅ Search and filtering functional

## Console Output Examples

### Standalone Mode Logs
```
[DOC-TRANSLATOR] No MCP host detected, switching to standalone mode
[DOC-TRANSLATOR] [MOCK] Calling tool: get-glossary {}
[DOC-TRANSLATOR] [MOCK] Send message: {...}
```

### MCP Mode Logs
```
[DOC-TRANSLATOR] MCP App connected successfully
[DOC-TRANSLATOR] Calling get-glossary tool...
[DOC-TRANSLATOR] get-glossary result: {...}
```

## Development Workflow

### For UI Development (Standalone Mode)
```bash
npm run dev        # Watch all pages
# or
npm run watch:glossary  # Watch specific page

# Open http://localhost:3001/glossary/glossary.html
# Work on UI without needing MCP setup
```

### For MCP Integration Testing
1. Start the server: `npm run serve`
2. Load in MCP client (Claude, etc.)
3. Test real MCP tool communication

## Code Structure

### Dual-Mode App Component
```typescript
function DocumentTranslatorApp() {
  const [mode, setMode] = useState<"mcp" | "standalone" | "detecting">("detecting");
  const [mockApp, setMockApp] = useState<App | null>(null);

  // Real MCP connection
  const { app: mcpApp, error: mcpError } = useApp({...});

  // Auto-detect and switch modes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!mcpApp && !mcpError) {
        setMode("standalone");
        setMockApp(createMockApp());
      }
    }, 2000);
    return () => clearTimeout(timeoutId);
  }, [mcpApp, mcpError]);

  // Use appropriate app instance
  const app = mode === "mcp" ? mcpApp! : mockApp!;
}
```

### Mock App Implementation
```typescript
function createMockApp(): App {
  return {
    callServerTool: async ({ name, arguments: args }) => {
      // Return mock data based on tool name
      switch (name) {
        case "get-glossary":
          return { content: [{ type: "text", text: JSON.stringify(mockGlossaryData) }] };
        // ... other tools
      }
    },

    sendMessage: async (message) => ({ isError: false }),
    sendLog: async (logEntry) => { console.log(logEntry); },
    openLink: async ({ url }) => { window.open(url, '_blank'); }
  };
}
```

## Advantages of Dual-Mode

### For Developers
- 🚀 **Faster iteration** - No MCP setup needed for UI work
- 🔧 **Easy debugging** - Direct browser access
- 🧪 **Better testing** - Can test UI independently
- 📱 **Responsive design** - Test on different screen sizes

### For Users
- 🌐 **Wider compatibility** - Works in any browser
- 🎮 **Demo mode** - Can showcase features without MCP
- 🔍 **Inspection** - Full browser DevTools access
- 📖 **Documentation** - Interactive examples

### For Deployment
- 📦 **Single codebase** - One build works everywhere
- 🎯 **Flexible hosting** - Can host as static site
- 🔄 **Gradual migration** - Can start standalone, add MCP later
- ✅ **Fallback support** - Graceful degradation if MCP unavailable

## Error Handling

### MCP Connection Errors
```typescript
if (mode === "mcp" && mcpError) {
  return (
    <div>
      <strong>MCP Connection Error:</strong>
      <div>{mcpError.message}</div>
      <button onClick={() => window.location.reload()}>
        Retry
      </button>
    </div>
  );
}
```

### Mock Tool Errors
```typescript
// Mock tools can simulate errors too:
case "translate-document":
  if (args.fileName.endsWith('.xyz')) {
    throw new Error("Unsupported file format");
  }
  return mockSuccessResponse;
```

## Customizing Mock Data

### Add New Mock Responses
```typescript
// In createMockApp() function:
case "your-new-tool":
  return {
    content: [{
      type: "text",
      text: JSON.stringify({
        // Your mock data here
      })
    }]
  };
```

### Dynamic Mock Data
```typescript
case "get-current-time":
  return {
    content: [{
      type: "text",
      text: new Date().toISOString() // Real current time
    }]
  };
```

## Production Considerations

### Disable Mock Mode in Production
```typescript
// Add environment check:
const ENABLE_STANDALONE = process.env.NODE_ENV !== 'production';

useEffect(() => {
  if (!ENABLE_STANDALONE) return; // Skip standalone detection
  // ... rest of detection logic
}, []);
```

### Bundle Size Impact
- **Additional code**: ~3KB for dual-mode logic
- **Mock data**: ~2KB for sample responses
- **Navigation system**: ~2KB for tabs and header
- **Total overhead**: ~7KB (minimal impact on 580KB bundles)

## Navigation System (Standalone Mode)

### Conditional UI Elements

The navigation system only appears in standalone mode, providing a seamless multi-page experience:

```typescript
// App header with branding (standalone only)
const appHeader = mode === 'standalone' && (
  <div style={{
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    padding: '16px 20px',
    textAlign: 'center'
  }}>
    <h1>📄 Document Translation Suite</h1>
    <p>Upload, translate, and manage your multilingual documents</p>
  </div>
);

// Interactive navigation tabs (standalone only)
const navigationTabs = mode === 'standalone' && (
  <div style={{ /* sticky navigation styles */ }}>
    <TabButton label="📄 Upload" isActive={__ACTIVE_ROUTE__ === 'upload'} />
    <TabButton label="📊 History" isActive={__ACTIVE_ROUTE__ === 'history'} />
    <TabButton label="📚 Glossary" isActive={__ACTIVE_ROUTE__ === 'glossary'} />
  </div>
);
```

### Smart Navigation Logic

```typescript
function TabButton({ label, isActive, href }: TabButtonProps) {
  const [isNavigating, setIsNavigating] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isActive && !isNavigating) {
      setIsNavigating(true); // Show loading state
      setTimeout(() => {
        window.location.href = href; // Navigate between HTML files
      }, 100);
    }
  };

  return (
    <a href={href} onClick={handleClick} style={{
      color: isActive ? '#007acc' : '#666',
      background: isActive ? '#f0f8ff' : 'transparent',
      cursor: isActive ? 'default' : 'pointer',
      opacity: isNavigating ? 0.7 : 1
    }}>
      {isNavigating ? <span>⏳</span> : null}
      {label}
      {isActive && <span className="active-indicator" />}
    </a>
  );
}
```

### Visual Design Features

- **Sticky Navigation**: Stays at top when scrolling
- **Active State**: Blue highlight with bottom border and indicator dot
- **Hover Effects**: Smooth color and background transitions
- **Loading States**: Hourglass icon during navigation
- **Responsive Design**: Works on mobile and desktop
- **Tooltips**: Descriptive hover text for each tab

## Migration Path

### From Standalone to MCP
1. Start with standalone React app
2. Add MCP SDK dependencies
3. Wrap with dual-mode detection
4. Test both modes work
5. Deploy - users get best of both worlds

### From MCP-Only to Dual-Mode
1. Add mock app creation function
2. Add mode detection logic
3. Update component to handle both modes
4. Test standalone functionality
5. Rebuild and deploy

This dual-mode approach gives you the flexibility to develop, demo, and deploy your React MCP apps in multiple environments while maintaining a single codebase!