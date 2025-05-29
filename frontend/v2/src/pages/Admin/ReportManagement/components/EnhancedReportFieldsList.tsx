import React, { useState } from 'react';
import {
  Card,
  Space,
  Button,
  Tag,
  Typography,
  Tooltip,
  Switch,
  InputNumber,
  Input,
  Select,
  Modal,
  Form,
  Row,
  Col,
  Popconfirm,
  Alert,
  Badge,
  List
} from 'antd';
import {
  DragOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  SettingOutlined,
  FilterOutlined,
  SortAscendingOutlined,
  CalculatorOutlined,
  DatabaseOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const { Text, Title } = Typography;
const { Option } = Select;

interface ReportField {
  id?: number;
  template_id?: number;
  field_name: string;
  field_alias?: string;
  data_source: string;
  field_type: string;
  display_order: number;
  is_visible: boolean;
  formatting_config?: any;
  calculation_formula?: string;
  width?: number;
  is_sortable: boolean;
  is_filterable: boolean;
  is_required?: boolean;
  group_by?: boolean;
}

interface EnhancedReportFieldsListProps {
  fields: ReportField[];
  onFieldUpdate: (field: ReportField) => void;
  onFieldDelete: (fieldId: number) => void;
  onFieldMove: (dragIndex: number, hoverIndex: number) => void;
  loading?: boolean;
}

// 报表字段项组件
const ReportFieldItem: React.FC<{
  field: ReportField;
  index: number;
  onEdit: (field: ReportField) => void;
  onDelete: (field: ReportField) => void;
  onToggleVisibility: (field: ReportField) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}> = ({ 
  field, 
  index, 
  onEdit, 
  onDelete, 
  onToggleVisibility, 
  onMoveUp, 
  onMoveDown,
  canMoveUp,
  canMoveDown 
}) => {
  const { t } = useTranslation('reportManagement');

  // 获取字段类型图标
  const getFieldTypeIcon = () => {
    if (field.calculation_formula) {
      return <CalculatorOutlined style={{ color: '#52c41a', fontSize: '12px' }} />;
    }
    return <DatabaseOutlined style={{ color: '#1890ff', fontSize: '12px' }} />;
  };

  // 获取字段状态标签（紧凑版）
  const getCompactStatusTags = () => {
    const tags = [];
    if (!field.is_visible) {
      tags.push(<Tag key="hidden" color="orange" style={{ fontSize: '10px', lineHeight: '16px', margin: '0 2px' }}>{t('fieldsList.fieldStatusTags.hidden')}</Tag>);
    }
    if (field.is_required) {
      tags.push(<Tag key="required" color="red" style={{ fontSize: '10px', lineHeight: '16px', margin: '0 2px' }}>{t('fieldsList.fieldStatusTags.required')}</Tag>);
    }
    if (field.is_sortable) {
      tags.push(<Tag key="sortable" color="blue" style={{ fontSize: '10px', lineHeight: '16px', margin: '0 2px' }}>{t('fieldsList.fieldStatusTags.sortable')}</Tag>);
    }
    if (field.is_filterable) {
      tags.push(<Tag key="filterable" color="green" style={{ fontSize: '10px', lineHeight: '16px', margin: '0 2px' }}>{t('fieldsList.fieldStatusTags.filterable')}</Tag>);
    }
    return tags;
  };

  return (
    <div 
      style={{
        padding: '8px 12px',
        margin: '4px 0',
        border: '1px solid #e1e5f2',
        borderRadius: '8px',
        background: field.calculation_formula 
          ? 'linear-gradient(135deg, #f6ffed 0%, #f0f9ff 100%)' 
          : 'linear-gradient(135deg, #fafafa 0%, #f8fafc 100%)',
        fontSize: '12px',
        lineHeight: '1.4',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: '32px',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        width: '100%',
        boxSizing: 'border-box',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = field.calculation_formula ? '#52c41a' : '#1890ff';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
        e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#e1e5f2';
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.06)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* 左侧内容区域 */}
      <div style={{ display: 'flex', alignItems: 'center', flex: 1, gap: '8px' }}>
        {/* 排序按钮（紧凑版） */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
          <Button
            type="text"
            size="small"
            icon={<ArrowUpOutlined />}
            onClick={() => onMoveUp(index)}
            disabled={!canMoveUp}
            style={{ 
              height: '12px', 
              width: '12px', 
              fontSize: '8px',
              padding: 0,
              lineHeight: 1,
              color: canMoveUp ? '#1890ff' : '#d9d9d9'
            }}
          />
          <Button
            type="text"
            size="small"
            icon={<ArrowDownOutlined />}
            onClick={() => onMoveDown(index)}
            disabled={!canMoveDown}
            style={{ 
              height: '12px', 
              width: '12px', 
              fontSize: '8px',
              padding: 0,
              lineHeight: 1,
              color: canMoveDown ? '#1890ff' : '#d9d9d9'
            }}
          />
        </div>
        
        {/* 字段图标 */}
        <div style={{ 
          backgroundColor: field.calculation_formula ? '#f6ffed' : '#f0f9ff',
          borderRadius: '4px',
          padding: '2px'
        }}>
          {getFieldTypeIcon()}
        </div>

        {/* 字段信息（单行紧凑显示） */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Text 
            strong 
            style={{ 
              fontSize: '12px', 
              lineHeight: '1.4',
              maxWidth: '100px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              color: '#2c3e50'
            }}
            title={field.field_alias || field.field_name}
          >
            {field.field_alias || field.field_name}
          </Text>
          
          <Tag 
            color={field.calculation_formula ? 'green' : 'blue'}
            style={{ 
              fontSize: '10px',
              lineHeight: '16px',
              margin: 0,
              padding: '0 4px'
            }}
          >
            {field.field_type}
          </Tag>

          {/* 紧凑状态标签 */}
          {getCompactStatusTags()}
          
          {/* 可见性开关 */}
          <Switch
            size="small"
            checked={field.is_visible}
            onChange={() => onToggleVisibility(field)}
            style={{ transform: 'scale(0.8)' }}
          />
        </div>
      </div>

      {/* 右侧操作按钮 */}
      <Space size={4}>
        <Tooltip title={t('fieldsList.editField')}>
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => onEdit(field)}
            style={{ 
              color: '#1890ff',
              fontSize: '11px',
              width: '20px',
              height: '20px',
              padding: 0
            }}
          />
        </Tooltip>
        
        <Popconfirm
          title={t('fieldsList.confirmDeleteField')}
          onConfirm={() => onDelete(field)}
          okText={t('fieldsList.confirm')}
          cancelText={t('fieldsList.cancel')}
        >
          <Tooltip title={t('fieldsList.deleteField')}>
            <Button
              type="text"
              size="small"
              icon={<DeleteOutlined />}
              style={{ 
                color: '#ff4d4f',
                fontSize: '11px',
                width: '20px',
                height: '20px',
                padding: 0
              }}
            />
          </Tooltip>
        </Popconfirm>
      </Space>
    </div>
  );
};

// 字段编辑模态框
const FieldEditModal: React.FC<{
  visible: boolean;
  field: ReportField | null;
  onCancel: () => void;
  onOk: (field: ReportField) => void;
}> = ({ visible, field, onCancel, onOk }) => {
  const { t } = useTranslation('reportManagement');
  const [form] = Form.useForm();

  React.useEffect(() => {
    if (visible && field) {
      form.setFieldsValue({
        ...field,
        formatting_config: field.formatting_config || {}
      });
    }
  }, [visible, field, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      onOk({ ...field, ...values } as ReportField);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  return (
    <Modal
      title={t('fieldEditModal.title')}
      open={visible}
      onCancel={onCancel}
      onOk={handleOk}
      width={700}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        className="enhanced-form-item"
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label={t('fieldEditModal.fieldAlias')}
              name="field_alias"
              rules={[{ required: true, message: t('fieldEditModal.fieldAliasRequired') }]}
            >
              <Input placeholder={t('fieldEditModal.fieldAliasPlaceholder')} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label={t('fieldEditModal.fieldWidth')}
              name="width"
            >
              <InputNumber
                placeholder={t('fieldEditModal.fieldWidthPlaceholder')}
                min={50}
                max={500}
                style={{ width: '100%' }}
                addonAfter="px"
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item label={t('fieldEditModal.isVisible')} name="is_visible" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label={t('fieldEditModal.isSortable')} name="is_sortable" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label={t('fieldEditModal.isFilterable')} name="is_filterable" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label={t('fieldEditModal.dataFormatting')} name={['formatting_config', 'format_type']}>
              <Select placeholder={t('fieldEditModal.formatTypePlaceholder')}>
                <Option value="number">{t('fieldEditModal.number')}</Option>
                <Option value="currency">{t('fieldEditModal.currency')}</Option>
                <Option value="percentage">{t('fieldEditModal.percentage')}</Option>
                <Option value="date">{t('fieldEditModal.date')}</Option>
                <Option value="text">{t('fieldEditModal.text')}</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label={t('fieldEditModal.decimalPlaces')} name={['formatting_config', 'decimal_places']}>
              <InputNumber min={0} max={10} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>

        {field?.calculation_formula && (
          <Form.Item label={t('fieldEditModal.calculationFormula')} name="calculation_formula">
            <Input.TextArea 
              rows={3} 
              placeholder={t('fieldEditModal.formulaPlaceholder')}
              disabled
            />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
};

// 主组件
const EnhancedReportFieldsList: React.FC<EnhancedReportFieldsListProps> = ({
  fields,
  onFieldUpdate,
  onFieldDelete,
  onFieldMove,
  loading = false
}) => {
  const { t } = useTranslation('reportManagement');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentField, setCurrentField] = useState<ReportField | null>(null);

  const handleEdit = (field: ReportField) => {
    setCurrentField(field);
    setEditModalVisible(true);
  };

  const handleDelete = (field: ReportField) => {
    if (field.id) {
      onFieldDelete(field.id);
    }
  };

  const handleToggleVisibility = (field: ReportField) => {
    onFieldUpdate({ ...field, is_visible: !field.is_visible });
  };

  const handleMoveUp = (index: number) => {
    if (index > 0) {
      onFieldMove(index, index - 1);
    }
  };

  const handleMoveDown = (index: number) => {
    if (index < fields.length - 1) {
      onFieldMove(index, index + 1);
    }
  };

  const handleModalOk = (field: ReportField) => {
    onFieldUpdate(field);
    setEditModalVisible(false);
    setCurrentField(null);
  };

  const handleModalCancel = () => {
    setEditModalVisible(false);
    setCurrentField(null);
  };

  if (fields.length === 0) {
    return (
      <Card className="report-fields-list">
        <Alert
          message={t('fieldsList.noFields')}
          description={t('fieldsList.noFieldsDescription')}
          type="info"
          showIcon
          icon={<ExclamationCircleOutlined />}
          style={{ textAlign: 'center' }}
        />
      </Card>
    );
  }

  return (
    <>
      <Card className="report-fields-list">
        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={5} style={{ margin: 0 }}>
            {t('fieldsList.title')}
            <Badge 
              count={fields.length} 
              style={{ backgroundColor: '#52c41a', marginLeft: '8px' }} 
            />
          </Title>
          <Space>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {t('fieldsList.hint')}
            </Text>
          </Space>
        </div>

        <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
          {fields.map((field, index) => (
            <ReportFieldItem
              key={field.id || `${field.field_name}-${index}`}
              field={field}
              index={index}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleVisibility={handleToggleVisibility}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
              canMoveUp={index > 0}
              canMoveDown={index < fields.length - 1}
            />
          ))}
        </div>

        <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
          <Space>
            <CheckCircleOutlined style={{ color: '#52c41a' }} />
            <Text style={{ fontSize: '12px', color: '#666' }}>
              {t('fieldsList.fieldStatistics', { 
                total: fields.length, 
                visible: fields.filter(f => f.is_visible).length 
              })}
            </Text>
          </Space>
        </div>
      </Card>

      <FieldEditModal
        visible={editModalVisible}
        field={currentField}
        onCancel={handleModalCancel}
        onOk={handleModalOk}
      />
    </>
  );
};

export default EnhancedReportFieldsList; 