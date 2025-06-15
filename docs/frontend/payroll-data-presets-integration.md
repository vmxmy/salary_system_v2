# 工资数据模态框预设功能集成指南

## 📋 功能概述

为工资数据模态框添加列筛选配置和列设置的预设保存功能，允许用户：
- 保存当前的列筛选配置和列设置为命名预设
- 快速应用已保存的预设配置
- 管理预设（编辑、删除、复制、设为默认）
- 导入/导出预设配置

## 🎯 核心组件

### 1. 类型定义
- `ColumnFilterConfig`: 列筛选配置
- `ColumnSettings`: 列设置配置
- `PayrollDataModalPreset`: 预设数据结构

### 2. API服务
- `payrollDataPresetsApi`: 预设CRUD操作
- 支持保存、加载、删除、复制预设

### 3. React Hook
- `usePayrollDataPresets`: 预设报表管理逻辑
- 提供预设操作的统一接口

### 4. UI组件
- `PresetManager`: 预设报表管理界面
- 支持预设列表、保存、应用等操作

## 🔧 集成步骤

### 步骤1: 在PayrollDataModal中添加预设报表管理按钮

```tsx
// 在工具栏中添加预设报表管理按钮
<Button 
  key="presets" 
  icon={<SettingOutlined />} 
  onClick={() => setPresetManagerVisible(true)}
>
  预设报表管理
</Button>
```

### 步骤2: 集成PresetManager组件

```tsx
import { PresetManager } from '@/components/PayrollDataModal/PresetManager';

// 在Modal中添加PresetManager
<PresetManager
  visible={presetManagerVisible}
  onClose={() => setPresetManagerVisible(false)}
  currentFilterConfig={filterConfig}
  currentColumnSettings={currentColumnsState}
  onApplyPreset={(filterConfig, columnSettings) => {
    setFilterConfig(filterConfig);
    setCurrentColumnsState(columnSettings);
    // 触发列重新生成
    generateColumns();
  }}
/>
```

### 步骤3: 添加默认预设加载

```tsx
const { defaultPreset, loadDefaultPreset } = usePayrollDataPresets();

useEffect(() => {
  // 在Modal打开时加载默认预设
  if (visible && defaultPreset) {
    setFilterConfig(defaultPreset.filterConfig);
    setCurrentColumnsState(defaultPreset.columnSettings);
  }
}, [visible, defaultPreset]);
```

## 🗄️ 数据库设计

利用现有的 `config.report_user_preferences` 表：

```sql
-- 预设数据存储示例
INSERT INTO config.report_user_preferences (
  user_id,
  preference_type,
  object_type,
  preference_config
) VALUES (
  1,
  'payroll_data_modal_config',
  'column_preset',
  '{
    "name": "工资相关列",
    "description": "只显示工资相关的列",
    "filterConfig": {
      "hideJsonbColumns": true,
      "includePatterns": ["*工资*", "*合计", "*金额"]
    },
    "columnSettings": {
      "employee_name": {"show": true, "order": 1},
      "total_earnings": {"show": true, "order": 2}
    }
  }'::jsonb
);
```

## 🎨 用户界面设计

### 预设报表管理界面
- 预设列表：显示所有已保存的预设
- 操作按钮：应用、编辑、复制、删除、设为默认
- 保存当前配置：将当前设置保存为新预设
- 预设分类：按用途分类显示预设

### 保存预设对话框
- 预设名称：必填
- 描述：可选
- 设为默认：开关
- 设为公共：开关（其他用户可见）

## 🚀 使用场景

### 场景1: 财务人员日常查看
- 预设名称："财务审核视图"
- 包含列：员工姓名、应发合计、扣除合计、实发合计
- 隐藏：原始数据列、零值列

### 场景2: HR薪资分析
- 预设名称："薪资分析视图"
- 包含列：部门、职位、基本工资、绩效奖金、社保公积金
- 显示：所有数值列，按部门分组

### 场景3: 员工自助查询
- 预设名称："员工视图"
- 包含列：基本信息、收入项、扣除项、实发金额
- 隐藏：敏感的计算细节

## 📊 性能优化

### 缓存策略
- 预设列表缓存：避免重复请求
- 默认预设缓存：快速加载
- 使用React Query进行数据管理

### 懒加载
- 预设报表管理界面按需加载
- 大量预设时分页显示
- 预设配置延迟应用

## 🔒 权限控制

### 预设权限
- 个人预设：只有创建者可见和编辑
- 公共预设：所有用户可见，只有创建者可编辑
- 系统预设：管理员创建，所有用户可见，不可编辑

### API权限
- 读取预设：需要基本查看权限
- 保存预设：需要配置管理权限
- 删除预设：只能删除自己创建的预设

## 🧪 测试计划

### 单元测试
- Hook功能测试
- API服务测试
- 组件渲染测试

### 集成测试
- 预设保存和加载流程
- 预设应用效果验证
- 权限控制测试

### 用户测试
- 预设创建和管理流程
- 界面易用性测试
- 性能压力测试

## 📝 后续扩展

### 高级功能
- 预设导入/导出
- 预设版本管理
- 预设使用统计
- 智能预设推荐

### 其他模块集成
- 报表模块预设
- 查询界面预设
- 仪表板配置预设

---

**实施优先级**: 高
**预计工期**: 3-5个工作日
**依赖**: 后端API开发、数据库表结构确认 