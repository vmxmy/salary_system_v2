import i18n from '../../../i18n'; // Added
import type { LookupValue } from '../types/payrollTypes'; // Assuming LookupValue might be used or extended

export interface StatusOption {
  id: number;
  display_name_key: string; // Changed from display_name to display_name_key
  color: string;
}

// --- PayrollRun Statuses ---
export const PAYROLL_RUN_STATUS_OPTIONS: StatusOption[] = [
  { id: 201, display_name_key: 'payroll_run_status.draft', color: 'default' },
  { id: 202, display_name_key: 'payroll_run_status.processing', color: 'blue' },
  { id: 203, display_name_key: 'payroll_run_status.pending_review', color: 'orange' },
  { id: 204, display_name_key: 'payroll_run_status.approved', color: 'cyan' },
  { id: 62, display_name_key: 'payroll_run_status.approved_for_payment', color: 'purple' }, // ID 62 seems specific
  { id: 205, display_name_key: 'payroll_run_status.paid', color: 'success' },
  { id: 206, display_name_key: 'payroll_run_status.cancelled', color: 'red' },
  { id: 207, display_name_key: 'payroll_run_status.error', color: 'error' },
];

export const getPayrollRunStatusDisplay = (statusId?: number): { text: string; color: string } => {
  if (statusId === undefined || statusId === null) return { text: i18n.t('common.status_na'), color: 'default' };
  const status = PAYROLL_RUN_STATUS_OPTIONS.find(opt => opt.id === statusId);
  return status ? { text: i18n.t(status.display_name_key), color: status.color } : { text: i18n.t('common.unknown_status_param', { statusId }), color: 'default' };
};

// --- PayrollEntry Statuses ---
export const PAYROLL_ENTRY_STATUS_OPTIONS: StatusOption[] = [
  { id: 301, display_name_key: 'payroll_entry_status.pending_calculation', color: 'default' },
  { id: 302, display_name_key: 'payroll_entry_status.calculated', color: 'blue' },
  { id: 303, display_name_key: 'payroll_entry_status.pending_confirmation', color: 'orange' },
  { id: 304, display_name_key: 'payroll_entry_status.confirmed', color: 'green' },
  { id: 305, display_name_key: 'payroll_entry_status.adjusted', color: 'purple' },
  { id: 306, display_name_key: 'payroll_entry_status.archived', color: 'cyan' },
  { id: 307, display_name_key: 'payroll_entry_status.error', color: 'error' },
];

export const getPayrollEntryStatusDisplay = (statusId?: number): { text: string; color: string } => {
  if (statusId === undefined || statusId === null) return { text: i18n.t('common.status_na'), color: 'default' };
  const status = PAYROLL_ENTRY_STATUS_OPTIONS.find(opt => opt.id === statusId);
  return status ? { text: i18n.t(status.display_name_key), color: status.color } : { text: i18n.t('common.unknown_status_param', { statusId }), color: 'default' };
};

// --- PayrollPeriod Statuses (Example - if needed) ---
// Define if PayrollPeriod also uses a similar status system displayed in UI
// export const PAYROLL_PERIOD_STATUS_OPTIONS: StatusOption[] = [
//   { id: 101, display_name_key: 'payroll_period_status.planned', color: 'default' },
//   { id: 102, display_name_key: 'payroll_period_status.open', color: 'blue' },
//   { id: 103, display_name_key: 'payroll_period_status.closed', color: 'red' },
//   { id: 104, display_name_key: 'payroll_period_status.archived', color: 'cyan' },
// ];

// export const getPayrollPeriodStatusDisplay = (statusId?: number): { text: string; color: string } => {
//   if (statusId === undefined || statusId === null) return { text: i18n.t('common.status_na'), color: 'default' };
//   const status = PAYROLL_PERIOD_STATUS_OPTIONS.find(opt => opt.id === statusId);
//   return status ? { text: i18n.t(status.display_name_key), color: status.color } : { text: i18n.t('common.unknown_status_param', { statusId }), color: 'default' };
// }; 