import React, { useEffect, useState, useCallback } from 'react';
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  TimePicker,
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
  AttendanceRule,
  CreateAttendanceRuleRequest,
  UpdateAttendanceRuleRequest,
} from '../types/attendanceTypes';
import { attendanceRuleApi } from '../services/attendanceApi';

const AttendanceRuleManager: React.FC = () => {
  const { t } = useTranslation(['payroll', 'common']);
  const [form] = Form.useForm();

  const [rules, setRules] = useState<AttendanceRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRule, setEditingRule] = useState<AttendanceRule | null>(null);

  const columns: ColumnsType<AttendanceRule> = [
    {
      title: t('payroll:rule_name'),
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: t('payroll:work_start_time'),
      dataIndex: 'work_start_time',
      key: 'work_start_time',
      width: 120,
      render: (time: string) => dayjs(time, 'HH:mm:ss').format('HH:mm'),
    },
    {
      title: t('payroll:work_end_time'),
      dataIndex: 'work_end_time',
      key: 'work_end_time',
      width: 120,
      render: (time: string) => dayjs(time, 'HH:mm:ss').format('HH:mm'),
    },
    {
      title: t('payroll:break_duration'),
      dataIndex: 'break_duration_minutes',
      key: 'break_duration_minutes',
      width: 100,
      align: 'center',
      render: (minutes: number) => `${minutes}分钟`,
    },
    {
      title: t('payroll:late_threshold'),
      dataIndex: 'late_threshold_minutes',
      key: 'late_threshold_minutes',
      width: 100,
      align: 'center',
      render: (minutes: number) => `${minutes}分钟`,
    },
    {
      title: t('payroll:overtime_threshold'),
      dataIndex: 'overtime_threshold_minutes',
      key: 'overtime_threshold_minutes',
      width: 120,
      align: 'center',
      render: (minutes: number) => `${minutes}分钟`,
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
      key: 'actions',
      title: t('common:action.title'),
      width: 200,
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
      const response = await attendanceRuleApi.getAttendanceRules({ page: 1, size: 100 });
      setRules(response.data || []);
    } catch (error: any) {
      message.error(t('common:load_failed'));
      console.error('Failed to load attendance rules:', error);
    } finally {
      setLoading(false);
    }
  }, [t]);

  const handleCreate = () => {
    setEditingRule(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (rule: AttendanceRule) => {
    setEditingRule(rule);
    form.setFieldsValue({
      name: rule.name,
      work_start_time: dayjs(rule.work_start_time, 'HH:mm:ss'),
      work_end_time: dayjs(rule.work_end_time, 'HH:mm:ss'),
      break_duration_minutes: rule.break_duration_minutes,
      late_threshold_minutes: rule.late_threshold_minutes,
      early_leave_threshold_minutes: rule.early_leave_threshold_minutes,
      overtime_threshold_minutes: rule.overtime_threshold_minutes,
      is_active: rule.is_active,
    });
    setModalVisible(true);
  };

  const handleDelete = (ruleId: number) => {
    Modal.confirm({
      title: t('payroll:confirm_delete_rule'),
      content: t('payroll:confirm_delete_rule_content'),
      okText: t('common:delete'),
      okType: 'danger',
      cancelText: t('common:cancel'),
      onOk: async () => {
        try {
          await attendanceRuleApi.deleteAttendanceRule(ruleId);
          message.success(t('payroll:delete_success'));
          loadData();
        } catch (error: any) {
          message.error(t('payroll:delete_failed'));
        }
      },
    });
  };

  const handleToggleStatus = async (ruleId: number, isActive: boolean) => {
    try {
      await attendanceRuleApi.toggleAttendanceRule(ruleId, isActive);
      message.success(t('payroll:status_updated'));
      loadData();
    } catch (error: any) {
      message.error(t('payroll:status_update_failed'));
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const data = {
        ...values,
        work_start_time: values.work_start_time.format('HH:mm:ss'),
        work_end_time: values.work_end_time.format('HH:mm:ss'),
      };
      
      if (editingRule) {
        await attendanceRuleApi.updateAttendanceRule(editingRule.id, data);
        message.success(t('payroll:update_success'));
      } else {
        await attendanceRuleApi.createAttendanceRule(data);
        message.success(t('payroll:create_success'));
      }

      setModalVisible(false);
      loadData();
    } catch (error: any) {
      message.error(editingRule ? t('payroll:update_failed') : t('payroll:create_failed'));
    }
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="attendance-rule-manager">
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <div />
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          {t('payroll:create_attendance_rule')}
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={rules}
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
        title={editingRule ? t('payroll:edit_attendance_rule') : t('payroll:create_attendance_rule')}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label={t('payroll:rule_name')}
            rules={[{ required: true, message: t('common:validation.required') }]}
          >
            <Input placeholder={t('payroll:rule_name_placeholder')} />
          </Form.Item>

          <Form.Item
            name="work_start_time"
            label={t('payroll:work_start_time')}
            rules={[{ required: true, message: t('common:validation.required') }]}
          >
            <TimePicker style={{ width: '100%' }} format="HH:mm" />
          </Form.Item>

          <Form.Item
            name="work_end_time"
            label={t('payroll:work_end_time')}
            rules={[{ required: true, message: t('common:validation.required') }]}
          >
            <TimePicker style={{ width: '100%' }} format="HH:mm" />
          </Form.Item>

          <Form.Item name="break_duration_minutes" label={t('payroll:break_duration')}>
            <InputNumber min={0} max={240} style={{ width: '100%' }} addonAfter="分钟" />
          </Form.Item>

          <Form.Item name="late_threshold_minutes" label={t('payroll:late_threshold')}>
            <InputNumber min={0} max={60} style={{ width: '100%' }} addonAfter="分钟" />
          </Form.Item>

          <Form.Item name="early_leave_threshold_minutes" label={t('payroll:early_leave_threshold')}>
            <InputNumber min={0} max={60} style={{ width: '100%' }} addonAfter="分钟" />
          </Form.Item>

          <Form.Item name="overtime_threshold_minutes" label={t('payroll:overtime_threshold')}>
            <InputNumber min={0} max={240} style={{ width: '100%' }} addonAfter="分钟" />
          </Form.Item>

          <Form.Item name="is_active" label={t('payroll:is_active')} valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AttendanceRuleManager; 