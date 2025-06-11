# 导出所有路由
from .employees import router as employees_router
from .departments import router as departments_router
from .personnel_categories import router as personnel_categories_router
from .positions import router as positions_router
from .lookup import router as lookup_router
from .config import router as config_router
from .config_v2 import router as config_v2_router
from .payroll import router as payroll_router
from .payroll_v2 import router as payroll_v2_router
from .hr_v2 import router as hr_v2_router
from .security import router as security_router
from .auth import router as auth_router
from .reports import router as reports_router
from .calculation_config import router as calculation_config_router
# from .payroll_calculation import router as payroll_calculation_router  # 已删除复杂计算引擎
from .attendance import router as attendance_router
from .views import router as views_router
from .views_optimized import router as views_optimized_router
from .report_config_management import router as report_config_management_router
from .debug_fast import router as debug_fast_router

__all__ = [
    "employees_router",
    "departments_router",
    "personnel_categories_router",
    "positions_router",
    "lookup_router",
    "config_router",
    "config_v2_router",
    "payroll_router",
    "payroll_v2_router",
    "hr_v2_router",
    "security_router",
    "auth_router",
    "reports_router",
    "calculation_config_router",
    # "payroll_calculation_router",  # 已删除复杂计算引擎
    "attendance_router",
    "views_router",
    "views_optimized_router",
    "report_config_management_router",
    "debug_fast_router",
]
