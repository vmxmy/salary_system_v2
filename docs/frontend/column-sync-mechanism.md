# 列筛选配置与列设置同步机制

## 📋 问题背景

在薪资数据模态框中，用户可以通过两种方式控制列的显示：

1. **列筛选配置**：通过筛选面板设置包含/排除模式、隐藏空列等
2. **ProTable列设置**：通过表格右上角的列设置按钮控制列的显示/隐藏和顺序

### 原始问题

当用户修改列筛选配置后，ProTable的列设置会被重置，导致用户之前的列显示/隐藏设置和列顺序调整丢失。

## 🎯 解决方案

### 核心思路：智能同步机制

实现一个智能同步机制，在列筛选配置变化时：
1. **检测列结构变化**：比较新旧列的key集合
2. **保持用户设置**：将现有的列状态应用到新列结构
3. **处理新增列**：为新增的列设置默认显示状态

### 实现细节

#### 1. 列状态管理

```typescript
// ProTable列状态管理
const [currentColumnsState, setCurrentColumnsState] = useState<Record<string, any>>({});

// ProTable配置
columnsState={{
  persistenceKey: 'payroll-data-table',
  persistenceType: 'localStorage',
  onChange: (newColumnsState) => {
    console.log('📊 [ProTable] 列状态变化:', newColumnsState);
    setCurrentColumnsState(newColumnsState || {});
  },
}}
```

#### 2. 智能同步逻辑

```typescript
// 🎯 智能同步机制：保持用户的列设置
setDynamicColumns(prevColumns => {
  // 如果是首次生成，直接使用新列
  if (prevColumns.length === 0) {
    console.log('🔄 [列同步] 首次生成列，直接使用新列配置');
    return generatedColumns;
  }
  
  // 检查列是否发生了实质性变化
  const prevKeys = new Set(prevColumns.map(col => col.key));
  const newKeys = new Set(generatedColumns.map(col => col.key));
  const keysChanged = prevKeys.size !== newKeys.size || 
                     [...prevKeys].some(key => !newKeys.has(key)) ||
                     [...newKeys].some(key => !prevKeys.has(key));
  
  if (keysChanged) {
    // 保持用户的列设置
    const updatedColumnsState: Record<string, any> = {};
    
    generatedColumns.forEach(newCol => {
      const key = String(newCol.key || '');
      const existingState = currentColumnsState[key];
      
      if (existingState) {
        // 保持用户的显示/隐藏和顺序设置
        updatedColumnsState[key] = existingState;
      } else {
        // 新列默认显示
        updatedColumnsState[key] = { show: true };
      }
    });
    
    // 更新列状态
    setCurrentColumnsState(updatedColumnsState);
    return generatedColumns;
  } else {
    // 列结构未变化，保持现有配置
    return prevColumns;
  }
});
```

## 🔍 同步机制工作流程

### 场景1：首次加载
1. `dataSource` 加载完成
2. 生成初始列配置
3. 直接设置 `dynamicColumns`
4. ProTable渲染，用户可以调整列设置

### 场景2：用户调整列设置
1. 用户在ProTable中隐藏/显示列或调整顺序
2. `onChange` 回调触发
3. 更新 `currentColumnsState`
4. 列设置保存到localStorage

### 场景3：用户修改列筛选配置
1. 用户修改 `filterConfig`（如添加排除模式）
2. `useEffect` 触发，重新筛选列
3. **智能同步机制**检测列变化：
   - 如果列结构相同 → 保持现有配置
   - 如果列结构变化 → 同步用户设置到新列
4. 更新 `dynamicColumns` 和 `currentColumnsState`
5. ProTable重新渲染，保持用户的列设置

## 📊 同步状态追踪

### 调试日志

系统提供详细的调试日志来追踪同步过程：

```typescript
console.log('🔄 [列同步] 首次生成列，直接使用新列配置');
console.log('🔄 [列同步] 列结构发生变化，需要同步用户设置');
console.log('🔄 [列同步] 旧列keys:', [...prevKeys]);
console.log('🔄 [列同步] 新列keys:', [...newKeys]);
console.log(`🔄 [列同步] 保持列 ${key} 的用户设置:`, existingState);
console.log(`🔄 [列同步] 新列 ${key} 默认显示`);
console.log('🔄 [列同步] 列结构未变化，保持现有列配置');
```

### 状态检查

可以通过浏览器控制台检查当前状态：

```javascript
// 检查当前列状态
console.log('当前列状态:', currentColumnsState);

// 检查动态列配置
console.log('动态列配置:', dynamicColumns.map(col => ({ 
  key: col.key, 
  title: col.title 
})));
```

## 🧪 测试场景

### 测试用例1：基本同步功能
1. 打开薪资数据模态框
2. 在ProTable中隐藏几个列（如"基本工资"、"绩效工资"）
3. 修改列筛选配置（如启用"隐藏空列"）
4. **预期结果**：之前隐藏的列仍然保持隐藏状态

### 测试用例2：列顺序保持
1. 在ProTable中调整列顺序
2. 修改列筛选配置
3. **预期结果**：列顺序保持不变

### 测试用例3：新增列处理
1. 设置排除模式排除某些列
2. 在ProTable中调整剩余列的设置
3. 移除排除模式，恢复被排除的列
4. **预期结果**：
   - 之前调整的列设置保持不变
   - 新恢复的列默认显示

### 测试用例4：列完全变化
1. 设置"只显示数值列"
2. 在ProTable中调整数值列设置
3. 取消"只显示数值列"，恢复所有列
4. **预期结果**：
   - 数值列的设置保持不变
   - 文本列恢复默认显示

## 🔧 技术实现要点

### 1. 避免无限循环

```typescript
// ❌ 错误：会导致无限循环
}, [dataSource, t, filterConfig, matchesPattern, currentColumnsState]);

// ✅ 正确：移除 currentColumnsState 依赖
}, [dataSource, t, filterConfig, matchesPattern]);
```

### 2. 状态更新时机

- **列筛选配置变化** → 触发列重新生成 → 同步用户设置
- **用户调整列设置** → 更新 `currentColumnsState` → 不触发列重新生成

### 3. 持久化存储

ProTable的 `persistenceKey` 确保列设置在页面刷新后仍然保持：

```typescript
columnsState={{
  persistenceKey: 'payroll-data-table',
  persistenceType: 'localStorage',
}}
```

## 🚀 性能优化

### 1. 智能比较

只有当列的key集合发生实质性变化时才进行同步，避免不必要的重新渲染。

### 2. 状态批量更新

使用函数式更新避免状态竞争：

```typescript
setDynamicColumns(prevColumns => {
  // 基于前一个状态进行更新
  return newColumns;
});
```

### 3. 调试信息控制

在生产环境中可以通过环境变量控制调试日志的输出。

## 📈 效果评估

### 用户体验提升
- ✅ 列筛选配置变化时用户设置不丢失
- ✅ 列顺序调整得到保持
- ✅ 新增列自动设置合理默认值

### 开发体验提升
- ✅ 详细的调试日志便于问题排查
- ✅ 清晰的状态管理逻辑
- ✅ 可测试的同步机制

### 性能表现
- ✅ 智能比较避免不必要的重新渲染
- ✅ 状态更新优化减少组件重新挂载
- ✅ 持久化存储提升用户体验

---

**文档版本**: v1.0  
**创建日期**: 2024-12-19  
**最后更新**: 2024-12-19  
**状态**: 已实施 