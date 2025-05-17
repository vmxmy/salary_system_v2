"""
安全相关的API路由。
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status, Body
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from datetime import datetime
import logging

# 设置日志
logger = logging.getLogger("auth_debug")
logger.setLevel(logging.DEBUG)

from ..database import get_db_v2
from ..crud import security as crud
from ..pydantic_models.security import (
    UserCreate, UserUpdate, User, UserListResponse,
    RoleCreate, RoleUpdate, Role, RoleListResponse,
    PermissionCreate, PermissionUpdate, Permission, PermissionListResponse,
    UserRoleCreate, RolePermissionCreate, UserRoleAssignRequest
)
from ...auth import require_permissions # MODIFIED: require_role removed as it will be replaced
from ..utils import create_error_response

router = APIRouter(
    prefix="",
    tags=["Security"],
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
    current_user = Depends(require_permissions(["P_USER_VIEW_LIST"])) # MODIFIED
):
    """
    获取用户列表，支持分页、搜索和过滤。

    - **is_active**: 是否激活，用于过滤激活或未激活的用户
    - **role_id**: 角色ID，用于过滤特定角色的用户
    - **search**: 搜索关键字，可以匹配用户名
    - **page**: 页码，从1开始
    - **size**: 每页记录数，最大100
    - 需要SUPER_ADMIN角色
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
    current_user = Depends(require_permissions(["P_USER_VIEW_DETAIL"])) # MODIFIED
):
    """
    根据ID获取用户详情。

    - **user_id**: 用户ID
    - 需要SUPER_ADMIN角色
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
    current_user = Depends(require_permissions(["P_USER_CREATE"])) # MODIFIED
):
    """
    创建新用户。

    - 需要SUPER_ADMIN角色
    """
    try:
        # 创建用户
        logger.debug(f"Creating user with data: {user}")
        try:
            db_user = crud.create_user(db, user)
            logger.debug(f"Successfully created user: {db_user}")
        except Exception as e:
            logger.error(f"Error creating user: {e}", exc_info=True)
            raise
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
    current_user = Depends(require_permissions(["P_USER_UPDATE"])) # MODIFIED
):
    """
    更新用户信息。

    - **user_id**: 用户ID
    - 需要SUPER_ADMIN角色
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
        # 特定的业务逻辑错误 (例如，用户名已存在，员工关联问题等)
        # 这些通常是由于客户端输入不当或违反业务规则造成的，适合用 400 或 422
        # logging.info(f"ValueError during user update for user_id {user_id}: {str(e)}") # Optional: Log as info or warning
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, # Or status.HTTP_400_BAD_REQUEST
            detail=create_error_response(
                status_code=422, # Or 400
                message="Validation Error", # A more generic message for the category
                details=str(e) # The specific error message from CRUD
            )
        )
    except HTTPException:
        # If it's already an HTTPException (e.g., from permission checks), re-raise it.
        raise
    except Exception as e:
        # 捕获所有其他意外错误，记录它们，并返回500
        logging.exception(f"Unexpected error updating user {user_id}: {e}")
        # 返回标准错误响应格式
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="Internal Server Error",
                details="An unexpected error occurred while updating the user."
            )
        )


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: int,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["P_USER_DELETE"])) # MODIFIED
):
    """
    删除用户。

    - **user_id**: 用户ID
    - 需要SUPER_ADMIN角色
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


@router.post("/users/{user_id}/roles", response_model=Dict[str, User], status_code=status.HTTP_200_OK)
async def assign_roles_to_user_endpoint(
    user_id: int,
    user_role_assign_request: UserRoleAssignRequest, 
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["P_USER_MANAGE_ROLES"])) # MODIFIED
):
    """
    为指定用户分配角色列表，替换其现有所有角色。

    - **user_id**: 用户ID
    - 请求体包含 `role_ids: List[int]`
    - 需要SUPER_ADMIN角色
    """
    try:
        updated_user = crud.assign_roles_to_user(db, user_id=user_id, role_ids=user_role_assign_request.role_ids)
        if not updated_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=create_error_response(
                    status_code=404,
                    message="Not Found",
                    details=f"User with ID {user_id} not found"
                )
            )
        return {"data": updated_user}
    except ValueError as e:
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
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="Internal Server Error",
                details=str(e)
            )
        )


@router.get("/users/{user_id}/roles", response_model=List[Role])
async def get_user_roles(
    user_id: int,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["P_USER_MANAGE_ROLES"])) # MODIFIED
):
    """
    获取指定用户拥有的所有角色。

    - **user_id**: 用户ID
    - 需要SUPER_ADMIN角色 (可根据需求调整)
    """
    try:
        db_user = crud.get_user(db, user_id=user_id)
        if not db_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=create_error_response(
                    status_code=404,
                    message="Not Found",
                    details=f"User with ID {user_id} not found"
                )
            )
        return db_user.roles
    except HTTPException:
        raise
    except Exception as e:
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
    current_user = Depends(require_permissions(["P_ROLE_VIEW_LIST"])) # MODIFIED (get_current_user replaced)
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
    current_user = Depends(require_permissions(["P_ROLE_VIEW_DETAIL"])) # MODIFIED (get_current_user replaced)
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
    current_user = Depends(require_permissions(["P_ROLE_CREATE"])) # MODIFIED
):
    """
    创建新角色。

    - 需要SUPER_ADMIN角色
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
    current_user = Depends(require_permissions(["P_ROLE_UPDATE"])) # MODIFIED
):
    """
    更新角色信息。

    - **role_id**: 角色ID
    - 需要SUPER_ADMIN角色
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
    current_user = Depends(require_permissions(["P_ROLE_DELETE"])) # MODIFIED
):
    """
    删除角色。

    - **role_id**: 角色ID
    - 需要SUPER_ADMIN角色
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
    current_user = Depends(require_permissions(["P_ROLE_MANAGE_PERMISSIONS"])) # MODIFIED
):
    """
    为角色分配权限。

    - **role_id**: 角色ID
    - **permission_id**: 权限ID
    - 需要SUPER_ADMIN角色
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
    current_user = Depends(require_permissions(["P_ROLE_MANAGE_PERMISSIONS"])) # MODIFIED
):
    """
    从角色中移除权限。

    - **role_id**: 角色ID
    - **permission_id**: 权限ID
    - 需要SUPER_ADMIN角色
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


@router.get("/roles/{role_id}/permissions", response_model=List[Permission])
async def get_role_permissions(
    role_id: int,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["P_ROLE_MANAGE_PERMISSIONS"])) # MODIFIED (get_current_user replaced)
):
    """
    获取指定角色所拥有的所有权限。

    - **role_id**: 角色ID
    - 任何登录用户均可访问 (可根据需要调整权限)
    """
    try:
        db_role = crud.get_role(db, role_id=role_id)
        if not db_role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=create_error_response(
                    status_code=404,
                    message="Not Found",
                    details=f"Role with ID {role_id} not found"
                )
            )
        return db_role.permissions
    except HTTPException:
        raise
    except Exception as e:
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
    current_user = Depends(require_permissions(["P_PERMISSION_VIEW_LIST"])) # MODIFIED (get_current_user replaced)
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
    current_user = Depends(require_permissions(["P_PERMISSION_VIEW_DETAIL"])) # MODIFIED (get_current_user replaced)
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
    current_user = Depends(require_permissions(["P_PERMISSION_CREATE"])) # MODIFIED
):
    """
    创建新权限。

    - 需要SUPER_ADMIN角色
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
    current_user = Depends(require_permissions(["P_PERMISSION_UPDATE"])) # MODIFIED
):
    """
    更新权限信息。

    - **permission_id**: 权限ID
    - 需要SUPER_ADMIN角色
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
    current_user = Depends(require_permissions(["P_PERMISSION_DELETE"])) # MODIFIED
):
    """
    删除权限。

    - **permission_id**: 权限ID
    - 需要SUPER_ADMIN角色
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
