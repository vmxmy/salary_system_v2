export interface DepartmentCostData {
  departmentId: string | number;
  departmentName: string;
  currentCost: number;
  employeeCount: number;
  currentNetPay?: number;
  currentDeductions?: number;
  color?: string;
} 