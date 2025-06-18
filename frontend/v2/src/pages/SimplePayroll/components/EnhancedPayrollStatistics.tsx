import React, { useMemo, useState, useEffect } from 'react';
import { Button, Row, Col, Space, Divider, message } from 'antd';
import { StatisticCard } from '@ant-design/pro-components';
import { DollarOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { 
  CombinedMetricsCard,
  type DepartmentCostData,
  type EmployeeTypeData,
  type SalaryTrendDataPoint
} from '../../../components/MetricCard';
import type { PayrollPeriodResponse, PayrollRunResponse } from '../types/simplePayroll';
import type { PayrollStats, DataIntegrityStats } from '../hooks/usePayrollPageLogic';
import { simplePayrollApi } from '../services/simplePayrollApi';

interface EnhancedPayrollStatisticsProps {
  selectedVersionId?: number;
  currentPeriod?: PayrollPeriodResponse | null;
  currentVersion?: PayrollRunResponse | null;
  versions: PayrollRunResponse[];
  payrollStats: PayrollStats;
  dataIntegrityStats: DataIntegrityStats;
  auditSummary?: {
    total_anomalies: number;
    error_count: number;
    warning_count: number;
    auto_fixable_count: number;
    manually_ignored_count?: number;
  } | null;
  auditLoading: boolean;
  resetLoadingStates: () => void;
}

export const EnhancedPayrollStatistics: React.FC<EnhancedPayrollStatisticsProps> = ({
  selectedVersionId,
  currentPeriod,
  currentVersion,
  versions,
  payrollStats,
  dataIntegrityStats,
  auditSummary,
  auditLoading,
  resetLoadingStates
}) => {
  console.log('🌟🌟🌟 [EnhancedPayrollStatistics] 组件渲染开始 🌟🌟🌟');
  console.log('🌟 [EnhancedPayrollStatistics] selectedVersionId:', selectedVersionId);
  
  // 状态管理
  const [departmentCostData, setDepartmentCostData] = useState<DepartmentCostData[]>([]);
  const [employeeTypeData, setEmployeeTypeData] = useState<EmployeeTypeData[]>([]);
  const [salaryTrendData, setSalaryTrendData] = useState<SalaryTrendDataPoint[]>([]);
  const [loadingStates, setLoadingStates] = useState({
    departmentCost: false,
    employeeType: false,
    salaryTrend: false
  });

  // 预定义的颜色
  const departmentColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'];
  const employeeTypeColors = {
    'regular': '#3b82f6',  // 正编 - 蓝色
    'contract': '#f59e0b',  // 聘用 - 橙色
    'intern': '#10b981',   // 实习 - 绿色
    'consultant': '#ef4444',  // 顾问 - 红色
    'default': '#8b5cf6'   // 默认 - 紫色
  };

  // 获取部门成本数据
  const fetchDepartmentCostData = async (periodId: number) => {
    console.log('🏢 [fetchDepartmentCostData] 开始获取部门成本数据:', { periodId });
    if (!periodId) return;
    
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
      
      if (response.data && response.data.departments?.length > 0) {
        const transformedData: DepartmentCostData[] = response.data.departments.map((dept: any, index: number) => ({
          departmentId: dept.department_id || index + 1,
          departmentName: dept.department_name,
          currentCost: Number(dept.current_cost) || 0,
          currentDeductions: Number(dept.current_deductions) || 0,
          currentNetPay: Number(dept.current_net_pay) || 0,
          previousCost: Number(dept.previous_cost) || 0,
          previousDeductions: Number(dept.previous_deductions) || 0,
          previousNetPay: Number(dept.previous_net_pay) || 0,
          employeeCount: dept.employee_count || 0,
          avgCostPerEmployee: Number(dept.avg_cost_per_employee) || 0,
          avgDeductionsPerEmployee: Number(dept.avg_deductions_per_employee) || 0,
          avgNetPayPerEmployee: Number(dept.avg_net_pay_per_employee) || 0,
          percentage: dept.percentage || 0,
          costChange: dept.cost_change ? Number(dept.cost_change) : undefined,
          costChangeRate: dept.cost_change_rate ? Number(dept.cost_change_rate) : undefined,
          netPayChange: dept.net_pay_change ? Number(dept.net_pay_change) : undefined,
          netPayChangeRate: dept.net_pay_change_rate ? Number(dept.net_pay_change_rate) : undefined,
          color: departmentColors[index % departmentColors.length]
        }));
        console.log('🏢 [fetchDepartmentCostData] 转换后的数据:', transformedData);
        setDepartmentCostData(transformedData);
      } else {
        console.log('🏢 [fetchDepartmentCostData] API返回失败或无数据');
        setDepartmentCostData([]);
        console.warn('暂无部门成本数据');
      }
    } catch (error) {
      console.error('获取部门成本数据失败:', error);
      console.warn('部门成本分析暂时不可用，可能是后端接口问题');
      setDepartmentCostData([]);
    } finally {
      setLoadingStates(prev => ({ ...prev, departmentCost: false }));
    }
  };

  // 获取员工编制数据
  const fetchEmployeeTypeData = async (periodId: number) => {
    if (!periodId) return;
    
    setLoadingStates(prev => ({ ...prev, employeeType: true }));
    try {
      // @ts-ignore - API响应结构与类型定义不匹配
      const response = await simplePayrollApi.getEmployeeTypeAnalysis(periodId);
      console.log('👥 [fetchEmployeeTypeData] API响应:', {
        hasData: !!response.data,
        typeCount: response.data?.employee_types?.length,
        totalEmployees: response.data?.total_employees,
        dataKeys: response.data ? Object.keys(response.data) : []
      });
      
      if (response.data && response.data.employee_types?.length > 0) {
        console.log('👥 [fetchEmployeeTypeData] 原始API employee_types数据:', response.data.employee_types);
        
        const transformedData: EmployeeTypeData[] = response.data.employee_types.map((type: any, index: number) => {
          console.log(`👥 [fetchEmployeeTypeData] 处理编制类型 ${index}:`, type);
          console.log(`👥 [fetchEmployeeTypeData] 原始工资字段:`, {
            avg_salary: type.avg_salary,
            total_cost: type.total_cost,
            avgSalary: type.avgSalary,
            totalCost: type.totalCost,
            salary: type.salary,
            cost: type.cost
          });
          
          // 根据类型名称判断是哪种编制
          const typeKey = type.type_name.includes('正编') ? 'regular' : 
                          type.type_name.includes('聘用') ? 'contract' :
                          type.type_name.includes('实习') ? 'intern' :
                          type.type_name.includes('顾问') ? 'consultant' : 'default';
          
          // 处理API返回的工资数据（字符串转数字）
          const avgSalary = Number(type.avg_salary || 0);
          const totalCost = Number(type.total_cost || 0);
          
          console.log(`👥 [fetchEmployeeTypeData] 最终工资数据:`, { avgSalary, totalCost });
          
          return {
            typeId: type.personnel_category_id || 0,
            typeName: type.type_name,
            employeeCount: type.employee_count || 0,
            percentage: type.percentage || 0,
            avgSalary: avgSalary,
            totalCost: totalCost,
            previousCount: type.previous_count || type.employee_count,
            countChange: type.count_change || 0,
            newHires: type.new_hires || 0,
            departures: type.departures || 0,
            color: employeeTypeColors[typeKey] || employeeTypeColors.default,
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
      console.warn('员工编制分析暂时不可用，可能是后端接口问题');
      setEmployeeTypeData([]);
    } finally {
      setLoadingStates(prev => ({ ...prev, employeeType: false }));
    }
  };

  // 获取工资趋势数据
  const fetchSalaryTrendData = async () => {
    setLoadingStates(prev => ({ ...prev, salaryTrend: true }));
    try {
      // @ts-ignore - API响应结构与类型定义不匹配
      const response = await simplePayrollApi.getSalaryTrendAnalysis(12);
      console.log('📈 [fetchSalaryTrendData] API响应:', {
        hasData: !!response.data,
        dataPointCount: response.data?.data_points?.length,
        timeRange: response.data?.time_range,
        dataKeys: response.data ? Object.keys(response.data) : []
      });
      
      if (response.data && response.data.data_points?.length > 0) {
        console.log('📈 [fetchSalaryTrendData] 所有数据点:', response.data.data_points);
        
        // 处理所有数据点
        const allDataPoints = response.data.data_points || [];
        
        if (allDataPoints.length > 0) {
          const transformedData: SalaryTrendDataPoint[] = allDataPoints.map((point: any) => {
            // 调试输出原始数据点
            console.log('🔍 [fetchSalaryTrendData] 原始数据点:', point);
            
            // 确保数值转换正确
            const grossSalary = typeof point.gross_salary === 'string' 
              ? parseFloat(point.gross_salary) 
              : (typeof point.gross_salary === 'number' ? point.gross_salary : 0);
              
            const deductions = typeof point.deductions === 'string'
              ? parseFloat(point.deductions)
              : (typeof point.deductions === 'number' ? point.deductions : 0);
              
            const netSalary = typeof point.net_salary === 'string'
              ? parseFloat(point.net_salary)
              : (typeof point.net_salary === 'number' ? point.net_salary : 0);
            
            // 调试输出转换后的值
            console.log('🔢 [fetchSalaryTrendData] 转换后的值:', {
              grossSalary,
              deductions,
              netSalary,
              employeeCount: point.employee_count || 0
            });
            
            return {
              month: point.year_month,
              monthLabel: dayjs(point.year_month).format('M月'),
              grossSalary: grossSalary,
              deductions: deductions,
              netSalary: netSalary,
              employeeCount: point.employee_count || 0,
              avgGrossSalary: Number(point.avg_gross_salary) || 0,
              avgNetSalary: Number(point.avg_net_salary) || 0
            };
          });
          
          console.log('📈 [fetchSalaryTrendData] 转换后的数据:', transformedData);
          // 按时间顺序排序，确保最新的数据在数组末尾
          const sortedData = [...transformedData].sort((a, b) => {
            const dateA = a.month ? new Date(a.month) : new Date(0);
            const dateB = b.month ? new Date(b.month) : new Date(0);
            return dateA.getTime() - dateB.getTime();
          });
          console.log('📈 [fetchSalaryTrendData] 排序后的数据:', sortedData);
          setSalaryTrendData(sortedData);
        } else {
          console.log('📈 [fetchSalaryTrendData] 没有数据点');
          setSalaryTrendData([]);
          message.warning('暂无工资趋势数据');
        }
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

  // 数据获取效果钩子
  useEffect(() => {
    console.log('🔄 [EnhancedPayrollStatistics] useEffect 触发:', {
      selectedVersionId,
      currentPeriodId: currentPeriod?.id,
      currentPeriodName: currentPeriod?.name
    });
    
    if (selectedVersionId && currentPeriod) {
      console.log('✅ [EnhancedPayrollStatistics] 开始获取分析数据...');
      // 当期间或版本变化时，获取新数据
      fetchDepartmentCostData(currentPeriod.id);
      fetchEmployeeTypeData(currentPeriod.id);
      fetchSalaryTrendData();
    } else {
      console.log('❌ [EnhancedPayrollStatistics] 条件不满足，跳过数据获取');
      // 清空所有图表数据
      setDepartmentCostData([]);
      setEmployeeTypeData([]);
      setSalaryTrendData([]);
    }
  }, [selectedVersionId, currentPeriod?.id]);

  // 处理部门点击
  const handleDepartmentClick = (department: DepartmentCostData) => {
    console.log('查看部门详情:', department.departmentName);
    // TODO: 实现跳转到部门详情页面
  };

  // 处理员工类型点击
  const handleEmployeeTypeClick = (type: EmployeeTypeData) => {
    console.log('查看编制详情:', type.typeName);
    // TODO: 实现跳转到编制详情页面
  };

  // 处理查看详情
  const handleViewDetails = (cardType: string) => {
    console.log('查看详情:', cardType);
    // TODO: 实现全屏查看或跳转详情页面
  };

  // 处理数据导出
  const handleExport = () => {
    console.log('导出工资趋势数据');
    // TODO: 实现数据导出功能
  };

  // 处理时间范围变化
  const handleTimeRangeChange = (range: '6months' | '12months' | '24months') => {
    console.log('切换时间范围:', range);
    // TODO: 实现重新加载对应时间范围的数据
  };

  if (!selectedVersionId) {
    return null;
  }

  return (
    <div className="enhanced-payroll-statistics">
      {/* 原有的基础统计卡片 */}
      <StatisticCard.Group
        title={
          <Space>
            <DollarOutlined />
            <span className="typography-title-tertiary">{currentPeriod?.name || ''} 工资统计概览</span>
          </Space>
        }
        extra={
          process.env.NODE_ENV === 'development' && payrollStats.loading ? (
            <Button 
              size="small" 
              type="link" 
              onClick={resetLoadingStates}
              style={{ color: '#ff4d4f' }}
            >
              重置加载状态
            </Button>
          ) : null
        }
        loading={payrollStats.loading}
        style={{ marginBottom: 24 }}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} xl={4} xxl={4}>
            <StatisticCard
              statistic={{
                title: '工资条目',
                value: payrollStats.recordCount,
                suffix: '条',
                valueStyle: { color: '#1890ff' }
              }}
              chart={
                <div style={{ padding: '8px 0' }}>
                  <Divider style={{ margin: '8px 0' }} />
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                    期间: {currentPeriod?.name || '-'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                    状态: <span style={{ color: '#52c41a' }}>{currentPeriod?.status_name || '-'}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    版本: v{currentVersion?.version_number || '-'} ({versions.length}个)
                  </div>
                </div>
              }
            />
          </Col>
          <Col xs={24} sm={12} xl={4} xxl={4}>
            <StatisticCard
              statistic={{
                title: '数据完整性',
                value: (dataIntegrityStats?.socialInsuranceBaseCount || 0) + (dataIntegrityStats?.housingFundBaseCount || 0) + (dataIntegrityStats?.incomeTaxPositiveCount || 0),
                suffix: '条',
                valueStyle: { color: '#722ed1' }
              }}
              chart={
                <div style={{ padding: '8px 0' }}>
                  <Divider style={{ margin: '8px 0' }} />
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                    社保基数: <span style={{ color: (dataIntegrityStats?.socialInsuranceBaseCount || 0) > 0 ? '#52c41a' : '#ff4d4f' }}>
                      {dataIntegrityStats?.socialInsuranceBaseCount || 0} 条
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                    公积金基数: <span style={{ color: (dataIntegrityStats?.housingFundBaseCount || 0) > 0 ? '#52c41a' : '#ff4d4f' }}>
                      {dataIntegrityStats?.housingFundBaseCount || 0} 条
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    个税&gt;0: <span style={{ color: (dataIntegrityStats?.incomeTaxPositiveCount || 0) > 0 ? '#52c41a' : '#fa8c16' }}>
                      {dataIntegrityStats?.incomeTaxPositiveCount || 0} 条
                    </span>
                  </div>
                </div>
              }
              loading={dataIntegrityStats?.loading || false}
            />
          </Col>
          <Col xs={24} sm={12} xl={4} xxl={4}>
            <StatisticCard
              statistic={{
                title: '财务信息',
                value: payrollStats.totalNetPay,
                precision: 2,
                prefix: '¥',
                valueStyle: { color: '#52c41a' }
              }}
              chart={
                <div style={{ padding: '8px 0' }}>
                  <Divider style={{ margin: '8px 0' }} />
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                    应发: <span style={{ color: '#52c41a' }}>¥{payrollStats.totalGrossPay.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                    扣发: <span style={{ color: '#ff4d4f' }}>¥{payrollStats.totalDeductions.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    平均: ¥{payrollStats.recordCount > 0 ? (payrollStats.totalNetPay / payrollStats.recordCount).toFixed(0) : '0'}
                  </div>
                </div>
              }
            />
          </Col>
          <Col xs={24} sm={12} xl={4} xxl={4}>
            <StatisticCard
              statistic={{
                title: '版本状态',
                value: currentVersion?.status_name || '-',
                valueStyle: { 
                  color: 
                    currentVersion?.status_name === '草稿' ? '#fa8c16' :
                    currentVersion?.status_name === '已计算' ? '#1890ff' :
                    currentVersion?.status_name === '已审核' ? '#52c41a' :
                    currentVersion?.status_name === '已支付' ? '#722ed1' :
                    '#8c8c8c'
                }
              }}
              chart={
                <div style={{ padding: '8px 0' }}>
                  <Divider style={{ margin: '8px 0' }} />
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                    创建: {currentVersion ? dayjs(currentVersion.initiated_at).format('MM-DD HH:mm') : '-'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                    创建人: {currentVersion?.initiated_by_username || '-'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    频率: {currentPeriod?.frequency_name || '-'}
                  </div>
                </div>
              }
            />
          </Col>
          <Col xs={24} sm={12} xl={4} xxl={4}>
            <StatisticCard
              statistic={{
                title: '审核状态',
                value: auditSummary ? (
                  (auditSummary.error_count - (auditSummary.manually_ignored_count || 0)) > 0 ? '有异常' : '通过'
                ) : (auditLoading ? '检查中' : '待审核'),
                valueStyle: { 
                  color: auditSummary ? (
                    (auditSummary.error_count - (auditSummary.manually_ignored_count || 0)) > 0 ? '#ff4d4f' : '#52c41a'
                  ) : (auditLoading ? '#1890ff' : '#fa8c16')
                }
              }}
              chart={
                <div style={{ padding: '8px 0' }}>
                  <Divider style={{ margin: '8px 0' }} />
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                    错误: <span style={{ color: (auditSummary?.error_count || 0) > 0 ? '#ff4d4f' : '#52c41a' }}>
                      {auditSummary?.error_count || 0} 个
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                    警告: <span style={{ color: (auditSummary?.warning_count || 0) > 0 ? '#fa8c16' : '#52c41a' }}>
                      {auditSummary?.warning_count || 0} 个
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    可修复: <span style={{ color: (auditSummary?.auto_fixable_count || 0) > 0 ? '#1890ff' : '#52c41a' }}>
                      {auditSummary?.auto_fixable_count || 0} 个
                    </span>
                  </div>
                </div>
              }
            />
          </Col>
        </Row>
      </StatisticCard.Group>

      {/* 合并的指标卡片 */}
      {selectedVersionId && (
        <CombinedMetricsCard
          title="关键指标概览"
          
          // 部门成本数据
          departmentCostData={departmentCostData}
          totalCost={payrollStats.totalGrossPay || 0}
          totalDeductions={payrollStats.totalDeductions || 0}
          totalNetPay={payrollStats.totalNetPay || 0}
          departmentCostLoading={loadingStates.departmentCost}
          
          // 编制分布数据
          employeeTypeData={employeeTypeData}
          totalEmployees={payrollStats.recordCount || 0}
          employeeTypeLoading={loadingStates.employeeType}
          
          // 工资趋势数据
          salaryTrendData={salaryTrendData}
          salaryTrendLoading={loadingStates.salaryTrend}
          
          // 事件处理
          onViewDetails={() => handleViewDetails('合并指标')}
          onDepartmentClick={handleDepartmentClick}
          onEmployeeTypeClick={handleEmployeeTypeClick}
          onExportTrend={handleExport}
        />
      )}
    </div>
  );
};