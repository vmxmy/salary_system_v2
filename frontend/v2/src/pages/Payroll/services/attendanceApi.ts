import apiClient from '../../../api/apiClient';
import type {
  AttendancePeriod,
  AttendanceRecord,
  DailyAttendanceRecord,
  AttendanceRule,
  AttendanceStatistics,
  CreateAttendancePeriodRequest,
  UpdateAttendancePeriodRequest,
  CreateAttendanceRecordRequest,
  UpdateAttendanceRecordRequest,
  CreateDailyAttendanceRecordRequest,
  UpdateDailyAttendanceRecordRequest,
  CreateAttendanceRuleRequest,
  UpdateAttendanceRuleRequest,
  BatchImportAttendanceRequest,
  ApiResponse
} from '../types/attendanceTypes';

const BASE_URL = '/attendance';

// 考勤周期管理
export const attendancePeriodApi = {
  // 获取考勤周期列表
  getAttendancePeriods: (params?: { page?: number; size?: number; search?: string }): Promise<ApiResponse<AttendancePeriod[]>> => {
    return apiClient.get(`${BASE_URL}/periods`, { params });
  },

  // 获取考勤周期详情
  getAttendancePeriod: (id: number): Promise<ApiResponse<AttendancePeriod>> => {
    return apiClient.get(`${BASE_URL}/periods/${id}`);
  },

  // 创建考勤周期
  createAttendancePeriod: (data: CreateAttendancePeriodRequest): Promise<ApiResponse<AttendancePeriod>> => {
    return apiClient.post(`${BASE_URL}/periods`, data);
  },

  // 更新考勤周期
  updateAttendancePeriod: (id: number, data: UpdateAttendancePeriodRequest): Promise<ApiResponse<AttendancePeriod>> => {
    return apiClient.put(`${BASE_URL}/periods/${id}`, data);
  },

  // 删除考勤周期
  deleteAttendancePeriod: (id: number): Promise<ApiResponse<void>> => {
    return apiClient.delete(`${BASE_URL}/periods/${id}`);
  },

  // 激活/停用考勤周期
  toggleAttendancePeriod: (id: number, isActive: boolean): Promise<ApiResponse<AttendancePeriod>> => {
    return apiClient.patch(`${BASE_URL}/periods/${id}/toggle`, { is_active: isActive });
  }
};

// 考勤记录管理
export const attendanceRecordApi = {
  // 获取考勤记录列表
  getAttendanceRecords: (params?: { 
    page?: number; 
    size?: number; 
    search?: string;
    attendance_period_id?: number;
    employee_id?: number;
  }): Promise<ApiResponse<AttendanceRecord[]>> => {
    return apiClient.get(`${BASE_URL}/records`, { params });
  },

  // 获取考勤记录详情
  getAttendanceRecord: (id: number): Promise<ApiResponse<AttendanceRecord>> => {
    return apiClient.get(`${BASE_URL}/records/${id}`);
  },

  // 创建考勤记录
  createAttendanceRecord: (data: CreateAttendanceRecordRequest): Promise<ApiResponse<AttendanceRecord>> => {
    return apiClient.post(`${BASE_URL}/records`, data);
  },

  // 更新考勤记录
  updateAttendanceRecord: (id: number, data: UpdateAttendanceRecordRequest): Promise<ApiResponse<AttendanceRecord>> => {
    return apiClient.put(`${BASE_URL}/records/${id}`, data);
  },

  // 删除考勤记录
  deleteAttendanceRecord: (id: number): Promise<ApiResponse<void>> => {
    return apiClient.delete(`${BASE_URL}/records/${id}`);
  },

  // 批量导入考勤记录
  batchImportAttendanceRecords: (data: BatchImportAttendanceRequest): Promise<ApiResponse<{ success_count: number; error_count: number; errors: string[] }>> => {
    return apiClient.post(`${BASE_URL}/records/batch-import`, data);
  }
};

// 日考勤记录管理
export const dailyAttendanceApi = {
  // 获取日考勤记录列表
  getDailyAttendanceRecords: (params?: { 
    page?: number; 
    size?: number; 
    search?: string;
    employee_id?: number;
    start_date?: string;
    end_date?: string;
  }): Promise<ApiResponse<DailyAttendanceRecord[]>> => {
    return apiClient.get(`${BASE_URL}/daily-records`, { params });
  },

  // 获取日考勤记录详情
  getDailyAttendanceRecord: (id: number): Promise<ApiResponse<DailyAttendanceRecord>> => {
    return apiClient.get(`${BASE_URL}/daily-records/${id}`);
  },

  // 创建日考勤记录
  createDailyAttendanceRecord: (data: CreateDailyAttendanceRecordRequest): Promise<ApiResponse<DailyAttendanceRecord>> => {
    return apiClient.post(`${BASE_URL}/daily-records`, data);
  },

  // 更新日考勤记录
  updateDailyAttendanceRecord: (id: number, data: UpdateDailyAttendanceRecordRequest): Promise<ApiResponse<DailyAttendanceRecord>> => {
    return apiClient.put(`${BASE_URL}/daily-records/${id}`, data);
  },

  // 删除日考勤记录
  deleteDailyAttendanceRecord: (id: number): Promise<ApiResponse<void>> => {
    return apiClient.delete(`${BASE_URL}/daily-records/${id}`);
  },

  // 根据员工和日期范围获取日考勤记录
  getEmployeeDailyRecords: (employeeId: number, startDate: string, endDate: string): Promise<ApiResponse<DailyAttendanceRecord[]>> => {
    return apiClient.get(`${BASE_URL}/daily-records/employee/${employeeId}`, {
      params: { start_date: startDate, end_date: endDate }
    });
  }
};

// 考勤规则管理
export const attendanceRuleApi = {
  // 获取考勤规则列表
  getAttendanceRules: (params?: { page?: number; size?: number; search?: string }): Promise<ApiResponse<AttendanceRule[]>> => {
    return apiClient.get(`${BASE_URL}/rules`, { params });
  },

  // 获取考勤规则详情
  getAttendanceRule: (id: number): Promise<ApiResponse<AttendanceRule>> => {
    return apiClient.get(`${BASE_URL}/rules/${id}`);
  },

  // 创建考勤规则
  createAttendanceRule: (data: CreateAttendanceRuleRequest): Promise<ApiResponse<AttendanceRule>> => {
    return apiClient.post(`${BASE_URL}/rules`, data);
  },

  // 更新考勤规则
  updateAttendanceRule: (id: number, data: UpdateAttendanceRuleRequest): Promise<ApiResponse<AttendanceRule>> => {
    return apiClient.put(`${BASE_URL}/rules/${id}`, data);
  },

  // 删除考勤规则
  deleteAttendanceRule: (id: number): Promise<ApiResponse<void>> => {
    return apiClient.delete(`${BASE_URL}/rules/${id}`);
  },

  // 激活/停用考勤规则
  toggleAttendanceRule: (id: number, isActive: boolean): Promise<ApiResponse<AttendanceRule>> => {
    return apiClient.patch(`${BASE_URL}/rules/${id}/toggle`, { is_active: isActive });
  }
};

// 考勤统计
export const attendanceStatisticsApi = {
  // 获取考勤周期统计
  getPeriodStatistics: (periodId: number): Promise<ApiResponse<AttendanceStatistics>> => {
    return apiClient.get(`${BASE_URL}/statistics/period/${periodId}`);
  },

  // 获取员工考勤统计
  getEmployeeStatistics: (employeeId: number, startDate: string, endDate: string): Promise<ApiResponse<AttendanceStatistics>> => {
    return apiClient.get(`${BASE_URL}/statistics/employee/${employeeId}`, {
      params: { start_date: startDate, end_date: endDate }
    });
  },

  // 获取部门考勤统计
  getDepartmentStatistics: (departmentId: number, startDate: string, endDate: string): Promise<ApiResponse<AttendanceStatistics>> => {
    return apiClient.get(`${BASE_URL}/statistics/department/${departmentId}`, {
      params: { start_date: startDate, end_date: endDate }
    });
  }
}; 