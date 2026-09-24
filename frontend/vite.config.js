import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Fixed port instead of Vite's silent fallback (5173 is already bound by
    // an unrelated docker-proxy on this machine) so launch.py can reliably
    // free and report this exact port.
    port: 5175,
    strictPort: true,
  },
})
