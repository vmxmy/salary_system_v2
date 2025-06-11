-- 更新员工公积金个人客户号 - 第二部分
-- 基于姓名匹配更新 housing_fund_client_number 字段

BEGIN;

-- 杨钰婕
UPDATE hr.employees 
SET housing_fund_client_number = '220230329137'
WHERE CONCAT(last_name, first_name) = '杨钰婕';

-- 张福祥
UPDATE hr.employees 
SET housing_fund_client_number = '220230329055'
WHERE CONCAT(last_name, first_name) = '张福祥';

-- 刘嘉
UPDATE hr.employees 
SET housing_fund_client_number = '220050372405'
WHERE CONCAT(last_name, first_name) = '刘嘉';

-- 唐国晋
UPDATE hr.employees 
SET housing_fund_client_number = '220217078642'
WHERE CONCAT(last_name, first_name) = '唐国晋';

-- 胡艺山
UPDATE hr.employees 
SET housing_fund_client_number = '220153873685'
WHERE CONCAT(last_name, first_name) = '胡艺山';

-- 李汶卿
UPDATE hr.employees 
SET housing_fund_client_number = '220240355232'
WHERE CONCAT(last_name, first_name) = '李汶卿';

-- 黄卓尔
UPDATE hr.employees 
SET housing_fund_client_number = '220230232075'
WHERE CONCAT(last_name, first_name) = '黄卓尔';

-- 杨圣
UPDATE hr.employees 
SET housing_fund_client_number = '220217214325'
WHERE CONCAT(last_name, first_name) = '杨圣';

-- 郑偲
UPDATE hr.employees 
SET housing_fund_client_number = '220112311000'
WHERE CONCAT(last_name, first_name) = '郑偲';

-- 江慧
UPDATE hr.employees 
SET housing_fund_client_number = '220153729479'
WHERE CONCAT(last_name, first_name) = '江慧';

-- 张练
UPDATE hr.employees 
SET housing_fund_client_number = '220133055333'
WHERE CONCAT(last_name, first_name) = '张练';

-- 张净
UPDATE hr.employees 
SET housing_fund_client_number = '220153689722'
WHERE CONCAT(last_name, first_name) = '张净';

-- 宋方圆
UPDATE hr.employees 
SET housing_fund_client_number = '220122566095'
WHERE CONCAT(last_name, first_name) = '宋方圆';

-- 阴琪
UPDATE hr.employees 
SET housing_fund_client_number = '220091692451'
WHERE CONCAT(last_name, first_name) = '阴琪';

-- 谢欣然
UPDATE hr.employees 
SET housing_fund_client_number = '220101865607'
WHERE CONCAT(last_name, first_name) = '谢欣然';

-- 张玲
UPDATE hr.employees 
SET housing_fund_client_number = '220050611085'
WHERE CONCAT(last_name, first_name) = '张玲';

-- 杜疆
UPDATE hr.employees 
SET housing_fund_client_number = '220050388803'
WHERE CONCAT(last_name, first_name) = '杜疆';

-- 杨勤文
UPDATE hr.employees 
SET housing_fund_client_number = '220050374863'
WHERE CONCAT(last_name, first_name) = '杨勤文';

-- 赖梅
UPDATE hr.employees 
SET housing_fund_client_number = '220112073864'
WHERE CONCAT(last_name, first_name) = '赖梅';

-- 阮永强
UPDATE hr.employees 
SET housing_fund_client_number = '220050361832'
WHERE CONCAT(last_name, first_name) = '阮永强';

-- 沈丽萍
UPDATE hr.employees 
SET housing_fund_client_number = '220050905800'
WHERE CONCAT(last_name, first_name) = '沈丽萍';

-- 陈敏
UPDATE hr.employees 
SET housing_fund_client_number = '220050381852'
WHERE CONCAT(last_name, first_name) = '陈敏';

-- 周湜杰
UPDATE hr.employees 
SET housing_fund_client_number = '220050372653'
WHERE CONCAT(last_name, first_name) = '周湜杰';

-- 徐云祥
UPDATE hr.employees 
SET housing_fund_client_number = '220081554522'
WHERE CONCAT(last_name, first_name) = '徐云祥';

-- 徐颖
UPDATE hr.employees 
SET housing_fund_client_number = '220081484249'
WHERE CONCAT(last_name, first_name) = '徐颖';

-- 李佳
UPDATE hr.employees 
SET housing_fund_client_number = '220133108537'
WHERE CONCAT(last_name, first_name) = '李佳';

-- 卢妍如
UPDATE hr.employees 
SET housing_fund_client_number = '220174521308'
WHERE CONCAT(last_name, first_name) = '卢妍如';

COMMIT;

-- 验证更新结果
SELECT 
    CONCAT(last_name, first_name) as full_name,
    housing_fund_client_number
FROM hr.employees 
WHERE housing_fund_client_number IS NOT NULL
ORDER BY full_name; 