# 工资流程引导组件

## 📋 概述

这是一套全新设计的工资处理流程引导系统，旨在为用户提供直观、清晰的操作指导。系统会根据当前工资运行的状态，自动显示对应的操作步骤和可用功能。

## 🎯 设计目标

### 核心原则
- **直觉操作**：用户无需培训即可理解当前应该做什么
- **步骤引导**：清晰的步骤进度，用户始终知道自己在流程中的位置
- **条件控制**：只有满足条件才能进入下一步，确保流程正确性
- **智能提示**：提供操作要求和实用提示，减少用户困惑

### 用户体验
- 🎯 **单一焦点**：每个节点只显示当前相关的交互组件
- 🔒 **防错设计**：通过禁用和提示防止用户执行错误操作
- ⚡ **快捷操作**：每个步骤提供相应的一键操作按钮
- 💡 **智能反馈**：实时状态更新和操作结果反馈

## 🏗️ 组件架构

### 1. PayrollWorkflowGuide (基础版)
**文件**: `PayrollWorkflowGuide.tsx`

**功能特性**：
- 纯UI展示组件
- 步骤流程可视化
- 操作要求和提示展示
- 可扩展的配置结构

**适用场景**：
- 原型设计和演示
- 静态流程展示
- 自定义业务逻辑集成

### 2. EnhancedWorkflowGuide (增强版)
**文件**: `EnhancedWorkflowGuide.tsx`

**功能特性**：
- 集成实际API调用
- 智能状态检测和转换
- 条件控制和阻塞提示
- 实时审核状态显示
- 确认对话框和错误处理

**适用场景**：
- 生产环境使用
- 完整业务流程集成
- 实时数据交互

## 📊 工作流步骤定义

### 步骤1：数据准备
**状态**: `DRAFT` / `草稿` / `PRUN_CALCULATED` / `已计算`

**主要操作**：
- 批量导入薪资数据
- 运行计算引擎
- 数据完整性检查

**完成条件**：
- 员工基础信息完整
- 薪资组件配置正确
- 考勤数据准确无误
- 完成工资计算

### 步骤2：审核检查
**状态**: `PRUN_CALCULATED` / `已计算`

**主要操作**：
- 运行基础审核
- 运行高级审核
- 处理审核异常

**完成条件**：
- 所有数据完整性检查通过
- 计算规则验证无误
- 异常数据已处理或忽略

**阻塞条件**：
- 存在未处理的审核异常（error_count > 0）

### 步骤3：审核批准
**状态**: `IN_REVIEW` / `审核中`

**主要操作**：
- 提交审核申请
- 等待审批结果

**完成条件**：
- 审核检查全部通过
- 异常问题已解决
- 数据准确性确认

### 步骤4：支付准备
**状态**: `APPROVED_FOR_PAYMENT` / `批准支付`

**主要操作**：
- 生成银行文件
- 最终金额确认
- 标记已支付

**完成条件**：
- 审批流程已完成
- 支付金额最终确认
- 银行账户信息准确

### 步骤5：完成归档
**状态**: `PAID` / `已支付`

**主要操作**：
- 数据归档
- 生成报表
- 流程完成

**完成条件**：
- 工资发放已完成
- 员工确认收到工资
- 相关记录已保存

## 🔧 技术实现

### 状态映射
```typescript
const getCurrentStepFromStatus = (statusName?: string): number => {
  switch (statusName) {
    case 'DRAFT':
    case '草稿':
      return 0; // 数据准备
    case 'PRUN_CALCULATED':
    case '已计算':
      return 1; // 审核检查
    case 'IN_REVIEW':
    case '审核中':
      return 2; // 审核批准
    case 'APPROVED_FOR_PAYMENT':
    case '批准支付':
      return 3; // 支付准备
    case 'PAID':
    case '已支付':
      return 4; // 完成归档
    default:
      return 0;
  }
};
```

### 条件控制
```typescript
const canProceedToNext = (stepIndex: number): boolean => {
  switch (stepIndex) {
    case 1: // 审核检查步骤
      return !auditSummary || auditSummary.error_count === 0;
    default:
      return true;
  }
};
```

### API集成
```typescript
const handleSubmitForReview = async () => {
  // 检查前置条件
  if (auditSummary && auditSummary.error_count > 0) {
    message.error('请先解决所有审核异常后再提交审核');
    return;
  }

  // 确认对话框
  confirm({
    title: '确认提交审核',
    content: '提交后将进入审批流程，期间数据不可修改。确定要提交吗？',
    onOk: async () => {
      // 执行API调用
      await simplePayrollApi.updateAuditStatus({
        payroll_run_id: selectedVersion.id,
        status: 'IN_REVIEW'
      });
    }
  });
};
```

## 🎮 使用方法

### 基础使用
```tsx
import { PayrollWorkflowGuide } from './components/PayrollWorkflowGuide';

<PayrollWorkflowGuide
  selectedVersion={currentVersion}
  onRefresh={handleRefresh}
  onStepChange={handleStepChange}
/>
```

### 增强版使用
```tsx
import { EnhancedWorkflowGuide } from './components/EnhancedWorkflowGuide';

<EnhancedWorkflowGuide
  selectedVersion={currentVersion}
  auditSummary={auditSummary}
  onRefresh={handleRefresh}
  onNavigateToBulkImport={handleNavigateToBulkImport}
/>
```

### 演示页面
访问 `WorkflowDemoPage.tsx` 查看完整的演示效果，包括：
- 不同状态下的UI展示
- 交互功能演示
- 组件对比说明

## 🔮 扩展性

### 添加新步骤
1. 在 `getStepsConfig()` 中添加新的步骤配置
2. 更新 `getCurrentStepFromStatus()` 状态映射
3. 添加相应的API调用函数
4. 更新条件控制逻辑

### 自定义操作
```typescript
const customAction: WorkflowAction = {
  key: 'custom_action',
  label: '自定义操作',
  type: 'primary',
  icon: <CustomIcon />,
  disabled: false,
  onClick: async () => {
    // 自定义逻辑
  }
};
```

### 主题定制
组件使用Ant Design的主题系统，可以通过ConfigProvider进行全局主题定制。

## 📈 性能优化

- 使用 `useCallback` 优化函数引用
- 条件渲染减少不必要的组件渲染
- 懒加载大型组件
- API调用防抖和缓存

## 🧪 测试建议

1. **状态转换测试**：验证不同状态下的UI展示
2. **条件控制测试**：验证阻塞条件的正确性
3. **API集成测试**：验证API调用的正确性
4. **用户交互测试**：验证用户操作流程的完整性

## 🚀 部署说明

1. 确保所有依赖的API端点已正确配置
2. 验证权限控制和错误处理
3. 测试不同用户角色的访问权限
4. 监控性能和用户体验指标 