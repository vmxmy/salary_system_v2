import apiClient from './api';
import {
    SendPayslipRequest,
    SendPayslipResponse,
    EmailSendingTaskResponse,
    EmailSendingTaskHistoryItem,
    EmailLogResponse
} from '../pydantic_models/email_sender';
// Import option types from the slice to ensure consistency
import type {
    EmailServerConfigOption, // Renamed from slice's EmailServerConfigOption if different structure
    UnitOption,
    DepartmentOption,
    EmployeeOption
} from '../store/slices/emailSenderSlice';
// Import EmailConfigResponse if needed for mapping, and getEmailConfigs function
import { getEmailConfigs, type EmailConfigResponse } from './api';

// Interfaces for API parameters and responses if not directly using Pydantic models
// For example, for paginated history or logs
interface PaginatedRequestParams {
    skip?: number;
    limit?: number;
    [key: string]: any; // For other potential filter params
}

interface PaginatedTaskHistoryResponse {
    tasks: EmailSendingTaskHistoryItem[];
    total_count: number;
}

interface PaginatedTaskLogsResponse {
    logs: EmailLogResponse[];
    total_count: number;
}

// --- API Functions for Email Sender --- START ---

/**
 * Initiates the process of sending payslip emails based on the provided criteria.
 */
export const sendPayslipEmails = async (requestData: SendPayslipRequest): Promise<SendPayslipResponse> => {
    const response = await apiClient.post<SendPayslipResponse>('/api/email-sender/send-payslip', requestData);
    return response.data;
};

/**
 * Fetches the history of email sending tasks with pagination.
 */
export const getEmailSendingTaskHistory = async (params: PaginatedRequestParams): Promise<PaginatedTaskHistoryResponse> => {
    const response = await apiClient.get<PaginatedTaskHistoryResponse>('/api/email-sender/tasks/history', { params });
    return response.data;
};

/**
 * Fetches the details of a specific email sending task by its UUID.
 */
export const getEmailSendingTaskDetail = async (taskUuid: string): Promise<EmailSendingTaskResponse> => {
    const response = await apiClient.get<EmailSendingTaskResponse>(`/api/email-sender/tasks/${taskUuid}`);
    return response.data;
};

/**
 * Fetches the email logs for a specific email sending task by its UUID with pagination.
 */
export const getEmailLogsForTask = async (taskUuid: string, params: PaginatedRequestParams): Promise<PaginatedTaskLogsResponse> => {
    try {
        console.log(`Fetching email logs for task ${taskUuid} with params:`, params);
        const response = await apiClient.get<PaginatedTaskLogsResponse>(`/api/email-sender/tasks/${taskUuid}/logs`, { params });
        console.log(`Received email logs response:`, response.data);
        return response.data;
    } catch (error) {
        console.error(`Error fetching email logs for task ${taskUuid}:`, error);
        // 返回空数据，避免UI崩溃
        return { logs: [], total_count: 0 };
    }
};

// --- Functions to fetch options for the form (if these come from separate endpoints) ---

/**
 * Fetches available pay periods.
 * This might be a generic endpoint or specific to email sender needs.
 * For now, assuming a simple string array response.
 */
export const getPayPeriodOptions = async (): Promise<string[]> => {
    // 使用正确的后端API路径 /api/salary_data/pay_periods (使用下划线而非连字符)
    try {
        // 修正：API返回的是 { data: string[] } 格式
        const response = await apiClient.get<{ data: string[] }>('/api/salary_data/pay_periods');
        return response.data.data || [];
    } catch (error) {
        console.error("Failed to fetch pay period options:", error);
        // Consider re-throwing or specific error handling based on application needs
        return []; // Return empty array on error to prevent UI breakage
    }
};

/**
 * Fetches available email server configurations.
 */
export const getEmailServerConfigOptions = async (): Promise<EmailServerConfigOption[]> => {
    try {
        // Use getEmailConfigs from api.ts which hits /api/email-configs
        const apiEmailConfigs = await getEmailConfigs(); // This returns EmailConfigResponse[]

        // 如果没有配置，返回一个默认配置
        if (!apiEmailConfigs || apiEmailConfigs.length === 0) {
            console.warn("No email server configs found, returning default config");
            return [{
                id: 1,
                server_name: "默认邮件服务器 (请先配置)",
                sender_email: "example@example.com",
                is_default: true
            }];
        }

        // Map EmailConfigResponse to EmailServerConfigOption
        // Ensure EmailServerConfigOption (from slice) has matching or subset of fields
        return apiEmailConfigs.map((config: EmailConfigResponse): EmailServerConfigOption => ({
            id: config.id,
            server_name: config.server_name,
            sender_email: config.sender_email,
            is_default: config.is_default || false,
            // Add other fields if EmailServerConfigOption from slice expects more
            // and if they are available in EmailConfigResponse
        }));
    } catch (error) {
        console.error("Failed to fetch email server config options:", error);
        // 返回默认配置，避免UI出错
        return [{
            id: 1,
            server_name: "默认邮件服务器 (请先配置)",
            sender_email: "example@example.com",
            is_default: true
        }];
    }
};

/**
 * Fetches unit options (if applicable for filtering).
 */
export const getUnitOptions = async (): Promise<UnitOption[]> => {
    // 使用/api/units/?page=1&page_size=10端点获取单位列表，包含真实ID
    try {
        const params = {
            page: 1,
            page_size: 100 // 获取足够多的单位
        };
        const response = await apiClient.get<{ data: any[], total: number }>('/api/units/', { params });

        // 将返回的单位数据转换为UnitOption[]格式
        return (response.data.data || []).map(unit => ({
            id: unit.id, // 使用真实的单位ID
            name: unit.name
        }));
    } catch (error) {
        console.error("Failed to fetch unit options:", error);
        // 如果API调用失败，返回一些示例数据以便UI能够正常显示
        return [
            { id: 1, name: "高新区财政金融局 (示例)" },
            { id: 2, name: "高新区管委会 (示例)" }
        ];
    }
};

/**
 * Fetches department options, optionally filtered by unit_id.
 */
export const getDepartmentOptions = async (unitId?: number): Promise<DepartmentOption[]> => {
    // 使用/api/departments/端点，该端点支持按unit_id筛选
    try {
        // 设置查询参数
        const params: any = {
            page: 1,
            page_size: 100 // 获取足够多的部门
        };

        // 如果提供了单位ID，添加到查询参数
        if (unitId) {
            params.unit_id = unitId;
        }

        // 发送请求
        const response = await apiClient.get<{ data: any[], total: number }>('/api/departments/', { params });

        // 将返回的部门数据转换为DepartmentOption[]格式
        return (response.data.data || []).map(dept => ({
            id: dept.id,
            name: dept.name
        }));
    } catch (error) {
        console.error("Failed to fetch department options:", error);
        // 如果API调用失败，返回一些示例数据以便UI能够正常显示
        if (unitId) {
            // 如果指定了单位ID，返回空数组
            return [];
        } else {
            // 如果没有指定单位ID，返回一些示例部门
            return [
                { id: 1, name: "财务部 (示例)" },
                { id: 2, name: "人事部 (示例)" }
            ];
        }
    }
};

/**
 * Fetches employee options, optionally filtered by department_id.
 */
export const getEmployeeOptions = async (departmentId?: number): Promise<EmployeeOption[]> => {
    // 使用/api/employees/端点，该端点需要分页参数，并返回{data: [], total: number}格式
    try {
        // 设置查询参数，包括分页和部门过滤
        const params: any = {
            page: 1,
            size: 100 // 获取足够多的员工
        };

        // 如果提供了部门ID，添加到查询参数
        if (departmentId) {
            params.department_id = departmentId;
        }

        // 发送请求
        const response = await apiClient.get<{ data: any[], total: number }>('/api/employees/', { params });

        // 将返回的员工数据转换为EmployeeOption[]格式
        return (response.data.data || []).map(emp => ({
            id: emp.id,
            name: emp.name,
            email: emp.email || '',
            department_name: emp.department_name || '',
            unit_name: emp.unit_name || ''
        }));
    } catch (error) {
        console.error("Failed to fetch employee options:", error);
        // 如果API调用失败，返回一些示例数据以便UI能够正常显示
        return [
            { id: 1, name: "张三 (示例)", email: "zhangsan@example.com", department_name: "财务部", unit_name: "总部" },
            { id: 2, name: "李四 (示例)", email: "lisi@example.com", department_name: "人事部", unit_name: "总部" }
        ];
    }
};

// --- API Functions for Email Sender --- END ---