import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  // Keep Vite cache on local AppData to avoid file-lock issues on synced/mapped drives.
  cacheDir: path.resolve(process.env.LOCALAPPDATA ?? process.env.TEMP ?? ".", "shyara-vite-cache"),
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
