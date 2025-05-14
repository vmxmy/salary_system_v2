"""
认证相关的API路由。
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
import logging

# 设置日志
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger("auth_debug")

from ..database import get_db_v2
from ..crud import security as crud
from ..pydantic_models.security import User
from ...auth import create_access_token, verify_password, ACCESS_TOKEN_EXPIRE_MINUTES
from ..utils import create_error_response

router = APIRouter(
    prefix="/v2",
    tags=["v2 Authentication"],
)


@router.post("/token")
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
        # 获取用户 (user 对象应该包含 id 属性)
        user = crud.get_user_by_username(db, form_data.username)
        logger.debug(f"[DEBUG] 登录用户名: {form_data.username}, user: {user}, password_hash: {getattr(user, 'password_hash', None)}")
        if not user or not hasattr(user, 'id'): # 确保 user 对象存在且有 id 属性
            # 返回标准错误响应格式
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password or user data incomplete", # 更具体的错误信息
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # 验证密码
        password_check = verify_password(form_data.password, user.password_hash)
        logger.debug(f"[DEBUG] 密码校验结果: {password_check}, 输入密码: {form_data.password}, 数据库存储: {user.password_hash}")
        if not password_check:
            # 返回标准错误响应格式
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # 创建访问令牌
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        
        # 获取用户角色
        roles = [role.name for role in user.roles] if user.roles else [] # Ensure user.roles is not None
        role = roles[0] if roles else None
        
        # 创建令牌数据
        token_data = {
            "sub": user.username,
            "role": role
        }
        
        # 创建访问令牌
        access_token = create_access_token(
            data=token_data,
            expires_delta=access_token_expires
        )
        
        # 返回令牌及用户ID
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user_id": user.id,  # 新增用户数字ID
            "username": user.username, # (可选) 显式返回用户名
            "role": role # (可选) 显式返回角色
        }
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
