import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Modal, message, Button, Space } from 'antd';
import { ProTable, type ProColumns, type ActionType } from '@ant-design/pro-components';
import { ReloadOutlined, DownloadOutlined } from '@ant-design/icons';
import { payrollViewsApi, type ComprehensivePayrollDataView } from '../../Payroll/services/payrollViewsApi';

// 工资数据类型定义 - 使用核心视图API返回的类型
interface PayrollData extends ComprehensivePayrollDataView {
  id?: number; // 用于表格的key
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
  const actionRef = useRef<ActionType>(null);
  const [collapsed, setCollapsed] = useState(false);

  // 获取工资数据
  const fetchPayrollData = useCallback(async () => {
    if (!periodId) return;
    
    setLoading(true);
    try {
      const response = await payrollViewsApi.getComprehensivePayrollData({
        period_id: periodId,
        limit: 200
      });
      
      // 转换API返回的数据格式，添加id字段用于表格key
      const transformedData: PayrollData[] = response.map((item: ComprehensivePayrollDataView, index: number) => ({
        ...item,
        id: item.薪资条目id || index, // 使用薪资条目id作为key，如果没有则使用索引
      }));
      
      setDataSource(transformedData);
    } catch (error: any) {
      message.error(`获取工资数据失败: ${error.message || '未知错误'}`);
    } finally {
      setLoading(false);
    }
  }, [periodId]);

  // 当模态框显示时获取数据
  useEffect(() => {
    if (visible && periodId) {
      fetchPayrollData();
    }
  }, [visible, periodId, fetchPayrollData]);

  // 导出数据为Excel
  const handleExportExcel = () => {
    if (dataSource.length === 0) {
      message.warning('没有数据可导出');
      return;
    }

    // 准备导出数据 - 按照用户要求的字段顺序
    const exportData = dataSource.map((item, index) => ({
      '序号': index + 1,
      '姓名': item.姓名 || '',
      '部门': item.部门名称 || '',
      '人员身份': item.人员类别 || '',
      '职位': item.职位名称 || '',
      '应发合计': item.应发合计?.toFixed(2) || '0.00',
      '扣除合计': item.扣除合计?.toFixed(2) || '0.00',
      '实发合计': item.实发合计?.toFixed(2) || '0.00',
      '养老保险个人应缴费额': item.养老保险个人应缴费额?.toFixed(2) || '0.00',
      '医疗保险个人应缴费额': item.医疗保险个人应缴费额?.toFixed(2) || '0.00',
      '职业年金个人应缴费额': item.职业年金个人应缴费额?.toFixed(2) || '0.00',
      '失业保险个人应缴费额': item.失业保险个人应缴费额?.toFixed(2) || '0.00',
      '住房公积金个人应缴费额': item.住房公积金个人应缴费额?.toFixed(2) || '0.00',
      '个人所得税': item.个人所得税?.toFixed(2) || '0.00',
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

  // 表格列配置 - 按照用户要求的字段顺序：姓名、部门、人员身份、职位、应发合计、扣除合计、实发合计、养老保险个人应缴费额、医疗保险个人应缴费额、职业年金个人应缴费额、失业保险个人应缴费额、住房公积金个人应缴费额、个人所得税
  const columns: ProColumns<PayrollData>[] = [
    {
      title: '姓名',
      dataIndex: '姓名',
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
      dataIndex: '部门名称',
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
        const departments = Array.from(new Set(dataSource.map(item => item.部门名称).filter(Boolean)));
        return departments.map(dept => ({ label: dept, value: dept }));
      },
    },
    {
      title: '人员身份',
      dataIndex: '人员类别',
      key: 'personnel_category',
      width: 120,
      search: {
        transform: (value: string) => ({ personnel_category: value }),
      },
    },
    {
      title: '职位',
      dataIndex: '职位名称',
      key: 'position_name',
      width: 120,
      search: {
        transform: (value: string) => ({ position_name: value }),
      },
    },
    {
      title: '应发合计',
      dataIndex: '应发合计',
      key: 'gross_pay',
      width: 120,
      align: 'right',
      render: (_, record) => `¥${record.应发合计?.toFixed(2) || '0.00'}`,
      sorter: (a, b) => (a.应发合计 || 0) - (b.应发合计 || 0),
    },
    {
      title: '扣除合计',
      dataIndex: '扣除合计',
      key: 'total_deductions',
      width: 120,
      align: 'right',
      render: (_, record) => `¥${record.扣除合计?.toFixed(2) || '0.00'}`,
      sorter: (a, b) => (a.扣除合计 || 0) - (b.扣除合计 || 0),
    },
    {
      title: '实发合计',
      dataIndex: '实发合计',
      key: 'net_pay',
      width: 120,
      align: 'right',
      render: (_, record) => `¥${record.实发合计?.toFixed(2) || '0.00'}`,
      sorter: (a, b) => (a.实发合计 || 0) - (b.实发合计 || 0),
    },
    {
      title: '养老保险个人应缴费额',
      dataIndex: '养老保险个人应缴费额',
      key: 'pension_personal',
      width: 150,
      align: 'right',
      render: (_, record) => record.养老保险个人应缴费额 ? `¥${record.养老保险个人应缴费额.toFixed(2)}` : '-',
    },
    {
      title: '医疗保险个人应缴费额',
      dataIndex: '医疗保险个人应缴费额',
      key: 'medical_personal',
      width: 150,
      align: 'right',
      render: (_, record) => record.医疗保险个人应缴费额 ? `¥${record.医疗保险个人应缴费额.toFixed(2)}` : '-',
    },
    {
      title: '职业年金个人应缴费额',
      dataIndex: '职业年金个人应缴费额',
      key: 'annuity_personal',
      width: 150,
      align: 'right',
      render: (_, record) => record.职业年金个人应缴费额 ? `¥${record.职业年金个人应缴费额.toFixed(2)}` : '-',
    },
    {
      title: '失业保险个人应缴费额',
      dataIndex: '失业保险个人应缴费额',
      key: 'unemployment_personal',
      width: 150,
      align: 'right',
      render: (_, record) => record.失业保险个人应缴费额 ? `¥${record.失业保险个人应缴费额.toFixed(2)}` : '-',
    },
    {
      title: '住房公积金个人应缴费额',
      dataIndex: '住房公积金个人应缴费额',
      key: 'housing_fund_personal',
      width: 160,
      align: 'right',
      render: (_, record) => record.住房公积金个人应缴费额 ? `¥${record.住房公积金个人应缴费额.toFixed(2)}` : '-',
    },
    {
      title: '个人所得税',
      dataIndex: '个人所得税',
      key: 'personal_income_tax',
      width: 120,
      align: 'right',
      render: (_, record) => record.个人所得税 ? `¥${record.个人所得税.toFixed(2)}` : '-',
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
                <span style={{ fontSize: 14, cursor: 'pointer', color: '#1890ff' }} onClick={() => setCollapsed(false)}>
                  展开 ↓
                </span>
              );
            }
            return (
              <span style={{ fontSize: 14, cursor: 'pointer', color: '#1890ff' }} onClick={() => setCollapsed(true)}>
                收起 ↑
              </span>
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
                应发合计: ¥{selectedRows.reduce((sum, row) => sum + (row.应发合计 || 0), 0).toFixed(2)}
                &nbsp;&nbsp;
                实发合计: ¥{selectedRows.reduce((sum, row) => sum + (row.实发合计 || 0), 0).toFixed(2)}
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