import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // This allows VITE_GEMINI_API_KEY from .env (if present) to be loaded.
  // On Cloudflare, these are set in the dashboard, and `process.env` will catch them if loadEnv doesn't.
  const env = loadEnv(mode, __dirname, '');

  return {
    plugins: [react()],
    base: './', // Relative base for flexible deployment
    define: {
      // Bake the API key into the build. 
      // PRIORITY: 
      // 1. VITE_GEMINI_API_KEY from loaded env (local .env or Cloudflare vars)
      // 2. process.env.VITE_GEMINI_API_KEY (fallback)
      // 3. Empty string (prevents crash, handled by App logic)
      'process.env.API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '') 
    },
    build: {
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html'),
          admin: resolve(__dirname, 'admin.html'),
          colorMatching: resolve(__dirname, 'color-matching.html'),
        },
      },
    },
  };
});