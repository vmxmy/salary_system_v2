const fs = require('fs');
const path = require('path');

// Directory containing the PayrollDataModal components
const dir = 'src/components/PayrollDataModal';

// Get all .tsx files in the directory
const files = fs.readdirSync(dir).filter(file => file.endsWith('.tsx') && \!file.endsWith('.bak'));

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf-8');
  const originalContent = content;
  
  // Fix patterns like console.log({t('...')})
  content = content.replace(/console\.(log|error|warn)\(\{t\('([^']+)'\)\}/g, "console.$1(t('$2')");

  // Fix patterns like message.success({t('...')})
  content = content.replace(/message\.(success|error|warning|info)\(\{t\('([^']+)'\)\}/g, "message.$1(t('$2')");

  // Fix patterns like = {t('...')};
  content = content.replace(/= \{t\('([^']+)'\)\};/g, "= t('$1');");

  // Fix patterns like : {t('...')}
  content = content.replace(/: \{t\('([^']+)'\)\}/g, ": t('$1')");

  // Fix patterns like || {t('...')}
  content = content.replace(/\|\| \{t\('([^']+)'\)\}/g, "|| t('$1')");

  // Fix patterns like {t('...')} + string
  content = content.replace(/\{t\('([^']+)'\)\} \+/g, "t('$1') +");

  // Fix patterns like placeholder={t('...')}
  content = content.replace(/placeholder=\{t\('([^']+)'\)\}/g, "placeholder={t('$1')}");

  // Fix patterns like label={t('...')}
  content = content.replace(/label=\{t\('([^']+)'\)\}/g, "label={t('$1')}");

  // Fix patterns like title={t('...')}
  content = content.replace(/title=\{t\('([^']+)'\)\}/g, "title={t('$1')}");

  // Fix patterns in template literals
  content = content.replace(/\$\{t\('([^']+)'\)\}/g, "${t('$1')}");
  
  if (content \!== originalContent) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log('Fixed', file);
  }
});

console.log('Done fixing PayrollDataModal components');
