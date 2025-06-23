# 路由重复清理任务清单

## 🎯 总体目标
将当前29个重复路由组减少到0，优化API架构设计

## ✅ 已完成任务

- [x] **备份文件清理** (2025-06-24)
  - [x] 删除 `config_backup_20250601_132007.py` (38个路由)
  - [x] 删除 `simple_payroll_backup.py` (33个路由)
  - [x] 路由总数从490减少到380 (-22%)
  - [x] 重复组从47减少到29 (-38%)

## 🔥 高优先级任务 (第1周)

### 1. 根路径冲突解决
- [ ] **GET /v2 冲突** (9个实现需要修复)
  - [ ] `positions.py:21` → `GET /v2/positions`
  - [ ] `personnel_categories.py:30` → `GET /v2/personnel-categories`
  - [ ] `departments.py:28` → `GET /v2/departments`
  - [ ] `employees.py:32` → `GET /v2/employees`
  - [ ] `reports/calculated_fields.py:17` → `GET /v2/calculated-fields`
  - [ ] `reports/data_sources.py:26` → `GET /v2/data-sources`
  - [ ] `reports/templates.py:19` → `GET /v2/templates`
  - [ ] `config/system_parameter_router.py:27` → `GET /v2/system-parameters`
  - [ ] `config/payroll_component_router.py:28` → `GET /v2/payroll-components`

- [ ] **POST /v2 冲突** (9个实现需要修复)
  - [ ] 对应上述文件的POST方法路径修复

### 2. 健康检查统一
- [ ] 保留 `system.py:59` 作为官方健康检查
- [ ] 移除 `simple_payroll.py:1771` 中的健康检查
- [ ] 移除 `views_optimized.py:470` 中的健康检查

### 3. 工资期间管理冲突
- [ ] **GET /v2/periods** (3个实现)
  - [ ] `attendance.py:28` → `GET /v2/attendance/periods`
  - [ ] `simple_payroll.py:61` → `GET /v2/payroll/periods`
  - [ ] `payroll_v2.py:31` → 保留或合并

- [ ] **GET /v2/periods/{period_id}** (2个实现)
  - [ ] `simple_payroll.py:103` 和 `payroll_v2.py:88` 需要合并

## 🚀 中优先级任务 (第2-3周)

### 4. 生成接口冲突
- [ ] **POST /v2/generate** (2个实现)
  - [ ] `batch_reports.py:30` → `POST /v2/batch-reports/generate`
  - [ ] `simple_payroll.py:248` → `POST /v2/payroll/generate`

### 5. 模板管理冲突
- [ ] **GET /v2/templates** (2个实现)
  - [ ] `utilities.py:198` → `GET /v2/system/templates`
  - [ ] `config/report_definition_router.py:31` → `GET /v2/reports/templates`

### 6. 权限管理冲突
- [ ] **GET /v2/permissions** (2个实现)
  - [ ] `security.py:711` → 保留作为主要实现
  - [ ] `debug.py:143` → `GET /v2/debug/permissions`

### 7. 用户信息冲突
- [ ] **GET /v2/users/{user_id}** (2个实现)
  - [ ] `security.py:93` → 保留作为主要实现
  - [ ] `views_optimized.py:25` → 整合或移除

## 📊 大型重构任务 (第3-4周)

### 8. simple_payroll.py 模块拆分
- [ ] 分析48个路由的功能分类
- [ ] 创建子模块:
  - [ ] `payroll_core.py` (核心工资计算)
  - [ ] `payroll_periods.py` (工资期间)
  - [ ] `payroll_reports.py` (工资报表)
  - [ ] `payroll_audit.py` (工资审计)
- [ ] 迁移路由到新模块
- [ ] 更新main.py中的路由注册
- [ ] 测试所有功能

### 9. views模块整合
- [ ] 性能测试 `views.py` vs `views_optimized.py`
- [ ] 选择性能更优的实现
- [ ] 迁移依赖调用方
- [ ] 删除冗余文件

### 10. 配置管理统一
- [ ] 整合config相关重复路径
- [ ] 统一配置API设计模式
- [ ] 更新前端调用代码

## 🔧 支持任务

### 11. API规范制定
- [ ] 制定路径命名规范
- [ ] 定义模块职责边界
- [ ] 创建API设计指南文档

### 12. 自动化检测
- [ ] 将路由检测工具集成到CI/CD
- [ ] 设置PR检查规则
- [ ] 配置告警机制

### 13. 测试和验证
- [ ] 为每个修改的路由添加测试
- [ ] 性能回归测试
- [ ] API兼容性验证

## 📈 进度跟踪

### 完成度统计
- 总任务数: 50+ 项
- 已完成: 4 项 (8%)
- 进行中: 0 项
- 待开始: 46 项 (92%)

### 重复路由减少进度
- 起始: 47 个重复组
- 当前: 29 个重复组 (-38%)
- 目标: 0 个重复组
- 剩余: 29 个待解决

### 关键里程碑
- [x] 2025-06-24: 备份文件清理完成
- [ ] 2025-06-30: 高优先级冲突解决
- [ ] 2025-07-07: 中优先级任务完成
- [ ] 2025-07-21: 所有重复路由清理完成

## 🚨 注意事项

1. **API变更影响**: 每次路径修改都需要更新前端代码
2. **数据库一致性**: 确保路由变更不影响数据操作
3. **性能监控**: 重构后验证API响应时间
4. **回滚准备**: 每个阶段都准备快速回滚方案

## 📝 更新日志

- **2025-06-24**: 创建任务清单，完成备份文件清理
- **待更新**: 根据实际进展更新任务状态

---
**维护者**: 系统架构师  
**最后更新**: 2025-06-24  
**下次评审**: 每周一更新进度