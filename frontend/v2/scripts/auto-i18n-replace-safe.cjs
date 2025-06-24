const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '../src');
const LOCALES_DIR = path.join(__dirname, '../public/locales');
const ZH_DIR = path.join(LOCALES_DIR, 'zh-CN');
const EN_DIR = path.join(LOCALES_DIR, 'en');
const FILE_EXTS = ['.js', '.jsx', '.ts', '.tsx'];
const CHINESE_REGEX = /[\u4e00-\u9fa5]/g;

// Command line arguments
const DRY_RUN = process.argv.includes('--dry-run');
const TARGET_FILE = process.argv.find(arg => arg.startsWith('--file='))?.replace('--file=', '');
const MAX_FILES = parseInt(process.argv.find(arg => arg.startsWith('--max='))?.replace('--max=', '') || '10');

// Statistics
let stats = {
  filesProcessed: 0,
  stringsReplaced: 0,
  filesChanged: 0,
  errors: []
};

// 命名空间推断规则
function guessNamespace(relPath) {
  const nsMap = [
    { dir: 'pages/Payroll/', ns: 'payroll' },
    { dir: 'pages/Admin/', ns: 'admin' },
    { dir: 'pages/HRManagement/', ns: 'hr' },
    { dir: 'pages/Employee/', ns: 'employee' },
    { dir: 'pages/Manager/', ns: 'manager' },
    { dir: 'pages/Dashboard/', ns: 'dashboard' },
    { dir: 'pages/SimplePayroll/', ns: 'simplePayroll' },
    { dir: 'components/', ns: 'components' },
    { dir: 'pages/', ns: 'common' },
    { dir: 'components/', ns: 'common' },
  ];
  for (const { dir, ns } of nsMap) {
    if (relPath.includes(dir)) return ns;
  }
  return 'common';
}

// 生成语义化的key
function genKey(text, type = 'auto') {
  // 常见UI文本的映射
  const commonMappings = {
    '请输入': 'placeholder_input',
    '请选择': 'placeholder_select',
    '确定': 'confirm',
    '取消': 'cancel',
    '保存': 'save',
    '删除': 'delete',
    '编辑': 'edit',
    '新建': 'create',
    '创建': 'create',
    '提交': 'submit',
    '搜索': 'search',
    '查询': 'query',
    '重置': 'reset',
    '返回': 'back',
    '关闭': 'close',
    '导出': 'export',
    '导入': 'import',
    '下载': 'download',
    '上传': 'upload',
    '加载中': 'loading',
    '暂无数据': 'no_data',
    '操作成功': 'operation_success',
    '操作失败': 'operation_failed',
  };

  // 先检查是否包含常见文本
  for (const [cn, en] of Object.entries(commonMappings)) {
    if (text.includes(cn)) {
      const suffix = text.replace(cn, '').replace(/[^\w\u4e00-\u9fa5]+/g, '_').toLowerCase();
      return suffix ? `${en}_${suffix}` : en;
    }
  }

  // 否则使用原来的逻辑
  let key = text.replace(/[^\w\u4e00-\u9fa5]+/g, '_').replace(/[\u4e00-\u9fa5]/g, '').toLowerCase();
  if (!key) key = 'text';
  return `${type}_${key}_${Buffer.from(text).toString('hex').slice(0, 6)}`;
}

function updateLocaleFile(ns, key, zh, en) {
  const zhFile = path.join(ZH_DIR, `${ns}.json`);
  const enFile = path.join(EN_DIR, `${ns}.json`);
  
  let zhObj = {};
  let enObj = {};
  
  try {
    if (fs.existsSync(zhFile)) zhObj = JSON.parse(fs.readFileSync(zhFile, 'utf8'));
    if (fs.existsSync(enFile)) enObj = JSON.parse(fs.readFileSync(enFile, 'utf8'));
  } catch (err) {
    stats.errors.push(`Error reading locale files for ${ns}: ${err.message}`);
    return;
  }
  
  if (!zhObj[key]) {
    zhObj[key] = zh;
    if (!DRY_RUN) {
      fs.writeFileSync(zhFile, JSON.stringify(zhObj, null, 2), 'utf8');
    }
  }
  
  if (!enObj[key]) {
    enObj[key] = en || '';
    if (!DRY_RUN) {
      fs.writeFileSync(enFile, JSON.stringify(enObj, null, 2), 'utf8');
    }
  }
}

function checkContext(content, match, index) {
  // Check if it's in a comment
  const lineStart = content.lastIndexOf('\n', index) + 1;
  const lineEnd = content.indexOf('\n', index);
  const line = content.substring(lineStart, lineEnd === -1 ? undefined : lineEnd);
  
  if (line.includes('//') && line.indexOf('//') < line.indexOf(match)) {
    return false; // Skip if in a comment
  }
  
  // Check if it's already in a t() function
  const before = content.substring(Math.max(0, index - 10), index);
  if (before.includes("t('") || before.includes('t("') || before.includes('t(`')) {
    return false;
  }
  
  return true;
}

function replaceInFile(filePath, relPath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  let changeCount = 0;
  let changes = [];
  
  // Check if file imports useTranslation
  const hasUseTranslation = content.includes('useTranslation');
  
  // Replace Chinese strings
  content = content.replace(/(["'`])([^"'`\n]*[\u4e00-\u9fa5][^"'`\n]*)\1/g, (match, quote, text, index) => {
    if (!checkContext(content, match, index)) {
      return match;
    }
    
    const ns = guessNamespace(relPath);
    const key = genKey(text);
    
    // Record the change
    changes.push({
      original: match,
      replacement: `{t('${ns}:${key}')}`,
      text: text,
      key: key,
      namespace: ns
    });
    
    updateLocaleFile(ns, key, text, ''); // English translation to be added manually
    changed = true;
    changeCount++;
    stats.stringsReplaced++;
    
    if (DRY_RUN) {
      return match; // Don't actually replace in dry run
    }
    
    return `{t('${ns}:${key}')}`;
  });
  
  if (changed) {
    stats.filesChanged++;
    
    if (DRY_RUN) {
      console.log(`\n📄 File: ${relPath}`);
      console.log(`   Found ${changeCount} Chinese strings:`);
      changes.forEach((change, i) => {
        console.log(`   ${i + 1}. "${change.text}" → ${change.namespace}:${change.key}`);
      });
    } else {
      // Create backup
      fs.copyFileSync(filePath, filePath + '.bak');
      
      // Add useTranslation import if needed
      if (!hasUseTranslation && changed) {
        if (content.includes('import React')) {
          content = content.replace(
            /import React[^;]*;/,
            `$&\nimport { useTranslation } from 'react-i18next';`
          );
        } else {
          content = `import { useTranslation } from 'react-i18next';\n` + content;
        }
        
        // Add const { t } = useTranslation() in component
        // This is a simplified version - might need manual adjustment
        const componentMatch = content.match(/(?:function|const)\s+\w+\s*(?:\([^)]*\))?\s*(?::\s*\w+\s*)?\s*(?:=>)?\s*{/);
        if (componentMatch) {
          const insertPos = componentMatch.index + componentMatch[0].length;
          content = content.slice(0, insertPos) + '\n  const { t } = useTranslation();\n' + content.slice(insertPos);
        }
      }
      
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Processed: ${relPath} (${changeCount} replacements)`);
    }
  }
}

function walkDir(dir, relDir) {
  if (stats.filesProcessed >= MAX_FILES && !TARGET_FILE) {
    return;
  }
  
  fs.readdirSync(dir).forEach(file => {
    const absPath = path.join(dir, file);
    const relPath = path.join(relDir, file);
    const stat = fs.statSync(absPath);
    
    if (stat.isDirectory() && !file.includes('node_modules') && !file.startsWith('.')) {
      walkDir(absPath, relPath);
    } else if (FILE_EXTS.includes(path.extname(file))) {
      if (TARGET_FILE) {
        if (relPath.includes(TARGET_FILE)) {
          stats.filesProcessed++;
          replaceInFile(absPath, relPath);
        }
      } else {
        stats.filesProcessed++;
        replaceInFile(absPath, relPath);
      }
    }
  });
}

console.log(`🚀 Starting i18n auto-replace ${DRY_RUN ? '(DRY RUN)' : '(LIVE)'}`);
console.log(`📁 Processing ${TARGET_FILE || `up to ${MAX_FILES} files`}...\n`);

walkDir(SRC_DIR, 'src');

console.log('\n📊 Summary:');
console.log(`   Files processed: ${stats.filesProcessed}`);
console.log(`   Files changed: ${stats.filesChanged}`);
console.log(`   Strings replaced: ${stats.stringsReplaced}`);

if (stats.errors.length > 0) {
  console.log('\n❌ Errors:');
  stats.errors.forEach(err => console.log(`   ${err}`));
}

if (DRY_RUN) {
  console.log('\n💡 This was a dry run. To apply changes, run without --dry-run flag.');
} else {
  console.log('\n✅ Auto i18n replacement completed. Check .bak files and translation files.');
}