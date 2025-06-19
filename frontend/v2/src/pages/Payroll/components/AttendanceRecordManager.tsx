import React, { useEffect, useState, useCallback } from 'react';
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  message,
  Tag,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { ColumnsType } from 'antd/es/table';

import TableActionButton from '../../../components/common/TableActionButton';
import type {
  AttendanceRecord,
  AttendancePeriod,
  CreateAttendanceRecordRequest,
  UpdateAttendanceRecordRequest,
} from '../types/attendanceTypes';
import { attendanceRecordApi, attendancePeriodApi } from '../services/attendanceApi';

const { Option } = Select;
const { TextArea } = Input;

const AttendanceRecordManager: React.FC = () => {
  const { t } = useTranslation(['payroll', 'common']);
  const [form] = Form.useForm();

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [periods, setPeriods] = useState<AttendancePeriod[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);

  const columns: ColumnsType<AttendanceRecord> = [
    {
      title: t('payroll:employee_name'),
      dataIndex: 'employee_name',
      key: 'employee_name',
      width: 120,
    },
    {
      title: t('payroll:attendance_period'),
      dataIndex: ['attendance_period', 'name'],
      key: 'attendance_period_name',
      width: 150,
      render: (_, record, index) => record.attendance_period?.name || '-',
    },
    {
      title: t('payroll:work_days'),
      dataIndex: 'work_days',
      key: 'work_days',
      width: 80,
      align: 'center',
    },
    {
      title: t('payroll:actual_work_days'),
      dataIndex: 'actual_work_days',
      key: 'actual_work_days',
      width: 100,
      align: 'center',
      render: (value: number) => (
        <Tag color={value >= 0 ? 'green' : 'red'}>{value}</Tag>
      ),
    },
    {
      title: t('payroll:overtime_hours'),
      dataIndex: 'overtime_hours',
      key: 'overtime_hours',
      width: 100,
      align: 'center',
      render: (value: number) => value > 0 ? <Tag color="blue">{value}h</Tag> : '-',
    },
    {
      title: t('payroll:leave_days'),
      dataIndex: 'leave_days',
      key: 'leave_days',
      width: 80,
      align: 'center',
      render: (value: number) => value > 0 ? <Tag color="orange">{value}</Tag> : '-',
    },
    {
      title: t('payroll:absent_days'),
      dataIndex: 'absent_days',
      key: 'absent_days',
      width: 80,
      align: 'center',
      render: (value: number) => value > 0 ? <Tag color="red">{value}</Tag> : '-',
    },
    {
      key: 'actions',
      title: t('common:action.title'),
      dataIndex: 'actions',
      render: (_: any, record: AttendanceRecord) => (
        <Space size="small">
          <TableActionButton
            actionType="edit"
            onClick={() => handleEdit(record)}
            tooltipTitle={t('common:edit')}
          />
          <TableActionButton
            actionType="delete"
            onClick={() => handleDelete(record.id)}
            tooltipTitle={t('common:delete')}
            danger
          />
        </Space>
      ),
    },
  ];

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [recordsResponse, periodsResponse] = await Promise.all([
        attendanceRecordApi.getAttendanceRecords({ page: 1, size: 100 }),
        attendancePeriodApi.getAttendancePeriods({ page: 1, size: 100 }),
      ]);
      setRecords(recordsResponse.data || []);
      setPeriods(periodsResponse.data || []);
    } catch (error: any) {
      message.error(t('common:load_failed'));
      console.error('Failed to load attendance records:', error);
    } finally {
      setLoading(false);
    }
  }, [t]);

  const handleCreate = () => {
    setEditingRecord(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: AttendanceRecord) => {
    setEditingRecord(record);
    form.setFieldsValue({
      employee_id: record.employee_id,
      attendance_period_id: record.attendance_period_id,
      work_days: record.work_days,
      actual_work_days: record.actual_work_days,
      overtime_hours: record.overtime_hours,
      leave_days: record.leave_days,
      absent_days: record.absent_days,
      late_count: record.late_count,
      early_leave_count: record.early_leave_count,
      notes: record.notes,
    });
    setModalVisible(true);
  };

  const handleDelete = (recordId: number) => {
    Modal.confirm({
      title: t('payroll:confirm_delete_record'),
      content: t('payroll:confirm_delete_record_content'),
      okText: t('common:delete'),
      okType: 'danger',
      cancelText: t('common:cancel'),
      onOk: async () => {
        try {
          await attendanceRecordApi.deleteAttendanceRecord(recordId);
          message.success(t('payroll:delete_success'));
          loadData();
        } catch (error: any) {
          message.error(t('payroll:delete_failed'));
        }
      },
    });
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingRecord) {
        await attendanceRecordApi.updateAttendanceRecord(editingRecord.id, values);
        message.success(t('payroll:update_success'));
      } else {
        await attendanceRecordApi.createAttendanceRecord(values);
        message.success(t('payroll:create_success'));
      }

      setModalVisible(false);
      loadData();
    } catch (error: any) {
      message.error(editingRecord ? t('payroll:update_failed') : t('payroll:create_failed'));
    }
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="attendance-record-manager">
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <div />
        <Space>
          <Button icon={<UploadOutlined />}>
            {t('payroll:batch_import')}
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            {t('payroll:create_attendance_record')}
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={records}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1000 }}
        pagination={{
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => t('common:pagination.total', { total }),
        }}
      />

      <Modal
        title={editingRecord ? t('payroll:edit_attendance_record') : t('payroll:create_attendance_record')}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="employee_id"
            label={t('payroll:employee')}
            rules={[{ required: true, message: t('common:validation.required') }]}
          >
            <InputNumber style={{ width: '100%' }} placeholder={t('payroll:employee_id_placeholder')} />
          </Form.Item>

          <Form.Item
            name="attendance_period_id"
            label={t('payroll:attendance_period')}
            rules={[{ required: true, message: t('common:validation.required') }]}
          >
            <Select placeholder={t('payroll:select_attendance_period')}>
              {periods.map(period => (
                <Option key={period.id} value={period.id}>
                  {period.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="work_days"
            label={t('payroll:work_days')}
            rules={[{ required: true, message: t('common:validation.required') }]}
          >
            <InputNumber min={0} max={31} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="actual_work_days"
            label={t('payroll:actual_work_days')}
            rules={[{ required: true, message: t('common:validation.required') }]}
          >
            <InputNumber min={0} max={31} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="overtime_hours" label={t('payroll:overtime_hours')}>
            <InputNumber min={0} max={200} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="leave_days" label={t('payroll:leave_days')}>
            <InputNumber min={0} max={31} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="absent_days" label={t('payroll:absent_days')}>
            <InputNumber min={0} max={31} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="late_count" label={t('payroll:late_count')}>
            <InputNumber min={0} max={31} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="early_leave_count" label={t('payroll:early_leave_count')}>
            <InputNumber min={0} max={31} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="notes" label={t('payroll:notes')}>
            <TextArea rows={3} placeholder={t('payroll:notes_placeholder')} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AttendanceRecordManager; 