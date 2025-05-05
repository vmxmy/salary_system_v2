# salary_system/webapp/core/calculation_engine.py
import logging
from typing import Dict, Any, Optional, List

from sqlalchemy.orm import Session, joinedload, selectinload
from sqlalchemy.exc import SQLAlchemyError

# Import models (adjust paths/imports as needed based on your project structure)
from ..models import (
    Employee, 
    Department, 
    Unit, 
    EstablishmentType,
    CalculationRule,
    CalculationRuleCondition,
    CalculationFormula
) # Core data models
from ..models_db import (
    get_employee_by_id # Reference the final ORM function name
) 
from ..utils.formula_parser import safe_evaluate_formula # Import the formula parser

logger = logging.getLogger(__name__)

class SalaryCalculationError(Exception):
    """Custom exception for calculation errors."""
    pass

def calculate_employee_salary(
    db: Session, 
    employee_id: int, 
    pay_period: str
) -> Optional[Dict[str, Any]]:
    """
    Calculates the salary details for a single employee for a given pay period.

    Args:
        db: SQLAlchemy database session.
        employee_id: The ID of the employee to calculate salary for.
        pay_period: The pay period identifier (e.g., "2024-07").

    Returns:
        A dictionary containing the calculated salary components, 
        or None if the employee is not found or a critical error occurs.
        Keys in the dictionary correspond to target_field_db_name from rules.
    """
    logger.info(f"Starting salary calculation for employee_id: {employee_id}, pay_period: {pay_period}")

    # --- Step 1: Get Employee Context --- 
    employee = get_employee_by_id(db, employee_id)
    if not employee:
        logger.error(f"Employee not found for employee_id: {employee_id}")
        # Consider raising an error or returning a specific status
        # raise SalaryCalculationError(f"Employee not found: {employee_id}") 
        return None # Returning None for now

    # Start building the context dictionary
    # We prefix keys to avoid clashes with rule target fields later
    calculation_context: Dict[str, Any] = {
        # Direct employee attributes
        f"ctx_employee_{attr}": getattr(employee, attr, None) 
        for attr in ['id', 'name', 'id_card_number', 'employee_unique_id', 
                     'bank_account_number', 'bank_name', 'created_at', 'updated_at']
    }

    # Add related object data (assuming they are loaded by get_employee_by_id)
    if employee.department:
        calculation_context['ctx_department_id'] = employee.department.id
        calculation_context['ctx_department_name'] = employee.department.name
        if employee.department.unit:
            calculation_context['ctx_unit_id'] = employee.department.unit.id
            calculation_context['ctx_unit_name'] = employee.department.unit.name
        else:
             calculation_context['ctx_unit_id'] = None
             calculation_context['ctx_unit_name'] = None
    else:
        calculation_context['ctx_department_id'] = None
        calculation_context['ctx_department_name'] = None
        calculation_context['ctx_unit_id'] = None
        calculation_context['ctx_unit_name'] = None

    if employee.establishment_type:
        calculation_context['ctx_establishment_type_id'] = employee.establishment_type.id
        calculation_context['ctx_establishment_type_key'] = employee.establishment_type.employee_type_key
        calculation_context['ctx_establishment_type_name'] = employee.establishment_type.name
    else:
        calculation_context['ctx_establishment_type_id'] = None
        calculation_context['ctx_establishment_type_key'] = None
        calculation_context['ctx_establishment_type_name'] = None
        
    # Add pay period to context
    calculation_context['ctx_pay_period'] = pay_period

    # TODO: Add other relevant data sources to the context later, e.g.:
    # - Raw input salary data for this period (if needed as base values)
    # - Attendance data
    # - Performance metrics
    logger.debug(f"Initial calculation context built for employee_id: {employee_id}")

    # --- Step 2: Fetch Applicable Rules --- 
    try:
        # Fetch all active rules, ordered by priority (ascending, lower number = higher priority)
        # Eager load conditions and formula to avoid N+1 queries later
        applicable_rules_query = db.query(CalculationRule).options(
            selectinload(CalculationRule.conditions),
            joinedload(CalculationRule.formula) # Use joinedload for formula as it's likely one-to-one access
        ).filter(CalculationRule.is_active == True).order_by(CalculationRule.priority.asc())
        
        # TODO: Add potential pre-filtering based on employee_type_key if performance becomes an issue
        # Example: if 'ctx_establishment_type_key' in calculation_context:
        #    query = query.filter(CalculationRule.applicable_employee_type_key == calculation_context['ctx_establishment_type_key'])
        # Requires adding applicable_employee_type_key (or similar) to CalculationRule model/table
        
        applicable_rules = applicable_rules_query.all()
        if not applicable_rules:
             logger.warning(f"No active calculation rules found in the database.")
             # Depending on requirements, maybe return empty dict or raise error

    except SQLAlchemyError as e:
        logger.error(f"Database error fetching calculation rules: {e}", exc_info=True)
        raise SalaryCalculationError("Failed to fetch calculation rules from database.") from e

    # --- Step 3: Initialize Result Dictionary --- 
    calculated_results: Dict[str, Any] = {}

    # --- Step 4: Process Rules by Priority --- 
    logger.debug(f"Processing {len(applicable_rules)} applicable rules for employee_id: {employee_id}")
    for rule in applicable_rules:
        rule_triggered = True # Assume rule triggers unless a condition fails
        
        # --- 4.1 Check Conditions --- 
        if not rule.conditions:
            logger.debug(f"Rule {rule.rule_id} ('{rule.name}') has no conditions, triggering by default.")
        else:
            logger.debug(f"Checking {len(rule.conditions)} conditions for rule {rule.rule_id} ('{rule.name}')...")
            all_conditions_met = check_rule_conditions(rule.conditions, calculation_context)
            if not all_conditions_met:
                logger.debug(f"Conditions not met for rule {rule.rule_id} ('{rule.name}'). Skipping.")
                rule_triggered = False
            else:
                 logger.debug(f"All conditions met for rule {rule.rule_id} ('{rule.name}').")

        # --- 4.2 Execute Action if Triggered --- 
        if rule_triggered:
            target_field = rule.target_field_db_name
            calculated_value: Any = None # Initialize with a default
            action_successful = False

            logger.debug(f"Executing action for triggered rule {rule.rule_id} ('{rule.name}') - Action: {rule.action_type}, Target: {target_field}")
            
            if rule.action_type == 'APPLY_FORMULA': # type: ignore
                # Explicitly check for None to avoid boolean evaluation of SQLAlchemy objects
                formula_obj = getattr(rule, "formula", None)
                formula_expression = getattr(formula_obj, "expression", None) if formula_obj is not None else None

                if formula_obj is not None and formula_expression:
                    # Pass the *current* context (which includes previous results) to the parser
                    formula_result = safe_evaluate_formula(formula_expression, calculation_context)
                    if formula_result is not None:  # Formula evaluation succeeded
                        calculated_value = formula_result
                        action_successful = True
                        logger.debug(f"  Formula '{rule.formula.expression}' evaluated to: {calculated_value}")
                    else:
                        # Formula evaluation failed (error already logged by parser)
                        logger.error(f"  Action failed for rule {rule.rule_id}: Formula evaluation error for target '{target_field}'.")
                        # Optionally, raise an error or handle differently?
                else:
                    logger.error(f"  Action failed for rule {rule.rule_id}: Action type is APPLY_FORMULA but no valid formula expression found for target '{target_field}'.")
            
            elif rule.action_type == 'SET_FIXED_VALUE': # type: ignore
                if rule.fixed_value is not None: # type: ignore
                    calculated_value = rule.fixed_value # Use the pre-defined fixed value
                    action_successful = True
                    logger.debug(f"  Set fixed value to: {calculated_value}")
                else:
                    logger.error(f"  Action failed for rule {rule.rule_id}: Action type is SET_FIXED_VALUE but fixed_value is null for target '{target_field}'.")
            
            else:
                 logger.error(f"  Action failed for rule {rule.rule_id}: Unknown action_type '{rule.action_type}' for target '{target_field}'.")

            # --- Update results and context if action was successful --- 
            if action_successful:
                target_field_str = str(target_field) # Ensure it's a string for dictionary keys
                logger.info(f"Rule {rule.rule_id} ('{rule.name}') successfully calculated '{target_field_str}' = {calculated_value}")
                # Update the main result dictionary
                calculated_results[target_field_str] = calculated_value
                # !!! IMPORTANT: Update the context so subsequent rules can use this result !!!
                # We use the target_field name directly as the key in the context now
                calculation_context[target_field_str] = calculated_value
            else:
                 # If an action fails, should we stop the whole calculation? Or just skip this rule?
                 # Current behavior: Log error and continue with next rule. 
                 # Consider adding stricter error handling if needed.
                 logger.warning(f"Action failed for rule {rule.rule_id} ('{rule.name}') targeting '{target_field}'. Calculation continues, but this field may be missing or incorrect.")

    logger.info(f"Finished processing rules for employee_id: {employee_id}, pay_period: {pay_period}")
    
    return calculated_results

# --- Helper Function for Condition Checking --- 
def check_rule_conditions(conditions: List[CalculationRuleCondition], context: Dict[str, Any]) -> bool:
    """
    Checks if all conditions for a rule are met based on the provided context.
    Currently implements AND logic (all conditions must be true).

    Args:
        conditions: A list of CalculationRuleCondition objects for the rule.
        context: The current calculation context dictionary.

    Returns:
        True if all conditions are met, False otherwise.
    """
    if not conditions:
        return True

    for condition in conditions:
        # Ensure context_key is a string
        context_key_str = str(condition.source_field_db_name)
        
        # Use prefixed context key first, then raw key
        value_from_context = context.get(f"ctx_{context_key_str}", context.get(context_key_str))
        comparison_value_str = str(condition.comparison_value) # Ensure it's a string
        operator = str(condition.operator) # Ensure it's a string
        
        logger.debug(f"  Checking condition: Key='{context_key_str}', ContextValue='{value_from_context}'({type(value_from_context)}), Operator='{operator}', ComparisonValue='{comparison_value_str}'")

        if value_from_context is None and operator not in ['is_null', 'is_not_null']:
            logger.warning(f"    Condition check failed: Context value for '{context_key_str}' is None.")
            return False

        condition_met = False
        try:
            # --- Comparison Logic --- 
            # Handle special operators first
            if operator == 'is_null':
                condition_met = (value_from_context is None)
            elif operator == 'is_not_null':
                 condition_met = (value_from_context is not None)
            # TODO: Handle 'in', 'not in' (requires parsing comparison_value_str as list)
            # Example: elif operator == 'in':
            #   try: 
            #      list_values = [s.strip() for s in comparison_value_str.split(',')]
            #      # Attempt type conversion for list elements based on context value type? Or assume string?
            #      condition_met = str(value_from_context) in list_values # Basic string check
            #   except Exception: condition_met = False 
            
            # Handle regular comparisons (needs type conversion)
            elif value_from_context is not None: # Only proceed if context value is not None
                target_type = type(value_from_context)
                
                # Attempt to convert comparison_value_str to the type of value_from_context
                try:
                    if target_type is bool:
                         # Explicit boolean conversion
                         comp_value_typed = comparison_value_str.lower() in ['true', '1', 'yes']
                    elif target_type in [int, float]: # Add other numeric types if needed
                        # Attempt numeric conversion
                        comp_value_typed = target_type(comparison_value_str)
                    else:
                         # Default to string if type is not explicitly handled (or keep original type)
                         comp_value_typed = comparison_value_str # Compare as string
                except (ValueError, TypeError) as conv_err:
                    logger.warning(f"    Conversion Error: Could not convert comparison value '{comparison_value_str}' to type {target_type} for key '{context_key_str}'. Error: {conv_err}. Trying string comparison.")
                    # Fallback: Compare as strings if conversion fails
                    target_type = str 
                    value_from_context_str = str(value_from_context)
                    comp_value_typed = comparison_value_str
                    value_from_context = value_from_context_str # Use string representation for comparison
                    
                # Perform comparison using Python operators
                if operator == '==':
                    condition_met = (value_from_context == comp_value_typed)
                elif operator == '!=':
                    condition_met = (value_from_context != comp_value_typed)
                elif operator == '>':
                    condition_met = (value_from_context > comp_value_typed) # type: ignore
                elif operator == '>=':
                    condition_met = (value_from_context >= comp_value_typed) # type: ignore
                elif operator == '<':
                    condition_met = (value_from_context < comp_value_typed) # type: ignore
                elif operator == '<=':
                    condition_met = (value_from_context <= comp_value_typed) # type: ignore
                # TODO: Add string operators like 'contains', 'startswith' etc.
                else:
                    logger.error(f"    Unsupported operator for comparison: '{operator}'")
                    return False # Fail if operator is unknown for comparison
            else: # value_from_context is None, but operator allows it (e.g., is_null handled above)
                 # This path shouldn't be reached if logic is correct, but defensively return False
                 logger.debug("    Condition skipped as context value is None and operator is not null-safe.")
                 return False 

        except TypeError as e:
            logger.error(f"    Type Error during comparison: Key='{context_key_str}', Val1='{value_from_context}'({type(value_from_context)}), Op='{operator}', Val2='{comparison_value_str}'. Error: {e}")
            return False 
        except Exception as e:
            logger.error(f"    Unexpected Error during condition check: Key='{context_key_str}'. Error: {e}", exc_info=True)
            return False

        if not condition_met:
            logger.debug(f"    Condition failed.")
            return False
        else:
             logger.debug(f"    Condition met.")

    return True

# --- Helper functions (e.g., for condition checking) can be added below --- 
 