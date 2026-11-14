import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // three.js is large on its own; keep it in a separate, cacheable chunk
    // that only loads on pages with a 3D scene.
    chunkSizeWarningLimit: 1200,
  },
})
