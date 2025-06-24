from fastapi import APIRouter
from .data_sources import router as data_sources_router
from .calculated_fields import router as calculated_fields_router
from .templates import router as templates_router
from .queries import router as queries_router
from .optimization import router as optimization_router
from .payroll_modals import router as payroll_modals_router

# 创建主路由器
router = APIRouter(prefix="/reports", tags=["reports"])

# 包含所有子模块的路由
router.include_router(data_sources_router, prefix="/data-sources")
router.include_router(calculated_fields_router, prefix="/calculated-fields")
router.include_router(templates_router, prefix="/templates")
router.include_router(queries_router, prefix="/queries")
router.include_router(optimization_router, prefix="/optimization")
router.include_router(payroll_modals_router, prefix="/payroll-modals")

# 导出路由器
__all__ = ["router"] 