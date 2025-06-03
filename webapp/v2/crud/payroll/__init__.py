"""
工资相关的CRUD操作包。

该包包含了工资系统的所有CRUD操作，按功能模块进行分类：
- payroll_periods: 薪资周期相关操作
- payroll_runs: 薪资审核相关操作  
- payroll_entries: 薪资条目相关操作
- bank_export: 银行代发相关操作
- bulk_operations: 批量操作相关功能
- utils: 工具函数
"""

# 导入所有薪资周期相关的CRUD操作
from .payroll_periods import (
    get_payroll_periods,
    get_payroll_period,
    create_payroll_period,
    update_payroll_period,
    delete_payroll_period
)

# 导入所有薪资审核相关的CRUD操作
from .payroll_runs import (
    get_payroll_runs,
    get_payroll_run,
    create_payroll_run,
    update_payroll_run,
    patch_payroll_run,
    delete_payroll_run
)

# 导入所有薪资条目相关的CRUD操作
from .payroll_entries import (
    get_payroll_entries,
    get_payroll_entry,
    create_payroll_entry,
    update_payroll_entry,
    patch_payroll_entry,
    delete_payroll_entry
)

# 导入银行导出相关操作
from .bank_export import (
    get_payroll_entries_for_bank_export
)

# 导入批量操作相关功能
from .bulk_operations import (
    bulk_create_payroll_entries,
    bulk_validate_payroll_entries
)

# 导入工具函数
from .utils import (
    convert_decimals_to_float
)

__all__ = [
    # PayrollPeriod相关
    "get_payroll_periods",
    "get_payroll_period", 
    "create_payroll_period",
    "update_payroll_period",
    "delete_payroll_period",
    
    # PayrollRun相关
    "get_payroll_runs",
    "get_payroll_run",
    "create_payroll_run", 
    "update_payroll_run",
    "patch_payroll_run",
    "delete_payroll_run",
    
    # PayrollEntry相关
    "get_payroll_entries",
    "get_payroll_entry",
    "create_payroll_entry",
    "update_payroll_entry", 
    "patch_payroll_entry",
    "delete_payroll_entry",
    
    # 银行导出
    "get_payroll_entries_for_bank_export",
    
    # 批量操作
    "bulk_create_payroll_entries",
    
    # 工具函数
    "convert_decimals_to_float"
] 