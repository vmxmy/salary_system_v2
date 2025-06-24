"""
系统参数 (System Parameters) 配置相关的API路由。
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status, Path
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any

from ...database import get_db_v2
from webapp.v2.crud import config as crud
from ...pydantic_models.config import (
    SystemParameterCreate, SystemParameterUpdate, SystemParameter, SystemParameterListResponse
)
from ...pydantic_models.common import DataResponse
from webapp.auth import require_permissions
from ...utils import create_error_response
import logging

logger = logging.getLogger(__name__)

router = APIRouter(
    tags=["Configuration - System Parameters"],
)

# SystemParameter endpoints
@router.get("", response_model=SystemParameterListResponse) # Changed path to empty string as prefix is handled by main router
async def get_system_parameters(
    search: Optional[str] = None,
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(10, ge=1, le=100, description="Page size"),
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["system_parameter:view"]))
):
    """
    获取系统参数列表，支持分页和搜索。

    - **search**: 搜索关键字，可以匹配参数键、值或描述
    - **page**: 页码，从1开始
    - **size**: 每页记录数，最大100
    """
    try:
        skip = (page - 1) * size
        parameters, total = crud.get_system_parameters(
            db=db,
            search=search,
            skip=skip,
            limit=size
        )
        total_pages = (total + size - 1) // size if total > 0 else 1
        return {
            "data": parameters,
            "meta": {
                "page": page,
                "size": size,
                "total": total,
                "totalPages": total_pages
            }
        }
    except Exception as e:
        logger.error(f"Error getting system parameters: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="Internal Server Error",
                details=f"Failed to retrieve system parameters: {str(e)}"
            )
        )

@router.get("/{parameter_id}", response_model=DataResponse[SystemParameter])
async def get_system_parameter(
    parameter_id: str, # Can be int (ID) or str (key)
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["system_parameter:view"]))
):
    """
    根据ID或键获取系统参数详情。

    - **parameter_id**: 系统参数ID或键
    """
    try:
        try:
            id_value = int(parameter_id)
            parameter = crud.get_system_parameter_by_id(db, id_value)
        except ValueError:
            parameter = crud.get_system_parameter_by_key(db, parameter_id)

        if not parameter:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=create_error_response(
                    status_code=404,
                    message="Not Found",
                    details=f"System parameter with ID or key '{parameter_id}' not found"
                )
            )
        return DataResponse[SystemParameter](data=parameter)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting system parameter {parameter_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="Internal Server Error",
                details=f"Failed to retrieve system parameter {parameter_id}: {str(e)}"
            )
        )

@router.post("", response_model=DataResponse[SystemParameter], status_code=status.HTTP_201_CREATED)
async def create_system_parameter(
    parameter: SystemParameterCreate,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["system_parameter:manage"]))
):
    """
    创建新系统参数。
    """
    try:
        db_parameter = crud.create_system_parameter(db, parameter)
        return DataResponse[SystemParameter](data=db_parameter)
    except ValueError as e:
        logger.warning(f"Failed to create system parameter due to validation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=create_error_response(
                status_code=422,
                message="Unprocessable Entity",
                details=str(e)
            )
        )
    except Exception as e:
        logger.error(f"Error creating system parameter: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="Internal Server Error",
                details=f"Failed to create system parameter: {str(e)}"
            )
        )

@router.put("/{parameter_id}", response_model=DataResponse[SystemParameter])
async def update_system_parameter(
    parameter_id: str, # Can be int (ID) or str (key)
    parameter: SystemParameterUpdate,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["system_parameter:manage"]))
):
    """
    更新系统参数信息。
    """
    try:
        db_parameter = None
        try:
            id_value = int(parameter_id)
            # Try to get by ID first
            existing_param = crud.get_system_parameter_by_id(db, id_value)
            if existing_param:
                update_data = parameter.model_dump(exclude_unset=True)
                for key, value in update_data.items():
                    setattr(existing_param, key, value)
                db.commit()
                db.refresh(existing_param)
                db_parameter = existing_param
        except ValueError:
            # If not an int, or not found by ID, try to update by key
            db_parameter = crud.update_system_parameter_by_key(db, parameter_id, parameter)
        
        if not db_parameter: # This covers both ID not found and key not found
             # Attempt to update by ID if it was a key initially, or vice-versa if first attempt failed.
             # This logic might be redundant if crud.update_system_parameter_by_key handles creation/update based on key correctly.
             # Assuming crud.update_system_parameter_by_key handles "update or error if not found by key"
             # and if parameter_id was an ID, the first block would handle it or error out if not found.
            if parameter_id.isdigit(): # if it was an ID, it should have been caught above
                 parameter_by_key = crud.get_system_parameter_by_key(db,parameter.key_name) if parameter.key_name else None
                 if parameter_by_key and str(parameter_by_key.id) == parameter_id : # check if key points to this id
                    pass # already handled by id
                 else: # key may exist but for diff id, or key not provided or key is diff
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=create_error_response(
                            status_code=404,
                            message="Not Found",
                            details=f"System parameter with ID '{parameter_id}' not found."
                        )
                    )
            else: # It was a key
                 raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=create_error_response(
                            status_code=404,
                            message="Not Found",
                            details=f"System parameter with key '{parameter_id}' not found for update."
                        )
                    )


        return DataResponse[SystemParameter](data=db_parameter)
    except ValueError as e:
        logger.warning(f"Failed to update system parameter {parameter_id} due to validation error: {e}")
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
        logger.error(f"Error updating system parameter {parameter_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="Internal Server Error",
                details=f"Failed to update system parameter {parameter_id}: {str(e)}"
            )
        )

@router.delete("/{parameter_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_system_parameter(
    parameter_id: str, # Can be int (ID) or str (key)
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["system_parameter:manage"]))
):
    """
    删除系统参数。
    """
    try:
        success = False
        try:
            id_value = int(parameter_id)
            success = crud.delete_system_parameter_by_id(db, id_value)
        except ValueError:
            success = crud.delete_system_parameter_by_key(db, parameter_id)

        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=create_error_response(
                    status_code=404,
                    message="Not Found",
                    details=f"System parameter with ID or key '{parameter_id}' not found for deletion"
                )
            )
        return None # Returns 204 No Content
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting system parameter {parameter_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="Internal Server Error",
                details=f"Failed to delete system parameter {parameter_id}: {str(e)}"
            )
        )
