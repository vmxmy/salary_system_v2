"""
配置管理API路由 V2 - 基于视图的配置API
提供统一的配置数据访问接口，基于核心视图实现高性能配置管理
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional

from ..database import get_db_v2
from webapp.auth import require_permissions
from ..services.config import ConfigBusinessService
from ..utils.common import create_error_response  # 修复导入路径
from ..pydantic_models.common import PaginationResponse, DataResponse, SuccessResponse

router = APIRouter()

@router.get("/lookup/types", 
           response_model=DataResponse,
           summary="获取查找类型列表",
           description="获取所有查找类型，支持按状态过滤")
async def get_lookup_types(
    is_active: Optional[bool] = Query(None, description="是否活跃"),
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["config:view"]))
):
    """获取查找类型列表"""
    try:
        service = ConfigBusinessService(db)
        types = service.lookup_types.get_all_types(is_active=is_active)
        
        return DataResponse(
            data=types
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="获取查找类型失败",
                details=str(e)
            )
        )

@router.get("/lookup/values/{type_code}",
           response_model=DataResponse,
           summary="获取查找值列表",
           description="根据类型代码获取查找值列表")
async def get_lookup_values(
    type_code: str,
    is_active: Optional[bool] = Query(None, description="是否活跃"),
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["config:view"]))
):
    """根据类型代码获取查找值"""
    try:
        service = ConfigBusinessService(db)
        values = service.lookup_values.get_by_type_code(type_code, is_active=is_active)
        
        return DataResponse(
            data=values
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="获取查找值失败",
                details=str(e)
            )
        )

@router.get("/lookup/data",
           response_model=DataResponse,
           summary="获取查找数据字典",
           description="获取多个类型的查找数据，返回字典格式")
async def get_lookup_data(
    type_codes: Optional[str] = Query(None, description="类型代码列表，逗号分隔"),
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["config:view"]))
):
    """获取查找数据字典"""
    try:
        service = ConfigBusinessService(db)
        
        # 解析类型代码列表
        codes = type_codes.split(',') if type_codes else None
        data = service.get_lookup_data(codes)
        
        return DataResponse(
            data=data
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="获取查找数据失败",
                details=str(e)
            )
        )

@router.get("/payroll/components",
           response_model=DataResponse,
           summary="获取薪资组件列表",
           description="获取薪资组件及使用统计信息")
async def get_payroll_components(
    component_type: Optional[str] = Query(None, description="组件类型"),
    is_active: Optional[bool] = Query(None, description="是否活跃"),
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["config:view"]))
):
    """获取薪资组件列表"""
    try:
        service = ConfigBusinessService(db)
        components = service.payroll_components.get_components_with_usage(
            component_type=component_type,
            is_active=is_active
        )
        
        return DataResponse(
            data=components
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="获取薪资组件失败",
                details=str(e)
            )
        ) 