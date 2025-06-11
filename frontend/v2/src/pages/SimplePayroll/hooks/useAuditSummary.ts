import { useState, useEffect, useCallback } from 'react';
import { simplePayrollApi } from '../services/simplePayrollApi';
import type { AuditSummary } from '../types/simplePayroll';

export const useAuditSummary = (payrollRunId?: number) => {
  const [auditSummary, setAuditSummary] = useState<AuditSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAuditSummary = useCallback(async (runId: number) => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔍 [useAuditSummary] 获取审核汇总数据:', runId);
      const response = await simplePayrollApi.getAuditSummary(runId);
      if (response.data) {
        setAuditSummary(response.data);
        console.log('✅ [useAuditSummary] 审核汇总获取成功:', response.data);
      } else {
        setAuditSummary(null);
        console.log('ℹ️ [useAuditSummary] 没有审核数据');
      }
    } catch (error) {
      console.error('❌ [useAuditSummary] 获取审核汇总失败:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
      setAuditSummary(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(() => {
    if (payrollRunId) {
      fetchAuditSummary(payrollRunId);
    }
  }, [payrollRunId, fetchAuditSummary]);

  useEffect(() => {
    if (payrollRunId) {
      fetchAuditSummary(payrollRunId);
    } else {
      setAuditSummary(null);
      setError(null);
    }
  }, [payrollRunId, fetchAuditSummary]);

  return {
    auditSummary,
    loading,
    error,
    refresh,
    fetchAuditSummary
  };
}; 