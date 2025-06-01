import React, { useState } from 'react';
import { Input, Button, Select, Card, Alert, Space, App } from 'antd';
import { useTranslation } from 'react-i18next';
import { nanoid } from 'nanoid';
import type { ProColumns } from '@ant-design/pro-components';
import EnhancedProTable from '../../../components/common/EnhancedProTable';

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

interface TableTextConverterProps {
  namespace?: string;
  defaultApiFields?: ApiField[];
  predefinedMappingRules?: Record<string, string>;
  processResultRecord?: (record: Record<string, any>) => Record<string, any>;
  onConvertToJson?: (jsonData: any[]) => void;
}

const TableTextConverter: React.FC<TableTextConverterProps> = ({
  namespace = 'hr',
  defaultApiFields: propDefaultApiFields,
  predefinedMappingRules: propPredefinedMappingRules,
  processResultRecord,
  onConvertToJson
}) => {
  const { t } = useTranslation([namespace, 'common']);
  const { message } = App.useApp();
  const [tableText, setTableText] = useState<string>('');
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([]);
  const [jsonResult, setJsonResult] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // 默认API字段映射 - 如果没有传入则使用HR字段
  const defaultHRApiFields: ApiField[] = [
    { key: 'employee_code', label: t('hr:auto_text_e59198'), required: false },
    { key: 'first_name', label: t('hr:auto_text_e5908d'), required: true },
    { key: 'last_name', label: t('hr:auto_text_e5a793'), required: true },
    { key: 'fullname', label: t('hr:auto____e5a793'), required: false },
    { key: 'id_number', label: t('hr:auto_text_e8baab'), required: true },
    { key: 'date_of_birth', label: t('hr:auto_text_e587ba'), required: false },
    { key: 'gender_lookup_value_name', label: t('hr:auto_text_e680a7'), required: false },
    { key: 'ethnicity', label: t('hr:auto_text_e6b091'), required: false },
    { key: 'education_level_lookup_value_name', label: t('hr:auto_text_e69687'), required: false },
    { key: 'first_work_date', label: t('hr:auto_text_e58f82'), required: false },
    { key: 'years_of_service', label: t('hr:auto_text_e5b7a5'), required: false },
    { key: 'interrupted_service_years', label: t('hr:auto_text_e5b7a5'), required: false },
    { key: 'status_lookup_value_name', label: t('hr:auto_text_e59198'), required: false },
    { key: 'personnel_category_name', label: t('hr:auto_text_e4baba'), required: false },
    { key: 'position_name', label: t('hr:auto_text_e5ae9e'), required: false },
    { key: 'current_position_start_date', label: t('hr:auto____e5ae9e'), required: false },
    { key: 'career_position_level_date', label: t('hr:auto____e4bbbb'), required: false },
    { key: 'salary_level_lookup_value_name', label: t('hr:auto_text_e5b7a5'), required: false },
    { key: 'salary_grade_lookup_value_name', label: t('hr:auto_text_e5b7a5'), required: false },
    { key: 'ref_salary_level_lookup_value_name', label: t('hr:auto_text_e58f82'), required: false },
    { key: 'email', label: t('hr:auto_text_e982ae'), required: false },
    { key: 'phone_number', label: t('hr:auto_text_e794b5'), required: false },
    { key: 'hire_date', label: t('hr:auto_text_e585a5'), required: false },
    { key: 'department_name', label: t('hr:auto_text_e983a8'), required: false },
    { key: 'job_position_level_lookup_value_name', label: t('hr:auto_text_e8818c'), required: false },
    { key: 'bank_name', label: t('hr:auto_text_e694b6'), required: false },
    { key: 'bank_account_number', label: t('hr:auto_text_e694b6'), required: false },
  ];

  // 使用传入的字段定义或默认HR字段
  const defaultApiFields = propDefaultApiFields || defaultHRApiFields;

  // 预设的字段映射规则 - 如果没有传入则使用HR映射规则
  const defaultHRMappingRules: Record<string, string> = {
    [t('hr:auto_text_e5ba8f')]: '',
    [t('hr:auto_text_e5a793')]: 'fullname', // 确保映射到fullname
    [t('hr:auto_text_e680a7')]: 'gender_lookup_value_name',
    [t('hr:auto_text_e6b091')]: 'ethnicity',
    [t('hr:auto_text_e8baab')]: 'id_number',
    [t('hr:auto_text_e587ba')]: 'date_of_birth',
    [t('hr:auto_text_e69687')]: 'education_level_lookup_value_name',
    [t('hr:auto_text_e58f82')]: 'first_work_date',
    [t('hr:auto_text_e5b7a5')]: 'interrupted_service_years',
    [t('hr:auto_text_e8bf9e')]: 'years_of_service',
    [t('hr:auto_text_e4baba')]: 'personnel_category_name',
    [t('hr:auto_text_e5ae9e')]: 'position_name',
    [t('hr:auto_text_e5ae9e')]: 'current_position_start_date',
    [t('hr:auto_text_e4bbbb')]: 'career_position_level_date',
    [t('hr:auto_text_e5b7a5')]: 'salary_level_lookup_value_name',
    [t('hr:auto_text_e5b7a5')]: 'salary_grade_lookup_value_name',
    [t('hr:auto_text_e58f82')]: 'ref_salary_level_lookup_value_name',
    [t('hr:auto_text_e8818c')]: 'job_position_level_lookup_value_name',
    [t('hr:auto_text_e5bc80')]: 'bank_name',
    [t('hr:auto_text_e993b6')]: 'bank_account_number',
    [t('hr:auto_text_e993b6')]: 'bank_account_number',
    [t('hr:auto_text_e5b9b4')]: '',
    // 增加更多字段映射
    [t('hr:auto_text_e983a8')]: 'department_name',
    [t('hr:auto_text_e68980')]: 'department_name',
    [t('hr:auto_text_e58d95')]: 'department_name',
    [t('hr:auto_text_e6898b')]: 'phone_number',
    [t('hr:auto_text_e6898b')]: 'phone_number',
    [t('hr:auto_text_e6898b')]: 'phone_number',
    [t('hr:auto_text_e88194')]: 'phone_number',
    [t('hr:auto_text_e794b5')]: 'phone_number',
    [t('hr:auto_text_e993b6')]: 'bank_name',
    [t('hr:auto_text_e993b6')]: 'bank_name',
    [t('hr:auto_text_e5b7a5')]: 'bank_name',
    [t('hr:auto_text_e8b4a6')]: 'bank_account_number',
    [t('hr:auto_text_e58da1')]: 'bank_account_number',
    [t('hr:auto_text_e5b7a5')]: 'bank_account_number',
    [t('hr:auto_text_e59198')]: 'employee_code',
    [t('hr:auto_text_e5b7a5')]: 'employee_code',
    [t('hr:auto_text_e8818c')]: 'employee_code',
    [t('hr:auto_text_e585a5')]: 'hire_date',
    [t('hr:auto_text_e585a5')]: 'hire_date',
    [t('hr:auto_text_e982ae')]: 'email',
    [t('hr:auto_text_e794b5')]: 'email',
    [t('hr:auto_text_e794b5')]: 'email',
    [t('hr:auto_text_e5a99a')]: 'marital_status_lookup_value_name',
    [t('hr:auto_text_e694bf')]: 'political_status_lookup_value_name',
    [t('hr:auto_text_e59088')]: 'contract_type_lookup_value_name',
    [t('hr:auto_text_e59198')]: 'status_lookup_value_name',
    [t('hr:auto_text_e59ca8')]: 'status_lookup_value_name',
    [t('hr:auto_text_e794a8')]: 'employment_type_lookup_value_name',
    // 添加截图中显示的字段
    [t('hr:auto_text_e694b6')]: 'bank_account_number',
    [t('hr:auto_text_e694b6')]: 'bank_name',
  };

  // 使用传入的映射规则或默认HR映射规则
  const predefinedMappingRules = propPredefinedMappingRules || defaultHRMappingRules;

  // 解析表格文本
  const parseTableText = () => {
    // 调试: 打印字段列表，检查银行字段是否存在
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
        if (header === t('hr:auto_text_e5a793') || apiField === 'fullname') {
          specialHandler = 'fullname';
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
      setError(t('hr:auto__err_message__e8a7a3') + (err instanceof Error ? err.message : String(err)));
      setParsedData([]);
    }
  };

  // 根据字段名猜测数据类型
  const getFieldType = (fieldName: string): 'string' | 'date' | 'number' | 'boolean' => {
    if (fieldName.includes(t('hr:auto_text_e697a5')) || fieldName.includes(t('hr:auto_text_e697b6'))) {
      return 'date';
    } else if (
      fieldName.includes(t('hr:auto_text_e98791')) || 
      fieldName.includes(t('hr:auto_text_e5b7a5')) || 
      fieldName.includes(t('hr:auto_text_e896aa')) || 
      fieldName.includes(t('hr:auto_text_e694b6')) || 
      fieldName.includes(t('hr:auto_text_e689a3')) || 
      fieldName.includes(t('hr:auto_text_e7a88e')) || 
      fieldName.includes(t('hr:auto_text_e6b4a5')) || 
      fieldName.includes(t('hr:auto_text_e5a596')) || 
      fieldName.includes(t('hr:auto_text_e585ac')) || 
      fieldName.includes(t('hr:auto_text_e7a4be'))
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
    if (newMappings[index].tableField === t('hr:auto_text_e5a793') || apiField === 'fullname') {
      specialHandler = 'fullname';
    }
    
    newMappings[index] = {
      ...newMappings[index],
      apiField,
      required: selectedApiField?.required || false,
      specialHandler: specialHandler
    };
    
    setFieldMappings(newMappings);
  };

  // 处理中文姓名拆分 - 修改后更加清晰
  const splitName = (fullName: string) => {
    if (!fullName) return { last_name: '', first_name: '' };
    
    // 假设中文姓名格式为t('hr:auto___e5a793')，姓通常为1个字
    // 复姓处理：常见复姓列表
    const commonDoubleLastNames = [t('hr:auto_text_e6aca7'), t('hr:auto_text_e5a4aa'), t('hr:auto_text_e7abaf'), t('hr:auto_text_e4b88a'), t('hr:auto_text_e58fb8'), t('hr:auto_text_e4b89c'), t('hr:auto_text_e78bac'), t('hr:auto_text_e58d97'), t('hr:auto_text_e4b887'), t('hr:auto_text_e997bb'), 
                                  t('hr:auto_text_e5a48f'), t('hr:auto_text_e8afb8'), t('hr:auto_text_e5b089'), t('hr:auto_text_e585ac'), t('hr:auto_text_e8b5ab'), t('hr:auto_text_e6beb9'), t('hr:auto_text_e79a87'), t('hr:auto_text_e5ae97'), t('hr:auto_text_e6bfae'), t('hr:auto_text_e585ac'), 
                                  t('hr:auto_text_e5a4aa'), t('hr:auto_text_e794b3'), t('hr:auto_text_e585ac'), t('hr:auto_text_e68595'), t('hr:auto_text_e4bbb2'), t('hr:auto_text_e9929f'), t('hr:auto_text_e995bf'), t('hr:auto_text_e5ae87'), t('hr:auto_text_e58fb8'), t('hr:auto_text_e9b29c'), 
                                  t('hr:auto_text_e58fb8'), t('hr:auto_text_e997be'), t('hr:auto_text_e5ad90'), t('hr:auto_text_e4ba93'), t('hr:auto_text_e58fb8'), t('hr:auto_text_e5b7ab'), t('hr:auto_text_e585ac'), t('hr:auto_text_e9a29b'), t('hr:auto_text_e5a3a4'), t('hr:auto_text_e585ac'), 
                                  t('hr:auto_text_e6bc86'), t('hr:auto_text_e4b990'), t('hr:auto_text_e5aeb0'), t('hr:auto_text_e8b0b7'), t('hr:auto_text_e68b93'), t('hr:auto_text_e5a4b9'), t('hr:auto_text_e8bda9'), t('hr:auto_text_e4bba4'), t('hr:auto_text_e6aeb5'), t('hr:auto_text_e799be'), 
                                  t('hr:auto_text_e591bc'), t('hr:auto_text_e4b89c'), t('hr:auto_text_e58d97'), t('hr:auto_text_e7be8a'), t('hr:auto_text_e5beae'), t('hr:auto_text_e585ac'), t('hr:auto_text_e585ac'), t('hr:auto_text_e585ac'), t('hr:auto_text_e6a281'), t('hr:auto_text_e585ac'), 
                                  t('hr:auto_text_e585ac'), t('hr:auto_text_e585ac'), t('hr:auto_text_e585ac'), t('hr:auto_text_e585ac'), t('hr:auto_text_e5b7a6'), t('hr:auto_text_e585ac'), t('hr:auto_text_e8a5bf'), t('hr:auto_text_e585ac'), t('hr:auto_text_e7acac'), t('hr:auto_text_e585ac'), 
                                  t('hr:auto_text_e8b4af'), t('hr:auto_text_e585ac'), t('hr:auto_text_e58d97'), t('hr:auto_text_e4b89c'), t('hr:auto_text_e4b89c'), t('hr:auto_text_e4bbb2'), t('hr:auto_text_e5ad90'), t('hr:auto_text_e5ad90'), t('hr:auto_text_e58db3'), t('hr:auto_text_e8bebe'), 
                                  t('hr:auto_text_e8a49a')];
    
    // 检查是否为复姓
    let lastName = '';
    let firstName = '';
    
    if (fullName.length <= 1) {
      return { last_name: fullName, first_name: '' };
    }
    
    // 先检查是否是复姓
    const doubleLastName = commonDoubleLastNames.find(dlname => fullName.startsWith(dlname));
    
    if (doubleLastName) {
      lastName = doubleLastName;
      firstName = fullName.substring(doubleLastName.length);
    } else {
      // 单姓处理
      lastName = fullName.substring(0, 1);
      firstName = fullName.substring(1);
    }
    
    
    return {
      last_name: lastName,
      first_name: firstName
    };
  };

  // 格式化日期
  const formatDate = (dateStr: string): string => {
    if (!dateStr) return '';
    
    // 如果已经是YYYY-MM-DD格式，直接返回
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }
    
    // 处理中文日期格式，如t('hr:auto_202351_323032')
    const chineseDatePattern = /(\d{4})年(\d{1,2})月(\d{1,2})日/;
    const chineseMatch = dateStr.match(chineseDatePattern);
    if (chineseMatch) {
      const year = chineseMatch[1];
      const month = String(parseInt(chineseMatch[2])).padStart(2, '0');
      const day = String(parseInt(chineseMatch[3])).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    
    // 处理斜杠格式，如"2023/5/1"
    const slashPattern = /(\d{4})\/(\d{1,2})\/(\d{1,2})/;
    const slashMatch = dateStr.match(slashPattern);
    if (slashMatch) {
      const year = slashMatch[1];
      const month = String(parseInt(slashMatch[2])).padStart(2, '0');
      const day = String(parseInt(slashMatch[3])).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    
    // 处理点格式，如"2023.5.1"
    const dotPattern = /(\d{4})\.(\d{1,2})\.(\d{1,2})/;
    const dotMatch = dateStr.match(dotPattern);
    if (dotMatch) {
      const year = dotMatch[1];
      const month = String(parseInt(dotMatch[2])).padStart(2, '0');
      const day = String(parseInt(dotMatch[3])).padStart(2, '0');
      return `${year}-${month}-${day}`;
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
      message.error(t('batch_import.table_converter.missing_required_fields', { fields: missingRequiredFields.map(field => field.label).join(', ') }));
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
            
            // 处理特殊处理器（例如fullname拆分）
            if (mapping.specialHandler === 'fullname') {
              const { last_name, first_name } = splitName(value);
              jsonRow.last_name = last_name;
              jsonRow.first_name = first_name;
              // fullname本身不直接映射到API字段，而是拆分
              return; 
            }
            
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
              // 日期字段处理
              if (mapping.type === 'date' && value) {
                value = formatDate(value);
              }
              // 布尔值处理
              if (mapping.type === 'boolean' && value) {
                value = [t('hr:auto_text_e59ca8'), t('hr:auto_text_e6ada3'), t('hr:auto_text_e6ada3'), t('hr:auto_text_e6ada3')].includes(value) ? true : [t('hr:auto_text_e7a6bb'), t('hr:auto_text_e5b7b2')].includes(value) ? false : [t('hr:auto_text_e8af95'), t('hr:auto_text_e8af95')].includes(value) ? true : Boolean(value);
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
              // 日期字段处理
              if (mapping.type === 'date' && value) {
                value = formatDate(value);
              }
              // 布尔值处理 (如性别)
              if (mapping.type === 'boolean' && value) {
                if ([t('hr:auto_text_e794b7'), t('hr:auto_text_e794b7'), 'M', 'Male'].includes(value)) {
                  value = true; // male
                } else if ([t('hr:auto_text_e5a5b3'), t('hr:auto_text_e5a5b3'), 'F', 'Female'].includes(value)) {
                  value = false; // female
                } else {
                  value = Boolean(value); // fallback
                }
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

        // 如果有processResultRecord函数，则调用它
        const finalData = processResultRecord ? processResultRecord(jsonRow) : jsonRow;
        
        return finalData;
      });
      
      setJsonResult(JSON.stringify(jsonData, null, 2));
      setError(null);
      // 触发外部事件传递JSON结果
      if (onConvertToJson) {
        onConvertToJson(jsonData);
      }
    } catch (err: any) {
      setError(t('hr:auto__err_message__e8bdac') + (err instanceof Error ? err.message : String(err)));
    }
  };

  return (
    <Card title={t('hr:auto_text_e8a1a8')}>
      <div style={{ marginBottom: 16 }}>
        <TextArea
          rows={10}
          value={tableText}
          onChange={e => setTableText(e.target.value)}
          placeholder={t('hr:auto_________e8afb7')}
        />
      </div>
      
      <Button type="primary" onClick={parseTableText}>
        解析表格
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
          <Card title={t('hr:auto_text_e5ad97')} style={{ marginTop: 16 }}>
            <EnhancedProTable<FieldMapping & { key: number }>
              dataSource={fieldMappings.map((m, i) => ({ ...m, key: i }))}
              columns={[
                {
                  title: t('hr:auto_text_e8a1a8'),
                  dataIndex: 'tableField',
                  valueType: 'text'
                },
                {
                  title: t('hr:auto_api_415049'),
                  dataIndex: 'apiField',
                  valueType: 'select',
                  render: (_, record) => {
                    // 调试: 查看渲染下拉列表时的字段数组
                    return (
                      <Select
                        style={{ width: '100%' }}
                        value={record.apiField}
                        onChange={value => updateFieldMapping(record.key, value)}
                      >
                        <Option value="">忽略此字段</Option>
                        {defaultApiFields.map(field => (
                          <Option key={field.key} value={field.key}>
                            {field.label} {field.required ?      t('hr:auto____28e5bf'): ''}
                          </Option>
                        ))}
                      </Select>
                    );
                  }
                },
                {
                  title: t('hr:auto_text_e695b0'),
                  dataIndex: 'type',
                  valueType: 'text',
                  render: (_, record) => record.type
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
          
          {jsonResult && (
            <Card title={t('hr:auto_json_4a534f')} style={{ marginTop: 16 }}>
              <TextArea
                rows={10}
                value={jsonResult}
                readOnly
              />
              <Space style={{ marginTop: 8 }}>
                <Button
                  onClick={() => navigator.clipboard.writeText(jsonResult)}
                >
                  复制JSON
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
                      setError(t('hr:auto_json__4a534f'));
                    }
                  }}
                >
                  使用此JSON
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