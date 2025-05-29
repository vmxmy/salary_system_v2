import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Form,
  Input,
  Select,
  Table,
  Modal,
  message,
  Tabs,
  Space,
  Divider,
  Tag,
  Tooltip,
  Switch,
  InputNumber,
  TreeSelect,
  Drawer,
  List,
  Typography,
  Alert
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  SaveOutlined,
  EyeOutlined,
  SettingOutlined,
  DragOutlined,
  CopyOutlined,
  DownloadOutlined,
  TableOutlined,
  CalculatorOutlined,
  DatabaseOutlined
} from '@ant-design/icons';
// @ts-ignore
import { DndProvider, useDrag, useDrop } from 'react-dnd';
// @ts-ignore  
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useTranslation } from 'react-i18next';
import './ReportDesigner.css';
import EnhancedReportFieldsList from './components/EnhancedReportFieldsList';


type DragSourceMonitor = any;
type DropTargetMonitor = any;
import type { ColumnsType } from 'antd/es/table';

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;

// 数据类型定义
interface ReportTemplate {
  id?: number;
  name: string;
  title?: string;
  description?: string;
  category?: string;
  template_config: any;
  is_active: boolean;
  is_public: boolean;
  sort_order: number;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
}

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
}

interface DataSource {
  id: number;
  name: string;
  table_name: string;
  schema_name: string;
  description?: string;
  is_active: boolean;
  fields?: DataSourceField[];
}

interface DataSourceField {
  field_name: string;
  field_type: string;
  is_nullable: boolean;
  comment?: string;
  display_name_zh?: string;
  display_name_en?: string;
}

interface CalculatedField {
  id?: number;
  name: string;
  alias: string;
  formula: string;
  return_type: string;
  description?: string;
  is_global: boolean;
  is_active: boolean;
  category?: string;
  display_name_zh?: string;
  display_name_en?: string;
}

// 拖拽项目类型
const ItemTypes = {
  FIELD: 'field',
  REPORT_FIELD: 'report_field'
};

// 可拖拽的字段组件
const DraggableField: React.FC<{
  field: DataSourceField | CalculatedField;
  type: 'data' | 'calculated';
}> = ({ field, type }) => {
  const { i18n, t } = useTranslation('reportManagement');
  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.FIELD,
    item: { field, type },
    collect: (monitor: DragSourceMonitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  // 获取字段显示名称
  const getFieldDisplayName = () => {
    if (type === 'calculated') {
      const calcField = field as CalculatedField;
      if (i18n.language === 'zh-CN') {
        return calcField.display_name_zh || calcField.name || calcField.alias;
      } else {
        return calcField.display_name_en || calcField.name || calcField.alias;
      }
    } else {
      const dataField = field as DataSourceField;
      if (i18n.language === 'zh-CN') {
        return dataField.display_name_zh || dataField.comment || dataField.field_name;
      } else {
        return dataField.display_name_en || dataField.field_name;
      }
    }
  };

  return (
    <div
      ref={drag}
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: 'move',
        padding: '8px 12px',
        margin: '4px 0',
        border: '1px solid #e1e5f2',
        borderRadius: '8px',
        background: type === 'calculated' 
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
      className={`draggable-field ${type}-field`}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = type === 'calculated' ? '#52c41a' : '#1890ff';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
        e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#e1e5f2';
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.06)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <Space size={6}>
        <DragOutlined style={{ 
          fontSize: '11px', 
          color: '#8c8c8c',
          transition: 'color 0.2s ease'
        }} />
        {type === 'calculated' ? (
          <CalculatorOutlined style={{ 
            color: '#52c41a', 
            fontSize: '12px',
            padding: '2px',
            backgroundColor: '#f6ffed',
            borderRadius: '4px'
          }} />
        ) : (
          <DatabaseOutlined style={{ 
            color: '#1890ff', 
            fontSize: '12px',
            padding: '2px',
            backgroundColor: '#f0f9ff',
            borderRadius: '4px'
          }} />
        )}
        <Text 
          strong 
          style={{ 
            fontSize: '12px', 
            lineHeight: '1.4',
            maxWidth: '140px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            color: '#2c3e50'
          }}
          title={getFieldDisplayName()}
        >
          {getFieldDisplayName()}
        </Text>
      </Space>
      <Tooltip title={type === 'calculated' ? t('fieldTypes.calculated') : t('fieldTypes.data')}>
        <Tag 
          color={type === 'calculated' ? 'green' : 'blue'}
          style={{ 
            fontSize: '10px',
            lineHeight: '16px',
            border: 'none',
            borderRadius: '4px'
          }}
        >
          {type === 'calculated' ? t('fieldTypes.calculatedShort') : t('fieldTypes.dataShort')}
        </Tag>
      </Tooltip>
    </div>
  );
};

// 报表字段列表组件
const ReportFieldsList: React.FC<{
  fields: ReportField[];
  onFieldUpdate: (field: ReportField) => void;
  onFieldDelete: (fieldId: number) => void;
}> = ({ fields, onFieldUpdate, onFieldDelete }) => {
  const { t } = useTranslation('reportManagement');
  
  const handleFieldMove = (dragIndex: number, hoverIndex: number) => {
    // 实现字段重新排序逻辑
    const dragField = fields[dragIndex];
    const newFields = [...fields];
    newFields.splice(dragIndex, 1);
    newFields.splice(hoverIndex, 0, dragField);
    
    // 更新显示顺序
    newFields.forEach((field, index) => {
      onFieldUpdate({ ...field, display_order: index });
    });
  };

  const [{ isOver }, drop] = useDrop({
    accept: ItemTypes.FIELD,
    drop: (item: any) => {
      // 处理新字段添加
      const newField: ReportField = {
        field_name: item.field.field_name || item.field.alias,
        field_alias: item.field.field_name || item.field.alias,
        data_source: item.type === 'calculated' ? 'calculated' : 'data_source',
        field_type: item.field.field_type || item.field.return_type,
        display_order: fields.length,
        is_visible: true,
        is_sortable: true,
        is_filterable: true,
        calculation_formula: item.type === 'calculated' ? item.field.formula : undefined
      };
      onFieldUpdate(newField);
    },
    collect: (monitor: DropTargetMonitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  return (
    <div ref={drop} style={{ minHeight: '200px', border: isOver ? '2px dashed #1890ff' : '1px solid #d9d9d9', borderRadius: '4px', padding: '16px' }}>
      {isOver && (
        <Alert
          message={t('dragFieldsHint')}
          type="info"
          style={{ marginBottom: '16px' }}
        />
      )}
      <EnhancedReportFieldsList
        fields={fields}
        onFieldUpdate={onFieldUpdate}
        onFieldDelete={onFieldDelete}
        onFieldMove={handleFieldMove}
      />
    </div>
  );
};

// 主报表设计器组件
const ReportDesigner: React.FC = () => {
  const { t } = useTranslation('reportManagement');
  const [form] = Form.useForm();
  const [reportTemplate, setReportTemplate] = useState<ReportTemplate>({
    name: '',
    title: '',
    description: '',
    category: '',
    template_config: {},
    is_active: true,
    is_public: false,
    sort_order: 0
  });
  const [reportFields, setReportFields] = useState<ReportField[]>([]);
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [calculatedFields, setCalculatedFields] = useState<CalculatedField[]>([]);
  const [selectedDataSource, setSelectedDataSource] = useState<DataSource | null>(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  // 加载数据源
  useEffect(() => {
    loadDataSources();
    loadCalculatedFields();
  }, []);

  const loadDataSources = async () => {
    try {
      // 调用API获取数据源列表
      // const response = await api.getReportDataSources();
      // setDataSources(response.data);
      
      // 模拟数据
      setDataSources([
        {
          id: 1,
          name: '员工信息',
          table_name: 'employees',
          schema_name: 'hr',
          description: '员工基础信息表',
          is_active: true,
          fields: [
            { field_name: 'employee_code', field_type: 'VARCHAR', is_nullable: false, comment: '员工编号', display_name_zh: '员工编号', display_name_en: 'Employee Code' },
            { field_name: 'name', field_type: 'VARCHAR', is_nullable: false, comment: '姓名', display_name_zh: '姓名', display_name_en: 'Name' },
            { field_name: 'department', field_type: 'VARCHAR', is_nullable: true, comment: '部门', display_name_zh: '部门', display_name_en: 'Department' },
            { field_name: 'position', field_type: 'VARCHAR', is_nullable: true, comment: '职位', display_name_zh: '职位', display_name_en: 'Position' },
            { field_name: 'hire_date', field_type: 'DATE', is_nullable: true, comment: '入职日期', display_name_zh: '入职日期', display_name_en: 'Hire Date' }
          ]
        },
        {
          id: 2,
          name: '薪资数据',
          table_name: 'payroll_entries',
          schema_name: 'payroll',
          description: '薪资计算结果表',
          is_active: true,
          fields: [
            { field_name: 'employee_id', field_type: 'BIGINT', is_nullable: false, comment: '员工ID', display_name_zh: '员工ID', display_name_en: 'Employee ID' },
            { field_name: 'period_id', field_type: 'BIGINT', is_nullable: false, comment: '薪资期间ID', display_name_zh: '薪资期间ID', display_name_en: 'Period ID' },
            { field_name: 'basic_salary', field_type: 'DECIMAL', is_nullable: true, comment: '基本工资', display_name_zh: '基本工资', display_name_en: 'Basic Salary' },
            { field_name: 'total_earnings', field_type: 'DECIMAL', is_nullable: true, comment: '总收入', display_name_zh: '总收入', display_name_en: 'Total Earnings' },
            { field_name: 'total_deductions', field_type: 'DECIMAL', is_nullable: true, comment: '总扣除', display_name_zh: '总扣除', display_name_en: 'Total Deductions' },
            { field_name: 'net_pay', field_type: 'DECIMAL', is_nullable: true, comment: '实发工资', display_name_zh: '实发工资', display_name_en: 'Net Pay' }
          ]
        }
      ]);
    } catch (error) {
      message.error(t('messages.loadDataSourceFailed'));
    }
  };

  const loadCalculatedFields = async () => {
    try {
      // 调用API获取计算字段列表
      // const response = await api.getCalculatedFields();
      // setCalculatedFields(response.data);
      
      // 模拟数据
      setCalculatedFields([
        {
          id: 1,
          name: '年薪',
          alias: 'annual_salary',
          formula: 'basic_salary * 12',
          return_type: 'DECIMAL',
          description: '基本工资乘以12个月',
          is_global: true,
          is_active: true,
          category: '薪资计算',
          display_name_zh: '年薪',
          display_name_en: 'Annual Salary'
        },
        {
          id: 2,
          name: '工龄',
          alias: 'work_years',
          formula: 'EXTRACT(YEAR FROM AGE(CURRENT_DATE, hire_date))',
          return_type: 'INTEGER',
          description: '从入职日期计算工龄',
          is_global: true,
          is_active: true,
          category: '时间计算',
          display_name_zh: '工龄',
          display_name_en: 'Work Years'
        }
      ]);
    } catch (error) {
      message.error(t('messages.loadCalculatedFieldFailed'));
    }
  };

  const handleFieldUpdate = (field: ReportField) => {
    if (field.id) {
      // 更新现有字段
      setReportFields(prev => prev.map(f => f.id === field.id ? field : f));
    } else {
      // 添加新字段
      setReportFields(prev => [...prev, { ...field, id: Date.now() }]);
    }
  };

  const handleFieldDelete = (fieldId: number) => {
    setReportFields(prev => prev.filter(f => f.id !== fieldId));
  };

  const handleSaveTemplate = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      
      const templateData = {
        ...reportTemplate,
        ...values,
        template_config: {
          fields: reportFields,
          settings: {
            // 其他配置
          }
        }
      };

      // 调用API保存模板
      // await api.saveReportTemplate(templateData);
      
      message.success(t('messages.saveTemplateSuccess'));
    } catch (error) {
      message.error(t('messages.saveFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async () => {
    try {
      setLoading(true);
      
      // 调用API获取预览数据
      // const response = await api.previewReport({
      //   template_config: { fields: reportFields },
      //   limit: 100
      // });
      
      // 模拟预览数据
      const mockData = Array.from({ length: 10 }, (_, index) => ({
        key: index,
        employee_code: `EMP${String(index + 1).padStart(3, '0')}`,
        name: `员工${index + 1}`,
        department: '技术部',
        basic_salary: 8000 + index * 500,
        net_pay: 7200 + index * 450
      }));
      
      setPreviewData(mockData);
      setPreviewVisible(true);
    } catch (error) {
      message.error(t('messages.previewFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div style={{ 
        padding: '24px',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        minHeight: '100vh'
      }}>
        <Card 
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <TableOutlined style={{ color: '#1890ff', fontSize: '20px' }} />
              <Title level={3} style={{ margin: 0, color: '#2c3e50' }}>
                {t('reportDesigner')}
              </Title>
            </div>
          } 
          extra={
            <Space size="middle">
              <Button 
                icon={<EyeOutlined />} 
                onClick={handlePreview}
                size="large"
                type="default"
                style={{
                  borderRadius: '8px',
                  borderColor: '#52c41a',
                  color: '#52c41a'
                }}
              >
                {t('preview')}
              </Button>
              <Button 
                type="primary" 
                icon={<SaveOutlined />} 
                loading={loading} 
                onClick={handleSaveTemplate}
                size="large"
                style={{
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
                }}
              >
                {t('saveTemplate')}
              </Button>
            </Space>
          }
          style={{
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            border: 'none',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)'
          }}
          bodyStyle={{ padding: '32px' }}
        >
          <Row gutter={[32, 24]}>
            {/* 左侧：数据源和字段面板 */}
            <Col span={6}>
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <Card 
                  size="small" 
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <DatabaseOutlined style={{ color: '#1890ff' }} />
                      <Text strong>{t('dataSource')}</Text>
                    </div>
                  }
                  style={{ 
                    borderRadius: '12px',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
                    border: '1px solid #e8f4fd'
                  }}
                  bodyStyle={{ padding: '16px' }}
                >
                  <Select
                    style={{ width: '100%', marginBottom: '16px' }}
                    placeholder={t('selectDataSource')}
                    value={selectedDataSource?.id}
                    onChange={(value) => {
                      const source = dataSources.find(ds => ds.id === value);
                      setSelectedDataSource(source || null);
                    }}
                    size="large"
                  >
                    {dataSources.map(ds => (
                      <Option key={ds.id} value={ds.id}>
                        {ds.name} ({ds.schema_name}.{ds.table_name})
                      </Option>
                    ))}
                  </Select>
                  
                  {selectedDataSource && (
                    <div 
                      className="data-fields-container"
                      style={{ maxHeight: '400px', overflowY: 'auto', padding: '4px 0' }}
                    >
                      <Title level={5} style={{ 
                        margin: '8px 0 12px 0', 
                        fontSize: '14px',
                        color: '#1890ff'
                      }}>
                        {t('dataFields')}
                      </Title>
                      <div>
                        {selectedDataSource.fields?.map(field => (
                          <DraggableField
                            key={field.field_name}
                            field={field}
                            type="data"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </Card>

                <Card 
                  size="small" 
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CalculatorOutlined style={{ color: '#52c41a' }} />
                      <Text strong>{t('calculatedFields')}</Text>
                    </div>
                  }
                  style={{ 
                    borderRadius: '12px',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
                    border: '1px solid #f6ffed'
                  }}
                  bodyStyle={{ padding: '16px' }}
                >
                  <div 
                    className="calculated-fields-container"
                    style={{ maxHeight: '400px', overflowY: 'auto', padding: '4px 0' }}
                  >
                    <div>
                      {calculatedFields.map(field => (
                        <DraggableField
                          key={field.id}
                          field={field}
                          type="calculated"
                        />
                      ))}
                    </div>
                  </div>
                </Card>
              </Space>
            </Col>

            {/* 中间：报表配置 */}
            <Col span={18}>
              <Card
                style={{
                  borderRadius: '12px',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
                  border: '1px solid #f0f2f5'
                }}
                bodyStyle={{ padding: '24px' }}
              >
                <Tabs 
                  activeKey={activeTab} 
                  onChange={setActiveTab}
                  size="large"
                  className="enhanced-report-tabs"
                  items={[
                    {
                      key: 'basic',
                      label: t('basicInfo'),
                      children: (
                        <Form
                          form={form}
                          layout="vertical"
                          initialValues={reportTemplate}
                          onValuesChange={(_, values) => setReportTemplate({ ...reportTemplate, ...values })}
                        >
                          <Row gutter={16}>
                            <Col span={12}>
                              <Form.Item
                                label={t('reportName')}
                                name="name"
                                rules={[{ required: true, message: t('reportName') + t('messages.reportNameRequired') }]}
                              >
                                <Input placeholder={t('reportName')} />
                              </Form.Item>
                            </Col>
                            <Col span={12}>
                              <Form.Item label={t('customTitle')} name="title">
                                <Input placeholder={t('customTitle')} />
                              </Form.Item>
                            </Col>
                          </Row>
                          
                          <Row gutter={16}>
                            <Col span={12}>
                              <Form.Item label={t('reportCategory')} name="category">
                                <Select placeholder={t('reportCategory')}>
                                  <Option value="salary">{t('salaryReport')}</Option>
                                  <Option value="hr">{t('hrReport')}</Option>
                                  <Option value="finance">{t('financeReport')}</Option>
                                </Select>
                              </Form.Item>
                            </Col>
                            <Col span={12}>
                              <Form.Item label={t('sortOrder')} name="sort_order">
                                <InputNumber min={0} style={{ width: '100%' }} />
                              </Form.Item>
                            </Col>
                          </Row>

                          <Form.Item label={t('reportDescription')} name="description">
                            <TextArea rows={3} placeholder={t('reportDescription')} />
                          </Form.Item>

                          <Row gutter={16}>
                            <Col span={12}>
                              <Form.Item label={t('isActive')} name="is_active" valuePropName="checked">
                                <Switch />
                              </Form.Item>
                            </Col>
                            <Col span={12}>
                              <Form.Item label={t('publicTemplate')} name="is_public" valuePropName="checked">
                                <Switch />
                              </Form.Item>
                            </Col>
                          </Row>
                        </Form>
                      )
                    },
                    {
                      key: 'fields',
                      label: t('fieldConfiguration'),
                      children: (
                        <div>
                          <div style={{ marginBottom: '16px' }}>
                            <Alert
                              message={t('dragFieldsHint')}
                              type="info"
                              showIcon
                            />
                          </div>
                          
                          <ReportFieldsList
                            fields={reportFields}
                            onFieldUpdate={handleFieldUpdate}
                            onFieldDelete={handleFieldDelete}
                          />
                        </div>
                      )
                    },
                    {
                      key: 'style',
                      label: t('styleSettingsTab'),
                      children: (
                        <Form layout="vertical">
                          <Row gutter={16}>
                            <Col span={12}>
                              <Form.Item label={t('styleSettings.tableSize')}>
                                <Select defaultValue="middle">
                                  <Option value="small">{t('styleSettings.compact')}</Option>
                                  <Option value="middle">{t('styleSettings.medium')}</Option>
                                  <Option value="large">{t('styleSettings.large')}</Option>
                                </Select>
                              </Form.Item>
                            </Col>
                            <Col span={12}>
                              <Form.Item label={t('styleSettings.borderStyle')}>
                                <Select defaultValue="bordered">
                                  <Option value="bordered">{t('styleSettings.bordered')}</Option>
                                  <Option value="borderless">{t('styleSettings.borderless')}</Option>
                                </Select>
                              </Form.Item>
                            </Col>
                          </Row>
                          
                          <Form.Item label={t('styleSettings.showPagination')} valuePropName="checked">
                            <Switch defaultChecked />
                          </Form.Item>
                          
                          <Form.Item label={t('styleSettings.pageSize')}>
                            <Select defaultValue={20}>
                              <Option value={10}>10</Option>
                              <Option value={20}>20</Option>
                              <Option value={50}>50</Option>
                              <Option value={100}>100</Option>
                            </Select>
                          </Form.Item>
                        </Form>
                      )
                    }
                  ]}
                />
              </Card>
            </Col>
          </Row>
        </Card>

        {/* 预览对话框 */}
        <Modal
          title={t('reportPreview')}
          open={previewVisible}
          onCancel={() => setPreviewVisible(false)}
          width="80%"
          footer={[
            <Button key="close" onClick={() => setPreviewVisible(false)}>
              {t('close')}
            </Button>,
            <Button key="export" type="primary" icon={<DownloadOutlined />}>
              {t('export')}
            </Button>
          ]}
        >
          <Table
            columns={reportFields.filter(f => f.is_visible).map(field => ({
              title: field.field_alias || field.field_name,
              dataIndex: field.field_name,
              key: field.field_name,
              width: field.width,
              sorter: field.is_sortable,
            }))}
            dataSource={previewData}
            pagination={{ pageSize: 10 }}
            scroll={{ x: 'max-content' }}
          />
        </Modal>
      </div>
    </DndProvider>
  );
};

export default ReportDesigner;