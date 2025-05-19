import dayjs, { Dayjs } from 'dayjs';
import i18n from '../../../i18n';

/**
 * 获取日期的月份名称
 * @param date 日期
 * @returns 月份名称
 */
export const formatMonthName = (date: Dayjs): string => {
  return date.format('MMMM');
};

/**
 * 自动生成工资周期名称，格式为"月度工资 八月 2024"或"Monthly Payroll August 2024"
 * @param startDate 开始日期
 * @returns 格式化的工资周期名称
 */
export const generatePayrollPeriodName = (startDate: Dayjs): string => {
  const month = formatMonthName(startDate);
  const year = startDate.year();
  return i18n.t('payroll:period.monthly_payroll', { month, year });
};

/**
 * 格式化工资周期显示
 * @param period 工资周期对象
 * @returns 格式化的显示名称
 */
export const formatPayrollPeriodDisplay = (period: { name: string, start_date: string, end_date: string }): string => {
  if (!period) return '';
  
  return `${period.name} (${dayjs(period.start_date).format('YYYY-MM-DD')} - ${dayjs(period.end_date).format('YYYY-MM-DD')})`;
}; 