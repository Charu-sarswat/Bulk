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
  }
})

