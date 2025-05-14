"""
安全相关的API路由。
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status, Body
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from datetime import datetime

from ..database import get_db_v2
from ..crud import security as crud
from ..pydantic_models.security import (
    UserCreate, UserUpdate, User, UserListResponse,
    RoleCreate, RoleUpdate, Role, RoleListResponse,
    PermissionCreate, PermissionUpdate, Permission, PermissionListResponse,
    UserRoleCreate, RolePermissionCreate
)
from ...auth import get_current_user, require_role
from ..utils import create_error_response

router = APIRouter(
    prefix="/v2",
    tags=["v2 Security"],
)


# User endpoints
@router.get("/users", response_model=UserListResponse)
async def get_users(
    is_active: Optional[bool] = None,
    role_id: Optional[int] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(10, ge=1, le=100, description="Page size"),
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_role(["Super Admin", "User Admin"]))
):
    """
    获取用户列表，支持分页、搜索和过滤。

    - **is_active**: 是否激活，用于过滤激活或未激活的用户
    - **role_id**: 角色ID，用于过滤特定角色的用户
    - **search**: 搜索关键字，可以匹配用户名
    - **page**: 页码，从1开始
    - **size**: 每页记录数，最大100
    - 需要Super Admin或User Admin角色
    """
    try:
        # 计算跳过的记录数
        skip = (page - 1) * size

        # 获取用户列表
        users, total = crud.get_users(
            db=db,
            is_active=is_active,
            role_id=role_id,
            search=search,
            skip=skip,
            limit=size
        )

        # 计算总页数
        total_pages = (total + size - 1) // size if total > 0 else 1

        # 返回标准响应格式
        return {
            "data": users,
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


@router.get("/users/{user_id}", response_model=Dict[str, User])
async def get_user(
    user_id: int,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_role(["Super Admin", "User Admin"]))
):
    """
    根据ID获取用户详情。

    - **user_id**: 用户ID
    - 需要Super Admin或User Admin角色
    """
    try:
        # 获取用户
        user = crud.get_user(db, user_id)
        if not user:
            # 返回标准错误响应格式
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=create_error_response(
                    status_code=404,
                    message="Not Found",
                    details=f"User with ID {user_id} not found"
                )
            )

        # 返回标准响应格式
        return {"data": user}
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


@router.post("/users", response_model=Dict[str, User], status_code=status.HTTP_201_CREATED)
async def create_user(
    user: UserCreate,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_role(["Super Admin"]))
):
    """
    创建新用户。

    - 需要Super Admin角色
    """
    try:
        # 创建用户
        db_user = crud.create_user(db, user)

        # 返回标准响应格式
        return {"data": db_user}
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


@router.put("/users/{user_id}", response_model=Dict[str, User])
async def update_user(
    user_id: int,
    user: UserUpdate,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_role(["Super Admin"]))
):
    """
    更新用户信息。

    - **user_id**: 用户ID
    - 需要Super Admin角色
    """
    try:
        # 更新用户
        db_user = crud.update_user(db, user_id, user)
        if not db_user:
            # 返回标准错误响应格式
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=create_error_response(
                    status_code=404,
                    message="Not Found",
                    details=f"User with ID {user_id} not found"
                )
            )

        # 返回标准响应格式
        return {"data": db_user}
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


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: int,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_role(["Super Admin"]))
):
    """
    删除用户。

    - **user_id**: 用户ID
    - 需要Super Admin角色
    """
    try:
        # 删除用户
        success = crud.delete_user(db, user_id)
        if not success:
            # 返回标准错误响应格式
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=create_error_response(
                    status_code=404,
                    message="Not Found",
                    details=f"User with ID {user_id} not found"
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


@router.post("/users/{user_id}/roles", status_code=status.HTTP_201_CREATED)
async def assign_role_to_user(
    user_id: int,
    role_id: int = Body(..., embed=True),
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_role(["Super Admin"]))
):
    """
    为用户分配角色。

    - **user_id**: 用户ID
    - **role_id**: 角色ID
    - 需要Super Admin角色
    """
    try:
        # 为用户分配角色
        user_role = UserRoleCreate(user_id=user_id, role_id=role_id)
        success = crud.assign_role_to_user(db, user_role)

        # 返回204 No Content
        return {"success": success}
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


@router.delete("/users/{user_id}/roles/{role_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_role_from_user(
    user_id: int,
    role_id: int,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_role(["Super Admin"]))
):
    """
    从用户中移除角色。

    - **user_id**: 用户ID
    - **role_id**: 角色ID
    - 需要Super Admin角色
    """
    try:
        # 从用户中移除角色
        success = crud.remove_role_from_user(db, user_id, role_id)
        if not success:
            # 返回标准错误响应格式
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=create_error_response(
                    status_code=404,
                    message="Not Found",
                    details=f"User role with user_id {user_id} and role_id {role_id} not found"
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


# Role endpoints
@router.get("/roles", response_model=RoleListResponse)
async def get_roles(
    search: Optional[str] = None,
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(10, ge=1, le=100, description="Page size"),
    db: Session = Depends(get_db_v2),
    current_user = Depends(get_current_user)
):
    """
    获取角色列表，支持分页和搜索。

    - **search**: 搜索关键字，可以匹配角色代码或名称
    - **page**: 页码，从1开始
    - **size**: 每页记录数，最大100
    """
    try:
        # 计算跳过的记录数
        skip = (page - 1) * size

        # 获取角色列表
        roles, total = crud.get_roles(
            db=db,
            search=search,
            skip=skip,
            limit=size
        )

        # 计算总页数
        total_pages = (total + size - 1) // size if total > 0 else 1

        # 返回标准响应格式
        return {
            "data": roles,
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


@router.get("/roles/{role_id}", response_model=Dict[str, Role])
async def get_role(
    role_id: int,
    db: Session = Depends(get_db_v2),
    current_user = Depends(get_current_user)
):
    """
    根据ID获取角色详情。

    - **role_id**: 角色ID
    """
    try:
        # 获取角色
        role = crud.get_role(db, role_id)
        if not role:
            # 返回标准错误响应格式
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=create_error_response(
                    status_code=404,
                    message="Not Found",
                    details=f"Role with ID {role_id} not found"
                )
            )

        # 返回标准响应格式
        return {"data": role}
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


@router.post("/roles", response_model=Dict[str, Role], status_code=status.HTTP_201_CREATED)
async def create_role(
    role: RoleCreate,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_role(["Super Admin"]))
):
    """
    创建新角色。

    - 需要Super Admin角色
    """
    try:
        # 创建角色
        db_role = crud.create_role(db, role)

        # 返回标准响应格式
        return {"data": db_role}
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


@router.put("/roles/{role_id}", response_model=Dict[str, Role])
async def update_role(
    role_id: int,
    role: RoleUpdate,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_role(["Super Admin"]))
):
    """
    更新角色信息。

    - **role_id**: 角色ID
    - 需要Super Admin角色
    """
    try:
        # 更新角色
        db_role = crud.update_role(db, role_id, role)
        if not db_role:
            # 返回标准错误响应格式
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=create_error_response(
                    status_code=404,
                    message="Not Found",
                    details=f"Role with ID {role_id} not found"
                )
            )

        # 返回标准响应格式
        return {"data": db_role}
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


@router.delete("/roles/{role_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_role(
    role_id: int,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_role(["Super Admin"]))
):
    """
    删除角色。

    - **role_id**: 角色ID
    - 需要Super Admin角色
    """
    try:
        # 删除角色
        success = crud.delete_role(db, role_id)
        if not success:
            # 返回标准错误响应格式
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=create_error_response(
                    status_code=404,
                    message="Not Found",
                    details=f"Role with ID {role_id} not found"
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


@router.post("/roles/{role_id}/permissions", status_code=status.HTTP_201_CREATED)
async def assign_permission_to_role(
    role_id: int,
    permission_id: int = Body(..., embed=True),
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_role(["Super Admin"]))
):
    """
    为角色分配权限。

    - **role_id**: 角色ID
    - **permission_id**: 权限ID
    - 需要Super Admin角色
    """
    try:
        # 为角色分配权限
        role_permission = RolePermissionCreate(role_id=role_id, permission_id=permission_id)
        success = crud.assign_permission_to_role(db, role_permission)

        # 返回201 Created
        return {"success": success}
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


@router.delete("/roles/{role_id}/permissions/{permission_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_permission_from_role(
    role_id: int,
    permission_id: int,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_role(["Super Admin"]))
):
    """
    从角色中移除权限。

    - **role_id**: 角色ID
    - **permission_id**: 权限ID
    - 需要Super Admin角色
    """
    try:
        # 从角色中移除权限
        success = crud.remove_permission_from_role(db, role_id, permission_id)
        if not success:
            # 返回标准错误响应格式
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=create_error_response(
                    status_code=404,
                    message="Not Found",
                    details=f"Role permission with role_id {role_id} and permission_id {permission_id} not found"
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


# Permission endpoints
@router.get("/permissions", response_model=PermissionListResponse)
async def get_permissions(
    search: Optional[str] = None,
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(10, ge=1, le=100, description="Page size"),
    db: Session = Depends(get_db_v2),
    current_user = Depends(get_current_user)
):
    """
    获取权限列表，支持分页和搜索。

    - **search**: 搜索关键字，可以匹配权限代码或描述
    - **page**: 页码，从1开始
    - **size**: 每页记录数，最大100
    """
    try:
        # 计算跳过的记录数
        skip = (page - 1) * size

        # 获取权限列表
        permissions, total = crud.get_permissions(
            db=db,
            search=search,
            skip=skip,
            limit=size
        )

        # 计算总页数
        total_pages = (total + size - 1) // size if total > 0 else 1

        # 返回标准响应格式
        return {
            "data": permissions,
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


@router.get("/permissions/{permission_id}", response_model=Dict[str, Permission])
async def get_permission(
    permission_id: int,
    db: Session = Depends(get_db_v2),
    current_user = Depends(get_current_user)
):
    """
    根据ID获取权限详情。

    - **permission_id**: 权限ID
    """
    try:
        # 获取权限
        permission = crud.get_permission(db, permission_id)
        if not permission:
            # 返回标准错误响应格式
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=create_error_response(
                    status_code=404,
                    message="Not Found",
                    details=f"Permission with ID {permission_id} not found"
                )
            )

        # 返回标准响应格式
        return {"data": permission}
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


@router.post("/permissions", response_model=Dict[str, Permission], status_code=status.HTTP_201_CREATED)
async def create_permission(
    permission: PermissionCreate,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_role(["Super Admin"]))
):
    """
    创建新权限。

    - 需要Super Admin角色
    """
    try:
        # 创建权限
        db_permission = crud.create_permission(db, permission)

        # 返回标准响应格式
        return {"data": db_permission}
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


@router.put("/permissions/{permission_id}", response_model=Dict[str, Permission])
async def update_permission(
    permission_id: int,
    permission: PermissionUpdate,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_role(["Super Admin"]))
):
    """
    更新权限信息。

    - **permission_id**: 权限ID
    - 需要Super Admin角色
    """
    try:
        # 更新权限
        db_permission = crud.update_permission(db, permission_id, permission)
        if not db_permission:
            # 返回标准错误响应格式
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=create_error_response(
                    status_code=404,
                    message="Not Found",
                    details=f"Permission with ID {permission_id} not found"
                )
            )

        # 返回标准响应格式
        return {"data": db_permission}
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


@router.delete("/permissions/{permission_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_permission(
    permission_id: int,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_role(["Super Admin"]))
):
    """
    删除权限。

    - **permission_id**: 权限ID
    - 需要Super Admin角色
    """
    try:
        # 删除权限
        success = crud.delete_permission(db, permission_id)
        if not success:
            # 返回标准错误响应格式
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=create_error_response(
                    status_code=404,
                    message="Not Found",
                    details=f"Permission with ID {permission_id} not found"
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
