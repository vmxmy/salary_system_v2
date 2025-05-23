// 薪资周期状态ID常量
// 这些值需要与数据库中的lookup_values表中的ID值匹配
export const PAYROLL_PERIOD_STATUS = {
  ACTIVE: 134,   // 活动状态
  CLOSED: 135,   // 已关闭状态
  ARCHIVED: 136, // 已归档状态
  PLANNED: 137,  // 计划中状态
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