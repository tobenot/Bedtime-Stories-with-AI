import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  base: '/Bedtime-Stories-with-AI/',
  plugins: [vue()],
  server: {
    port: 3000
  },
  build: {
    outDir: 'dist'
  }
}) 