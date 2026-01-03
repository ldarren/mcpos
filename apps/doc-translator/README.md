# Document Translation MCP App

A **dual-mode** multi-page document translation application built with React and MCP (Model Context Protocol) that demonstrates **Approach 3** from the Rollup + Vite multi-route strategy: **Route-Based Component Splitting with Separate Inlined HTML Files**.

## 🎭 Dual-Mode Operation

This app works in **two modes** automatically:

### 🤖 **MCP App Mode**
- Runs inside MCP hosts (like Claude with MCP support)
- Uses real MCP server communication
- Full tool integration and data persistence

### 🌐 **Standalone Mode**
- Runs as a normal React app in any browser
- Uses mock data and simulated responses
- Perfect for development, testing, and demos

**Mode Detection**: The app automatically detects its environment and switches modes seamlessly!

## Architecture Overview

This application splits a single multi-route React app into **3 separate inlined HTML files**, each containing a complete, self-contained React application for a specific route:

- **Upload Page** (`upload.html`) - Document upload and translation initiation
- **History Page** (`history.html`) - Translation history and file management
- **Glossary Page** (`glossary.html`) - Terminology and translation memory management

**Test Standalone Mode**:
- Upload: http://localhost:3001/upload/upload.html
- History: http://localhost:3001/history/history.html
- Glossary: http://localhost:3001/glossary/glossary.html

## Key Features

### 🎯 Multi-Page Approach Benefits
- **Smaller bundle sizes** - Each page only loads code for its specific functionality
- **Faster loading** - Users only download what they need for the current page
- **Independent deployment** - Each page can be updated separately
- **Better performance** - No unused code or components loaded

### 🔧 Technical Implementation
- **Rollup + Vite** for bundling with `vite-plugin-singlefile`
- **Environment-based routing** using `__ACTIVE_ROUTE__` compile-time variable
- **Self-contained HTML files** with all JS/CSS inlined (no external dependencies)
- **MCP Server** with separate tools and resources for each page
- **Mock data** for demonstration (easily replaceable with real APIs)

## Project Structure

```
apps/doc-translator/
├── src/
│   ├── app.tsx                 # Main app with route switching logic
│   ├── global.css             # Shared styles
│   ├── vite-env.d.ts          # TypeScript definitions
│   └── components/
│       ├── UploadDocumentPage.tsx     # Upload functionality
│       ├── TranslationHistoryPage.tsx # History management
│       └── GlossaryPage.tsx           # Glossary/memory management
├── dist/                      # Built files
│   ├── upload/upload.html    # 571KB - Upload page bundle
│   ├── history/history.html  # 572KB - History page bundle
│   └── glossary/glossary.html # 577KB - Glossary page bundle
├── upload.html               # Entry point for upload page
├── history.html             # Entry point for history page
├── glossary.html            # Entry point for glossary page
├── vite.config.ts           # Multi-page build configuration
├── server.ts                # MCP server with all tools
└── package.json            # Build scripts for each page
```

## How Route Splitting Works

### 1. Build-Time Environment Variables
Each build process sets a different `VITE_ACTIVE_ROUTE` environment variable:

```json
{
  "scripts": {
    "build:upload": "cross-env VITE_ACTIVE_ROUTE=upload INPUT=upload.html vite build --outDir dist/upload",
    "build:history": "cross-env VITE_ACTIVE_ROUTE=history INPUT=history.html vite build --outDir dist/history",
    "build:glossary": "cross-env VITE_ACTIVE_ROUTE=glossary INPUT=glossary.html vite build --outDir dist/glossary"
  }
}
```

### 2. Runtime Route Selection
The main app component uses the compile-time variable to determine which page to render:

```typescript
function DocumentTranslatorAppInner({ app, toolResult }: Props) {
  const renderPage = () => {
    switch (__ACTIVE_ROUTE__) {
      case "upload": return <UploadDocumentPage app={app} toolResult={toolResult} />;
      case "history": return <TranslationHistoryPage app={app} toolResult={toolResult} />;
      case "glossary": return <GlossaryPage app={app} toolResult={toolResult} />;
      default: return <div>Unknown route: {__ACTIVE_ROUTE__}</div>;
    }
  };

  return <main>{renderPage()}</main>;
}
```

### 3. Vite Configuration
The Vite config uses environment variables to determine input file and build output:

```typescript
const INPUT = process.env.INPUT;           // HTML entry point
const ACTIVE_ROUTE = process.env.VITE_ACTIVE_ROUTE;  // Route to build

export default defineConfig({
  plugins: [react(), viteSingleFile()],  // Inline everything
  define: {
    __ACTIVE_ROUTE__: JSON.stringify(ACTIVE_ROUTE),  // Compile-time constant
  },
  build: {
    rollupOptions: {
      input: INPUT,  // Dynamic input file
    },
  },
});
```

## MCP Integration

### Tools and Resources
The MCP server provides 8 tools across 3 resource URIs:

**Upload Tools:**
- `translate-document` - Initiate document translation

**History Tools:**
- `get-translation-history` - Retrieve translation history
- `download-translation` - Download completed translations
- `delete-translation` - Remove translations from history

**Glossary Tools:**
- `get-glossary` - Retrieve glossary entries
- `get-translation-memory` - Get translation memory segments
- `add-glossary-entry` - Add new terminology
- `delete-glossary-entry` - Remove glossary entries

### Resource Linking
Each tool is linked to its corresponding UI resource:

```typescript
registerAppTool(server, "translate-document", {
  title: "Translate Document",
  description: "Upload and translate a document to another language",
  _meta: { [RESOURCE_URI_META_KEY]: "ui://doc-translator/upload.html" },
  // ...tool implementation
});

registerAppResource(server, "ui://doc-translator/upload.html",
  // ...serves the built upload.html file
);
```

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation
```bash
cd apps/doc-translator
npm install
```

### Development
```bash
# Build all pages
npm run build:all

# Or build individual pages
npm run build:upload
npm run build:history
npm run build:glossary

# Start the server
npm run serve

# Development with watch mode
npm run dev
```

### Testing the Pages
Once the server is running, visit:
- **Upload**: http://localhost:3001/upload/upload.html
- **History**: http://localhost:3001/history/history.html
- **Glossary**: http://localhost:3001/glossary/glossary.html
- **Status API**: http://localhost:3001/status

## 📚 Documentation

- **[SETUP_GUIDE.md](SETUP_GUIDE.md)** - Step-by-step setup for multi-page React to HTML
- **[DUAL_MODE.md](DUAL_MODE.md)** - How the MCP + Standalone dual-mode system works
- **[README.md](README.md)** - This file (project overview and features)

## Page Features

### 📄 Upload Document Page
- **Drag & drop** file upload with validation
- **Multi-language support** (12 languages)
- **File type validation** (PDF, DOCX, TXT, RTF, ODT, XLSX, PPTX)
- **Real-time progress tracking** for translation jobs
- **File size limits** and error handling

### 📊 Translation History Page
- **Searchable history** with filtering by status and language
- **Download completed** translations
- **Delete unwanted** translations
- **Summary statistics** (total, completed, failed, words translated)
- **Responsive table** with detailed translation info

### 📚 Glossary & Translation Memory Page
- **Dual-tab interface** - Glossary entries + Translation memory segments
- **Add/edit/delete** terminology entries
- **Search and filter** by category and language
- **Confidence scoring** for translation quality
- **Usage statistics** and last-used tracking
- **Category management** (Technical, Legal, Medical, Business, etc.)

## Bundle Analysis

### Bundle Sizes
- Upload page: **571KB** (153KB gzipped)
- History page: **572KB** (153KB gzipped)
- Glossary page: **577KB** (154KB gzipped)

### What's Included
Each HTML file contains:
- Complete React 19 runtime
- All component code for the specific page
- CSS styles (inlined)
- MCP App SDK
- Zod validation library
- No external dependencies or network requests required

## Comparison with Other Approaches

| Approach | Bundle Size | Load Speed | Development | Deployment |
|----------|-------------|------------|-------------|------------|
| **Single SPA** | Large (~1.5MB) | Slower initial load | Simple | Simple |
| **Multi-entry build** | Medium (~800KB each) | Medium | Complex routing | Multiple files |
| **Route splitting (this)** | Small (~570KB each) | Fast | Route-aware builds | Independent pages |

## Real-World Usage

### Production Deployment
For production use:

1. **Replace mock data** with real API calls in the MCP server
2. **Add authentication** and user management
3. **Implement file storage** (AWS S3, Google Cloud Storage)
4. **Add real translation APIs** (Google Translate, DeepL, Azure Translator)
5. **Database integration** for persistence
6. **Add monitoring** and logging

### MCP Integration
In a real MCP environment:
- The server would connect via stdio or other transports
- Claude or other MCP clients would discover and use the tools
- Each HTML page would be served as an MCP resource
- Tools would be triggered from within MCP client interfaces

## Development Notes

### Adding New Pages
1. Create a new HTML entry point (e.g., `settings.html`)
2. Add build script in `package.json`
3. Create React component in `src/components/`
4. Add route case in `src/app.tsx`
5. Register MCP tools and resources in `server.ts`

### Debugging
- Use `npm run dev` for watch mode during development
- Check the browser DevTools console for MCP communication logs
- Monitor server logs for MCP tool execution
- Test individual pages with curl or browser dev tools

## License

MIT License - feel free to use this as a template for your own multi-page MCP applications!