import React, { useState } from 'react';
import { Input, Button, Table, Select, Card, Alert, Space, message } from 'antd';
import { useTranslation } from 'react-i18next';
import { nanoid } from 'nanoid';

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

const TableTextConverter: React.FC = () => {
  const { t } = useTranslation(['hr', 'common']);
  const [tableText, setTableText] = useState<string>('');
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([]);
  const [jsonResult, setJsonResult] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // 默认API字段映射
  const defaultApiFields: ApiField[] = [
    { key: 'employee_code', label: '员工代码', required: false },
    { key: 'first_name', label: '名', required: true },
    { key: 'last_name', label: '姓', required: true },
    { key: 'id_number', label: '身份证号', required: true },
    { key: 'date_of_birth', label: '出生日期', required: false },
    { key: 'gender_lookup_value_name', label: '性别', required: false },
    { key: 'ethnicity', label: '民族', required: false },
    { key: 'education_level_lookup_value_name', label: '文化程度', required: false },
    { key: 'first_work_date', label: '参加工作时间', required: false },
    { key: 'years_of_service', label: '工龄', required: false },
    { key: 'interrupted_service_years', label: '工龄间断年限', required: false },
    { key: 'status_lookup_value_name', label: '员工状态', required: true },
    { key: 'personnel_category_name', label: '人员类别', required: false },
    { key: 'position_name', label: '实际任职', required: false },
    { key: 'current_position_start_date', label: '实际任职时间(本单位)', required: false },
    { key: 'career_position_level_date', label: '任职级时间(职业生涯)', required: false },
    { key: 'salary_level_lookup_value_name', label: '工资级别', required: false },
    { key: 'salary_grade_lookup_value_name', label: '工资档次', required: false },
    { key: 'ref_salary_level_lookup_value_name', label: '参照正编薪级', required: false },
    { key: 'email', label: '邮箱', required: false },
    { key: 'phone_number', label: '电话号码', required: false },
    { key: 'hire_date', label: '入职日期', required: true },
    { key: 'department_name', label: '部门', required: false },
  ];

  // 预设的字段映射规则
  const predefinedMappingRules: Record<string, string> = {
    '序号': '',
    '姓名': 'last_name', // 特殊处理
    '性别': 'gender_lookup_value_name',
    '民族': 'ethnicity',
    '身份证号': 'id_number',
    '出生日期': 'date_of_birth',
    '文化程度': 'education_level_lookup_value_name',
    '参加工作时间': 'first_work_date',
    '工龄间断年限': 'interrupted_service_years',
    '连续工龄': 'years_of_service',
    '人员身份': 'personnel_category_name',
    '实际任职': 'position_name',
    '实际任职时间': 'current_position_start_date',
    '任职级时间': 'career_position_level_date',
    '工资级别': 'salary_level_lookup_value_name',
    '工资档次': 'salary_grade_lookup_value_name',
    '参照正编薪级': 'ref_salary_level_lookup_value_name',
    '年度考核': '',
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
          specialHandler: header === '姓名' ? 'splitName' : undefined
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
    } else if (fieldName.includes('年龄') || fieldName.includes('工龄')) {
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
      specialHandler: apiField === 'last_name' ? 'splitName' : undefined
    };
    
    setFieldMappings(newMappings);
  };

  // 处理中文姓名拆分
  const splitName = (fullName: string) => {
    if (!fullName) return { last_name: '', first_name: '' };
    
    // 假设中文姓名格式为"姓+名"，姓通常为1个字
    if (fullName.length <= 1) {
      return { last_name: fullName, first_name: '' };
    }
    
    return {
      last_name: fullName.substring(0, 1),
      first_name: fullName.substring(1)
    };
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

  // 验证映射
  const validateMapping = () => {
    // 检查必填字段是否已映射
    const requiredFields = defaultApiFields.filter(field => field.required);
    const mappedFields = fieldMappings.filter(map => map.apiField);
    const missingRequiredFields = requiredFields.filter(field => 
      !mappedFields.some(map => map.apiField === field.key)
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
          case 'department_name': return '部门';
          case 'position_name': return '实际任职';
          case 'personnel_category_name': return '人员身份';
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
            if (mapping.specialHandler === 'splitName') {
              const { first_name, last_name } = splitName(value);
              nameData.first_name = first_name;
              nameData.last_name = last_name;
              return; // 跳过常规处理
            }
            
            // 数据类型转换
            if (mapping.type === 'date' && value) {
              value = formatDate(value);
            } else if (mapping.type === 'number' && value) {
              value = isNaN(Number(value)) ? value : Number(value);
            }
            
            jsonRow[mapping.apiField] = value || null;
          }
        });
        
        // 合并姓名数据
        return { ...jsonRow, ...nameData };
      });
      
      // 添加必填字段的默认值
      const finalData = jsonData.map(item => {
        const typedItem = item as Record<string, any>;
        
        // 如果没有hire_date但有first_work_date，使用first_work_date作为hire_date
        if (!typedItem.hire_date && typedItem.first_work_date) {
          typedItem.hire_date = typedItem.first_work_date;
        }
        
        // 始终将员工状态设置为"在职"
        typedItem.status_lookup_value_name = '在职';
        
        return typedItem;
      });
      
      setJsonResult(JSON.stringify(finalData, null, 2));
      setError(null);
    } catch (err: any) {
      setError(`转换错误: ${err.message}`);
    }
  };

  return (
    <Card title="表格文本转换器">
      <div style={{ marginBottom: 16 }}>
        <TextArea
          rows={10}
          value={tableText}
          onChange={e => setTableText(e.target.value)}
          placeholder="请粘贴表格文本，格式如：序号,姓名,性别,民族,身份证号,..."
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
          <Card title="字段映射" style={{ marginTop: 16 }}>
            <Table
              dataSource={fieldMappings.map((m, i) => ({ ...m, key: i }))}
              columns={[
                {
                  title: '表格字段',
                  dataIndex: 'tableField'
                },
                {
                  title: 'API字段',
                  dataIndex: 'apiField',
                  render: (text, record: any) => (
                    <Select
                      style={{ width: '100%' }}
                      value={text}
                      onChange={value => updateFieldMapping(record.key, value)}
                    >
                      <Option value="">忽略此字段</Option>
                      {defaultApiFields.map(field => (
                        <Option key={field.key} value={field.key}>
                          {field.label} {field.required ? '(必填)' : ''}
                        </Option>
                      ))}
                    </Select>
                  )
                },
                {
                  title: '数据类型',
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
            转换为JSON
          </Button>
          
          {jsonResult && (
            <Card title="JSON结果" style={{ marginTop: 16 }}>
              <TextArea
                rows={10}
                value={jsonResult}
                readOnly
              />
              <Space style={{ marginTop: 8 }}>
                <Button
                  type="primary"
                  onClick={() => navigator.clipboard.writeText(jsonResult)}
                >
                  复制JSON
                </Button>
                <Button
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
                      setError('JSON解析错误，无法使用结果');
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