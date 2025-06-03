"""
薪资周期相关的CRUD操作。
"""
from sqlalchemy.orm import Session, selectinload
from typing import List, Optional, Tuple
from datetime import date

from ...models.payroll import PayrollPeriod, PayrollRun, PayrollEntry
from ...pydantic_models.payroll import PayrollPeriodCreate, PayrollPeriodUpdate


def get_payroll_periods(
    db: Session,
    frequency_id: Optional[int] = None,
    status_lookup_value_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
) -> Tuple[List[PayrollPeriod], int]:
    """
    获取薪资周期列表
    
    Args:
        db: 数据库会话
        frequency_id: 频率ID筛选
        status_lookup_value_id: 状态筛选
        start_date: 开始日期筛选
        end_date: 结束日期筛选
        search: 搜索关键词
        skip: 跳过的记录数
        limit: 限制返回的记录数
        
    Returns:
        薪资周期列表和总数的元组
    """
    query = db.query(PayrollPeriod)
    if frequency_id:
        query = query.filter(PayrollPeriod.frequency_lookup_value_id == frequency_id)
    if status_lookup_value_id:
        query = query.filter(PayrollPeriod.status_lookup_value_id == status_lookup_value_id)
    if start_date:
        query = query.filter(PayrollPeriod.start_date >= start_date)
    if end_date:
        query = query.filter(PayrollPeriod.end_date <= end_date)
    if search:
        search_term = f"%{search}%"
        query = query.filter(PayrollPeriod.name.ilike(search_term))
    
    # 默认按开始日期倒序排序
    query = query.order_by(PayrollPeriod.start_date.desc())
    
    total = query.count()
    
    # 预加载关联的 status_lookup 和 frequency 数据
    query = query.options(
        selectinload(PayrollPeriod.status_lookup),
        selectinload(PayrollPeriod.frequency)
    ).offset(skip).limit(limit)
    
    periods = query.all()
    
    # 为每个期间计算不重复的员工数
    for period in periods:
        # 通过 payroll_runs 和 payroll_entries 计算该期间的不重复员工数
        employee_count = db.query(PayrollEntry.employee_id).join(
            PayrollRun, PayrollEntry.payroll_run_id == PayrollRun.id
        ).filter(
            PayrollRun.payroll_period_id == period.id
        ).distinct().count()
        
        # 动态添加 employee_count 属性
        period.employee_count = employee_count
    
    return periods, total


def get_payroll_period(db: Session, period_id: int) -> Optional[PayrollPeriod]:
    """
    根据ID获取单个薪资周期
    
    Args:
        db: 数据库会话
        period_id: 薪资周期ID
        
    Returns:
        薪资周期对象或None
    """
    period = db.query(PayrollPeriod).options(
        selectinload(PayrollPeriod.status_lookup),
        selectinload(PayrollPeriod.frequency)
    ).filter(PayrollPeriod.id == period_id).first()
    
    if period:
        # 计算该期间的不重复员工数
        employee_count = db.query(PayrollEntry.employee_id).join(
            PayrollRun, PayrollEntry.payroll_run_id == PayrollRun.id
        ).filter(
            PayrollRun.payroll_period_id == period.id
        ).distinct().count()
        
        # 动态添加 employee_count 属性
        period.employee_count = employee_count
    
    return period


def create_payroll_period(db: Session, payroll_period: PayrollPeriodCreate) -> PayrollPeriod:
    """
    创建新的薪资周期
    
    Args:
        db: 数据库会话
        payroll_period: 薪资周期创建数据
        
    Returns:
        创建的薪资周期对象
        
    Raises:
        ValueError: 当相同日期范围和频率的薪资周期已存在时
    """
    existing = db.query(PayrollPeriod).filter(
        PayrollPeriod.start_date == payroll_period.start_date,
        PayrollPeriod.end_date == payroll_period.end_date,
        PayrollPeriod.frequency_lookup_value_id == payroll_period.frequency_lookup_value_id
    ).first()
    if existing:
        raise ValueError(f"Payroll period with the same date range and frequency already exists")
    db_payroll_period = PayrollPeriod(**payroll_period.model_dump())
    db.add(db_payroll_period)
    db.commit()
    db.refresh(db_payroll_period)
    
    # 重新查询以获取关联数据
    return get_payroll_period(db, db_payroll_period.id)


def update_payroll_period(db: Session, period_id: int, payroll_period: PayrollPeriodUpdate) -> Optional[PayrollPeriod]:
    """
    更新薪资周期
    
    Args:
        db: 数据库会话
        period_id: 薪资周期ID
        payroll_period: 薪资周期更新数据
        
    Returns:
        更新后的薪资周期对象或None
        
    Raises:
        ValueError: 当更新后的数据与其他薪资周期冲突时
    """
    db_payroll_period = get_payroll_period(db, period_id)
    if not db_payroll_period:
        return None
    if (payroll_period.start_date is not None or
        payroll_period.end_date is not None or
        payroll_period.frequency_lookup_value_id is not None):
        start_date = payroll_period.start_date or db_payroll_period.start_date
        end_date = payroll_period.end_date or db_payroll_period.end_date
        frequency_id = payroll_period.frequency_lookup_value_id or db_payroll_period.frequency_lookup_value_id
        existing = db.query(PayrollPeriod).filter(
            PayrollPeriod.id != period_id,
            PayrollPeriod.start_date == start_date,
            PayrollPeriod.end_date == end_date,
            PayrollPeriod.frequency_lookup_value_id == frequency_id
        ).first()
        if existing:
            raise ValueError(f"Payroll period with the same date range and frequency already exists")
    update_data = payroll_period.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_payroll_period, key, value)
    db.commit()
    db.refresh(db_payroll_period)
    
    # 重新查询以获取关联数据
    return get_payroll_period(db, period_id)


def delete_payroll_period(db: Session, period_id: int) -> bool:
    """
    删除薪资周期
    
    Args:
        db: 数据库会话
        period_id: 薪资周期ID
        
    Returns:
        删除是否成功
        
    Raises:
        ValueError: 当薪资周期有关联的薪资审核时
    """
    db_payroll_period = get_payroll_period(db, period_id)
    if not db_payroll_period:
        return False
    has_runs = db.query(PayrollRun).filter(PayrollRun.payroll_period_id == period_id).first() is not None
    if has_runs:
        raise ValueError(f"Cannot delete payroll period with associated payroll runs")
    db.delete(db_payroll_period)
    db.commit()
    return True 