// 考勤周期
export interface AttendancePeriod {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// 考勤记录
export interface AttendanceRecord {
  id: number;
  employee_id: number;
  employee_name?: string;
  attendance_period_id: number;
  attendance_period?: AttendancePeriod;
  work_days: number;
  actual_work_days: number;
  overtime_hours: number;
  leave_days: number;
  absent_days: number;
  late_count: number;
  early_leave_count: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// 日考勤记录
export interface DailyAttendanceRecord {
  id: number;
  employee_id: number;
  employee_name?: string;
  attendance_date: string;
  check_in_time?: string;
  check_out_time?: string;
  work_hours: number;
  overtime_hours: number;
  is_late: boolean;
  is_early_leave: boolean;
  is_absent: boolean;
  leave_type?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// 考勤规则
export interface AttendanceRule {
  id: number;
  name: string;
  work_start_time: string;
  work_end_time: string;
  break_duration_minutes: number;
  late_threshold_minutes: number;
  early_leave_threshold_minutes: number;
  overtime_threshold_minutes: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// 创建考勤周期请求
export interface CreateAttendancePeriodRequest {
  name: string;
  start_date: string;
  end_date: string;
  is_active?: boolean;
}

// 更新考勤周期请求
export interface UpdateAttendancePeriodRequest {
  name?: string;
  start_date?: string;
  end_date?: string;
  is_active?: boolean;
}

// 创建考勤记录请求
export interface CreateAttendanceRecordRequest {
  employee_id: number;
  attendance_period_id: number;
  work_days: number;
  actual_work_days: number;
  overtime_hours?: number;
  leave_days?: number;
  absent_days?: number;
  late_count?: number;
  early_leave_count?: number;
  notes?: string;
}

// 更新考勤记录请求
export interface UpdateAttendanceRecordRequest {
  work_days?: number;
  actual_work_days?: number;
  overtime_hours?: number;
  leave_days?: number;
  absent_days?: number;
  late_count?: number;
  early_leave_count?: number;
  notes?: string;
}

// 创建日考勤记录请求
export interface CreateDailyAttendanceRecordRequest {
  employee_id: number;
  attendance_date: string;
  check_in_time?: string;
  check_out_time?: string;
  work_hours: number;
  overtime_hours?: number;
  is_late?: boolean;
  is_early_leave?: boolean;
  is_absent?: boolean;
  leave_type?: string;
  notes?: string;
}

// 更新日考勤记录请求
export interface UpdateDailyAttendanceRecordRequest {
  check_in_time?: string;
  check_out_time?: string;
  work_hours?: number;
  overtime_hours?: number;
  is_late?: boolean;
  is_early_leave?: boolean;
  is_absent?: boolean;
  leave_type?: string;
  notes?: string;
}

// 创建考勤规则请求
export interface CreateAttendanceRuleRequest {
  name: string;
  work_start_time: string;
  work_end_time: string;
  break_duration_minutes?: number;
  late_threshold_minutes?: number;
  early_leave_threshold_minutes?: number;
  overtime_threshold_minutes?: number;
  is_active?: boolean;
}

// 更新考勤规则请求
export interface UpdateAttendanceRuleRequest {
  name?: string;
  work_start_time?: string;
  work_end_time?: string;
  break_duration_minutes?: number;
  late_threshold_minutes?: number;
  early_leave_threshold_minutes?: number;
  overtime_threshold_minutes?: number;
  is_active?: boolean;
}

// 考勤统计
export interface AttendanceStatistics {
  total_employees: number;
  total_work_days: number;
  total_actual_work_days: number;
  total_overtime_hours: number;
  total_leave_days: number;
  total_absent_days: number;
  average_work_days: number;
  attendance_rate: number;
}

// API响应类型
export interface ApiResponse<T> {
  data: T;
  meta?: {
    total: number;
    page: number;
    page_size: number;
  };
}

// 考勤导入数据
export interface AttendanceImportData {
  employee_id: number;
  employee_name: string;
  attendance_date: string;
  check_in_time?: string;
  check_out_time?: string;
  work_hours: number;
  overtime_hours?: number;
  is_late?: boolean;
  is_early_leave?: boolean;
  is_absent?: boolean;
  leave_type?: string;
  notes?: string;
}

// 考勤批量导入请求
export interface BatchImportAttendanceRequest {
  attendance_period_id: number;
  records: AttendanceImportData[];
  overwrite_existing?: boolean;
} 