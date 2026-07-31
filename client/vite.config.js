import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,       // Expose to local network (0.0.0.0)
    port: 5173,       // Fixed port so the URL is always the same
    strictPort: true, // Fail if port is taken (instead of silently changing)
  },
  build: {
    // Generate source maps for better debugging in production (optional)
    sourcemap: false,
    // Improve chunk splitting for better caching & LCP/FCP (Core Web Vitals)
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          icons: ['lucide-react'],
        },
        // Stable asset filenames improve caching
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
      },
    },
    // Reduce chunk size warnings threshold
    chunkSizeWarningLimit: 1000,
  },
})

