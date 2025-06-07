# 📊 指标卡样式模板使用指南

## 概述

指标卡样式模板是一套统一的UI组件样式，用于在整个应用中创建一致的指标展示卡片。该模板提供了标准化的布局、字体、颜色和响应式设计。

## 🎨 设计特性

### 核心特性
- **统一的视觉风格**：基于思源宋体的字体系统
- **响应式设计**：适配不同屏幕尺寸
- **主题变体**：4种预设主题色彩
- **状态指示**：语义化的颜色状态
- **悬停效果**：优雅的交互反馈

### 布局结构
```
┌─────────────────────────────────┐
│ 📋 Header (标题 + 图标)          │
├─────────────────────────────────┤
│ 🔢 Main Value (主要数值)        │
│ ─────────────────────────────── │
│ 📝 Details (详细信息列表)       │
└─────────────────────────────────┘
```

## 🚀 基础用法

### 1. 基本结构

```tsx
import { Card, Divider } from 'antd';
import { UserOutlined } from '@ant-design/icons';

<Card className="metric-card-template metric-card-basic">
  <div className="metric-card-header">
    <div className="metric-card-title">
      <UserOutlined className="metric-icon" />
      基础信息
    </div>
  </div>
  <div className="metric-card-body">
    <div className="metric-main-value">
      <span className="metric-number">81</span>
      <span className="metric-unit">人</span>
    </div>
    <Divider className="metric-divider" />
    <div className="metric-details">
      <div className="metric-detail-item">
        <span className="metric-detail-label">期间:</span>
        <span className="metric-detail-value">2025-05</span>
      </div>
    </div>
  </div>
</Card>
```

### 2. 必需的CSS类

- `metric-card-template` - 基础模板样式
- `metric-card-[theme]` - 主题变体（basic/financial/status/audit）

## 🎨 主题变体

### 1. 基础信息主题 (`metric-card-basic`)
- **适用场景**：人员统计、基础数据展示
- **颜色特征**：绿蓝渐变背景
- **示例**：员工数量、部门信息

### 2. 财务信息主题 (`metric-card-financial`)
- **适用场景**：金额、财务数据展示
- **颜色特征**：橙绿渐变背景，绿色数值
- **示例**：工资总额、收入支出

### 3. 状态信息主题 (`metric-card-status`)
- **适用场景**：状态、进度展示
- **颜色特征**：蓝色渐变背景
- **示例**：审核状态、版本信息

### 4. 审核信息主题 (`metric-card-audit`)
- **适用场景**：审核、检查结果展示
- **颜色特征**：橙色渐变背景
- **示例**：错误统计、警告信息

## 🏷️ 状态颜色类

在 `metric-detail-item` 上添加状态类来改变数值颜色：

```tsx
<div className="metric-detail-item status-success">
  <span className="metric-detail-label">状态:</span>
  <span className="metric-detail-value">正常</span>
</div>
```

### 可用状态类
- `status-success` - 成功状态（绿色 #52c41a）
- `status-warning` - 警告状态（橙色 #faad14）
- `status-error` - 错误状态（红色 #ff4d4f）
- `status-info` - 信息状态（蓝色 #1890ff）

## 📱 响应式设计

模板自动适配不同屏幕尺寸：

### 桌面端 (>768px)
- 完整的内边距和字体大小
- 标准的图标和间距

### 平板端 (≤768px)
- 减少内边距
- 调整字体大小
- 优化触摸目标

### 移动端 (≤576px)
- 最小化内边距
- 紧凑的字体大小
- 垂直布局优化

## 🔧 自定义扩展

### 1. 创建新主题

```less
// 自定义主题
.metric-card-custom {
  .metric-card-header {
    background: linear-gradient(135deg, #your-color1 0%, #your-color2 100%);
    border-bottom-color: #your-border-color;
  }

  .metric-main-value .metric-number {
    color: #your-text-color;
  }
}
```

### 2. 添加自定义状态

```less
// 自定义状态颜色
.metric-detail-item.status-custom .metric-detail-value {
  color: #your-custom-color;
}
```

## 📋 完整示例

```tsx
import React from 'react';
import { Card, Divider, Row, Col } from 'antd';
import { DollarOutlined } from '@ant-design/icons';

const FinancialMetricCard: React.FC = () => {
  return (
    <Col xs={24} sm={12} lg={6}>
      <Card className="metric-card-template metric-card-financial">
        <div className="metric-card-header">
          <div className="metric-card-title">
            <DollarOutlined className="metric-icon" />
            财务信息
          </div>
        </div>
        <div className="metric-card-body">
          <div className="metric-main-value">
            <span className="metric-number">¥833,271.29</span>
          </div>
          <Divider className="metric-divider" />
          <div className="metric-details">
            <div className="metric-detail-item status-success">
              <span className="metric-detail-label">应发:</span>
              <span className="metric-detail-value">¥1,156,725.00</span>
            </div>
            <div className="metric-detail-item status-error">
              <span className="metric-detail-label">扣发:</span>
              <span className="metric-detail-value">¥323,453.71</span>
            </div>
            <div className="metric-detail-item">
              <span className="metric-detail-label">人均:</span>
              <span className="metric-detail-value">¥10,287</span>
            </div>
          </div>
        </div>
      </Card>
    </Col>
  );
};
```

## 🎯 最佳实践

### 1. 数据展示
- 主要数值应该突出显示
- 使用合适的单位和格式化
- 保持数据的一致性

### 2. 颜色使用
- 根据数据类型选择合适的主题
- 使用状态颜色来传达信息含义
- 避免过度使用颜色

### 3. 响应式考虑
- 确保在小屏幕上的可读性
- 考虑触摸设备的交互
- 测试不同屏幕尺寸的效果

### 4. 可访问性
- 确保足够的颜色对比度
- 提供有意义的标签文本
- 支持键盘导航

## 🔍 演示组件

查看 `MetricCardDemo.tsx` 文件获取完整的演示示例，包含所有主题变体和使用方法。

## 📚 相关文件

- `styles.less` - 样式定义
- `MetricCardDemo.tsx` - 演示组件
- `index.tsx` - 实际应用示例 