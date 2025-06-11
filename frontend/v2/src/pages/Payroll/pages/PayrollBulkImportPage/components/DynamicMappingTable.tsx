import React, { useState, useEffect } from 'react';
import { Card, Table, Select, Progress, Tag, Space, message } from 'antd';
import type { MappingRule } from '../types/index';
import { FIELD_TYPE_CONFIG } from '../types/constants';
// 移除旧的字段映射引用，现在使用动态字段选项
import { getPayrollComponentDefinitions } from '../../../services/payrollBulkImportApi';

const { Option, OptGroup } = Select;

interface DynamicMappingTableProps {
  mappingRules: MappingRule[];
  onMappingRulesChange: (rules: MappingRule[]) => void;
}

// 工资组件定义接口
interface PayrollComponentDefinition {
  id: number;
  code: string;
  name: string;
  type: string;
  description?: string;
  display_order?: number;
  is_active: boolean;
}

// 选项接口
interface FieldOption {
  value: string;
  label: string;
  component?: PayrollComponentDefinition;
  category: string;
}

/**
 * 💡 动态映射表组件 - 使用工资组件定义表的中文名称
 * 解决硬编码问题，动态从数据库获取字段选项
 */
const DynamicMappingTable: React.FC<DynamicMappingTableProps> = ({
  mappingRules,
  onMappingRulesChange
}) => {
  const [componentDefinitions, setComponentDefinitions] = useState<PayrollComponentDefinition[]>([]);
  const [fieldOptions, setFieldOptions] = useState<Record<string, FieldOption[]>>({});
  const [loading, setLoading] = useState(true);

  // 获取工资组件定义数据
  useEffect(() => {
    const fetchComponentDefinitions = async () => {
      try {
        setLoading(true);
        console.log('🔍 [DynamicMappingTable] 开始获取工资组件定义...');
        
        const response = await getPayrollComponentDefinitions({
          is_active: true,
          size: 200 // 获取更多数据
        });
        
        if (response.data && Array.isArray(response.data)) {
          console.log('✅ [DynamicMappingTable] 获取到工资组件定义:', response.data.length, '个');
          setComponentDefinitions(response.data);
          generateFieldOptions(response.data);
        } else {
          console.error('❌ [DynamicMappingTable] 工资组件定义数据格式异常:', response);
          message.error('获取工资组件定义失败：数据格式异常');
        }
      } catch (error) {
        console.error('❌ [DynamicMappingTable] 获取工资组件定义失败:', error);
        message.error('获取工资组件定义失败，将使用默认选项');
        // 回退到默认选项
        handleFieldOptionsFetchError();
      } finally {
        setLoading(false);
      }
    };

    fetchComponentDefinitions();
  }, []);

  /**
   * 📋 根据工资组件定义生成字段选项
   * @param definitions 工资组件定义列表
   */
  const generateFieldOptions = (definitions: PayrollComponentDefinition[]) => {
    console.log('🔧 [DynamicMappingTable] 开始生成字段选项...');
    
    const options: Record<string, FieldOption[]> = {
      base: [], // 基础信息
      earning: [], // 收入项
      deduction: [], // 扣除项  
      calculated: [], // 计算结果
      stat: [], // 统计项
      other: [], // 其他
      special: [] // 特殊字段
    };

    // 基础字段（固定）
    options.base = [
      { value: 'employee_full_name', label: '员工姓名', category: 'base' },
      { value: 'employee_code', label: '员工工号', category: 'base' },
      { value: 'department', label: '部门', category: 'base' },
      { value: 'id_number', label: '身份证号码', category: 'base' },
      { value: 'employee_category', label: '人员身份', category: 'base' },
      { value: 'job_level', label: '人员职级', category: 'base' }
    ];

    // 根据组件定义动态生成选项
    definitions.forEach(component => {
      let targetGroup: string;
      let targetField: string;

      // 根据组件类型确定分组和目标字段
      switch (component.type) {
        case 'EARNING':
          targetGroup = 'earning';
          targetField = `earnings_details.${component.code}.amount`;
          break;
        case 'PERSONAL_DEDUCTION':
        case 'DEDUCTION':
          targetGroup = 'deduction';
          targetField = `deductions_details.${component.code}.amount`;
          break;
        case 'EMPLOYER_DEDUCTION':
          targetGroup = 'deduction';
          targetField = `employer_deductions.${component.code}.amount`;
          break;
        case 'CALCULATION_RESULT':
          targetGroup = 'calculated';
          targetField = `calculation_results.${component.code}.amount`;
          break;
        case 'STAT':
          targetGroup = 'stat';
          targetField = `stats.${component.code}.amount`;
          break;
        default:
          targetGroup = 'other';
          targetField = `other_fields.${component.code}`;
      }

      // 添加到对应分组
      options[targetGroup].push({
        value: targetField,
        label: component.name, // 💡 直接使用数据库中的中文名称
        component,
        category: targetGroup
      });
    });

    // 特殊字段（固定）
    options.special = [
      { value: '__CALCULATED_FIELD__', label: '【计算字段】由系统自动计算', category: 'special' },
      { value: '__SOCIAL_INSURANCE_GROUP__', label: '【社保组合】建议拆分为具体险种', category: 'special' },
      { value: '__IGNORE_FIELD__', label: '【忽略】不导入此字段', category: 'special' },
      { value: '__ROW_NUMBER__', label: '【行号】用于标识记录序号', category: 'special' },
      { value: '__UNMAPPED_FIELD__', label: '【未映射】需要手动指定目标字段', category: 'special' }
    ];

    // 按名称排序（除了特殊字段）
    Object.keys(options).forEach(groupKey => {
      if (groupKey !== 'special' && groupKey !== 'base') {
        options[groupKey].sort((a, b) => {
          // 优先使用 display_order，其次使用名称
          if (a.component?.display_order && b.component?.display_order) {
            return a.component.display_order - b.component.display_order;
          }
          return a.label.localeCompare(b.label);
        });
      }
    });

    setFieldOptions(options);
    
    console.log('✅ [DynamicMappingTable] 字段选项生成完成:', {
      base: options.base.length,
      earning: options.earning.length,
      deduction: options.deduction.length,
      calculated: options.calculated.length,
      stat: options.stat.length,
      other: options.other.length,
      special: options.special.length
    });
  };

  /**
   * 🔄 处理字段选项获取失败的情况
   */
  const handleFieldOptionsFetchError = () => {
    console.error('❌ [DynamicMappingTable] 动态字段选项获取失败，系统将无法提供手动映射功能');
    
    // 设置最少的特殊选项
    const minimalOptions: Record<string, FieldOption[]> = {
      base: [],
      earning: [],
      deduction: [],
      calculated: [],
      stat: [],
      other: [],
      special: [
        { value: '__IGNORE_FIELD__', label: '【忽略】不导入此字段', category: 'special' }
      ]
    };

    setFieldOptions(minimalOptions);
    message.error('字段选项加载失败，请检查网络连接或数据库配置');
  };

  // 处理映射规则变更
  const handleMappingChange = (sourceField: string, targetField: string) => {
    const newRules = mappingRules.map(r => 
      r.sourceField === sourceField 
        ? { ...r, targetField: targetField }
        : r
    );
    onMappingRulesChange(newRules);
  };

  // 获取字段显示名称（优先使用组件定义中的名称）
  const getDynamicFieldDisplayName = (fieldValue: string): string => {
    // 在所有选项中查找
    for (const groupOptions of Object.values(fieldOptions)) {
      const option = groupOptions.find(opt => opt.value === fieldValue);
      if (option) {
        return option.label;
      }
    }
    
    // 回退到字段值本身
    return fieldValue || '未选择';
  };

  return (
    <Card title="字段映射详情" loading={loading}>
      <Table
        dataSource={mappingRules}
        rowKey="sourceField"
        pagination={false}
        size="small"
        columns={[
          {
            title: '源字段',
            dataIndex: 'sourceField',
            width: 150,
            ellipsis: true,
          },
          {
            title: '目标字段',
            dataIndex: 'targetField',
            width: 300,
            render: (text, record) => (
              <div>
                {/* 显示层：显示中文名称 */}
                <div style={{ 
                  marginBottom: 4, 
                  fontSize: '12px', 
                  color: text ? '#1890ff' : '#999',
                  fontWeight: text ? 'bold' : 'normal'
                }}>
                  {text ? getDynamicFieldDisplayName(text) : '请选择目标字段'}
                </div>
                
                {/* 选择层：用于修改映射 */}
                <Select
                  style={{ width: '100%' }}
                  value={text}
                  placeholder="请选择目标字段"
                  showSearch
                  allowClear
                  size="small"
                  loading={loading}
                  filterOption={(input, option) => {
                    const searchText = input.toLowerCase();
                    const children = option?.children?.toString().toLowerCase() || '';
                    return children.includes(searchText);
                  }}
                  optionFilterProp="children"
                  onChange={(value) => handleMappingChange(record.sourceField, value)}
                >
                  {/* 动态生成选项组 */}
                  <OptGroup label="👤 基础信息">
                    {fieldOptions.base?.map(option => (
                      <Option key={option.value} value={option.value}>
                        {option.label}
                      </Option>
                    ))}
                  </OptGroup>
                  
                  <OptGroup label="💰 收入项目">
                    {fieldOptions.earning?.map(option => (
                      <Option key={option.value} value={option.value}>
                        {option.label}
                      </Option>
                    ))}
                  </OptGroup>
                  
                  <OptGroup label="📉 扣除项目">
                    {fieldOptions.deduction?.map(option => (
                      <Option key={option.value} value={option.value}>
                        {option.label}
                      </Option>
                    ))}
                  </OptGroup>
                  
                  {fieldOptions.calculated && fieldOptions.calculated.length > 0 && (
                    <OptGroup label="📊 计算结果">
                      {fieldOptions.calculated.map(option => (
                        <Option key={option.value} value={option.value}>
                          {option.label}
                        </Option>
                      ))}
                    </OptGroup>
                  )}
                  
                  {fieldOptions.stat && fieldOptions.stat.length > 0 && (
                    <OptGroup label="📈 统计项目">
                      {fieldOptions.stat.map(option => (
                        <Option key={option.value} value={option.value}>
                          {option.label}
                        </Option>
                      ))}
                    </OptGroup>
                  )}
                  
                  {fieldOptions.other && fieldOptions.other.length > 0 && (
                    <OptGroup label="🏷️ 其他字段">
                      {fieldOptions.other.map(option => (
                        <Option key={option.value} value={option.value}>
                          {option.label}
                        </Option>
                      ))}
                    </OptGroup>
                  )}
                  
                  <OptGroup label="🔧 特殊字段">
                    {fieldOptions.special?.map(option => (
                      <Option key={option.value} value={option.value}>
                        {option.label}
                      </Option>
                    ))}
                  </OptGroup>
                </Select>
              </div>
            ),
          },
          {
            title: '置信度',
            dataIndex: 'confidence',
            width: 120,
            render: (value) => (
              <div>
                <Progress
                  percent={Math.round(value * 100)}
                  size="small"
                  status={value >= 0.8 ? 'success' : value >= 0.6 ? 'normal' : 'exception'}
                />
              </div>
            ),
          },
          {
            title: '类型',
            dataIndex: 'category',
            width: 100,
            render: (category: string) => {
              const config = FIELD_TYPE_CONFIG[category as keyof typeof FIELD_TYPE_CONFIG] || FIELD_TYPE_CONFIG.base;
              return <Tag color={config.color}>{config.text}</Tag>;
            },
          },
          {
            title: '必填',
            dataIndex: 'required',
            width: 80,
            render: (required) => required ? <Tag color="red">必填</Tag> : <Tag>可选</Tag>,
          },
        ]}
      />
    </Card>
  );
};

export default DynamicMappingTable; 