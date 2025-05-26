-- 创建聘用人员扣除调整项工资组件
-- 解决"无效的扣除项代码"错误

-- 一次性补扣发
INSERT INTO salary_components (code, name, type, description, is_active, created_at, updated_at)
VALUES (
    'ONE_TIME_DEDUCTION_ADJUSTMENT',
    '一次性补扣发',
    'PERSONAL_DEDUCTION',
    '聘用人员一次性个人扣除调整项',
    true,
    NOW(),
    NOW()
) ON CONFLICT (code) DO NOTHING;

-- 绩效奖金补扣发
INSERT INTO salary_components (code, name, type, description, is_active, created_at, updated_at)
VALUES (
    'PERFORMANCE_BONUS_DEDUCTION_ADJUSTMENT',
    '绩效奖金补扣发',
    'PERSONAL_DEDUCTION',
    '聘用人员绩效奖金个人扣除调整项',
    true,
    NOW(),
    NOW()
) ON CONFLICT (code) DO NOTHING;

-- 奖励绩效补扣发
INSERT INTO salary_components (code, name, type, description, is_active, created_at, updated_at)
VALUES (
    'REWARD_PERFORMANCE_DEDUCTION_ADJUSTMENT',
    '奖励绩效补扣发',
    'PERSONAL_DEDUCTION',
    '聘用人员奖励绩效个人扣除调整项',
    true,
    NOW(),
    NOW()
) ON CONFLICT (code) DO NOTHING;

-- 补扣（退）款
INSERT INTO salary_components (code, name, type, description, is_active, created_at, updated_at)
VALUES (
    'REFUND_DEDUCTION_ADJUSTMENT',
    '补扣（退）款',
    'PERSONAL_DEDUCTION',
    '聘用人员退款个人扣除调整项',
    true,
    NOW(),
    NOW()
) ON CONFLICT (code) DO NOTHING;

-- 补扣2022年医保款
INSERT INTO salary_components (code, name, type, description, is_active, created_at, updated_at)
VALUES (
    'MEDICAL_2022_DEDUCTION_ADJUSTMENT',
    '补扣2022年医保款',
    'PERSONAL_DEDUCTION',
    '聘用人员2022年医保个人扣除调整项',
    true,
    NOW(),
    NOW()
) ON CONFLICT (code) DO NOTHING;

-- 验证创建结果
SELECT code, name, type FROM salary_components 
WHERE code IN (
    'ONE_TIME_DEDUCTION_ADJUSTMENT',
    'PERFORMANCE_BONUS_DEDUCTION_ADJUSTMENT', 
    'REWARD_PERFORMANCE_DEDUCTION_ADJUSTMENT',
    'REFUND_DEDUCTION_ADJUSTMENT',
    'MEDICAL_2022_DEDUCTION_ADJUSTMENT'
)
ORDER BY code; 