import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { App } from 'antd';
import type { PayrollComponentDefinition } from '../../../types/payrollTypes';
import { getPayrollComponentDefinitions } from '../../../../../services/payrollConfigService';

export const usePayrollComponents = () => {
  const { t } = useTranslation(['payroll', 'common']);
  const { message } = App.useApp();

  const [componentDefinitions, setComponentDefinitions] = useState<PayrollComponentDefinition[]>([]);
  const [loadingComponents, setLoadingComponents] = useState<boolean>(false);
  const [defaultPayrollEntryStatusId, setDefaultPayrollEntryStatusId] = useState<number | null>(null);

  // 获取薪资组件定义
  const fetchComponentDefinitions = useCallback(async () => {
    setLoadingComponents(true);
    try {
      const response = await getPayrollComponentDefinitions({ 
        is_active: true, // 修复：使用is_active替代is_enabled，与后端API匹配
        size: 100
      });
      
      setComponentDefinitions(response.data);
      
      if (response.data.length === 0) {
        console.warn('No payroll component definitions found');
      } else if (response.meta && response.meta.total > response.data.length) {
        console.warn(`Only ${response.data.length} of ${response.meta.total} components loaded. Consider increasing page size.`);
      }
    } catch (error: any) {
      console.error('Failed to fetch component definitions:', error);
      
      // 显示用户友好的错误信息
      if (error.response?.status === 403) {
        message.error(t('batch_import.error_permission_denied', { 
          defaultValue: t('payroll:auto___e69d83') 
        }));
      } else if (error.response?.status === 404) {
        message.error(t('batch_import.error_api_not_found', { 
          defaultValue: t('payroll:auto_api__415049') 
        }));
      } else {
        message.error(t('batch_import.error_fetch_components', { 
          defaultValue: t('payroll:auto___e88eb7') 
        }));
      }
      
      // 设置空数组，避免页面崩溃
      setComponentDefinitions([]);
    } finally {
      setLoadingComponents(false);
    }
  }, [t, message]);

  // 初始化时获取组件定义
  useEffect(() => {
    fetchComponentDefinitions();
  }, [fetchComponentDefinitions]);

  // 获取默认状态ID（如果需要的话）
  const fetchDefaultStatusId = useCallback(async () => {
    try {
      // 这里可以添加获取默认状态ID的逻辑
      // 例如从lookup服务获取默认的薪资条目状态
      // const statusId = await getDefaultPayrollEntryStatusId();
      // setDefaultPayrollEntryStatusId(statusId);
    } catch (error) {
      console.error('Failed to fetch default status ID:', error);
    }
  }, []);

  return {
    componentDefinitions,
    loadingComponents,
    defaultPayrollEntryStatusId,
    fetchComponentDefinitions,
    fetchDefaultStatusId
  };
}; 