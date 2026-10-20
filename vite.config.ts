import { defineConfig } from 'vite';

export default defineConfig({
  // Rutas relativas para que dist/ funcione en cualquier carpeta o subruta al publicarlo.
  base: './',
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    // Phaser ocupa más de 500 kB; se sube el umbral para que el aviso no tape errores reales.
    chunkSizeWarningLimit: 1600,
  },
});
