import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // 监听所有 IP，这对 Docker 很重要
    port: 80,   // 开发模式下使用 80 端口，与 Dockerfile 对应
  },
})