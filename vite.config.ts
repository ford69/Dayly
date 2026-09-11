import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        // Use 127.0.0.1 to avoid macOS "ENOTFOUND localhost" DNS failures
        target: 'http://127.0.0.1:5174',
        changeOrigin: true,
      },
    },
  },
});
