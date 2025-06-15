// 工资数据模态框预设报表管理Hook

import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import { useTranslation } from 'react-i18next';
import { payrollDataPresetsApi } from '../services/payrollDataPresets';
import type {
  PayrollDataModalPreset,
  PresetSaveRequest,
  ColumnFilterConfig,
  ColumnSettings
} from '../types/payrollDataPresets';

export const usePayrollDataPresets = () => {
  const { t } = useTranslation(['payroll', 'common']);
  const [presets, setPresets] = useState<PayrollDataModalPreset[]>([]);
  const [loading, setLoading] = useState(false);
  const [defaultPreset, setDefaultPreset] = useState<PayrollDataModalPreset | null>(null);

  // 加载预设列表
  const loadPresets = useCallback(async () => {
    try {
      setLoading(true);
      const response = await payrollDataPresetsApi.getPresets();
      setPresets(response.presets);
    } catch (error) {
      console.error('Failed to load presets:', error);
      message.error(t('common:message.load_failed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  // 加载默认预设
  const loadDefaultPreset = useCallback(async () => {
    try {
      console.log('🔍 [usePayrollDataPresets] 开始加载默认预设...');
      let preset = await payrollDataPresetsApi.getDefaultPreset();
      console.log('🔍 [usePayrollDataPresets] API返回的默认预设:', preset);
      
      // 如果没有默认预设，尝试获取最近使用的预设
      if (!preset) {
        console.log('🔍 [usePayrollDataPresets] 没有默认预设，尝试获取最近使用的预设...');
        const response = await payrollDataPresetsApi.getPresets();
        const presets = response.presets || [];
        
        // 按使用次数和最后使用时间排序，选择最活跃的预设
        const sortedPresets = presets.sort((a, b) => {
          // 优先按使用次数排序
          if ((b.usageCount || 0) !== (a.usageCount || 0)) {
            return (b.usageCount || 0) - (a.usageCount || 0);
          }
          // 使用次数相同时按最后使用时间排序
          if (a.lastUsedAt && b.lastUsedAt) {
            return new Date(b.lastUsedAt).getTime() - new Date(a.lastUsedAt).getTime();
          }
          // 如果没有使用时间，按创建时间排序
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        
        if (sortedPresets.length > 0) {
          preset = sortedPresets[0];
          console.log('🔍 [usePayrollDataPresets] 使用最活跃的预设作为当前预设:', preset);
        }
      }
      
      setDefaultPreset(preset);
      console.log('🔍 [usePayrollDataPresets] 已设置defaultPreset状态:', preset);
      return preset;
    } catch (error) {
      console.error('❌ [usePayrollDataPresets] 加载默认预设失败:', error);
      return null;
    }
  }, []);

  // 保存预设
  const savePreset = useCallback(async (
    name: string,
    filterConfig: ColumnFilterConfig,
    columnSettings: ColumnSettings,
    options: {
      description?: string;
      isDefault?: boolean;
      isPublic?: boolean;
    } = {}
  ) => {
    try {
      const data: PresetSaveRequest = {
        name,
        filterConfig,
        columnSettings,
        ...options
      };

      const newPreset = await payrollDataPresetsApi.savePreset(data);
      setPresets(prev => [...prev, newPreset]);
      
      if (options.isDefault) {
        setDefaultPreset(newPreset);
      }

      message.success(t('payroll:presets.save_success'));
      return newPreset;
    } catch (error: any) {
      console.error('Failed to save preset:', error);
      
      // 解析后端错误信息
      let errorMessage = t('payroll:presets.save_failed');
      if (error?.response?.data?.detail) {
        if (typeof error.response.data.detail === 'string') {
          errorMessage = error.response.data.detail;
        } else if (error.response.data.detail.error?.message) {
          errorMessage = error.response.data.detail.error.message;
        }
      }
      
      message.error(errorMessage);
      throw error;
    }
  }, [t]);

  // 应用预设
  const applyPreset = useCallback(async (preset: PayrollDataModalPreset) => {
    try {
      await payrollDataPresetsApi.applyPreset(preset.id!);
      
      // 更新使用统计
      setPresets(prev => prev.map(p => 
        p.id === preset.id 
          ? { ...p, usageCount: (p.usageCount || 0) + 1, lastUsedAt: new Date().toISOString() }
          : p
      ));

      message.success(t('payroll:presets.apply_success', { name: preset.name }));
      return preset;
    } catch (error) {
      console.error('Failed to apply preset:', error);
      message.error(t('payroll:presets.apply_failed'));
      throw error;
    }
  }, [t]);

  // 删除预设
  const deletePreset = useCallback(async (id: number) => {
    try {
      await payrollDataPresetsApi.deletePreset(id);
      setPresets(prev => prev.filter(p => p.id !== id));
      
      if (defaultPreset?.id === id) {
        setDefaultPreset(null);
      }

      message.success(t('payroll:presets.delete_success'));
    } catch (error) {
      console.error('Failed to delete preset:', error);
      message.error(t('payroll:presets.delete_failed'));
      throw error;
    }
  }, [t, defaultPreset]);

  // 设置默认预设
  const setAsDefault = useCallback(async (id: number) => {
    try {
      await payrollDataPresetsApi.setDefaultPreset(id);
      const preset = presets.find(p => p.id === id);
      if (preset) {
        setDefaultPreset(preset);
        message.success(t('payroll:presets.set_default_success'));
      }
    } catch (error) {
      console.error('Failed to set default preset:', error);
      message.error(t('payroll:presets.set_default_failed'));
      throw error;
    }
  }, [t, presets]);

  // 复制预设
  const duplicatePreset = useCallback(async (id: number, newName: string) => {
    try {
      const newPreset = await payrollDataPresetsApi.duplicatePreset(id, newName);
      setPresets(prev => [...prev, newPreset]);
      message.success(t('payroll:presets.duplicate_success'));
      return newPreset;
    } catch (error: any) {
      console.error('Failed to duplicate preset:', error);
      
      // 解析后端错误信息
      let errorMessage = t('payroll:presets.duplicate_failed');
      if (error?.response?.data?.detail) {
        if (typeof error.response.data.detail === 'string') {
          errorMessage = error.response.data.detail;
        } else if (error.response.data.detail.error?.message) {
          errorMessage = error.response.data.detail.error.message;
        }
      }
      
      message.error(errorMessage);
      throw error;
    }
  }, [t]);

  // 更新预设
  const updatePreset = useCallback(async (id: number, data: Partial<PresetSaveRequest>) => {
    try {
      const updatedPreset = await payrollDataPresetsApi.updatePreset(id, data);
      setPresets(prev => prev.map(p => p.id === id ? updatedPreset : p));
      
      // 如果更新的预设被设为默认，更新默认预设状态
      if (data.isDefault) {
        setDefaultPreset(updatedPreset);
      }
      
      message.success(t('payroll:presets.update_success'));
      return updatedPreset;
    } catch (error: any) {
      console.error('Failed to update preset:', error);
      
      // 解析后端错误信息
      let errorMessage = t('payroll:presets.update_failed');
      if (error?.response?.data?.detail) {
        if (typeof error.response.data.detail === 'string') {
          errorMessage = error.response.data.detail;
        } else if (error.response.data.detail.error?.message) {
          errorMessage = error.response.data.detail.error.message;
        }
      }
      
      message.error(errorMessage);
      throw error;
    }
  }, [t]);

  // 初始化加载
  useEffect(() => {
    loadPresets();
    loadDefaultPreset();
  }, [loadPresets, loadDefaultPreset]);

  return {
    presets,
    defaultPreset,
    loading,
    loadPresets,
    loadDefaultPreset,
    savePreset,
    applyPreset,
    deletePreset,
    setAsDefault,
    duplicatePreset,
    updatePreset
  };
}; 