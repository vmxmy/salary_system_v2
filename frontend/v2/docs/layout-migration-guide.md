# 布局系统迁移指南

本指南将帮助您将现有页面迁移到新的布局系统，以解决布局混乱、组件嵌套和层叠冲突等问题。

## 目录

1. [核心概念](#核心概念)
2. [迁移步骤](#迁移步骤)
3. [组件对照表](#组件对照表)
4. [常见模式](#常见模式)
5. [最佳实践](#最佳实践)
6. [问题解决](#问题解决)

## 核心概念

### 新布局系统的优势

- **统一的设计系统**：基于 design-tokens.ts 的一致性设计
- **减少嵌套层级**：使用组合而非嵌套
- **消除内联样式**：通过 props 控制样式
- **响应式优先**：内置响应式断点支持
- **z-index 管理**：统一的层级管理系统

### 核心组件

1. **Box** - 基础布局原语
2. **FlexLayout** - Flexbox 布局容器
3. **GridLayout** - CSS Grid 布局容器
4. **Container** - 响应式内容容器
5. **PageLayout** - 页面布局模板
6. **Spacer** - 间距组件

## 迁移步骤

### 第一步：引入新的布局组件

```tsx
// 旧代码
import { Row, Col } from 'antd';
import ModernPageTemplate from '../components/common/ModernPageTemplate';

// 新代码
import { PageLayout, FlexLayout, GridLayout, Box } from '@/components/Layout';
```

### 第二步：替换页面容器

```tsx
// 旧代码
<div style={{ padding: '24px' }}>
  <ModernCard style={{ marginBottom: 24 }}>
    <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>页面标题</h1>
  </ModernCard>
  {/* 内容 */}
</div>

// 新代码
<PageLayout
  title="页面标题"
  subtitle="页面副标题"
  actions={headerActions}
  showCard={false}
>
  {/* 内容 */}
</PageLayout>
```

### 第三步：替换栅格系统

```tsx
// 旧代码 - Ant Design Row/Col
<Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
  <Col xs={24} sm={12} md={8} lg={6}>
    <Card>内容1</Card>
  </Col>
  <Col xs={24} sm={12} md={8} lg={6}>
    <Card>内容2</Card>
  </Col>
</Row>

// 新代码 - GridLayout
<Box mb="6">
  <GridLayout
    columns={4}
    gap="4"
    colsSm={2}
    colsMd={3}
    colsLg={4}
  >
    <Card>内容1</Card>
    <Card>内容2</Card>
  </GridLayout>
</Box>
```

### 第四步：移除内联样式

```tsx
// 旧代码
<div style={{ 
  display: 'flex', 
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '16px 24px',
  marginBottom: '24px'
}}>
  {/* 内容 */}
</div>

// 新代码
<FlexLayout
  justify="space-between"
  align="center"
  px="6"
  py="4"
  mb="6"
>
  {/* 内容 */}
</FlexLayout>
```

### 第五步：解决定位问题

```tsx
// 旧代码 - 使用 Affix
<Affix offsetTop={0}>
  <div className="context-bar">
    {/* 内容 */}
  </div>
</Affix>

// 新代码 - 使用 sticky 定位
<Box
  position="sticky"
  style={{
    top: 0,
    zIndex: zIndex.sticky
  }}
>
  <div className="context-bar">
    {/* 内容 */}
  </div>
</Box>
```

## 组件对照表

| 旧组件/模式 | 新组件 | 说明 |
|------------|--------|------|
| `<div style={{ padding: '24px' }}>` | `<Box p="6">` | 使用设计系统的间距值 |
| `<Row>/<Col>` | `<GridLayout>` | 更简洁的网格系统 |
| `display: flex` 内联样式 | `<FlexLayout>` | 专用的 Flex 容器 |
| `margin/padding` 内联样式 | Box 的 `m/p` 属性 | 统一的间距系统 |
| `ModernPageTemplate` | `<PageLayout>` | 新的页面布局组件 |
| `<Space>` | `<FlexLayout gap="3">` | 更灵活的间距控制 |
| 硬编码 z-index | 使用 `zIndex` 常量 | 统一的层级管理 |

## 常见模式

### 1. 统计卡片网格

```tsx
// 使用 GridLayout 实现响应式统计卡片
<GridLayout
  columns={6}
  gap="4"
  colsSm={2}    // 移动端 2 列
  colsMd={3}    // 平板 3 列
  colsLg={6}    // 桌面 6 列
>
  {statistics.map((stat, index) => (
    <StatisticCard key={index} {...stat} />
  ))}
</GridLayout>
```

### 2. 侧边栏 + 主内容布局

```tsx
// 使用 GridLayout 的自定义列宽
<GridLayout
  columns="300px 1fr"  // 固定侧边栏 + 弹性主内容
  gap="6"
  colsSm={1}           // 移动端单列
  colsLg={2}           // 桌面双列
>
  <Box>
    {/* 侧边栏内容 */}
  </Box>
  <Box>
    {/* 主内容区域 */}
  </Box>
</GridLayout>
```

### 3. 表单布局

```tsx
// 使用 FlexLayout 实现表单布局
<FlexLayout direction="column" gap="4">
  <Box>
    <label>字段标签</label>
    <Input />
  </Box>
  <Box>
    <label>字段标签</label>
    <Select />
  </Box>
  <FlexLayout gap="3">
    <Button type="primary">提交</Button>
    <Button>取消</Button>
  </FlexLayout>
</FlexLayout>
```

## 最佳实践

### 1. 使用语义化的间距

```tsx
// 避免
<Box style={{ marginBottom: '24px' }}>

// 推荐
<Box mb="6">  // 6 = 24px (基于 4px 单位)
```

### 2. 优先使用布局组件

```tsx
// 避免
<div style={{ display: 'flex', gap: '16px' }}>

// 推荐
<FlexLayout gap="4">
```

### 3. 统一使用设计令牌

```tsx
// 避免
style={{ color: '#3b82f6' }}

// 推荐
import { designTokens } from '@/styles/design-tokens';
style={{ color: designTokens.colors.primary[500] }}
```

### 4. 响应式设计

```tsx
// 利用响应式属性
<GridLayout
  columns={4}      // 默认 4 列
  colsSm={1}       // 小屏 1 列
  colsMd={2}       // 中屏 2 列
  colsLg={4}       // 大屏 4 列
>
```

## 问题解决

### Q: 如何处理复杂的嵌套结构？

A: 将复杂的嵌套拆分为独立的组件，使用组合而非嵌套：

```tsx
// 旧代码 - 过度嵌套
<Card>
  <div>
    <div>
      <div>
        内容
      </div>
    </div>
  </div>
</Card>

// 新代码 - 扁平化
<Card>
  <Box p="4">
    内容
  </Box>
</Card>
```

### Q: 如何迁移自定义的 CSS 样式？

A: 将样式转换为组件 props 或创建专用的样式类：

```tsx
// 使用 props
<Box
  p="4"
  bg="primary"
  borderRadius="md"
  shadow="base"
>

// 或创建样式类
<Box className="custom-card">
```

### Q: 如何处理动态样式？

A: 使用条件渲染或计算属性：

```tsx
<Box
  p={compact ? "2" : "4"}
  bg={isActive ? "primary" : "secondary"}
>
```

## 迁移检查清单

- [ ] 替换所有内联样式为组件 props
- [ ] 移除不必要的嵌套层级
- [ ] 使用统一的间距系统
- [ ] 应用响应式断点
- [ ] 使用 z-index 管理系统
- [ ] 测试不同屏幕尺寸下的布局
- [ ] 确保无障碍性（键盘导航、屏幕阅读器）

## 相关资源

- [设计令牌文档](./design-tokens.md)
- [响应式设计指南](./responsive-design.md)
- [组件 API 文档](./component-api.md)