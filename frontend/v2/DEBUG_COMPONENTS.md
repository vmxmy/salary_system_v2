# React DevTools 调试重点组件列表

## 🎯 高优先级监控组件
这些组件在之前出现过无限循环问题，需要重点关注：

### 1. UniversalDataModal
- **位置**: `src/components/universal/DataBrowser/UniversalDataModal.tsx`
- **监控指标**: 
  - 渲染次数 (应该 < 10次/操作)
  - 渲染持续时间 (应该 < 20ms)
  - Props变化频率
- **关键Props**: `dataSource`, `searchConfig`, `filterConfig`

### 2. EmployeeListPageModern  
- **位置**: `src/pages/HRManagement/employees/EmployeeListPageModern.tsx`
- **监控指标**:
  - fetchEmployees调用频率
  - pagination状态变化
  - 表格重渲染次数
- **关键State**: `pagination`, `filters`, `employees`

### 3. EmployeeDetailPageModern
- **位置**: `src/pages/HRManagement/employees/EmployeeDetailPageModern.tsx`  
- **监控指标**:
  - useEffect执行频率
  - employee数据获取次数
- **关键Hooks**: `useLookupMaps`, `useEmployeePermissions`

## 🔍 中优先级监控钩子

### 4. useLookupMaps
- **位置**: `src/hooks/useLookupMaps.ts`
- **监控指标**:
  - 数据获取API调用次数
  - lookupMaps对象重新创建频率
- **关键返回值**: `lookupMaps`, `rawLookups`

### 5. useUniversalSearch
- **位置**: `src/components/universal/hooks/useUniversalSearch.ts`
- **监控指标**:
  - 搜索执行频率
  - isSearching状态切换频率
- **关键State**: `searchResults`, `isSearching`, `query`

### 6. useUniversalDataProcessing
- **位置**: `src/components/universal/hooks/useUniversalDataProcessing.tsx`
- **监控指标**:
  - generateColumns函数调用频率
  - 列配置重新计算次数
- **关键返回值**: `filteredDataSource`, `currentColumnsState`

## 🚨 警告阈值

### 渲染频率警告
- **正常**: < 5次渲染/用户操作
- **警告**: 5-20次渲染/用户操作  
- **危险**: > 20次渲染/用户操作

### 渲染时间警告
- **正常**: < 16ms (60fps)
- **警告**: 16-50ms 
- **危险**: > 50ms

### Props/State变化警告
- **正常**: 变化与用户操作相关
- **警告**: 频繁的自动变化
- **危险**: 连续不断的变化

## 🎯 具体调试步骤

### 步骤1: 基线测试
1. 录制应用启动过程
2. 记录各组件初始渲染次数
3. 导航到员工管理页面
4. 记录路由切换时的渲染情况

### 步骤2: 交互测试  
1. 点击员工列表分页
2. 执行员工搜索
3. 打开员工详情页面
4. 使用数据筛选功能
5. 观察每次操作的渲染模式

### 步骤3: 问题定位
1. 找出渲染次数异常的组件
2. 检查该组件的Props变化
3. 识别触发重渲染的具体Props
4. 追溯Props变化的源头

### 步骤4: 性能分析
1. 使用Profiler的"Ranked"视图找出最慢的组件
2. 使用"Interactions"分析用户操作的影响
3. 检查是否存在不必要的重复计算

## 🔧 DevTools 特定设置

### Profiler 设置
```javascript
// 在浏览器控制台运行，启用详细的Profiler追踪
window.__REACT_DEVTOOLS_GLOBAL_HOOK__.profilerSettings = {
  recordWhy: true,
  recordTimings: true,
  recordInteractions: true
};
```

### 组件高亮设置
1. 开启 "Highlight updates when components render"
2. 设置较长的高亮持续时间 (1000ms)
3. 观察哪些组件频繁闪烁

## 🎯 重点关注信号

### 🔴 危险信号
- 组件在1秒内渲染 > 10次
- 相同Props导致重复渲染
- Hook依赖数组频繁变化
- useMemo/useCallback失效

### 🟡 警告信号  
- 渲染时间 > 50ms
- 大量子组件同时重渲染
- 状态更新后立即触发新的状态更新

### 🟢 正常信号
- 渲染与用户操作一一对应
- 渲染时间 < 16ms
- Props变化有明确原因

## 📋 调试报告模板

```
=== React DevTools 调试报告 ===
时间: [timestamp]
页面: [page name]
操作: [user action]

异常组件: [component name]
渲染次数: [count] 
渲染时间: [duration]
触发原因: [props/state changes]

修复建议:
1. [specific fix]
2. [specific fix]
3. [specific fix]
```