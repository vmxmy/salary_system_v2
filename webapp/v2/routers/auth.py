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
        # 🚀 使用高性能登录查询
        user_login_data = crud.get_user_for_login(db, form_data.username)
        if not user_login_data:
            # 返回标准错误响应格式
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # 验证密码
        password_check = verify_password(form_data.password, user_login_data["password_hash"])
        if not password_check:
            # 返回标准错误响应格式
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # 🚀 现在获取完整用户信息（包含角色和权限）- 仅在密码验证通过后
        user = crud.get_user_by_username(db, form_data.username)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User data incomplete",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # 创建访问令牌
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        
        # 获取用户角色
        roles = [role.name for role in user.roles] if user.roles else [] # Ensure user.roles is not None
        first_role_name = roles[0] if roles else None # Renamed for clarity, as it's used for token_data
        
        # 创建令牌数据
        token_data = {
            "sub": user.username,
            "role": first_role_name # JWT token still contains the first role name for simplicity or specific checks
        }
        
        # 创建访问令牌
        access_token = create_access_token(
            data=token_data,
            expires_delta=access_token_expires
        )
        
        # 返回令牌及完整的用户信息
        # The 'user' ORM object (user) is already populated with roles and permissions due to eager loading in CRUD
        # Pydantic will automatically convert it based on TokenResponseWithFullUser and nested PydanticUser model
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": user # Pass the ORM user object; Pydantic will handle serialization
        }
    except HTTPException:
        raise
    except Exception as e:
        # 强制记录详细的异常信息，包括堆栈跟踪
        logger.exception("An unexpected error occurred during login:")
        
        # 返回标准错误响应格式
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="Internal Server Error",
                details=str(e)
            )
        )
