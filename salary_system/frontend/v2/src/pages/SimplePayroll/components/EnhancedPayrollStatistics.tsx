// 获取工资趋势数据
const fetchSalaryTrendData = async () => {
  setLoadingStates(prev => ({ ...prev, salaryTrend: true }));
  try {
    const response = await simplePayrollApi.getSalaryTrendAnalysis(12);
    console.log('📈 [fetchSalaryTrendData] API响应:', {
      hasData: !!response.data,
      dataPointCount: response.data?.data_points?.length,
      timeRange: response.data?.time_range,
      dataKeys: response.data ? Object.keys(response.data) : []
    });
    
    // 正确访问数据结构：API直接返回response.data而不是response.data.data
    if (response && response.data && response.data.data_points?.length > 0) {
      // 不要过滤掉金额为0的记录，保留所有数据点
      const transformedData: SalaryTrendDataPoint[] = response.data.data_points.map((point: any) => ({
        month: point.year_month,
        monthLabel: dayjs(point.year_month).format('M月'),
        grossSalary: Number(point.gross_salary) || 0,
        deductions: Number(point.deductions) || 0,
        netSalary: Number(point.net_salary) || 0,
        employeeCount: point.employee_count || 0,
        avgGrossSalary: Number(point.avg_gross_salary) || 0,
        avgNetSalary: Number(point.avg_net_salary) || 0
      }));
      
      console.log('📈 [fetchSalaryTrendData] 转换后的数据:', transformedData);
      setSalaryTrendData(transformedData); // 不需要反转顺序，保持API返回的原始顺序
    } else {
      console.log('📈 [fetchSalaryTrendData] API返回失败或无数据');
      setSalaryTrendData([]);
      message.warning('暂无工资趋势数据');
    }
  } catch (error) {
    console.error('获取工资趋势数据失败:', error);
    message.error('获取工资趋势数据失败');
    setSalaryTrendData([]);
  } finally {
    setLoadingStates(prev => ({ ...prev, salaryTrend: false }));
  }
};

// 获取部门成本数据
const fetchDepartmentCostData = async (periodId: number) => {
  setLoadingStates(prev => ({ ...prev, departmentCost: true }));
  try {
    // @ts-ignore - API响应结构与类型定义不匹配
    const response = await simplePayrollApi.getDepartmentCostAnalysis(periodId);
    console.log('🏢 [fetchDepartmentCostData] API响应:', {
      hasData: !!response.data,
      departmentCount: response.data?.departments?.length,
      totalCost: response.data?.total_cost,
      dataKeys: response.data ? Object.keys(response.data) : []
    });
    
    // 正确访问数据结构：API直接返回response.data而不是response.data.data
    if (response && response.data && response.data.departments?.length > 0) {
      const transformedData: DepartmentCostData[] = response.data.departments.map((dept: any, index: number) => {
        const deptKey = `dept${index}`;
        return {
          departmentId: dept.department_id || index,
          departmentName: dept.department_name || '未知部门',
          currentCost: Number(dept.current_cost) || 0,
          previousCost: Number(dept.previous_cost) || 0,
          employeeCount: dept.employee_count || 0,
          avgCostPerEmployee: Number(dept.avg_cost_per_employee) || 0,
          percentage: Number(dept.percentage) || 0,
          costChange: Number(dept.cost_change) || 0,
          costChangeRate: Number(dept.cost_change_rate) || 0,
          color: departmentColors[deptKey] || departmentColors.default
        };
      });
      console.log('🏢 [fetchDepartmentCostData] 转换后的数据:', transformedData);
      setDepartmentCostData(transformedData);
    } else {
      console.log('🏢 [fetchDepartmentCostData] API返回失败或无数据');
      setDepartmentCostData([]);
      message.warning('暂无部门成本数据');
    }
  } catch (error) {
    console.error('获取部门成本数据失败:', error);
    message.error('获取部门成本数据失败');
    setDepartmentCostData([]);
  } finally {
    setLoadingStates(prev => ({ ...prev, departmentCost: false }));
  }
};

// 获取员工编制数据
const fetchEmployeeTypeData = async (periodId: number) => {
  setLoadingStates(prev => ({ ...prev, employeeType: true }));
  try {
    // @ts-ignore - API响应结构与类型定义不匹配
    const response = await simplePayrollApi.getEmployeeTypeAnalysis(periodId);
    console.log('👥 [fetchEmployeeTypeData] API响应:', {
      hasData: !!response.data,
      typeCount: response.data?.employee_types?.length,
      totalEmployees: response.data?.total_employees,
      dataKeys: response.data ? Object.keys(response.data) : [],
      firstItem: response.data?.employee_types?.[0]
    });
    
    // 正确访问数据结构：API直接返回response.data而不是response.data.data
    if (response && response.data && response.data.employee_types?.length > 0) {
      const typeColors = [
        '#1890ff', '#13c2c2', '#52c41a', '#faad14', '#722ed1', 
        '#eb2f96', '#f5222d', '#fa8c16', '#a0d911', '#2f54eb'
      ];
      
      const transformedData: EmployeeTypeData[] = response.data.employee_types.map((type: any, index: number) => {
        return {
          typeId: type.personnel_category_id || index,
          typeName: type.type_name || '未知类型',
          employeeCount: type.employee_count || 0,
          percentage: Number(type.percentage) || 0,
          avgSalary: Number(type.avg_salary) || 0,
          totalCost: Number(type.total_cost) || 0,
          previousCount: type.previous_count || type.employee_count,
          countChange: type.count_change || 0,
          newHires: type.new_hires || 0,
          departures: type.departures || 0,
          color: typeColors[index % typeColors.length],
          details: {
            senior: Math.round((type.employee_count || 0) * 0.2),
            middle: Math.round((type.employee_count || 0) * 0.5),
            junior: Math.round((type.employee_count || 0) * 0.3)
          }
        };
      });
      console.log('👥 [fetchEmployeeTypeData] 转换后的数据:', transformedData);
      setEmployeeTypeData(transformedData);
    } else {
      console.log('👥 [fetchEmployeeTypeData] API返回失败或无数据');
      setEmployeeTypeData([]);
      message.warning('暂无员工编制数据');
    }
  } catch (error) {
    console.error('获取员工编制数据失败:', error);
    message.error('获取员工编制数据失败');
    setEmployeeTypeData([]);
  } finally {
    setLoadingStates(prev => ({ ...prev, employeeType: false }));
  }
};