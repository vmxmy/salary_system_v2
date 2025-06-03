#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Ant Design 组件升级脚本
 * 自动将旧的 API 升级到新版本
 */

// 需要处理的文件列表
const filesToUpgrade = [
  'frontend/v2/src/pages/Payroll/pages/PayrollCalculationConfigPage.tsx',
  'frontend/v2/src/pages/Payroll/pages/AttendanceManagementPage.tsx',
  'frontend/v2/src/pages/Payroll/pages/PayrollBulkImportPage/components/ImportInputStep.tsx',
  'frontend/v2/src/pages/Payroll/pages/PayrollBulkImportPage/PayrollBulkImportPageV3.tsx'
];

/**
 * 升级 Tabs 组件从 TabPane 到 items 语法
 */
function upgradeTabs(content) {
  let updatedContent = content;
  
  // 移除 TabPane 解构
  updatedContent = updatedContent.replace(
    /const\s*{\s*TabPane\s*}\s*=\s*Tabs;?\s*\n?/g,
    ''
  );
  
  // 添加 TabsProps 导入
  if (updatedContent.includes("import { Tabs }") && !updatedContent.includes("TabsProps")) {
    updatedContent = updatedContent.replace(
      "import { Tabs }",
      "import { Tabs, type TabsProps }"
    );
  }
  
  console.log('✅ Tabs 组件升级完成 - 已移除 TabPane 解构并添加 TabsProps 导入');
  console.log('⚠️  注意：您需要手动将 <TabPane> 转换为 items 数组格式');
  
  return updatedContent;
}

/**
 * 升级 Message 组件到使用 App.useApp()
 */
function upgradeMessage(content) {
  let updatedContent = content;
  
  // 检查是否使用了静态 message 方法
  const hasStaticMessage = /message\.(success|error|warning|info|loading)/.test(content);
  
  if (hasStaticMessage) {
    console.log('⚠️  检测到静态 message 方法使用');
    console.log('   建议手动升级为使用 App.useApp() 的方式');
    console.log('   参考：const { message } = App.useApp();');
  }
  
  return updatedContent;
}

/**
 * 升级单个文件
 */
function upgradeFile(filePath) {
  console.log(`\n🔧 正在升级文件: ${filePath}`);
  
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`❌ 文件不存在: ${filePath}`);
      return;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // 升级 Tabs 组件
    if (content.includes('TabPane')) {
      content = upgradeTabs(content);
    }
    
    // 升级 Message 组件
    content = upgradeMessage(content);
    
    // 如果内容有变化，写回文件
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ 文件升级完成: ${filePath}`);
    } else {
      console.log(`ℹ️  文件无需升级: ${filePath}`);
    }
    
  } catch (error) {
    console.error(`❌ 升级文件失败: ${filePath}`, error.message);
  }
}

/**
 * 主函数
 */
function main() {
  console.log('🚀 开始升级 Ant Design 组件...\n');
  
  // 检查是否在正确的目录
  if (!fs.existsSync('frontend/v2')) {
    console.error('❌ 请在项目根目录运行此脚本');
    process.exit(1);
  }
  
  // 升级所有文件
  filesToUpgrade.forEach(upgradeFile);
  
  console.log('\n🎉 升级完成！');
  console.log('\n📝 手动升级指南:');
  console.log('1. 将 <TabPane> 结构转换为 items 数组');
  console.log('2. 使用 App.useApp() 替代静态 message 方法');
  console.log('3. 检查 Breadcrumb 组件是否使用了 routes 属性');
  console.log('\n详细升级指南请参考 Ant Design 官方文档：');
  console.log('https://ant.design/components/tabs#api');
  console.log('https://ant.design/components/app');
}

// 运行主函数
main();

export {
  upgradeFile,
  upgradeTabs,
  upgradeMessage
}; 