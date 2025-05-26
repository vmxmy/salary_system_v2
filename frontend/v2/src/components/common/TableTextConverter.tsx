import React, { useState } from 'react';
import { Input, Button, Alert, message, Table, Select, Card } from 'antd';
import { useTranslation } from 'react-i18next';

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
    if (fieldName.includes('日期') || fieldName.includes('时间') || 
        fieldName.includes('date') || fieldName.includes('time')) {
      return 'date';
    } else if (
      // 薪资相关字段
      fieldName.includes('金额') || 
      fieldName.includes('工资') || 
      fieldName.includes('薪资') || 
      fieldName.includes('收入') || 
      fieldName.includes('扣除') ||
      fieldName.includes('绩效') ||
      fieldName.includes('奖励') ||
      fieldName.includes('津贴') ||
      fieldName.includes('补贴') ||
      fieldName.includes('保险') ||
      fieldName.includes('公积金') ||
      fieldName.includes('所得税') ||
      fieldName.includes('应发') ||
      fieldName.includes('实发') ||
      fieldName.includes('扣发') ||
      fieldName.includes('补发') ||
      fieldName.includes('岗位工资') ||
      fieldName.includes('薪级工资') ||
      fieldName.includes('基本工资') ||
      fieldName.includes('基础工资') ||
      fieldName.includes('职务工资') ||
      fieldName.includes('技术工资') ||
      fieldName.includes('级别工资') ||
      fieldName.includes('等级工资') ||
      // 其他数值字段
      fieldName.includes('年龄') || 
      fieldName.includes('工龄') ||
      fieldName.includes('数量') ||
      fieldName.includes('序号') ||
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
        setError('表格数据至少需要包含表头和一行数据');
        return;
      }
      
      // 提取表头和数据
      const headerLine = lines[0];
      const dataLines = lines.slice(1);
      
      // 解析表头
      const headers = headerLine.split(',').map(h => h.trim());
      
      console.log('=== 表格解析开始 ===');
      console.log('解析到的表头字段:', headers);
      console.log('预设映射规则数量:', Object.keys(predefinedMappingRules).length);
      console.log('可用API字段数量:', defaultApiFields.length);
      console.log('API字段详情:', defaultApiFields);
      
      // 特别检查月奖励绩效字段
      const performanceFields = headers.filter(h => h.includes('奖励') || h.includes('绩效'));
      console.log('发现的绩效相关表头字段:', performanceFields);
      
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
          if (header.includes('奖励') || header.includes('绩效')) {
            console.error(`🚨 重要字段缺失映射: ${header}`);
            // 显示相关的映射规则
            const relatedRules = Object.keys(predefinedMappingRules).filter(key => 
              key.includes('奖励') || key.includes('绩效')
            );
            console.log('相关的绩效映射规则:', relatedRules);
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
      setError(`解析错误: ${err.message}`);
    }
  };

  // 更新字段映射
  const updateFieldMapping = (index: number, apiField: string) => {
    const newMappings = [...fieldMappings];
    const selectedApiField = defaultApiFields.find(f => f.key === apiField);
    
    newMappings[index] = {
      ...newMappings[index],
      apiField,
      required: selectedApiField?.required || false
    };
    
    setFieldMappings(newMappings);
  };

  // 转换为JSON
  const convertToJson = () => {
    try {
      console.log('=== 开始转换为JSON ===');
      console.log('字段映射:', fieldMappings);
      
      // 特别检查绩效相关字段的映射
      const performanceMappings = fieldMappings.filter(m => 
        m.tableField.includes('奖励') || m.tableField.includes('绩效')
      );
      console.log('🎯 绩效相关字段映射:', performanceMappings);
      
      const jsonData = parsedData.map((row, rowIndex) => {
        console.log(`\n处理第${rowIndex + 1}行数据:`, row);
        const jsonRow: Record<string, any> = {};
        
        // 特别检查绩效字段的原始数据
        const performanceFieldsInRow = Object.keys(row).filter(key => 
          key.includes('奖励') || key.includes('绩效')
        );
        console.log(`🎯 第${rowIndex + 1}行中的绩效字段:`, performanceFieldsInRow);
        performanceFieldsInRow.forEach(field => {
          console.log(`  ${field}: ${row[field]}`);
        });
        
        fieldMappings.forEach(mapping => {
          console.log(`\n检查映射: ${mapping.tableField} -> ${mapping.apiField}`);
          console.log(`原始值: ${row[mapping.tableField]}`);
          
          // 特别标记绩效字段
          const isPerformanceField = mapping.tableField.includes('奖励') || mapping.tableField.includes('绩效');
          if (isPerformanceField) {
            console.log(`🎯 处理绩效字段: ${mapping.tableField}`);
            console.log(`🎯 映射目标: ${mapping.apiField}`);
            console.log(`🎯 原始值: ${row[mapping.tableField]}`);
          }
          
          // 跳过忽略字段
          if (mapping.isIgnored) {
            console.log(`🚫 忽略字段: ${mapping.tableField} (已标记为忽略)`);
            return;
          }
          
          if (mapping.apiField) {
            let value: any = row[mapping.tableField];
            console.log(`✅ 开始处理映射字段: ${mapping.tableField} (${value}) -> ${mapping.apiField}`);
            
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
                console.log(`🎯 绩效字段数值转换: ${row[mapping.tableField]} -> ${value}`);
              }
            }
            
            // 处理嵌套字段
            if (mapping.apiField.includes('.')) {
              const parts = mapping.apiField.split('.');
              let current = jsonRow;
              
              console.log(`🔧 处理嵌套字段: ${mapping.apiField}, 分割为:`, parts);
              if (isPerformanceField) {
                console.log(`🎯 绩效字段嵌套处理: ${mapping.apiField}`);
              }
              
              // 特殊处理 earnings_details 和 deductions_details
              if (parts.length === 3 && (parts[0] === 'earnings_details' || parts[0] === 'deductions_details') && parts[2] === 'amount') {
                // 格式: earnings_details.COMPONENT_CODE.amount
                const detailsType = parts[0]; // earnings_details 或 deductions_details
                const componentCode = parts[1]; // 组件代码，如 PERFORMANCE_BONUS
                
                if (!current[detailsType]) {
                  current[detailsType] = {};
                  console.log(`📁 创建详情对象: ${detailsType}`);
                }
                
                // 检查是否已经存在该组件
                const existingComponent = current[detailsType][componentCode];
                if (existingComponent) {
                  console.warn(`⚠️ 组件 ${componentCode} 已存在，当前值:`, existingComponent);
                  console.warn(`⚠️ 新字段 ${mapping.tableField} 尝试设置值: ${value}`);
                  
                  // 如果现有值为空或0，而新值不为空，则使用新值
                  const existingAmount = existingComponent.amount;
                  const newAmount = value;
                  
                  if ((!existingAmount || existingAmount === 0 || existingAmount === '') && 
                      (newAmount && newAmount !== 0 && newAmount !== '')) {
                    console.log(`✅ 使用新的非空值: ${mapping.tableField} (${newAmount}) 替换空值`);
                    current[detailsType][componentCode] = {
                      amount: newAmount,
                      name: mapping.tableField
                    };
                  } else if ((existingAmount && existingAmount !== 0 && existingAmount !== '') && 
                            (newAmount && newAmount !== 0 && newAmount !== '')) {
                    // 两个都是非空值，累加
                    const totalAmount = (typeof existingAmount === 'number' ? existingAmount : parseFloat(existingAmount) || 0) + 
                                       (typeof newAmount === 'number' ? newAmount : parseFloat(newAmount) || 0);
                    console.log(`🔢 累加两个非空值: ${existingAmount} + ${newAmount} = ${totalAmount}`);
                    current[detailsType][componentCode] = {
                      amount: totalAmount,
                      name: `${existingComponent.name} + ${mapping.tableField}`
                    };
                  } else {
                    console.log(`⏭️ 保持现有值: ${existingComponent.name} (${existingAmount})`);
                  }
                  
                  if (isPerformanceField) {
                    console.log(`🎯 绩效字段冲突处理结果:`, current[detailsType][componentCode]);
                  }
                } else {
                  // 创建新的组件对象
                  current[detailsType][componentCode] = {
                    amount: value,
                    name: mapping.tableField // 使用原始表格字段名作为显示名称
                  };
                  
                  console.log(`💾 设置组件对象: ${componentCode} =`, current[detailsType][componentCode]);
                  if (isPerformanceField) {
                    console.log(`🎯 绩效字段完整对象设置: ${componentCode} =`, current[detailsType][componentCode]);
                  }
                }
              } else {
                // 常规嵌套字段处理
                // 创建嵌套结构
                for (let i = 0; i < parts.length - 1; i++) {
                  const part = parts[i];
                  if (!current[part]) {
                    current[part] = {};
                    console.log(`📁 创建嵌套对象: ${part}`);
                  }
                  current = current[part];
                }
                
                // 设置最终值
                const finalKey = parts[parts.length - 1];
                current[finalKey] = value;
                console.log(`💾 设置最终值: ${finalKey} = ${value}`);
                if (isPerformanceField) {
                  console.log(`🎯 绩效字段最终设置: ${finalKey} = ${value}`);
                  console.log(`🎯 当前嵌套结构:`, JSON.stringify(current, null, 2));
                }
              }
            } else {
              jsonRow[mapping.apiField] = value;
              console.log(`💾 设置直接字段: ${mapping.apiField} = ${value}`);
              if (isPerformanceField) {
                console.log(`🎯 绩效字段直接设置: ${mapping.apiField} = ${value}`);
              }
            }
          } else {
            console.log(`⚠️ 跳过字段 ${mapping.tableField}: 没有API映射`);
            if (isPerformanceField) {
              console.error(`🚨 绩效字段没有映射: ${mapping.tableField}`);
            }
          }
        });
        
        // 检查最终的earnings_details结构
        console.log('🔍 转换后的earnings_details:', JSON.stringify(jsonRow.earnings_details, null, 2));
        
        // 应用额外的记录处理
        if (processResultRecord) {
          const processedRecord = processResultRecord(jsonRow);
          console.log('🔄 processResultRecord处理后的earnings_details:', JSON.stringify(processedRecord.earnings_details, null, 2));
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
      
      message.success(t(`${namespace}:table_converter.convert_success`, `成功转换${jsonData.length}条记录`));
      
    } catch (err: any) {
      setError(`解析错误: ${err.message}`);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <TextArea
          rows={10}
          value={tableText}
          onChange={e => setTableText(e.target.value)}
          placeholder={t(`${namespace}:table_converter.placeholder`, '请粘贴表格文本，格式如：列名1,列名2,列名3...')}
        />
      </div>
      
      <Button 
        type="primary" 
        onClick={parseTable}
        disabled={!tableText.trim()}
      >
        {t(`${namespace}:table_converter.parse_table`, '解析表格')}
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
          <Card title="字段映射" style={{ marginTop: 16 }}>
            <Table
              dataSource={fieldMappings.map((m, i) => ({ ...m, key: i }))}
              columns={[
                {
                  title: '表格字段',
                  dataIndex: 'tableField',
                  render: (text, record: any) => (
                    <span style={{ 
                      color: record.isIgnored ? '#999' : 'inherit',
                      textDecoration: record.isIgnored ? 'line-through' : 'none'
                    }}>
                      {text}
                      {record.isIgnored && <span style={{ color: '#ff9500', marginLeft: 8 }}>🚫 已忽略</span>}
                    </span>
                  )
                },
                {
                  title: 'API字段',
                  dataIndex: 'apiField',
                  render: (text, record: any) => {
                    if (record.isIgnored) {
                      return (
                        <span style={{ color: '#ff9500', fontWeight: 'bold' }}>
                          🚫 忽略此字段 (预设规则)
                        </span>
                      );
                    }
                    
                    return (
                      <Select
                        style={{ width: '100%' }}
                        value={text}
                        onChange={value => updateFieldMapping(record.key, value)}
                        showSearch
                        optionFilterProp="children"
                        filterOption={(input, option) => {
                          if (!option?.children) return false;
                          // 将children转换为字符串进行搜索
                          const searchText = String(option.children).toLowerCase();
                          return searchText.includes(input.toLowerCase());
                        }}
                        placeholder="选择API字段或搜索..."
                      >
                        <Option value="">忽略此字段</Option>
                        {defaultApiFields.map(field => (
                          <Option key={field.key} value={field.key}>
                            {field.label} {field.required ? '(必填)' : ''} 
                            <span style={{ color: '#999', fontSize: '12px' }}>
                              {field.key.includes('earnings_details') ? ' [收入]' : 
                               field.key.includes('deductions_details') ? ' [扣除]' : ' [基础]'}
                            </span>
                          </Option>
                        ))}
                      </Select>
                    );
                  }
                },
                {
                  title: '数据类型',
                  dataIndex: 'type'
                }
              ]}
              pagination={false}
              size="small"
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