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
from ..pydantic_models.common import DataResponse
from ...auth import require_permissions
from ..utils import create_error_response
from sqlalchemy import text

router = APIRouter(
    prefix="/lookup",
    tags=["Lookup"],
)


# LookupType endpoints
@router.get("/types", response_model=LookupTypeListResponse)
async def get_lookup_types(
    search: Optional[str] = None,
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(10, ge=1, le=100, description="Page size"),
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["lookup_type:view"]))
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


@router.get("/types/{lookup_type_id}", response_model=DataResponse[LookupType])
async def get_lookup_type(
    lookup_type_id: int,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["lookup_type:view"]))
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
        return DataResponse[LookupType](data=lookup_type)
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


@router.post("/types", response_model=DataResponse[LookupType], status_code=status.HTTP_201_CREATED)
async def create_lookup_type(
    lookup_type: LookupTypeCreate,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["lookup_type:manage"]))
):
    """
    创建新查找类型。

    - 需要查找类型管理权限
    """
    try:
        # 创建查找类型
        db_lookup_type = crud.create_lookup_type(db, lookup_type)

        # 返回标准响应格式
        return DataResponse[LookupType](data=db_lookup_type)
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


@router.put("/types/{lookup_type_id}", response_model=DataResponse[LookupType])
async def update_lookup_type(
    lookup_type_id: int,
    lookup_type: LookupTypeUpdate,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["lookup_type:manage"]))
):
    """
    更新查找类型信息。

    - **lookup_type_id**: 查找类型ID
    - 需要查找类型管理权限
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
        return DataResponse[LookupType](data=db_lookup_type)
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
    current_user = Depends(require_permissions(["lookup_type:manage"]))
):
    """
    删除查找类型。

    - **lookup_type_id**: 查找类型ID
    - 需要查找类型管理权限
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
    type_code: Optional[str] = Query(None, description="Filter by lookup type code"),
    is_active: Optional[bool] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(10, ge=1, le=100, description="Page size"),
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["lookup_value:view"]))
):
    """
    获取查找值列表，支持分页、搜索和过滤。

    - **type_code**: 查找类型代码，用于过滤特定类型的查找值
    - **is_active**: 是否激活，用于过滤激活或未激活的查找值
    - **search**: 搜索关键字，可以匹配代码、名称或描述
    - **page**: 页码，从1开始
    - **size**: 每页记录数，最大100
    """
    try:
        if type_code:
            # 使用优化的 SQL 查询直接获取数据
            query = text("""
                SELECT 
                    lv.id,
                    lv.lookup_type_id,
                    lv.code,
                    lv.name,
                    lv.description,
                    lv.sort_order,
                    lv.is_active,
                    lv.parent_lookup_value_id
                FROM config.lookup_values lv
                JOIN config.lookup_types lt ON lv.lookup_type_id = lt.id
                WHERE lt.code = :type_code
                AND (:is_active IS NULL OR lv.is_active = :is_active)
                AND (:search IS NULL OR 
                     lv.code ILIKE :search_pattern OR 
                     lv.name ILIKE :search_pattern OR 
                     lv.description ILIKE :search_pattern)
                ORDER BY lv.sort_order, lv.code
                LIMIT :limit OFFSET :offset
            """)
            
            count_query = text("""
                SELECT COUNT(*)
                FROM config.lookup_values lv
                JOIN config.lookup_types lt ON lv.lookup_type_id = lt.id
                WHERE lt.code = :type_code
                AND (:is_active IS NULL OR lv.is_active = :is_active)
                AND (:search IS NULL OR 
                     lv.code ILIKE :search_pattern OR 
                     lv.name ILIKE :search_pattern OR 
                     lv.description ILIKE :search_pattern)
            """)
            
            # 准备参数
            search_pattern = f"%{search}%" if search else None
            skip = (page - 1) * size
            
            params = {
                'type_code': type_code,
                'is_active': is_active,
                'search': search,
                'search_pattern': search_pattern,
                'limit': size,
                'offset': skip
            }
            
            # 执行查询
            result = db.execute(query, params)
            lookup_values_data = [dict(row._mapping) for row in result]
            
            # 获取总数
            count_result = db.execute(count_query, params)
            total = count_result.scalar()
            
            # 转换为 Pydantic 模型
            lookup_values = []
            for item in lookup_values_data:
                lookup_values.append(LookupValue(
                    id=item['id'],
                    lookup_type_id=item['lookup_type_id'],
                    code=item['code'],
                    name=item['name'],
                    description=item.get('description'),
                    sort_order=item.get('sort_order', 0),
                    is_active=item.get('is_active', True),
                    parent_lookup_value_id=item.get('parent_lookup_value_id')
                ))
        else:
            # 如果没有指定类型代码，回退到 CRUD 方法
            skip = (page - 1) * size
            lookup_values, total = crud.get_lookup_values(
                db=db,
                lookup_type_id=None,
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


@router.get("/values/{lookup_value_id}", response_model=DataResponse[LookupValue])
async def get_lookup_value(
    lookup_value_id: int,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["lookup_value:view"]))
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
        return DataResponse[LookupValue](data=lookup_value)
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


@router.post("/values", response_model=DataResponse[LookupValue], status_code=status.HTTP_201_CREATED)
async def create_lookup_value(
    lookup_value: LookupValueCreate,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["lookup_value:manage"]))
):
    """
    创建新查找值。

    - 需要查找值管理权限
    """
    try:
        # 创建查找值
        db_lookup_value = crud.create_lookup_value(db, lookup_value)

        # 返回标准响应格式
        return DataResponse[LookupValue](data=db_lookup_value)
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


@router.put("/values/{lookup_value_id}", response_model=DataResponse[LookupValue])
async def update_lookup_value(
    lookup_value_id: int,
    lookup_value: LookupValueUpdate,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["lookup_value:manage"]))
):
    """
    更新查找值信息。

    - **lookup_value_id**: 查找值ID
    - 需要查找值管理权限
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
        return DataResponse[LookupValue](data=db_lookup_value)
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
    current_user = Depends(require_permissions(["lookup_value:manage"]))
):
    """
    删除查找值。

    - **lookup_value_id**: 查找值ID
    - 需要查找值管理权限
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
