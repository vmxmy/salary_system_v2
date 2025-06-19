"""
薪资构成项定义 (Payroll Component Definitions) 配置相关的API路由。
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import Optional, List

from ...database import get_db_v2
from webapp.v2.crud import config as crud
from ...pydantic_models.config import (
    PayrollComponentDefinitionCreate, PayrollComponentDefinitionUpdate, PayrollComponentDefinitionListResponse
)
# 从payroll模块导入PayrollComponentDefinition, 因为它在config.py的原始导入中也这么做
from ...pydantic_models.payroll import PayrollComponentDefinition 
from ...pydantic_models.common import DataResponse
from webapp.auth import require_permissions
from ...utils import create_error_response
import logging

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/payroll-component-definitions",
    tags=["Configuration - Payroll Components"],
)

@router.get("", response_model=PayrollComponentDefinitionListResponse)
async def get_payroll_components(
    component_type: Optional[str] = None,
    is_active: Optional[bool] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(10, ge=1, le=100, description="Page size"),
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["payroll_component:view"]))
):
    """
    获取工资组件定义列表，支持分页、搜索和过滤。
    """
    try:
        # 计算跳过的记录数 (虽然crud函数可能直接处理分页参数，但保持一致性)
        skip = (page - 1) * size 
        # crud.get_payroll_component_definitions 现在直接接受 page 和 size
        result = crud.get_payroll_component_definitions(
            db=db,
            component_type=component_type,
            is_active=is_active,
            search=search,
            skip=skip, # 传递 skip
            limit=size # 传递 size (crud函数内部叫limit)
        )
        return result # crud函数应该返回符合ListResponse的格式
    except Exception as e:
        logger.error(f"Error getting payroll components: {e}", exc_info=True)
        # 返回标准错误响应格式
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="Internal Server Error",
                details=f"Failed to retrieve payroll components: {str(e)}"
            )
        )

@router.get("/{component_id}", response_model=DataResponse[PayrollComponentDefinition])
async def get_payroll_component(
    component_id: int,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["payroll_component:view"]))
):
    """
    根据ID获取工资组件定义详情。
    """
    try:
        component = crud.get_payroll_component_definition(db, component_id)
        if not component:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=create_error_response(
                    status_code=404,
                    message="Not Found",
                    details=f"Payroll component definition with ID {component_id} not found"
                )
            )
        return DataResponse[PayrollComponentDefinition](data=component)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting payroll component {component_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="Internal Server Error",
                details=f"Failed to retrieve payroll component {component_id}: {str(e)}"
            )
        )

@router.post("", response_model=DataResponse[PayrollComponentDefinition], status_code=status.HTTP_201_CREATED)
async def create_payroll_component(
    component: PayrollComponentDefinitionCreate,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["payroll_component:manage"]))
):
    """
    创建新工资组件定义。
    """
    try:
        component_data = component.model_dump()
        db_component = crud.create_payroll_component_definition(db, component_data)
        return DataResponse[PayrollComponentDefinition](data=db_component)
    except ValueError as e:
        logger.warning(f"Failed to create payroll component due to validation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=create_error_response(
                status_code=422,
                message="Unprocessable Entity",
                details=str(e)
            )
        )
    except Exception as e:
        logger.error(f"Error creating payroll component: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="Internal Server Error",
                details=f"Failed to create payroll component: {str(e)}"
            )
        )

@router.put("/{component_id}", response_model=DataResponse[PayrollComponentDefinition])
async def update_payroll_component(
    component_id: int,
    component: PayrollComponentDefinitionUpdate,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["payroll_component:manage"]))
):
    """
    更新工资组件定义信息。
    """
    try:
        update_data = component.model_dump()
        updated_component = crud.update_payroll_component_definition(
            db=db,
            component_id=component_id,
            component_data=update_data
        )
        if not updated_component:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=create_error_response(
                    status_code=404,
                    message="Not Found",
                    details=f"Payroll component definition with ID {component_id} not found"
                )
            )
        return DataResponse[PayrollComponentDefinition](data=updated_component)
    except ValueError as e:
        logger.warning(f"Failed to update payroll component {component_id} due to validation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=create_error_response(
                status_code=422,
                message="Unprocessable Entity",
                details=str(e)
            )
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating payroll component {component_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="Internal Server Error",
                details=f"Failed to update payroll component {component_id}: {str(e)}"
            )
        )

@router.delete("/{component_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_payroll_component(
    component_id: int,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["payroll_component:manage"]))
):
    """
    删除工资组件定义。
    """
    try:
        success = crud.delete_payroll_component_definition(db, component_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=create_error_response(
                    status_code=404,
                    message="Not Found",
                    details=f"Payroll component definition with ID {component_id} not found for deletion"
                )
            )
        return None # Returns 204 No Content
    except ValueError as e: # Handles cases where component is in use
        logger.warning(f"Conflict deleting payroll component {component_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=create_error_response(
                status_code=409,
                message="Conflict",
                details=str(e) # e.g., "Cannot delete component, it is used in payroll data."
            )
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting payroll component {component_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="Internal Server Error",
                details=f"Failed to delete payroll component {component_id}: {str(e)}"
            )
        )
