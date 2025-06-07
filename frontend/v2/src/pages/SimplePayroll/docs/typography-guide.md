# 极简工资页面字体样式规范

## 📖 概述

本文档定义了极简工资页面的完整字体样式规范，确保整个页面具有统一、专业、易读的视觉效果。

## 🎨 设计原则

1. **一致性**：所有文字元素使用统一的字体族、大小和颜色规范
2. **层次性**：通过字体大小、粗细和颜色建立清晰的信息层次
3. **可读性**：确保在各种屏幕尺寸下都有良好的阅读体验
4. **专业性**：采用现代化的字体设计，符合企业级应用标准

## 📏 字体规范

### 字体族 (Font Family)
```less
@font-family-primary: 'Source Han Serif SC', 'Source Han Serif CN', '思源宋体', 'Noto Serif CJK SC', 'SimSun', '宋体', serif;
@font-family-mono: 'SF Mono', Monaco, Inconsolata, 'Roboto Mono', 'Source Code Pro', Menlo, Consolas, 'Courier New', monospace;
```

**主字体说明**：
- **思源宋体 (Source Han Serif)**：Adobe 和 Google 联合开发的开源中文字体
- **优势特点**：
  - 专为中日韩文字设计，显示效果优秀
  - 支持多种字重（ExtraLight 到 Heavy）
  - 适合正式文档和报表系统
  - 具有良好的屏幕显示效果
- **回退字体**：确保在字体加载失败时有合适的替代方案

### 字体大小 (Font Sizes)
| 变量名 | 大小 | 用途 | 示例 |
|--------|------|------|------|
| `@font-size-xs` | 10px | 极小文字 | 版权信息、辅助说明 |
| `@font-size-sm` | 12px | 小文字 | 标签、次要信息 |
| `@font-size-base` | 14px | 基础文字 | 正文、表单 |
| `@font-size-md` | 16px | 中等文字 | 重要信息、按钮 |
| `@font-size-lg` | 18px | 大文字 | 小标题、重要数值 |
| `@font-size-xl` | 20px | 特大文字 | 页面标题 |
| `@font-size-xxl` | 24px | 超大文字 | 主标题 |
| `@font-size-xxxl` | 28px | 巨大文字 | 数据展示 |

### 字体粗细 (Font Weights)
| 变量名 | 数值 | 用途 | 思源宋体对应 |
|--------|------|------|------------|
| `@font-weight-extralight` | 200 | 装饰性文字 | ExtraLight |
| `@font-weight-light` | 300 | 次要信息 | Light |
| `@font-weight-normal` | 400 | 正文 | Regular |
| `@font-weight-medium` | 500 | 重要信息 | Medium |
| `@font-weight-semibold` | 600 | 小标题 | SemiBold |
| `@font-weight-bold` | 700 | 标题、强调 | Bold |
| `@font-weight-heavy` | 800 | 特别强调 | Heavy |

### 行高 (Line Heights)
| 变量名 | 数值 | 用途 |
|--------|------|------|
| `@line-height-tight` | 1.2 | 标题、数值 |
| `@line-height-base` | 1.4 | 正文 |
| `@line-height-relaxed` | 1.6 | 长文本 |

## 🎯 颜色规范

### 基础文字颜色
| 变量名 | 颜色值 | 用途 |
|--------|--------|------|
| `@text-color-primary` | #1a1a1a | 主要文字：标题、重要内容 |
| `@text-color-secondary` | #666666 | 次要文字：描述、辅助信息 |
| `@text-color-tertiary` | #999999 | 三级文字：占位符、禁用状态 |
| `@text-color-quaternary` | #cccccc | 四级文字：分割线、边框 |
| `@text-color-inverse` | #ffffff | 反色文字：深色背景上的文字 |

### 语义化颜色
| 变量名 | 颜色值 | 用途 |
|--------|--------|------|
| `@text-color-success` | #52c41a | 成功状态 |
| `@text-color-warning` | #faad14 | 警告状态 |
| `@text-color-error` | #ff4d4f | 错误状态 |
| `@text-color-info` | #1890ff | 信息状态 |
| `@text-color-link` | #1890ff | 链接颜色 |
| `@text-color-link-hover` | #40a9ff | 链接悬停 |

### 数值专用颜色
| 变量名 | 颜色值 | 用途 |
|--------|--------|------|
| `@text-color-number-positive` | #52c41a | 正数/增长 |
| `@text-color-number-negative` | #ff4d4f | 负数/下降 |
| `@text-color-number-neutral` | #1a1a1a | 中性数值 |

## 🏷️ 样式类使用指南

### 标题样式
```html
<!-- 主标题 -->
<h1 className="typography-title-primary">极简工资报表系统</h1>

<!-- 二级标题 -->
<h2 className="typography-title-secondary">薪资数据概览</h2>

<!-- 三级标题 -->
<h3 className="typography-title-tertiary">统计信息</h3>
```

### 正文样式
```html
<!-- 主要正文 -->
<p className="typography-body-primary">重要的正文内容</p>

<!-- 次要正文 -->
<p className="typography-body-secondary">辅助说明文字</p>
```

### 标签样式
```html
<!-- 主要标签 -->
<label className="typography-label-primary">字段名称</label>

<!-- 次要标签 -->
<span className="typography-label-secondary">辅助信息</span>
```

### 数值样式
```html
<!-- 大数值显示 -->
<div className="typography-number-large">1,234,567.89</div>

<!-- 中等数值 -->
<div className="typography-number-medium">123,456.78</div>

<!-- 小数值 -->
<div className="typography-number-small">12,345.67</div>
```

### 状态样式
```html
<!-- 成功状态 -->
<span className="typography-body-primary typography-success">操作成功</span>

<!-- 警告状态 -->
<span className="typography-body-primary typography-warning">需要注意</span>

<!-- 错误状态 -->
<span className="typography-body-primary typography-error">操作失败</span>

<!-- 信息状态 -->
<span className="typography-body-primary typography-info">提示信息</span>
```

### 链接样式
```html
<!-- 普通链接 -->
<a href="#" className="typography-link">查看详情</a>

<!-- 重要链接 -->
<a href="#" className="typography-link typography-body-primary">重要操作</a>
```

## 📱 响应式设计

字体样式已经考虑了响应式设计，在不同屏幕尺寸下会自动调整：

- **桌面端 (≥1200px)**：使用标准字体大小
- **平板端 (768px-1199px)**：略微缩小字体大小
- **移动端 (<768px)**：进一步优化字体大小和间距

## 🔧 实际应用示例

### 统计卡片
```html
<div className="unified-stats-card">
  <div className="stat-main-value">
    <div className="stat-number">1,156,725.00</div>
    <div className="stat-unit">元</div>
  </div>
  <div className="stat-details">
    <div className="detail-item">
      <span className="detail-label">状态</span>
      <span className="detail-value typography-success">正常</span>
    </div>
  </div>
</div>
```

### 表单控件
```html
<div className="control-group">
  <label className="control-label">选择期间</label>
  <!-- DatePicker 和 Select 会自动应用字体样式 -->
</div>
```

## ✅ 最佳实践

1. **优先使用样式类**：使用预定义的 `.typography-*` 类而不是内联样式
2. **保持语义化**：根据内容的重要性选择合适的样式类
3. **避免混合使用**：不要在同一元素上混合多个字体大小类
4. **考虑可访问性**：确保文字对比度符合 WCAG 标准
5. **测试响应式**：在不同设备上测试字体显示效果

## 🚀 未来扩展

如需添加新的字体样式，请遵循以下原则：

1. 在 `styles.less` 中定义新的变量
2. 创建对应的样式类
3. 更新本文档
4. 在 `TypographyDemo.tsx` 中添加示例

---

*本规范适用于极简工资页面，确保整个页面具有统一、专业的视觉效果。* 