"""
考勤管理 Pydantic 模型
定义考勤周期、记录、日考勤和规则的请求响应数据结构
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import date, datetime, time
from decimal import Decimal

# 考勤周期模型
class AttendancePeriodBase(BaseModel):
    name: str = Field(..., description="考勤周期名称")
    start_date: date = Field(..., description="开始日期")
    end_date: date = Field(..., description="结束日期")
    description: Optional[str] = Field(None, description="描述")
    is_active: bool = Field(True, description="是否激活")

class AttendancePeriodCreate(AttendancePeriodBase):
    pass

class AttendancePeriodUpdate(BaseModel):
    name: Optional[str] = Field(None, description="考勤周期名称")
    start_date: Optional[date] = Field(None, description="开始日期")
    end_date: Optional[date] = Field(None, description="结束日期")
    description: Optional[str] = Field(None, description="描述")
    is_active: Optional[bool] = Field(None, description="是否激活")

class AttendancePeriodResponse(BaseModel):
    id: int
    name: str = Field(..., description="考勤周期名称")
    start_date: date = Field(..., description="开始日期")
    end_date: date = Field(..., description="结束日期")
    description: Optional[str] = Field(None, description="描述")
    is_active: bool = Field(True, description="是否激活")
    created_at: datetime
    updated_at: Optional[datetime] = None

    @classmethod
    def from_db_model(cls, db_model):
        """从数据库模型转换为响应模型"""
        return cls(
            id=db_model.id,
            name=db_model.period_name,
            start_date=db_model.period_start,
            end_date=db_model.period_end,
            description=None,  # 数据库模型中没有description字段
            is_active=db_model.is_active,
            created_at=db_model.created_at,
            updated_at=db_model.updated_at
        )

    class Config:
        from_attributes = True

# 考勤记录模型
class AttendanceRecordBase(BaseModel):
    employee_id: int = Field(..., description="员工ID")
    period_id: int = Field(..., description="考勤周期ID")
    work_days: int = Field(0, description="实际工作天数")
    overtime_hours: Decimal = Field(Decimal('0'), description="加班小时数")
    leave_days: Decimal = Field(Decimal('0'), description="请假天数")
    late_times: int = Field(0, description="迟到次数")
    early_leave_times: int = Field(0, description="早退次数")
    absent_days: Decimal = Field(Decimal('0'), description="缺勤天数")
    annual_leave_days: Decimal = Field(Decimal('0'), description="年假天数")
    sick_leave_days: Decimal = Field(Decimal('0'), description="病假天数")
    personal_leave_days: Decimal = Field(Decimal('0'), description="事假天数")

class AttendanceRecordCreate(AttendanceRecordBase):
    pass

class AttendanceRecordUpdate(BaseModel):
    employee_id: Optional[int] = Field(None, description="员工ID")
    period_id: Optional[int] = Field(None, description="考勤周期ID")
    work_days: Optional[int] = Field(None, description="实际工作天数")
    overtime_hours: Optional[Decimal] = Field(None, description="加班小时数")
    leave_days: Optional[Decimal] = Field(None, description="请假天数")
    late_times: Optional[int] = Field(None, description="迟到次数")
    early_leave_times: Optional[int] = Field(None, description="早退次数")
    absent_days: Optional[Decimal] = Field(None, description="缺勤天数")
    annual_leave_days: Optional[Decimal] = Field(None, description="年假天数")
    sick_leave_days: Optional[Decimal] = Field(None, description="病假天数")
    personal_leave_days: Optional[Decimal] = Field(None, description="事假天数")

class AttendanceRecordResponse(AttendanceRecordBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# 日考勤记录模型
class DailyAttendanceRecordBase(BaseModel):
    attendance_record_id: int = Field(..., description="考勤记录ID")
    attendance_date: date = Field(..., description="考勤日期")
    check_in_time: Optional[time] = Field(None, description="签到时间")
    check_out_time: Optional[time] = Field(None, description="签退时间")
    work_hours: Decimal = Field(Decimal('0'), description="工作小时数")
    overtime_hours: Decimal = Field(Decimal('0'), description="加班小时数")
    late_minutes: int = Field(0, description="迟到分钟数")
    early_leave_minutes: int = Field(0, description="早退分钟数")
    is_absent: bool = Field(False, description="是否缺勤")
    leave_type: Optional[str] = Field(None, description="请假类型")
    remarks: Optional[str] = Field(None, description="备注")

class DailyAttendanceRecordCreate(DailyAttendanceRecordBase):
    pass

class DailyAttendanceRecordUpdate(BaseModel):
    attendance_record_id: Optional[int] = Field(None, description="考勤记录ID")
    attendance_date: Optional[date] = Field(None, description="考勤日期")
    check_in_time: Optional[time] = Field(None, description="签到时间")
    check_out_time: Optional[time] = Field(None, description="签退时间")
    work_hours: Optional[Decimal] = Field(None, description="工作小时数")
    overtime_hours: Optional[Decimal] = Field(None, description="加班小时数")
    late_minutes: Optional[int] = Field(None, description="迟到分钟数")
    early_leave_minutes: Optional[int] = Field(None, description="早退分钟数")
    is_absent: Optional[bool] = Field(None, description="是否缺勤")
    leave_type: Optional[str] = Field(None, description="请假类型")
    remarks: Optional[str] = Field(None, description="备注")

class DailyAttendanceRecordResponse(DailyAttendanceRecordBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# 考勤规则模型
class AttendanceRuleBase(BaseModel):
    name: str = Field(..., description="规则名称")
    description: Optional[str] = Field(None, description="规则描述")
    work_start_time: time = Field(..., description="上班时间")
    work_end_time: time = Field(..., description="下班时间")
    break_duration_minutes: int = Field(60, description="休息时间(分钟)")
    late_threshold_minutes: int = Field(15, description="迟到阈值(分钟)")
    early_leave_threshold_minutes: int = Field(15, description="早退阈值(分钟)")
    overtime_threshold_minutes: int = Field(30, description="加班阈值(分钟)")
    is_active: bool = Field(True, description="是否激活")

class AttendanceRuleCreate(AttendanceRuleBase):
    pass

class AttendanceRuleUpdate(BaseModel):
    name: Optional[str] = Field(None, description="规则名称")
    description: Optional[str] = Field(None, description="规则描述")
    work_start_time: Optional[time] = Field(None, description="上班时间")
    work_end_time: Optional[time] = Field(None, description="下班时间")
    break_duration_minutes: Optional[int] = Field(None, description="休息时间(分钟)")
    late_threshold_minutes: Optional[int] = Field(None, description="迟到阈值(分钟)")
    early_leave_threshold_minutes: Optional[int] = Field(None, description="早退阈值(分钟)")
    overtime_threshold_minutes: Optional[int] = Field(None, description="加班阈值(分钟)")
    is_active: Optional[bool] = Field(None, description="是否激活")

class AttendanceRuleResponse(AttendanceRuleBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# 考勤统计模型
class AttendanceStatistics(BaseModel):
    total_employees: int = Field(..., description="总员工数")
    present_employees: int = Field(..., description="出勤员工数")
    absent_employees: int = Field(..., description="缺勤员工数")
    late_employees: int = Field(..., description="迟到员工数")
    overtime_employees: int = Field(..., description="加班员工数")
    total_work_hours: Decimal = Field(..., description="总工作小时数")
    total_overtime_hours: Decimal = Field(..., description="总加班小时数")

    class Config:
        from_attributes = True 