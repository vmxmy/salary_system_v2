import { usePayrollWorkflowState, type UsePayrollWorkflowStateReturn } from './usePayrollWorkflowState';
import { usePayrollWorkflowActions, type UsePayrollWorkflowActionsReturn } from './usePayrollWorkflowActions';

export interface UsePayrollWorkflowReturn extends UsePayrollWorkflowStateReturn, UsePayrollWorkflowActionsReturn {}

/**
 * 薪资工作流主钩子
 * 组合状态管理和业务逻辑钩子
 */
export const usePayrollWorkflow = (): UsePayrollWorkflowReturn => {
  // 状态管理钩子
  const state = usePayrollWorkflowState();
  
  // 业务逻辑钩子
  const actions = usePayrollWorkflowActions(state);

  return {
    ...state,
    ...actions,
  };
}; 