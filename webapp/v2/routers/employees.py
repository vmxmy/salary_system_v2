"""
员工相关的API路由。
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any

from ..database import get_db_v2
from ..crud import hr as crud
from ..pydantic_models.hr import EmployeeCreate, EmployeeUpdate, Employee, EmployeeListResponse
from ...auth import get_current_user, require_role
from ..utils import create_error_response

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
    current_user = Depends(get_current_user)
):
    """
    获取员工列表，支持分页、搜索和过滤。
    
    - **search**: 搜索关键字，可以匹配员工代码、姓名、身份证号、邮箱或电话号码
    - **status_id**: 员工状态ID，用于过滤特定状态的员工
    - **department_id**: 部门ID，用于过滤特定部门的员工
    - **page**: 页码，从1开始
    - **size**: 每页记录数，最大100
    """
    try:
        # 计算跳过的记录数
        skip = (page - 1) * size
        
        # 获取员工列表
        employees, total = crud.get_employees(
            db=db,
            search=search,
            status_id=status_id,
            department_id=department_id,
            skip=skip,
            limit=size
        )
        
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
        # 返回标准错误响应格式
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="Internal Server Error",
                details=str(e)
            )
        )


@router.get("/{employee_id}", response_model=Dict[str, Employee])
async def get_employee(
    employee_id: int,
    db: Session = Depends(get_db_v2),
    current_user = Depends(get_current_user)
):
    """
    根据ID获取员工详情。
    
    - **employee_id**: 员工ID
    """
    try:
        # 获取员工
        employee = crud.get_employee(db, employee_id)
        if not employee:
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
        return {"data": employee}
    except HTTPException:
        raise
    except Exception as e:
        # 返回标准错误响应格式
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="Internal Server Error",
                details=str(e)
            )
        )


@router.post("/", response_model=Dict[str, Employee], status_code=status.HTTP_201_CREATED)
async def create_employee(
    employee: EmployeeCreate,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_role(["Super Admin", "HR Admin"]))
):
    """
    创建新员工。
    
    - 需要Super Admin或HR Admin角色
    """
    try:
        # 创建员工
        db_employee = crud.create_employee(db, employee)
        
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
        # 返回标准错误响应格式
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="Internal Server Error",
                details=str(e)
            )
        )


@router.put("/{employee_id}", response_model=Dict[str, Employee])
async def update_employee(
    employee_id: int,
    employee: EmployeeUpdate,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_role(["Super Admin", "HR Admin"]))
):
    """
    更新员工信息。
    
    - **employee_id**: 员工ID
    - 需要Super Admin或HR Admin角色
    """
    try:
        # 更新员工
        db_employee = crud.update_employee(db, employee_id, employee)
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
    current_user = Depends(require_role(["Super Admin"]))
):
    """
    删除员工。
    
    - **employee_id**: 员工ID
    - 需要Super Admin角色
    """
    try:
        # 删除员工
        success = crud.delete_employee(db, employee_id)
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
        # 返回标准错误响应格式
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="Internal Server Error",
                details=str(e)
            )
        )
