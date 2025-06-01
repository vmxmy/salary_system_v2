import React, { useState } from 'react';
import { Input, Button, Select, Card, Alert, Space, message } from 'antd';
import { useTranslation } from 'react-i18next';
import { nanoid } from 'nanoid';
import type { ProColumns } from '@ant-design/pro-components';
import EnhancedProTable from '../../../components/common/EnhancedProTable';
import i18n from '../../../i18n';

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

const PayrollTableTextConverter: React.FC = () => {
  const { t } = useTranslation(['payroll', 'common']);
  const [tableText, setTableText] = useState<string>('');
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([]);
  const [jsonResult, setJsonResult] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // 默认API字段映射
  const defaultApiFields: ApiField[] = [
    { key: 'employee_id', label: t('payroll:auto_id_e59198'), required: true },
    { key: 'employee_name', label: t('payroll:auto_text_e59198'), required: true },
    { key: 'department_name', label: t('payroll:auto_text_e983a8'), required: false },
    { key: 'position_name', label: t('payroll:auto_text_e8818c'), required: false },
    { key: 'total_earnings', label: t('payroll:auto_text_e680bb'), required: true },
    { key: 'total_deductions', label: t('payroll:auto_text_e680bb'), required: true },
    { key: 'net_pay', label: t('payroll:auto_text_e58780'), required: true },
    { key: 'status_lookup_value_name', label: t('payroll:auto_text_e78ab6'), required: false },
    { key: 'remarks', label: t('payroll:auto_text_e5a487'), required: false },
    { key: 'earnings_details.basic.amount', label: t('payroll:auto_text_e59fba'), required: false },
    { key: 'earnings_details.bonus.amount', label: t('payroll:auto_text_e7bba9'), required: false },
    { key: 'earnings_details.allowance.amount', label: t('payroll:auto_text_e5b297'), required: false },
    { key: 'earnings_details.overtime.amount', label: t('payroll:auto_text_e58aa0'), required: false },
    { key: 'deductions_details.tax.amount', label: i18n.t('components.deductions.personal_income_tax', { ns: 'payroll' }), required: false },
    { key: 'deductions_details.insurance.amount', label: t('payroll:auto_text_e7a4be'), required: false },
    { key: 'deductions_details.fund.amount', label: t('payroll:auto_text_e585ac'), required: false },
  ];

  // 预设的字段映射规则
  const predefinedMappingRules: Record<string, string> = {
    [t('payroll:auto_text_e5ba8f')]: '',
    [t('payroll:auto_id_e59198')]: 'employee_id',
    [t('payroll:auto_text_e59198')]: 'employee_id',
    [t('payroll:auto_text_e5b7a5')]: 'employee_id',
    [t('payroll:auto_text_e5a793')]: 'employee_name',
    [t('payroll:auto_text_e59198')]: 'employee_name',
    [t('payroll:auto_text_e983a8')]: 'department_name',
    [t('payroll:auto_text_e983a8')]: 'department_name',
    [t('payroll:auto_text_e8818c')]: 'position_name',
    [t('payroll:auto_text_e8818c')]: 'position_name',
    [t('payroll:auto_text_e5b297')]: 'position_name',
    [t('payroll:auto_text_e680bb')]: 'total_earnings',
    [t('payroll:auto_text_e5b7a5')]: 'total_earnings',
    [t('payroll:auto_text_e680bb')]: 'total_earnings',
    [t('payroll:auto_text_e680bb')]: 'total_deductions',
    [t('payroll:auto_text_e689a3')]: 'total_deductions',
    [t('payroll:auto_text_e680bb')]: 'total_deductions',
    [t('payroll:auto_text_e58780')]: 'net_pay',
    [t('payroll:auto_text_e5ae9e')]: 'net_pay',
    [t('payroll:auto_text_e5ae9e')]: 'net_pay',
    [t('payroll:auto_text_e78ab6')]: 'status_lookup_value_name',
    [t('payroll:auto_text_e5a487')]: 'remarks',
    [t('payroll:auto_text_e8afb4')]: 'remarks',
    [t('payroll:auto_text_e59fba')]: 'earnings_details.basic.amount',
    [t('payroll:auto_text_e59fba')]: 'earnings_details.basic.amount',
    [t('payroll:auto_text_e7bba9')]: 'earnings_details.bonus.amount',
    [t('payroll:auto_text_e7bba9')]: 'earnings_details.bonus.amount',
    [t('payroll:auto_text_e5a596')]: 'earnings_details.bonus.amount',
    [t('payroll:auto_text_e5b297')]: 'earnings_details.allowance.amount',
    [t('payroll:auto_text_e6b4a5')]: 'earnings_details.allowance.amount',
    [t('payroll:auto_text_e58aa0')]: 'earnings_details.overtime.amount',
    [t('components.deductions.personal_income_tax')]: 'deductions_details.tax.amount',
    [t('payroll:auto_text_e4b8aa')]: 'deductions_details.tax.amount',
    [t('payroll:auto_text_e68980')]: 'deductions_details.tax.amount',
    [t('payroll:auto_text_e4b8aa')]: 'deductions_details.tax.amount',
    [t('payroll:auto_text_e7a4be')]: 'deductions_details.insurance.amount',
    [t('payroll:auto_text_e7a4be')]: 'deductions_details.insurance.amount',
    [t('payroll:auto_text_e585ac')]: 'deductions_details.fund.amount',
    [t('payroll:auto_text_e4bd8f')]: 'deductions_details.fund.amount',
  };

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
        
        return {
          tableField: header,
          apiField: apiField,
          required: apiFieldInfo?.required || false,
          type: getFieldType(header),
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
      setError(t('payroll:auto__err_message__e8a7a3'));
      setParsedData([]);
    }
  };

  // 根据字段名猜测数据类型
  const getFieldType = (fieldName: string): 'string' | 'date' | 'number' | 'boolean' => {
    if (fieldName.includes(t('payroll:auto_text_e697a5')) || fieldName.includes(t('payroll:auto_text_e697b6'))) {
      return 'date';
    } else if (
      fieldName.includes(t('payroll:auto_text_e98791')) || 
      fieldName.includes(t('payroll:auto_text_e5b7a5')) || 
      fieldName.includes(t('payroll:auto_text_e896aa')) || 
      fieldName.includes(t('payroll:auto_text_e694b6')) || 
      fieldName.includes(t('payroll:auto_text_e689a3')) || 
      fieldName.includes(t('payroll:auto_text_e7a88e')) || 
      fieldName.includes(t('payroll:auto_text_e6b4a5')) || 
      fieldName.includes(t('payroll:auto_text_e5a596')) || 
      fieldName.includes(t('payroll:auto_text_e585ac')) || 
      fieldName.includes(t('payroll:auto_text_e7a4be'))
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
    
    newMappings[index] = {
      ...newMappings[index],
      apiField,
      required: selectedApiField?.required || false,
    };
    
    setFieldMappings(newMappings);
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
        const jsonRow: Record<string, any> = {
          earnings_details: {},
          deductions_details: {}
        };
        
        fieldMappings.forEach(mapping => {
          if (mapping.apiField) {
            let value = row[mapping.tableField];
            
            // 处理嵌套字段
            if (mapping.apiField.includes('.')) {
              const [category, itemType, property] = mapping.apiField.split('.');
              
              // 确保嵌套对象存在
              if (!jsonRow[category]) {
                jsonRow[category] = {};
              }
              
              if (!jsonRow[category][itemType]) {
                jsonRow[category][itemType] = {};
              }
              
              // 数值字段处理
              if (mapping.type === 'number' && value) {
                value = formatNumber(value);
              }
              
              // 设置名称
              let itemName = '';
              if (category === 'earnings_details') {
                switch (itemType) {
                  case 'basic': itemName = t('payroll:auto_text_e59fba'); break;
                  case 'bonus': itemName = t('payroll:auto_text_e7bba9'); break;
                  case 'allowance': itemName = t('payroll:auto_text_e5b297'); break;
                  case 'overtime': itemName = t('payroll:auto_text_e58aa0'); break;
                  default: itemName = itemType; break;
                }
              } else if (category === 'deductions_details') {
                switch (itemType) {
                  case 'tax': itemName = t('components.deductions.personal_income_tax'); break;
                  case 'insurance': itemName = t('payroll:auto_text_e7a4be'); break;
                  case 'fund': itemName = t('payroll:auto_text_e585ac'); break;
                  default: itemName = itemType; break;
                }
              }
              
              jsonRow[category][itemType] = {
                amount: value || 0,
                name: itemName
              };
            } else {
              // 普通字段处理
              if (mapping.type === 'number' && value) {
                value = formatNumber(value);
              }
              
              jsonRow[mapping.apiField] = value || null;
            }
          }
        });
        
        // 计算总收入和总扣除
        let totalEarnings = 0;
        let totalDeductions = 0;
        
        // 计算总收入
        Object.values(jsonRow.earnings_details).forEach((item: any) => {
          if (item && typeof item.amount === 'number') {
            totalEarnings += item.amount;
          }
        });
        
        // 计算总扣除
        Object.values(jsonRow.deductions_details).forEach((item: any) => {
          if (item && typeof item.amount === 'number') {
            totalDeductions += item.amount;
          }
        });
        
        // 如果用户未映射总收入/总扣除字段，使用计算的值
        if (!jsonRow.total_earnings || jsonRow.total_earnings === 0) {
          jsonRow.total_earnings = totalEarnings;
        }
        
        if (!jsonRow.total_deductions || jsonRow.total_deductions === 0) {
          jsonRow.total_deductions = totalDeductions;
        }
        
        // 如果用户未映射净工资字段，计算净工资
        if (!jsonRow.net_pay || jsonRow.net_pay === 0) {
          jsonRow.net_pay = jsonRow.total_earnings - jsonRow.total_deductions;
        }
        
        // 设置默认状态
        if (!jsonRow.status_lookup_value_name) {
          jsonRow.status_lookup_value_name = t('payroll:auto_text_e5b7b2');
        }
        
        return jsonRow;
      });
      
      setJsonResult(JSON.stringify(jsonData, null, 2));
      setError(null);
    } catch (err: any) {
      setError(t('payroll:auto__err_message__e8bdac'));
    }
  };

  return (
    <Card title={t('batch_import.table_converter.title')}>
      <div style={{ marginBottom: 16 }}>
        <TextArea
          rows={10}
          value={tableText}
          onChange={e => setTableText(e.target.value)}
          placeholder={t('batch_import.table_converter.placeholder')}
        />
      </div>
      
      <Button type="primary" onClick={parseTableText}>
        {t('batch_import.table_converter.parse_table')}
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
          <Card title={t('batch_import.table_converter.field_mapping')} style={{ marginTop: 16 }}>
            <EnhancedProTable
              dataSource={fieldMappings.map((m, i) => ({ ...m, key: i }))}
              columns={[
                {
                  title: t('batch_import.table_converter.table_field'),
                  dataIndex: 'tableField',
                  valueType: 'text',
                },
                {
                  title: t('batch_import.table_converter.api_field'),
                  dataIndex: 'apiField',
                  valueType: 'select',
                  render: (_, record: any) => (
                    <Select
                      style={{ width: '100%' }}
                      value={record.apiField}
                      onChange={value => updateFieldMapping(record.key, value)}
                    >
                      <Option value="">{t('batch_import.table_converter.ignore_field')}</Option>
                      {defaultApiFields.map(field => (
                        <Option key={field.key} value={field.key}>
                          {field.label} {field.required ? `(${t('common:required')})` : ''}
                        </Option>
                      ))}
                    </Select>
                  )
                },
                {
                  title: t('batch_import.table_converter.data_type'),
                  dataIndex: 'type',
                  valueType: 'text',
                  render: (_, record: any) => record.type
                }
              ] as ProColumns<any>[]}
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
            {t('batch_import.table_converter.convert_to_json')}
          </Button>
          
          {jsonResult && (
            <Card title={t('batch_import.table_converter.json_result')} style={{ marginTop: 16 }}>
              <TextArea
                rows={10}
                value={jsonResult}
                readOnly
              />
              <Space style={{ marginTop: 8 }}>
                <Button
                  onClick={() => navigator.clipboard.writeText(jsonResult)}
                >
                  {t('batch_import.table_converter.copy_json')}
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
                      setError(t('batch_import.table_converter.json_parse_error'));
                    }
                  }}
                >
                  {t('batch_import.table_converter.use_json')}
                </Button>
              </Space>
            </Card>
          )}
        </>
      )}
    </Card>
  );
};

export default PayrollTableTextConverter;