---
title: Research Session
query: "PayrollDataModal页面的结构和功能模块"
date: 2025/6/22
time: 21:39:23
timestamp: 2025-06-22T13:39:23.542Z
exchanges: 4
---

# Research Session

## Initial Query

**Question:** PayrollDataModal页面的结构和功能模块

**Response:**

I'll research the PayrollDataModal page structure and functionality for you. Let me examine the codebase to understand its current implementation.Now let me examine the main PayrollDataModal component to understand its structure and functionality in detail.Now let me examine some of the key supporting components to understand the complete structure:Now let me examine some of the supporting hooks and utilities to understand the complete architecture:Based on my comprehensive analysis of the PayrollDataModal codebase, here's a detailed overview of its structure and functionality:

## PayrollDataModal 页面结构和功能模块

### 🏗️ **核心架构**

PayrollDataModal 是一个复杂的数据管理模态框，采用模块化架构，包含主组件和多个专门的子组件：

**主要组件文件：**
- `PayrollDataModal.tsx` - 主模态框组件
- `/components/PayrollDataModal/` - 专门的子组件目录

**支持系统：**
- React Query 数据管理
- 自定义 Hooks 业务逻辑
- TypeScript 类型系统
- Ant Design Pro 表格组件

### 📊 **核心功能模块**

#### 1. **数据查询与缓存管理**
- **React Query 集成**：智能缓存、自动重试、错误处理
- **数据清理**：防止 React 元素污染数据源
- **缓存策略**：30秒陈旧时间，5分钟垃圾回收
- **数据源验证**：多层验证确保数据完整性

#### 2. **智能搜索系统** (`SearchPanel.tsx`)
- **多模式搜索**：精确、模糊、正则表达式、智能建议
- **全文搜索**：支持员工姓名、编号、部门、职位等字段
- **高级查询**：支持条件表达式如 "实发合计>10000"
- **搜索建议**：实时提供搜索建议
- **性能优化**：搜索结果缓存和防抖处理

#### 3. **列配置管理** (`FilterConfigPanel.tsx`)
- **智能筛选**：
  - 隐藏空列、零值列、JSONB 原始数据列
  - 基于通配符的包含/排除模式匹配
  - 数值范围筛选
  - 仅显示数值列选项

- **智能排序**：
  - 按类别排序（基础信息 → 薪资 → 扣减 → 合计）
  - 按字母排序、重要性排序、数据类型排序
  - 自定义排序：用户可指定字段优先级

- **快速预设**：
  - 工资相关、保险公积金、只看金额等预设
  - 一键应用常用配置

#### 4. **预设管理系统** (`PresetManager.tsx`)
- **预设保存/加载**：保存当前表格配置为预设
- **分组管理**：按类别组织预设
- **智能应用**：包含搜索状态、列配置、筛选条件
- **版本控制**：支持复制、编辑、删除预设
- **使用统计**：记录预设使用次数和最后使用时间

#### 5. **数据处理引擎** (`usePayrollDataProcessing`)
- **动态列生成**：根据数据自动生成表格列
- **列类型检测**：自动识别数值、文本、日期等类型
- **渲染优化**：高亮搜索结果、格式化数值显示
- **导出支持**：支持 Excel 导出，保持列配置

### 🎛️ **交互功能**

#### 1. **表格操作**
- **行选择**：支持多选和批量操作
- **排序筛选**：列级别的排序和筛选
- **列配置**：拖拽调整、显示/隐藏列
- **分页控制**：灵活的分页配置

#### 2. **数据操作**
- **查看详情**：打开薪资条目详情模态框
- **编辑记录**：在线编辑薪资数据
- **批量导出**：导出选中或全部数据
- **数据刷新**：手动刷新数据

#### 3. **UI/UX 优化**
- **响应式设计**：自适应不同屏幕尺寸
- **加载状态**：完整的加载和错误状态处理
- **快捷键支持**：ESC 关闭面板等
- **智能收起**：筛选面板智能收起/固定功能

### 🔧 **技术特性**

#### 1. **性能优化**
- **虚拟滚动**：处理大量数据
- **防抖搜索**：300ms 防抖延迟
- **内存管理**：智能缓存清理
- **渲染优化**：useMemo 和 useCallback 优化

#### 2. **错误处理**
- **数据验证**：多层数据验证
- **友好提示**：详细的错误信息和用户提示
- **降级处理**：出错时的备用方案

#### 3. **国际化支持**
- **多语言**：支持中英文切换
- **格式化**：日期、数值的本地化格式

### 📁 **文件组织结构**

```
PayrollDataModal/
├── PayrollDataModal.tsx              # 主组件
├── ActionButtons.tsx                 # 操作按钮组件
├── SearchPanel.tsx                   # 搜索面板
├── FilterConfigPanel.tsx             # 筛选配置面板
├── PresetManager.tsx                 # 预设管理器
├── ColumnConfig.tsx                  # 列配置工具
├── ColumnQuickSort.tsx               # 快速排序
└── 其他辅助组件...

hooks/
├── usePayrollDataQuery.ts            # 数据查询Hook
├── usePayrollDataProcessing.tsx      # 数据处理Hook
├── usePayrollDataPresets.ts          # 预设管理Hook
└── usePayrollSearch.tsx              # 搜索功能Hook

services/
├── payrollExportService.ts           # 导出服务
└── payrollDataPresets.ts             # 预设服务API
```

### 🎯 **主要使用场景**

1. **薪资数据查看**：HR 查看和分析员工薪资数据
2. **数据筛选分析**：根据不同维度筛选和分析薪资
3. **报表导出**：生成薪资报表和数据导出
4. **快速查找**：通过搜索快速定位特定员工或数据
5. **配置管理**：保存常用的表格配置和筛选条件

PayrollDataModal 是一个功能完备的企业级数据管理组件，融合了现代前端技术栈的最佳实践，提供了出色的用户体验和强大的数据处理能力。

---

## Follow-up 1

**Question:** 详细分析每个模块使用的技术栈和库

**Response:**

# PayrollDataModal 技术栈详细分析

## 🎯 核心技术架构

### **React 生态系统**
- **React 18+**: 函数组件架构，支持并发特性和新的 Hook 系统
- **TypeScript**: 完整的类型系统，提供编译时类型检查和智能提示
- **React Hooks**: 大量使用自定义 Hook 进行业务逻辑封装
  - `usePayrollDataQuery`: 数据查询逻辑
  - `usePayrollDataProcessing`: 数据处理和表格配置
  - `usePayrollDataPresets`: 预设管理
  - `usePayrollSearch`: 搜索功能封装

### **状态管理与数据流**
- **React Query (TanStack Query)**: 
  - 服务器状态管理的核心
  - 智能缓存策略（30秒陈旧时间，5分钟垃圾回收）
  - 自动重试和错误处理
  - 后台数据同步
- **useState/useReducer**: 本地 UI 状态管理
- **React Context**: 可能用于跨组件数据共享

## 🎨 UI 组件库和样式技术

### **Ant Design Pro 组件体系**
- **ProTable**: 高级表格组件，支持虚拟滚动、列配置、筛选排序
- **ProForm**: 表单组件，用于搜索和筛选配置
- **Modal**: 模态框容器组件
- **Button, Select, Input**: 基础交互组件
- **Tooltip, Popover**: 信息展示组件

### **样式技术**
- **Less/CSS Modules**: 组件级样式隔离
- **Ant Design 主题系统**: 统一的设计语言
- **响应式设计**: 支持多屏幕适配

## 🔍 搜索与筛选技术

### **搜索引擎实现**
- **多模式搜索算法**:
  - 精确匹配
  - 模糊搜索（Fuzzy Search）
  - 正则表达式匹配
  - 智能建议系统
- **全文搜索**: 支持员工姓名、编号、部门等多字段搜索
- **条件表达式解析**: 支持 "实发合计>10000" 类型的高级查询
- **防抖技术**: 300ms 防抖延迟优化性能

### **筛选与排序算法**
- **智能列筛选**:
  - 空值检测算法
  - 数据类型自动识别
  - 通配符模式匹配
- **多维度排序**:
  - 按类别排序（基础信息 → 薪资 → 扣减 → 合计）
  - 字母排序、重要性排序
  - 用户自定义排序逻辑

## 💾 数据处理与存储技术

### **数据处理引擎**
- **动态列生成算法**: 根据数据结构自动生成表格列配置
- **数据类型推断**: 自动识别数值、文本、日期、布尔类型
- **数据清理算法**: 
  - React 元素污染清理
  - JSONB 数据处理
  - 空值和异常数据处理

### **缓存与性能优化**
- **React Query 缓存层**: 
  - 内存缓存
  - 陈旧数据策略
  - 缓存失效和更新机制
- **本地存储**: 
  - localStorage 用于预设配置持久化
  - sessionStorage 用于临时状态保存
- **虚拟化技术**: 大数据量表格的虚拟滚动实现

## 🛠️ 工具库与辅助技术

### **JavaScript 工具库**
- **Lodash**: 数据操作和函数式编程工具
  - `debounce`: 搜索防抖
  - `cloneDeep`: 深拷贝对象
  - `sortBy, groupBy`: 数据排序和分组
- **Day.js**: 日期时间处理
- **数值格式化**: 货币、百分比格式化库

### **导出功能技术栈**
- **ExcelJS**: Excel 文件生成和操作
- **FileSaver.js**: 文件下载功能
- **数据序列化**: JSON 到 Excel 格式转换

## 🎪 高级功能实现技术

### **预设管理系统**
- **配置序列化**: 将复杂的表格配置转换为可存储的 JSON
- **版本控制**: 预设的创建、编辑、删除管理
- **使用统计**: 预设使用频率和时间记录
- **分组管理**: 预设的分类和组织

### **智能化特性**
- **搜索建议算法**: 基于历史搜索和数据内容的智能提示
- **列配置推荐**: 根据数据特征推荐最佳列配置
- **性能监控**: 组件渲染性能和用户交互追踪

## 🔧 开发与构建工具

### **开发环境**
- **Vite/Webpack**: 模块打包和开发服务器
- **ESLint**: 代码质量检查
- **Prettier**: 代码格式化
- **TypeScript Compiler**: 类型检查和转译

### **测试技术**
- **Jest**: 单元测试框架
- **React Testing Library**: 组件测试
- **Mock Service Worker**: API 模拟

## 📊 性能优化技术

### **React 性能优化**
- **useMemo**: 昂贵计算结果缓存
- **useCallback**: 函数引用稳定化
- **React.memo**: 组件记忆化
- **懒加载**: 组件和数据的按需加载

### **内存管理**
- **智能垃圾回收**: 组件卸载时的资源清理
- **内存泄漏防护**: Event Listener 和 Timer 的正确清理
- **大数据处理**: 分页和虚拟化减少内存占用

这个技术栈体现了现代企业级 React 应用的最佳实践，融合了数据管理、UI 交互、性能优化等多个维度的先进技术，为复杂的薪资数据管理提供了强大而灵活的解决方案。

---

## Follow-up 2

**Question:** 把这些功能模块做成可以复用的组件,改造其他数据浏览页面

**Response:**

# 基于 PayrollDataModal 的可复用组件设计方案

## 🏗️ 核心可复用组件架构

基于现有 PayrollDataModal 的功能模块，可以抽取出以下核心可复用组件：

### **1. UniversalDataModal - 通用数据浏览模态框**
```typescript
interface UniversalDataModalProps<T = any> {
  title: string;
  dataSource: T[];
  columns?: ProColumns<T>[];
  searchConfig?: SearchConfig;
  filterConfig?: FilterConfig;
  presetConfig?: PresetConfig;
  onRowSelect?: (selectedRows: T[]) => void;
  onExport?: (data: T[]) => void;
}
```

**核心特性：**
- 通用化的数据展示容器
- 支持任意数据类型的 TypeScript 泛型
- 插槽化设计，支持自定义操作按钮和工具栏
- 内置响应式布局和主题适配

### **2. SmartSearchPanel - 智能搜索组件**
```typescript
interface SmartSearchPanelProps<T> {
  dataSource: T[];
  searchableFields: SearchableField<T>[];
  onSearch: (results: T[], query: SearchQuery) => void;
  searchModes?: ('exact' | 'fuzzy' | 'regex' | 'smart')[];
  placeholder?: string;
  debounceMs?: number;
}
```

**核心功能：**
- 多模式搜索（精确、模糊、正则、智能建议）
- 支持条件表达式查询（如 "salary>10000"）
- 智能字段匹配和类型推断
- 搜索历史和建议缓存

### **3. AdvancedColumnManager - 高级列管理器**
```typescript
interface AdvancedColumnManagerProps<T> {
  originalColumns: ProColumns<T>[];
  dataSource: T[];
  onColumnsChange: (columns: ProColumns<T>[]) => void;
  presets?: ColumnPreset[];
  sortStrategies?: SortStrategy[];
  filterStrategies?: FilterStrategy[];
}
```

**核心能力：**
- 智能列筛选（隐藏空列、零值列、JSONB 数据）
- 多维度排序（类别、字母、重要性、自定义）
- 列配置预设管理
- 拖拽式列重排

### **4. ConfigPresetManager - 配置预设管理器**
```typescript
interface ConfigPresetManagerProps {
  currentConfig: any;
  presets: Preset[];
  onPresetApply: (preset: Preset) => void;
  onPresetSave: (preset: Preset) => void;
  onPresetDelete: (presetId: string) => void;
  categories?: string[];
}
```

## 🔧 数据处理引擎组件

### **5. DataProcessingEngine - 数据处理引擎**
```typescript
class DataProcessingEngine<T> {
  // 动态列生成
  generateColumns(data: T[]): ProColumns<T>[];
  
  // 数据类型推断
  inferColumnTypes(data: T[]): ColumnTypeMap;
  
  // 数据清理和格式化
  cleanData(data: T[]): T[];
  
  // 搜索和筛选
  processSearch(data: T[], query: SearchQuery): T[];
  processFilter(data: T[], filters: FilterConfig): T[];
}
```

### **6. VirtualizedDataTable - 虚拟化数据表格**
```typescript
interface VirtualizedDataTableProps<T> {
  dataSource: T[];
  columns: ProColumns<T>[];
  height?: number;
  rowHeight?: number;
  onRowSelect?: (rows: T[]) => void;
  virtualScrolling?: boolean;
  loadingMore?: boolean;
}
```

## 🎨 通用化改造策略

### **组件接口标准化**
```typescript
// 通用数据浏览组件接口
interface DataBrowserConfig<T = any> {
  // 数据源配置
  dataSource: T[] | Promise<T[]>;
  dataKey?: keyof T;
  
  // 显示配置
  title: string;
  columns?: ProColumns<T>[];
  autoGenerateColumns?: boolean;
  
  // 搜索配置
  searchable?: boolean;
  searchConfig?: SearchConfig<T>;
  
  // 筛选配置
  filterable?: boolean;
  filterConfig?: FilterConfig<T>;
  
  // 预设配置
  presetEnabled?: boolean;
  presetConfig?: PresetConfig;
  
  // 操作配置
  selectable?: boolean;
  exportable?: boolean;
  editable?: boolean;
  
  // 样式配置
  theme?: 'default' | 'compact' | 'modern';
  responsive?: boolean;
}
```

### **Hook 重构为通用化**
```typescript
// 通用数据查询 Hook
export function useUniversalDataQuery<T>(
  queryKey: string,
  queryFn: () => Promise<T[]>,
  options?: UseQueryOptions<T[]>
) {
  return useQuery({
    queryKey: [queryKey],
    queryFn,
    staleTime: 30 * 1000,
    cacheTime: 5 * 60 * 1000,
    ...options
  });
}

// 通用数据处理 Hook
export function useUniversalDataProcessing<T>(
  dataSource: T[],
  config: DataProcessingConfig<T>
) {
  // 动态列生成、搜索筛选、排序等逻辑
}
```

## 📱 其他页面改造实施方案

### **Phase 1: 核心组件抽取**
1. **员工管理页面**改造
   - 使用 `UniversalDataModal` 替换现有员工列表
   - 配置员工特定的搜索字段和筛选规则
   - 添加员工操作预设（在职员工、离职员工、按部门筛选）

2. **薪资期间管理**改造
   - 复用 `SmartSearchPanel` 实现期间搜索
   - 使用 `AdvancedColumnManager` 管理期间显示列
   - 集成 `ConfigPresetManager` 保存常用配置

### **Phase 2: 高级功能集成**
```typescript
// 员工管理页面配置示例
const employeePageConfig: DataBrowserConfig<Employee> = {
  title: '员工管理',
  dataSource: employees,
  searchConfig: {
    searchableFields: ['name', 'employeeId', 'department', 'position'],
    searchModes: ['exact', 'fuzzy', 'smart'],
    supportExpressions: true // 支持 "department=技术部" 类型查询
  },
  filterConfig: {
    hideEmptyColumns: true,
    categorySort: ['基本信息', '联系方式', '岗位信息'],
    presets: [
      { name: '在职员工', filters: { status: 'active' } },
      { name: '技术部门', filters: { department: '技术部' } },
      { name: '最近入职', filters: { joinDate: '>2024-01-01' } }
    ]
  },
  presetConfig: {
    enabled: true,
    categories: ['人员筛选', '部门视图', '自定义配置']
  }
};
```

### **Phase 3: 性能和体验优化**
1. **虚拟化升级**
   - 所有大数据页面启用虚拟滚动
   - 分页策略优化（前端分页 vs 后端分页智能选择）

2. **搜索体验增强**
   - 搜索建议系统（基于历史搜索和数据内容）
   - 搜索结果高亮显示
   - 快捷键支持（Ctrl+F 聚焦搜索框）

3. **响应式设计**
   - 移动端适配优化
   - 触屏操作支持
   - 折叠面板智能适配

## 🚀 实施路径和技术要点

### **组件库结构**
```
src/components/universal/
├── DataBrowser/
│   ├── UniversalDataModal.tsx
│   ├── SmartSearchPanel.tsx
│   ├── AdvancedColumnManager.tsx
│   ├── ConfigPresetManager.tsx
│   └── VirtualizedDataTable.tsx
├── hooks/
│   ├── useUniversalDataQuery.ts
│   ├── useUniversalDataProcessing.ts
│   └── useUniversalPresets.ts
└── services/
    ├── DataProcessingEngine.ts
    └── UniversalExportService.ts
```

### **配置驱动的页面生成**
```typescript
// 页面配置文件
export const pageConfigs = {
  employees: employeePageConfig,
  payrollPeriods: payrollPeriodsConfig,
  reports: reportsConfig,
  // ... 其他页面配置
};

// 通用页面渲染器
function UniversalDataPage({ configKey }: { configKey: keyof typeof pageConfigs }) {
  const config = pageConfigs[configKey];
  return <UniversalDataModal {...config} />;
}
```

这种架构设计能够将 PayrollDataModal 的强大功能扩展到整个应用，实现真正的组件复用和配置驱动开发，大幅减少重复代码并提升开发效率。

---

## Follow-up 3

**Question:** 使用创建的组件,按照PayrollDataModal的结构改造员工列表页面

**Response:**

基于 PayrollDataModal 的结构和功能模块，我将为您提供员工列表页面的改造方案。

## 核心改造策略

### 1. 创建通用数据浏览组件

首先抽取 PayrollDataModal 的核心功能，创建可复用的组件：

**UniversalDataModal** - 通用数据模态框
- 支持任意数据类型的泛型设计
- 集成搜索、筛选、列管理、预设功能
- 可配置的操作按钮和导出功能

**SmartSearchPanel** - 智能搜索组件
- 多模式搜索（精确、模糊、表达式）
- 支持员工姓名、工号、部门、职位等字段
- 防抖优化和搜索建议功能

**AdvancedColumnManager** - 高级列管理
- 智能列筛选（隐藏空列、按类别排序）
- 拖拽调整列顺序
- 列配置预设保存和加载

### 2. 员工列表页面具体改造

#### 数据处理层改造
```typescript
// 使用通用数据查询 Hook
const { data: employees, isLoading } = useUniversalDataQuery(
  'employees',
  fetchEmployees,
  {
    select: (data) => cleanEmployeeData(data), // 数据清理
    staleTime: 30 * 1000,
    cacheTime: 5 * 60 * 1000
  }
);

// 员工数据处理配置
const employeeProcessingConfig = {
  searchableFields: ['name', 'employeeId', 'department', 'position', 'email'],
  columnCategories: ['基本信息', '联系方式', '岗位信息', '薪资信息'],
  defaultHiddenColumns: ['internalId', 'createdAt', 'updatedAt'],
  numericColumns: ['salary', 'age', 'workYears']
};
```

#### 搜索功能集成
```typescript
// 员工特定搜索配置
const employeeSearchConfig: SearchConfig = {
  searchableFields: [
    { key: 'name', label: '姓名', type: 'text' },
    { key: 'employeeId', label: '工号', type: 'text' },
    { key: 'department', label: '部门', type: 'select' },
    { key: 'position', label: '职位', type: 'select' },
    { key: 'status', label: '状态', type: 'select' }
  ],
  supportExpressions: true, // 支持 "salary>8000" 类型查询
  searchModes: ['exact', 'fuzzy', 'smart'],
  placeholder: '搜索员工姓名、工号、部门...'
};
```

#### 列配置和预设管理
```typescript
// 员工列表预设配置
const employeePresets = [
  {
    name: '基础信息',
    columns: ['name', 'employeeId', 'department', 'position', 'status'],
    description: '显示员工基本信息'
  },
  {
    name: '在职员工',
    columns: ['name', 'employeeId', 'department', 'position', 'hireDate'],
    filters: { status: 'active' },
    description: '仅显示在职员工'
  },
  {
    name: '薪资信息',
    columns: ['name', 'department', 'position', 'salary', 'bonus'],
    filters: { showSalary: true },
    description: '显示薪资相关信息'
  }
];
```

### 3. 页面组件重构

#### 主要页面结构
```typescript
const EmployeeListPageModern = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState<Employee[]>([]);

  return (
    <PageContainer>
      <ModernCard>
        {/* 页面头部操作区 */}
        <div className="page-header">
          <Space>
            <Button 
              type="primary" 
              onClick={() => setModalVisible(true)}
              icon={<SearchOutlined />}
            >
              高级搜索
            </Button>
            <Button icon={<PlusOutlined />}>新增员工</Button>
            <Button icon={<UploadOutlined />}>批量导入</Button>
          </Space>
        </div>

        {/* 统一数据浏览模态框 */}
        <UniversalDataModal
          title="员工管理"
          visible={modalVisible}
          onCancel={() => setModalVisible(false)}
          dataSource={employees}
          loading={isLoading}
          searchConfig={employeeSearchConfig}
          columnConfig={employeeProcessingConfig}
          presets={employeePresets}
          onRowSelect={setSelectedEmployees}
          onExport={handleEmployeeExport}
          actions={[
            {
              key: 'edit',
              label: '编辑',
              icon: <EditOutlined />,
              onClick: (record) => handleEdit(record)
            },
            {
              key: 'detail',
              label: '详情',
              icon: <EyeOutlined />,
              onClick: (record) => handleViewDetail(record)
            }
          ]}
        />
      </ModernCard>
    </PageContainer>
  );
};
```

### 4. 功能模块复用

#### 智能搜索功能
- 复用 PayrollDataModal 的多模式搜索逻辑
- 适配员工特定字段（姓名、工号、部门、职位）
- 支持条件表达式搜索（如 "department=技术部 AND status=active"）

#### 列管理功能
- 自动隐藏空值列和系统字段
- 按类别智能排序（基本信息 → 联系方式 → 岗位信息）
- 支持列配置预设保存和快速切换

#### 数据导出功能
- 复用 PayrollDataModal 的导出逻辑
- 支持当前筛选结果导出
- 保持列配置和格式化设置

### 5. 技术实现要点

#### Hook 复用
```typescript
// 复用薪资数据处理 Hook，适配员工数据
const {
  processedData,
  visibleColumns,
  searchResults,
  currentPreset
} = useUniversalDataProcessing(employees, employeeProcessingConfig);

// 复用搜索功能 Hook
const {
  searchQuery,
  searchResults,
  searchSuggestions,
  handleSearch
} = useUniversalSearch(employees, employeeSearchConfig);
```

#### 组件样式统一
- 使用相同的 ModernCard 容器
- 复用 modern-design-system.less 的样式变量
- 保持与 PayrollDataModal 一致的交互体验

### 6. 性能优化措施

#### 虚拟化处理
- 员工数据量大时启用虚拟滚动
- 分页策略优化（前端分页 vs 后端分页）

#### 缓存策略
- React Query 缓存员工数据
- 搜索结果和列配置本地缓存
- 预设配置持久化存储

通过这种改造方案，员工列表页面将获得与 PayrollDataModal 相同的强大功能，包括智能搜索、高级筛选、列管理、预设配置等，同时保持代码的可维护性和一致的用户体验。


---

*Generated by Task Master Research Command*  
*Timestamp: 2025-06-22T13:39:23.542Z*
