"""
报表相关工具函数
"""
import hashlib


def generate_pseudo_id(view_name: str) -> int:
    """
    为视图名称生成伪ID，用于动态数据源
    使用SHA256哈希的前8位生成确定性的ID，范围在10000-10999之间
    
    Args:
        view_name: 视图名称
        
    Returns:
        伪ID（10000-10999范围）
    """
    # 使用SHA256哈希确保确定性
    hash_object = hashlib.sha256(view_name.encode('utf-8'))
    hex_dig = hash_object.hexdigest()
    
    # 取前8位转换为整数，然后映射到10000-10999范围
    hash_int = int(hex_dig[:8], 16)
    pseudo_id = 10000 + (hash_int % 1000)
    
    return pseudo_id


# 预定义的reports schema中的视图列表，避免昂贵的系统表查询
KNOWN_VIEWS = [
    'v_comprehensive_employee_payroll',
    'v_comprehensive_employee_payroll_optimized', 
    'v_employee_salary_history',
    'v_employees_basic',
    'v_monthly_contract_platform_import',
    'v_monthly_contract_salary_summary',
    'v_monthly_contract_staff_net_pay',
    'v_monthly_fulltime_net_pay',
    'v_monthly_fulltime_platform_import',
    'v_monthly_professional_technical_net_pay',
    'v_payroll_component_usage',
    'v_payroll_components_basic',
    'v_payroll_entries_basic',
    'v_payroll_entries_detailed',
    'v_payroll_periods_detail',
    'v_payroll_runs_detail',
    'v_payroll_summary_analysis',
    'v_personnel_hierarchy_simple'
]


def find_view_by_pseudo_id(pseudo_id: int) -> str:
    """
    根据伪ID快速查找对应的视图名称
    
    Args:
        pseudo_id: 伪ID
        
    Returns:
        视图名称，如果找不到返回None
    """
    for view_name in KNOWN_VIEWS:
        if generate_pseudo_id(view_name) == pseudo_id:
            return view_name
    return None 