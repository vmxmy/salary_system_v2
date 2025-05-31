// types.ts - 由 PayrollBulkImportPage 及其子组件共用
import type { ValidatedPayrollEntryData } from '../../types/payrollTypes';

export interface UploadResult {
  successCount: number;
  errorCount: number;
  errors: { record: any; error: string }[];
  createdEntries?: any[];
}

export interface ValidationSummary {
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
}

export interface DynamicTableProps {
  data: ValidatedPayrollEntryData[];
  getComponentName: (key: string, type: 'earnings' | 'deductions') => string;
  t: (key: string, params?: any) => string;
}

export interface ResultPanelProps {
  uploadResult: UploadResult | null;
  columns: any[];
  t: (key: string, params?: any) => string;
  showDetailedErrors: boolean;
  setShowDetailedErrors: (v: boolean) => void;
  handleStartAgain: () => void;
} 