"""
员工创建相关的CRUD操作。
"""
from sqlalchemy.orm import Session
from typing import Optional
import logging
from datetime import date

from ...models.hr import (
    Employee, EmployeeJobHistory, EmployeeAppraisal, 
    EmployeeBankAccount
)
from ...pydantic_models.hr import EmployeeCreate
from .utils import (
    _get_department_by_name, 
    _get_position_by_name, 
    _get_personnel_category_by_name, 
    _resolve_lookup_id
)
from .employee import get_employee, get_employee_by_code, get_employee_by_id_number

logger = logging.getLogger(__name__)


def create_employee(db: Session, employee: EmployeeCreate) -> Employee:
    """
    创建员工。

    Args:
        db: 数据库会话
        employee: 员工创建模型

    Returns:
        创建的员工对象
    """
    # 检查员工代码是否已存在
    existing_code = get_employee_by_code(db, employee.employee_code)
    if existing_code:
        raise ValueError(f"Employee with code '{employee.employee_code}' already exists")

    # 如果提供了身份证号，检查是否已存在
    if employee.id_number:
        existing_id = get_employee_by_id_number(db, employee.id_number)
        if existing_id:
            raise ValueError(f"Employee with ID number '{employee.id_number}' already exists")

    # 保存银行信息以便稍后创建银行账户记录
    bank_name = employee.bank_name
    bank_account_number = employee.bank_account_number

    # 从 Pydantic 模型提取员工数据，排除不属于 Employee 模型的字段
    fields_to_exclude = {
        "appraisals", 
        "bank_name",
        "bank_account_number",
        # 排除其他用于解析的名称字段
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
        "salary_level_lookup_value_name",
        "salary_grade_lookup_value_name",
        "ref_salary_level_lookup_value_name"
    }
    
    employee_data = employee.model_dump(exclude_none=True, exclude=fields_to_exclude)

    # 处理lookup fields，将名称转换为ID
    # 必须处理status_lookup_value_name，因为status_lookup_value_id是必填字段
    if not employee_data.get('status_lookup_value_id') and employee.status_lookup_value_name:
        status_id = _resolve_lookup_id(db, employee.status_lookup_value_name, "EMPLOYEE_STATUS")
        if status_id is None:
            raise ValueError(f"Status '{employee.status_lookup_value_name}' could not be resolved or is missing.")
        employee_data['status_lookup_value_id'] = status_id
    
    # 处理其他可选lookup fields
    if not employee_data.get('gender_lookup_value_id') and employee.gender_lookup_value_name:
        employee_data['gender_lookup_value_id'] = _resolve_lookup_id(db, employee.gender_lookup_value_name, "GENDER")
    
    if not employee_data.get('employment_type_lookup_value_id') and employee.employment_type_lookup_value_name:
        employee_data['employment_type_lookup_value_id'] = _resolve_lookup_id(db, employee.employment_type_lookup_value_name, "EMPLOYMENT_TYPE")
    
    if not employee_data.get('education_level_lookup_value_id') and employee.education_level_lookup_value_name:
        employee_data['education_level_lookup_value_id'] = _resolve_lookup_id(db, employee.education_level_lookup_value_name, "EDUCATION_LEVEL")
    
    if not employee_data.get('marital_status_lookup_value_id') and employee.marital_status_lookup_value_name:
        employee_data['marital_status_lookup_value_id'] = _resolve_lookup_id(db, employee.marital_status_lookup_value_name, "MARITAL_STATUS")
    
    if not employee_data.get('political_status_lookup_value_id') and employee.political_status_lookup_value_name:
        employee_data['political_status_lookup_value_id'] = _resolve_lookup_id(db, employee.political_status_lookup_value_name, "POLITICAL_STATUS")
    
    if not employee_data.get('contract_type_lookup_value_id') and employee.contract_type_lookup_value_name:
        employee_data['contract_type_lookup_value_id'] = _resolve_lookup_id(db, employee.contract_type_lookup_value_name, "CONTRACT_TYPE")
    
    # 处理职务级别
    if not employee_data.get('job_position_level_lookup_value_id') and employee.job_position_level_lookup_value_name:
        employee_data['job_position_level_lookup_value_id'] = _resolve_lookup_id(db, employee.job_position_level_lookup_value_name, "JOB_POSITION_LEVEL")

    # 处理薪资级别相关字段
    if not employee_data.get('salary_level_lookup_value_id') and employee.salary_level_lookup_value_name:
        employee_data['salary_level_lookup_value_id'] = _resolve_lookup_id(db, employee.salary_level_lookup_value_name, "SALARY_LEVEL")

    if not employee_data.get('salary_grade_lookup_value_id') and employee.salary_grade_lookup_value_name:
        employee_data['salary_grade_lookup_value_id'] = _resolve_lookup_id(db, employee.salary_grade_lookup_value_name, "SALARY_GRADE")

    if not employee_data.get('ref_salary_level_lookup_value_id') and employee.ref_salary_level_lookup_value_name:
        employee_data['ref_salary_level_lookup_value_id'] = _resolve_lookup_id(db, employee.ref_salary_level_lookup_value_name, "REF_SALARY_LEVEL")
    
    # 处理department和position
    logger.debug(f"原始字段值 - 部门名称: '{employee.department_name}', 职位名称: '{employee.position_name}', 人员类别: '{employee.personnel_category_name}'")
    
    if employee.department_name:
        dept = _get_department_by_name(db, employee.department_name)
        if dept:
            employee_data['department_id'] = dept.id
            logger.debug(f"成功解析部门 '{employee.department_name}' 为ID: {dept.id}")
        else:
            logger.warning(f"无法找到部门 '{employee.department_name}'")
    elif "department_id" not in employee_data and employee.department_id is not None:
         employee_data["department_id"] = employee.department_id
         logger.debug(f"使用直接提供的部门ID: {employee.department_id}")

    if employee.position_name:
        pos = _get_position_by_name(db, employee.position_name)
        if pos:
            employee_data["actual_position_id"] = pos.id
            logger.debug(f"成功解析职位 '{employee.position_name}' 为ID: {pos.id}")
        else:
            logger.warning(f"无法找到职位 '{employee.position_name}'")
    elif "actual_position_id" not in employee_data and employee.actual_position_id is not None:
         employee_data["actual_position_id"] = employee.actual_position_id
         logger.debug(f"使用直接提供的职位ID: {employee.actual_position_id}")
    
    # Resolve personnel category by name
    if employee.personnel_category_name:
        pc = _get_personnel_category_by_name(db, employee.personnel_category_name)
        if pc:
            employee_data["personnel_category_id"] = pc.id
            logger.debug(f"成功解析人员类别 '{employee.personnel_category_name}' 为ID: {pc.id}")
        else:
            logger.warning(f"无法找到人员类别 '{employee.personnel_category_name}'")
    elif "personnel_category_id" not in employee_data and employee.personnel_category_id is not None:
        employee_data["personnel_category_id"] = employee.personnel_category_id
        logger.debug(f"使用直接提供的人员类别ID: {employee.personnel_category_id}")

    db_employee = Employee(**employee_data)
    
    db.add(db_employee)
    # 先 flush 获取 employee ID，用于创建关联的记录
    try:
        db.flush() 
    except Exception as e:
        db.rollback()
        logger.error(f"Error flushing new employee: {e}")
        raise

    # 如果提供了银行信息，创建银行账户记录
    if bank_name and bank_account_number:
        try:
            # 创建银行账户记录
            bank_account = EmployeeBankAccount(
                employee_id=db_employee.id,
                bank_name=bank_name,
                account_number=bank_account_number,
                account_holder_name=f"{db_employee.last_name} {db_employee.first_name}".strip(),
                is_primary=True
            )
            db.add(bank_account)
            logger.info(f"Created bank account for employee {db_employee.id}: {bank_name}, {bank_account_number}")
        except Exception as e:
            db.rollback()
            logger.error(f"Error creating bank account for employee {db_employee.id}: {e}")
            raise ValueError(f"Failed to create bank account: {str(e)}")

    # 处理年度考核 appraisals (如果提供)
    if hasattr(employee, 'appraisals') and employee.appraisals:
        for appraisal_data in employee.appraisals:
            db_appraisal = EmployeeAppraisal(
                **appraisal_data.model_dump(), 
                employee_id=db_employee.id
            )
            db.add(db_appraisal)
    
    # 创建初始工作历史记录
    _create_initial_job_history(db, db_employee)

    db.commit()
    db.refresh(db_employee)
    # Re-query to load all relationships for the response
    return get_employee(db, db_employee.id)


def _create_initial_job_history(db: Session, db_employee: Employee) -> None:
    """创建员工的初始工作历史记录"""
    logger.info(f"尝试创建员工工作历史，员工ID: {db_employee.id}, 部门ID: {db_employee.department_id}, 职位ID: {db_employee.actual_position_id}, 人员类别ID: {db_employee.personnel_category_id}")
    
    if db_employee.actual_position_id and db_employee.department_id and db_employee.personnel_category_id:
        try:
            today = date.today()
            
            # 确定effective_date
            effective_date = db_employee.current_position_start_date or db_employee.hire_date or today
            
            # 如果不存在career_position_level_date，则将其设置为effective_date
            if not db_employee.career_position_level_date:
                db_employee.career_position_level_date = effective_date
            
            # 检查是否已存在相同有效日期的工作历史记录
            existing_history = db.query(EmployeeJobHistory).filter(
                EmployeeJobHistory.employee_id == db_employee.id,
                EmployeeJobHistory.effective_date == effective_date
            ).first()
            
            # 只有在不存在相同日期的记录时才创建新记录
            if not existing_history:
                # 创建新的工作历史记录
                try:
                    new_job_history = EmployeeJobHistory(
                        employee_id=db_employee.id,
                        department_id=db_employee.department_id,
                        position_id=db_employee.actual_position_id,
                        personnel_category_id=db_employee.personnel_category_id,
                        effective_date=effective_date,
                        end_date=None
                    )
                    db.add(new_job_history)
                    logger.info(f"Created job history record for employee {db_employee.id}: "
                                f"position change from {db_employee.actual_position_id} to {db_employee.actual_position_id} "
                                f"effective {effective_date}")
                except Exception as e:
                    logger.error(f"Error creating job history record for employee {db_employee.id}: {e}")
            else:
                # 如果已存在相同日期的记录，更新其信息
                existing_history.department_id = db_employee.department_id
                existing_history.position_id = db_employee.actual_position_id
                existing_history.personnel_category_id = db_employee.personnel_category_id
                existing_history.end_date = None
                logger.info(f"Updated existing job history record for employee {db_employee.id}: "
                            f"position updated to {db_employee.actual_position_id} "
                            f"effective {effective_date}")
        except Exception as e:
            logger.error(f"Error creating initial job history record for employee {db_employee.id}: {e}")
    elif db_employee.actual_position_id:
        # 当有职位但缺少部门或人员类别时记录警告
        missing_fields = []
        if not db_employee.department_id:
            missing_fields.append("department_id")
        if not db_employee.personnel_category_id:
            missing_fields.append("personnel_category_id")
        logger.warning(f"无法为员工 {db_employee.id} 创建工作历史记录，缺少必要字段: {', '.join(missing_fields)}") 