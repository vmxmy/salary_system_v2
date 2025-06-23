# i18n 国际化清理任务追踪

> 创建时间: 2025-06-23  
> 目标: 将项目 i18n 完成度从 60% 提升到 95%+

## 任务概览

### 阶段一：清理自动生成的键名 (预计 2 天)

#### common.json - 自动生成键清理
- [ ] `auto____e68ab1` → `?` (需要查看使用场景)
- [ ] `auto_text_e4baa7` → `?`
- [ ] `auto_text_e4baba` → `?`
- [ ] `auto_text_e4bbaa` → `?`
- [ ] `auto_text_e4bc91` → `?`
- [ ] `auto_text_e585a8` → `?`
- [ ] `auto_text_e585b6` → `?`
- [ ] `auto_text_e585bc` → `?`
- [ ] `auto_text_e5889d` → `?`
- [ ] `auto_text_e58d9a` → `?`
- [ ] `auto_text_e58ebb` → `?`
- [ ] `auto_text_e58f8c` → `?`
- [ ] `auto_text_e59088` → `?`
- [ ] `auto_text_e59198` → `?`
- [ ] `auto_text_e59bba` → `?`
- [ ] `auto_text_e59ca8` → `?`
- [ ] `auto_text_e5a4a7` → `?`
- [ ] `auto_text_e5a5b3` → `?`
- [ ] `auto_text_e5ae9e` → `?`
- [ ] `auto_text_e5b9b4` → `?`
- [ ] `auto_text_e5be85` → `?`
- [ ] `auto_text_e68a80` → `?`
- [ ] `auto_text_e697a0` → `?`
- [ ] `auto_text_e69c88` → `?`
- [ ] `auto_text_e69c8d` → `?`
- [ ] `auto_text_e69cac` → `?`
- [ ] `auto_text_e69d83` → `?`
- [ ] `auto_text_e6af8f` → `?`
- [ ] `auto_text_e794a8` → `?`
- [ ] `auto_text_e794b7` → `?`
- [ ] `auto_text_e79785` → `?`
- [ ] `auto_text_e7a195` → `?`
- [ ] `auto_text_e7a6bb` → `?`
- [ ] `auto_text_e7b3bb` → `?`
- [ ] `auto_text_e7bb84` → `?`
- [ ] `auto_text_e8818c` → `?`
- [ ] `auto_text_e8a792` → `?`
- [ ] `auto_text_e8af95` → `?`
- [ ] `auto_text_e8bf94` → `?`
- [ ] `auto_text_e983a8` → `?`
- [ ] `auto_text_e99480` → `?`
- [ ] `auto_text_e999aa` → `?`
- [ ] `auto_text_e9a1b9` → `?`
- [ ] `auto_text_e9ab98` → `?`

#### payroll.json - 自动生成键清理
- [ ] `auto____2028e7` → `?`
- [ ] `auto____e7a1ae` → `?`
- [ ] `auto____e896aa` → `?`
- [ ] `auto___e29c85` → `?`
- [ ] `auto___e29d8c` → `?`
- [ ] `auto___e69c89` → `?`
- [ ] `auto___e69c8d` → `?`
- [ ] `auto___e69d83` → `?`
- [ ] `auto___e6ada3` → `?`
- [ ] `auto___e7bc96` → `?`
- [ ] `auto___e88eb7` → `?`
- [ ] `auto___e8afb7` → `?`
- [ ] 其他 auto_ 开头的键...

### 阶段二：修复硬编码文本 (预计 3 天)

#### 高优先级文件 (143处硬编码)
- [ ] `/src/pages/Admin/Configuration/ReportConfigManagement.tsx`
  - [ ] 替换 `label="报表编码"` → `t('reportManagement.form.report_code')`
  - [ ] 替换 `placeholder="例如: salary_summary"` → `t('reportManagement.form.report_code_placeholder')`
  - [ ] 其他硬编码文本...

#### 中优先级文件 (20-50处硬编码)
- [ ] `/src/components/BatchReportExport/BatchReportExportV2.tsx` (24处)
- [ ] `/src/pages/Admin/Organization/ActualPositionPageV2.tsx` (20处)
- [ ] `/src/pages/Admin/Organization/JobPositionLevelPageV2.tsx` (20处)
- [ ] `/src/pages/Admin/Organization/PersonnelCategoriesPageV2.tsx` (32处)
- [ ] `/src/pages/Payroll/pages/PayrollBulkImportPage/ImportReviewStep.tsx` (29处)

#### 低优先级文件 (10-20处硬编码)
- [ ] `/src/components/PayrollDataModal/FilterConfigPanel.tsx` (12处)
- [ ] `/src/pages/HRManagement/employees/partials/BasicInfoTab.tsx` (16处)
- [ ] `/src/pages/Payroll/components/PayrollEntryFormModal.tsx` (14处)
- [ ] `/src/pages/SimplePayroll/SimplePayrollPageModern.tsx` (18处)

### 阶段三：补充空值翻译 (预计 2 天)

#### employee.json 空值翻译
- [ ] `common.no_employee_found` = "未找到员工"
- [ ] `common.select_employee` = "选择员工"
- [ ] `detail_page.alert.description_employee_not_selected_or_found` = "未选择或未找到员工"
- [ ] `detail_page.basic_info_tab.label_actual_position` = "实际职位"
- [ ] `detail_page.basic_info_tab.label_department` = "部门"
- [ ] `detail_page.basic_info_tab.label_dob` = "出生日期"
- [ ] `detail_page.basic_info_tab.label_education_level` = "学历"
- [ ] `detail_page.basic_info_tab.label_email` = "邮箱"
- [ ] 其他空值...

#### common.json 空值翻译
- [ ] `activate` = "激活"
- [ ] `active` = "活跃"
- [ ] `adjust_balance` = "调整余额"
- [ ] `back` = "返回"
- [ ] `batch_delete` = "批量删除"
- [ ] `button.collapse` = "折叠"
- [ ] `button.column_setting` = "列设置"
- [ ] `button.density` = "密度"
- [ ] `button.exit_fullscreen` = "退出全屏"
- [ ] `button.expand` = "展开"
- [ ] `button.fullscreen` = "全屏"
- [ ] `button.submit` = "提交"
- [ ] 其他空值...

#### payroll.json 空值翻译
- [ ] `batch_delete_button_text` = "批量删除"
- [ ] `batch_delete_failed` = "批量删除失败"
- [ ] `batch_delete_success` = "批量删除成功"
- [ ] `break_duration` = "休息时长"
- [ ] `calculating` = "计算中"
- [ ] `check_in_time` = "签到时间"
- [ ] `check_out_time` = "签退时间"
- [ ] 其他空值...

### 阶段四：统一翻译风格 (预计 1 天)

#### 建立术语表
- [ ] Employee 统一翻译为"员工"
- [ ] Department 统一翻译为"部门"
- [ ] Payroll 统一翻译为"薪资"
- [ ] Period 统一翻译为"期间"
- [ ] Run 统一翻译为"运行"
- [ ] Entry 统一翻译为"条目"
- [ ] Component 统一翻译为"组成部分"

#### 检查一致性
- [ ] 确保所有"保存"使用 common.save
- [ ] 确保所有"取消"使用 common.cancel
- [ ] 确保所有"删除"使用 common.delete
- [ ] 确保所有"编辑"使用 common.edit
- [ ] 确保所有"创建"使用 common.create

### 阶段五：测试验证 (预计 1 天)

#### 功能测试
- [ ] 切换到中文，检查所有页面显示
- [ ] 切换到英文，检查所有页面显示
- [ ] 确保没有显示翻译键
- [ ] 确保没有空白文本

#### 自动化测试
- [ ] 运行 `npm run test:e2e`
- [ ] 运行 `npm run i18n:scan`
- [ ] 运行 `node scripts/check-hardcoded-text.cjs`
- [ ] 运行 `node scripts/check-untranslated.cjs`

## 进度追踪

### 总体进度
- 总任务数: 631 (硬编码) + 423 (中文空值) + 1184 (英文空值) = 2238
- 已完成: 0
- 完成率: 0%

### 每日进度记录

#### 2025-06-23
- [x] 创建任务追踪文件
- [x] 生成 i18n 检测报告
- [ ] 开始清理自动生成键名

## 工具和脚本

### 自动替换脚本
```bash
# 自动替换硬编码文本
node scripts/auto-i18n-replace.cjs

# 扫描并更新翻译文件
npm run i18n:scan

# 检查硬编码文本
node scripts/check-hardcoded-text.cjs

# 检查未翻译的键
node scripts/check-untranslated.cjs
```

### 手动查找和替换
```bash
# 查找所有硬编码的中文
grep -r '[\u4e00-\u9fa5]' src/ --include="*.tsx" --include="*.ts"

# 查找特定的硬编码文本
grep -r 'label="' src/ --include="*.tsx"
grep -r 'placeholder="' src/ --include="*.tsx"
```

## 注意事项

1. **保持向后兼容**: 不要删除正在使用的键，即使它们是自动生成的
2. **测试每个改动**: 修改后要测试相关功能是否正常
3. **遵循命名规范**: 使用点号分隔的层级结构，如 `page.section.field`
4. **保持中英文同步**: 修改中文时同步修改英文
5. **避免重复**: 相同的翻译使用相同的键

## 完成标准

- [ ] 所有硬编码文本已替换为 i18n 键
- [ ] 所有自动生成的键已重命名为有意义的名称
- [ ] 所有空值翻译已补充
- [ ] 中英文翻译完全对应
- [ ] 通过所有自动化测试
- [ ] 手动测试所有页面无问题