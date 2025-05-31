const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '../src');
const OUTPUT_FILE = path.join(__dirname, '../i18n_errors_hardcoded.txt');
const CHINESE_REGEX = /[\u4e00-\u9fa5]/;
const TAGS_REGEX = /<(th|td|label)[^>]*>|label\s*=|placeholder\s*=/i;
const FILE_EXTS = ['.js', '.jsx', '.ts', '.tsx'];

function scanFile(filePath, relPath, results) {
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  lines.forEach((line, idx) => {
    if (CHINESE_REGEX.test(line) && TAGS_REGEX.test(line)) {
      results.push(`${relPath}:${idx + 1}: ${line.trim()}`);
    }
  });
}

function walkDir(dir, relDir, results) {
  fs.readdirSync(dir).forEach(file => {
    const absPath = path.join(dir, file);
    const relPath = path.join(relDir, file);
    const stat = fs.statSync(absPath);
    if (stat.isDirectory()) {
      walkDir(absPath, relPath, results);
    } else if (FILE_EXTS.includes(path.extname(file))) {
      scanFile(absPath, relPath, results);
    }
  });
}

function main() {
  const results = [];
  walkDir(SRC_DIR, 'src', results);
  if (results.length) {
    fs.writeFileSync(OUTPUT_FILE, results.join('\n'), 'utf8');
    console.log(`共发现 ${results.length} 处硬编码中文UI文本，详情见 i18n_errors_hardcoded.txt`);
    results.forEach(r => console.log(r));
  } else {
    console.log('未发现硬编码中文UI文本。');
  }
}

main(); 