import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Select, message, Progress, Spin, Alert, Space, InputNumber, DatePicker } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined } from '@ant-design/icons';
import TableActionButton from '../../../../components/common/TableActionButton';
import { employeeService } from '../../../../services/employeeService';
import { LeaveType } from '../../types'; // Enum used as value
import type { LeaveBalanceItem, LeaveBalancePageResult } from '../../types'; // Types
import { usePermissions } from '../../../../hooks/usePermissions';
import dayjs from 'dayjs'; // Restore dayjs import
import { useTranslation } from 'react-i18next';
// import { useEmployeeDetails } from '../../../../hooks/useEmployeeDetails'; // Commented out: Source file not definitively located
// import { formatDate } from '../../../../utils/dateUtils'; // Commented out: Source file not definitively located

interface LeaveBalanceTabProps {
  employeeId: string;
}

const LeaveBalanceTab: React.FC<LeaveBalanceTabProps> = ({ employeeId }) => {
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalanceItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [editingRecord, setEditingRecord] = useState<LeaveBalanceItem | null>(null);
  const [form] = Form.useForm();
  const { hasPermission } = usePermissions();
  const { t } = useTranslation();

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalRecords, setTotalRecords] = useState<number>(0);

  const fetchLeaveBalances = async (page: number, size: number) => {
    setLoading(true);
    setError(null);
    try {
      const result: LeaveBalancePageResult = await employeeService.getEmployeeLeaveBalances(employeeId, { page, pageSize: size });
      setLeaveBalances(result.data.map(item => ({ ...item, balance: item.total_entitlement - item.taken }) ));
      setTotalRecords(result.meta.total || 0);
      setCurrentPage(result.meta.page);
      setPageSize(result.meta.size);
    } catch (err: any) {
      console.error('获取假期余额失败:', err);
      setError('获取假期余额失败，请稍后重试。');
      message.error(err.response?.data?.message || '获取假期余额失败!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (employeeId) {
      fetchLeaveBalances(currentPage, pageSize);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId, currentPage, pageSize]);

  const handleAddOrAdjust = (record?: LeaveBalanceItem) => {
    setEditingRecord(record || null);
    if (record) {
      form.setFieldsValue({
        ...record,
        validity_date: record.validity_date ? dayjs(record.validity_date) : null,
      });
    } else {
      form.resetFields();
    }
    setIsModalVisible(true);
  };


  const handleModalOk = async () => {
    // TODO: Implement actual create/update/adjust API call in employeeService
    try {
      if (editingRecord) {
        message.success('假期余额调整成功 (模拟)');
      } else {
        message.success('假期余额添加成功 (模拟)');
      }
      setIsModalVisible(false);
      fetchLeaveBalances(currentPage, pageSize); // Refresh
    } catch (errorInfo) {
      console.log('表单校验失败:', errorInfo);
      message.error('表单校验失败，请检查输入。');
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
  };

  const handleTableChange = (pagination: any) => {
    fetchLeaveBalances(pagination.current, pagination.pageSize);
  };

  const columns: ColumnsType<LeaveBalanceItem> = [
    { title: '假期类型', dataIndex: 'leaveTypeName', key: 'leaveTypeName' }, // Assuming leaveTypeName is provided
    { title: '总额度', dataIndex: 'total_entitlement', key: 'total_entitlement', render: (val, rec) => `${val} ${rec.unit}` },
    { title: '已用', dataIndex: 'taken', key: 'taken', render: (val, rec) => `${val} ${rec.unit}` },
    {
      title: '余额',
      dataIndex: 'balance',
      key: 'balance',
      render: (balance, record) => {
        const percent = record.total_entitlement > 0 ? (record.taken / record.total_entitlement) * 100 : 0;
        return (
          <Space direction="vertical" style={{width: '100%'}}>
            <span>{`${balance} ${record.unit}`}</span>
            <Progress percent={parseFloat(percent.toFixed(2))} size="small" />
          </Space>
        );
      },
    },
    { title: '单位', dataIndex: 'unit', key: 'unit', responsive: ['md'] }, // Redundant due to inclusion above, but can be a separate column
    { title: '年度', dataIndex: 'year', key: 'year', responsive: ['md'] },
    { title: '有效期至', dataIndex: 'validityDate', key: 'validityDate', render: (text) => dayjs(text).isValid() ? dayjs(text).format('YYYY-MM-DD') : 'N/A', responsive: ['lg'] },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 150,
      render: (_, record) => (
        <Space size="middle">
          {hasPermission('leave:adjust_balance') && (
            <TableActionButton actionType="edit" onClick={() => handleAddOrAdjust(record)} tooltipTitle={t('adjust_balance')} />
          )}
          {/* Delete might not be a standard operation for balances; consider if needed */}
          {/* {hasPermission('leave:manage_balance_records') && (
            <ActionButton actionType="delete" onClick={() => handleDelete(record.id)} danger tooltipTitle="移除假期余额记录" />
          )} */}
        </Space>
      ),
    },
  ];

  if (loading && !leaveBalances.length) {
    return (
      <div style={{ textAlign: 'center', padding: '20px'}}>
        <Spin>
          <div style={{ padding: '30px', background: 'rgba(0, 0, 0, 0.05)' }}>
            加载假期余额中...
          </div>
        </Spin>
      </div>
    );
  }

  if (error) {
    return <Alert message="错误" description={error} type="error" showIcon style={{ margin: '16px 0'}} />;
  }

  return (
    <div>
      {hasPermission('leave:adjust_balance') && (
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => handleAddOrAdjust()}
          style={{ marginBottom: 16 }}
        >
          添加/调整假期余额
        </Button>
      )}
      <Table
        columns={columns}
        dataSource={leaveBalances}
        rowKey="id"
        loading={loading}
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: totalRecords, // totalRecords 已经根据 meta.total_items 设置
          showSizeChanger: true,
        }}
        onChange={handleTableChange}
        scroll={{ x: 'max-content' }}
      />
      <Modal
        title={editingRecord ? '调整假期余额' : '添加假期余额'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        okText="保存"
        cancelText="取消"
        destroyOnHidden
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="leaveTypeId" label="假期类型" rules={[{ required: true, message: '请选择假期类型' }]}>
            <Select placeholder="选择假期类型">
              {/* TODO: Populate with lookupService.getLeaveTypesLookup() */}
              {Object.values(LeaveType).map(lt => (
                <Select.Option key={lt} value={lt}>{lt}</Select.Option> // TODO: Map to Chinese label
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="total_entitlement" label="总额度" rules={[{ required: true, message: '请输入总额度' }]}>
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="taken" label="已用额度" rules={[{ required: true, message: '请输入已用额度' }]}>
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
           <Form.Item name="unit" label="单位" rules={[{ required: true, message: '请选择单位' }]}>
            <Select placeholder="选择单位">
              <Select.Option value="days">天</Select.Option>
              <Select.Option value="hours">小时</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="year" label="年度 (可选)">
            <InputNumber style={{ width: '100%' }} placeholder="例如: 2023"/>
          </Form.Item>
          <Form.Item name="validity_date" label="有效期至 (可选)">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default LeaveBalanceTab;