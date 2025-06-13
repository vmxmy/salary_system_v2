-- =====================================================
-- 月度报表视图定义文件
-- Monthly Report Views Definition
-- =====================================================
-- 创建日期: 2025-01-08
-- 描述: 定义月度统计和分析报表视图
-- 命名规范: v_monthly_{英文编码}
-- Schema: reports
-- =====================================================

-- 使用reports schema
SET search_path = reports, hr, payroll, config, security;

-- =====================================================
-- 月度报表视图定义区域
-- Monthly Report Views Definition Section
-- =====================================================

-- 注意: 以下视图定义将根据具体需求逐步添加
-- Note: The following view definitions will be added based on specific requirements

-- =====================================================
-- 01. 公务员应发月度视图
-- Monthly Civil Servant Gross Pay View  
-- =====================================================
CREATE OR REPLACE VIEW reports.v_monthly_civil_servant_gross_pay AS
SELECT 
    -- 基础时间维度字段
    DATE_TRUNC('month', "薪资期间开始日期")::date as report_month,
    EXTRACT(YEAR FROM "薪资期间开始日期") as report_year,
    EXTRACT(MONTH FROM "薪资期间开始日期") as report_month_num,
    
    -- 人员基本信息
    COALESCE("员工编号", '未设置') as "人员编号",
    "姓名" as "人员姓名", 
    "身份证号" as "身份证",
    "部门名称" as "部门",
    "人员类别" as "人员身份",
    "职位名称" as "人员职级",
    
    -- 工资统发、财政供养字段（根据实际业务逻辑设置）
    CASE WHEN "根人员类别" = '正编' THEN '是' ELSE '否' END as "工资统发",
    CASE WHEN "人员类别" IN ('公务员', '参照公务员管理') THEN '是' ELSE '否' END as "财政供养",
    
    -- 合计字段（合计、小计都映射到应发合计）
    COALESCE("应发合计", 0.00)::numeric(10,2) as "合计",
    COALESCE("应发合计", 0.00)::numeric(10,2) as "小计",
    
    -- 具体薪资组成
    COALESCE("职务/技术等级工资", 0.00)::numeric(10,2) as "职务/技术等级 工资",
    COALESCE("级别/岗位级别工资", 0.00)::numeric(10,2) as "级别/岗位级别 工资", 
    COALESCE("九三年工改保留津补贴", 0.00)::numeric(10,2) as "93年工改保留补贴",
    COALESCE("独生子女父母奖励金", 0.00)::numeric(10,2) as "独生子女父母奖励金",
    COALESCE("岗位职务补贴", 0.00)::numeric(10,2) as "岗位职务补贴",
    COALESCE("公务员规范后津补贴", 0.00)::numeric(10,2) as "公务员规范性津贴补贴",
    COALESCE("公务交通补贴", 0.00)::numeric(10,2) as "公务交通补贴",
    COALESCE("基础绩效奖", 0.00)::numeric(10,2) as "基础绩效奖"
    
FROM reports.v_comprehensive_employee_payroll
WHERE "人员类别" IN ('公务员')
    AND "薪资期间开始日期" IS NOT NULL
    AND "姓名" IS NOT NULL
ORDER BY report_year DESC, report_month_num DESC, "部门名称", "姓名";

-- 添加视图注释
COMMENT ON VIEW reports.v_monthly_civil_servant_gross_pay IS '月度公务员应发工资视图 - 包含公务员和参照公务员管理人员的应发工资明细，按月汇总展示各项薪资组成';

-- =====================================================
-- 02. 参公应发月度视图
-- Monthly Civil Servant-like Gross Pay View  
-- =====================================================
CREATE OR REPLACE VIEW reports.v_monthly_civil_servant_like_gross_pay AS
SELECT 
    -- 基础时间维度字段
    DATE_TRUNC('month', "薪资期间开始日期")::date as report_month,
    EXTRACT(YEAR FROM "薪资期间开始日期") as report_year,
    EXTRACT(MONTH FROM "薪资期间开始日期") as report_month_num,
    
    -- 人员基本信息
    COALESCE("员工编号", '未设置') as "人员编号",
    "姓名" as "人员姓名", 
    "身份证号" as "身份证",
    "部门名称" as "部门",
    "人员类别" as "人员身份",
    "职位名称" as "人员职级",
    
    -- 工资统发、财政供养字段（根据实际业务逻辑设置）
    CASE WHEN "根人员类别" = '正编' THEN '是' ELSE '否' END as "工资统发",
    CASE WHEN "人员类别" = '参照公务员管理' THEN '是' ELSE '否' END as "财政供养",
    
    -- 合计字段（合计、小计都映射到应发合计）
    COALESCE("应发合计", 0.00)::numeric(10,2) as "合计",
    COALESCE("应发合计", 0.00)::numeric(10,2) as "小计",
    
    -- 具体薪资组成
    COALESCE("职务/技术等级工资", 0.00)::numeric(10,2) as "职务/技术等级工资",
    COALESCE("级别/岗位级别工资", 0.00)::numeric(10,2) as "级别/岗位级别工资", 
    COALESCE("九三年工改保留津补贴", 0.00)::numeric(10,2) as "93年工改保留补贴",
    COALESCE("独生子女父母奖励金", 0.00)::numeric(10,2) as "独生子女父母奖励金",
    COALESCE("信访工作人员岗位工作津贴", 0.00)::numeric(10,2) as "信访工作人员岗位津贴",
    COALESCE("乡镇工作补贴", 0.00)::numeric(10,2) as "乡镇工作补贴",
    COALESCE("公务员规范后津补贴", 0.00)::numeric(10,2) as "公务员规范性津贴补贴",
    COALESCE("公务交通补贴", 0.00)::numeric(10,2) as "公务交通补贴",
    COALESCE("基础绩效奖", 0.00)::numeric(10,2) as "基础绩效奖"
    
FROM reports.v_comprehensive_employee_payroll
WHERE "人员类别" = '参照公务员管理'
    AND "薪资期间开始日期" IS NOT NULL
    AND "姓名" IS NOT NULL
ORDER BY report_year DESC, report_month_num DESC, "部门名称", "姓名";

-- 添加视图注释
COMMENT ON VIEW reports.v_monthly_civil_servant_like_gross_pay IS '月度参公人员应发工资视图 - 包含参照公务员管理人员的应发工资明细，按月汇总展示各项薪资组成';

-- =====================================================
-- 03. 事业应发月度视图
-- Monthly Institution Staff Gross Pay View  
-- =====================================================
CREATE OR REPLACE VIEW reports.v_monthly_institution_gross_pay AS
SELECT 
    -- 基础时间维度字段
    DATE_TRUNC('month', "薪资期间开始日期")::date as report_month,
    EXTRACT(YEAR FROM "薪资期间开始日期") as report_year,
    EXTRACT(MONTH FROM "薪资期间开始日期") as report_month_num,
    
    -- 人员基本信息
    COALESCE("员工编号", '未设置') as "人员编号",
    "姓名" as "人员姓名", 
    "身份证号" as "身份证",
    "部门名称" as "部门",
    "人员类别" as "人员身份",
    "职位名称" as "人员职级",
    
    -- 工资统发、财政供养字段（根据实际业务逻辑设置）
    CASE WHEN "根人员类别" = '正编' THEN '是' ELSE '否' END as "工资统发",
    CASE WHEN "人员类别" IN ('事业管理人员', '事业技术工人', '事业工勤人员') THEN '是' ELSE '否' END as "财政供养",
    
    -- 合计字段（合计、小计都映射到应发合计）
    COALESCE("应发合计", 0.00)::numeric(10,2) as "合计",
    COALESCE("应发合计", 0.00)::numeric(10,2) as "小计",
    
    -- 补扣发相关字段
    COALESCE("一次性补扣发", 0.00)::numeric(10,2) as "一次性补扣发",
    0.00::numeric(10,2) as "基础绩效补扣发",
    COALESCE("奖励绩效补扣发", 0.00)::numeric(10,2) as "奖励绩效补扣发",
    
    -- 基本工资组成
    COALESCE("岗位工资", 0.00)::numeric(10,2) as "岗位工资",
    COALESCE("薪级工资", 0.00)::numeric(10,2) as "薪级工资",
    COALESCE("试用期工资", 0.00)::numeric(10,2) as "见习试用期工资",
    
    -- 津贴补贴
    COALESCE("九三年工改保留津补贴", 0.00)::numeric(10,2) as "93年工改保留补贴",
    COALESCE("独生子女父母奖励金", 0.00)::numeric(10,2) as "独生子女父母奖励金",
    
    -- 绩效工资
    COALESCE("月基础绩效", 0.00)::numeric(10,2) as "月基础绩效",
    COALESCE("基础绩效奖", 0.00)::numeric(10,2) as "基础绩效奖",
    COALESCE("月奖励绩效", 0.00)::numeric(10,2) as "月奖励绩效"
    
FROM reports.v_comprehensive_employee_payroll
WHERE "人员类别" IN ('事业管理人员', '事业技术工人', '事业工勤人员')
    AND "薪资期间开始日期" IS NOT NULL
    AND "姓名" IS NOT NULL
ORDER BY report_year DESC, report_month_num DESC, "部门名称", "姓名";

-- 添加视图注释
COMMENT ON VIEW reports.v_monthly_institution_gross_pay IS '月度事业单位人员应发工资视图 - 包含事业管理人员、事业技术工人和事业工勤人员的应发工资明细，按月汇总展示各项薪资组成';

-- =====================================================
-- 04. 公务员+参公+事业实发月度视图
-- Monthly Full-time Staff Net Pay View  
-- =====================================================
CREATE OR REPLACE VIEW reports.v_monthly_fulltime_net_pay AS
SELECT 
    -- 基础时间维度字段
    DATE_TRUNC('month', "薪资期间开始日期")::date as report_month,
    EXTRACT(YEAR FROM "薪资期间开始日期") as report_year,
    EXTRACT(MONTH FROM "薪资期间开始日期") as report_month_num,
    
    -- 基本信息
    "姓名" as "姓名",
    "身份证号" as "证件号码",
    
    -- 工资总额
    COALESCE("应发合计", 0.00)::numeric(10,2) as "应发工资",
    COALESCE("实发合计", 0.00)::numeric(10,2) as "实发工资",
    COALESCE("补扣社保", 0.00)::numeric(10,2) as "补扣社保",
    COALESCE("扣除合计", 0.00)::numeric(10,2) as "扣发合计",
    
    -- 基本工资组成
    COALESCE("职务/技术等级工资", 0.00)::numeric(10,2) as "职务工资",
    COALESCE("绩效工资", 0.00)::numeric(10,2) as "绩效工资",
    
    -- 津贴补贴
    COALESCE("独生子女父母奖励金", 0.00)::numeric(10,2) as "独生子女父母奖励金",
    COALESCE("公务交通补贴", 0.00)::numeric(10,2) as "公务交通补贴",
    NULL::numeric(10,2) as "月奖励绩效津贴",
    NULL::numeric(10,2) as "绩效工资补发",
    COALESCE("奖励性绩效工资", 0.00)::numeric(10,2) as "奖励性绩效工资",
    COALESCE("基础绩效奖", 0.00)::numeric(10,2) as "基础绩效奖",
    COALESCE("月基础绩效", 0.00)::numeric(10,2) as "月基础绩效",
    COALESCE("补发工资", 0.00)::numeric(10,2) as "补发工资",
    COALESCE("岗位工资", 0.00)::numeric(10,2) as "岗位工资",
    COALESCE("信访工作人员岗位工作津贴", 0.00)::numeric(10,2) as "信访工作人员岗位工作津贴",
    COALESCE("九三年工改保留津补贴", 0.00)::numeric(10,2) as "九三年工改保留津补贴",
    COALESCE("乡镇工作补贴", 0.00)::numeric(10,2) as "乡镇工作补贴",
    COALESCE("公务员规范后津补贴", 0.00)::numeric(10,2) as "公务员规范后津补贴",
    COALESCE("试用期工资", 0.00)::numeric(10,2) as "试用期工资",
    
    -- 个人缴费项目
    COALESCE("养老保险个人应缴金额", 0.00)::numeric(10,2) as "个人缴养老保险费",
    COALESCE("医疗保险个人缴纳金额", 0.00)::numeric(10,2) as "个人缴医疗保险费", 
    COALESCE("职业年金个人应缴费额", 0.00)::numeric(10,2) as "个人缴职业年金",
    COALESCE("失业保险个人应缴金额", 0.00)::numeric(10,2) as "个人缴失业保险费",
    COALESCE("个人缴住房公积金", 0.00)::numeric(10,2) as "个人缴住房公积金",
    COALESCE("个人所得税", 0.00)::numeric(10,2) as "个人所得税"
    
FROM reports.v_comprehensive_employee_payroll
WHERE "根人员类别" = '正编'
    AND "薪资期间开始日期" IS NOT NULL
    AND "姓名" IS NOT NULL
ORDER BY report_year DESC, report_month_num DESC, "姓名";

-- 添加视图注释
COMMENT ON VIEW reports.v_monthly_fulltime_net_pay IS '月度正编人员实发工资视图 - 包含公务员、参公和事业单位正编人员的实发工资明细和各项扣除，按月汇总展示';

-- =====================================================
-- 05. 正编导入大平台工资数据月度视图
-- Monthly Full-time Staff Platform Import View  
-- =====================================================
CREATE OR REPLACE VIEW reports.v_monthly_fulltime_platform_import AS
SELECT 
    -- 基础时间维度字段
    DATE_TRUNC('month', "薪资期间开始日期")::date as report_month,
    EXTRACT(YEAR FROM "薪资期间开始日期") as report_year,
    EXTRACT(MONTH FROM "薪资期间开始日期") as report_month_num,
    
    -- 基本信息
    "姓名" as "姓名",
    '01-身份证' as "证件类型",
    "身份证号" as "证件号码",
    '工资' as "发放类型",
    
    -- 基本工资字段（根据人员身份特殊映射）
    CASE WHEN "人员类别" = '机关工勤' THEN 
        0.00::numeric(10,2)
    ELSE 
        COALESCE("职务/技术等级工资", 0.00)::numeric(10,2)
    END as "职务工资",
    
    CASE WHEN "人员类别" = '机关工勤' THEN 
        COALESCE("职务/技术等级工资", 0.00)::numeric(10,2)
    ELSE 
        0.00::numeric(10,2)
    END as "机关工勤人员技术等级工资",
    
    -- 各类津贴补贴字段
    COALESCE("人民警察加班补贴", 0.00)::numeric(10,2) as "人民警察加班补贴",
    COALESCE("回民补贴", 0.00)::numeric(10,2) as "回民补贴",
    COALESCE("绩效工资", 0.00)::numeric(10,2) as "绩效工资",
    COALESCE("艰苦边远地区津贴", 0.00)::numeric(10,2) as "艰苦边远地区津贴",
    COALESCE("独生子女父母奖励金", 0.00)::numeric(10,2) as "独生子女父母奖励金",
    COALESCE("法医毒物化验人员保健津贴", 0.00)::numeric(10,2) as "法医毒物化验人员保健津贴",
    COALESCE("补发津贴", 0.00)::numeric(10,2) as "补发津贴",
    COALESCE("卫生独生子女费", 0.00)::numeric(10,2) as "卫生独生子女费",
    COALESCE("公安岗位津贴", 0.00)::numeric(10,2) as "公安岗位津贴",
    COALESCE("公务交通补贴", 0.00)::numeric(10,2) as "公务交通补贴",
    COALESCE("卫生九三年工改保留津补贴", 0.00)::numeric(10,2) as "卫生九三年工改保留津补贴",
    COALESCE("月奖励绩效津贴", 0.00)::numeric(10,2) as "月奖励绩效津贴",
    COALESCE("绩效奖", 0.00)::numeric(10,2) as "绩效奖",
    NULL::numeric(10,2) as "绩效工资补发",
    COALESCE("奖励性绩效工资", 0.00)::numeric(10,2) as "奖励性绩效工资",
    COALESCE("基础绩效奖", 0.00)::numeric(10,2) as "基础绩效奖",
    COALESCE("月基础绩效", 0.00)::numeric(10,2) as "月基础绩效",
    COALESCE("法检基础性绩效津补贴", 0.00)::numeric(10,2) as "法检基础性绩效津补贴",
    COALESCE("基础性绩效工资", 0.00)::numeric(10,2) as "基础性绩效工资",
    COALESCE("年度考核奖", 0.00)::numeric(10,2) as "年度考核奖",
    COALESCE("补发工资", 0.00)::numeric(10,2) as "补发工资",
    COALESCE("法院检察院规范津补贴", 0.00)::numeric(10,2) as "法院检察院规范津补贴",
    COALESCE("公检法艰苦边远地区津贴", 0.00)::numeric(10,2) as "公检法艰苦边远地区津贴",
    COALESCE("岗位职务补贴", 0.00)::numeric(10,2) as "岗位职务补贴",
    COALESCE("岗位工资", 0.00)::numeric(10,2) as "岗位工资",
    
    CASE WHEN "人员类别" = '机关工勤' THEN 
        COALESCE("级别/岗位级别工资", 0.00)::numeric(10,2)
    ELSE 
        0.00::numeric(10,2)
    END as "机关工勤人员岗位工资",
    
    COALESCE("援藏津贴", 0.00)::numeric(10,2) as "援藏津贴",
    COALESCE("卫生援藏津贴", 0.00)::numeric(10,2) as "卫生援藏津贴",
    COALESCE("工作性津贴", 0.00)::numeric(10,2) as "工作性津贴",
    COALESCE("纪检津贴", 0.00)::numeric(10,2) as "纪检津贴",
    COALESCE("特级教师津贴", 0.00)::numeric(10,2) as "特级教师津贴",
    COALESCE("公务员十三月奖励工资", 0.00)::numeric(10,2) as "公务员十三月奖励工资",
    COALESCE("公安法定工作日之外加班补贴", 0.00)::numeric(10,2) as "公安法定工作日之外加班补贴",
    COALESCE("生活性津贴", 0.00)::numeric(10,2) as "生活性津贴",
    COALESCE("法院检察院工改保留津贴", 0.00)::numeric(10,2) as "法院检察院工改保留津贴",
    COALESCE("公安执勤津贴", 0.00)::numeric(10,2) as "公安执勤津贴",
    COALESCE("事业单位人员薪级工资", 0.00)::numeric(10,2) as "事业单位工作人员岗位工资",
    COALESCE("特殊岗位津贴", 0.00)::numeric(10,2) as "特殊岗位津贴",
    COALESCE("法院检察院执勤津贴", 0.00)::numeric(10,2) as "法院检察院执勤津贴",
    COALESCE("信访工作人员岗位工作津贴", 0.00)::numeric(10,2) as "信访工作人员岗位工作津贴",
    
    CASE WHEN "人员类别" = '机关工勤' THEN 
        0.00::numeric(10,2)
    ELSE 
        COALESCE("级别/岗位级别工资", 0.00)::numeric(10,2)
    END as "级别工资",
    
    COALESCE("中小学教师或护士保留原额百分之十工资", 0.00)::numeric(10,2) as "中小学教师或护士保留原额百分之十工资",
    COALESCE("政法委机关工作津贴", 0.00)::numeric(10,2) as "政法委机关工作津贴",
    COALESCE("九三年工改保留津补贴", 0.00)::numeric(10,2) as "九三年工改保留津补贴",
    COALESCE("住房补贴", 0.00)::numeric(10,2) as "住房补贴",
    COALESCE("老粮贴", 0.00)::numeric(10,2) as "老粮贴",
    COALESCE("警衔津贴", 0.00)::numeric(10,2) as "警衔津贴",
    COALESCE("乡镇工作补贴", 0.00)::numeric(10,2) as "乡镇工作补贴",
    COALESCE("教龄津贴", 0.00)::numeric(10,2) as "教龄津贴",
    COALESCE("护龄津贴", 0.00)::numeric(10,2) as "护龄津贴",
    COALESCE("公务员规范后津补贴", 0.00)::numeric(10,2) as "公务员规范后津补贴",
    COALESCE("试用期工资", 0.00)::numeric(10,2) as "试用期工资",
    COALESCE("人民警察值勤岗位津贴", 0.00)::numeric(10,2) as "人民警察值勤岗位津贴",
    COALESCE("国家规定的其他津补贴项目", 0.00)::numeric(10,2) as "国家规定的其他津补贴项目",
    COALESCE("纪委监委机构改革保留补贴", 0.00)::numeric(10,2) as "纪委监委机构改革保留补贴",
    COALESCE("事业单位人员薪级工资", 0.00)::numeric(10,2) as "事业单位人员薪级工资",
    COALESCE("中小学教师或护士提高百分之十", 0.00)::numeric(10,2) as "中小学教师或护士提高百分之十"
    
FROM reports.v_comprehensive_employee_payroll
WHERE "根人员类别" = '正编'
    AND "薪资期间开始日期" IS NOT NULL
    AND "姓名" IS NOT NULL
ORDER BY report_year DESC, report_month_num DESC, "姓名";

-- 添加视图注释
COMMENT ON VIEW reports.v_monthly_fulltime_platform_import IS '月度正编人员大平台导入数据视图 - 为大平台导入提供格式化的正编人员工资数据，包含特殊映射逻辑处理机关工勤人员字段';

-- =====================================================
-- 06. 区聘应发月度视图
-- Monthly District Contract Staff Gross Pay View  
-- =====================================================
CREATE OR REPLACE VIEW reports.v_monthly_district_contract_gross_pay AS
SELECT 
    -- 基础时间维度字段
    DATE_TRUNC('month', "薪资期间开始日期")::date as report_month,
    EXTRACT(YEAR FROM "薪资期间开始日期") as report_year,
    EXTRACT(MONTH FROM "薪资期间开始日期") as report_month_num,
    
    -- 基本信息
    COALESCE("员工编号", '未设置') as "人员编号",
    "姓名" as "人员姓名",
    "人员类别" as "岗位类别",
    
    -- 工资级别和档次字段（暂时留空）
    '' as "工资级别",
    '' as "工资档次",
    
    -- 工资金额字段（特殊映射）
    COALESCE("应发合计", 0.00)::numeric(10,2) as "发放合计",
    0.00::numeric(10,2) as "补扣发合计",
    COALESCE("应发合计", 0.00)::numeric(10,2) as "工资小计",
    
    -- 工资组成
    COALESCE("基本工资", 0.00)::numeric(10,2) as "基本工资",
    COALESCE("岗位工资", 0.00)::numeric(10,2) as "岗位工资",
    COALESCE("绩效工资", 0.00)::numeric(10,2) as "绩效工资",
    COALESCE("补助", 0.00)::numeric(10,2) as "补助",
    COALESCE("信访工作人员岗位工作津贴", 0.00)::numeric(10,2) as "信访岗位津贴",
    COALESCE("基础绩效奖", 0.00)::numeric(10,2) as "基础绩效奖",
    
    -- 备注字段
    COALESCE("备注", '') as "备注"
    
FROM reports.v_comprehensive_employee_payroll
WHERE "人员类别" = '综合类'
    AND "薪资期间开始日期" IS NOT NULL
    AND "姓名" IS NOT NULL
ORDER BY report_year DESC, report_month_num DESC, "人员类别", "姓名";

-- 添加视图注释
COMMENT ON VIEW reports.v_monthly_district_contract_gross_pay IS '月度区聘人员应发工资视图 - 包含所有聘用人员的应发工资明细，按月汇总展示各项薪资组成';

-- =====================================================
-- 07. 原投服应发月度视图
-- Monthly Former Investment Service Staff Gross Pay View  
-- =====================================================
CREATE OR REPLACE VIEW reports.v_monthly_former_investment_service_gross_pay AS
SELECT 
    -- 基础时间维度字段
    DATE_TRUNC('month', "薪资期间开始日期")::date as report_month,
    EXTRACT(YEAR FROM "薪资期间开始日期") as report_year,
    EXTRACT(MONTH FROM "薪资期间开始日期") as report_month_num,
    
    -- 基本信息
    COALESCE("员工编号", '未设置') as "人员编号",
    "姓名" as "人员姓名",
    "人员类别" as "岗位类别",
    
    -- 工资级别和档次字段（暂时留空）
    '' as "工资级别",
    '' as "工资档次",
    
    -- 工资金额字段（特殊映射）
    COALESCE("应发合计", 0.00)::numeric(10,2) as "发放合计",
    0.00::numeric(10,2) as "补发薪级合计",
    COALESCE("应发合计", 0.00)::numeric(10,2) as "工资小计",
    
    -- 工资组成
    COALESCE("岗位工资", 0.00)::numeric(10,2) as "岗位工资",
    COALESCE("薪级工资", 0.00)::numeric(10,2) as "薪级工资",
    COALESCE("绩效工资", 0.00)::numeric(10,2) as "绩效工资",
    COALESCE("生活性津贴", 0.00)::numeric(10,2) as "生活津贴",
    COALESCE("基础绩效奖", 0.00)::numeric(10,2) as "基础绩效奖",
    COALESCE("季度绩效考核薪酬", 0.00)::numeric(10,2) as "季度考核绩效奖",
    
    -- 备注字段
    COALESCE("备注", '') as "备注"
    
FROM reports.v_comprehensive_employee_payroll
WHERE "人员类别" = '项目经理'
    AND "薪资期间开始日期" IS NOT NULL
    AND "姓名" IS NOT NULL
ORDER BY report_year DESC, report_month_num DESC, "姓名";

-- 添加视图注释
COMMENT ON VIEW reports.v_monthly_former_investment_service_gross_pay IS '月度原投资服务局聘用人员应发工资视图 - 包含原投资服务局聘用人员的应发工资明细，按月汇总展示各项薪资组成';

-- =====================================================
-- 08. 专项应发月度视图
-- Monthly Special Project Staff Gross Pay View  
-- =====================================================
CREATE OR REPLACE VIEW reports.v_monthly_special_project_gross_pay AS
SELECT 
    -- 基础时间维度字段
    DATE_TRUNC('month', "薪资期间开始日期")::date as report_month,
    EXTRACT(YEAR FROM "薪资期间开始日期") as report_year,
    EXTRACT(MONTH FROM "薪资期间开始日期") as report_month_num,
    
    -- 基本信息
    COALESCE("员工编号", '未设置') as "人员编号",
    "姓名" as "人员姓名",
    "人员类别" as "岗位类别",
    
    -- 参照正编级别字段（暂时留空）
    '' as "参照正编岗位工资级别",
    '' as "参照正编薪级工资级次",
    
    -- 计算各项工资组成
    COALESCE("基本工资", 0.00)::numeric(10,2) as "基本工资",
    COALESCE("岗位工资", 0.00)::numeric(10,2) as "岗位工资",
    COALESCE("绩效工资", 0.00)::numeric(10,2) as "绩效工资",
    COALESCE("补助", 0.00)::numeric(10,2) as "其他补助",
    COALESCE("基础绩效奖", 0.00)::numeric(10,2) as "基础绩效奖",
    COALESCE("补发工资", 0.00)::numeric(10,2) as "补发工资",
    
    -- 特殊映射计算字段
    (COALESCE("基本工资", 0.00) + COALESCE("岗位工资", 0.00) + COALESCE("绩效工资", 0.00) + 
     COALESCE("补助", 0.00) + COALESCE("基础绩效奖", 0.00))::numeric(10,2) as "工资小计",
    
    (COALESCE("基本工资", 0.00) + COALESCE("岗位工资", 0.00) + COALESCE("绩效工资", 0.00) + 
     COALESCE("补助", 0.00) + COALESCE("基础绩效奖", 0.00) + COALESCE("补发工资", 0.00))::numeric(10,2) as "发放合计",
    
    -- 备注字段
    COALESCE("备注", '') as "备注"
    
FROM reports.v_comprehensive_employee_payroll
WHERE "人员类别" IN ('项目服务专员', '项目经理')
    AND "薪资期间开始日期" IS NOT NULL
    AND "姓名" IS NOT NULL
ORDER BY report_year DESC, report_month_num DESC, "人员类别", "姓名";

-- 添加视图注释
COMMENT ON VIEW reports.v_monthly_special_project_gross_pay IS '月度专项人员应发工资视图 - 包含项目服务专员和项目经理的应发工资明细，工资小计和发放合计采用特殊计算逻辑';

-- =====================================================
-- 09. 专技应发月度视图
-- Monthly Professional Technical Staff Gross Pay View  
-- =====================================================
CREATE OR REPLACE VIEW reports.v_monthly_professional_technical_gross_pay AS
SELECT 
    -- 基础时间维度字段
    DATE_TRUNC('month', "薪资期间开始日期")::date as report_month,
    EXTRACT(YEAR FROM "薪资期间开始日期") as report_year,
    EXTRACT(MONTH FROM "薪资期间开始日期") as report_month_num,
    
    -- 基本信息
    COALESCE("员工编号", '未设置') as "人员编号",
    "姓名" as "人员姓名",
    "人员类别" as "岗位类别",
    
    -- 工资级别字段（暂时留空）
    '' as "工资级别",
    
    -- 计算各项工资组成
    COALESCE("基本工资", 0.00)::numeric(10,2) as "基本工资",
    COALESCE("岗位工资", 0.00)::numeric(10,2) as "岗位工资",
    COALESCE("津贴", 0.00)::numeric(10,2) as "津贴",
    COALESCE("季度绩效考核薪酬", 0.00)::numeric(10,2) as "季度绩效考核薪酬",
    
    -- 特殊映射计算字段
    (COALESCE("基本工资", 0.00) + COALESCE("岗位工资", 0.00) + COALESCE("津贴", 0.00) + 
     COALESCE("季度绩效考核薪酬", 0.00))::numeric(10,2) as "工资小计",
    
    (COALESCE("基本工资", 0.00) + COALESCE("岗位工资", 0.00) + COALESCE("津贴", 0.00) + 
     COALESCE("季度绩效考核薪酬", 0.00)+ COALESCE("补发合计", 0.00)  )::numeric(10,2) as "发放合计",
    
    -- 全年相关字段（基于工资小计计算）
    (COALESCE("基本工资", 0.00) + COALESCE("岗位工资", 0.00) + COALESCE("津贴", 0.00)) * 12::numeric(10,2) as "固定薪酬全年应发数",
    
    -- 全年截止当月已发固定薪酬（按当前月份计算）
    (COALESCE("基本工资", 0.00) + COALESCE("岗位工资", 0.00) + COALESCE("津贴", 0.00)) * 
     EXTRACT(MONTH FROM "薪资期间开始日期")::numeric(10,2) as "全年截止当月已发固定薪酬"
    
FROM reports.v_comprehensive_employee_payroll
WHERE "人员类别" IN ('执业类专技人员', '管理类专技人员')
    AND "薪资期间开始日期" IS NOT NULL
    AND "姓名" IS NOT NULL
ORDER BY report_year DESC, report_month_num DESC, "人员类别", "姓名";

-- 添加视图注释
COMMENT ON VIEW reports.v_monthly_professional_technical_gross_pay IS '月度专业技术人员应发工资视图 - 包含执业类和管理类专技人员的应发工资明细，包含固定薪酬全年统计和特殊计算逻辑';

-- =====================================================
-- 10. 聘用实发表月度视图
-- Monthly Contract Staff Net Pay View  
-- =====================================================
CREATE OR REPLACE VIEW reports.v_monthly_contract_staff_net_pay AS
SELECT 
    -- 基础时间维度字段
    DATE_TRUNC('month', "薪资期间开始日期")::date as report_month,
    EXTRACT(YEAR FROM "薪资期间开始日期") as report_year,
    EXTRACT(MONTH FROM "薪资期间开始日期") as report_month_num,
    
    -- 基本信息
    COALESCE("员工编号", '未设置') as "人员编号",
    "姓名" as "人员姓名",
    "人员类别" as "岗位类别",
    
    -- 工资级别和档次字段（暂时留空）
    '' as "工资级别",
    '' as "工资档次",
    
    -- 计算各项工资组成
    COALESCE("基本工资", 0.00)::numeric(10,2) as "基本工资",
    COALESCE("岗位工资", 0.00)::numeric(10,2) as "岗位工资",
    COALESCE("绩效工资", 0.00)::numeric(10,2) as "绩效工资",
    COALESCE("补助", 0.00)::numeric(10,2) as "补助",
    COALESCE("信访工作人员岗位工作津贴", 0.00)::numeric(10,2) as "信访岗位津贴",
    COALESCE("绩效奖", 0.00)::numeric(10,2) as "绩效奖",
    0.00::numeric(10,2) as "季度考核良好绩效奖",
    

    -- 特殊映射计算字段
    (COALESCE("基本工资", 0.00) + COALESCE("岗位工资", 0.00) + COALESCE("绩效工资", 0.00) + 
     COALESCE("补助", 0.00) + COALESCE("信访工作人员岗位工作津贴", 0.00) + COALESCE("绩效奖", 0.00) + 
     0.00)::numeric(10,2) as "工资小计",
    
    (COALESCE("基本工资", 0.00) + COALESCE("岗位工资", 0.00) + COALESCE("绩效工资", 0.00) + 
     COALESCE("补助", 0.00) + COALESCE("信访工作人员岗位工作津贴", 0.00) + COALESCE("绩效奖", 0.00) + 
     0.00 + COALESCE("补发工资", 0.00) )::numeric(10,2) as "发放合计",
    
    -- 财务实发=发放合计
    (COALESCE("基本工资", 0.00) + COALESCE("岗位工资", 0.00) + COALESCE("绩效工资", 0.00) + 
     COALESCE("补助", 0.00) + COALESCE("信访工作人员岗位工作津贴", 0.00) + COALESCE("绩效奖", 0.00) + 
     0.00 + COALESCE("补发工资", 0.00) + COALESCE("补发津贴", 0.00) + 
     COALESCE("绩效工资补发", 0.00) + COALESCE("奖励绩效补发", 0.00))::numeric(10,2) as "财务实发",
    
    -- 单位代扣总计
    COALESCE("扣除合计", 0.00)::numeric(10,2) as "单位代扣总计",
    
    -- 个人缴费项目
    COALESCE("养老保险个人应缴金额", 0.00)::numeric(10,2) as "个人缴养老保险费8%",
    COALESCE("医疗保险个人缴纳金额", 0.00)::numeric(10,2) as "个人缴医疗保险费2%",
    COALESCE("失业保险个人应缴金额", 0.00)::numeric(10,2) as "个人缴失业保险费0.4%",
    COALESCE("个人缴住房公积金", 0.00)::numeric(10,2) as "个人缴住房公积金12%",
    
    -- 补扣项目
    COALESCE("补扣（退）款", 0.00)::numeric(10,2) as "补扣（退）款",
    COALESCE("补扣社保", 0.00)::numeric(10,2) as "补扣（退）社保缴费",
    0.00::numeric(10,2) as "补扣（退）公积金",
    COALESCE("补扣2022年医保款", 0.00)::numeric(10,2) as "补扣2022年医保款",
    
    -- 个人所得税
    COALESCE("个人所得税", 0.00)::numeric(10,2) as "个人所得税"
    
FROM reports.v_comprehensive_employee_payroll
WHERE "根人员类别" = '聘用' 
    AND "人员类别" NOT IN ('执业类专技人员', '管理类专技人员')
    AND "薪资期间开始日期" IS NOT NULL
    AND "姓名" IS NOT NULL
ORDER BY report_year DESC, report_month_num DESC, "人员类别", "姓名";

-- 添加视图注释
COMMENT ON VIEW reports.v_monthly_contract_staff_net_pay IS '月度聘用人员实发工资视图 - 包含除执业类和管理类专技人员外的所有聘用人员实发工资明细，含详细扣缴项目和特殊计算逻辑';

-- =====================================================
-- 11. 专技实发表月度视图
-- Monthly Professional Technical Staff Net Pay View  
-- =====================================================
CREATE OR REPLACE VIEW reports.v_monthly_professional_technical_net_pay AS
SELECT 
    -- 基础时间维度字段
    DATE_TRUNC('month', "薪资期间开始日期")::date as report_month,
    EXTRACT(YEAR FROM "薪资期间开始日期") as report_year,
    EXTRACT(MONTH FROM "薪资期间开始日期") as report_month_num,
    
    -- 基本信息
    COALESCE("员工编号", '未设置') as "人员编号",
    "姓名" as "人员姓名",
    "人员类别" as "岗位类别",
    
    -- 工资级别字段（暂时留空）
    '' as "工资级别",
    
    -- 计算各项工资组成
    COALESCE("基本工资", 0.00)::numeric(10,2) as "基本工资",
    COALESCE("岗位工资", 0.00)::numeric(10,2) as "岗位工资",
    COALESCE("津贴", 0.00)::numeric(10,2) as "津贴",
    COALESCE("季度绩效考核薪酬", 0.00)::numeric(10,2) as "季度绩效考核薪酬",
    0.00::numeric(10,2) as "固定薪酬",
    
    -- 补发合计（特殊映射：=扣发合计）
    COALESCE("扣除合计", 0.00)::numeric(10,2) as "补发合计",
    
    -- 工资小计计算【基本工资+岗位工资+津贴+季度绩效考核薪酬+固定薪酬】
    (COALESCE("基本工资", 0.00) + COALESCE("岗位工资", 0.00) + COALESCE("津贴", 0.00) + 
     COALESCE("季度绩效考核薪酬", 0.00) + 0.00)::numeric(10,2) as "工资小计",
    
    -- 应发固定薪酬汇总=工资小计+补发合计
    (COALESCE("基本工资", 0.00) + COALESCE("岗位工资", 0.00) + COALESCE("津贴", 0.00) + 
     COALESCE("季度绩效考核薪酬", 0.00) + 0.00 )::numeric(10,2) as "应发固定薪酬汇总",
    
    -- 实发额
    COALESCE("实发合计", 0.00)::numeric(10,2) as "实发额",
    
    -- 个人缴费项目
    COALESCE("养老保险个人应缴金额", 0.00)::numeric(10,2) as "个人缴养老保险费8%",
    COALESCE("医疗保险个人缴纳金额", 0.00)::numeric(10,2) as "个人缴医疗保险费2%",
    COALESCE("失业保险个人应缴金额", 0.00)::numeric(10,2) as "个人缴失业费0.4%",
    COALESCE("个人缴住房公积金", 0.00)::numeric(10,2) as "个人缴住房公积金12%",
    
    -- 补扣项目
    COALESCE("补扣（退）款", 0.00)::numeric(10,2) as "补扣款",
    0.00::numeric(10,2) as "补扣公积金",
    
    -- 税费和风险金
    COALESCE("个人所得税", 0.00)::numeric(10,2) as "个人所得税",
    0.00::numeric(10,2) as "计提2024年风险金扣项",
    
    -- 单位代扣总计=各项扣缴之和
    (COALESCE("养老保险个人应缴金额", 0.00) + COALESCE("医疗保险个人缴纳金额", 0.00) + 
     COALESCE("失业保险个人应缴金额", 0.00) + COALESCE("个人缴住房公积金", 0.00) + 
     COALESCE("补扣（退）款", 0.00) + 0.00 + COALESCE("个人所得税", 0.00) + 0.00)::numeric(10,2) as "单位代扣总计",
    
    -- 全年统计字段（基于固定薪酬计算）
    (COALESCE("基本工资", 0.00) + COALESCE("岗位工资", 0.00) + COALESCE("津贴", 0.00)) * 12::numeric(10,2) as "固定薪酬全年应发数",
    
    -- 全年截止当月已发固定薪酬（月薪酬+季度考核薪酬）
    ((COALESCE("基本工资", 0.00) + COALESCE("岗位工资", 0.00) + COALESCE("津贴", 0.00)) * 
     EXTRACT(MONTH FROM "薪资期间开始日期") + COALESCE("季度绩效考核薪酬", 0.00))::numeric(10,2) as "全年截止当月已发固定薪酬（月薪酬+季度考核薪酬）",
    
    -- 审核和备注字段
    '' as "处室审核",
    COALESCE("备注", '') as "备注"
    
FROM reports.v_comprehensive_employee_payroll
WHERE "人员类别" IN ('执业类专技人员', '管理类专技人员')
    AND "薪资期间开始日期" IS NOT NULL
    AND "姓名" IS NOT NULL
ORDER BY report_year DESC, report_month_num DESC, "人员类别", "姓名";

-- 添加视图注释
COMMENT ON VIEW reports.v_monthly_professional_technical_net_pay IS '月度专业技术人员实发工资视图 - 包含执业类和管理类专技人员的实发工资明细，含固定薪酬全年统计和详细扣缴项目计算';

-- =====================================================
-- 12. 聘用工资汇总月度视图
-- Monthly Contract Staff Salary Summary View  
-- =====================================================
CREATE OR REPLACE VIEW reports.v_monthly_contract_salary_summary AS
SELECT 
    -- 基础时间维度字段
    DATE_TRUNC('month', "薪资期间开始日期")::date as report_month,
    EXTRACT(YEAR FROM "薪资期间开始日期") as report_year,
    EXTRACT(MONTH FROM "薪资期间开始日期") as report_month_num,
    
    -- 基本信息
    COALESCE("员工编号", '未设置') as "人员编号",
    "姓名" as "人员姓名",
    "人员类别" as "岗位类别",
    
    -- 工资级别和档次字段（暂时留空）
    '' as "工资级别",
    '' as "工资档次",
    
    -- 基础工资组成
    COALESCE("基本工资", 0.00)::numeric(10,2) as "基本工资",
    COALESCE("岗位工资", 0.00)::numeric(10,2) as "岗位工资",
    COALESCE("绩效工资", 0.00)::numeric(10,2) as "绩效工资",
    COALESCE("补助", 0.00)::numeric(10,2) as "补助",
    COALESCE("信访工作人员岗位工作津贴", 0.00)::numeric(10,2) as "信访岗位津贴",
    COALESCE("津贴", 0.00)::numeric(10,2) as "津贴",
    COALESCE("绩效奖", 0.00)::numeric(10,2) as "绩效奖",
    0.00::numeric(10,2) as "季度考核良好绩效奖",
    COALESCE("季度绩效考核薪酬", 0.00)::numeric(10,2) as "季度绩效考核薪酬",
    
    -- 特殊映射：补发合计=0
    0.00::numeric(10,2) as "补发合计",
    
    -- 工资小计计算（基础工资组成之和）
    (COALESCE("基本工资", 0.00) + COALESCE("岗位工资", 0.00) + COALESCE("绩效工资", 0.00) + 
     COALESCE("补助", 0.00) + COALESCE("信访工作人员岗位工作津贴", 0.00) + COALESCE("津贴", 0.00) + 
     COALESCE("绩效奖", 0.00) + 0.00 + COALESCE("季度绩效考核薪酬", 0.00))::numeric(10,2) as "工资小计",
    
    -- 发放合计=工资小计+补发合计
    (COALESCE("基本工资", 0.00) + COALESCE("岗位工资", 0.00) + COALESCE("绩效工资", 0.00) + 
     COALESCE("补助", 0.00) + COALESCE("信访工作人员岗位工作津贴", 0.00) + COALESCE("津贴", 0.00) + 
     COALESCE("绩效奖", 0.00) + 0.00 + COALESCE("季度绩效考核薪酬", 0.00) + 0.00)::numeric(10,2) as "发放合计",
     
    -- 财务实发
    COALESCE("实发合计", 0.00)::numeric(10,2) as "财务实发",
    
    -- 个人缴费项目
    COALESCE("养老保险个人应缴金额", 0.00)::numeric(10,2) as "个人缴养老保险费8%",
    COALESCE("医疗保险个人缴纳金额", 0.00)::numeric(10,2) as "个人缴医疗保险费2%",
    COALESCE("失业保险个人应缴金额", 0.00)::numeric(10,2) as "个人缴失业保险费0.4%",
    COALESCE("个人缴住房公积金", 0.00)::numeric(10,2) as "个人缴住房公积金12%",
    
    -- 补扣项目
    COALESCE("补扣（退）款", 0.00)::numeric(10,2) as "补扣（退）款",
    0.00::numeric(10,2) as "补扣（退）社保缴费",
    0.00::numeric(10,2) as "补扣（退）公积金",
    0.00::numeric(10,2) as "补扣2022年医保款",
    0.00::numeric(10,2) as "计提2024年风险金扣项",
    
    -- 税费
    COALESCE("个人所得税", 0.00)::numeric(10,2) as "个人所得税",
    
    -- 单位代扣总计=各项扣缴之和
    (COALESCE("养老保险个人应缴金额", 0.00) + COALESCE("医疗保险个人缴纳金额", 0.00) + 
     COALESCE("失业保险个人应缴金额", 0.00) + COALESCE("个人缴住房公积金", 0.00) + 
     COALESCE("补扣（退）款", 0.00) + 0.00 + 0.00 + 0.00 + 0.00 + 
     COALESCE("个人所得税", 0.00))::numeric(10,2) as "单位代扣总计",
    
    -- 全年统计字段（基于固定薪酬计算）
    (COALESCE("基本工资", 0.00) + COALESCE("岗位工资", 0.00) + COALESCE("津贴", 0.00)) * 12::numeric(10,2) as "固定薪酬全年应发数",
    
    -- 全年截止当月已发固定薪酬（月薪酬+季度考核薪酬）
    ((COALESCE("基本工资", 0.00) + COALESCE("岗位工资", 0.00) + COALESCE("津贴", 0.00)) * 
     EXTRACT(MONTH FROM "薪资期间开始日期") + COALESCE("季度绩效考核薪酬", 0.00))::numeric(10,2) as "全年截止当月已发固定薪酬（月薪酬+季度考核薪酬）",
    
    -- 审核和备注字段
    '' as "处室审核",
    COALESCE("备注", '') as "备注"
    
FROM reports.v_comprehensive_employee_payroll
WHERE "人员类别" = '综合类' -- 注意：当前数据中可能需要调整为实际存在的人员类别
    AND "薪资期间开始日期" IS NOT NULL
    AND "姓名" IS NOT NULL
ORDER BY report_year DESC, report_month_num DESC, "人员类别", "姓名";

-- 添加视图注释
COMMENT ON VIEW reports.v_monthly_contract_salary_summary IS '月度聘用工资汇总视图 - 包含区聘人员的工资汇总信息，含固定薪酬全年统计和详细扣缴项目计算';

-- =====================================================
-- 13. 聘用工资导入大平台表月度视图
-- Monthly Contract Staff Platform Import View  
-- =====================================================
CREATE OR REPLACE VIEW reports.v_monthly_contract_platform_import AS
SELECT 
    -- 基础时间维度字段
    DATE_TRUNC('month', "薪资期间开始日期")::date as report_month,
    EXTRACT(YEAR FROM "薪资期间开始日期") as report_year,
    EXTRACT(MONTH FROM "薪资期间开始日期") as report_month_num,
    
    -- 基本信息
    COALESCE("员工编号", '未设置') as "人员编号",
    "姓名" as "人员姓名",
    "人员类别" as "岗位类别",
    
    -- 工资级别和档次字段（暂时留空）
    '' as "工资级别",
    '' as "工资档次",
    
    -- 基础工资组成
    COALESCE("基本工资", 0.00)::numeric(10,2) as "基本工资",
    COALESCE("岗位工资", 0.00)::numeric(10,2) as "岗位工资",
    COALESCE("绩效工资", 0.00)::numeric(10,2) as "绩效工资",
    COALESCE("补助", 0.00)::numeric(10,2) as "补助",
    COALESCE("信访工作人员岗位工作津贴", 0.00)::numeric(10,2) as "信访岗位津贴",
    COALESCE("津贴", 0.00)::numeric(10,2) as "津贴",
    COALESCE("绩效奖", 0.00)::numeric(10,2) as "绩效奖",
    0.00::numeric(10,2) as "季度考核良好绩效奖",
    COALESCE("季度绩效考核薪酬", 0.00)::numeric(10,2) as "季度绩效考核薪酬",
    
    -- 特殊映射：补发合计=扣发合计（从特殊映射推断）
    0.00::numeric(10,2) as "补发合计",
    
    -- 工资小计计算【基本工资+岗位工资+绩效工资+补助+信访岗位津贴+津贴+绩效奖+季度考核良好绩效奖+季度绩效考核薪酬】
    (COALESCE("基本工资", 0.00) + COALESCE("岗位工资", 0.00) + COALESCE("绩效工资", 0.00) + 
     COALESCE("补助", 0.00) + COALESCE("信访工作人员岗位工作津贴", 0.00) + COALESCE("津贴", 0.00) + 
     COALESCE("绩效奖", 0.00) + 0.00 + COALESCE("季度绩效考核薪酬", 0.00))::numeric(10,2) as "工资小计",
    
    -- 发放合计=工资小计+补发合计
    (COALESCE("基本工资", 0.00) + COALESCE("岗位工资", 0.00) + COALESCE("绩效工资", 0.00) + 
     COALESCE("补助", 0.00) + COALESCE("信访工作人员岗位工作津贴", 0.00) + COALESCE("津贴", 0.00) + 
     COALESCE("绩效奖", 0.00) + 0.00 + COALESCE("季度绩效考核薪酬", 0.00) + 
     COALESCE("扣除合计", 0.00))::numeric(10,2) as "发放合计",
     
    -- 财务实发=0（特殊映射）
    0.00::numeric(10,2) as "财务实发"
    
FROM reports.v_comprehensive_employee_payroll
WHERE "根人员类别" = '聘用'
    AND "薪资期间开始日期" IS NOT NULL
    AND "姓名" IS NOT NULL
ORDER BY report_year DESC, report_month_num DESC, "人员类别", "姓名";

-- 添加视图注释
COMMENT ON VIEW reports.v_monthly_contract_platform_import IS '月度聘用工资导入大平台表视图 - 包含所有聘用人员的简化工资信息，用于大平台系统导入';

-- =====================================================
-- 视图创建模板
-- View Creation Template
-- =====================================================
/*
-- 月度{报表名称}视图
-- Monthly {Report Name} View
CREATE OR REPLACE VIEW reports.v_monthly_{英文编码} AS
SELECT 
    -- 基础时间维度字段
    DATE_TRUNC('month', created_at)::date as report_month,
    EXTRACT(YEAR FROM created_at) as report_year,
    EXTRACT(MONTH FROM created_at) as report_month_num,
    
    -- 其他业务字段...
    
FROM {源表}
WHERE {过滤条件}
GROUP BY report_month, report_year, report_month_num
ORDER BY report_year DESC, report_month_num DESC;

-- 添加视图注释
COMMENT ON VIEW reports.v_monthly_{英文编码} IS '月度{报表名称}视图 - {详细描述}';
*/

-- =====================================================
-- 权限设置区域
-- Permissions Section
-- =====================================================

-- 注意: 需要为每个新创建的视图设置适当的权限
-- Note: Appropriate permissions need to be set for each newly created view

/*
-- 示例权限设置
GRANT SELECT ON reports.v_monthly_{英文编码} TO report_viewer;
GRANT SELECT ON reports.v_monthly_{英文编码} TO report_admin;
*/ 