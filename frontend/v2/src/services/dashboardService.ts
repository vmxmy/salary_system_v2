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
  currentEmployeeCount: number; // 当前员工数量
  lastMonthPayrollTotal: number; // 上个月薪资总额
  yearToDatePayrollTotal: number; // 今年目前为止的薪资总额
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
      // 1. 获取当前员工数量
      const employeeResponse = await employeeService.getEmployees({ page: 1, size: 1 });
      const currentEmployeeCount = employeeResponse.meta?.total || 0;

      // 2. 获取上个月薪资总额
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      const lastMonthStart = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
      const lastMonthEnd = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0);

      // 3. 获取今年目前为止的薪资总额
      const currentYear = new Date().getFullYear();
      const yearStart = new Date(currentYear, 0, 1);
      const yearEnd = new Date();

      // 获取所有薪资审核数据
      let allPayrollRuns: any[] = [];
      try {
        // 由于API限制每页最多100条记录，我们需要分页获取所有数据
        let page = 1;
        let hasMoreData = true;
        
        while (hasMoreData) {
          const payrollRunsResponse = await apiClient.get(`/payroll-runs?page=${page}&size=100`);
          const pageData = payrollRunsResponse.data?.data || [];
          allPayrollRuns = allPayrollRuns.concat(pageData);
          
          // 检查是否还有更多数据
          const meta = payrollRunsResponse.data?.meta;
          if (meta && meta.page < meta.totalPages) {
            page++;
          } else {
            hasMoreData = false;
          }
          
          // 安全检查：避免无限循环，最多获取10页数据
          if (page > 10) {
            console.warn('Dashboard KPI: Reached maximum page limit (10) for payroll runs');
            break;
          }
        }
      } catch (error) {
        console.error('Failed to fetch payroll runs:', error);
        allPayrollRuns = [];
      }

      // 计算上个月薪资总额
      let lastMonthPayrollTotal = 0;
      allPayrollRuns.forEach((run: any) => {
        const runDate = new Date(run.run_date || run.created_at);
        const statusName = run.status?.name || run.status_name;
        
        if ((statusName === 'Completed' || statusName === '已完成' || statusName === 'COMPLETED') &&
            runDate >= lastMonthStart && runDate <= lastMonthEnd) {
          lastMonthPayrollTotal += run.total_net_pay || run.total_amount || 0;
        }
      });

      // 计算今年目前为止的薪资总额
      let yearToDatePayrollTotal = 0;
      allPayrollRuns.forEach((run: any) => {
        const runDate = new Date(run.run_date || run.created_at);
        const statusName = run.status?.name || run.status_name;
        
        if ((statusName === 'Completed' || statusName === '已完成' || statusName === 'COMPLETED') &&
            runDate >= yearStart && runDate <= yearEnd) {
          yearToDatePayrollTotal += run.total_net_pay || run.total_amount || 0;
        }
      });

      const kpiData = {
        currentEmployeeCount,
        lastMonthPayrollTotal,
        yearToDatePayrollTotal,
      };

      // 添加调试信息
      console.log('New Dashboard KPI Data:', kpiData);
      console.log('Last month range:', lastMonthStart, 'to', lastMonthEnd);
      console.log('Year to date range:', yearStart, 'to', yearEnd);

      return kpiData;
    } catch (error) {
      console.error('Error fetching KPI data:', error);
      // Return default data on error
      return {
        currentEmployeeCount: 0,
        lastMonthPayrollTotal: 0,
        yearToDatePayrollTotal: 0,
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

          const totalPayroll = runs.reduce((sum: number, run: any) => sum + (run.total_net_pay || run.total_amount || 0), 0);
          const employeeCount = runs.reduce((sum: number, run: any) => sum + (run.total_employees || run.employee_count || 0), 0);
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

          // TODO: 需要后端API提供部门薪资汇总数据
          // 目前只显示员工数量，薪资数据需要后端API支持
          if (employeeCount > 0) {
            distributionData.push({
              department: dept.code || 'UNKNOWN',
              departmentName: dept.name || 'Unknown',
              totalPayroll: 0, // 需要后端API支持
              employeeCount,
              averageSalary: 0, // 需要后端API支持
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

      // TODO: 需要后端API提供员工职级统计数据
      // 目前返回空数组，等待后端API支持
      // 可以考虑添加一个专门的统计API端点：/employees/grade-distribution
      
      // 暂时返回空数组，避免显示无意义的0值数据
      return [];
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
        const status = run.status?.code || run.status_code || 'unknown';
        const statusName = run.status?.name || run.status_name || 'Unknown';
        const amount = run.total_net_pay || run.total_amount || 0;

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
        periodName: run.payroll_period?.name || run.period_name || t('common:label.payroll_period_name', { id: run.id }), // Dynamic period name
        status: run.status?.name || run.status_name || t('common:label.unknown', 'Unknown'),
        totalAmount: run.total_net_pay || run.total_amount || 0,
        employeeCount: run.total_employees || run.employee_count || 0,
        createdAt: run.run_date || run.created_at || new Date().toISOString(),
      }));
    } catch (error) {
      return []; // Return empty array on error
    }
  },
};