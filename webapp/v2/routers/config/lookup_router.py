"""
字典类型 (LookupType) 和字典值 (LookupValue) 配置相关的API路由。
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import Optional, List

from ...database import get_db_v2
from webapp.v2.crud import config as crud # Assuming crud functions for lookup are in config.py
from ...pydantic_models.config import (
    LookupTypeListResponse, LookupType, LookupTypeCreate, LookupTypeUpdate,
    LookupValueListResponse, LookupValue, LookupValueCreate, LookupValueUpdate
)
from ...pydantic_models.common import DataResponse
from webapp.auth import get_current_user, require_permissions # User for some, permissions for others
from ...utils import create_error_response
from ...pydantic_models import security as v2_security_schemas # Import security schemas for User model
import logging

logger = logging.getLogger(__name__)

router = APIRouter(
    # No common prefix for lookup types and values directly under /config, 
    # so prefix will be set in main app or a higher-level config router if needed.
    # For now, individual prefixes for sub-sections.
    tags=["Configuration - Lookups"],
)

# Existing endpoint from config.py
@router.get("/payroll-component-types", response_model=LookupValueListResponse)
async def get_payroll_component_types(
    db: Session = Depends(get_db_v2),
    current_user: v2_security_schemas.User = Depends(get_current_user), # Corrected type hint
):
    """获取薪资字段类型列表 (这是一个特殊的lookup)"""
    try:
        lookup_type = crud.get_lookup_type_by_code(db, "PAYROLL_COMPONENT_TYPE")
        if not lookup_type:
            return LookupValueListResponse(data=[], meta={"page":1, "size":0, "total": 0, "totalPages":0}) # Ensure meta is complete
        
        lookup_values, total = crud.get_lookup_values(
            db=db, 
            lookup_type_id=lookup_type.id,
            is_active=True # Assuming we only want active ones here
        )
        # Assuming crud.get_lookup_values doesn't return full ListResponse structure
        return LookupValueListResponse(
            data=lookup_values, 
            meta={"page":1, "size":len(lookup_values), "total": total, "totalPages":1}
        )
    except Exception as e:
        logger.error(f"Error getting payroll component types: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(500, "Internal Server Error", str(e))
        )

# --- LookupType Endpoints ---
@router.post("/lookup-types", response_model=DataResponse[LookupType], status_code=status.HTTP_201_CREATED)
async def create_lookup_type_endpoint(
    lookup_type_in: LookupTypeCreate,
    db: Session = Depends(get_db_v2),
    current_user: v2_security_schemas.User = Depends(require_permissions(["lookup_type:manage"]))
):
    try:
        created_lookup_type = crud.create_lookup_type(db, lookup_type_in)
        return DataResponse[LookupType](data=created_lookup_type)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=create_error_response(422, str(e)))
    except Exception as e:
        logger.error(f"Error creating lookup type: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=create_error_response(500, "Internal server error", str(e)))

@router.get("/lookup-types", response_model=LookupTypeListResponse)
async def get_lookup_types_endpoint(
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db_v2),
    current_user: v2_security_schemas.User = Depends(require_permissions(["lookup_type:view"]))
):
    try:
        skip = (page - 1) * size
        types, total = crud.get_lookup_types(db, search=search, skip=skip, limit=size)
        total_pages = (total + size - 1) // size if total > 0 else 1
        return LookupTypeListResponse(data=types, meta={"page": page, "size": size, "total": total, "totalPages": total_pages})
    except Exception as e:
        logger.error(f"Error getting lookup types: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=create_error_response(500, "Internal server error", str(e)))

@router.get("/lookup-types/{type_id_or_code}", response_model=DataResponse[LookupType])
async def get_lookup_type_endpoint(
    type_id_or_code: str,
    db: Session = Depends(get_db_v2),
    current_user: v2_security_schemas.User = Depends(require_permissions(["lookup_type:view"]))
):
    try:
        lookup_type = None
        try:
            type_id = int(type_id_or_code)
            lookup_type = crud.get_lookup_type(db, type_id)
        except ValueError:
            lookup_type = crud.get_lookup_type_by_code(db, type_id_or_code)
        
        if not lookup_type:
            raise HTTPException(status_code=404, detail=create_error_response(404, "LookupType not found"))
        return DataResponse[LookupType](data=lookup_type)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting lookup type {type_id_or_code}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=create_error_response(500, "Internal server error", str(e)))

@router.put("/lookup-types/{type_id}", response_model=DataResponse[LookupType]) # Assuming update by ID only for now
async def update_lookup_type_endpoint(
    type_id: int,
    lookup_type_in: LookupTypeUpdate,
    db: Session = Depends(get_db_v2),
    current_user: v2_security_schemas.User = Depends(require_permissions(["lookup_type:manage"]))
):
    try:
        updated_type = crud.update_lookup_type(db, type_id, lookup_type_in)
        if not updated_type:
            raise HTTPException(status_code=404, detail=create_error_response(404, "LookupType not found for update"))
        return DataResponse[LookupType](data=updated_type)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=create_error_response(422, str(e)))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating lookup type {type_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=create_error_response(500, "Internal server error", str(e)))

@router.delete("/lookup-types/{type_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_lookup_type_endpoint(
    type_id: int,
    db: Session = Depends(get_db_v2),
    current_user: v2_security_schemas.User = Depends(require_permissions(["lookup_type:manage"]))
):
    try:
        success = crud.delete_lookup_type(db, type_id)
        if not success:
            raise HTTPException(status_code=404, detail=create_error_response(404, "LookupType not found or failed to delete"))
        return None
    except ValueError as e: # If it's in use
        raise HTTPException(status_code=409, detail=create_error_response(409, "Conflict", str(e)))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting lookup type {type_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=create_error_response(500, "Internal server error", str(e)))

# --- LookupValue Endpoints --- 
@router.post("/lookup-values", response_model=DataResponse[LookupValue], status_code=status.HTTP_201_CREATED)
async def create_lookup_value_endpoint(
    lookup_value_in: LookupValueCreate,
    db: Session = Depends(get_db_v2),
    current_user: v2_security_schemas.User = Depends(require_permissions(["lookup_value:manage"]))
):
    try:
        # Ensure the referenced lookup_type_id exists
        lookup_type = crud.get_lookup_type(db, lookup_value_in.lookup_type_id)
        if not lookup_type:
            raise ValueError(f"LookupType with ID {lookup_value_in.lookup_type_id} not found.")
        created_value = crud.create_lookup_value(db, lookup_value_in)
        return DataResponse[LookupValue](data=created_value)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=create_error_response(422, "Unprocessable Entity", str(e)))
    except Exception as e:
        logger.error(f"Error creating lookup value: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=create_error_response(500, "Internal server error", str(e)))

@router.get("/lookup-values", response_model=LookupValueListResponse)
async def get_lookup_values_endpoint(
    lookup_type_id: Optional[int] = None,
    lookup_type_code: Optional[str] = None, # Allow fetching by type code too
    is_active: Optional[bool] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=200), # Max 200 for lookup values
    db: Session = Depends(get_db_v2),
    current_user: v2_security_schemas.User = Depends(require_permissions(["lookup_value:view"]))
):
    try:
        actual_type_id = lookup_type_id
        if not actual_type_id and lookup_type_code:
            lt = crud.get_lookup_type_by_code(db, lookup_type_code)
            if not lt:
                 return LookupValueListResponse(data=[], meta={"page":page, "size":size, "total":0, "totalPages":0})
            actual_type_id = lt.id
        
        # If neither type_id nor valid type_code provided, it might fetch all lookup values across all types.
        # This behavior should be clarified or restricted if necessary.
        # For now, assuming crud.get_lookup_values handles actual_type_id=None correctly for this case.

        skip = (page - 1) * size
        values, total = crud.get_lookup_values(
            db, lookup_type_id=actual_type_id, is_active=is_active, search=search, skip=skip, limit=size
        )
        total_pages = (total + size - 1) // size if total > 0 else 1
        return LookupValueListResponse(data=values, meta={"page": page, "size": size, "total": total, "totalPages": total_pages})
    except Exception as e:
        logger.error(f"Error getting lookup values: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=create_error_response(500, "Internal server error", str(e)))

@router.get("/lookup-values/{value_id}", response_model=DataResponse[LookupValue])
async def get_lookup_value_endpoint(
    value_id: int,
    db: Session = Depends(get_db_v2),
    current_user: v2_security_schemas.User = Depends(require_permissions(["lookup_value:view"]))
):
    try:
        lookup_value = crud.get_lookup_value(db, value_id)
        if not lookup_value:
            raise HTTPException(status_code=404, detail=create_error_response(404, "LookupValue not found"))
        return DataResponse[LookupValue](data=lookup_value)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting lookup value {value_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=create_error_response(500, "Internal server error", str(e)))

@router.put("/lookup-values/{value_id}", response_model=DataResponse[LookupValue])
async def update_lookup_value_endpoint(
    value_id: int,
    lookup_value_in: LookupValueUpdate,
    db: Session = Depends(get_db_v2),
    current_user: v2_security_schemas.User = Depends(require_permissions(["lookup_value:manage"]))
):
    try:
        updated_value = crud.update_lookup_value(db, value_id, lookup_value_in)
        if not updated_value:
            raise HTTPException(status_code=404, detail=create_error_response(404, "LookupValue not found for update"))
        return DataResponse[LookupValue](data=updated_value)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=create_error_response(422, "Unprocessable Entity", str(e)))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating lookup value {value_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=create_error_response(500, "Internal server error", str(e)))

@router.delete("/lookup-values/{value_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_lookup_value_endpoint(
    value_id: int,
    db: Session = Depends(get_db_v2),
    current_user: v2_security_schemas.User = Depends(require_permissions(["lookup_value:manage"]))
):
    try:
        success = crud.delete_lookup_value(db, value_id)
        if not success:
            raise HTTPException(status_code=404, detail=create_error_response(404, "LookupValue not found or failed to delete"))
        return None
    except ValueError as e: # If it's in use or other FK constraint
        raise HTTPException(status_code=409, detail=create_error_response(409, "Conflict", str(e)))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting lookup value {value_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=create_error_response(500, "Internal server error", str(e)))
