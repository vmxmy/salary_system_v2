"""
认证相关的API路由。
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
import logging

# 设置日志
# logging.basicConfig(level=logging.DEBUG) # Configured in webapp/core/config.py
logger = logging.getLogger(__name__) # Use standard logger name

from ..database import get_db_v2
from ..crud import security as crud
from ..pydantic_models.security import User as PydanticUser, TokenResponseWithFullUser
from ...auth import create_access_token, verify_password, ACCESS_TOKEN_EXPIRE_MINUTES
from ..utils.common import create_error_response

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


@router.post("/token", response_model=TokenResponseWithFullUser)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db_v2)
):
    """
    获取JWT令牌。

    - **username**: 用户名
    - **password**: 密码
    """
    try:
        # 🚀 第一步：使用高性能登录查询（仅验证用户名密码）
        user_login_data = crud.get_user_for_login(db, form_data.username)
        if not user_login_data:
            logger.warning(f"Login failed: User '{form_data.username}' not found or inactive")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # 🚀 第二步：验证密码
        password_check = verify_password(form_data.password, user_login_data["password_hash"])
        if not password_check:
            logger.warning(f"Login failed: Incorrect password for user '{form_data.username}'")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # 🚀 第三步：获取完整用户信息（使用超高性能权限查询）
        user_with_permissions = crud.get_user_permissions_ultra_fast(db, form_data.username)
        if not user_with_permissions:
            logger.error(f"Login failed: Failed to fetch user permissions for '{form_data.username}'")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User data incomplete",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # 🚀 第四步：创建访问令牌
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        
        # 获取用户角色
        roles = user_with_permissions.get("roles", [])
        first_role_name = roles[0]["name"] if roles else None
        
        # 创建令牌数据
        token_data = {
            "sub": user_with_permissions["username"],
            "role": first_role_name
        }
        
        # 创建访问令牌
        access_token = create_access_token(
            data=token_data,
            expires_delta=access_token_expires
        )
        
        # 🚀 第五步：构造返回数据（兼容前端期望的格式）
        # 将字典数据转换为类似ORM对象的结构，以便Pydantic序列化
        user_response_data = {
            "id": user_with_permissions["id"],
            "username": user_with_permissions["username"],
            "employee_id": user_with_permissions["employee_id"],
            "is_active": user_with_permissions["is_active"],
            "created_at": user_with_permissions["created_at"],
            "description": user_with_permissions.get("description"),
            "all_permission_codes": user_with_permissions.get("all_permission_codes", []),
            "roles": user_with_permissions.get("roles", [])
        }
        
        logger.info(f"Login successful for user '{form_data.username}' with {len(user_response_data['all_permission_codes'])} permissions")
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": user_response_data
        }
    except HTTPException:
        raise
    except Exception as e:
        # 强制记录详细的异常信息，包括堆栈跟踪
        logger.exception(f"Unexpected error during login for user '{form_data.username}':")
        
        # 返回标准错误响应格式
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="Internal Server Error",
                details=str(e)
            )
        )
