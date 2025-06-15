"""
员工批量操作相关的CRUD操作。
"""
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
import logging
from datetime import date

from ...models.hr import (
    Employee, EmployeeBankAccount, Department, Position, PersonnelCategory
)
from ...models.config import LookupValue, LookupType
from ...pydantic_models.hr import (
    EmployeeBatchImportItem, EmployeeBatchValidationResult, 
    EmployeeBatchValidationError, EmployeeBatchValidationWarning
)
from .utils import (
    _get_department_by_name, 
    _get_position_by_name, 
    _get_personnel_category_by_name, 
    _resolve_lookup_id
)
from .employee import get_employee_by_code, get_employee_by_id_number
from .employee_create import create_employee
from .employee_update import update_employee

logger = logging.getLogger(__name__)


async def batch_validate_employees(
    db: Session, 
    employees_data: List[EmployeeBatchImportItem],
    overwrite_mode: str = "append"
) -> List[EmployeeBatchValidationResult]:
    """
    批量验证员工数据
    
    Args:
        db: 数据库会话
        employees_data: 员工数据列表
        overwrite_mode: 覆盖模式
        
    Returns:
        验证结果列表
    """
    logger.info(f"开始批量验证 {len(employees_data)} 条员工数据")
    
    validation_results = []
    
    for index, employee_data in enumerate(employees_data):
        try:
            result = await _validate_single_employee(
                db, employee_data, index, overwrite_mode
            )
            validation_results.append(result)
        except Exception as e:
            logger.error(f"验证第 {index + 1} 条员工数据时发生错误: {e}")
            # 创建错误结果
            error_result = EmployeeBatchValidationResult(
                client_id=employee_data.client_id,
                is_valid=False,
                errors=[EmployeeBatchValidationError(
                    field="general",
                    message=f"验证过程中发生错误: {str(e)}"
                )],
                warnings=[]
            )
            validation_results.append(error_result)
    
    logger.info(f"员工数据验证完成，共验证 {len(validation_results)} 条记录")
    return validation_results


async def _validate_single_employee(
    db: Session,
    employee_data: EmployeeBatchImportItem,
    index: int,
    overwrite_mode: str
) -> EmployeeBatchValidationResult:
    """
    验证单个员工数据
    """
    errors = []
    warnings = []
    employee_id = None
    
    # 1. 验证必填字段
    if not employee_data.first_name:
        errors.append(EmployeeBatchValidationError(
            field="first_name", message="名字不能为空"
        ))
    
    if not employee_data.last_name:
        errors.append(EmployeeBatchValidationError(
            field="last_name", message="姓氏不能为空"
        ))
    
    if not employee_data.hire_date:
        errors.append(EmployeeBatchValidationError(
            field="hire_date", message="入职日期不能为空"
        ))
    
    # 2. 验证身份证号格式
    if employee_data.id_number:
        if not _validate_id_number(employee_data.id_number):
            errors.append(EmployeeBatchValidationError(
                field="id_number", message="身份证号格式不正确"
            ))
    
    # 3. 验证邮箱格式
    if employee_data.email:
        if not _validate_email(str(employee_data.email)):
            errors.append(EmployeeBatchValidationError(
                field="email", message="邮箱格式不正确"
            ))
    
    # 4. 检查重复记录
    existing_employee = None
    
    # 通过员工编号检查
    if employee_data.employee_code:
        existing_by_code = get_employee_by_code(db, employee_data.employee_code)
        if existing_by_code:
            existing_employee = existing_by_code
            employee_id = existing_by_code.id
            if overwrite_mode == "append":
                warnings.append(EmployeeBatchValidationWarning(
                    field="employee_code", 
                    message=f"员工编号 {employee_data.employee_code} 已存在，将更新现有记录"
                ))
    
    # 通过身份证号检查
    if employee_data.id_number and not existing_employee:
        existing_by_id = get_employee_by_id_number(db, employee_data.id_number)
        if existing_by_id:
            existing_employee = existing_by_id
            employee_id = existing_by_id.id
            if overwrite_mode == "append":
                warnings.append(EmployeeBatchValidationWarning(
                    field="id_number", 
                    message=f"身份证号 {employee_data.id_number} 已存在，将更新现有记录"
                ))
    
    # 5. 验证字典值
    _validate_lookup_values(db, employee_data, errors, warnings)
    
    # 6. 验证关联数据
    _validate_relations(db, employee_data, errors, warnings)
    
    # 7. 验证日期逻辑
    _validate_dates(employee_data, errors, warnings)
    
    # 确定是否有效
    is_valid = len(errors) == 0
    
    return EmployeeBatchValidationResult(
        client_id=employee_data.client_id,
        is_valid=is_valid,
        errors=errors,
        warnings=warnings,
        employee_id=employee_id
    )


def _validate_id_number(id_number: str) -> bool:
    """验证身份证号格式"""
    import re
    # 18位身份证号码正则表达式
    pattern = r'^\d{17}[\dXx]$'
    return bool(re.match(pattern, id_number))


def _validate_email(email: str) -> bool:
    """验证邮箱格式"""
    import re
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))


def _validate_lookup_values(
    db: Session,
    employee_data: EmployeeBatchImportItem,
    errors: List[EmployeeBatchValidationError],
    warnings: List[EmployeeBatchValidationWarning]
) -> None:
    """验证字典值"""
    lookup_fields = [
        ("gender_name", "GENDER", "性别"),
        ("employee_status", "EMPLOYEE_STATUS", "员工状态"),
        ("employment_type_name", "EMPLOYMENT_TYPE", "雇佣类型"),
        ("education_level_name", "EDUCATION_LEVEL", "教育水平"),
        ("marital_status_name", "MARITAL_STATUS", "婚姻状况"),
        ("political_status_name", "POLITICAL_STATUS", "政治面貌"),
        ("contract_type_name", "CONTRACT_TYPE", "合同类型"),
        ("job_position_level_name", "JOB_POSITION_LEVEL", "职务级别"),
        ("salary_level_name", "SALARY_LEVEL", "工资级别"),
        ("salary_grade_name", "SALARY_GRADE", "工资档次"),
    ]
    
    for field_name, lookup_type, display_name in lookup_fields:
        field_value = getattr(employee_data, field_name, None)
        if field_value:
            lookup_id = _resolve_lookup_id(db, field_value, lookup_type)
            if lookup_id is None:
                errors.append(EmployeeBatchValidationError(
                    field=field_name,
                    message=f"{display_name} '{field_value}' 不存在或无效"
                ))


def _validate_relations(
    db: Session,
    employee_data: EmployeeBatchImportItem,
    errors: List[EmployeeBatchValidationError],
    warnings: List[EmployeeBatchValidationWarning]
) -> None:
    """验证关联数据"""
    # 验证部门
    if employee_data.department_name:
        dept = _get_department_by_name(db, employee_data.department_name)
        if not dept:
            errors.append(EmployeeBatchValidationError(
                field="department_name",
                message=f"部门 '{employee_data.department_name}' 不存在"
            ))
    
    # 验证职位
    if employee_data.position_name:
        pos = _get_position_by_name(db, employee_data.position_name)
        if not pos:
            errors.append(EmployeeBatchValidationError(
                field="position_name",
                message=f"职位 '{employee_data.position_name}' 不存在"
            ))
    
    # 验证人员类别
    if employee_data.personnel_category_name:
        pc = _get_personnel_category_by_name(db, employee_data.personnel_category_name)
        if not pc:
            errors.append(EmployeeBatchValidationError(
                field="personnel_category_name",
                message=f"人员类别 '{employee_data.personnel_category_name}' 不存在"
            ))


def _validate_dates(
    employee_data: EmployeeBatchImportItem,
    errors: List[EmployeeBatchValidationError],
    warnings: List[EmployeeBatchValidationWarning]
) -> None:
    """验证日期逻辑"""
    today = date.today()
    
    # 验证出生日期
    if employee_data.date_of_birth:
        if employee_data.date_of_birth > today:
            errors.append(EmployeeBatchValidationError(
                field="date_of_birth",
                message="出生日期不能晚于今天"
            ))
        
        # 检查年龄是否合理（16-100岁）
        age = (today - employee_data.date_of_birth).days // 365
        if age < 16:
            warnings.append(EmployeeBatchValidationWarning(
                field="date_of_birth",
                message="员工年龄小于16岁，请确认是否正确"
            ))
        elif age > 100:
            warnings.append(EmployeeBatchValidationWarning(
                field="date_of_birth",
                message="员工年龄超过100岁，请确认是否正确"
            ))
    
    # 验证入职日期
    if employee_data.hire_date:
        if employee_data.hire_date > today:
            warnings.append(EmployeeBatchValidationWarning(
                field="hire_date",
                message="入职日期晚于今天，请确认是否正确"
            ))
    
    # 验证首次工作日期
    if employee_data.first_work_date and employee_data.hire_date:
        if employee_data.first_work_date > employee_data.hire_date:
            warnings.append(EmployeeBatchValidationWarning(
                field="first_work_date",
                message="首次工作日期晚于入职日期，请确认是否正确"
            ))


async def batch_import_employees(
    db: Session,
    employees_data: List[EmployeeBatchImportItem],
    overwrite_mode: str = "append"
) -> Dict[str, Any]:
    """
    批量导入员工数据
    
    Args:
        db: 数据库会话
        employees_data: 员工数据列表
        overwrite_mode: 覆盖模式
        
    Returns:
        导入结果字典
    """
    logger.info(f"开始批量导入 {len(employees_data)} 条员工数据")
    
    success_count = 0
    error_count = 0
    errors = []
    
    for index, employee_data in enumerate(employees_data):
        try:
            # 先验证数据
            validation_result = await _validate_single_employee(
                db, employee_data, index, overwrite_mode
            )
            
            if not validation_result.is_valid:
                error_count += 1
                error_messages = [error.message for error in validation_result.errors]
                errors.append({
                    "index": index + 1,
                    "client_id": employee_data.client_id,
                    "employee_name": f"{employee_data.last_name or ''}{employee_data.first_name or ''}",
                    "errors": error_messages
                })
                continue
            
            # 转换为EmployeeCreate格式
            employee_create_data = _convert_to_employee_create(employee_data)
            
            # 检查是否需要更新现有员工
            existing_employee = None
            if employee_data.employee_code:
                existing_employee = get_employee_by_code(db, employee_data.employee_code)
            elif employee_data.id_number:
                existing_employee = get_employee_by_id_number(db, employee_data.id_number)
            
            if existing_employee and overwrite_mode in ["replace", "append"]:
                # 更新现有员工
                from ...pydantic_models.hr import EmployeeUpdate
                employee_update_data = EmployeeUpdate(**employee_create_data.model_dump(exclude_none=True))
                update_employee(db, existing_employee.id, employee_update_data)
                logger.info(f"更新员工成功: {existing_employee.id}")
            else:
                # 创建新员工
                create_employee(db, employee_create_data)
                logger.info(f"创建员工成功: 第 {index + 1} 条记录")
            
            success_count += 1
            
        except Exception as e:
            error_count += 1
            logger.error(f"导入第 {index + 1} 条员工数据时发生错误: {e}")
            errors.append({
                "index": index + 1,
                "client_id": employee_data.client_id,
                "employee_name": f"{employee_data.last_name or ''}{employee_data.first_name or ''}",
                "errors": [str(e)]
            })
    
    result = {
        "success_count": success_count,
        "error_count": error_count,
        "message": f"批量导入完成：成功 {success_count} 条，失败 {error_count} 条",
        "details": {
            "total_records": len(employees_data),
            "errors": errors
        }
    }
    
    logger.info(f"员工数据批量导入完成: {result['message']}")
    return result


def _convert_to_employee_create(employee_data: EmployeeBatchImportItem):
    """将批量导入数据转换为EmployeeCreate格式"""
    from ...pydantic_models.hr import EmployeeCreate
    
    # 构建创建数据
    create_data = {}
    
    # 基础字段
    if employee_data.employee_code:
        create_data["employee_code"] = employee_data.employee_code
    if employee_data.first_name:
        create_data["first_name"] = employee_data.first_name
    if employee_data.last_name:
        create_data["last_name"] = employee_data.last_name
    if employee_data.id_number:
        create_data["id_number"] = employee_data.id_number
    if employee_data.hire_date:
        create_data["hire_date"] = employee_data.hire_date
    
    # 个人信息字段
    if employee_data.date_of_birth:
        create_data["date_of_birth"] = employee_data.date_of_birth
    if employee_data.nationality:
        create_data["nationality"] = employee_data.nationality
    if employee_data.ethnicity:
        create_data["ethnicity"] = employee_data.ethnicity
    if employee_data.email:
        create_data["email"] = employee_data.email
    if employee_data.phone_number:
        create_data["phone_number"] = employee_data.phone_number
    if employee_data.home_address:
        create_data["home_address"] = employee_data.home_address
    if employee_data.emergency_contact_name:
        create_data["emergency_contact_name"] = employee_data.emergency_contact_name
    if employee_data.emergency_contact_phone:
        create_data["emergency_contact_phone"] = employee_data.emergency_contact_phone
    
    # 工作信息字段
    if employee_data.first_work_date:
        create_data["first_work_date"] = employee_data.first_work_date
    if employee_data.current_position_start_date:
        create_data["current_position_start_date"] = employee_data.current_position_start_date
    if employee_data.career_position_level_date:
        create_data["career_position_level_date"] = employee_data.career_position_level_date
    if employee_data.interrupted_service_years:
        create_data["interrupted_service_years"] = employee_data.interrupted_service_years
    if employee_data.social_security_client_number:
        create_data["social_security_client_number"] = employee_data.social_security_client_number
    
    # 银行账户字段
    if employee_data.bank_name:
        create_data["bank_name"] = employee_data.bank_name
    if employee_data.bank_account_number:
        create_data["bank_account_number"] = employee_data.bank_account_number
    
    # 字典值字段（通过名称）
    if employee_data.gender_name:
        create_data["gender_lookup_value_name"] = employee_data.gender_name
    if employee_data.employee_status:
        create_data["status_lookup_value_name"] = employee_data.employee_status
    if employee_data.employment_type_name:
        create_data["employment_type_lookup_value_name"] = employee_data.employment_type_name
    if employee_data.education_level_name:
        create_data["education_level_lookup_value_name"] = employee_data.education_level_name
    if employee_data.marital_status_name:
        create_data["marital_status_lookup_value_name"] = employee_data.marital_status_name
    if employee_data.political_status_name:
        create_data["political_status_lookup_value_name"] = employee_data.political_status_name
    if employee_data.contract_type_name:
        create_data["contract_type_lookup_value_name"] = employee_data.contract_type_name
    if employee_data.job_position_level_name:
        create_data["job_position_level_lookup_value_name"] = employee_data.job_position_level_name
    if employee_data.salary_level_name:
        create_data["salary_level_lookup_value_name"] = employee_data.salary_level_name
    if employee_data.salary_grade_name:
        create_data["salary_grade_lookup_value_name"] = employee_data.salary_grade_name
    
    # 关联字段（通过名称）
    if employee_data.department_name:
        create_data["department_name"] = employee_data.department_name
    if employee_data.position_name:
        create_data["position_name"] = employee_data.position_name
    if employee_data.personnel_category_name:
        create_data["personnel_category_name"] = employee_data.personnel_category_name
    
    return EmployeeCreate(**create_data) 