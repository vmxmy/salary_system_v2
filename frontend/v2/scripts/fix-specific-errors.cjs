const fs = require('fs');
const path = require('path');

// Function to fix specific file issues
function fixFile(filePath, fixType) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    switch (fixType) {
      case 'App.tsx':
        // Fix specific App.tsx issues
        content = content.replace(/^\s*const\s+debugOutput\s*=\s*\{[^}]*\}\s*;?\s*$/gm, '');
        content = content.replace(/^\s*[a-zA-Z_$][a-zA-Z0-9_$]*:\s*[^,\n]+,?\s*$/gm, '');
        changed = true;
        break;

      case 'I18nAppConfigProvider.tsx':
        // Fix orphaned object properties and broken syntax
        content = content.replace(/^\s*[a-zA-Z_$][a-zA-Z0-9_$]*:\s*[^,\n]+,?\s*$/gm, '');
        content = content.replace(/^\s*[a-zA-Z_$][a-zA-Z0-9_$]*:\s*\{[^}]*$/gm, '');
        content = content.replace(/^\s*\}[,\s]*$/gm, '');
        changed = true;
        break;

      case 'apiClient.ts':
        // Fix broken interceptor structure
        content = content.replace(/^\s*\}\s*\);?\s*$/gm, (match, offset) => {
          const before = content.substring(Math.max(0, offset - 200), offset);
          if (before.includes('interceptors') && !before.includes('return config')) {
            return '';
          }
          return match;
        });
        changed = true;
        break;

      case 'batchReports.ts':
        // Fix orphaned type definitions and object properties
        content = content.replace(/^\s*[a-zA-Z_$][a-zA-Z0-9_$]*:\s*[^;,\n]+[;,]?\s*$/gm, '');
        changed = true;
        break;

      case 'optimizedApi.ts':
        // Fix orphaned params objects
        content = content.replace(/^\s*params:\s*\{[^}]*\}\s*\);?\s*$/gm, '');
        changed = true;
        break;

      case 'permissions.ts':
        // Fix orphaned params objects
        content = content.replace(/^\s*params:\s*\{[^}]*\}\s*\);?\s*$/gm, '');
        changed = true;
        break;

      default:
        // Generic fixes for other files
        // Remove orphaned object properties
        content = content.replace(/^\s*[a-zA-Z_$][a-zA-Z0-9_$]*:\s*[^,\n]+,?\s*$/gm, '');
        // Remove orphaned closing braces
        content = content.replace(/^\s*\}\s*\);?\s*$/gm, '');
        // Remove orphaned params objects
        content = content.replace(/^\s*params:\s*\{[^}]*\}\s*\);?\s*$/gm, '');
        changed = true;
        break;
    }

    if (changed) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

// List of specific files that need fixing
const problematicFiles = [
  { path: 'src/App.tsx', type: 'App.tsx' },
  { path: 'src/I18nAppConfigProvider.tsx', type: 'I18nAppConfigProvider.tsx' },
  { path: 'src/api/apiClient.ts', type: 'apiClient.ts' },
  { path: 'src/api/batchReports.ts', type: 'batchReports.ts' },
  { path: 'src/api/batchReportsData.ts', type: 'default' },
  { path: 'src/api/optimizedApi.ts', type: 'optimizedApi.ts' },
  { path: 'src/api/permissions.ts', type: 'permissions.ts' },
  { path: 'src/api/personnelCategories.ts', type: 'default' },
  { path: 'src/api/positions.ts', type: 'default' },
  { path: 'src/api/reportConfigApi.ts', type: 'default' },
  { path: 'src/api/system.ts', type: 'default' },
  { path: 'src/api/types.ts', type: 'default' }
];

console.log('🔧 Fixing specific problematic files...');

let fixedCount = 0;
for (const file of problematicFiles) {
  const fullPath = path.join(__dirname, '..', file.path);
  if (fs.existsSync(fullPath)) {
    if (fixFile(fullPath, file.type)) {
      fixedCount++;
    }
  } else {
    console.log(`⏭️  File not found: ${file.path}`);
  }
}

console.log(`\n✨ Summary: Fixed ${fixedCount} files`);