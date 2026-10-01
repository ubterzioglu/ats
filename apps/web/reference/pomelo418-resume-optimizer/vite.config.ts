import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// pdfjs-dist ships its own web worker; we tell Vite to copy it as a static asset
// so it can be loaded via a URL at runtime without CORS issues.
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['pdfjs-dist'],
  },
  worker: {
    format: 'es',
  },
  build: {
    rollupOptions: {
      // Split heavy PDF/DOCX libs into separate chunks so the initial bundle stays small
      output: {
        manualChunks: {
          'pdf-worker': ['pdfjs-dist'],
          mammoth: ['mammoth'],
          docx: ['docx'],
          jspdf: ['jspdf'],
        },
      },
    },
  },
});
