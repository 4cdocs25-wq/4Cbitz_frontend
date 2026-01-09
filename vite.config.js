import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react({
      fastRefresh: true
    }),
    tailwindcss()
  ],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    allowedHosts: ['4cbz.com', 'www.4cbz.com'],
    hmr: {
      host: '4cbz.com',
      protocol: 'wss',
      clientPort: 443
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['axios']
        }
      }
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom']
  }
})
