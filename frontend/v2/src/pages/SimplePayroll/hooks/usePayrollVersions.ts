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
      setVersions([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await simplePayrollApi.getPayrollVersions({
        period_id: periodId,
        page: 1,
        size: 20
      });

      // 按创建时间倒序排列，最新版本在前
      const sortedVersions = (response.data || []).sort((a, b) => 
        new Date(b.initiated_at).getTime() - new Date(a.initiated_at).getTime()
      );

      setVersions(sortedVersions);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.detail?.error?.message || '获取工资版本失败';
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