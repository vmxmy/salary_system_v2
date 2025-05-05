from fastapi import APIRouter, Depends, HTTPException, status, Query, Body, Response
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
import logging
import sqlalchemy.exc as sa_exc
from sqlalchemy import text

from .. import auth, models_db, schemas
from ..database import get_db
from ..pydantic_models import FieldMappingBase, FieldMappingCreate, FieldMappingUpdate, FieldMappingInDB, FieldMappingListResponse
from ..schemas import (
    EmployeeTypeFieldRuleBase, EmployeeTypeFieldRuleCreate, EmployeeTypeFieldRuleUpdate,
    EmployeeTypeFieldRuleResponse, EmployeeTypeFieldRuleListResponse,
    SheetNameMappingBase, SheetNameMappingCreate, SheetNameMappingUpdate, 
    SheetNameMappingResponse, SheetNameMappingListResponse 
)

# 配置logger
logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="",
    tags=["Configuration"]
)

@router.get("/mappings", response_model=FieldMappingListResponse)
async def get_all_field_mappings(
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(auth.require_role(["Super Admin"])) 
):
    """Fetches all field mapping records from the database using SQLAlchemy Session."""
    query = text("SELECT id, source_name, target_name, is_intermediate, is_final, description, data_type FROM core.salary_field_mappings ORDER BY source_name;")
    try:
        result = db.execute(query)
        mappings = result.mappings().all()
        logger.info(f"Found {len(mappings)} field mappings.")
        return {"data": mappings}
    except sa_exc.SQLAlchemyError as e:
        logger.error(f"Database query error for field mappings: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch field mappings from database."
        ) from e

@router.post("/mappings", response_model=FieldMappingInDB, status_code=201)
async def create_field_mapping(
    mapping: FieldMappingCreate,
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(auth.require_role(["Super Admin"])) 
):
    """Creates a new field mapping record using SQLAlchemy Session."""
    query = text("""
        INSERT INTO core.salary_field_mappings 
        (source_name, target_name, is_intermediate, is_final, description, data_type)
        VALUES (:source_name, :target_name, :is_intermediate, :is_final, :description, :data_type)
        RETURNING source_name, target_name, is_intermediate, is_final, description, data_type;
    """)
    try:
        # Execute using db.execute, get one mapping result
        result = db.execute(query, mapping.model_dump()) # Use model_dump for Pydantic v2
        new_mapping_row = result.mappings().fetchone()
        db.commit() # Commit the transaction
        logger.info(f"Created field mapping: {new_mapping_row}")
        if not new_mapping_row:
             # This case should ideally not happen if INSERT...RETURNING works
             logger.error("INSERT...RETURNING did not return the new mapping row.")
             raise HTTPException(status_code=500, detail="Failed to confirm mapping creation.")
        return new_mapping_row # Return the RowMapping directly, Pydantic handles conversion
    except sa_exc.IntegrityError as e: # Catch unique constraint violation
        db.rollback() # Rollback on error
        logger.error(f"Database integrity error creating field mapping: {e}", exc_info=True)
        # Check if it's a unique violation, provide a more specific message
        detail = "Database integrity error occurred." # Default message
        # The specific constraint name might be in e.orig or e.pgcode depending on driver/version
        # A simple check for common unique keys:
        if 'uq_salary_field_mappings_source_name' in str(e):
            detail = f"Mapping with source_name '{mapping.source_name}' already exists."
        elif 'uq_salary_field_mappings_target_name' in str(e):
            detail = f"Mapping with target_name '{mapping.target_name}' already exists."
        else: # Generic if specific constraint not identified
            detail = f"Mapping conflict. Source '{mapping.source_name}' or target '{mapping.target_name}' may already exist."
        raise HTTPException(status_code=409, detail=detail) # 409 Conflict
    except sa_exc.SQLAlchemyError as e: # Catch other SQLAlchemy errors
        db.rollback()
        logger.error(f"Database query error creating field mapping: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to create field mapping.")
    except Exception as e:
        db.rollback() # Rollback on any unexpected error too
        logger.error(f"An unexpected error occurred creating field mapping: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An internal server error occurred.")

@router.put("/mappings/{id}", response_model=FieldMappingInDB)
async def update_field_mapping(
    id: int,
    mapping_update: FieldMappingUpdate,
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(auth.require_role(["Super Admin"])) 
):
    """Updates an existing field mapping record by id using SQLAlchemy Session."""
    update_fields = mapping_update.model_dump(exclude_unset=True)
    if not update_fields:
        raise HTTPException(status_code=400, detail="No fields provided for update.")
    set_clause = ", ".join([f"{key} = :{key}" for key in update_fields])
    query = text(f"""
        UPDATE core.salary_field_mappings
        SET {set_clause}
        WHERE id = :id
        RETURNING id, source_name, target_name, is_intermediate, is_final, description, data_type;
    """)
    params = {**update_fields, "id": id}
    try:
        result = db.execute(query, params)
        updated_mapping = result.mappings().fetchone()
        if not updated_mapping:
            raise HTTPException(status_code=404, detail=f"Mapping with id '{id}' not found.")
        db.commit()
        logger.info(f"Updated field mapping: {updated_mapping}")
        return updated_mapping
    except sa_exc.IntegrityError as e:
        db.rollback()
        logger.error(f"Database integrity error updating field mapping: {e}", exc_info=True)
        detail = f"Update failed. Target name '{mapping_update.target_name}' must be unique."
        if 'target_name' not in update_fields:
            detail = "Database integrity error during update."
        raise HTTPException(status_code=409, detail=detail)
    except sa_exc.SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database query error updating field mapping: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to update field mapping.")
    except Exception as e:
        db.rollback()
        logger.error(f"An unexpected error occurred updating field mapping: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An internal server error occurred.")

@router.delete("/mappings/{id}", status_code=204)
async def delete_field_mapping(
    id: int,
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(auth.require_role(["Super Admin"])) 
):
    query = text("DELETE FROM core.salary_field_mappings WHERE id = :id RETURNING id;")
    params = {"id": id}
    try:
        result = db.execute(query, params)
        deleted_row = result.fetchone()
        if not deleted_row:
            raise HTTPException(status_code=404, detail=f"Mapping with id '{id}' not found.")
        db.commit()
        logger.info(f"Deleted field mapping with id: {id}")
        return
    except sa_exc.SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database query error deleting field mapping: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to delete field mapping.")
    except Exception as e:
        db.rollback()
        logger.error(f"An unexpected error occurred deleting field mapping: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An internal server error occurred.")

# --- EmployeeTypeFieldRule CRUD API ---
@router.get("/employee-type-field-rules", response_model=EmployeeTypeFieldRuleListResponse)
async def get_all_employee_type_field_rules(
    employee_type_key: Optional[str] = Query(None, description="Filter by employee type key"),
    field_db_name: Optional[str] = Query(None, description="Filter by field database name (case-insensitive partial match)"),
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(auth.require_role(["Super Admin"]))
):
    """Fetch employee_type_field_rules records, with optional filtering."""
    params = {}
    where_clauses = []

    base_query = """
        SELECT rule_id, employee_type_key, field_db_name, is_required
        FROM core.employee_type_field_rules
    """

    if employee_type_key:
        where_clauses.append("employee_type_key = :employee_type_key")
        params["employee_type_key"] = employee_type_key
    if field_db_name:
        # 使用 ILIKE 进行不区分大小写的模糊匹配
        where_clauses.append("field_db_name ILIKE :field_db_name")
        params["field_db_name"] = f"%{field_db_name}%" # 添加通配符

    if where_clauses:
        query_string = f"{base_query} WHERE {' AND '.join(where_clauses)}"
    else:
        query_string = base_query

    query_string += " ORDER BY employee_type_key, field_db_name;" # 添加排序

    try:
        result = db.execute(text(query_string), params) # Pass params to execute
        rules = result.mappings().all()
        logger.info(f"Found {len(rules)} employee_type_field_rules matching filters.")
        # Note: total now reflects the filtered count
        return {"data": rules, "total": len(rules)}
    except sa_exc.SQLAlchemyError as e:
        logger.error(f"Database query error for employee_type_field_rules: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to retrieve employee_type_field_rules.")
    except Exception as e:
        logger.error(f"Unexpected error fetching employee_type_field_rules: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An internal server error occurred.")

@router.post("/employee-type-field-rules", response_model=EmployeeTypeFieldRuleResponse, status_code=201)
async def create_employee_type_field_rule(
    rule: EmployeeTypeFieldRuleCreate,
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(auth.require_role(["Super Admin"]))
):
    """Create a new employee_type_field_rule record."""
    query = text("""
        INSERT INTO core.employee_type_field_rules
        (employee_type_key, field_db_name, is_required)
        VALUES (:employee_type_key, :field_db_name, :is_required)
        RETURNING rule_id, employee_type_key, field_db_name, is_required;
    """)
    try:
        result = db.execute(query, rule.model_dump())
        new_rule = result.mappings().fetchone()
        db.commit()
        logger.info(f"Created employee_type_field_rule: {new_rule}")
        if not new_rule:
            logger.error("INSERT...RETURNING did not return the new rule.")
            raise HTTPException(status_code=500, detail="Failed to confirm rule creation.")
        return new_rule
    except sa_exc.IntegrityError as e:
        db.rollback()
        logger.error(f"Database integrity error creating employee_type_field_rule: {e}", exc_info=True)
        detail = "Database integrity error occurred."
        if 'uq_type_field' in str(e):
            detail = f"Rule for employee_type_key '{rule.employee_type_key}' and field_db_name '{rule.field_db_name}' already exists."
        raise HTTPException(status_code=409, detail=detail)
    except sa_exc.SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database query error creating employee_type_field_rule: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to create employee_type_field_rule.")
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error creating employee_type_field_rule: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An internal server error occurred.")

@router.put("/employee-type-field-rules/{rule_id}", response_model=EmployeeTypeFieldRuleResponse)
async def update_employee_type_field_rule(
    rule_id: int,
    rule_update: EmployeeTypeFieldRuleUpdate,
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(auth.require_role(["Super Admin"]))
):
    update_fields = rule_update.model_dump(exclude_unset=True)
    if not update_fields:
        raise HTTPException(status_code=400, detail="No fields provided for update.")
    set_clause = ", ".join([f"{key} = :{key}" for key in update_fields])
    query = text(f"""
        UPDATE core.employee_type_field_rules
        SET {set_clause}
        WHERE rule_id = :rule_id
        RETURNING rule_id, employee_type_key, field_db_name, is_required;
    """)
    params = {**update_fields, "rule_id": rule_id}
    try:
        result = db.execute(query, params)
        updated_rule = result.mappings().fetchone()
        if not updated_rule:
            raise HTTPException(status_code=404, detail=f"Rule with rule_id '{rule_id}' not found.")
        db.commit()
        logger.info(f"Updated employee_type_field_rule: {updated_rule}")
        return updated_rule
    except sa_exc.IntegrityError as e:
        db.rollback()
        logger.error(f"Database integrity error updating employee_type_field_rule: {e}", exc_info=True)
        detail = "Update failed. Unique constraint violation."
        if 'uq_type_field' in str(e):
            detail = "Rule for this employee_type_key and field_db_name already exists."
        raise HTTPException(status_code=409, detail=detail)
    except sa_exc.SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database query error updating employee_type_field_rule: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to update employee_type_field_rule.")
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error updating employee_type_field_rule: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An internal server error occurred.")

@router.delete("/employee-type-field-rules/{rule_id}", status_code=204)
async def delete_employee_type_field_rule(
    rule_id: int,
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(auth.require_role(["Super Admin"]))
):
    """Deletes an employee_type_field_rule record."""
    query = text("DELETE FROM core.employee_type_field_rules WHERE rule_id = :rule_id RETURNING rule_id;")
    params = {"rule_id": rule_id}
    try:
        result = db.execute(query, params)
        deleted_row = result.fetchone()
        if not deleted_row:
            raise HTTPException(status_code=404, detail=f"Rule with rule_id '{rule_id}' not found.")
        db.commit()
        logger.info(f"Deleted employee_type_field_rule with rule_id: {rule_id}")
        return # Return None for 204 No Content
    except sa_exc.SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database query error deleting employee_type_field_rule: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to delete employee_type_field_rule.")
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error deleting employee_type_field_rule: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An internal server error occurred.")

# --- EmployeeTypeFieldRule CRUD API --- END ---

# --- SheetNameMapping CRUD API --- START ---

@router.get("/sheet-mappings", response_model=schemas.SheetNameMappingListResponse)
async def get_all_sheet_mappings(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(auth.require_role(["Super Admin"])) # Protect endpoint
):
    """Fetches all sheet name mappings with pagination."""
    try:
        mappings = models_db.get_sheet_mappings(db, skip=skip, limit=limit)
        # Return structured response
        # Assuming get_sheet_mappings returns only the list for now
        # TODO: Update get_sheet_mappings in models_db to return total count if real pagination is needed
        total_count = len(mappings) # Placeholder for total count
        return {"data": mappings, "total": total_count}
    except Exception as e:
        logger.error(f"Error fetching sheet mappings: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to retrieve sheet mappings.")

@router.post("/sheet-mappings", response_model=schemas.SheetNameMappingResponse, status_code=201)
async def create_new_sheet_mapping(
    mapping_data: schemas.SheetNameMappingCreate,
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(auth.require_role(["Super Admin"])) 
):
    """Creates a new sheet name mapping."""
    try:
        # create_sheet_mapping handles exceptions and returns ORM model
        created_mapping = models_db.create_sheet_mapping(db, mapping_data)
        return created_mapping # FastAPI handles conversion
    except HTTPException as http_exc:
        raise http_exc # Re-raise exceptions from DB layer (e.g., 409 Conflict)
    except Exception as e:
        logger.error(f"Unexpected error creating sheet mapping: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An internal server error occurred.")

@router.put("/sheet-mappings/{sheet_name}", response_model=schemas.SheetNameMappingResponse)
async def update_existing_sheet_mapping(
    sheet_name: str, # Get sheet_name from path
    mapping_update: schemas.SheetNameMappingUpdate,
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(auth.require_role(["Super Admin"])) 
):
    """Updates an existing sheet name mapping identified by sheet_name."""
    try:
        updated_mapping = models_db.update_sheet_mapping(db, sheet_name, mapping_update)
        if updated_mapping is None:
            raise HTTPException(status_code=404, detail=f"Sheet mapping '{sheet_name}' not found.")
        return updated_mapping # FastAPI handles conversion
    except HTTPException as http_exc:
        raise http_exc # Re-raise exceptions from DB layer
    except Exception as e:
        logger.error(f"Unexpected error updating sheet mapping '{sheet_name}': {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An internal server error occurred.")

@router.delete("/sheet-mappings/{sheet_name}", status_code=204)
async def delete_existing_sheet_mapping(
    sheet_name: str, # Get sheet_name from path
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(auth.require_role(["Super Admin"])) 
):
    """Deletes a sheet name mapping by sheet_name."""
    try:
        deleted = models_db.delete_sheet_mapping(db, sheet_name)
        if not deleted:
            raise HTTPException(status_code=404, detail=f"Sheet mapping '{sheet_name}' not found.")
        return Response(status_code=status.HTTP_204_NO_CONTENT) # Return explicit 204
    except HTTPException as http_exc:
        raise http_exc # Re-raise exceptions from DB layer
    except Exception as e:
        logger.error(f"Unexpected error deleting sheet mapping '{sheet_name}': {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An internal server error occurred.")

# --- SheetNameMapping CRUD API --- END --- 