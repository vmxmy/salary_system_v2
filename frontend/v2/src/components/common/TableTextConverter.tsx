import React, { useState } from 'react';
import { Input, Button, Alert, message, Select, Card } from 'antd';
import { useTranslation } from 'react-i18next';
import type { ProColumns } from '@ant-design/pro-components';
import EnhancedProTable from './EnhancedProTable';

const { TextArea } = Input;
const { Option } = Select;

interface FieldMapping {
  tableField: string;
  apiField: string;
  required: boolean;
  type: 'string' | 'date' | 'number' | 'boolean';
  specialHandler?: string;
  isIgnored?: boolean; // 标识是否为忽略字段
}

interface ApiField {
  key: string;
  label: string;
  required: boolean;
}

export interface TableTextConverterProps {
  namespace?: string;
  defaultApiFields: ApiField[];
  predefinedMappingRules: Record<string, string>;
  specialHandlers?: Record<string, (value: any) => any>;
  processResultRecord?: (record: Record<string, any>) => Record<string, any>;
  onConvertToJson?: (jsonData: any[]) => void;
}

const TableTextConverter: React.FC<TableTextConverterProps> = ({
  namespace = 'common',
  defaultApiFields,
  predefinedMappingRules,
  specialHandlers = {},
  processResultRecord,
  onConvertToJson
}) => {
  const { t } = useTranslation([namespace, 'common']);
  const [tableText, setTableText] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [showMappingInterface, setShowMappingInterface] = useState<boolean>(false);
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([]);
  const [parsedData, setParsedData] = useState<any[]>([]);

  // 根据字段名猜测数据类型
  const getFieldType = (fieldName: string): 'string' | 'date' | 'number' | 'boolean' => {
    if (fieldName.includes({t('components:auto_text_e697a5')}) || fieldName.includes({t('components:auto_text_e697b6')}) || 
        fieldName.includes('date') || fieldName.includes('time')) {
      return 'date';
    } else if (
      // 薪资相关字段
      fieldName.includes({t('components:auto_text_e98791')}) || 
      fieldName.includes({t('components:auto_text_e5b7a5')}) || 
      fieldName.includes({t('components:auto_text_e896aa')}) || 
      fieldName.includes({t('components:auto_text_e694b6')}) || 
      fieldName.includes({t('components:auto_text_e689a3')}) ||
      fieldName.includes({t('components:auto_text_e7bba9')}) ||
      fieldName.includes({t('components:auto_text_e5a596')}) ||
      fieldName.includes({t('components:auto_text_e6b4a5')}) ||
      fieldName.includes({t('components:auto_text_e8a1a5')}) ||
      fieldName.includes({t('components:auto_text_e4bf9d')}) ||
      fieldName.includes({t('components:auto_text_e585ac')}) ||
      fieldName.includes({t('components:auto_text_e68980')}) ||
      fieldName.includes({t('components:auto_text_e5ba94')}) ||
      fieldName.includes({t('components:auto_text_e5ae9e')}) ||
      fieldName.includes({t('components:auto_text_e689a3')}) ||
      fieldName.includes({t('components:auto_text_e8a1a5')}) ||
      fieldName.includes({t('components:auto_text_e5b297')}) ||
      fieldName.includes({t('components:auto_text_e896aa')}) ||
      fieldName.includes({t('components:auto_text_e59fba')}) ||
      fieldName.includes({t('components:auto_text_e59fba')}) ||
      fieldName.includes({t('components:auto_text_e8818c')}) ||
      fieldName.includes({t('components:auto_text_e68a80')}) ||
      fieldName.includes({t('components:auto_text_e7baa7')}) ||
      fieldName.includes({t('components:auto_text_e7ad89')}) ||
      // 其他数值字段
      fieldName.includes({t('components:auto_text_e5b9b4')}) || 
      fieldName.includes({t('components:auto_text_e5b7a5')}) ||
      fieldName.includes({t('components:auto_text_e695b0')}) ||
      fieldName.includes({t('components:auto_text_e5ba8f')}) ||
      // 英文字段
      fieldName.includes('amount') ||
      fieldName.includes('salary') ||
      fieldName.includes('pay') ||
      fieldName.includes('price') ||
      fieldName.includes('bonus') ||
      fieldName.includes('allowance') ||
      fieldName.includes('deduction') ||
      fieldName.includes('tax')
    ) {
      return 'number';
    } else {
      return 'string';
    }
  };

  // 格式化日期
  const formatDate = (dateStr: string): string => {
    if (!dateStr) return '';
    
    // 如果已经是YYYY-MM-DD格式，直接返回
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }
    
    // 尝试解析其他格式的日期
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      return `${year}-${month}-${day}`;
    } catch (e) {
      return dateStr;
    }
  };

  // 格式化数值
  const formatNumber = (numStr: string): number => {
    if (!numStr) return 0;
    
    // 移除所有非数字、小数点和负号字符
    const cleanedStr = numStr.replace(/[^\d.-]/g, '');
    const number = parseFloat(cleanedStr);
    
    return isNaN(number) ? 0 : number;
  };

  // 解析表格，显示字段映射界面
  const parseTable = () => {
    try {
      // 分割行
      const lines = tableText.trim().split('\n');
      
      if (lines.length < 2) {
        setError({t('components:auto_text_e8a1a8')});
        return;
      }
      
      // 提取表头和数据
      const headerLine = lines[0];
      const dataLines = lines.slice(1);
      
      // 解析表头
      const headers = headerLine.split(',').map(h => h.trim());
      
      console.log({t('components:auto____3d3d3d')});
      console.log({t('components:auto___e8a7a3')}, headers);
      console.log({t('components:auto___e9a284')}, Object.keys(predefinedMappingRules).length);
      console.log({t('components:auto_api__e58faf')}, defaultApiFields.length);
      console.log({t('components:auto_api__415049')}, defaultApiFields);
      
      // 特别检查月奖励绩效字段
      const performanceFields = headers.filter(h => h.includes({t('components:auto_text_e5a596')}) || h.includes({t('components:auto_text_e7bba9')}));
      console.log({t('components:auto___e58f91')}, performanceFields);
      
      // 创建字段映射
      const fieldMappings: FieldMapping[] = headers.map(header => {
        // 尝试从预设规则中匹配
        let apiField = predefinedMappingRules[header] || '';
        let isIgnored = false;
        
        // 处理忽略字段标识
        if (apiField === '__IGNORE_FIELD__') {
          isIgnored = true;
          apiField = ''; // 转换为空字符串，但保留标识信息
        }
        
        const apiFieldInfo = defaultApiFields.find(f => f.key === apiField);
        
        // 调试信息
        console.log(`表格字段映射: "${header}" -> "${apiField}"`);
        if (!apiField) {
          console.warn(`❌ 未找到字段 "${header}" 的映射规则`);
          // 特别检查是否是绩效相关字段
          if (header.includes({t('components:auto_text_e5a596')}) || header.includes({t('components:auto_text_e7bba9')})) {
            console.error({t('components:auto___header__f09f9a')});
            // 显示相关的映射规则
            const relatedRules = Object.keys(predefinedMappingRules).filter(key => 
              key.includes({t('components:auto_text_e5a596')}) || key.includes({t('components:auto_text_e7bba9')})
            );
            console.log({t('components:auto___e79bb8')}, relatedRules);
            relatedRules.forEach(rule => {
              console.log(`  "${rule}" -> "${predefinedMappingRules[rule]}"`);
            });
          }
        } else {
          console.log(`✅ 字段映射成功: "${header}" -> "${apiField}"`);
        }
        
        // 设置特殊处理器
        let specialHandler: string | undefined = undefined;
        if (specialHandlers[apiField]) {
          specialHandler = apiField;
        }
        
        const fieldType = getFieldType(header);
        console.log(`字段类型识别: "${header}" -> ${fieldType}`);
        
        return {
          tableField: header,
          apiField: apiField,
          required: apiFieldInfo?.required || false,
          type: fieldType,
          specialHandler: specialHandler,
          isIgnored: isIgnored
        };
      });
      
      // 解析数据行
      const parsedRows = dataLines.map(line => {
        const values = line.split(',').map(v => v.trim());
        const row: Record<string, string> = {};
        
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        
        return row;
      });
      
      // 保存解析的数据和字段映射
      setFieldMappings(fieldMappings);
      setParsedData(parsedRows);
      setShowMappingInterface(true);
      setError(null);
      
    } catch (err: any) {
      setError({t('components:auto__err_message__e8a7a3')});
    }
  };

  // 更新字段映射
  const updateFieldMapping = (index: number, apiField: string) => {
    const newMappings = [...fieldMappings];
    const selectedApiField = defaultApiFields.find(f => f.key === apiField);
    
    // 检查是否选择了忽略字段
    const isIgnored = apiField === '' || apiField === '__IGNORE_FIELD__';
    
    newMappings[index] = {
      ...newMappings[index],
      apiField: isIgnored ? '' : apiField,
      required: selectedApiField?.required || false,
      isIgnored: isIgnored
    };
    
    setFieldMappings(newMappings);
  };

  // 转换为JSON
  const convertToJson = () => {
    try {
      console.log({t('components:auto__json__3d3d3d')});
      console.log({t('components:auto___e5ad97')}, fieldMappings);
      
      // 特别检查绩效相关字段的映射
      const performanceMappings = fieldMappings.filter(m => 
        m.tableField.includes({t('components:auto_text_e5a596')}) || m.tableField.includes({t('components:auto_text_e7bba9')})
      );
      console.log({t('components:auto____f09f8e')}, performanceMappings);
      
      const jsonData = parsedData.map((row, rowIndex) => {
        console.log({t('components:auto__n_rowindex_1___5c6ee5')}, row);
        const jsonRow: Record<string, any> = {};
        
        // 特别检查绩效字段的原始数据
        const performanceFieldsInRow = Object.keys(row).filter(key => 
          key.includes({t('components:auto_text_e5a596')}) || key.includes({t('components:auto_text_e7bba9')})
        );
        console.log({t('components:auto___rowindex_1___f09f8e')}, performanceFieldsInRow);
        performanceFieldsInRow.forEach(field => {
          console.log(`  ${field}: ${row[field]}`);
        });
        
        fieldMappings.forEach(mapping => {
          console.log({t('components:auto__n_mapping_tablefield_mapping_apifield__5c6ee6')});
          console.log({t('components:auto__row_mapping_tablefield__e58e9f')});
          
          // 特别标记绩效字段
          const isPerformanceField = mapping.tableField.includes({t('components:auto_text_e5a596')}) || mapping.tableField.includes({t('components:auto_text_e7bba9')});
          if (isPerformanceField) {
            console.log({t('components:auto___mapping_tablefield__f09f8e')});
            console.log({t('components:auto___mapping_apifield__f09f8e')});
            console.log({t('components:auto___row_mapping_tablefield__f09f8e')});
          }
          
          // 跳过忽略字段
          if (mapping.isIgnored) {
            console.log({t('components:auto___mapping_tablefield___f09f9a')});
            return;
          }
          
          if (mapping.apiField) {
            let value: any = row[mapping.tableField];
            console.log({t('components:auto___mapping_tablefield_value_mapping_apifield__e29c85')});
            
            // 特殊处理
            if (mapping.specialHandler && specialHandlers[mapping.specialHandler]) {
              const handlerResult = specialHandlers[mapping.specialHandler](value);
              // 如果处理器返回一个对象，合并到jsonRow
              if (typeof handlerResult === 'object' && handlerResult !== null) {
                Object.assign(jsonRow, handlerResult);
                return; // 跳过常规处理
              } else {
                value = handlerResult;
              }
            }
            
            // 数据类型转换
            if (mapping.type === 'date' && value) {
              value = formatDate(value);
            } else if (mapping.type === 'number' && value) {
              value = formatNumber(value);
              if (isPerformanceField) {
                console.log({t('components:auto___row_mapping_tablefield_value__f09f8e')});
              }
            }
            
            // 处理嵌套字段
            if (mapping.apiField.includes('.')) {
              const parts = mapping.apiField.split('.');
              let current = jsonRow;
              
              console.log({t('components:auto___mapping_apifield___f09f94')}, parts);
              if (isPerformanceField) {
                console.log({t('components:auto___mapping_apifield__f09f8e')});
              }
              
              // 特殊处理 earnings_details 和 deductions_details
              if (parts.length === 3 && (parts[0] === 'earnings_details' || parts[0] === 'deductions_details') && parts[2] === 'amount') {
                // 格式: earnings_details.COMPONENT_CODE.amount
                const detailsType = parts[0]; // earnings_details 或 deductions_details
                const componentCode = parts[1]; // 组件代码，如 PERFORMANCE_BONUS
                
                if (!current[detailsType]) {
                  current[detailsType] = {};
                  console.log({t('components:auto___detailstype__f09f93')});
                }
                
                // 检查是否已经存在该组件
                const existingComponent = current[detailsType][componentCode];
                if (existingComponent) {
                  console.warn({t('components:auto___componentcode____e29aa0')}, existingComponent);
                  console.warn({t('components:auto___mapping_tablefield__value__e29aa0')});
                  
                  // 如果现有值为空或0，而新值不为空，则使用新值
                  const existingAmount = existingComponent.amount;
                  const newAmount = value;
                  
                  if ((!existingAmount || existingAmount === 0 || existingAmount === '') && 
                      (newAmount && newAmount !== 0 && newAmount !== '')) {
                    console.log({t('components:auto___mapping_tablefield_newamount__e29c85')});
                    current[detailsType][componentCode] = {
                      amount: newAmount,
                      name: mapping.tableField
                    };
                  } else if ((existingAmount && existingAmount !== 0 && existingAmount !== '') && 
                            (newAmount && newAmount !== 0 && newAmount !== '')) {
                    // 两个都是非空值，累加
                    const totalAmount = (typeof existingAmount === 'number' ? existingAmount : parseFloat(existingAmount) || 0) + 
                                       (typeof newAmount === 'number' ? newAmount : parseFloat(newAmount) || 0);
                    console.log({t('components:auto___existingamount_newamount_totalamount__f09f94')});
                    current[detailsType][componentCode] = {
                      amount: totalAmount,
                      name: `${existingComponent.name} + ${mapping.tableField}`
                    };
                  } else {
                    console.log({t('components:auto___existingcomponent_name_existingamount__e28fad')});
                  }
                  
                  if (isPerformanceField) {
                    console.log({t('components:auto____f09f8e')}, current[detailsType][componentCode]);
                  }
                } else {
                  // 创建新的组件对象
                  current[detailsType][componentCode] = {
                    amount: value,
                    name: mapping.tableField // 使用原始表格字段名作为显示名称
                  };
                  
                  console.log({t('components:auto___componentcode__f09f92')}, current[detailsType][componentCode]);
                  if (isPerformanceField) {
                    console.log({t('components:auto___componentcode__f09f8e')}, current[detailsType][componentCode]);
                  }
                }
              } else {
                // 常规嵌套字段处理
                // 创建嵌套结构
                for (let i = 0; i < parts.length - 1; i++) {
                  const part = parts[i];
                  if (!current[part]) {
                    current[part] = {};
                    console.log({t('components:auto___part__f09f93')});
                  }
                  current = current[part];
                }
                
                // 设置最终值
                const finalKey = parts[parts.length - 1];
                current[finalKey] = value;
                console.log({t('components:auto___finalkey_value__f09f92')});
                if (isPerformanceField) {
                  console.log({t('components:auto___finalkey_value__f09f8e')});
                  console.log({t('components:auto____f09f8e')}, JSON.stringify(current, null, 2));
                }
              }
            } else {
              jsonRow[mapping.apiField] = value;
              console.log({t('components:auto___mapping_apifield_value__f09f92')});
              if (isPerformanceField) {
                console.log({t('components:auto___mapping_apifield_value__f09f8e')});
              }
            }
          } else {
            console.log({t('components:auto___mapping_tablefield_api_e29aa0')});
            if (isPerformanceField) {
              console.error({t('components:auto___mapping_tablefield__f09f9a')});
            }
          }
        });
        
        // 检查最终的earnings_details结构
        console.log({t('components:auto__earnings_details__f09f94')}, JSON.stringify(jsonRow.earnings_details, null, 2));
        
        // 应用额外的记录处理
        if (processResultRecord) {
          const processedRecord = processResultRecord(jsonRow);
          console.log({t('components:auto__processresultrecordearnings_details__f09f94')}, JSON.stringify(processedRecord.earnings_details, null, 2));
          return processedRecord;
        }
        
        return jsonRow;
      });
      
      // 清空表格输入和隐藏映射界面
      setTableText('');
      setShowMappingInterface(false);
      setFieldMappings([]);
      setParsedData([]);
      setError(null);
      
      // 如果传入了回调函数，调用它
      if (onConvertToJson) {
        onConvertToJson(jsonData);
      } else {
        // 否则使用事件方式传递给父组件
        window.dispatchEvent(new CustomEvent('tableConverterResult', { 
          detail: { jsonData } 
        }));
      }
      
      message.success(t(`${namespace}:table_converter.convert_success`, {t('components:auto__jsondata_length__e68890')}));
      
    } catch (err: any) {
      setError({t('components:auto__err_message__e8a7a3')});
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <TextArea
          rows={10}
          value={tableText}
          onChange={e => setTableText(e.target.value)}
          placeholder={t(`${namespace}:table_converter.placeholder`, {t('components:auto___1_2_3__e8afb7')})}
        />
      </div>
      
      <Button 
        type="primary" 
        onClick={parseTable}
        disabled={!tableText.trim()}
      >
        {t(`${namespace}:table_converter.parse_table`, {t('components:auto_text_e8a7a3')})}
      </Button>
      
      {error && (
        <Alert
          message={error}
          type="error"
          style={{ marginTop: 16 }}
          closable
          onClose={() => setError(null)}
        />
      )}
      
      {showMappingInterface && (
        <>
          <Card title={t('components:auto_text_e5ad97')} style={{ marginTop: 16 }}>
            <EnhancedProTable<FieldMapping & { key: number }>
              dataSource={fieldMappings.map((m, i) => ({ ...m, key: i }))}
              columns={[
                {
                  title: {t('components:auto_text_e8a1a8')},
                  dataIndex: 'tableField',
                  valueType: 'text',
                  render: (_, record) => (
                    <span style={{ 
                      color: record.isIgnored ? '#999' : 'inherit',
                      textDecoration: record.isIgnored ? 'line-through' : 'none'
                    }}>
                      {record.tableField}
                      {record.isIgnored && <span style={{ color: '#ff9500', marginLeft: 8 }}>🚫 已忽略</span>}
                    </span>
                  )
                },
                {
                  title: {t('components:auto_api_415049')},
                  dataIndex: 'apiField',
                  valueType: 'select',
                  render: (_, record) => {
                    if (record.isIgnored) {
                      return (
                        <span style={{ color: '#ff9500', fontWeight: 'bold' }}>
                          🚫 忽略此字段 (预设规则)
                        </span>
                      );
                    }
                    
                    return (
                      <Select
                        style={{ 
                          width: '100%',
                          backgroundColor: record.apiField === '' ? '#fff7e6' : 'inherit' // 忽略字段使用橙色背景
                        }}
                        value={record.apiField}
                        onChange={value => updateFieldMapping(record.key, value)}
                        showSearch
                        optionFilterProp="children"
                        filterOption={(input, option) => {
                          if (!option?.children) return false;
                          // 将children转换为字符串进行搜索
                          const searchText = String(option.children).toLowerCase();
                          return searchText.includes(input.toLowerCase());
                        }}
                        placeholder={t('components:auto_api__e98089')}
                      >
                        <Option value="" style={{ backgroundColor: '#fff7e6', color: '#d46b08' }}>
                          🚫 忽略此字段
                        </Option>
                        {defaultApiFields.map(field => (
                          <Option key={field.key} value={field.key}>
                            {field.label} {field.required ? {t('components:auto____28e5bf')} : ''} 
                            <span style={{ color: '#999', fontSize: '12px' }}>
                              {field.key.includes('earnings_details') ? {t('components:auto____205be6')} : 
                               field.key.includes('deductions_details') ? {t('components:auto____205be6')} : {t('components:auto____205be5')}}
                            </span>
                          </Option>
                        ))}
                      </Select>
                    );
                  }
                },
                {
                  title: {t('components:auto_text_e695b0')},
                  dataIndex: 'type',
                  valueType: 'text'
                }
              ] as ProColumns<FieldMapping & { key: number }>[]}
              pagination={false}
              size="small"
              search={false}
              enableAdvancedFeatures={false}
              showToolbar={false}
            />
          </Card>
          
          <Button
            type="primary"
            onClick={convertToJson}
            style={{ marginTop: 16 }}
          >
            转换为JSON
          </Button>
        </>
      )}
    </div>
  );
};

export default TableTextConverter;