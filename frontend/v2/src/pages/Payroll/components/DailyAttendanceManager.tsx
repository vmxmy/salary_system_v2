import React, { useEffect, useState, useCallback } from 'react';
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  DatePicker,
  TimePicker,
  Switch,
  message,
  Tag,
  Select,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';

import TableActionButton from '../../../components/common/TableActionButton';
import type {
  DailyAttendanceRecord,
  CreateDailyAttendanceRecordRequest,
  UpdateDailyAttendanceRecordRequest,
} from '../types/attendanceTypes';
import { dailyAttendanceApi } from '../services/attendanceApi';

const { Option } = Select;
const { TextArea } = Input;

const DailyAttendanceManager: React.FC = () => {
  const { t } = useTranslation(['payroll', 'common']);
  const [form] = Form.useForm();

  const [records, setRecords] = useState<DailyAttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DailyAttendanceRecord | null>(null);

  const columns: ColumnsType<DailyAttendanceRecord> = [
    {
      title: t('payroll:employee_name'),
      dataIndex: 'employee_name',
      key: 'employee_name',
      width: 120,
    },
    {
      title: t('payroll:attendance_date'),
      dataIndex: 'attendance_date',
      key: 'attendance_date',
      width: 120,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: t('payroll:check_in_time'),
      dataIndex: 'check_in_time',
      key: 'check_in_time',
      width: 100,
      render: (time: string) => time ? dayjs(time, 'HH:mm:ss').format('HH:mm') : '-',
    },
    {
      title: t('payroll:check_out_time'),
      dataIndex: 'check_out_time',
      key: 'check_out_time',
      width: 100,
      render: (time: string) => time ? dayjs(time, 'HH:mm:ss').format('HH:mm') : '-',
    },
    {
      title: t('payroll:work_hours'),
      dataIndex: 'work_hours',
      key: 'work_hours',
      width: 80,
      align: 'center',
      render: (hours: number) => `${hours}h`,
    },
    {
      title: t('payroll:overtime_hours'),
      dataIndex: 'overtime_hours',
      key: 'overtime_hours',
      width: 100,
      align: 'center',
      render: (hours: number) => hours > 0 ? <Tag color="blue">{hours}h</Tag> : '-',
    },
    {
      title: t('payroll:status'),
      key: 'status',
      width: 120,
      render: (_, record, index) => (
        <Space size={4}>
          {record.is_late && <Tag color="orange">{t('payroll:late')}</Tag>}
          {record.is_early_leave && <Tag color="red">{t('payroll:early_leave')}</Tag>}
          {record.is_absent && <Tag color="red">{t('payroll:absent')}</Tag>}
          {!record.is_late && !record.is_early_leave && !record.is_absent && (
            <Tag color="green">{t('payroll:normal')}</Tag>
          )}
        </Space>
      ),
    },
    {
      title: t('common:actions'),
      key: 'actions',
      width: 150,
      fixed: 'right',
      render: (_, record, index) => (
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
      const response = await dailyAttendanceApi.getDailyAttendanceRecords({ page: 1, size: 100 });
      setRecords(response.data || []);
    } catch (error: any) {
      message.error(t('common:load_failed'));
      console.error('Failed to load daily attendance records:', error);
    } finally {
      setLoading(false);
    }
  }, [t]);

  const handleCreate = () => {
    setEditingRecord(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: DailyAttendanceRecord) => {
    setEditingRecord(record);
    form.setFieldsValue({
      employee_id: record.employee_id,
      attendance_date: dayjs(record.attendance_date),
      check_in_time: record.check_in_time ? dayjs(record.check_in_time, 'HH:mm:ss') : null,
      check_out_time: record.check_out_time ? dayjs(record.check_out_time, 'HH:mm:ss') : null,
      work_hours: record.work_hours,
      overtime_hours: record.overtime_hours,
      is_late: record.is_late,
      is_early_leave: record.is_early_leave,
      is_absent: record.is_absent,
      leave_type: record.leave_type,
      notes: record.notes,
    });
    setModalVisible(true);
  };

  const handleDelete = (recordId: number) => {
    Modal.confirm({
      title: t('payroll:confirm_delete_daily_record'),
      content: t('payroll:confirm_delete_daily_record_content'),
      okText: t('common:delete'),
      okType: 'danger',
      cancelText: t('common:cancel'),
      onOk: async () => {
        try {
          await dailyAttendanceApi.deleteDailyAttendanceRecord(recordId);
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
      const data = {
        ...values,
        attendance_date: values.attendance_date.format('YYYY-MM-DD'),
        check_in_time: values.check_in_time?.format('HH:mm:ss'),
        check_out_time: values.check_out_time?.format('HH:mm:ss'),
      };
      
      if (editingRecord) {
        await dailyAttendanceApi.updateDailyAttendanceRecord(editingRecord.id, data);
        message.success(t('payroll:update_success'));
      } else {
        await dailyAttendanceApi.createDailyAttendanceRecord(data);
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
    <div className="daily-attendance-manager">
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <div />
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          {t('payroll:create_daily_record')}
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={records}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1200 }}
        pagination={{
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => t('common:pagination.total', { total }),
        }}
      />

      <Modal
        title={editingRecord ? t('payroll:edit_daily_record') : t('payroll:create_daily_record')}
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
            name="attendance_date"
            label={t('payroll:attendance_date')}
            rules={[{ required: true, message: t('common:validation.required') }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="check_in_time" label={t('payroll:check_in_time')}>
            <TimePicker style={{ width: '100%' }} format="HH:mm" />
          </Form.Item>

          <Form.Item name="check_out_time" label={t('payroll:check_out_time')}>
            <TimePicker style={{ width: '100%' }} format="HH:mm" />
          </Form.Item>

          <Form.Item
            name="work_hours"
            label={t('payroll:work_hours')}
            rules={[{ required: true, message: t('common:validation.required') }]}
          >
            <InputNumber min={0} max={24} step={0.5} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="overtime_hours" label={t('payroll:overtime_hours')}>
            <InputNumber min={0} max={12} step={0.5} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="is_late" label={t('payroll:is_late')} valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item name="is_early_leave" label={t('payroll:is_early_leave')} valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item name="is_absent" label={t('payroll:is_absent')} valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item name="leave_type" label={t('payroll:leave_type')}>
            <Select placeholder={t('payroll:select_leave_type')} allowClear>
              <Option value="sick">{t('payroll:sick_leave')}</Option>
              <Option value="annual">{t('payroll:annual_leave')}</Option>
              <Option value="personal">{t('payroll:personal_leave')}</Option>
              <Option value="maternity">{t('payroll:maternity_leave')}</Option>
            </Select>
          </Form.Item>

          <Form.Item name="notes" label={t('payroll:notes')}>
            <TextArea rows={3} placeholder={t('payroll:notes_placeholder')} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DailyAttendanceManager; 