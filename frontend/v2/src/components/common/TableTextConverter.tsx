import React, { useState } from 'react';
import { Input, Button, Table, Select, Card, Alert, Space, message } from 'antd';
import { useTranslation } from 'react-i18next';

const { TextArea } = Input;
const { Option } = Select;

interface FieldMapping {
  tableField: string;
  apiField: string;
  required: boolean;
  type: 'string' | 'date' | 'number' | 'boolean';
  specialHandler?: string;
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
}

const TableTextConverter: React.FC<TableTextConverterProps> = ({
  namespace = 'common',
  defaultApiFields,
  predefinedMappingRules,
  specialHandlers = {},
  processResultRecord
}) => {
  const { t } = useTranslation([namespace, 'common']);
  const [tableText, setTableText] = useState<string>('');
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([]);
  const [jsonResult, setJsonResult] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // 解析表格文本
  const parseTableText = () => {
    try {
      // 分割行
      const lines = tableText.trim().split('\n');
      
      // 提取表头和数据
      const headerLine = lines[0];
      const dataLines = lines.slice(1);
      
      // 解析表头
      const headers = headerLine.split(',').map(h => h.trim());
      
      // 初始化字段映射
      const initialMappings: FieldMapping[] = headers.map(header => {
        // 尝试从预设规则中匹配
        const apiField = predefinedMappingRules[header] || '';
        const apiFieldInfo = defaultApiFields.find(f => f.key === apiField);
        
        // 设置特殊处理器
        let specialHandler: string | undefined = undefined;
        if (specialHandlers[apiField]) {
          specialHandler = apiField;
        }
        
        return {
          tableField: header,
          apiField: apiField,
          required: apiFieldInfo?.required || false,
          type: getFieldType(header),
          specialHandler: specialHandler
        };
      });
      
      setFieldMappings(initialMappings);
      
      // 解析数据行
      const parsedRows = dataLines.map(line => {
        const values = line.split(',').map(v => v.trim());
        const row: Record<string, string> = {};
        
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        
        return row;
      });
      
      setParsedData(parsedRows);
      setError(null);
    } catch (err: any) {
      setError(`解析错误: ${err.message}`);
      setParsedData([]);
    }
  };

  // 根据字段名猜测数据类型
  const getFieldType = (fieldName: string): 'string' | 'date' | 'number' | 'boolean' => {
    if (fieldName.includes('日期') || fieldName.includes('时间') || 
        fieldName.includes('date') || fieldName.includes('time')) {
      return 'date';
    } else if (
      fieldName.includes('金额') || 
      fieldName.includes('工资') || 
      fieldName.includes('薪资') || 
      fieldName.includes('收入') || 
      fieldName.includes('扣除') ||
      fieldName.includes('年龄') || 
      fieldName.includes('工龄') ||
      fieldName.includes('数量') ||
      fieldName.includes('金额') ||
      fieldName.includes('amount') ||
      fieldName.includes('salary') ||
      fieldName.includes('pay') ||
      fieldName.includes('price')
    ) {
      return 'number';
    } else {
      return 'string';
    }
  };

  // 更新字段映射
  const updateFieldMapping = (index: number, apiField: string) => {
    const newMappings = [...fieldMappings];
    const selectedApiField = defaultApiFields.find(f => f.key === apiField);
    
    // 设置特殊处理器
    let specialHandler: string | undefined = undefined;
    if (specialHandlers[apiField]) {
      specialHandler = apiField;
    }
    
    newMappings[index] = {
      ...newMappings[index],
      apiField,
      required: selectedApiField?.required || false,
      specialHandler: specialHandler
    };
    
    setFieldMappings(newMappings);
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

  // 验证映射
  const validateMapping = () => {
    // 检查必填字段是否已映射
    const requiredFields = defaultApiFields.filter(field => field.required);
    const mappedFields = fieldMappings.filter(map => map.apiField);
    
    const missingRequiredFields = requiredFields.filter(field => 
      !mappedFields.some(map => map.apiField === field.key)
    );

    if (missingRequiredFields.length > 0) {
      message.error(`以下必填字段未映射: ${missingRequiredFields.map(field => field.label).join(', ')}`);
      return false;
    }

    return true;
  };

  // 转换为JSON
  const convertToJson = () => {
    // 验证映射
    if (!validateMapping()) {
      return;
    }
    
    try {
      const jsonData = parsedData.map(row => {
        const jsonRow: Record<string, any> = {};
        
        fieldMappings.forEach(mapping => {
          if (mapping.apiField) {
            let value = row[mapping.tableField];
            
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
            }
            
            // 处理嵌套字段
            if (mapping.apiField.includes('.')) {
              const parts = mapping.apiField.split('.');
              let current = jsonRow;
              
              // 创建嵌套结构
              for (let i = 0; i < parts.length - 1; i++) {
                const part = parts[i];
                if (!current[part]) {
                  current[part] = {};
                }
                current = current[part];
              }
              
              // 设置最终值
              current[parts[parts.length - 1]] = value;
            } else {
              jsonRow[mapping.apiField] = value;
            }
          }
        });
        
        // 应用额外的记录处理
        if (processResultRecord) {
          return processResultRecord(jsonRow);
        }
        
        return jsonRow;
      });
      
      setJsonResult(JSON.stringify(jsonData, null, 2));
      setError(null);
    } catch (err: any) {
      setError(`转换错误: ${err.message}`);
    }
  };

  return (
    <Card title={t(`${namespace}:table_converter.title`, '表格文本转换器')}>
      <div style={{ marginBottom: 16 }}>
        <TextArea
          rows={10}
          value={tableText}
          onChange={e => setTableText(e.target.value)}
          placeholder={t(`${namespace}:table_converter.placeholder`, '请粘贴表格文本，格式如：列名1,列名2,列名3...')}
        />
      </div>
      
      <Button type="primary" onClick={parseTableText}>
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
      
      {parsedData.length > 0 && (
        <>
          <Card title={t(`${namespace}:table_converter.field_mapping`, '字段映射')} style={{ marginTop: 16 }}>
            <Table
              dataSource={fieldMappings.map((m, i) => ({ ...m, key: i }))}
              columns={[
                {
                  title: t(`${namespace}:table_converter.table_field`, '表格字段'),
                  dataIndex: 'tableField'
                },
                {
                  title: t(`${namespace}:table_converter.api_field`, 'API字段'),
                  dataIndex: 'apiField',
                  render: (text, record: any) => (
                    <Select
                      style={{ width: '100%' }}
                      value={text}
                      onChange={value => updateFieldMapping(record.key, value)}
                    >
                      <Option value="">{t(`${namespace}:table_converter.ignore_field`, '忽略此字段')}</Option>
                      {defaultApiFields.map(field => (
                        <Option key={field.key} value={field.key}>
                          {field.label} {field.required ? `(${t('common:required', '必填')})` : ''}
                        </Option>
                      ))}
                    </Select>
                  )
                },
                {
                  title: t(`${namespace}:table_converter.data_type`, '数据类型'),
                  dataIndex: 'type',
                  render: (text) => text
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
            {t(`${namespace}:table_converter.convert_to_json`, '转换为JSON')}
          </Button>
          
          {jsonResult && (
            <Card title={t(`${namespace}:table_converter.json_result`, 'JSON结果')} style={{ marginTop: 16 }}>
              <TextArea
                rows={10}
                value={jsonResult}
                readOnly
              />
              <Space style={{ marginTop: 8 }}>
                <Button
                  onClick={() => navigator.clipboard.writeText(jsonResult)}
                >
                  {t(`${namespace}:table_converter.copy_json`, '复制JSON')}
                </Button>
                <Button
                  type="primary"
                  onClick={() => {
                    try {
                      const jsonData = JSON.parse(jsonResult);
                      setTableText('');
                      setParsedData([]);
                      setFieldMappings([]);
                      setJsonResult('');
                      // 将JSON结果传递给父组件
                      window.dispatchEvent(new CustomEvent('tableConverterResult', { 
                        detail: { jsonData } 
                      }));
                    } catch (e) {
                      setError(t(`${namespace}:table_converter.json_parse_error`, 'JSON解析错误，无法使用结果'));
                    }
                  }}
                >
                  {t(`${namespace}:table_converter.use_json`, '使用此JSON')}
                </Button>
              </Space>
            </Card>
          )}
        </>
      )}
    </Card>
  );
};

export default TableTextConverter;