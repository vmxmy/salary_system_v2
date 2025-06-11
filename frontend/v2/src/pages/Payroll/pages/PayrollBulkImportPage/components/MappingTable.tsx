import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Select,
  Progress,
  Tag,
  message,
  Button,
  Tooltip,
  Space
} from 'antd';
import {
  ThunderboltOutlined,
  InfoCircleOutlined,
  SettingOutlined
} from '@ant-design/icons';
import type { MappingRule } from '../types/index';
import { FIELD_TYPE_CONFIG } from '../types/constants';
// 移除旧的字段映射引用，现在使用动态字段选项
import { getPayrollComponentDefinitions } from '../../../services/payrollBulkImportApi';
import { 
  performSmartMapping, 
  applySmartMappingToRules,
  DEFAULT_CONFIG,
  type SmartMappingResult,
  type SmartMappingConfig
} from '../utils/smartMapping';
import SmartMappingStats from './SmartMappingStats';
import SmartMappingConfigPanel from './SmartMappingConfig';

const { Option, OptGroup } = Select;

interface MappingTableProps {
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

const MappingTable: React.FC<MappingTableProps> = ({
  mappingRules,
  onMappingRulesChange
}) => {
  const [fieldOptions, setFieldOptions] = useState<Record<string, FieldOption[]>>({});
  const [loading, setLoading] = useState(true);
  const [smartMappingResults, setSmartMappingResults] = useState<SmartMappingResult[]>([]);
  const [showSmartRecommendations, setShowSmartRecommendations] = useState(false);
  const [showConfigPanel, setShowConfigPanel] = useState(false);
  const [smartMappingConfig, setSmartMappingConfig] = useState<SmartMappingConfig>(DEFAULT_CONFIG);

  // 获取工资组件定义数据
  useEffect(() => {
    const fetchComponentDefinitions = async () => {
      try {
        setLoading(true);
        console.log('🔍 [MappingTable] 开始获取工资组件定义...');
        
        // 🔧 分页获取所有记录，解决API size=100限制问题
        let allComponents: PayrollComponentDefinition[] = [];
        let currentPage = 1;
        let hasMore = true;
        
        while (hasMore) {
          const requestParams = {
            is_active: true,  // 只获取活跃记录
            size: 100,        // 后端最大限制是100
            page: currentPage
          };
          
          console.log(`📋 [MappingTable] 请求第${currentPage}页参数:`, requestParams);
          
          const response = await getPayrollComponentDefinitions(requestParams);
          
          console.log(`📊 [MappingTable] 第${currentPage}页API响应:`, {
            dataLength: response.data?.length,
            totalCount: response.meta?.total,
            currentPage: response.meta?.page,
            totalPages: response.meta?.totalPages
          });
          
          if (response.data && Array.isArray(response.data) && response.data.length > 0) {
            allComponents = [...allComponents, ...response.data];
            // 检查是否还有更多页
            hasMore = response.meta?.page < response.meta?.totalPages;
            currentPage++;
          } else {
            hasMore = false;
          }
        }
        
        console.log('✅ [MappingTable] 总共获取到工资组件定义:', allComponents.length, '个');
        
        if (allComponents.length > 0) {
          // 🔍 详细分析所有组件
          const typeStats: Record<string, number> = {};
          const activeStats: Record<string, number> = {};
          allComponents.forEach((comp, index) => {
            if (index < 10) {  // 只显示前10个用于调试
              console.log(`📝 [MappingTable] 组件 ${index + 1}:`, {
                code: comp.code,
                name: comp.name,
                type: comp.type,
                is_active: comp.is_active,
                display_order: comp.display_order
              });
            }
            
            // 统计类型分布
            typeStats[comp.type] = (typeStats[comp.type] || 0) + 1;
            
            // 统计活跃状态
            const activeKey = comp.is_active ? 'active' : 'inactive';
            activeStats[activeKey] = (activeStats[activeKey] || 0) + 1;
          });
          
          console.log('📈 [MappingTable] 组件类型统计:', typeStats);
          console.log('📈 [MappingTable] 活跃状态统计:', activeStats);
          
          generateFieldOptions(allComponents);
        } else {
          console.error('❌ [MappingTable] 未获取到任何工资组件定义');
          handleFieldOptionsFetchError();
        }
      } catch (error: any) {
        console.error('❌ [MappingTable] 获取工资组件定义失败:', error);
        console.error('❌ [MappingTable] 错误详情:', {
          message: error.message,
          stack: error.stack,
          response: error.response?.data
        });
        message.warning('获取字段选项失败，将仅支持AI智能映射');
        handleFieldOptionsFetchError();
      } finally {
        setLoading(false);
      }
    };

    fetchComponentDefinitions();
  }, []);

  /**
   * 💡 根据工资组件定义生成字段选项
   */
  const generateFieldOptions = (definitions: PayrollComponentDefinition[]) => {
    console.log('🔧 [MappingTable] 开始生成动态字段选项...');
    console.log('🔧 [MappingTable] 输入组件数量:', definitions.length);
    
    const options: Record<string, FieldOption[]> = {
      base: [],        // 基础信息
      earning: [],     // 收入项
      deduction: [],   // 扣除项  
      calculated: [], // 计算结果
      stat: [],       // 统计项
      other: [],      // 其他
      special: []     // 特殊字段
    };

    // 基础字段（固定）
    options.base = [
      { value: 'lastName', label: '姓', category: 'base' },
      { value: 'firstName', label: '名', category: 'base' },
      { value: 'split_full_name', label: '姓名 (自动拆分为姓和名)', category: 'base' },
      { value: 'employee_code', label: '员工工号', category: 'base' },
      { value: 'department', label: '部门', category: 'base' },
      { value: 'id_number', label: '身份证号码', category: 'base' },
      { value: 'employee_category', label: '人员身份', category: 'base' },
      { value: 'job_level', label: '人员职级', category: 'base' }
    ];

    console.log('🔧 [MappingTable] 基础字段已添加:', options.base.length, '个');

    // 🔍 筛选条件调试 - 只显示活跃记录
    const filteredDefinitions = definitions.filter(comp => {
      return comp.is_active === true;  // 只显示活跃的组件
    });
    
    console.log('🔍 [MappingTable] 筛选后组件数量:', filteredDefinitions.length);
    console.log('🔍 [MappingTable] 原始组件数量:', definitions.length);

    // 根据组件定义动态生成选项
    filteredDefinitions.forEach((component, index) => {
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
        case 'CALCULATION_BASE':
          targetGroup = 'calculated';
          targetField = `calculation_bases.${component.code}.amount`;
          break;
        case 'CALCULATION_RATE':
          targetGroup = 'calculated';
          targetField = `calculation_rates.${component.code}.rate`;
          break;
        case 'STAT':
          targetGroup = 'stat';
          targetField = `stats.${component.code}.amount`;
          break;
        case 'OTHER':
          targetGroup = 'other';
          targetField = `other_fields.${component.code}`;
          break;
        default:
          targetGroup = 'other';
          targetField = `other_fields.${component.code}`;
          console.log('⚠️ [MappingTable] 未知组件类型:', component.type, '组件:', component.name);
      }

      // 🔍 调试每个组件的处理过程
      if (index < 20) {  // 显示前20个组件的处理过程
        console.log(`🔧 [MappingTable] 处理组件 ${index + 1}:`, {
          code: component.code,
          name: component.name,
          type: component.type,
          targetGroup,
          targetField,
          is_active: component.is_active
        });
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
    
    console.log('✅ [MappingTable] 动态字段选项生成完成:', {
      base: options.base.length,
      earning: options.earning.length,
      deduction: options.deduction.length,
      calculated: options.calculated.length,
      stat: options.stat.length,
      other: options.other.length,
      special: options.special.length,
      total: Object.values(options).reduce((sum, arr) => sum + arr.length, 0)
    });
    
    // 🔍 详细显示每个分组的内容（前5个）
    Object.keys(options).forEach(groupKey => {
      const group = options[groupKey];
      if (group.length > 0) {
        console.log(`📋 [MappingTable] ${groupKey} 分组 (${group.length}个):`, 
          group.slice(0, 5).map(item => ({
            value: item.value,
            label: item.label,
            componentType: item.component?.type
          }))
        );
        if (group.length > 5) {
          console.log(`   ... 还有 ${group.length - 5} 个字段`);
        }
      }
    });
  };

  /**
   * 处理字段选项获取失败的情况
   */
  const handleFieldOptionsFetchError = () => {
    console.error('❌ [MappingTable] 动态字段选项获取失败，禁用手动映射功能');
    
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
    message.error('字段选项加载失败，请检查网络连接。您仍可以使用AI智能映射功能。');
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

  // 🤖 执行智能字段映射
  const performIntelligentMapping = () => {
    console.log('🤖 [MappingTable] 开始执行智能字段映射...');
    console.log('🤖 [MappingTable] 使用配置:', smartMappingConfig);
    
    // 准备源字段列表
    const sourceFields = mappingRules.map(rule => rule.sourceField);
    
    // 准备目标选项列表
    const allTargetOptions = Object.values(fieldOptions).flat();
    
    if (sourceFields.length === 0 || allTargetOptions.length === 0) {
      message.warning('请先上传数据或等待字段选项加载完成');
      return;
    }
    
    // 执行智能映射 - 使用当前配置
    const results = performSmartMapping(sourceFields, allTargetOptions, smartMappingConfig);
    setSmartMappingResults(results);
    setShowSmartRecommendations(true);
    
    // 自动应用高置信度推荐
    const newRules = mappingRules.map(rule => {
      const smartResult = results.find(r => r.sourceField === rule.sourceField);
      if (smartResult?.bestMatch && smartResult.bestMatch.confidence >= smartMappingConfig.thresholds.autoApply) {
        return {
          ...rule,
          targetField: smartResult.bestMatch.targetField,
          confidence: smartResult.bestMatch.confidence,
          category: smartResult.bestMatch.category as any
        };
      }
      return rule;
    });
    
    // 更新映射规则
    onMappingRulesChange(newRules);
    
    // 统计结果
    const highConfidenceMatches = results.filter(r => 
      r.bestMatch && r.bestMatch.confidence > smartMappingConfig.thresholds.highConfidence
    );
    const autoAppliedMatches = results.filter(r => 
      r.bestMatch && r.bestMatch.confidence >= smartMappingConfig.thresholds.autoApply
    );
    const mediumConfidenceMatches = results.filter(r => 
      r.bestMatch && 
      r.bestMatch.confidence > smartMappingConfig.thresholds.mediumConfidence && 
      r.bestMatch.confidence <= smartMappingConfig.thresholds.highConfidence
    );
    
    message.success(`智能映射完成！自动应用: ${autoAppliedMatches.length}个，高置信度: ${highConfidenceMatches.length}个，中等置信度: ${mediumConfidenceMatches.length}个`);
    
    console.log('🤖 [MappingTable] 智能映射结果:', {
      total: results.length,
      autoApplied: autoAppliedMatches.length,
      highConfidence: highConfidenceMatches.length,
      mediumConfidence: mediumConfidenceMatches.length,
      config: smartMappingConfig,
      results
    });
  };

  // 🚀 应用智能映射推荐
  const applySmartRecommendations = (confidenceThreshold?: number) => {
    if (smartMappingResults.length === 0) {
      message.warning('请先执行智能映射');
      return;
    }
    
    // 使用配置中的自动应用阈值，或传入的阈值
    const threshold = confidenceThreshold !== undefined ? confidenceThreshold : smartMappingConfig.thresholds.autoApply;
    
    console.log(`🚀 [MappingTable] 应用智能映射推荐，置信度阈值: ${threshold}`);
    console.log(`🚀 [MappingTable] 使用配置:`, smartMappingConfig);
    
    const allTargetOptions = Object.values(fieldOptions).flat();
    const sourceFields = mappingRules.map(r => r.sourceField);
    const currentSimpleRules = mappingRules.map(r => ({ 
      sourceField: r.sourceField, 
      targetField: r.targetField 
    }));
    
    const newSimpleRules = applySmartMappingToRules(
      sourceFields,
      allTargetOptions,
      currentSimpleRules,
      smartMappingConfig
    );
    
    // 转换回完整的映射规则格式
    const newRules = newSimpleRules.map(simpleRule => {
      const existingRule = mappingRules.find(r => r.sourceField === simpleRule.sourceField);
      return {
        ...existingRule,
        sourceField: simpleRule.sourceField,
        targetField: simpleRule.targetField
      } as MappingRule;
    });
    
    onMappingRulesChange(newRules);
    
    const appliedCount = newRules.length - mappingRules.length + 
      newRules.filter((newRule, index) => {
        const oldRule = mappingRules[index];
        return oldRule && newRule.targetField !== oldRule.targetField;
      }).length;
    
    message.success(`已应用 ${appliedCount} 个智能映射推荐`);
  };

  // 获取源字段的智能推荐
  const getSmartRecommendations = (sourceField: string) => {
    const result = smartMappingResults.find(r => r.sourceField === sourceField);
    return result?.recommendations || [];
  };

  // 渲染智能推荐选项
  const renderSmartRecommendations = (sourceField: string) => {
    const recommendations = getSmartRecommendations(sourceField);
    
    if (!showSmartRecommendations || recommendations.length === 0) {
      return null;
    }
    
    return (
      <div style={{ marginTop: 8 }}>
        <div style={{ fontSize: '12px', color: '#666', marginBottom: 4 }}>
          🤖 智能推荐 (置信度)：
        </div>
        {recommendations.slice(0, smartMappingConfig.advanced.maxRecommendations).map((rec, index) => (
          <Tag
            key={rec.targetField}
            color={
              rec.confidence > smartMappingConfig.thresholds.highConfidence ? 'green' : 
              rec.confidence > smartMappingConfig.thresholds.mediumConfidence ? 'orange' : 'default'
            }
            style={{ 
              marginBottom: 2, 
              cursor: 'pointer',
              fontSize: '11px'
            }}
            onClick={() => handleMappingChange(sourceField, rec.targetField)}
          >
            {rec.targetLabel} ({(rec.confidence * 100).toFixed(0)}%)
          </Tag>
        ))}
      </div>
    );
  };

  // 🎛️ 配置面板处理函数
  const handleConfigChange = (newConfig: SmartMappingConfig) => {
    setSmartMappingConfig(newConfig);
    console.log('🎛️ [MappingTable] 配置已更新:', newConfig);
  };

  const handleApplyNewConfig = () => {
    console.log('🎛️ [MappingTable] 应用新配置并重新运行智能映射');
    setShowConfigPanel(false);
    // 重新运行智能映射以应用新配置
    performIntelligentMapping();
  };

  return (
    <div>
      {/* 🎛️ 智能映射参数配置面板 */}
      <SmartMappingConfigPanel
        config={smartMappingConfig}
        onConfigChange={handleConfigChange}
        onApplyConfig={handleApplyNewConfig}
        visible={showConfigPanel}
        onClose={() => setShowConfigPanel(false)}
      />

      {/* 智能映射统计 */}
      <SmartMappingStats 
        smartResults={smartMappingResults}
        mappingRules={mappingRules}
        config={smartMappingConfig}
      />

      <Card 
        title="字段映射详情" 
        loading={loading}
        extra={
          <Space>
            <Tooltip title="调整智能映射算法参数">
              <Button
                type="default"
                icon={<SettingOutlined />}
                onClick={() => setShowConfigPanel(true)}
                size="small"
              >
                参数配置
              </Button>
            </Tooltip>
            <Tooltip title="使用AI算法智能推荐字段映射">
              <Button
                type="primary"
                icon={<ThunderboltOutlined />}
                onClick={performIntelligentMapping}
                disabled={loading || mappingRules.length === 0}
                size="small"
              >
                智能映射
              </Button>
            </Tooltip>
            {smartMappingResults.length > 0 && (
              <Tooltip title="应用高置信度的智能映射推荐">
                <Button
                  type="default"
                  icon={<InfoCircleOutlined />}
                  onClick={() => applySmartRecommendations()}
                  size="small"
                >
                  应用推荐
                </Button>
              </Tooltip>
            )}
          </Space>
        }
      >
      <Table
        dataSource={mappingRules}
        rowKey="sourceField"
        pagination={false}
        columns={[
          {
            title: '源字段',
            dataIndex: 'sourceField',
            width: 150,
            render: (sourceField: string) => (
              <div>
                <div>{sourceField}</div>
                {renderSmartRecommendations(sourceField)}
              </div>
            )
          },
          {
            title: '目标字段',
            dataIndex: 'targetField',
            width: 200,
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
                
                {/* 选择层：用于修改映射 - 现在使用动态选项 */}
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
                  {fieldOptions.base && fieldOptions.base.length > 0 && (
                    <OptGroup label="👤 基础信息">
                      {fieldOptions.base.map(option => (
                        <Option key={option.value} value={option.value}>
                          {option.label}
                        </Option>
                      ))}
                    </OptGroup>
                  )}
                  
                  {fieldOptions.earning && fieldOptions.earning.length > 0 && (
                    <OptGroup label="💰 收入项目">
                      {fieldOptions.earning.map(option => (
                        <Option key={option.value} value={option.value}>
                          {option.label}
                        </Option>
                      ))}
                    </OptGroup>
                  )}
                  
                  {fieldOptions.deduction && fieldOptions.deduction.length > 0 && (
                    <OptGroup label="📉 扣除项目">
                      {fieldOptions.deduction.map(option => (
                        <Option key={option.value} value={option.value}>
                          {option.label}
                        </Option>
                      ))}
                    </OptGroup>
                  )}
                  
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
                  
                  {fieldOptions.special && fieldOptions.special.length > 0 && (
                    <OptGroup label="🔧 特殊字段">
                      {fieldOptions.special.map(option => (
                        <Option key={option.value} value={option.value}>
                          {option.label}
                        </Option>
                      ))}
                    </OptGroup>
                  )}
                </Select>
              </div>
            ),
          },
          {
            title: '置信度',
            dataIndex: 'confidence',
            width: 120,
            render: (value, record) => {
              // 获取智能映射结果的置信度
              const smartResult = smartMappingResults.find(r => r.sourceField === record.sourceField);
              const confidence = smartResult?.bestMatch?.confidence || value || 0;
              
              return (
                <div>
                  <Progress
                    percent={Math.round(confidence * 100)}
                    size="small"
                    status={confidence >= smartMappingConfig.thresholds.highConfidence ? 'success' : 
                           confidence >= smartMappingConfig.thresholds.mediumConfidence ? 'normal' : 'exception'}
                  />
                  <div style={{ fontSize: '11px', color: '#666', textAlign: 'center' }}>
                    {(confidence * 100).toFixed(0)}%
                  </div>
                </div>
              );
            },
          },
          {
            title: '字段类型',
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
    </div>
  );
};

export default MappingTable; 