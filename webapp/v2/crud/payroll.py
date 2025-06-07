"""
工资相关的CRUD操作（向后兼容接口）。

此文件为向后兼容而保留，所有功能都已重构到子模块中：
- payroll.payroll_periods: 薪资周期相关操作
- payroll.payroll_runs: 薪资审核相关操作  
- payroll.payroll_entries: 薪资条目相关操作
- payroll.bank_export: 银行代发相关操作
- payroll.bulk_operations: 批量操作相关功能
- payroll.utils: 工具函数

建议直接从对应的子模块导入所需的函数以获得更好的性能。
"""

# 从各个子模块导入所有函数，以保持向后兼容性
# PayrollPeriod相关
from .payroll.payroll_periods import (
    get_payroll_periods,
    get_payroll_period,
    create_payroll_period,
    update_payroll_period,
    delete_payroll_period
)

# PayrollRun相关
from .payroll.payroll_runs import (
    get_payroll_runs,
    get_payroll_run,
    create_payroll_run,
    update_payroll_run,
    patch_payroll_run,
    delete_payroll_run
)

# PayrollEntry相关
from .payroll.payroll_entries import (
    get_payroll_entries,
    get_payroll_entries_with_views,
    get_payroll_entry,
    create_payroll_entry,
    update_payroll_entry,
    patch_payroll_entry,
    delete_payroll_entry
)

# 银行导出
from .payroll.bank_export import (
    get_payroll_entries_for_bank_export
)

# 批量操作
from .payroll.bulk_operations import (
    bulk_create_payroll_entries,
    bulk_validate_payroll_entries
)

# 工具函数
from .payroll.utils import (
    convert_decimals_to_float
)

# 为了确保所有导入都可用，显式列出所有导出的函数
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
    "get_payroll_entries_with_views",
    "get_payroll_entry",
    "create_payroll_entry",
    "update_payroll_entry", 
    "patch_payroll_entry",
    "delete_payroll_entry",
    
    # 银行导出
    "get_payroll_entries_for_bank_export",
    
    # 批量操作
    "bulk_create_payroll_entries",
    "bulk_validate_payroll_entries",
    
    # 工具函数
    "convert_decimals_to_float"
]
