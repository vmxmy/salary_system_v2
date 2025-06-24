const fs = require('fs');
const path = require('path');
const babel = require('@babel/core');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;
const t = require('@babel/types');

// Admin页面的特殊i18n替换脚本
const processAdminFile = (filePath) => {
  const code = fs.readFileSync(filePath, 'utf8');
  
  // 检查是否已经导入了useTranslation
  const hasUseTranslation = code.includes('useTranslation');
  
  let ast;
  try {
    ast = parser.parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript']
    });
  } catch (error) {
    console.error(`解析文件失败: ${filePath}`, error.message);
    return { modified: false, code };
  }

  let modified = false;
  const replacements = [];

  // 遍历AST查找需要替换的中文文本
  traverse(ast, {
    JSXAttribute(path) {
      const attrName = path.node.name.name;
      
      // 处理label和placeholder属性
      if (['label', 'placeholder', 'message'].includes(attrName)) {
        const value = path.node.value;
        
        if (t.isStringLiteral(value)) {
          const text = value.value;
          
          // 检查是否包含中文
          if (/[\u4e00-\u9fa5]/.test(text)) {
            // 生成翻译key
            const key = generateKey(text, 'admin');
            
            // 替换为t函数调用
            path.node.value = t.jsxExpressionContainer(
              t.callExpression(
                t.identifier('t'),
                [t.stringLiteral(`admin:${key}`)]
              )
            );
            
            replacements.push({ text, key, namespace: 'admin' });
            modified = true;
          }
        }
      }
    },
    
    // 处理rules中的message
    ObjectProperty(path) {
      if (path.node.key.name === 'message' && t.isStringLiteral(path.node.value)) {
        const text = path.node.value.value;
        
        if (/[\u4e00-\u9fa5]/.test(text)) {
          const key = generateKey(text, 'admin');
          
          path.node.value = t.callExpression(
            t.identifier('t'),
            [t.stringLiteral(`admin:${key}`)]
          );
          
          replacements.push({ text, key, namespace: 'admin' });
          modified = true;
        }
      }
    }
  });

  if (modified) {
    // 添加useTranslation导入
    if (!hasUseTranslation) {
      const importDeclaration = t.importDeclaration(
        [t.importSpecifier(t.identifier('useTranslation'), t.identifier('useTranslation'))],
        t.stringLiteral('react-i18next')
      );
      
      // 找到最后一个import语句的位置
      let lastImportIndex = 0;
      ast.program.body.forEach((node, index) => {
        if (t.isImportDeclaration(node)) {
          lastImportIndex = index;
        }
      });
      
      ast.program.body.splice(lastImportIndex + 1, 0, importDeclaration);
    }
    
    // 添加useTranslation hook
    traverse(ast, {
      FunctionDeclaration(path) {
        if (path.node.id && path.node.id.name.includes('Component')) {
          addUseTranslationHook(path);
        }
      },
      VariableDeclarator(path) {
        if (path.node.id.name && path.node.init && 
            (t.isArrowFunctionExpression(path.node.init) || t.isFunctionExpression(path.node.init))) {
          addUseTranslationHook(path.get('init'));
        }
      }
    });
    
    const output = generate(ast, {}, code);
    return { modified: true, code: output.code, replacements };
  }
  
  return { modified: false, code };
};

const addUseTranslationHook = (funcPath) => {
  const body = funcPath.node.body.body;
  if (!body) return;
  
  // 检查是否已有useTranslation
  const hasHook = body.some(stmt => {
    if (t.isVariableDeclaration(stmt)) {
      return stmt.declarations.some(decl => {
        return decl.init && t.isCallExpression(decl.init) && 
               decl.init.callee.name === 'useTranslation';
      });
    }
    return false;
  });
  
  if (!hasHook) {
    const hookCall = t.variableDeclaration('const', [
      t.variableDeclarator(
        t.objectPattern([
          t.objectProperty(t.identifier('t'), t.identifier('t'), false, true)
        ]),
        t.callExpression(
          t.identifier('useTranslation'),
          [t.arrayExpression([t.stringLiteral('admin'), t.stringLiteral('common')])]
        )
      )
    ]);
    
    body.unshift(hookCall);
  }
};

const generateKey = (text, namespace) => {
  // 生成语义化的key
  const cleanText = text
    .replace(/[：:]/g, '')
    .replace(/[（(][^）)]*[）)]/g, '')
    .trim();
  
  // 常见映射
  const keyMap = {
    '报表编码': 'report_code',
    '报表名称': 'report_name',
    '请输入报表编码': 'placeholder_report_code',
    '请输入报表名称': 'placeholder_report_name',
    '报表分类': 'report_category',
    '选择或输入分类': 'placeholder_select_category',
    '排序顺序': 'sort_order',
    '报表描述': 'report_description',
    '请输入报表的详细描述': 'placeholder_report_description',
    '是否启用': 'is_active',
    '系统内置': 'is_system',
    '数据源': 'data_source',
    '请选择数据源': 'placeholder_select_datasource',
    '可用字段': 'available_fields',
    '选择要添加的字段': 'placeholder_select_fields',
    '启用筛选': 'enable_filter',
    '字段': 'field',
    '选择字段': 'placeholder_select_field',
    '操作符': 'operator',
    '选择操作符': 'placeholder_select_operator'
  };
  
  return keyMap[cleanText] || `auto_${cleanText.substring(0, 20).replace(/\s+/g, '_')}`;
};

// 更新翻译文件
const updateTranslations = (replacements) => {
  const zhPath = path.join(__dirname, '../public/locales/zh-CN/admin.json');
  const enPath = path.join(__dirname, '../public/locales/en/admin.json');
  
  let zhTranslations = {};
  let enTranslations = {};
  
  if (fs.existsSync(zhPath)) {
    zhTranslations = JSON.parse(fs.readFileSync(zhPath, 'utf8'));
  }
  
  if (fs.existsSync(enPath)) {
    enTranslations = JSON.parse(fs.readFileSync(enPath, 'utf8'));
  }
  
  replacements.forEach(({ text, key }) => {
    if (!zhTranslations[key]) {
      zhTranslations[key] = text;
    }
    if (!enTranslations[key]) {
      enTranslations[key] = ''; // 留空，稍后手动翻译
    }
  });
  
  fs.writeFileSync(zhPath, JSON.stringify(zhTranslations, null, 2) + '\n');
  fs.writeFileSync(enPath, JSON.stringify(enTranslations, null, 2) + '\n');
};

// 主函数
const main = () => {
  const adminDir = path.join(__dirname, '../src/pages/Admin');
  const files = [
    'Configuration/ReportConfigManagement.tsx',
    'Configuration/ReportFieldManagement.tsx',
    'Configuration/ReportPresetManagement.tsx',
    'Configuration/ReportTypeManagement.tsx'
  ];
  
  let totalReplacements = [];
  
  files.forEach(file => {
    const filePath = path.join(adminDir, file);
    
    if (fs.existsSync(filePath)) {
      console.log(`\n处理文件: ${file}`);
      const result = processAdminFile(filePath);
      
      if (result.modified) {
        // 备份原文件
        fs.writeFileSync(filePath + '.bak', fs.readFileSync(filePath, 'utf8'));
        
        // 写入新文件
        fs.writeFileSync(filePath, result.code);
        
        console.log(`✅ 替换了 ${result.replacements.length} 处中文文本`);
        totalReplacements = totalReplacements.concat(result.replacements);
      } else {
        console.log('⏭️  未发现需要替换的中文文本');
      }
    }
  });
  
  if (totalReplacements.length > 0) {
    updateTranslations(totalReplacements);
    console.log(`\n📊 总计替换 ${totalReplacements.length} 处中文文本`);
    console.log('✅ 翻译文件已更新');
  }
};

main();