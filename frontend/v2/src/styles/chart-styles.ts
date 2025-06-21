/**
 * 图表样式配置
 * 基于设计令牌系统，为各类图表提供统一的样式配置
 */

import { designTokens } from './design-tokens';

/**
 * 柱状图标准配置
 */
export const barChartConfig = {
  // 基础配置
  margin: {
    top: 15,
    right: 12,
    left: 12,
    bottom: 25,
  },
  barGap: 3,
  barSize: 18,
  
  // 动画配置
  animation: {
    duration: 800,
    easing: 'ease',
  },
  
  // 坐标轴配置
  xAxis: {
    axisLine: false,
    tickLine: false,
    tick: {
      fontSize: 10,
      fill: designTokens.colors.text.secondary,
      fontWeight: 500,
    },
    dy: 10,
  },
  
  // 鼠标悬停配置
  tooltip: {
    cursor: {
      fill: 'rgba(0, 0, 0, 0.05)',
    },
  },
  
  // 颜色配置
  colors: designTokens.colors.charts.departments,
  
  // 柱形样式
  barStyle: {
    radius: 4,
    shadow: 'drop-shadow(0px 2px 2px rgba(0, 0, 0, 0.1))',
  },
};

/**
 * 饼图标准配置
 */
export const pieChartConfig = {
  // 基础配置
  outerRadius: 60,
  innerRadius: 40,
  paddingAngle: 3,
  
  // 边距配置，确保图表完整显示
  margin: {
    top: 10,
    right: 10,
    left: 10,
    bottom: 10,
  },
  
  // 动画配置
  animation: {
    begin: 0,
    duration: 800,
    easing: 'ease',
  },
  
  // 标签配置
  label: {
    show: true,
    fontSize: 10,
    fill: designTokens.colors.text.inverse,
  },
  
  // 中心文本配置
  centerText: {
    primary: {
      fontSize: 20,
      fontWeight: 'bold',
      fill: designTokens.colors.primary[500],
      y: 46,
    },
    secondary: {
      fontSize: 12,
      fill: designTokens.colors.text.secondary,
      y: 60,
    },
  },
  
  // 颜色配置
  colors: designTokens.colors.charts.categorical,
  
  // 扇区样式
  cellStyle: {
    stroke: designTokens.colors.background.primary,
    strokeWidth: 2,
  },
};

/**
 * 折线图标准配置
 */
export const lineChartConfig = {
  // 基础配置
  margin: {
    top: 15,
    right: 12,
    left: 12,
    bottom: 25,
  },
  
  // 动画配置
  animation: {
    duration: 1000,
    easing: 'ease',
  },
  
  // 线条样式
  line: {
    strokeWidth: 2,
    dot: {
      r: 4,
      strokeWidth: 2,
    },
  },
  
  // 颜色配置
  colors: [
    designTokens.colors.primary[500],
    designTokens.colors.semantic.success[500],
    designTokens.colors.semantic.warning[500],
  ],
  
  // 网格配置
  grid: {
    horizontal: true,
    vertical: false,
    stroke: designTokens.colors.border.light,
  },
};

/**
 * 通用图表Tooltip样式
 */
export const tooltipStyle = {
  header: {
    padding: '6px 10px',
    borderTopLeftRadius: '6px',
    borderTopRightRadius: '6px',
    fontWeight: 500,
    color: '#fff',
  },
  body: {
    padding: '8px 10px',
    backgroundColor: '#fff',
    borderBottomLeftRadius: '6px',
    borderBottomRightRadius: '6px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    border: '1px solid #e8e8e8',
  },
  item: {
    margin: '4px 0',
    fontSize: '12px',
  },
  label: {
    color: designTokens.colors.text.secondary,
  },
  value: {
    fontWeight: 500,
    color: designTokens.colors.text.primary,
  },
};

/**
 * 饼图容器配置，确保响应式显示
 */
export const pieChartContainerConfig = {
  minHeight: 200,
  defaultHeight: 250,
  aspectRatio: '1:1',
  padding: '12px',
}; 