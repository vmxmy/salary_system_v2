import React, { useState, useEffect, useMemo } from 'react';
import { Select, List, Tag, Input, Empty, Collapse, Button, Badge } from 'antd';
import { 
  DatabaseOutlined, 
  CalculatorOutlined, 
  SearchOutlined, 
  PlusOutlined,
  UserOutlined,
  TeamOutlined,
  DollarOutlined,
  CalendarOutlined,
  FileTextOutlined,
  NumberOutlined,
  CheckCircleOutlined,
  IdcardOutlined,
  PhoneOutlined,
  MailOutlined,
  HomeOutlined,
  BankOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import type { DataSource, FieldItem, FieldGroup } from './types';

const PanelContainer = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const SourceSelector = styled.div`
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  background: #fafafa;
`;

const FieldsContainer = styled.div`
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const SearchContainer = styled.div`
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
`;

const FieldsList = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 8px;
  max-height: 400px;
  
  .ant-collapse {
    background: transparent;
    border: none;
  }
  
  .ant-collapse-item {
    margin-bottom: 8px;
    border: 1px solid #f0f0f0 !important;
    border-radius: 8px !important;
    overflow: hidden;
  }
  
  .ant-collapse-header {
    padding: 12px 16px !important;
    background: #e6f7ff;
    color: #1890ff;
    font-weight: 500;
  }
  
  .ant-collapse-content {
    border-top: 1px solid #f0f0f0;
  }
  
  .ant-collapse-content-box {
    padding: 8px !important;
  }
`;

const FieldItem = styled.div<{ $isAdded?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  margin-bottom: 4px;
  border-radius: 6px;
  background: ${props => props.$isAdded ? '#f5f5f5' : 'white'};
  border: 1px solid ${props => props.$isAdded ? '#e8e8e8' : '#f0f0f0'};
  transition: all 0.2s;
  
  &:hover {
    border-color: ${props => props.$isAdded ? '#d9d9d9' : '#1890ff'};
    ${props => !props.$isAdded && 'box-shadow: 0 2px 8px rgba(24, 144, 255, 0.08);'}
  }
`;

const FieldInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
`;

const FieldIcon = styled.span<{ $isAdded?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  font-size: 14px;
  color: ${props => props.$isAdded ? '#bfbfbf' : '#1890ff'};
`;

const FieldName = styled.span<{ $isAdded?: boolean }>`
  font-size: 13px;
  color: ${props => props.$isAdded ? '#8c8c8c' : '#262626'};
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const FieldType = styled(Tag)`
  font-size: 11px;
  margin: 0;
  flex-shrink: 0;
`;

const AddButton = styled(Button)`
  &.ant-btn-sm {
    width: 24px;
    height: 24px;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }
`;

// 字段类型映射
const fieldTypeMap: Record<string, { color: string; label: string }> = {
  string: { color: 'blue', label: '文本' },
  number: { color: 'green', label: '数字' },
  date: { color: 'orange', label: '日期' },
  boolean: { color: 'purple', label: '布尔' },
  json: { color: 'gold', label: 'JSON' }
};

// 智能图标映射
const getFieldIcon = (field: FieldItem): React.ReactNode => {
  const name = field.field_name.toLowerCase();
  const alias = (field.field_alias || '').toLowerCase();
  
  // 根据字段名或别名智能匹配图标
  if (name.includes('employee') || name.includes('user') || alias.includes('员工')) {
    return <UserOutlined />;
  }
  if (name.includes('department') || alias.includes('部门')) {
    return <TeamOutlined />;
  }
  if (name.includes('salary') || name.includes('pay') || alias.includes('工资') || alias.includes('薪资')) {
    return <DollarOutlined />;
  }
  if (name.includes('date') || name.includes('time') || alias.includes('日期')) {
    return <CalendarOutlined />;
  }
  if (name.includes('id') || name.includes('code') || alias.includes('编号')) {
    return <IdcardOutlined />;
  }
  if (name.includes('phone') || name.includes('mobile') || alias.includes('电话')) {
    return <PhoneOutlined />;
  }
  if (name.includes('email') || alias.includes('邮箱')) {
    return <MailOutlined />;
  }
  if (name.includes('address') || alias.includes('地址')) {
    return <HomeOutlined />;
  }
  if (name.includes('bank') || alias.includes('银行')) {
    return <BankOutlined />;
  }
  if (field.field_type === 'number') {
    return <NumberOutlined />;
  }
  if (field.is_calculated) {
    return <CalculatorOutlined />;
  }
  
  return <DatabaseOutlined />;
};

// 字段列表项组件
const FieldListItem: React.FC<{
  field: FieldItem;
  isAdded: boolean;
  onAdd: (field: FieldItem) => void;
}> = ({ field, isAdded, onAdd }) => {
  const { t } = useTranslation('reportManagement');
  const typeConfig = fieldTypeMap[field.field_type] || { color: 'default', label: field.field_type };

  return (
    <FieldItem $isAdded={isAdded}>
      <FieldInfo>
        <FieldIcon $isAdded={isAdded}>
          {getFieldIcon(field)}
        </FieldIcon>
        <FieldName $isAdded={isAdded} title={field.description || field.field_name}>
          {field.field_alias || field.field_name}
        </FieldName>
        <FieldType color={isAdded ? 'default' : typeConfig.color}>
          {typeConfig.label}
        </FieldType>
        {isAdded && (
          <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '12px' }} />
        )}
      </FieldInfo>
      <AddButton
        type={isAdded ? 'default' : 'primary'}
        size="small"
        icon={<PlusOutlined />}
        disabled={isAdded}
        onClick={() => onAdd(field)}
        title={isAdded ? t('fieldAdded') : t('addField')}
      />
    </FieldItem>
  );
};

interface DataSourcePanelProps {
  dataSources: DataSource[];
  selectedDataSource: string;
  onDataSourceSelect: (sourceId: string) => void;
  addedFields?: string[]; // 已添加的字段名列表
  onFieldAdd?: (field: FieldItem) => void; // 添加字段的回调
  // 新增：多数据源支持
  selectedDataSources?: string[]; // 已选择的数据源列表
  onDataSourcesChange?: (dataSourceIds: string[]) => void; // 数据源选择变化回调
  multiSelectMode?: boolean; // 是否启用多选模式
}

const DataSourcePanel: React.FC<DataSourcePanelProps> = ({
  dataSources,
  selectedDataSource,
  onDataSourceSelect,
  addedFields = [],
  onFieldAdd,
  selectedDataSources,
  onDataSourcesChange,
  multiSelectMode
}) => {
  const { t } = useTranslation('reportManagement');
  const [searchText, setSearchText] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);

  // 获取当前显示的数据源
  const currentDataSources = useMemo(() => {
    if (multiSelectMode && selectedDataSources) {
      return dataSources.filter(ds => selectedDataSources.includes(ds.id));
    } else if (selectedDataSource) {
      return dataSources.filter(ds => ds.id === selectedDataSource);
    }
    return [];
  }, [dataSources, selectedDataSource, selectedDataSources, multiSelectMode]);

  // 合并所有选中数据源的字段分组
  const groupedFields = useMemo(() => {
    const allGroups: { [key: string]: FieldItem[] } = {};
    
    currentDataSources.forEach(dataSource => {
      if (dataSource.fieldGroups) {
        dataSource.fieldGroups.forEach(group => {
          const groupKey = `${dataSource.name} - ${group.name}`;
          if (!allGroups[groupKey]) {
            allGroups[groupKey] = [];
          }
          
          const groupFields = dataSource.fields.filter(field => 
            group.fields.includes(field.field_name)
          );
          allGroups[groupKey].push(...groupFields);
        });
      } else {
        // 如果没有分组，使用数据源名称作为分组
        const groupKey = dataSource.name;
        if (!allGroups[groupKey]) {
          allGroups[groupKey] = [];
      }
        allGroups[groupKey].push(...dataSource.fields);
      }
    });

    return Object.entries(allGroups).map(([name, fields], index) => ({
        id: `group_${index}`,
        name,
      fields
      }));
  }, [currentDataSources]);

  // 过滤字段
  const filterFields = (fields: FieldItem[]) => {
    if (!searchText) return fields;
    
    const searchLower = searchText.toLowerCase();
    return fields.filter(field => {
      return (
        field.field_name.toLowerCase().includes(searchLower) ||
        (field.field_alias?.toLowerCase().includes(searchLower)) ||
        (field.description?.toLowerCase().includes(searchLower))
      );
    });
  };

  // 初始展开所有分组
  useEffect(() => {
    if (groupedFields.length > 0) {
      setExpandedGroups(groupedFields.map(g => g.id));
    }
  }, [groupedFields]);

  const handleFieldAdd = (field: FieldItem) => {
    if (onFieldAdd) {
      // 确保字段包含数据源信息
      const fieldWithSource = {
        ...field,
        qualified_name: field.qualified_name || `${field.source_data_source_id}.${field.field_name}`
      };
      onFieldAdd(fieldWithSource);
    }
  };

  return (
    <PanelContainer>
      <SourceSelector>
        {multiSelectMode ? (
          <Select
            mode="multiple"
            style={{ width: '100%' }}
            placeholder={t('selectDataSources')}
            value={selectedDataSources || []}
            onChange={onDataSourcesChange}
          >
            {dataSources.map(source => (
              <Select.Option key={source.id} value={source.id}>
                <DatabaseOutlined style={{ marginRight: 8 }} />
                {source.name}
              </Select.Option>
            ))}
          </Select>
        ) : (
        <Select
          style={{ width: '100%' }}
          placeholder={t('selectDataSource')}
          value={selectedDataSource || undefined}
          onChange={onDataSourceSelect}
        >
          {dataSources.map(source => (
            <Select.Option key={source.id} value={source.id}>
              <DatabaseOutlined style={{ marginRight: 8 }} />
              {source.name}
            </Select.Option>
          ))}
        </Select>
        )}
      </SourceSelector>

      <FieldsContainer>
        {selectedDataSource && (
          <>
            <SearchContainer>
              <Input
                placeholder={t('searchPlaceholder')}
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                allowClear
              />
            </SearchContainer>
            
            <FieldsList>
              <Collapse 
                activeKey={expandedGroups}
                onChange={keys => setExpandedGroups(keys as string[])}
                expandIconPosition="start"
                items={groupedFields
                  .map(group => {
                  const filteredFields = filterFields(group.fields);
                  if (filteredFields.length === 0) return null;
                  
                  const addedCount = filteredFields.filter(f => 
                    addedFields.includes(f.qualified_name || f.field_name)
                  ).length;
                  
                    return {
                      key: group.id,
                      label: (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span>{group.name}</span>
                          <Badge 
                            count={`${addedCount}/${filteredFields.length}`} 
                            style={{ backgroundColor: addedCount > 0 ? '#52c41a' : '#8c8c8c' }}
                          />
                        </div>
                      ),
                      children: filteredFields.map(field => {
                        const isAdded = addedFields.includes(field.qualified_name || field.field_name);
                        const fieldIcon = getFieldIcon(field);
                        const typeConfig = fieldTypeMap[field.field_type] || { color: 'default', label: field.field_type };
                        
                        // Ensure a unique key. If qualified_name is present, it's unique across data sources.
                        // Otherwise, field_name is unique within its own data source.
                        // For multi-data source display, qualified_name is preferred.
                        const itemKey = field.qualified_name ? field.qualified_name : `${field.source_data_source_id}_${field.field_name}`;

                        return (
                          <FieldItem key={itemKey} $isAdded={isAdded}>
                            <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
                              {fieldIcon}
                              <div style={{ 
                                marginLeft: 8, 
                                flex: 1, 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '8px', 
                                overflow: 'hidden'
                              }}>
                                <span 
                                  style={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flexShrink: 0 }} 
                                  title={field.field_alias || field.field_name}
                                >
                                  {field.field_alias || field.field_name}
                                </span>
                                <Tag 
                                  color={isAdded ? 'default' : typeConfig.color} 
                                  style={{ fontSize: '11px', flexShrink: 0 }}
                                >
                                  {typeConfig.label}
                                </Tag>
                                {multiSelectMode && field.source_data_source_id && (
                                  <Tag 
                                    color="geekblue" 
                                    style={{ fontSize: '11px', flexShrink: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100px' }}
                                    title={dataSources.find(ds => ds.id === field.source_data_source_id)?.name}
                                  >
                                    {dataSources.find(ds => ds.id === field.source_data_source_id)?.name || '未知来源'}
                                  </Tag>
                                )}
                                {field.is_foreign_key && (
                                  <Tag 
                                    color="volcano" 
                                    style={{ fontSize: '11px', flexShrink: 0 }}
                                    title={field.foreign_key_info ? 
                                      `关联到 ${field.foreign_key_info.referenced_table_name}.${field.foreign_key_info.referenced_column_name}` : 
                                      '外键字段'
                                    }
                                  >
                                    FK
                                  </Tag>
                                )}
                                {field.description && (
                                  <span 
                                    style={{ fontSize: '12px', color: '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flexGrow: 1, minWidth: 30 }} 
                                    title={field.description}
                                  >
                                    ({field.description})
                                  </span>
                                )}
                              </div>
                            </div>
                            <Button
                              type="text"
                              size="small"
                              icon={isAdded ? <CheckCircleOutlined /> : <PlusOutlined />}
                              onClick={() => handleFieldAdd(field)}
                              disabled={isAdded}
                              style={{
                                color: isAdded ? '#52c41a' : '#1890ff',
                                marginLeft: '8px',
                                flexShrink: 0,
                              }}
                            />
                          </FieldItem>
                        );
                      })
                    };
                  })
                  .filter(Boolean) as any[]
                }
              />
            </FieldsList>
          </>
        )}
        
        {!selectedDataSource && (
          <Empty
            style={{ marginTop: '50%' }}
            description={t('pleaseSelectDataSource')}
          />
        )}
      </FieldsContainer>
    </PanelContainer>
  );
};

export default DataSourcePanel; 