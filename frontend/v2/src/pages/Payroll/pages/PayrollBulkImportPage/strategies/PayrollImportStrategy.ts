/**
 * 薪资导入策略实现
 * 封装现有薪资导入逻辑到通用导入架构中
 */

import { BaseImportStrategy } from './BaseImportStrategy';
import type { ImportModeConfig, FieldConfig, UniversalImportData, UniversalValidationResult } from '../types';

export class PayrollImportStrategy extends BaseImportStrategy {
  private payrollComponents: any[] = [];
  private isComponentsLoaded = false;

  /**
   * 异步初始化策略（加载薪资组件定义）
   */
  async initialize(): Promise<void> {
    await this.loadPayrollComponents();
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
      }
    };
  }

  /**
   * 异步加载薪资组件定义
   */
  private async loadPayrollComponents(): Promise<void> {
    if (this.isComponentsLoaded) {
      return;
    }

    try {
      console.log('正在加载薪资组件定义...');
      const token = this.getAuthToken();
      console.log('获取到的token:', token ? `${token.substring(0, 20)}...` : '无token');
      
      const response = await this.makeRequest('/config/payroll-component-definitions?is_active=true&size=100');
      console.log('API响应状态:', response.status, response.statusText);
      
      const result = await this.handleResponse(response);
      
      // API响应的数据结构是 {data: [...], meta: {...}}
      // 数据直接在data字段中，不是data.items
      this.payrollComponents = result.data || [];
      this.isComponentsLoaded = true;
      
      console.log('薪资组件定义加载成功:', this.payrollComponents);
    } catch (error) {
      console.error('加载薪资组件定义失败:', error);
      // 如果加载失败，使用默认配置
      this.payrollComponents = [];
      this.isComponentsLoaded = true;
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
      // 转换数据格式为后端期望的格式
      const payrollData = data.map((item, index) => ({
        employee_id: item.employee_id || undefined,
        basic_salary: item.basic_salary || undefined,
        position_salary: item.position_salary || undefined,
        performance_salary: item.performance_salary || undefined,
        allowance: item.allowance || undefined,
        bonus: item.bonus || undefined,
        employee_info: {
          last_name: this.extractLastName(item.employee_name as string),
          first_name: this.extractFirstName(item.employee_name as string),
          id_number: item.id_number as string
        },
        clientId: item._clientId || `payroll_${index}_${Date.now()}`
      }));

      // 调用后端验证API
      const response = await this.makeRequest('/payroll/batch-validate', {
        method: 'POST',
        body: JSON.stringify({
          period_id: settings.periodId,
          payroll_data: payrollData,
          overwrite_mode: settings.overwriteMode || false
        })
      });

      const result = await this.handleResponse(response);
      
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
      console.error('薪资数据验证失败:', error);
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
      const payrollData = validRecords.map(item => ({
        employee_id: item.employee_id,
        basic_salary: item.basic_salary,
        position_salary: item.position_salary,
        performance_salary: item.performance_salary,
        allowance: item.allowance,
        bonus: item.bonus,
        clientId: item._clientId
      }));

      // 调用后端执行API
      const response = await this.makeRequest('/payroll/batch-import', {
        method: 'POST',
        body: JSON.stringify({
          period_id: settings.periodId,
          payroll_data: payrollData,
          overwrite_mode: settings.overwriteMode || false
        })
      });

      const result = await this.handleResponse(response);
      
      return {
        success: true,
        successCount: result.data.success_count,
        failedCount: result.data.error_count,
        message: result.data.message,
        details: result.data
      };
    } catch (error) {
      console.error('薪资数据导入执行失败:', error);
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

  /**
   * 将经过验证的数据提交到后端
   */
  async importData(validatedData: ProcessedRow[]): Promise<any> {
    console.log("准备导入薪资数据:", validatedData);

    // 在此处添加调用后端API的逻辑
    // 例如:
    // const payload = validatedData.map(row => row.data);
    // return await apiClient.post('/api/v2/payroll/bulk-import', payload);

    // 暂时返回一个成功的mock响应
    return Promise.resolve({
      success: true,
      message: "数据导入成功（模拟）",
      total: validatedData.length,
      successCount: validatedData.length,
      failedCount: 0,
      failures: [],
    });
  }
}

 