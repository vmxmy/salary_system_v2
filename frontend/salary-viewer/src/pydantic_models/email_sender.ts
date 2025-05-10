// Corresponds to Pydantic models from webapp/pydantic_models/email_sender.py
// It's crucial that these interfaces accurately reflect the structure of data
// exchanged with the backend API.

// Assuming uuid is represented as string in JSON and for frontend usage
export type UUIDString = string;

export interface PayslipSentDetail {
    employee_id: number;
    employee_name: string;
    status: "sent" | "failed" | "skipped_no_email" | "skipped_no_salary_data";
    error_message?: string | null;
    recipient_email?: string | null;
}

export interface SendPayslipRequestFilters {
    unit_ids?: number[];
    department_ids?: number[];
    employee_ids?: number[];
    employee_specific_data_required?: boolean;
    // Add other filter keys as defined in your backend
}

export interface SendPayslipRequest {
    pay_period: string; // Format: YYYY-MM
    email_config_id: number;
    subject_template: string;
    filters?: SendPayslipRequestFilters | null;
}

export interface SendPayslipResponse {
    message: string;
    task_uuid?: UUIDString | null;
    total_employees_matched: number;
}

// --- Models for Task Status and History ---

export interface EmailSendingTaskBase {
    task_uuid: UUIDString;
    pay_period: string;
    email_config_id: number;
    filters_applied?: { [key: string]: any } | null;
    subject_template?: string | null;
    // body_template?: string | null; // Potentially too large for history list
    requested_by_user_id?: number | null;
    status: string; // e.g., "PENDING", "IN_PROGRESS", "COMPLETED", "FAILED", "PARTIALLY_COMPLETED"
    total_employees_matched?: number | null;
    total_sent_successfully?: number | null;
    total_failed?: number | null;
    total_skipped_no_email?: number | null;
    total_skipped_no_salary?: number | null;
    total_skipped?: number | null;
    created_at: string; // ISO datetime string
    started_at?: string | null; // ISO datetime string
    completed_at?: string | null; // ISO datetime string
    last_error_message?: string | null;
}

export interface EmailSendingTaskResponse extends EmailSendingTaskBase {
    // body_template?: string | null; // Send if requested?
    requested_by_user_email?: string | null;
}

export interface EmailSendingTaskHistoryItem {
    task_uuid: UUIDString;
    pay_period: string;
    status: string;
    total_employees_matched?: number | null;
    total_sent_successfully?: number | null;
    total_failed?: number | null;
    created_at: string; // ISO datetime string
    completed_at?: string | null; // ISO datetime string
    requested_by_user_id?: number | null;
    requested_by_user_email?: string | null;
}

export interface EmailLogResponse {
    id: number;
    sender_email: string;
    recipient_emails: string[]; // 注意这里是数组
    recipient_name?: string | null; // 添加收件人姓名字段
    subject: string;
    body?: string | null; // 通常不会在列表中显示，太大
    status: string;
    sent_at: string; // ISO datetime string
    error_message?: string | null;
    sender_employee_id?: number | null;
    task_uuid?: UUIDString | null;
}