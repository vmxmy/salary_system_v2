import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { Space, Table, Button, Modal, Form, Input, Select, Switch, message, Popconfirm, Card, Typography, Row, Col, Divider, Tag, InputNumber } from 'antd';
import type { InputRef } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, FilterFilled, DownloadOutlined, SettingOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useTableExport, useColumnControl } from '../../../components/common/TableUtils';
import * as payrollApi from '../services/payrollApi';
import * as configApi from '../../../api/config';
import type { LookupValue } from '../../../api/types';
import type { PayrollComponentDefinition } from '../types/payrollTypes';
import type { ColumnType } from 'antd/es/table';

const { Title } = Typography;
const { Option } = Select;

// 内联PageHeader组件定义
interface PageHeaderProps {
  /**
   * 页面标题
   */
  title: string;
  /**
   * 子标题或描述文本
   */
  subtitle?: string;
  /**
   * 额外操作按钮区域
   */
  extra?: React.ReactNode;
}

/**
 * 通用页面头部组件，包含标题和操作按钮区域
 */
const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, extra }) => {
  return (
    <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
      <Col>
        <Space direction="vertical" size={4}>
          <Title level={4} style={{ margin: 0 }}>{title}</Title>
          {subtitle && <Typography.Text type="secondary">{subtitle}</Typography.Text>}
        </Space>
      </Col>
      {extra && (
        <Col>
          {extra}
        </Col>
      )}
    </Row>
  );
};

/**
 * 薪资字段管理页面组件
 */
const PayrollComponentsPage: React.FC = () => {
  const { t } = useTranslation(['payroll_components', 'common']);
  const [loading, setLoading] = useState(false);
  const [components, setComponents] = useState<PayrollComponentDefinition[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingComponent, setEditingComponent] = useState<PayrollComponentDefinition | null>(null);
  const [form] = Form.useForm();
  const [componentTypes, setComponentTypes] = useState<string[]>([]);
  const [typeInfo, setTypeInfo] = useState<Record<string, { text: string, color: string }>>({});

  // 获取类型对应的中文名称和颜色
  const getTypeInfo = (type: string): { text: string; color: string } => {
    // 如果已经从lookup中获取到了类型信息，则使用lookup中的值
    if (typeInfo[type]) {
      return typeInfo[type];
    }
    
    // 默认值
    let text = type;
    let color = 'default';
    
    // 根据类型返回对应的中文名称和颜色
    switch(type.toUpperCase()) {
      case 'EARNING':
        text = '收入项';
        color = 'green';
        break;
      case 'STAT':
      case 'STATUTORY':
        text = '统计项';
        color = 'blue';
        break;
      case 'DEDUCTION':
        text = '扣除项';
        color = 'red';
        break;
      case 'EMPLOYER_DEDUCTION':
        text = '单位扣除项';
        color = 'orange';
        break;
      case 'PERSONAL_DEDUCTION':
        text = '个人扣除项';
        color = 'purple';
        break;
      case 'BENEFIT':
        text = '福利项';
        color = 'cyan';
        break;
      case 'OTHER':
        text = '其他';
        color = 'gray';
        break;
      default:
        // 兼容旧数据
        if (type === 'Earning') {
          text = '收入项';
          color = 'green';
        } else if (type === 'Deduction') {
          text = '扣除项';
          color = 'red';
        }
    }
    
    return { text, color };
  };

  // 加载薪资字段数据
  const fetchComponents = async () => {
    setLoading(true);
    try {
      const response = await payrollApi.getPayrollComponentDefinitions({ size: 100 });
      setComponents(response.data);
      
      // 提取所有唯一的类型值
      const uniqueTypes = Array.from(new Set(response.data.map(comp => comp.type)));
      setComponentTypes(uniqueTypes);
    } catch (error) {
      console.error('Error fetching payroll components:', error);
      message.error(t('common.error.fetch'));
    } finally {
      setLoading(false);
    }
  };

  // 获取薪资组件类型
  const fetchComponentTypes = async () => {
    try {
      const response = await configApi.getPayrollComponentTypes();
      const typesMap: Record<string, { text: string, color: string }> = {};
      
      response.data.forEach((type: any) => {
        typesMap[type.value_code || type.code] = {
          text: type.value_name || type.name,
          color: getTypeInfo(type.value_code || type.code).color // 继续使用现有的颜色映射
        };
      });
      
      setTypeInfo(typesMap);
    } catch (error) {
      console.error('Error fetching component types:', error);
    }
  };

  useEffect(() => {
    fetchComponents();
    fetchComponentTypes();
  }, []);

  // 搜索输入框引用
  const searchInput = useRef<InputRef>(null);

  // 获取列搜索属性
  const getColumnSearchProps = (dataIndex: keyof PayrollComponentDefinition) => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: any) => (
      <div style={{ padding: 8 }}>
        <Input
          ref={searchInput}
          placeholder={t('common.search')}
          value={selectedKeys[0]}
          onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => confirm()}
          style={{ marginBottom: 8, display: 'block' }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => confirm()}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            {t('common.search')}
          </Button>
          <Button
            onClick={() => clearFilters && clearFilters()}
            size="small"
            style={{ width: 90 }}
          >
            {t('common.reset')}
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered: boolean) => (
      <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
    ),
    onFilter: (value: any, record: PayrollComponentDefinition) => {
      const recordValue = record[dataIndex];
      return recordValue
        ? String(recordValue).toLowerCase().includes(String(value).toLowerCase())
        : false;
    },
    onFilterDropdownOpenChange: (visible: boolean) => {
      if (visible) {
        setTimeout(() => searchInput.current?.select(), 100);
      }
    },
  });

  // 表格列定义
  const initialColumns: ColumnType<PayrollComponentDefinition>[] = [
    {
      title: t('payroll_components.code'),
      dataIndex: 'code',
      key: 'code',
      sorter: (a: PayrollComponentDefinition, b: PayrollComponentDefinition) =>
        a.code.localeCompare(b.code),
      ...getColumnSearchProps('code'),
    },
    {
      title: t('payroll_components.name'),
      dataIndex: 'name',
      key: 'name',
      sorter: (a: PayrollComponentDefinition, b: PayrollComponentDefinition) =>
        a.name.localeCompare(b.name),
      ...getColumnSearchProps('name'),
    },
    {
      title: t('payroll_components.type'),
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const { text, color } = getTypeInfo(type);
        return <Tag color={color}>{text}</Tag>;
      },
      sorter: (a: PayrollComponentDefinition, b: PayrollComponentDefinition) =>
        a.type.localeCompare(b.type),
      filters: componentTypes.map(type => {
        const { text } = getTypeInfo(type);
        return { text, value: type };
      }),
      onFilter: (value: any, record: PayrollComponentDefinition) => record.type === String(value),
    },
    {
      title: t('payroll_components.is_taxable'),
      dataIndex: 'is_taxable',
      key: 'is_taxable',
      render: (isTaxable: boolean) => (
        isTaxable ? t('common.yes') : t('common.no')
      ),
      sorter: (a: PayrollComponentDefinition, b: PayrollComponentDefinition) =>
        Number(a.is_taxable) - Number(b.is_taxable),
      filters: [
        { text: t('common.yes'), value: true },
        { text: t('common.no'), value: false },
      ],
      onFilter: (value: any, record: PayrollComponentDefinition) => record.is_taxable === value,
    },
    {
      title: t('payroll_components.sort_order'),
      dataIndex: 'sort_order',
      key: 'sort_order',
      sorter: (a: PayrollComponentDefinition, b: PayrollComponentDefinition) =>
        (a.sort_order || 0) - (b.sort_order || 0),
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: any) => (
        <div style={{ padding: 8 }}>
          <Space direction="vertical">
            <InputNumber
              placeholder={t('common.min')}
              value={selectedKeys[0]}
              onChange={val => setSelectedKeys(val ? [val] : [])}
              style={{ width: 120, marginRight: 8 }}
            />
            <InputNumber
              placeholder={t('common.max')}
              value={selectedKeys[1]}
              onChange={val => setSelectedKeys(selectedKeys[0] !== undefined ? [selectedKeys[0], val] : [])}
              style={{ width: 120, marginRight: 8 }}
            />
            <Space>
              <Button
                type="primary"
                onClick={() => confirm()}
                icon={<FilterFilled />}
                size="small"
                style={{ width: 90 }}
              >
                {t('common.filter')}
              </Button>
              <Button
                onClick={() => clearFilters && clearFilters()}
                size="small"
                style={{ width: 90 }}
              >
                {t('common.reset')}
              </Button>
            </Space>
          </Space>
        </div>
      ),
      filterIcon: (filtered: boolean) => (
        <FilterFilled style={{ color: filtered ? '#1890ff' : undefined }} />
      ),
      onFilter: (value: any, record: PayrollComponentDefinition) => {
        const selectedKeys = value as number[];
        const min = selectedKeys[0];
        const max = selectedKeys[1];
        const sortOrder = record.sort_order || 0;
        
        if (min !== undefined && max !== undefined) {
          return sortOrder >= min && sortOrder <= max;
        }
        if (min !== undefined) {
          return sortOrder >= min;
        }
        if (max !== undefined) {
          return sortOrder <= max;
        }
        return true;
      },
    },
    {
      title: t('common.status'),
      dataIndex: 'is_enabled',
      key: 'is_enabled',
      render: (isEnabled: boolean) => (
        <Tag color={isEnabled ? 'green' : 'red'}>
          {isEnabled ? t('common.active') : t('common.inactive')}
        </Tag>
      ),
      sorter: (a: PayrollComponentDefinition, b: PayrollComponentDefinition) =>
        Number(a.is_enabled) - Number(b.is_enabled),
      filters: [
        { text: t('common.active'), value: true },
        { text: t('common.inactive'), value: false },
      ],
      onFilter: (value: any, record: PayrollComponentDefinition) => record.is_enabled === value,
    },
    {
      title: t('common.actions'),
      key: 'actions',
      render: (_: any, record: PayrollComponentDefinition) => (
        <Space size="small">
          <Button 
            type="text" 
            icon={<EditOutlined />} 
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title={t('common.confirmDelete')}
            onConfirm={() => handleDelete(record.id)}
            okText={t('common.yes')}
            cancelText={t('common.no')}
          >
            <Button 
              type="text" 
              danger 
              icon={<DeleteOutlined />} 
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const { ExportButton } = useTableExport(
    components,
    initialColumns,
    {
      filename: t('payroll_components.export.filename', { ns: 'payroll_components' }),
      sheetName: t('payroll_components.export.sheet_name', { ns: 'payroll_components' }),
      buttonText: t('common:action.export'),
    }
  );

  const { ColumnControl, visibleColumns: controlledColumns } = useColumnControl(
    initialColumns,
    {
      storageKeyPrefix: 'payrollComponentsTable',
      buttonText: t('common:action.columns'),
      tooltipTitle: t('common:tooltip.column_settings')
    }
  );

  // 打开编辑模态框
  const handleEdit = (component: PayrollComponentDefinition) => {
    setEditingComponent(component);
    form.setFieldsValue({
      ...component,
      type: component.type,
      is_enabled: component.is_enabled,
      is_taxable: component.is_taxable,
      is_social_security_base: component.is_social_security_base,
      is_housing_fund_base: component.is_housing_fund_base,
      sort_order: component.sort_order || 0,
    });
    setModalVisible(true);
  };

  // 打开添加模态框
  const handleAdd = () => {
    setEditingComponent(null);
    form.resetFields();
    form.setFieldsValue({
      type: componentTypes.length > 0 ? componentTypes[0] : 'EARNING',
      is_enabled: true,
      is_taxable: true,
      is_social_security_base: false,
      is_housing_fund_base: false,
      sort_order: 0,
    });
    setModalVisible(true);
  };

  // 处理模态框确认
  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingComponent) {
        // 更新
        await payrollApi.updatePayrollComponentDefinition(editingComponent.id, values);
        message.success(t('payroll_components.update_success'));
      } else {
        // 创建
        await payrollApi.createPayrollComponentDefinition(values);
        message.success(t('payroll_components.create_success'));
      }
      
      setModalVisible(false);
      fetchComponents();
    } catch (error) {
      console.error('Form validation failed or API error:', error);
    }
  };

  // 处理删除
  const handleDelete = async (id: number) => {
    try {
      await payrollApi.deletePayrollComponentDefinition(id);
      message.success(t('payroll_components.delete_success'));
      fetchComponents();
    } catch (error) {
      console.error('Error deleting component:', error);
      message.error(t('common.error.delete'));
    }
  };

  return (
    <div>
      <PageHeader
        title={t('payroll_components.title')}
        extra={
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAdd}
            >
              {t('payroll_components.add')}
            </Button>
            {ExportButton && <ExportButton />}
            {ColumnControl && <ColumnControl />}
          </Space>
        }
      />
      
      <Card>
        <Table
          dataSource={components}
          columns={controlledColumns}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => t('common.total_items', { count: total })
          }}
        />
      </Card>

      {/* 编辑/添加模态框 */}
      <Modal
        title={editingComponent ? t('payroll_components.edit') : t('payroll_components.add')}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={() => setModalVisible(false)}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="code"
                label={t('payroll_components.code')}
                rules={[{ required: true, message: t('common.validation.required') }]}
              >
                <Input disabled={!!editingComponent} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="name"
                label={t('payroll_components.name')}
                rules={[{ required: true, message: t('common.validation.required') }]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="type"
                label={t('payroll_components.type')}
                rules={[{ required: true, message: t('common.validation.required') }]}
              >
                <Select>
                  {componentTypes.length > 0 ? (
                    componentTypes.map(type => {
                      const { text } = getTypeInfo(type);
                      return <Option key={type} value={type}>{text}</Option>;
                    })
                  ) : (
                    <>
                      <Option value="EARNING">收入项</Option>
                      <Option value="DEDUCTION">扣除项</Option>
                    </>
                  )}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="sort_order"
                label={t('payroll_components.sort_order')}
                rules={[{ required: true, message: t('common.validation.required') }]}
              >
                <Input type="number" min={0} />
              </Form.Item>
            </Col>
          </Row>

          <Divider>{t('payroll_components.options')}</Divider>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="is_enabled"
                label={t('common.status')}
                valuePropName="checked"
              >
                <Switch checkedChildren={t('common.active')} unCheckedChildren={t('common.inactive')} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="is_taxable"
                label={t('payroll_components.is_taxable')}
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="is_social_security_base"
                label={t('payroll_components.is_social_security_base')}
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="is_housing_fund_base"
                label={t('payroll_components.is_housing_fund_base')}
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col span={16}>
              <Form.Item
                name="description"
                label={t('common.description')}
              >
                <Input.TextArea rows={2} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default PayrollComponentsPage; 