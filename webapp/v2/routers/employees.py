"""
员工相关的API路由。
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status, Path
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any
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
    prefix="/v2/employees",
    tags=["v2 Employees"],
)


@router.get("/", response_model=EmployeeListResponse)
async def get_employees(
    search: Optional[str] = None,
    status_id: Optional[int] = None,
    department_id: Optional[int] = None,
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
    - **page**: 页码，从1开始
    - **size**: 每页记录数，最大100
    """
    try:
        # 计算跳过的记录数
        skip = (page - 1) * size
        
        # 获取员工列表和总数
        employees_data, total = v2_hr_crud.get_employees(
            db=db,
            search=search,
            status_id=status_id,
            department_id=department_id,
            skip=skip,
            limit=size
        )
        
        # Map the returned tuples to EmployeeWithNames Pydantic models
        employees = [
            EmployeeWithNames.model_validate(employee).model_copy(update={'departmentName': dept_name, 'positionName': job_title_name})
            for employee, dept_name, job_title_name in employees_data
        ]

        # 计算总页数
        total_pages = (total + size - 1) // size if total > 0 else 1
        
        # 返回标准响应格式
        return {
            "data": employees,
            "meta": {
                "page": page,
                "size": size,
                "total": total,
                "totalPages": total_pages
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

    logger.info(f"$$$ DIRECT DEPENDENCY TEST: User '{current_user.username}' authenticated by explicit_auth_check. Permissions: {current_user.all_permission_codes}")

    employee_orm_data = v2_hr_crud.get_employee(db=db, employee_id=employee_id)
    
    if employee_orm_data is None:
        logger.warning(f"DIRECT DEPENDENCY TEST: Employee with ID {employee_id} not found in DB.")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Employee with id {employee_id} not found")
    
    logger.info(f"DIRECT DEPENDENCY TEST: Employee {employee_id} ({employee_orm_data.first_name} {employee_orm_data.last_name}) found. Returning details.")
    return employee_orm_data


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
