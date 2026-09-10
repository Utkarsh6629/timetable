import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'fs'

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'))

// https://vite.dev/config/
export default defineConfig(({command}) => ({
  // base: './' is required for Capacitor Android WebView (file:// origin)
  // In dev server mode we keep '/' so the vite proxy works correctly
  base: command === 'build' ? './' : '/',
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  server: {
    proxy: {
      // In development, proxy /api and /auth to the Express server
      '/api':  { target: 'http://localhost:3001', changeOrigin: true },
      '/auth': { target: 'http://localhost:3001', changeOrigin: true },
    },
  },
}))
