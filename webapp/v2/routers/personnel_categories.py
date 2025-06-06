"""
人员类别相关的API路由。
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from typing import Optional, Dict, Any, List

from ..database import get_db_v2
from ..crud import (
    get_personnel_categories as crud_get_personnel_categories,
    get_personnel_category as crud_get_personnel_category,
    create_personnel_category as crud_create_personnel_category,
    update_personnel_category as crud_update_personnel_category,
    delete_personnel_category as crud_delete_personnel_category
)
from ..pydantic_models.hr import PersonnelCategoryCreate, PersonnelCategoryUpdate, PersonnelCategorySchema, PersonnelCategoryListResponse
from ..pydantic_models.common import DataResponse
from ...auth import require_permissions
from ..utils import create_error_response
from ..models.hr import PersonnelCategory, Employee

router = APIRouter(
    prefix="/personnel-categories",
    tags=["Personnel Categories"],
)


@router.get("/", response_model=PersonnelCategoryListResponse)
async def get_personnel_categories(
    parent_id: Optional[int] = None,
    is_active: Optional[bool] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(10, ge=1, le=100, description="Page size"),
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["personnel_category:view"]))
):
    """
    获取人员类别列表，支持分页、搜索和过滤。

    - **parent_id**: 父人员类别ID，用于获取特定人员类别的子类别
    - **is_active**: 是否激活，用于过滤激活或未激活的人员类别
    - **search**: 搜索关键字，可以匹配人员类别代码、名称或描述
    - **page**: 页码，从1开始
    - **size**: 每页记录数，最大100
    """
    try:
        # 计算跳过的记录数
        skip = (page - 1) * size

        # 获取人员类别列表
        personnel_categories, total = crud_get_personnel_categories(
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
            "data": personnel_categories,
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


@router.get("/tree", response_model=DataResponse[List[PersonnelCategorySchema]])
async def get_personnel_categories_tree(
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["personnel_category:view"]))
):
    """
    获取人员类别的树形结构。

    - **is_active**: 是否只获取活跃的人员类别
    """
    try:
        # 递归构建树形结构
        def build_category_tree(parent_id: Optional[int] = None) -> List[PersonnelCategorySchema]:
            categories, _ = crud_get_personnel_categories(
                db=db,
                parent_id=parent_id,
                is_active=is_active,
                skip=0,
                limit=1000  # 假设不会有超过1000个同级类别
            )
            
            tree_categories = []
            for category in categories:
                # 递归获取子类别
                children = build_category_tree(category.id)
                # 创建包含子类别的PersonnelCategorySchema
                category_dict = category.__dict__.copy()
                category_dict['child_categories'] = children
                tree_categories.append(PersonnelCategorySchema(**category_dict))
            
            return tree_categories

        tree_data = build_category_tree()
        
        # 返回标准响应格式
        return DataResponse[List[PersonnelCategorySchema]](data=tree_data)
        
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


@router.get("/employee-stats", response_model=DataResponse[List[Dict[str, Any]]])
async def get_personnel_category_employee_stats(
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["personnel_category:view"]))
):
    """
    获取人员身份分类的员工分布统计。
    
    返回每个人员身份分类下的员工数量。
    """
    try:
        # 查询每个人员身份分类的员工数量
        stats_query = (
            db.query(
                PersonnelCategory.id.label('category_id'),
                func.count(Employee.id).label('employee_count')
            )
            .outerjoin(Employee, Employee.personnel_category_id == PersonnelCategory.id)
            .group_by(PersonnelCategory.id)
            .all()
        )
        
        # 转换为字典列表
        stats_data = [
            {
                "category_id": stat.category_id,
                "employee_count": stat.employee_count
            }
            for stat in stats_query
        ]
        
        return DataResponse[List[Dict[str, Any]]](data=stats_data)
        
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




@router.get("/{personnel_category_id}", response_model=DataResponse[PersonnelCategorySchema])
async def get_personnel_category(
    personnel_category_id: int,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["personnel_category:view"]))
):
    """
    根据ID获取人员类别详情。

    - **personnel_category_id**: 人员类别ID
    """
    try:
        # 获取人员类别
        personnel_category = crud_get_personnel_category(db, personnel_category_id)
        if not personnel_category:
            # 返回标准错误响应格式
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=create_error_response(
                    status_code=404,
                    message="Not Found",
                    details=f"Personnel category with ID {personnel_category_id} not found"
                )
            )

        # 返回标准响应格式
        return DataResponse[PersonnelCategorySchema](data=personnel_category)
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


@router.post("/", response_model=DataResponse[PersonnelCategorySchema], status_code=status.HTTP_201_CREATED)
async def create_personnel_category(
    personnel_category: PersonnelCategoryCreate,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["personnel_category:manage"]))
):
    """
    创建新人员类别。

    - 需要 personnel_category:manage 权限
    """
    try:
        # 创建人员类别
        db_personnel_category = crud_create_personnel_category(db, personnel_category)

        # 返回标准响应格式
        return DataResponse[PersonnelCategorySchema](data=db_personnel_category)
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


@router.put("/{personnel_category_id}", response_model=DataResponse[PersonnelCategorySchema])
async def update_personnel_category(
    personnel_category_id: int,
    personnel_category: PersonnelCategoryUpdate,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["personnel_category:manage"]))
):
    """
    更新人员类别信息。

    - **personnel_category_id**: 人员类别ID
    - 需要 personnel_category:manage 权限
    """
    try:
        # 更新人员类别
        db_personnel_category = crud_update_personnel_category(db, personnel_category_id, personnel_category)
        if not db_personnel_category:
            # 返回标准错误响应格式
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=create_error_response(
                    status_code=404,
                    message="Not Found",
                    details=f"Personnel category with ID {personnel_category_id} not found"
                )
            )

        # 返回标准响应格式
        return DataResponse[PersonnelCategorySchema](data=db_personnel_category)
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


@router.delete("/{personnel_category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_personnel_category(
    personnel_category_id: int,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["personnel_category:manage"]))
):
    """
    删除人员类别。

    - **personnel_category_id**: 人员类别ID
    - 需要 personnel_category:manage 权限
    """
    try:
        # 删除人员类别
        success = crud_delete_personnel_category(db, personnel_category_id)
        if not success:
            # 返回标准错误响应格式
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=create_error_response(
                    status_code=404,
                    message="Not Found",
                    details=f"Personnel category with ID {personnel_category_id} not found"
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


# --- 高性能公共 PersonnelCategory 端点 (无权限检查) ---
@router.get("/public", response_model=PersonnelCategoryListResponse)
async def get_personnel_categories_public(
    is_active: bool = True,  # 默认只返回活跃的人员类别
    db: Session = Depends(get_db_v2)
    # 注意：此端点没有权限检查，仅用于公共personnel_category数据
):
    """
    高性能公共人员类别查询端点
    - 默认返回活跃人员类别
    - 无权限检查，性能优化
    - 专门用于前端初始化时personnel_category数据加载
    """
    try:
        # 直接使用原生SQL，跳过所有ORM开销
        from sqlalchemy import text
        
        # 超高性能查询：直接SQL，无分页，无复杂条件
        query = text("""
            SELECT 
                pc.id,
                pc.code,
                pc.name,
                pc.description,
                pc.parent_category_id,
                pc.effective_date,
                pc.end_date,
                pc.is_active
            FROM hr.personnel_categories pc
            WHERE (:is_active IS NULL OR pc.is_active = :is_active)
            ORDER BY pc.code ASC
            LIMIT 200
        """)
        
        params = {'is_active': is_active}
        
        # 执行查询
        result = db.execute(query, params)
        personnel_categories = [dict(row._mapping) for row in result]
        
        return PersonnelCategoryListResponse(
            data=personnel_categories, 
            meta={
                "page": 1, 
                "size": len(personnel_categories), 
                "total": len(personnel_categories), 
                "totalPages": 1
            }
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
