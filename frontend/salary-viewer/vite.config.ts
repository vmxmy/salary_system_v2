import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react()
  ],
  server: {
    host: '0.0.0.0', // 监听所有网络接口
    port: 5173, // 默认端口
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      '172.28.97.217',
      'salary.ziikoo.com'
    ],
  },
})
