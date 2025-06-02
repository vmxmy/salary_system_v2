#!/usr/bin/env python3
"""
生成JWT token的脚本，用于API测试
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', '..'))

from datetime import datetime, timedelta
from jose import jwt
from webapp.auth import SECRET_KEY, ALGORITHM

def generate_token(username="admin", role="超级管理员", expires_hours=24):
    """生成JWT token"""
    
    # 设置过期时间
    expire = datetime.utcnow() + timedelta(hours=expires_hours)
    
    # 创建token数据
    to_encode = {
        "sub": username,
        "role": role,
        "exp": expire
    }
    
    # 生成token
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    
    return encoded_jwt

def main():
    """主函数"""
    try:
        # 生成24小时有效期的token
        token = generate_token()
        
        print("🔑 JWT Token 生成成功")
        print("=" * 60)
        print(f"用户名: admin")
        print(f"角色: 超级管理员")
        print(f"有效期: 24小时")
        print(f"生成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"过期时间: {(datetime.now() + timedelta(hours=24)).strftime('%Y-%m-%d %H:%M:%S')}")
        print("\n🎫 Token:")
        print(token)
        print("\n💡 使用方法:")
        print(f"Authorization: Bearer {token}")
        
        return token
        
    except Exception as e:
        print(f"❌ Token生成失败: {str(e)}")
        return None

if __name__ == "__main__":
    main() 