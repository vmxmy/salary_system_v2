const fs = require('fs');
const path = require('path');

function checkFile(filePath) {
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const untranslated = [];
  function walk(obj, prefix = '') {
    for (const [k, v] of Object.entries(obj)) {
      const keyPath = prefix ? `${prefix}.${k}` : k;
      if (typeof v === 'string') {
        if (v === k || v === '' || v == null) {
          untranslated.push(keyPath);
        }
      } else if (typeof v === 'object' && v !== null) {
        walk(v, keyPath);
      }
    }
  }
  walk(data);
  return untranslated;
}

function checkLocaleDir(localeDir) {
  fs.readdirSync(localeDir).forEach(file => {
    if (file.endsWith('.json')) {
      const filePath = path.join(localeDir, file);
      try {
        const result = checkFile(filePath);
        if (result.length) {
          console.log(`\n未翻译 key (${localeDir}/${file}):`);
          result.forEach(k => console.log('  -', k));
        }
      } catch (e) {
        console.error(`解析失败: ${filePath}`, e.message);
      }
    }
  });
}

['./public/locales/zh-CN', './public/locales/en'].forEach(checkLocaleDir); 