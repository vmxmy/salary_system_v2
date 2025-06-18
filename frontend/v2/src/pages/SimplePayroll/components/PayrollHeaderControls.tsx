import React, { useEffect, useState } from 'react';
import { Space, DatePicker, Typography, Select, Card, Row, Col, Badge, Tooltip, Tag, Button } from 'antd';
import { 
  CalendarOutlined, 
  BranchesOutlined, 
  InfoCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  FieldTimeOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import type { PayrollPeriodResponse, PayrollRunResponse } from '../types/simplePayroll';
import { simplePayrollApi } from '../services/simplePayrollApi';

const { Text } = Typography;
const { Option } = Select;

interface PayrollHeaderControlsProps {
  currentPeriod?: PayrollPeriodResponse | null;
  currentVersion?: PayrollRunResponse | null;
  versions: PayrollRunResponse[];
  selectedVersionId?: number;
  handleDateChange: (year: number, month: number) => void;
  onVersionChange?: (versionId: number) => void;
  payrollStats?: {
    recordCount: number;
    totalGrossPay: number;
    totalDeductions: number;
    totalNetPay: number;
    loading: boolean;
  };
}

export const PayrollHeaderControls: React.FC<PayrollHeaderControlsProps> = ({
  currentPeriod,
  currentVersion,
  versions,
  selectedVersionId,
  handleDateChange,
  onVersionChange,
  payrollStats
}) => {
  const { t } = useTranslation(['simplePayroll', 'common']);
  const [periodEntriesMap, setPeriodEntriesMap] = useState<Map<string, number>>(new Map());
  const [departmentStats, setDepartmentStats] = useState<{departmentCount: number, employeeTypeCount: number}>({
    departmentCount: 0,
    employeeTypeCount: 0
  });

  // 计算流程状态描述
  const getWorkflowStatus = () => {
    if (!currentVersion) return "等待数据";
    
    const status = currentVersion.status_name;
    const recordCount = payrollStats?.recordCount || 0;
    
    if (status === '草稿') {
      return recordCount > 0 ? "数据已导入，待计算" : "待导入数据";
    } else if (status === '已计算') {
      return "数据计算完成，待审核";
    } else if (status === '已审核') {
      return "审核完成，可发起支付";
    } else if (status === '已支付') {
      return "支付完成";
    }
    return `当前状态：${status}`;
  };

  // 计算发薪倒计时
  const getPaydayCountdown = () => {
    if (!currentPeriod?.pay_date) return "发薪日期待定";
    
    const payDate = dayjs(currentPeriod.pay_date);
    const now = dayjs();
    const diffDays = payDate.diff(now, 'day');
    
    if (diffDays < 0) {
      return `已发薪 ${Math.abs(diffDays)} 天`;
    } else if (diffDays === 0) {
      return "今日发薪";
    } else if (diffDays === 1) {
      return "明日发薪";
    } else {
      return `距离发薪还有 ${diffDays} 天`;
    }
  };

  // 获取数据规模描述
  const getDataScale = () => {
    const recordCount = payrollStats?.recordCount || 0;
    const deptCount = departmentStats.departmentCount;
    const typeCount = departmentStats.employeeTypeCount;
    
    if (recordCount === 0) return "暂无工资数据";
    
    let scale = `${recordCount} 名员工`;
    if (deptCount > 0) scale += `，${deptCount} 个部门`;
    if (typeCount > 0) scale += `，${typeCount} 种编制`;
    
    return scale;
  };

  // 获取所有工资期间数据来构建颜色标识映射
  useEffect(() => {
    const fetchPeriodEntries = async () => {
      try {
        const currentDate = dayjs();
        const startYear = currentDate.year() - 1;
        const endYear = currentDate.year() + 1;
        
        const allPeriods: PayrollPeriodResponse[] = [];
        
        for (let year = startYear; year <= endYear; year++) {
          try {
            const response = await simplePayrollApi.getPayrollPeriods({ 
              year, 
              page: 1, 
              size: 50 
            });
            if (response.data) {
              allPeriods.push(...response.data);
            }
          } catch (error) {
            console.warn(`Failed to fetch periods for year ${year}:`, error);
          }
        }

        const entriesMap = new Map<string, number>();
        allPeriods.forEach(period => {
          if (period.start_date) {
            const periodDate = dayjs(period.start_date);
            const key = `${periodDate.year()}-${periodDate.month() + 1}`;
            const existingCount = entriesMap.get(key) || 0;
            entriesMap.set(key, existingCount + (period.entries_count || 0));
          }
        });

        setPeriodEntriesMap(entriesMap);
      } catch (error) {
        console.error('获取工资期间数据失败:', error);
      }
    };

    fetchPeriodEntries();
  }, []);

  // 获取部门和编制统计数据
  useEffect(() => {
    const fetchDepartmentStats = async () => {
      if (!currentPeriod?.id) return;
      
      try {
        // 获取部门统计
        const deptResponse = await simplePayrollApi.getDepartmentCostAnalysis(currentPeriod.id);
        const departmentCount = deptResponse.data?.departments?.length || 0;
        
        // 获取编制统计  
        const typeResponse = await simplePayrollApi.getEmployeeTypeAnalysis(currentPeriod.id);
        const employeeTypeCount = typeResponse.data?.employee_types?.length || 0;
        
        setDepartmentStats({
          departmentCount,
          employeeTypeCount
        });
      } catch (error) {
        console.warn('获取部门统计数据失败:', error);
        setDepartmentStats({
          departmentCount: 0,
          employeeTypeCount: 0
        });
      }
    };

    fetchDepartmentStats();
  }, [currentPeriod?.id]);

  // 自定义单元格渲染器
  const cellRender = (current: string | number | Dayjs) => {
    const date = dayjs.isDayjs(current) ? current : dayjs(current);
    const year = date.year();
    const month = date.month() + 1;
    const key = `${year}-${month}`;
    const entriesCount = periodEntriesMap.get(key) || 0;
    const hasEntries = entriesCount > 0;

    const tooltipTitle = hasEntries 
      ? `${year}年${month}月有 ${entriesCount} 条工资记录` 
      : `${year}年${month}月暂无工资记录`;

    return (
      <div 
        className={`ant-picker-cell-inner ${hasEntries ? 'has-payroll-entries' : ''}`}
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        title={tooltipTitle}
      >
        {date.format('MM')}月
        {hasEntries && (
          <div className="payroll-indicator" />
        )}
      </div>
    );
  };

  // 获取版本状态颜色
  const getVersionStatusColor = (status: string) => {
    switch (status) {
      case '草稿': return 'orange';
      case '已计算': return 'blue';
      case '已审核': return 'green';
      case '已支付': return 'purple';
      default: return 'default';
    }
  };

  // 获取版本状态图标
  const getVersionStatusIcon = (status: string) => {
    switch (status) {
      case '草稿': return <ClockCircleOutlined />;
      case '已计算': return <BranchesOutlined />;
      case '已审核': return <InfoCircleOutlined />;
      case '已支付': return <UserOutlined />;
      default: return <ClockCircleOutlined />;
    }
  };

  // 处理版本变更
  const handleVersionSelect = (versionId: number) => {
    onVersionChange?.(versionId);
  };

  return (
    <Card 
      className="payroll-header-controls"
      style={{ 
        marginBottom: 24,
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        border: '1px solid #e8e8e8',
        borderRadius: 12,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
      }}
      styles={{ body: { padding: '20px 24px' } }}
    >
      <Row gutter={[24, 16]} align="middle">
        {/* 期间选择器 */}
        <Col xs={24} sm={12} lg={8} xl={6}>
          <div className="control-section">
            <div className="control-label">
              <CalendarOutlined style={{ marginRight: 8, color: '#1890ff' }} />
              <Text strong style={{ fontSize: 16 }}>
                {t('simplePayroll:controls.period')}
              </Text>
              <Tooltip title="选择工资发放期间">
                <InfoCircleOutlined style={{ marginLeft: 6, color: '#999' }} />
              </Tooltip>
            </div>
            <DatePicker
              picker="month"
              value={currentPeriod ? dayjs(currentPeriod.start_date) : dayjs()}
              onChange={(date) => {
                if (date) {
                  handleDateChange(date.year(), date.month() + 1);
                }
              }}
              style={{ width: '100%' }}
              size="large"
              format="YYYY年MM月"
              placeholder={t('simplePayroll:controls.selectPeriod')}
              allowClear={false}
              className="custom-date-picker"
              cellRender={cellRender}
            />
            {currentPeriod && (
              <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
                <Space size={16}>
                  <span>状态: <Badge 
                    status={currentPeriod.status_name === '活跃' ? 'success' : 'default'} 
                    text={currentPeriod.status_name} 
                  /></span>
                  <span>频率: {currentPeriod.frequency_name}</span>
                </Space>
              </div>
            )}
          </div>
        </Col>

        {/* 版本选择器 */}
        <Col xs={24} sm={12} lg={8} xl={6}>
          <div className="control-section">
            <div className="control-label">
              <BranchesOutlined style={{ marginRight: 8, color: '#52c41a' }} />
              <Text strong style={{ fontSize: 16 }}>
                工资运行版本
              </Text>
              <Tooltip title="选择工资计算版本">
                <InfoCircleOutlined style={{ marginLeft: 6, color: '#999' }} />
              </Tooltip>
            </div>
            <Select
              value={selectedVersionId}
              onChange={handleVersionSelect}
              style={{ width: '100%' }}
              size="large"
              placeholder="请选择版本"
              allowClear={false}
              disabled={!versions || versions.length === 0}
            >
              {versions.map(version => (
                <Option key={version.id} value={version.id}>
                  <Space>
                    {getVersionStatusIcon(version.status_name)}
                    <span>v{version.version_number}</span>
                    <Tag 
                      color={getVersionStatusColor(version.status_name)}
                      style={{ margin: 0 }}
                    >
                      {version.status_name}
                    </Tag>
                  </Space>
                </Option>
              ))}
            </Select>
            {currentVersion && (
              <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
                <Space size={16}>
                  <span>创建: {dayjs(currentVersion.initiated_at).format('MM-DD HH:mm')}</span>
                  <span>创建人: {currentVersion.initiated_by_username}</span>
                </Space>
              </div>
            )}
          </div>
        </Col>

        {/* 快速信息展示 */}
        <Col xs={24} sm={24} lg={8} xl={12}>
          {currentPeriod && currentVersion && (
            <div className="quick-info">
              <Row gutter={16}>
                <Col span={8}>
                  <div className="info-item">
                    <div className="info-label">
                      <CheckCircleOutlined style={{ marginRight: 4, color: '#52c41a' }} />
                      <Text type="secondary" style={{ fontSize: 12 }}>流程状态</Text>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: '#52c41a' }}>
                      {getWorkflowStatus()}
                    </div>
                  </div>
                </Col>
                <Col span={8}>
                  <div className="info-item">
                    <div className="info-label">
                      <TeamOutlined style={{ marginRight: 4, color: '#1890ff' }} />
                      <Text type="secondary" style={{ fontSize: 12 }}>数据规模</Text>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: '#1890ff' }}>
                      {getDataScale()}
                    </div>
                  </div>
                </Col>
                <Col span={8}>
                  <div className="info-item">
                    <div className="info-label">
                      <FieldTimeOutlined style={{ marginRight: 4, color: '#722ed1' }} />
                      <Text type="secondary" style={{ fontSize: 12 }}>发薪倒计时</Text>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: '#722ed1' }}>
                      {getPaydayCountdown()}
                    </div>
                  </div>
                </Col>
              </Row>
            </div>
          )}
        </Col>
      </Row>

      <style>{`
        .control-section {
          width: 100%;
        }
        
        .control-label {
          display: flex;
          align-items: center;
          margin-bottom: 8px;
        }
        
        .quick-info {
          background: rgba(255, 255, 255, 0.7);
          padding: 16px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.3);
        }
        
        .info-item {
          text-align: center;
        }
        
        .info-label {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 4px;
        }
        
        .custom-date-picker .has-payroll-entries {
          background-color: #e6f7ff !important;
          border-radius: 4px;
        }
        
        .payroll-indicator {
          position: absolute;
          top: 2px;
          right: 2px;
          width: 6px;
          height: 6px;
          background-color: #52c41a;
          border-radius: 50%;
        }
      `}</style>
    </Card>
  );
};