# ReportViewDetailTemplate 使用文档

## 概述

`ReportViewDetailTemplate` 是一个专门用于报表视图详情页的通用模板组件，基于 `StandardListPageTemplate` 构建，提供了完整的数据展示、搜索、排序、导出等功能。

## 特性

- ✅ **统一的页面布局**: 标准化的报表视图详情页面布局
- ✅ **数据类型支持**: 支持多种数据类型的格式化显示
- ✅ **搜索和排序**: 内置搜索和排序功能
- ✅ **导出功能**: 支持 Excel、CSV、PDF 格式导出
- ✅ **自定义扩展**: 支持自定义操作按钮和状态渲染
- ✅ **响应式设计**: 适配不同屏幕尺寸
- ✅ **国际化支持**: 支持多语言

## 接口定义

### ReportViewInfo
```typescript
interface ReportViewInfo {
  id: number;
  name: string;
  description?: string;
  view_status: 'draft' | 'created' | 'error';
  category?: string;
  usage_count?: number;
  last_used_at?: string;
  created_at: string;
}
```

### ReportViewColumn
```typescript
interface ReportViewColumn {
  key: string;
  title: string;
  dataIndex: string;
  dataType?: 'string' | 'number' | 'date' | 'datetime' | 'currency' | 'boolean';
}
```

### ReportViewQueryParams
```typescript
interface ReportViewQueryParams {
  filters?: Record<string, any>;
  sorting?: Array<{ field: string; direction: 'asc' | 'desc' }>;
  page?: number;
  page_size?: number;
}
```

## 基础用法

```tsx
import ReportViewDetailTemplate from '../common/ReportViewDetailTemplate';
import type { 
  ReportViewInfo,
  ReportViewColumn,
  ReportViewQueryParams 
} from '../common/ReportViewDetailTemplate';

const MyReportView: React.FC = () => {
  const [dataSource, setDataSource] = useState([]);
  const [columns, setColumns] = useState<ReportViewColumn[]>([]);
  const [loading, setLoading] = useState(false);

  const reportViewInfo: ReportViewInfo = {
    id: 1,
    name: '员工工资报表',
    description: '显示所有员工的工资信息',
    view_status: 'created',
    category: '工资报表',
    usage_count: 25,
    last_used_at: '2024-01-15T10:30:00Z',
    created_at: '2024-01-01T09:00:00Z',
  };

  const handleFetchData = async (params: ReportViewQueryParams) => {
    setLoading(true);
    try {
      // 调用API获取数据
      const response = await fetchReportData(params);
      setDataSource(response.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ReportViewDetailTemplate
      reportViewInfo={reportViewInfo}
      dataSource={dataSource}
      columns={columns}
      loading={loading}
      onFetchData={handleFetchData}
      onBack={() => navigate('/reports')}
    />
  );
};
```

## 高级用法

### 自定义操作按钮

```tsx
const extraActions = [
  <Button key="sync" type="primary" icon={<SyncOutlined />}>
    同步视图
  </Button>,
  <Button key="edit" icon={<EditOutlined />}>
    编辑报表
  </Button>,
];

<ReportViewDetailTemplate
  // ... 其他属性
  extraActions={extraActions}
/>
```

### 自定义状态渲染

```tsx
const customStatusRender = (status: string) => {
  const statusConfig = {
    draft: { color: 'orange', text: '草稿状态' },
    created: { color: 'green', text: '已发布' },
    error: { color: 'red', text: '错误状态' },
  };
  const config = statusConfig[status] || statusConfig.draft;
  return <Tag color={config.color}>{config.text}</Tag>;
};

<ReportViewDetailTemplate
  // ... 其他属性
  customStatusRender={customStatusRender}
/>
```

### 自定义页面标题

```tsx
const customTitle = (
  <Card>
    <Row justify="space-between">
      <Col>
        <Title level={3}>自定义报表标题</Title>
        <Text>这是一个自定义的页面标题区域</Text>
      </Col>
      <Col>
        <Button>自定义操作</Button>
      </Col>
    </Row>
  </Card>
);

<ReportViewDetailTemplate
  // ... 其他属性
  customTitle={customTitle}
/>
```

### 导出功能

```tsx
const handleExport = async (format: 'excel' | 'csv' | 'pdf', params: ReportViewQueryParams) => {
  try {
    const blob = await exportReportData(format, params);
    // 处理下载逻辑
    downloadFile(blob, `report.${format}`);
  } catch (error) {
    message.error('导出失败');
  }
};

<ReportViewDetailTemplate
  // ... 其他属性
  onExport={handleExport}
  showExport={true}
/>
```

## 数据类型格式化

模板支持以下数据类型的自动格式化：

- **string**: 默认显示
- **number**: 千分位格式化 (1,234)
- **date**: 日期格式 (2024/01/15)
- **datetime**: 日期时间格式 (2024/01/15 10:30:00)
- **currency**: 货币格式 (¥1,234)
- **boolean**: 是/否

```tsx
const columns: ReportViewColumn[] = [
  {
    key: 'name',
    title: '姓名',
    dataIndex: 'name',
    dataType: 'string',
  },
  {
    key: 'salary',
    title: '工资',
    dataIndex: 'salary',
    dataType: 'currency',
  },
  {
    key: 'hire_date',
    title: '入职日期',
    dataIndex: 'hire_date',
    dataType: 'date',
  },
];
```

## 配置选项

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `reportViewInfo` | `ReportViewInfo` | - | 报表视图基础信息 |
| `dataSource` | `any[]` | - | 数据源 |
| `columns` | `ReportViewColumn[]` | - | 列定义 |
| `loading` | `boolean` | - | 加载状态 |
| `total` | `number` | 0 | 总数据量 |
| `onFetchData` | `function` | - | 数据获取函数 |
| `onExport` | `function` | - | 导出函数 |
| `onBack` | `function` | - | 返回按钮处理 |
| `extraActions` | `ReactNode[]` | `[]` | 额外操作按钮 |
| `showExport` | `boolean` | `true` | 是否显示导出 |
| `showSearch` | `boolean` | `true` | 是否显示搜索 |
| `showPagination` | `boolean` | `true` | 是否显示分页 |
| `customTitle` | `ReactNode` | - | 自定义标题 |
| `customStatusRender` | `function` | - | 自定义状态渲染 |
| `translationNamespaces` | `string[]` | `['reportView', 'common']` | 翻译命名空间 |

## 最佳实践

1. **数据获取**: 使用 `useCallback` 包装数据获取函数，避免不必要的重新渲染
2. **错误处理**: 在数据获取和导出函数中添加适当的错误处理
3. **加载状态**: 正确管理加载状态，提供良好的用户体验
4. **类型安全**: 使用 TypeScript 类型定义，确保类型安全
5. **性能优化**: 对于大量数据，考虑使用虚拟滚动或分页

## 注意事项

- 确保传入的 `columns` 数据格式正确
- `onFetchData` 函数应该处理所有可能的查询参数
- 导出功能需要后端 API 支持
- 自定义渲染函数应该处理边界情况 