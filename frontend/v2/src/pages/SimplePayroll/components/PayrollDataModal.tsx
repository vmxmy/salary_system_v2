import React, { useState, useEffect } from 'react';
import { Modal, message } from 'antd';
import { ProTable, type ProColumns } from '@ant-design/pro-components';
import { payrollViewsApi, type PayrollEntryDetailedView } from '../../Payroll/services/payrollViewsApi';

// 工资数据类型定义 - 使用API返回的类型
interface PayrollData extends PayrollEntryDetailedView {
  employee_code: string;
  period_id: number;
}

interface PayrollDataModalProps {
  visible: boolean;
  onClose: () => void;
  periodId: number;
  periodName?: string;
}

export const PayrollDataModal: React.FC<PayrollDataModalProps> = ({
  visible,
  onClose,
  periodId,
  periodName
}) => {
  const [loading, setLoading] = useState(false);
  const [dataSource, setDataSource] = useState<PayrollData[]>([]);

  // 获取工资数据
  const fetchPayrollData = async () => {
    if (!periodId) return;
    
    setLoading(true);
    try {
      const response = await payrollViewsApi.getPayrollEntriesDetailed({
        period_id: periodId,
        limit: 200
      });
      
      // 转换API返回的数据格式
      const transformedData: PayrollData[] = response.map((item: PayrollEntryDetailedView) => ({
        ...item,
        employee_code: item.employee_id?.toString() || '', // 转换为string
        period_id: periodId, // 使用传入的periodId
      }));
      
      setDataSource(transformedData);
    } catch (error: any) {
      message.error(`获取工资数据失败: ${error.message || '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  // 当模态框显示时获取数据
  useEffect(() => {
    if (visible && periodId) {
      fetchPayrollData();
    }
  }, [visible, periodId]);

  // 表格列配置
  const columns: ProColumns<PayrollData>[] = [
    {
      title: '员工工号',
      dataIndex: 'employee_code',
      key: 'employee_code',
      width: 100,
      fixed: 'left',
    },
    {
      title: '姓名',
      dataIndex: 'employee_name',
      key: 'employee_name',
      width: 100,
      fixed: 'left',
    },
    {
      title: '部门',
      dataIndex: 'department_name',
      key: 'department_name',
      width: 120,
    },
    {
      title: '职位',
      dataIndex: 'position_name',
      key: 'position_name',
      width: 120,
    },
    {
      title: '应发合计',
      dataIndex: 'gross_pay',
      key: 'gross_pay',
      width: 120,
      render: (_, record) => `¥${record.gross_pay?.toFixed(2) || '0.00'}`,
      sorter: (a, b) => (a.gross_pay || 0) - (b.gross_pay || 0),
    },
    {
      title: '实发合计',
      dataIndex: 'net_pay',
      key: 'net_pay',
      width: 120,
      render: (_, record) => `¥${record.net_pay?.toFixed(2) || '0.00'}`,
      sorter: (a, b) => (a.net_pay || 0) - (b.net_pay || 0),
    },
    {
      title: '扣除合计',
      dataIndex: 'total_deductions',
      key: 'total_deductions',
      width: 120,
      render: (_, record) => `¥${record.total_deductions?.toFixed(2) || '0.00'}`,
      sorter: (a, b) => (a.total_deductions || 0) - (b.total_deductions || 0),
    },
    {
      title: '基本工资',
      dataIndex: 'basic_salary',
      key: 'basic_salary',
      width: 100,
      render: (_, record) => record.basic_salary ? `¥${record.basic_salary.toFixed(2)}` : '-',
    },
    {
      title: '绩效奖金',
      dataIndex: 'performance_bonus',
      key: 'performance_bonus',
      width: 100,
      render: (_, record) => record.performance_salary ? `¥${record.performance_salary.toFixed(2)}` : '-',
    },
    {
      title: '岗位工资',
      dataIndex: 'position_salary',
      key: 'position_salary',
      width: 100,
      render: (_, record) => record.position_salary ? `¥${record.position_salary.toFixed(2)}` : '-',
    },
    {
      title: '津贴补助',
      dataIndex: 'allowance',
      key: 'allowance',
      width: 100,
      render: (_, record) => record.allowance ? `¥${record.allowance.toFixed(2)}` : '-',
    },
    {
      title: '个人所得税',
      dataIndex: 'personal_income_tax',
      key: 'personal_income_tax',
      width: 100,
      render: (_, record) => record.personal_income_tax ? `¥${record.personal_income_tax.toFixed(2)}` : '-',
    },
    {
      title: '养老保险',
      dataIndex: 'social_insurance_personal',
      key: 'social_insurance_personal',
      width: 100,
      render: (_, record) => record.social_insurance_personal ? `¥${record.social_insurance_personal.toFixed(2)}` : '-',
    },
    {
      title: '医疗保险',
      dataIndex: 'social_insurance_personal',
      key: 'medical_insurance',
      width: 100,
      render: (_, record) => record.social_insurance_personal ? `¥${(record.social_insurance_personal * 0.6).toFixed(2)}` : '-',
    },
    {
      title: '住房公积金',
      dataIndex: 'housing_fund_personal',
      key: 'housing_fund_personal',
      width: 100,
      render: (_, record) => record.housing_fund_personal ? `¥${record.housing_fund_personal.toFixed(2)}` : '-',
    },
  ];

  return (
    <Modal
      title={`工资数据浏览 - ${periodName || '当前期间'}`}
      open={visible}
      onCancel={onClose}
      width={1200}
      footer={null}
      destroyOnClose
    >
      <ProTable<PayrollData>
        columns={columns}
        dataSource={dataSource}
        rowKey="id"
        loading={loading}
        pagination={{
          defaultPageSize: 20,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
        }}
        scroll={{ x: 1500, y: 400 }}
        size="small"
        search={false}
        toolBarRender={false}
        cardBordered
      />
    </Modal>
  );
}; 