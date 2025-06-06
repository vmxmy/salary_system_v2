# 薪资系统数据库优化计划

## 📋 **优化目标**

基于当前系统分析，我们需要解决以下关键问题：

1. **审核功能缺失**：缺少完整的审核表结构和流程
2. **性能问题**：API 响应时间过长（3-17秒）
3. **数据完整性**：合计字段计算和校验机制不完善
4. **可追溯性**：缺少审核历史和变更记录

## 🎯 **回答用户的三个核心问题**

### 1. **计算合计字段放在哪个环节？**

**✅ 推荐方案：多层次计算策略**

```
数据录入 → 前端实时计算 → 后端验证计算 → 数据库存储 → 审核验证
    ↓           ↓              ↓            ↓           ↓
  即时反馈    用户体验      数据一致性    持久化存储   最终确认
```

**具体实现**：
- **前端层**：实时计算，提供即时反馈
- **服务层**：保存前重新计算，确保一致性
- **数据库层**：存储计算结果到 `gross_pay`、`total_deductions`、`net_pay`
- **审核层**：验证计算正确性，记录异常

### 2. **计算合计字段校验放在哪个环节？**

**✅ 推荐方案：三层校验体系**

#### **第一层：数据保存时校验**
```python
# 在 PayrollEntry 保存前
def validate_calculation_consistency(entry):
    calculated_gross = sum(entry.earnings_details.values())
    calculated_deductions = sum(entry.deductions_details.values())
    calculated_net = calculated_gross - calculated_deductions
    
    if abs(entry.gross_pay - calculated_gross) > 0.01:
        raise ValidationError("总收入与明细不一致")
```

#### **第二层：审核环节校验**
```python
# 在审核服务中
class PayrollAuditService:
    def run_calculation_consistency_check(self, payroll_run_id):
        # 批量检查所有条目的计算一致性
        # 生成异常报告
        # 提供自动修复建议
```

#### **第三层：月度快照校验**
```python
# 生成月度快照前的最终校验
def create_monthly_snapshot(period_id):
    # 确保所有数据都通过审核
    # 重新验证计算结果
    # 生成不可变的月度快照
```

### 3. **校验完包含合计字段的数据写入哪里？**

**✅ 推荐方案：分层存储架构**

#### **源数据表** (`payroll.payroll_entries`)
- **用途**：存储原始计算数据和工作中数据
- **特点**：可修改、可审核、有版本控制
- **新增字段**：
  - `audit_status`: 审核状态 (PENDING/PASSED/FAILED/WARNING)
  - `audit_timestamp`: 审核时间
  - `auditor_id`: 审核员ID
  - `version`: 数据版本号（乐观锁）

#### **月度快照表** (`payroll.monthly_payroll_snapshots`)
- **用途**：存储审核通过后的不可变数据
- **特点**：只读、历史记录、用于报表和对比
- **触发条件**：审核状态为 PASSED 且无未解决异常

#### **核心业务视图** (`payroll.audit_overview`)
- **用途**：提供跨月份的审核概览和统计
- **特点**：实时计算、多维度分析、性能优化

## 🚀 **数据库迁移方案**

### **Phase 1: 增强审核系统表结构**

```bash
# 激活 Python 环境
conda activate lightweight-salary-system

# 执行数据库迁移
cd webapp/v2
alembic upgrade head
```

### **新增表结构概览**

#### 1. **薪资审核汇总表** (`payroll_run_audit_summary`)
```sql
-- 存储每次薪资运行的审核汇总信息
CREATE TABLE payroll.payroll_run_audit_summary (
    id BIGINT PRIMARY KEY,
    payroll_run_id BIGINT REFERENCES payroll.payroll_runs(id),
    total_entries INTEGER DEFAULT 0,
    total_anomalies INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    warning_count INTEGER DEFAULT 0,
    auto_fixable_count INTEGER DEFAULT 0,
    audit_status VARCHAR(20) DEFAULT 'PENDING',
    audit_type VARCHAR(20) DEFAULT 'BASIC',
    audit_details JSONB,
    total_gross_pay NUMERIC(15,2) DEFAULT 0,
    total_net_pay NUMERIC(15,2) DEFAULT 0,
    total_deductions NUMERIC(15,2) DEFAULT 0,
    -- ... 更多字段
);
```

#### 2. **薪资审核异常表** (`payroll_audit_anomalies`)
```sql
-- 存储具体的审核异常和问题
CREATE TABLE payroll.payroll_audit_anomalies (
    id VARCHAR(50) PRIMARY KEY,
    payroll_entry_id BIGINT REFERENCES payroll.payroll_entries(id),
    employee_id BIGINT REFERENCES hr.employees(id),
    anomaly_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    current_value NUMERIC(15,2),
    expected_value NUMERIC(15,2),
    can_auto_fix BOOLEAN DEFAULT FALSE,
    is_ignored BOOLEAN DEFAULT FALSE,
    suggested_action TEXT,
    -- ... 更多字段
);
```

#### 3. **薪资审核历史表** (`payroll_audit_history`)
```sql
-- 记录所有审核操作的历史
CREATE TABLE payroll.payroll_audit_history (
    id BIGINT PRIMARY KEY,
    payroll_entry_id BIGINT REFERENCES payroll.payroll_entries(id),
    audit_type VARCHAR(50) NOT NULL,
    audit_result JSONB,
    before_data JSONB,  -- 审核前数据快照
    after_data JSONB,   -- 审核后数据快照
    changes_applied JSONB,
    auditor_id BIGINT NOT NULL,
    audit_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- ... 更多字段
);
```

#### 4. **月度薪资快照表** (`monthly_payroll_snapshots`)
```sql
-- 存储审核通过后的月度数据快照
CREATE TABLE payroll.monthly_payroll_snapshots (
    id BIGINT PRIMARY KEY,
    period_id BIGINT REFERENCES payroll.payroll_periods(id),
    employee_id BIGINT REFERENCES hr.employees(id),
    payroll_run_id BIGINT REFERENCES payroll.payroll_runs(id),
    gross_pay NUMERIC(15,2) DEFAULT 0,
    total_deductions NUMERIC(15,2) DEFAULT 0,
    net_pay NUMERIC(15,2) DEFAULT 0,
    earnings_details JSONB DEFAULT '{}',
    deductions_details JSONB DEFAULT '{}',
    audit_status VARCHAR(20) NOT NULL,
    snapshot_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- ... 更多字段
    UNIQUE(period_id, employee_id)
);
```

#### 5. **审核规则配置表** (`audit_rule_configurations`)
```sql
-- 配置化的审核规则
CREATE TABLE payroll.audit_rule_configurations (
    id BIGINT PRIMARY KEY,
    rule_code VARCHAR(50) UNIQUE NOT NULL,
    rule_name VARCHAR(200) NOT NULL,
    rule_category VARCHAR(50) NOT NULL,
    severity_level VARCHAR(20) DEFAULT 'warning',
    is_enabled BOOLEAN DEFAULT TRUE,
    can_auto_fix BOOLEAN DEFAULT FALSE,
    rule_parameters JSONB,
    error_message_template TEXT,
    suggested_action_template TEXT,
    -- ... 更多字段
);
```

### **Phase 2: 性能优化索引**

#### **核心查询索引**
```sql
-- payroll_entries 表优化
CREATE INDEX idx_payroll_entries_audit_status ON payroll.payroll_entries(audit_status);
CREATE INDEX idx_payroll_entries_period_run ON payroll.payroll_entries(payroll_period_id, payroll_run_id);
CREATE INDEX idx_payroll_entries_employee_period ON payroll.payroll_entries(employee_id, payroll_period_id);

-- JSONB 字段 GIN 索引（提升 JSONB 查询性能）
CREATE INDEX idx_payroll_entries_earnings_details_gin ON payroll.payroll_entries USING gin(earnings_details);
CREATE INDEX idx_payroll_entries_deductions_details_gin ON payroll.payroll_entries USING gin(deductions_details);
```

#### **审核相关索引**
```sql
-- 审核异常表索引
CREATE INDEX idx_audit_anomalies_payroll_run ON payroll.payroll_audit_anomalies(payroll_run_id);
CREATE INDEX idx_audit_anomalies_type_severity ON payroll.payroll_audit_anomalies(anomaly_type, severity);
CREATE INDEX idx_audit_anomalies_can_auto_fix ON payroll.payroll_audit_anomalies(can_auto_fix);

-- 月度快照表索引
CREATE INDEX idx_monthly_snapshots_period_employee ON payroll.monthly_payroll_snapshots(period_id, employee_id);
CREATE INDEX idx_monthly_snapshots_audit_status ON payroll.monthly_payroll_snapshots(audit_status);
```

### **Phase 3: 数据库视图**

#### **审核概览视图**
```sql
CREATE VIEW payroll.audit_overview AS
SELECT 
    pr.id as payroll_run_id,
    pp.name as period_name,
    COUNT(pe.id) as total_entries,
    COUNT(CASE WHEN pe.audit_status = 'PASSED' THEN 1 END) as passed_entries,
    COUNT(CASE WHEN pe.audit_status = 'FAILED' THEN 1 END) as failed_entries,
    SUM(pe.gross_pay) as total_gross_pay,
    SUM(pe.net_pay) as total_net_pay,
    COALESCE(ras.total_anomalies, 0) as total_anomalies
FROM payroll.payroll_runs pr
JOIN payroll.payroll_periods pp ON pr.payroll_period_id = pp.id
LEFT JOIN payroll.payroll_entries pe ON pr.id = pe.payroll_run_id
LEFT JOIN payroll.payroll_run_audit_summary ras ON pr.id = ras.payroll_run_id
GROUP BY pr.id, pp.name, ras.total_anomalies
ORDER BY pr.id DESC;
```

## 📊 **预期性能改进**

### **查询性能提升**
- **JSONB GIN 索引**：JSONB 字段查询性能提升 5-10倍
- **复合索引**：常用查询组合性能提升 3-5倍
- **分区策略**：大表查询性能提升 2-3倍

### **存储优化**
- **数据分层**：热数据与冷数据分离
- **索引优化**：减少不必要的全表扫描
- **视图缓存**：复杂查询结果缓存

### **并发性能**
- **乐观锁**：通过 version 字段避免锁竞争
- **读写分离**：查询使用视图，写入使用源表
- **批量操作**：支持批量审核和修复

## 🔄 **执行审核按钮的完整流程设计**

### **当前执行逻辑**
```typescript
// 前端：基础审核
const handleRunAudit = async () => {
  // 1. 调用 POST /v2/simple-payroll/audit/check/{payrollRunId}
  // 2. 获取审核汇总信息
  // 3. 加载异常列表
  // 4. 显示成功消息
}
```

### **增强后的执行逻辑**

#### **第一阶段：数据预处理**
```python
def prepare_audit_data(payroll_run_id):
    # 1. 验证薪资运行状态
    # 2. 重新计算所有合计字段
    # 3. 更新 payroll_entries 的计算结果
    # 4. 创建审核前数据快照
```

#### **第二阶段：执行审核检查**
```python
def run_comprehensive_audit(payroll_run_id):
    # 1. 加载审核规则配置
    # 2. 执行各类审核检查：
    #    - 计算一致性检查
    #    - 最低工资标准检查
    #    - 个税计算检查
    #    - 社保合规检查
    #    - 工资波动检查
    # 3. 生成异常记录
    # 4. 创建审核汇总
```

#### **第三阶段：结果处理**
```python
def process_audit_results(payroll_run_id):
    # 1. 更新 payroll_entries 的 audit_status
    # 2. 保存审核历史记录
    # 3. 标记可自动修复的异常
    # 4. 生成审核报告
```

#### **第四阶段：自动修复（可选）**
```python
def auto_fix_anomalies(payroll_run_id):
    # 1. 识别可自动修复的异常
    # 2. 应用修复逻辑
    # 3. 重新验证修复结果
    # 4. 更新异常状态
```

#### **第五阶段：生成快照（审核通过后）**
```python
def create_monthly_snapshot(payroll_run_id):
    # 1. 验证所有条目都已审核通过
    # 2. 生成月度快照记录
    # 3. 标记数据为最终状态
    # 4. 触发报表生成
```

## 🎯 **实施建议**

### **立即执行**
1. **运行 Alembic 迁移**：创建新的表结构和索引
2. **更新后端模型**：添加对应的 SQLAlchemy 模型
3. **修改审核服务**：实现新的审核逻辑

### **分阶段实施**
1. **Week 1**：数据库结构迁移和基础审核功能
2. **Week 2**：前端界面更新和异常处理
3. **Week 3**：自动修复功能和月度快照
4. **Week 4**：性能优化和压力测试

### **风险控制**
1. **备份策略**：迁移前完整备份数据库
2. **回滚计划**：准备完整的 downgrade 脚本
3. **渐进式部署**：先在测试环境验证
4. **监控告警**：设置性能和错误监控

## 📈 **预期收益**

### **功能完善**
- ✅ 完整的审核流程和异常处理
- ✅ 自动修复和人工干预机制
- ✅ 历史追溯和变更记录
- ✅ 月度数据快照和报表支持

### **性能提升**
- ✅ API 响应时间从 3-17秒 降低到 0.5-2秒
- ✅ JSONB 查询性能提升 5-10倍
- ✅ 复杂报表查询性能提升 3-5倍

### **数据质量**
- ✅ 计算一致性保证
- ✅ 合规性自动检查
- ✅ 异常数据及时发现和修复
- ✅ 审核流程标准化

这个优化方案将显著提升系统的可靠性、性能和用户体验！ 