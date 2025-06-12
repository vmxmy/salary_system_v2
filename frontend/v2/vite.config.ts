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
    headers: {
      'Content-Security-Policy': "script-src 'self' 'unsafe-inline' http://localhost:* http://127.0.0.1:* http://10.31.59.108:* https://udify.app https://rsms.me; style-src 'self' 'unsafe-inline' http://localhost:* http://127.0.0.1:* http://10.31.59.108:* https://rsms.me; img-src 'self' data: blob:;"
    }
    // proxy: { // 移除 proxy 配置块
    //   '/api': {
    //     target: process.env.VITE_API_BASE_URL || 'http://localhost:8080',
    //     changeOrigin: true,
    //     rewrite: (path) => path.replace(/^\/api/, ''), 
    //   },
    // },
  },
  build: {
    // 增加chunk大小警告限制
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // 手动分块配置
        manualChunks: {
          // React相关库
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          
          // Ant Design相关
          'antd-vendor': ['antd', '@ant-design/pro-components', '@ant-design/icons'],
          
          // 国际化相关
          'i18n-vendor': ['react-i18next', 'i18next'],
          
          // 状态管理
          'state-vendor': ['@reduxjs/toolkit', 'react-redux'],
          
          // Excel处理库
          'excel-vendor': ['xlsx', 'xlsx-js-style'],
          
          // 工具库
          'utils-vendor': ['lodash', 'dayjs', 'axios'],
          
          // 员工服务模块
          'employee-service': ['./src/services/employeeService'],
          
          // HR管理模块
          'hr-management': [
            './src/pages/HRManagement/employees/EmployeeListPage',
            './src/pages/HRManagement/employees/CreateEmployeePage',
            './src/pages/HRManagement/employees/EditEmployeePage',
            './src/pages/HRManagement/employees/EmployeeDetailPage'
          ],
          
          // 薪资管理模块
          'payroll-management': [
            // './src/pages/Payroll/PayrollWorkflowPage', // 文件不存在，已注释
            './src/pages/Payroll/components/PayrollEntriesTable',
            './src/pages/Payroll/pages/PayrollBulkImportPage/PayrollBulkImportPageV3'
          ],
          
          // 管理员模块
          'admin-management': [
            './src/pages/Admin/Organization/OrganizationManagementPageV2',
            './src/pages/Admin/Configuration/ReportConfigManagement'
          ]
        },
        
        // 文件命名策略
        chunkFileNames: () => {
          return `assets/[name]-[hash].js`;
        },
        
        // 入口文件命名
        entryFileNames: 'assets/[name]-[hash].js',
        
        // 资源文件命名
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    
    // 启用源码映射（开发时有用）
    sourcemap: false,
    
    // 压缩配置
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // 生产环境移除console
        drop_debugger: true
      }
    }
  },
  
  // 优化依赖预构建
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'antd',
      '@ant-design/pro-components',
      'react-i18next',
      'i18next',
      '@reduxjs/toolkit',
      'react-redux'
    ],
    exclude: [
      'xlsx',
      'xlsx-js-style' // 这些库较大，延迟加载
    ]
  }
})
