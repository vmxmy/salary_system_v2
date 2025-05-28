# 通用组件库

本目录包含了项目中的通用组件，这些组件经过精心设计，具有高度的可复用性和灵活性。

## 组件列表

### 1. FormBuilder - 动态表单构建器

动态生成表单的组件，支持多种字段类型和验证规则。

**特性：**
- 支持 20+ 种字段类型（input、select、date、upload等）
- 内置验证规则和国际化支持
- 支持条件显示和字段依赖
- 栅格布局和响应式设计
- 集成了其他通用组件（LookupSelect、EmployeeSelector等）

**使用示例：**
```tsx
import { FormBuilder } from '@/components/common';

const fields = [
  {
    name: 'name',
    label: '姓名',
    type: 'input',
    required: true,
    span: 12,
  },
  {
    name: 'department',
    label: '部门',
    type: 'lookupSelect',
    lookupType: 'department',
    span: 12,
  },
  {
    name: 'birthDate',
    label: '出生日期',
    type: 'date',
    span: 24,
  }
];

<FormBuilder
  fields={fields}
  onFinish={(values) => console.log(values)}
  layout={{ layout: 'horizontal', gutter: 16 }}
/>
```

### 2. DataTable - 增强数据表格

基于 EnhancedProTable 的高级数据表格组件。

**特性：**
- 内置工具栏（刷新、导出、列设置、密度调整、全屏）
- 支持序号列和选择列
- 状态标签自动渲染
- 列显示/隐藏控制
- 全屏模式
- 行点击事件

**使用示例：**
```tsx
import { DataTable } from '@/components/common';

const columns = [
  {
    title: '姓名',
    dataIndex: 'name',
    key: 'name',
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    statusConfig: {
      type: 'active',
      colorMap: { active: 'green', inactive: 'red' }
    }
  }
];

<DataTable
  columns={columns}
  dataSource={data}
  title="员工列表"
  showIndex
  showSelection
  toolbar={{
    showRefresh: true,
    showExport: true,
  }}
  onExport={(format, data) => console.log('导出', format, data)}
/>
```

### 3. SearchForm - 搜索表单

支持基础搜索和高级搜索的表单组件。

**特性：**
- 基础搜索和高级搜索分离
- 展开/收起功能
- 自动过滤空值
- 重置后自动搜索

**使用示例：**
```tsx
import { SearchForm } from '@/components/common';

const config = {
  basicFields: [
    {
      name: 'keyword',
      label: '关键词',
      type: 'input',
      span: 8,
    },
    {
      name: 'status',
      label: '状态',
      type: 'select',
      options: [
        { label: '全部', value: '' },
        { label: '启用', value: 'active' },
        { label: '禁用', value: 'inactive' },
      ],
      span: 8,
    }
  ],
  advancedFields: [
    {
      name: 'dateRange',
      label: '日期范围',
      type: 'dateRange',
      span: 12,
    }
  ]
};

<SearchForm
  config={config}
  onSearch={(values) => console.log('搜索', values)}
  title="搜索条件"
/>
```

### 4. ModalForm - 模态框表单

支持新增、编辑、查看模式的模态框表单。

**特性：**
- 三种模式：create、edit、view
- 自动表单验证
- 成功后自动关闭
- 支持自定义标题和按钮文本

**使用示例：**
```tsx
import { ModalForm } from '@/components/common';

const config = {
  fields: [
    {
      name: 'name',
      label: '姓名',
      type: 'input',
      required: true,
    },
    {
      name: 'email',
      label: '邮箱',
      type: 'input',
      rules: [{ type: 'email', message: '请输入有效邮箱' }],
    }
  ],
  titles: {
    create: '新增用户',
    edit: '编辑用户',
    view: '查看用户',
  }
};

<ModalForm
  visible={visible}
  mode="create"
  config={config}
  onSubmit={async (values, mode) => {
    // 处理提交逻辑
    return true; // 返回 true 表示成功
  }}
  onCancel={() => setVisible(false)}
/>
```

### 5. PayrollPeriodSelector - 薪资周期选择器

专用于薪资周期选择的组件，支持显示工资记录人数。

**特性：**
- 卡片和表单两种布局模式
- 显示每个周期的工资记录人数
- 生产环境限制
- 支持过滤函数

**使用示例：**
```tsx
import { PayrollPeriodSelector } from '@/components/common';

<PayrollPeriodSelector
  value={selectedPeriodId}
  onChange={setPeriodId}
  layout="card"
  showDataStats
  filterPeriods={(periods) => periods.filter(p => p.status === 'active')}
/>
```

### 6. LookupSelect - 查找值选择器

用于选择系统中的查找值（如部门、职位等）。

**特性：**
- 支持 10 种查找类型
- 树形结构支持
- 搜索过滤功能
- 自动缓存

**使用示例：**
```tsx
import { LookupSelect } from '@/components/common';

<LookupSelect
  lookupType="department"
  value={departmentId}
  onChange={setDepartmentId}
  placeholder="请选择部门"
  allowClear
/>
```

### 7. EmployeeSelector - 员工选择器

专用于员工选择的组件。

**特性：**
- 单选/多选模式
- 实时搜索（姓名、员工编号）
- 部门、状态过滤
- 分页加载
- 防抖搜索

**使用示例：**
```tsx
import { EmployeeSelector } from '@/components/common';

<EmployeeSelector
  mode="multiple"
  value={selectedEmployees}
  onChange={setSelectedEmployees}
  departmentFilter={departmentId}
  statusFilter="active"
/>
```

### 8. StatusTag - 状态标签

通用的状态标签组件。

**特性：**
- 17 种预定义状态类型
- 自动图标和颜色
- 支持自定义样式
- 点击事件支持

**使用示例：**
```tsx
import { StatusTag } from '@/components/common';

<StatusTag
  status="active"
  onClick={() => console.log('点击状态标签')}
/>
```

### 9. DateRangePicker - 日期范围选择器

增强的日期范围选择器。

**特性：**
- 13 种快捷日期范围
- 下拉菜单和按钮组两种模式
- 时间选择支持
- 自定义日期限制

**使用示例：**
```tsx
import { DateRangePicker } from '@/components/common';

<DateRangePicker
  value={dateRange}
  onChange={setDateRange}
  mode="dropdown"
  showTime
  presets={['today', 'thisWeek', 'thisMonth']}
/>
```

## 开发规范

### 1. 组件设计原则

- **单一职责**：每个组件只负责一个特定功能
- **高内聚低耦合**：组件内部逻辑紧密，对外依赖最小
- **可配置性**：通过 props 提供丰富的配置选项
- **可扩展性**：支持自定义渲染和事件处理

### 2. TypeScript 规范

- 所有组件必须有完整的 TypeScript 类型定义
- 导出所有必要的类型接口
- 使用泛型支持不同数据类型

### 3. 国际化支持

- 所有用户可见文本都要支持国际化
- 使用 `useTranslation` hook
- 翻译键命名规范：`组件名.类别.具体键`

### 4. 样式规范

- 优先使用 Ant Design 的设计系统
- 支持主题定制
- 响应式设计

### 5. 文档规范

- 每个组件都要有详细的 JSDoc 注释
- 提供使用示例
- 说明所有 props 和事件

## 最佳实践

### 1. 性能优化

- 使用 `React.memo` 避免不必要的重渲染
- 使用 `useCallback` 和 `useMemo` 优化函数和计算
- 合理使用 `useEffect` 的依赖数组

### 2. 错误处理

- 提供友好的错误提示
- 使用 `try-catch` 处理异步操作
- 记录错误日志便于调试

### 3. 可访问性

- 支持键盘导航
- 提供适当的 ARIA 标签
- 考虑屏幕阅读器用户

### 4. 测试

- 编写单元测试覆盖主要功能
- 测试各种边界情况
- 确保组件在不同环境下正常工作

## 贡献指南

1. 新增组件前先检查是否已有类似功能
2. 遵循现有的代码风格和命名规范
3. 添加完整的类型定义和文档
4. 更新导出文件和国际化翻译
5. 编写使用示例和测试用例

## 更新日志

### v2.0.0 (2024-12)
- 新增 FormBuilder 动态表单构建器
- 新增 DataTable 增强数据表格
- 新增 SearchForm 搜索表单
- 新增 ModalForm 模态框表单
- 优化 PayrollPeriodSelector 显示工资记录人数
- 完善所有组件的 TypeScript 类型定义
- 添加完整的国际化支持 