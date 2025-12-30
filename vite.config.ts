
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Configuración optimizada para Vercel Deploy
export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    target: 'esnext',
    commonjsOptions: {
      transformMixedEsModules: true, // Crucial para @google/genai
      include: [/node_modules/]
    }
  }
});
