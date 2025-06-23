# Universal Data Browser System

基于 PayrollDataModal 的强大功能，抽取并重构为可复用的通用数据浏览组件系统。

## 🎯 核心概念

该系统提供了一套完整的数据浏览解决方案，包括：

- **智能搜索**: 多模式搜索（精确、模糊、正则、智能建议）
- **高级筛选**: 列管理、模式匹配、智能排序
- **配置预设**: 保存和管理常用的数据查看配置
- **数据导出**: Excel、CSV、JSON 等格式导出
- **性能优化**: 虚拟化、缓存、防抖等优化机制

## 📦 组件架构

```
src/components/universal/
├── DataBrowser/                 # 核心数据浏览组件
│   ├── UniversalDataModal.tsx  # 主模态框组件
│   ├── SmartSearchPanel.tsx    # 智能搜索面板
│   ├── AdvancedColumnManager.tsx # 高级列管理
│   └── ConfigPresetManager.tsx # 配置预设管理
├── hooks/                      # 通用 Hooks
│   ├── useUniversalDataQuery.ts
│   ├── useUniversalDataProcessing.ts
│   ├── useUniversalSearch.ts
│   └── useUniversalPresets.ts
├── services/                   # 通用服务
│   └── UniversalExportService.ts
└── index.ts                   # 统一导出
```

## 🚀 快速开始

### 基础用法

```tsx
import { UniversalDataModal } from '@/components/universal';

const MyDataPage = () => {
  const [modalVisible, setModalVisible] = useState(false);
  
  return (
    <>
      <Button onClick={() => setModalVisible(true)}>
        打开数据浏览器
      </Button>
      
      <UniversalDataModal
        title="数据管理"
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        dataSource={myData}
        searchable={true}
        filterable={true}
        exportable={true}
      />
    </>
  );
};
```

### 高级配置

```tsx
const advancedConfig = {
  // 搜索配置
  searchConfig: {
    searchableFields: [
      { key: 'name', label: '姓名', type: 'text' },
      { key: 'department', label: '部门', type: 'select' },
      { key: 'salary', label: '薪资', type: 'number' }
    ],
    supportExpressions: true,
    searchModes: [SearchMode.AUTO, SearchMode.FUZZY],
    placeholder: '搜索姓名、部门... 或使用 salary>10000'
  },
  
  // 筛选配置
  filterConfig: {
    hideEmptyColumns: true,
    categorySort: ['基本信息', '职位信息', '薪资信息'],
    presets: [
      { name: '在职员工', filters: { status: 'active' } },
      { name: '高薪员工', filters: { salary: '>10000' } }
    ]
  },
  
  // 操作配置
  actions: [
    {
      key: 'edit',
      label: '编辑',
      icon: <EditOutlined />,
      onClick: (record) => handleEdit(record)
    }
  ]
};

<UniversalDataModal
  {...advancedConfig}
  dataSource={employees}
/>
```

## 🔧 API 参考

### UniversalDataModal Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `title` | `string` | - | 模态框标题 |
| `visible` | `boolean` | - | 是否显示模态框 |
| `onClose` | `() => void` | - | 关闭回调 |
| `dataSource` | `T[]` | `[]` | 数据源 |
| `loading` | `boolean` | `false` | 加载状态 |
| `searchable` | `boolean` | `true` | 是否启用搜索 |
| `filterable` | `boolean` | `true` | 是否启用筛选 |
| `exportable` | `boolean` | `true` | 是否启用导出 |
| `searchConfig` | `SearchConfig` | - | 搜索配置 |
| `filterConfig` | `FilterConfig` | - | 筛选配置 |
| `actions` | `ActionConfig[]` | `[]` | 操作按钮配置 |

### SearchConfig

```tsx
interface SearchConfig<T> {
  searchableFields: SearchableField<T>[];  // 可搜索字段
  supportExpressions?: boolean;            // 支持表达式搜索
  searchModes?: SearchMode[];              // 支持的搜索模式
  placeholder?: string;                    // 搜索框占位符
  debounceMs?: number;                     // 防抖延迟
}
```

### FilterConfig

```tsx
interface FilterConfig {
  hideEmptyColumns?: boolean;     // 隐藏空列
  hideZeroColumns?: boolean;      // 隐藏零值列
  categorySort?: string[];        // 分类排序
  presets?: FilterPreset[];       // 预设筛选条件
}
```

## 🎨 样式定制

组件使用 Ant Design 的主题系统，支持完全的样式定制：

```tsx
// 使用 ConfigProvider 定制主题
import { ConfigProvider } from 'antd';

<ConfigProvider
  theme={{
    token: {
      colorPrimary: '#00b96b',
      borderRadius: 8,
    },
    components: {
      Modal: {
        titleFontSize: 18,
      },
    },
  }}
>
  <UniversalDataModal />
</ConfigProvider>
```

## 🔍 搜索功能

### 支持的搜索模式

1. **智能搜索 (AUTO)**: 自动选择最佳搜索策略
2. **精确匹配 (EXACT)**: 完全匹配搜索内容
3. **模糊搜索 (FUZZY)**: 支持近似匹配和拼写纠错
4. **正则表达式 (REGEX)**: 支持正则表达式匹配
5. **智能建议 (SMART)**: 基于历史和内容的智能建议

### 表达式搜索

支持类似 SQL 的条件表达式：

```
salary>10000           // 薪资大于10000
department=技术部      // 部门等于技术部
name!=张三             // 姓名不等于张三
age>=25 AND age<=35    // 年龄在25-35之间（未来支持）
```

## 📊 列管理

### 智能列筛选

- **隐藏空列**: 自动隐藏没有数据的列
- **隐藏零值列**: 隐藏全部为0的数值列
- **模式匹配**: 支持通配符模式（如 `*name*`, `salary*`）
- **数据类型筛选**: 仅显示特定类型的列

### 智能排序

1. **按类别排序**: 按预定义类别分组排序
2. **按字母排序**: 按列名字母顺序排序
3. **按重要性排序**: 按业务重要性排序
4. **按数据类型排序**: 按数据类型分组排序
5. **自定义排序**: 用户自定义列顺序

## 💾 预设管理

### 预设功能

- **保存配置**: 保存当前的搜索、筛选、列配置
- **快速应用**: 一键应用已保存的配置
- **分类管理**: 按类别组织预设
- **导入导出**: 支持预设的导入导出
- **使用统计**: 记录预设使用频率

### 预设类型

```tsx
interface UniversalPreset {
  id: string;
  name: string;
  description?: string;
  category?: string;
  isDefault?: boolean;
  isFavorite?: boolean;
  config: {
    filterConfig?: any;
    searchQuery?: string;
    searchMode?: string;
    tableState?: any;
  };
}
```

## 📤 导出功能

### 支持的格式

- **Excel (.xlsx)**: 包含格式化、样式、元数据
- **CSV (.csv)**: 兼容 Excel 的 CSV 格式
- **JSON (.json)**: 包含完整的数据和元数据

### 导出选项

```tsx
interface ExportOptions {
  filename?: string;        // 文件名
  includeHeaders?: boolean; // 包含表头
  timestamp?: boolean;      // 包含时间戳
  creator?: string;        // 创建者信息
  maxRows?: number;        // 最大行数限制
}
```

## 🎯 使用案例

### 员工管理系统

```tsx
// 完整的员工管理页面
const EmployeeListPage = () => {
  const searchConfig = {
    searchableFields: [
      { key: 'full_name', label: '姓名', type: 'text' },
      { key: 'department', label: '部门', type: 'text' },
      { key: 'position', label: '职位', type: 'text' }
    ],
    supportExpressions: true,
    placeholder: '搜索员工信息...'
  };

  const actions = [
    {
      key: 'edit',
      label: '编辑',
      icon: <EditOutlined />,
      onClick: (record) => navigate(`/edit/${record.id}`)
    }
  ];

  return (
    <UniversalDataModal
      title="员工管理"
      dataSource={employees}
      searchConfig={searchConfig}
      actions={actions}
      exportable={true}
      presetEnabled={true}
    />
  );
};
```

## ⚡ 性能优化

### 内置优化

1. **虚拟滚动**: 处理大量数据时自动启用
2. **防抖搜索**: 300ms 防抖减少搜索频率
3. **智能缓存**: React Query 提供的缓存机制
4. **列渲染优化**: 使用 useMemo 和 useCallback
5. **数据清理**: 自动清理 React 元素污染

### 性能监控

组件内置性能监控，在开发环境下会输出性能指标：

```
🔍 [搜索性能] 搜索完成: 120ms, 结果: 45条, 模式: AUTO ⚡
📊 [数据处理] 列生成: 28ms, 列数: 12, 数据: 1000条
📤 [导出性能] Excel导出: 850ms, 行数: 1000, 列数: 12
```

## 🔧 扩展开发

### 自定义搜索模式

```tsx
// 扩展新的搜索模式
enum CustomSearchMode {
  SEMANTIC = 'semantic',  // 语义搜索
  PHONETIC = 'phonetic'   // 语音搜索
}

// 在 useUniversalSearch 中实现自定义逻辑
const customSearch = (query: string, mode: CustomSearchMode) => {
  switch (mode) {
    case CustomSearchMode.SEMANTIC:
      return performSemanticSearch(query);
    case CustomSearchMode.PHONETIC:
      return performPhoneticSearch(query);
  }
};
```

### 自定义导出格式

```tsx
// 扩展新的导出格式
class CustomExportService extends UniversalExportService {
  async exportToPDF(data: any[], columns: ProColumns<any>[]) {
    // 实现 PDF 导出逻辑
  }
  
  async exportToWord(data: any[], columns: ProColumns<any>[]) {
    // 实现 Word 导出逻辑
  }
}
```

## 🐛 故障排除

### 常见问题

1. **搜索无结果**: 检查 `searchableFields` 配置
2. **列显示异常**: 检查数据源中是否有 React 元素
3. **导出失败**: 检查数据量是否超过限制
4. **性能问题**: 启用虚拟滚动，减少数据量

### 调试工具

开启详细日志：

```tsx
// 在组件中添加 debug 模式
<UniversalDataModal
  debug={true}  // 开启调试模式
  // ... 其他配置
/>
```

## 📈 未来规划

- [ ] 支持实时数据流
- [ ] 增加图表视图模式
- [ ] 支持拖拽式列排序
- [ ] 集成 AI 搜索建议
- [ ] 支持协作式预设共享
- [ ] 移动端优化

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request 来改进这个组件系统！

### 开发环境

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 运行测试
npm run test

# 构建
npm run build
```

---

> 💡 这个组件系统展示了如何将复杂的功能模块化、通用化，实现真正的代码复用和配置驱动开发。