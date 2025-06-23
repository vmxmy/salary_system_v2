# V1 到 V2 API 迁移任务计划

## 📋 项目概述
本文档详细规划了剩余 V1 API 端点向现代化 V2 架构的完整迁移方案。

## 🎯 迁移目标
- **架构统一**: 所有 API 采用 V2 分层架构模式
- **提升维护性**: 清晰的职责分离和标准化模式
- **增强安全性**: 统一的权限控制机制
- **完善测试**: 全面的测试覆盖率
- **完整文档**: comprehensive API 文档

## 📊 当前 V1 端点分析

### 剩余 V1 端点清单
1. `GET /` - 根路径欢迎消息
2. `GET /health` - Docker 容器健康检查
3. `GET /converter` - Excel 转 CSV 转换器页面 (HTML)
4. `GET /api/debug/field-config/{employee_type_key}` - 调试字段配置

### V1 端点问题分析
- **缺乏权限控制**: 大部分端点没有统一的权限验证
- **架构不一致**: 直接在 main.py 中定义，不符合分层架构
- **响应格式不统一**: 没有标准化的错误处理和响应格式
- **测试覆盖不足**: 缺乏系统性的测试验证

## 🚀 迁移任务详解

### 第一阶段：创建 V2 路由器基础架构

#### 任务 1.1：系统管理路由器
- **文件**: `webapp/v2/routers/system.py`
- **功能**:
  - 根路径信息端点
  - 健康检查端点
  - 系统版本信息
  - 系统运行状态监控
- **端点设计**:
  ```
  GET /v2/system/info     - 系统基本信息
  GET /v2/system/health   - 健康检查详情
  GET /v2/system/version  - 版本信息
  GET /v2/system/metrics  - 系统运行指标
  ```

#### 任务 1.2：调试工具路由器
- **文件**: `webapp/v2/routers/debug.py`
- **功能**:
  - 字段配置调试
  - 数据库连接测试
  - 性能分析工具
  - 权限验证测试
- **端点设计**:
  ```
  GET /v2/debug/field-config/{key}  - 字段配置查询
  GET /v2/debug/database           - 数据库诊断
  GET /v2/debug/performance        - 性能分析
  GET /v2/debug/permissions        - 权限测试
  ```
- **安全控制**: 仅限 SUPER_ADMIN 和开发环境访问

#### 任务 1.3：工具类路由器
- **文件**: `webapp/v2/routers/utilities.py`
- **功能**:
  - 文件转换工具
  - 数据导出功能
  - 模板下载服务
- **端点设计**:
  ```
  GET  /v2/utilities/converter     - 转换器页面
  POST /v2/utilities/excel-to-csv  - Excel转换
  GET  /v2/utilities/templates     - 模板下载
  POST /v2/utilities/export        - 数据导出
  ```

### 第二阶段：数据模型与服务层

#### 任务 2.1：Pydantic 模型定义
- **文件**: `webapp/v2/pydantic_models/system.py`
- **模型设计**:
  ```python
  # 系统信息响应
  class SystemInfo(BaseModel):
      app_name: str
      version: str
      environment: str
      uptime: str
      
  # 健康检查响应
  class HealthCheck(BaseModel):
      status: str
      timestamp: datetime
      database: str
      version: str
      details: Optional[Dict[str, Any]]
      
  # 调试信息响应
  class DebugInfo(BaseModel):
      component: str
      status: str
      data: Dict[str, Any]
      timestamp: datetime
  ```

#### 任务 2.2：服务层实现
- **文件**: `webapp/v2/services/system.py`
- **服务功能**:
  - 系统信息收集
  - 健康状态检查
  - 性能指标监控
  - 数据库连接验证

### 第三阶段：端点迁移实施

#### 任务 3.1：系统类端点迁移
```python
# 迁移映射
GET /              → GET /v2/system/info
GET /health        → GET /v2/system/health

# 新增端点
GET /v2/system/version  - 详细版本信息
GET /v2/system/metrics  - 系统运行指标
```

#### 任务 3.2：调试类端点迁移
```python
# 迁移映射
GET /api/debug/field-config/{key} → GET /v2/debug/field-config/{key}

# 新增端点
GET /v2/debug/database     - 数据库诊断
GET /v2/debug/performance  - 性能分析
GET /v2/debug/permissions  - 权限测试
```

#### 任务 3.3：工具类端点迁移
```python
# 迁移映射
GET /converter → GET /v2/utilities/converter

# 新增端点
POST /v2/utilities/excel-to-csv  - Excel转换API
GET  /v2/utilities/templates     - 模板下载
POST /v2/utilities/export        - 数据导出
```

### 第四阶段：集成与测试

#### 任务 4.1：主应用更新
- **更新 main.py**:
  - 移除所有 V1 端点定义
  - 注册新的 V2 路由器
  - 添加向后兼容重定向（可选）
- **路由器注册**:
  ```python
  app.include_router(v2_system_router, prefix="/v2", tags=["System"])
  app.include_router(v2_debug_router, prefix="/v2", tags=["Debug"])
  app.include_router(v2_utilities_router, prefix="/v2", tags=["Utilities"])
  ```

#### 任务 4.2：前端集成
- 更新健康检查调用路径
- 适配新的响应格式
- 测试现有功能兼容性

#### 任务 4.3：全面测试
- **单元测试**: 每个新端点的功能验证
- **集成测试**: 端到端功能测试
- **性能测试**: 响应时间和资源使用
- **安全测试**: 权限控制验证

### 第五阶段：文档与部署

#### 任务 5.1：文档更新
- 更新 API 接口文档
- 创建迁移指南
- 更新 CLAUDE.md 文件
- 添加使用示例

#### 任务 5.2：部署准备
- Docker 健康检查配置更新
- 环境变量验证
- 监控告警配置调整

## 📅 实施时间安排

### 第一周：基础架构（高优先级）
- [x] 创建迁移计划文档
- [ ] 创建系统数据模型
- [ ] 创建系统服务层
- [ ] 创建系统管理路由器

### 第二周：核心迁移（高优先级）  
- [ ] 迁移健康检查接口
- [ ] 迁移根路径接口
- [ ] 更新 main.py 清理 V1 端点
- [ ] 基础功能测试

### 第三周：扩展功能（中优先级）
- [ ] 创建调试工具路由器
- [ ] 迁移调试接口
- [ ] 添加新的系统监控端点
- [ ] 集成测试

### 第四周：完善优化（低优先级）
- [ ] 创建工具类路由器
- [ ] 转换器功能迁移
- [ ] 文档完善
- [ ] 部署准备

## 🎯 预期成果

### 技术收益
- **架构统一**: 100% 采用 V2 分层架构
- **代码质量**: 统一的编码标准和最佳实践
- **安全增强**: 完整的权限控制体系
- **性能提升**: 优化的查询和缓存机制

### 业务收益
- **维护效率**: 显著降低维护成本
- **开发速度**: 标准化流程提升开发效率
- **系统稳定**: 完善的错误处理和监控
- **扩展能力**: 更好的可扩展性和模块化

## ⚠️ 风险管控

### 主要风险点
1. **功能兼容性**: 迁移后可能影响现有功能
2. **性能影响**: 新架构可能带来性能变化
3. **部署风险**: 部署过程中的服务中断
4. **用户影响**: API 路径变更对前端的影响

### 风险缓解措施
1. **渐进迁移**: 分阶段进行，确保每步稳定
2. **并行运行**: 迁移期间保持 V1 和 V2 并行
3. **充分测试**: 全面的测试覆盖和验证
4. **回滚方案**: 准备完整的回滚计划
5. **监控告警**: 实时监控系统状态

## 📋 检查清单

### 开发阶段检查
- [ ] 所有新文件按照 V2 架构标准创建
- [ ] 权限控制正确实现
- [ ] 错误处理统一规范
- [ ] 日志记录完整准确
- [ ] 响应格式符合标准

### 测试阶段检查
- [ ] 单元测试覆盖率 > 90%
- [ ] 集成测试通过
- [ ] 性能测试达标
- [ ] 安全测试通过
- [ ] 兼容性测试通过

### 部署阶段检查
- [ ] 环境配置正确
- [ ] 数据库迁移完成
- [ ] 监控告警配置
- [ ] 文档同步更新
- [ ] 回滚方案就绪

## 📚 参考资料

### 相关文档
- [Backend Architecture](../backend/1_Technical_Framework/1.1_Backend_Architecture.md)
- [API Design](../backend/1_Technical_Framework/1.3_API_Design.md)
- [Testing Strategy](../backend/1_Technical_Framework/1.8_Testing_Strategy.md)

### 代码示例
- V2 路由器示例: `webapp/v2/routers/employees.py`
- V2 服务层示例: `webapp/v2/services/hr.py`
- V2 模型示例: `webapp/v2/pydantic_models/hr.py`

---

**创建日期**: 2025-01-23  
**最后更新**: 2025-01-23  
**负责人**: Claude Code  
**状态**: 执行中