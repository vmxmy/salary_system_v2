import { createSlice, createAsyncThunk, PayloadAction, ActionReducerMapBuilder } from '@reduxjs/toolkit';
import type { RootState } from '../index'; // Import RootState
import {
    SendPayslipRequest,
    SendPayslipResponse,
    EmailSendingTaskResponse,
    EmailSendingTaskHistoryItem,
    EmailLogResponse,
    // Interfaces for options if they are not directly the Pydantic models for request/response
    // It's often good to have specific types for options if they differ from full API models.
} from '../../pydantic_models/email_sender';
import * as emailSenderApi from '../../services/emailSenderApi';

// Define specific interfaces for options if they are different from the ones in emailSenderApi.ts
// or if you want to keep type definitions self-contained within the slice.
// For simplicity, we'll assume the ones in emailSenderApi.ts are sufficient or re-declare if needed.

export interface EmailServerConfigOption {
    id: number;
    server_name: string;
    sender_email: string;
    is_default: boolean;
}

export interface UnitOption {
    id: number;
    name: string;
}

export interface DepartmentOption {
    id: number;
    name: string;
    unit_id: number; // For potential filtering or display logic
}

export interface EmployeeOption {
    id: number;
    name: string;
    email?: string; // Email is optional for an employee but crucial for sending
    department_id: number; // For potential filtering or display logic
}

// --- For Paginated API calls in Thunks ---
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


export interface EmailSenderState {
    payPeriodOptions: string[];
    emailServerConfigOptions: EmailServerConfigOption[];
    unitOptions: UnitOption[];
    departmentOptions: DepartmentOption[];
    employeeOptions: EmployeeOption[];
    formValues: Partial<SendPayslipRequest>;

    sendTaskStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
    sendTaskError: string | null;
    sendTaskResponse: SendPayslipResponse | null;

    taskHistoryList: EmailSendingTaskHistoryItem[];
    taskHistoryTotalCount: number;
    taskHistoryStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
    taskHistoryError: string | null;

    currentTaskDetail: EmailSendingTaskResponse | null;
    currentTaskDetailStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
    currentTaskDetailError: string | null;

    currentTaskLogs: EmailLogResponse[];
    currentTaskLogsTotalCount: number;
    currentTaskLogsStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
    currentTaskLogsError: string | null;

    selectedTaskUuid: string | null;

    emailServerConfigsStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
    unitsStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
    departmentsStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
    employeesStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
    payPeriodsStatus: 'idle' | 'loading' | 'succeeded' | 'failed'; // Added for pay periods
}

const initialState: EmailSenderState = {
    payPeriodOptions: [],
    emailServerConfigOptions: [],
    unitOptions: [],
    departmentOptions: [],
    employeeOptions: [],
    formValues: {
        filters: {}
    },
    sendTaskStatus: 'idle',
    sendTaskError: null,
    sendTaskResponse: null,
    taskHistoryList: [],
    taskHistoryTotalCount: 0,
    taskHistoryStatus: 'idle',
    taskHistoryError: null,
    currentTaskDetail: null,
    currentTaskDetailStatus: 'idle',
    currentTaskDetailError: null,
    currentTaskLogs: [],
    currentTaskLogsTotalCount: 0,
    currentTaskLogsStatus: 'idle',
    currentTaskLogsError: null,
    selectedTaskUuid: null,
    emailServerConfigsStatus: 'idle',
    unitsStatus: 'idle',
    departmentsStatus: 'idle',
    employeesStatus: 'idle',
    payPeriodsStatus: 'idle', // Added for pay periods
};

// --- AsyncThunks --- START ---

export const sendPayslipEmailsAsync = createAsyncThunk(
    'emailSender/sendPayslipEmails',
    async (requestData: SendPayslipRequest, { rejectWithValue }) => {
        try {
            const response = await emailSenderApi.sendPayslipEmails(requestData);
            return response;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.detail || error.message || 'Failed to send payslip emails');
        }
    }
);

export const fetchEmailSendingTaskHistoryAsync = createAsyncThunk(
    'emailSender/fetchTaskHistory',
    async (params: PaginatedRequestParams, { rejectWithValue }) => {
        try {
            const response = await emailSenderApi.getEmailSendingTaskHistory(params);
            return response; // Should be PaginatedTaskHistoryResponse
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.detail || error.message || 'Failed to fetch task history');
        }
    }
);

export const fetchEmailSendingTaskDetailAsync = createAsyncThunk(
    'emailSender/fetchTaskDetail',
    async (taskUuid: string, { rejectWithValue }) => {
        try {
            const response = await emailSenderApi.getEmailSendingTaskDetail(taskUuid);
            return response;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.detail || error.message || 'Failed to fetch task detail');
        }
    }
);

export const fetchEmailLogsForTaskAsync = createAsyncThunk(
    'emailSender/fetchTaskLogs',
    async ({ taskUuid, params }: { taskUuid: string; params: PaginatedRequestParams }, { rejectWithValue }) => {
        try {
            const response = await emailSenderApi.getEmailLogsForTask(taskUuid, params);
            return response; // Should be PaginatedTaskLogsResponse
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.detail || error.message || 'Failed to fetch task logs');
        }
    }
);

// Thunks for fetching dropdown options
export const fetchPayPeriodOptionsAsync = createAsyncThunk(
    'emailSender/fetchPayPeriodOptions',
    async (_, { rejectWithValue }) => {
        try {
            const response = await emailSenderApi.getPayPeriodOptions();
            return response;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to fetch pay period options');
        }
    }
);

export const fetchEmailServerConfigOptionsAsync = createAsyncThunk(
    'emailSender/fetchEmailServerConfigOptions',
    async (_, { rejectWithValue }) => {
        try {
            // Ensure the response from emailSenderApi.getEmailServerConfigOptions matches EmailServerConfigOption[]
            const response = await emailSenderApi.getEmailServerConfigOptions();
            return response;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to fetch email server configs');
        }
    }
);

export const fetchUnitOptionsAsync = createAsyncThunk(
    'emailSender/fetchUnitOptions',
    async (_, { rejectWithValue }) => {
        try {
            const response = await emailSenderApi.getUnitOptions();
            return response;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to fetch unit options');
        }
    }
);

export const fetchDepartmentOptionsAsync = createAsyncThunk(
    'emailSender/fetchDepartmentOptions',
    async (unitId: number | undefined, { rejectWithValue }) => { // unitId can be optional
        try {
            const response = await emailSenderApi.getDepartmentOptions(unitId);
            return response;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to fetch department options');
        }
    }
);

export const fetchEmployeeOptionsAsync = createAsyncThunk(
    'emailSender/fetchEmployeeOptions',
    async (departmentId: number | undefined, { rejectWithValue }) => { // departmentId can be optional
        try {
            const response = await emailSenderApi.getEmployeeOptions(departmentId);
            return response;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to fetch employee options');
        }
    }
);

// --- AsyncThunks --- END ---


const emailSenderSlice = createSlice({
    name: 'emailSender',
    initialState,
    reducers: {
        setFormValue: (state: EmailSenderState, action: PayloadAction<{ field: keyof SendPayslipRequest | string; value: any }>) => {
            const { field, value } = action.payload;
            if (field.startsWith('filters.')) {
                const filterField = field.substring('filters.'.length) as keyof SendPayslipRequest['filters'];
                if (!state.formValues.filters) {
                    state.formValues.filters = {};
                }
                (state.formValues.filters as any)[filterField] = value;
            } else {
                (state.formValues as any)[field] = value;
            }
        },
        resetSendTaskStatus: (state: EmailSenderState) => {
            state.sendTaskStatus = 'idle';
            state.sendTaskError = null;
            state.sendTaskResponse = null;
        },
        setSelectedTaskUuid: (state, action: PayloadAction<string | null>) => {
            state.selectedTaskUuid = action.payload;
        },
        clearCurrentTaskDetails: (state: EmailSenderState) => {
            state.currentTaskDetail = null;
            state.currentTaskDetailStatus = 'idle';
            state.currentTaskDetailError = null;
            state.currentTaskLogs = [];
            state.currentTaskLogsTotalCount = 0;
            state.currentTaskLogsStatus = 'idle';
            state.currentTaskLogsError = null;
        }
    },
    extraReducers: (builder: ActionReducerMapBuilder<EmailSenderState>) => {
        builder
            // Send Payslip Emails
            .addCase(sendPayslipEmailsAsync.pending, (state) => {
                state.sendTaskStatus = 'loading';
                state.sendTaskError = null;
            })
            .addCase(sendPayslipEmailsAsync.fulfilled, (state, action: PayloadAction<SendPayslipResponse>) => {
                state.sendTaskStatus = 'succeeded';
                state.sendTaskResponse = action.payload;
            })
            .addCase(sendPayslipEmailsAsync.rejected, (state, action) => {
                state.sendTaskStatus = 'failed';
                state.sendTaskError = action.payload as string;
            })

            // Fetch Task History
            .addCase(fetchEmailSendingTaskHistoryAsync.pending, (state) => {
                state.taskHistoryStatus = 'loading';
                state.taskHistoryError = null;
            })
            .addCase(fetchEmailSendingTaskHistoryAsync.fulfilled, (state, action: PayloadAction<PaginatedTaskHistoryResponse>) => {
                state.taskHistoryStatus = 'succeeded';
                state.taskHistoryList = action.payload.tasks;
                state.taskHistoryTotalCount = action.payload.total_count;
            })
            .addCase(fetchEmailSendingTaskHistoryAsync.rejected, (state, action) => {
                state.taskHistoryStatus = 'failed';
                state.taskHistoryError = action.payload as string;
            })

            // Fetch Task Detail
            .addCase(fetchEmailSendingTaskDetailAsync.pending, (state) => {
                state.currentTaskDetailStatus = 'loading';
                state.currentTaskDetailError = null;
            })
            .addCase(fetchEmailSendingTaskDetailAsync.fulfilled, (state, action: PayloadAction<EmailSendingTaskResponse>) => {
                state.currentTaskDetailStatus = 'succeeded';
                state.currentTaskDetail = action.payload;
            })
            .addCase(fetchEmailSendingTaskDetailAsync.rejected, (state, action) => {
                state.currentTaskDetailStatus = 'failed';
                state.currentTaskDetailError = action.payload as string;
            })

            // Fetch Task Logs
            .addCase(fetchEmailLogsForTaskAsync.pending, (state) => {
                state.currentTaskLogsStatus = 'loading';
                state.currentTaskLogsError = null;
            })
            .addCase(fetchEmailLogsForTaskAsync.fulfilled, (state, action: PayloadAction<PaginatedTaskLogsResponse>) => {
                state.currentTaskLogsStatus = 'succeeded';
                state.currentTaskLogs = action.payload.logs;
                state.currentTaskLogsTotalCount = action.payload.total_count;
            })
            .addCase(fetchEmailLogsForTaskAsync.rejected, (state, action) => {
                state.currentTaskLogsStatus = 'failed';
                state.currentTaskLogsError = action.payload as string;
            })

            // Fetch Pay Period Options
            .addCase(fetchPayPeriodOptionsAsync.pending, (state) => {
                state.payPeriodsStatus = 'loading';
            })
            .addCase(fetchPayPeriodOptionsAsync.fulfilled, (state, action: PayloadAction<string[]>) => {
                state.payPeriodsStatus = 'succeeded';
                state.payPeriodOptions = action.payload;
            })
            .addCase(fetchPayPeriodOptionsAsync.rejected, (state) => {
                state.payPeriodsStatus = 'failed';
            })

            // Fetch Email Server Config Options
            .addCase(fetchEmailServerConfigOptionsAsync.pending, (state) => {
                state.emailServerConfigsStatus = 'loading';
            })
            .addCase(fetchEmailServerConfigOptionsAsync.fulfilled, (state, action: PayloadAction<EmailServerConfigOption[]>) => {
                state.emailServerConfigsStatus = 'succeeded';
                state.emailServerConfigOptions = action.payload;
            })
            .addCase(fetchEmailServerConfigOptionsAsync.rejected, (state) => {
                state.emailServerConfigsStatus = 'failed';
            })

            // Fetch Unit Options
            .addCase(fetchUnitOptionsAsync.pending, (state) => {
                state.unitsStatus = 'loading';
            })
            .addCase(fetchUnitOptionsAsync.fulfilled, (state, action: PayloadAction<UnitOption[]>) => {
                state.unitsStatus = 'succeeded';
                state.unitOptions = action.payload;
            })
            .addCase(fetchUnitOptionsAsync.rejected, (state) => {
                state.unitsStatus = 'failed';
            })

            // Fetch Department Options
            .addCase(fetchDepartmentOptionsAsync.pending, (state) => {
                state.departmentsStatus = 'loading';
            })
            .addCase(fetchDepartmentOptionsAsync.fulfilled, (state, action: PayloadAction<DepartmentOption[]>) => {
                state.departmentsStatus = 'succeeded';
                state.departmentOptions = action.payload;
            })
            .addCase(fetchDepartmentOptionsAsync.rejected, (state) => {
                state.departmentsStatus = 'failed';
            })

            // Fetch Employee Options
            .addCase(fetchEmployeeOptionsAsync.pending, (state) => {
                state.employeesStatus = 'loading';
            })
            .addCase(fetchEmployeeOptionsAsync.fulfilled, (state, action: PayloadAction<EmployeeOption[]>) => {
                state.employeesStatus = 'succeeded';
                state.employeeOptions = action.payload;
            })
            .addCase(fetchEmployeeOptionsAsync.rejected, (state) => {
                state.employeesStatus = 'failed';
            });
    }
});

export const {
    setFormValue,
    resetSendTaskStatus,
    setSelectedTaskUuid,
    clearCurrentTaskDetails
} = emailSenderSlice.actions;

// --- Selectors --- START ---
export const selectEmailSenderFormValues = (state: RootState) => state.emailSender.formValues;
export const selectPayPeriodOptions = (state: RootState) => state.emailSender.payPeriodOptions;
export const selectEmailServerConfigOptions = (state: RootState) => state.emailSender.emailServerConfigOptions;
export const selectUnitOptions = (state: RootState) => state.emailSender.unitOptions;
export const selectDepartmentOptions = (state: RootState) => state.emailSender.departmentOptions;
export const selectEmployeeOptions = (state: RootState) => state.emailSender.employeeOptions;

export const selectSendTaskStatus = (state: RootState) => state.emailSender.sendTaskStatus;
export const selectSendTaskError = (state: RootState) => state.emailSender.sendTaskError;
export const selectSendTaskResponse = (state: RootState) => state.emailSender.sendTaskResponse;

export const selectTaskHistoryList = (state: RootState) => state.emailSender.taskHistoryList;
export const selectTaskHistoryTotalCount = (state: RootState) => state.emailSender.taskHistoryTotalCount;
export const selectTaskHistoryStatus = (state: RootState) => state.emailSender.taskHistoryStatus;
export const selectTaskHistoryError = (state: RootState) => state.emailSender.taskHistoryError;

export const selectCurrentTaskDetail = (state: RootState) => state.emailSender.currentTaskDetail;
export const selectCurrentTaskDetailStatus = (state: RootState) => state.emailSender.currentTaskDetailStatus;
export const selectCurrentTaskDetailError = (state: RootState) => state.emailSender.currentTaskDetailError;

export const selectCurrentTaskLogs = (state: RootState) => state.emailSender.currentTaskLogs;
export const selectCurrentTaskLogsTotalCount = (state: RootState) => state.emailSender.currentTaskLogsTotalCount;
export const selectCurrentTaskLogsStatus = (state: RootState) => state.emailSender.currentTaskLogsStatus;
export const selectCurrentTaskLogsError = (state: RootState) => state.emailSender.currentTaskLogsError;

export const selectEmailServerConfigsLoadingStatus = (state: RootState) => state.emailSender.emailServerConfigsStatus;
export const selectUnitsLoadingStatus = (state: RootState) => state.emailSender.unitsStatus;
export const selectDepartmentsLoadingStatus = (state: RootState) => state.emailSender.departmentsStatus;
export const selectEmployeesLoadingStatus = (state: RootState) => state.emailSender.employeesStatus;
export const selectPayPeriodsLoadingStatus = (state: RootState) => state.emailSender.payPeriodsStatus;

export const selectSelectedTaskUuid = (state: RootState) => state.emailSender.selectedTaskUuid;

// --- Selectors --- END ---

export default emailSenderSlice.reducer;