"""
配置相关的API路由。
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status, Path
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any, List
from datetime import date
import logging

from ...database import get_db_v2
from webapp.v2.crud import config as crud
from ...pydantic_models.config import (
    SystemParameterCreate, SystemParameterUpdate, SystemParameter, SystemParameterListResponse,
    PayrollComponentDefinitionCreate, PayrollComponentDefinitionUpdate, PayrollComponentDefinitionListResponse,
    TaxBracketCreate, TaxBracketUpdate, TaxBracket, TaxBracketListResponse,
    SocialSecurityRateCreate, SocialSecurityRateUpdate, SocialSecurityRate, SocialSecurityRateListResponse,
)
# 从payroll模块导入PayrollComponentDefinition
from ...pydantic_models.payroll import PayrollComponentDefinition
from ...pydantic_models.common import DataResponse
from webapp.auth import get_current_user, require_permissions
from ...utils import create_error_response

# Import new routers
from .system_parameter_router import router as system_parameter_router
from .payroll_component_router import router as payroll_component_router
from .tax_bracket_router import router as tax_bracket_router
from .social_security_rate_router import router as social_security_rate_router
from .lookup_router import router as lookup_router
from .report_definition_router import router as report_definition_router
from .user_preferences_router import router as user_preferences_router


# 创建logger实例
logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/config",
    tags=["Configuration"],
)

# Include new routers
router.include_router(system_parameter_router)
router.include_router(payroll_component_router)
router.include_router(tax_bracket_router)
router.include_router(social_security_rate_router)
router.include_router(lookup_router)
router.include_router(report_definition_router)
router.include_router(user_preferences_router)
