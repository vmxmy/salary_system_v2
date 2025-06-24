"""
社保费率 (Social Security Rates) 配置相关的API路由。
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import date

from ...database import get_db_v2
from webapp.v2.crud import config as crud
from ...pydantic_models.config import (
    SocialSecurityRateCreate, SocialSecurityRateUpdate, SocialSecurityRate, SocialSecurityRateListResponse
)
from ...pydantic_models.common import DataResponse
from webapp.auth import require_permissions
from ...utils import create_error_response
import logging

logger = logging.getLogger(__name__)

router = APIRouter(
    tags=["Configuration - Social Security Rates"],
)

@router.get("", response_model=SocialSecurityRateListResponse)
async def get_social_security_rates(
    region_code: Optional[str] = None,
    rate_type: Optional[str] = None,
    effective_date: Optional[date] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(10, ge=1, le=100, description="Page size"),
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["social_security_rate:view"]))
):
    """
    获取社保费率列表，支持分页、搜索和过滤。
    """
    try:
        # The original code in config.py had a nested try-except here for crud.get_social_security_rates
        # which returned an empty list on error. This is unusual. 
        # Reverting to a standard single try-except for the whole endpoint.
        skip = (page - 1) * size
        rates, total = crud.get_social_security_rates(
            db=db,
            region_code=region_code,
            rate_type=rate_type,
            effective_date=effective_date,
            search=search,
            skip=skip,
            limit=size
        )
        total_pages = (total + size - 1) // size if total > 0 else 1
        return {
            "data": rates,
            "meta": {
                "page": page,
                "size": size,
                "total": total,
                "totalPages": total_pages
            }
        }
    except Exception as e:
        logger.error(f"Error getting social security rates: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="Internal Server Error",
                details=f"Failed to retrieve social security rates: {str(e)}"
            )
        )

@router.get("/{rate_id}", response_model=DataResponse[SocialSecurityRate])
async def get_social_security_rate(
    rate_id: int,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["social_security_rate:view"]))
):
    """
    根据ID获取社保费率详情。
    """
    try:
        rate = crud.get_social_security_rate(db, rate_id)
        if not rate:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=create_error_response(
                    status_code=404,
                    message="Not Found",
                    details=f"Social security rate with ID {rate_id} not found"
                )
            )
        return DataResponse[SocialSecurityRate](data=rate)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting social security rate {rate_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="Internal Server Error",
                details=f"Failed to retrieve social security rate {rate_id}: {str(e)}"
            )
        )

@router.post("", response_model=DataResponse[SocialSecurityRate], status_code=status.HTTP_201_CREATED)
async def create_social_security_rate(
    rate: SocialSecurityRateCreate,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["social_security_rate:manage"]))
):
    """
    创建新社保费率。
    """
    try:
        db_rate = crud.create_social_security_rate(db, rate)
        return DataResponse[SocialSecurityRate](data=db_rate)
    except ValueError as e:
        logger.warning(f"Failed to create social security rate due to validation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=create_error_response(
                status_code=422,
                message="Unprocessable Entity",
                details=str(e)
            )
        )
    except Exception as e:
        logger.error(f"Error creating social security rate: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="Internal Server Error",
                details=f"Failed to create social security rate: {str(e)}"
            )
        )

@router.put("/{rate_id}", response_model=DataResponse[SocialSecurityRate])
async def update_social_security_rate(
    rate_id: int,
    rate: SocialSecurityRateUpdate,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["social_security_rate:manage"]))
):
    """
    更新社保费率信息。
    """
    try:
        db_rate = crud.update_social_security_rate(db, rate_id, rate)
        if not db_rate:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=create_error_response(
                    status_code=404,
                    message="Not Found",
                    details=f"Social security rate with ID {rate_id} not found"
                )
            )
        return DataResponse[SocialSecurityRate](data=db_rate)
    except ValueError as e:
        logger.warning(f"Failed to update social security rate {rate_id} due to validation error: {e}")
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
        logger.error(f"Error updating social security rate {rate_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="Internal Server Error",
                details=f"Failed to update social security rate {rate_id}: {str(e)}"
            )
        )

@router.delete("/{rate_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_social_security_rate(
    rate_id: int,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["social_security_rate:manage"]))
):
    """
    删除社保费率。
    """
    try:
        success = crud.delete_social_security_rate(db, rate_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=create_error_response(
                    status_code=404,
                    message="Not Found",
                    details=f"Social security rate with ID {rate_id} not found for deletion"
                )
            )
        return None # Returns 204 No Content
    except ValueError as e: # Handles cases where rate is in use or other validation
        logger.warning(f"Conflict deleting social security rate {rate_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=create_error_response(
                status_code=409,
                message="Conflict",
                details=str(e)
            )
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting social security rate {rate_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="Internal Server Error",
                details=f"Failed to delete social security rate {rate_id}: {str(e)}"
            )
        )
