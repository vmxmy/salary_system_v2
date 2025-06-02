"""
考勤管理路由器
提供考勤周期、记录、日考勤和规则的API端点
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, datetime

from webapp.database import get_db
from webapp.auth import get_current_user
from webapp.v2.models.attendance import (
    AttendancePeriod, AttendanceRecord, DailyAttendanceRecord, AttendanceRule
)
from webapp.v2.pydantic_models.attendance import (
    AttendancePeriodResponse, AttendancePeriodCreate, AttendancePeriodUpdate,
    AttendanceRecordResponse, AttendanceRecordCreate, AttendanceRecordUpdate,
    DailyAttendanceRecordResponse, DailyAttendanceRecordCreate, DailyAttendanceRecordUpdate,
    AttendanceRuleResponse, AttendanceRuleCreate, AttendanceRuleUpdate,
    AttendanceStatistics
)

router = APIRouter()

# 考勤周期管理
@router.get("/periods", response_model=List[AttendancePeriodResponse])
async def get_attendance_periods(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """获取考勤周期列表"""
    query = db.query(AttendancePeriod)
    
    if is_active is not None:
        query = query.filter(AttendancePeriod.is_active == is_active)
    
    periods = query.offset(skip).limit(limit).all()
    return [AttendancePeriodResponse.from_db_model(period) for period in periods]

@router.post("/periods", response_model=AttendancePeriodResponse)
async def create_attendance_period(
    period_data: AttendancePeriodCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """创建考勤周期"""
    # 映射字段名：Pydantic模型 -> 数据库模型
    period_dict = period_data.dict()
    db_data = {
        "period_name": period_dict["name"],
        "period_start": period_dict["start_date"],
        "period_end": period_dict["end_date"],
        "is_active": period_dict.get("is_active", True),
        "standard_work_days": 22,  # 默认标准工作天数
        "standard_work_hours_per_day": 8  # 默认每日工作小时
        # 注意：description字段在数据库模型中不存在，所以不包含
    }
    
    period = AttendancePeriod(**db_data)
    db.add(period)
    db.commit()
    db.refresh(period)
    return AttendancePeriodResponse.from_db_model(period)

@router.put("/periods/{period_id}", response_model=AttendancePeriodResponse)
async def update_attendance_period(
    period_id: int,
    period_data: AttendancePeriodUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """更新考勤周期"""
    period = db.query(AttendancePeriod).filter(AttendancePeriod.id == period_id).first()
    if not period:
        raise HTTPException(status_code=404, detail="考勤周期不存在")
    
    for field, value in period_data.dict(exclude_unset=True).items():
        setattr(period, field, value)
    
    db.commit()
    db.refresh(period)
    return period

@router.delete("/periods/{period_id}")
async def delete_attendance_period(
    period_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """删除考勤周期"""
    period = db.query(AttendancePeriod).filter(AttendancePeriod.id == period_id).first()
    if not period:
        raise HTTPException(status_code=404, detail="考勤周期不存在")
    
    db.delete(period)
    db.commit()
    return {"message": "考勤周期删除成功"}

# 考勤记录管理
@router.get("/records", response_model=List[AttendanceRecordResponse])
async def get_attendance_records(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    period_id: Optional[int] = None,
    employee_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """获取考勤记录列表"""
    query = db.query(AttendanceRecord)
    
    if period_id:
        query = query.filter(AttendanceRecord.period_id == period_id)
    if employee_id:
        query = query.filter(AttendanceRecord.employee_id == employee_id)
    
    records = query.offset(skip).limit(limit).all()
    return records

@router.post("/records", response_model=AttendanceRecordResponse)
async def create_attendance_record(
    record_data: AttendanceRecordCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """创建考勤记录"""
    record = AttendanceRecord(**record_data.dict())
    db.add(record)
    db.commit()
    db.refresh(record)
    return record

@router.put("/records/{record_id}", response_model=AttendanceRecordResponse)
async def update_attendance_record(
    record_id: int,
    record_data: AttendanceRecordUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """更新考勤记录"""
    record = db.query(AttendanceRecord).filter(AttendanceRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="考勤记录不存在")
    
    for field, value in record_data.dict(exclude_unset=True).items():
        setattr(record, field, value)
    
    db.commit()
    db.refresh(record)
    return record

@router.delete("/records/{record_id}")
async def delete_attendance_record(
    record_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """删除考勤记录"""
    record = db.query(AttendanceRecord).filter(AttendanceRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="考勤记录不存在")
    
    db.delete(record)
    db.commit()
    return {"message": "考勤记录删除成功"}

# 日考勤记录管理
@router.get("/daily-records", response_model=List[DailyAttendanceRecordResponse])
async def get_daily_attendance_records(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    record_id: Optional[int] = None,
    attendance_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """获取日考勤记录列表"""
    query = db.query(DailyAttendanceRecord)
    
    if record_id:
        query = query.filter(DailyAttendanceRecord.attendance_record_id == record_id)
    if attendance_date:
        query = query.filter(DailyAttendanceRecord.attendance_date == attendance_date)
    
    daily_records = query.offset(skip).limit(limit).all()
    return daily_records

@router.post("/daily-records", response_model=DailyAttendanceRecordResponse)
async def create_daily_attendance_record(
    daily_record_data: DailyAttendanceRecordCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """创建日考勤记录"""
    daily_record = DailyAttendanceRecord(**daily_record_data.dict())
    db.add(daily_record)
    db.commit()
    db.refresh(daily_record)
    return daily_record

@router.put("/daily-records/{daily_record_id}", response_model=DailyAttendanceRecordResponse)
async def update_daily_attendance_record(
    daily_record_id: int,
    daily_record_data: DailyAttendanceRecordUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """更新日考勤记录"""
    daily_record = db.query(DailyAttendanceRecord).filter(
        DailyAttendanceRecord.id == daily_record_id
    ).first()
    if not daily_record:
        raise HTTPException(status_code=404, detail="日考勤记录不存在")
    
    for field, value in daily_record_data.dict(exclude_unset=True).items():
        setattr(daily_record, field, value)
    
    db.commit()
    db.refresh(daily_record)
    return daily_record

@router.delete("/daily-records/{daily_record_id}")
async def delete_daily_attendance_record(
    daily_record_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """删除日考勤记录"""
    daily_record = db.query(DailyAttendanceRecord).filter(
        DailyAttendanceRecord.id == daily_record_id
    ).first()
    if not daily_record:
        raise HTTPException(status_code=404, detail="日考勤记录不存在")
    
    db.delete(daily_record)
    db.commit()
    return {"message": "日考勤记录删除成功"}

# 考勤规则管理
@router.get("/rules", response_model=List[AttendanceRuleResponse])
async def get_attendance_rules(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """获取考勤规则列表"""
    query = db.query(AttendanceRule)
    
    if is_active is not None:
        query = query.filter(AttendanceRule.is_active == is_active)
    
    rules = query.offset(skip).limit(limit).all()
    return rules

@router.post("/rules", response_model=AttendanceRuleResponse)
async def create_attendance_rule(
    rule_data: AttendanceRuleCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """创建考勤规则"""
    rule = AttendanceRule(**rule_data.dict())
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule

@router.put("/rules/{rule_id}", response_model=AttendanceRuleResponse)
async def update_attendance_rule(
    rule_id: int,
    rule_data: AttendanceRuleUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """更新考勤规则"""
    rule = db.query(AttendanceRule).filter(AttendanceRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="考勤规则不存在")
    
    for field, value in rule_data.dict(exclude_unset=True).items():
        setattr(rule, field, value)
    
    db.commit()
    db.refresh(rule)
    return rule

@router.delete("/rules/{rule_id}")
async def delete_attendance_rule(
    rule_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """删除考勤规则"""
    rule = db.query(AttendanceRule).filter(AttendanceRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="考勤规则不存在")
    
    db.delete(rule)
    db.commit()
    return {"message": "考勤规则删除成功"} 