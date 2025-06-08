#!/usr/bin/env python3
"""
使用正确的JWT_SECRET_KEY生成token
"""

import sys
import os
sys.path.append('webapp')

from datetime import datetime, timedelta
from jose import jwt

# 使用正确的密钥
SECRET_KEY = 'Xumy8!75'
ALGORITHM = 'HS256'

def generate_token():
    """生成JWT token"""
    
    # 创建token数据
    token_data = {
        'sub': 'admin',
        'role': '超级管理员',
        'exp': datetime.utcnow() + timedelta(hours=24)
    }
    
    # 生成token
    token = jwt.encode(token_data, SECRET_KEY, algorithm=ALGORITHM)
    
    print('🔑 使用正确密钥生成的JWT Token:')
    print('=' * 60)
    print(f'SECRET_KEY: {SECRET_KEY}')
    print(f'ALGORITHM: {ALGORITHM}')
    print(f'用户名: admin')
    print(f'角色: 超级管理员')
    print(f'有效期: 24小时')
    print(f'生成时间: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}')
    print('\n🎫 Token:')
    print(token)
    print('\n💡 使用方法:')
    print(f'Authorization: Bearer {token}')
    
    return token

if __name__ == "__main__":
    generate_token() 