/**
 * 基础导入策略抽象类
 * 定义所有导入策略的通用接口和默认实现
 */

import type { 
  ImportModeConfig, 
  UniversalImportData, 
  UniversalValidationResult,
  UniversalMappingRule,
  FieldConfig,
  RawImportData,
  ProcessedRow,
  ValidationResult as UniversalValidationResult2
} from '../types/universal';
import { OverwriteMode } from '../../../types/payrollTypes';
import { store } from '../../../../../store';
import apiClient from '../../../../../api/apiClient';

/**
 * 基础导入策略抽象类
 */
export abstract class BaseImportStrategy {
  
  /**
   * 初始化策略（例如，获取远程数据）
   */
  abstract initialize(): Promise<void>;

  /**
   * 获取模式配置（抽象方法，子类必须实现）
   */
  abstract getModeConfig(): Promise<ImportModeConfig>;

  /**
   * 根据字段映射，处理原始数据
   */
  abstract processData(
    rawData: RawImportData,
    mapping: Record<string, string>
  ): ProcessedRow[];

  /**
   * 验证处理后的数据
   */
  abstract validateData(processedData: ProcessedRow[], periodId: number, overwriteMode?: OverwriteMode): Promise<UniversalValidationResult2[]>;

  /**
   * 将经过验证的数据提交到后端
   */
  abstract importData(validatedData: ProcessedRow[], periodId: number, overwriteMode?: OverwriteMode): Promise<any>;

  /**
   * 获取必需的参考数据
   * 默认实现返回空对象，子类可以重写
   */
  async getRequiredRefData(): Promise<Record<string, any[]>> {
    return {};
  }

  /**
   * 处理原始数据
   * 默认实现直接返回处理后的数据，子类可以重写
   */
  processRawData(
    headers: string[], 
    rows: any[][], 
    mappingRules: UniversalMappingRule[]
  ): UniversalImportData[] {
    // 基础数据处理逻辑
    return rows.map((row, index) => {
      const item: UniversalImportData = {
        _clientId: `item_${index}_${Date.now()}`
      };
      
      // 根据映射规则处理数据
      mappingRules.forEach(rule => {
        const sourceIndex = headers.indexOf(rule.sourceField);
        if (sourceIndex >= 0 && sourceIndex < row.length) {
          item[rule.targetField] = this.transformValue(
            row[sourceIndex], 
            rule.transform
          );
        }
      });
      
      return item;
    });
  }

  /**
   * 生成样例模板
   * 默认实现基于字段配置生成，子类可以重写
   */
  async generateSampleTemplate(): Promise<{ headers: string[]; sampleRows: any[][] }> {
    const config = await this.getModeConfig();
    
    if (config.sampleTemplate) {
      return config.sampleTemplate;
    }
    
    // 基于字段配置生成默认模板
    const headers = config.fields.map(field => field.name);
    const sampleRows = [
      headers.map(() => '示例数据')
    ];
    
    return { headers, sampleRows };
  }

  /**
   * 验证设置
   * 默认实现返回空数组，子类可以重写
   */
  async validateSettings(settings: Record<string, any>): Promise<string[]> {
    const errors: string[] = [];
    const config = await this.getModeConfig();
    
    // 检查必需的设置
    if (config.importSettings?.requiresPeriodSelection && !settings.periodId) {
      errors.push('请选择薪资期间');
    }
    
    return errors;
  }

  /**
   * 数据值转换
   * 根据转换配置处理数据值
   */
  protected transformValue(value: any, transform?: any): any {
    if (!transform || transform.type === 'none') {
      return value;
    }
    
    switch (transform.type) {
      case 'lookup':
        // 查找转换逻辑
        return this.lookupTransform(value, transform.config);
        
      case 'format':
        // 格式化转换逻辑
        return this.formatTransform(value, transform.config);
        
      case 'calculate':
        // 计算转换逻辑
        return this.calculateTransform(value, transform.config);
        
      default:
        return value;
    }
  }

  /**
   * 查找转换
   */
  protected lookupTransform(value: any, config: any): any {
    // 实现查找转换逻辑
    return value;
  }

  /**
   * 格式化转换
   */
  protected formatTransform(value: any, config: any): any {
    // 实现格式化转换逻辑
    if (typeof value === 'string') {
      return value.trim();
    }
    return value;
  }

  /**
   * 计算转换
   */
  protected calculateTransform(value: any, config: any): any {
    // 实现计算转换逻辑
    return value;
  }

  /**
   * 获取认证令牌
   * 从Redux store获取token，与其他页面保持一致
   */
  protected getAuthToken(): string {
    try {
      // 从Redux store获取token，与其他页面保持一致
      const token = store.getState().auth.authToken;
      console.log('🔑 [BaseImportStrategy] Token获取:', token ? `存在 (${token.substring(0, 20)}...)` : '不存在');
      return token || '';
    } catch (error) {
      console.error('❌ [BaseImportStrategy] Token获取失败:', error);
      return '';
    }
  }

  /**
   * 发送HTTP请求的通用方法
   */
  protected async makeRequest(
    url: string, 
    options: RequestInit = {}
  ): Promise<Response> {
    // 使用配置好的apiClient而不是原生fetch
    // apiClient已经配置了正确的baseURL和认证拦截器
    const axiosConfig = {
      url,
      method: (options.method as any) || 'GET',
      data: options.body ? JSON.parse(options.body as string) : undefined,
      headers: options.headers ? Object.fromEntries(new Headers(options.headers)) : undefined
    };
    
    try {
      const axiosResponse = await apiClient.request(axiosConfig);
      
      // 将axios响应转换为fetch Response格式
      const response = new Response(JSON.stringify(axiosResponse.data), {
        status: axiosResponse.status,
        statusText: axiosResponse.statusText,
        headers: new Headers(axiosResponse.headers as any)
      });
      
      return response;
    } catch (error: any) {
      // 处理axios错误，转换为fetch格式
      if (error.response) {
        const response = new Response(JSON.stringify(error.response.data), {
          status: error.response.status,
          statusText: error.response.statusText,
          headers: new Headers(error.response.headers)
        });
        return response;
      }
      throw error;
    }
  }

  /**
   * 处理API响应
   */
  protected async handleResponse(response: Response): Promise<any> {
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API请求失败 (${response.status}): ${errorText}`);
    }
    
    return response.json();
  }
} 