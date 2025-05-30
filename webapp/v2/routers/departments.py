"""
部门相关的API路由。
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any

from ..database import get_db_v2
from ..crud import (
    get_departments as crud_get_departments,
    get_department as crud_get_department,
    create_department as crud_create_department,
    update_department as crud_update_department,
    delete_department as crud_delete_department
)
from ..pydantic_models.hr import DepartmentCreate, DepartmentUpdate, Department, DepartmentListResponse
from ..pydantic_models.common import DataResponse
from ...auth import require_permissions
from ..utils import create_error_response

router = APIRouter(
    prefix="/departments",
    tags=["Departments"],
)


@router.get("/", response_model=DepartmentListResponse)
async def get_departments(
    parent_id: Optional[int] = None,
    is_active: Optional[bool] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(10, ge=1, le=100, description="Page size"),
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["department:view"]))
):
    """
    获取部门列表，支持分页、搜索和过滤。
    
    - **parent_id**: 父部门ID，用于获取特定部门的子部门
    - **is_active**: 是否激活，用于过滤激活或未激活的部门
    - **search**: 搜索关键字，可以匹配部门代码或名称
    - **page**: 页码，从1开始
    - **size**: 每页记录数，最大100
    """
    try:
        # 计算跳过的记录数
        skip = (page - 1) * size
        
        # 获取部门列表
        departments, total = crud_get_departments(
            db=db,
            parent_id=parent_id,
            is_active=is_active,
            search=search,
            skip=skip,
            limit=size
        )
        
        # 计算总页数
        total_pages = (total + size - 1) // size if total > 0 else 1
        
        # 返回标准响应格式
        return {
            "data": departments,
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


@router.get("/{department_id}", response_model=DataResponse[Department])
async def get_department(
    department_id: int,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["department:view"]))
):
    """
    根据ID获取部门详情。
    
    - **department_id**: 部门ID
    """
    try:
        # 获取部门
        department = crud_get_department(db, department_id)
        if not department:
            # 返回标准错误响应格式
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=create_error_response(
                    status_code=404,
                    message="Not Found",
                    details=f"Department with ID {department_id} not found"
                )
            )
        
        # 返回标准响应格式
        return DataResponse[Department](data=department)
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


@router.post("/", response_model=DataResponse[Department], status_code=status.HTTP_201_CREATED)
async def create_department(
    department: DepartmentCreate,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["department:manage"]))
):
    """
    创建新部门。
    
    - 需要 department:manage 权限
    """
    try:
        # 创建部门
        db_department = crud_create_department(db, department)
        
        # 返回标准响应格式
        return DataResponse[Department](data=db_department)
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


@router.put("/{department_id}", response_model=DataResponse[Department])
async def update_department(
    department_id: int,
    department: DepartmentUpdate,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["department:manage"]))
):
    """
    更新部门信息。
    
    - **department_id**: 部门ID
    - 需要 department:manage 权限
    """
    try:
        # 更新部门
        db_department = crud_update_department(db, department_id, department)
        if not db_department:
            # 返回标准错误响应格式
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=create_error_response(
                    status_code=404,
                    message="Not Found",
                    details=f"Department with ID {department_id} not found"
                )
            )
        
        # 返回标准响应格式
        return DataResponse[Department](data=db_department)
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


@router.delete("/{department_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_department(
    department_id: int,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["department:manage"]))
):
    """
    删除部门。
    
    - **department_id**: 部门ID
    - 需要 department:manage 权限
    """
    try:
        # 删除部门
        success = crud_delete_department(db, department_id)
        if not success:
            # 返回标准错误响应格式
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=create_error_response(
                    status_code=404,
                    message="Not Found",
                    details=f"Department with ID {department_id} not found"
                )
            )
        
        # 返回204 No Content
        return None
    except ValueError as e:
        # 返回标准错误响应格式
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=create_error_response(
                status_code=409,
                message="Conflict",
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
