import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/stock-monitor_v1/',
  plugins: [
    react({
      babel: {
        plugins: []
      }
    })
  ],
  server: {
    historyApiFallback: true,
  },
})
