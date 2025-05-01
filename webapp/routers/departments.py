from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import logging
from ..database import get_db
from .. import schemas, models_db, auth

logger = logging.getLogger(__name__)

router = APIRouter()

@router.put("/{department_id}", response_model=schemas.Department)
async def update_department_endpoint(
    department_id: int,
    department_update: schemas.DepartmentUpdate,
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(auth.require_role(["Super Admin"])) # Or a less restrictive role
):
    """Updates a specific department."""
    logger.info(f"User {current_user.username} attempting to update department ID: {department_id} with data: {department_update.model_dump(exclude_unset=True)}")
    try:
        updated_department = models_db.update_department_orm(
            db=db, 
            department_id=department_id, 
            department_update=department_update
        )
        # update_department_orm raises 404 if not found, or 409 on conflict
        logger.info(f"Successfully updated department ID: {department_id}")
        return updated_department
    except HTTPException as http_exc:
        # Re-raise known HTTP exceptions (404, 409, etc.)
        logger.warning(f"HTTPException during update for department ID {department_id}: {http_exc.detail}")
        raise http_exc
    except Exception as e:
        logger.error(f"Error updating department {department_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An internal server error occurred while updating department {department_id}."
        ) from e

@router.delete("/{department_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_department_endpoint(
    department_id: int,
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(auth.require_role(["Super Admin"])) # Or a less restrictive role
):
    """Deletes a specific department. Fails if employees are associated (handled by models_db)."""
    logger.info(f"User {current_user.username} attempting to delete department ID: {department_id}")
    try:
        # delete_department_orm should handle the 404 (returns False) and 409 (raises HTTPException)
        deleted = models_db.delete_department_orm(db=db, department_id=department_id)
        
        if not deleted:
            # This case specifically handles when delete_department_orm returns False (not found)
            # The 409 case is raised as an HTTPException within delete_department_orm
            logger.warning(f"Attempted to delete non-existent department ID: {department_id}")
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Department with ID {department_id} not found.")
            
        # If deleted is True, deletion was successful
        logger.info(f"Successfully deleted department ID: {department_id}")
        # FastAPI automatically returns 204 No Content based on the status_code in the decorator
        return
        
    except HTTPException as http_exc:
        # Re-raise known HTTP exceptions (like 409 Conflict from models_db)
        logger.warning(f"HTTPException during delete for department ID {department_id}: {http_exc.detail}")
        raise http_exc
    except Exception as e:
        logger.error(f"Error deleting department {department_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An internal server error occurred while deleting department {department_id}."
        ) from e

# Endpoints for Departments are now complete in this router file.

# --- GET Endpoints --- START

@router.get("/", response_model=schemas.DepartmentListResponse)
async def read_departments(
    skip: int = Query(0, ge=0), 
    limit: int = Query(10, ge=1, le=100), 
    search: Optional[str] = Query(None), # Optional search query
    unit_id: Optional[int] = Query(None), # Optional filter by unit ID
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(auth.get_current_user) # Allow any logged-in user to view list?
):
    """Retrieves a paginated list of departments with optional search and unit filtering."""
    logger.info(f"Fetching departments list: skip={skip}, limit={limit}, search='{search}', unit_id={unit_id}")
    try:
        departments, total_count = models_db.get_departments_orm(
            db=db, 
            skip=skip, 
            limit=limit, 
            search=search,
            unit_id=unit_id
        )
        logger.info(f"Found {total_count} total departments matching criteria, returning {len(departments)}.")
        return {"data": departments, "total": total_count}
    except Exception as e:
        logger.error(f"Error fetching departments: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An internal server error occurred while fetching departments."
        ) from e

@router.get("/{department_id}", response_model=schemas.Department)
async def read_department(
    department_id: int,
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(auth.get_current_user) # Allow any logged-in user to view?
):
    """Retrieves details for a specific department."""
    logger.info(f"Fetching details for department ID: {department_id}")
    try:
        db_department = models_db.get_department_by_id_orm(db=db, department_id=department_id)
        if db_department is None:
            logger.warning(f"Department with ID {department_id} not found.")
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Department with ID {department_id} not found.")
        logger.info(f"Successfully fetched department ID: {department_id}")
        return db_department
    except HTTPException as http_exc:
        # Re-raise known HTTP exceptions (like 404)
        raise http_exc
    except Exception as e:
        logger.error(f"Error fetching department {department_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An internal server error occurred while fetching department {department_id}."
        ) from e

# --- GET Endpoints --- END

# --- POST Endpoint --- START
@router.post("/", response_model=schemas.Department, status_code=status.HTTP_201_CREATED)
async def create_department_endpoint(
    department: schemas.DepartmentCreate,
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(auth.require_role(["Super Admin"])) # Or a less restrictive role
):
    """Creates a new department."""
    logger.info(f"User {current_user.username} attempting to create department: {department.name} for unit {department.unit_id}")
    try:
        # create_department_orm should handle 404 for unit_id and 409 for duplicate name
        created_department = models_db.create_department_orm(db=db, department=department)
        logger.info(f"Successfully created department '{created_department.name}' with ID {created_department.id}")
        return created_department
    except HTTPException as http_exc:
        # Re-raise known HTTP exceptions (404, 409)
        logger.warning(f"HTTPException during department creation: {http_exc.detail}")
        raise http_exc
    except Exception as e:
        logger.error(f"Error creating department {department.name}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An internal server error occurred while creating department {department.name}."
        ) from e
# --- POST Endpoint --- END
