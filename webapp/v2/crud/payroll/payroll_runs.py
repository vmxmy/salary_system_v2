"""
薪资审核相关的CRUD操作。
"""
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import func
from typing import List, Optional, Tuple
from decimal import Decimal

from ...models.payroll import PayrollRun, PayrollEntry
from ...pydantic_models.payroll import PayrollRunCreate, PayrollRunUpdate, PayrollRunPatch


def get_payroll_runs(
    db: Session,
    period_id: Optional[int] = None,
    status_id: Optional[int] = None,
    initiated_by_user_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100
) -> Tuple[List[PayrollRun], int]:
    """
    获取薪资审核列表
    
    Args:
        db: 数据库会话
        period_id: 薪资周期ID筛选
        status_id: 状态ID筛选
        initiated_by_user_id: 发起用户ID筛选
        skip: 跳过的记录数
        limit: 限制返回的记录数
        
    Returns:
        薪资审核列表和总数的元组
    """
    query = db.query(PayrollRun)
    if period_id:
        query = query.filter(PayrollRun.payroll_period_id == period_id)
    if status_id:
        query = query.filter(PayrollRun.status_lookup_value_id == status_id)
    if initiated_by_user_id:
        query = query.filter(PayrollRun.initiated_by_user_id == initiated_by_user_id)
    total = query.count()
    
    # 加载关联的 payroll_period 和 status 数据
    query = query.options(
        selectinload(PayrollRun.payroll_period),
        selectinload(PayrollRun.status)
    ).order_by(PayrollRun.run_date.desc()).offset(skip).limit(limit)
    
    runs = query.all()
    
    # 计算每个 run 的员工数量和薪资总额
    for run in runs:
        # 计算该 run 下的员工数量
        employee_count = db.query(PayrollEntry.employee_id).filter(
            PayrollEntry.payroll_run_id == run.id
        ).distinct().count()
        
        # 计算该 run 下的薪资总额
        total_net_pay = db.query(func.sum(PayrollEntry.net_pay)).filter(
            PayrollEntry.payroll_run_id == run.id
        ).scalar() or Decimal(0)
        
        # 动态添加 total_employees 和 total_net_pay 属性
        run.total_employees = employee_count
        run.total_net_pay = total_net_pay
    
    return runs, total


def get_payroll_run(db: Session, run_id: int, include_employee_details: bool = False) -> Optional[PayrollRun]:
    """
    根据ID获取单个薪资审核
    
    Args:
        db: 数据库会话
        run_id: 薪资审核ID
        include_employee_details: 是否包含员工详细信息
        
    Returns:
        薪资审核对象或None
    """
    print(f"CRUD: Entered get_payroll_run with run_id={run_id}, include_employee_details={include_employee_details}")
    # 构建基础查询
    query = db.query(PayrollRun).options(
        selectinload(PayrollRun.payroll_period),
        selectinload(PayrollRun.status)
    )
    
    # 如果需要包含员工详细信息，加载entries和employee
    if include_employee_details:
        query = query.options(
            selectinload(PayrollRun.payroll_entries).selectinload(PayrollEntry.employee)
        )
    
    run = query.filter(PayrollRun.id == run_id).first()
    
    print(f"CRUD: Fetched run: {run}")

    if run:
        # 计算该 run 下的员工数量
        employee_count = db.query(PayrollEntry.employee_id).filter(
            PayrollEntry.payroll_run_id == run.id
        ).distinct().count()
        print(f"CRUD: Calculated employee_count: {employee_count}")
        
        # 计算该 run 下的薪资总额
        total_net_pay = db.query(func.sum(PayrollEntry.net_pay)).filter(
            PayrollEntry.payroll_run_id == run.id
        ).scalar() or Decimal(0)
        print(f"CRUD: Calculated total_net_pay: {total_net_pay}")
        
        # 动态添加 total_employees 和 total_net_pay 属性
        run.total_employees = employee_count
        run.total_net_pay = total_net_pay
    
    print(f"CRUD: Returning run: {run}")
    return run


def create_payroll_run(db: Session, payroll_run: PayrollRunCreate, initiated_by_user_id: Optional[int] = None) -> PayrollRun:
    """
    创建新的薪资审核
    
    Args:
        db: 数据库会话
        payroll_run: 薪资审核创建数据
        initiated_by_user_id: 发起用户ID
        
    Returns:
        创建的薪资审核对象
    """
    run_data = payroll_run.model_dump()
    if initiated_by_user_id:
        run_data['initiated_by_user_id'] = initiated_by_user_id
    
    db_payroll_run = PayrollRun(**run_data)
    db.add(db_payroll_run)
    db.commit()
    db.refresh(db_payroll_run)
    
    # 加载关联数据并返回
    return get_payroll_run(db, db_payroll_run.id)


def update_payroll_run(db: Session, run_id: int, payroll_run: PayrollRunUpdate) -> Optional[PayrollRun]:
    """
    更新薪资审核
    
    Args:
        db: 数据库会话
        run_id: 薪资审核ID
        payroll_run: 薪资审核更新数据
        
    Returns:
        更新后的薪资审核对象或None
    """
    db_payroll_run = get_payroll_run(db, run_id)
    if not db_payroll_run:
        return None
    update_data = payroll_run.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_payroll_run, key, value)
    db.commit()
    db.refresh(db_payroll_run)
    return db_payroll_run


def patch_payroll_run(db: Session, run_id: int, run_data: PayrollRunPatch) -> Optional[PayrollRun]:
    """
    部分更新薪资审核
    
    Args:
        db: 数据库会话
        run_id: 薪资审核ID
        run_data: 薪资审核部分更新数据
        
    Returns:
        更新后的薪资审核对象或None
        
    Raises:
        Exception: 当数据库操作失败时
    """
    db_payroll_run = db.query(PayrollRun).filter(PayrollRun.id == run_id).first()
    if not db_payroll_run:
        return None
    update_values = run_data.model_dump(exclude_unset=True)
    for key, value in update_values.items():
        if value is None and key not in run_data.model_fields_set: # Allow explicit None if set by user
            continue
        setattr(db_payroll_run, key, value)
    try:
        db.commit()
        db.refresh(db_payroll_run)
        # Audit logging: log_audit(f"PayrollRun {run_id} patched. Fields: {list(update_values.keys())}")
        return db_payroll_run
    except Exception as e:
        db.rollback()
        raise


def delete_payroll_run(db: Session, run_id: int) -> bool:
    """
    删除薪资审核（级联删除关联的薪资条目和计算日志）
    
    Args:
        db: 数据库会话
        run_id: 薪资审核ID
        
    Returns:
        删除是否成功
    """
    db_payroll_run = get_payroll_run(db, run_id)
    if not db_payroll_run:
        return False
    
    # Delete associated payroll entries first
    db.query(PayrollEntry).filter(PayrollEntry.payroll_run_id == run_id).delete(synchronize_session=False)
    
    # Delete associated calculation logs
    from ...models.calculation_rules import CalculationLog # Ensure import is here if not global
    db.query(CalculationLog).filter(CalculationLog.payroll_run_id == run_id).delete(synchronize_session=False)
    
    db.delete(db_payroll_run)
    db.commit()
    return True 