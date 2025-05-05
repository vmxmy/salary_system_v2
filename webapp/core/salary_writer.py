# salary_system/webapp/core/salary_writer.py
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone

from sqlalchemy.orm import Session
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.exc import SQLAlchemyError, IntegrityError

# Import the ORM model from the correct location (models.py)
from ..models import CalculatedSalaryRecord 
# Assuming Employee model is in models.py
# from ..models import Employee 

logger = logging.getLogger(__name__)

class SalaryWriteError(Exception):
    """Custom exception for salary writing errors."""
    pass

def write_calculated_salary(
    db: Session,
    employee_id: int,
    pay_period: str,
    calculation_result: Dict[str, Any], # The dict returned by calculation_engine
    engine_version: Optional[str] = None,
    rules_applied: Optional[List[int]] = None,
    context_snapshot: Optional[Dict[str, Any]] = None
) -> CalculatedSalaryRecord:
    """
    Writes or updates a calculated salary record using UPSERT logic.

    Args:
        db: SQLAlchemy database session.
        employee_id: The employee's ID.
        pay_period: The pay period identifier.
        calculation_result: The dictionary containing calculated field names and values.
        engine_version: Optional version of the calculation engine.
        rules_applied: Optional list of rule IDs that were triggered.
        context_snapshot: Optional snapshot of the context used for calculation.

    Returns:
        The created or updated CalculatedSalaryRecord ORM object.
        
    Raises:
        SalaryWriteError: If there is a database error during the write operation.
    """
    logger.info(f"Attempting to write calculated salary for employee_id: {employee_id}, pay_period: {pay_period}")

    # Prepare the data for insertion/update
    insert_data = {
        'employee_id': employee_id,
        'pay_period_identifier': pay_period,
        'calculated_data': calculation_result, # Store the whole result dict in JSONB
        'calculation_timestamp': datetime.now(timezone.utc), # Ensure consistent timezone
        'calculation_engine_version': engine_version,
        'rules_applied_ids': rules_applied, # Stored as JSONB
        'source_data_snapshot': context_snapshot # Stored as JSONB
    }

    try:
        # Use PostgreSQL's INSERT ... ON CONFLICT DO UPDATE (UPSERT)
        # Requires PostgreSQL 9.5+
        stmt = pg_insert(CalculatedSalaryRecord).values(**insert_data)
        
        # Define what to do on conflict (when uq_employee_pay_period_calc is violated)
        # Update the conflicting row with the new data
        # Note: `excluded` refers to the row proposed for insertion
        update_stmt = stmt.on_conflict_do_update(
            index_elements=['employee_id', 'pay_period_identifier'], # The columns causing the conflict (our unique constraint)
            set_={
                'calculated_data': stmt.excluded.calculated_data,
                'calculation_timestamp': stmt.excluded.calculation_timestamp,
                'calculation_engine_version': stmt.excluded.calculation_engine_version,
                'rules_applied_ids': stmt.excluded.rules_applied_ids,
                'source_data_snapshot': stmt.excluded.source_data_snapshot
                # employee_id and pay_period_identifier remain unchanged
            }
        ).returning(CalculatedSalaryRecord) # Return the inserted or updated row object
        
        # Execute the statement
        result = db.execute(update_stmt)
        db.commit()
        
        # Fetch the single result row
        saved_record = result.scalar_one()
        
        logger.info(f"Successfully wrote calculated salary record ID: {saved_record.calculated_record_id} for employee_id: {employee_id}, pay_period: {pay_period}")
        return saved_record

    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error writing calculated salary for employee_id: {employee_id}, pay_period: {pay_period}: {e}", exc_info=True)
        raise SalaryWriteError(f"Failed to write salary data for employee {employee_id}, period {pay_period}.") from e
    except Exception as e: # Catch any other unexpected errors
        db.rollback()
        logger.error(f"Unexpected error writing calculated salary: {e}", exc_info=True)
        raise SalaryWriteError("An unexpected error occurred during salary writing.") from e 