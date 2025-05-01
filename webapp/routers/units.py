from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from sqlalchemy.orm import Session
import logging

# Adjust imports based on actual locations of these modules/functions
from .. import schemas, models_db, auth
from ..database import get_db # Ensure this is relative

logger = logging.getLogger(__name__) # Ensure logger is setup for this module

router = APIRouter()

# --- CRUD Endpoints for Units ---

@router.post("/", response_model=schemas.Unit, status_code=status.HTTP_201_CREATED)
async def create_unit_endpoint(
    unit: schemas.UnitCreate,
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(auth.require_role(["Super Admin"])) # Assuming Super Admin role
):
    """Creates a new unit."""
    logger.info(f"User {current_user.username} attempting to create unit: {unit.name}")
    try:
        # Call the ORM function from models_db
        created_unit = models_db.create_unit_orm(db=db, unit=unit)
        logger.info(f"Successfully created unit '{created_unit.name}' with ID {created_unit.id}")
        return created_unit
    except HTTPException as http_exc:
        # Re-raise HTTPExceptions (like 409 conflict from models_db)
        logger.warning(f"HTTPException during unit creation '{unit.name}': {http_exc.detail}")
        raise http_exc
    except Exception as e:
        # Catch any other unexpected errors
        logger.error(f"Unexpected error creating unit '{unit.name}': {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An internal server error occurred while creating the unit."
        ) from e

@router.get("/", response_model=schemas.UnitListResponse)
async def get_units_endpoint(
    search: Optional[str] = Query(None, description="Search term for unit name (case-insensitive partial match)"),
    page: int = Query(1, ge=1, description="Page number starting from 1"),
    size: int = Query(10, ge=1, le=2000, description="Number of items per page"), # Keep the larger limit from original main.py
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(auth.require_role(["Super Admin"])) # Or a less restrictive role
):
    """Gets a list of units with optional search and pagination."""
    skip = (page - 1) * size
    logger.info(f"User {current_user.username} fetching units. Filters: search='{search}', page={page}, size={size}")
    try:
        units, total = models_db.get_units_orm(
            db=db,
            search=search,
            skip=skip,
            limit=size
        )
        logger.info(f"Found {total} units matching criteria. Returning {len(units)} for page {page}.")
        # Pydantic handles the conversion from ORM objects for the response model
        return {"data": units, "total": total}
    except Exception as e:
        logger.error(f"Error fetching units: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An internal server error occurred while fetching units."
        ) from e

@router.get("/{unit_id}", response_model=schemas.Unit)
async def get_unit_endpoint(
    unit_id: int,
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(auth.require_role(["Super Admin"])) # Or a less restrictive role
):
    """Gets a specific unit by its ID."""
    logger.info(f"User {current_user.username} attempting to fetch unit with ID: {unit_id}")
    try:
        unit = models_db.get_unit_by_id_orm(db=db, unit_id=unit_id)
        if unit is None:
            logger.warning(f"Unit with ID {unit_id} not found.")
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Unit with ID {unit_id} not found.")
        
        logger.info(f"Successfully fetched unit '{unit.name}' (ID: {unit_id})")
        # Pydantic handles the conversion from the ORM object
        return unit
    except HTTPException as http_exc:
        # Re-raise known HTTP exceptions (like the 404 above)
        raise http_exc
    except Exception as e:
        logger.error(f"Error fetching unit {unit_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An internal server error occurred while fetching unit {unit_id}."
        ) from e

@router.put("/{unit_id}", response_model=schemas.Unit)
async def update_unit_endpoint(
    unit_id: int,
    unit_update: schemas.UnitUpdate,
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(auth.require_role(["Super Admin"])) # Or a less restrictive role
):
    """Updates a specific unit."""
    logger.info(f"User {current_user.username} attempting to update unit ID: {unit_id} with data: {unit_update.model_dump(exclude_unset=True)}")
    try:
        updated_unit = models_db.update_unit_orm(
            db=db, 
            unit_id=unit_id, 
            unit_update=unit_update
        )
        # update_unit_orm returns None if not found, and raises 409 on conflict
        if updated_unit is None:
             logger.warning(f"Attempted to update non-existent unit ID: {unit_id}")
             raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Unit with ID {unit_id} not found.")
             
        logger.info(f"Successfully updated unit ID: {unit_id}")
        return updated_unit
    except HTTPException as http_exc:
        # Re-raise known HTTP exceptions (404, 409, etc.)
        logger.warning(f"HTTPException during update for unit ID {unit_id}: {http_exc.detail}")
        raise http_exc
    except Exception as e:
        logger.error(f"Error updating unit {unit_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An internal server error occurred while updating unit {unit_id}."
        ) from e

@router.delete("/{unit_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_unit_endpoint(
    unit_id: int,
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(auth.require_role(["Super Admin"])) # Or a less restrictive role
):
    """Deletes a specific unit. Fails if departments are associated (handled by models_db)."""
    logger.info(f"User {current_user.username} attempting to delete unit ID: {unit_id}")
    try:
        # delete_unit_orm raises 404 or 409 if deletion cannot proceed
        deleted = models_db.delete_unit_orm(db=db, unit_id=unit_id)
        
        # If delete_unit_orm was modified to return False instead of raising 404, 
        # uncomment the following check:
        # if not deleted:
        #     logger.warning(f"Attempted to delete non-existent unit ID: {unit_id}")
        #     raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Unit with ID {unit_id} not found.")

        # If the function returned True (or didn't raise an exception like 404/409)
        logger.info(f"Successfully deleted unit ID: {unit_id}")
        # FastAPI automatically returns 204 No Content based on the status_code
        return

    except HTTPException as http_exc:
        # Re-raise known HTTP exceptions (like 404 Not Found or 409 Conflict from models_db)
        logger.warning(f"HTTPException during delete for unit ID {unit_id}: {http_exc.detail}")
        raise http_exc
    except Exception as e:
        logger.error(f"Error deleting unit {unit_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An internal server error occurred while deleting unit {unit_id}."
        ) from e

# Endpoints for Units are now complete in this router file. 