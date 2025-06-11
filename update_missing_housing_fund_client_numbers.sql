-- 更新缺失的员工公积金个人客户号
-- 基于姓名匹配更新 housing_fund_client_number 字段

BEGIN;

-- 罗先华
UPDATE hr.employees 
SET housing_fund_client_number = '220050624567'
WHERE CONCAT(last_name, first_name) = '罗先华';

-- 周至涯
UPDATE hr.employees 
SET housing_fund_client_number = '220051167698'
WHERE CONCAT(last_name, first_name) = '周至涯';

-- 罗茗文
UPDATE hr.employees 
SET housing_fund_client_number = '220050961493'
WHERE CONCAT(last_name, first_name) = '罗茗文';

-- 卢泓良
UPDATE hr.employees 
SET housing_fund_client_number = '220174749608'
WHERE CONCAT(last_name, first_name) = '卢泓良';

-- 杨也
UPDATE hr.employees 
SET housing_fund_client_number = '220206396859'
WHERE CONCAT(last_name, first_name) = '杨也';

-- 曹钰佼
UPDATE hr.employees 
SET housing_fund_client_number = '220195913819'
WHERE CONCAT(last_name, first_name) = '曹钰佼';

-- 王优
UPDATE hr.employees 
SET housing_fund_client_number = '220206396860'
WHERE CONCAT(last_name, first_name) = '王优';

-- 余浩川
UPDATE hr.employees 
SET housing_fund_client_number = '220174589382'
WHERE CONCAT(last_name, first_name) = '余浩川';

-- 陈秋如
UPDATE hr.employees 
SET housing_fund_client_number = '220206396858'
WHERE CONCAT(last_name, first_name) = '陈秋如';

-- 李洋洋
UPDATE hr.employees 
SET housing_fund_client_number = '220133209497'
WHERE CONCAT(last_name, first_name) = '李洋洋';

-- 符译文
UPDATE hr.employees 
SET housing_fund_client_number = '220229321348'
WHERE CONCAT(last_name, first_name) = '符译文';

-- 李润民
UPDATE hr.employees 
SET housing_fund_client_number = '220229321363'
WHERE CONCAT(last_name, first_name) = '李润民';

-- 伍宇星
UPDATE hr.employees 
SET housing_fund_client_number = '220185288959'
WHERE CONCAT(last_name, first_name) = '伍宇星';

-- 张秋子
UPDATE hr.employees 
SET housing_fund_client_number = '220174749607'
WHERE CONCAT(last_name, first_name) = '张秋子';

-- 何万达
UPDATE hr.employees 
SET housing_fund_client_number = '220217078641'
WHERE CONCAT(last_name, first_name) = '何万达';

-- 申龙
UPDATE hr.employees 
SET housing_fund_client_number = '220153873688'
WHERE CONCAT(last_name, first_name) = '申龙';

-- 沙砾
UPDATE hr.employees 
SET housing_fund_client_number = '220132981110'
WHERE CONCAT(last_name, first_name) = '沙砾';

-- 殷凌霄
UPDATE hr.employees 
SET housing_fund_client_number = '220143487265'
WHERE CONCAT(last_name, first_name) = '殷凌霄';

-- 李子贤
UPDATE hr.employees 
SET housing_fund_client_number = '220230329213'
WHERE CONCAT(last_name, first_name) = '李子贤';

-- 鄢银
UPDATE hr.employees 
SET housing_fund_client_number = '220153997828'
WHERE CONCAT(last_name, first_name) = '鄢银';

-- 李旻
UPDATE hr.employees 
SET housing_fund_client_number = '220051193060'
WHERE CONCAT(last_name, first_name) = '李旻';

-- 张晋维
UPDATE hr.employees 
SET housing_fund_client_number = '220206209425'
WHERE CONCAT(last_name, first_name) = '张晋维';

-- 陈琳
UPDATE hr.employees 
SET housing_fund_client_number = '220111998907'
WHERE CONCAT(last_name, first_name) = '陈琳';

-- 汪倩
UPDATE hr.employees 
SET housing_fund_client_number = '220230109554'
WHERE CONCAT(last_name, first_name) = '汪倩';

-- 赵霁梅
UPDATE hr.employees 
SET housing_fund_client_number = '220081484248'
WHERE CONCAT(last_name, first_name) = '赵霁梅';

-- 阙兮遥
UPDATE hr.employees 
SET housing_fund_client_number = '220174899015'
WHERE CONCAT(last_name, first_name) = '阙兮遥';

-- 辛文
UPDATE hr.employees 
SET housing_fund_client_number = '220132895234'
WHERE CONCAT(last_name, first_name) = '辛文';

-- 蒋文韬
UPDATE hr.employees 
SET housing_fund_client_number = '220229196181'
WHERE CONCAT(last_name, first_name) = '蒋文韬';

COMMIT;

-- 验证更新结果 - 显示所有已更新的员工
SELECT 
    CONCAT(last_name, first_name) as full_name,
    housing_fund_client_number,
    '✅ 已更新' as status
FROM hr.employees 
WHERE CONCAT(last_name, first_name) IN (
    '罗先华', '周至涯', '罗茗文', '卢泓良', '杨也', '曹钰佼', '王优', '余浩川', '陈秋如', '李洋洋',
    '符译文', '李润民', '伍宇星', '张秋子', '何万达', '申龙', '沙砾', '殷凌霄', '李子贤', '鄢银',
    '李旻', '张晋维', '陈琳', '汪倩', '赵霁梅', '阙兮遥', '辛文', '蒋文韬'
)
ORDER BY full_name;

-- 最终统计
SELECT 
    COUNT(*) as total_employees,
    COUNT(housing_fund_client_number) as has_housing_fund_number,
    COUNT(*) - COUNT(housing_fund_client_number) as missing_housing_fund_number
FROM hr.employees; 