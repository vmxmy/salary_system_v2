"""
薪资周期相关的CRUD操作。
"""
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import text
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
    获取薪资周期列表 - 🚀 已优化：消除N+1查询问题
    
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
    
    # 🚀 性能优化：使用单一SQL查询批量获取所有期间的员工数量统计，避免N+1查询
    if periods:
        period_ids = [period.id for period in periods]
        
        # 构建批量统计查询
        employee_count_query = text("""
            SELECT 
                pr.payroll_period_id,
                COUNT(DISTINCT pe.employee_id) as employee_count
            FROM payroll.payroll_runs pr
            INNER JOIN payroll.payroll_entries pe ON pr.id = pe.payroll_run_id
            WHERE pr.payroll_period_id = ANY(:period_ids)
            GROUP BY pr.payroll_period_id
        """)
        
        # 执行批量查询
        result = db.execute(employee_count_query, {"period_ids": period_ids})
        employee_counts = {row.payroll_period_id: row.employee_count for row in result}
        
        # 为每个期间设置员工数量
        for period in periods:
            period.employee_count = employee_counts.get(period.id, 0)
    
    return periods, total


def get_payroll_period(db: Session, period_id: int) -> Optional[PayrollPeriod]:
    """
    根据ID获取单个薪资周期 - 🚀 已优化：单独查询的性能影响较小
    
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
    删除薪资周期（级联删除所有关联的工资运行和相关数据）
    
    Args:
        db: 数据库会话
        period_id: 薪资周期ID
        
    Returns:
        删除是否成功
        
    Raises:
        Exception: 当数据库操作失败时
    """
    db_payroll_period = get_payroll_period(db, period_id)
    if not db_payroll_period:
        return False
    
    try:
        # 获取该周期下的所有工资运行ID
        payroll_run_ids = [run.id for run in db.query(PayrollRun.id).filter(
            PayrollRun.payroll_period_id == period_id
        ).all()]
        
        if payroll_run_ids:
            # 按依赖关系顺序删除所有工资运行相关数据
            
            # 1. 删除审计异常记录
            from ...models.audit import PayrollAuditAnomaly
            db.query(PayrollAuditAnomaly).filter(
                PayrollAuditAnomaly.payroll_run_id.in_(payroll_run_ids)
            ).delete(synchronize_session=False)
            
            # 2. 删除审计历史记录
            from ...models.audit import PayrollAuditHistory
            db.query(PayrollAuditHistory).filter(
                PayrollAuditHistory.payroll_run_id.in_(payroll_run_ids)
            ).delete(synchronize_session=False)
            
            # 3. 删除计算审计日志
            from ...models.calculation_rules import CalculationAuditLog
            db.query(CalculationAuditLog).filter(
                CalculationAuditLog.payroll_run_id.in_(payroll_run_ids)
            ).delete(synchronize_session=False)
            
            # 4. 删除计算日志
            from ...models.calculation_rules import CalculationLog
            db.query(CalculationLog).filter(
                CalculationLog.payroll_run_id.in_(payroll_run_ids)
            ).delete(synchronize_session=False)
            
            # 5. 删除审计汇总记录
            from ...models.audit import PayrollRunAuditSummary
            db.query(PayrollRunAuditSummary).filter(
                PayrollRunAuditSummary.payroll_run_id.in_(payroll_run_ids)
            ).delete(synchronize_session=False)
            
            # 6. 删除薪资条目
            db.query(PayrollEntry).filter(
                PayrollEntry.payroll_run_id.in_(payroll_run_ids)
            ).delete(synchronize_session=False)
            
            # 7. 删除工资运行记录
            db.query(PayrollRun).filter(
                PayrollRun.payroll_period_id == period_id
            ).delete(synchronize_session=False)
        
        # 8. 删除直接关联到周期的月度薪资快照
        from ...models.audit import MonthlyPayrollSnapshot
        db.query(MonthlyPayrollSnapshot).filter(
            MonthlyPayrollSnapshot.period_id == period_id
        ).delete(synchronize_session=False)
        
        # 9. 最后删除薪资周期主记录
        db.delete(db_payroll_period)
        
        db.commit()
        return True 
        
    except Exception as e:
        db.rollback()
        # 记录错误日志
        print(f"Error deleting payroll period {period_id}: {str(e)}")
        raise 