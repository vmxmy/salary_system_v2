/**
 * 导入策略工厂
 * 管理所有可用的导入策略
 */

import { PayrollImportStrategy } from './PayrollImportStrategy';
import { SalaryBaseImportStrategy } from './SalaryBaseImportStrategy';
import type { BaseImportStrategy } from './BaseImportStrategy';
import type { ImportModeConfig } from '../types';

// 导入策略映射
const STRATEGY_MAP = {
  payroll: PayrollImportStrategy,
  salary_base: SalaryBaseImportStrategy,
  // 未来可以添加更多策略
  // employee: EmployeeImportStrategy,
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
   * 获取所有可用的导入模式配置
   */
  static async getAllModeConfigs(): Promise<ImportModeConfig[]> {
    try {
      console.log('开始获取所有模式配置...');
      console.log('可用策略:', Object.keys(STRATEGY_MAP));
      
      const configs = await Promise.all(
        Object.keys(STRATEGY_MAP).map(async modeId => {
          console.log(`正在获取模式配置: ${modeId}`);
          
          try {
            const strategy = await ImportStrategyFactory.getStrategy(modeId as ImportModeId);
            console.log(`策略获取成功: ${modeId}`, strategy);
            
            const config = await strategy.getModeConfig();
            console.log(`配置获取成功: ${modeId}`, config);
            
            return config;
          } catch (error) {
            console.error(`获取模式配置失败: ${modeId}`, error);
            throw error;
          }
        })
      );
      
      console.log('所有模式配置获取成功:', configs);
      return configs;
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
export { PayrollImportStrategy, SalaryBaseImportStrategy };
export type { BaseImportStrategy };

// 导出常用方法的简化版本
export const getImportStrategy = ImportStrategyFactory.getStrategy;
export const getAllImportModes = ImportStrategyFactory.getAllModeConfigs;
export const getImportModeConfig = ImportStrategyFactory.getModeConfig; 