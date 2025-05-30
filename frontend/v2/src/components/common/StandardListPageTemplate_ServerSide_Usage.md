# StandardListPageTemplate 服务器端功能使用指南

## 概述

`StandardListPageTemplate` 现在支持服务器端排序、筛选和分页功能。这意味着所有的数据操作都在服务器端进行，可以处理大量数据而不影响前端性能。

## 新增功能

### 1. 服务器端分页 (serverSidePagination)
- 分页操作在服务器端进行
- 需要提供 `total` 属性显示总数据量
- 分页参数会传递给 `fetchData` 函数

### 2. 服务器端排序 (serverSideSorting)
- 排序操作在服务器端进行
- 排序参数会传递给 `fetchData` 函数
- 列配置中的 `sorter` 会自动适配服务器端模式

### 3. 服务器端筛选 (serverSideFiltering)
- 筛选操作在服务器端进行
- 筛选参数会传递给 `fetchData` 函数
- 列配置中的 `filters` 会自动适配服务器端模式

## 使用方法

### 1. 基本配置

```typescript
import { StandardListPageTemplate, QueryParams } from './StandardListPageTemplate';

const MyListPage = () => {
  const [dataSource, setDataSource] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  // 数据获取函数，支持查询参数
  const fetchData = async (params?: QueryParams) => {
    setLoading(true);
    try {
      const response = await api.getData({
        page: params?.page || 1,
        page_size: params?.page_size || 20,
        filters: params?.filters || {},
        sorting: params?.sorting || [],
        search: params?.search || '',
      });
      setDataSource(response.data);
      setTotal(response.total);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <StandardListPageTemplate
      // ... 其他属性
      dataSource={dataSource}
      loadingData={loading}
      total={total}
      fetchData={fetchData}
      // 启用服务器端功能
      serverSidePagination={true}
      serverSideSorting={true}
      serverSideFiltering={true}
      // ... 其他配置
    />
  );
};
```

### 2. QueryParams 接口

```typescript
interface QueryParams {
  filters?: Record<string, any>;
  sorting?: Array<{ field: string; direction: 'asc' | 'desc' }>;
  search?: string;
  page?: number;
  page_size?: number;
}
```

### 3. 后端API期望的参数格式

```typescript
// 分页参数
{
  page: 1,           // 当前页码
  page_size: 20      // 每页数据量
}

// 排序参数
{
  sorting: [
    { field: 'name', direction: 'asc' },
    { field: 'created_at', direction: 'desc' }
  ]
}

// 筛选参数
{
  filters: {
    status: ['active', 'pending'],
    department_id: [1, 2, 3]
  }
}

// 搜索参数
{
  search: 'keyword'
}
```

### 4. 后端API响应格式

```typescript
// 服务器端分页时的响应格式
{
  data: [...],       // 当前页的数据
  total: 100,        // 总数据量
  page: 1,           // 当前页码
  page_size: 20      // 每页数据量
}
```

## 列配置适配

### 排序列配置

```typescript
// 客户端排序
{
  title: '姓名',
  dataIndex: 'name',
  sorter: (a, b) => a.name.localeCompare(b.name)
}

// 服务器端排序（自动适配）
{
  title: '姓名',
  dataIndex: 'name',
  sorter: true  // 会自动转换为 true
}
```

### 筛选列配置

```typescript
// 客户端筛选
{
  title: '状态',
  dataIndex: 'status',
  filters: [
    { text: '激活', value: 'active' },
    { text: '待审', value: 'pending' }
  ],
  onFilter: (value, record) => record.status === value
}

// 服务器端筛选（自动适配）
{
  title: '状态',
  dataIndex: 'status',
  filters: [
    { text: '激活', value: 'active' },
    { text: '待审', value: 'pending' }
  ]
  // onFilter 会被自动移除
}
```

## 注意事项

1. **fetchData 函数签名**: 当启用服务器端功能时，`fetchData` 函数必须支持 `QueryParams` 参数
2. **total 属性**: 启用服务器端分页时，必须提供 `total` 属性
3. **自动适配**: 列配置会根据服务器端设置自动适配，无需手动修改
4. **数据刷新**: 所有数据操作（删除、刷新等）都会自动使用当前的查询参数
5. **性能优化**: 服务器端功能适合处理大量数据，可以显著提升前端性能

## 兼容性

- 可以选择性启用服务器端功能（分页、排序、筛选可以独立启用）
- 未启用的功能仍然使用客户端处理
- 完全向后兼容，现有代码无需修改

## 示例项目

参考 `ReportViewData` 组件的实现，了解如何在实际项目中使用服务器端功能。 