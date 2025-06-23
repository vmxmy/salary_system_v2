# SimplePayroll Header 样式指南

## 概述
本指南展示了 SimplePayroll 模块中统一的现代化 header 样式系统。

## 基础 Header 样式

### 1. baseHeader
所有 header 的基础样式，提供了：
- 统一的内边距和高度
- 渐变背景色
- Flex 布局
- 响应式支持

```less
.baseHeader {
  padding: 20px 24px;
  background: linear-gradient(to bottom, #fafbfc 0%, #ffffff 100%);
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 64px;
}
```

## Header 组成部分

### 1. 标题区域 (headerTitle)
- **图标** (headerIcon): 24px，支持多种颜色
- **主标题** (headerText): 18px，font-weight: 600
- **副标题** (headerSubtext): 14px，较淡的颜色

### 2. 额外内容区域 (headerExtra)
- **徽章** (headerBadge): 状态标识，支持多种类型
- **操作按钮** (headerActions): 右侧操作区域

## Header 模式

### 1. 默认模式 (default)
标准的 header 样式，适用于大多数卡片

### 2. 紧凑模式 (compact)
- 减少内边距至 12px 20px
- 最小高度 48px
- 图标缩小至 20px
- 标题字号 16px

### 3. 透明模式 (transparent)
- 无背景色
- 无底部边框
- 适用于嵌套卡片

## 使用示例

### 1. 使用 ModernCard 组件
```tsx
import ModernCard from './ModernCard';

<ModernCard 
  icon={<PlusOutlined />}
  iconColor="purple"
  title="工资单生成"
  subtitle="2024年1月"
  badge={{ text: "待处理", type: "warning" }}
  headerMode="default"
  headerActions={
    <Button size="small">操作</Button>
  }
>
  {/* 卡片内容 */}
</ModernCard>
```

### 2. 直接使用样式类
```tsx
<Card className={styles.baseCard}>
  <div className={styles.baseHeader}>
    <div className={styles.headerTitle}>
      <span className={`${styles.headerIcon} ${styles.purple}`}>
        <BarChartOutlined />
      </span>
      <span className={styles.headerText}>
        报表生成
        <span className={styles.headerSubtext}>月度报表</span>
      </span>
    </div>
    <div className={styles.headerExtra}>
      <span className={`${styles.headerBadge} ${styles.success}`}>
        已完成
      </span>
    </div>
  </div>
  {/* 卡片内容 */}
</Card>
```

## 特定场景样式

### 1. statisticHeader
用于统计类卡片，紧凑布局，横向渐变背景

### 2. actionHeader
用于操作类卡片，紫色渐变背景，白色文字

### 3. dataHeader
用于数据展示卡片，透明背景，底部渐变分割线

## 颜色主题

### 图标颜色
- `blue` (默认): #1890ff
- `purple`: #722ed1
- `green`: #52c41a
- `orange`: #fa8c16

### 徽章类型
- `default`: 蓝色
- `success`: 绿色
- `warning`: 橙色
- `error`: 红色

## 响应式设计

移动端（< 768px）自动调整：
- Header 内边距减少
- 图标和文字尺寸缩小
- 副标题自动隐藏
- 卡片圆角调整为 8px

## 最佳实践

1. **保持一致性**：同一页面内的卡片应使用相同的 header 模式
2. **图标选择**：使用与功能相关的图标，保持图标风格统一
3. **颜色搭配**：根据内容重要性和状态选择合适的颜色
4. **响应式**：测试不同屏幕尺寸下的显示效果
5. **可访问性**：确保颜色对比度符合 WCAG 标准