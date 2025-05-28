import React, { useEffect, useState } from 'react';
import { Modal, Descriptions, Spin, Alert, Typography, Card, Empty, Tooltip, Tag, Row, Col, Divider, Table, Space } from 'antd';
import { getPayrollEntryById } from '../services/payrollApi';
import type { PayrollEntry, ApiSingleResponse, PayrollItemDetail } from '../types/payrollTypes';
import { useTranslation } from 'react-i18next';
import usePayrollConfigStore from '../../../store/payrollConfigStore';
import { employeeService } from '../../../services/employeeService'; // 引入员工服务
import EmployeeName from '../../../components/common/EmployeeName';
import dayjs from 'dayjs';
import { getPayrollEntryStatusInfo } from '../utils/payrollUtils';

const { Title, Text } = Typography;

// Helper function to normalize details to PayrollItemDetail[]
const normalizePayrollItemDetails = (
  details: Record<string, PayrollItemDetail | { amount: number }> | PayrollItemDetail[] | undefined | null
): PayrollItemDetail[] => {
  if (!details) {
    return [];
  }
  if (Array.isArray(details)) {
    return details;
  }
  // If it's a Record, convert it
  // Assuming the key of the record is the 'name' of the payroll item
  return Object.entries(details).map(([name, itemData]) => ({
    name,
    amount: itemData.amount,
    // currency and description might be part of itemData if it's PayrollItemDetail,
    // or undefined if it's just { amount: number }
    currency: (itemData as PayrollItemDetail).currency,
    description: (itemData as PayrollItemDetail).description,
  }));
};

interface PayrollEntryDetailModalProps {
  entryId: string | null;
  visible: boolean;
  onClose: () => void;
}

const PayrollEntryDetailModal: React.FC<PayrollEntryDetailModalProps> = ({ entryId, visible, onClose }) => {
  const { t } = useTranslation(['common', 'payroll']);
  const [entryDetails, setEntryDetails] = useState<PayrollEntry | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [employeeInfo, setEmployeeInfo] = useState<{ firstName?: string; lastName?: string; displayName?: string } | null>(null);
  const [loadingEmployeeInfo, setLoadingEmployeeInfo] = useState<boolean>(false);
  const [componentDefinitionsLoaded, setComponentDefinitionsLoaded] = useState<boolean>(false);

  const payrollConfig = usePayrollConfigStore();

  // 当模态框打开时，先加载薪资字段定义，然后再加载薪资条目详情
  useEffect(() => {
    if (visible) {
      console.log('🚀 模态框打开，开始加载薪资字段定义...');
      setComponentDefinitionsLoaded(false);
      
      // 检查是否已经有组件定义
      if (payrollConfig.componentDefinitions.length > 0) {
        console.log('💼 组件定义已存在，共', payrollConfig.componentDefinitions.length, '个组件');
        setComponentDefinitionsLoaded(true);
        return;
      }
      
      // 加载组件定义
      const loadComponentDefinitions = async () => {
        try {
          console.log('🌐 开始调用 fetchComponentDefinitions...');
          await payrollConfig.fetchComponentDefinitions();
          console.log('✅ 薪资字段定义加载成功，共', payrollConfig.componentDefinitions.length, '个组件');
          console.log('💼 组件定义详情:', payrollConfig.componentDefinitions.map(def => ({ code: def.code, name: def.name, type: def.type })));
          setComponentDefinitionsLoaded(true);
        } catch (err) {
          console.error('❌ 加载薪资字段定义失败:', err);
          setComponentDefinitionsLoaded(true); // 即使失败也设置为true，避免无限等待
        }
      };
      
      loadComponentDefinitions();
    }
  }, [visible]);

  // 根据组件代码获取中文名称
  const getComponentDisplayName = (code: string): string => {
    const definition = payrollConfig.componentDefinitions.find(def => def.code === code);
    if (definition) {
      console.log(`🔍 找到组件定义: ${code} -> ${definition.name}`);
      return definition.name;
    }
    console.warn(`⚠️ 未找到组件定义: ${code}，当前已加载 ${payrollConfig.componentDefinitions.length} 个组件定义`);
    console.warn(`⚠️ 已加载的组件代码:`, payrollConfig.componentDefinitions.map(def => def.code));
    return code; // 如果找不到定义，返回原始代码
  };

  // 获取员工详细信息
  const fetchEmployeeInfo = async (employeeId: number) => {
    if (!employeeId) return;
    
    setLoadingEmployeeInfo(true);
    console.log('🔍 开始获取员工详细信息, ID:', employeeId);
    
    try {
      const employee = await employeeService.getEmployeeById(String(employeeId));
      if (employee) {
        const info = {
          firstName: employee.first_name,
          lastName: employee.last_name,
          // 中文姓名格式：姓在前，名在后
          displayName: `${employee.last_name || ''}${employee.first_name || ''}`
        };
        setEmployeeInfo(info);
        console.log('✅ 员工详细信息获取成功:', info);
      } else {
        console.warn('⚠️ 未找到员工信息, ID:', employeeId);
        setEmployeeInfo(null);
      }
    } catch (err) {
      console.error('❌ 获取员工详细信息失败:', err);
      setEmployeeInfo(null);
    } finally {
      setLoadingEmployeeInfo(false);
    }
  };

  // 获取薪资条目详情
  const fetchEntryDetails = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getPayrollEntryById(Number(id));
      console.log('PayrollEntry detail loaded:', response.data);
      setEntryDetails(response.data);
      
      // 增强的调试输出，检查员工信息详情
      console.log('📊 工资条目详情数据:', {
        id: response.data.id,
        employee_id: response.data.employee_id,
        employee_name: response.data.employee_name,
        employee_name_type: typeof response.data.employee_name,
        employee_name_length: response.data.employee_name ? response.data.employee_name.length : 0
      });
      
      // Safe logging for earnings_details
      console.log('💰 收入项详情:', {
        isObject: typeof response.data.earnings_details === 'object' && !Array.isArray(response.data.earnings_details),
        isArray: Array.isArray(response.data.earnings_details),
        count: Array.isArray(response.data.earnings_details) 
          ? response.data.earnings_details.length 
          : (typeof response.data.earnings_details === 'object' && response.data.earnings_details !== null ? Object.keys(response.data.earnings_details).length : 0),
        firstItem: Array.isArray(response.data.earnings_details) && response.data.earnings_details.length > 0
          ? response.data.earnings_details[0]
          : (typeof response.data.earnings_details === 'object' && 
             response.data.earnings_details !== null && 
             !Array.isArray(response.data.earnings_details) && // Explicitly not an array
             Object.keys(response.data.earnings_details).length > 0
              ? (response.data.earnings_details as Record<string, PayrollItemDetail | { amount: number }>)[Object.keys(response.data.earnings_details)[0]]
              : null)
      });
      
      // Safe logging for deductions_details
      console.log('💸 扣除项详情:', {
        isObject: typeof response.data.deductions_details === 'object' && !Array.isArray(response.data.deductions_details),
        isArray: Array.isArray(response.data.deductions_details),
        count: Array.isArray(response.data.deductions_details)
          ? response.data.deductions_details.length
          : (typeof response.data.deductions_details === 'object' && response.data.deductions_details !== null ? Object.keys(response.data.deductions_details).length : 0),
        firstItem: Array.isArray(response.data.deductions_details) && response.data.deductions_details.length > 0
          ? response.data.deductions_details[0]
          : (typeof response.data.deductions_details === 'object' && 
             response.data.deductions_details !== null && 
             !Array.isArray(response.data.deductions_details) && // Explicitly not an array
             Object.keys(response.data.deductions_details).length > 0
              ? (response.data.deductions_details as Record<string, PayrollItemDetail | { amount: number }>)[Object.keys(response.data.deductions_details)[0]]
              : null)
      });
      
      // 检查原始API响应中的所有顶级字段
      console.log('🔍 API返回数据的所有字段:', Object.keys(response.data));
      
      // 如果没有员工姓名，获取员工详细信息
      if (!response.data.employee_name && response.data.employee_id) {
        fetchEmployeeInfo(response.data.employee_id);
      }
    } catch (err: any) {
      setError(err.message || t('payroll:entry_detail_modal.error_fetch_details'));
      setEntryDetails(null);
    }
    setLoading(false);
  };

  // 当组件定义加载完成且有entryId时，获取薪资条目详情
  useEffect(() => {
    if (visible && entryId && componentDefinitionsLoaded) {
      fetchEntryDetails(entryId);
    }
  }, [visible, entryId, componentDefinitionsLoaded]);

  // 当模态框关闭时，清空数据
  useEffect(() => {
    if (!visible) {
      setEntryDetails(null);
      setError(null);
      setEmployeeInfo(null);
    }
  }, [visible]);

  const renderDetailsCard = (title: string, detailsSource: Record<string, PayrollItemDetail | { amount: number }> | PayrollItemDetail[] | undefined | null) => {
    const normalizedDetails = normalizePayrollItemDetails(detailsSource); // Use the helper

    if (normalizedDetails.length === 0) { // Check length of normalized array
      return (
        <Card title={title} variant="borderless" style={{ marginBottom: 16 }}>
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('common:table.empty_data')} />
        </Card>
      );
    }
    return (
      <Card title={title} variant="borderless" style={{ marginBottom: 16 }}>
        {normalizedDetails.map((item, index) => {
          const definition = payrollConfig.componentDefinitions.find(def => def.code === item.name);
          const displayName = definition ? (
            <Tooltip title={`Code: ${item.name} | Type: ${definition.type} | Data Type: ${definition.data_type}`}>
              {definition.name}
            </Tooltip>
          ) : item.name;

          return (
            <Descriptions key={index} bordered column={1} size="small" style={{ marginBottom: 10 }}>
              <Descriptions.Item label={t('payroll:entries_table.modal.component_name')}>{displayName}</Descriptions.Item>
              <Descriptions.Item label={t('payroll:entries_table.modal.amount')}>
                {(() => {
                  const numValue = parseFloat(String(item.amount));
                  return !isNaN(numValue) ? numValue.toFixed(2) : '0.00';
                })()}
              </Descriptions.Item>
              {item.description && <Descriptions.Item label={t('payroll:entries_table.modal.notes')}>{item.description}</Descriptions.Item>}
            </Descriptions>
          );
        })}
      </Card>
    );
  };

  // 格式化金额显示
  const formatAmount = (amount: any) => {
    const numValue = Number(amount);
    return `¥${!isNaN(numValue) ? numValue.toFixed(2) : '0.00'}`;
  };

  // 获取员工姓名
  const getEmployeeName = (entry: PayrollEntry) => {
    if (entry.employee) {
      return `${entry.employee.last_name || ''}${entry.employee.first_name || ''}`.trim();
    }
    return entry.employee_first_name && entry.employee_last_name 
      ? `${entry.employee_last_name}${entry.employee_first_name}`.trim()
      : '未知';
  };

  // 获取部门名称
  const getDepartmentName = (entry: PayrollEntry) => {
    return entry.employee?.departmentName || '未知部门';
  };

  // 获取人员类别名称
  const getPersonnelCategoryName = (entry: PayrollEntry) => {
    return entry.employee?.personnelCategoryName || '未知类别';
  };

  // 收入项表格列配置
  const earningsColumns = [
    {
      title: t('payroll:entry_detail_modal.earnings_table.component_name'),
      dataIndex: 'component_name',
      key: 'component_name',
    },
    {
      title: t('payroll:entry_detail_modal.earnings_table.amount'),
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: any) => formatAmount(amount),
      align: 'right' as const,
    },
    {
      title: t('payroll:entry_detail_modal.earnings_table.description'),
      dataIndex: 'description',
      key: 'description',
      render: (text: string) => text || '-',
    },
  ];

  // 扣缴项表格列配置
  const deductionsColumns = [
    {
      title: t('payroll:entry_detail_modal.deductions_table.component_name'),
      dataIndex: 'component_name',
      key: 'component_name',
    },
    {
      title: t('payroll:entry_detail_modal.deductions_table.amount'),
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: any) => formatAmount(amount),
      align: 'right' as const,
    },
    {
      title: t('payroll:entry_detail_modal.deductions_table.description'),
      dataIndex: 'description',
      key: 'description',
      render: (text: string) => text || '-',
    },
  ];

  return (
    <Modal
      title={t('payroll:entry_detail_modal.title')}
      open={visible}
      onCancel={onClose}
      footer={null}
      width={1000}
      destroyOnHidden
    >
      {(loading || !componentDefinitionsLoaded) && (
        <Spin tip={!componentDefinitionsLoaded ? '正在加载组件定义...' : t('payroll:entry_detail_modal.loading')} style={{ display: 'block', marginTop: '50px' }}>
          <div style={{ padding: 50 }} />
        </Spin>
      )}

      {error && (
        <Alert 
          message={t('payroll:entry_detail_modal.error_prefix') + error} 
          type="error" 
          showIcon 
          style={{ marginBottom: '20px' }} 
        />
      )}

      {!loading && !error && entryDetails && componentDefinitionsLoaded && (
        <div>
          {/* 基本信息 */}
          <Card title={t('payroll:entry_detail_modal.basic_info_title')} style={{ marginBottom: 16 }}>
            <Descriptions bordered column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}>
              <Descriptions.Item label={t('payroll:entry_detail_modal.employee_id')}>
                {entryDetails.employee_id}
              </Descriptions.Item>
              <Descriptions.Item label={t('payroll:entry_detail_modal.employee_name')}>
                {getEmployeeName(entryDetails)}
              </Descriptions.Item>
              <Descriptions.Item label={t('payroll:entry_detail_modal.department')}>
                {getDepartmentName(entryDetails)}
              </Descriptions.Item>
              <Descriptions.Item label={t('payroll:entry_detail_modal.personnel_category')}>
                {getPersonnelCategoryName(entryDetails)}
              </Descriptions.Item>
              <Descriptions.Item label={t('payroll:entry_detail_modal.payroll_period')}>
                {entryDetails.payroll_run?.payroll_period?.name || `周期ID: ${entryDetails.payroll_period_id}`}
              </Descriptions.Item>
              <Descriptions.Item label={t('payroll:entry_detail_modal.status')}>
                {(() => {
                  const statusInfo = getPayrollEntryStatusInfo(entryDetails.status_lookup_value_id);
                  return (
                    <Tag color={statusInfo.color === 'green' ? 'success' : statusInfo.color === 'red' ? 'error' : 'default'}>
                      {t(statusInfo.key)}
                    </Tag>
                  );
                })()}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* 薪资汇总 */}
          <Card title={t('payroll:entry_detail_modal.salary_summary_title')} style={{ marginBottom: 16 }}>
            <Row gutter={24}>
              <Col span={8}>
                <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#f6ffed', borderRadius: '6px' }}>
                  <Text type="secondary">{t('payroll:entry_detail_modal.gross_pay')}</Text>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a', marginTop: '8px' }}>
                    {formatAmount(entryDetails.gross_pay)}
                  </div>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#fff2e8', borderRadius: '6px' }}>
                  <Text type="secondary">{t('payroll:entry_detail_modal.total_deductions')}</Text>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fa8c16', marginTop: '8px' }}>
                    {formatAmount(entryDetails.total_deductions)}
                  </div>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#e6f7ff', borderRadius: '6px' }}>
                  <Text type="secondary">{t('payroll:entry_detail_modal.net_pay')}</Text>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff', marginTop: '8px' }}>
                    {formatAmount(entryDetails.net_pay)}
                  </div>
                </div>
              </Col>
            </Row>
          </Card>

          {/* 收入明细 */}
          {entryDetails.earnings_details && Object.keys(entryDetails.earnings_details).length > 0 && componentDefinitionsLoaded && (
            <Card title={t('payroll:entry_detail_modal.earnings_details_title')} style={{ marginBottom: 16 }}>
              <Table
                columns={earningsColumns}
                dataSource={Object.entries(entryDetails.earnings_details).map(([code, detail]: [string, any]) => ({
                  key: code,
                  component_name: getComponentDisplayName(code),
                  amount: detail.amount,
                  description: detail.description,
                }))}
                pagination={false}
                size="small"
              />
            </Card>
          )}

          {/* 扣缴明细 */}
          {entryDetails.deductions_details && Object.keys(entryDetails.deductions_details).length > 0 && componentDefinitionsLoaded && (
            <Card title={t('payroll:entry_detail_modal.deductions_details_title')} style={{ marginBottom: 16 }}>
              <Table
                columns={deductionsColumns}
                dataSource={Object.entries(entryDetails.deductions_details).map(([code, detail]: [string, any]) => ({
                  key: code,
                  component_name: getComponentDisplayName(code),
                  amount: detail.amount,
                  description: detail.description,
                }))}
                pagination={false}
                size="small"
              />
            </Card>
          )}

          {/* 时间信息 */}
          <Card title={t('payroll:entry_detail_modal.time_info_title')}>
            <Descriptions bordered column={1}>
              <Descriptions.Item label={t('payroll:entry_detail_modal.created_at')}>
                {entryDetails.created_at ? dayjs(entryDetails.created_at).format('YYYY-MM-DD HH:mm:ss') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label={t('payroll:entry_detail_modal.updated_at')}>
                {entryDetails.updated_at ? dayjs(entryDetails.updated_at).format('YYYY-MM-DD HH:mm:ss') : '-'}
              </Descriptions.Item>
              {entryDetails.remarks && (
                <Descriptions.Item label={t('payroll:entry_detail_modal.notes')}>
                  {entryDetails.remarks}
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>
        </div>
      )}

      {!loading && !error && !entryDetails && (
        <Alert 
          message={t('payroll:entry_detail_modal.not_found')} 
          type="warning" 
          showIcon 
        />
      )}
    </Modal>
  );
};

export default PayrollEntryDetailModal;