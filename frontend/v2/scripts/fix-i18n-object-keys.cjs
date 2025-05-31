const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '../src');
const FILE_EXTS = ['.js', '.jsx', '.ts', '.tsx'];

// 匹配对象属性中的 {t('...')}: 替换为 [t('...')]:
const objectKeyRegex = /\{t\((['"`][^'"`]+['"`])\)\}:/g;
// 匹配单独一行的 {t('...')}, 或 {t('...')}
const singleLineRegex = /^\s*\{t\((['"`][^'"`]+['"`])\)\}[,]?\s*$/gm;

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // 替换对象属性
  content = content.replace(objectKeyRegex, (match, p1) => `[t(${p1})]:`);
  // 删除单独一行的 {t('...')}, 或 {t('...')}
  content = content.replace(singleLineRegex, '');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('✔️ 修复:', filePath);
  }
}

function walkDir(dir) {
  fs.readdirSync(dir).forEach(file => {
    const absPath = path.join(dir, file);
    if (fs.statSync(absPath).isDirectory()) {
      walkDir(absPath);
    } else if (FILE_EXTS.includes(path.extname(file))) {
      processFile(absPath);
    }
  });
}

walkDir(SRC_DIR);
console.log('✅ 全部修复完成！'); 