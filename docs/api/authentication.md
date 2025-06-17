# 认证与授权 API

系统使用基于OAuth2的令牌认证机制，通过以下API进行身份验证和授权管理。

## 基础端点

认证相关API使用前缀：`/v2/auth`

## 登录和令牌获取

### 获取访问令牌

```
POST /v2/auth/token
```

**请求体：**
```json
{
  "username": "admin",
  "password": "password"
}
```

**返回：**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 3600
}
```

### 刷新令牌

```
POST /v2/auth/token/refresh
```

**请求头：**
- `Authorization: Bearer {token}`

**返回：**
与获取访问令牌接口相同

## 用户管理

### 获取当前用户信息

```
GET /v2/auth/me
```

**请求头：**
- `Authorization: Bearer {token}`

**返回：**
```json
{
  "id": 1,
  "username": "admin",
  "email": "admin@example.com",
  "permissions": ["user:read", "user:write", ...]
}
```

### 修改密码

```
POST /v2/auth/change-password
```

**请求头：**
- `Authorization: Bearer {token}`

**请求体：**
```json
{
  "old_password": "current_password",
  "new_password": "new_password"
}
```

**返回：**
```json
{
  "message": "密码修改成功"
}
```

## 权限管理

### 获取所有权限列表

```
GET /v2/security/permissions
```

**请求头：**
- `Authorization: Bearer {token}`

**权限：**
- `security:manage`

### 获取角色列表

```
GET /v2/security/roles
```

**请求头：**
- `Authorization: Bearer {token}`

**权限：**
- `security:manage` 