#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// 正则表达式匹配不完整的console.log模式
const incompleteConsoleLogPattern = /(\n\s*)([\w\s]+:\s*[\w\s\.\(\)'"]+,?\s*\n\s*)+\}\);/g;

// 修复函数
function fixIncompleteConsoleLogs(content) {
  let fixedContent = content;
  let matchCount = 0;

  // 查找所有匹配的模式
  const matches = [...content.matchAll(incompleteConsoleLogPattern)];
  
  matches.forEach(match => {
    const originalText = match[0];
    
    // 检查前面是否已经有console.log
    const beforeMatch = content.substring(Math.max(0, match.index - 50), match.index);
    if (!beforeMatch.includes('console.log')) {
      // 添加console.log
      const fixedText = originalText.replace(/(\n\s*)/, '$1console.log(\'DEBUG:\', {$1');
      fixedContent = fixedContent.replace(originalText, fixedText);
      matchCount++;
    }
  });

  return { fixedContent, matchCount };
}

// 处理文件
function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const { fixedContent, matchCount } = fixIncompleteConsoleLogs(content);
    
    if (matchCount > 0) {
      fs.writeFileSync(filePath, fixedContent, 'utf8');
      console.log(`✅ Fixed ${matchCount} incomplete console.log statements in: ${filePath}`);
      return true;
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
  return false;
}

// 主函数
function main() {
  const files = glob.sync('src/**/*.{ts,tsx,js,jsx}', {
    ignore: ['**/node_modules/**', '**/dist/**', '**/build/**']
  });

  console.log(`🔍 Checking ${files.length} files for incomplete console.log statements...`);
  
  let fixedFiles = 0;
  files.forEach(file => {
    if (processFile(file)) {
      fixedFiles++;
    }
  });

  console.log(`\n✨ Fixed ${fixedFiles} files with incomplete console.log statements.`);
}

// 运行脚本
main();