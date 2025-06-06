import { useState, useEffect } from 'react';
import { message } from 'antd';
import { simplePayrollApi } from '../services/simplePayrollApi';
import type { PayrollPeriod, PayrollPeriodResponse } from '../types/simplePayroll';
// 导入Redux store以获取认证token
import { store } from '../../../store';

interface UsePayrollPeriodsResult {
  periods: PayrollPeriod[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const usePayrollPeriods = (): UsePayrollPeriodsResult => {
  const [periods, setPeriods] = useState<PayrollPeriod[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPeriods = async () => {
    console.log('🔄 [usePayrollPeriods] 开始获取工资期间数据...');
    
    try {
      setLoading(true);
      setError(null);
      
      // 检查token - 从Redux store获取，与API服务保持一致
      const token = store.getState().auth.authToken;
      console.log('🔑 [usePayrollPeriods] Token状态:', token ? `存在 (${token.substring(0, 20)}...)` : '不存在');
      console.log('🔍 [usePayrollPeriods] Redux auth状态:', store.getState().auth);

      console.log('📡 [usePayrollPeriods] 发起API请求:', {
        url: '/v2/simple-payroll/periods',
        params: { is_active: true, page: 1, size: 50 }
      });

      const response = await simplePayrollApi.getPayrollPeriods({
        is_active: true,
        page: 1,
        size: 50
      });

      console.log('✅ [usePayrollPeriods] API响应成功:', {
        dataCount: response.data?.length || 0,
        meta: response.meta,
        firstItem: response.data?.[0]
      });

      // 将PayrollPeriodResponse转换为PayrollPeriod
      const periodsData: PayrollPeriod[] = (response.data || []).map((period: PayrollPeriodResponse) => ({
        ...period
      }));
      
      console.log('🔄 [usePayrollPeriods] 数据转换完成:', {
        originalCount: response.data?.length || 0,
        convertedCount: periodsData.length,
        samplePeriod: periodsData[0]
      });
      
      setPeriods(periodsData);
      console.log('✅ [usePayrollPeriods] 状态更新完成，期间数量:', periodsData.length);
      
    } catch (err: any) {
      console.error('❌ [usePayrollPeriods] 获取失败:', {
        error: err,
        status: err?.response?.status,
        statusText: err?.response?.statusText,
        data: err?.response?.data,
        message: err?.message
      });
      
      const errorMessage = err?.response?.data?.detail?.error?.message || '获取工资期间失败';
      setError(errorMessage);
      message.error(errorMessage);
      setPeriods([]);
    } finally {
      setLoading(false);
      console.log('🏁 [usePayrollPeriods] 请求完成');
    }
  };

  // 组件挂载时获取数据
  useEffect(() => {
    fetchPeriods();
  }, []);

  const refetch = async () => {
    await fetchPeriods();
  };

  return {
    periods,
    loading,
    error,
    refetch
  };
}; 