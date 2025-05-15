# 高新区工资信息管理系统 - 样式规范文档

本文档介绍了项目的样式规范和使用方法，旨在提供一套统一的、符合 Ant Design 标准的 CSS 样式规范。

## 目录结构

```
styles/
├── theme.less       # 主题变量（覆盖 Ant Design 默认主题）
├── variables.less   # 额外变量（补充 theme.less）
├── components.less  # 组件样式
├── layout.less      # 布局样式
├── utilities.less   # 工具类
├── global.less      # 全局样式
├── animations.less  # 动画定义
├── mixins.less      # 混合函数
├── index.less       # 主样式文件（导入所有样式）
└── utils/           # 样式工具函数
    ├── styleHelpers.ts  # 样式辅助函数
    └── themeUtils.ts    # 主题工具函数
```

## 样式实现方式

本项目采用统一的样式管理方式，避免多种样式实现方式并存导致的问题。样式实现遵循以下原则：

1. **使用集中管理的 Less 文件**：所有样式都应该在 `styles` 目录下的 Less 文件中定义
2. **避免内联样式**：不要在组件中使用 `style` 属性定义样式
3. **避免组件级 CSS 文件**：不要为单个组件创建独立的 CSS 文件
4. **使用工具类**：对于简单的样式调整，使用预定义的工具类
5. **使用样式辅助函数**：对于需要动态计算的样式，使用样式辅助函数

## 样式迁移指南

如果你的组件中存在以下样式实现方式，请按照指南进行迁移：

### 1. 内联样式迁移

**原代码**：
```jsx
<div style={{ marginBottom: 16, padding: '8px 16px', borderRadius: 4, backgroundColor: '#f5f5f5' }}>
  内容
</div>
```

**迁移后**：
```jsx
<div className="mb-2 px-2 py-1 rounded bg-light">
  内容
</div>
```

### 2. 组件级 CSS 文件迁移

**原代码**：
```jsx
// MyComponent.css
.my-component {
  margin-bottom: 16px;
  padding: 8px 16px;
  border-radius: 4px;
  background-color: #f5f5f5;
}

// MyComponent.jsx
import './MyComponent.css';

const MyComponent = () => {
  return <div className="my-component">内容</div>;
};
```

**迁移后**：
将样式移动到 `styles/components.less` 或创建专门的组件样式文件：

```less
// styles/components/myComponent.less
.my-component {
  margin-bottom: @spacing-md;
  padding: @spacing-sm @spacing-md;
  border-radius: @border-radius-base;
  background-color: @bg-light;
}
```

然后在 `styles/components.less` 中导入：
```less
@import './components/myComponent.less';
```

### 3. 动态样式迁移

**原代码**：
```jsx
const getStyle = (type) => {
  return {
    color: type === 'success' ? 'green' : type === 'error' ? 'red' : 'blue',
    fontWeight: type === 'bold' ? 'bold' : 'normal'
  };
};

const MyComponent = ({ type }) => {
  return <div style={getStyle(type)}>内容</div>;
};
```

**迁移后**：
使用样式辅助函数：
```jsx
import { conditionalStyle } from '@/styles/utils/styleHelpers';

const MyComponent = ({ type }) => {
  const className = `text-${type === 'success' ? 'success' : type === 'error' ? 'danger' : 'primary'} ${type === 'bold' ? 'text-bold' : ''}`;
  return <div className={className}>内容</div>;
};
```

## 主题变量 (theme.less)

主题变量文件定义了全局使用的颜色、字体、间距等变量，是整个样式系统的基础。

### 使用方法

在自定义样式文件中导入主题变量：

```less
@import '../styles/theme.less';

.my-component {
  color: @primary-color;
  padding: @spacing-md;
  border-radius: @border-radius-base;
}
```

### 主要变量

- **颜色**：`@primary-color`, `@success-color`, `@warning-color`, `@error-color`, `@info-color`
- **文本颜色**：`@heading-color`, `@text-color`, `@text-color-secondary`, `@disabled-color`
- **边框颜色**：`@border-color-base`, `@border-color-split`
- **字体**：`@font-family`, `@code-family`, `@font-size-base`, `@font-size-sm`, `@font-size-lg`
- **圆角**：`@border-radius-base`, `@border-radius-sm`, `@border-radius-lg`
- **间距**：`@spacing-unit`, `@spacing-xs`, `@spacing-sm`, `@spacing-md`, `@spacing-lg`, `@spacing-xl`, `@spacing-xxl`
- **阴影**：`@shadow-1-up`, `@shadow-1-down`, `@shadow-1-left`, `@shadow-1-right`, `@shadow-2`, `@shadow-3`
- **响应式断点**：`@screen-xs`, `@screen-sm`, `@screen-md`, `@screen-lg`, `@screen-xl`, `@screen-xxl`

## 组件样式 (components.less)

组件样式文件提供了对 Ant Design 组件的样式扩展和覆盖。

### 表格样式

```jsx
// 基础表格
<Table className="ant-table" />

// 斑马条纹表格
<Table className="ant-table table-striped" />

// 紧凑型表格
<Table className="ant-table table-compact" />
```

### 表单样式

```jsx
// 基础表单
<Form />

// 紧凑型表单
<Form className="form-compact" />
```

### 卡片样式

```jsx
// 基础卡片
<Card />

// 紧凑型卡片
<Card className="card-compact" />
```

## 布局样式 (layout.less)

布局样式文件提供了页面布局和间距系统。

### 页面布局

```jsx
<Layout className="app-layout">
  <Sider className="app-sider">
    <div className="app-logo">
      <h1>系统名称</h1>
    </div>
    <Menu />
  </Sider>
  <Layout>
    <Header className="app-header">
      <div className="header-breadcrumb">
        <Breadcrumb />
      </div>
      <div className="header-user-info">
        <Avatar className="user-avatar" />
        <span>用户名</span>
      </div>
    </Header>
    <Content className="app-content">
      <div className="content-container">
        内容区域
      </div>
    </Content>
    <Footer className="app-footer">
      页脚内容
    </Footer>
  </Layout>
</Layout>
```

### 容器

```jsx
// 响应式容器
<div className="container">内容</div>

// 流式容器
<div className="container container-fluid">内容</div>
```

### 间距类

```jsx
// 外边距
<div className="m-2">所有方向外边距为 16px (2 * 8px)</div>
<div className="mt-3">上外边距为 24px (3 * 8px)</div>
<div className="mr-1">右外边距为 8px (1 * 8px)</div>
<div className="mb-4">下外边距为 32px (4 * 8px)</div>
<div className="ml-2">左外边距为 16px (2 * 8px)</div>
<div className="mx-3">水平外边距为 24px (3 * 8px)</div>
<div className="my-2">垂直外边距为 16px (2 * 8px)</div>

// 内边距
<div className="p-2">所有方向内边距为 16px (2 * 8px)</div>
<div className="pt-3">上内边距为 24px (3 * 8px)</div>
<div className="pr-1">右内边距为 8px (1 * 8px)</div>
<div className="pb-4">下内边距为 32px (4 * 8px)</div>
<div className="pl-2">左内边距为 16px (2 * 8px)</div>
<div className="px-3">水平内边距为 24px (3 * 8px)</div>
<div className="py-2">垂直内边距为 16px (2 * 8px)</div>

// 自动边距
<div className="mx-auto">水平居中</div>
<div className="ml-auto">右对齐</div>
<div className="mr-auto">左对齐</div>
```

## 工具类 (utilities.less)

工具类文件提供了常用的辅助类，用于快速应用样式。

### 文本工具类

```jsx
// 文本对齐
<p className="text-left">左对齐</p>
<p className="text-center">居中对齐</p>
<p className="text-right">右对齐</p>

// 文本样式
<p className="text-bold">粗体文本</p>
<p className="text-italic">斜体文本</p>
<p className="text-underline">下划线文本</p>

// 文本截断
<p className="text-truncate">超长文本将被截断...</p>

// 文本颜色
<p className="text-primary">主色文本</p>
<p className="text-success">成功色文本</p>
<p className="text-warning">警告色文本</p>
<p className="text-danger">危险色文本</p>
<p className="text-info">信息色文本</p>
<p className="text-dark">深色文本</p>
<p className="text-secondary">次要文本</p>
<p className="text-muted">禁用色文本</p>

// 字体大小
<p className="text-xs">超小文本</p>
<p className="text-sm">小文本</p>
<p className="text-base">基础文本</p>
<p className="text-lg">大文本</p>
<p className="text-xl">超大文本</p>
<p className="text-2xl">特大文本</p>
```

### 显示工具类

```jsx
<div className="d-none">隐藏元素</div>
<div className="d-block">块级元素</div>
<div className="d-flex">弹性布局</div>
<div className="d-inline-flex">内联弹性布局</div>

<div className="overflow-hidden">溢出隐藏</div>
<div className="overflow-auto">溢出自动滚动</div>
```

### Flex 布局工具类

```jsx
// Flex 方向
<div className="d-flex flex-row">行方向</div>
<div className="d-flex flex-column">列方向</div>

// 主轴对齐
<div className="d-flex justify-start">起点对齐</div>
<div className="d-flex justify-center">居中对齐</div>
<div className="d-flex justify-end">终点对齐</div>
<div className="d-flex justify-between">两端对齐</div>
<div className="d-flex justify-around">环绕对齐</div>

// 交叉轴对齐
<div className="d-flex items-start">起点对齐</div>
<div className="d-flex items-center">居中对齐</div>
<div className="d-flex items-end">终点对齐</div>
<div className="d-flex items-stretch">拉伸对齐</div>

// Flex 增长和收缩
<div className="flex-1">占用剩余空间</div>
<div className="flex-auto">自动伸缩</div>
<div className="flex-none">不伸缩</div>
```

### 边框和阴影工具类

```jsx
// 边框
<div className="border">四周边框</div>
<div className="border-top">上边框</div>
<div className="border-0">无边框</div>

// 圆角
<div className="rounded">基础圆角</div>
<div className="rounded-lg">大圆角</div>
<div className="rounded-full">圆形</div>

// 阴影
<div className="shadow-none">无阴影</div>
<div className="shadow">基础阴影</div>
<div className="shadow-lg">大阴影</div>
```

### 响应式工具类

```jsx
<div className="hidden-xs">在超小屏幕上隐藏</div>
<div className="hidden-sm">在小屏幕上隐藏</div>
<div className="hidden-md">在中等屏幕上隐藏</div>
<div className="hidden-lg">在大屏幕上隐藏</div>
<div className="hidden-xl">在超大屏幕上隐藏</div>

<div className="visible-xs">仅在超小屏幕上显示</div>
<div className="visible-sm">仅在小屏幕上显示</div>
<div className="visible-md">仅在中等屏幕上显示</div>
<div className="visible-lg">仅在大屏幕上显示</div>
<div className="visible-xl">仅在超大屏幕上显示</div>
```

## 全局样式 (global.less)

全局样式文件提供了基础元素的样式和重置。

### 动画类

```jsx
<div className="fade-in">淡入动画</div>
<div className="fade-out">淡出动画</div>
<div className="slide-up">上滑动画</div>
<div className="slide-down">下滑动画</div>
```

### 辅助类

```jsx
<div className="clearfix">清除浮动</div>
<img className="img-fluid" src="..." alt="响应式图片" />
<div className="sr-only">仅供屏幕阅读器使用</div>
```

## 最佳实践

1. **优先使用 Ant Design 组件**：大部分 UI 需求可以通过 Ant Design 组件实现，无需额外样式。
2. **使用工具类**：对于简单的样式调整，优先使用工具类，避免编写自定义 CSS。
3. **组件样式扩展**：当 Ant Design 组件不满足需求时，使用组件样式扩展。
4. **保持一致性**：遵循项目样式规范，保持界面风格一致。
5. **响应式设计**：使用响应式工具类和断点变量，确保在不同设备上的良好体验。

## 注意事项

1. 避免直接修改 Ant Design 组件的默认样式，优先使用类名覆盖。
2. 避免使用内联样式，除非是动态计算的样式。
3. 避免使用 `!important`，除非绝对必要。
4. 使用 Less 变量和混合，避免硬编码值。
5. 遵循 BEM 命名规范或其他一致的命名约定。
