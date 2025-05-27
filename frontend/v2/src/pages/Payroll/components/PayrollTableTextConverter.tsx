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
    { key: 'employee_id', label: '员工ID', required: true },
    { key: 'employee_name', label: '员工姓名', required: true },
    { key: 'department_name', label: '部门名称', required: false },
    { key: 'position_name', label: '职位名称', required: false },
    { key: 'total_earnings', label: '总收入', required: true },
    { key: 'total_deductions', label: '总扣除', required: true },
    { key: 'net_pay', label: '净工资', required: true },
    { key: 'status_lookup_value_name', label: '状态', required: false },
    { key: 'remarks', label: '备注', required: false },
    { key: 'earnings_details.basic.amount', label: '基本工资', required: false },
    { key: 'earnings_details.bonus.amount', label: '绩效奖金', required: false },
    { key: 'earnings_details.allowance.amount', label: '岗位津贴', required: false },
    { key: 'earnings_details.overtime.amount', label: '加班费', required: false },
    { key: 'deductions_details.tax.amount', label: i18n.t('components.deductions.personal_income_tax', { ns: 'payroll' }), required: false },
    { key: 'deductions_details.insurance.amount', label: '社会保险', required: false },
    { key: 'deductions_details.fund.amount', label: '公积金', required: false },
  ];

  // 预设的字段映射规则
  const predefinedMappingRules: Record<string, string> = {
    '序号': '',
    '员工ID': 'employee_id',
    '员工工号': 'employee_id',
    '工号': 'employee_id',
    '姓名': 'employee_name',
    '员工姓名': 'employee_name',
    '部门': 'department_name',
    '部门名称': 'department_name',
    '职位': 'position_name',
    '职务': 'position_name',
    '岗位': 'position_name',
    '总收入': 'total_earnings',
    '工资总额': 'total_earnings',
    '总计收入': 'total_earnings',
    '总扣除': 'total_deductions',
    '扣除总额': 'total_deductions',
    '总计扣除': 'total_deductions',
    '净工资': 'net_pay',
    '实发工资': 'net_pay',
    '实发金额': 'net_pay',
    '状态': 'status_lookup_value_name',
    '备注': 'remarks',
    '说明': 'remarks',
    '基本工资': 'earnings_details.basic.amount',
    '基本薪资': 'earnings_details.basic.amount',
    '绩效奖金': 'earnings_details.bonus.amount',
    '绩效': 'earnings_details.bonus.amount',
    '奖金': 'earnings_details.bonus.amount',
    '岗位津贴': 'earnings_details.allowance.amount',
    '津贴': 'earnings_details.allowance.amount',
    '加班费': 'earnings_details.overtime.amount',
    [t('components.deductions.personal_income_tax')]: 'deductions_details.tax.amount',
    '个人所得税': 'deductions_details.tax.amount',
    '所得税': 'deductions_details.tax.amount',
    '个税': 'deductions_details.tax.amount',
    '社会保险': 'deductions_details.insurance.amount',
    '社保': 'deductions_details.insurance.amount',
    '公积金': 'deductions_details.fund.amount',
    '住房公积金': 'deductions_details.fund.amount',
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
      setError(`解析错误: ${err.message}`);
      setParsedData([]);
    }
  };

  // 根据字段名猜测数据类型
  const getFieldType = (fieldName: string): 'string' | 'date' | 'number' | 'boolean' => {
    if (fieldName.includes('日期') || fieldName.includes('时间')) {
      return 'date';
    } else if (
      fieldName.includes('金额') || 
      fieldName.includes('工资') || 
      fieldName.includes('薪资') || 
      fieldName.includes('收入') || 
      fieldName.includes('扣除') || 
      fieldName.includes('税') || 
      fieldName.includes('津贴') || 
      fieldName.includes('奖金') || 
      fieldName.includes('公积金') || 
      fieldName.includes('社保')
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
                  case 'basic': itemName = '基本工资'; break;
                  case 'bonus': itemName = '绩效奖金'; break;
                  case 'allowance': itemName = '岗位津贴'; break;
                  case 'overtime': itemName = '加班费'; break;
                  default: itemName = itemType; break;
                }
              } else if (category === 'deductions_details') {
                switch (itemType) {
                  case 'tax': itemName = t('components.deductions.personal_income_tax'); break;
                  case 'insurance': itemName = '社会保险'; break;
                  case 'fund': itemName = '公积金'; break;
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
          jsonRow.status_lookup_value_name = '已计算';
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
    <Card title={t('batch_import.table_converter.title', '表格文本转换器')}>
      <div style={{ marginBottom: 16 }}>
        <TextArea
          rows={10}
          value={tableText}
          onChange={e => setTableText(e.target.value)}
          placeholder={t('batch_import.table_converter.placeholder', '请粘贴表格文本，格式如：序号,员工ID,姓名,部门,总收入,总扣除,净工资,...')}
        />
      </div>
      
      <Button type="primary" onClick={parseTableText}>
        {t('batch_import.table_converter.parse_table', '解析表格')}
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
          <Card title={t('batch_import.table_converter.field_mapping', '字段映射')} style={{ marginTop: 16 }}>
            <EnhancedProTable
              dataSource={fieldMappings.map((m, i) => ({ ...m, key: i }))}
              columns={[
                {
                  title: t('batch_import.table_converter.table_field', '表格字段'),
                  dataIndex: 'tableField',
                  valueType: 'text',
                },
                {
                  title: t('batch_import.table_converter.api_field', 'API字段'),
                  dataIndex: 'apiField',
                  valueType: 'select',
                  render: (_, record: any) => (
                    <Select
                      style={{ width: '100%' }}
                      value={record.apiField}
                      onChange={value => updateFieldMapping(record.key, value)}
                    >
                      <Option value="">{t('batch_import.table_converter.ignore_field', '忽略此字段')}</Option>
                      {defaultApiFields.map(field => (
                        <Option key={field.key} value={field.key}>
                          {field.label} {field.required ? `(${t('common:required', '必填')})` : ''}
                        </Option>
                      ))}
                    </Select>
                  )
                },
                {
                  title: t('batch_import.table_converter.data_type', '数据类型'),
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
            {t('batch_import.table_converter.convert_to_json', '转换为JSON')}
          </Button>
          
          {jsonResult && (
            <Card title={t('batch_import.table_converter.json_result', 'JSON结果')} style={{ marginTop: 16 }}>
              <TextArea
                rows={10}
                value={jsonResult}
                readOnly
              />
              <Space style={{ marginTop: 8 }}>
                <Button
                  onClick={() => navigator.clipboard.writeText(jsonResult)}
                >
                  {t('batch_import.table_converter.copy_json', '复制JSON')}
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
                      setError(t('batch_import.table_converter.json_parse_error', 'JSON解析错误，无法使用结果'));
                    }
                  }}
                >
                  {t('batch_import.table_converter.use_json', '使用此JSON')}
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