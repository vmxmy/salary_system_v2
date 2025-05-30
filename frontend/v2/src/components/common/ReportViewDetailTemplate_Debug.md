# 视图报表详情页问题修复指南

## 已修复的问题

### 1. 循环引用错误修复
- **问题**: `Converting circular structure to JSON` 错误
- **原因**: 在 `console.log` 中输出包含 React Fiber 节点的对象
- **修复**: 移除了所有可能导致循环引用的日志输出，特别是包含 `record` 对象的日志

### 2. 数据显示问题修复
- **问题**: 表格显示 `[object Object]` 而不是实际数据
- **原因**: 数据渲染函数没有正确处理对象类型的值
- **修复**: 
  - 改进了 `render` 函数，正确处理各种数据类型
  - 添加了对象类型的安全序列化
  - 增强了错误处理机制

### 3. 筛选按钮问题修复
- **问题**: 表头没有筛选按钮
- **原因**: 筛选配置不完整，服务器端筛选配置错误
- **修复**:
  - 为所有列默认启用筛选功能 (`filterable: true`)
  - 为有筛选选项的列正确配置 `filters` 属性
  - 为没有预定义选项的列添加自定义筛选下拉框
  - 正确处理服务器端筛选模式

## 关键修复点

### 数据渲染函数改进
```typescript
render: (value: any, record: any, index: number) => {
  // 处理null、undefined和空值
  if (value === null || value === undefined || value === '') {
    return <span style={{ color: '#999' }}>-</span>;
  }
  
  // 处理对象类型的值
  if (typeof value === 'object' && value !== null) {
    if (value instanceof Date) {
      return col.dataType === 'date' 
        ? value.toLocaleDateString('zh-CN')
        : value.toLocaleString('zh-CN');
    }
    // 安全的对象序列化
    try {
      return JSON.stringify(value);
    } catch (error) {
      return '[Object]';
    }
  }
  
  // 根据数据类型格式化
  switch (col.dataType) {
    case 'date':
      return value ? new Date(value).toLocaleDateString('zh-CN') : '-';
    case 'datetime':
      return value ? new Date(value).toLocaleString('zh-CN') : '-';
    case 'number':
      return typeof value === 'number' ? value.toLocaleString('zh-CN') : String(value);
    case 'currency':
      return typeof value === 'number' ? `¥${value.toLocaleString('zh-CN')}` : String(value);
    case 'boolean':
      return value === true ? '是' : value === false ? '否' : String(value);
    default:
      return String(value);
  }
}
```

### 筛选配置改进
```typescript
// 筛选功能配置
...(col.filterable !== false ? {
  // 有预定义筛选选项
  ...(col.filterOptions && col.filterOptions.length > 0 ? {
    filters: col.filterOptions.map(option => ({
      text: option.text,
      value: option.value,
    })),
    onFilter: serverSideFiltering ? undefined : (value: any, record: any) => {
      const recordValue = record[col.dataIndex];
      return recordValue === value;
    },
  } : {
    // 自定义筛选下拉框
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }}>
        <input
          placeholder={`搜索 ${col.title}`}
          value={selectedKeys[0] as string || ''}
          onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onKeyPress={e => e.key === 'Enter' && confirm()}
        />
        <button onClick={() => confirm()}>搜索</button>
        <button onClick={() => clearFilters && clearFilters()}>重置</button>
      </div>
    ),
  }),
} : {})
```

## 调试建议

### 1. 检查API响应格式
确保后端API返回的数据格式符合预期：
```typescript
interface ReportViewQueryResponse {
  columns: Array<{
    key: string;
    title: string;
    dataIndex: string;
    dataType?: string;
  }>;
  data: Record<string, any>[];
  total: number;
  page: number;
  page_size: number;
}
```

### 2. 验证数据流
1. 检查 `handleFetchData` 函数是否正确调用
2. 验证 `response.data` 是否包含预期的数据
3. 确认 `columns` 配置是否正确生成

### 3. 浏览器调试
1. 打开浏览器开发者工具
2. 查看 Network 标签，确认API请求和响应
3. 查看 Console 标签，检查是否有其他错误
4. 使用 React DevTools 检查组件状态

### 4. 常见问题排查
- **数据不显示**: 检查 `dataSource` 状态是否正确设置
- **筛选不工作**: 确认 `serverSideFiltering` 配置是否正确
- **排序不工作**: 确认 `serverSideSorting` 配置是否正确
- **分页不工作**: 确认 `total` 属性是否正确传递

## 测试步骤

1. 访问视图报表列表页面
2. 点击"查看数据"按钮
3. 验证数据是否正确显示
4. 测试表头筛选按钮是否出现
5. 测试排序功能是否正常
6. 测试分页功能是否正常

如果问题仍然存在，请检查浏览器控制台的错误信息，并按照上述调试建议进行排查。 