#!/usr/bin/env python3
"""
生成测试用的JWT Token（使用实际的JWT_SECRET_KEY）
"""
import jwt
from datetime import datetime, timedelta

# 使用实际的JWT_SECRET_KEY
SECRET_KEY = "Xumy8!75"
ALGORITHM = "HS256"

def generate_token(username: str = "admin", role: str = "超级管理员", hours: int = 24):
    """生成JWT Token"""
    # 创建payload
    payload = {
        "sub": username,  # subject (用户名)
        "role": role,     # 用户角色
        "exp": datetime.utcnow() + timedelta(hours=hours)  # 过期时间
    }
    
    # 生成token
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    
    print(f"🔑 使用实际JWT_SECRET_KEY生成的Token:")
    print("=" * 60)
    print(f"SECRET_KEY: {SECRET_KEY}")
    print(f"ALGORITHM: {ALGORITHM}")
    print(f"用户名: {username}")
    print(f"角色: {role}")
    print(f"有效期: {hours}小时")
    print(f"生成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    print(f"🎫 Token:")
    print(token)
    print()
    print(f"💡 使用方法:")
    print(f"Authorization: Bearer {token}")
    
    return token

if __name__ == "__main__":
    generate_token() 