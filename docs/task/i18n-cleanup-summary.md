# i18n 国际化清理进度总结

> 更新时间: 2025-06-23  
> 目标: 清理和优化项目的国际化配置

## 总体进度

### 初始状态
- 硬编码中文文本: 631处
- 自动生成键名: 167个
- 中文空值翻译: 556个
- 英文空值翻译: 1178个

### 当前状态
- 硬编码中文文本: 478处 (已修复153处，24%)
- 自动生成键名: 0个 (已全部修复，100%)
- 中文空值翻译: 503个 (已填充53个)
- 英文空值翻译: 1138个 (已填充40个)

## 已完成工作

### 第一阶段：清理自动生成键名 ✅
- 分析了167个auto_开头的键名
- 全部替换为语义化键名
- 涉及48个源文件，167处引用
- 工具：`analyze-auto-keys.cjs`, `rename-auto-keys.cjs`

### 第二阶段：修复硬编码文本（进行中）
已完成的模块：
1. **组件模块** (179处)
   - BatchReportExport组件: 51处
   - FilterConfigPanel组件: 113处  
   - ReactQueryDebugger: 10处
   - API文件: 5处

2. **Admin配置模块** (93处)
   - ReportConfigManagement: 56处
   - ReportFieldManagement: 13处
   - ReportPresetManagement: 1处
   - ReportTypeManagement: 23处

3. **SimplePayroll模块** (部分)
   - QuickActions组件: 部分完成
   - PayrollDataModal: 已处理

### 第三阶段：补充空值翻译 ✅
- 填充了53个中文翻译
- 填充了40+个英文翻译
- 主要集中在common和simplePayroll命名空间

## 剩余工作

### 硬编码文本分布（478处）
1. **HRManagement员工页面** (~150处)
   - CreateEmployeePage.tsx
   - EditEmployeePage.tsx
   - EmployeeDetailPage.tsx

2. **Payroll工资模块** (~200处)
   - PayrollEntryDetailModal.tsx
   - WorkflowSteps组件
   - PayrollBulkImportPage组件

3. **其他组件** (~128处)
   - SmartCopyConfirmModal.tsx: 47处
   - 其他散布的组件

### 技术挑战
1. ProForm组件的label/placeholder属性需要特殊处理
2. 某些文件结构复杂，自动化工具难以处理
3. 需要保持组件的类型安全

## 使用的工具和脚本

### 已创建的脚本
1. `check-hardcoded-text.cjs` - 检测硬编码中文文本
2. `check-untranslated.cjs` - 检测未翻译的键
3. `analyze-auto-keys.cjs` - 分析自动生成的键名
4. `rename-auto-keys.cjs` - 批量重命名键名
5. `auto-i18n-replace-safe.cjs` - 安全替换硬编码文本
6. `fix-admin-i18n.cjs` - 专门处理Admin页面

### 执行命令
```bash
# 检查硬编码文本数量
node scripts/check-hardcoded-text.cjs | wc -l

# 自动替换硬编码文本
node scripts/auto-i18n-replace-safe.cjs [文件路径]

# 扫描并更新翻译文件
npm run i18n:scan
```

## 下一步计划

1. 继续处理HRManagement模块的硬编码文本
2. 处理Payroll模块的硬编码文本
3. 完成剩余的空值翻译填充
4. 统一翻译术语和风格
5. 全面测试所有页面的中英文显示

## 注意事项

- 保持向后兼容，不删除正在使用的键
- 每次修改后测试相关功能
- 遵循语义化的命名规范
- 保持中英文翻译同步
- 避免重复的翻译键