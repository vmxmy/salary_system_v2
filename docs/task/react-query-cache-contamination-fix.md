# React Query 缓存污染问题修复方案

## 问题根源：React Query 缓存机制

### 问题识别

用户提到使用了 React Query，这是一个关键线索。React Query 会缓存查询结果，如果 React 元素被包含在查询结果中，这些元素会被持久化在缓存中，然后在后续的查询中被重复使用。

### React Query 缓存污染机制

1. **首次查询**: 数据获取 → 处理 → 某个环节产生 React 元素 → 存入缓存
2. **后续查询**: 直接从缓存返回 → React 元素被重用 → 显示 "[object Object]"
3. **持久污染**: 即使修复了数据处理逻辑，缓存中的污染数据仍然存在

### 为什么会缓存 React 元素？

```typescript
// React Query 会序列化整个查询结果
const queryResult = {
  data: [
    {
      职位等级: <span>高级</span>,  // 😱 React 元素被包含在数据中！
      其他字段: "正常值"
    }
  ]
}

// 这个包含 React 元素的对象被缓存
// 下次查询时直接返回，React 元素变成 "[object Object]"
```

## 解决方案

### 1. 数据深度清理

在数据进入 React Query 缓存之前进行深度清理：

```typescript
// 🧹 深度清理数据 - 使用深度清理函数确保没有React元素进入缓存
const cleanedData = processedData.map((item: any, index: number) => {
  const cleanedItem: any = {};
  Object.keys(item).forEach(key => {
    // 使用深度清理函数处理每个值
    cleanedItem[key] = deepCleanValue((item as any)[key]);
    
    // 🔍 特别关注目标字段
    if (key === TRACE_FIELD) {
      console.log(`🧹 [深度清理-${TRACE_FIELD}] 清理前:`, (item as any)[key], `清理后:`, cleanedItem[key]);
    }
  });
  return cleanedItem;
});
```

### 2. 强制清除污染缓存

在组件挂载时清除可能被污染的缓存：

```typescript
// 🧹 清除可能被污染的缓存
React.useEffect(() => {
  if (visible && periodId > 0) {
    console.log('🧹 [缓存清理] 清除可能被React元素污染的缓存');
    // 清除当前查询的缓存
    queryClient.removeQueries({
      queryKey: payrollDataQueryKeys.list({
        periodId: periodId.toString(),
        size: 100,
        page: 1,
      }),
    });
  }
}, [visible, periodId, queryClient]);
```

### 3. 临时禁用缓存

暂时禁用 React Query 缓存，确保每次都获取新数据：

```typescript
// 缓存配置 - 优化以避免无限循环
staleTime: 0, // 🚨 暂时禁用缓存，确保每次都获取新数据
gcTime: 0, // 🚨 立即清除缓存，避免React元素被持久化
```

### 4. 增强 deepCleanValue 函数

```typescript
export const deepCleanValue = (value: any): any => {
  if (value === null || value === undefined) {
    return null;
  }
  
  // 检查是否为React元素
  if (isReactElement(value)) {
    console.warn('[数据清理] 发现React元素，尝试提取原始值:', value);
    
    // 尝试从props中提取原始值
    if (value.props) {
      if (value.props.children !== undefined) {
        return deepCleanValue(value.props.children);
      }
      
      // 对于数字格式化的span元素，尝试提取数字
      if (typeof value.props.children === 'string') {
        const numMatch = value.props.children.match(/[\d,.-]+/);
        if (numMatch) {
          const num = parseFloat(numMatch[0].replace(/,/g, ''));
          if (!isNaN(num)) {
            return num;
          }
        }
      }
    }
    
    return '[React元素]';
  }
  
  // 递归处理数组和对象
  if (Array.isArray(value)) {
    return value.map(item => deepCleanValue(item));
  }
  
  if (typeof value === 'object') {
    if (value.constructor === Object) {
      const cleaned: any = {};
      Object.keys(value).forEach(key => {
        cleaned[key] = deepCleanValue(value[key]);
      });
      return cleaned;
    }
    
    return safeStringify(value);
  }
  
  return value;
};
```

## 修复的关键点

### 1. 数据流清理优先级

```
API 响应 → 数据转换 → 🧹深度清理 → 数据验证 → React Query 缓存
```

确保 React 元素在进入缓存之前就被清理掉。

### 2. 缓存管理策略

- **短期方案**: 禁用缓存，确保问题解决
- **长期方案**: 恢复缓存，但确保数据清理机制完善

### 3. 追踪和监控

```typescript
// 🔍 特别关注目标字段
if (key === TRACE_FIELD) {
  console.log(`🧹 [深度清理-${TRACE_FIELD}] 清理前:`, (item as any)[key], `清理后:`, cleanedItem[key]);
}
```

通过详细的日志跟踪数据清理过程。

## React Query 最佳实践

### 1. 数据序列化安全

确保所有缓存的数据都可以安全序列化：

```typescript
// ✅ 好的实践
const safeData = {
  name: "张三",
  age: 30,
  level: "高级"  // 原始字符串
};

// ❌ 避免的情况
const unsafeData = {
  name: "张三",
  age: 30,
  level: <span>高级</span>  // React 元素！
};
```

### 2. 查询键管理

使用明确的查询键，便于缓存管理：

```typescript
export const payrollDataQueryKeys = {
  all: ['payrollData'] as const,
  lists: () => [...payrollDataQueryKeys.all, 'list'] as const,
  list: (filters: PayrollDataFilters) => [...payrollDataQueryKeys.lists(), filters] as const,
};
```

### 3. 缓存清理策略

在数据可能被污染时主动清理缓存：

```typescript
// 清理特定查询的缓存
queryClient.removeQueries({ queryKey: payrollDataQueryKeys.list(filters) });

// 清理所有相关缓存
queryClient.removeQueries({ queryKey: payrollDataQueryKeys.all });
```

## 验证方法

1. **清除浏览器缓存**: 确保从干净状态开始
2. **观察清理日志**: 检查 `🧹 [深度清理-职位等级]` 日志
3. **监控缓存状态**: 使用 React Query DevTools
4. **验证显示结果**: 确保表格显示正常值而不是 "[object Object]"

通过这个综合解决方案，我们应该能够彻底解决 React Query 缓存污染导致的问题。