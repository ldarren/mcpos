import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

const INPUT = process.env.INPUT;
if (!INPUT) {
  throw new Error("INPUT environment variable is not set");
}

const isDevelopment = process.env.NODE_ENV === "development";

export default defineConfig({
  plugins: [react(), viteSingleFile()],
  resolve: {
    alias: {
      // Ensure React is resolved correctly for the ext-apps package
      "react": "react",
      "react-dom": "react-dom"
    },
    dedupe: ["react", "react-dom"]
  },
  build: {
    sourcemap: isDevelopment ? "inline" : undefined,
    cssMinify: !isDevelopment,
    minify: !isDevelopment,

    rollupOptions: {
      input: INPUT,
      external: (id) => {
        // Don't externalize these as we want them bundled
        if (id === 'react' || id === 'react-dom') return false;
        return false;
      }
    },
    outDir: "dist",
    emptyOutDir: false,
  },
});
