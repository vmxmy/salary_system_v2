// viewApiTypes.ts
import type { Dayjs } from 'dayjs';
// Assuming PageMeta is reusable from HRManagement types, adjust if it's defined elsewhere or differently for views
import type { PageMeta } from '../pages/HRManagement/types'; 

export interface EmployeeBasic {
  id: number;
  employee_code: string;
  full_name: string; 
  phone_number?: string;
  email?: string;
  department_name?: string;
  position_name?: string; 
  personnel_category_name?: string;
  employee_status?: string; 
  hire_date?: string | Dayjs;
}

export interface EmployeeBasicPageResult {
  data: EmployeeBasic[];
  meta: PageMeta;
}

export interface EmployeeBasicQuery {
  page?: number;
  size?: number;
  sortBy?: string; 
  sortOrder?: 'asc' | 'desc';
  
  // Filtering parameters based on Phase 1 plan
  full_name_contains?: string; 
  employee_code_contains?: string;
  department_name_contains?: string;
  position_name_contains?: string;
  employee_status_equals?: string; // Assuming status is for exact match
  // TODO: Add other filter/sort params as supported by the backend /v2/views/employees API
} 