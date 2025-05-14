"""
查找值相关的API路由。
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any

from ..database import get_db_v2
from ..crud import config as crud
from ..pydantic_models.config import (
    LookupTypeCreate, LookupTypeUpdate, LookupType, LookupTypeListResponse,
    LookupValueCreate, LookupValueUpdate, LookupValue, LookupValueListResponse
)
from ...auth import get_current_user, require_role
from ..utils import create_error_response

router = APIRouter(
    prefix="/v2/lookup",
    tags=["v2 Lookup"],
)


# LookupType endpoints
@router.get("/types", response_model=LookupTypeListResponse)
async def get_lookup_types(
    search: Optional[str] = None,
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(10, ge=1, le=100, description="Page size"),
    db: Session = Depends(get_db_v2),
    current_user = Depends(get_current_user)
):
    """
    获取查找类型列表，支持分页和搜索。

    - **search**: 搜索关键字，可以匹配代码、名称或描述
    - **page**: 页码，从1开始
    - **size**: 每页记录数，最大100
    """
    try:
        # 计算跳过的记录数
        skip = (page - 1) * size

        # 获取查找类型列表
        lookup_types, total = crud.get_lookup_types(
            db=db,
            search=search,
            skip=skip,
            limit=size
        )

        # 计算总页数
        total_pages = (total + size - 1) // size if total > 0 else 1

        # 返回标准响应格式
        return {
            "data": lookup_types,
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


@router.get("/types/{lookup_type_id}", response_model=Dict[str, LookupType])
async def get_lookup_type(
    lookup_type_id: int,
    db: Session = Depends(get_db_v2),
    current_user = Depends(get_current_user)
):
    """
    根据ID获取查找类型详情。

    - **lookup_type_id**: 查找类型ID
    """
    try:
        # 获取查找类型
        lookup_type = crud.get_lookup_type(db, lookup_type_id)
        if not lookup_type:
            # 返回标准错误响应格式
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=create_error_response(
                    status_code=404,
                    message="Not Found",
                    details=f"Lookup type with ID {lookup_type_id} not found"
                )
            )

        # 返回标准响应格式
        return {"data": lookup_type}
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


@router.post("/types", response_model=Dict[str, LookupType], status_code=status.HTTP_201_CREATED)
async def create_lookup_type(
    lookup_type: LookupTypeCreate,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_role(["Super Admin", "Config Admin"]))
):
    """
    创建新查找类型。

    - 需要Super Admin或Config Admin角色
    """
    try:
        # 创建查找类型
        db_lookup_type = crud.create_lookup_type(db, lookup_type)

        # 返回标准响应格式
        return {"data": db_lookup_type}
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


@router.put("/types/{lookup_type_id}", response_model=Dict[str, LookupType])
async def update_lookup_type(
    lookup_type_id: int,
    lookup_type: LookupTypeUpdate,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_role(["Super Admin", "Config Admin"]))
):
    """
    更新查找类型信息。

    - **lookup_type_id**: 查找类型ID
    - 需要Super Admin或Config Admin角色
    """
    try:
        # 更新查找类型
        db_lookup_type = crud.update_lookup_type(db, lookup_type_id, lookup_type)
        if not db_lookup_type:
            # 返回标准错误响应格式
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=create_error_response(
                    status_code=404,
                    message="Not Found",
                    details=f"Lookup type with ID {lookup_type_id} not found"
                )
            )

        # 返回标准响应格式
        return {"data": db_lookup_type}
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


@router.delete("/types/{lookup_type_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_lookup_type(
    lookup_type_id: int,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_role(["Super Admin"]))
):
    """
    删除查找类型。

    - **lookup_type_id**: 查找类型ID
    - 需要Super Admin角色
    """
    try:
        # 删除查找类型
        success = crud.delete_lookup_type(db, lookup_type_id)
        if not success:
            # 返回标准错误响应格式
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=create_error_response(
                    status_code=404,
                    message="Not Found",
                    details=f"Lookup type with ID {lookup_type_id} not found"
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


# LookupValue endpoints
@router.get("/values", response_model=LookupValueListResponse)
async def get_lookup_values(
    lookup_type_id: Optional[int] = None,
    is_active: Optional[bool] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(10, ge=1, le=100, description="Page size"),
    db: Session = Depends(get_db_v2),
    current_user = Depends(get_current_user)
):
    """
    获取查找值列表，支持分页、搜索和过滤。

    - **lookup_type_id**: 查找类型ID，用于过滤特定类型的查找值
    - **is_active**: 是否激活，用于过滤激活或未激活的查找值
    - **search**: 搜索关键字，可以匹配代码、名称或描述
    - **page**: 页码，从1开始
    - **size**: 每页记录数，最大100
    """
    try:
        # 计算跳过的记录数
        skip = (page - 1) * size

        # 获取查找值列表
        lookup_values, total = crud.get_lookup_values(
            db=db,
            lookup_type_id=lookup_type_id,
            is_active=is_active,
            search=search,
            skip=skip,
            limit=size
        )

        # 计算总页数
        total_pages = (total + size - 1) // size if total > 0 else 1

        # 返回标准响应格式
        return {
            "data": lookup_values,
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


@router.get("/values/{lookup_value_id}", response_model=Dict[str, LookupValue])
async def get_lookup_value(
    lookup_value_id: int,
    db: Session = Depends(get_db_v2),
    current_user = Depends(get_current_user)
):
    """
    根据ID获取查找值详情。

    - **lookup_value_id**: 查找值ID
    """
    try:
        # 获取查找值
        lookup_value = crud.get_lookup_value(db, lookup_value_id)
        if not lookup_value:
            # 返回标准错误响应格式
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=create_error_response(
                    status_code=404,
                    message="Not Found",
                    details=f"Lookup value with ID {lookup_value_id} not found"
                )
            )

        # 返回标准响应格式
        return {"data": lookup_value}
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


@router.post("/values", response_model=Dict[str, LookupValue], status_code=status.HTTP_201_CREATED)
async def create_lookup_value(
    lookup_value: LookupValueCreate,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_role(["Super Admin", "Config Admin"]))
):
    """
    创建新查找值。

    - 需要Super Admin或Config Admin角色
    """
    try:
        # 创建查找值
        db_lookup_value = crud.create_lookup_value(db, lookup_value)

        # 返回标准响应格式
        return {"data": db_lookup_value}
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


@router.put("/values/{lookup_value_id}", response_model=Dict[str, LookupValue])
async def update_lookup_value(
    lookup_value_id: int,
    lookup_value: LookupValueUpdate,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_role(["Super Admin", "Config Admin"]))
):
    """
    更新查找值信息。

    - **lookup_value_id**: 查找值ID
    - 需要Super Admin或Config Admin角色
    """
    try:
        # 更新查找值
        db_lookup_value = crud.update_lookup_value(db, lookup_value_id, lookup_value)
        if not db_lookup_value:
            # 返回标准错误响应格式
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=create_error_response(
                    status_code=404,
                    message="Not Found",
                    details=f"Lookup value with ID {lookup_value_id} not found"
                )
            )

        # 返回标准响应格式
        return {"data": db_lookup_value}
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


@router.delete("/values/{lookup_value_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_lookup_value(
    lookup_value_id: int,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_role(["Super Admin"]))
):
    """
    删除查找值。

    - **lookup_value_id**: 查找值ID
    - 需要Super Admin角色
    """
    try:
        # 删除查找值
        success = crud.delete_lookup_value(db, lookup_value_id)
        if not success:
            # 返回标准错误响应格式
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=create_error_response(
                    status_code=404,
                    message="Not Found",
                    details=f"Lookup value with ID {lookup_value_id} not found"
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
