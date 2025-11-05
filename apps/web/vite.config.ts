import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@epub-reader/core": path.resolve(__dirname, "../../packages/core/src"),
      "@epub-reader/ui": path.resolve(__dirname, "../../packages/ui/src"),
      "@epub-reader/web-adapter": path.resolve(__dirname, "../../packages/web-adapter/src"),
    },
  },
  server: {
    port: 5173,
  },
});
