import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Use relative paths for assets to support subdirectories and flexible hosting
  define: {
    // Polyfill process.env for the Google GenAI SDK usage in browser if needed
    'process.env.API_KEY': 'import.meta.env.VITE_GEMINI_API_KEY' 
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
});