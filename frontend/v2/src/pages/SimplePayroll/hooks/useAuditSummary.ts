import { useState, useEffect, useCallback } from 'react';
import { simplePayrollApi } from '../services/simplePayrollApi';
import type { AuditSummary } from '../types/simplePayroll';

interface UseAuditSummaryReturn {
  auditSummary: AuditSummary | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useAuditSummary = (payrollRunId?: number): UseAuditSummaryReturn => {
  const [auditSummary, setAuditSummary] = useState<AuditSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAuditSummary = useCallback(async () => {
    if (!payrollRunId) {
      setAuditSummary(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🔍 [useAuditSummary] 获取审核摘要:', payrollRunId);
      const response = await simplePayrollApi.getAuditSummary(payrollRunId);
      setAuditSummary(response.data);
      console.log('✅ [useAuditSummary] 审核摘要获取成功:', response.data);
    } catch (err: any) {
      console.error('❌ [useAuditSummary] 获取审核摘要失败:', err);
      setError(err.message || '获取审核摘要失败');
      setAuditSummary(null);
    } finally {
      setLoading(false);
    }
  }, [payrollRunId]);

  // 当payrollRunId变化时自动获取数据
  useEffect(() => {
    fetchAuditSummary();
  }, [fetchAuditSummary]);

  const refetch = useCallback(async () => {
    await fetchAuditSummary();
  }, [fetchAuditSummary]);

  return {
    auditSummary,
    loading,
    error,
    refetch
  };
}; 