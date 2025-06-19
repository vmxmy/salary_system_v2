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
  ValidationResult as UniversalValidationResult
} from '../types/universal';
import type { PayrollPeriod } from '../../../types/payrollTypes';
import { OverwriteMode } from '../../../types/payrollTypes';
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
      // payrollPeriods: this.payrollPeriods, // 移除不兼容的属性
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
          pattern: /^\d{17}[\dXx]$/,
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
        category: category as 'base' | 'earning' | 'deduction' | 'lookup' | 'calculated' | 'employee' | 'salary_base' | 'other',
        required: false,
        description: component.description || `${name}金额`,
        validation: {
          min: 0,
          max: component.max_value || 999999,
          message: `${name}应在0-${component.max_value || 999999}之间`
        }
      });
    });
    
    // JSONB 字段
    fields.push(
      {
        key: 'earnings_details',
        name: '收入明细',
        type: 'text',
        category: 'earning',
        required: false,
        description: '收入项目的详细金额，以JSON格式存储',
        validation: {
          message: '收入明细格式不正确'
        }
      },
      {
        key: 'deductions_details',
        name: '扣除明细',
        type: 'text',
        category: 'deduction',
        required: false,
        description: '扣除项目的详细金额，以JSON格式存储',
        validation: {
          message: '扣除明细格式不正确'
        }
      }
    );
    
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
    
    console.log('🔍 [PayrollImportStrategy] 开始处理数据:', { 
      headerCount: headers.length, 
      rowCount: rows.length 
    });
    console.log('🔍 [PayrollImportStrategy] Headers:', headers);
    console.log('🔍 [PayrollImportStrategy] Mapping:', mapping);
    
    return rows.map((row, rowIndex) => {
      const rowData: Record<string, any> = {};
      const earnings_details: Record<string, any> = {};
      const deductions_details: Record<string, any> = {};
      
      console.log(`🔍 [PayrollImportStrategy] 处理第${rowIndex + 1}行数据:`, row);
      
      headers.forEach((header, colIndex) => {
        const systemKey = mapping[header];
        const cellValue = row[colIndex];
        
        console.log(`🔍 [PayrollImportStrategy] 列${colIndex}: "${header}" → "${systemKey}" = "${cellValue}"`);
        
        if (systemKey && cellValue !== null && cellValue !== undefined && cellValue !== '') {
          // 处理基础字段
          if (systemKey === 'employee_name' || systemKey === 'id_number' || systemKey === 'remarks') {
            rowData[systemKey] = cellValue;
          }
          // 处理点号语法的薪资组件字段（如 earnings_details.BASIC_SALARY.amount）
          else if (systemKey.includes('earnings_details.') && systemKey.includes('.amount')) {
            const parts = systemKey.split('.');
            console.log(`🔍 [PayrollImportStrategy] 检测到 earnings_details 点号语法: ${systemKey}`, { parts });
            if (parts.length === 3 && parts[0] === 'earnings_details' && parts[2] === 'amount') {
              const componentCode = parts[1];
              const amount = parseFloat(String(cellValue)) || 0;
              console.log(`🔍 [PayrollImportStrategy] 处理收入组件: ${componentCode} = ${amount}`);
              if (amount !== 0) { // 允许负数
                earnings_details[componentCode] = { amount };
                console.log(`✅ [PayrollImportStrategy] 已添加收入组件: ${componentCode}`, earnings_details);
              }
            }
          }
          else if (systemKey.includes('deductions_details.') && systemKey.includes('.amount')) {
            const parts = systemKey.split('.');
            console.log(`🔍 [PayrollImportStrategy] 检测到 deductions_details 点号语法: ${systemKey}`, { parts });
            if (parts.length === 3 && parts[0] === 'deductions_details' && parts[2] === 'amount') {
              const componentCode = parts[1];
              const amount = parseFloat(String(cellValue)) || 0;
              console.log(`🔍 [PayrollImportStrategy] 处理扣除组件: ${componentCode} = ${amount}`);
              if (amount !== 0) { // 允许负数
                deductions_details[componentCode] = { amount };
                console.log(`✅ [PayrollImportStrategy] 已添加扣除组件: ${componentCode}`, deductions_details);
              }
            }
          }
          // 处理前缀形式的薪资组件字段（向后兼容）
          else if (systemKey.startsWith('earning_')) {
            const componentCode = systemKey.replace('earning_', '');
            const amount = parseFloat(String(cellValue)) || 0;
            console.log(`🔍 [PayrollImportStrategy] 前缀形式收入组件: ${componentCode} = ${amount}`);
            if (amount !== 0) { // 允许负数
              earnings_details[componentCode] = { amount };
              console.log(`✅ [PayrollImportStrategy] 已添加前缀收入组件: ${componentCode}`, earnings_details);
            }
          }
          else if (systemKey.startsWith('deduction_')) {
            const componentCode = systemKey.replace('deduction_', '');
            const amount = parseFloat(String(cellValue)) || 0;
            console.log(`🔍 [PayrollImportStrategy] 前缀形式扣除组件: ${componentCode} = ${amount}`);
            if (amount !== 0) { // 允许负数
              deductions_details[componentCode] = { amount };
              console.log(`✅ [PayrollImportStrategy] 已添加前缀扣除组件: ${componentCode}`, deductions_details);
            }
          }
          // 忽略其他数值字段，不进行任何计算
          else {
            rowData[systemKey] = cellValue;
          }
        }
      });
      
      // 只设置必要的字段
      rowData.earnings_details = earnings_details;
      rowData.deductions_details = deductions_details;
      
      console.log(`🔍 [PayrollImportStrategy] 第${rowIndex + 1}行 ${rowData.employee_name} 处理完成:`, {
        earnings_details,
        deductions_details,
        earningsCount: Object.keys(earnings_details).length,
        deductionsCount: Object.keys(deductions_details).length
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

  async validateData(processedData: ProcessedRow[], periodId: number, overwriteMode: OverwriteMode = OverwriteMode.NONE): Promise<UniversalValidationResult[]> {
    // 转换为后端期望的格式
    const entries = processedData.map(row => {
      // 从完整姓名中提取姓和名
      const fullName = row.data.employee_name || '';
      const lastName = this.extractLastName(fullName);
      const firstName = this.extractFirstName(fullName);
      
      console.log(`🔍 [姓名转换] 完整姓名: "${fullName}" -> 姓: "${lastName}", 名: "${firstName}"`);
      
      const entry = {
        payroll_period_id: periodId,
        payroll_run_id: 0, // 后端会自动创建或分配
        status_lookup_value_id: 60, // 60 = "待计算" 状态
        // 移除所有计算字段，让后端自行计算
        earnings_details: row.data.earnings_details || {},
        deductions_details: row.data.deductions_details || {},
        remarks: row.data.remarks || '',
        employee_info: {
          last_name: lastName,
          first_name: firstName,
          id_number: String(row.data.id_number || '')
        },
        _clientId: row._meta.clientId
      };
      
      console.log(`🔍 [发送数据] 第${processedData.indexOf(row) + 1}行:`, entry);
      return entry;
    });

    try {
      // 调用后端验证API，包含字段级冲突检测
      const response = await this.makeRequest('/payroll-entries/bulk/validate', {
        method: 'POST',
        body: JSON.stringify({
          payroll_period_id: periodId,
          entries: entries,
          overwrite_mode: getBackendOverwriteMode(overwriteMode),
          field_conflict_check: true // 启用字段级冲突检测
        })
      });

      const result = await this.handleResponse(response);
      console.log(`🔍 [调试] 后端验证响应:`, result);

      if (result && result.validatedData) {
        return result.validatedData.map((validation: any, index: number) => {
          console.log(`🔍 [后端验证结果] 第${index + 1}行:`, validation);
          
          // 处理错误格式，确保符合ValidationResult接口
          let processedErrors: Array<{field: string, message: string}> = [];
          if (validation.__errors && Array.isArray(validation.__errors)) {
            processedErrors = validation.__errors.map((error: any) => {
              if (typeof error === 'string') {
                return { field: 'general', message: error };
              } else if (error && typeof error === 'object') {
                return {
                  field: error.field || 'general',
                  message: error.message || error.toString()
                };
              }
              return { field: 'general', message: '未知错误' };
            });
          }
          
          // 处理字段冲突信息
          let fieldConflicts: Array<{field: string, currentValue: any, newValue: any}> = [];
          if (validation.field_conflicts && Array.isArray(validation.field_conflicts)) {
            fieldConflicts = validation.field_conflicts;
          }
          
          console.log(`🔍 [处理后错误] 第${index + 1}行:`, processedErrors);
          console.log(`🔍 [字段冲突] 第${index + 1}行:`, fieldConflicts);
          
          return {
            isValid: validation.__isValid || false,
            clientId: processedData[index]?._meta.clientId || `validate_${index}`,
            errors: processedErrors,
            warnings: validation.warnings || [],
            fieldConflicts: fieldConflicts // 新增字段冲突信息
          };
        });
      }

      throw new Error('Invalid response format from validation API');
    } catch (error: any) {
      console.error('验证失败:', error);
      
      // 返回错误结果
      return processedData.map((row, index) => ({
        isValid: false,
        clientId: row._meta.clientId,
        errors: [{ 
          field: 'general', 
          message: `API请求失败: ${error.message}` 
        }],
        warnings: [],
        fieldConflicts: false
      }));
    }
  }

  /**
   * 将经过验证的数据提交到后端
   */
  async importData(validatedData: ProcessedRow[], periodId: number, overwriteMode: OverwriteMode = OverwriteMode.NONE): Promise<any> {
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
        // 移除所有计算字段，让后端自行计算
        earnings_details: row.data.earnings_details || {},
        deductions_details: row.data.deductions_details || {},
        remarks: row.data.remarks || '',
        employee_info: {
          last_name: lastName,
          first_name: firstName,
          id_number: String(row.data.id_number || '')
        }
      };
    });

    // 智能选择覆写模式：如果是个税等单一字段导入，使用partial模式
    let finalOverwriteMode = overwriteMode;
    
    // 检查是否只导入了少量字段（如个税）
    const hasOnlyFewFields = entries.every(entry => {
      const earningsCount = Object.keys(entry.earnings_details).length;
      const deductionsCount = Object.keys(entry.deductions_details).length;
      const totalFields = earningsCount + deductionsCount;
      
      // 如果每个员工只有1-3个薪资字段，认为是部分导入
      return totalFields <= 3;
    });
    
    if (hasOnlyFewFields && overwriteMode === OverwriteMode.NONE) {
      finalOverwriteMode = OverwriteMode.PARTIAL; // 前端的PARTIAL对应后端的partial
      console.log(`🔍 [智能模式] 检测到部分字段导入，自动切换到部分更新模式`);
    }

    const apiPayload = {
      payroll_period_id: periodId,
      entries,
      overwrite_mode: getBackendOverwriteMode(finalOverwriteMode)
    };
    
    console.log(`🔍 [导入模式] 前端模式: ${overwriteMode} -> 最终模式: ${finalOverwriteMode} -> 后端模式: ${getBackendOverwriteMode(finalOverwriteMode)}`);
    
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

 