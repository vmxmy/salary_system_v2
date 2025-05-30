"""
员工更新相关的CRUD操作。
"""
from sqlalchemy.orm import Session
from typing import Optional
import logging
from datetime import date

from ...models.hr import (
    Employee, EmployeeJobHistory, EmployeeAppraisal, 
    EmployeeBankAccount
)
from ...pydantic_models.hr import EmployeeUpdate
from .employee import get_employee, get_employee_by_code, get_employee_by_id_number

logger = logging.getLogger(__name__)


def update_employee(db: Session, employee_id: int, employee: EmployeeUpdate) -> Optional[Employee]:
    """
    更新员工。

    Args:
        db: 数据库会话
        employee_id: 员工ID
        employee: 员工更新模型

    Returns:
        更新后的员工对象，如果不存在则返回None
    """
    # 获取要更新的员工
    db_employee = get_employee(db, employee_id)
    if not db_employee:
        return None

    logger.info(f"--- CRUD LOG: update_employee (employee_update.py) ---")
    logger.info(f"Updating employee_id: {employee_id}")
    logger.info(f"Data from Pydantic model (EmployeeUpdate): {employee.model_dump_json(indent=2)}")

    # 如果员工代码发生变化，检查新代码是否已存在
    if employee.employee_code is not None and employee.employee_code != db_employee.employee_code:
        existing = get_employee_by_code(db, employee.employee_code)
        if existing:
            raise ValueError(f"Employee with code '{employee.employee_code}' already exists")

    # 如果身份证号发生变化，检查新身份证号是否已存在
    if employee.id_number is not None and employee.id_number != db_employee.id_number:
        existing = get_employee_by_id_number(db, employee.id_number)
        if existing:
            raise ValueError(f"Employee with ID number '{employee.id_number}' already exists")

    # 保存银行信息以便稍后处理
    bank_name = employee.bank_name
    bank_account_number = employee.bank_account_number

    # 检查职位变更情况，记录职位变更前的值
    position_changed = (
        employee.actual_position_id is not None and 
        employee.actual_position_id != db_employee.actual_position_id
    )
    old_position_id = db_employee.actual_position_id

    # 更新员工的直接字段，排除不属于Employee模型的字段
    fields_to_exclude = {
        "appraisals", 
        "bank_name",
        "bank_account_number"
    }
    update_data = employee.model_dump(exclude_unset=True, exclude=fields_to_exclude)
    
    for key, value in update_data.items():
        if hasattr(db_employee, key):
            setattr(db_employee, key, value)
        else:
            logger.warning(f"Attempted to set non-existent attribute '{key}' on Employee model during update.")

    # 处理银行账户信息更新
    _update_bank_account(db, db_employee, bank_name, bank_account_number, employee_id)
    
    # 如果职位发生变更，自动创建一条工作历史记录
    if position_changed:
        _handle_position_change(db, db_employee, employee, old_position_id, employee_id)
    
    # 处理年度考核 appraisals 的更新
    _update_appraisals(db, employee, employee_id)
    
    try:
        db.commit()
        db.refresh(db_employee)
    except Exception as e:
        db.rollback()
        logger.error(f"Error committing employee update for ID {employee_id}: {e}")
        raise
        
    # Re-query to load all relationships for the response
    return get_employee(db, employee_id)


def _update_bank_account(
    db: Session, 
    db_employee: Employee, 
    bank_name: Optional[str], 
    bank_account_number: Optional[str], 
    employee_id: int
) -> None:
    """更新员工银行账户信息"""
    if bank_name is not None and bank_account_number is not None:
        # 查找员工的主要银行账户
        primary_account = None
        for account in db_employee.bank_accounts:
            if account.is_primary:
                primary_account = account
                break
        
        if not primary_account and db_employee.bank_accounts:
            # 如果没有主要账户但有其他账户，使用第一个
            primary_account = db_employee.bank_accounts[0]
        
        if primary_account:
            # 更新现有账户
            primary_account.bank_name = bank_name
            primary_account.account_number = bank_account_number
            primary_account.account_holder_name = f"{db_employee.last_name} {db_employee.first_name}".strip()
            primary_account.is_primary = True
            logger.info(f"Updated bank account for employee {employee_id}: {bank_name}, {bank_account_number}")
        else:
            # 创建新账户
            new_account = EmployeeBankAccount(
                employee_id=employee_id,
                bank_name=bank_name,
                account_number=bank_account_number,
                account_holder_name=f"{db_employee.last_name} {db_employee.first_name}".strip(),
                is_primary=True
            )
            db.add(new_account)
            logger.info(f"Created new bank account for employee {employee_id}: {bank_name}, {bank_account_number}")


def _handle_position_change(
    db: Session, 
    db_employee: Employee, 
    employee: EmployeeUpdate, 
    old_position_id: Optional[int], 
    employee_id: int
) -> None:
    """处理职位变更，创建工作历史记录"""
    today = date.today()
    
    # 检查是否提供了current_position_start_date，如果没有则默认使用当前日期
    if employee.current_position_start_date:
        effective_date = employee.current_position_start_date
    else:
        effective_date = today
        # 同时更新员工的current_position_start_date字段
        db_employee.current_position_start_date = today
    
    # 检查是否是员工首次担任该职位，如果是则更新career_position_level_date
    first_time_in_position = True
    for history in db_employee.job_history:
        if history.position_id == employee.actual_position_id:
            first_time_in_position = False
            break
    
    if first_time_in_position and not db_employee.career_position_level_date:
        db_employee.career_position_level_date = effective_date
    
    # 结束之前的工作历史记录(如果有)
    for job_history in db_employee.job_history:
        if job_history.end_date is None:
            job_history.end_date = effective_date
            break
    
    # 获取必要的关联ID
    department_id = db_employee.department_id
    personnel_category_id = db_employee.personnel_category_id
    
    # 检查是否已存在相同有效日期的工作历史记录
    existing_history = db.query(EmployeeJobHistory).filter(
        EmployeeJobHistory.employee_id == employee_id,
        EmployeeJobHistory.effective_date == effective_date
    ).first()
    
    # 只有在不存在相同日期的记录时才创建新记录
    if not existing_history:
        # 创建新的工作历史记录
        try:
            new_job_history = EmployeeJobHistory(
                employee_id=employee_id,
                department_id=department_id,
                position_id=employee.actual_position_id,
                personnel_category_id=personnel_category_id,
                effective_date=effective_date,
                end_date=None  # 开放结束日期，直到下次职位变更
            )
            db.add(new_job_history)
            logger.info(f"Created job history record for employee {employee_id}: "
                        f"position change from {old_position_id} to {employee.actual_position_id} "
                        f"effective {effective_date}")
        except Exception as e:
            logger.error(f"Error creating job history record for employee {employee_id}: {e}")
    else:
        # 如果已存在相同日期的记录，更新其信息
        existing_history.department_id = department_id
        existing_history.position_id = employee.actual_position_id
        existing_history.personnel_category_id = personnel_category_id
        existing_history.end_date = None  # 确保这是当前有效的记录
        logger.info(f"Updated existing job history record for employee {employee_id}: "
                    f"position updated to {employee.actual_position_id} "
                    f"effective {effective_date}")


def _update_appraisals(db: Session, employee: EmployeeUpdate, employee_id: int) -> None:
    """更新员工年度考核信息"""
    # 处理年度考核 appraisals 的更新
    # Only proceed if 'appraisals' key was provided in the payload and is not None.
    # If employee.appraisals is an empty list [], it means to delete all existing and add no new ones.
    # If employee.appraisals is None, existing appraisals are not touched.
    if employee.appraisals is not None:
        # 1. 删除该员工所有现有的年度考核记录
        logger.info(f"Updating appraisals for employee {employee_id}. Deleting existing ones first.")
        db.query(EmployeeAppraisal).filter(EmployeeAppraisal.employee_id == employee_id).delete(synchronize_session=False)
        
        # 2. 如果传入了新的 appraisals 数据 (i.e., list is not empty), 则创建它们
        if employee.appraisals:  # This ensures the list itself is not empty
            logger.info(f"Adding {len(employee.appraisals)} new appraisal records.")
            for appraisal_data_pydantic in employee.appraisals:  # appraisal_data_pydantic is EmployeeAppraisalUpdate
                # For new appraisals, id might not be present.
                # Since current strategy is delete all then add all from payload, id from payload item is ignored.
                appraisal_dict = appraisal_data_pydantic.model_dump(exclude_unset=True) 
                
                # Ensure 'id' and 'employee_id' from payload item are not used when creating new ORM instances
                appraisal_dict.pop('id', None) 
                appraisal_dict.pop('employee_id', None)  # employee_id will be set from the main employee_id

                db_appraisal = EmployeeAppraisal(
                    **appraisal_dict, 
                    employee_id=employee_id 
                )
                db.add(db_appraisal)
        else:
            logger.info(f"Payload contained empty list for appraisals. All existing appraisals for employee {employee_id} were deleted and no new ones added.")
    else:
        logger.info(f"'appraisals' field was not provided or was null in the payload for employee {employee_id}. Existing appraisals remain untouched.") 