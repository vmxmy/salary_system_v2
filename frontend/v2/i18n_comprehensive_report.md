# i18n 国际化全面检测报告

## 检测时间
2025-06-23

## 检测结果摘要

### 1. 硬编码文本检测
- **发现硬编码中文文本**: 631 处
- **主要集中在以下文件**:
  - BatchReportExport 组件
  - PayrollDataModal 组件
  - Admin 配置页面
  - Organization 管理页面
  
### 2. 未翻译键值检测
- **中文未翻译键值**: 423 个
- **英文未翻译键值**: 1184 个

### 3. 主要问题分类

#### 3.1 自动生成的键值（需要清理）
大量以 `auto_` 开头的键值，这些是工具自动生成的，需要手动重命名为有意义的键名：
- `auto_text_e4baa7`
- `auto____e68ab1`
- 等等...

#### 3.2 硬编码的表单标签和占位符
大量表单相关的文本未使用 i18n：
- `label="任务名称"`
- `placeholder="请输入任务名称"`
- `label="薪资周期"`
- 等等...

#### 3.3 未完整翻译的命名空间
以下命名空间有大量未翻译的键：
- **employee**: 120+ 个未翻译键
- **payroll**: 200+ 个未翻译键
- **common**: 100+ 个未翻译键
- **dashboard**: 40+ 个未翻译键

## 建议修复方案

### 1. 立即修复（高优先级）
1. **清理自动生成的键值**
   - 将所有 `auto_` 开头的键重命名为有意义的名称
   - 例如：`auto_text_e4baa7` → `employee_name`

2. **修复硬编码文本**
   - 使用 `auto-i18n-replace.cjs` 工具自动替换
   - 手动检查并确认替换结果

3. **补充缺失的翻译**
   - 为所有空值的键提供翻译
   - 确保中英文对应的键值一致

### 2. 中期改进（中优先级）
1. **组件级别的 i18n 优化**
   - 为复杂组件创建独立的翻译文件
   - 例如：`PayrollDataModal.json`

2. **统一翻译风格**
   - 建立翻译术语表
   - 确保相同概念使用相同的翻译

3. **添加翻译测试**
   - 创建自动化测试确保没有遗漏的键
   - 定期运行 i18n 检查脚本

### 3. 长期优化（低优先级）
1. **实施翻译管理流程**
   - 使用专业的翻译管理工具
   - 建立翻译审核机制

2. **优化翻译加载**
   - 按需加载翻译文件
   - 减少初始加载体积

## 具体文件修复清单

### 需要立即修复的文件（前10个）
1. `/src/components/BatchReportExport/BatchReportExportV2.tsx` - 24处硬编码
2. `/src/components/PayrollDataModal/FilterConfigPanel.tsx` - 12处硬编码
3. `/src/pages/Admin/Configuration/ReportConfigManagement.tsx` - 143处硬编码
4. `/src/pages/Admin/Organization/ActualPositionPageV2.tsx` - 20处硬编码
5. `/src/pages/Admin/Organization/JobPositionLevelPageV2.tsx` - 20处硬编码
6. `/src/pages/Admin/Organization/PersonnelCategoriesPageV2.tsx` - 32处硬编码
7. `/src/pages/Payroll/pages/PayrollBulkImportPage/ImportReviewStep.tsx` - 29处硬编码
8. `/src/pages/HRManagement/employees/partials/BasicInfoTab.tsx` - 16处硬编码
9. `/src/pages/Payroll/components/PayrollEntryFormModal.tsx` - 14处硬编码
10. `/src/pages/SimplePayroll/SimplePayrollPageModern.tsx` - 18处硬编码

## 执行步骤

### 第一步：运行自动修复工具
```bash
# 自动替换硬编码文本
node scripts/auto-i18n-replace.cjs

# 重新扫描翻译文件
npm run i18n:scan
```

### 第二步：手动补充翻译
1. 打开 `public/locales/zh-CN/*.json` 文件
2. 搜索所有空值 (`""`) 的键
3. 提供相应的中文翻译

### 第三步：同步英文翻译
1. 确保英文翻译文件有相同的键
2. 提供对应的英文翻译

### 第四步：测试验证
1. 切换语言测试所有页面
2. 确保没有显示翻译键而不是文本
3. 运行 E2E 测试验证功能正常

## 总结

当前项目的 i18n 实施度约为 **60%**，主要问题集中在：
1. 大量硬编码的中文文本
2. 自动生成的无意义键名
3. 翻译文件中的空值

建议分阶段进行修复，优先处理用户可见的硬编码文本，然后逐步完善翻译体系。