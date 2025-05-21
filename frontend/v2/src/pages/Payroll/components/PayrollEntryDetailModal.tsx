import React, { useEffect, useState } from 'react';
import { Modal, Descriptions, Spin, Alert, Typography, Card, Empty, Tooltip, Tag } from 'antd';
import { getPayrollEntryById } from '../services/payrollApi';
import type { PayrollEntry, ApiSingleResponse, PayrollItemDetail } from '../types/payrollTypes';
import { useTranslation } from 'react-i18next';
import usePayrollConfigStore from '../../../store/payrollConfigStore';
import { employeeService } from '../../../services/employeeService'; // 引入员工服务
import EmployeeName from '../../../components/common/EmployeeName';

const { Title } = Typography;

interface PayrollEntryDetailModalProps {
  entryId: number | null;
  visible: boolean;
  onClose: () => void;
}

const PayrollEntryDetailModal: React.FC<PayrollEntryDetailModalProps> = ({ entryId, visible, onClose }) => {
  const { t } = useTranslation(['common', 'payroll']);
  const [entry, setEntry] = useState<PayrollEntry | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [employeeInfo, setEmployeeInfo] = useState<{ firstName?: string; lastName?: string; displayName?: string } | null>(null);
  const [loadingEmployeeInfo, setLoadingEmployeeInfo] = useState<boolean>(false);

  const { getDefinitionByName } = usePayrollConfigStore();

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

  useEffect(() => {
    if (entryId && visible) {
      setLoading(true);
      setError(null);
      setEmployeeInfo(null); // 重置员工信息
      
      console.log('📋 开始获取工资条目详情, ID:', entryId);
      
      getPayrollEntryById(entryId)
        .then((response: ApiSingleResponse<PayrollEntry>) => {
          setEntry(response.data);
          
          // 增强的调试输出，检查员工信息详情
          console.log('📊 工资条目详情数据:', {
            id: response.data.id,
            employee_id: response.data.employee_id,
            employee_name: response.data.employee_name,
            employee_name_type: typeof response.data.employee_name,
            employee_name_length: response.data.employee_name ? response.data.employee_name.length : 0
          });
          
          // 检查earnings_details和deductions_details的数据结构
          console.log('💰 收入项详情:', {
            isArray: Array.isArray(response.data.earnings_details),
            count: Array.isArray(response.data.earnings_details) ? response.data.earnings_details.length : null,
            firstItem: response.data.earnings_details && response.data.earnings_details.length > 0 
              ? response.data.earnings_details[0] : null
          });
          
          console.log('💸 扣除项详情:', {
            isArray: Array.isArray(response.data.deductions_details),
            count: Array.isArray(response.data.deductions_details) ? response.data.deductions_details.length : null,
            firstItem: response.data.deductions_details && response.data.deductions_details.length > 0 
              ? response.data.deductions_details[0] : null
          });
          
          // 检查原始API响应中的所有顶级字段
          console.log('🔍 API返回数据的所有字段:', Object.keys(response.data));
          
          // 如果没有员工姓名，获取员工详细信息
          if (!response.data.employee_name && response.data.employee_id) {
            fetchEmployeeInfo(response.data.employee_id);
          }
        })
        .catch((err) => {
          console.error("❌ 获取工资条目详情失败:", err);
          setError(t('payroll:entries_table.error_fetch'));
        })
        .finally(() => {
          setLoading(false);
        });
    } else if (!visible) {
      // Reset state when modal is closed
      setEntry(null);
      setError(null);
      setEmployeeInfo(null);
    }
  }, [entryId, visible, t]);

  const renderDetailsCard = (title: string, details: PayrollItemDetail[] | undefined | null) => {
    if (!details || !Array.isArray(details) || details.length === 0) {
      return (
        <Card title={title} variant="borderless" style={{ marginBottom: 16 }}>
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('common:table.empty_data')} />
        </Card>
      );
    }
    return (
      <Card title={title} variant="borderless" style={{ marginBottom: 16 }}>
        {details.map((item, index) => {
          const definition = getDefinitionByName(item.name);
          const displayName = definition?.name || item.name;
          const itemTitle = definition ? (
            <Tooltip title={`Code: ${item.name} | Type: ${definition.type} | Data Type: ${definition.data_type}`}>
              {displayName}
            </Tooltip>
          ) : displayName;

          return (
            <Descriptions key={index} bordered column={1} size="small" style={{ marginBottom: 10 }}>
              <Descriptions.Item label={t('payroll:entries_table.modal.component_name')}>{itemTitle}</Descriptions.Item>
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

  return (
    <Modal
      title={t('payroll:entries_table.modal.title_detail')}
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
      destroyOnClose // 使用 destroyOnClose 确保模态框关闭后状态重置
    >
      {loading && <Spin />}
      {error && <Alert message={t('common:error.genericTitle')} description={error} type="error" showIcon />}
      {entry && !loading && !error && (
        <>
          <Descriptions bordered column={2} title={<Title level={5}>{t('payroll:run_detail_page.section_title_entries')}</Title>} style={{ marginBottom: 20 }}>
            <Descriptions.Item label={t('payroll:entries_table.column.entry_id')}>{entry.id}</Descriptions.Item>
            <Descriptions.Item label={t('payroll:entries_table.column.employee_id')}>{entry.employee_id}</Descriptions.Item>
            <Descriptions.Item label={t('payroll:entries_table.column.payroll_run_id')}>{entry.payroll_run_id}</Descriptions.Item>
            <Descriptions.Item label={t('payroll:entries_table.column.payroll_period')}>
              {entry.payroll_run?.payroll_period?.name || t('common:notAvailable')}
            </Descriptions.Item>
            <Descriptions.Item label={t('payroll:entries_table.column.employee_name')}>
              <EmployeeName
                employeeId={entry.employee_id}
                employeeName={entry.employee_name}
                showId={true}
                className="payroll-detail-employee-name"
              />
            </Descriptions.Item>
            <Descriptions.Item label={t('payroll:entries_table.column.total_earnings')}>
              {entry.total_earnings !== undefined && entry.total_earnings !== null
                ? (() => {
                    const numValue = parseFloat(String(entry.total_earnings));
                    return !isNaN(numValue) ? numValue.toFixed(2) : '0.00';
                  })()
                : '0.00'}
            </Descriptions.Item>
            <Descriptions.Item label={t('payroll:entries_table.column.total_deductions')}>
              {entry.total_deductions !== undefined && entry.total_deductions !== null
                ? (() => {
                    const numValue = parseFloat(String(entry.total_deductions));
                    return !isNaN(numValue) ? numValue.toFixed(2) : '0.00';
                  })()
                : '0.00'}
            </Descriptions.Item>
            <Descriptions.Item label={t('payroll:entries_table.column.net_pay')}>
              {entry.net_pay !== undefined && entry.net_pay !== null
                ? (() => {
                    const numValue = parseFloat(String(entry.net_pay));
                    return !isNaN(numValue) ? numValue.toFixed(2) : '0.00';
                  })()
                : '0.00'}
            </Descriptions.Item>
            <Descriptions.Item label={t('payroll:entries_table.column.payment_date')}>{entry.payroll_run?.paid_at ? new Date(entry.payroll_run.paid_at).toLocaleDateString() : t('common:notAvailable')}</Descriptions.Item>
            <Descriptions.Item label={t('payroll:entries_table.column.status')}>{entry.status?.display_name || entry.status_lookup_value_id}</Descriptions.Item>
            <Descriptions.Item label={t('payroll:entries_table.column.remarks')} span={2}>{entry.remarks || '-'}</Descriptions.Item>
          </Descriptions>

          {renderDetailsCard(t('payroll:entries_table.modal.earnings_details'), entry.earnings_details)}
          {renderDetailsCard(t('payroll:entries_table.modal.deductions_details'), entry.deductions_details)}
        </>
      )}
    </Modal>
  );
};

export default PayrollEntryDetailModal;