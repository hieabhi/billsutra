import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // Use Vite's default dev port to avoid conflicts (3000 often in use)
    port: 5173,
    strictPort: true,
    host: '127.0.0.1',
    hmr: {
      overlay: true
    },
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:5051',
        changeOrigin: true
      }
    }
  },
  // Use Vite defaults for dependency optimization and esbuild.
  // If you encounter esbuild EPIPE on Windows, ensure no explicit esbuild devDependency is installed.
})
