import apiClient from '../api';
import { employeeService } from './employeeService';

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
export const dashboardService = {
  // 获取KPI数据
  async getKpiData(): Promise<DashboardKpiData> {
    try {
      // 获取员工总数
      const employeeResponse = await employeeService.getEmployees({ page: 1, size: 1 });
      const totalEmployees = employeeResponse.meta?.total || 0;

      // TODO: 获取上月员工数，需要后端API支持
      const totalEmployeesLastMonth = 0; 

      // 获取薪资周期数据
      let payrollPeriods: any[] = [];
      try {
        const payrollPeriodsResponse = await apiClient.get('/payroll-periods?page=1&size=5');
        payrollPeriods = payrollPeriodsResponse.data?.data || [];
      } catch (error) {
        console.warn({t('common:auto___e88eb7')}, error);
      }

      // 获取薪资审核数据
      let payrollRuns: any[] = [];
      try {
        const payrollRunsResponse = await apiClient.get('/payroll-runs?page=1&size=10');
        payrollRuns = payrollRunsResponse.data?.data || [];
      } catch (error) {
        console.warn({t('common:auto___e88eb7')}, error);
      }

      // 计算当月薪资总额（从最近的薪资审核中获取）
      let monthlyPayroll = 0;
      let activePayrollRuns = 0;
      let completedPayrollRuns = 0;

      payrollRuns.forEach((run: any) => {
        if (run.status_name === {t('common:auto_text_e5b7b2')} || run.status_name === 'Completed') {
          monthlyPayroll += run.total_amount || 0;
          completedPayrollRuns++;
        } else if (run.status_name === {t('common:auto_text_e8bf9b')} || run.status_name === 'In Progress') {
          activePayrollRuns++;
        }
      });

      // TODO: 获取上月薪资总额，需要后端API支持
      const monthlyPayrollLastMonth = 0; 
      const averageSalary = totalEmployees > 0 ? monthlyPayroll / totalEmployees : 0;
      const averageSalaryLastMonth = totalEmployeesLastMonth > 0 ? monthlyPayrollLastMonth / totalEmployeesLastMonth : 0;

      // 待办任务数量（待审批的薪资审核）
      const pendingApprovals = payrollRuns.filter((run: any) => 
        run.status_name === {t('common:auto_text_e5be85')} || run.status_name === 'Pending Approval'
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
      console.error({t('common:auto_kpi__e88eb7')}, error);
      // 返回默认数据
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

          // 只有在获取到真实数据时才添加
          if (runs.length > 0) {
            trendData.push({
              month: period.name || `${period.start_date?.substring(5, 7)}-${period.start_date?.substring(8, 10)}`,
              totalPayroll: totalPayroll,
              averageSalary: averageSalary,
              employeeCount: employeeCount,
            });
          }
        } catch (error) {
          console.warn({t('common:auto__period_id___e88eb7')}, error);
          // 不再添加模拟数据
        }
      }

      return trendData.reverse(); // 按时间顺序排列
    } catch (error) {
      console.error({t('common:auto___e88eb7')}, error);
      return []; // 返回空数组，不再使用模拟数据
    }
  },

  // 获取部门薪资分布
  async getDepartmentSalaryDistribution(): Promise<DepartmentSalaryItem[]> {
    try {
      // 获取部门列表
      const departments = await employeeService.getDepartmentsLookup();
      const distributionData: DepartmentSalaryItem[] = [];

      for (const dept of departments.slice(0, 8)) { // 限制最多8个部门，避免请求过多
        try {
          // 获取该部门的员工数据
          const employeesResponse = await employeeService.getEmployees({
            page: 1,
            size: 50, 
            department_id: dept.id?.toString(),
          });

          const employeeCount = employeesResponse.meta?.total || 0;
          
          // TODO: 真实的部门薪资总额和平均薪资需要后端API支持
          // 目前，我们将它们设置为0，或者后端可以直接提供这些聚合数据
          const totalPayroll = 0; 
          const averageSalary = 0;

          if (employeeCount > 0) {
            distributionData.push({
              department: dept.code || 'UNKNOWN',
              departmentName: dept.name || {t('common:auto_text_e69caa')},
              totalPayroll, // 依赖后端API
              employeeCount,
              averageSalary, // 依赖后端API
            });
          }
        } catch (error) {
          console.warn({t('common:auto__dept_name___e88eb7')}, error);
          // 不再添加模拟数据
        }
      }

      return distributionData.sort((a, b) => b.employeeCount - a.employeeCount); // 按员工数量排序，因为薪资数据不真实
    } catch (error) {
      console.error({t('common:auto___e88eb7')}, error);
      return []; // 返回空数组，不再使用模拟数据
    }
  },

  // 获取员工职级分布
  async getEmployeeGradeDistribution(): Promise<EmployeeGradeItem[]> {
    try {
      // 获取职级查找数据
      const jobLevels = await employeeService.getJobPositionLevelsLookup();
      const gradeData: EmployeeGradeItem[] = [];

      // 获取总员工数
      // const totalEmployeesResponse = await employeeService.getEmployees({ page: 1, size: 1 });
      // const totalEmployees = totalEmployeesResponse.meta?.total || 0;

      // TODO: 真实的员工职级分布（各职级人数及百分比）需要后端API直接提供统计数据
      // 目前，我们将它们设置为0，或者后端可以直接提供这些聚合数据
      for (const level of jobLevels.slice(0, 6)) { // 限制最多6个职级
        // const distributionRatio = levelDistribution[level.value] || 0.1;
        // const count = Math.floor(totalEmployees * distributionRatio);
        const count = 0; // 依赖后端API
        const percentage = 0; // 依赖后端API

        // if (count > 0) { // 暂时注释掉，因为count始终为0
        gradeData.push({
          grade: level.value,
          gradeName: level.label,
          count, // 依赖后端API
          percentage, // 依赖后端API
        });
        // }
      }

      return gradeData.sort((a, b) => b.count - a.count); // 按数量排序，目前都为0
    } catch (error) {
      console.error({t('common:auto___e88eb7')}, error);
      return []; // 返回空数组，不再使用模拟数据
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
        const statusName = run.status_name || {t('common:auto_text_e69caa')};
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
      console.error({t('common:auto___e88eb7')}, error);
      return []; // 返回空数组，不再使用模拟数据
    }
  },

  // 获取最近的薪资审核记录
  async getRecentPayrollRuns(): Promise<RecentPayrollRun[]> {
    try {
      const response = await apiClient.get('/payroll-runs?page=1&size=5');
      const payrollRuns = response.data?.data || [];

      return payrollRuns.map((run: any) => ({
        id: run.id,
        periodName: run.period_name || {t('common:auto__run_id__e896aa')},
        status: run.status_name || {t('common:auto_text_e69caa')},
        totalAmount: run.total_amount || 0,
        employeeCount: run.employee_count || 0,
        createdAt: run.created_at || new Date().toISOString(),
      }));
    } catch (error) {
      console.error({t('common:auto___e88eb7')}, error);
      return []; // 返回空数组，不再使用模拟数据
    }
  },
};