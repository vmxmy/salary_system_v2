import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
import path from 'path'; // 导入 path 模块

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: process.env.VITE_API_BASE_URL || 'http://localhost:8080', // 从环境变量读取后端服务地址，如果未设置则使用默认值
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''), // 重写路径，去掉 /api
      },
    },
  },
  envDir: path.resolve(__dirname, '../..'), // 指定 .env 文件所在的目录为项目根目录
})
