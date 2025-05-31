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
    { key: 'employee_code', label: {t('hr:auto_text_e59198')}, required: false },
    { key: 'first_name', label: {t('hr:auto_text_e5908d')}, required: true },
    { key: 'last_name', label: {t('hr:auto_text_e5a793')}, required: true },
    { key: 'fullname', label: {t('hr:auto____e5a793')}, required: false },
    { key: 'id_number', label: {t('hr:auto_text_e8baab')}, required: true },
    { key: 'date_of_birth', label: {t('hr:auto_text_e587ba')}, required: false },
    { key: 'gender_lookup_value_name', label: {t('hr:auto_text_e680a7')}, required: false },
    { key: 'ethnicity', label: {t('hr:auto_text_e6b091')}, required: false },
    { key: 'education_level_lookup_value_name', label: {t('hr:auto_text_e69687')}, required: false },
    { key: 'first_work_date', label: {t('hr:auto_text_e58f82')}, required: false },
    { key: 'years_of_service', label: {t('hr:auto_text_e5b7a5')}, required: false },
    { key: 'interrupted_service_years', label: {t('hr:auto_text_e5b7a5')}, required: false },
    { key: 'status_lookup_value_name', label: {t('hr:auto_text_e59198')}, required: false },
    { key: 'personnel_category_name', label: {t('hr:auto_text_e4baba')}, required: false },
    { key: 'position_name', label: {t('hr:auto_text_e5ae9e')}, required: false },
    { key: 'current_position_start_date', label: {t('hr:auto____e5ae9e')}, required: false },
    { key: 'career_position_level_date', label: {t('hr:auto____e4bbbb')}, required: false },
    { key: 'salary_level_lookup_value_name', label: {t('hr:auto_text_e5b7a5')}, required: false },
    { key: 'salary_grade_lookup_value_name', label: {t('hr:auto_text_e5b7a5')}, required: false },
    { key: 'ref_salary_level_lookup_value_name', label: {t('hr:auto_text_e58f82')}, required: false },
    { key: 'email', label: {t('hr:auto_text_e982ae')}, required: false },
    { key: 'phone_number', label: {t('hr:auto_text_e794b5')}, required: false },
    { key: 'hire_date', label: {t('hr:auto_text_e585a5')}, required: false },
    { key: 'department_name', label: {t('hr:auto_text_e983a8')}, required: false },
    { key: 'job_position_level_lookup_value_name', label: {t('hr:auto_text_e8818c')}, required: false },
    { key: 'bank_name', label: {t('hr:auto_text_e694b6')}, required: false },
    { key: 'bank_account_number', label: {t('hr:auto_text_e694b6')}, required: false },
  ];

  // 使用传入的字段定义或默认HR字段
  const defaultApiFields = propDefaultApiFields || defaultHRApiFields;

  // 预设的字段映射规则 - 如果没有传入则使用HR映射规则
  const defaultHRMappingRules: Record<string, string> = {
    {t('hr:auto_text_e5ba8f')}: '',
    {t('hr:auto_text_e5a793')}: 'fullname', // 确保映射到fullname
    {t('hr:auto_text_e680a7')}: 'gender_lookup_value_name',
    {t('hr:auto_text_e6b091')}: 'ethnicity',
    {t('hr:auto_text_e8baab')}: 'id_number',
    {t('hr:auto_text_e587ba')}: 'date_of_birth',
    {t('hr:auto_text_e69687')}: 'education_level_lookup_value_name',
    {t('hr:auto_text_e58f82')}: 'first_work_date',
    {t('hr:auto_text_e5b7a5')}: 'interrupted_service_years',
    {t('hr:auto_text_e8bf9e')}: 'years_of_service',
    {t('hr:auto_text_e4baba')}: 'personnel_category_name',
    {t('hr:auto_text_e5ae9e')}: 'position_name',
    {t('hr:auto_text_e5ae9e')}: 'current_position_start_date',
    {t('hr:auto_text_e4bbbb')}: 'career_position_level_date',
    {t('hr:auto_text_e5b7a5')}: 'salary_level_lookup_value_name',
    {t('hr:auto_text_e5b7a5')}: 'salary_grade_lookup_value_name',
    {t('hr:auto_text_e58f82')}: 'ref_salary_level_lookup_value_name',
    {t('hr:auto_text_e8818c')}: 'job_position_level_lookup_value_name',
    {t('hr:auto_text_e5bc80')}: 'bank_name',
    {t('hr:auto_text_e993b6')}: 'bank_account_number',
    {t('hr:auto_text_e993b6')}: 'bank_account_number',
    {t('hr:auto_text_e5b9b4')}: '',
    // 增加更多字段映射
    {t('hr:auto_text_e983a8')}: 'department_name',
    {t('hr:auto_text_e68980')}: 'department_name',
    {t('hr:auto_text_e58d95')}: 'department_name',
    {t('hr:auto_text_e6898b')}: 'phone_number',
    {t('hr:auto_text_e6898b')}: 'phone_number',
    {t('hr:auto_text_e6898b')}: 'phone_number',
    {t('hr:auto_text_e88194')}: 'phone_number',
    {t('hr:auto_text_e794b5')}: 'phone_number',
    {t('hr:auto_text_e993b6')}: 'bank_name',
    {t('hr:auto_text_e993b6')}: 'bank_name',
    {t('hr:auto_text_e5b7a5')}: 'bank_name',
    {t('hr:auto_text_e8b4a6')}: 'bank_account_number',
    {t('hr:auto_text_e58da1')}: 'bank_account_number',
    {t('hr:auto_text_e5b7a5')}: 'bank_account_number',
    {t('hr:auto_text_e59198')}: 'employee_code',
    {t('hr:auto_text_e5b7a5')}: 'employee_code',
    {t('hr:auto_text_e8818c')}: 'employee_code',
    {t('hr:auto_text_e585a5')}: 'hire_date',
    {t('hr:auto_text_e585a5')}: 'hire_date',
    {t('hr:auto_text_e982ae')}: 'email',
    {t('hr:auto_text_e794b5')}: 'email',
    {t('hr:auto_text_e794b5')}: 'email',
    {t('hr:auto_text_e5a99a')}: 'marital_status_lookup_value_name',
    {t('hr:auto_text_e694bf')}: 'political_status_lookup_value_name',
    {t('hr:auto_text_e59088')}: 'contract_type_lookup_value_name',
    {t('hr:auto_text_e59198')}: 'status_lookup_value_name',
    {t('hr:auto_text_e59ca8')}: 'status_lookup_value_name',
    {t('hr:auto_text_e794a8')}: 'employment_type_lookup_value_name',
    // 添加截图中显示的字段
    {t('hr:auto_text_e694b6')}: 'bank_account_number',
    {t('hr:auto_text_e694b6')}: 'bank_name',
  };

  // 使用传入的映射规则或默认HR映射规则
  const predefinedMappingRules = propPredefinedMappingRules || defaultHRMappingRules;

  // 解析表格文本
  const parseTableText = () => {
    // 调试: 打印字段列表，检查银行字段是否存在
    console.log('defaultApiFields:', defaultApiFields);
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
        if (header === {t('hr:auto_text_e5a793')} || apiField === 'fullname') {
          specialHandler = 'fullname';
          console.log(`为字段 '${header}' 设置了fullname特殊处理器`);
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
      setError({t('hr:auto__err_message__e8a7a3')});
      setParsedData([]);
    }
  };

  // 根据字段名猜测数据类型
  const getFieldType = (fieldName: string): 'string' | 'date' | 'number' | 'boolean' => {
    if (fieldName.includes({t('hr:auto_text_e697a5')}) || fieldName.includes({t('hr:auto_text_e697b6')})) {
      return 'date';
    } else if (fieldName.includes({t('hr:auto_text_e5b9b4')}) || fieldName.includes({t('hr:auto_text_e5b7a5')})) {
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
    if (newMappings[index].tableField === {t('hr:auto_text_e5a793')} || apiField === 'fullname') {
      specialHandler = 'fullname';
      console.log(`为字段 '${newMappings[index].tableField}' 更新了fullname特殊处理器`);
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
    
    // 假设中文姓名格式为{t('hr:auto___e5a793')}，姓通常为1个字
    // 复姓处理：常见复姓列表
    const commonDoubleLastNames = [{t('hr:auto_text_e6aca7')}, {t('hr:auto_text_e5a4aa')}, {t('hr:auto_text_e7abaf')}, {t('hr:auto_text_e4b88a')}, {t('hr:auto_text_e58fb8')}, {t('hr:auto_text_e4b89c')}, {t('hr:auto_text_e78bac')}, {t('hr:auto_text_e58d97')}, {t('hr:auto_text_e4b887')}, {t('hr:auto_text_e997bb')}, 
                                  {t('hr:auto_text_e5a48f')}, {t('hr:auto_text_e8afb8')}, {t('hr:auto_text_e5b089')}, {t('hr:auto_text_e585ac')}, {t('hr:auto_text_e8b5ab')}, {t('hr:auto_text_e6beb9')}, {t('hr:auto_text_e79a87')}, {t('hr:auto_text_e5ae97')}, {t('hr:auto_text_e6bfae')}, {t('hr:auto_text_e585ac')}, 
                                  {t('hr:auto_text_e5a4aa')}, {t('hr:auto_text_e794b3')}, {t('hr:auto_text_e585ac')}, {t('hr:auto_text_e68595')}, {t('hr:auto_text_e4bbb2')}, {t('hr:auto_text_e9929f')}, {t('hr:auto_text_e995bf')}, {t('hr:auto_text_e5ae87')}, {t('hr:auto_text_e58fb8')}, {t('hr:auto_text_e9b29c')}, 
                                  {t('hr:auto_text_e58fb8')}, {t('hr:auto_text_e997be')}, {t('hr:auto_text_e5ad90')}, {t('hr:auto_text_e4ba93')}, {t('hr:auto_text_e58fb8')}, {t('hr:auto_text_e5b7ab')}, {t('hr:auto_text_e585ac')}, {t('hr:auto_text_e9a29b')}, {t('hr:auto_text_e5a3a4')}, {t('hr:auto_text_e585ac')}, 
                                  {t('hr:auto_text_e6bc86')}, {t('hr:auto_text_e4b990')}, {t('hr:auto_text_e5aeb0')}, {t('hr:auto_text_e8b0b7')}, {t('hr:auto_text_e68b93')}, {t('hr:auto_text_e5a4b9')}, {t('hr:auto_text_e8bda9')}, {t('hr:auto_text_e4bba4')}, {t('hr:auto_text_e6aeb5')}, {t('hr:auto_text_e799be')}, 
                                  {t('hr:auto_text_e591bc')}, {t('hr:auto_text_e4b89c')}, {t('hr:auto_text_e58d97')}, {t('hr:auto_text_e7be8a')}, {t('hr:auto_text_e5beae')}, {t('hr:auto_text_e585ac')}, {t('hr:auto_text_e585ac')}, {t('hr:auto_text_e585ac')}, {t('hr:auto_text_e6a281')}, {t('hr:auto_text_e585ac')}, 
                                  {t('hr:auto_text_e585ac')}, {t('hr:auto_text_e585ac')}, {t('hr:auto_text_e585ac')}, {t('hr:auto_text_e585ac')}, {t('hr:auto_text_e5b7a6')}, {t('hr:auto_text_e585ac')}, {t('hr:auto_text_e8a5bf')}, {t('hr:auto_text_e585ac')}, {t('hr:auto_text_e7acac')}, {t('hr:auto_text_e585ac')}, 
                                  {t('hr:auto_text_e8b4af')}, {t('hr:auto_text_e585ac')}, {t('hr:auto_text_e58d97')}, {t('hr:auto_text_e4b89c')}, {t('hr:auto_text_e4b89c')}, {t('hr:auto_text_e4bbb2')}, {t('hr:auto_text_e5ad90')}, {t('hr:auto_text_e5ad90')}, {t('hr:auto_text_e58db3')}, {t('hr:auto_text_e8bebe')}, 
                                  {t('hr:auto_text_e8a49a')}];
    
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
    
    console.log(`拆分姓名: "${fullName}{t('hr:auto____203d3e')}${lastName}{t('hr:auto____2c20e5')}${firstName}"`);
    
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
    
    // 处理中文日期格式，如{t('hr:auto_202351_323032')}
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

  // 验证映射
  const validateMapping = () => {
    // 检查必填字段是否已映射
    const requiredFields = defaultApiFields.filter(field => field.required);
    const mappedFields = fieldMappings.filter(map => map.apiField);
    
    // 检查是否有fullname字段的映射，如果有，则认为已经映射了姓和名
    const hasFullnameMapping = mappedFields.some(map => map.apiField === 'fullname' || map.specialHandler === 'fullname');
    
    // 处理必填字段检查 - 如果有fullname，视为已映射姓和名
    let missingRequiredFields = requiredFields.filter(field => 
      !mappedFields.some(map => map.apiField === field.key) && 
      !(hasFullnameMapping && (field.key === 'first_name' || field.key === 'last_name'))
    );

    // 检查重要关联字段(虽然不是必填，但创建工作历史记录需要)
    const importantRelationFields = ['department_name', 'position_name', 'personnel_category_name'];
    const missingRelationFields = importantRelationFields.filter(field => 
      !mappedFields.some(map => map.apiField === field)
    );

    if (missingRequiredFields.length > 0) {
      message.error(`以下必填字段未映射: ${missingRequiredFields.map(field => field.label).join(', ')}`);
      return false;
    }

    if (missingRelationFields.length > 0) {
      message.warning(`注意: 以下重要关联字段未映射，可能导致无法创建完整的员工工作历史: ${missingRelationFields.map(field => {
        switch(field) {
          case 'department_name': return {t('hr:auto_text_e983a8')};
          case 'position_name': return {t('hr:auto_text_e5ae9e')};
          case 'personnel_category_name': return {t('hr:auto_text_e4baba')};
          default: return field;
        }
      }).join(', ')}`);
      // 不阻止提交，但显示警告
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
        const nameData: Record<string, string> = { first_name: '', last_name: '' };
        
        fieldMappings.forEach(mapping => {
          if (mapping.apiField) {
            let value = row[mapping.tableField];
            
            // 特殊处理
            if (mapping.specialHandler === 'fullname' || mapping.apiField === 'fullname') {
              const { first_name, last_name } = splitName(value);
              nameData.first_name = first_name;
              nameData.last_name = last_name;
              
              // 添加用于显示的全名字段(只用于前端展示)
              jsonRow['_fullname'] = value;
              return; // 跳过常规处理
            }
            
            // 数据类型转换
            if (mapping.type === 'date' && value) {
              value = formatDate(value);
            } else if (mapping.type === 'number' && value) {
              value = isNaN(Number(value)) ? value : Number(value);
            }
            
            // 特殊字段值处理
            if (mapping.apiField === 'status_lookup_value_name' && value) {
              // 标准化员工状态值
              if ([{t('hr:auto_text_e59ca8')}, {t('hr:auto_text_e6ada3')}, {t('hr:auto_text_e6ada3')}, {t('hr:auto_text_e6ada3')}].includes(value)) {
                value = {t('hr:auto_text_e59ca8')};
              } else if ([{t('hr:auto_text_e7a6bb')}, {t('hr:auto_text_e5b7b2')}].includes(value)) {
                value = {t('hr:auto_text_e7a6bb')};
              } else if ([{t('hr:auto_text_e8af95')}, {t('hr:auto_text_e8af95')}].includes(value)) {
                value = {t('hr:auto_text_e8af95')};
              }
            } else if (mapping.apiField === 'gender_lookup_value_name' && value) {
              // 标准化性别值
              if ([{t('hr:auto_text_e794b7')}, {t('hr:auto_text_e794b7')}, 'M', 'Male'].includes(value)) {
                value = {t('hr:auto_text_e794b7')};
              } else if ([{t('hr:auto_text_e5a5b3')}, {t('hr:auto_text_e5a5b3')}, 'F', 'Female'].includes(value)) {
                value = {t('hr:auto_text_e5a5b3')};
              }
            }
            // 注释掉银行名称标准化逻辑，严格保留表格中的原始银行数据
            // else if (mapping.apiField === 'bank_name' && value) {
            //   // 标准化银行名称
            //   if (value.includes({t('hr:auto_text_e5b7a5')}) || value.includes('ICBC')) {
            //     value = {t('hr:auto_text_e4b8ad')};
            //   } else if (value.includes({t('hr:auto_text_e5bbba')}) || value.includes('CCB')) {
            //     value = {t('hr:auto_text_e4b8ad')};
            //   } else if (value.includes({t('hr:auto_text_e5869c')}) || value.includes('ABC')) {
            //     value = {t('hr:auto_text_e4b8ad')};
            //   } else if (value.includes({t('hr:auto_text_e4b8ad')}) || value.includes('BOC')) {
            //     value = {t('hr:auto_text_e4b8ad')};
            //   } else if (value.includes({t('hr:auto_text_e4baa4')}) || value.includes('BOCOM')) {
            //     value = {t('hr:auto_text_e4baa4')};
            //   } else if (value.includes({t('hr:auto_text_e982ae')}) || value.includes('PSBC')) {
            //     value = {t('hr:auto_text_e4b8ad')};
            //   }
            // }
            
            jsonRow[mapping.apiField] = value || null;
          }
        });
        
        // 合并姓名数据
        return { ...jsonRow, ...nameData };
      });
      
      // 添加必填字段的默认值和应用自定义处理函数
      const finalData = jsonData.map(item => {
        let typedItem = item as Record<string, any>;
        
        // 如果传入了自定义处理函数，先应用它
        if (processResultRecord) {
          typedItem = processResultRecord(typedItem);
        } else {
          // 默认的HR处理逻辑
          // 如果没有hire_date但有first_work_date，使用first_work_date作为hire_date
          if (!typedItem.hire_date && typedItem.first_work_date) {
            typedItem.hire_date = typedItem.first_work_date;
          }
          
          // 如果没有hire_date，使用当前日期
          if (!typedItem.hire_date) {
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            typedItem.hire_date = `${year}-${month}-${day}`;
          }
          
          // 始终将员工状态设置为{t('hr:auto_text_e59ca8')}，无论是否已提供
          typedItem.status_lookup_value_name = typedItem.status_lookup_value_name || {t('hr:auto_text_e59ca8')};
          
          // 确保必填字段有值
          if (!typedItem.first_name && !typedItem.last_name && typedItem._fullname) {
            const { first_name, last_name } = splitName(typedItem._fullname);
            typedItem.first_name = first_name;
            typedItem.last_name = last_name;
          }
          
          // 确保身份证号格式正确
          if (typedItem.id_number) {
            // 移除空格
            typedItem.id_number = typedItem.id_number.replace(/\s/g, '');
          }
        }
        
        return typedItem;
      });
      
      setJsonResult(JSON.stringify(finalData, null, 2));
      setError(null);
      
      // 如果传入了回调函数，调用它
      if (onConvertToJson) {
        onConvertToJson(finalData);
      }
    } catch (err: any) {
      setError({t('hr:auto__err_message__e8bdac')});
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
                  title: {t('hr:auto_text_e8a1a8')},
                  dataIndex: 'tableField',
                  valueType: 'text'
                },
                {
                  title: {t('hr:auto_api_415049')},
                  dataIndex: 'apiField',
                  valueType: 'select',
                  render: (_, record) => {
                    // 调试: 查看渲染下拉列表时的字段数组
                    console.log({t('hr:auto___e6b8b2')}, defaultApiFields);
                    return (
                      <Select
                        style={{ width: '100%' }}
                        value={record.apiField}
                        onChange={value => updateFieldMapping(record.key, value)}
                      >
                        <Option value="">忽略此字段</Option>
                        {defaultApiFields.map(field => (
                          <Option key={field.key} value={field.key}>
                            {field.label} {field.required ? {t('hr:auto____28e5bf')} : ''}
                          </Option>
                        ))}
                      </Select>
                    );
                  }
                },
                {
                  title: {t('hr:auto_text_e695b0')},
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
                      setError({t('hr:auto_json__4a534f')});
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