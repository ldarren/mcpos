# Multi-Page React to Inlined HTML Setup Guide

This guide shows you how to configure a React project to generate multiple separate inlined HTML files from a single codebase using Rollup + Vite.

## Overview

We'll transform a multi-route React app into separate self-contained HTML files using **build-time environment variables** and **route-based component splitting**.

## Step 1: Project Structure Setup

Create the following project structure:

```
your-app/
├── src/
│   ├── app.tsx              # Main app with route switching
│   ├── vite-env.d.ts        # TypeScript definitions
│   ├── global.css           # Shared styles
│   └── components/
│       ├── PageA.tsx        # First page component
│       ├── PageB.tsx        # Second page component
│       └── PageC.tsx        # Third page component
├── page-a.html              # Entry point for Page A
├── page-b.html              # Entry point for Page B
├── page-c.html              # Entry point for Page C
├── vite.config.ts           # Multi-page build config
├── tsconfig.json            # TypeScript config
└── package.json             # Build scripts
```

## Step 2: Package.json Configuration

Configure your `package.json` with individual build scripts for each page:

```json
{
  "name": "multi-page-react-app",
  "private": true,
  "type": "module",
  "scripts": {
    "build:all": "npm run build:page-a && npm run build:page-b && npm run build:page-c",
    "build:page-a": "cross-env VITE_ACTIVE_ROUTE=page-a INPUT=page-a.html vite build --outDir dist/page-a",
    "build:page-b": "cross-env VITE_ACTIVE_ROUTE=page-b INPUT=page-b.html vite build --outDir dist/page-b",
    "build:page-c": "cross-env VITE_ACTIVE_ROUTE=page-c INPUT=page-c.html vite build --outDir dist/page-c",
    "watch:page-a": "cross-env VITE_ACTIVE_ROUTE=page-a INPUT=page-a.html vite build --watch --outDir dist/page-a",
    "watch:page-b": "cross-env VITE_ACTIVE_ROUTE=page-b INPUT=page-b.html vite build --watch --outDir dist/page-b",
    "watch:page-c": "cross-env VITE_ACTIVE_ROUTE=page-c INPUT=page-c.html vite build --watch --outDir dist/page-c",
    "dev": "concurrently 'npm run watch:page-a' 'npm run watch:page-b' 'npm run watch:page-c'"
  },
  "dependencies": {
    "react": "^19.2.0",
    "react-dom": "^19.2.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.1",
    "concurrently": "^9.2.1",
    "cross-env": "^10.1.0",
    "typescript": "^5.7.2",
    "vite": "^7.3.0",
    "vite-plugin-singlefile": "^2.3.0"
  },
  "optionalDependencies": {
    "@rollup/rollup-darwin-arm64": "^4.53.3",
    "@rollup/rollup-darwin-x64": "^4.53.3",
    "@rollup/rollup-linux-arm64-gnu": "^4.53.3",
    "@rollup/rollup-linux-x64-gnu": "^4.53.3",
    "@rollup/rollup-win32-x64-msvc": "^4.53.3"
  }
}
```

**Key Points:**
- `cross-env` sets environment variables across platforms
- `VITE_ACTIVE_ROUTE` tells the app which page to render
- `INPUT` specifies the HTML entry point for each build
- `--outDir` creates separate output directories for each page

## Step 3: Vite Configuration

Create `vite.config.ts` with dynamic input and route definitions:

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

const INPUT = process.env.INPUT;
const ACTIVE_ROUTE = process.env.VITE_ACTIVE_ROUTE;

if (!INPUT) {
  throw new Error("INPUT environment variable is not set");
}

if (!ACTIVE_ROUTE) {
  throw new Error("VITE_ACTIVE_ROUTE environment variable is not set");
}

const isDevelopment = process.env.NODE_ENV === "development";

export default defineConfig({
  plugins: [
    react(),
    viteSingleFile() // This plugin inlines everything into a single HTML file
  ],
  resolve: {
    alias: {
      "react": "react",
      "react-dom": "react-dom"
    },
    dedupe: ["react", "react-dom"]
  },
  define: {
    // Make the active route available as a compile-time constant
    __ACTIVE_ROUTE__: JSON.stringify(ACTIVE_ROUTE),
  },
  build: {
    sourcemap: isDevelopment ? "inline" : undefined,
    cssMinify: !isDevelopment,
    minify: !isDevelopment,
    rollupOptions: {
      input: INPUT, // Dynamic input file based on environment
      external: (id) => {
        // Don't externalize React - we want it bundled
        if (id === 'react' || id === 'react-dom') return false;
        return false;
      }
    },
    emptyOutDir: true, // Clean output directory before build
  },
});
```

**Key Configuration Points:**
- `viteSingleFile()` inlines all JS/CSS into the HTML file
- `__ACTIVE_ROUTE__` becomes a compile-time constant
- `rollupOptions.input` uses the dynamic INPUT environment variable
- React is bundled, not externalized

## Step 4: TypeScript Definitions

Create `src/vite-env.d.ts` to define the compile-time constant:

```typescript
/// <reference types="vite/client" />

// Define the compile-time route constant
declare const __ACTIVE_ROUTE__: "page-a" | "page-b" | "page-c";
```

## Step 5: HTML Entry Points

Create separate HTML files for each page:

**page-a.html:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <title>Page A - My App</title>
  <link rel="stylesheet" href="/src/global.css">
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/app.tsx"></script>
</body>
</html>
```

**page-b.html:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <title>Page B - My App</title>
  <link rel="stylesheet" href="/src/global.css">
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/app.tsx"></script>
</body>
</html>
```

**page-c.html:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <title>Page C - My App</title>
  <link rel="stylesheet" href="/src/global.css">
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/app.tsx"></script>
</body>
</html>
```

**Important:** All HTML files reference the same `app.tsx` - the routing happens at build time!

## Step 6: Main App Component with Route Switching

Create `src/app.tsx` with build-time route switching:

```typescript
import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";

// Import your page components
import PageA from "./components/PageA";
import PageB from "./components/PageB";
import PageC from "./components/PageC";

function App() {
  // Route to the correct page based on build-time environment variable
  const renderPage = () => {
    switch (__ACTIVE_ROUTE__) {
      case "page-a":
        return <PageA />;
      case "page-b":
        return <PageB />;
      case "page-c":
        return <PageC />;
      default:
        return <div>Unknown route: {__ACTIVE_ROUTE__}</div>;
    }
  };

  return (
    <main>
      {renderPage()}
    </main>
  );
}

// Render the app
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

**Key Points:**
- `__ACTIVE_ROUTE__` is determined at build time
- Only the required component is included in each bundle
- No runtime routing logic needed

## Step 7: Page Components

Create your page components in `src/components/`:

**src/components/PageA.tsx:**
```typescript
import React from "react";

export default function PageA() {
  return (
    <div className="container">
      <div className="card">
        <div className="page-header">
          <h1 className="page-title">Page A</h1>
          <p className="page-description">This is the first page of the application</p>
        </div>

        <div className="content">
          {/* Your page-specific content */}
          <button className="btn btn-primary">Page A Action</button>
        </div>
      </div>
    </div>
  );
}
```

**src/components/PageB.tsx:**
```typescript
import React, { useState } from "react";

export default function PageB() {
  const [count, setCount] = useState(0);

  return (
    <div className="container">
      <div className="card">
        <div className="page-header">
          <h1 className="page-title">Page B</h1>
          <p className="page-description">This is the second page with interactive content</p>
        </div>

        <div className="content">
          <p>Counter: {count}</p>
          <button
            className="btn btn-primary"
            onClick={() => setCount(count + 1)}
          >
            Increment: {count}
          </button>
        </div>
      </div>
    </div>
  );
}
```

**src/components/PageC.tsx:**
```typescript
import React, { useEffect, useState } from "react";

export default function PageC() {
  const [data, setData] = useState<string[]>([]);

  useEffect(() => {
    // Simulate data loading
    setData(["Item 1", "Item 2", "Item 3"]);
  }, []);

  return (
    <div className="container">
      <div className="card">
        <div className="page-header">
          <h1 className="page-title">Page C</h1>
          <p className="page-description">This is the third page with data</p>
        </div>

        <div className="content">
          <ul>
            {data.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
```

## Step 8: Build Commands

### Install Dependencies
```bash
npm install
```

### Build All Pages
```bash
npm run build:all
```

This runs:
1. `npm run build:page-a` → creates `dist/page-a/page-a.html`
2. `npm run build:page-b` → creates `dist/page-b/page-b.html`
3. `npm run build:page-c` → creates `dist/page-c/page-c.html`

### Build Individual Pages
```bash
# Build just Page A
npm run build:page-a

# Build just Page B
npm run build:page-b

# Build just Page C
npm run build:page-c
```

### Development with Watch Mode
```bash
# Watch all pages for changes
npm run dev

# Or watch individual pages
npm run watch:page-a
npm run watch:page-b
npm run watch:page-c
```

## Step 9: Verify the Build

After building, you'll have:

```
dist/
├── page-a/
│   └── page-a.html    # Complete self-contained Page A (~500KB)
├── page-b/
│   └── page-b.html    # Complete self-contained Page B (~500KB)
└── page-c/
    └── page-c.html    # Complete self-contained Page C (~500KB)
```

### Test the Built Files

You can test the built files by opening them directly in a browser or serving them:

```bash
# Using Python's built-in server
cd dist/page-a && python3 -m http.server 8001
cd dist/page-b && python3 -m http.server 8002
cd dist/page-c && python3 -m http.server 8003

# Using Node.js serve package
npx serve dist/page-a -p 8001
npx serve dist/page-b -p 8002
npx serve dist/page-c -p 8003
```

## Step 10: Advanced Configuration

### Adding New Pages

To add a new page (e.g., "page-d"):

1. **Create HTML entry point:**
   ```html
   <!-- page-d.html -->
   <!DOCTYPE html>
   <html lang="en">
   <head>
     <meta charset="UTF-8">
     <meta name="viewport" content="width=device-width, initial-scale=1.0">
     <title>Page D - My App</title>
     <link rel="stylesheet" href="/src/global.css">
   </head>
   <body>
     <div id="root"></div>
     <script type="module" src="/src/app.tsx"></script>
   </body>
   </html>
   ```

2. **Add build scripts to package.json:**
   ```json
   {
     "scripts": {
       "build:all": "npm run build:page-a && npm run build:page-b && npm run build:page-c && npm run build:page-d",
       "build:page-d": "cross-env VITE_ACTIVE_ROUTE=page-d INPUT=page-d.html vite build --outDir dist/page-d",
       "watch:page-d": "cross-env VITE_ACTIVE_ROUTE=page-d INPUT=page-d.html vite build --watch --outDir dist/page-d"
     }
   }
   ```

3. **Update TypeScript definitions:**
   ```typescript
   // src/vite-env.d.ts
   declare const __ACTIVE_ROUTE__: "page-a" | "page-b" | "page-c" | "page-d";
   ```

4. **Create the component:**
   ```typescript
   // src/components/PageD.tsx
   import React from "react";

   export default function PageD() {
     return <div>Page D Content</div>;
   }
   ```

5. **Add route to app.tsx:**
   ```typescript
   // src/app.tsx
   import PageD from "./components/PageD";

   const renderPage = () => {
     switch (__ACTIVE_ROUTE__) {
       case "page-a": return <PageA />;
       case "page-b": return <PageB />;
       case "page-c": return <PageC />;
       case "page-d": return <PageD />; // Add this line
       default: return <div>Unknown route: {__ACTIVE_ROUTE__}</div>;
     }
   };
   ```

### Bundle Analysis

To analyze what's in each bundle:

```bash
# Install bundle analyzer
npm install --save-dev rollup-plugin-visualizer

# Add to vite.config.ts
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    viteSingleFile(),
    visualizer({
      filename: `dist/stats-${ACTIVE_ROUTE}.html`,
      open: true
    })
  ],
  // ... rest of config
});
```

### Environment-Specific Builds

You can also create different builds for development/production:

```json
{
  "scripts": {
    "build:page-a:dev": "cross-env NODE_ENV=development VITE_ACTIVE_ROUTE=page-a INPUT=page-a.html vite build --outDir dist/dev/page-a",
    "build:page-a:prod": "cross-env NODE_ENV=production VITE_ACTIVE_ROUTE=page-a INPUT=page-a.html vite build --outDir dist/prod/page-a"
  }
}
```

## Benefits of This Approach

1. **Smaller bundles**: Each page only contains code for that specific page
2. **Faster loading**: Users download only what they need
3. **Better caching**: Pages can be cached independently
4. **Easier deployment**: Each page can be deployed separately
5. **Development efficiency**: Shared components and build configuration
6. **SEO friendly**: Each page is a complete HTML document

## Troubleshooting

### Common Issues:

1. **"INPUT environment variable is not set"**
   - Make sure you're using `cross-env` in your npm scripts
   - Check that `INPUT=page-x.html` is specified in the command

2. **"__ACTIVE_ROUTE__ is not defined"**
   - Ensure `src/vite-env.d.ts` includes the type declaration
   - Check that `VITE_ACTIVE_ROUTE=page-x` is set in the build command

3. **Large bundle sizes**
   - Make sure `vite-plugin-singlefile` is installed and configured
   - Check that unused code is being tree-shaken (use bundle analyzer)

4. **React errors in production**
   - Ensure React and ReactDOM versions are compatible
   - Check that `NODE_ENV=production` for production builds

This setup gives you the power of a single React codebase with the performance benefits of multiple optimized pages!