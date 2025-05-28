# 性能优化指南

## 🎯 当前性能问题分析

根据控制台监控数据，发现以下性能瓶颈：

### 🐌 极慢请求（>1000ms）
- `GET /payroll-entries` - **5865ms** ⚠️ 需要紧急优化
- `GET /personnel-categories` - **1881ms**
- `GET /departments` - **1896ms**
- `GET /lookup/types` - **1171ms**

### 🔄 中等慢请求（150-1000ms）
- 多个 `GET /payroll-runs` - **600-1500ms**
- 各种 lookup 请求 - **600-1000ms**

## 🚀 已实施的优化措施

### 1. 控制台过滤优化
- ✅ 过滤 React 废弃警告
- ✅ 解决 CSP 安全策略问题
- ✅ 外部脚本加载优化

### 2. 性能监控系统
- ✅ 请求耗时监控
- ✅ 内存使用监控
- ✅ 慢请求分类和警告

### 3. 数据加载优化
- ✅ 分批加载 HR lookups
- ✅ 减少并发请求数量
- ✅ 优先加载重要数据

## 📋 待实施的优化建议

### 1. 后端优化（推荐）
```sql
-- 为慢查询添加索引
CREATE INDEX idx_payroll_entries_period ON payroll_entries(period_id);
CREATE INDEX idx_personnel_categories_active ON personnel_categories(is_active);
CREATE INDEX idx_departments_parent ON departments(parent_id);
```

### 2. 前端缓存策略
```typescript
// 实施智能缓存
const cacheConfig = {
  lookupData: 10 * 60 * 1000,    // 10分钟
  departmentData: 15 * 60 * 1000, // 15分钟
  payrollData: 2 * 60 * 1000,    // 2分钟
};
```

### 3. 分页和虚拟滚动
- 对大数据集实施分页
- 使用虚拟滚动优化长列表
- 懒加载非关键数据

### 4. 请求优化
- 合并相似请求
- 实施请求去重
- 添加请求取消机制

## 🔧 使用性能工具

### 启用性能监控
```typescript
// 在 main.tsx 中已启用
import PerformanceMonitor from './components/common/PerformanceMonitor';
```

### 配置性能级别
```typescript
// 在 performanceConfig.ts 中配置
export const CURRENT_PERFORMANCE_LEVEL = PerformanceLevel.DETAILED;
```

### 监控慢请求
```typescript
// 自动监控超过阈值的请求
SLOW_REQUEST_THRESHOLD: 150,      // 慢请求阈值
VERY_SLOW_REQUEST_THRESHOLD: 1000, // 极慢请求阈值
```

## 📊 性能指标目标

### 短期目标（1周内）
- [ ] 将 payroll-entries 请求时间降至 <2000ms
- [ ] 优化 departments 和 personnel-categories 查询
- [ ] 实施基础缓存策略

### 中期目标（1个月内）
- [ ] 所有 API 请求 <500ms
- [ ] 实施完整的缓存系统
- [ ] 添加分页和虚拟滚动

### 长期目标（3个月内）
- [ ] 首屏加载时间 <2秒
- [ ] 内存使用稳定在 <50MB
- [ ] 实现离线缓存功能

## 🛠️ 开发者工具

### 性能监控面板
在开发环境中，右上角会显示性能监控面板，包含：
- 实时内存使用情况
- 请求耗时统计
- 性能警告提示

### 控制台日志
- `🚀 缓存命中` - 缓存成功使用
- `⚠️ 慢请求警告` - 请求超过阈值
- `🐌 极慢请求` - 需要紧急优化的请求
- `💾 缓存已保存` - 数据已缓存

## 📝 最佳实践

1. **数据获取**
   - 优先加载关键数据
   - 延迟加载非关键数据
   - 使用适当的缓存策略

2. **组件优化**
   - 使用 React.memo 避免不必要的重渲染
   - 合理使用 useMemo 和 useCallback
   - 避免在渲染中进行复杂计算

3. **网络请求**
   - 合并相似请求
   - 实施请求去重
   - 添加适当的超时设置

4. **内存管理**
   - 及时清理事件监听器
   - 避免内存泄漏
   - 监控内存使用情况 