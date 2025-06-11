-- 更新员工公积金个人客户号
-- 基于姓名匹配更新 housing_fund_client_number 字段

BEGIN;

-- 包晓静
UPDATE hr.employees 
SET housing_fund_client_number = '220050436444'
WHERE CONCAT(last_name, first_name) = '包晓静';

-- 方敬玉  
UPDATE hr.employees 
SET housing_fund_client_number = '220050221670'
WHERE CONCAT(last_name, first_name) = '方敬玉';

-- 高洪艳
UPDATE hr.employees 
SET housing_fund_client_number = '220050361718'
WHERE CONCAT(last_name, first_name) = '高洪艳';

-- 谷颖
UPDATE hr.employees 
SET housing_fund_client_number = '220050908086'
WHERE CONCAT(last_name, first_name) = '谷颖';

-- 韩霜
UPDATE hr.employees 
SET housing_fund_client_number = '220050841906'
WHERE CONCAT(last_name, first_name) = '韩霜';

-- 何婷
UPDATE hr.employees 
SET housing_fund_client_number = '220050230417'
WHERE CONCAT(last_name, first_name) = '何婷';

-- 胡潇
UPDATE hr.employees 
SET housing_fund_client_number = '220217078640'
WHERE CONCAT(last_name, first_name) = '胡潇';

-- 黄明
UPDATE hr.employees 
SET housing_fund_client_number = '220050953332'
WHERE CONCAT(last_name, first_name) = '黄明';

-- 李薇
UPDATE hr.employees 
SET housing_fund_client_number = '220050757734'
WHERE CONCAT(last_name, first_name) = '李薇';

-- 李文媛
UPDATE hr.employees 
SET housing_fund_client_number = '220050063080'
WHERE CONCAT(last_name, first_name) = '李文媛';

-- 廖希
UPDATE hr.employees 
SET housing_fund_client_number = '220050519407'
WHERE CONCAT(last_name, first_name) = '廖希';

-- 刘丹
UPDATE hr.employees 
SET housing_fund_client_number = '220091595831'
WHERE CONCAT(last_name, first_name) = '刘丹';

-- 罗蓉
UPDATE hr.employees 
SET housing_fund_client_number = '220050406063'
WHERE CONCAT(last_name, first_name) = '罗蓉';

-- 吕果
UPDATE hr.employees 
SET housing_fund_client_number = '220050433821'
WHERE CONCAT(last_name, first_name) = '吕果';

-- 马霜
UPDATE hr.employees 
SET housing_fund_client_number = '220132874287'
WHERE CONCAT(last_name, first_name) = '马霜';

-- 蒲薇
UPDATE hr.employees 
SET housing_fund_client_number = '220050373608'
WHERE CONCAT(last_name, first_name) = '蒲薇';

-- 邱高长青
UPDATE hr.employees 
SET housing_fund_client_number = '220174589361'
WHERE CONCAT(last_name, first_name) = '邱高长青';

-- 冉光俊
UPDATE hr.employees 
SET housing_fund_client_number = '220050300993'
WHERE CONCAT(last_name, first_name) = '冉光俊';

-- 田原
UPDATE hr.employees 
SET housing_fund_client_number = '220230329217'
WHERE CONCAT(last_name, first_name) = '田原';

-- 汪琳
UPDATE hr.employees 
SET housing_fund_client_number = '220050362128'
WHERE CONCAT(last_name, first_name) = '汪琳';

-- 熊静
UPDATE hr.employees 
SET housing_fund_client_number = '220050225872'
WHERE CONCAT(last_name, first_name) = '熊静';

-- 杨洋
UPDATE hr.employees 
SET housing_fund_client_number = '220050406164'
WHERE CONCAT(last_name, first_name) = '杨洋';

-- 周宏伟
UPDATE hr.employees 
SET housing_fund_client_number = '220174586649'
WHERE CONCAT(last_name, first_name) = '周宏伟';

-- 周雪莲
UPDATE hr.employees 
SET housing_fund_client_number = '220071318693'
WHERE CONCAT(last_name, first_name) = '周雪莲';

-- 李庆
UPDATE hr.employees 
SET housing_fund_client_number = '220122834839'
WHERE CONCAT(last_name, first_name) = '李庆';

-- 张磊
UPDATE hr.employees 
SET housing_fund_client_number = '220133055355'
WHERE CONCAT(last_name, first_name) = '张磊';

COMMIT; 