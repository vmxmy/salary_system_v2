import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
// import path from 'path'; // 移除未使用的 path 导入

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    allowedHosts: ['salary.ziikoo.com'],
    // proxy: { // 移除 proxy 配置块
    //   '/api': {
    //     target: process.env.VITE_API_BASE_URL || 'http://localhost:8080',
    //     changeOrigin: true,
    //     rewrite: (path) => path.replace(/^\/api/, ''), 
    //   },
    // },
  },
  // envDir 已被移除，Vite 会默认从 frontend/v2/ 加载 .env
})
