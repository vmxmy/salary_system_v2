#!/usr/bin/env python3
"""
生成长期有效的JWT Token用于测试
"""

import jwt
from datetime import datetime, timedelta

# 从.env文件读取的配置
SECRET_KEY = "Xumy8!75"
ALGORITHM = "HS256"

def generate_long_term_token():
    """生成24小时有效期的JWT token"""
    
    # 设置payload
    payload = {
        "sub": "admin",  # 用户名
        "role": "超级管理员",  # 角色
        "exp": datetime.utcnow() + timedelta(hours=24)  # 24小时后过期
    }
    
    # 生成token
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    
    print("🔑 生成长期有效JWT Token:")
    print("=" * 60)
    print(f"SECRET_KEY: {SECRET_KEY}")
    print(f"ALGORITHM: {ALGORITHM}")
    print(f"用户名: admin")
    print(f"角色: 超级管理员")
    print(f"有效期: 24小时")
    print(f"生成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"过期时间: {(datetime.now() + timedelta(hours=24)).strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    print("🎫 Token:")
    print(token)
    print()
    print("💡 使用方法:")
    print(f"Authorization: Bearer {token}")
    
    return token

if __name__ == "__main__":
    generate_long_term_token() 