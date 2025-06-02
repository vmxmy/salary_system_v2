import apiClient from '../../../api/apiClient';
import type {
  CalculationRuleSet,
  SocialInsuranceConfig,
  TaxConfig,
  CreateCalculationRuleSetRequest,
  UpdateCalculationRuleSetRequest,
  CreateSocialInsuranceConfigRequest,
  UpdateSocialInsuranceConfigRequest,
  CreateTaxConfigRequest,
  UpdateTaxConfigRequest,
  ApiResponse,
  PaginatedResponse
} from '../types/calculationConfig';

const BASE_URL = '/payroll/calculation-config';

export const calculationConfigApi = {
  // 计算规则集管理
  getRuleSets: (): Promise<ApiResponse<CalculationRuleSet[]>> => {
    return apiClient.get(`${BASE_URL}/rule-sets`);
  },

  getRuleSet: (id: number): Promise<ApiResponse<CalculationRuleSet>> => {
    return apiClient.get(`${BASE_URL}/rule-sets/${id}`);
  },

  createRuleSet: (data: CreateCalculationRuleSetRequest): Promise<ApiResponse<CalculationRuleSet>> => {
    return apiClient.post(`${BASE_URL}/rule-sets`, data);
  },

  updateRuleSet: (id: number, data: UpdateCalculationRuleSetRequest): Promise<ApiResponse<CalculationRuleSet>> => {
    return apiClient.put(`${BASE_URL}/rule-sets/${id}`, data);
  },

  deleteRuleSet: (id: number): Promise<ApiResponse<void>> => {
    return apiClient.delete(`${BASE_URL}/rule-sets/${id}`);
  },

  activateRuleSet: (id: number): Promise<ApiResponse<CalculationRuleSet>> => {
    return apiClient.put(`${BASE_URL}/rule-sets/${id}/activate`);
  },

  deactivateRuleSet: (id: number): Promise<ApiResponse<CalculationRuleSet>> => {
    return apiClient.put(`${BASE_URL}/rule-sets/${id}/deactivate`);
  },

  // 社保配置管理
  getSocialInsuranceConfigs: (): Promise<ApiResponse<SocialInsuranceConfig[]>> => {
    return apiClient.get(`${BASE_URL}/social-insurance`);
  },

  getSocialInsuranceConfig: (id: number): Promise<ApiResponse<SocialInsuranceConfig>> => {
    return apiClient.get(`${BASE_URL}/social-insurance/${id}`);
  },

  createSocialInsuranceConfig: (data: CreateSocialInsuranceConfigRequest): Promise<ApiResponse<SocialInsuranceConfig>> => {
    return apiClient.post(`${BASE_URL}/social-insurance`, data);
  },

  updateSocialInsuranceConfig: (id: number, data: UpdateSocialInsuranceConfigRequest): Promise<ApiResponse<SocialInsuranceConfig>> => {
    return apiClient.put(`${BASE_URL}/social-insurance/${id}`, data);
  },

  deleteSocialInsuranceConfig: (id: number): Promise<ApiResponse<void>> => {
    return apiClient.delete(`${BASE_URL}/social-insurance/${id}`);
  },

  // 税务配置管理
  getTaxConfigs: (): Promise<ApiResponse<TaxConfig[]>> => {
    return apiClient.get(`${BASE_URL}/tax-configs`);
  },

  getTaxConfig: (id: number): Promise<ApiResponse<TaxConfig>> => {
    return apiClient.get(`${BASE_URL}/tax-configs/${id}`);
  },

  createTaxConfig: (data: CreateTaxConfigRequest): Promise<ApiResponse<TaxConfig>> => {
    return apiClient.post(`${BASE_URL}/tax-configs`, data);
  },

  updateTaxConfig: (id: number, data: UpdateTaxConfigRequest): Promise<ApiResponse<TaxConfig>> => {
    return apiClient.put(`${BASE_URL}/tax-configs/${id}`, data);
  },

  deleteTaxConfig: (id: number): Promise<ApiResponse<void>> => {
    return apiClient.delete(`${BASE_URL}/tax-configs/${id}`);
  }
}; 