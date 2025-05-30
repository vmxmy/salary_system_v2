# 报表功能数据库模型设计

## 📊 核心设计原则

1. **模块化分离**: 数据源、模板、字段、执行记录分离
2. **权限控制**: 细粒度访问控制和审计日志
3. **性能优化**: 索引优化、缓存支持、分页查询
4. **扩展性**: 支持多种数据源类型和自定义查询
5. **国际化**: 中英文双语字段支持

## 🗄️ 核心表结构

### 1. 数据源管理表组

#### 1.1 report_data_sources (数据源主表)
```sql
-- 数据源主表 - 存储数据源基本信息和连接配置
CREATE TABLE config.report_data_sources (
    id BIGSERIAL PRIMARY KEY,
    
    -- 基础信息
    code VARCHAR(100) UNIQUE NOT NULL COMMENT '数据源编码',
    name VARCHAR(200) NOT NULL COMMENT '数据源名称',
    description TEXT COMMENT '数据源描述',
    category VARCHAR(50) COMMENT '数据源分类',
    
    -- 连接配置
    connection_type VARCHAR(50) NOT NULL DEFAULT 'postgresql' COMMENT '连接类型',
    schema_name VARCHAR(100) NOT NULL DEFAULT 'public' COMMENT '模式名',
    table_name VARCHAR(100) COMMENT '表名',
    view_name VARCHAR(100) COMMENT '视图名',
    custom_query TEXT COMMENT '自定义查询SQL',
    source_type VARCHAR(20) NOT NULL DEFAULT 'table' COMMENT '数据源类型: table, view, query',
    
    -- 高级配置
    connection_config JSONB COMMENT '连接配置信息',
    field_mapping JSONB COMMENT '字段映射配置',
    default_filters JSONB COMMENT '默认筛选条件',
    sort_config JSONB COMMENT '默认排序配置',
    
    -- 权限控制
    access_level VARCHAR(20) DEFAULT 'public' COMMENT '访问级别: public, private, restricted',
    allowed_roles JSONB COMMENT '允许访问的角色列表',
    allowed_users JSONB COMMENT '允许访问的用户列表',
    
    -- 性能配置
    cache_enabled BOOLEAN DEFAULT FALSE COMMENT '是否启用缓存',
    cache_duration INTEGER DEFAULT 3600 COMMENT '缓存时长(秒)',
    max_rows INTEGER DEFAULT 10000 COMMENT '最大返回行数',
    
    -- 状态和显示
    is_active BOOLEAN DEFAULT TRUE COMMENT '是否激活',
    is_system BOOLEAN DEFAULT FALSE COMMENT '是否系统内置',
    sort_order INTEGER DEFAULT 0 COMMENT '排序顺序',
    tags JSONB COMMENT '标签',
    
    -- 统计信息
    field_count INTEGER DEFAULT 0 COMMENT '字段数量',
    usage_count INTEGER DEFAULT 0 COMMENT '使用次数',
    last_used_at TIMESTAMPTZ COMMENT '最后使用时间',
    last_sync_at TIMESTAMPTZ COMMENT '最后同步时间',
    
    -- 审计字段
    created_by BIGINT REFERENCES security.users(id) COMMENT '创建者',
    updated_by BIGINT REFERENCES security.users(id) COMMENT '更新者',
    created_at TIMESTAMPTZ DEFAULT NOW() COMMENT '创建时间',
    updated_at TIMESTAMPTZ DEFAULT NOW() COMMENT '更新时间'
);
```

#### 1.2 report_data_source_fields (数据源字段表)
```sql
-- 数据源字段表 - 存储数据源的字段定义和配置
CREATE TABLE config.report_data_source_fields (
    id BIGSERIAL PRIMARY KEY,
    data_source_id BIGINT NOT NULL REFERENCES config.report_data_sources(id) ON DELETE CASCADE,
    
    -- 基础字段信息
    field_name VARCHAR(100) NOT NULL COMMENT '原始字段名',
    field_alias VARCHAR(100) COMMENT '字段别名',
    field_type VARCHAR(50) NOT NULL COMMENT '字段类型',
    data_type VARCHAR(50) COMMENT '数据库数据类型',
    
    -- 显示配置
    display_name_zh VARCHAR(200) COMMENT '中文显示名称',
    display_name_en VARCHAR(200) COMMENT '英文显示名称',
    description TEXT COMMENT '字段描述',
    
    -- 字段属性
    is_nullable BOOLEAN DEFAULT TRUE COMMENT '是否可为空',
    is_primary_key BOOLEAN DEFAULT FALSE COMMENT '是否主键',
    is_foreign_key BOOLEAN DEFAULT FALSE COMMENT '是否外键',
    is_indexed BOOLEAN DEFAULT FALSE COMMENT '是否有索引',
    
    -- 显示和权限控制
    is_visible BOOLEAN DEFAULT TRUE COMMENT '是否可见',
    is_searchable BOOLEAN DEFAULT TRUE COMMENT '是否可搜索',
    is_sortable BOOLEAN DEFAULT TRUE COMMENT '是否可排序',
    is_filterable BOOLEAN DEFAULT TRUE COMMENT '是否可筛选',
    is_exportable BOOLEAN DEFAULT TRUE COMMENT '是否可导出',
    
    -- 分组和分类
    field_group VARCHAR(50) COMMENT '字段分组',
    field_category VARCHAR(50) COMMENT '字段分类',
    sort_order INTEGER DEFAULT 0 COMMENT '排序顺序',
    
    -- 格式化配置
    format_config JSONB COMMENT '格式化配置',
    validation_rules JSONB COMMENT '验证规则',
    lookup_config JSONB COMMENT '查找表配置',
    
    -- 统计配置
    enable_aggregation BOOLEAN DEFAULT FALSE COMMENT '是否启用聚合',
    aggregation_functions JSONB COMMENT '可用聚合函数',
    
    -- 审计字段
    created_at TIMESTAMPTZ DEFAULT NOW() COMMENT '创建时间',
    updated_at TIMESTAMPTZ DEFAULT NOW() COMMENT '更新时间'
);
```

### 2. 报表模板表组

#### 2.1 report_templates (报表模板主表)
```sql
-- 报表模板主表 - 存储报表模板基本信息
CREATE TABLE config.report_templates (
    id BIGSERIAL PRIMARY KEY,
    
    -- 基础信息
    name VARCHAR(100) NOT NULL COMMENT '模板名称',
    title VARCHAR(200) COMMENT '自定义标题',
    description TEXT COMMENT '描述',
    category VARCHAR(50) COMMENT '分类',
    
    -- 数据源关联
    data_source_id BIGINT REFERENCES config.report_data_sources(id) COMMENT '数据源ID',
    
    -- 模板配置
    template_config JSONB COMMENT '模板配置',
    
    -- 状态和权限
    is_active BOOLEAN DEFAULT TRUE COMMENT '是否激活',
    is_public BOOLEAN DEFAULT FALSE COMMENT '是否公开',
    sort_order INTEGER DEFAULT 0 COMMENT '排序顺序',
    
    -- 审计字段
    created_by BIGINT NOT NULL REFERENCES security.users(id) COMMENT '创建者',
    created_at TIMESTAMPTZ DEFAULT NOW() COMMENT '创建时间',
    updated_at TIMESTAMPTZ DEFAULT NOW() COMMENT '更新时间'
);
```

## 📋 索引设计

```sql
-- 数据源表索引
CREATE INDEX idx_data_source_type_active ON config.report_data_sources(source_type, is_active);
CREATE INDEX idx_data_source_category ON config.report_data_sources(category);
CREATE INDEX idx_data_source_schema_table ON config.report_data_sources(schema_name, table_name);

-- 数据源字段表索引
CREATE INDEX idx_ds_field_source_name ON config.report_data_source_fields(data_source_id, field_name);
CREATE INDEX idx_ds_field_visible_sortable ON config.report_data_source_fields(is_visible, sort_order);
``` 