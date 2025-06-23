# 响应式统计卡片设计

## 概述
将 EnhancedPayrollStatistics 组件中的统计卡片从固定栅格布局改为自适应的响应式布局。

## 实现方案

### 1. CSS Grid 自适应布局
使用 CSS Grid 的 `auto-fit` 和 `minmax` 功能实现真正的自适应：

```less
.responsiveStatsGrid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
  width: 100%;
}
```

### 2. 断点策略

| 屏幕尺寸 | 最小卡片宽度 | 间距 | 预期列数 |
|---------|------------|------|---------|
| < 576px | 280px | 16px | 1列 |
| ≥ 576px | 240px | 12px | 1-2列 |
| ≥ 768px | 220px | 12px | 2-3列 |
| ≥ 992px | 200px | 12px | 3-4列 |
| ≥ 1200px | 180px | 8px | 4-6列 |
| ≥ 1600px | 固定6列 | 8px | 6列 |

### 3. 主要改进

#### 布局优势
- **自动适应**: 根据容器宽度自动调整列数
- **灵活性**: 不再依赖固定的栅格系统
- **平滑过渡**: 卡片数量动态变化时布局自动调整
- **最优空间利用**: 充分利用可用空间

#### 内容优化
- **字体大小响应式**: 标题和数值根据屏幕大小调整
- **文本溢出处理**: 长数字自动省略，保持布局整洁
- **间距调整**: 不同屏幕尺寸使用不同间距

### 4. 代码示例

```tsx
// 组件结构
<div className={styles.responsiveStatsGrid}>
  <div className={styles.statsGridItem}>
    <StatisticCard />
  </div>
  <div className={styles.statsGridItem}>
    <StatisticCard />
  </div>
  // ...更多卡片
</div>
```

```less
// 响应式样式
.statsGridItem {
  min-width: 0; // 防止内容溢出
  
  :global(.ant-pro-statistic-card) {
    height: 100%; // 保持高度一致
  }
}
```

### 5. 特殊处理

#### 金额显示优化
```less
.statisticChartItem {
  display: flex;
  justify-content: space-between;
  
  &.ellipsis {
    .statisticValue {
      max-width: 60%;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
}
```

#### 字体大小自适应
```less
.ant-statistic-content-value {
  font-size: 18px; // 移动端
  
  @media (min-width: 768px) {
    font-size: 20px; // 平板
  }
  
  @media (min-width: 1200px) {
    font-size: 24px; // 桌面
  }
}
```

## 效果展示

### 移动端 (< 576px)
- 单列显示
- 每个卡片占满宽度
- 字体较小，适合移动阅读

### 平板 (768px - 992px)  
- 2-3列自动布局
- 中等字体大小
- 适中的间距

### 桌面端 (> 1200px)
- 4-6列灵活布局
- 大字体，清晰易读
- 紧凑间距，信息密度高

### 大屏幕 (> 1600px)
- 固定6列布局
- 充分利用横向空间
- 适合监控大屏展示

## 优势总结

1. **真正的响应式**: 不依赖固定断点，平滑适应各种屏幕
2. **更好的空间利用**: 自动填充可用空间，减少空白
3. **一致的视觉体验**: 所有设备上保持良好的可读性
4. **易于维护**: 简化的CSS结构，更容易调整
5. **性能优化**: 减少DOM操作，使用纯CSS实现响应式