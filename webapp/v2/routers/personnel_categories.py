"""
人员类别相关的API路由。
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any, List

from ..database import get_db_v2
from ..crud import hr as crud
from ..pydantic_models.hr import PersonnelCategoryCreate, PersonnelCategoryUpdate, PersonnelCategorySchema, PersonnelCategoryListResponse
from ...auth import require_permissions
from ..utils import create_error_response
from ..models.hr import PersonnelCategory

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
    current_user = Depends(require_permissions(["P_PERSONNEL_CATEGORY_VIEW"]))
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
        personnel_categories, total = crud.get_personnel_categories(
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


@router.get("/tree", response_model=Dict[str, List[PersonnelCategorySchema]])
async def get_personnel_categories_tree(
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["P_PERSONNEL_CATEGORY_VIEW"]))
):
    """
    获取人员类别的完整树形结构，不分页。

    - **is_active**: 是否激活，用于过滤激活或未激活的人员类别
    
    返回值：
    - data: 包含根节点（parent_category_id为NULL）的人员类别树形结构列表
    """
    try:
        # 使用递归构建树形结构
        def build_category_tree(parent_id: Optional[int] = None) -> List[PersonnelCategorySchema]:
            """递归构建人员类别树"""
            # 查询当前层级的人员类别
            query = db.query(PersonnelCategory).filter(
                PersonnelCategory.parent_category_id == parent_id
            )
            
            if is_active is not None:
                query = query.filter(PersonnelCategory.is_active == is_active)
            
            # 按名称排序
            categories = query.order_by(PersonnelCategory.name).all()
            
            result = []
            for category in categories:
                # 转换为 Pydantic 模型
                category_dict = PersonnelCategorySchema.model_validate(category)
                
                # 递归获取子类别
                category_dict.child_categories = build_category_tree(category.id)
                
                result.append(category_dict)
            
            return result
        
        # 从根节点开始构建树
        tree_data = build_category_tree(parent_id=None)
        
        # 返回标准响应格式
        return {"data": tree_data}
        
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


@router.get("/{personnel_category_id}", response_model=Dict[str, PersonnelCategorySchema])
async def get_personnel_category(
    personnel_category_id: int,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["P_PERSONNEL_CATEGORY_VIEW"]))
):
    """
    根据ID获取人员类别详情。

    - **personnel_category_id**: 人员类别ID
    """
    try:
        # 获取人员类别
        personnel_category = crud.get_personnel_category(db, personnel_category_id)
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
        return {"data": personnel_category}
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


@router.post("/", response_model=Dict[str, PersonnelCategorySchema], status_code=status.HTTP_201_CREATED)
async def create_personnel_category(
    personnel_category: PersonnelCategoryCreate,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["P_PERSONNEL_CATEGORY_MANAGE"]))
):
    """
    创建新人员类别。

    - 需要 P_PERSONNEL_CATEGORY_MANAGE 权限
    """
    try:
        # 创建人员类别
        db_personnel_category = crud.create_personnel_category(db, personnel_category)

        # 返回标准响应格式
        return {"data": db_personnel_category}
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


@router.put("/{personnel_category_id}", response_model=Dict[str, PersonnelCategorySchema])
async def update_personnel_category(
    personnel_category_id: int,
    personnel_category: PersonnelCategoryUpdate,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["P_PERSONNEL_CATEGORY_MANAGE"]))
):
    """
    更新人员类别信息。

    - **personnel_category_id**: 人员类别ID
    - 需要 P_PERSONNEL_CATEGORY_MANAGE 权限
    """
    try:
        # 更新人员类别
        db_personnel_category = crud.update_personnel_category(db, personnel_category_id, personnel_category)
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
        return {"data": db_personnel_category}
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
    current_user = Depends(require_permissions(["P_PERSONNEL_CATEGORY_MANAGE"]))
):
    """
    删除人员类别。

    - **personnel_category_id**: 人员类别ID
    - 需要 P_PERSONNEL_CATEGORY_MANAGE 权限
    """
    try:
        # 删除人员类别
        success = crud.delete_personnel_category(db, personnel_category_id)
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
