import { BaseImportStrategy } from './BaseImportStrategy';
import type { 
  ImportModeConfig, 
  FieldConfig, 
  RawImportData, 
  ProcessedRow, 
  ValidationResult,
  OverwriteMode
} from '../types';
import { getBackendOverwriteMode, DEFAULT_IMPORT_SETTINGS } from '../constants/overwriteMode';
import { nanoid } from 'nanoid';

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
          fields: ['social_insurance_base', 'housing_fund_base', 'occupational_pension_base'],
          rule: 'at_least_one_required',
          message: '必须至少提供社保缴费基数、公积金缴费基数或职业年金缴费基数'
        },
        {
          type: 'range',
          fields: ['social_insurance_base', 'housing_fund_base', 'occupational_pension_base'],
          rule: 'positive_number',
          message: '缴费基数必须为正数'
        }
      ],
      
      // API配置
      apiEndpoints: {
        validate: '/simple-payroll/salary-configs/batch-validate',
        execute: '/simple-payroll/salary-configs/batch-update-insurance-bases-only',
        getRefData: [
          '/simple-payroll/periods?status=ACTIVE'
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
        },
        {
          sourcePattern: /^职业年金(缴费)?基数$/i,
          targetField: 'occupational_pension_base',
          confidence: 0.95,
          description: '职业年金缴费基数字段'
        },
        {
          sourcePattern: /^年金基数$/i,
          targetField: 'occupational_pension_base',
          confidence: 0.8,
          description: '年金基数（职业年金缴费基数）'
        }
      ],
      
      // 示例模板
      sampleTemplate: {
        headers: [
          '员工姓名', '身份证号', '社保缴费基数', '公积金缴费基数', '职业年金缴费基数', '备注'
        ],
        sampleRows: [
          ['张三', '110101199001011234', 15000, 16000, 15000, '2025年1月调整'],
          ['李四', '110101199002022345', 18000, 20000, 18000, '新入职员工'],
          ['王五', '110101199003033456', 12000, 12000, 12000, '标准基数']
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
      },
      {
        key: 'occupational_pension_base',
        name: '职业年金缴费基数',
        type: 'number',
        category: 'salary_base',
        required: false,
        description: '职业年金缴费基数，用于计算职业年金费用',
        validation: {
          min: 0,
          max: 100000,
          message: '职业年金缴费基数应在0-100000之间'
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

  processData(
    rawData: RawImportData,
    mapping: Record<string, string>
  ): ProcessedRow[] {
    const { headers, rows } = rawData;
    
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
    const apiPayload = {
      period_id: periodId,
      base_updates: processedData.map(row => {
        // 从完整姓名中提取姓和名
        const fullName = row.data.employee_name || '';
        const lastName = this.extractLastName(fullName);
        const firstName = this.extractFirstName(fullName);
        
        console.log(`🔍 [缴费基数-姓名转换] 完整姓名: "${fullName}" -> 姓: "${lastName}", 名: "${firstName}"`);
        
        return {
          employee_id: row.data.employee_id,
          social_insurance_base: row.data.social_insurance_base,
          housing_fund_base: row.data.housing_fund_base,
          occupational_pension_base: row.data.occupational_pension_base,
          employee_info: {
            last_name: lastName,
            first_name: firstName,
            id_number: row.data.id_number || ''
          },
          clientId: row._meta.clientId,
        };
      }),
      overwrite_mode: getBackendOverwriteMode(overwriteMode)
    };

    try {
      const response = await this.makeRequest('/simple-payroll/salary-configs/batch-validate', {
        method: 'POST',
        body: JSON.stringify(apiPayload)
      });
      const result = await this.handleResponse(response);

      const validatedData = result.data.validated_data || [];

      return processedData.map((row, index) => {
        const validation = validatedData[index];
        if (validation) {
          return {
            isValid: validation.is_valid || false,
            clientId: row._meta.clientId,
            errors: validation.errors || [],
            warnings: validation.warnings || [],
          };
        }
        return {
          isValid: false,
          clientId: row._meta.clientId,
          errors: [{ field: 'general', message: '后端未返回此记录的验证结果' }],
          warnings: [],
        };
      });
    } catch (error) {
      console.error('缴费基数验证失败:', error);
      return processedData.map(row => ({
        isValid: false,
        clientId: row._meta.clientId,
        errors: [{ field: 'general', message: `API请求失败: ${error instanceof Error ? error.message : '未知错误'}` }],
        warnings: [],
      }));
    }
  }

  async importData(validatedData: ProcessedRow[], periodId: number, overwriteMode: OverwriteMode = 'append'): Promise<any> {
    console.log(`🎯 [缴费基数导入] 准备导入到周期 ID: ${periodId}, 覆写模式: ${overwriteMode}`, validatedData);
    
    const apiPayload = {
      period_id: periodId,
      base_updates: validatedData.map(row => {
        // 从完整姓名中提取姓和名
        const fullName = row.data.employee_name || '';
        const lastName = this.extractLastName(fullName);
        const firstName = this.extractFirstName(fullName);
        
        return {
          employee_id: row.data.employee_id,
          social_insurance_base: row.data.social_insurance_base,
          housing_fund_base: row.data.housing_fund_base,
          occupational_pension_base: row.data.occupational_pension_base,
          employee_info: {
            last_name: lastName,
            first_name: firstName,
            id_number: row.data.id_number || ''
          }
        };
      }),
      create_if_missing: true // 缴费基数导入默认允许创建新记录
    };
    
    try {
      console.log(`🚀 [缴费基数导入] 调用新API: /simple-payroll/salary-configs/batch-update-insurance-bases-only`);
      const response = await this.makeRequest('/simple-payroll/salary-configs/batch-update-insurance-bases-only', {
        method: 'POST',
        body: JSON.stringify(apiPayload)
      });
      const result = await this.handleResponse(response);
      
      console.log(`✅ [缴费基数导入] API调用成功:`, result.data);
      
      return {
        success: true,
        successCount: (result.data.updated_count || 0) + (result.data.created_count || 0),
        failedCount: result.data.failed_count || 0,
        skippedCount: result.data.skipped_count || 0,
        message: result.data.message || '缴费基数导入完成',
        details: result.data
      };
    } catch (error) {
      console.error('💥 [缴费基数导入] 执行失败:', error);
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