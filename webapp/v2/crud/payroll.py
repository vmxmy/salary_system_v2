"""
工资相关的CRUD操作。
"""
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, and_
from typing import List, Optional, Tuple, Dict, Any
from datetime import date, datetime

from ..models.payroll import PayrollPeriod, PayrollRun, PayrollEntry
from ..pydantic_models.payroll import (
    PayrollPeriodCreate, PayrollPeriodUpdate,
    PayrollRunCreate, PayrollRunUpdate, PayrollRunPatch,
    PayrollEntryCreate, PayrollEntryUpdate, PayrollEntryPatch
)
# Assuming an Employee model might be needed for search later
# from ..models.hr import Employee 

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
    query = db.query(PayrollPeriod)
    if frequency_id:
        query = query.filter(PayrollPeriod.frequency_lookup_value_id == frequency_id)
    if start_date:
        query = query.filter(PayrollPeriod.start_date >= start_date)
    if end_date:
        query = query.filter(PayrollPeriod.end_date <= end_date)
    if search:
        search_term = f"%{search}%"
        query = query.filter(PayrollPeriod.name.ilike(search_term))
    total = query.count()
    query = query.order_by(PayrollPeriod.start_date.desc()).offset(skip).limit(limit)
    return query.all(), total

def get_payroll_period(db: Session, period_id: int) -> Optional[PayrollPeriod]:
    return db.query(PayrollPeriod).filter(PayrollPeriod.id == period_id).first()

def create_payroll_period(db: Session, payroll_period: PayrollPeriodCreate) -> PayrollPeriod:
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
    return db_payroll_period

def update_payroll_period(db: Session, period_id: int, payroll_period: PayrollPeriodUpdate) -> Optional[PayrollPeriod]:
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
    return db_payroll_period

def delete_payroll_period(db: Session, period_id: int) -> bool:
    db_payroll_period = get_payroll_period(db, period_id)
    if not db_payroll_period:
        return False
    has_runs = db.query(PayrollRun).filter(PayrollRun.payroll_period_id == period_id).first() is not None
    if has_runs:
        raise ValueError(f"Cannot delete payroll period with associated payroll runs")
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
    query = db.query(PayrollRun)
    if period_id:
        query = query.filter(PayrollRun.payroll_period_id == period_id)
    if status_id:
        query = query.filter(PayrollRun.status_lookup_value_id == status_id)
    if initiated_by_user_id:
        query = query.filter(PayrollRun.initiated_by_user_id == initiated_by_user_id)
    total = query.count()
    query = query.order_by(PayrollRun.run_date.desc()).offset(skip).limit(limit)
    return query.all(), total

def get_payroll_run(db: Session, run_id: int) -> Optional[PayrollRun]:
    return db.query(PayrollRun).filter(PayrollRun.id == run_id).first()

def create_payroll_run(db: Session, payroll_run: PayrollRunCreate) -> PayrollRun:
    db_payroll_run = PayrollRun(**payroll_run.model_dump())
    db.add(db_payroll_run)
    db.commit()
    db.refresh(db_payroll_run)
    return db_payroll_run

def update_payroll_run(db: Session, run_id: int, payroll_run: PayrollRunUpdate) -> Optional[PayrollRun]:
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
    db_payroll_run = get_payroll_run(db, run_id)
    if not db_payroll_run:
        return False
    # Consider if deletion should be blocked if entries exist
    # has_entries = db.query(PayrollEntry).filter(PayrollEntry.payroll_run_id == run_id).first() is not None
    # if has_entries:
    #     raise ValueError("Cannot delete payroll run with associated payroll entries")
    db.delete(db_payroll_run)
    db.commit()
    return True

# PayrollEntry CRUD
def get_payroll_entries(
    db: Session,
    employee_id: Optional[int] = None,
    period_id: Optional[int] = None,
    run_id: Optional[int] = None,
    status_id: Optional[int] = None,
    search: Optional[str] = None, # For employee name/code search
    skip: int = 0,
    limit: int = 100
) -> Tuple[List[PayrollEntry], int]:
    query = db.query(PayrollEntry)
    if employee_id:
        query = query.filter(PayrollEntry.employee_id == employee_id)
    if period_id:
        query = query.filter(PayrollEntry.payroll_period_id == period_id)
    if run_id:
        query = query.filter(PayrollEntry.payroll_run_id == run_id)
    if status_id:
        query = query.filter(PayrollEntry.status_lookup_value_id == status_id)
    
    # if search: # Requires Employee model and join
    #     from ..models.hr import Employee # Ensure this import path is correct
    #     search_term = f"%{search}%"
    #     query = query.join(Employee, PayrollEntry.employee_id == Employee.id)
    #     query = query.filter(
    #         or_(
    #             Employee.first_name.ilike(search_term),
    #             Employee.last_name.ilike(search_term),
    #             # Employee.employee_code.ilike(search_term) # If Employee model has employee_code
    #         )
    #     )
    
    total = query.count() # May need adjustment if search join is active
    query = query.order_by(PayrollEntry.id.desc()).offset(skip).limit(limit)
    return query.all(), total

def get_payroll_entry(db: Session, entry_id: int) -> Optional[PayrollEntry]:
    return db.query(PayrollEntry).filter(PayrollEntry.id == entry_id).first()

def create_payroll_entry(db: Session, payroll_entry: PayrollEntryCreate) -> PayrollEntry:
    db_payroll_entry = PayrollEntry(**payroll_entry.model_dump())
    # Ensure `calculated_at` and `updated_at` (if added to model with server_default) are handled by DB
    db.add(db_payroll_entry)
    db.commit()
    db.refresh(db_payroll_entry)
    return db_payroll_entry

def update_payroll_entry(db: Session, entry_id: int, payroll_entry: PayrollEntryUpdate) -> Optional[PayrollEntry]:
    db_payroll_entry = get_payroll_entry(db, entry_id)
    if not db_payroll_entry:
        return None
    update_data = payroll_entry.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_payroll_entry, key, value)
    
    # If PayrollEntry model has updated_at and it's not set by onupdate=func.now() or needs explicit app-level set
    if hasattr(db_payroll_entry, 'updated_at'):
         # If model's updated_at is onupdate=func.now(), this line might be redundant for some DBs after commit
         # but good for ensuring the object has the value before refresh if needed immediately.
        db_payroll_entry.updated_at = datetime.utcnow() 

    db.commit()
    db.refresh(db_payroll_entry)
    return db_payroll_entry

def patch_payroll_entry(db: Session, entry_id: int, entry_data: PayrollEntryPatch) -> Optional[PayrollEntry]:
    db_payroll_entry = db.query(PayrollEntry).filter(PayrollEntry.id == entry_id).first()
    if not db_payroll_entry:
        return None
    update_values = entry_data.model_dump(exclude_unset=True)
    changed_fields = False
    for key, value in update_values.items():
        if value is None and key not in entry_data.model_fields_set: # Allow explicit None if set by user in Pydantic model
            continue
        
        current_value = getattr(db_payroll_entry, key)
        if current_value == value: # Avoid unnecessary setattr if value hasn't changed
            continue
        changed_fields = True

        if key in ["earnings_details", "deductions_details"]:
            existing_json_data = current_value
            if not isinstance(existing_json_data, dict):
                existing_json_data = {} # Initialize if None or not a dict
            
            if isinstance(value, dict):
                updated_json_data = existing_json_data.copy()
                updated_json_data.update(value)
                setattr(db_payroll_entry, key, updated_json_data)
            elif value is None: # Allow setting JSONB field to null explicitly
                setattr(db_payroll_entry, key, None)
            # else: Log warning or skip for non-dict, non-None values for JSONB if strict typing is needed
        else:
            setattr(db_payroll_entry, key, value)
    
    if changed_fields and hasattr(db_payroll_entry, 'updated_at'):
        # If model's updated_at is onupdate=func.now(), this might be redundant for some DBs after commit.
        db_payroll_entry.updated_at = datetime.utcnow() 

    if changed_fields: # Only commit if there were actual changes
        try:
            db.commit()
            db.refresh(db_payroll_entry)
            # Audit logging: log_audit(f"PayrollEntry {entry_id} patched. Fields: {list(update_values.keys())}")
            return db_payroll_entry
        except Exception as e:
            db.rollback()
            raise
    return db_payroll_entry # Return the object even if no changes were made

def delete_payroll_entry(db: Session, entry_id: int) -> bool:
    db_payroll_entry = get_payroll_entry(db, entry_id)
    if not db_payroll_entry:
        return False
    db.delete(db_payroll_entry)
    db.commit()
    return True

def get_payroll_entries_for_bank_export(
    db: Session, 
    run_id: int
) -> List[Tuple[PayrollEntry, Optional[str], Optional[str], Optional[str], Optional[str]]]: 
    # Tuple: (PayrollEntry, employee_code, employee_name, bank_account_number, bank_name)
    """
    获取指定工资计算批次中所有符合条件的工资条目，用于银行代发文件生成。
    包含员工工号、姓名和银行账户信息（优先获取主账户）。

    Args:
        db: 数据库会话
        run_id: 工资计算批次ID

    Returns:
        一个元组列表: (PayrollEntry对象, 员工工号, 员工姓名, 银行账号, 开户行名称)
        银行信息字段可能为 None 如果员工无此信息或无主账户。
    """
    from ..models.hr import Employee, EmployeeBankAccount # Import new model

    # Subquery to get the primary bank account for each employee
    # If no primary, it could be extended to pick any, or be None
    primary_bank_account_sq = (
        db.query(
            EmployeeBankAccount.employee_id,
            EmployeeBankAccount.account_number.label("primary_account_number"),
            EmployeeBankAccount.bank_name.label("primary_bank_name")
        )
        .filter(EmployeeBankAccount.is_primary == True)
        .subquery('primary_bank_account_sq')
    )

    results = (
        db.query(
            PayrollEntry,
            Employee.employee_code, # Assuming Employee model has employee_code
            Employee.first_name,
            Employee.last_name,
            primary_bank_account_sq.c.primary_account_number,
            primary_bank_account_sq.c.primary_bank_name
        )
        .join(Employee, PayrollEntry.employee_id == Employee.id)
        .outerjoin(
            primary_bank_account_sq, 
            Employee.id == primary_bank_account_sq.c.employee_id
        )
        .filter(PayrollEntry.payroll_run_id == run_id)
        # TODO: Add filter for PayrollEntry.status_lookup_value_id to select only approved/payable entries
        # e.g., .filter(PayrollEntry.status_lookup_value_id == get_lookup_value_id_by_code(db, 'PAYROLL_ENTRY_STATUS', 'APPROVED_FOR_PAYMENT'))
        .order_by(Employee.employee_code) 
        .all()
    )

    formatted_results = []
    for entry, emp_code, first_name, last_name, acc_number, bank_name_val in results:
        full_name = f"{last_name or ''} {first_name or ''}".strip()
        formatted_results.append( (entry, emp_code, full_name, acc_number, bank_name_val) )
    
    return formatted_results
