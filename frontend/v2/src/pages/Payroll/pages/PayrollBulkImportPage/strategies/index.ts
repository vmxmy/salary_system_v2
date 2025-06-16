/**
 * 导入策略工厂
 * 管理所有可用的导入策略
 */

import { PayrollImportStrategy } from './PayrollImportStrategy';
import { SalaryBaseImportStrategy } from './SalaryBaseImportStrategy';
import { EmployeeImportStrategy } from './EmployeeImportStrategy';
import type { BaseImportStrategy } from './BaseImportStrategy';
import type { ImportModeConfig } from '../types';

// 导入策略映射
const STRATEGY_MAP = {
  payroll: PayrollImportStrategy,
  salary_base: SalaryBaseImportStrategy,
  employee: EmployeeImportStrategy,
  // 未来可以添加更多策略
  // attendance: AttendanceImportStrategy,
} as const;

export type ImportModeId = keyof typeof STRATEGY_MAP;

/**
 * 导入策略工厂类
 */
export class ImportStrategyFactory {
  private static strategies: Map<ImportModeId, BaseImportStrategy> = new Map();

  /**
   * 获取指定模式的导入策略实例
   */
  static async getStrategy(modeId: ImportModeId): Promise<BaseImportStrategy> {
    try {
      if (!this.strategies.has(modeId)) {
        const StrategyClass = STRATEGY_MAP[modeId];
        if (!StrategyClass) {
          throw new Error(`未找到导入策略: ${modeId}`);
        }
        
        console.log(`正在创建策略实例: ${modeId}`, StrategyClass);
        const instance = new StrategyClass();
        
        // 如果策略有初始化方法，则调用它
        if ('initialize' in instance && typeof instance.initialize === 'function') {
          console.log(`正在初始化策略: ${modeId}`);
          await instance.initialize();
          console.log(`策略初始化完成: ${modeId}`);
        }
        
        console.log(`策略实例创建成功: ${modeId}`, instance);
        this.strategies.set(modeId, instance);
      }
      
      const strategy = this.strategies.get(modeId);
      if (!strategy) {
        throw new Error(`策略实例获取失败: ${modeId}`);
      }
      
      return strategy;
    } catch (error) {
      console.error(`获取策略失败: ${modeId}`, error);
      throw error;
    }
  }

    /**
   * 获取所有可用的导入模式配置（不初始化策略）
   */
  static async getAllModeConfigs(): Promise<ImportModeConfig[]> {
    try {
      console.log('开始获取所有模式配置...');
      console.log('可用策略:', Object.keys(STRATEGY_MAP));
      
      const configs = await Promise.all(
        Object.keys(STRATEGY_MAP).map(async modeId => {
          console.log(`正在获取模式配置: ${modeId}`);
          
          try {
            // 创建策略实例但不初始化
            const StrategyClass = STRATEGY_MAP[modeId as ImportModeId];
            if (!StrategyClass) {
              throw new Error(`未找到导入策略: ${modeId}`);
            }
            
            const instance = new StrategyClass();
            console.log(`策略实例创建成功: ${modeId}`, instance);
            
            // 直接获取配置，不调用initialize
            const config = await instance.getModeConfig();
            console.log(`配置获取成功: ${modeId}`, config);
            
            return config;
          } catch (error) {
            console.error(`获取模式配置失败: ${modeId}`, error);
            // 返回一个基础配置，避免整个加载失败
            return {
              id: modeId as ImportModeId,
              name: `${modeId} 导入`,
              description: '配置加载失败',
              icon: '❌',
              fields: [],
              requiredFields: [],
              optionalFields: [],
              validationRules: [],
              apiEndpoints: { validate: '', execute: '', getRefData: [] },
              fieldMappingHints: {},
              sampleTemplate: { headers: [], sampleRows: [] },
              importSettings: { supportsBatch: false, maxBatchSize: 100, requiresPeriodSelection: false, supportsOverwrite: false, defaultOverwriteMode: false }
            };
          }
        })
      );
      
      console.log('所有模式配置获取成功:', configs);
      return configs.filter(config => config.icon !== '❌'); // 过滤掉失败的配置
    } catch (error) {
      console.error('获取所有模式配置失败:', error);
      throw error;
    }
  }

  /**
   * 获取指定模式的配置
   */
  static async getModeConfig(modeId: ImportModeId): Promise<ImportModeConfig> {
    const strategy = await this.getStrategy(modeId);
    return await strategy.getModeConfig();
  }

  /**
   * 检查模式是否存在
   */
  static hasMode(modeId: string): modeId is ImportModeId {
    return modeId in STRATEGY_MAP;
  }

  /**
   * 清理所有策略实例（用于测试或重置）
   */
  static clearStrategies(): void {
    this.strategies.clear();
  }
}

// 导出策略类型
export { PayrollImportStrategy, SalaryBaseImportStrategy, EmployeeImportStrategy };
export type { BaseImportStrategy };

// 导出常用方法的简化版本
export const getImportStrategy = ImportStrategyFactory.getStrategy;
export const getAllImportModes = ImportStrategyFactory.getAllModeConfigs;
export const getImportModeConfig = ImportStrategyFactory.getModeConfig; 