#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// 匹配console.log语句的正则表达式
const consoleLogPatterns = [
  // 单行console.log
  /console\.(log|info|warn|error|debug)\([^;]*\);?\s*$/gm,
  // 多行console.log
  /console\.(log|info|warn|error|debug)\s*\([^)]*\{[\s\S]*?\}\s*\);?/gm,
  // 带有模板字符串的console.log
  /console\.(log|info|warn|error|debug)\s*\(`[\s\S]*?`\);?/gm,
  // 不完整的console.log对象（您遇到的问题）
  /^\s*{\s*\n(\s*\w+:\s*[^,\n]+,?\s*\n)+\s*}\s*\);?$/gm,
  // 只有对象属性的行（可能是console.log的一部分）
  /^\s*\w+:\s*[^,\n]+,?\s*$/gm
];

// 清理console.log语句
function removeConsoleLogs(content) {
  let cleanedContent = content;
  let totalRemoved = 0;

  // 先处理多行console.log
  const multiLinePattern = /console\.(log|info|warn|error|debug)\s*\([^{]*\{[\s\S]*?\}\s*\);?/gm;
  const multiLineMatches = [...content.matchAll(multiLinePattern)];
  
  multiLineMatches.forEach(match => {
    cleanedContent = cleanedContent.replace(match[0], '');
    totalRemoved++;
  });

  // 处理单行console.log
  const singleLinePattern = /console\.(log|info|warn|error|debug)\s*\([^;]*\);?\s*$/gm;
  const singleLineMatches = [...cleanedContent.matchAll(singleLinePattern)];
  
  singleLineMatches.forEach(match => {
    cleanedContent = cleanedContent.replace(match[0], '');
    totalRemoved++;
  });

  // 处理不完整的console.log（您遇到的问题）
  // 查找孤立的对象字面量后跟 });
  const incompletePattern = /(\n\s*)([\w\s]+:\s*[^,\n]+,?\s*\n\s*)+\}\);/g;
  const incompleteMatches = [...cleanedContent.matchAll(incompletePattern)];
  
  incompleteMatches.forEach(match => {
    // 检查前面是否没有console.log
    const beforeMatch = cleanedContent.substring(Math.max(0, match.index - 100), match.index);
    if (!beforeMatch.includes('console.') && !beforeMatch.includes('return') && !beforeMatch.includes('=')) {
      cleanedContent = cleanedContent.replace(match[0], '');
      totalRemoved++;
    }
  });

  // 清理多余的空行
  cleanedContent = cleanedContent.replace(/\n\s*\n\s*\n/g, '\n\n');

  return { cleanedContent, totalRemoved };
}

// 处理单个文件
function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const { cleanedContent, totalRemoved } = removeConsoleLogs(content);
    
    if (totalRemoved > 0) {
      fs.writeFileSync(filePath, cleanedContent, 'utf8');
      console.log(`✅ Removed ${totalRemoved} console statements from: ${filePath}`);
      return totalRemoved;
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
  return 0;
}

// 主函数
function main() {
  const args = process.argv.slice(2);
  const targetPath = args[0] || 'src/**/*.{ts,tsx,js,jsx}';
  
  console.log(`🔍 Searching for console.log statements in: ${targetPath}`);
  
  const files = glob.sync(targetPath, {
    ignore: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/*.test.*', '**/*.spec.*']
  });

  console.log(`📁 Found ${files.length} files to process...`);
  
  let totalFiles = 0;
  let totalStatements = 0;
  
  files.forEach(file => {
    const removed = processFile(file);
    if (removed > 0) {
      totalFiles++;
      totalStatements += removed;
    }
  });

  console.log(`\n✨ Summary:`);
  console.log(`   - Processed ${files.length} files`);
  console.log(`   - Modified ${totalFiles} files`);
  console.log(`   - Removed ${totalStatements} console statements`);
}

// 运行脚本
if (require.main === module) {
  main();
}