import React, { useState } from 'react';
import { Input, Button, Select, Card, Alert, Space, App } from 'antd';
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
  const { t } = useTranslation(['payroll_table_converter', 'payroll', 'common']);
  const [tableText, setTableText] = useState<string>('');
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([]);
  const [jsonResult, setJsonResult] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const { message: messageApi } = App.useApp();

  // 默认API字段映射
  const defaultApiFields: ApiField[] = [
    { key: 'employee_id', label: t('payroll_table_converter:api_fields.employee_id'), required: true },
    { key: 'employee_name', label: t('payroll_table_converter:api_fields.employee_name'), required: true },
    { key: 'department_name', label: t('payroll_table_converter:api_fields.department_name'), required: false },
    { key: 'position_name', label: t('payroll_table_converter:api_fields.position_name'), required: false },
    { key: 'total_earnings', label: t('payroll_table_converter:api_fields.total_earnings'), required: true },
    { key: 'total_deductions', label: t('payroll_table_converter:api_fields.total_deductions'), required: true },
    { key: 'net_pay', label: t('payroll_table_converter:api_fields.net_pay'), required: true },
    { key: 'status_lookup_value_name', label: t('payroll_table_converter:api_fields.status_lookup_value_name'), required: false },
    { key: 'remarks', label: t('payroll_table_converter:api_fields.remarks'), required: false },
    { key: 'earnings_details.basic.amount', label: t('payroll_table_converter:api_fields.earnings_basic_amount'), required: false },
    { key: 'earnings_details.bonus.amount', label: t('payroll_table_converter:api_fields.earnings_bonus_amount'), required: false },
    { key: 'earnings_details.allowance.amount', label: t('payroll_table_converter:api_fields.earnings_allowance_amount'), required: false },
    { key: 'earnings_details.overtime.amount', label: t('payroll_table_converter:api_fields.earnings_overtime_amount'), required: false },
    { key: 'deductions_details.tax.amount', label: t('payroll_table_converter:api_fields.deductions_tax_amount'), required: false },
    { key: 'deductions_details.insurance.amount', label: t('payroll_table_converter:api_fields.deductions_insurance_amount'), required: false },
    { key: 'deductions_details.fund.amount', label: t('payroll_table_converter:api_fields.deductions_fund_amount'), required: false },
  ];

  // 删除硬编码映射，使用AI智能映射推荐
  // 这个组件现在主要用于表格文本解析，不再提供预设映射

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
      
      // 初始化字段映射 - 不再使用硬编码映射，等待用户使用AI智能映射
      const initialMappings: FieldMapping[] = headers.map(header => {
        return {
          tableField: header,
          apiField: '', // 默认为空，推荐用户使用AI智能映射
          required: false,
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
      setError(t('payroll_table_converter:error_message.parse_failed'));
      setParsedData([]);
    }
  };

  // 根据字段名猜测数据类型
  const getFieldType = (fieldName: string): 'string' | 'date' | 'number' | 'boolean' => {
    if (fieldName.includes(t('payroll_table_converter:field_type_keywords.date')) || fieldName.includes(t('payroll_table_converter:field_type_keywords.time'))) {
      return 'date';
    } else if (
      fieldName.includes(t('payroll_table_converter:field_type_keywords.amount')) || 
      fieldName.includes(t('payroll_table_converter:field_type_keywords.salary')) || 
      fieldName.includes(t('payroll_table_converter:field_type_keywords.income')) || 
      fieldName.includes(t('payroll_table_converter:field_type_keywords.deduction')) || 
      fieldName.includes(t('payroll_table_converter:field_type_keywords.tax')) || 
      fieldName.includes(t('payroll_table_converter:field_type_keywords.allowance')) || 
      fieldName.includes(t('payroll_table_converter:field_type_keywords.bonus')) || 
      fieldName.includes(t('payroll_table_converter:field_type_keywords.public')) || 
      fieldName.includes(t('payroll_table_converter:field_type_keywords.social'))
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
      messageApi.error(t('common:validation.missing_required_fields_prefix') + missingRequiredFields.map(field => field.label).join(', '));
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
                  case 'basic': itemName = t('payroll_table_converter:api_fields.earnings_basic_amount'); break;
                  case 'bonus': itemName = t('payroll_table_converter:api_fields.earnings_bonus_amount'); break;
                  case 'allowance': itemName = t('payroll_table_converter:api_fields.earnings_allowance_amount'); break;
                  case 'overtime': itemName = t('payroll_table_converter:api_fields.earnings_overtime_amount'); break;
                  default: itemName = itemType; break;
                }
              } else if (category === 'deductions_details') {
                switch (itemType) {
                  case 'tax': itemName = t('payroll_table_converter:api_fields.deductions_tax_amount'); break;
                  case 'insurance': itemName = t('payroll_table_converter:api_fields.deductions_insurance_amount'); break;
                  case 'fund': itemName = t('payroll_table_converter:api_fields.deductions_fund_amount'); break;
                  default: itemName = itemType; break;
                }
              }

              jsonRow[category][itemType][property] = value;
              // if (itemName) {
              //   jsonRow[category][itemType].name = itemName;
              // }

            } else {
              // 非嵌套字段直接设置
              jsonRow[mapping.apiField] = mapping.type === 'number' && value ? formatNumber(value) : value;
            }
          }
        });
        
        return jsonRow;
      });
      
      setJsonResult(JSON.stringify(jsonData, null, 2));
      setError(null);
    } catch (err: any) {
      setError(t('common:error.json_conversion_failed', 'Failed to convert to JSON. Please check your data and mappings.'));
    }
  };

  // 表格列配置
  const columns: ProColumns<FieldMapping>[] = [
    {
      title: t('payroll_table_converter:table_field_column_title'),
      dataIndex: 'tableField',
      key: 'tableField',
      width: 150,
      fixed: 'left',
      render: (text) => <span style={{ fontWeight: 'bold' }}>{text as string}</span>,
    },
    {
      title: t('payroll_table_converter:api_field_column_title'),
      dataIndex: 'apiField',
      key: 'apiField',
      width: 200,
      render: (text, record, index) => (
        <Select
          value={text as string}
          onChange={value => updateFieldMapping(index, value)}
          style={{ width: '100%' }}
        >
          <Option value="">{t('payroll_table_converter:ignore_field_option')}</Option>
          {defaultApiFields.map(field => (
            <Option key={field.key} value={field.key}>
              {field.label} {field.required && <span style={{ color: 'red' }}>*</span>}
            </Option>
          ))}
        </Select>
      ),
    },
    {
      title: t('payroll_table_converter:data_type_column_title'),
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (text, record, index) => {
        // 可选：根据API字段的预期类型进一步细化
        const selectedApiField = defaultApiFields.find(f => f.key === record.apiField);
        if (selectedApiField) {
          // 例如，可以根据selectedApiField.type来显示更精确的类型
          return selectedApiField.key.includes('date') ? t('common:data_type.date') :
                 selectedApiField.key.includes('amount') || selectedApiField.key.includes('number') ? t('common:data_type.number') :
                 t('common:data_type.string');
        }
        return text as string;
      },
    },
    {
      title: t('common:label.required'),
      dataIndex: 'required',
      key: 'required',
      width: 80,
      render: (text: any) => text ? t('common:yes') : t('common:no'),
    },
  ];

  return (
    <div>
      <Card title={t('payroll_table_converter:title')}>
        <TextArea
          rows={8}
          value={tableText}
          onChange={e => setTableText(e.target.value)}
          placeholder={t('payroll_table_converter:placeholder')}
          style={{ marginBottom: 16 }}
        />
        <Button type="primary" onClick={parseTableText} style={{ marginBottom: 16 }}>
          {t('payroll_table_converter:parse_table_button')}
        </Button>
        {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} />}
      </Card>

      {parsedData.length > 0 && (
        <Card title={t('payroll_table_converter:field_mapping_card_title')} style={{ marginTop: 16 }}>
          <EnhancedProTable
            columns={columns}
            dataSource={fieldMappings.map(m => ({ ...m, id: nanoid() }))} // 添加唯一id以便ProTable渲染
            rowKey="id"
            search={false}
            options={false}
            pagination={false}
            size="small"
          />
          <Button type="primary" onClick={convertToJson} style={{ marginTop: 16 }}>
            {t('payroll_table_converter:convert_to_json_button')}
          </Button>
        </Card>
      )}

      {jsonResult && (
        <Card title={t('payroll_table_converter:json_result_card_title')} style={{ marginTop: 16 }}>
          <TextArea rows={10} value={jsonResult} readOnly />
        </Card>
      )}
    </div>
  );
};

export default PayrollTableTextConverter;