import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, Form, Input, Select, Switch, Row, Col, Divider, Tag, Space, App, Button } from 'antd';
import { useTranslation } from 'react-i18next';
import type { ProColumns } from '@ant-design/pro-components';
import { stringSorter, numberSorter } from '../../../components/common/TableUtils';
import TableActionButton from '../../../components/common/TableActionButton';
import StandardListPageTemplate from '../../../components/common/StandardListPageTemplate';
import * as payrollApi from '../services/payrollApi';
import * as configApi from '@/api/config';
import apiClient from '@/api/apiClient';
import type { PayrollComponentDefinition } from '../types/payrollTypes';

const { Option } = Select;

// 权限配置
const usePayrollComponentPermissions = () => ({
  canViewList: true,
  canViewDetail: true,
  canCreate: true,
  canUpdate: true,
  canDelete: true,
  canExport: true,
});

interface LookupData {
  typeMap: Map<string, string>;
  typeInfo: Record<string, { text: string; color: string }>;
}

// 查找数据管理
const usePayrollComponentLookups = () => {
  const [lookupMaps, setLookupMaps] = useState<LookupData>({ typeMap: new Map(), typeInfo: {} });
  const [loadingLookups, setLoadingLookups] = useState(true);
  const [errorLookups, setErrorLookups] = useState<any>(null);

  const fetchLookups = useCallback(async () => {
    console.log('🔄 [PayrollComponentsPage] Fetching component types...');
    setLoadingLookups(true);
    setErrorLookups(null);
   
    
    try {
      // 优先使用lookup值表获取类型（已预设好的中文名称）
      const response = await apiClient.get('/config/lookup-values-public', {
        params: {
          lookup_type_code: 'PAYROLL_COMPONENT_TYPE'
        }
      });
      console.log('✅ [PayrollComponentsPage] 组件类型Lookup API Response:', response);

      const newTypeMap = new Map<string, string>();
      const newTypeInfo: Record<string, { text: string, color: string }> = {};

      // 处理查找到的组件类型，正确访问嵌套的 data 数组
      const lookupData = response?.data?.data;
      if (lookupData && Array.isArray(lookupData) && lookupData.length > 0) {
        lookupData.forEach((item: any) => {
          if (item.code && item.name) {
            let color = 'default';
            
            // 根据类型设置颜色
            switch(item.code.toUpperCase()) {
              case 'EARNING': color = 'green'; break;
              case 'DEDUCTION': color = 'red'; break;
              case 'PERSONAL_DEDUCTION': color = 'purple'; break;
              case 'EMPLOYER_DEDUCTION': color = 'orange'; break;
              case 'STATUTORY': case 'STAT': color = 'blue'; break;
              case 'BENEFIT': color = 'cyan'; break;
              case 'OTHER': color = 'gray'; break;
              case 'CALCULATION_BASE': color = 'geekblue'; break;
              case 'CALCULATION_RATE': color = 'geekblue'; break;
              case 'CALCULATION_RESULT': color = 'geekblue'; break;
              case 'TAX': color = 'magenta'; break;
              case 'REFUND_DEDUCTION_ADJUSTMENT': color = 'volcano'; break;
            }
            
            newTypeMap.set(item.code, item.name);
            newTypeInfo[item.code] = { text: item.name, color };
          }
        });
        
        console.log('✅ [PayrollComponentsPage] 从lookup获取到的类型数量:', lookupData.length);
        console.log('✅ [PayrollComponentsPage] 类型内容:', Array.from(newTypeMap.entries()));
      }
      
      setLookupMaps({ typeMap: newTypeMap, typeInfo: newTypeInfo });
      console.log('✅ [PayrollComponentsPage] 处理后的组件类型:', { 
        typeMapSize: newTypeMap.size, 
        typeInfoKeys: Object.keys(newTypeInfo),
        typeMapEntries: Array.from(newTypeMap.entries())
      });
    } catch (error) {
      console.error('❌ [PayrollComponentsPage] Failed to fetch component types:', error);
      setErrorLookups(error);
      
      // API失败时，设置为空
      console.warn('⚠️ [PayrollComponentsPage] API获取组件类型失败，设置为空');
      setLookupMaps({ typeMap: new Map(), typeInfo: {} });
    } finally {
      setLoadingLookups(false);
    }
  }, []);

  React.useEffect(() => {
    fetchLookups();
  }, [fetchLookups]);

  return { lookupMaps, loadingLookups, errorLookups };
};

// 表格列配置生成函数
const generatePayrollComponentTableColumns = (
  t: (key: string) => string,
  getColumnSearch: (dataIndex: keyof PayrollComponentDefinition) => any,
  lookupMaps: any,
  permissions: {
    canViewDetail: boolean;
    canUpdate: boolean;
    canDelete: boolean;
  },
  onEdit: (item: PayrollComponentDefinition) => void,
  onDelete: (id: string) => void,
  onViewDetails: (id: string) => void
): ProColumns<PayrollComponentDefinition>[] => {
  const { typeMap, typeInfo } = lookupMaps || {};

  return [
    {
      title: t('payroll_components.code'),
      dataIndex: 'code',
      key: 'code',
      sorter: stringSorter<PayrollComponentDefinition>('code'),
      ...getColumnSearch('code'),
    },
    {
      title: t('payroll_components.name'),
      dataIndex: 'name',
      key: 'name',
      sorter: stringSorter<PayrollComponentDefinition>('name'),
      ...getColumnSearch('name'),
    },
    {
      title: t('payroll_components.type'),
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const typeData = typeInfo?.[type];
        if (typeData) {
          return <Tag color={typeData.color}>{typeData.text}</Tag>;
        }
        return <Tag>{type}</Tag>;
      },
      sorter: stringSorter<PayrollComponentDefinition>('type'),
      filters: typeInfo ? Object.entries(typeInfo).map(([typeCode, typeData]: [string, any]) => ({
        text: typeData.text,
        value: typeCode,
      })) : [],
      onFilter: (value, record) => record.type === value,
    },
    {
      title: t('payroll_components.is_taxable'),
      dataIndex: 'is_taxable',
      key: 'is_taxable',
      render: (is_taxable: boolean) => (
        is_taxable ? t('common.yes'): t('common.no')
      ),
      filters: [
        { text: t('common.yes'), value: true },
        { text: t('common.no'), value: false },
      ],
      onFilter: (value, record) => record.is_taxable === value,
    },
    {
      title: t('payroll_components.sort_order'),
      dataIndex: 'sort_order',
      key: 'sort_order',
      sorter: numberSorter<PayrollComponentDefinition>('sort_order'),
    },
    {
      title: t('common.status'),
      dataIndex: 'is_active',
      key: 'is_active',
      render: (is_active: boolean) => (
        <Tag color={is_active ? 'green' : 'red'}>
          {is_active ? t('common.active'): t('common.inactive')}
        </Tag>
      ),
      filters: [
        { text: t('common.active'), value: true },
        { text: t('common.inactive'), value: false },
      ],
      onFilter: (value, record) => record.is_active === value,
    },
    {
      title: t('common.actions'),
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_: string, record: PayrollComponentDefinition) => (
        <Space size="small">
          {permissions.canViewDetail && (
            <TableActionButton 
              actionType="view" 
              onClick={() => onViewDetails(String(record.id))} 
              tooltipTitle={t('common.view')} 
            />
          )}
          {permissions.canUpdate && (
            <TableActionButton 
              actionType="edit" 
              onClick={() => onEdit(record)} 
              tooltipTitle={t('common.edit')} 
            />
          )}
          {permissions.canDelete && (
            <TableActionButton 
              actionType="delete" 
              danger 
              onClick={() => onDelete(String(record.id))} 
              tooltipTitle={t('common.delete')} 
            />
          )}
        </Space>
      ),
    },
  ];
};

// 主页面组件
const PayrollComponentsPageNew: React.FC = () => {
  const { t } = useTranslation(['payroll_components', 'common']);
  const { message: messageApi } = App.useApp();
  const navigate = useNavigate();
  const permissions = usePayrollComponentPermissions();
  const { lookupMaps, loadingLookups, errorLookups } = usePayrollComponentLookups();

  const [dataSource, setDataSource] = useState<PayrollComponentDefinition[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [editingComponent, setEditingComponent] = useState<PayrollComponentDefinition | null>(null);
  const [viewingComponent, setViewingComponent] = useState<PayrollComponentDefinition | null>(null);
  const [form] = Form.useForm();

  // 数据获取函数
  const fetchData = useCallback(async () => {
    setLoadingData(true);
    try {
      const response = await payrollApi.getPayrollComponentDefinitions({ 
        page: 1, 
        size: 100 // 修复：使用符合后端限制的最大值
      });
      if (response && response.data) {
        setDataSource(response.data);
      } else {
        setDataSource([]);
      }
    } catch (error) {
      setDataSource([]);
      messageApi.error(t('common.error.fetch'));
    } finally {
      setLoadingData(false);
    }
  }, [messageApi, t]);

  // 删除项目函数
  const deleteItem = useCallback(async (id: string) => {
    await payrollApi.deletePayrollComponentDefinition(Number(id));
  }, []);

  // 事件处理函数
  const handleAddClick = () => {
    setEditingComponent(null);
    form.resetFields();
    const defaultType = lookupMaps?.typeInfo ? Object.keys(lookupMaps.typeInfo)[0] : 'EARNING';
    const today = new Date().toISOString().split('T')[0];
    form.setFieldsValue({
      type: defaultType,
      is_active: true,
      is_taxable: true,
      is_social_security_base: false,
      is_housing_fund_base: false,
      sort_order: 0,
      effective_date: today,
    });
    setModalVisible(true);
  };

  const handleEditClick = (item: PayrollComponentDefinition) => {
    setEditingComponent(item);
    form.setFieldsValue({
      ...item,
      type: item.type,
      is_active: item.is_active,
      is_taxable: item.is_taxable,
      is_social_security_base: item.is_social_security_base,
      is_housing_fund_base: item.is_housing_fund_base,
      sort_order: item.sort_order || 0,
    });
    setModalVisible(true);
  };

  const handleViewDetailsClick = (id: string) => {
    // 查找对应的组件数据
    const component = dataSource.find(item => String(item.id) === id);
    if (component) {
      setViewingComponent(component);
      setDetailModalVisible(true);
    } else {
      messageApi.error(t('payroll:auto_text_e69caa'));
    }
  };

  // 处理模态框确认
  const handleModalOk = async () => {
    setLoadingData(true);
    try {
      // 表单验证
      const values = await form.validateFields().catch(errorInfo => {
        console.error("表单验证错误:", errorInfo);
        // 显示第一个错误字段的错误信息
        if (errorInfo && errorInfo.errorFields && errorInfo.errorFields.length > 0) {
          const firstError = errorInfo.errorFields[0];
          messageApi.error(`${firstError.name[0]} ${firstError.errors[0]}`);
        } else {
          messageApi.error(t('common.validation.form_has_errors'));
        }
        throw errorInfo; // 重新抛出错误，阻止后续处理
      });
      
      // 表单验证通过，准备提交数据
      console.log("表单验证通过，准备提交数据:", values);
      
      // 数据映射转换
      const mappedValues = {
        ...values,
        display_order: parseInt(values.sort_order) || 0,
        calculation_method: values.calculation_method || 'FIXED_AMOUNT',
      };
      
      delete mappedValues.sort_order;
      
      
      if (editingComponent) {
        await payrollApi.updatePayrollComponentDefinition(editingComponent.id, mappedValues);
        setModalVisible(false);
        setEditingComponent(null);
        fetchData();
        messageApi.success(t('payroll_components.update_success'));
      } else {
        await payrollApi.createPayrollComponentDefinition(mappedValues);
        setModalVisible(false);
        fetchData();
        messageApi.success(t('payroll_components.create_success'));
      }
    } catch (error: any) {
      console.error("Error updating payroll component:", error);
      let errorMessage = editingComponent 
        ? t('payroll_components.update_failed'): t('payroll_components.create_failed');
      
      if (error.response?.status === 422) {
        const errorDetail = error.response?.data?.detail;
        if (typeof errorDetail === 'string') {
          errorMessage = errorDetail;
        } else if (errorDetail?.error?.details) {
          errorMessage = errorDetail.error.details;
        } else if (errorDetail?.details) {
          errorMessage = errorDetail.details;
        } else {
          const errorText = JSON.stringify(error.response.data).toLowerCase();
          if (errorText.includes(t('payroll:auto_text_e5b7b2')) || errorText.includes('duplicate') || errorText.includes('unique')) {
            const values = form.getFieldsValue();
            errorMessage = values?.code 
              ? `编码 "${values.code}" 已存在，请使用不同的编码`
              : t('payroll:auto___e7bc96');
          }
        }
      } else if (error.response?.status === 400) {
        errorMessage = t('payroll:auto___e8afb7');
      } else if (error.response?.status === 500) {
        errorMessage = t('payroll:auto___e69c8d');
      } else if (error.message) {
        errorMessage = error.message;
      }
      messageApi.error(errorMessage);
    } finally {
      setLoadingData(false);
    }
  };

  // 渲染模态框
  const renderModal = () => (
    <Modal
      title={editingComponent ? t('payroll_components.edit'): t('payroll_components.add')}
      open={modalVisible}
      onOk={handleModalOk}
      onCancel={() => setModalVisible(false)}
      width={700}
    >
      <Form form={form} layout="vertical">
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
              <Select
                placeholder={t('payroll_components.placeholders.type')}
                loading={loadingLookups}
                disabled={loadingLookups}
                options={
                  lookupMaps && lookupMaps.typeMap && lookupMaps.typeMap.size > 0
                  ? Array.from(lookupMaps.typeMap.entries()).map(([code, name]) => {
                      console.log(`转换类型选项: ${code} -> ${name}`);
                      return {
                        value: code,
                        label: name,
                      };
                    }) 
                  : []
                }
                showSearch
                optionFilterProp="label"
              />
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

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="effective_date"
              label={t('payroll:auto_text_e7949f')}
              rules={[{ required: true, message: t('common.validation.required') }]}
            >
              <Input type="date" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="end_date"
              label={t('payroll:auto_text_e7bb93')}
            >
              <Input type="date" />
            </Form.Item>
          </Col>
        </Row>

        <Divider>{t('payroll_components.options')}</Divider>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="is_active"
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
  );

  // 渲染详情模态框
  const renderDetailModal = () => (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ 
            width: 40, 
            height: 40, 
            borderRadius: '50%', 
            backgroundColor: lookupMaps?.typeInfo?.[viewingComponent?.type || '']?.color === 'green' ? '#f6ffed' : 
                             lookupMaps?.typeInfo?.[viewingComponent?.type || '']?.color === 'blue' ? '#f0f5ff' : 
                             lookupMaps?.typeInfo?.[viewingComponent?.type || '']?.color === 'red' ? '#fff2f0' : '#fafafa',
            border: `2px solid ${lookupMaps?.typeInfo?.[viewingComponent?.type || '']?.color === 'green' ? '#52c41a' : 
                                 lookupMaps?.typeInfo?.[viewingComponent?.type || '']?.color === 'blue' ? '#1890ff' : 
                                 lookupMaps?.typeInfo?.[viewingComponent?.type || '']?.color === 'red' ? '#ff4d4f' : '#d9d9d9'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px'
          }}>
            {viewingComponent?.type === 'EARNING' || viewingComponent?.type === 'Earning' ? '💰' : 
             viewingComponent?.type === 'DEDUCTION' || viewingComponent?.type === 'Deduction' ? '📉' : 
             viewingComponent?.type === 'PERSONAL_DEDUCTION' ? '👤' : 
             viewingComponent?.type === 'EMPLOYER_DEDUCTION' ? '🏢' : '⚙️'}
          </div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 600, color: '#262626' }}>
              {viewingComponent?.name || ''}
            </div>
            <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: 2 }}>
              t('common.view_details') • {viewingComponent?.code}
            </div>
          </div>
        </div>
      }
      open={detailModalVisible}
      onCancel={() => {
        setDetailModalVisible(false);
        setViewingComponent(null);
      }}
      footer={[
        <Button 
          key="close" 
          type="primary"
          onClick={() => {
            setDetailModalVisible(false);
            setViewingComponent(null);
          }}
        >
          t('common.button.close')
        </Button>
      ]}
      width={800}
      styles={{
        body: { padding: '24px 0' }
      }}
    >
      {viewingComponent && (
        <div style={{ padding: '0 24px' }}>
          {/* 基本信息卡片 */}
          <div style={{ 
            backgroundColor: '#fafafa', 
            borderRadius: 8, 
            padding: 20, 
            marginBottom: 20,
            border: '1px solid #f0f0f0'
          }}>
            <div style={{ 
              fontSize: '14px', 
              fontWeight: 600, 
              color: '#262626', 
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              📋 基本信息
            </div>
            <Row gutter={[24, 16]}>
              <Col span={8}>
                <div style={{ marginBottom: 4 }}>
                  <span style={{ fontSize: '12px', color: '#8c8c8c' }}>组件代码</span>
                </div>
                <div style={{ 
                  fontSize: '14px', 
                  fontWeight: 500, 
                  color: '#262626',
                  fontFamily: 'Monaco, Consolas, monospace',
                  backgroundColor: '#f5f5f5',
                  padding: '4px 8px',
                  borderRadius: 4,
                  border: '1px solid #e8e8e8'
                }}>
                  {viewingComponent.code}
                </div>
              </Col>
              <Col span={8}>
                <div style={{ marginBottom: 4 }}>
                  <span style={{ fontSize: '12px', color: '#8c8c8c' }}>组件名称</span>
                </div>
                <div style={{ fontSize: '14px', fontWeight: 500, color: '#262626' }}>
                  {viewingComponent.name}
                </div>
              </Col>
              <Col span={8}>
                <div style={{ marginBottom: 4 }}>
                  <span style={{ fontSize: '12px', color: '#8c8c8c' }}>组件类型</span>
                </div>
                <Tag 
                  color={lookupMaps?.typeInfo?.[viewingComponent.type]?.color || 'default'}
                  style={{ fontSize: '12px', fontWeight: 500 }}
                >
                  {lookupMaps?.typeInfo?.[viewingComponent.type]?.text || viewingComponent.type}
                </Tag>
              </Col>
              <Col span={8}>
                <div style={{ marginBottom: 4 }}>
                  <span style={{ fontSize: '12px', color: '#8c8c8c' }}>排序顺序</span>
                </div>
                <div style={{ 
                  fontSize: '14px', 
                  fontWeight: 500, 
                  color: '#262626',
                  backgroundColor: '#e6f7ff',
                  padding: '4px 8px',
                  borderRadius: 4,
                  display: 'inline-block',
                  border: '1px solid #91d5ff'
                }}>
                  {viewingComponent.sort_order || 0}
                </div>
              </Col>
              <Col span={8}>
                <div style={{ marginBottom: 4 }}>
                  <span style={{ fontSize: '12px', color: '#8c8c8c' }}>状态</span>
                </div>
                <Tag 
                  color={viewingComponent.is_active ? 'success' : 'error'}
                  style={{ fontSize: '12px', fontWeight: 500 }}
                >
                  {viewingComponent.is_active ? t('payroll:auto___e29c85'): t('payroll:auto___e29d8c')}
                </Tag>
              </Col>
            </Row>
          </div>

          {/* 计算属性卡片 */}
          <div style={{ 
            backgroundColor: '#f9f9f9', 
            borderRadius: 8, 
            padding: 20, 
            marginBottom: 20,
            border: '1px solid #f0f0f0'
          }}>
            <div style={{ 
              fontSize: '14px', 
              fontWeight: 600, 
              color: '#262626', 
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              🧮 计算属性
            </div>
            <Row gutter={[24, 16]}>
              <Col span={8}>
                <div style={{ 
                  textAlign: 'center',
                  padding: 16,
                  backgroundColor: viewingComponent.is_taxable ? '#f6ffed' : '#fff2f0',
                  borderRadius: 8,
                  border: `1px solid ${viewingComponent.is_taxable ? '#b7eb8f' : '#ffb3b3'}`
                }}>
                  <div style={{ fontSize: '24px', marginBottom: 8 }}>
                    {viewingComponent.is_taxable ? '💸' : '🚫'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: 4 }}>
                    是否计税
                  </div>
                  <div style={{ 
                    fontSize: '14px', 
                    fontWeight: 600,
                    color: viewingComponent.is_taxable ? '#52c41a' : '#ff4d4f'
                  }}>
                    {viewingComponent.is_taxable ? t('payroll:auto_text_e8aea1'): t('payroll:auto_text_e4b88d')}
                  </div>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ 
                  textAlign: 'center',
                  padding: 16,
                  backgroundColor: viewingComponent.is_social_security_base ? '#f6ffed' : '#fff2f0',
                  borderRadius: 8,
                  border: `1px solid ${viewingComponent.is_social_security_base ? '#b7eb8f' : '#ffb3b3'}`
                }}>
                  <div style={{ fontSize: '24px', marginBottom: 8 }}>
                    {viewingComponent.is_social_security_base ? '🛡️' : '🚫'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: 4 }}>
                    社保基数
                  </div>
                  <div style={{ 
                    fontSize: '14px', 
                    fontWeight: 600,
                    color: viewingComponent.is_social_security_base ? '#52c41a' : '#ff4d4f'
                  }}>
                    {viewingComponent.is_social_security_base ? t('payroll:auto_text_e8aea1'): t('payroll:auto_text_e4b88d')}
                  </div>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ 
                  textAlign: 'center',
                  padding: 16,
                  backgroundColor: viewingComponent.is_housing_fund_base ? '#f6ffed' : '#fff2f0',
                  borderRadius: 8,
                  border: `1px solid ${viewingComponent.is_housing_fund_base ? '#b7eb8f' : '#ffb3b3'}`
                }}>
                  <div style={{ fontSize: '24px', marginBottom: 8 }}>
                    {viewingComponent.is_housing_fund_base ? '🏠' : '🚫'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: 4 }}>
                    公积金基数
                  </div>
                  <div style={{ 
                    fontSize: '14px', 
                    fontWeight: 600,
                    color: viewingComponent.is_housing_fund_base ? '#52c41a' : '#ff4d4f'
                  }}>
                    {viewingComponent.is_housing_fund_base ? t('payroll:auto_text_e8aea1'): t('payroll:auto_text_e4b88d')}
                  </div>
                </div>
              </Col>
            </Row>
          </div>

          {/* 描述信息卡片 */}
          {viewingComponent.description && (
            <div style={{ 
              backgroundColor: '#f0f5ff', 
              borderRadius: 8, 
              padding: 20, 
              marginBottom: 20,
              border: '1px solid #adc6ff'
            }}>
              <div style={{ 
                fontSize: '14px', 
                fontWeight: 600, 
                color: '#262626', 
                marginBottom: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                📝 描述信息
              </div>
              <div style={{ 
                fontSize: '14px', 
                lineHeight: '1.6',
                color: '#595959',
                backgroundColor: '#ffffff',
                padding: 16,
                borderRadius: 6,
                border: '1px solid #e6f7ff'
              }}>
                {viewingComponent.description}
              </div>
            </div>
          )}

          {/* 系统信息卡片 */}
          <div style={{ 
            backgroundColor: '#f5f5f5', 
            borderRadius: 8, 
            padding: 20,
            border: '1px solid #e8e8e8'
          }}>
            <div style={{ 
              fontSize: '14px', 
              fontWeight: 600, 
              color: '#262626', 
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              ⏰ 系统信息
            </div>
            <Row gutter={[24, 12]}>
              <Col span={12}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '16px' }}>📅</span>
                  <div>
                    <div style={{ fontSize: '12px', color: '#8c8c8c' }}>创建时间</div>
                    <div style={{ fontSize: '13px', color: '#595959', fontFamily: 'Monaco, Consolas, monospace' }}>
                      {viewingComponent.created_at ? new Date(viewingComponent.created_at).toLocaleString('zh-CN') : '-'}
                    </div>
                  </div>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '16px' }}>🔄</span>
                  <div>
                    <div style={{ fontSize: '12px', color: '#8c8c8c' }}>更新时间</div>
                    <div style={{ fontSize: '13px', color: '#595959', fontFamily: 'Monaco, Consolas, monospace' }}>
                      {viewingComponent.updated_at ? new Date(viewingComponent.updated_at).toLocaleString('zh-CN') : '-'}
                    </div>
                  </div>
                </div>
              </Col>
            </Row>
          </div>
        </div>
      )}
    </Modal>
  );

  const templateProps = {
    translationNamespaces: ['payroll_components', 'common'],
    pageTitleKey: 'payroll_components.title',
    addButtonTextKey: 'payroll_components.add',
    dataSource,
    loadingData,
    permissions,
    lookupMaps,
    loadingLookups,
    errorLookups,
    fetchData,
    deleteItem,
    onAddClick: handleAddClick,
    onEditClick: handleEditClick,
    onViewDetailsClick: handleViewDetailsClick,
    generateTableColumns: generatePayrollComponentTableColumns,
    deleteConfirmConfig: {
      titleKey: 'common.confirmDelete',
      contentKey: 'common.confirmDeleteContent',
      okTextKey: 'common.yes',
      cancelTextKey: 'common.no',
      successMessageKey: 'payroll_components.delete_success',
      errorMessageKey: 'common.error.delete',
    },
    batchDeleteConfig: {
      enabled: true,
      buttonText: t('payroll:auto_text_e689b9'),
      confirmTitle: t('payroll:auto_text_e7a1ae'),
      confirmContent: t('payroll:auto____e7a1ae'),
      confirmOkText: t('payroll:auto_text_e7a1ae'),
      confirmCancelText: t('payroll:auto_text_e58f96'),
      successMessage: t('payroll:auto_text_e689b9'),
      errorMessage: t('payroll:auto_text_e689b9'),
      noSelectionMessage: t('payroll:auto_text_e8afb7'),
      onBatchDelete: async (keys: React.Key[]) => {
        await Promise.all(keys.map(key => payrollApi.deletePayrollComponentDefinition(Number(key))));
        fetchData();
      },
    },
    exportConfig: {
      filenamePrefix: t('payroll:auto_text_e896aa'),
      sheetName: t('payroll:auto_text_e896aa'),
      buttonText: t('payroll:auto_excel_e5afbc'),
      successMessage: t('payroll:auto_text_e896aa'),
    },
    lookupErrorMessageKey: 'common.error.fetch',
    lookupLoadingMessageKey: 'common.loading',
    lookupDataErrorMessageKey: 'common.error.loadData',
    rowKey: 'id',
  };

  return (
    <>
      <StandardListPageTemplate {...templateProps} />
      {renderModal()}
      {renderDetailModal()}
    </>
  );
};

export default PayrollComponentsPageNew;