"""
员工相关的API路由。
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status, Path
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any, List
from datetime import datetime

import logging
logger = logging.getLogger(__name__)

from webapp.v2.database import get_db_v2
from webapp.v2.crud import hr as v2_hr_crud
from webapp.v2.pydantic_models.hr import EmployeeCreate, EmployeeUpdate, Employee as EmployeeResponseSchema, EmployeeListResponse, EmployeeWithNames
from webapp import auth
from webapp.v2.pydantic_models import security as v2_security_schemas
from webapp.v2.utils import create_error_response
from fastapi.security import HTTPAuthorizationCredentials

# For Test 8 (Commented out as it's old test code)
# def local_factory_using_imported_get_current_user(required_permission: str = "P_EMPLOYEE_VIEW_DETAIL"): 
# ... (rest of old Test 8 code commented or removed)

# For Test 11: Simplified local factory (Commented out as it's old test code)
# def simplified_local_permission_factory():
# ... (rest of old Test 11 code commented or removed)

router = APIRouter(
    prefix="/employees",
    tags=["Employees"],
)


@router.get("/", response_model=EmployeeListResponse)
async def get_employees(
    search: Optional[str] = None,
    status_id: Optional[int] = None,
    department_id: Optional[int] = None,
    ids: Optional[str] = Query(None, description="逗号分隔的员工ID列表，用于批量获取指定员工"),
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(10, ge=1, le=100, description="Page size"),
    db: Session = Depends(get_db_v2),
    current_user = Depends(auth.require_permissions(["P_EMPLOYEE_VIEW_LIST"]))
):
    """
    获取员工列表，支持分页、搜索和过滤。
    
    - **search**: 搜索关键字，可以匹配员工代码、姓名、身份证号、邮箱、电话号码、部门名称或职位名称
    - **status_id**: 员工状态ID，用于过滤特定状态的员工
    - **department_id**: 部门ID，用于过滤特定部门的员工
    - **ids**: 逗号分隔的员工ID列表，用于批量获取指定员工，例如"1,2,3"
    - **page**: 页码，从1开始
    - **size**: 每页记录数，最大100
    """
    logger.info(f"Received request for /employees with page: {page}, size: {size}, search: '{search}', status_id: {status_id}, department_id: {department_id}, ids: '{ids}'")
    try:
        # 解析ids参数
        employee_ids = None
        if ids:
            try:
                employee_ids = [int(id_str.strip()) for id_str in ids.split(',') if id_str.strip()]
                # 限制批量获取的员工数量，避免过大的请求
                if len(employee_ids) > 100:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=create_error_response(
                            status_code=400,
                            message="Bad Request",
                            details="Too many employee IDs requested. Maximum is 100."
                        )
                    )
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=create_error_response(
                        status_code=400,
                        message="Bad Request",
                        details="Invalid employee ID format in 'ids' parameter."
                    )
                )
        
        # 计算跳过的记录数 (仅在不使用ids时应用分页)
        skip = (page - 1) * size if not employee_ids else 0
        
        # 获取员工列表和总数
        # v2_hr_crud.get_employees now returns Tuple[List[ORM_Employee], int]
        if employee_ids:
            # 如果提供了employee_ids，则直接获取这些ID的员工
            employees_orms = []
            for emp_id in employee_ids:
                emp = v2_hr_crud.get_employee(db=db, employee_id=emp_id)
                if emp:
                    employees_orms.append(emp)
            total = len(employees_orms)
        else:
            employees_orms, total = v2_hr_crud.get_employees(
                db=db,
                search=search,
                status_id=status_id,
                department_id=department_id,
                skip=skip,
                limit=size
            )
        
        processed_employees: List[EmployeeWithNames] = []
        for emp_orm in employees_orms:
            # Validate ORM object against the base Pydantic Employee model
            # EmployeeResponseSchema is an alias for the Pydantic Employee model
            employee_pydantic = EmployeeResponseSchema.model_validate(emp_orm)
            
            # Get names from related objects (handle None cases)
            dept_name = emp_orm.current_department.name if emp_orm.current_department else None
            pc_name = emp_orm.personnel_category.name if emp_orm.personnel_category else None
            actual_pos_name = emp_orm.actual_position.name if emp_orm.actual_position else None
            
            # Process bank account information (similar to single employee API)
            primary_bank_account_orm = None
            if emp_orm.bank_accounts: # This is the relationship field on Employee ORM model
                # Attempt to find the primary bank account
                for acc_orm in emp_orm.bank_accounts:
                    if acc_orm.is_primary:
                        primary_bank_account_orm = acc_orm
                        break
                if not primary_bank_account_orm and emp_orm.bank_accounts: # If no primary, take the first one
                    primary_bank_account_orm = emp_orm.bank_accounts[0]

            # Get employee data as dict and add bank account information
            employee_data = employee_pydantic.model_dump()
            
            if primary_bank_account_orm:
                employee_data['bank_name'] = primary_bank_account_orm.bank_name
                employee_data['bank_account_number'] = primary_bank_account_orm.account_number
            else:
                # Ensure these are explicitly None if not found
                employee_data['bank_name'] = None
                employee_data['bank_account_number'] = None
            
            # 添加工资相关字段的名称填充
            employee_data['salary_level_lookup_value_name'] = emp_orm.salary_level.name if emp_orm.salary_level else None
            employee_data['salary_grade_lookup_value_name'] = emp_orm.salary_grade.name if emp_orm.salary_grade else None
            employee_data['ref_salary_level_lookup_value_name'] = emp_orm.ref_salary_level.name if emp_orm.ref_salary_level else None
            
            # Create EmployeeWithNames instance
            employee_with_names_instance = EmployeeWithNames(
                **employee_data, 
                departmentName=dept_name,
                personnelCategoryName=pc_name, # Corresponds to old job_title_name
                actualPositionName=actual_pos_name
            )
            processed_employees.append(employee_with_names_instance)

        # 计算总页数 (仅在不使用ids时有意义)
        total_pages = (total + size - 1) // size if total > 0 else 1
        
        logger.info(f"Responding to /employees request with total: {total}, totalPages: {total_pages}, page: {page}, size: {size}")
        # 返回标准响应格式
        return {
            "data": processed_employees,
            "meta": {
                "page": page if not employee_ids else 1,
                "size": size if not employee_ids else len(processed_employees),
                "total": total,
                "totalPages": total_pages if not employee_ids else 1
            }
        }
    except Exception as e:
        # Log the exception for server-side debugging
        logger.error(f"Error in get_employees endpoint: {e}", exc_info=True)
        # Return detailed error response for debugging (remove in production)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "status_code": 500,
                "message": "Internal Server Error while fetching employee list.",
                "details": str(e)
            }
        )


@router.get("/{employee_id}", response_model=EmployeeResponseSchema)
async def get_employee(
    employee_id: int = Path(..., title="The ID of the employee to get", ge=1),
    db: Session = Depends(get_db_v2),
    creds: Optional[HTTPAuthorizationCredentials] = Depends(auth.bearer_scheme)
):
    logger.info(f"$$$ DIRECT DEPENDENCY TEST: get_employee ROUTE for id: {employee_id} entered.")
    
    # Directly call the explicit auth check function from auth.py
    current_user = await auth.explicit_auth_check(
        db=db,
        credentials=creds,
        required_permissions=["P_EMPLOYEE_VIEW_DETAIL"]
    )

    # logger.info(f"$$$ DIRECT DEPENDENCY TEST: User '{current_user.username}' authenticated by explicit_auth_check. Permissions: {current_user.all_permission_codes}")

    employee_orm = v2_hr_crud.get_employee(db=db, employee_id=employee_id)
    
    if employee_orm is None:
        # logger.warning(f"DIRECT DEPENDENCY TEST: Employee with ID {employee_id} not found in DB.")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Employee with id {employee_id} not found")
    
    # logger.info(f"DIRECT DEPENDENCY TEST: Employee {employee_id} ({employee_orm.first_name} {employee_orm.last_name}) found. Preparing details.")

    # Initialize data from ORM model, Pydantic will pick up matching fields
    # The EmployeeResponseSchema (aliased as Employee) already has bank_name and bank_account_number as Optional fields.
    employee_data_for_response = EmployeeResponseSchema.model_validate(employee_orm).model_dump()

    # Fetch and add bank account details
    primary_bank_account_orm = None
    if employee_orm.bank_accounts: # This is the relationship field on Employee ORM model
        # Attempt to find the primary bank account
        for acc_orm in employee_orm.bank_accounts:
            if acc_orm.is_primary:
                primary_bank_account_orm = acc_orm
                break
        if not primary_bank_account_orm and employee_orm.bank_accounts: # If no primary, take the first one
            primary_bank_account_orm = employee_orm.bank_accounts[0]

    if primary_bank_account_orm:
        # logger.info(f"Found bank account for employee {employee_id}: Name='{primary_bank_account_orm.bank_name}', Number='{primary_bank_account_orm.account_number}'")
        employee_data_for_response['bank_name'] = primary_bank_account_orm.bank_name
        employee_data_for_response['bank_account_number'] = primary_bank_account_orm.account_number
    else:
        # logger.info(f"No bank account found or no primary bank account for employee {employee_id}. Bank details will be null.")
        # Ensure these are explicitly None if not found, though Pydantic model optionality should handle it.
        employee_data_for_response['bank_name'] = None
        employee_data_for_response['bank_account_number'] = None

    # logger.info(f"Returning employee data for employee {employee_id}: {employee_data_for_response}")
    return employee_data_for_response


@router.post("/", response_model=Dict[str, EmployeeResponseSchema], status_code=status.HTTP_201_CREATED)
async def create_employee(
    employee: EmployeeCreate,
    db: Session = Depends(get_db_v2),
    current_user = Depends(auth.require_permissions(["P_EMPLOYEE_CREATE"]))
):
    """
    创建新员工。
    
    - 需要SUPER_ADMIN或HR_ADMIN角色
    """
    try:
        # 创建员工
        db_employee = v2_hr_crud.create_employee(db, employee)
        
        # 返回标准响应格式
        return {"data": db_employee}
    except ValueError as e:
        # 返回标准错误响应格式
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=create_error_response(
                status_code=422,
                message="Unprocessable Entity",
                details=str(e)
            )
        )
    except Exception as e:
        logger.error(f"Error in create_employee endpoint: {e}", exc_info=True)
        # 返回标准错误响应格式
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="Internal Server Error",
                details=str(e)
            )
        )


@router.post("/bulk", response_model=Dict[str, List[EmployeeResponseSchema]], status_code=status.HTTP_201_CREATED)
async def create_bulk_employees_api(
    employees_in: List[EmployeeCreate],
    overwrite_mode: bool = Query(False, description="是否启用覆盖模式，允许更新已存在的员工记录"),
    db: Session = Depends(get_db_v2),
    current_user = Depends(auth.require_permissions(["P_EMPLOYEE_CREATE"]))
):
    """
    批量创建新员工。
    
    - 需要与创建单个员工相同的权限 (例如 P_EMPLOYEE_CREATE)。
    - 请求体应该是一个包含多个员工对象的JSON数组。
    - **overwrite_mode**: 如果设置为True，将允许更新已存在的员工记录（根据身份证号和员工代码匹配）。
    """
    if not employees_in:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=create_error_response(
                status_code=400,
                message="Bad Request",
                details="Input employee list cannot be empty."
            )
        )
    try:
        created_employees = v2_hr_crud.create_bulk_employees(db, employees_in, overwrite_mode)
        return {"data": created_employees}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=create_error_response(
                status_code=422,
                message="Unprocessable Entity during bulk creation",
                details=str(e)
            )
        )
    except Exception as e:
        logger.error(f"Error in create_bulk_employees_api endpoint: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="Internal Server Error during bulk creation",
                details=str(e)
            )
        )


@router.put("/{employee_id}", response_model=Dict[str, EmployeeResponseSchema])
async def update_employee(
    employee_id: int,
    employee: EmployeeUpdate,
    db: Session = Depends(get_db_v2),
    current_user = Depends(auth.require_permissions(["P_EMPLOYEE_UPDATE"]))
):
    """
    更新员工信息。
    
    - **employee_id**: 员工ID
    - 需要SUPER_ADMIN或HR_ADMIN角色
    """
    # logger.info(f"--- ROUTER LOG: update_employee ---")
    # logger.info(f"Received request to update employee_id: {employee_id}")
    # logger.info(f"Request body (EmployeeUpdate Pydantic model after validation): {employee.model_dump_json(indent=2)}")
    
    try:
        # 更新员工
        db_employee = v2_hr_crud.update_employee(db, employee_id, employee)
        if not db_employee:
            # 返回标准错误响应格式
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=create_error_response(
                    status_code=404,
                    message="Not Found",
                    details=f"Employee with ID {employee_id} not found"
                )
            )
        
        # 返回标准响应格式
        return {"data": db_employee}
    except ValueError as e:
        # 返回标准错误响应格式
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=create_error_response(
                status_code=422,
                message="Unprocessable Entity",
                details=str(e)
            )
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in update_employee endpoint: {e}", exc_info=True)
        # 返回标准错误响应格式
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="Internal Server Error",
                details=str(e)
            )
        )


@router.delete("/{employee_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_employee(
    employee_id: int,
    db: Session = Depends(get_db_v2),
    current_user = Depends(auth.require_permissions(["P_EMPLOYEE_DELETE"]))
):
    """
    删除员工。
    
    - **employee_id**: 员工ID
    - 需要SUPER_ADMIN角色
    """
    try:
        # 删除员工
        success = v2_hr_crud.delete_employee(db, employee_id)
        if not success:
            # 返回标准错误响应格式
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=create_error_response(
                    status_code=404,
                    message="Not Found",
                    details=f"Employee with ID {employee_id} not found"
                )
            )
        
        # 返回204 No Content
        return None
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in delete_employee endpoint: {e}", exc_info=True)
        # 返回标准错误响应格式
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="Internal Server Error",
                details=str(e)
            )
        )
