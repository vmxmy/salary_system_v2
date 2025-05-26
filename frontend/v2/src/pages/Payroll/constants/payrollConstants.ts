// 薪资周期状态ID常量 - 已弃用，请使用动态状态工具
// @deprecated 使用 dynamicStatusUtils 中的函数动态获取状态ID
export const PAYROLL_PERIOD_STATUS = {
  ACTIVE: 134,   // 活动状态 - 仅用于向后兼容
  CLOSED: 135,   // 已关闭状态 - 仅用于向后兼容
  ARCHIVED: 136, // 已归档状态 - 仅用于向后兼容
  PLANNED: 137,  // 计划中状态 - 仅用于向后兼容
};

// 薪资周期状态代码常量
export const PAYROLL_PERIOD_STATUS_CODES = {
  ACTIVE: 'ACTIVE',
  CLOSED: 'CLOSED',
  ARCHIVED: 'ARCHIVED',
  PLANNED: 'PLANNED'
};

// 薪资运行状态ID常量
export const PAYROLL_RUN_STATUS = {
  DRAFT: 2001, // 假设DRAFT状态的ID是2001
  IN_PROGRESS: 2002, // 假设IN_PROGRESS状态的ID是2002
  COMPLETED: 2003, // 假设COMPLETED状态的ID是2003
  CANCELLED: 2004, // 假设CANCELLED状态的ID是2004
}; 