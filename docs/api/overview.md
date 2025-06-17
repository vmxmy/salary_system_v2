# 工资信息管理系统 API 概述

## API 版本

系统当前主要使用 `/v2` 作为API前缀，这是最新和推荐的API版本。

## API 模块划分

根据功能和业务领域，API 被组织为以下主要模块：

1. **认证与安全 (Authentication)**
   - 用户登录、权限验证和安全相关接口

2. **员工管理 (Employees)**
   - 员工信息的CRUD操作
   - 员工导入/导出

3. **部门管理 (Departments)**
   - 部门信息的CRUD操作
   - 部门层级结构

4. **人事分类 (Personnel Categories)**
   - 人事分类管理

5. **职位管理 (Positions)**
   - 职位信息管理

6. **系统配置 (Configuration)**
   - 系统参数
   - 薪资组件定义
   - 税率配置
   - 社保费率
   - 查询值配置

7. **薪资管理 (Payroll)**
   - 薪资数据处理
   - 薪资计算

8. **简单薪资系统 (Simple Payroll)**
   - 工资期间管理
   - 工资运行版本管理
   - 薪资生成和审核
   - 薪资报表

9. **报表 (Reports)**
   - 报表定义
   - 报表生成

10. **考勤 (Attendance)**
    - 考勤记录管理

11. **视图 (Views)**
    - 优化的数据视图
    - 高性能数据获取接口

## API 响应格式

大多数API返回标准化的JSON响应格式：

### 成功响应

标准数据对象响应：
```json
{
  "data": { ... }, // 响应数据对象
  "status": "success"
}
```

分页数据响应：
```json
{
  "data": [ ... ], // 数据数组
  "meta": {
    "page": 1,
    "size": 50,
    "total": 100,
    "pages": 2
  },
  "status": "success"
}
```

### 错误响应

```json
{
  "detail": {
    "code": 400,
    "message": "错误消息",
    "details": "详细错误信息"
  }
}
```

## 认证机制

系统使用基于OAuth2的令牌认证：

1. 客户端通过`/v2/auth/token`端点获取访问令牌
2. 之后的请求在Authorization头中携带令牌：`Authorization: Bearer {token}`

## 权限控制

API使用基于角色的权限控制系统，每个API端点都需要特定的权限才能访问。 