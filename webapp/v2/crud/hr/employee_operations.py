"""
员工相关的CRUD操作（单个员工）
"""
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, and_, inspect, select
from typing import List, Optional, Tuple, Dict, Any
import logging
from datetime import date

from ...models.hr import (
    Employee, EmployeeJobHistory, EmployeeBankAccount, EmployeeAppraisal,
    Department as DepartmentModel, # 使用别名以匹配辅助函数
    Position as PositionModel,     # 使用别名以匹配辅助函数
    PersonnelCategory as PersonnelCategoryModel, # 使用别名以匹配辅助函数
    EmployeeLeaveRequest # delete_employee 中有引用
)
from ...models.config import LookupValue, LookupType
from ...pydantic_models.hr import (
    EmployeeCreate, EmployeeUpdate
)

logger = logging.getLogger(__name__)

# 辅助函数
def _resolve_lookup_id(db: Session, text_value: Optional[str], type_code: str) -> Optional[int]:
    """
    Resolves a text value for a lookup to its corresponding ID using the LookupType code.
    Example: text_value="男", type_code="GENDER" -> returns the ID of "男" in lookup_values.
    """
    if not text_value:
        return None
    
    # from sqlalchemy import func # Not used in this specific query yet

    # New SQLAlchemy 2.0 style query
    stmt = select(LookupValue.id)\
        .join(LookupType, LookupValue.lookup_type_id == LookupType.id)\
        .where(LookupType.code == type_code)\
        .where(LookupValue.name == text_value)
    
    # lookup_value_id = db.scalar_one_or_none(stmt) # Original attempt for 2.0 style
    result = db.execute(stmt) # Execute the statement first
    lookup_value_id = result.scalar_one_or_none() # Then get the scalar from the result

    if lookup_value_id is None:
        logger.warning(f"Lookup value not found for text: '{text_value}' with type_code: '{type_code}'. A new one might be created if applicable or this will be skipped.")
    return lookup_value_id

def _get_department_by_name(db: Session, name: str) -> Optional[DepartmentModel]:
    return db.query(DepartmentModel).filter(func.lower(DepartmentModel.name) == func.lower(name)).first()

def _get_position_by_name(db: Session, name: str) -> Optional[PositionModel]:
    return db.query(PositionModel).filter(func.lower(PositionModel.name) == func.lower(name)).first()

def _get_personnel_category_by_name(db: Session, name: str) -> Optional[PersonnelCategoryModel]:
    return db.query(PersonnelCategoryModel).filter(func.lower(PersonnelCategoryModel.name) == func.lower(name)).first()


# Employee CRUD
def get_employees(
    db: Session,
    search: Optional[str] = None,
    status_id: Optional[int] = None,
    department_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100
) -> Tuple[List[Employee], int]:
    """
    获取员工列表，包含完整的关联对象。
    """
    from sqlalchemy.orm import selectinload

    query = db.query(Employee)

    if status_id:
        query = query.filter(Employee.status_lookup_value_id == status_id)
    if department_id:
        query = query.filter(Employee.department_id == department_id)
    if search:
        search_term = f"%{search}%"
        employee_filters = [
            Employee.employee_code.ilike(search_term),
            Employee.first_name.ilike(search_term),
            Employee.last_name.ilike(search_term),
            Employee.id_number.ilike(search_term),
            Employee.email.ilike(search_term),
            Employee.phone_number.ilike(search_term)
        ]
        query = query.filter(or_(*employee_filters))

    count_query = db.query(func.count(Employee.id))
    if status_id:
        count_query = count_query.filter(Employee.status_lookup_value_id == status_id)
    if department_id:
        count_query = count_query.filter(Employee.department_id == department_id)
    if search:
        count_query = count_query.filter(or_(*employee_filters))
    total = count_query.scalar()

    query = query.options(
        selectinload(Employee.gender),
        selectinload(Employee.status),
        selectinload(Employee.employment_type),
        selectinload(Employee.education_level),
        selectinload(Employee.marital_status),
        selectinload(Employee.political_status),
        selectinload(Employee.contract_type),
        selectinload(Employee.current_department),
        selectinload(Employee.personnel_category),
        selectinload(Employee.actual_position).selectinload(Position.parent_position),
        selectinload(Employee.appraisals).selectinload(EmployeeAppraisal.appraisal_result),
        selectinload(Employee.bank_accounts),
        selectinload(Employee.job_history).options(
            selectinload(EmployeeJobHistory.department),
            selectinload(EmployeeJobHistory.position_detail).selectinload(Position.parent_position),
            selectinload(EmployeeJobHistory.personnel_category_detail).selectinload(PersonnelCategory.parent_category),
            selectinload(EmployeeJobHistory.manager)
        )
    )
    query = query.order_by(Employee.last_name, Employee.first_name).offset(skip).limit(limit)
    results = query.all()
    return results, total

def get_employee(db: Session, employee_id: int) -> Optional[Employee]:
    """
    根据ID获取员工。
    """
    from sqlalchemy.orm import selectinload
    return db.query(Employee).options(
        selectinload(Employee.gender),
        selectinload(Employee.status),
        selectinload(Employee.employment_type),
        selectinload(Employee.education_level),
        selectinload(Employee.marital_status),
        selectinload(Employee.political_status),
        selectinload(Employee.contract_type),
        selectinload(Employee.current_department),
        selectinload(Employee.personnel_category),
        selectinload(Employee.actual_position).selectinload(Position.parent_position),
        selectinload(Employee.appraisals).selectinload(EmployeeAppraisal.appraisal_result),
        selectinload(Employee.job_history).options(
            selectinload(EmployeeJobHistory.department),
            selectinload(EmployeeJobHistory.position_detail).selectinload(Position.parent_position),
            selectinload(EmployeeJobHistory.personnel_category_detail).selectinload(PersonnelCategory.parent_category),
            selectinload(EmployeeJobHistory.manager)
        ),
        selectinload(Employee.bank_accounts),
    ).filter(Employee.id == employee_id).first()

def get_employee_by_code(db: Session, employee_code: str) -> Optional[Employee]:
    """
    根据员工代码获取员工。
    """
    return db.query(Employee).filter(Employee.employee_code == employee_code).first()

def get_employee_by_id_number(db: Session, id_number: str) -> Optional[Employee]:
    """
    根据身份证号获取员工。
    """
    return db.query(Employee).filter(Employee.id_number == id_number).first()

def get_employee_by_name_and_id_number(db: Session, last_name: str, first_name: str, id_number: str) -> Optional[Employee]:
    """
    根据姓名和身份证号获取员工。
    """
    return db.query(Employee).filter(
        Employee.last_name == last_name,
        Employee.first_name == first_name,
        Employee.id_number == id_number
    ).first()

def create_employee(db: Session, employee: EmployeeCreate) -> Employee:
    """
    创建员工。
    """
    if employee.employee_code and get_employee_by_code(db, employee.employee_code):
        raise ValueError(f"Employee with code '{employee.employee_code}' already exists")
    if employee.id_number and get_employee_by_id_number(db, employee.id_number):
        raise ValueError(f"Employee with ID number '{employee.id_number}' already exists")

    bank_name = employee.bank_name
    bank_account_number = employee.bank_account_number

    fields_to_exclude = {
        "appraisals", "bank_name", "bank_account_number",
        "gender_lookup_value_name", "status_lookup_value_name",
        "employment_type_lookup_value_name", "education_level_lookup_value_name",
        "marital_status_lookup_value_name", "political_status_lookup_value_name",
        "contract_type_lookup_value_name", "department_name", "position_name",
        "personnel_category_name", "job_position_level_lookup_value_name",
        "salary_level_lookup_value_name", "salary_grade_lookup_value_name",
        "ref_salary_level_lookup_value_name"
    }
    employee_data = employee.model_dump(exclude_none=True, exclude=fields_to_exclude)

    if not employee_data.get('status_lookup_value_id') and employee.status_lookup_value_name:
        status_id = _resolve_lookup_id(db, employee.status_lookup_value_name, "EMPLOYEE_STATUS")
        if status_id is None:
            raise ValueError(f"Status '{employee.status_lookup_value_name}' could not be resolved or is missing.")
        employee_data['status_lookup_value_id'] = status_id
    
    # Resolve other lookup IDs
    lookup_fields_map = {
        "gender_lookup_value_id": ("gender_lookup_value_name", "GENDER"),
        "employment_type_lookup_value_id": ("employment_type_lookup_value_name", "EMPLOYMENT_TYPE"),
        "education_level_lookup_value_id": ("education_level_lookup_value_name", "EDUCATION_LEVEL"),
        "marital_status_lookup_value_id": ("marital_status_lookup_value_name", "MARITAL_STATUS"),
        "political_status_lookup_value_id": ("political_status_lookup_value_name", "POLITICAL_STATUS"),
        "contract_type_lookup_value_id": ("contract_type_lookup_value_name", "CONTRACT_TYPE"),
        "job_position_level_lookup_value_id": ("job_position_level_lookup_value_name", "JOB_POSITION_LEVEL"),
        "salary_level_lookup_value_id": ("salary_level_lookup_value_name", "SALARY_LEVEL"),
        "salary_grade_lookup_value_id": ("salary_grade_lookup_value_name", "SALARY_GRADE"),
        "ref_salary_level_lookup_value_id": ("ref_salary_level_lookup_value_name", "REF_SALARY_LEVEL"),
    }
    for id_field, (name_field, type_code) in lookup_fields_map.items():
        if not employee_data.get(id_field) and getattr(employee, name_field):
            resolved_id = _resolve_lookup_id(db, getattr(employee, name_field), type_code)
            if resolved_id is not None: # Only set if resolved
                 employee_data[id_field] = resolved_id
            elif getattr(employee, name_field): # Log warning if name was provided but not resolved
                 logger.warning(f"Could not resolve {name_field} '{getattr(employee, name_field)}' for type {type_code}")


    if employee.department_name:
        dept = _get_department_by_name(db, employee.department_name)
        if dept: employee_data['department_id'] = dept.id
        else: logger.warning(f"无法找到部门 '{employee.department_name}'")
    elif employee.department_id:
         employee_data["department_id"] = employee.department_id

    if employee.position_name:
        pos = _get_position_by_name(db, employee.position_name)
        if pos: employee_data["actual_position_id"] = pos.id
        else: logger.warning(f"无法找到职位 '{employee.position_name}'")
    elif employee.actual_position_id:
         employee_data["actual_position_id"] = employee.actual_position_id
    
    if employee.personnel_category_name:
        pc = _get_personnel_category_by_name(db, employee.personnel_category_name)
        if pc: employee_data["personnel_category_id"] = pc.id
        else: logger.warning(f"无法找到人员类别 '{employee.personnel_category_name}'")
    elif employee.personnel_category_id:
        employee_data["personnel_category_id"] = employee.personnel_category_id

    db_employee = Employee(**employee_data)
    db.add(db_employee)
    try:
        db.flush()
    except Exception as e:
        db.rollback()
        logger.error(f"Error flushing new employee: {e}")
        raise

    if bank_name and bank_account_number:
        try:
            bank_account = EmployeeBankAccount(
                employee_id=db_employee.id, bank_name=bank_name,
                account_number=bank_account_number,
                account_holder_name=f"{db_employee.last_name} {db_employee.first_name}".strip(),
                is_primary=True
            )
            db.add(bank_account)
        except Exception as e:
            db.rollback()
            logger.error(f"Error creating bank account for employee {db_employee.id}: {e}")
            raise ValueError(f"Failed to create bank account: {str(e)}")

    if hasattr(employee, 'appraisals') and employee.appraisals:
        for appraisal_data in employee.appraisals:
            db_appraisal = EmployeeAppraisal(**appraisal_data.model_dump(), employee_id=db_employee.id)
            db.add(db_appraisal)
    
    if db_employee.actual_position_id and db_employee.department_id and db_employee.personnel_category_id:
        try:
            today = date.today()
            effective_date = db_employee.current_position_start_date or db_employee.hire_date or today
            if not db_employee.career_position_level_date:
                db_employee.career_position_level_date = effective_date
            
            existing_history = db.query(EmployeeJobHistory).filter(
                EmployeeJobHistory.employee_id == db_employee.id,
                EmployeeJobHistory.effective_date == effective_date
            ).first()
            
            if not existing_history:
                new_job_history = EmployeeJobHistory(
                    employee_id=db_employee.id, department_id=db_employee.department_id,
                    position_id=db_employee.actual_position_id, personnel_category_id=db_employee.personnel_category_id,
                    effective_date=effective_date, end_date=None
                )
                db.add(new_job_history)
            else:
                existing_history.department_id = db_employee.department_id
                existing_history.position_id = db_employee.actual_position_id
                existing_history.personnel_category_id = db_employee.personnel_category_id
                existing_history.end_date = None
        except Exception as e:
            logger.error(f"Error creating/updating initial job history for employee {db_employee.id}: {e}")
    elif db_employee.actual_position_id:
        missing_fields = [f for f, v in [("department_id", db_employee.department_id), ("personnel_category_id", db_employee.personnel_category_id)] if not v]
        logger.warning(f"无法为员工 {db_employee.id} 创建工作历史记录，缺少必要字段: {', '.join(missing_fields)}")

    db.commit()
    db.refresh(db_employee)
    return get_employee(db, db_employee.id)


def update_employee(db: Session, employee_id: int, employee: EmployeeUpdate) -> Optional[Employee]:
    """
    更新员工。
    """
    db_employee = get_employee(db, employee_id)
    if not db_employee:
        return None

    if employee.employee_code is not None and employee.employee_code != db_employee.employee_code:
        if get_employee_by_code(db, employee.employee_code):
            raise ValueError(f"Employee with code '{employee.employee_code}' already exists")
    if employee.id_number is not None and employee.id_number != db_employee.id_number:
        if get_employee_by_id_number(db, employee.id_number):
            raise ValueError(f"Employee with ID number '{employee.id_number}' already exists")

    bank_name = employee.bank_name
    bank_account_number = employee.bank_account_number
    
    position_changed = (employee.actual_position_id is not None and employee.actual_position_id != db_employee.actual_position_id)
    old_position_id = db_employee.actual_position_id

    fields_to_exclude = {"appraisals", "bank_name", "bank_account_number"}
    update_data = employee.model_dump(exclude_unset=True, exclude=fields_to_exclude)
    
    for key, value in update_data.items():
        if hasattr(db_employee, key):
            setattr(db_employee, key, value)

    # Resolve lookup IDs if names are provided
    lookup_fields_map = {
        "gender_lookup_value_id": ("gender_lookup_value_name", "GENDER"),
        "status_lookup_value_id": ("status_lookup_value_name", "EMPLOYEE_STATUS"),
        "employment_type_lookup_value_id": ("employment_type_lookup_value_name", "EMPLOYMENT_TYPE"),
        "education_level_lookup_value_id": ("education_level_lookup_value_name", "EDUCATION_LEVEL"),
        "marital_status_lookup_value_id": ("marital_status_lookup_value_name", "MARITAL_STATUS"),
        "political_status_lookup_value_id": ("political_status_lookup_value_name", "POLITICAL_STATUS"),
        "contract_type_lookup_value_id": ("contract_type_lookup_value_name", "CONTRACT_TYPE"),
        "job_position_level_lookup_value_id": ("job_position_level_lookup_value_name", "JOB_POSITION_LEVEL"),
        "salary_level_lookup_value_id": ("salary_level_lookup_value_name", "SALARY_LEVEL"),
        "salary_grade_lookup_value_id": ("salary_grade_lookup_value_name", "SALARY_GRADE"),
        "ref_salary_level_lookup_value_id": ("ref_salary_level_lookup_value_name", "REF_SALARY_LEVEL"),
    }
    for id_field, (name_field, type_code) in lookup_fields_map.items():
        name_value = getattr(employee, name_field, None) # Get name field if it exists
        if name_value is not None: # Only attempt to resolve if name is provided
            resolved_id = _resolve_lookup_id(db, name_value, type_code)
            if resolved_id is not None:
                setattr(db_employee, id_field, resolved_id)
            else:
                logger.warning(f"Could not resolve {name_field} '{name_value}' for type {type_code} during update.")
        elif getattr(employee, id_field, None) is not None: # If ID is directly provided
             setattr(db_employee, id_field, getattr(employee, id_field))


    if employee.department_name:
        dept = _get_department_by_name(db, employee.department_name)
        if dept: db_employee.department_id = dept.id
        else: logger.warning(f"无法找到部门 '{employee.department_name}' 更新时")
    elif employee.department_id is not None: # Allow direct ID update
         db_employee.department_id = employee.department_id


    if employee.position_name:
        pos = _get_position_by_name(db, employee.position_name)
        if pos: db_employee.actual_position_id = pos.id
        else: logger.warning(f"无法找到职位 '{employee.position_name}' 更新时")
    elif employee.actual_position_id is not None: # Allow direct ID update
        db_employee.actual_position_id = employee.actual_position_id

    if employee.personnel_category_name:
        pc = _get_personnel_category_by_name(db, employee.personnel_category_name)
        if pc: db_employee.personnel_category_id = pc.id
        else: logger.warning(f"无法找到人员类别 '{employee.personnel_category_name}' 更新时")
    elif employee.personnel_category_id is not None: # Allow direct ID update
        db_employee.personnel_category_id = employee.personnel_category_id


    if bank_name and bank_account_number:
        primary_account = db.query(EmployeeBankAccount).filter(
            EmployeeBankAccount.employee_id == db_employee.id,
            EmployeeBankAccount.is_primary == True
        ).first()
        if primary_account:
            primary_account.bank_name = bank_name
            primary_account.account_number = bank_account_number
            primary_account.account_holder_name = f"{db_employee.last_name} {db_employee.first_name}".strip()
        else:
            new_account = EmployeeBankAccount(
                employee_id=db_employee.id, bank_name=bank_name,
                account_number=bank_account_number,
                account_holder_name=f"{db_employee.last_name} {db_employee.first_name}".strip(),
                is_primary=True
            )
            db.add(new_account)

    if position_changed and db_employee.actual_position_id and db_employee.department_id and db_employee.personnel_category_id:
        try:
            today = date.today()
            effective_date = db_employee.current_position_start_date or today # Use current_position_start_date if available

            # End date the previous job history record if it exists
            previous_job_history = db.query(EmployeeJobHistory).filter(
                EmployeeJobHistory.employee_id == db_employee.id,
                EmployeeJobHistory.end_date == None
            ).order_by(EmployeeJobHistory.effective_date.desc()).first()

            if previous_job_history and previous_job_history.effective_date < effective_date:
                 previous_job_history.end_date = effective_date 

            # Create new job history record or update if one exists for the same effective_date
            existing_history_for_date = db.query(EmployeeJobHistory).filter(
                EmployeeJobHistory.employee_id == db_employee.id,
                EmployeeJobHistory.effective_date == effective_date
            ).first()

            if existing_history_for_date:
                existing_history_for_date.department_id = db_employee.department_id
                existing_history_for_date.position_id = db_employee.actual_position_id
                existing_history_for_date.personnel_category_id = db_employee.personnel_category_id
                existing_history_for_date.end_date = None # Ensure it's the current active record
            else:
                new_job_history = EmployeeJobHistory(
                    employee_id=db_employee.id, department_id=db_employee.department_id,
                    position_id=db_employee.actual_position_id, personnel_category_id=db_employee.personnel_category_id,
                    effective_date=effective_date, end_date=None
                )
                db.add(new_job_history)
        except Exception as e:
            logger.error(f"Error updating job history for employee {db_employee.id}: {e}")

    try:
        db.commit()
        db.refresh(db_employee)
    except Exception as e:
        db.rollback()
        logger.error(f"Error committing employee update for ID {employee_id}: {e}")
        raise
    return get_employee(db, db_employee.id)


def delete_employee(db: Session, employee_id: int) -> bool:
    """
    删除员工。
    """
    db_employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if db_employee:
        try:
            # Soft delete by setting status to 'INACTIVE' or a specific 'DELETED' status
            # This assumes you have a status like 'DELETED_STATUS_ID' or similar
            # For now, let's assume a hard delete for simplicity, or adjust as needed.
            # Example for soft delete:
            # deleted_status = db.query(LookupValue.id).join(LookupType).filter(LookupType.type_code == "EMPLOYEE_STATUS", LookupValue.code == "DELETED").scalar_one_or_none()
            # if deleted_status:
            #    db_employee.status_lookup_value_id = deleted_status
            # else:
            #    logger.warning("DELETED status not found for soft delete, performing hard delete or raise error.")
            #    # Fallback to hard delete or raise an error if soft delete status is critical
            #    db.delete(db_employee) # Example hard delete
            
            # For now, performing a hard delete as per original structure
            db.delete(db_employee)
            db.commit()
            return True
        except Exception as e:
            db.rollback()
            logger.error(f"Error deleting employee {employee_id}: {e}")
            return False
    return False