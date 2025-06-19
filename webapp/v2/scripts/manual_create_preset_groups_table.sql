-- 手动创建预设分组表的SQL脚本
-- 如果自动迁移失败，可以手动执行此脚本

-- 创建预设分组表
CREATE TABLE IF NOT EXISTS config.report_user_preference_groups (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    name VARCHAR(50) NOT NULL,
    description VARCHAR(200),
    color VARCHAR(7),
    icon VARCHAR(50),
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- 外键约束
    CONSTRAINT fk_report_user_preference_groups_user_id 
        FOREIGN KEY (user_id) REFERENCES security.users(id) ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_preference_groups_user 
    ON config.report_user_preference_groups(user_id);

CREATE INDEX IF NOT EXISTS idx_user_preference_groups_name 
    ON config.report_user_preference_groups(user_id, name);

CREATE INDEX IF NOT EXISTS idx_user_preference_groups_order 
    ON config.report_user_preference_groups(user_id, sort_order);

-- 创建唯一约束（用户内分组名称唯一）
CREATE UNIQUE INDEX IF NOT EXISTS uq_user_preference_group_name 
    ON config.report_user_preference_groups(user_id, name);

-- 添加更新时间触发器
CREATE OR REPLACE FUNCTION update_report_user_preference_groups_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_report_user_preference_groups_updated_at 
    ON config.report_user_preference_groups;

CREATE TRIGGER trigger_update_report_user_preference_groups_updated_at
    BEFORE UPDATE ON config.report_user_preference_groups
    FOR EACH ROW
    EXECUTE FUNCTION update_report_user_preference_groups_updated_at();

-- 检查表是否创建成功
SELECT 
    table_name,
    table_schema,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'config' 
AND table_name = 'report_user_preference_groups';

-- 检查索引是否创建成功
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'report_user_preference_groups' 
AND schemaname = 'config';

-- 输出确认信息
SELECT 'report_user_preference_groups表创建完成' AS status;