# 薪资审核页面调试指南

## 🔍 快速诊断步骤

### 1. 打开浏览器开发者工具 (F12)

#### Console标签页检查项：
1. **查看初始化日志**：
   - ✅ `[PayrollRunsPage] 🚀 Component rendering started`
   - ✅ `[PayrollRunsPage] 🔧 useEffect triggered, calling fetchRuns`
   - ✅ `[PayrollRunsPage] 🚨 fetchRuns call #1`

2. **查看API调用日志**：
   - ✅ `[PayrollRunsPage] 📡 Making API request to getPayrollRuns`
   - ✅ `[PayrollRunsPage] ⏱️ Starting API call at: [时间戳]`

3. **关键：查看API响应日志**：
   - 成功：`[PayrollRunsPage] ✅ API response received`
   - 失败：`[PayrollRunsPage] ❌ API request failed`

4. **最重要：查看finally块执行**：
   - ✅ `[PayrollRunsPage] 🏁 fetchRuns completed, setting loading to false`
   - ✅ `[PayrollRunsPage] ✅ Loading state should now be false`

#### Network标签页检查项：
1. 找到 `/v2/payroll-runs` 请求
2. 检查状态：
   - ⏳ Pending = 请求挂起
   - ✅ 200 = 成功
   - ❌ 401 = 未授权
   - ❌ 500 = 服务器错误
3. 查看响应时间

### 2. 常见问题及解决方案

#### 问题1：API请求一直Pending
**症状**：Network中请求状态一直是Pending，Console没有看到"fetchRuns completed"日志
**原因**：后端服务未响应或网络问题
**解决**：
1. 检查后端服务是否运行
2. 使用curl测试API：`curl http://localhost:8080/v2/payroll-runs`
3. 临时切换到模拟API模式

#### 问题2：401未授权错误
**症状**：Network返回401，Console显示"API request failed"
**原因**：登录过期或token无效
**解决**：重新登录

#### 问题3：无限循环调用
**症状**：Console显示多次"fetchRuns call #"，可能看到"检测到潜在的无限循环"
**原因**：组件依赖问题导致重复渲染
**解决**：检查是否有修改影响了useCallback/useEffect依赖

### 3. 使用模拟API进行调试

1. 编辑 `PayrollRunsPage.tsx`
2. 将 `const USE_MOCK_API = false` 改为 `true`
3. 刷新页面，如果正常加载说明是API问题

### 4. 添加更多调试日志

在怀疑的位置添加console.log：
```javascript
console.log('[DEBUG] Current state:', {
  loading,
  error,
  runs: runs.length,
  timestamp: new Date().toISOString()
});
```

### 5. 检查API超时设置

当前设置为30秒超时，如果需要调整：
- 编辑 `payrollApi.ts`
- 修改 `setTimeout` 中的 `30000` 值

### 6. 紧急修复步骤

如果页面完全卡住：
1. 打开 `PayrollRunsPage.tsx`
2. 设置 `USE_MOCK_API = true`
3. 保存并刷新页面
4. 这将跳过真实API调用，使用模拟数据 