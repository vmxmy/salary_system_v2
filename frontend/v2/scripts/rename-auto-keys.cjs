#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// 从文件加载映射表
let keyMappings = {};
try {
  keyMappings = require('../auto-key-mappings.json');
} catch (err) {
  console.error('Error loading auto-key-mappings.json:', err.message);
  console.log('Using default mappings...');
  
  // 默认映射表
  keyMappings = {
    // 常见的UI文本
    'auto_text_e896aa': 'export_success',
    'auto_text_e69cac': 'this_week',
    'auto__total__e585b1': 'total_count',
    'auto_text_e588a0': 'delete_success',
    'auto_text_e4bb8a': 'today',
    'auto_text_e58ebb': 'last_year',
    'auto__range_0_range_1___total__e7acac': 'pagination_info',
    'auto_text_e4bf9d': 'save',
    'auto__err_message__e8a7a3': 'parse_error',
    'auto____205be6': 'income_suffix',
    'auto_text_e9ab98': 'high',
    'auto_text_e698a8': 'yesterday',
    'auto_text_e4b8ad': 'medium',
    'auto__exportdata_length__format_touppercase__e68890': 'export_success_detail',
    'auto__lookuptype__e8afb7': 'please_select_type',
    'auto_text_e5ba94': 'gross_amount',
    'auto_text_e5ba8f': 'serial_number',
    'auto_text_e5ad97': 'field_mapping',
    'auto____205be5': 'basic_suffix',
    'auto_text_e5afbc': 'export_success',
    'auto_text_e983a8': 'department',
    'auto_text_e4bd8e': 'low',
  };
}

// 查找所有需要处理的文件
function findFiles() {
  const srcFiles = glob.sync('src/**/*.{ts,tsx}', { 
    ignore: ['node_modules/**', 'dist/**'],
    nodir: true // 确保只匹配文件，不匹配目录
  });
  const localeFiles = glob.sync('public/locales/**/*.json', { 
    ignore: ['node_modules/**', '**/translation.json'], // 忽略目录类型的 translation.json
    nodir: true // 确保只匹配文件，不匹配目录
  });
  return { srcFiles, localeFiles };
}

// 读取文件内容
function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf-8');
}

// 写入文件
function writeFile(filePath, content) {
  fs.writeFileSync(filePath, content, 'utf-8');
}

// 替换源代码中的键
function replaceInSourceCode(content, keyMap) {
  let updatedContent = content;
  let replacements = 0;
  
  for (const [oldKey, newKey] of Object.entries(keyMap)) {
    // 匹配 t('namespace:auto_key') 或 t("namespace:auto_key")
    const regex = new RegExp(`(['"\`])([^:]+):${oldKey}\\1`, 'g');
    const beforeLength = updatedContent.length;
    updatedContent = updatedContent.replace(regex, `$1$2:${newKey}$1`);
    if (updatedContent.length !== beforeLength) {
      replacements++;
    }
  }
  
  return { content: updatedContent, replacements };
}

// 替换JSON文件中的键
function replaceInJSON(content, keyMap) {
  try {
    const json = JSON.parse(content);
    let replacements = 0;
    const newJson = {};
    
    for (const [key, value] of Object.entries(json)) {
      if (keyMap[key]) {
        newJson[keyMap[key]] = value;
        replacements++;
      } else {
        newJson[key] = value;
      }
    }
    
    return { 
      content: JSON.stringify(newJson, null, 2), 
      replacements 
    };
  } catch (error) {
    console.error('Error parsing JSON:', error);
    return { content, replacements: 0 };
  }
}

// 生成报告
function generateReport(results) {
  console.log('\n=== Auto Key Rename Report ===\n');
  
  let totalReplacements = 0;
  
  console.log('Source Files:');
  results.sourceFiles.forEach(({ file, replacements }) => {
    if (replacements > 0) {
      console.log(`  ${file}: ${replacements} replacements`);
      totalReplacements += replacements;
    }
  });
  
  console.log('\nLocale Files:');
  results.localeFiles.forEach(({ file, replacements }) => {
    if (replacements > 0) {
      console.log(`  ${file}: ${replacements} replacements`);
      totalReplacements += replacements;
    }
  });
  
  console.log(`\nTotal replacements: ${totalReplacements}`);
}

// 主函数
function main() {
  const dryRun = process.argv.includes('--dry-run');
  
  if (dryRun) {
    console.log('Running in dry-run mode. No files will be modified.\n');
  }
  
  const { srcFiles, localeFiles } = findFiles();
  const results = {
    sourceFiles: [],
    localeFiles: []
  };
  
  // 处理源代码文件
  console.log('Processing source files...');
  srcFiles.forEach(file => {
    const content = readFile(file);
    const { content: updatedContent, replacements } = replaceInSourceCode(content, keyMappings);
    
    if (replacements > 0) {
      if (!dryRun) {
        writeFile(file, updatedContent);
      }
      results.sourceFiles.push({ file, replacements });
    }
  });
  
  // 处理翻译文件
  console.log('Processing locale files...');
  localeFiles.forEach(file => {
    const content = readFile(file);
    const { content: updatedContent, replacements } = replaceInJSON(content, keyMappings);
    
    if (replacements > 0) {
      if (!dryRun) {
        writeFile(file, updatedContent);
      }
      results.localeFiles.push({ file, replacements });
    }
  });
  
  // 生成报告
  generateReport(results);
  
  if (dryRun) {
    console.log('\nTo apply changes, run without --dry-run flag.');
  }
}

// 运行脚本
main();