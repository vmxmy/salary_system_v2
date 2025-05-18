"""
实际任职 (Positions) 相关的API路由。
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any

from ..database import get_db_v2
from ..crud import hr as hr_crud # UNCOMMENTED
from ..pydantic_models.hr import Position, PositionListResponse # UNCOMMENTED and corrected: Position instead of PositionSchema
from ...auth import require_permissions # UNCOMMENTED
from ..utils import create_error_response # Added for standardized error responses

router = APIRouter(
    prefix="/positions",
    tags=["Positions"],
)

@router.get("/", response_model=PositionListResponse) # Corrected response_model
async def get_all_positions(
    search: Optional[str] = Query(None, description="Search term for name or code"), # UNCOMMENTED
    page: int = Query(1, ge=1, description="Page number"), # UNCOMMENTED
    size: int = Query(10, ge=1, le=1000, description="Page size"), # UNCOMMENTED, changed le to 1000
    is_active: Optional[bool] = Query(None, description="Filter by active status"), # UNCOMMENTED
    db: Session = Depends(get_db_v2), # UNCOMMENTED
    current_user = Depends(require_permissions(["P_POSITION_VIEW"])) # UNCOMMENTED, assuming P_POSITION_VIEW permission
):
    """
    获取实际任职列表，支持分页、搜索和按激活状态过滤。
    """
    try:
        positions_orms, total = hr_crud.get_positions(
            db=db, 
            search=search, 
            skip=(page-1)*size, 
            limit=size, 
            is_active=is_active
        )
        
        # Ensure Pydantic models are validated from ORM objects
        # The Position Pydantic model should have Config.from_attributes = True
        # positions_data = [Position.model_validate(pos) for pos in positions_orms] # This is implicit if response_model is used correctly with from_attributes=True

        total_pages = (total + size - 1) // size if total > 0 else 1
        return {
            "data": positions_orms, # FastAPI will handle validation against Position for list items
            "meta": {
                "page": page,
                "size": size,
                "total": total,
                "totalPages": total_pages
            }
        }
    except Exception as e:
        # Log the exception for debugging purposes
        # logger.error(f"Error fetching positions: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="Internal Server Error while fetching positions.",
                details=str(e)
            )
        )

# Add other endpoints (GET by ID, POST, PUT, DELETE) as needed 