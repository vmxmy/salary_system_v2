#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// 存储所有找到的 auto_ 键及其使用情况
const autoKeys = new Map();

// 查找所有需要处理的文件
function findFiles() {
  const srcFiles = glob.sync('src/**/*.{ts,tsx}', { ignore: ['node_modules/**', 'dist/**'] });
  const localeFiles = glob.sync('public/locales/**/*.json', { ignore: ['node_modules/**'] });
  return { srcFiles, localeFiles };
}

// 分析源代码文件中的 auto_ 键
function analyzeSourceFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const regex = /t\s*\(\s*['"`]([^:]+):((auto_text_|auto__|auto___)[^'"`]+)['"`]/g;
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    const namespace = match[1];
    const key = match[2];
    
    if (!autoKeys.has(key)) {
      autoKeys.set(key, {
        key,
        namespace: new Set(),
        usageFiles: [],
        translations: {}
      });
    }
    
    const keyInfo = autoKeys.get(key);
    keyInfo.namespace.add(namespace);
    keyInfo.usageFiles.push({
      file: filePath,
      line: content.substring(0, match.index).split('\n').length
    });
  }
}

// 分析翻译文件
function analyzeLocaleFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const json = JSON.parse(content);
    const locale = path.basename(path.dirname(filePath)); // 获取语言代码
    const namespace = path.basename(filePath, '.json'); // 获取命名空间
    
    Object.entries(json).forEach(([key, value]) => {
      if (key.startsWith('auto_text_') || key.startsWith('auto__') || key.startsWith('auto___')) {
        if (!autoKeys.has(key)) {
          autoKeys.set(key, {
            key,
            namespace: new Set([namespace]),
            usageFiles: [],
            translations: {}
          });
        }
        
        const keyInfo = autoKeys.get(key);
        keyInfo.translations[locale] = value;
      }
    });
  } catch (error) {
    console.error(`Error parsing ${filePath}:`, error.message);
  }
}

// 推荐新的键名
function suggestNewKeyName(key, translations) {
  const zhText = translations['zh-CN'] || '';
  const enText = translations['en'] || '';
  
  // 基于中文文本推荐键名
  const suggestions = {
    // 基础UI元素
    '名称': 'name',
    '年龄': 'age',
    '序号': 'serial_number',
    '编号': 'number',
    '保存': 'save',
    '保存修改': 'save_changes',
    '删除': 'delete',
    '删除成功': 'delete_success',
    '创建': 'create',
    '编辑': 'edit',
    '查看': 'view',
    '导出': 'export',
    '导出成功': 'export_success',
    '导入': 'import',
    '搜索': 'search',
    '重置': 'reset',
    '确认': 'confirm',
    '取消': 'cancel',
    '关闭': 'close',
    '提交': 'submit',
    '加载中': 'loading',
    '请选择': 'please_select',
    '必填': 'required',
    
    // 业务相关
    '工资': 'salary',
    '工资报表': 'salary_report',
    '基础工资': 'basic_salary',
    '岗位工资': 'position_salary',
    '奖励': 'reward',
    '扣除': 'deduction',
    '实发': 'actual_amount',
    '应发': 'gross_amount',
    '员工': 'employee',
    '部门': 'department',
    '职位': 'position',
    '基础信息': 'basic_info',
    '字段映射': 'field_mapping',
    
    // 时间相关
    '今天': 'today',
    '昨天': 'yesterday',
    '本周': 'this_week',
    '上周': 'last_week',
    '本月': 'this_month',
    '上月': 'last_month',
    '今年': 'this_year',
    '去年': 'last_year',
    
    // 状态相关
    '启用': 'enabled',
    '禁用': 'disabled',
    '公开': 'public',
    '私有': 'private',
    '正常': 'normal',
    '异常': 'abnormal',
    
    // 其他
    '中': 'medium',
    '高': 'high',
    '低': 'low',
  };
  
  // 检查是否包含模板变量
  if (zhText.includes('${') || zhText.includes('{{')) {
    // 处理模板字符串
    if (zhText.includes('共') && zhText.includes('条')) {
      return 'total_count';
    }
    if (zhText.includes('第') && zhText.includes('条')) {
      return 'pagination_info';
    }
    if (zhText.includes('成功导出')) {
      return 'export_success_detail';
    }
    if (zhText.includes('成功转换')) {
      return 'convert_success';
    }
    if (zhText.includes('解析错误')) {
      return 'parse_error';
    }
    if (zhText.includes('请选择')) {
      return 'please_select_type';
    }
  }
  
  // 检查后缀模式
  if (zhText.match(/^\s*\[(.+)\]\s*$/)) {
    const content = zhText.match(/^\s*\[(.+)\]\s*$/)[1];
    return content.toLowerCase() + '_suffix';
  }
  
  // 查找直接匹配
  for (const [pattern, suggestion] of Object.entries(suggestions)) {
    if (zhText === pattern) {
      return suggestion;
    }
  }
  
  // 如果没有找到，返回基于英文的建议
  if (enText) {
    return enText.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 30);
  }
  
  return null;
}

// 生成报告
function generateReport() {
  console.log('\n=== Auto Key Analysis Report ===\n');
  console.log(`Total auto_ keys found: ${autoKeys.size}\n`);
  
  // 创建Markdown报告
  let markdownReport = '# Auto Key Analysis Report\n\n';
  markdownReport += `Total auto_ keys found: ${autoKeys.size}\n\n`;
  markdownReport += '## Key Mappings\n\n';
  markdownReport += '| Current Key | Chinese | English | Suggested Key | Usage Count |\n';
  markdownReport += '|-------------|---------|---------|---------------|-------------|\n';
  
  const sortedKeys = Array.from(autoKeys.entries()).sort((a, b) => {
    return b[1].usageFiles.length - a[1].usageFiles.length;
  });
  
  const keyMappings = {};
  
  sortedKeys.forEach(([key, info]) => {
    const zhText = info.translations['zh-CN'] || '';
    const enText = info.translations['en'] || '';
    const suggestedKey = suggestNewKeyName(key, info.translations);
    const usageCount = info.usageFiles.length;
    
    if (suggestedKey) {
      keyMappings[key] = suggestedKey;
    }
    
    markdownReport += `| \`${key}\` | ${zhText} | ${enText} | ${suggestedKey || '❓'} | ${usageCount} |\n`;
    
    // 打印到控制台（只显示前20个）
    if (sortedKeys.indexOf([key, info]) < 20) {
      console.log(`Key: ${key}`);
      console.log(`  Chinese: ${zhText}`);
      console.log(`  English: ${enText}`);
      console.log(`  Suggested: ${suggestedKey || '(needs manual review)'}`);
      console.log(`  Usage: ${usageCount} times`);
      console.log('');
    }
  });
  
  // 保存Markdown报告
  fs.writeFileSync('auto-key-analysis.md', markdownReport);
  console.log('\nFull report saved to: auto-key-analysis.md');
  
  // 保存键映射JSON
  fs.writeFileSync('auto-key-mappings.json', JSON.stringify(keyMappings, null, 2));
  console.log('Key mappings saved to: auto-key-mappings.json');
}

// 主函数
function main() {
  const { srcFiles, localeFiles } = findFiles();
  
  console.log('Analyzing source files...');
  srcFiles.forEach(file => {
    analyzeSourceFile(file);
  });
  
  console.log('Analyzing locale files...');
  localeFiles.forEach(file => {
    analyzeLocaleFile(file);
  });
  
  generateReport();
}

// 运行脚本
main();