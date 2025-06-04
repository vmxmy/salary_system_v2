# 薪资工作流钩子重构文档

## 📝 重构概述

本次重构将原来的单一工作流钩子 `usePayrollWorkflow` 拆分为多个专门的钩子和工具函数，遵循单一职责原则，提高代码的可维护性和可测试性。

## 🏗️ 重构架构

### 重构前
```
usePayrollWorkflow.ts (329行)
├── 状态管理 (useState, useEffect)
├── 业务逻辑 (API调用, 数据处理)
├── UI交互 (消息提示, 对话框)
└── 工具函数 (数据格式化, 验证)
```

### 重构后
```
hooks/
├── usePayrollWorkflow.ts (组合钩子 - 20行)
├── usePayrollWorkflowState.ts (状态管理 - 180行)
├── usePayrollWorkflowActions.ts (业务逻辑 - 120行)
└── index.ts (统一导出)

utils/
└── payrollWorkflowUtils.ts (工具函数 - 200行)
```

## 📁 文件结构详解

### 1. 工具函数 (`utils/payrollWorkflowUtils.ts`)

#### PayrollWorkflowUtils (纯函数工具类)
- ✅ `findPeriodById()` - 根据ID查找周期
- ✅ `formatPeriodName()` - 格式化周期名称
- ✅ `validatePeriodSelection()` - 验证周期选择
- ✅ `showDataCheckResult()` - 显示数据检查结果
- ✅ `showCopyDataResult()` - 显示复制结果
- ✅ `downloadFile()` - 文件下载
- ✅ `generateExportFilename()` - 生成导出文件名
- ✅ `formatCalculationModules()` - 格式化计算模块
- ✅ `createPayrollRunNotes()` - 创建运行备注
- ✅ `isCalculationFinished()` - 判断计算是否完成
- ✅ `isCalculationSuccessful()` - 判断计算是否成功
- ✅ `getCurrentDateString()` - 获取当前日期

#### PayrollWorkflowAsyncUtils (异步操作工具类)
- ✅ `loadPayrollPeriods()` - 加载薪资周期
- ✅ `checkPeriodData()` - 检查周期数据
- ✅ `copyLastMonthData()` - 复制上月数据
- ✅ `createPayrollRun()` - 创建薪资运行
- ✅ `triggerCalculation()` - 触发计算
- ✅ `getCalculationProgress()` - 获取计算进度
- ✅ `getCalculationSummary()` - 获取计算汇总
- ✅ `exportPayrollReport()` - 导出报表

#### PayrollWorkflowDialogUtils (对话框工具类)
- ✅ `showCopyDataConfirmDialog()` - 显示复制确认对话框

### 2. 状态管理钩子 (`hooks/usePayrollWorkflowState.ts`)

#### 状态定义
```typescript
interface PayrollWorkflowState {
  // 基础状态
  selectedCycleForStep1: string | null;
  selectedPeriodId: number | null;
  hasDataForCycleStep1: boolean;
  isLoadingDataStep1: boolean;
  
  // 真实数据状态
  availablePeriods: PayrollPeriod[];
  currentPayrollRun: PayrollRun | null;
  calculationProgress: PayrollCalculationProgress | null;
  calculationSummary: PayrollSummaryStats | null;
  isLoadingPeriods: boolean;
  calculationTaskId: string | null;
}
```

#### 状态操作
```typescript
interface PayrollWorkflowStateActions {
  // 基础状态更新
  setSelectedPeriodId: (periodId: number | null) => void;
  setHasDataForCycleStep1: (hasData: boolean) => void;
  setIsLoadingDataStep1: (loading: boolean) => void;
  // ... 其他状态更新函数
  
  // 复合操作
  updatePeriodSelection: (periodId: number | null) => void;
  resetCalculationState: () => void;
  resetWorkflowState: () => void;
}
```

#### 核心功能
- ✅ 自动加载薪资周期列表
- ✅ 轮询计算进度监控
- ✅ 智能状态联动更新
- ✅ 状态重置和清理

### 3. 业务逻辑钩子 (`hooks/usePayrollWorkflowActions.ts`)

#### 数据操作
- ✅ `checkDataForCycleStep1()` - 检查周期数据
- ✅ `handleCopyLastMonthDataStep1()` - 复制上月数据
- ✅ `handleNavigateToBulkImportStep1()` - 跳转批量导入

#### 计算操作
- ✅ `handleStartCalculation()` - 启动计算

#### 导出操作
- ✅ `handleExportReport()` - 导出报表

### 4. 组合钩子 (`hooks/usePayrollWorkflow.ts`)

```typescript
export const usePayrollWorkflow = (): UsePayrollWorkflowReturn => {
  // 状态管理钩子
  const state = usePayrollWorkflowState();
  
  // 业务逻辑钩子
  const actions = usePayrollWorkflowActions(state);

  return {
    ...state,
    ...actions,
  };
};
```

### 5. 统一导出 (`hooks/index.ts`)

```typescript
// 主工作流钩子 - 组合钩子
export { usePayrollWorkflow } from './usePayrollWorkflow';

// 状态管理钩子
export { usePayrollWorkflowState } from './usePayrollWorkflowState';

// 业务逻辑钩子
export { usePayrollWorkflowActions } from './usePayrollWorkflowActions';

// 工具函数
export { 
  PayrollWorkflowUtils,
  PayrollWorkflowAsyncUtils,
  PayrollWorkflowDialogUtils 
} from '../utils/payrollWorkflowUtils';
```

## 🔄 主页面重构

### 重构前 (`PayrollWorkflowPage.tsx` - 754行)
- ❌ 包含大量状态管理代码
- ❌ 包含业务逻辑实现
- ❌ 包含完整的步骤组件实现
- ❌ 文件过长，难以维护

### 重构后 (`PayrollWorkflowPage.tsx` - 180行)
- ✅ 只关注页面结构和工作流配置
- ✅ 使用组合钩子获取所有功能
- ✅ 使用独立的步骤组件
- ✅ 代码简洁，职责清晰

## 🎯 重构优势

### 1. 单一职责原则
- **状态管理钩子**：专注于状态管理和数据流
- **业务逻辑钩子**：专注于业务操作和API调用
- **工具函数**：专注于纯函数计算和格式化
- **组合钩子**：专注于功能整合

### 2. 可测试性提升
- **纯函数工具**：易于单元测试
- **状态管理**：可独立测试状态变化
- **业务逻辑**：可模拟状态进行测试
- **组件解耦**：可独立测试各个组件

### 3. 可维护性提升
- **文件长度控制**：所有文件都在250行以内
- **职责清晰**：每个文件都有明确的职责
- **依赖关系清晰**：业务逻辑依赖状态管理，工具函数独立
- **易于扩展**：新增功能时可选择合适的层级

### 4. 可复用性提升
- **工具函数**：可在其他模块中复用
- **状态管理钩子**：可在其他工作流中复用
- **业务逻辑钩子**：可根据需要组合使用

## 📊 重构统计

| 指标 | 重构前 | 重构后 | 改进 |
|------|--------|--------|------|
| 主钩子文件行数 | 329行 | 20行 | ⬇️ 94% |
| 主页面文件行数 | 754行 | 180行 | ⬇️ 76% |
| 文件数量 | 1个 | 5个 | ⬆️ 模块化 |
| 最大文件行数 | 754行 | 200行 | ⬇️ 73% |
| 可测试性 | 低 | 高 | ⬆️ 显著提升 |
| 可维护性 | 低 | 高 | ⬆️ 显著提升 |

## 🚀 使用示例

### 在组件中使用主钩子
```typescript
import { usePayrollWorkflow } from './hooks';

const MyComponent: React.FC = () => {
  const workflow = usePayrollWorkflow();
  
  // 使用状态
  const { selectedPeriodId, hasDataForCycleStep1 } = workflow;
  
  // 使用操作
  const { checkDataForCycleStep1, handleStartCalculation } = workflow;
  
  return <div>...</div>;
};
```

### 单独使用状态管理钩子
```typescript
import { usePayrollWorkflowState } from './hooks';

const StateOnlyComponent: React.FC = () => {
  const state = usePayrollWorkflowState();
  
  return <div>...</div>;
};
```

### 使用工具函数
```typescript
import { PayrollWorkflowUtils } from './hooks';

// 在任何地方使用纯函数
const periodName = PayrollWorkflowUtils.formatPeriodName(period, periodId);
const isValid = PayrollWorkflowUtils.validatePeriodSelection(periodId, t);
```

## 🔮 后续优化建议

1. **添加单元测试**：为每个工具函数和钩子添加测试用例
2. **性能优化**：使用 `useMemo` 和 `useCallback` 优化性能
3. **错误边界**：添加错误处理和恢复机制
4. **类型安全**：进一步完善 TypeScript 类型定义
5. **文档完善**：为每个函数添加详细的 JSDoc 注释

---

*重构完成时间：2025-01-XX*  
*重构负责人：AI Assistant*  
*遵循原则：单一职责、文件长度控制、可测试性优先* 