import { useState, useEffect } from 'react';
import { message } from 'antd';
import { simplePayrollApi } from '../services/simplePayrollApi';
import type { PayrollRun } from '../types/simplePayroll';

interface UsePayrollVersionsResult {
  versions: PayrollRun[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const usePayrollVersions = (periodId?: number): UsePayrollVersionsResult => {
  const [versions, setVersions] = useState<PayrollRun[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVersions = async () => {
    if (!periodId) {
      console.log('🔄 [usePayrollVersions] 没有期间ID，清空版本数据');
      setVersions([]);
      return;
    }

    try {
      console.log('🔄 [usePayrollVersions] 开始获取版本数据:', { periodId });
      setLoading(true);
      setError(null);

      const response = await simplePayrollApi.getPayrollVersions({
        period_id: periodId,
        page: 1,
        size: 20
      });

      console.log('📦 [usePayrollVersions] API响应:', {
        periodId,
        dataLength: response.data?.length || 0,
        data: response.data
      });

      // 按创建时间倒序排列，最新版本在前
      const sortedVersions = (response.data || []).sort((a, b) => 
        new Date(b.initiated_at).getTime() - new Date(a.initiated_at).getTime()
      );

      console.log('✅ [usePayrollVersions] 版本数据处理完成:', {
        periodId,
        versionsCount: sortedVersions.length,
        versions: sortedVersions.map(v => ({
          id: v.id,
          version: v.version_number,
          status: v.status_name,
          initiated_at: v.initiated_at
        }))
      });

      setVersions(sortedVersions);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.detail?.error?.message || '获取工资版本失败';
      console.error('❌ [usePayrollVersions] 获取版本数据失败:', {
        periodId,
        error: err,
        errorMessage
      });
      setError(errorMessage);
      message.error(errorMessage);
      setVersions([]);
    } finally {
      setLoading(false);
    }
  };

  // 当期间ID变化时重新获取数据
  useEffect(() => {
    fetchVersions();
  }, [periodId]);

  const refetch = async () => {
    await fetchVersions();
  };

  return {
    versions,
    loading,
    error,
    refetch
  };
}; 