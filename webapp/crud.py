# salary_system/webapp/crud.py

import logging
from typing import List, Optional, Dict, Any, Tuple, Union

from sqlalchemy.orm import Session, selectinload, joinedload
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from fastapi import HTTPException, status

# Import models and schemas
from . import models, models_db, schemas

logger = logging.getLogger(__name__)

# --- Calculation Formula CRUD --- 

def get_formula(db: Session, formula_id: int) -> Optional[models.CalculationFormula]:
    """Gets a single formula by its ID."""
    try:
        return db.get(models.CalculationFormula, formula_id)
    except SQLAlchemyError as e:
        logger.error(f"Database error getting formula by ID {formula_id}: {e}", exc_info=True)
        return None

def get_formula_by_name(db: Session, name: str) -> Optional[models.CalculationFormula]:
    """Gets a single formula by its unique name."""
    try:
        return db.query(models.CalculationFormula).filter(models.CalculationFormula.name == name).first()
    except SQLAlchemyError as e:
        logger.error(f"Database error getting formula by name '{name}': {e}", exc_info=True)
        return None

def get_formulas(db: Session, skip: int = 0, limit: int = 100) -> List[models.CalculationFormula]:
    """Gets a list of formulas with pagination."""
    try:
        return db.query(models.CalculationFormula).order_by(models.CalculationFormula.formula_id).offset(skip).limit(limit).all()
    except SQLAlchemyError as e:
        logger.error(f"Database error getting formulas list: {e}", exc_info=True)
        return []

def create_formula(db: Session, formula: schemas.CalculationFormulaCreate) -> models.CalculationFormula:
    """Creates a new formula."""
    db_formula = models.CalculationFormula(**formula.model_dump())
    try:
        db.add(db_formula)
        db.commit()
        db.refresh(db_formula)
        return db_formula
    except IntegrityError as e:
        db.rollback()
        logger.error(f"Integrity error creating formula with name '{formula.name}': {e}", exc_info=True)
        # Check if it's the unique name constraint
        if "uq_calculation_formulas_name" in str(e).lower() or "calculation_formulas_name_key" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Formula name '{formula.name}' already exists."
            ) from e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database integrity error during formula creation."
        ) from e
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"SQLAlchemy error creating formula '{formula.name}': {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error during formula creation."
        ) from e

def update_formula(db: Session, formula_id: int, formula_update: schemas.CalculationFormulaUpdate) -> Optional[models.CalculationFormula]:
    """Updates an existing formula."""
    db_formula = get_formula(db, formula_id)
    if not db_formula:
        return None # Handled by caller (router raises 404)

    update_data = formula_update.model_dump(exclude_unset=True)
    if not update_data:
         return db_formula # Nothing to update

    # Check for name conflict before applying updates
    if 'name' in update_data and update_data['name'] != db_formula.name:
        existing = get_formula_by_name(db, name=update_data['name'])
        if existing and existing.formula_id != formula_id: # type: ignore
            # Raise specific error to be caught by router
            raise IntegrityError(f"Formula name '{update_data['name']}' already exists.", params=None, orig=Exception())

    for key, value in update_data.items():
        setattr(db_formula, key, value)
        
    # Manually update updated_at if not handled by DB trigger/default
    # db_formula.updated_at = datetime.now(timezone.utc) 

    try:
        db.commit()
        db.refresh(db_formula)
        return db_formula
    except IntegrityError as e: # Catch potential race condition on name unique constraint
        db.rollback()
        logger.error(f"Integrity error updating formula {formula_id}: {e}", exc_info=True)
        if "uq_calculation_formulas_name" in str(e).lower() or "calculation_formulas_name_key" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Formula name '{update_data.get('name', db_formula.name)}' already exists (race condition)."
            ) from e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database integrity error during formula update."
        ) from e
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"SQLAlchemy error updating formula {formula_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error during formula update."
        ) from e

def delete_formula(db: Session, formula_id: int) -> bool:
    """Deletes a formula. Returns True if deleted, False otherwise.
       Note: Does not currently check for usage in rules. This should be done in the router.
    """
    db_formula = get_formula(db, formula_id)
    if not db_formula:
        return False # Let router handle 404
    
    try:
        db.delete(db_formula)
        db.commit()
        return True
    except IntegrityError as e:
        # This would happen if a CalculationRule still references this formula via FK
        db.rollback()
        logger.error(f"Cannot delete formula {formula_id} due to foreign key constraint: {e}")
        # Raise a specific exception or return a special value if needed, 
        # but the router should ideally check this first.
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot delete formula: It is likely still used by one or more calculation rules."
        ) from e
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"SQLAlchemy error deleting formula {formula_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error during formula deletion."
        ) from e

# --- Calculation Rule CRUD --- 

def get_rule(db: Session, rule_id: int) -> Optional[models.CalculationRule]:
    """Gets a single rule by ID, loading its conditions and formula."""
    try:
        return db.query(models.CalculationRule).options(
            selectinload(models.CalculationRule.conditions),
            joinedload(models.CalculationRule.formula) # Eager load formula details
        ).filter(models.CalculationRule.rule_id == rule_id).first()
    except SQLAlchemyError as e:
        logger.error(f"Database error getting rule by ID {rule_id}: {e}", exc_info=True)
        return None

def get_rules(
    db: Session, 
    skip: int = 0, 
    limit: int = 100, 
    is_active: Optional[bool] = None,
    target_field: Optional[str] = None
) -> Tuple[List[models.CalculationRule], int]:
    """Gets a list of rules with pagination and filtering, loading relationships."""
    try:
        query = db.query(models.CalculationRule).options(
            selectinload(models.CalculationRule.conditions),
            joinedload(models.CalculationRule.formula)
        )
        
        # Apply filters
        if is_active is not None:
            query = query.filter(models.CalculationRule.is_active == is_active)
        if target_field:
            query = query.filter(models.CalculationRule.target_field_db_name.ilike(f"%{target_field}%"))
        
        # Get total count before pagination
        total_count = query.count()
        
        # Apply ordering and pagination
        rules = query.order_by(models.CalculationRule.priority.asc(), models.CalculationRule.rule_id.asc()).offset(skip).limit(limit).all()
        
        return rules, total_count
    except SQLAlchemyError as e:
        logger.error(f"Database error getting rules list: {e}", exc_info=True)
        return [], 0

def _validate_rule_logic(rule_data: Union[schemas.CalculationRuleCreate, schemas.CalculationRuleUpdate]):
    """Helper to validate rule consistency."""
    action_type = rule_data.action_type
    formula_id = getattr(rule_data, 'formula_id', None)
    fixed_value = getattr(rule_data, 'fixed_value', None)

    if action_type == 'APPLY_FORMULA' and formula_id is None:
        raise ValueError("formula_id must be provided when action_type is APPLY_FORMULA")
    if action_type == 'APPLY_FORMULA' and fixed_value is not None:
         logger.warning(f"fixed_value is set for APPLY_FORMULA rule '{rule_data.name}', it will be ignored.")
         # Optionally raise error: raise ValueError("fixed_value must be null when action_type is APPLY_FORMULA")

    if action_type == 'SET_FIXED_VALUE' and fixed_value is None:
        raise ValueError("fixed_value must be provided when action_type is SET_FIXED_VALUE")
    if action_type == 'SET_FIXED_VALUE' and formula_id is not None:
         logger.warning(f"formula_id is set for SET_FIXED_VALUE rule '{rule_data.name}', it will be ignored.")
         # Optionally raise error: raise ValueError("formula_id must be null when action_type is SET_FIXED_VALUE")

def create_rule(db: Session, rule: schemas.CalculationRuleCreate) -> models.CalculationRule:
    """Creates a new rule and its conditions."""
    # 1. Validate input data consistency
    try:
        _validate_rule_logic(rule)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))

    # 2. Check if formula exists (if provided)
    if rule.formula_id:
        db_formula = get_formula(db, rule.formula_id)
        if not db_formula:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Formula with ID {rule.formula_id} not found.")

    # 3. Create Rule object (without conditions first)
    rule_dict = rule.model_dump(exclude={'conditions'})
    db_rule = models.CalculationRule(**rule_dict)
    
    # 4. Create Condition objects from schema
    if rule.conditions:
        for condition_schema in rule.conditions:
            # Append to the relationship, SQLAlchemy handles FK population on commit
            db_condition = models.CalculationRuleCondition(**condition_schema.model_dump()) # type: ignore
            db_rule.conditions.append(db_condition) 
    
    try:
        db.add(db_rule) # Conditions will be added via cascade
        db.commit()
        db.refresh(db_rule) # Refresh to get IDs and load relationships correctly
        # Re-fetch with relationships loaded to ensure consistency in response
        return get_rule(db, db_rule.rule_id) # type: ignore
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error creating rule '{rule.name}': {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error during rule creation."
        ) from e

def update_rule(db: Session, rule_id: int, rule_update: schemas.CalculationRuleUpdate) -> Optional[models.CalculationRule]:
    """Updates an existing rule. If conditions are provided, replaces existing ones."""
    db_rule = get_rule(db, rule_id)
    if not db_rule:
        return None # Let router handle 404
        
    update_data = rule_update.model_dump(exclude_unset=True)
    
    # Validate consistency of the updated data
    # Create a temporary merged dict/object for validation if needed
    temp_rule_data_for_validation = schemas.CalculationRuleUpdate(**{**db_rule.__dict__, **update_data}) # Combine old and new for validation
    try:
        _validate_rule_logic(temp_rule_data_for_validation)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))

    # Check if formula exists if formula_id is being changed
    if 'formula_id' in update_data and update_data['formula_id'] is not None:
        db_formula = get_formula(db, update_data['formula_id'])
        if not db_formula:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Formula with ID {update_data['formula_id']} not found.")

    # Update rule fields (excluding conditions for now)
    conditions_update = update_data.pop('conditions', None) # Handle conditions separately
    for key, value in update_data.items():
        setattr(db_rule, key, value)

    # Handle condition replacement (if provided in update)
    if conditions_update is not None:
        # Clear existing conditions (leveraging cascade delete-orphan)
        db_rule.conditions.clear() 
        # Add new conditions
        for condition_schema in conditions_update:
            # Append to the relationship, SQLAlchemy handles FK population on commit
            db_condition = models.CalculationRuleCondition(**condition_schema.model_dump()) # type: ignore
            db_rule.conditions.append(db_condition)

    try:
        db.commit()
        db.refresh(db_rule)
        # Re-fetch with relationships loaded
        return get_rule(db, rule_id)
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error updating rule {rule_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error during rule update."
        ) from e

def delete_rule(db: Session, rule_id: int) -> bool:
    """Deletes a rule and its conditions (due to cascade). Returns True if deleted."""
    db_rule = get_rule(db, rule_id)
    if not db_rule:
        return False # Let router handle 404
        
    try:
        db.delete(db_rule) # Conditions should be deleted by cascade
        db.commit()
        return True
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error deleting rule {rule_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error during rule deletion."
        ) from e

# --- Helper functions --- 
# (e.g., get_rules_using_formula - needed for safe delete)
def get_rules_using_formula(db: Session, formula_id: int) -> List[models.CalculationRule]:
     """Finds rules that use a specific formula."""
     try:
         return db.query(models.CalculationRule).filter(models.CalculationRule.formula_id == formula_id).all()
     except SQLAlchemyError as e:
         logger.error(f"Database error getting rules using formula {formula_id}: {e}", exc_info=True)
         return [] 