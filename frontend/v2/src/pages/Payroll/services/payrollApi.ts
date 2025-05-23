import apiClient from '../../../api/apiClient'; // Assuming a global apiClient exists
import type {
  PayrollPeriod,
  ApiListResponse,
  ApiSingleResponse,
  PayrollRun,
  PayrollRunPatch,
  CreatePayrollRunPayload,
  UpdatePayrollRunPayload,
  PayrollEntry,
  PayrollEntryPatch,
  CreatePayrollEntryPayload,
  BulkCreatePayrollEntriesPayload,
  PayrollComponentDefinition
} from '../types/payrollTypes';
import i18n from 'i18next';

const PAYROLL_PERIODS_ENDPOINT = '/payroll-periods';
const PAYROLL_RUNS_ENDPOINT = '/payroll-runs';
const PAYROLL_ENTRIES_ENDPOINT = '/payroll-entries';
const PAYROLL_COMPONENT_DEFINITIONS_ENDPOINT = '/payroll-component-definitions';

/**
 * Fetches a list of payroll periods.
 * @param params Query parameters for filtering, pagination, etc.
 * @returns A promise that resolves to the list of payroll periods with metadata.
 */
export const getPayrollPeriods = async (params?: Record<string, any>): Promise<ApiListResponse<PayrollPeriod>> => {
  try {
    // 添加详细日志
    console.log('Fetching payroll periods with params:', JSON.stringify(params, null, 2));
    console.log('Request URL:', `${apiClient.defaults.baseURL}${PAYROLL_PERIODS_ENDPOINT}`);
    
    // 确保status_lookup_value_id是数字类型
    if (params?.status_lookup_value_id) {
      params.status_lookup_value_id = Number(params.status_lookup_value_id);
      console.log('Converted status_lookup_value_id to Number:', params.status_lookup_value_id, typeof params.status_lookup_value_id);
    }
    
    const response = await apiClient.get<ApiListResponse<PayrollPeriod>>(PAYROLL_PERIODS_ENDPOINT, { params });
    console.log('Payroll periods response:', response.status, response.statusText);
    console.log('Payroll periods data count:', response.data.data.length);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching payroll periods:', error);
    
    // 添加详细错误日志
    if (error.response) {
      console.error('Error response status:', error.response.status);
      console.error('Error response data:', JSON.stringify(error.response.data, null, 2));
      console.error('Error response headers:', JSON.stringify(error.response.headers, null, 2));
    } else if (error.request) {
      console.error('Error request:', error.request);
    } else {
      console.error('Error message:', error.message);
    }
    
    throw error; // Rethrow to be handled by the caller
  }
};

/**
 * Creates a new payroll period.
 * @param data The data for the new payroll period.
 * @returns A promise that resolves to the created payroll period.
 */
export const createPayrollPeriod = async (data: Partial<PayrollPeriod>): Promise<ApiSingleResponse<PayrollPeriod>> => {
  try {
    const response = await apiClient.post<ApiSingleResponse<PayrollPeriod>>(PAYROLL_PERIODS_ENDPOINT, data);
    return response.data;
  } catch (error) {
    console.error('Error creating payroll period:', error);
    throw error;
  }
};

/**
 * Updates an existing payroll period.
 * @param periodId The ID of the payroll period to update.
 * @param data The data to update the payroll period with.
 * @returns A promise that resolves to the updated payroll period.
 */
export const updatePayrollPeriod = async (periodId: number, data: Partial<PayrollPeriod>): Promise<ApiSingleResponse<PayrollPeriod>> => {
  try {
    const response = await apiClient.put<ApiSingleResponse<PayrollPeriod>>(`${PAYROLL_PERIODS_ENDPOINT}/${periodId}`, data);
    return response.data;
  } catch (error) {
    console.error(`Error updating payroll period ${periodId}:`, error);
    throw error;
  }
};

/**
 * Deletes a payroll period.
 * @param periodId The ID of the payroll period to delete.
 * @returns A promise that resolves when the payroll period is deleted.
 */
export const deletePayrollPeriod = async (periodId: number): Promise<void> => {
  try {
    await apiClient.delete(`${PAYROLL_PERIODS_ENDPOINT}/${periodId}`);
  } catch (error) {
    console.error(`Error deleting payroll period ${periodId}:`, error);
    throw error;
  }
};

// --- Payroll Runs Service Functions ---

/**
 * Fetches a list of payroll runs.
 */
export const getPayrollRuns = async (params?: {
  page?: number;
  size?: number;
  payroll_period_id?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}): Promise<ApiListResponse<PayrollRun>> => {
  try {
    const response = await apiClient.get<ApiListResponse<PayrollRun>>(PAYROLL_RUNS_ENDPOINT, { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching payroll runs:', error);
    throw error;
  }
};

/**
 * Creates a new payroll run.
 */
export const createPayrollRun = async (data: CreatePayrollRunPayload): Promise<ApiSingleResponse<PayrollRun>> => {
  try {
    const response = await apiClient.post<ApiSingleResponse<PayrollRun>>(PAYROLL_RUNS_ENDPOINT, data);
    return response.data;
  } catch (error) {
    console.error('Error creating payroll run:', error);
    throw error;
  }
};

/**
 * Fetches a specific payroll run by its ID.
 */
export const getPayrollRunById = async (id: number, options?: { include_employee_details?: boolean }): Promise<ApiSingleResponse<PayrollRun>> => {
  try {
    const response = await apiClient.get<ApiSingleResponse<PayrollRun>>(
      `${PAYROLL_RUNS_ENDPOINT}/${id}`, 
      { params: options }
    );
    return response.data;
  } catch (error) {
    console.error(`Error fetching payroll run ${id}:`, error);
    throw error;
  }
};

/**
 * Updates an existing payroll run.
 * Note: The backend PUT /v2/payroll-runs/{run_id} expects full replacement or specific fields.
 * If it's a PATCH for partial updates (like just status, or just notes), PayrollRunPatch is correct.
 * If it's a PUT that needs more fields from CreatePayrollRunPayload but all optional, then UpdatePayrollRunPayload is more appropriate.
 * The current implementation in PayrollRunsPage.tsx for edit sends all fields, resembling a PUT, so we'll align updatePayrollRun to accept UpdatePayrollRunPayload.
 */
export const updatePayrollRun = async (id: number, data: UpdatePayrollRunPayload): Promise<ApiSingleResponse<PayrollRun>> => {
  try {
    const response = await apiClient.put<ApiSingleResponse<PayrollRun>>(`${PAYROLL_RUNS_ENDPOINT}/${id}`, data);
    return response.data;
  } catch (error) {
    console.error(`Error updating payroll run ${id}:`, error);
    throw error;
  }
};

/**
 * Deletes a payroll run.
 */
export const deletePayrollRun = async (id: number): Promise<void> => {
  try {
    await apiClient.delete(`${PAYROLL_RUNS_ENDPOINT}/${id}`);
  } catch (error) {
    console.error(`Error deleting payroll run ${id}:`, error);
    throw error;
  }
};

/**
 * Exports the bank file for a specific payroll run.
 */
export const exportPayrollRunBankFile = async (id: number): Promise<Blob> => {
  try {
    const response = await apiClient.get<Blob>(`${PAYROLL_RUNS_ENDPOINT}/${id}/bank-export`, {
      responseType: 'blob', // Important for file downloads
    });
    return response.data; 
  } catch (error) {
    console.error(`Error exporting bank file for payroll run ${id}:`, error);
    throw error;
  }
};

// --- Payroll Entries Service Functions ---

/**
 * Fetches a list of payroll entries.
 * Can be filtered by payroll_run_id, employee_id, etc.
 * @param params Query parameters for filtering, pagination.
 */
export const getPayrollEntries = async (params?: {
  page?: number;
  size?: number;
  payroll_run_id?: number;
  employee_id?: number;
  include_employee_details?: boolean;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}): Promise<ApiListResponse<PayrollEntry>> => {
  try {
    const response = await apiClient.get<ApiListResponse<PayrollEntry>>(PAYROLL_ENTRIES_ENDPOINT, { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching payroll entries:', error);
    throw error;
  }
};

/**
 * Fetches a specific payroll entry by its ID.
 * @param entryId The ID of the payroll entry.
 */
export const getPayrollEntryById = async (entryId: number): Promise<ApiSingleResponse<PayrollEntry>> => {
  try {
    const response = await apiClient.get<ApiSingleResponse<PayrollEntry>>(`${PAYROLL_ENTRIES_ENDPOINT}/${entryId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching payroll entry ${entryId}:`, error);
    throw error;
  }
};

/**
 * Updates details of a specific payroll entry.
 * @param entryId The ID of the payroll entry to update.
 * @param data The data to update, conforming to PayrollEntryPatch.
 */
export const updatePayrollEntryDetails = async (entryId: number, data: PayrollEntryPatch): Promise<ApiSingleResponse<PayrollEntry>> => {
  try {
    console.log(`准备发送PATCH请求到 ${PAYROLL_ENTRIES_ENDPOINT}/${entryId}，数据:`, JSON.stringify(data, null, 2));
    
    // 获取apiClient中配置的请求头
    const requestConfig = {
      url: `${PAYROLL_ENTRIES_ENDPOINT}/${entryId}`,
      method: 'PATCH',
      data,
      headers: apiClient.defaults.headers
    };
    
    console.log('请求配置:', JSON.stringify(requestConfig, null, 2));
    
    // 验证earnings_details和deductions_details的结构是否符合后端期望
    if (data.earnings_details && Array.isArray(data.earnings_details)) {
      console.error('警告: earnings_details是数组格式，但后端期望对象格式');
    }
    
    if (data.deductions_details && Array.isArray(data.deductions_details)) {
      console.error('警告: deductions_details是数组格式，但后端期望对象格式');
    }
    
    const response = await apiClient.patch<ApiSingleResponse<PayrollEntry>>(`${PAYROLL_ENTRIES_ENDPOINT}/${entryId}`, data);
    
    console.log(`PATCH请求成功，状态码: ${response.status}，响应头:`, response.headers);
    console.log(`响应数据:`, JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error: any) {
    console.error(`Error updating payroll entry ${entryId}:`, error);
    
    // 增加更详细的错误日志
    if (error.response) {
      console.error(`PATCH请求失败，状态码: ${error.response.status}`);
      console.error(`错误详情:`, JSON.stringify(error.response.data, null, 2));
    }
    
    throw error;
  }
};

/**
 * Creates a new payroll entry.
 * @param data The data for the new payroll entry.
 * @returns A promise that resolves to the created payroll entry.
 */
export const createPayrollEntry = async (data: CreatePayrollEntryPayload): Promise<ApiSingleResponse<PayrollEntry>> => {
  try {
    const response = await apiClient.post<ApiSingleResponse<PayrollEntry>>(PAYROLL_ENTRIES_ENDPOINT, data);
    return response.data;
  } catch (error) {
    console.error('Error creating payroll entry:', error);
    throw error;
  }
};

/**
 * Bulk creates payroll entries.
 * @param data The bulk creation payload with payroll period ID and entries array.
 * @returns A promise that resolves to an array of created payroll entries.
 */
export const bulkCreatePayrollEntries = async (data: BulkCreatePayrollEntriesPayload): Promise<ApiListResponse<PayrollEntry>> => {
  try {
    const response = await apiClient.post<ApiListResponse<PayrollEntry>>(`${PAYROLL_ENTRIES_ENDPOINT}/bulk`, data);
    return response.data;
  } catch (error) {
    console.error('Error bulk creating payroll entries:', error);
    throw error;
  }
};

/**
 * 获取薪资组件定义列表
 * @param params 查询参数，如分类、排序等
 * @returns 包含组件定义列表的Promise
 */
export const getPayrollComponentDefinitions = async (params?: {
  type?: string;
  is_enabled?: boolean;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  size?: number;
}): Promise<ApiListResponse<PayrollComponentDefinition>> => {
  try {
    // 先尝试从后端获取组件定义
    const response = await apiClient.get<ApiListResponse<PayrollComponentDefinition>>(
      PAYROLL_COMPONENT_DEFINITIONS_ENDPOINT, 
      { params }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching payroll component definitions:', error);
    
    // 如果后端API不存在，使用本地预定义的组件定义作为备用
    const fallbackComponents: PayrollComponentDefinition[] = [
      {
        id: 1,
        code: 'BASIC_SALARY',
        name: '基本工资',
        type: 'EARNING',
        data_type: 'numeric',
        is_fixed: false,
        is_employee_specific: true,
        is_enabled: true,
        sort_order: 1
      },
      {
        id: 6,
        code: 'PERFORMANCE_BONUS',
        name: '绩效奖金',
        type: 'EARNING',
        data_type: 'numeric',
        is_fixed: false,
        is_employee_specific: true,
        is_enabled: true,
        sort_order: 2
      },
      {
        id: 10,
        code: 'POSITION_ALLOWANCE',
        name: '岗位津贴',
        type: 'EARNING',
        data_type: 'numeric',
        is_fixed: false,
        is_employee_specific: true,
        is_enabled: true,
        sort_order: 3
      },
      {
        id: 9,
        code: 'BACK_PAY',
        name: '补发工资',
        type: 'EARNING',
        data_type: 'numeric',
        is_fixed: false,
        is_employee_specific: true,
        is_enabled: true,
        sort_order: 4
      },
      {
        id: 60,
        code: 'PERSONAL_INCOME_TAX',
        name: '个人所得税',
        type: 'PERSONAL_DEDUCTION',
        data_type: 'numeric',
        is_fixed: false,
        is_employee_specific: true,
        is_enabled: true,
        sort_order: 1
      },
      {
        id: 40,
        code: 'PENSION_PERSONAL_AMOUNT',
        name: '养老保险个人应缴金额',
        type: 'PERSONAL_DEDUCTION',
        data_type: 'numeric',
        is_fixed: false,
        is_employee_specific: true,
        is_enabled: true,
        sort_order: 2
      },
      {
        id: 34,
        code: 'MEDICAL_INS_PERSONAL_AMOUNT',
        name: '医疗保险个人缴纳金额',
        type: 'PERSONAL_DEDUCTION',
        data_type: 'numeric',
        is_fixed: false,
        is_employee_specific: true,
        is_enabled: true,
        sort_order: 3
      }
    ];
    
    // 根据参数过滤组件
    let filteredComponents = [...fallbackComponents];
    if (params?.type) {
      filteredComponents = filteredComponents.filter(comp => comp.type === params.type);
    }
    if (params?.is_enabled !== undefined) {
      filteredComponents = filteredComponents.filter(comp => comp.is_enabled === params.is_enabled);
    }
    
    // 返回本地备用数据
    console.warn('Using fallback component definitions due to API error');
    return {
      data: filteredComponents,
      meta: {
        page: 1,
        size: filteredComponents.length,
        total: filteredComponents.length,
        totalPages: 1
      }
    };
  }
};

// Test function for i18n
export const testTranslations = () => {
  // 使用已导入的i18n实例，而不是重新require
  
  // 测试各种访问方式
  const results = {
    direct: {
      withNamespace: i18n.t('periods_page.button.add_period', { ns: 'payroll' }),
      withoutNamespace: i18n.t('periods_page.button.add_period')
    },
    nestedKeys: {
      fullPath: i18n.t('payroll:periods_page.button.add_period'),
      parentPath: i18n.t('payroll:periods_page.button'),
      directKey: i18n.t('add_period', { ns: 'payroll.periods_page.button' })
    },
    alternatives: {
      createPeriod: i18n.t('periods_page.button.create_period', { ns: 'payroll' }),
      commonButton: i18n.t('button.create', { ns: 'common' })
    },
    loadedNamespaces: i18n.options.ns,
    availableLanguages: i18n.options.preload,
    currentLanguage: i18n.language
  };
  
  return results;
};

/**
 * 创建新的薪资组件定义
 * @param componentData 组件定义数据
 * @returns 创建的薪资组件定义
 */
export const createPayrollComponentDefinition = async (
  componentData: Partial<PayrollComponentDefinition>
): Promise<ApiSingleResponse<PayrollComponentDefinition>> => {
  try {
    const response = await apiClient.post<ApiSingleResponse<PayrollComponentDefinition>>(
      PAYROLL_COMPONENT_DEFINITIONS_ENDPOINT,
      componentData
    );
    return response.data;
  } catch (error) {
    console.error('Error creating payroll component definition:', error);
    throw error;
  }
};

/**
 * 更新薪资组件定义
 * @param id 组件定义ID
 * @param componentData 更新的组件定义数据
 * @returns 更新后的薪资组件定义
 */
export const updatePayrollComponentDefinition = async (
  id: number,
  componentData: Partial<PayrollComponentDefinition>
): Promise<ApiSingleResponse<PayrollComponentDefinition>> => {
  try {
    const response = await apiClient.put<ApiSingleResponse<PayrollComponentDefinition>>(
      `${PAYROLL_COMPONENT_DEFINITIONS_ENDPOINT}/${id}`,
      componentData
    );
    return response.data;
  } catch (error) {
    console.error('Error updating payroll component definition:', error);
    throw error;
  }
};

/**
 * 删除薪资组件定义
 * @param id 组件定义ID
 * @returns 操作成功返回true
 */
export const deletePayrollComponentDefinition = async (
  id: number
): Promise<boolean> => {
  try {
    await apiClient.delete(`${PAYROLL_COMPONENT_DEFINITIONS_ENDPOINT}/${id}`);
    return true;
  } catch (error) {
    console.error('Error deleting payroll component definition:', error);
    throw error;
  }
}; 