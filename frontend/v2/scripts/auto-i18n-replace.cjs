const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '../src');
const LOCALES_DIR = path.join(__dirname, '../public/locales');
const ZH_DIR = path.join(LOCALES_DIR, 'zh-CN');
const EN_DIR = path.join(LOCALES_DIR, 'en');
const FILE_EXTS = ['.js', '.jsx', '.ts', '.tsx'];
const CHINESE_REGEX = /[\u4e00-\u9fa5]/g;

// 命名空间推断规则
function guessNamespace(relPath) {
  const nsMap = [
    { dir: 'pages/Payroll/', ns: 'payroll' },
    { dir: 'pages/Admin/', ns: 'admin' },
    { dir: 'pages/HRManagement/', ns: 'hr' },
    { dir: 'pages/Employee/', ns: 'employee' },
    { dir: 'pages/Manager/', ns: 'manager' },
    { dir: 'pages/Dashboard/', ns: 'dashboard' },
    { dir: 'components/', ns: 'components' },
    { dir: 'pages/', ns: 'common' },
    { dir: 'components/', ns: 'common' },
  ];
  for (const { dir, ns } of nsMap) {
    if (relPath.includes(dir)) return ns;
  }
  return 'common';
}

// 生成key，避免重复
function genKey(text, type = 'auto') {
  let key = text.replace(/[^\w\u4e00-\u9fa5]+/g, '_').replace(/[\u4e00-\u9fa5]/g, '').toLowerCase();
  if (!key) key = 'text';
  return `${type}_${key}_${Buffer.from(text).toString('hex').slice(0, 6)}`;
}

function updateLocaleFile(ns, key, zh, en) {
  const zhFile = path.join(ZH_DIR, `${ns}.json`);
  const enFile = path.join(EN_DIR, `${ns}.json`);
  let zhObj = {};
  let enObj = {};
  if (fs.existsSync(zhFile)) zhObj = JSON.parse(fs.readFileSync(zhFile, 'utf8'));
  if (fs.existsSync(enFile)) enObj = JSON.parse(fs.readFileSync(enFile, 'utf8'));
  if (!zhObj[key]) zhObj[key] = zh;
  if (!enObj[key]) enObj[key] = en || '';
  fs.writeFileSync(zhFile, JSON.stringify(zhObj, null, 2), 'utf8');
  fs.writeFileSync(enFile, JSON.stringify(enObj, null, 2), 'utf8');
}

function replaceInFile(filePath, relPath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  content = content.replace(/(["'`])([^"'`\n]*[\u4e00-\u9fa5][^"'`\n]*)\1/g, (match, quote, text) => {
    const ns = guessNamespace(relPath);
    const key = genKey(text);
    updateLocaleFile(ns, key, text, text); // 英文默认同中文，后续人工翻译
    changed = true;
    return `{t('${ns}:${key}')}`;
  });
  if (changed) {
    fs.copyFileSync(filePath, filePath + '.bak');
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`已处理: ${relPath}`);
  }
}

function walkDir(dir, relDir) {
  fs.readdirSync(dir).forEach(file => {
    const absPath = path.join(dir, file);
    const relPath = path.join(relDir, file);
    const stat = fs.statSync(absPath);
    if (stat.isDirectory()) {
      walkDir(absPath, relPath);
    } else if (FILE_EXTS.includes(path.extname(file))) {
      replaceInFile(absPath, relPath);
    }
  });
}

walkDir(SRC_DIR, 'src');
console.log('全量自动i18n替换完成。请检查.bak备份和翻译文件。'); 