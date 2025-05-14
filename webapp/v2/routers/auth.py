"""
认证相关的API路由。
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta

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
        # 获取用户
        user = crud.get_user_by_username(db, form_data.username)
        if not user:
            # 返回标准错误响应格式
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # 验证密码
        if not verify_password(form_data.password, user.password_hash):
            # 返回标准错误响应格式
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # 创建访问令牌
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        
        # 获取用户角色
        roles = [role.name for role in user.roles]
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
        
        # 返回令牌
        return {"access_token": access_token, "token_type": "bearer"}
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
