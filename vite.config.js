import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Enable Fast Refresh
      fastRefresh: true,
    }),
    tailwindcss()
  ],
  server: {
    // Enable HMR
    hmr: {
      overlay: true
    },
    // Watch for changes in these directories
    watch: {
      usePolling: true
    }
  },
  // Optimize dependencies for faster HMR
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom']
  }
})