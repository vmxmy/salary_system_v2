"""
工资相关的CRUD操作。
"""
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, and_
from typing import List, Optional, Tuple, Dict, Any
from datetime import date

from ..models.payroll import PayrollPeriod, PayrollRun, PayrollEntry
from ..pydantic_models.payroll import PayrollPeriodCreate, PayrollPeriodUpdate, PayrollRunCreate, PayrollRunUpdate, PayrollEntryCreate, PayrollEntryUpdate

# PayrollPeriod CRUD
def get_payroll_periods(
    db: Session,
    frequency_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
) -> Tuple[List[PayrollPeriod], int]:
    """
    获取工资周期列表。

    Args:
        db: 数据库会话
        frequency_id: 频率ID
        start_date: 开始日期
        end_date: 结束日期
        search: 搜索关键字
        skip: 跳过的记录数
        limit: 返回的记录数

    Returns:
        工资周期列表和总记录数
    """
    query = db.query(PayrollPeriod)

    # 应用过滤条件
    if frequency_id:
        query = query.filter(PayrollPeriod.frequency_lookup_value_id == frequency_id)

    if start_date:
        query = query.filter(PayrollPeriod.start_date >= start_date)

    if end_date:
        query = query.filter(PayrollPeriod.end_date <= end_date)

    # 应用搜索过滤
    if search:
        search_term = f"%{search}%"
        query = query.filter(PayrollPeriod.name.ilike(search_term))

    # 获取总记录数
    total = query.count()

    # 应用排序和分页
    query = query.order_by(PayrollPeriod.start_date.desc())
    query = query.offset(skip).limit(limit)

    return query.all(), total


def get_payroll_period(db: Session, period_id: int) -> Optional[PayrollPeriod]:
    """
    根据ID获取工资周期。

    Args:
        db: 数据库会话
        period_id: 工资周期ID

    Returns:
        工资周期对象，如果不存在则返回None
    """
    return db.query(PayrollPeriod).filter(PayrollPeriod.id == period_id).first()


def create_payroll_period(db: Session, payroll_period: PayrollPeriodCreate) -> PayrollPeriod:
    """
    创建工资周期。

    Args:
        db: 数据库会话
        payroll_period: 工资周期创建模型

    Returns:
        创建的工资周期对象
    """
    # 检查是否已存在相同日期范围和频率的工资周期
    existing = db.query(PayrollPeriod).filter(
        PayrollPeriod.start_date == payroll_period.start_date,
        PayrollPeriod.end_date == payroll_period.end_date,
        PayrollPeriod.frequency_lookup_value_id == payroll_period.frequency_lookup_value_id
    ).first()

    if existing:
        raise ValueError(f"Payroll period with the same date range and frequency already exists")

    # 创建新的工资周期
    db_payroll_period = PayrollPeriod(**payroll_period.model_dump())
    db.add(db_payroll_period)
    db.commit()
    db.refresh(db_payroll_period)
    return db_payroll_period


def update_payroll_period(db: Session, period_id: int, payroll_period: PayrollPeriodUpdate) -> Optional[PayrollPeriod]:
    """
    更新工资周期。

    Args:
        db: 数据库会话
        period_id: 工资周期ID
        payroll_period: 工资周期更新模型

    Returns:
        更新后的工资周期对象，如果不存在则返回None
    """
    # 获取要更新的工资周期
    db_payroll_period = get_payroll_period(db, period_id)
    if not db_payroll_period:
        return None

    # 如果日期范围或频率发生变化，检查是否与现有记录冲突
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

    # 更新工资周期
    update_data = payroll_period.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_payroll_period, key, value)

    db.commit()
    db.refresh(db_payroll_period)
    return db_payroll_period


def delete_payroll_period(db: Session, period_id: int) -> bool:
    """
    删除工资周期。

    Args:
        db: 数据库会话
        period_id: 工资周期ID

    Returns:
        是否成功删除
    """
    # 获取要删除的工资周期
    db_payroll_period = get_payroll_period(db, period_id)
    if not db_payroll_period:
        return False

    # 检查是否有关联的工资运行批次
    has_runs = db.query(PayrollRun).filter(PayrollRun.payroll_period_id == period_id).first() is not None
    if has_runs:
        raise ValueError(f"Cannot delete payroll period with associated payroll runs")

    # 删除工资周期
    db.delete(db_payroll_period)
    db.commit()
    return True


# PayrollRun CRUD
def get_payroll_runs(
    db: Session,
    period_id: Optional[int] = None,
    status_id: Optional[int] = None,
    initiated_by_user_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100
) -> Tuple[List[PayrollRun], int]:
    """
    获取工资运行批次列表。

    Args:
        db: 数据库会话
        period_id: 工资周期ID
        status_id: 状态ID
        initiated_by_user_id: 发起用户ID
        skip: 跳过的记录数
        limit: 返回的记录数

    Returns:
        工资运行批次列表和总记录数
    """
    query = db.query(PayrollRun)

    # 应用过滤条件
    if period_id:
        query = query.filter(PayrollRun.payroll_period_id == period_id)

    if status_id:
        query = query.filter(PayrollRun.status_lookup_value_id == status_id)

    if initiated_by_user_id:
        query = query.filter(PayrollRun.initiated_by_user_id == initiated_by_user_id)

    # 获取总记录数
    total = query.count()

    # 应用排序和分页
    query = query.order_by(PayrollRun.run_date.desc())
    query = query.offset(skip).limit(limit)

    return query.all(), total


# PayrollEntry CRUD
def get_payroll_entries(
    db: Session,
    employee_id: Optional[int] = None,
    period_id: Optional[int] = None,
    run_id: Optional[int] = None,
    status_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100
) -> Tuple[List[PayrollEntry], int]:
    """
    获取工资明细列表。

    Args:
        db: 数据库会话
        employee_id: 员工ID
        period_id: 工资周期ID
        run_id: 工资运行批次ID
        status_id: 状态ID
        skip: 跳过的记录数
        limit: 返回的记录数

    Returns:
        工资明细列表和总记录数
    """
    query = db.query(PayrollEntry)

    # 应用过滤条件
    if employee_id:
        query = query.filter(PayrollEntry.employee_id == employee_id)

    if period_id:
        query = query.filter(PayrollEntry.payroll_period_id == period_id)

    if run_id:
        query = query.filter(PayrollEntry.payroll_run_id == run_id)

    if status_id:
        query = query.filter(PayrollEntry.status_lookup_value_id == status_id)

    # 获取总记录数
    total = query.count()

    # 应用排序和分页
    query = query.order_by(PayrollEntry.calculated_at.desc())
    query = query.offset(skip).limit(limit)

    return query.all(), total


def get_payroll_entry(db: Session, entry_id: int) -> Optional[PayrollEntry]:
    """
    根据ID获取工资明细。

    Args:
        db: 数据库会话
        entry_id: 工资明细ID

    Returns:
        工资明细对象，如果不存在则返回None
    """
    return db.query(PayrollEntry).filter(PayrollEntry.id == entry_id).first()


def create_payroll_entry(db: Session, payroll_entry: PayrollEntryCreate) -> PayrollEntry:
    """
    创建工资明细。

    Args:
        db: 数据库会话
        payroll_entry: 工资明细创建模型

    Returns:
        创建的工资明细对象
    """
    # 检查是否已存在相同员工、周期和运行批次的工资明细
    existing = db.query(PayrollEntry).filter(
        PayrollEntry.employee_id == payroll_entry.employee_id,
        PayrollEntry.payroll_period_id == payroll_entry.payroll_period_id,
        PayrollEntry.payroll_run_id == payroll_entry.payroll_run_id
    ).first()

    if existing:
        raise ValueError(f"Payroll entry for the same employee, period and run already exists")

    # 创建新的工资明细
    db_payroll_entry = PayrollEntry(**payroll_entry.model_dump())
    db.add(db_payroll_entry)
    db.commit()
    db.refresh(db_payroll_entry)
    return db_payroll_entry


def update_payroll_entry(db: Session, entry_id: int, payroll_entry: PayrollEntryUpdate) -> Optional[PayrollEntry]:
    """
    更新工资明细。

    Args:
        db: 数据库会话
        entry_id: 工资明细ID
        payroll_entry: 工资明细更新模型

    Returns:
        更新后的工资明细对象，如果不存在则返回None
    """
    # 获取要更新的工资明细
    db_payroll_entry = get_payroll_entry(db, entry_id)
    if not db_payroll_entry:
        return None

    # 如果员工ID、周期ID或运行批次ID发生变化，检查是否与现有记录冲突
    if (payroll_entry.employee_id is not None or
        payroll_entry.payroll_period_id is not None or
        payroll_entry.payroll_run_id is not None):

        employee_id = payroll_entry.employee_id or db_payroll_entry.employee_id
        period_id = payroll_entry.payroll_period_id or db_payroll_entry.payroll_period_id
        run_id = payroll_entry.payroll_run_id or db_payroll_entry.payroll_run_id

        existing = db.query(PayrollEntry).filter(
            PayrollEntry.id != entry_id,
            PayrollEntry.employee_id == employee_id,
            PayrollEntry.payroll_period_id == period_id,
            PayrollEntry.payroll_run_id == run_id
        ).first()

        if existing:
            raise ValueError(f"Payroll entry for the same employee, period and run already exists")

    # 更新工资明细
    update_data = payroll_entry.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_payroll_entry, key, value)

    db.commit()
    db.refresh(db_payroll_entry)
    return db_payroll_entry


def delete_payroll_entry(db: Session, entry_id: int) -> bool:
    """
    删除工资明细。

    Args:
        db: 数据库会话
        entry_id: 工资明细ID

    Returns:
        是否成功删除
    """
    # 获取要删除的工资明细
    db_payroll_entry = get_payroll_entry(db, entry_id)
    if not db_payroll_entry:
        return False

    # 删除工资明细
    db.delete(db_payroll_entry)
    db.commit()
    return True
