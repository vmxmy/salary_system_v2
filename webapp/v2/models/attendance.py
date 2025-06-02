"""
考勤数据模型
"""

from sqlalchemy import Column, Integer, String, Numeric, Boolean, DateTime, Date, ForeignKey, Time
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import BaseV2 as Base


class AttendancePeriod(Base):
    """考勤周期"""
    __tablename__ = "attendance_periods"
    __table_args__ = {'schema': 'attendance'}
    
    id = Column(Integer, primary_key=True, index=True)
    
    # 周期信息
    period_name = Column(String(100), nullable=False, comment="周期名称")
    period_start = Column(Date, nullable=False, comment="周期开始日期")
    period_end = Column(Date, nullable=False, comment="周期结束日期")
    
    # 标准工作配置
    standard_work_days = Column(Integer, nullable=False, comment="标准工作天数")
    standard_work_hours_per_day = Column(Numeric(4, 2), default=8, comment="每日标准工作小时")
    
    # 状态
    status = Column(String(20), default='OPEN', comment="状态")  # OPEN, CLOSED, LOCKED
    is_active = Column(Boolean, default=True, comment="是否启用")
    
    # 审计字段
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by = Column(Integer, nullable=True)
    updated_by = Column(Integer, nullable=True)
    
    # 关系
    attendance_records = relationship("AttendanceRecord", back_populates="period")


class AttendanceRecord(Base):
    """员工考勤记录"""
    __tablename__ = "attendance_records"
    __table_args__ = {'schema': 'attendance'}
    
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey('hr.employees.id'), nullable=False, index=True)
    period_id = Column(Integer, ForeignKey('attendance.attendance_periods.id'), nullable=False, index=True)
    
    # 考勤统计
    work_days = Column(Integer, default=0, comment="实际工作天数")
    overtime_hours = Column(Numeric(6, 2), default=0, comment="加班小时数")
    leave_days = Column(Numeric(4, 2), default=0, comment="请假天数")
    late_times = Column(Integer, default=0, comment="迟到次数")
    early_leave_times = Column(Integer, default=0, comment="早退次数")
    absent_days = Column(Numeric(4, 2), default=0, comment="缺勤天数")
    
    # 请假详情
    annual_leave_days = Column(Numeric(4, 2), default=0, comment="年假天数")
    sick_leave_days = Column(Numeric(4, 2), default=0, comment="病假天数")
    personal_leave_days = Column(Numeric(4, 2), default=0, comment="事假天数")
    maternity_leave_days = Column(Numeric(4, 2), default=0, comment="产假天数")
    other_leave_days = Column(Numeric(4, 2), default=0, comment="其他假期天数")
    
    # 加班详情
    weekday_overtime_hours = Column(Numeric(6, 2), default=0, comment="工作日加班小时")
    weekend_overtime_hours = Column(Numeric(6, 2), default=0, comment="周末加班小时")
    holiday_overtime_hours = Column(Numeric(6, 2), default=0, comment="节假日加班小时")
    
    # 计算字段
    attendance_rate = Column(Numeric(5, 4), nullable=True, comment="出勤率")
    
    # 状态和备注
    status = Column(String(20), default='DRAFT', comment="状态")  # DRAFT, CONFIRMED, APPROVED
    remarks = Column(String(500), nullable=True, comment="备注")
    
    # 审计字段
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by = Column(Integer, nullable=True)
    updated_by = Column(Integer, nullable=True)
    
    # 关系
    employee = relationship("Employee")
    period = relationship("AttendancePeriod", back_populates="attendance_records")
    daily_records = relationship("DailyAttendanceRecord", back_populates="attendance_record")


class DailyAttendanceRecord(Base):
    """每日考勤记录"""
    __tablename__ = "daily_attendance_records"
    __table_args__ = {'schema': 'attendance'}
    
    id = Column(Integer, primary_key=True, index=True)
    attendance_record_id = Column(Integer, ForeignKey('attendance.attendance_records.id'), nullable=False, index=True)
    employee_id = Column(Integer, ForeignKey('hr.employees.id'), nullable=False, index=True)
    
    # 日期信息
    attendance_date = Column(Date, nullable=False, comment="考勤日期")
    day_type = Column(String(20), nullable=False, comment="日期类型")  # WORKDAY, WEEKEND, HOLIDAY
    
    # 上下班时间
    check_in_time = Column(Time, nullable=True, comment="上班打卡时间")
    check_out_time = Column(Time, nullable=True, comment="下班打卡时间")
    
    # 标准时间
    standard_check_in = Column(Time, nullable=True, comment="标准上班时间")
    standard_check_out = Column(Time, nullable=True, comment="标准下班时间")
    
    # 工作时长
    work_hours = Column(Numeric(4, 2), default=0, comment="工作小时数")
    overtime_hours = Column(Numeric(4, 2), default=0, comment="加班小时数")
    
    # 考勤状态
    attendance_status = Column(String(20), nullable=False, comment="考勤状态")  # NORMAL, LATE, EARLY_LEAVE, ABSENT, LEAVE
    leave_type = Column(String(20), nullable=True, comment="请假类型")
    
    # 异常情况
    is_late = Column(Boolean, default=False, comment="是否迟到")
    is_early_leave = Column(Boolean, default=False, comment="是否早退")
    late_minutes = Column(Integer, default=0, comment="迟到分钟数")
    early_leave_minutes = Column(Integer, default=0, comment="早退分钟数")
    
    # 备注
    remarks = Column(String(200), nullable=True, comment="备注")
    
    # 审计字段
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # 关系
    attendance_record = relationship("AttendanceRecord", back_populates="daily_records")
    employee = relationship("Employee")


class AttendanceRule(Base):
    """考勤规则配置"""
    __tablename__ = "attendance_rules"
    __table_args__ = {'schema': 'attendance'}
    
    id = Column(Integer, primary_key=True, index=True)
    
    # 规则信息
    rule_name = Column(String(100), nullable=False, comment="规则名称")
    rule_type = Column(String(50), nullable=False, comment="规则类型")  # WORK_TIME, OVERTIME, LEAVE, LATE_PENALTY
    
    # 工作时间配置
    standard_work_start = Column(Time, nullable=True, comment="标准上班时间")
    standard_work_end = Column(Time, nullable=True, comment="标准下班时间")
    lunch_break_start = Column(Time, nullable=True, comment="午休开始时间")
    lunch_break_end = Column(Time, nullable=True, comment="午休结束时间")
    
    # 弹性时间配置
    flexible_start_minutes = Column(Integer, default=0, comment="弹性上班分钟数")
    flexible_end_minutes = Column(Integer, default=0, comment="弹性下班分钟数")
    
    # 迟到早退配置
    late_tolerance_minutes = Column(Integer, default=0, comment="迟到容忍分钟数")
    early_leave_tolerance_minutes = Column(Integer, default=0, comment="早退容忍分钟数")
    
    # 加班配置
    overtime_start_minutes = Column(Integer, default=30, comment="加班开始分钟数")
    weekend_overtime_rate = Column(Numeric(4, 2), default=2.0, comment="周末加班倍率")
    holiday_overtime_rate = Column(Numeric(4, 2), default=3.0, comment="节假日加班倍率")
    
    # 状态
    is_active = Column(Boolean, default=True, comment="是否启用")
    effective_date = Column(Date, nullable=False, comment="生效日期")
    end_date = Column(Date, nullable=True, comment="结束日期")
    
    # 审计字段
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by = Column(Integer, nullable=True)
    updated_by = Column(Integer, nullable=True) 