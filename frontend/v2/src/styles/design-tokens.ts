/**
 * 现代化设计令牌系统 (Design Tokens)
 * 基于现代商业Web风格的设计系统
 * 参考: Stripe Dashboard, Linear, Notion 等现代企业级应用
 */

// 导入统一的 z-index 管理系统
import { zIndex } from './z-index';

export const designTokens = {
  // =============================================================================
  // 🎨 色彩系统 (Color System)
  // =============================================================================
  colors: {
    // 主色调 - 现代深蓝商务色
    primary: {
      50: '#eff6ff',
      100: '#dbeafe', 
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',  // 主色
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
      950: '#172554'
    },

    // 中性色 - 现代灰度系统
    neutral: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
      950: '#030712'
    },

    // 功能色 - 语义化状态色
    semantic: {
      success: {
        50: '#ecfdf5',
        100: '#d1fae5',
        500: '#10b981',
        600: '#059669',
        900: '#064e3b'
      },
      warning: {
        50: '#fffbeb',
        100: '#fef3c7',
        500: '#f59e0b',
        600: '#d97706',
        900: '#78350f'
      },
      error: {
        50: '#fef2f2',
        100: '#fee2e2',
        500: '#ef4444',
        600: '#dc2626',
        900: '#7f1d1d'
      },
      info: {
        50: '#eff6ff',
        100: '#dbeafe',
        500: '#3b82f6',
        600: '#2563eb',
        900: '#1e3a8a'
      }
    },

    // 背景色系统
    background: {
      primary: '#ffffff',
      secondary: '#f9fafb',
      tertiary: '#f3f4f6',
      accent: '#eff6ff',
      inverse: '#111827'
    },

    // 边框色系统
    border: {
      light: '#f3f4f6',
      default: '#e5e7eb',
      medium: '#d1d5db',
      strong: '#9ca3af'
    },

    // 文字色系统
    text: {
      primary: '#111827',
      secondary: '#374151',
      tertiary: '#6b7280',
      quaternary: '#9ca3af',
      inverse: '#ffffff',
      accent: '#3b82f6'
    },
    
    // =============================================================================
    // 📊 图表配色方案 (Chart Color Schemes)
    // =============================================================================
    charts: {
      // 基础图表配色 - 单色系蓝色渐变
      primary: [
        '#3b82f6', // 主色
        '#60a5fa',
        '#93c5fd',
        '#bfdbfe',
        '#dbeafe',
        '#eff6ff'
      ],
      
      // 分类图表配色 - 和谐互补色系
      categorical: [
        '#3b82f6', // 蓝色 (主色)
        '#10b981', // 绿色
        '#f59e0b', // 橙色
        '#8b5cf6', // 紫色
        '#ec4899', // 粉色
        '#06b6d4', // 青色
        '#84cc16', // 黄绿色
        '#6366f1', // 靛蓝色
        '#f43f5e', // 红色
        '#0ea5e9'  // 天蓝色
      ],
      
      // 单色系图表配色方案 - 蓝色
      monoBluePalette: [
        '#eff6ff',
        '#dbeafe',
        '#bfdbfe',
        '#93c5fd',
        '#60a5fa',
        '#3b82f6',
        '#2563eb',
        '#1d4ed8',
        '#1e40af',
        '#1e3a8a'
      ],
      
      // 单色系图表配色方案 - 绿色
      monoGreenPalette: [
        '#ecfdf5',
        '#d1fae5',
        '#a7f3d0',
        '#6ee7b7',
        '#34d399',
        '#10b981',
        '#059669',
        '#047857',
        '#065f46',
        '#064e3b'
      ],
      
      // 部门图表专用配色 (更鲜明的区分度)
      departments: [
        '#3b82f6', // 蓝色
        '#10b981', // 绿色
        '#f59e0b', // 橙色
        '#8b5cf6', // 紫色
        '#ec4899', // 粉色
        '#06b6d4', // 青色
        '#84cc16', // 黄绿色
        '#6366f1', // 靛蓝色
        '#f43f5e', // 红色
        '#0ea5e9', // 天蓝色
        '#14b8a6', // 蓝绿色
        '#d946ef', // 洋红色
        '#f97316', // 深橙色
        '#eab308', // 黄色
        '#22c55e'  // 草绿色
      ],
      
      // 薪资组成图表专用配色
      salary: {
        base: '#3b82f6',      // 基本工资
        allowance: '#10b981', // 津贴
        bonus: '#f59e0b',     // 奖金
        subsidy: '#8b5cf6',   // 补贴
        overtime: '#ec4899',  // 加班费
        other: '#6366f1'      // 其他
      },
      
      // 扣除项目图表专用配色
      deductions: {
        tax: '#f43f5e',         // 个税
        pension: '#3b82f6',     // 养老保险
        medical: '#10b981',     // 医疗保险
        unemployment: '#f59e0b',// 失业保险
        housing: '#8b5cf6',     // 住房公积金
        other: '#6366f1'        // 其他
      }
    }
  },

  // =============================================================================
  // 📝 排版系统 (Typography System)
  // =============================================================================
  typography: {
    // 字体族
    fontFamily: {
      primary: "'Noto Serif SC', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', serif",
      mono: "'SF Mono', 'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
      fallback: "'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', serif"
    },

    // 字号系统 (基于1.25倍比率)
    fontSize: {
      xs: '12px',    // 0.75rem
      sm: '14px',    // 0.875rem  
      base: '16px',  // 1rem - 基准
      lg: '18px',    // 1.125rem
      xl: '20px',    // 1.25rem
      '2xl': '24px', // 1.5rem
      '3xl': '30px', // 1.875rem
      '4xl': '36px', // 2.25rem
      '5xl': '48px'  // 3rem
    },

    // 字重系统
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800
    },

    // 行高系统
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75
    },

    // 字间距
    letterSpacing: {
      tight: '-0.025em',
      normal: '0em',
      wide: '0.025em'
    }
  },

  // =============================================================================
  // 📐 空间系统 (Spacing System)
  // =============================================================================
  spacing: {
    // 基于8px网格的空间系统
    0: '0px',
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    5: '20px',
    6: '24px',
    7: '28px',
    8: '32px',
    10: '40px',
    12: '48px',
    14: '56px',
    16: '64px',
    20: '80px',
    24: '96px',
    28: '112px',
    32: '128px'
  },

  // =============================================================================
  // 🎭 阴影系统 (Shadow System)
  // =============================================================================
  shadows: {
    none: 'none',
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
    
    // 彩色阴影
    colored: {
      primary: '0 4px 14px 0 rgba(59, 130, 246, 0.15)',
      success: '0 4px 14px 0 rgba(16, 185, 129, 0.15)',
      warning: '0 4px 14px 0 rgba(245, 158, 11, 0.15)',
      error: '0 4px 14px 0 rgba(239, 68, 68, 0.15)'
    }
  },

  // =============================================================================
  // 🔘 圆角系统 (Border Radius System)
  // =============================================================================
  borderRadius: {
    none: '0px',
    sm: '4px',
    base: '6px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    '2xl': '20px',
    '3xl': '24px',
    full: '9999px'
  },

  // =============================================================================
  // ⚡ 动画系统 (Animation System)
  // =============================================================================
  animations: {
    // 过渡时长
    duration: {
      fast: '150ms',
      base: '200ms',
      slow: '300ms',
      slower: '500ms'
    },

    // 缓动函数
    easing: {
      linear: 'linear',
      easeIn: 'cubic-bezier(0.4, 0.0, 1, 1)',
      easeOut: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
    },

    // 预定义动画
    presets: {
      fadeIn: 'fadeIn 200ms ease-out',
      slideUp: 'slideUp 300ms ease-out',
      scaleIn: 'scaleIn 150ms ease-out',
      bounce: 'bounce 400ms ease-out'
    }
  },

  // =============================================================================
  // 📱 断点系统 (Breakpoint System)
  // =============================================================================
  breakpoints: {
    sm: '640px',   // 手机横屏
    md: '768px',   // 平板
    lg: '1024px',  // 笔记本
    xl: '1280px',  // 桌面
    '2xl': '1536px' // 大屏
  },

  // =============================================================================
  // 🎚️ Z轴层级系统 (Z-Index System)
  // =============================================================================
  // 注意：这里的定义已废弃，请使用 /styles/z-index.ts 中的定义
  // 保留此处仅为向后兼容，将在下个版本中移除
  zIndex: {
    hide: -1,
    auto: 'auto',
    base: 0,
    docked: 10,
    dropdown: 1000,
    sticky: 1100,
    banner: 1200,
    overlay: 1300,
    modal: 1400,
    popover: 1500,
    tableColumnSetting: 1600, // 表格列设置弹窗
    skipLink: 1700,
    toast: 1800,
    tooltip: 1900
  }
} as const;

// =============================================================================
// 🛠️ 工具函数 (Utility Functions)
// =============================================================================

/**
 * 获取颜色值的工具函数
 */
export const getColor = (path: string, fallback = '#000000'): string => {
  const keys = path.split('.');
  let current: any = designTokens.colors;
  
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return fallback;
    }
  }
  
  return typeof current === 'string' ? current : fallback;
};

/**
 * 获取间距值的工具函数
 */
export const getSpacing = (size: keyof typeof designTokens.spacing): string => {
  return designTokens.spacing[size];
};

/**
 * 获取字体大小的工具函数
 */
export const getFontSize = (size: keyof typeof designTokens.typography.fontSize): string => {
  return designTokens.typography.fontSize[size];
};

/**
 * 将设计令牌转换为CSS变量字符串 (适用于亮色和暗色主题)
 * @returns {string} 包含CSS变量的字符串
 */
export const generateCSSVariables = (): string => {
  const lightVars = `
    :root, [data-theme='light'] {
      --bg-primary: ${designTokens.colors.background.primary};
      --bg-secondary: ${designTokens.colors.background.secondary};
      --bg-tertiary: ${designTokens.colors.background.tertiary};
      --text-primary: ${designTokens.colors.text.primary};
      --text-secondary: ${designTokens.colors.text.secondary};
      --text-tertiary: ${designTokens.colors.text.tertiary};
      --border-default: ${designTokens.colors.border.default};
      --border-light: ${designTokens.colors.border.light};
    }
  `;

  const darkVars = `
    [data-theme='dark'] {
      --bg-primary: ${designTokens.colors.neutral[900]};
      --bg-secondary: ${designTokens.colors.neutral[800]};
      --bg-tertiary: ${designTokens.colors.neutral[700]};
      --text-primary: ${designTokens.colors.neutral[100]};
      --text-secondary: ${designTokens.colors.neutral[300]};
      --text-tertiary: ${designTokens.colors.neutral[400]};
      --border-default: ${designTokens.colors.neutral[700]};
      --border-light: ${designTokens.colors.neutral[800]};
    }
  `;

  return lightVars + darkVars;
};

// 导出 z-index 系统以便直接使用
export { zIndex };

export default designTokens;