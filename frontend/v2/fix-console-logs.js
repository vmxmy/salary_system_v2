const fs = require('fs');

// Read the file
const filePath = 'src/pages/SimplePayroll/components/PayrollDataModal.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

// Fix patterns like console.log({t('...')})
content = content.replace(/console\.log\(\{t\('([^']+)'\)\}/g, "console.log(t('$1')");

// Fix patterns like console.error({t('...')})
content = content.replace(/console\.error\(\{t\('([^']+)'\)\}/g, "console.error(t('$1')");

// Fix patterns like validatedItem[key] = {t('...')};
content = content.replace(/= \{t\('([^']+)'\)\};/g, "= t('$1');");

// Fix patterns like : {t('...')}
content = content.replace(/: \{t\('([^']+)'\)\}/g, ": t('$1')");

// Fix patterns like || {t('...')}
content = content.replace(/\|\| \{t\('([^']+)'\)\}/g, "|| t('$1')");

// Fix patterns like {t('...')} at the end of template literals
content = content.replace(/\$\{t\('([^']+)'\)\}/g, "${t('$1')}");

// Fix patterns where {t('...')} appears in object keys
content = content.replace(/\[(result\.item as any)\]\[\{t\('([^']+)'\)\}\]/g, "[(result.item as any)[t('$1')]]");

// Fix console.log statements with multiple {t('...')} occurrences
content = content.replace(/console\.log\(\{t\('([^']+)'\)\}, ([^;]+)\);/g, "console.log(t('$1'), $2);");

// Write the fixed content back
fs.writeFileSync(filePath, content, 'utf-8');
console.log('Fixed console.log statements in PayrollDataModal.tsx');
