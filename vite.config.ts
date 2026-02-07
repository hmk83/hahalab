import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, __dirname, '');

  return {
    plugins: [react()],
    base: './', // Use relative paths for assets to support subdirectories and flexible hosting
    define: {
      // Correctly polyfill process.env.API_KEY for the @google/genai SDK
      // This allows the build process (Cloudflare) to bake the key into the client-side code
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