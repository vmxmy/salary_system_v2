import React, { useState, useEffect } from 'react';
import { Card, Table, Select, Tag, Typography, Alert, Button, Tooltip } from 'antd';
import * as fuzzball from 'fuzzball';
// import * as nodejieba from 'nodejieba';
import type { RawImportData, ImportModeConfig, FieldConfig } from '../types/universal';
import { getPayrollComponentDefinitionsOptimized } from '../../../../../api/optimizedApi';

const { Text } = Typography;
const { Option } = Select;

// 注入CSS样式
const customStyles = `
  .confidence-medium .ant-select-selector {
    border-color: #FAAD14 !important; /* 微弱的黄色 */
  }
  .confidence-low .ant-select-selector {
    border-color: #FF7A45 !important; /* 微弱的橙色 */
  }
`;

interface FieldMappingProps {
  rawImportData: RawImportData;
  modeConfig: ImportModeConfig;
  onMappingComplete: (mapping: Record<string, string>) => void;
}

// 添加薪资组件定义接口
interface PayrollComponentDefinition {
  id: number;
  code: string;
  name: string;
  type: string;
  description?: string;
  display_order?: number;
  is_active: boolean;
}

const FieldMapping: React.FC<FieldMappingProps> = ({
  rawImportData,
  modeConfig,
  onMappingComplete,
}) => {
  const { headers } = rawImportData;
  const [systemFields, setSystemFields] = useState<FieldConfig[]>([...modeConfig.requiredFields, ...modeConfig.optionalFields]);
  const [loading, setLoading] = useState(true);

  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [confidence, setConfidence] = useState<Record<string, number>>({});

  // 从 localStorage 获取缓存的薪资组件
  const getCachedComponents = (): PayrollComponentDefinition[] => {
    try {
      const cached = localStorage.getItem('payroll_components_cache');
      if (cached) {
        const data = JSON.parse(cached);
        const cacheTime = data.timestamp;
        const cacheExpiry = 24 * 60 * 60 * 1000; // 24小时过期
        
        if (Date.now() - cacheTime < cacheExpiry) {
          console.log('🔄 [FieldMapping] 使用缓存的薪资组件:', data.components.length);
          return data.components;
        }
      }
    } catch (error) {
      console.warn('📦 [FieldMapping] 缓存读取失败:', error);
    }
    return [];
  };

  // 缓存薪资组件到 localStorage
  const cacheComponents = (components: PayrollComponentDefinition[]) => {
    try {
      const cacheData = {
        components,
        timestamp: Date.now()
      };
      localStorage.setItem('payroll_components_cache', JSON.stringify(cacheData));
      console.log('📦 [FieldMapping] 薪资组件已缓存');
    } catch (error) {
      console.warn('📦 [FieldMapping] 缓存写入失败:', error);
    }
  };

  // 智能降级：根据现有数据生成基础字段
  const generateFallbackFields = (cachedComponents?: PayrollComponentDefinition[]): FieldConfig[] => {
    // 如果有缓存组件，使用缓存数据
    if (cachedComponents && cachedComponents.length > 0) {
      console.log('🔄 [FieldMapping] 使用缓存组件生成降级字段');
      return generateDynamicFields(cachedComponents);
    }

    // 否则使用基础硬编码字段（最后的保障）
    console.log('🔄 [FieldMapping] 使用硬编码基础字段作为最后降级方案');
    return [
      {
        key: 'earnings_details.BASIC_SALARY.amount',
        name: '基本工资',
        type: 'number',
        category: 'earning',
        required: false,
        description: '基本工资金额'
      },
      {
        key: 'earnings_details.PERFORMANCE_BONUS.amount',
        name: '绩效奖金',
        type: 'number',
        category: 'earning',
        required: false,
        description: '绩效奖金金额'
      },
      {
        key: 'earnings_details.OVERTIME_PAY.amount',
        name: '加班费',
        type: 'number',
        category: 'earning',
        required: false,
        description: '加班费金额'
      },
      {
        key: 'deductions_details.SOCIAL_INSURANCE.amount',
        name: '社会保险',
        type: 'number',
        category: 'deduction',
        required: false,
        description: '社会保险金额'
      },
      {
        key: 'deductions_details.INDIVIDUAL_TAX.amount',
        name: '个人所得税',
        type: 'number',
        category: 'deduction',
        required: false,
        description: '个人所得税金额'
      },
      {
        key: 'deductions_details.HOUSING_FUND.amount',
        name: '住房公积金',
        type: 'number',
        category: 'deduction',
        required: false,
        description: '住房公积金金额'
      }
    ];
  };

  // 生成动态字段的通用函数
  const generateDynamicFields = (components: PayrollComponentDefinition[]): FieldConfig[] => {
    const dynamicFields: FieldConfig[] = [];
    
    components.forEach(component => {
      // 为每个薪资组件生成点号语法字段
      let targetField = '';
      let category: any = 'other';
      
      if (component.type === 'EARNING') {
        targetField = `earnings_details.${component.code}.amount`;
        category = 'earning';
      } else if (component.type === 'PERSONAL_DEDUCTION' || component.type === 'DEDUCTION' || component.type === 'EMPLOYER_DEDUCTION') {
        targetField = `deductions_details.${component.code}.amount`;
        category = 'deduction';
      }
      
      if (targetField) {
        dynamicFields.push({
          key: targetField,
          name: component.name,
          type: 'number',
          category: category,
          required: false,
          description: component.description || component.name
        });
      }
    });
    
    return dynamicFields;
  };

  // 动态加载薪资组件字段
  useEffect(() => {
    const loadPayrollComponents = async () => {
      try {
        setLoading(true);
        console.log('🔍 [FieldMapping] 开始加载薪资组件...');
        
        // 1. 首先尝试从缓存获取
        const cachedComponents = getCachedComponents();
        if (cachedComponents.length > 0) {
          const dynamicFields = generateDynamicFields(cachedComponents);
          const allFields = [...modeConfig.requiredFields, ...modeConfig.optionalFields, ...dynamicFields];
          setSystemFields(allFields);
          setLoading(false);
          return;
        }
        
        // 2. 尝试从优化端点获取
        console.log('🔍 [FieldMapping] 使用优化端点获取薪资组件...');
        const response = await getPayrollComponentDefinitionsOptimized({ 
          is_active: true, 
          size: 100  // 修改为符合后端限制的最大值
        });
        
        console.log('🔍 [FieldMapping] 优化端点响应:', response);
        const components: PayrollComponentDefinition[] = response.data || [];
        
        console.log('🔍 [FieldMapping] 加载到薪资组件:', components.length);
        
        // 3. 缓存获取到的组件数据
        if (components.length > 0) {
          cacheComponents(components);
        }
        
        // 4. 生成动态字段并设置
        const dynamicFields = generateDynamicFields(components);
        console.log('🔍 [FieldMapping] 生成动态字段:', dynamicFields.length);
        console.log('🔍 [FieldMapping] 点号语法字段示例:', dynamicFields.slice(0, 3));
        
        // 合并基础字段和动态字段
        const allFields = [...modeConfig.requiredFields, ...modeConfig.optionalFields, ...dynamicFields];
        setSystemFields(allFields);
        
      } catch (error) {
        console.error('❌ [FieldMapping] 加载薪资组件失败:', error);
        
        // 5. 智能降级处理
        const cachedComponents = getCachedComponents();
        const fallbackFields = generateFallbackFields(cachedComponents);
        
        console.log(`🔄 [FieldMapping] 使用降级方案，提供字段:`, {
          fallbackFieldsCount: fallbackFields.length,
          source: cachedComponents.length > 0 ? 'cached_data' : 'hardcoded_basic'
        });
        
        // 合并基础字段和降级字段
        const allFields = [...modeConfig.requiredFields, ...modeConfig.optionalFields, ...fallbackFields];
        setSystemFields(allFields);
        
      } finally {
        setLoading(false);
      }
    };
    
    loadPayrollComponents();
  }, [modeConfig]);

  /**
   * 计算两个中文文本的 Jaccard 相似度
   * @param text1 文本1
   * @param text2 文本2
   * @returns 相似度分数 (0-100)
   */
  const calculateChineseSimilarity = (text1: string, text2: string): number => {
    if (!text1 || !text2) return 0;

    // 使用 fuzzball 的 token_set_ratio 算法，它对中文分词和乱序有很好的效果
    // 它会标记出共同的词元，并基于此计算相似度
    return fuzzball.token_set_ratio(text1, text2);
  };

  const autoMapFields = () => {
    const newMapping: Record<string, string> = {};
    const newConfidence: Record<string, number> = {};

    headers.forEach(header => {
      let bestMatch: { key: string; score: number } | null = null;
      
      systemFields.forEach(field => {
        const score = calculateChineseSimilarity(header, field.name);
        if (score > (bestMatch?.score ?? 0)) {
          bestMatch = { key: field.key, score: score };
        }
      });
      
      if (bestMatch && (bestMatch as any).score > 50) { // 设置一个匹配阈值
        newMapping[header] = (bestMatch as any).key;
        newConfidence[header] = (bestMatch as any).score;
      }
    });
    setMapping(newMapping);
    setConfidence(newConfidence);
  };

  useEffect(() => {
    onMappingComplete(mapping);
  }, [mapping, onMappingComplete]);

  const handleMappingChange = (excelHeader: string, systemFieldKey: string | null) => {
    setMapping(prev => ({
      ...prev,
      [excelHeader]: systemFieldKey || '',
    }));
    // 用户手动修改后，清除置信度标识
    setConfidence(prev => {
      const newConf = { ...prev };
      delete newConf[excelHeader];
      return newConf;
    });
  };

  const getConfidenceClass = (header: string): string => {
    const score = confidence[header];
    if (score === undefined) return '';
    if (score < 60) return 'confidence-low';
    if (score < 90) return 'confidence-medium';
    return '';
  };

  const columns = [
    {
      title: 'Excel 列名',
      dataIndex: 'header',
      key: 'header',
      width: 250,
      render: (header: string) => <Text strong>{header}</Text>,
    },
    {
      title: '映射到系统字段',
      dataIndex: 'header',
      key: 'mapping',
      width: 350,
      render: (header: string) => (
        <Tooltip title={confidence[header] ? `自动匹配置信度: ${confidence[header].toFixed(0)}%` : ''}>
          <Select
            allowClear
            showSearch
            value={mapping[header] || null}
            style={{ width: '100%' }}
            placeholder="选择一个系统字段进行映射"
            className={getConfidenceClass(header)}
            onChange={(value) => handleMappingChange(header, value)}
            filterOption={(input, option) =>
              (option?.search ?? '').toLowerCase().includes(input.toLowerCase())
            }
          >
            {systemFields.map(field => (
              <Option key={field.key} value={field.key} search={`${field.name} ${field.key}`}>
                {field.name} ({field.key}) {modeConfig.requiredFields.some(f => f.key === field.key) ? <Tag color="red">必填</Tag> : ''}
              </Option>
            ))}
          </Select>
        </Tooltip>
      ),
    },
  ];

  if (loading) {
    return (
      <Card title="字段映射" loading>
        <Alert message="正在加载薪资组件定义..." type="info" />
      </Card>
    );
  }

  return (
    <>
      <style>{customStyles}</style>
      <Card 
        title="字段映射"
        extra={<Button onClick={autoMapFields}>尝试自动映射</Button>}
      >
        <Alert
          message="请为您上传的Excel文件中的每一列，选择一个对应的系统字段进行映射。置信度较低的匹配项会以彩色边框突出显示。"
          type="info"
          showIcon
          style={{ marginBottom: 20 }}
        />
        <Table
          columns={columns}
          dataSource={headers.map(h => ({ header: h }))}
          rowKey="header"
          pagination={false}
          bordered
          scroll={{ x: 'max-content' }}
        />
      </Card>
    </>
  );
};

export default FieldMapping; 