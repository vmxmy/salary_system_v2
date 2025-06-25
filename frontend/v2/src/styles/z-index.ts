/**
 * Z-Index 层级管理系统
 * 
 * 设计原则：
 * 1. 使用语义化命名，避免魔法数字
 * 2. 按功能分组，每组预留足够的间隔
 * 3. 组件层级应该反映其在界面中的逻辑关系
 * 4. 避免随意修改已定义的值
 */

// 基础层级定义
const Z_INDEX_LEVELS = {
  // 基础内容层 (0-99)
  BASE: 1,
  DROPDOWN: 50,
  
  // 固定元素层 (100-199)
  STICKY: 100,
  FIXED: 150,
  
  // 遮罩层 (200-299)
  BACKDROP: 200,
  
  // 侧边栏层 (300-399)
  DRAWER: 300,
  SIDEBAR: 350,
  
  // 弹出层 (400-499)
  POPOVER: 400,
  TOOLTIP: 450,
  
  // 模态框层 (500-599)
  MODAL: 500,
  MODAL_MASK: 499,
  
  // 消息提示层 (600-699)
  MESSAGE: 600,
  NOTIFICATION: 650,
  
  // 最高层级 (900-999)
  LOADING: 900,
  MAXIMUM: 999,
} as const;

// 导出类型定义
export type ZIndexLevel = typeof Z_INDEX_LEVELS[keyof typeof Z_INDEX_LEVELS];

// 语义化的 z-index 映射
export const zIndex = {
  // 基础组件
  base: Z_INDEX_LEVELS.BASE,
  dropdown: Z_INDEX_LEVELS.DROPDOWN,
  
  // 固定定位元素
  sticky: Z_INDEX_LEVELS.STICKY,
  stickyHeader: Z_INDEX_LEVELS.STICKY + 1,
  fixedButton: Z_INDEX_LEVELS.FIXED,
  
  // 遮罩背景
  backdrop: Z_INDEX_LEVELS.BACKDROP,
  modalBackdrop: Z_INDEX_LEVELS.MODAL_MASK,
  
  // 侧边栏
  drawer: Z_INDEX_LEVELS.DRAWER,
  drawerMask: Z_INDEX_LEVELS.DRAWER - 1,
  sidebar: Z_INDEX_LEVELS.SIDEBAR,
  
  // 弹出元素
  popover: Z_INDEX_LEVELS.POPOVER,
  tooltip: Z_INDEX_LEVELS.TOOLTIP,
  
  // 模态框
  modal: Z_INDEX_LEVELS.MODAL,
  modalContent: Z_INDEX_LEVELS.MODAL + 1,
  
  // 消息提示
  message: Z_INDEX_LEVELS.MESSAGE,
  notification: Z_INDEX_LEVELS.NOTIFICATION,
  toast: Z_INDEX_LEVELS.MESSAGE + 10,
  
  // 加载状态
  loading: Z_INDEX_LEVELS.LOADING,
  loadingMask: Z_INDEX_LEVELS.LOADING - 1,
  
  // 特殊用途
  maximum: Z_INDEX_LEVELS.MAXIMUM,
} as const;

// 工具函数：创建具有特定偏移的 z-index
export const createZIndex = (base: keyof typeof zIndex, offset: number = 0): number => {
  return zIndex[base] + offset;
};

// 工具函数：检查 z-index 是否在合理范围内
export const isValidZIndex = (value: number): boolean => {
  return value >= 0 && value <= Z_INDEX_LEVELS.MAXIMUM;
};

// 导出 LESS 变量（用于样式文件）
export const zIndexLessVariables = `
// Z-Index Variables (Auto-generated - DO NOT EDIT)
@z-index-base: ${zIndex.base};
@z-index-dropdown: ${zIndex.dropdown};
@z-index-sticky: ${zIndex.sticky};
@z-index-sticky-header: ${zIndex.stickyHeader};
@z-index-fixed-button: ${zIndex.fixedButton};
@z-index-backdrop: ${zIndex.backdrop};
@z-index-modal-backdrop: ${zIndex.modalBackdrop};
@z-index-drawer: ${zIndex.drawer};
@z-index-drawer-mask: ${zIndex.drawerMask};
@z-index-sidebar: ${zIndex.sidebar};
@z-index-popover: ${zIndex.popover};
@z-index-tooltip: ${zIndex.tooltip};
@z-index-modal: ${zIndex.modal};
@z-index-modal-content: ${zIndex.modalContent};
@z-index-message: ${zIndex.message};
@z-index-notification: ${zIndex.notification};
@z-index-toast: ${zIndex.toast};
@z-index-loading: ${zIndex.loading};
@z-index-loading-mask: ${zIndex.loadingMask};
@z-index-maximum: ${zIndex.maximum};
`;

// 默认导出
export default zIndex;