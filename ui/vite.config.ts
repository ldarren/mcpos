import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const isDevelopment = process.env.NODE_ENV === "development";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: isDevelopment ? "inline" : undefined,
    cssMinify: !isDevelopment,
    minify: !isDevelopment,
    outDir: `dist`,
    emptyOutDir: false,
  },
})
