#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// 简单的Admin页面i18n修复脚本
const processFile = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  const replacements = [];

  // 检查是否已导入useTranslation
  const hasUseTranslation = content.includes('useTranslation');
  const hasTranslationHook = content.includes('const { t } = useTranslation');

  // 需要替换的中文文本映射
  const textToKey = {
    // ReportConfigManagement
    '报表编码': 'report_code',
    '请输入报表编码': 'placeholder_report_code',
    '报表名称': 'report_name',
    '请输入报表名称': 'placeholder_report_name',
    '例如: salary_summary': 'example_salary_summary',
    '例如: 薪资汇总表': 'example_salary_report',
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
    '选择操作符': 'placeholder_select_operator',
    '筛选值': 'filter_value',
    '无需设置值': 'no_value_needed',
    '输入多个值': 'input_multiple_values',
    '最小值': 'min_value',
    '最大值': 'max_value',
    '输入筛选值': 'input_filter_value',
    '选项': 'options',
    '条件描述（可选）': 'condition_description_optional',
    '生成器类名': 'generator_class',
    '例如: SalarySummaryGenerator': 'example_generator_class',
    '生成器模块': 'generator_module',
    '例如: services.report_generators': 'example_generator_module',
    '所需权限': 'required_permissions',
    '用逗号分隔，例如: report:view, salary:view': 'permissions_comma_separated',
    '允许的角色': 'allowed_roles',
    '用逗号分隔，例如: admin, hr_manager': 'roles_comma_separated',
    '模板配置 (JSON)': 'template_config_json',
    '默认配置 (JSON)': 'default_config_json',
    '验证规则 (JSON)': 'validation_rules_json',
    '报表代码': 'report_code_view',
    '类别': 'category',
    '状态': 'status',
    '描述': 'description',
    '使用次数': 'usage_count',
    '最后使用时间': 'last_used_time',
    '筛选状态': 'filter_status',
    '字段名': 'field_name',
    '例如: custom_field': 'example_custom_field',
    '显示名称': 'display_name',
    '例如: 自定义字段': 'example_custom_display',
    '字段别名': 'field_alias',
    '可选，用于数据库查询': 'optional_for_db_query',
    '字段类型': 'field_type',
    '选择字段类型': 'select_field_type',
    '数据类型': 'data_type',
    '选择数据类型': 'select_data_type',
    '字段描述': 'field_description',
    '请输入字段描述': 'placeholder_field_description',
    '可见': 'visible',
    '必填': 'required',
    '可排序': 'sortable',
    '可筛选': 'filterable',
    '格式配置 (JSON)': 'format_config_json',
    '样式配置 (JSON)': 'style_config_json'
  };

  // 替换label属性中的中文
  Object.entries(textToKey).forEach(([text, key]) => {
    const labelRegex = new RegExp(`label="${text}"`, 'g');
    const placeholderRegex = new RegExp(`placeholder="${text}"`, 'g');
    const messageRegex = new RegExp(`message: '${text}'`, 'g');
    
    // 替换label
    if (labelRegex.test(content)) {
      content = content.replace(labelRegex, `label={t('admin:${key}')}`);
      replacements.push({ text, key });
      modified = true;
    }
    
    // 替换placeholder
    if (placeholderRegex.test(content)) {
      content = content.replace(placeholderRegex, `placeholder={t('admin:${key}')}`);
      replacements.push({ text, key });
      modified = true;
    }
    
    // 替换message
    if (messageRegex.test(content)) {
      content = content.replace(messageRegex, `message: t('admin:${key}')`);
      replacements.push({ text, key });
      modified = true;
    }
  });

  // 如果有修改，添加必要的import和hook
  if (modified && !hasUseTranslation) {
    // 找到最后一个import语句
    const importMatch = content.match(/^(import[\s\S]*?from\s+['"][^'"]+['"];?\s*\n)+/m);
    if (importMatch) {
      const imports = importMatch[0];
      content = content.replace(imports, imports + "import { useTranslation } from 'react-i18next';\n");
    }
  }

  if (modified && !hasTranslationHook) {
    // 在组件函数开始处添加hook
    const componentMatch = content.match(/(const\s+\w+(?::\s*React\.FC(?:<[^>]+>)?)?)\s*=\s*\([^)]*\)\s*=>\s*{/);
    if (componentMatch) {
      const componentStart = componentMatch[0];
      content = content.replace(componentStart, componentStart + "\n  const { t } = useTranslation(['admin', 'common']);");
    }
  }

  return { content, modified, replacements };
};

// 更新翻译文件
const updateTranslations = (allReplacements) => {
  const zhPath = path.join(__dirname, '../public/locales/zh-CN/admin.json');
  const enPath = path.join(__dirname, '../public/locales/en/admin.json');
  
  // 确保目录存在
  const zhDir = path.dirname(zhPath);
  const enDir = path.dirname(enPath);
  
  if (!fs.existsSync(zhDir)) {
    fs.mkdirSync(zhDir, { recursive: true });
  }
  
  if (!fs.existsSync(enDir)) {
    fs.mkdirSync(enDir, { recursive: true });
  }
  
  let zhTranslations = {};
  let enTranslations = {};
  
  if (fs.existsSync(zhPath)) {
    zhTranslations = JSON.parse(fs.readFileSync(zhPath, 'utf8'));
  }
  
  if (fs.existsSync(enPath)) {
    enTranslations = JSON.parse(fs.readFileSync(enPath, 'utf8'));
  }
  
  // 去重
  const uniqueReplacements = [];
  const seen = new Set();
  
  allReplacements.forEach(({ text, key }) => {
    if (!seen.has(key)) {
      seen.add(key);
      uniqueReplacements.push({ text, key });
    }
  });
  
  uniqueReplacements.forEach(({ text, key }) => {
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
  const files = [
    'src/pages/Admin/Configuration/ReportConfigManagement.tsx',
    'src/pages/Admin/Configuration/ReportFieldManagement.tsx',
    'src/pages/Admin/Configuration/ReportPresetManagement.tsx',
    'src/pages/Admin/Configuration/ReportTypeManagement.tsx'
  ];
  
  let allReplacements = [];
  let filesModified = 0;
  
  files.forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    
    if (fs.existsSync(filePath)) {
      console.log(`\n处理文件: ${file}`);
      const { content, modified, replacements } = processFile(filePath);
      
      if (modified) {
        // 备份原文件
        fs.writeFileSync(filePath + '.bak', fs.readFileSync(filePath, 'utf8'));
        
        // 写入新文件
        fs.writeFileSync(filePath, content);
        
        console.log(`✅ 替换了 ${replacements.length} 处中文文本`);
        allReplacements = allReplacements.concat(replacements);
        filesModified++;
      } else {
        console.log('⏭️  未发现需要替换的中文文本');
      }
    } else {
      console.log(`❌ 文件不存在: ${file}`);
    }
  });
  
  if (allReplacements.length > 0) {
    updateTranslations(allReplacements);
    console.log(`\n📊 总计修改 ${filesModified} 个文件，替换 ${allReplacements.length} 处中文文本`);
    console.log('✅ 翻译文件已更新');
  }
};

main();