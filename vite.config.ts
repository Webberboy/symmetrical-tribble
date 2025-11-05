import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import type { Plugin } from 'vite';

// Plugin to inject environment variables into index.html
const htmlEnvPlugin = (): Plugin => ({
  name: 'html-env-plugin',
  transformIndexHtml(html) {
    return html
      .replace('%VITE_SUPABASE_URL%', process.env.VITE_SUPABASE_URL || '')
      .replace('%VITE_SUPABASE_ANON_KEY%', process.env.VITE_SUPABASE_ANON_KEY || '');
  },
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), htmlEnvPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom"],
  },
}));
