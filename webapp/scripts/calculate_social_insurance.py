import psycopg2
from datetime import date, datetime
from decimal import Decimal, getcontext, ROUND_HALF_UP
import argparse
import json # 新增：导入json模块
import csv
import os

# 设置 Decimal 的精度
getcontext().prec = 10
getcontext().rounding = ROUND_HALF_UP

# 数据库连接信息（请根据实际情况修改）
# 根据之前提供的 DATABASE_URL=postgresql+psycopg2://postgres:810705@pg.debian.ziikoo.com:25432/salary_system_v2
DB_CONFIG = {
    "host": "pg.debian.ziikoo.com",
    "port": "25432",
    "database": "salary_system_v2",
    "user": "postgres",
    "password": "810705"
}

def get_db_connection():
    """建立数据库连接"""
    conn = psycopg2.connect(**DB_CONFIG)
    return conn


def apply_housing_fund_rounding(amount: Decimal) -> Decimal:
    """
    公积金特殊进位处理：
    如果小数部分大于等于 0.1，就进一位取整
    否则就舍掉小数部分
    
    例如：
    100.1 -> 101
    100.09 -> 100
    100.5 -> 101
    100.0 -> 100
    
    Args:
        amount: 原始计算金额
        
    Returns:
        Decimal: 处理后的金额
    """
    # 获取整数部分和小数部分
    integer_part = amount.to_integral_value(rounding='ROUND_DOWN')
    decimal_part = amount - integer_part
    
    # 如果小数部分 >= 0.1，进一位
    if decimal_part >= Decimal('0.1'):
        result = integer_part + Decimal('1')
    else:
        # 否则舍去小数部分
        result = integer_part
    
    print(f"🏠 [公积金进位] 原始金额: {amount}, 整数部分: {integer_part}, 小数部分: {decimal_part}, 处理后: {result}")
    return result

def calculate_social_insurance_and_housing_fund(calculation_month_str: str, employee_name: str = None):
    """
    计算指定月份每个员工的五险一金缴费。
    :param calculation_month_str: 计算月份，格式为 'YYYY-MM'
    :param employee_name: 可选，员工姓名，用于筛选
    """
    conn = None
    try:
        # 将月份字符串转换为日期对象
        calculation_month = datetime.strptime(calculation_month_str, '%Y-%m').date()
        # 确保日期是该月份的第一天
        calculation_month = calculation_month.replace(day=1)

        conn = get_db_connection()
        cur = conn.cursor()

        print(f"⌛️ 正在计算 {calculation_month.year} 年 {calculation_month.month} 月的五险一金...")

        # 1. 获取所有员工的最新缴费基数
        # 确保基数在指定月份生效，并根据员工姓名进行筛选
        # 新增：只筛选当前月有工资记录的员工
        sql_query_bases = f"""
            SELECT DISTINCT
                veb.id AS employee_id,
                veb.first_name,
                veb.last_name,
                COALESCE(esc.social_insurance_base, 0) AS social_insurance_base,
                COALESCE(esc.housing_fund_base, 0) AS housing_fund_base,
                COALESCE(esc.occupational_pension_base, 0) AS occupational_pension_base,
                veb.root_personnel_category_name,
                veb.personnel_category_id,
                veb.housing_fund_client_number -- Directly select housing_fund_client_number from v_employees_basic
            FROM
                reports.v_employees_basic veb -- 使用 reports.v_employees_basic 视图
            LEFT JOIN
                payroll.employee_salary_configs esc ON veb.id = esc.employee_id
                AND esc.effective_date <= %s AND (esc.end_date IS NULL OR esc.end_date >= %s)
            INNER JOIN
                payroll.payroll_entries pe ON veb.id = pe.employee_id
            INNER JOIN
                payroll.payroll_periods pp ON pe.payroll_period_id = pp.id
            WHERE
                pp.start_date <= %s 
                AND pp.end_date >= %s
        """
        params_bases = [calculation_month, calculation_month, calculation_month, calculation_month]

        if employee_name:
            sql_query_bases += " AND LOWER(veb.last_name || veb.first_name) = LOWER(%s)"
            params_bases.append(employee_name)
        
        sql_query_bases += " ORDER BY veb.last_name, veb.first_name;"

        cur.execute(sql_query_bases, params_bases)
        employees_data = cur.fetchall()

        if not employees_data:
            print("⚠️ 未找到活跃员工或该月份的缴费基数数据，或指定员工姓名不匹配。")
            return

        # 输出人员参数表
        print("\n📋 人员参数表：")
        param_header = ["姓名", "员工ID", "编制/人员身份", "人员身份ID", "查询月份"]
        print("| " + " | ".join(param_header) + " |")
        print("|" + "---" * len(param_header) + "|")
        for emp_id, first_name, last_name, social_insurance_base, housing_fund_base, occupational_pension_base, personnel_category_name, personnel_category_id, housing_fund_client_number in employees_data:
            full_name = f"{last_name}{first_name}"
            row_params = [
                full_name,
                str(emp_id),
                personnel_category_name if personnel_category_name else "N/A",
                str(personnel_category_id) if personnel_category_id else "N/A",
                calculation_month_str
            ]
            print("| " + " | ".join(row_params) + " |")
        print("--------------------------------------------------") # 分隔线

        # 获取人员类别ID到名称的映射
        # 移除人员类别ID到名称的映射，因为直接从视图中获取 root_personnel_category_name
        # cur.execute("""
        #     SELECT
        #         id,
        #         name
        #     FROM
        #         hr.personnel_categories;
        # """)
        # personnel_categories_data = cur.fetchall()
        # personnel_category_map = {row[0]: row[1] for row in personnel_categories_data}

        # 2. 获取所有社会保险和公积金的费率以及适用人员类别
        # 确保费率在指定月份生效
        cur.execute(f"""
            SELECT
                id, -- 获取ID以便识别规则
                insurance_type,
                COALESCE(employee_rate, 0) AS employee_rate,
                COALESCE(employer_rate, 0) AS employer_rate,
                COALESCE(min_base, 0) AS min_base,
                COALESCE(max_base, 999999999999999.99) AS max_base,
                applicable_personnel_categories,
                config_name -- 添加 config_name 字段
            FROM
                payroll.social_insurance_configs
            WHERE
                is_active = TRUE
                AND effective_date <= %s AND (end_date IS NULL OR end_date >= %s);
        """, (calculation_month, calculation_month))
        rates_data = cur.fetchall()

        rates_list = []
        for row in rates_data:
            # 检查 applicable_personnel_categories 是否为字符串，如果是则尝试解析为列表
            applicable_categories = row[6]
            if isinstance(applicable_categories, str):
                try:
                    applicable_categories = json.loads(applicable_categories)
                except json.JSONDecodeError:
                    print(f"⚠️ 警告: 无法解析 applicable_personnel_categories 字段为JSON列表: {applicable_categories}")
                    applicable_categories = None # 解析失败则设为 None
            
            # 确保 applicable_categories 是列表或 None
            if not isinstance(applicable_categories, list):
                if applicable_categories is not None: # 如果不是列表也不是None，说明不是预期的JSON数组
                    print(f"⚠️ 警告: applicable_personnel_categories 字段类型非预期，期望列表或None，实际为 {type(applicable_categories)}: {applicable_categories}")
                applicable_categories = None

            rates_list.append({
                "id": row[0], # 规则ID
                "insurance_type": row[1],
                "employee_rate": Decimal(str(row[2])),
                "employer_rate": Decimal(str(row[3])),
                "min_base": Decimal(str(row[4])),
                "max_base": Decimal(str(row[5])),
                "applicable_personnel_categories": applicable_categories, # 使用处理后的数据
                "config_name": row[7] # 存储 config_name
            })
        
        # 增加费率读取的显示
        print("\n💡 已加载的五险一金费率配置：")
        if rates_list:
            for rates in rates_list:
                print(f"   - 类型: {rates['insurance_type']}, ID: {rates['id']}, 个人费率={rates['employee_rate']:.4f}, 单位费率={rates['employer_rate']:.4f}, 最低基数={rates['min_base']:.2f}, 最高基数={rates['max_base']:.2f}, 适用人员类别={rates['applicable_personnel_categories']}(类型:{type(rates['applicable_personnel_categories'])}), 配置名称={rates['config_name']}")
        else:
            print("   ⚠️ 未加载到任何费率配置，请检查 payroll.social_insurance_configs 表。")

        # 定义五险一金类型
        insurance_types = ["PENSION", "MEDICAL", "UNEMPLOYMENT", "INJURY", "MATERNITY", "OCCUPATIONAL_PENSION", "SERIOUS_ILLNESS"]
        housing_fund_type = "HOUSING_FUND"

        results = []
        for emp_id, first_name, last_name, social_insurance_base, housing_fund_base, occupational_pension_base, personnel_category_name, personnel_category_id, housing_fund_client_number in employees_data:
            full_name = f"{last_name}{first_name}"
            social_insurance_base = Decimal(str(social_insurance_base))
            housing_fund_base = Decimal(str(housing_fund_base))
            occupational_pension_base = Decimal(str(occupational_pension_base))

            total_personal_contribution = Decimal('0.00')
            total_employer_contribution = Decimal('0.00')
            
            detail_contributions = {}
            applied_rules = []
            unapplied_rules = []
            housing_fund_applied_rules = [] # 初始化公积金适用规则列表
            housing_fund_unapplied_rules = [] # 初始化公积金不适用规则列表

            # 计算五险
            for ins_type in insurance_types:
                applicable_rate = None # 初始化为None
                temp_unapplied_rules_for_type = [] # 临时存储当前险种不适用规则的原因

                for rate_config in rates_list:
                    if rate_config["insurance_type"] == ins_type:
                        # 第一阶段：检查 config_name 是否与员工的 root_personnel_category_name 匹配
                        config_name_matches = (rate_config["config_name"] == personnel_category_name)

                        # 第二阶段：检查人员身份ID是否包含在适用人员类别数组中
                        personnel_category_matches = (rate_config["applicable_personnel_categories"] is None or \
                                                      (personnel_category_id is not None and personnel_category_id in rate_config["applicable_personnel_categories"])) # 确保 personnel_category_id 不是None

                        if config_name_matches and personnel_category_matches:
                            applicable_rate = rate_config # 找到适用的费率
                            break # 找到完全匹配的费率，跳出循环
                        else:
                            # 收集不适用该规则的具体原因
                            reasons = []
                            if not config_name_matches:
                                reasons.append(f"配置名称({rate_config['config_name']})与人员身份({personnel_category_name})不匹配")
                            if not personnel_category_matches:
                                reasons.append(f"人员身份ID({personnel_category_id})不在适用类别({rate_config['applicable_personnel_categories']})中")
                            
                            # 只有当有明确原因时才添加不适用规则
                            if reasons:
                                temp_unapplied_rules_for_type.append(f"{ins_type} (规则ID:{rate_config['id']}, 原因:{', '.join(reasons)})")
                
                if applicable_rate: # 如果找到了适用的费率
                    rates = applicable_rate # 将适用的费率赋值给 rates
                    
                    # 根据险种选择合适的缴费基数
                    if ins_type == "OCCUPATIONAL_PENSION":
                        # 职业年金使用专门的职业年金缴费基数，如果没有则使用社保基数
                        base_for_calculation = occupational_pension_base if occupational_pension_base > 0 else social_insurance_base
                    else:
                        # 其他险种使用社保缴费基数
                        base_for_calculation = social_insurance_base
                    
                    # 确定实际缴费基数（在最低和最高基数之间），并进行四舍五入取整
                    actual_base = max(rates["min_base"], min(rates["max_base"], base_for_calculation)).quantize(Decimal('1'), rounding=ROUND_HALF_UP)
                    
                    personal_contribution = (actual_base * rates["employee_rate"]).quantize(Decimal('0.01'))
                    employer_contribution = (actual_base * rates["employer_rate"]).quantize(Decimal('0.01'))

                    total_personal_contribution += personal_contribution
                    total_employer_contribution += employer_contribution
                    
                    detail_contributions[f"{ins_type}_个人"] = personal_contribution
                    detail_contributions[f"{ins_type}_单位"] = employer_contribution
                    # 添加费率到详细贡献中
                    detail_contributions[f"{ins_type}_个人_费率"] = rates["employee_rate"]
                    detail_contributions[f"{ins_type}_单位_费率"] = rates["employer_rate"]
                    applied_rules.append(f"{ins_type} (规则ID:{applicable_rate['id']}, 配置名称:{applicable_rate['config_name']})") # 重新加入配置名称
                else:
                    detail_contributions[f"{ins_type}_个人"] = Decimal('0.00')
                    detail_contributions[f"{ins_type}_单位"] = Decimal('0.00')
                    # 如果没有找到匹配规则，费率也设为0
                    detail_contributions[f"{ins_type}_个人_费率"] = Decimal('0.00')
                    detail_contributions[f"{ins_type}_单位_费率"] = Decimal('0.00')
                    # 如果没有找到完全匹配的规则，将收集到的不适用原因添加到 unapplied_rules
                    if temp_unapplied_rules_for_type:
                        unapplied_rules.extend(temp_unapplied_rules_for_type)
                    else:
                        unapplied_rules.append(f"{ins_type} (无匹配规则)") # 如果没有任何规则被考虑过

            # 计算公积金
            housing_fund_applicable_rate = None
            housing_fund_temp_unapplied_rules = [] # 临时存储当前险种不适用规则的原因

            for rate_config in rates_list:
                if rate_config["insurance_type"] == housing_fund_type:
                    # 第一阶段：检查 config_name 是否与员工的 root_personnel_category_name 匹配
                    config_name_matches = (rate_config["config_name"] == personnel_category_name)

                    # 第二阶段：检查人员身份ID是否包含在适用人员类别数组中
                    personnel_category_matches = (rate_config["applicable_personnel_categories"] is None or \
                                                  (personnel_category_id is not None and personnel_category_id in rate_config["applicable_personnel_categories"])) # 确保 personnel_category_id 不是None

                    if config_name_matches and personnel_category_matches:
                        housing_fund_applicable_rate = rate_config
                        break
                    else:
                        reasons = []
                        if not config_name_matches:
                            reasons.append(f"配置名称({rate_config['config_name']})与人员身份({personnel_category_name})不匹配")
                        if not personnel_category_matches:
                            reasons.append(f"人员身份ID({personnel_category_id})不在适用类别({rate_config['applicable_personnel_categories']})中")
                        
                        if reasons:
                            housing_fund_temp_unapplied_rules.append(f"公积金 (规则ID:{rate_config['id']}, 原因:{', '.join(reasons)})")
            
            if housing_fund_applicable_rate:
                rates = housing_fund_applicable_rate
                
                # 确定实际缴费基数（在最低和最高基数之间），并进行四舍五入取整
                actual_base = max(rates["min_base"], min(rates["max_base"], housing_fund_base)).quantize(Decimal('1'), rounding=ROUND_HALF_UP)
                
                # 🎯 公积金特殊进位处理：小数部分 >= 0.1 进一位，否则舍去小数
                raw_personal_hf = actual_base * rates["employee_rate"]
                raw_employer_hf = actual_base * rates["employer_rate"]
                
                personal_hf_contribution = apply_housing_fund_rounding(raw_personal_hf)
                employer_hf_contribution = apply_housing_fund_rounding(raw_employer_hf)
                
                total_personal_contribution += personal_hf_contribution
                total_employer_contribution += employer_hf_contribution

                detail_contributions[f"公积金_个人"] = personal_hf_contribution
                detail_contributions[f"公积金_单位"] = employer_hf_contribution
                # 添加费率到详细贡献中
                detail_contributions[f"公积金_个人_费率"] = rates["employee_rate"]
                detail_contributions[f"公积金_单位_费率"] = rates["employer_rate"]
                housing_fund_applied_rules.append(f"公积金 (规则ID:{housing_fund_applicable_rate['id']}, 配置名称:{housing_fund_applicable_rate['config_name']})") # 重新加入配置名称
            else:
                detail_contributions[f"公积金_个人"] = Decimal('0.00')
                detail_contributions[f"公积金_单位"] = Decimal('0.00')
                # 如果没有找到匹配规则，费率也设为0
                detail_contributions[f"公积金_个人_费率"] = Decimal('0.00')
                detail_contributions[f"公积金_单位_费率"] = Decimal('0.00')
                if housing_fund_temp_unapplied_rules:
                    housing_fund_unapplied_rules.extend(housing_fund_temp_unapplied_rules)
                else:
                    housing_fund_unapplied_rules.append(f"公积金 (无匹配规则)")

            # 计算医疗保险合计
            medical_personal_total = detail_contributions.get("MEDICAL_个人", Decimal('0.00')) + detail_contributions.get("SERIOUS_ILLNESS_个人", Decimal('0.00'))
            medical_employer_total = detail_contributions.get("MEDICAL_单位", Decimal('0.00')) + detail_contributions.get("SERIOUS_ILLNESS_单位", Decimal('0.00'))

            results.append({
                "姓名": full_name,
                "员工ID": emp_id,  # 添加员工ID
                "人员身份": personnel_category_name,
                "社保基数": social_insurance_base,
                "公积金基数": housing_fund_base,
                "职业年金基数": occupational_pension_base,
                "五险一金个人合计": total_personal_contribution,
                "五险一金单位合计": total_employer_contribution,
                "个人客户号": housing_fund_client_number if housing_fund_client_number else "N/A",
                "医疗保险个人应缴总额": medical_personal_total,
                "医疗保险单位应缴总额": medical_employer_total,
                **detail_contributions,
                "适用的社保规则": ", ".join(applied_rules) if applied_rules else "无",
                "不适用的社保规则": "; \n".join(unapplied_rules) if unapplied_rules else "无"
            })
        
        print("\n✅ 五险一金计算结果：")
        # 打印表头
        if results:
            # 定义新的固定顺序的表头
            new_header = [
                "姓名",
                "职业年金缴费基数", # 对应 social_insurance_base
                "职业年金单位缴费费率",
                "职业年金单位应缴费额",
                "职业年金个人费率",
                "职业年金个人应缴费额",
                "养老保险单位缴费费率",
                "养老保险单位应缴费额",
                "养老保险个人缴费费率",
                "养老保险个人应缴费额",
                "失业保险单位缴费费率",
                "失业保险单位应缴费额",
                "失业保险个人缴费费率",
                "失业保险个人应缴费额",
                "工伤保险单位缴费费率",
                "工伤保险单位应缴费额",
                "医疗保险单位缴费费率",
                "医疗保险单位应缴费额",
                "医疗保险个人缴费费率",
                "医疗保险个人应缴费额",
                "大病医疗单位缴费费率",
                "大病医疗单位应缴费额",
                "医疗保险单位应缴总额",
                "医疗保险个人应缴总额",
                "公积金个人客户号",
                "公积金缴费基数",
                "住房公积金单位应缴费额",
                "住房公积金个人应缴费额"
            ]

            print("| " + " | ".join(new_header) + " |")
            print("|" + "---" * len(new_header) + "|")

            # 打印数据
            for res in results:
                row_data = []
                for col_name in new_header:
                    value = None
                    if col_name == "职业年金缴费基数":
                        value = res.get("职业年金基数") or res.get("社保基数") # 优先使用职业年金基数，如果没有则使用社保基数
                    elif col_name == "养老保险单位缴费费率":
                        value = res.get("PENSION_单位_费率")
                    elif col_name == "养老保险单位应缴费额":
                        value = res.get("PENSION_单位")
                    elif col_name == "养老保险个人缴费费率":
                        value = res.get("PENSION_个人_费率")
                    elif col_name == "养老保险个人应缴费额":
                        value = res.get("PENSION_个人")
                    elif col_name == "失业保险单位缴费费率":
                        value = res.get("UNEMPLOYMENT_单位_费率")
                    elif col_name == "失业保险单位应缴费额":
                        value = res.get("UNEMPLOYMENT_单位")
                    elif col_name == "失业保险个人缴费费率":
                        value = res.get("UNEMPLOYMENT_个人_费率")
                    elif col_name == "失业保险个人应缴费额":
                        value = res.get("UNEMPLOYMENT_个人")
                    elif col_name == "工伤保险单位缴费费率":
                        value = res.get("INJURY_单位_费率")
                    elif col_name == "工伤保险单位应缴费额":
                        value = res.get("INJURY_单位")
                    elif col_name == "医疗保险单位缴费费率":
                        value = res.get("MEDICAL_单位_费率")
                    elif col_name == "医疗保险单位应缴费额":
                        value = res.get("MEDICAL_单位")
                    elif col_name == "医疗保险个人缴费费率":
                        value = res.get("MEDICAL_个人_费率")
                    elif col_name == "医疗保险个人应缴费额":
                        value = res.get("MEDICAL_个人")
                    elif col_name == "大病医疗单位缴费费率":
                        value = res.get("SERIOUS_ILLNESS_单位_费率")
                    elif col_name == "大病医疗单位应缴费额":
                        value = res.get("SERIOUS_ILLNESS_单位")
                    elif col_name == "职业年金单位缴费费率":
                        value = res.get("OCCUPATIONAL_PENSION_单位_费率")
                    elif col_name == "职业年金单位应缴费额":
                        value = res.get("OCCUPATIONAL_PENSION_单位")
                    elif col_name == "职业年金个人费率":
                        value = res.get("OCCUPATIONAL_PENSION_个人_费率")
                    elif col_name == "职业年金个人应缴费额":
                        value = res.get("OCCUPATIONAL_PENSION_个人")
                    elif col_name == "住房公积金单位应缴金额":
                        value = res.get("公积金_单位")
                    elif col_name == "住房公积金个人应缴金额":
                        value = res.get("公积金_个人")
                    elif col_name == "公积金缴费基数":
                        value = res.get("公积金基数")
                    else:
                        value = res.get(col_name)

                    # 格式化金额和费率
                    if isinstance(value, Decimal):
                        if "费率" in col_name: # 费率保留4位小数
                            row_data.append(f"{value:.4f}")
                        else: # 金额保留2位小数
                            row_data.append(f"{value:.2f}")
                    elif value is None:
                        row_data.append("N/A") # None 值显示 N/A
                    else:
                        row_data.append(str(value))
                print("| " + " | ".join(row_data) + " |")
        else:
            print("⚠️ 未找到活跃员工或该月份的缴费基数数据，或指定员工姓名不匹配。") # 如果没有结果，表头为空
        
        # 返回计算结果，供CSV导出使用
        return results

    except Exception as e:
        print(f"❌ 计算过程中发生错误: {e}")
        return []
    finally:
        if conn:
            conn.close()


def export_to_csv(results, calculation_month_str, employee_name=None):
    """
    将计算结果导出为CSV文件
    
    Args:
        results: 计算结果列表
        calculation_month_str: 计算月份字符串
        employee_name: 可选的员工姓名
    """
    if not results:
        print("⚠️ 没有数据可导出")
        return None
    
    # 生成文件名
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    if employee_name:
        filename = f"五险一金计算结果_{calculation_month_str}_{employee_name}_{timestamp}.csv"
    else:
        filename = f"五险一金计算结果_{calculation_month_str}_全员_{timestamp}.csv"
    
    # 确保输出目录存在
    output_dir = "output"
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    filepath = os.path.join(output_dir, filename)
    
    try:
        # 定义CSV表头（与控制台输出保持一致）
        csv_header = [
            "姓名",
            "人员身份",
            "员工ID",
            "社保基数",
            "公积金基数",
            "职业年金缴费基数",
            "职业年金单位缴费费率",
            "职业年金单位应缴费额", 
            "职业年金个人费率",
            "职业年金个人应缴费额",
            "养老保险单位缴费费率",
            "养老保险单位应缴费额",
            "养老保险个人缴费费率", 
            "养老保险个人应缴费额",
            "失业保险单位缴费费率",
            "失业保险单位应缴费额",
            "失业保险个人缴费费率",
            "失业保险个人应缴费额",
            "工伤保险单位缴费费率",
            "工伤保险单位应缴费额",
            "医疗保险单位缴费费率",
            "医疗保险单位应缴费额",
            "医疗保险个人缴费费率",
            "医疗保险个人应缴费额",
            "大病医疗单位缴费费率",
            "大病医疗单位应缴费额",
            "医疗保险单位应缴总额",
            "医疗保险个人应缴总额",
            "个人客户号",
            "公积金缴费基数",
            "住房公积金单位应缴金额",
            "住房公积金个人应缴金额",
            "五险一金个人合计",
            "五险一金单位合计",
            "适用的社保规则",
            "不适用的社保规则"
        ]
        
        with open(filepath, 'w', newline='', encoding='utf-8-sig') as csvfile:
            writer = csv.writer(csvfile)
            
            # 写入表头
            writer.writerow(csv_header)
            
            # 写入数据行
            for res in results:
                row_data = []
                for col_name in csv_header:
                    value = None
                    
                    # 映射字段值
                    if col_name == "职业年金缴费基数":
                        value = res.get("职业年金基数") or res.get("社保基数") # 优先使用职业年金基数，如果没有则使用社保基数
                    elif col_name == "养老保险单位缴费费率":
                        value = res.get("PENSION_单位_费率")
                    elif col_name == "养老保险单位应缴费额":
                        value = res.get("PENSION_单位")
                    elif col_name == "养老保险个人缴费费率":
                        value = res.get("PENSION_个人_费率")
                    elif col_name == "养老保险个人应缴费额":
                        value = res.get("PENSION_个人")
                    elif col_name == "失业保险单位缴费费率":
                        value = res.get("UNEMPLOYMENT_单位_费率")
                    elif col_name == "失业保险单位应缴费额":
                        value = res.get("UNEMPLOYMENT_单位")
                    elif col_name == "失业保险个人缴费费率":
                        value = res.get("UNEMPLOYMENT_个人_费率")
                    elif col_name == "失业保险个人应缴费额":
                        value = res.get("UNEMPLOYMENT_个人")
                    elif col_name == "工伤保险单位缴费费率":
                        value = res.get("INJURY_单位_费率")
                    elif col_name == "工伤保险单位应缴费额":
                        value = res.get("INJURY_单位")
                    elif col_name == "医疗保险单位缴费费率":
                        value = res.get("MEDICAL_单位_费率")
                    elif col_name == "医疗保险单位应缴费额":
                        value = res.get("MEDICAL_单位")
                    elif col_name == "医疗保险个人缴费费率":
                        value = res.get("MEDICAL_个人_费率")
                    elif col_name == "医疗保险个人应缴费额":
                        value = res.get("MEDICAL_个人")
                    elif col_name == "大病医疗单位缴费费率":
                        value = res.get("SERIOUS_ILLNESS_单位_费率")
                    elif col_name == "大病医疗单位应缴费额":
                        value = res.get("SERIOUS_ILLNESS_单位")
                    elif col_name == "职业年金单位缴费费率":
                        value = res.get("OCCUPATIONAL_PENSION_单位_费率")
                    elif col_name == "职业年金单位应缴费额":
                        value = res.get("OCCUPATIONAL_PENSION_单位")
                    elif col_name == "职业年金个人费率":
                        value = res.get("OCCUPATIONAL_PENSION_个人_费率")
                    elif col_name == "职业年金个人应缴费额":
                        value = res.get("OCCUPATIONAL_PENSION_个人")
                    elif col_name == "住房公积金单位应缴金额":
                        value = res.get("公积金_单位")
                    elif col_name == "住房公积金个人应缴金额":
                        value = res.get("公积金_个人")
                    elif col_name == "公积金缴费基数":
                        value = res.get("公积金基数")
                    elif col_name == "员工ID":
                        value = res.get("员工ID")
                    else:
                        value = res.get(col_name)
                    
                    # 格式化数值
                    if isinstance(value, Decimal):
                        if "费率" in col_name:
                            row_data.append(f"{value:.4f}")
                        else:
                            row_data.append(f"{value:.2f}")
                    elif value is None:
                        row_data.append("N/A")
                    else:
                        row_data.append(str(value))
                
                writer.writerow(row_data)
        
        print(f"\n✅ CSV文件已导出: {filepath}")
        print(f"📊 导出记录数: {len(results)}")
        return filepath
        
    except Exception as e:
        print(f"❌ CSV导出失败: {e}")
        return None

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="计算员工的五险一金缴费。")
    parser.add_argument("-m", "--month", required=True, help="计算月份 (格式: YYYY-MM), 例如: 2025-03")
    parser.add_argument("-e", "--employee", help="可选: 员工姓名，用于筛选特定员工 (例如: 张三)")
    parser.add_argument("--csv", action="store_true", help="导出计算结果为CSV文件")

    args = parser.parse_args()

    # 执行计算
    results = calculate_social_insurance_and_housing_fund(args.month, args.employee)
    
    # 如果指定了CSV导出选项，则导出CSV文件
    if args.csv and results:
        export_to_csv(results, args.month, args.employee) 