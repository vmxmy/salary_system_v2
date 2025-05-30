import React, { useState, useEffect, useRef } from 'react';
import { Empty, Space, Button, Modal, Tooltip, App } from 'antd';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { ProColumns, ActionType } from '@ant-design/pro-components';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import EnhancedProTable from '../../../../../components/common/EnhancedProTable';
import type { ReportField, DataSourceJoin } from './types';
import { reportDesignerService } from './services';
import FieldConfigDrawer from './FieldConfigDrawer';
import { DeleteOutlined } from '@ant-design/icons';

const PreviewContainer = styled.div`
  height: 100%;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const DropZone = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'isOver'
})<{ isOver: boolean }>`
  flex: 1;
  overflow: auto;
  background: ${props => props.isOver ? 'rgba(24, 144, 255, 0.05)' : 'transparent'};
  border: 2px dashed ${props => props.isOver ? '#1890ff' : 'transparent'};
  transition: all 0.3s;
  position: relative;
  
  /* 列标题悬停效果 */
  .ant-table-thead > tr > th:hover .column-delete-btn {
    opacity: 1 !important;
  }
  
  /* 拖拽删除区域样式 */
  .delete-drop-zone {
    position: absolute;
    bottom: 20px;
    right: 20px;
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: #ff4d4f;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 24px;
    opacity: 0;
    transition: all 0.3s;
    box-shadow: 0 4px 12px rgba(255, 77, 79, 0.3);
    
    &.visible {
      opacity: 1;
      transform: scale(1.1);
    }
    
    &.active {
      transform: scale(1.2);
      background: #ff7875;
    }
  }
`;

const EmptyState = styled.div`
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  color: #999;
  
  .ant-empty {
    margin-bottom: 24px;
  }
`;

interface ReportPreviewProps {
  fields: ReportField[];
  dataSource: string;
  onFieldUpdate: (field: ReportField) => void;
  onFieldDelete: (fieldId: string) => void;
  onFieldReorder: (fields: ReportField[]) => void;
  dataSources?: string[];
  joins?: DataSourceJoin[];
  multiSelectMode?: boolean;
}

const ReportPreview: React.FC<ReportPreviewProps> = ({
  fields,
  dataSource,
  onFieldUpdate,
  onFieldDelete,
  onFieldReorder,
  dataSources,
  joins,
  multiSelectMode
}) => {
  const { t } = useTranslation('reportManagement');
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [editingField, setEditingField] = useState<ReportField | null>(null);
  const [configDrawerVisible, setConfigDrawerVisible] = useState(false);
  const actionRef = useRef<ActionType | undefined>(undefined);

  const { isOver, setNodeRef } = useDroppable({
    id: 'report-preview'
  });

  // 调试：验证接收到的props
  useEffect(() => {
    console.log('📋 ReportPreview received props:', {
      fieldsCount: fields.length,
      dataSource,
      dataSources,
      joins,
      multiSelectMode,
      joinsDetail: joins ? JSON.stringify(joins) : 'undefined'
    });
  }, [fields, dataSource, dataSources, joins, multiSelectMode]);

  // 当关键参数变化时，触发表格刷新
  useEffect(() => {
    if (actionRef.current) {
      console.log('🔄 Triggering table reload due to props change');
      actionRef.current.reload();
    }
  }, [joins, dataSources, multiSelectMode]);

  // 生成ProTable列配置
  const generateColumns = (): ProColumns<any>[] => {
    return fields
      .filter(field => field.is_visible)
      .sort((a, b) => a.display_order - b.display_order)
      .map(field => {
        const column: ProColumns<any> = {
          title: (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>{field.field_alias}</span>
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  Modal.confirm({
                    title: t('confirmDeleteField'),
                    content: t('deleteFieldTip', { fieldName: field.field_alias }),
                    okText: t('delete'),
                    cancelText: t('cancel'),
                    onOk: () => onFieldDelete(field.id),
                  });
                }}
                style={{ 
                  opacity: 0,
                  transition: 'opacity 0.2s',
                  marginLeft: 8
                }}
                className="column-delete-btn"
              />
            </div>
          ),
          dataIndex: field.field_name,
          key: field.id,
          width: field.width,
          sorter: field.is_sortable,
          search: field.is_filterable,
          hideInSearch: !field.is_filterable,
          align: getAlignment(field.field_type),
          valueType: getValueType(field) as any,
          formItemProps: {
            rules: []
          },
          render: (text: any) => {
            return formatValue(text, field);
          }
        };

        return column;
      });
  };

  // 获取字段对齐方式
  const getAlignment = (fieldType: string): 'left' | 'center' | 'right' => {
    switch (fieldType) {
      case 'number':
        return 'right';
      case 'date':
        return 'center';
      default:
        return 'left';
    }
  };

  // 获取ProTable字段类型
  const getValueType = (field: ReportField): string => {
    const formatType = field.formatting_config?.format_type;
    
    if (formatType) {
      switch (formatType) {
        case 'currency':
          return 'money';
        case 'percentage':
          return 'percent';
        case 'date':
          return 'date';
        case 'number':
          return 'digit';
        default:
          return 'text';
      }
    }

    switch (field.field_type) {
      case 'number':
        return 'digit';
      case 'date':
        return 'date';
      default:
        return 'text';
    }
  };

  // 格式化字段值
  const formatValue = (value: any, field: ReportField): React.ReactNode => {
    if (value === null || value === undefined) {
      return '-';
    }

    const config = field.formatting_config;
    
    if (config) {
      switch (config.format_type) {
        case 'currency':
          const formatted = Number(value).toFixed(config.decimal_places || 2);
          return `${config.prefix || '¥'}${formatted}${config.suffix || ''}`;
        
        case 'percentage':
          return `${(Number(value) * 100).toFixed(config.decimal_places || 2)}%`;
        
        case 'number':
          const num = Number(value).toFixed(config.decimal_places || 0);
          return config.thousand_separator ? Number(num).toLocaleString() : num;
        
        case 'date':
          return value; // ProTable会自动处理日期格式
        
        default:
          return String(value);
      }
    }

    return String(value);
  };

  // 加载数据
  const loadData = async (params: any) => {
    // 使用最新的props值，避免闭包陷阱
    const currentJoins = joins || [];
    const currentDataSources = dataSources || [dataSource].filter(Boolean);
    const currentMultiSelectMode = multiSelectMode;
    
    console.log('=== ReportPreview loadData Debug ===');
    console.log('currentDataSources:', currentDataSources);
    console.log('fields.length:', fields.length);
    console.log('joins (from props):', currentJoins);
    console.log('multiSelectMode:', currentMultiSelectMode);
    console.log('dataSources prop:', dataSources);
    console.log('dataSource prop:', dataSource);
    
    if (currentDataSources.length === 0) {
      console.log('❌ No data sources selected');
      return { data: [], success: true, total: 0 };
    }

    // 检测是否为多数据源查询
    const hasMultipleDataSources = currentDataSources.length > 1;
    const hasJoinConfig = currentJoins && currentJoins.length > 0;
    const isMultiDataSourceQuery = hasMultipleDataSources && hasJoinConfig;
    
    console.log('🔍 Multi-datasource query detection:', {
      hasMultipleDataSources,
      hasJoinConfig,
      isMultiDataSourceQuery,
      dataSourceCount: currentDataSources.length,
      joinCount: currentJoins ? currentJoins.length : 0,
      joinsData: currentJoins
    });

    // 特殊情况：选择了多个数据源但没有配置JOIN
    if (hasMultipleDataSources && !hasJoinConfig) {
      console.log('⚠️ Multiple data sources selected but no JOIN configured');
      message.warning('已选择多个数据源，请先在"数据源关联"页面配置JOIN关系，然后再选择字段进行查询。');
      return { 
        data: [], 
        success: true, 
        total: 0,
        message: '需要配置数据源关联关系'
      };
    }

    // 如果配置了多数据源JOIN但没有选择字段，自动选择默认字段
    let queryFields = fields;
    if (isMultiDataSourceQuery && fields.length === 0) {
      console.log('🔧 Multi-datasource JOIN detected but no fields selected. Adding default fields...');
      
      // 自动为每个数据源添加默认字段
      const defaultFields: ReportField[] = [];
      currentDataSources.forEach((dsId, index) => {
        defaultFields.push({
          id: `auto_field_${dsId}_id`,
          field_name: 'id',
          field_alias: `${dsId}_ID`,
          data_source: dsId,
          field_type: 'number',
          display_order: index * 2,
          is_visible: true,
          is_sortable: true,
          is_filterable: true,
          width: 100,
          formatting_config: {},
          qualified_field_name: `${dsId}.id`,
          source_data_source_id: dsId
        });
        
        defaultFields.push({
          id: `auto_field_${dsId}_name`,
          field_name: 'name',
          field_alias: `${dsId}_名称`,
          data_source: dsId,
          field_type: 'string',
          display_order: index * 2 + 1,
          is_visible: true,
          is_sortable: true,
          is_filterable: true,
          width: 150,
          formatting_config: {},
          qualified_field_name: `${dsId}.name`,
          source_data_source_id: dsId
        });
      });
      
      queryFields = defaultFields;
      console.log('🔧 Auto-generated fields:', queryFields);
    }

    if (queryFields.length === 0) {
      console.log('❌ No fields to query');
      return { data: [], success: true, total: 0 };
    }

    try {
      setLoading(true);
      console.log('🚀 Executing preview query...');
      console.log('isMultiDataSourceQuery:', isMultiDataSourceQuery);
      
      // 构建查询参数
      const queryParams = {
        dataSource: currentDataSources[0], // 主数据源
        dataSources: isMultiDataSourceQuery ? currentDataSources : undefined,
        joins: isMultiDataSourceQuery ? currentJoins : undefined,
        fields: queryFields.map(f => f.qualified_field_name || f.field_name),
        filters: params.filters,
        sorter: params.sorter,
        current: params.current || 1,
        pageSize: params.pageSize || 20
      };
      
      console.log('📤 Query parameters:', queryParams);
      
      const result = await reportDesignerService.previewData(queryParams);
      
      console.log('📥 Query result:', result);
      
      setData(result.data);
      setTotal(result.total);
      
      return {
        data: result.data,
        success: true,
        total: result.total
      };
    } catch (error) {
      console.error('❌ Query failed:', error);
      message.error(t('queryError'));
      return { data: [], success: false, total: 0 };
    } finally {
      setLoading(false);
    }
  };

  // 处理字段配置
  const handleFieldConfig = (field: ReportField) => {
    setEditingField(field);
    setConfigDrawerVisible(true);
  };

  // 处理配置保存
  const handleConfigSave = (updatedField: ReportField) => {
    onFieldUpdate(updatedField);
    setConfigDrawerVisible(false);
    setEditingField(null);
    actionRef.current?.reload();
  };

  // 生成列配置（带操作按钮）
  const columns: ProColumns<any>[] = [
    ...generateColumns(),
    {
      title: t('actions'),
      key: 'operation',
      width: 100,
      fixed: 'right',
      hideInSearch: true,
      render: (_, record, index) => {
        const field = fields.find(f => f.field_name === Object.keys(record)[0]);
        if (!field) return null;

        return (
          <Space>
            <Tooltip title={t('configFieldTip')}>
              <Button
                type="link"
                size="small"
                onClick={() => handleFieldConfig(field)}
              >
                {t('edit')}
              </Button>
            </Tooltip>
            <Tooltip title={t('deleteFieldTip')}>
              <Button
                type="link"
                size="small"
                danger
                onClick={() => onFieldDelete(field.id)}
              >
                {t('delete')}
              </Button>
            </Tooltip>
          </Space>
        );
      }
    }
  ];

  // 渲染空状态
  const currentDataSources = dataSources || [dataSource].filter(Boolean);
  
  if (currentDataSources.length === 0 || fields.length === 0) {
    return (
      <PreviewContainer>
        <DropZone ref={setNodeRef} isOver={isOver}>
          <EmptyState>
            <Empty
              description={
                currentDataSources.length === 0
                  ? t('selectDataSourceFirst')
                  : t('dragFieldsHere')
              }
            />
            {currentDataSources.length > 0 && (
              <div style={{ color: '#999', fontSize: '14px' }}>
                {t('dragFieldsHint')}
              </div>
            )}
          </EmptyState>
        </DropZone>
      </PreviewContainer>
    );
  }

  return (
    <PreviewContainer>
      <DropZone ref={setNodeRef} isOver={isOver}>
        <SortableContext
          items={fields.map(f => f.id)}
          strategy={verticalListSortingStrategy}
        >
          <EnhancedProTable
            columns={columns}
            request={loadData}
            actionRef={actionRef}
            rowKey="id"
            pagination={{
              defaultPageSize: 20,
              showSizeChanger: true,
              showQuickJumper: true
            }}
            search={true}
            dateFormatter="string"
            headerTitle={false}
            toolBarRender={() => []}
            scroll={{ x: 'max-content' }}
          />
        </SortableContext>
      </DropZone>

      {/* 字段配置抽屉 */}
      {editingField && (
        <FieldConfigDrawer
          visible={configDrawerVisible}
          field={editingField}
          onClose={() => setConfigDrawerVisible(false)}
          onSave={handleConfigSave}
        />
      )}
    </PreviewContainer>
  );
};

export default ReportPreview; 