# 报表功能辅助表设计

## 🔧 辅助表组设计

### 3. 报表字段表组

#### 3.1 report_template_fields (报表模板字段表)
```sql
-- 报表模板字段表 - 存储报表模板中的字段配置
CREATE TABLE config.report_template_fields (
    id BIGSERIAL PRIMARY KEY,
    template_id BIGINT NOT NULL REFERENCES config.report_templates(id) ON DELETE CASCADE,
    
    -- 字段定义
    field_name VARCHAR(100) NOT NULL COMMENT '字段名',
    field_alias VARCHAR(100) COMMENT '字段别名',
    data_source VARCHAR(50) NOT NULL COMMENT '数据源类型',
    field_type VARCHAR(50) NOT NULL COMMENT '字段类型',
    
    -- 显示配置
    display_order INTEGER DEFAULT 0 COMMENT '显示顺序',
    is_visible BOOLEAN DEFAULT TRUE COMMENT '是否可见',
    is_sortable BOOLEAN DEFAULT TRUE COMMENT '是否可排序',
    is_filterable BOOLEAN DEFAULT TRUE COMMENT '是否可筛选',
    width INTEGER COMMENT '列宽',
    
    -- 格式化和计算
    formatting_config JSONB COMMENT '格式化配置',
    calculation_formula TEXT COMMENT '计算公式'
);
```

#### 3.2 report_calculated_fields (计算字段表)
```sql
-- 计算字段表 - 存储全局和模板级别的计算字段
CREATE TABLE config.report_calculated_fields (
    id BIGSERIAL PRIMARY KEY,
    
    -- 基础信息
    name VARCHAR(100) NOT NULL COMMENT '字段名称',
    alias VARCHAR(100) NOT NULL COMMENT '字段别名',
    formula TEXT NOT NULL COMMENT '计算公式',
    return_type VARCHAR(50) NOT NULL COMMENT '返回类型',
    description TEXT COMMENT '描述',
    
    -- 显示配置
    display_name_zh VARCHAR(100) COMMENT '中文显示名称',
    display_name_en VARCHAR(100) COMMENT '英文显示名称',
    
    -- 作用域配置
    is_global BOOLEAN DEFAULT TRUE COMMENT '是否全局字段',
    is_active BOOLEAN DEFAULT TRUE COMMENT '是否激活',
    category VARCHAR(50) COMMENT '分类',
    
    -- 审计字段
    created_by BIGINT REFERENCES security.users(id) COMMENT '创建者',
    created_at TIMESTAMPTZ DEFAULT NOW() COMMENT '创建时间',
    updated_at TIMESTAMPTZ DEFAULT NOW() COMMENT '更新时间'
);
```

### 4. 执行和日志表组

#### 4.1 report_executions (报表执行记录表)
```sql
-- 报表执行记录表 - 存储报表执行历史和结果
CREATE TABLE config.report_executions (
    id BIGSERIAL PRIMARY KEY,
    template_id BIGINT NOT NULL REFERENCES config.report_templates(id),
    
    -- 执行参数
    execution_params JSONB COMMENT '执行参数',
    
    -- 执行状态
    status VARCHAR(20) DEFAULT 'pending' COMMENT '执行状态: pending, running, completed, failed',
    result_count INTEGER COMMENT '结果数量',
    execution_time DECIMAL(10,3) COMMENT '执行时间(秒)',
    error_message TEXT COMMENT '错误信息',
    
    -- 文件信息
    file_path VARCHAR(500) COMMENT '导出文件路径',
    file_size BIGINT COMMENT '文件大小(字节)',
    file_format VARCHAR(20) COMMENT '文件格式: xlsx, csv, pdf',
    
    -- 审计字段
    executed_by BIGINT REFERENCES security.users(id) COMMENT '执行者',
    executed_at TIMESTAMPTZ DEFAULT NOW() COMMENT '执行时间'
);
```

#### 4.2 report_data_source_access_logs (数据源访问日志表)
```sql
-- 数据源访问日志表 - 记录数据源的访问情况
CREATE TABLE config.report_data_source_access_logs (
    id BIGSERIAL PRIMARY KEY,
    data_source_id BIGINT NOT NULL REFERENCES config.report_data_sources(id),
    user_id BIGINT NOT NULL REFERENCES security.users(id),
    
    -- 访问信息
    access_type VARCHAR(20) NOT NULL COMMENT '访问类型: view, query, export, test',
    access_result VARCHAR(20) NOT NULL COMMENT '访问结果: success, failed, denied',
    
    -- 查询信息
    query_params JSONB COMMENT '查询参数',
    result_count INTEGER COMMENT '返回记录数',
    execution_time DECIMAL(10,3) COMMENT '执行时间(秒)',
    error_message TEXT COMMENT '错误信息',
    
    -- 客户端信息
    ip_address VARCHAR(45) COMMENT 'IP地址',
    user_agent VARCHAR(500) COMMENT '用户代理',
    
    -- 时间戳
    accessed_at TIMESTAMPTZ DEFAULT NOW() COMMENT '访问时间'
);
```

### 5. 权限和配置表组

#### 5.1 report_permissions (报表权限表)
```sql
-- 报表权限表 - 细粒度权限控制
CREATE TABLE config.report_permissions (
    id BIGSERIAL PRIMARY KEY,
    
    -- 权限主体
    subject_type VARCHAR(20) NOT NULL COMMENT '主体类型: user, role, department',
    subject_id BIGINT NOT NULL COMMENT '主体ID',
    
    -- 权限对象
    object_type VARCHAR(20) NOT NULL COMMENT '对象类型: data_source, template, field',
    object_id BIGINT NOT NULL COMMENT '对象ID',
    
    -- 权限类型
    permission_type VARCHAR(20) NOT NULL COMMENT '权限类型: read, write, execute, export, admin',
    
    -- 权限配置
    is_granted BOOLEAN DEFAULT TRUE COMMENT '是否授权',
    conditions JSONB COMMENT '权限条件',
    
    -- 审计字段
    granted_by BIGINT REFERENCES security.users(id) COMMENT '授权者',
    granted_at TIMESTAMPTZ DEFAULT NOW() COMMENT '授权时间',
    expires_at TIMESTAMPTZ COMMENT '过期时间'
);
```

#### 5.2 report_user_preferences (用户偏好设置表)
```sql
-- 用户偏好设置表 - 存储用户的报表使用偏好
CREATE TABLE config.report_user_preferences (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES security.users(id),
    
    -- 偏好类型
    preference_type VARCHAR(50) NOT NULL COMMENT '偏好类型: layout, filter, sort, export',
    object_type VARCHAR(20) COMMENT '对象类型: template, data_source',
    object_id BIGINT COMMENT '对象ID',
    
    -- 偏好配置
    preference_config JSONB NOT NULL COMMENT '偏好配置',
    
    -- 审计字段
    created_at TIMESTAMPTZ DEFAULT NOW() COMMENT '创建时间',
    updated_at TIMESTAMPTZ DEFAULT NOW() COMMENT '更新时间',
    
    -- 唯一约束
    UNIQUE(user_id, preference_type, object_type, object_id)
);
```

## 📋 辅助表索引设计

```sql
-- 执行记录表索引
CREATE INDEX idx_report_executions_template ON config.report_executions(template_id);
CREATE INDEX idx_report_executions_user_time ON config.report_executions(executed_by, executed_at);
CREATE INDEX idx_report_executions_status ON config.report_executions(status);

-- 访问日志表索引
CREATE INDEX idx_access_log_data_source ON config.report_data_source_access_logs(data_source_id);
CREATE INDEX idx_access_log_user ON config.report_data_source_access_logs(user_id);
CREATE INDEX idx_access_log_accessed_at ON config.report_data_source_access_logs(accessed_at);
CREATE INDEX idx_access_log_type_result ON config.report_data_source_access_logs(access_type, access_result);

-- 权限表索引
CREATE INDEX idx_report_permissions_subject ON config.report_permissions(subject_type, subject_id);
CREATE INDEX idx_report_permissions_object ON config.report_permissions(object_type, object_id);
CREATE INDEX idx_report_permissions_type ON config.report_permissions(permission_type);

-- 用户偏好表索引
CREATE INDEX idx_user_preferences_user ON config.report_user_preferences(user_id);
CREATE INDEX idx_user_preferences_type ON config.report_user_preferences(preference_type);
```

## 🔗 外键约束设计

```sql
-- 模板字段表外键
ALTER TABLE config.report_template_fields 
ADD CONSTRAINT fk_template_fields_template 
FOREIGN KEY (template_id) REFERENCES config.report_templates(id) ON DELETE CASCADE;

-- 执行记录表外键
ALTER TABLE config.report_executions 
ADD CONSTRAINT fk_executions_template 
FOREIGN KEY (template_id) REFERENCES config.report_templates(id);

ALTER TABLE config.report_executions 
ADD CONSTRAINT fk_executions_user 
FOREIGN KEY (executed_by) REFERENCES security.users(id);

-- 访问日志表外键
ALTER TABLE config.report_data_source_access_logs 
ADD CONSTRAINT fk_access_logs_data_source 
FOREIGN KEY (data_source_id) REFERENCES config.report_data_sources(id);

ALTER TABLE config.report_data_source_access_logs 
ADD CONSTRAINT fk_access_logs_user 
FOREIGN KEY (user_id) REFERENCES security.users(id);
``` 