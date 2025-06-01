"""
税率表 (Tax Brackets) 配置相关的API路由。
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import date

from ...database import get_db_v2
from webapp.v2.crud import config as crud
from ...pydantic_models.config import (
    TaxBracketCreate, TaxBracketUpdate, TaxBracket, TaxBracketListResponse
)
from ...pydantic_models.common import DataResponse
from webapp.auth import require_permissions
from ...utils import create_error_response
import logging

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/tax-brackets",
    tags=["Configuration - Tax Brackets"],
)

@router.get("", response_model=TaxBracketListResponse)
async def get_tax_brackets(
    region_code: Optional[str] = None,
    tax_type: Optional[str] = None,
    effective_date: Optional[date] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(10, ge=1, le=100, description="Page size"),
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["tax_bracket:view"]))
):
    """
    获取税率档位列表，支持分页、搜索和过滤。
    """
    try:
        skip = (page - 1) * size
        tax_brackets, total = crud.get_tax_brackets(
            db=db,
            region_code=region_code,
            tax_type=tax_type,
            effective_date=effective_date,
            search=search,
            skip=skip,
            limit=size
        )
        total_pages = (total + size - 1) // size if total > 0 else 1
        return {
            "data": tax_brackets,
            "meta": {
                "page": page,
                "size": size,
                "total": total,
                "totalPages": total_pages
            }
        }
    except Exception as e:
        logger.error(f"Error getting tax brackets: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="Internal Server Error",
                details=f"Failed to retrieve tax brackets: {str(e)}"
            )
        )

@router.get("/{bracket_id}", response_model=DataResponse[TaxBracket])
async def get_tax_bracket(
    bracket_id: int,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["tax_bracket:view"]))
):
    """
    根据ID获取税率档位详情。
    """
    try:
        tax_bracket = crud.get_tax_bracket(db, bracket_id)
        if not tax_bracket:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=create_error_response(
                    status_code=404,
                    message="Not Found",
                    details=f"Tax bracket with ID {bracket_id} not found"
                )
            )
        return DataResponse[TaxBracket](data=tax_bracket)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting tax bracket {bracket_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="Internal Server Error",
                details=f"Failed to retrieve tax bracket {bracket_id}: {str(e)}"
            )
        )

@router.post("", response_model=DataResponse[TaxBracket], status_code=status.HTTP_201_CREATED)
async def create_tax_bracket(
    tax_bracket: TaxBracketCreate,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["tax_bracket:manage"]))
):
    """
    创建新税率档位。
    """
    try:
        db_tax_bracket = crud.create_tax_bracket(db, tax_bracket)
        return DataResponse[TaxBracket](data=db_tax_bracket)
    except ValueError as e:
        logger.warning(f"Failed to create tax bracket due to validation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=create_error_response(
                status_code=422,
                message="Unprocessable Entity",
                details=str(e)
            )
        )
    except Exception as e:
        logger.error(f"Error creating tax bracket: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="Internal Server Error",
                details=f"Failed to create tax bracket: {str(e)}"
            )
        )

@router.put("/{bracket_id}", response_model=DataResponse[TaxBracket])
async def update_tax_bracket(
    bracket_id: int,
    tax_bracket: TaxBracketUpdate,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["tax_bracket:manage"]))
):
    """
    更新税率档位信息。
    """
    try:
        db_tax_bracket = crud.update_tax_bracket(db, bracket_id, tax_bracket)
        if not db_tax_bracket:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=create_error_response(
                    status_code=404,
                    message="Not Found",
                    details=f"Tax bracket with ID {bracket_id} not found"
                )
            )
        return DataResponse[TaxBracket](data=db_tax_bracket)
    except ValueError as e:
        logger.warning(f"Failed to update tax bracket {bracket_id} due to validation error: {e}")
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
        logger.error(f"Error updating tax bracket {bracket_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="Internal Server Error",
                details=f"Failed to update tax bracket {bracket_id}: {str(e)}"
            )
        )

@router.delete("/{bracket_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tax_bracket(
    bracket_id: int,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["tax_bracket:manage"]))
):
    """
    删除税率档位。
    """
    try:
        success = crud.delete_tax_bracket(db, bracket_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=create_error_response(
                    status_code=404,
                    message="Not Found",
                    details=f"Tax bracket with ID {bracket_id} not found for deletion"
                )
            )
        return None # Returns 204 No Content
    except ValueError as e: # Handles cases where bracket is in use or other validation
        logger.warning(f"Conflict deleting tax bracket {bracket_id}: {e}")
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
        logger.error(f"Error deleting tax bracket {bracket_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="Internal Server Error",
                details=f"Failed to delete tax bracket {bracket_id}: {str(e)}"
            )
        )
