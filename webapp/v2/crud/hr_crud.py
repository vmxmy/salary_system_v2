"""
人事相关的CRUD操作。
"""
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, and_, inspect, select
from typing import List, Optional, Tuple, Dict, Any
import logging

from ..models.hr import (
    Employee, Department, PersonnelCategory, EmployeeJobHistory,
    EmployeeContract, EmployeeCompensationHistory, EmployeePayrollComponent,
    LeaveType, EmployeeLeaveBalance, EmployeeLeaveRequest, EmployeeBankAccount,
    Position, EmployeeAppraisal, Department as DepartmentModel, Employee as EmployeeModel, EmployeeAppraisal as EmployeeAppraisalModel, EmployeeJobHistory as EmployeeJobHistoryModel, PersonnelCategory as PersonnelCategoryModel, Position as PositionModel
)
from ..models.config import LookupValue, LookupType

from ..pydantic_models.hr import (
    EmployeeCreate, EmployeeUpdate, DepartmentCreate, DepartmentUpdate,
    PersonnelCategoryCreate, PersonnelCategoryUpdate, EmployeeJobHistoryCreate, EmployeeJobHistoryUpdate,
    PositionCreate, PositionUpdate, EmployeeAppraisalCreate, EmployeeAppraisalUpdate
)

from .hr.employee_operations import (
    get_employee_by_code,
    get_employee_by_id_number,
    get_employee,
    # create_employee, # create_bulk_employees 重新实现了创建逻辑
    # update_employee  # create_bulk_employees 重新实现了更新逻辑
)
logger = logging.getLogger(__name__)
from .hr.department_crud import (
    get_departments,
    get_department,
    get_department_by_code,
    create_department,
    update_department,
    delete_department,
    _get_department_by_name, # Used by create_bulk_employees
)
from .hr.personnel_category_crud import (
    get_personnel_categories,
    get_personnel_category,
    get_personnel_category_by_code,
    create_personnel_category,
    update_personnel_category,
    delete_personnel_category,
    _get_personnel_category_by_name, # Used by create_bulk_employees
)
from .hr.position_crud import (
    get_positions,
    _get_position_by_name, # Used by create_bulk_employees
)

# region Helper functions for resolving IDs
def _resolve_lookup_id(db: Session, text_value: Optional[str], type_code: str) -> Optional[int]:
    """
    Resolves a text value for a lookup to its corresponding ID using the LookupType code.
    Example: text_value="男", type_code="GENDER" -> returns the ID of "男" in lookup_values.
    """
    if not text_value:
        return None
    
    from ..models.config import LookupType, LookupValue 
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

def create_bulk_employees(db: Session, employees_in: List[EmployeeCreate], overwrite_mode: bool = False) -> Tuple[List[Employee], List[Dict]]:
    """批量创建员工，返回成功和失败记录的详细信息"""
    created_employees = []
    failed_records = []
    seen_employee_codes_in_batch = set()
    seen_id_numbers_in_batch = set()
    
    # 定义处理结果的记录类
    class RecordResult:
        def __init__(self):
            self.errors = []
            self.success_employee_id = None
    

    logger.info(f"开始批量创建员工, 数量: {len(employees_in)}, 覆盖模式: {overwrite_mode}")

    for index, emp_in in enumerate(employees_in):
        try:
            current_record_errors = []
            record_result = RecordResult()
            logger.debug(f"处理第{index+1}条记录, 员工代码: {emp_in.employee_code}, 身份证号: {emp_in.id_number}")

            # 1. Validate basic constraints
            # Ensure employee_code uniqueness within batch and DB
            if emp_in.employee_code:
                if emp_in.employee_code in seen_employee_codes_in_batch:
                    current_record_errors.append(f"批次中存在重复的员工代码 '{emp_in.employee_code}'")
                seen_employee_codes_in_batch.add(emp_in.employee_code)
                
                # Check against DB only if employee_code is provided
                # The get_employee_by_code function expects a string, so this check is implicitly for non-None codes.
                # If the DB allows multiple NULLs but unique non-NULLs, this is fine.
                # If DB has unique constraint that treats multiple empty strings as duplicate, that's a DB level concern.
                existing_in_db = get_employee_by_code(db, emp_in.employee_code)
                if existing_in_db:
                    if overwrite_mode:
                        # 在覆盖模式下，保存现有员工ID用于更新
                        emp_in.id = existing_in_db.id
                        logger.info(f"覆盖模式: 找到已存在的员工代码 '{emp_in.employee_code}', ID: {emp_in.id}, 将进行更新")
                    else:
                        current_record_errors.append(f"员工代码 '{emp_in.employee_code}' 已存在于数据库中")
                        logger.warning(f"员工代码 '{emp_in.employee_code}' 已存在，但不在覆盖模式，跳过")

            if emp_in.id_number:
                if emp_in.id_number in seen_id_numbers_in_batch:
                    current_record_errors.append(f"批次中存在重复的身份证号 '{emp_in.id_number}'")
                    logger.warning(f"批次中存在重复的身份证号 '{emp_in.id_number}'")
                seen_id_numbers_in_batch.add(emp_in.id_number)
                existing_employee = get_employee_by_id_number(db, emp_in.id_number)
                if existing_employee:
                    if overwrite_mode:
                        # 如果之前没有通过employee_code找到，则通过id_number找到
                        if not hasattr(emp_in, 'id') or emp_in.id is None:
                            emp_in.id = existing_employee.id
                            logger.info(f"覆盖模式: 通过身份证号 '{emp_in.id_number}' 找到已存在的员工, ID: {emp_in.id}, 将进行更新")
                    else:
                        current_record_errors.append(f"身份证号 '{emp_in.id_number}' 已存在于数据库中")
                        logger.warning(f"身份证号 '{emp_in.id_number}' 已存在，但不在覆盖模式，跳过")

            # 保存银行信息以便稍后创建
            bank_name = emp_in.bank_name
            bank_account_number = emp_in.bank_account_number

            # 2. Prepare data for Employee ORM model
            # Start with fields that don't need special resolution from EmployeeCreate
            # Exclude _name fields as they are resolved to _id fields, and exclude appraisals.
            fields_to_exclude = {
                "appraisals", 
                "bank_name",
                "bank_account_number",
                "gender_lookup_value_name", 
                "status_lookup_value_name",
                "employment_type_lookup_value_name", 
                "education_level_lookup_value_name",
                "marital_status_lookup_value_name", 
                "political_status_lookup_value_name",
                "contract_type_lookup_value_name", 
                "department_name", 
                "position_name",
                "personnel_category_name",
                "job_position_level_lookup_value_name",
                "salary_level_lookup_value_name", # 添加薪资级别名称
                "salary_grade_lookup_value_name", # 添加薪资等级名称
                "ref_salary_level_lookup_value_name" # 添加参考薪资级别名称
            }
            employee_orm_data = emp_in.model_dump(exclude_none=True, exclude=fields_to_exclude)

            # Ensure employee_code is None if it's an empty string, to play well with DB unique constraints on NULL vs ''
            if "employee_code" in employee_orm_data and employee_orm_data["employee_code"] == "":
                employee_orm_data["employee_code"] = None
            elif emp_in.employee_code == "": # also catch case where it was not excluded by model_dump due to exclude_none=False or not being None
                employee_orm_data["employee_code"] = None

            # Resolve lookups
            employee_orm_data["gender_lookup_value_id"] = _resolve_lookup_id(db, emp_in.gender_lookup_value_name, "GENDER")
            
            status_id = _resolve_lookup_id(db, emp_in.status_lookup_value_name, "EMPLOYEE_STATUS")
            if status_id is None: # status_lookup_value_id is mandatory in EmployeeBase
                current_record_errors.append(f"员工状态 '{emp_in.status_lookup_value_name}' 无法解析或缺失")
            employee_orm_data["status_lookup_value_id"] = status_id
            
            employee_orm_data["employment_type_lookup_value_id"] = _resolve_lookup_id(db, emp_in.employment_type_lookup_value_name, "EMPLOYMENT_TYPE")
            employee_orm_data["education_level_lookup_value_id"] = _resolve_lookup_id(db, emp_in.education_level_lookup_value_name, "EDUCATION_LEVEL")
            employee_orm_data["marital_status_lookup_value_id"] = _resolve_lookup_id(db, emp_in.marital_status_lookup_value_name, "MARITAL_STATUS")
            employee_orm_data["political_status_lookup_value_id"] = _resolve_lookup_id(db, emp_in.political_status_lookup_value_name, "POLITICAL_STATUS")
            employee_orm_data["contract_type_lookup_value_id"] = _resolve_lookup_id(db, emp_in.contract_type_lookup_value_name, "CONTRACT_TYPE")
            
            # 处理职务级别
            employee_orm_data["job_position_level_lookup_value_id"] = _resolve_lookup_id(db, emp_in.job_position_level_lookup_value_name, "JOB_POSITION_LEVEL")
            
            # Resolve department and position
            logger.debug(f"原始字段值 - 部门名称: '{emp_in.department_name}', 职位名称: '{emp_in.position_name}', 人员类别: '{emp_in.personnel_category_name}'")
            
            if emp_in.department_name:
                dept = _get_department_by_name(db, emp_in.department_name)
                if dept:
                    employee_orm_data["department_id"] = dept.id
                    logger.debug(f"成功解析部门 '{emp_in.department_name}' 为ID: {dept.id}")
                else:
                    # 尝试模糊匹配部门名称
                    similar_depts = db.query(DepartmentModel).filter(
                        func.lower(DepartmentModel.name).like(f"%{emp_in.department_name.lower()}%")
                    ).all()
                    
                    if similar_depts and len(similar_depts) == 1:
                        # 如果只找到一个相似部门，使用它
                        employee_orm_data["department_id"] = similar_depts[0].id
                        logger.info(f"使用模糊匹配找到部门 '{similar_depts[0].name}' (ID: {similar_depts[0].id}) 代替 '{emp_in.department_name}'")
                    else:
                        # 在覆盖模式下，如果是更新现有员工，允许跳过部门验证
                        if overwrite_mode and hasattr(emp_in, 'id') and emp_in.id is not None:
                            logger.warning(f"无法找到部门 '{emp_in.department_name}'，但在覆盖模式下继续更新员工")
                        else:
                            current_record_errors.append(f"部门 '{emp_in.department_name}' 在数据库中未找到")
                            logger.warning(f"无法找到部门 '{emp_in.department_name}'")
            elif "department_id" not in employee_orm_data and emp_in.department_id is not None: # If ID was directly provided
                 employee_orm_data["department_id"] = emp_in.department_id
                 logger.debug(f"使用直接提供的部门ID: {emp_in.department_id}")


            if emp_in.position_name:
                pos = _get_position_by_name(db, emp_in.position_name)
                if pos:
                    employee_orm_data["actual_position_id"] = pos.id # Assuming field name is actual_position_id
                    logger.debug(f"成功解析职位 '{emp_in.position_name}' 为ID: {pos.id}")
                else:
                    # 尝试模糊匹配职位名称
                    similar_positions = db.query(PositionModel).filter(
                        func.lower(PositionModel.name).like(f"%{emp_in.position_name.lower()}%")
                    ).all()
                    
                    if similar_positions and len(similar_positions) == 1:
                        # 如果只找到一个相似职位，使用它
                        employee_orm_data["actual_position_id"] = similar_positions[0].id
                        logger.info(f"使用模糊匹配找到职位 '{similar_positions[0].name}' (ID: {similar_positions[0].id}) 代替 '{emp_in.position_name}'")
                    else:
                        # 在覆盖模式下，如果是更新现有员工，允许跳过职位验证
                        if overwrite_mode and hasattr(emp_in, 'id') and emp_in.id is not None:
                            logger.warning(f"无法找到职位 '{emp_in.position_name}'，但在覆盖模式下继续更新员工")
                        else:
                            current_record_errors.append(f"职位 '{emp_in.position_name}' 在数据库中未找到")
                            logger.warning(f"无法找到职位 '{emp_in.position_name}'")
            elif "actual_position_id" not in employee_orm_data and emp_in.actual_position_id is not None: # If ID was directly provided
                 employee_orm_data["actual_position_id"] = emp_in.actual_position_id
                 logger.debug(f"使用直接提供的职位ID: {emp_in.actual_position_id}")
            
            # Resolve personnel category by name (NEW)
            if emp_in.personnel_category_name:
                pc = _get_personnel_category_by_name(db, emp_in.personnel_category_name)
                if pc:
                    employee_orm_data["personnel_category_id"] = pc.id
                    logger.debug(f"成功解析人员类别 '{emp_in.personnel_category_name}' 为ID: {pc.id}")
                else:
                    # 尝试模糊匹配人员类别名称
                    similar_categories = db.query(PersonnelCategoryModel).filter(
                        func.lower(PersonnelCategoryModel.name).like(f"%{emp_in.personnel_category_name.lower()}%")
                    ).all()
                    
                    if similar_categories and len(similar_categories) == 1:
                        # 如果只找到一个相似人员类别，使用它
                        employee_orm_data["personnel_category_id"] = similar_categories[0].id
                        logger.info(f"使用模糊匹配找到人员类别 '{similar_categories[0].name}' (ID: {similar_categories[0].id}) 代替 '{emp_in.personnel_category_name}'")
                    else:
                        # 在覆盖模式下，如果是更新现有员工，允许跳过人员类别验证
                        if overwrite_mode and hasattr(emp_in, 'id') and emp_in.id is not None:
                            logger.warning(f"无法找到人员类别 '{emp_in.personnel_category_name}'，但在覆盖模式下继续更新员工")
                        else:
                            current_record_errors.append(f"人员类别 '{emp_in.personnel_category_name}' 在数据库中未找到")
                            logger.warning(f"无法找到人员类别 '{emp_in.personnel_category_name}'")
            elif "personnel_category_id" not in employee_orm_data and emp_in.personnel_category_id is not None: # If ID was directly provided
                employee_orm_data["personnel_category_id"] = emp_in.personnel_category_id
                logger.debug(f"使用直接提供的人员类别ID: {emp_in.personnel_category_id}")

            # If company_id is None, try to set from context or default (placeholder logic)
            if employee_orm_data.get("company_id") is None:
                # Add logic here if company_id needs to be set from user context or a default
                # For now, we'll assume it might be optional or handled by DB default if not in emp_in
                pass

            # 处理lookup字段
            logger.debug(f"处理lookup字段: 工资级别: {emp_in.salary_level_lookup_value_name}, 工资档次: {emp_in.salary_grade_lookup_value_name}, 参照正编薪级: {emp_in.ref_salary_level_lookup_value_name}")
            
            # 处理薪资级别相关字段
            if not employee_orm_data.get('salary_level_lookup_value_id') and emp_in.salary_level_lookup_value_name:
                salary_level_id = _resolve_lookup_id(db, emp_in.salary_level_lookup_value_name, "SALARY_LEVEL")
                if salary_level_id is None:
                    logger.warning(f"无法解析工资级别 '{emp_in.salary_level_lookup_value_name}'")
                    # current_record_errors.append(f"工资级别 '{emp_in.salary_level_lookup_value_name}' 无法解析") # 可选：如果这是硬性要求
                else:
                    logger.debug(f"成功解析工资级别 '{emp_in.salary_level_lookup_value_name}' 为ID: {salary_level_id}")
                    employee_orm_data['salary_level_lookup_value_id'] = salary_level_id
            
            if not employee_orm_data.get('salary_grade_lookup_value_id') and emp_in.salary_grade_lookup_value_name:
                salary_grade_id = _resolve_lookup_id(db, emp_in.salary_grade_lookup_value_name, "SALARY_GRADE")
                if salary_grade_id is None:
                    logger.warning(f"无法解析工资档次 '{emp_in.salary_grade_lookup_value_name}'")
                    # current_record_errors.append(f"工资档次 '{emp_in.salary_grade_lookup_value_name}' 无法解析") # 可选
                else:
                    logger.debug(f"成功解析工资档次 '{emp_in.salary_grade_lookup_value_name}' 为ID: {salary_grade_id}")
                    employee_orm_data['salary_grade_lookup_value_id'] = salary_grade_id
            
            if not employee_orm_data.get('ref_salary_level_lookup_value_id') and emp_in.ref_salary_level_lookup_value_name:
                ref_salary_level_id = _resolve_lookup_id(db, emp_in.ref_salary_level_lookup_value_name, "REF_SALARY_LEVEL")
                if ref_salary_level_id is None:
                    logger.warning(f"无法解析参照正编薪级 '{emp_in.ref_salary_level_lookup_value_name}'")
                    # current_record_errors.append(f"参照正编薪级 '{emp_in.ref_salary_level_lookup_value_name}' 无法解析") # 可选
                else:
                    logger.debug(f"成功解析参照正编薪级 '{emp_in.ref_salary_level_lookup_value_name}' 为ID: {ref_salary_level_id}")
                    employee_orm_data['ref_salary_level_lookup_value_id'] = ref_salary_level_id

            # Determine if we are updating an existing employee or creating a new one
            db_employee_to_process: Optional[Employee] = None
            is_new_employee_creation = True

            if overwrite_mode:
                if emp_in.employee_code:
                    existing_by_code = get_employee_by_code(db, emp_in.employee_code)
                    if existing_by_code:
                        db_employee_to_process = existing_by_code
                        logger.info(f"覆写模式: 找到已存在的员工代码 '{emp_in.employee_code}', ID: {db_employee_to_process.id}, 将进行更新")
                        is_new_employee_creation = False
                if not db_employee_to_process and emp_in.id_number:
                    existing_by_id_number = get_employee_by_id_number(db, emp_in.id_number)
                    if existing_by_id_number:
                        if db_employee_to_process and db_employee_to_process.id != existing_by_id_number.id:
                            current_record_errors.append(f"Data inconsistency: Employee code '{emp_in.employee_code}' and ID number '{emp_in.id_number}' point to different existing employees.")
                            logger.error(f"数据不一致: 员工代码 '{emp_in.employee_code}' (ID: {db_employee_to_process.id}) 和身份证号 '{emp_in.id_number}' (ID: {existing_by_id_number.id}) 指向不同的现有员工。")
                        else:
                            db_employee_to_process = existing_by_id_number
                            logger.info(f"覆写模式: 通过身份证号 '{emp_in.id_number}' 找到已存在的员工, ID: {db_employee_to_process.id}, 将进行更新")
                            is_new_employee_creation = False
            
            if current_record_errors: 
                record_result.errors.extend(current_record_errors)
            else: # No pre-check errors, proceed with create/update and then sub-operations
                if db_employee_to_process: # Update existing employee
                    logger.info(f"覆写模式: 更新员工 ID {db_employee_to_process.id} 的信息")
                    old_actual_position_id = db_employee_to_process.actual_position_id
                    old_department_id = db_employee_to_process.department_id
                    old_personnel_category_id = db_employee_to_process.personnel_category_id
                    for key, value in employee_orm_data.items():
                        setattr(db_employee_to_process, key, value)
                    job_history_relevant_change_detected = (
                        db_employee_to_process.actual_position_id != old_actual_position_id or
                        db_employee_to_process.department_id != old_department_id or
                        db_employee_to_process.personnel_category_id != old_personnel_category_id
                    )
                    logger.info(f"员工 {db_employee_to_process.id} - 工作历史相关字段变更: {job_history_relevant_change_detected}")
                    if job_history_relevant_change_detected:
                        if db_employee_to_process.actual_position_id and db_employee_to_process.department_id and db_employee_to_process.personnel_category_id:
                            from datetime import date
                            today = date.today()
                            effective_date = employee_orm_data.get('current_position_start_date') or db_employee_to_process.current_position_start_date or db_employee_to_process.hire_date or today
                            if db_employee_to_process.current_position_start_date != effective_date:
                                db_employee_to_process.current_position_start_date = effective_date
                            is_first_time_in_new_position = True
                            if db_employee_to_process.job_history:
                                for history_item in db_employee_to_process.job_history:
                                    if history_item.position_id == db_employee_to_process.actual_position_id:
                                        is_first_time_in_new_position = False
                                        break
                            if is_first_time_in_new_position and (db_employee_to_process.career_position_level_date is None or db_employee_to_process.career_position_level_date > effective_date):
                                 db_employee_to_process.career_position_level_date = effective_date
                            if db_employee_to_process.job_history:
                                for history_item in db_employee_to_process.job_history:
                                    if history_item.end_date is None:
                                        history_item.end_date = effective_date
                                        logger.info(f"覆写模式: 结束员工 {db_employee_to_process.id} 的旧工作历史记录 ID {history_item.id}，end_date 设置为 {effective_date}")
                            new_job_history_entry = EmployeeJobHistory(
                                employee_id=db_employee_to_process.id,
                                department_id=db_employee_to_process.department_id,
                                position_id=db_employee_to_process.actual_position_id,
                                personnel_category_id=db_employee_to_process.personnel_category_id,
                                effective_date=effective_date,
                                end_date=None
                            )
                            db.add(new_job_history_entry)
                            logger.info(f"覆写模式: 为员工 {db_employee_to_process.id} 创建了新的工作历史记录，生效日期 {effective_date}")
                        else:
                            logger.warning(f"覆写模式: 员工 {db_employee_to_process.id} 职位相关变更但缺少关键信息，未创建工作历史。")
                    else:
                        logger.info(f"覆写模式: 员工 {db_employee_to_process.id} 职位相关信息无变更，不处理工作历史。")
                else: # Create new employee (db_employee_to_process was None initially)
                    logger.info(f"创建新员工: {emp_in.first_name} {emp_in.last_name}")
                    db_employee_to_process = Employee(**employee_orm_data)
                    db.add(db_employee_to_process)
                
                # This check is vital: if after create/update, db_employee_to_process is still None, something is wrong.
                # This should only happen if current_record_errors got populated inside this 'else' block (which it shouldn't)
                # or if db.add failed silently (unlikely for most DBs without flush and error).
                if not db_employee_to_process: 
                    current_record_errors.append("内部逻辑错误: 员工ORM对象在创建/更新后仍为空。")
                    logger.error(f"内部逻辑错误: 员工记录 {index} 的ORM对象在创建/更新后仍为空，即使没有预检查错误。")
                
                # Proceed with flush and sub-object creation only if no NEW errors AND db_employee_to_process is valid
                if not current_record_errors and db_employee_to_process: # Ensure no errors so far from this block AND instance is valid
                    db.flush() 
                    record_result.success_employee_id = db_employee_to_process.id

                    if bank_name and bank_account_number:
                        primary_bank_account = db.query(EmployeeBankAccount).filter(
                            EmployeeBankAccount.employee_id == db_employee_to_process.id,
                            EmployeeBankAccount.is_primary == True
                        ).first()
                        if primary_bank_account:
                            primary_bank_account.bank_name = bank_name
                            primary_bank_account.account_number = bank_account_number
                            primary_bank_account.account_holder_name = f"{emp_in.last_name} {emp_in.first_name}".strip()
                            logger.info(f"更新了员工 {db_employee_to_process.id} 的银行账户信息。")
                        else:
                            new_bank_account = EmployeeBankAccount(
                                employee_id=db_employee_to_process.id,
                                bank_name=bank_name,
                                account_number=bank_account_number,
                                account_holder_name=f"{emp_in.last_name} {emp_in.first_name}".strip(),
                                is_primary=True
                            )
                            db.add(new_bank_account)
                            logger.info(f"为员工 {db_employee_to_process.id} 创建了新的银行账户信息。")
                    
                    if emp_in.appraisals is not None:
                        db.query(EmployeeAppraisal).filter(EmployeeAppraisal.employee_id == db_employee_to_process.id).delete(synchronize_session=False)
                        if emp_in.appraisals:
                            for appraisal_data_pydantic in emp_in.appraisals:
                                appraisal_dict = appraisal_data_pydantic.model_dump(exclude_unset=True, exclude={'id', 'employee_id'})
                                db_appraisal = EmployeeAppraisal(**appraisal_dict, employee_id=db_employee_to_process.id)
                                db.add(db_appraisal)
                            logger.info(f"为员工 {db_employee_to_process.id} 添加/更新了 {len(emp_in.appraisals)} 条年度考核记录。")
                        else:
                            logger.info(f"为员工 {db_employee_to_process.id} 删除了所有年度考核记录。")

                    if is_new_employee_creation: 
                        logger.info(f"尝试为新员工 {db_employee_to_process.id} 创建初始工作历史记录")
                        if db_employee_to_process.actual_position_id and db_employee_to_process.department_id and db_employee_to_process.personnel_category_id:
                            from datetime import date
                            today = date.today()
                            effective_date_initial = db_employee_to_process.current_position_start_date or db_employee_to_process.hire_date or today
                            if not db_employee_to_process.career_position_level_date:
                                db_employee_to_process.career_position_level_date = effective_date_initial
                            initial_job_history = EmployeeJobHistory(
                                employee_id=db_employee_to_process.id,
                                department_id=db_employee_to_process.department_id,
                                position_id=db_employee_to_process.actual_position_id,
                                personnel_category_id=db_employee_to_process.personnel_category_id,
                                effective_date=effective_date_initial,
                                end_date=None
                            )
                            db.add(initial_job_history)
                            logger.info(f"为新员工 {db_employee_to_process.id} 创建了初始工作历史记录，生效日期 {effective_date_initial}")
                        else:
                            logger.warning(f"无法为新员工 {db_employee_to_process.id} 创建初始工作历史记录，缺少关键字段。")
                # else: # This means current_record_errors got populated (either pre-check or during this block)
                #    If errors occurred, they should already be in record_result.errors by now.
                #    The initial current_record_errors extend is at the top of the outer else.
                #    Any new errors from this block should also be appended.
                #    The original: if current_record_errors: record_result.errors.extend(current_record_errors) will handle it later.
                #    It might be better to put that final extend inside this outer else block if it's specific to operations here.

            # This final check for current_record_errors handles errors from all stages for the current record.       
            if current_record_errors: 
                 record_result.errors.extend(list(set(current_record_errors))) # Use set to avoid duplicate error messages if any
            
            # 如果没有错误且成功创建了员工记录，则添加到成功列表
            if not record_result.errors and record_result.success_employee_id:
                successful_employee = get_employee(db, record_result.success_employee_id)
                if successful_employee:
                    created_employees.append(successful_employee)
                    logger.info(f"成功处理员工记录 {index+1}，ID: {record_result.success_employee_id}")
                else:
                    logger.warning(f"员工记录 {index+1} 创建成功但无法获取详情，ID: {record_result.success_employee_id}")
            
            # 如果有错误，收集失败记录信息
            if record_result.errors:
                failed_record = {
                    "original_index": index,
                    "employee_code": emp_in.employee_code,
                    "id_number": emp_in.id_number,
                    "first_name": emp_in.first_name,
                    "last_name": emp_in.last_name,
                    "errors": record_result.errors
                }
                failed_records.append(failed_record)
                logger.warning(f"员工记录 {index+1} 处理失败，错误: {record_result.errors}")

        except ValueError as ve:
            # 捕获并记录验证错误
            logger.error(f"处理第{index+1}条记录时发生ValueError异常: {ve}")
            failed_record = {
                "original_index": index,
                "employee_code": getattr(emp_in, 'employee_code', None),
                "id_number": getattr(emp_in, 'id_number', None),
                "first_name": getattr(emp_in, 'first_name', None),
                "last_name": getattr(emp_in, 'last_name', None),
                "errors": [f"验证错误: {str(ve)}"]
            }
            failed_records.append(failed_record)
        except Exception as e:
            # 捕获其他未预期的错误
            logger.error(f"处理第{index+1}条记录时发生未预期异常: {e}")
            failed_record = {
                "original_index": index,
                "employee_code": getattr(emp_in, 'employee_code', None),
                "id_number": getattr(emp_in, 'id_number', None),
                "first_name": getattr(emp_in, 'first_name', None),
                "last_name": getattr(emp_in, 'last_name', None),
                "errors": [f"系统错误: {str(e)}"]
            }
            failed_records.append(failed_record)

    # 提交更改并返回
    total_count = len(employees_in)
    success_count = len(created_employees)
    failed_count = len(failed_records)
    
    if failed_count > 0:
        logger.warning(f"批量员工创建部分成功。总计: {total_count}, 成功: {success_count}, 失败: {failed_count}")
    else:
        logger.info(f"批量员工创建完全成功，共创建/更新 {success_count} 条记录")
    
    db.commit()
    return created_employees, failed_records
