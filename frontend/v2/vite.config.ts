import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// import path from 'path'; // 移除未使用的 path 导入

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
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
