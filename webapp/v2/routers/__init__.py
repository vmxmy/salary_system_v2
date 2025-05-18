# 导出所有路由
from .employees import router as employees_router
from .departments import router as departments_router
from .personnel_categories import router as personnel_categories_router
from .positions import router as positions_router
from .lookup import router as lookup_router
from .config import router as config_router
from .payroll import router as payroll_router
from .security import router as security_router
from .auth import router as auth_router

__all__ = [
    "employees_router",
    "departments_router",
    "personnel_categories_router",
    "positions_router",
    "lookup_router",
    "config_router",
    "payroll_router",
    "security_router",
    "auth_router",
]
