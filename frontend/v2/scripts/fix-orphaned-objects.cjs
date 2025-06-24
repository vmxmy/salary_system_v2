const fs = require('fs');
const path = require('path');

// Function to fix orphaned object literals and incomplete statements
function fixOrphanedObjects(content) {
  let fixed = content;
  let changesMade = false;

  // Pattern 1: Fix incomplete console.log statements with orphaned object literals
  // Look for patterns like:
  //   someVar: value,
  //   anotherVar: anotherValue
  // });
  const orphanedObjectPattern = /^\s*([a-zA-Z_$][a-zA-Z0-9_$]*:\s*[^,\n]+,?\s*\n)+\s*\}\);?\s*$/gm;
  
  fixed = fixed.replace(orphanedObjectPattern, (match) => {
    console.log('Found orphaned object literal:', match.substring(0, 100));
    changesMade = true;
    return ''; // Remove orphaned object literals
  });

  // Pattern 2: Fix incomplete console.log calls that are missing opening
  // Look for patterns like: :`, {
  const incompleteConsolePattern = /^\s*:\s*`,\s*\{[^}]*\}\s*\);?\s*$/gm;
  
  fixed = fixed.replace(incompleteConsolePattern, (match) => {
    console.log('Found incomplete console.log:', match.substring(0, 100));
    changesMade = true;
    return ''; // Remove incomplete console.log calls
  });

  // Pattern 3: Fix standalone object properties without context
  const standalonePropertyPattern = /^\s*[a-zA-Z_$][a-zA-Z0-9_$]*:\s*[^,\n]+,?\s*$/gm;
  
  fixed = fixed.replace(standalonePropertyPattern, (match, offset) => {
    // Check if this is part of a valid object literal
    const before = fixed.substring(Math.max(0, offset - 100), offset);
    const after = fixed.substring(offset + match.length, Math.min(fixed.length, offset + match.length + 100));
    
    // If it's not part of a valid object, remove it
    if (!before.includes('{') && !after.includes('}')) {
      console.log('Found standalone property:', match.trim());
      changesMade = true;
      return '';
    }
    
    return match;
  });

  // Pattern 4: Fix broken catch blocks and if statements
  const brokenCatchPattern = /\s*\}\s*catch\s*\(\s*error[^)]*\)\s*\{\s*$/gm;
  
  fixed = fixed.replace(brokenCatchPattern, (match) => {
    console.log('Found broken catch block:', match.trim());
    changesMade = true;
    return `${match}
    console.error('Error:', error);
  `;
  });

  // Pattern 5: Fix orphaned closing braces and parentheses
  const orphanedClosingPattern = /^\s*\}\s*\);?\s*$/gm;
  
  fixed = fixed.replace(orphanedClosingPattern, (match, offset) => {
    // Check if this closing brace has a matching opening
    const before = fixed.substring(Math.max(0, offset - 200), offset);
    const openBraces = (before.match(/\{/g) || []).length;
    const closeBraces = (before.match(/\}/g) || []).length;
    
    if (openBraces <= closeBraces) {
      console.log('Found orphaned closing brace:', match.trim());
      changesMade = true;
      return '';
    }
    
    return match;
  });

  // Pattern 6: Fix empty lines with just semicolons
  fixed = fixed.replace(/^\s*;\s*$/gm, '');
  
  return { fixed, changesMade };
}

// Function to process a file
function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const { fixed, changesMade } = fixOrphanedObjects(content);
    
    if (changesMade) {
      fs.writeFileSync(filePath, fixed, 'utf8');
      console.log(`✅ Fixed: ${filePath}`);
      return true;
    } else {
      console.log(`⏭️  No changes needed: ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Function to find TypeScript files
function findTypeScriptFiles(dir, files = []) {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      findTypeScriptFiles(fullPath, files);
    } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Main execution
const srcDir = path.join(__dirname, '..', 'src');
console.log('🔍 Finding TypeScript files...');
const files = findTypeScriptFiles(srcDir);

console.log(`📁 Found ${files.length} TypeScript files`);
console.log('🛠️  Processing files...');

let processedCount = 0;
let fixedCount = 0;

for (const file of files) {
  const wasFixed = processFile(file);
  processedCount++;
  if (wasFixed) fixedCount++;
}

console.log(`\n✨ Summary:`);
console.log(`📊 Processed: ${processedCount} files`);
console.log(`🔧 Fixed: ${fixedCount} files`);
console.log(`✅ Complete!`);