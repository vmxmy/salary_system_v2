import { BaseImportStrategy } from './BaseImportStrategy';
import type { ImportModeConfig, FieldConfig, UniversalImportData, UniversalValidationResult } from '../types';

/**
 * 缴费基数导入策略
 * 专门处理社保缴费基数和公积金缴费基数的批量导入
 */
export class SalaryBaseImportStrategy extends BaseImportStrategy {
  
  /**
   * 异步初始化策略（缴费基数导入不需要额外初始化）
   */
  async initialize(): Promise<void> {
    // 缴费基数导入不需要额外的初始化步骤
    console.log('SalaryBaseImportStrategy 初始化完成');
  }
  
  async getModeConfig(): Promise<ImportModeConfig> {
    const fields = this.generateFieldConfigs();
    const requiredFields = fields.filter(f => f.required);
    const optionalFields = fields.filter(f => !f.required);
    
    return {
      // 基本信息
      id: 'salary_base',
      name: '缴费基数导入',
      description: '批量导入员工的社保缴费基数和公积金缴费基数',
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
          type: 'custom',
          fields: ['social_insurance_base', 'housing_fund_base'],
          rule: 'at_least_one_required',
          message: '必须至少提供社保缴费基数或公积金缴费基数'
        },
        {
          type: 'range',
          fields: ['social_insurance_base', 'housing_fund_base'],
          rule: 'positive_number',
          message: '缴费基数必须为正数'
        }
      ],
      
      // API配置
      apiEndpoints: {
        validate: '/v2/simple-payroll/salary-configs/batch-validate',
        execute: '/v2/simple-payroll/salary-configs/batch-update',
        getRefData: [
          '/v2/simple-payroll/periods?status=ACTIVE'
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
          sourcePattern: /^社保(缴费)?基数$/i,
          targetField: 'social_insurance_base',
          confidence: 0.95,
          description: '社保缴费基数字段'
        },
        {
          sourcePattern: /^公积金(缴费)?基数$/i,
          targetField: 'housing_fund_base',
          confidence: 0.95,
          description: '公积金缴费基数字段'
        },
        {
          sourcePattern: /^养老保险基数$/i,
          targetField: 'social_insurance_base',
          confidence: 0.8,
          description: '养老保险基数（可作为社保基数）'
        },
        {
          sourcePattern: /^住房公积金基数$/i,
          targetField: 'housing_fund_base',
          confidence: 0.8,
          description: '住房公积金基数'
        }
      ],
      
      // 示例模板
      sampleTemplate: {
        headers: [
          '员工姓名', '身份证号', '社保缴费基数', '公积金缴费基数', '备注'
        ],
        sampleRows: [
          ['张三', '110101199001011234', 15000, 16000, '2025年1月调整'],
          ['李四', '110101199002022345', 18000, 20000, '新入职员工'],
          ['王五', '110101199003033456', 12000, 12000, '标准基数']
        ]
      },
      
      // 导入设置
      importSettings: {
        supportsBatch: true,
        maxBatchSize: 1000,
        requiresPeriodSelection: true,
        supportsOverwrite: true,
        defaultOverwriteMode: false
      }
    };
  }

  private generateFieldConfigs(): FieldConfig[] {
    const fields: FieldConfig[] = [];
    
    // 必填字段
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
    
    // 缴费基数字段
    fields.push(
      {
        key: 'social_insurance_base',
        name: '社保缴费基数',
        type: 'number',
        category: 'salary_base',
        required: false,
        description: '社会保险缴费基数，用于计算各项社保费用',
        validation: {
          min: 0,
          max: 100000,
          message: '社保缴费基数应在0-100000之间'
        }
      },
      {
        key: 'housing_fund_base',
        name: '公积金缴费基数',
        type: 'number',
        category: 'salary_base',
        required: false,
        description: '住房公积金缴费基数，用于计算公积金费用',
        validation: {
          min: 0,
          max: 100000,
          message: '公积金缴费基数应在0-100000之间'
        }
      }
    );
    
    // 可选字段
    fields.push(
      {
        key: 'remarks',
        name: '备注',
        type: 'text',
        category: 'other',
        required: false,
        description: '备注信息，记录调整原因等',
        validation: {
          maxLength: 200,
          message: '备注不能超过200个字符'
        }
      }
    );
    
    return fields;
  }

  processData(data: UniversalImportData, mapping: Record<string, string>): any[] {
    const processed = super.processData(data, mapping);

    // 自动拆分姓名
    return processed.map(row => {
      if (row.employee_name) {
        row.last_name = this.extractLastName(row.employee_name);
        row.first_name = this.extractFirstName(row.employee_name);
      }
      return row;
    });
  }

  async validateData(
    data: UniversalImportData[],
    settings: Record<string, any>
  ): Promise<UniversalValidationResult> {
    try {
      // 转换数据格式
      const baseUpdates = data.map((item, index) => ({
        employee_id: item.employee_id || undefined,
        social_insurance_base: item.social_insurance_base || undefined,
        housing_fund_base: item.housing_fund_base || undefined,
        employee_info: {
          last_name: item.last_name,
          first_name: item.first_name,
          id_number: item.id_number as string
        },
        clientId: item._clientId || `salary_base_${index}_${Date.now()}`
      }));

      // 调用后端验证API
      const response = await fetch('/v2/simple-payroll/salary-configs/batch-validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({
          period_id: settings.periodId,
          base_updates: baseUpdates,
          overwrite_mode: settings.overwriteMode || false
        })
      });

      if (!response.ok) {
        throw new Error(`验证请求失败: ${response.statusText}`);
      }

      const result = await response.json();
      
      return {
        isValid: result.data.invalid === 0,
        totalRecords: result.data.total,
        validRecords: result.data.valid,
        invalidRecords: result.data.invalid,
        warnings: result.data.warnings,
        errors: result.data.errors || [],
        validatedData: result.data.validated_data.map((item: any) => ({
          ...item,
          _clientId: item.clientId,
          __isValid: item.is_valid,
          __errors: item.errors,
          __warnings: item.warnings
        }))
      };
    } catch (error) {
      console.error('缴费基数验证失败:', error);
      throw error;
    }
  }

  async executeImport(
    validatedData: any[],
    settings: Record<string, any>
  ): Promise<any> {
    try {
      // 只处理有效的记录
      const validRecords = validatedData.filter(item => item.__isValid);
      
      if (validRecords.length === 0) {
        throw new Error('没有有效的记录可以导入');
      }

      // 转换为后端期望的格式
      const baseUpdates = validRecords.map(item => ({
        employee_id: item.employee_id,
        social_insurance_base: item.social_insurance_base,
        housing_fund_base: item.housing_fund_base,
        employee_info: {
          last_name: item.last_name,
          first_name: item.first_name,
          id_number: item.id_number
        }
      }));

      // 调用后端执行API
      const response = await fetch('/v2/simple-payroll/salary-configs/batch-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify(baseUpdates)
      });

      if (!response.ok) {
        throw new Error(`导入执行失败: ${response.statusText}`);
      }

      const result = await response.json();
      
      return {
        success: true,
        successCount: result.data.updated_count + result.data.created_count,
        failedCount: result.data.failed_count,
        message: result.data.message,
        details: result.data
      };
    } catch (error) {
      console.error('缴费基数导入执行失败:', error);
      throw error;
    }
  }

  protected extractLastName(fullName: string): string {
    if (!fullName) return '';
    // 简单的姓名分割逻辑，假设姓为第一个字符
    return fullName.charAt(0);
  }

  protected extractFirstName(fullName: string): string {
    if (!fullName) return '';
    // 简单的姓名分割逻辑，假设名为除第一个字符外的其余部分
    return fullName.slice(1);
  }

} 