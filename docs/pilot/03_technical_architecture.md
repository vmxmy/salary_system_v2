# 自动化薪资计算引擎技术架构

## 架构概述

### 技术栈
- **前端**：React 18 + TypeScript + Ant Design + Vite
- **后端**：Python 3.11 + FastAPI + SQLAlchemy 2.0
- **数据库**：PostgreSQL 14+
- **认证**：JWT Token + 角色权限控制
- **开发工具**：Docker + Alembic + pytest

### 架构模式
- **设计模式**：MVC + 分层架构 + 微服务化
- **数据流向**：前端 → API网关 → 业务逻辑 → 数据访问 → 数据库
- **部署模式**：前后端分离 + 容器化部署

## 后端架构

### 目录结构
```
webapp/v2/
├── models/                    # SQLAlchemy数据模型
│   ├── attendance/           # 考勤相关模型
│   ├── payroll/             # 薪资相关模型
│   └── security/            # 权限安全模型
├── pydantic_models/         # API请求响应模型
├── routers/                 # FastAPI路由器
│   ├── payroll_calculation.py
│   ├── calculation_config.py
│   └── attendance.py
├── crud/                    # 数据访问层
├── payroll_engine/         # 薪资计算引擎
│   ├── calculator/         # 计算器模块
│   └── models.py          # 计算数据模型
└── utils/                  # 工具函数
```

### 核心组件

#### 1. 薪资计算引擎 (PayrollCalculationEngine)
```python
class PayrollCalculationEngine:
    """薪资计算引擎核心类"""
    
    def __init__(self, db_session: Session):
        self.db = db_session
        self.basic_salary_calculator = BasicSalaryCalculator()
        self.social_insurance_calculator = SocialInsuranceCalculator()
        self.tax_calculator = TaxCalculator()
    
    def calculate_payroll(self, context: CalculationContext) -> CalculationResult:
        """执行薪资计算的主方法"""
        # 基础薪资计算
        # 社保公积金计算
        # 个人所得税计算
        # 结果汇总
```

#### 2. 计算器模块
- **BasicSalaryCalculator**：基础薪资计算（工资、津贴、奖金）
- **SocialInsuranceCalculator**：社保公积金计算
- **TaxCalculator**：个人所得税计算
- **AttendanceCalculator**：考勤相关计算

#### 3. 数据访问层 (CRUD)
```python
class PayrollCalculationCRUD:
    """薪资计算数据访问类"""
    
    def create_payroll_entry(self, entry_data: dict) -> PayrollEntry:
        """创建薪资记录"""
    
    def get_calculation_status(self, calculation_id: str) -> CalculationStatus:
        """获取计算状态"""
    
    def get_calculation_summary(self, payroll_run_id: int) -> dict:
        """获取计算汇总"""
```

## 数据库设计

### Schema设计
```sql
-- 薪资相关Schema
payroll.*
├── payroll_entries          # 薪资记录表
├── payroll_runs            # 薪资审核表
├── payroll_periods         # 薪资周期表
└── payroll_component_configs # 薪资组件配置

-- 考勤相关Schema
attendance.*
├── attendance_periods      # 考勤周期表
├── attendance_records      # 考勤记录表
├── daily_attendance_records # 日考勤表
└── attendance_rules        # 考勤规则表

-- 配置相关Schema
config.*
├── calculation_rule_sets   # 计算规则集
├── social_insurance_configs # 社保配置
├── tax_configs            # 税务配置
└── employee_salary_configs # 员工薪资配置
```

### 核心表结构

#### PayrollEntry (薪资记录表)
```sql
CREATE TABLE payroll.payroll_entries (
    id SERIAL PRIMARY KEY,
    payroll_run_id INTEGER REFERENCES payroll.payroll_runs(id),
    employee_id INTEGER REFERENCES hr.employees(id),
    earnings_details JSONB,          -- 收入明细
    deductions_details JSONB,        -- 扣除明细
    total_earnings DECIMAL(15,2),    -- 总收入
    total_deductions DECIMAL(15,2),  -- 总扣除
    net_pay DECIMAL(15,2),          -- 实发工资
    calculation_details JSONB,       -- 计算详情
    status_lookup_value_id INTEGER,  -- 状态
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### AttendancePeriod (考勤周期表)
```sql
CREATE TABLE attendance.attendance_periods (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

## API设计

### RESTful API规范
- **Base URL**：`http://localhost:8080/v2`
- **认证方式**：Bearer Token (JWT)
- **响应格式**：JSON
- **状态码**：标准HTTP状态码

### 核心API端点

#### 薪资计算API
```http
POST /payroll/calculation/preview     # 计算预览
POST /payroll/calculation/trigger     # 触发计算
GET  /payroll/calculation/status/{id} # 查询状态
GET  /payroll/calculation/summary/{payroll_run_id} # 汇总信息
```

#### 配置管理API
```http
# 计算规则集
GET    /payroll/calculation-config/rule-sets
POST   /payroll/calculation-config/rule-sets
PUT    /payroll/calculation-config/rule-sets/{id}
DELETE /payroll/calculation-config/rule-sets/{id}

# 社保配置
GET    /payroll/calculation-config/social-insurance
POST   /payroll/calculation-config/social-insurance
PUT    /payroll/calculation-config/social-insurance/{id}
DELETE /payroll/calculation-config/social-insurance/{id}

# 税务配置
GET    /payroll/calculation-config/tax-configs
POST   /payroll/calculation-config/tax-configs
PUT    /payroll/calculation-config/tax-configs/{id}
DELETE /payroll/calculation-config/tax-configs/{id}
```

#### 考勤管理API
```http
# 考勤周期
GET    /attendance/periods
POST   /attendance/periods
PUT    /attendance/periods/{id}
DELETE /attendance/periods/{id}

# 考勤记录
GET    /attendance/records
POST   /attendance/records
PUT    /attendance/records/{id}
DELETE /attendance/records/{id}
```

### 请求响应格式

#### 计算预览请求
```json
{
  "payroll_run_id": 1,
  "employee_ids": [1, 2, 3],
  "preview_mode": true
}
```

#### 计算结果响应
```json
{
  "status": "success",
  "data": {
    "calculation_id": "calc_123456789",
    "total_employees": 3,
    "successful_calculations": 3,
    "failed_calculations": 0,
    "results": [
      {
        "employee_id": 1,
        "employee_name": "张三",
        "total_earnings": 8500.00,
        "total_deductions": 1200.00,
        "net_pay": 7300.00,
        "calculation_details": {
          "basic_salary": 6000.00,
          "allowances": 2500.00,
          "social_insurance": 800.00,
          "income_tax": 400.00
        }
      }
    ]
  }
}
```

## 前端架构

### 组件结构
```
src/
├── components/              # 通用组件
├── pages/                  # 页面组件
│   └── Payroll/
│       ├── PayrollCalculationConfigPage.tsx
│       ├── PayrollRunsPage.tsx
│       └── AttendanceManagementPage.tsx
├── services/              # API服务
│   ├── payrollCalculationApi.ts
│   ├── calculationConfigApi.ts
│   └── attendanceApi.ts
├── types/                 # TypeScript类型定义
└── utils/                # 工具函数
```

### 状态管理
- **全局状态**：React Context + useReducer
- **本地状态**：useState + useEffect
- **服务器状态**：React Query (后续优化)

### 核心页面组件

#### PayrollCalculationConfigPage
```typescript
interface PayrollCalculationConfigPageProps {
  // 薪资计算配置页面属性
}

const PayrollCalculationConfigPage: React.FC = () => {
  // 三个标签页：计算规则集、社保配置、税务配置
  return (
    <Tabs>
      <TabPane tab="计算规则集" key="1">
        <CalculationRuleSetManager />
      </TabPane>
      <TabPane tab="社保配置" key="2">
        <SocialInsuranceConfigManager />
      </TabPane>
      <TabPane tab="税务配置" key="3">
        <TaxConfigManager />
      </TabPane>
    </Tabs>
  );
};
```

#### AttendanceManagementPage
```typescript
const AttendanceManagementPage: React.FC = () => {
  // 四个标签页：考勤周期、考勤记录、日考勤、考勤规则
  return (
    <Tabs>
      <TabPane tab="考勤周期" key="1">
        <AttendancePeriodManager />
      </TabPane>
      <TabPane tab="考勤记录" key="2">
        <AttendanceRecordManager />
      </TabPane>
      <TabPane tab="日考勤" key="3">
        <DailyAttendanceManager />
      </TabPane>
      <TabPane tab="考勤规则" key="4">
        <AttendanceRuleManager />
      </TabPane>
    </Tabs>
  );
};
```

## 安全架构

### 认证机制
- **JWT Token**：基于JSON Web Token的无状态认证
- **Token生命周期**：24小时有效期，支持刷新
- **密钥管理**：使用环境变量管理密钥

### 权限控制
- **角色权限模型**：基于角色的访问控制 (RBAC)
- **细粒度权限**：60个功能权限，覆盖12个模块
- **权限验证**：API层面统一权限检查

### 权限分配
```python
# 权限命名规范：模块:操作
permissions = [
    "payroll_calculation:trigger",    # 触发薪资计算
    "payroll_calculation:preview",    # 预览薪资计算
    "calculation_config:manage",      # 管理计算配置
    "attendance:view",               # 查看考勤数据
    "attendance_period:create",      # 创建考勤周期
    # ... 更多权限
]
```

## 数据流架构

### 计算流程
```
1. 用户触发计算 → 前端API调用
2. API验证权限 → 获取员工和配置数据
3. 薪资计算引擎 → 执行计算逻辑
4. 结果验证 → 数据持久化
5. 状态更新 → 返回结果
```

### 数据处理模式
- **输入验证**：Pydantic模型验证
- **业务逻辑**：Calculator模块处理
- **数据持久化**：SQLAlchemy ORM
- **结果序列化**：Custom JSONB处理

## 性能优化

### 数据库优化
- **索引策略**：关键字段建立索引
- **查询优化**：避免N+1查询问题
- **连接池**：数据库连接池管理

### 计算优化
- **异步处理**：大批量计算异步执行
- **缓存策略**：配置数据缓存
- **批量操作**：减少数据库访问次数

### 前端优化
- **代码分割**：按路由分割代码
- **懒加载**：组件按需加载
- **缓存策略**：API响应缓存

## 监控与日志

### 日志系统
- **应用日志**：业务操作日志
- **计算日志**：详细的计算过程记录
- **错误日志**：异常和错误信息
- **审计日志**：敏感操作审计

### 监控指标
- **性能指标**：API响应时间、数据库查询时间
- **业务指标**：计算成功率、错误率
- **系统指标**：CPU、内存、磁盘使用率

---

*文档版本：1.0*  
*最后更新：2025-06-03*  
*技术负责人：系统架构师* 