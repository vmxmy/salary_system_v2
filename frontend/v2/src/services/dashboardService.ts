import apiClient from '../api';
import { employeeService } from './employeeService';
import { useTranslation } from 'react-i18next';
// Assuming useTranslation is imported or mocked for non-component files
// For a real-world scenario, you might pass the `t` function down from a component
// or use a global translation instance if available in your i18n setup.
// For this example, I'll assume a dummy t or a context-aware t.
// const t = (key: string, defaultValue?: string) => defaultValue || key; // Dummy t for service, replace with actual i18n setup

// 仪表盘数据类型定义
export interface DashboardKpiData {
  totalEmployees: number;
  totalEmployeesLastMonth: number;
  monthlyPayroll: number;
  monthlyPayrollLastMonth: number;
  pendingApprovals: number;
  averageSalary: number;
  averageSalaryLastMonth: number;
  activePayrollRuns: number;
  completedPayrollRuns: number;
}

export interface SalaryTrendItem {
  month: string;
  totalPayroll: number;
  averageSalary: number;
  employeeCount: number;
}

export interface DepartmentSalaryItem {
  department: string;
  departmentName: string;
  totalPayroll: number;
  employeeCount: number;
  averageSalary: number;
}

export interface EmployeeGradeItem {
  grade: string;
  gradeName: string;
  count: number;
  percentage: number;
}

export interface PayrollStatusItem {
  status: string;
  statusName: string;
  count: number;
  totalAmount: number;
}

export interface RecentPayrollRun {
  id: number;
  periodName: string;
  status: string;
  totalAmount: number;
  employeeCount: number;
  createdAt: string;
}

// 仪表盘服务
export const dashboardService: {
  getKpiData(): Promise<DashboardKpiData>;
  getSalaryTrend(): Promise<SalaryTrendItem[]>;
  getDepartmentSalaryDistribution(): Promise<DepartmentSalaryItem[]>;
  getEmployeeGradeDistribution(): Promise<EmployeeGradeItem[]>;
  getPayrollStatusDistribution(): Promise<PayrollStatusItem[]>;
  getRecentPayrollRuns(): Promise<RecentPayrollRun[]>;
} = {
  // 获取KPI数据
  async getKpiData(): Promise<DashboardKpiData> {
    try {
      // 获取员工总数
      const employeeResponse = await employeeService.getEmployees({ page: 1, size: 1 });
      const totalEmployees = employeeResponse.meta?.total || 0;

      // TODO: 获取上月员工数，需要后端API支持
      const totalEmployeesLastMonth = 0;

      // Getting payroll periods is not directly used for KPI calculation here,
      // but might be for other dashboard components. Keeping the fetch,
      // but note its data isn't consumed in this KPI section.
      let payrollPeriods: any[] = [];
      try {
        const payrollPeriodsResponse = await apiClient.get('/payroll-periods?page=1&size=5');
        payrollPeriods = payrollPeriodsResponse.data?.data || [];
      } catch (error) {
        // Handle error for payrollPeriods fetch if necessary
        payrollPeriods = [];
      }

      // 获取薪资审核数据
      let payrollRuns: any[] = [];
      try {
        const payrollRunsResponse = await apiClient.get('/payroll-runs?page=1&size=10');
        payrollRuns = payrollRunsResponse.data?.data || [];
      } catch (error) {
        // Handle error for payrollRuns fetch if necessary
        payrollRuns = [];
      }

      // 计算当月薪资总额（从最近的薪资审核中获取）
      let monthlyPayroll = 0;
      let activePayrollRuns = 0;
      let completedPayrollRuns = 0;

      payrollRuns.forEach((run: any) => {
        if (run.status_name === 'Completed' || run.status_name === 'Completed') {
          monthlyPayroll += run.total_amount || 0;
          completedPayrollRuns++;
        } else if (run.status_name === 'In Progress' || run.status_name === 'In Progress') {
          activePayrollRuns++;
        }
      });

      // TODO: 获取上月薪资总额，需要后端API支持
      const monthlyPayrollLastMonth = 0;
      const averageSalary = totalEmployees > 0 ? monthlyPayroll / totalEmployees : 0;
      // averageSalaryLastMonth depends on backend data for totalEmployeesLastMonth and monthlyPayrollLastMonth
      const averageSalaryLastMonth = totalEmployeesLastMonth > 0 ? monthlyPayrollLastMonth / totalEmployeesLastMonth : 0;

      // 待办任务数量（待审批的薪资审核）
      const pendingApprovals = payrollRuns.filter((run: any) =>
        run.status_name === 'Pending Approval' || run.status_name === 'Pending Approval'
      ).length;

      return {
        totalEmployees,
        totalEmployeesLastMonth, // 依赖后端API
        monthlyPayroll,
        monthlyPayrollLastMonth, // 依赖后端API
        pendingApprovals,
        averageSalary,
        averageSalaryLastMonth, // 依赖 totalEmployeesLastMonth 和 monthlyPayrollLastMonth
        activePayrollRuns,
        completedPayrollRuns,
      };
    } catch (error) {
      // Return default data on error
      return {
        totalEmployees: 0,
        totalEmployeesLastMonth: 0,
        monthlyPayroll: 0,
        monthlyPayrollLastMonth: 0,
        pendingApprovals: 0,
        averageSalary: 0,
        averageSalaryLastMonth: 0,
        activePayrollRuns: 0,
        completedPayrollRuns: 0,
      };
    }
  },

  // 获取薪资趋势数据
  async getSalaryTrend(): Promise<SalaryTrendItem[]> {
    try {
      // 获取最近6个月的薪资周期数据
      const response = await apiClient.get('/payroll-periods?page=1&size=6');
      const periods = response.data?.data || [];

      const trendData: SalaryTrendItem[] = [];

      for (const period of periods) {
        try {
          // 获取该周期的薪资审核数据
          const runsResponse = await apiClient.get(`/payroll-runs?period_id=${period.id}`);
          const runs = runsResponse.data?.data || [];

          const totalPayroll = runs.reduce((sum: number, run: any) => sum + (run.total_amount || 0), 0);
          const employeeCount = runs.reduce((sum: number, run: any) => sum + (run.employee_count || 0), 0);
          const averageSalary = employeeCount > 0 ? totalPayroll / employeeCount : 0;

          // Only add if real data is obtained (runs.length > 0)
          if (runs.length > 0) {
            trendData.push({
              month: period.name || `${period.start_date?.substring(5, 7)}-${period.start_date?.substring(8, 10)}`,
              totalPayroll: totalPayroll,
              averageSalary: averageSalary,
              employeeCount: employeeCount,
            });
          }
        } catch (error) {
          // Continue to next period if fetching runs for a specific period fails
        }
      }

      return trendData.reverse(); // Order chronologically
    } catch (error) {
      return []; // Return empty array on error
    }
  },

  // 获取部门薪资分布
  async getDepartmentSalaryDistribution(): Promise<DepartmentSalaryItem[]> {
    try {
      // 获取部门列表
      const departments = await employeeService.getDepartmentsLookup();
      const distributionData: DepartmentSalaryItem[] = [];

      for (const dept of departments.slice(0, 8)) { // Limit to max 8 departments to avoid too many requests
        try {
          // 获取该部门的员工数据
          const employeesResponse = await employeeService.getEmployees({
            page: 1,
            size: 50,
            department_id: dept.id?.toString(),
          });

          const employeeCount = employeesResponse.meta?.total || 0;

          // TODO: Real total and average salaries for departments need backend API support
          // Currently, they are set to 0, or the backend could directly provide these aggregated data
          const totalPayroll = 0;
          const averageSalary = 0;

          if (employeeCount > 0) {
            distributionData.push({
              department: dept.code || 'UNKNOWN',
              departmentName: dept.name || 'Unknown',
              totalPayroll, // Depends on backend API
              employeeCount,
              averageSalary, // Depends on backend API
            });
          }
        } catch (error) {
          // Continue to next department if fetching employees for a specific department fails
        }
      }

      return distributionData.sort((a, b) => b.employeeCount - a.employeeCount); // Sort by employee count as salary data is not real
    } catch (error) {
      return []; // Return empty array on error
    }
  },

  // 获取员工职级分布
  async getEmployeeGradeDistribution(): Promise<EmployeeGradeItem[]> {
    try {
      // 获取职级查找数据
      const jobLevels = await employeeService.getJobPositionLevelsLookup();
      const gradeData: EmployeeGradeItem[] = [];

      // TODO: Real employee grade distribution (number and percentage for each grade) needs backend API to directly provide statistical data
      // Currently, they are set to 0, or the backend could directly provide these aggregated data
      for (const level of jobLevels.slice(0, 6)) { // Limit to max 6 grades
        const count = 0; // Depends on backend API
        const percentage = 0; // Depends on backend API

        // Temporarily commented out, as count is always 0
        // if (count > 0) {
        gradeData.push({
          grade: level.value,
          gradeName: level.label,
          count, // Depends on backend API
          percentage, // Depends on backend API
        });
        // }
      }

      return gradeData.sort((a, b) => b.count - a.count); // Sort by count, currently all 0
    } catch (error) {
      return []; // Return empty array on error
    }
  },

  // 获取薪资状态分布
  async getPayrollStatusDistribution(): Promise<PayrollStatusItem[]> {
    try {
      const response = await apiClient.get('/payroll-runs?page=1&size=50');
      const payrollRuns = response.data?.data || [];

      const statusMap = new Map<string, { count: number; totalAmount: number; statusName: string }>();

      payrollRuns.forEach((run: any) => {
        const status = run.status_code || 'unknown';
        const statusName = run.status_name || 'Unknown';
        const amount = run.total_amount || 0;

        if (statusMap.has(status)) {
          const existing = statusMap.get(status)!;
          existing.count++;
          existing.totalAmount += amount;
        } else {
          statusMap.set(status, {
            count: 1,
            totalAmount: amount,
            statusName,
          });
        }
      });

      const statusData: PayrollStatusItem[] = [];
      statusMap.forEach((value, key) => {
        statusData.push({
          status: key,
          statusName: value.statusName,
          count: value.count,
          totalAmount: value.totalAmount,
        });
      });

      return statusData.sort((a, b) => b.count - a.count);
    } catch (error) {
      return []; // Return empty array on error
    }
  },

  // 获取最近的薪资审核记录
  async getRecentPayrollRuns(): Promise<RecentPayrollRun[]> {
    const { t } = useTranslation();
    try {
      const response = await apiClient.get('/payroll-runs?page=1&size=5');
      const payrollRuns = response.data?.data || [];

      return payrollRuns.map((run: any) => ({
        id: run.id,
        periodName: run.period_name || t('common:label.payroll_period_name', { id: run.id }), // Dynamic period name
        status: run.status_name || t('common:label.unknown', 'Unknown'),
        totalAmount: run.total_amount || 0,
        employeeCount: run.employee_count || 0,
        createdAt: run.created_at || new Date().toISOString(),
      }));
    } catch (error) {
      return []; // Return empty array on error
    }
  },
};