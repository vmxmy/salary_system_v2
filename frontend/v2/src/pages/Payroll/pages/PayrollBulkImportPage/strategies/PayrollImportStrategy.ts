/**
 * 薪资导入策略实现
 * 封装现有薪资导入逻辑到通用导入架构中
 */

import { BaseImportStrategy } from './BaseImportStrategy';
import type { 
  ImportModeConfig, 
  FieldConfig, 
  RawImportData, 
  ProcessedRow, 
  ValidationResult, 
  PayrollPeriod,
  OverwriteMode
} from '../types';
import { getBackendOverwriteMode, DEFAULT_IMPORT_SETTINGS } from '../constants/overwriteMode';
import { nanoid } from 'nanoid';

export class PayrollImportStrategy extends BaseImportStrategy {
  private payrollComponents: any[] = [];
  private payrollPeriods: PayrollPeriod[] = [];
  private isDataLoaded = false;

  /**
   * 异步初始化策略（加载薪资组件定义和薪资周期）
   */
  async initialize(): Promise<void> {
    if (this.isDataLoaded) {
      return;
    }
    await Promise.all([this.loadPayrollComponents(), this.loadPayrollPeriods()]);
    this.isDataLoaded = true;
  }

  /**
   * 获取薪资导入模式配置
   */
  async getModeConfig(): Promise<ImportModeConfig> {
    await this.initialize(); // 确保组件已加载
    
    const fields = this.generateFieldConfigs();
    const requiredFields = fields.filter(f => f.required);
    const optionalFields = fields.filter(f => !f.required);
    
    return {
      // 基本信息
      id: 'payroll',
      name: '薪资数据导入',
      description: '批量导入员工的薪资数据，包括基本工资、津贴、奖金等',
      icon: '💰',
      
      // 字段配置
      fields,
      requiredFields,
      optionalFields,
      
      // 验证规则
      validationRules: [
        {
          type: 'required',
          fields: ['employee_name'],
          rule: 'not_empty',
          message: '员工姓名不能为空'
        },
        {
          type: 'range',
          fields: ['basic_salary'],
          rule: 'positive_number',
          message: '基本工资必须为正数'
        }
      ],
      
      // API配置
      apiEndpoints: {
        validate: '/payroll/batch-validate',
        execute: '/payroll/batch-import',
        getRefData: [
          '/simple-payroll/periods?status=ACTIVE',
          '/config/payroll-component-definitions?is_active=true'
        ]
      },
      
      // 字段映射提示
      fieldMappingHints: [
        {
          sourcePattern: /^(员工)?姓名$/i,
          targetField: 'employee_name',
          confidence: 0.9,
          description: '员工姓名字段'
        },
        {
          sourcePattern: /^身份证(号码?)?$/i,
          targetField: 'id_number',
          confidence: 0.9,
          description: '身份证号码字段'
        },
        {
          sourcePattern: /^基本工资$/i,
          targetField: 'basic_salary',
          confidence: 0.95,
          description: '基本工资字段'
        },
        {
          sourcePattern: /^岗位工资$/i,
          targetField: 'position_salary',
          confidence: 0.9,
          description: '岗位工资字段'
        },
        {
          sourcePattern: /^绩效工资$/i,
          targetField: 'performance_salary',
          confidence: 0.9,
          description: '绩效工资字段'
        }
      ],
      
      // 示例模板
      sampleTemplate: {
        headers: [
          '员工姓名', '身份证号', '基本工资', '岗位工资', '绩效工资', '津贴', '奖金', '备注'
        ],
        sampleRows: [
          ['张三', '110101199001011234', 8000, 2000, 1500, 500, 1000, '正常发放'],
          ['李四', '110101199002022345', 9000, 2500, 2000, 600, 1200, '优秀员工'],
          ['王五', '110101199003033456', 7500, 1800, 1200, 400, 800, '标准薪资']
        ]
      },
      
      // 导入设置
      importSettings: {
        supportsBatch: true,
        maxBatchSize: 1000,
        requiresPeriodSelection: true,
        supportsOverwrite: true,
        defaultOverwriteMode: false
      },
      
      // 薪资周期数据
      payrollPeriods: this.payrollPeriods,
    };
  }

  /**
   * 异步加载薪资组件定义
   */
  private async loadPayrollComponents(): Promise<void> {
    try {
      console.log('正在加载薪资组件定义...');
      const response = await this.makeRequest('/config/payroll-component-definitions?is_active=true&size=100');
      const result = await this.handleResponse(response);
      this.payrollComponents = result.data || [];
      console.log('薪资组件定义加载成功');
    } catch (error) {
      console.error('加载薪资组件定义失败:', error);
      this.payrollComponents = [];
    }
  }

  /**
   * 异步加载薪资周期
   */
  private async loadPayrollPeriods(): Promise<void> {
    try {
      console.log('正在加载薪资周期...');
      const response = await this.makeRequest('/simple-payroll/periods?is_active=true&size=100');
      const result = await this.handleResponse(response);
      this.payrollPeriods = result.items || [];
      console.log(`薪资周期加载成功: 共 ${this.payrollPeriods.length} 个周期`);
    } catch (error) {
      console.error('加载薪资周期失败:', error);
      this.payrollPeriods = [];
    }
  }

  private generateFieldConfigs(): FieldConfig[] {
    const fields: FieldConfig[] = [];
    
    // 必填字段（员工标识）
    fields.push(
      {
        key: 'employee_name',
        name: '员工姓名',
        type: 'text',
        category: 'employee',
        required: true,
        description: '员工的完整姓名，用于匹配员工记录',
        validation: {
          maxLength: 50,
          message: '员工姓名不能超过50个字符'
        }
      },
      {
        key: 'id_number',
        name: '身份证号',
        type: 'text',
        category: 'employee',
        required: false,
        description: '员工身份证号码，用于精确匹配员工',
        validation: {
          pattern: /^\d{17}(\d|X)$/i,
          message: '身份证号格式不正确'
        }
      }
    );
    
    // 动态生成薪资组件字段
    this.payrollComponents.forEach((component, index) => {
      const category = this.mapComponentTypeToCategory(component.type);
      const code = component.code || `item_${index}`;
      const name = component.name || component.description || code;
      
      fields.push({
        key: `${category}_${code}`,
        name: name,
        type: 'number',
        category,
        required: false,
        description: component.description || `${name}金额`,
        validation: {
          min: 0,
          max: component.max_value || 999999,
          message: `${name}应在0-${component.max_value || 999999}之间`
        }
      });
    });
    
    // 备注字段
    fields.push({
      key: 'remarks',
      name: '备注',
      type: 'text',
      category: 'other',
      required: false,
      description: '备注信息',
      validation: {
        maxLength: 200,
        message: '备注不能超过200个字符'
      }
    });
    
    return fields;
  }

  /**
   * 将组件类型映射到字段类别
   */
  private mapComponentTypeToCategory(componentType: string): string {
    switch (componentType) {
      case 'EARNING':
        return 'earning';
      case 'DEDUCTION':
      case 'PERSONAL_DEDUCTION':
      case 'EMPLOYER_DEDUCTION':
        return 'deduction';
      default:
        return 'other';
    }
  }

  processData(
    rawData: RawImportData,
    mapping: Record<string, string>
  ): ProcessedRow[] {
    const { headers, rows } = rawData;
    const systemToExcelMap: Record<string, string> = {};
    for (const excelHeader in mapping) {
      const systemKey = mapping[excelHeader];
      if (systemKey) {
        systemToExcelMap[systemKey] = excelHeader;
      }
    }

    return rows.map((row, rowIndex) => {
      const rowData: Record<string, any> = {};
      headers.forEach((header, colIndex) => {
        const systemKey = mapping[header];
        if (systemKey) {
          rowData[systemKey] = row[colIndex];
        }
      });
      return {
        data: rowData,
        _meta: {
          rowIndex: rowIndex,
          clientId: nanoid(),
        },
      };
    });
  }

  async validateData(processedData: ProcessedRow[], periodId: number, overwriteMode: OverwriteMode = 'append'): Promise<ValidationResult[]> {
    // 转换为后端期望的格式
    const entries = processedData.map(row => {
      // 从完整姓名中提取姓和名
      const fullName = row.data.employee_name || '';
      const lastName = this.extractLastName(fullName);
      const firstName = this.extractFirstName(fullName);
      
      console.log(`🔍 [姓名转换] 完整姓名: "${fullName}" -> 姓: "${lastName}", 名: "${firstName}"`);
      
      return {
        payroll_period_id: periodId,
        payroll_run_id: 0, // 后端会自动创建或分配
        status_lookup_value_id: 60, // 60 = "待计算" 状态
        gross_pay: row.data.gross_pay || 0,
        total_deductions: row.data.total_deductions || 0,
        net_pay: row.data.net_pay || 0,
        earnings_details: row.data.earnings_details || {},
        deductions_details: row.data.deductions_details || {},
        remarks: row.data.remarks || '',
        employee_info: {
          last_name: lastName,
          first_name: firstName,
          id_number: row.data.id_number || ''
        }
      };
    });

    const apiPayload = {
      payroll_period_id: periodId,
      entries,
      overwrite_mode: getBackendOverwriteMode(overwriteMode)
    };

    try {
      const response = await this.makeRequest('/payroll-entries/bulk/validate', {
        method: 'POST',
        body: JSON.stringify(apiPayload)
      });
      const result = await this.handleResponse(response);

      // 将后端返回的结果映射为 ValidationResult[]
      const validatedData = result.validatedData || [];
      
      return processedData.map((row, index) => {
        const validation = validatedData[index];
        if (validation) {
          return {
            isValid: validation.__isValid || false,
            clientId: row._meta.clientId,
            errors: validation.__errors || [],
            warnings: validation.warnings || [],
          };
        }
        // 如果后端没有返回此条记录的验证结果，则标记为无效
        return {
          isValid: false,
          clientId: row._meta.clientId,
          errors: [{ field: 'general', message: '后端未返回此记录的验证结果' }],
          warnings: [],
        };
      });
    } catch (error) {
      console.error('薪资数据验证失败:', error);
      // 如果整个请求失败，将所有行标记为错误
      return processedData.map(row => ({
        isValid: false,
        clientId: row._meta.clientId,
        errors: [{ field: 'general', message: `API请求失败: ${error instanceof Error ? error.message : '未知错误'}` }],
        warnings: [],
      }));
    }
  }

  /**
   * 将经过验证的数据提交到后端
   */
  async importData(validatedData: ProcessedRow[], periodId: number, overwriteMode: OverwriteMode = 'append'): Promise<any> {
    console.log(`准备导入薪资数据到周期 ID: ${periodId}`, validatedData);

    // 转换为后端期望的格式
    const entries = validatedData.map(row => {
      // 从完整姓名中提取姓和名
      const fullName = row.data.employee_name || '';
      const lastName = this.extractLastName(fullName);
      const firstName = this.extractFirstName(fullName);
      
      return {
        payroll_period_id: periodId,
        payroll_run_id: 0, // 后端会自动创建或分配
        status_lookup_value_id: 60, // 60 = "待计算" 状态
        gross_pay: row.data.gross_pay || 0,
        total_deductions: row.data.total_deductions || 0,
        net_pay: row.data.net_pay || 0,
        earnings_details: row.data.earnings_details || {},
        deductions_details: row.data.deductions_details || {},
        remarks: row.data.remarks || '',
        employee_info: {
          last_name: lastName,
          first_name: firstName,
          id_number: row.data.id_number || ''
        }
      };
    });

    const apiPayload = {
      payroll_period_id: periodId,
      entries,
      overwrite_mode: getBackendOverwriteMode(overwriteMode)
    };
    
    try {
      const response = await this.makeRequest('/payroll-entries/bulk', {
        method: 'POST',
        body: JSON.stringify(apiPayload)
      });
      const result = await this.handleResponse(response);
      
      return {
        success: true,
        successCount: result.success_count || 0,
        failedCount: result.error_count || 0,
        message: result.message || '导入完成',
        details: result
      };
    } catch (error) {
       console.error('薪资数据导入执行失败:', error);
       throw error;
    }
  }

  protected extractLastName(fullName: string): string {
    if (!fullName) return '';
    
    const trimmedName = fullName.trim();
    
    // 常见复姓列表
    const compoundSurnames = [
      '欧阳', '太史', '端木', '上官', '司马', '东方', '独孤', '南宫', '万俟', '闻人',
      '夏侯', '诸葛', '尉迟', '公羊', '赫连', '澹台', '皇甫', '宗政', '濮阳', '公冶',
      '太叔', '申屠', '公孙', '慕容', '仲孙', '钟离', '长孙', '宇文', '司徒', '鲜于'
    ];
    
    // 检查是否是复姓
    for (const surname of compoundSurnames) {
      if (trimmedName.startsWith(surname)) {
        return surname;
      }
    }
    
    // 默认取第一个字符作为姓
    return trimmedName.charAt(0);
  }

  protected extractFirstName(fullName: string): string {
    if (!fullName) return '';
    
    const trimmedName = fullName.trim();
    const lastName = this.extractLastName(trimmedName);
    
    // 返回除姓之外的部分作为名
    return trimmedName.slice(lastName.length);
  }
}

 