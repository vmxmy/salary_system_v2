# salary_system/webapp/routers/calculation_rules_admin.py

import logging
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

# Import dependencies
from ..database import get_db # Correct path for get_db
from ..auth import require_role # Import the role requirement factory
# Import schemas
from .. import schemas
# Import CRUD functions (to be created)
from .. import crud as calculation_crud # Use a more specific alias

logger = logging.getLogger(__name__)

# Create the specific dependency for requiring SUPER admin role
# Remove "Admin", "管理员"
require_super_admin_user = require_role(["Super Admin"]) # Only allow Super Admin

router = APIRouter(
    prefix="/admin/calculation-engine",
    tags=["Admin - Calculation Engine"],
    # Apply the SUPER admin requirement to all routes in this router
    dependencies=[Depends(require_super_admin_user)] 
)

# --- Formula Management Endpoints --- 

@router.post("/formulas/", response_model=schemas.CalculationFormulaResponse, status_code=status.HTTP_201_CREATED)
def create_new_formula(
    formula: schemas.CalculationFormulaCreate,
    db: Session = Depends(get_db)
):
    """Creates a new calculation formula."""
    # Check for duplicate name before creating
    db_formula = calculation_crud.get_formula_by_name(db, name=formula.name)
    if db_formula:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Formula with name '{formula.name}' already exists.")
    try:
        new_formula = calculation_crud.create_formula(db=db, formula=formula)
        return new_formula
    except Exception as e: # Catch potential exceptions from CRUD
        logger.error(f"Error creating formula '{formula.name}': {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create formula.")

@router.get("/formulas/", response_model=List[schemas.CalculationFormulaResponse])
def read_formulas(
    skip: int = Query(0, ge=0, description="Number of records to skip for pagination"), 
    limit: int = Query(100, ge=1, le=500, description="Maximum number of records to return"), 
    db: Session = Depends(get_db)
):
    """Retrieves a list of calculation formulas with pagination.""" 
    formulas = calculation_crud.get_formulas(db, skip=skip, limit=limit)
    return formulas

@router.get("/formulas/{formula_id}", response_model=schemas.CalculationFormulaResponse)
def read_formula(
    formula_id: int,
    db: Session = Depends(get_db)
):
    """Retrieves a specific calculation formula by its ID."""
    db_formula = calculation_crud.get_formula(db, formula_id=formula_id)
    if db_formula is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Formula not found")
    return db_formula

@router.put("/formulas/{formula_id}", response_model=schemas.CalculationFormulaResponse)
def update_existing_formula(
    formula_id: int, 
    formula_update: schemas.CalculationFormulaUpdate,
    db: Session = Depends(get_db)
):
    """Updates an existing calculation formula."""
    db_formula = calculation_crud.get_formula(db, formula_id=formula_id)
    if not db_formula:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Formula not found")
    
    # Check if the new name conflicts with another existing formula
    if formula_update.name and formula_update.name != db_formula.name:
        existing_formula = calculation_crud.get_formula_by_name(db, name=formula_update.name)
        if existing_formula and existing_formula.formula_id != formula_id: # type: ignore
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Formula name '{formula_update.name}' is already used by another formula.")
            
    try:
        updated_formula = calculation_crud.update_formula(db=db, formula_id=formula_id, formula_update=formula_update)
        if updated_formula is None: # Should not happen if checks pass, but defensively
             raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Formula not found during update attempt.")
        return updated_formula
    except Exception as e:
        logger.error(f"Error updating formula {formula_id}: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update formula.")

@router.delete("/formulas/{formula_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_existing_formula(
    formula_id: int,
    db: Session = Depends(get_db)
):
    """Deletes a calculation formula. Fails if the formula is used by any calculation rules."""
    db_formula = calculation_crud.get_formula(db, formula_id=formula_id)
    if not db_formula:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Formula not found")
        
    # TODO: Add check here: Before deleting, verify if this formula_id is used by any CalculationRule.
    # rules_using_formula = calculation_crud.get_rules_using_formula(db, formula_id=formula_id)
    # if rules_using_formula:
    #     raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Cannot delete formula: It is currently used by {len(rules_using_formula)} calculation rule(s).")
        
    deleted = calculation_crud.delete_formula(db=db, formula_id=formula_id)
    if not deleted:
        # This might happen if the formula was deleted between the get check and delete call (race condition)
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Formula not found during delete attempt.")
    # No content is returned on successful deletion
    return

# --- Rule Management Endpoints --- 

@router.post("/rules/", response_model=schemas.CalculationRuleResponse, status_code=status.HTTP_201_CREATED)
def create_new_rule(
    rule: schemas.CalculationRuleCreate,
    db: Session = Depends(get_db)
):
    """Creates a new calculation rule, including its conditions."""
    # TODO: Add validation logic here or in CRUD
    # - Check if formula_id exists if action_type is APPLY_FORMULA
    # - Check if target_field_db_name is valid?
    # - Check condition field names?
    try:
        new_rule = calculation_crud.create_rule(db=db, rule=rule)
        return new_rule
    except ValueError as ve: # Catch potential validation errors from CRUD
         raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except HTTPException as he: # Re-raise specific HTTP exceptions from CRUD
        raise he
    except Exception as e:
        logger.error(f"Error creating rule '{rule.name}': {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create rule.")

@router.get("/rules/", response_model=schemas.CalculationRuleListResponse)
def read_rules(
    skip: int = Query(0, ge=0), 
    limit: int = Query(100, ge=1, le=500), 
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    target_field: Optional[str] = Query(None, description="Filter by target field name"),
    db: Session = Depends(get_db)
):
    """Retrieves a list of calculation rules with pagination and optional filters."""
    rules, total_count = calculation_crud.get_rules(
        db, skip=skip, limit=limit, is_active=is_active, target_field=target_field
    )
    return {"data": rules, "total": total_count}

@router.get("/rules/{rule_id}", response_model=schemas.CalculationRuleResponse)
def read_rule(
    rule_id: int,
    db: Session = Depends(get_db)
):
    """Retrieves a specific calculation rule by ID, including conditions and formula."""
    db_rule = calculation_crud.get_rule(db, rule_id=rule_id)
    if db_rule is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rule not found")
    return db_rule

@router.put("/rules/{rule_id}", response_model=schemas.CalculationRuleResponse)
def update_existing_rule(
    rule_id: int, 
    rule_update: schemas.CalculationRuleUpdate,
    db: Session = Depends(get_db)
):
    """Updates an existing calculation rule. Replaces all conditions if provided."""
    db_rule = calculation_crud.get_rule(db, rule_id=rule_id) # Check existence first
    if not db_rule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rule not found")
        
    # TODO: Add validation for rule_update payload
    try:
        updated_rule = calculation_crud.update_rule(db=db, rule_id=rule_id, rule_update=rule_update)
        if updated_rule is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rule not found during update.") # Should not happen
        return updated_rule
    except ValueError as ve: # Catch potential validation errors from CRUD
         raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except HTTPException as he: # Re-raise specific HTTP exceptions from CRUD
        raise he
    except Exception as e:
        logger.error(f"Error updating rule {rule_id}: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update rule.")

@router.delete("/rules/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_existing_rule(
    rule_id: int,
    db: Session = Depends(get_db)
):
    """Deletes a calculation rule and its associated conditions."""
    deleted = calculation_crud.delete_rule(db=db, rule_id=rule_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rule not found")
    # No content on success
    return 