/**
 * 员工信息批量导入策略
 * 支持员工个人信息、工作信息、银行账户信息的批量导入
 */

import { BaseImportStrategy } from './BaseImportStrategy';
import type {
  ImportModeConfig,
  FieldConfig,
  RawImportData,
  ProcessedRow,
  ValidationResult as UniversalValidationResult
} from '../types/universal';
import { OverwriteMode } from '../../../types/payrollTypes';
import { getBackendOverwriteMode, DEFAULT_IMPORT_SETTINGS } from '../constants/overwriteMode';
import { nanoid } from 'nanoid';

/**
 * 员工信息导入策略
 * 动态获取所有员工字段配置，支持个人信息、工作信息、银行账户信息
 */
export class EmployeeImportStrategy extends BaseImportStrategy {
  private lookupTypes: any[] = [];
  private departments: any[] = [];
  private positions: any[] = [];
  private personnelCategories: any[] = [];
  private isDataLoaded = false;

  /**
   * 异步初始化策略（加载字典数据、部门、职位等）
   */
  async initialize(): Promise<void> {
    if (this.isDataLoaded) {
      return;
    }
    await Promise.all([
      this.loadLookupTypes(),
      this.loadDepartments(),
      this.loadPositions(),
      this.loadPersonnelCategories()
    ]);
    this.isDataLoaded = true;
    console.log('EmployeeImportStrategy 初始化完成');
  }

  /**
   * 加载字典类型和值
   */
  private async loadLookupTypes(): Promise<void> {
    try {
      console.log('正在加载字典类型...');
      // 加载多个常用的字典类型
      const lookupTypes = ['GENDER', 'EMPLOYEE_STATUS', 'EMPLOYMENT_TYPE', 'MARITAL_STATUS', 'EDUCATION_LEVEL'];
      const allLookupValues = [];
      
      for (const typeCode of lookupTypes) {
        try {
          const response = await this.makeRequest(`/config/lookup-values-public?lookup_type_code=${typeCode}`);
          const result = await this.handleResponse(response);
          if (result.data) {
            allLookupValues.push(...result.data);
          }
        } catch (error) {
          console.warn(`加载字典类型 ${typeCode} 失败:`, error);
        }
      }
      
      this.lookupTypes = allLookupValues;
      console.log(`字典类型加载成功: 共 ${this.lookupTypes.length} 个选项`);
    } catch (error) {
      console.error('加载字典类型失败:', error);
      this.lookupTypes = [];
    }
  }

  /**
   * 加载部门数据
   */
  private async loadDepartments(): Promise<void> {
    try {
      console.log('正在加载部门数据...');
      const response = await this.makeRequest('/views-optimized/departments?size=1000');
      const result = await this.handleResponse(response);
      this.departments = result.data || [];
      console.log(`部门数据加载成功: 共 ${this.departments.length} 个部门`);
    } catch (error) {
      console.error('加载部门数据失败:', error);
      this.departments = [];
    }
  }

  /**
   * 加载职位数据
   */
  private async loadPositions(): Promise<void> {
    try {
      console.log('正在加载职位数据...');
      const response = await this.makeRequest('/views-optimized/positions?size=1000');
      const result = await this.handleResponse(response);
      this.positions = result.data || [];
      console.log(`职位数据加载成功: 共 ${this.positions.length} 个职位`);
    } catch (error) {
      console.error('加载职位数据失败:', error);
      this.positions = [];
    }
  }

  /**
   * 加载人员类别数据
   */
  private async loadPersonnelCategories(): Promise<void> {
    try {
      console.log('正在加载人员类别数据...');
      const response = await this.makeRequest('/views-optimized/personnel-categories?size=1000');
      const result = await this.handleResponse(response);
      this.personnelCategories = result.data || [];
      console.log(`人员类别数据加载成功: 共 ${this.personnelCategories.length} 个类别`);
    } catch (error) {
      console.error('加载人员类别数据失败:', error);
      this.personnelCategories = [];
    }
  }

  /**
   * 获取员工导入模式配置
   */
  async getModeConfig(): Promise<ImportModeConfig> {
    // 在页面加载时不初始化，避免API调用
    console.log('🔄 [员工导入策略] 获取配置，数据加载状态:', this.isDataLoaded);
    
    const fields = this.generateFieldConfigs();
    const requiredFields = fields.filter(f => f.required);
    const optionalFields = fields.filter(f => !f.required);
    
    return {
      // 基本信息
      id: 'employee',
      name: '员工信息导入',
      description: '批量导入员工的个人信息、工作信息和银行账户信息',
      icon: '👥',
      
      // 字段配置
      fields,
      requiredFields,
      optionalFields,
      
      // 验证规则
      validationRules: [
        {
          type: 'required',
          fields: ['first_name', 'last_name', 'hire_date'],
          rule: 'not_empty',
          message: '姓名和入职日期不能为空'
        },
        {
          type: 'format',
          fields: ['id_number'],
          rule: 'id_card_format',
          message: '身份证号格式不正确'
        },
        {
          type: 'format',
          fields: ['email'],
          rule: 'email_format',
          message: '邮箱格式不正确'
        }
      ],
      
      // API配置
      apiEndpoints: {
        validate: '/v2/employees/batch-validate',
        execute: '/v2/employees/batch-import',
        getRefData: [
          '/config/lookup-values-public?size=1000',
          '/views-optimized/departments?size=1000',
          '/views-optimized/positions?size=1000',
          '/views-optimized/personnel-categories?size=1000'
        ]
      },
      
      // 字段映射提示
      fieldMappingHints: this.generateMappingHints(),
      
      // 示例模板
      sampleTemplate: {
        headers: [
          '姓', '名', '身份证号', '性别', '出生日期', '入职日期', '部门', '职位', 
          '邮箱', '电话', '银行名称', '银行账号', '备注'
        ],
        sampleRows: [
          ['张', '三', '110101199001011234', '男', '1990-01-01', '2024-01-01', '技术部', '软件工程师', 'zhangsan@company.com', '13800138000', '中国银行', '6217000000000000001', '新员工'],
          ['李', '四', '110101199002022345', '女', '1990-02-02', '2024-01-15', '人事部', '人事专员', 'lisi@company.com', '13800138001', '工商银行', '6222000000000000002', ''],
          ['王', '五', '110101199003033456', '男', '1990-03-03', '2024-02-01', '财务部', '会计', 'wangwu@company.com', '13800138002', '建设银行', '6227000000000000003', '']
        ]
      },
      
      // 导入设置
      importSettings: {
        supportsBatch: true,
        maxBatchSize: 500,
        requiresPeriodSelection: false,
        supportsOverwrite: true,
        defaultOverwriteMode: false
      }
    };
  }

  /**
   * 动态生成字段配置
   */
  private generateFieldConfigs(): FieldConfig[] {
    const fields: FieldConfig[] = [];
    
    // 基础标识字段（必填）
    fields.push(
      {
        key: 'last_name',
        name: '姓',
        type: 'text',
        category: 'base',
        required: true,
        description: '员工的姓氏',
        validation: {
          maxLength: 100,
          message: '姓氏不能超过100个字符'
        }
      },
      {
        key: 'first_name',
        name: '名',
        type: 'text',
        category: 'base',
        required: true,
        description: '员工的名字',
        validation: {
          maxLength: 100,
          message: '名字不能超过100个字符'
        }
      },
      {
        key: 'hire_date',
        name: '入职日期',
        type: 'date',
        category: 'base',
        required: true,
        description: '员工入职日期',
        validation: {
          message: '请输入有效的日期格式'
        }
      }
    );
    
    // 个人信息字段（可选）
    fields.push(
      {
        key: 'employee_code',
        name: '员工编号',
        type: 'text',
        category: 'base',
        required: false,
        description: '员工唯一编号',
        validation: {
          maxLength: 50,
          message: '员工编号不能超过50个字符'
        }
      },
      {
        key: 'id_number',
        name: '身份证号',
        type: 'text',
        category: 'base',
        required: false,
        description: '员工身份证号码',
        validation: {
          pattern: /^\d{17}(\d|X)$/i,
          message: '身份证号格式不正确'
        }
      },
      {
        key: 'date_of_birth',
        name: '出生日期',
        type: 'date',
        category: 'base',
        required: false,
        description: '员工出生日期'
      },
      {
        key: 'nationality',
        name: '国籍',
        type: 'text',
        category: 'base',
        required: false,
        description: '员工国籍',
        validation: {
          maxLength: 100,
          message: '国籍不能超过100个字符'
        }
      },
      {
        key: 'ethnicity',
        name: '民族',
        type: 'text',
        category: 'base',
        required: false,
        description: '员工民族',
        validation: {
          maxLength: 100,
          message: '民族不能超过100个字符'
        }
      }
    );
    
    // 联系信息字段
    fields.push(
      {
        key: 'email',
        name: '邮箱',
        type: 'text',
        category: 'base',
        required: false,
        description: '员工邮箱地址',
        validation: {
          pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
          message: '邮箱格式不正确'
        }
      },
      {
        key: 'phone_number',
        name: '电话号码',
        type: 'text',
        category: 'base',
        required: false,
        description: '员工联系电话',
        validation: {
          maxLength: 50,
          message: '电话号码不能超过50个字符'
        }
      },
      {
        key: 'home_address',
        name: '家庭地址',
        type: 'text',
        category: 'base',
        required: false,
        description: '员工家庭住址'
      },
      {
        key: 'emergency_contact_name',
        name: '紧急联系人姓名',
        type: 'text',
        category: 'base',
        required: false,
        description: '紧急联系人的姓名',
        validation: {
          maxLength: 255,
          message: '紧急联系人姓名不能超过255个字符'
        }
      },
      {
        key: 'emergency_contact_phone',
        name: '紧急联系人电话',
        type: 'text',
        category: 'base',
        required: false,
        description: '紧急联系人的电话号码',
        validation: {
          maxLength: 50,
          message: '紧急联系人电话不能超过50个字符'
        }
      }
    );
    
    // 工作信息字段
    fields.push(
      {
        key: 'first_work_date',
        name: '首次工作日期',
        type: 'date',
        category: 'base',
        required: false,
        description: '员工首次参加工作的日期'
      },
      {
        key: 'current_position_start_date',
        name: '当前职位开始日期',
        type: 'date',
        category: 'base',
        required: false,
        description: '员工在当前职位的开始日期'
      },
      {
        key: 'career_position_level_date',
        name: '职级评定日期',
        type: 'date',
        category: 'base',
        required: false,
        description: '员工职级评定的日期'
      },
      {
        key: 'interrupted_service_years',
        name: '中断服务年限',
        type: 'number',
        category: 'base',
        required: false,
        description: '员工中断服务的年限',
        validation: {
          min: 0,
          max: 50,
          message: '中断服务年限应在0-50年之间'
        }
      },
      {
        key: 'social_security_client_number',
        name: '社保个人客户号',
        type: 'text',
        category: 'base',
        required: false,
        description: '员工社保个人客户号',
        validation: {
          maxLength: 50,
          message: '社保个人客户号不能超过50个字符'
        }
      },
      {
        key: 'housing_fund_client_number',
        name: '公积金个人客户号',
        type: 'text',
        category: 'base',
        required: false,
        description: '员工公积金个人客户号',
        validation: {
          maxLength: 50,
          message: '公积金个人客户号不能超过50个字符'
        }
      }
    );
    
    // 银行账户字段
    fields.push(
      {
        key: 'bank_name',
        name: '银行名称',
        type: 'text',
        category: 'base',
        required: false,
        description: '员工银行账户的银行名称',
        validation: {
          maxLength: 255,
          message: '银行名称不能超过255个字符'
        }
      },
      {
        key: 'bank_account_number',
        name: '银行账号',
        type: 'text',
        category: 'base',
        required: false,
        description: '员工银行账户号码',
        validation: {
          maxLength: 100,
          message: '银行账号不能超过100个字符'
        }
      },
      {
        key: 'account_holder_name',
        name: '账户持有人姓名',
        type: 'text',
        category: 'base',
        required: false,
        description: '银行账户持有人姓名',
        validation: {
          maxLength: 255,
          message: '账户持有人姓名不能超过255个字符'
        }
      },
      {
        key: 'branch_name',
        name: '开户支行',
        type: 'text',
        category: 'base',
        required: false,
        description: '银行开户支行名称',
        validation: {
          maxLength: 255,
          message: '开户支行名称不能超过255个字符'
        }
      }
    );
    
    // 只有在数据已加载时才添加动态字段
    if (this.isDataLoaded) {
      // 动态添加字典值字段
      this.addLookupFields(fields);
      
      // 动态添加关联字段
      this.addRelationFields(fields);
    } else {
      console.log('🔄 [员工导入策略] 数据未加载，跳过动态字段生成');
    }
    
    return fields;
  }

  /**
   * 动态添加字典值字段
   */
  private addLookupFields(fields: FieldConfig[]): void {
    // 员工相关的字典类型
    const employeeLookupTypes = [
      'GENDER', 'EMPLOYEE_STATUS', 'EMPLOYMENT_TYPE', 'EDUCATION_LEVEL',
      'MARITAL_STATUS', 'POLITICAL_STATUS', 'CONTRACT_TYPE', 'JOB_POSITION_LEVEL',
      'SALARY_LEVEL', 'SALARY_GRADE'
    ];

    employeeLookupTypes.forEach(lookupType => {
      const lookupValues = this.lookupTypes.filter(item => 
        item.lookup_type_code === lookupType && item.is_active
      );
      
      if (lookupValues.length > 0) {
        const fieldKey = this.getLookupFieldKey(lookupType);
        const fieldName = this.getLookupFieldName(lookupType);
        
        fields.push({
          key: fieldKey,
          name: fieldName,
          type: 'select',
          category: 'lookup',
          required: lookupType === 'EMPLOYEE_STATUS', // 员工状态为必填
          lookupType: lookupType,
          description: `选择${fieldName}`,
          validation: {
            message: `请选择有效的${fieldName}`
          }
        });
      }
    });
  }

  /**
   * 动态添加关联字段
   */
  private addRelationFields(fields: FieldConfig[]): void {
    // 部门字段
    if (this.departments.length > 0) {
      fields.push({
        key: 'department_name',
        name: '部门',
        type: 'select',
        category: 'lookup',
        required: false,
        description: '员工所属部门',
        validation: {
          message: '请选择有效的部门'
        }
      });
    }

    // 职位字段
    if (this.positions.length > 0) {
      fields.push({
        key: 'position_name',
        name: '职位',
        type: 'select',
        category: 'lookup',
        required: false,
        description: '员工职位',
        validation: {
          message: '请选择有效的职位'
        }
      });
    }

    // 人员类别字段
    if (this.personnelCategories.length > 0) {
      fields.push({
        key: 'personnel_category_name',
        name: '人员类别',
        type: 'select',
        category: 'lookup',
        required: false,
        description: '员工人员类别',
        validation: {
          message: '请选择有效的人员类别'
        }
      });
    }
  }

  /**
   * 获取字典字段的键名
   */
  private getLookupFieldKey(lookupType: string): string {
    const mapping: Record<string, string> = {
      'GENDER': 'gender_name',
      'EMPLOYEE_STATUS': 'employee_status',
      'EMPLOYMENT_TYPE': 'employment_type_name',
      'EDUCATION_LEVEL': 'education_level_name',
      'MARITAL_STATUS': 'marital_status_name',
      'POLITICAL_STATUS': 'political_status_name',
      'CONTRACT_TYPE': 'contract_type_name',
      'JOB_POSITION_LEVEL': 'job_position_level_name',
      'SALARY_LEVEL': 'salary_level_name',
      'SALARY_GRADE': 'salary_grade_name'
    };
    return mapping[lookupType] || lookupType.toLowerCase();
  }

  /**
   * 获取字典字段的显示名称
   */
  private getLookupFieldName(lookupType: string): string {
    const mapping: Record<string, string> = {
      'GENDER': '性别',
      'EMPLOYEE_STATUS': '员工状态',
      'EMPLOYMENT_TYPE': '雇佣类型',
      'EDUCATION_LEVEL': '教育水平',
      'MARITAL_STATUS': '婚姻状况',
      'POLITICAL_STATUS': '政治面貌',
      'CONTRACT_TYPE': '合同类型',
      'JOB_POSITION_LEVEL': '职务级别',
      'SALARY_LEVEL': '工资级别',
      'SALARY_GRADE': '工资档次'
    };
    return mapping[lookupType] || lookupType;
  }

  /**
   * 生成字段映射提示
   */
  private generateMappingHints() {
    return [
      // 基础字段映射
      {
        sourcePattern: /^姓$/i,
        targetField: 'last_name',
        confidence: 0.95,
        description: '员工姓氏字段'
      },
      {
        sourcePattern: /^名$/i,
        targetField: 'first_name',
        confidence: 0.95,
        description: '员工名字字段'
      },
      {
        sourcePattern: /^(员工)?编号$/i,
        targetField: 'employee_code',
        confidence: 0.9,
        description: '员工编号字段'
      },
      {
        sourcePattern: /^身份证(号码?)?$/i,
        targetField: 'id_number',
        confidence: 0.95,
        description: '身份证号码字段'
      },
      {
        sourcePattern: /^入职日期$/i,
        targetField: 'hire_date',
        confidence: 0.95,
        description: '入职日期字段'
      },
      {
        sourcePattern: /^出生日期$/i,
        targetField: 'date_of_birth',
        confidence: 0.9,
        description: '出生日期字段'
      },
      {
        sourcePattern: /^性别$/i,
        targetField: 'gender_name',
        confidence: 0.95,
        description: '性别字段'
      },
      {
        sourcePattern: /^国籍$/i,
        targetField: 'nationality',
        confidence: 0.9,
        description: '国籍字段'
      },
      {
        sourcePattern: /^民族$/i,
        targetField: 'ethnicity',
        confidence: 0.9,
        description: '民族字段'
      },
      // 联系信息字段
      {
        sourcePattern: /^(电子)?邮箱$/i,
        targetField: 'email',
        confidence: 0.9,
        description: '邮箱地址字段'
      },
      {
        sourcePattern: /^(联系)?电话(号码)?$/i,
        targetField: 'phone_number',
        confidence: 0.9,
        description: '电话号码字段'
      },
      {
        sourcePattern: /^(家庭)?地址$/i,
        targetField: 'home_address',
        confidence: 0.85,
        description: '家庭地址字段'
      },
      // 工作信息字段
      {
        sourcePattern: /^部门$/i,
        targetField: 'department_name',
        confidence: 0.9,
        description: '部门字段'
      },
      {
        sourcePattern: /^职位$/i,
        targetField: 'position_name',
        confidence: 0.9,
        description: '职位字段'
      },
      {
        sourcePattern: /^人员类别$/i,
        targetField: 'personnel_category_name',
        confidence: 0.9,
        description: '人员类别字段'
      },
      // 银行信息字段
      {
        sourcePattern: /^银行(名称)?$/i,
        targetField: 'bank_name',
        confidence: 0.9,
        description: '银行名称字段'
      },
      {
        sourcePattern: /^(银行)?账号$/i,
        targetField: 'bank_account_number',
        confidence: 0.9,
        description: '银行账号字段'
      },
      {
        sourcePattern: /^开户支行$/i,
        targetField: 'branch_name',
        confidence: 0.85,
        description: '开户支行字段'
      }
    ];
  }

  /**
   * 处理原始数据
   */
  processData(rawData: RawImportData, mapping: Record<string, string>): ProcessedRow[] {
    const { headers, rows } = rawData;
    
    return rows.map((row, index) => {
      const data: Record<string, any> = {};
      
      // 根据映射处理每个字段
      headers.forEach((header, colIndex) => {
        const systemField = mapping[header];
        if (systemField && colIndex < row.length) {
          const cellValue = row[colIndex];
          data[systemField] = this.transformFieldValue(systemField, cellValue);
        }
      });
      
      // 生成客户端ID
      const clientId = nanoid();
      
      return {
        data,
        _meta: {
          rowIndex: index + 1,
          clientId,
          sourceRow: row
        }
      };
    });
  }

  /**
   * 转换字段值
   */
  private transformFieldValue(fieldKey: string, value: any): any {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    // 日期字段处理
    if (fieldKey.includes('date')) {
      return this.parseDate(value);
    }

    // 数字字段处理
    if (fieldKey === 'interrupted_service_years') {
      const num = parseFloat(value);
      return isNaN(num) ? null : num;
    }

    // 字典值字段处理（需要转换为对应的ID）
    if (fieldKey.endsWith('_name') || fieldKey === 'employee_status') {
      return this.resolveLookupValue(fieldKey, value);
    }

    // 关联字段处理
    if (['department_name', 'position_name', 'personnel_category_name'].includes(fieldKey)) {
      return this.resolveRelationValue(fieldKey, value);
    }

    // 默认返回字符串值
    return String(value).trim();
  }

  /**
   * 解析日期
   */
  private parseDate(value: any): string | null {
    if (!value) return null;
    
    try {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        return null;
      }
      return date.toISOString().split('T')[0]; // 返回 YYYY-MM-DD 格式
    } catch {
      return null;
    }
  }

  /**
   * 解析字典值
   */
  private resolveLookupValue(fieldKey: string, value: any): string | null {
    if (!value) return null;
    
    const valueStr = String(value).trim();
    
    // 根据字段类型查找对应的字典值
    const lookupType = this.getLookupTypeByFieldKey(fieldKey);
    if (!lookupType) return valueStr;
    
    const lookupItem = this.lookupTypes.find(item => 
      item.lookup_type_code === lookupType && 
      (item.display_name === valueStr || item.value === valueStr)
    );
    
    return lookupItem ? lookupItem.display_name : valueStr;
  }

  /**
   * 解析关联值
   */
  private resolveRelationValue(fieldKey: string, value: any): string | null {
    if (!value) return null;
    
    const valueStr = String(value).trim();
    
    switch (fieldKey) {
      case 'department_name':
        const dept = this.departments.find(d => d.name === valueStr);
        return dept ? dept.name : valueStr;
      
      case 'position_name':
        const pos = this.positions.find(p => p.name === valueStr);
        return pos ? pos.name : valueStr;
      
      case 'personnel_category_name':
        const cat = this.personnelCategories.find(c => c.name === valueStr);
        return cat ? cat.name : valueStr;
      
      default:
        return valueStr;
    }
  }

  /**
   * 根据字段键获取字典类型
   */
  private getLookupTypeByFieldKey(fieldKey: string): string | null {
    const mapping: Record<string, string> = {
      'gender_name': 'GENDER',
      'employee_status': 'EMPLOYEE_STATUS',
      'employment_type_name': 'EMPLOYMENT_TYPE',
      'education_level_name': 'EDUCATION_LEVEL',
      'marital_status_name': 'MARITAL_STATUS',
      'political_status_name': 'POLITICAL_STATUS',
      'contract_type_name': 'CONTRACT_TYPE',
      'job_position_level_name': 'JOB_POSITION_LEVEL',
      'salary_level_name': 'SALARY_LEVEL',
      'salary_grade_name': 'SALARY_GRADE'
    };
    return mapping[fieldKey] || null;
  }

  /**
   * 验证处理后的数据
   */
  async validateData(processedData: ProcessedRow[], periodId: number, overwriteMode: OverwriteMode = OverwriteMode.NONE): Promise<UniversalValidationResult[]> {
    console.log(`开始验证员工数据，共 ${processedData.length} 条记录`);
    
    // 转换为后端期望的格式
    const employees = processedData.map(row => ({
      ...row.data,
      client_id: row._meta.clientId
    }));

    const apiPayload = {
      employees,
      overwrite_mode: getBackendOverwriteMode(overwriteMode)
    };
    
    try {
      const response = await this.makeRequest('/v2/employees/batch-validate', {
        method: 'POST',
        body: JSON.stringify(apiPayload)
      });
      const result = await this.handleResponse(response);
      
      // 转换后端验证结果为前端格式
      return processedData.map(row => {
        const backendResult = result.validation_results?.find((r: any) => r.client_id === row._meta.clientId);
        
        return {
          isValid: backendResult?.is_valid || false,
          clientId: row._meta.clientId,
          fieldConflicts: false,
          errors: this.formatValidationMessages(backendResult?.errors || []),
          warnings: this.formatValidationMessages(backendResult?.warnings || [])
        };
      });
    } catch (error) {
      console.error('员工数据验证失败:', error);
      // 返回默认的验证失败结果
      return processedData.map(row => ({
        isValid: false,
        clientId: row._meta.clientId,
        fieldConflicts: false,
        errors: [{ field: 'general', message: '验证服务暂时不可用' }],
        warnings: []
      }));
    }
  }

  /**
   * 格式化验证消息
   */
  private formatValidationMessages(messages: any[]): Array<{ field: string; message: string }> {
    if (!Array.isArray(messages)) return [];
    
    return messages.map(msg => {
      if (typeof msg === 'string') {
        return { field: 'general', message: msg };
      }
      if (msg && typeof msg === 'object') {
        return {
          field: msg.field || 'general',
          message: msg.message || String(msg)
        };
      }
      return { field: 'general', message: String(msg) };
    });
  }

  /**
   * 执行员工数据导入
   */
  async importData(validatedData: ProcessedRow[], periodId: number, overwriteMode: OverwriteMode = OverwriteMode.NONE): Promise<any> {
    console.log(`准备导入员工数据，共 ${validatedData.length} 条记录`);

    // 转换为后端期望的格式
    const employees = validatedData.map(row => ({
      ...row.data,
      client_id: row._meta.clientId
    }));

    const apiPayload = {
      employees,
      overwrite_mode: getBackendOverwriteMode(overwriteMode)
    };
    
    try {
      const response = await this.makeRequest('/v2/employees/batch-import', {
        method: 'POST',
        body: JSON.stringify(apiPayload)
      });
      const result = await this.handleResponse(response);
      
      return {
        success: true,
        successCount: result.success_count || 0,
        failedCount: result.error_count || 0,
        message: result.message || '员工信息导入完成',
        details: result
      };
    } catch (error) {
      console.error('员工数据导入执行失败:', error);
      throw error;
    }
  }
} 