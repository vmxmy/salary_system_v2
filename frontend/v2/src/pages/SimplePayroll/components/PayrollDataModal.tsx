import React, { useState, useEffect, useRef } from 'react';
import { Modal, message, Button, Space } from 'antd';
import { ProTable, type ProColumns, type ActionType } from '@ant-design/pro-components';
import { ReloadOutlined, DownloadOutlined, SettingOutlined } from '@ant-design/icons';
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
  const [dataSource, setDataSource] = useState<PayrollData[]>([]);
  const [loading, setLoading] = useState(false);
  const actionRef = useRef<ActionType>();
  const [collapsed, setCollapsed] = useState(false);

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

  // 导出数据为Excel
  const handleExportExcel = () => {
    if (dataSource.length === 0) {
      message.warning('没有数据可导出');
      return;
    }

    // 准备导出数据
    const exportData = dataSource.map((item, index) => ({
      '序号': index + 1,
      '员工工号': item.employee_code,
      '姓名': item.employee_name,
      '部门': item.department_name,
      '职位': item.position_name,
      '应发合计': item.gross_pay?.toFixed(2) || '0.00',
      '实发合计': item.net_pay?.toFixed(2) || '0.00',
      '扣除合计': item.total_deductions?.toFixed(2) || '0.00',
      '基本工资': item.basic_salary?.toFixed(2) || '0.00',
      '绩效奖金': item.performance_salary?.toFixed(2) || '0.00',
      '岗位工资': item.position_salary?.toFixed(2) || '0.00',
      '津贴补助': item.allowance?.toFixed(2) || '0.00',
      '个人所得税': item.personal_income_tax?.toFixed(2) || '0.00',
      '养老保险个人': item.pension_personal?.toFixed(2) || '0.00',
      '医疗保险个人': item.medical_personal?.toFixed(2) || '0.00',
      '住房公积金个人': item.housing_fund_personal?.toFixed(2) || '0.00',
    }));

    // 创建工作表
    import('xlsx').then((XLSX) => {
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, '工资数据');
      
      // 生成文件名
      const fileName = `工资数据_${periodName || '当前期间'}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      message.success(`已导出 ${dataSource.length} 条记录到 ${fileName}`);
    }).catch((error) => {
      message.error('导出失败，请确保已安装Excel导出组件');
      console.error('Export error:', error);
    });
  };

  // 刷新数据
  const handleRefresh = () => {
    fetchPayrollData();
    message.success('数据已刷新');
  };

  // 表格列配置
  const columns: ProColumns<PayrollData>[] = [
    {
      title: '员工工号',
      dataIndex: 'employee_code',
      key: 'employee_code',
      width: 100,
      fixed: 'left',
      copyable: true,
      search: {
        transform: (value: string) => ({ employee_code: value }),
      },
    },
    {
      title: '姓名',
      dataIndex: 'employee_name',
      key: 'employee_name',
      width: 100,
      fixed: 'left',
      copyable: true,
      search: {
        transform: (value: string) => ({ employee_name: value }),
      },
    },
    {
      title: '部门',
      dataIndex: 'department_name',
      key: 'department_name',
      width: 120,
      search: {
        transform: (value: string) => ({ department_name: value }),
      },
      filters: true,
      onFilter: true,
      valueType: 'select',
      request: async () => {
        // 从数据源中提取部门列表
        const departments = Array.from(new Set(dataSource.map(item => item.department_name).filter(Boolean)));
        return departments.map(dept => ({ label: dept, value: dept }));
      },
    },
    {
      title: '职位',
      dataIndex: 'position_name',
      key: 'position_name',
      width: 120,
      search: {
        transform: (value: string) => ({ position_name: value }),
      },
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
        actionRef={actionRef}
        search={{
          labelWidth: 'auto',
          collapsed: collapsed,
          collapseRender: (collapsed, showCollapseIcon) => {
            if (collapsed) {
              return (
                <a style={{ fontSize: 14 }} onClick={() => setCollapsed(false)}>
                  展开 ↓
                </a>
              );
            }
            return (
              <a style={{ fontSize: 14 }} onClick={() => setCollapsed(true)}>
                收起 ↑
              </a>
            );
          },
        }}
        toolBarRender={() => [
          <Space key="toolbar">
            <Button
              key="refresh"
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
              loading={loading}
            >
              刷新
            </Button>
            <Button
              key="export"
              icon={<DownloadOutlined />}
              onClick={handleExportExcel}
              disabled={dataSource.length === 0}
            >
              导出Excel
            </Button>
          </Space>
        ]}
        columnsState={{
          persistenceKey: 'payroll-data-table',
          persistenceType: 'localStorage',
        }}
        options={{
          reload: handleRefresh,
          density: true,
          fullScreen: true,
          setting: {
            listsHeight: 400,
            draggable: true,
            checkable: true,
          },
        }}
        pagination={{
          defaultPageSize: 20,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
          pageSizeOptions: ['10', '20', '50', '100'],
        }}
        scroll={{ x: 1500, y: 400 }}
        size="small"
        cardBordered
        headerTitle={`工资数据 (${dataSource.length} 条记录)`}
        tableAlertRender={({ selectedRowKeys, selectedRows }) => (
          selectedRowKeys.length > 0 && (
            <div>
              已选择 <a style={{ fontWeight: 600 }}>{selectedRowKeys.length}</a> 项
              &nbsp;&nbsp;
              <span>
                应发合计: ¥{selectedRows.reduce((sum, row) => sum + (row.gross_pay || 0), 0).toFixed(2)}
                &nbsp;&nbsp;
                实发合计: ¥{selectedRows.reduce((sum, row) => sum + (row.net_pay || 0), 0).toFixed(2)}
              </span>
            </div>
          )
        )}
        rowSelection={{
          type: 'checkbox',
          // 可以添加批量操作
        }}
      />
    </Modal>
  );
}; 