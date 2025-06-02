import React, { useEffect, useState, useCallback } from 'react';
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  DatePicker,
  Switch,
  message,
  Tag,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';

import TableActionButton from '../../../components/common/TableActionButton';
import type {
  AttendancePeriod,
  CreateAttendancePeriodRequest,
  UpdateAttendancePeriodRequest,
} from '../types/attendanceTypes';
import { attendancePeriodApi } from '../services/attendanceApi';

const { RangePicker } = DatePicker;

const AttendancePeriodManager: React.FC = () => {
  const { t } = useTranslation(['payroll', 'common']);
  const [form] = Form.useForm();

  const [periods, setPeriods] = useState<AttendancePeriod[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<AttendancePeriod | null>(null);

  const columns: ColumnsType<AttendancePeriod> = [
    {
      title: t('payroll:id'),
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: t('payroll:period_name'),
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: t('payroll:start_date'),
      dataIndex: 'start_date',
      key: 'start_date',
      width: 120,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: t('payroll:end_date'),
      dataIndex: 'end_date',
      key: 'end_date',
      width: 120,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: t('payroll:status'),
      dataIndex: 'is_active',
      key: 'is_active',
      width: 100,
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'default'}>
          {isActive ? t('payroll:active') : t('payroll:inactive')}
        </Tag>
      ),
    },
    {
      title: t('common:actions'),
      key: 'actions',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
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
          <Tooltip title={record.is_active ? t('payroll:deactivate') : t('payroll:activate')}>
            <Button
              type="link"
              size="small"
              icon={record.is_active ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
              onClick={() => handleToggleStatus(record.id, !record.is_active)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await attendancePeriodApi.getAttendancePeriods({ page: 1, size: 100 });
      setPeriods(response.data || []);
    } catch (error: any) {
      message.error(t('common:load_failed'));
      console.error('Failed to load attendance periods:', error);
    } finally {
      setLoading(false);
    }
  }, [t]);

  const handleCreate = () => {
    setEditingPeriod(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (period: AttendancePeriod) => {
    setEditingPeriod(period);
    form.setFieldsValue({
      name: period.name,
      dateRange: [dayjs(period.start_date), dayjs(period.end_date)],
      is_active: period.is_active,
    });
    setModalVisible(true);
  };

  const handleDelete = (periodId: number) => {
    Modal.confirm({
      title: t('payroll:confirm_delete_period'),
      content: t('payroll:confirm_delete_period_content'),
      okText: t('common:delete'),
      okType: 'danger',
      cancelText: t('common:cancel'),
      onOk: async () => {
        try {
          await attendancePeriodApi.deleteAttendancePeriod(periodId);
          message.success(t('payroll:delete_success'));
          loadData();
        } catch (error: any) {
          message.error(t('payroll:delete_failed'));
        }
      },
    });
  };

  const handleToggleStatus = async (periodId: number, isActive: boolean) => {
    try {
      await attendancePeriodApi.toggleAttendancePeriod(periodId, isActive);
      message.success(t('payroll:status_updated'));
      loadData();
    } catch (error: any) {
      message.error(t('payroll:status_update_failed'));
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const [startDate, endDate] = values.dateRange;
      
      const data = {
        name: values.name,
        start_date: startDate.format('YYYY-MM-DD'),
        end_date: endDate.format('YYYY-MM-DD'),
        is_active: values.is_active ?? true,
      };

      if (editingPeriod) {
        await attendancePeriodApi.updateAttendancePeriod(editingPeriod.id, data);
        message.success(t('payroll:update_success'));
      } else {
        await attendancePeriodApi.createAttendancePeriod(data);
        message.success(t('payroll:create_success'));
      }

      setModalVisible(false);
      loadData();
    } catch (error: any) {
      message.error(editingPeriod ? t('payroll:update_failed') : t('payroll:create_failed'));
    }
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="attendance-period-manager">
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <div />
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          {t('payroll:create_attendance_period')}
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={periods}
        rowKey="id"
        loading={loading}
        pagination={{
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => t('common:pagination.total', { total }),
        }}
      />

      <Modal
        title={editingPeriod ? t('payroll:edit_attendance_period') : t('payroll:create_attendance_period')}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label={t('payroll:period_name')}
            rules={[{ required: true, message: t('common:validation.required') }]}
          >
            <Input placeholder={t('payroll:period_name_placeholder')} />
          </Form.Item>

          <Form.Item
            name="dateRange"
            label={t('payroll:date_range')}
            rules={[{ required: true, message: t('common:validation.required') }]}
          >
            <RangePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="is_active" label={t('payroll:is_active')} valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AttendancePeriodManager; 