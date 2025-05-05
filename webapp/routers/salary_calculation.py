import logging
from typing import Dict, Any, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

# Import dependencies
from ..database import get_db
from ..auth import get_current_user # Or specific role requirement if needed

# Import core logic
from ..core.calculation_engine import calculate_employee_salary, SalaryCalculationError
from ..core.salary_writer import write_calculated_salary, SalaryWriteError

# Import schemas
from .. import schemas 

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/calculate",
    tags=["Salary Calculation"],
    # Add authentication dependency - e.g., require a logged-in user
    dependencies=[Depends(get_current_user)] 
)

# --- Calculation Trigger Endpoint --- 

@router.post(
    "/{employee_id}/{pay_period}", 
    response_model=schemas.CalculatedSalaryRecordResponse, # Use the specific Pydantic schema
    summary="Trigger salary calculation for an employee and period"
)
def trigger_calculation(
    employee_id: int, 
    pay_period: str, # TODO: Add regex validation for YYYY-MM format?
    db: Session = Depends(get_db),
    # current_user: schemas.UserResponse = Depends(get_current_user) # Already in router dependencies
):
    """
    Triggers the calculation engine for a specific employee and pay period,
    then writes the result to the database (UPSERT).
    
    Returns the calculated and saved salary record.
    """
    logger.info(f"API trigger received for calculation: employee_id={employee_id}, pay_period={pay_period}")
    
    # 1. Run the calculation engine
    try:
        calculated_results = calculate_employee_salary(db, employee_id, pay_period)
    except SalaryCalculationError as e:
        logger.error(f"Calculation engine error for employee {employee_id}, period {pay_period}: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Calculation failed: {e}")
    except Exception as e:
        logger.error(f"Unexpected error during calculation for employee {employee_id}, period {pay_period}: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="An unexpected error occurred during calculation.")

    if calculated_results is None:
        # This happens if employee not found in calculation_engine
        logger.warning(f"Calculation returned None (likely employee not found) for employee_id={employee_id}, pay_period={pay_period}")
        # Return 404 directly from the endpoint
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Employee with ID {employee_id} not found or calculation could not proceed.")

    # 2. Write the results to the database
    try:
        # TODO: Optionally gather engine_version, rules_applied, context_snapshot to pass here
        saved_record = write_calculated_salary(
            db=db,
            employee_id=employee_id,
            pay_period=pay_period,
            calculation_result=calculated_results
            # engine_version="v1.0", # Example
            # rules_applied=[...], # Example
            # context_snapshot={...} # Example
        )
    except SalaryWriteError as e:
        logger.error(f"Salary writer error for employee {employee_id}, period {pay_period}: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to save calculation results: {e}")
    except Exception as e:
        logger.error(f"Unexpected error writing results for employee {employee_id}, period {pay_period}: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="An unexpected error occurred while saving results.")

    logger.info(f"Calculation and write successful for employee_id={employee_id}, pay_period={pay_period}. Record ID: {saved_record.calculated_record_id}")
    
    # Return the ORM object directly. FastAPI will handle serialization using the response_model.
    return saved_record