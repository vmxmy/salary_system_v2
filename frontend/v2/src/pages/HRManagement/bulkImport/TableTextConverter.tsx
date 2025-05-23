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
    { key: 'fullname', label: '姓名(自动拆分)', required: false },
    { key: 'id_number', label: '身份证号', required: true },
    { key: 'date_of_birth', label: '出生日期', required: false },
    { key: 'gender_lookup_value_name', label: '性别', required: false },
    { key: 'ethnicity', label: '民族', required: false },
    { key: 'education_level_lookup_value_name', label: '文化程度', required: false },
    { key: 'first_work_date', label: '参加工作时间', required: false },
    { key: 'years_of_service', label: '工龄', required: false },
    { key: 'interrupted_service_years', label: '工龄间断年限', required: false },
    { key: 'status_lookup_value_name', label: '员工状态', required: false },
    { key: 'personnel_category_name', label: '人员类别', required: false },
    { key: 'position_name', label: '实际任职', required: false },
    { key: 'current_position_start_date', label: '实际任职时间(本单位)', required: false },
    { key: 'career_position_level_date', label: '任职级时间(职业生涯)', required: false },
    { key: 'salary_level_lookup_value_name', label: '工资级别', required: false },
    { key: 'salary_grade_lookup_value_name', label: '工资档次', required: false },
    { key: 'ref_salary_level_lookup_value_name', label: '参照正编薪级', required: false },
    { key: 'email', label: '邮箱', required: false },
    { key: 'phone_number', label: '电话号码', required: false },
    { key: 'hire_date', label: '入职日期', required: false },
    { key: 'department_name', label: '部门', required: false },
    { key: 'bank_name', label: '收款人开户银行', required: false },
    { key: 'bank_account_number', label: '收款人账号', required: false },
  ];

  // 预设的字段映射规则
  const predefinedMappingRules: Record<string, string> = {
    '序号': '',
    '姓名': 'fullname', // 确保映射到fullname
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
    '开户银行': 'bank_name',
    '银行账号': 'bank_account_number',
    '银行卡号': 'bank_account_number',
    '年度考核': '',
    // 增加更多字段映射
    '部门': 'department_name',
    '所属部门': 'department_name',
    '单位': 'department_name',
    '手机': 'phone_number',
    '手机号': 'phone_number',
    '手机号码': 'phone_number',
    '联系电话': 'phone_number',
    '电话': 'phone_number',
    '银行': 'bank_name',
    '银行名称': 'bank_name',
    '工资卡开户行': 'bank_name',
    '账号': 'bank_account_number',
    '卡号': 'bank_account_number',
    '工资卡号': 'bank_account_number',
    '员工代码': 'employee_code',
    '工号': 'employee_code',
    '职工编号': 'employee_code',
    '入职日期': 'hire_date',
    '入职时间': 'hire_date',
    '邮箱': 'email',
    '电子邮箱': 'email',
    '电子邮件': 'email',
    '婚姻状况': 'marital_status_lookup_value_name',
    '政治面貌': 'political_status_lookup_value_name',
    '合同类型': 'contract_type_lookup_value_name',
    '员工状态': 'status_lookup_value_name',
    '在职状态': 'status_lookup_value_name',
    '用工类型': 'employment_type_lookup_value_name',
    // 添加截图中显示的字段
    '收款人账号': 'bank_account_number',
    '收款人开户银行': 'bank_name',
  };

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
        if (header === '姓名' || apiField === 'fullname') {
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
    
    // 设置特殊处理器
    let specialHandler: string | undefined = undefined;
    if (newMappings[index].tableField === '姓名' || apiField === 'fullname') {
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
    
    // 假设中文姓名格式为"姓+名"，姓通常为1个字
    // 复姓处理：常见复姓列表
    const commonDoubleLastNames = ['欧阳', '太史', '端木', '上官', '司马', '东方', '独孤', '南宫', '万俟', '闻人', 
                                  '夏侯', '诸葛', '尉迟', '公羊', '赫连', '澹台', '皇甫', '宗政', '濮阳', '公冶', 
                                  '太叔', '申屠', '公孙', '慕容', '仲孙', '钟离', '长孙', '宇文', '司徒', '鲜于', 
                                  '司空', '闾丘', '子车', '亓官', '司寇', '巫马', '公西', '颛孙', '壤驷', '公良', 
                                  '漆雕', '乐正', '宰父', '谷梁', '拓跋', '夹谷', '轩辕', '令狐', '段干', '百里', 
                                  '呼延', '东郭', '南门', '羊舌', '微生', '公户', '公玉', '公仪', '梁丘', '公仲', 
                                  '公上', '公门', '公山', '公坚', '左丘', '公伯', '西门', '公祖', '第五', '公乘', 
                                  '贯丘', '公皙', '南荣', '东里', '东宫', '仲长', '子书', '子桑', '即墨', '达奚', 
                                  '褚师'];
    
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
    
    console.log(`拆分姓名: "${fullName}" => 姓: "${lastName}", 名: "${firstName}"`);
    
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
    
    // 处理中文日期格式，如"2023年5月1日"
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
              if (['在职', '正式', '正式员工', '正式职工'].includes(value)) {
                value = '在职';
              } else if (['离职', '已离职'].includes(value)) {
                value = '离职';
              } else if (['试用', '试用期'].includes(value)) {
                value = '试用期';
              }
            } else if (mapping.apiField === 'gender_lookup_value_name' && value) {
              // 标准化性别值
              if (['男', '男性', 'M', 'Male'].includes(value)) {
                value = '男';
              } else if (['女', '女性', 'F', 'Female'].includes(value)) {
                value = '女';
              }
            } else if (mapping.apiField === 'bank_name' && value) {
              // 标准化银行名称
              if (value.includes('工商') || value.includes('ICBC')) {
                value = '中国工商银行';
              } else if (value.includes('建设') || value.includes('CCB')) {
                value = '中国建设银行';
              } else if (value.includes('农业') || value.includes('ABC')) {
                value = '中国农业银行';
              } else if (value.includes('中行') || value.includes('BOC')) {
                value = '中国银行';
              } else if (value.includes('交通') || value.includes('BOCOM')) {
                value = '交通银行';
              } else if (value.includes('邮政') || value.includes('PSBC')) {
                value = '中国邮政储蓄银行';
              }
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
        
        // 如果没有hire_date，使用当前日期
        if (!typedItem.hire_date) {
          const today = new Date();
          const year = today.getFullYear();
          const month = String(today.getMonth() + 1).padStart(2, '0');
          const day = String(today.getDate()).padStart(2, '0');
          typedItem.hire_date = `${year}-${month}-${day}`;
        }
        
        // 始终将员工状态设置为"在职"，无论是否已提供
        typedItem.status_lookup_value_name = typedItem.status_lookup_value_name || '在职';
        
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
                  render: (text, record: any) => {
                    // 调试: 查看渲染下拉列表时的字段数组
                    console.log('渲染下拉列表时的字段:', defaultApiFields);
                    return (
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
                    );
                  }
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