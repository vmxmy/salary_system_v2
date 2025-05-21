import dayjs, { Dayjs } from 'dayjs';
// 不要在工具函数中直接导入和使用 i18n
// import i18n from '../../../i18n';

/**
 * 获取日期的月份名称
 * @param date 日期
 * @returns 月份名称
 */
export const formatMonthName = (date: Dayjs): string => {
  return date.format('MMMM');
};

/**
 * 自动生成工资周期名称的翻译键和参数
 * @param startDate 开始日期
 * @returns 翻译信息对象
 */
export const getPayrollPeriodNameTranslation = (startDate: Dayjs): { key: string, params: Record<string, any> } => {
  const month = formatMonthName(startDate);
  const year = startDate.year();
  return {
    key: 'payroll:period.monthly_payroll',
    params: { month, year }
  };
};

/**
 * 自动生成工资周期名称，但需要在组件中使用
 * 示例用法：
 * const { t } = useTranslation(['payroll']);
 * const periodNameInfo = getPayrollPeriodNameTranslation(startDate);
 * const periodName = t(periodNameInfo.key, periodNameInfo.params);
 */

/**
 * 格式化工资周期显示
 * @param period 工资周期对象
 * @returns 格式化的显示名称
 */
export const formatPayrollPeriodDisplay = (period: { name: string, start_date: string, end_date: string }): string => {
  if (!period) return '';
  
  return `${period.name} (${dayjs(period.start_date).format('YYYY-MM-DD')} - ${dayjs(period.end_date).format('YYYY-MM-DD')})`;
}; 