import pandas as pd
import json
import logging
from typing import Dict, List, Tuple, Optional, Any, IO, TypedDict
import uuid
from datetime import datetime, timezone
from sqlalchemy.orm import Session, joinedload, selectinload, relationship
from sqlalchemy.exc import SQLAlchemyError, NoResultFound, IntegrityError
from sqlalchemy import text, inspect, select, func, or_, and_, Column, String, Integer, BigInteger, UniqueConstraint, ForeignKey, TIMESTAMP, Identity, Text, Numeric, Boolean # Ensure func is here
from sqlalchemy.dialects.postgresql import JSONB
from io import BytesIO
import re # <-- Import re
import typing # Ensure typing is imported
import datetime # Added for timestamp
import numpy as np # ADDED IMPORT

# Import ORM models
from . import models # Assuming models.py defines SheetNameMapping, SalaryFieldMapping, EmployeeTypeFieldRule, Employee

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Define a type hint for the return value
class SheetMappingInfo(TypedDict):
    type_key: str
    target_table: Optional[str]

# Special column renames for consolidation: (SourceModel, original_col_name) -> name_to_be_prefixed
# This helps to avoid names like 'ann_annuity_contribution_base' and use 'ann_contribution_base' instead.
SPECIAL_COLUMN_RENAMES_BEFORE_PREFIXING = {
    (models.RawAnnuityStaging, "annuity_contribution_base_salary"): "contribution_base_salary",
    (models.RawAnnuityStaging, "annuity_contribution_base"): "contribution_base",
    (models.RawAnnuityStaging, "annuity_employer_rate"): "employer_rate",
    (models.RawAnnuityStaging, "annuity_employer_contribution"): "employer_contribution",
    (models.RawAnnuityStaging, "annuity_employee_rate"): "employee_rate",
    (models.RawAnnuityStaging, "annuity_employee_contribution"): "employee_contribution",

    (models.RawHousingFundStaging, "housingfund_contribution_base_salary"): "contribution_base_salary",
    (models.RawHousingFundStaging, "housingfund_contribution_base"): "contribution_base",
    (models.RawHousingFundStaging, "housingfund_employer_rate"): "employer_rate",
    (models.RawHousingFundStaging, "housingfund_employer_contribution"): "employer_contribution",
    (models.RawHousingFundStaging, "housingfund_employee_rate"): "employee_rate",
    (models.RawHousingFundStaging, "housingfund_employee_contribution"): "employee_contribution",
}

# --- Database Configuration Fetching (ORM Versions) ---

def get_sheet_name_mapping(db: Session) -> Dict[str, SheetMappingInfo]:
    """(ORM Version) Fetches the sheet name mapping including employee type key and target staging table."""
    mappings: Dict[str, SheetMappingInfo] = {}
    try:
        # Use ORM query, fetch all three columns
        results = db.query(
            models.SheetNameMapping.sheet_name, 
            models.SheetNameMapping.employee_type_key,
            models.SheetNameMapping.target_staging_table # Added target table column
            ).all()
        
        # Populate the dictionary with structured info
        for row in results:
            mappings[row.sheet_name] = {
                'type_key': row.employee_type_key,
                'target_table': row.target_staging_table
            }
            
        logger.info(f"Loaded {len(mappings)} sheet name mappings (with target table) from database (ORM).")
        return mappings
    except SQLAlchemyError as e:
        logger.error(f"SQLAlchemy error fetching sheet name mappings (ORM): {e}", exc_info=True)
        raise ValueError("Could not load sheet name mappings from database.") from e
    except Exception as e:
        logger.error(f"Unexpected error fetching sheet name mappings (ORM): {e}", exc_info=True)
        raise ValueError("Could not load sheet name mappings from database.") from e

def get_field_config(db: Session, employee_type_key: str) -> Dict[str, Any]:
    """
    (ORM Version) Fetches the required fields, optional fields (DB names), and the Chinese name
    to DB name mapping for a given employee type key from the database using ORM joins.
    """
    config: Dict[str, Any] = {
        'required_fields_db': [],
        'optional_fields_db': [],
        'column_mapping_cn_to_db': {}
    }
    try:
        # Use ORM query with join
        query = db.query(
            models.EmployeeTypeFieldRule.is_required,
            models.SalaryFieldMapping.source_name, # Chinese name from SalaryFieldMapping
            models.SalaryFieldMapping.target_name  # DB column name from SalaryFieldMapping
        ).join(
            models.SalaryFieldMapping, 
            models.EmployeeTypeFieldRule.field_db_name == models.SalaryFieldMapping.target_name
        ).filter(models.EmployeeTypeFieldRule.employee_type_key == employee_type_key)
        
        rows = query.all()

        if not rows:
            logger.warning(f"No field configuration found in database for employee_type_key: {employee_type_key} (ORM)")
            return config # Return empty config

        for row in rows:
            db_col_name = row.target_name
            cn_col_name = row.source_name
            is_required = row.is_required

            config['column_mapping_cn_to_db'][cn_col_name] = db_col_name
            if is_required:
                config['required_fields_db'].append(db_col_name)
            else:
                config['optional_fields_db'].append(db_col_name)

        logger.info(f"Loaded field config for '{employee_type_key}' (ORM): "
                    f"{len(config['required_fields_db'])} required, "
                    f"{len(config['optional_fields_db'])} optional, "
                    f"{len(config['column_mapping_cn_to_db'])} total mapped.")
        return config

    except SQLAlchemyError as e:
        logger.error(f"SQLAlchemy error fetching field config for '{employee_type_key}' (ORM): {e}", exc_info=True)
        raise ValueError(f"Could not load field configuration for type '{employee_type_key}' from database.") from e
    except Exception as e:
        logger.error(f"Unexpected error fetching field config for '{employee_type_key}' (ORM): {e}", exc_info=True)
        raise ValueError(f"Could not load field configuration for type '{employee_type_key}' from database.") from e


# --- Helper Functions ---

def normalize_whitespace(text: str) -> str:
    """Replaces various whitespace chars with a single space and strips ends."""
    if not isinstance(text, str):
        return text # Return original if not a string
    # Replace various whitespace characters (including non-breaking space \u00A0) with a single space
    text = re.sub(r'\s+', ' ', text, flags=re.UNICODE)
    return text.strip()

def get_sheet_processing_info(sheet_name: str, sheet_mappings: Dict[str, SheetMappingInfo]) -> Optional[SheetMappingInfo]:
    """Determines the processing info (type key and target table) using the mapping dictionary."""
    normalized_input_sheet_name = normalize_whitespace(sheet_name)
    
    # Normalize keys from the mapping dictionary as well before comparing
    for db_sheet_name, mapping_info in sheet_mappings.items():
        normalized_db_sheet_name = normalize_whitespace(db_sheet_name)
        if normalized_input_sheet_name == normalized_db_sheet_name:
            logger.debug(f"Matched normalized sheet name '{normalized_input_sheet_name}' to DB key '{normalized_db_sheet_name}' -> {mapping_info}")
            # Return the whole info dictionary
            return mapping_info 
            
    logger.warning(f"Sheet name '{sheet_name}' (normalized: '{normalized_input_sheet_name}') not found in database mappings after normalization.")
    return None


def validate_and_map_columns(
    df: pd.DataFrame,
    field_config: Dict[str, Any]
) -> Tuple[pd.DataFrame, List[str], List[str]]:
    """
    Validates DataFrame columns against the database-derived field configuration
    and maps present Chinese column names to their database (target) names.
    Applies whitespace normalization to DataFrame columns before comparison.
    Ignores an unexpected column named '序号'.

    Returns:
        - Mapped DataFrame containing only the successfully mapped columns.
        - List of *required* Chinese column names that were missing from the DataFrame.
        - List of columns present in the DataFrame but not expected (excluding '序号').
    """
    if not field_config.get('column_mapping_cn_to_db'):
        logger.error("Field configuration is missing 'column_mapping_cn_to_db'. Cannot validate or map.")
        # Return all columns as missing if config is bad? Or just empty?
        # Let's assume returning all original columns as unexpected is safer.
        return pd.DataFrame(), list(df.columns), list(df.columns)

    column_mapping_cn_to_db: Dict[str, str] = field_config['column_mapping_cn_to_db']
    required_db_cols: List[str] = field_config.get('required_fields_db', [])
    optional_db_cols: List[str] = field_config.get('optional_fields_db', [])

    # --- Normalize DataFrame column headers --- START ---
    original_columns = df.columns
    normalized_columns = [normalize_whitespace(col) for col in original_columns]
    df.columns = normalized_columns
    # Keep track of original vs normalized for logging/errors if needed
    # Use original columns in the map value for better error reporting
    renamed_cols_map = dict(zip(normalized_columns, original_columns))
    # --- Normalize DataFrame column headers --- END ---

    # Normalize the keys from the config mapping as well
    normalized_mapping_cn_to_db = {normalize_whitespace(k): v for k, v in column_mapping_cn_to_db.items()}
    mapping_db_to_cn = {v: k for k, v in normalized_mapping_cn_to_db.items()} # db_name -> normalized_cn_name

    # Get required *normalized* Chinese names based on required DB names in config
    required_normalized_cn_cols = set(mapping_db_to_cn[db_col] for db_col in required_db_cols if db_col in mapping_db_to_cn)
    all_expected_normalized_cn_cols = set(normalized_mapping_cn_to_db.keys())
    actual_normalized_cn_cols = set(df.columns) # df.columns are now normalized

    missing_required_normalized_cn = list(required_normalized_cn_cols - actual_normalized_cn_cols)
    # Convert missing normalized names back to original for reporting using the map
    missing_required_original_cn = [renamed_cols_map.get(norm_col, norm_col)
                                      for norm_col in missing_required_normalized_cn]

    unexpected_normalized_columns_cn_all = actual_normalized_cn_cols - all_expected_normalized_cn_cols

    # --- Ignore '序号' column --- START ---
    ignored_column_name = "序号" # Define the column to ignore
    ignored_column_name_normalized = normalize_whitespace(ignored_column_name)

    # Filter out the ignored column from the unexpected list
    unexpected_normalized_columns_cn_filtered = {
        col for col in unexpected_normalized_columns_cn_all
        if col != ignored_column_name_normalized
    }
    # --- Ignore '序号' column --- END ---

    # Convert filtered unexpected normalized names back to original for reporting
    unexpected_original_columns_cn = [renamed_cols_map.get(norm_col, norm_col)
                                        for norm_col in unexpected_normalized_columns_cn_filtered]

    # Determine which columns to keep and map: intersect actual columns with expected ones
    present_expected_normalized_cn_cols = list(actual_normalized_cn_cols.intersection(all_expected_normalized_cn_cols))

    # Create the mapping dict for rename using normalized CN names to DB names
    mapping_for_rename = {norm_cn_col: normalized_mapping_cn_to_db[norm_cn_col]
                           for norm_cn_col in present_expected_normalized_cn_cols}

    if unexpected_original_columns_cn: # Log only the *filtered* unexpected columns
        logger.warning(f"Unexpected columns found and not ignored in sheet (original names): {unexpected_original_columns_cn}")
    if ignored_column_name_normalized in unexpected_normalized_columns_cn_all:
         logger.info(f"Ignored expected column '序号' found in sheet.")


    # Select only the columns that are expected (ignoring '序号' and others)
    # We operate on the original DataFrame which still has normalized column names
    df_filtered = df[present_expected_normalized_cn_cols]


    # Rename the filtered columns to their DB names
    try:
        mapped_df = df_filtered.rename(columns=mapping_for_rename)
    except Exception as rename_err:
        logger.error(f"Error renaming columns: {rename_err}", exc_info=True)
        raise ValueError("Failed to rename columns during mapping.") from rename_err

    # At this point, mapped_df contains only the expected columns, renamed to their DB names.
    # '序号' or other unexpected columns have been effectively dropped.

    # Return original missing/unexpected names (filtered) for user feedback
    return mapped_df, missing_required_original_cn, unexpected_original_columns_cn


def clean_data(df: pd.DataFrame) -> pd.DataFrame:
    """
    Applies cleaning and type conversion to DataFrame columns based on common patterns.
    Converts numerics, dates (to date only), boolean values (e.g., '是'/'否'),
    and strips strings. Replaces empty strings and NaNs with None.
    Ensures 'id_card_number' is treated as a string.
    """
    boolean_map = {'是': True, '否': False} # Define mapping for boolean columns

    for col in df.columns:
        # Attempt numeric conversion first for relevant columns
        # Convert to numeric, coercing errors. Pandas uses float64 by default for columns with NaN.
        if any(substr in col.lower() for substr in ['salary', 'bonus', 'allowance', 'deduct', 'contrib', 'amount', 'reward', 'subsidy', 'wage', 'pay', 'fund', 'insurance', 'tax']):
            # Coerce errors to NaN, which pandas handles well
            df[col] = pd.to_numeric(df[col], errors='coerce')
            # We'll rely on DB constraints for precision/scale later.
            # Convert NaNs to None before DB insert if needed, though to_sql usually handles it.
            # df[col] = df[col].astype('float').replace({pd.NA: None, float('nan'): None}) # Be explicit if needed

        # Attempt datetime conversion for date-like columns, keep only date part
        elif 'date' in col.lower() or 'period' in col.lower() or 'time' in col.lower():
            try:
                # Coerce errors, convert to datetime, then extract date. NaT remains for errors.
                df[col] = pd.to_datetime(df[col], errors='coerce').dt.date
                # Convert NaT to None before DB insert
                df[col] = df[col].replace({pd.NaT: None})
            except Exception as date_err:
                 logger.warning(f"Could not parse column '{col}' as date: {date_err}. Leaving as object.")
                 # Fallback to string conversion?
                 df[col] = df[col].astype(str).str.strip()
                 df[col] = df[col].replace({'': None, 'nan': None, 'NaT': None, 'None': None})

        # --- Add specific boolean conversion for 'is_leader' --- START ---
        # Assuming the column name after mapping is 'is_leader'
        elif col == 'is_leader':
            # Apply the map, keep original value if not in map (will be handled by replace below)
            original_values = df[col].copy()
            df[col] = df[col].astype(str).str.strip().map(boolean_map).fillna(original_values)
            # Log unexpected values before replacing them
            unexpected_bool_values = df[col][~df[col].isin([True, False, pd.NA, None, '', 'nan', 'NaN', 'None', '<NA>'])]
            if not unexpected_bool_values.empty:
                logger.warning(f"Column '{col}' contained unexpected values for boolean conversion: {unexpected_bool_values.unique().tolist()}. These will be treated as NULL.")
            # Replace anything not True/False with None
            df[col] = df[col].apply(lambda x: x if isinstance(x, bool) else None)
        # --- Add specific boolean conversion for 'is_leader' --- END ---

        # Default to string conversion for others or if numeric/date fails
        else:
            df[col] = df[col].astype(str).str.strip()
            # Replace various forms of "empty" with None for database NULL
            df[col] = df[col].replace({'': None, 'nan': None, 'NaN': None, 'None': None, '<NA>': None})


    # Ensure id_card_number is always a string and stripped
    if 'id_card_number' in df.columns:
        df['id_card_number'] = df['id_card_number'].astype(str).str.strip().replace({'': None, 'nan': None, 'None': None})

    # Convert all remaining NaN/NaT (e.g., from coerce errors) to None
    df = df.fillna(value=pd.NA).replace({pd.NA: None})

    return df


def add_metadata(
    df: pd.DataFrame,
    upload_id: str,
    employee_type_key: str,
    pay_period: str,
    validation_status: str = 'pending',
    validation_errors: Optional[Dict] = None
) -> pd.DataFrame:
    """
    Adds metadata columns required by the staging tables.
    Removes the specific _staging_id assignment.
    """
    import json
    # df['_staging_id'] = [uuid.uuid4() for _ in range(len(df))] # REMOVED - Specific to old table
    df['_import_batch_id'] = uuid.UUID(upload_id) # Ensure it's a UUID object
    df['employee_type_key'] = employee_type_key
    df['pay_period_identifier'] = pay_period
    df['_import_timestamp'] = datetime.datetime.now(timezone.utc) # Use datetime.datetime.now
    df['_validation_status'] = validation_status
    df['_validation_errors'] = json.dumps(validation_errors, ensure_ascii=False) if validation_errors else None
    return df


def check_employee_existence(df: pd.DataFrame, field_config: Dict[str, Any], db: Session) -> Tuple[bool, Dict[str, List[str]], pd.DataFrame]:
    """
    (ORM Version) Checks employee existence based on '姓名' (name).
    1. Finds the DB column name corresponding to '姓名' using field_config.
    2. Queries the 'employees' table for each unique name.
    3. Identifies names not found or found multiple times.
    4. If all names are unique, fetches corresponding 'id_card_number' and adds it to the DataFrame.

    Args:
        df (pd.DataFrame): DataFrame containing mapped data (DB column names).
                           Expected to have the column mapped from '姓名'.
        field_config (Dict[str, Any]): Field configuration for the employee type.
        db (Session): Database session.

    Returns:
        - bool: True if all names were found uniquely, False otherwise.
        - Dict[str, List[str]]: Dictionary containing lists of 'not_found' and 'duplicate' names.
        - pd.DataFrame: The input DataFrame, potentially augmented with the 'id_card_number' column if successful.
    """
    # --- Step 1: Find the DB column name for '姓名' ---
    name_cn = "姓名"
    name_cn_normalized = normalize_whitespace(name_cn)
    column_mapping_cn_to_db: Dict[str, str] = field_config.get('column_mapping_cn_to_db', {})
    normalized_mapping_cn_to_db = {normalize_whitespace(k): v for k, v in column_mapping_cn_to_db.items()}
    name_db_col = normalized_mapping_cn_to_db.get(name_cn_normalized)
    if not name_db_col or name_db_col not in df.columns:
        logger.error(f"Configuration error or missing column for '{name_cn}'. Cannot check employee existence (ORM).")
        return False, {"config_error": [f"未找到'{name_cn}'的列配置或数据"]}, df

    # --- Step 2 & 3: Query DB using ORM, find not found/duplicates ---
    unique_names_in_df = df[name_db_col].dropna().unique().tolist()
    if not unique_names_in_df:
        logger.info("No valid names found in the DataFrame to check (ORM).")
        return True, {}, df

    not_found_names = set()
    duplicate_names = set()
    name_to_id_card_map = {}

    try:
        # Use ORM query with func.count and func.array_agg
        query = db.query(
            models.Employee.name,
            func.count(models.Employee.id_card_number).label('name_count'),
            func.array_agg(models.Employee.id_card_number).label('id_cards')
        ).filter(
            models.Employee.name.in_(unique_names_in_df) # Use .in_ operator
        ).group_by(models.Employee.name)

        db_results_orm = query.all()
        db_results = {row.name: (row.name_count, row.id_cards) for row in db_results_orm}

        processed_names = set()
        for name in unique_names_in_df:
            if name in db_results:
                count, id_cards = db_results[name]
                if count == 0:
                     not_found_names.add(name)
                elif count == 1:
                     name_to_id_card_map[name] = id_cards[0]
                else:
                     duplicate_names.add(name)
                processed_names.add(name)
            else:
                not_found_names.add(name)

    except SQLAlchemyError as e:
        logger.error(f"SQLAlchemy error checking employee existence by name (ORM): {e}", exc_info=True)
        raise ValueError("Database error occurred while checking employee existence.") from e
    except Exception as e:
        logger.error(f"Unexpected error checking employee existence by name (ORM): {e}", exc_info=True)
        raise ValueError("Unexpected error occurred while checking employee existence.") from e

    errors = {}
    if not_found_names:
        errors["not_found"] = sorted(list(not_found_names))
        logger.warning(f"Employee names not found in database (ORM): {errors['not_found']}")
    if duplicate_names:
        errors["duplicates"] = sorted(list(duplicate_names))
        logger.warning(f"Duplicate employee names found in database (cannot uniquely identify) (ORM): {errors['duplicates']}")

    if errors:
        return False, errors, df # Return original DataFrame on failure

    # --- Step 4: Add id_card_number if successful ---
    logger.info(f"All {len(unique_names_in_df)} unique employee names found uniquely (ORM). Mapping ID cards.")
    id_card_db_col = 'id_card_number'
    if id_card_db_col not in df.columns:
        df[id_card_db_col] = None 
    df[id_card_db_col] = df[name_db_col].map(name_to_id_card_map).fillna(df[id_card_db_col])

    if df[id_card_db_col].isnull().any():
         missing_map_count = df[id_card_db_col].isnull().sum()
         logger.warning(f"ID card mapping resulted in {missing_map_count} null values (ORM). This might be expected if names were missing or not found.")

    return True, {}, df # Return augmented DataFrame on success


# --- Main Processing Function (Restored Structure, Updated Schema for to_sql) ---

def _consolidate_staging_data(db: Session, batch_id: str, pay_period: str):
    """
    合并给定批次ID和薪资周期的暂存表数据到 consolidated_data 表。
    只有在所有暂存表导入成功后才应调用此函数。
    """
    logger.info(f"开始合并批次 {batch_id} (周期: {pay_period}) 的暂存数据...")

    source_tables_config = {
        'raw_annuity_staging': 'ann_',
        'raw_housingfund_staging': 'hf_',
        'raw_medical_staging': 'med_',
        'raw_pension_staging': 'pen_',
        'raw_salary_data_staging': 'sal_',
        'raw_tax_staging': 'tax_'
    }
    key_columns = ['employee_name', 'pay_period_identifier', 'id_card_number']
    all_dfs = []

    try:
        connection_for_read = db.connection()
        try:
            current_search_path_df = pd.read_sql(text("SHOW search_path;"), connection_for_read)
            if not current_search_path_df.empty:
                current_search_path = current_search_path_df.iloc[0,0]
                logger.debug(f"Consolidation: Current search_path: {current_search_path}")
            else:
                logger.warning("Consolidation: Could not determine search_path.")
        except Exception as e_path:
            logger.warning(f"Consolidation: Error determining search_path: {e_path}")

        for table_name_str, prefix in source_tables_config.items():
            qualified_table_name_for_sql = f'staging."{table_name_str}"'
            qualified_table_name_log = f'staging.{table_name_str}'
            logger.debug(f"Consolidation: Preparing to access table: {qualified_table_name_log} for batch {batch_id}")

            # --- SQLAlchemy Core SELECT Test and Data Fetch --- 
            df = pd.DataFrame() # Initialize an empty DataFrame
            try:
                stmt_exists = text(f"SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'staging' AND table_name = '{table_name_str}');")
                table_exists_in_schema = db.execute(stmt_exists).scalar_one_or_none()
                logger.debug(f"DEBUG SQLAlchemy Check: Table '{qualified_table_name_log}' exists in information_schema: {table_exists_in_schema}")

                if table_exists_in_schema:
                    query_str = f'SELECT * FROM {qualified_table_name_for_sql} WHERE "_import_batch_id" = :batch_id'
                    logger.debug(f"Consolidation: Executing SQLAlchemy query: {query_str}")
                    result = db.execute(text(query_str), {'batch_id': batch_id})
                    rows = result.fetchall()
                    column_names = list(result.keys())
                    df = pd.DataFrame(rows, columns=column_names)
                    logger.debug(f"Consolidation: Successfully fetched {len(df)} rows from {qualified_table_name_log} using SQLAlchemy execute.")
                else:
                    logger.warning(f"DEBUG SQLAlchemy Check: Table '{qualified_table_name_log}' NOT FOUND in information_schema by this session. Skipping.")
                    continue # Skip this table if not found by information_schema query
            
            except Exception as e_sa_fetch:
                logger.error(f"CRITICAL DEBUG SQLAlchemy Fetch: Failed to fetch data from {qualified_table_name_log} using SQLAlchemy. Error: {e_sa_fetch}", exc_info=True)
                continue 
            # --- END SQLAlchemy Core SELECT Test and Data Fetch ---
            
            if df.empty:
                logger.info(f"Consolidation: No data fetched from {qualified_table_name_log} for batch {batch_id}. Skipping.")
                continue

            if 'employee_name' in df.columns:
                 df['employee_name'] = df['employee_name'].apply(lambda x: normalize_whitespace(x) if isinstance(x, str) else x)
            else:
                logger.warning(f"Consolidation: {qualified_table_name_log} lacks 'employee_name'. Cannot merge.")
                continue
                
            if 'pay_period_identifier' not in df.columns:
                logger.warning(f"Consolidation: {qualified_table_name_log} lacks 'pay_period_identifier'. Cannot merge.")
                continue
                
            if 'id_card_number' not in df.columns:
                 df['id_card_number'] = None

            internal_meta_cols = ['_source_filename', '_source_sheet_name', '_row_number', '_import_timestamp', '_import_batch_id', '_validation_status', '_validation_errors']
            pk_col_for_table = f'_{table_name_str.replace("raw_", "").replace("_staging", "")}_staging_id'
            if table_name_str == 'raw_salary_data_staging':
                pk_col_for_table = '_staging_id'

            cols_to_exclude = set(key_columns + internal_meta_cols + [pk_col_for_table])
            data_columns = [col for col in df.columns if col not in cols_to_exclude]
            
            # Restore direct prefixing logic
            rename_map = {col: f"{prefix}{col}" for col in data_columns}
            
            df.rename(columns=rename_map, inplace=True)
            
            final_columns_for_this_df = [col for col in key_columns + list(rename_map.values()) if col in df.columns]
            df_final = df[final_columns_for_this_df].copy()
            all_dfs.append(df_final)

        if not all_dfs:
            logger.warning(f"Consolidation: Batch {batch_id} - no valid staging data found to merge.")
            # If no dataframes were successfully read and processed, there's nothing to write.
            # The function can return here, or let it proceed to attempt to write an empty merged_df.
            # Let's return to make it explicit. The caller expects an exception on failure to write.
            return

        logger.debug(f"Consolidation: Starting merge of {len(all_dfs)} dataframes for batch {batch_id}")
        merged_df = all_dfs[0]
        for i in range(1, len(all_dfs)):
            merged_df = pd.merge(
                merged_df, 
                all_dfs[i], 
                on=['employee_name', 'pay_period_identifier'], 
                how='outer',
                suffixes=(f'_l{i-1}', f'_r{i}') 
            )
            logger.debug(f"Consolidation: Merged dataframe {i+1}, shape: {merged_df.shape}")

        id_cols = [col for col in merged_df.columns if col.startswith('id_card_number')]
        if len(id_cols) > 1:
            logger.debug(f"Consolidation: Multiple id_card_number columns found: {id_cols}. Merging...")
            merged_df['id_card_number'] = merged_df[id_cols].bfill(axis=1).iloc[:, 0]
            merged_df.drop(columns=[col for col in id_cols if col != 'id_card_number'], inplace=True)
            logger.debug("Consolidation: id_card_number columns merged.")
        elif len(id_cols) == 1 and id_cols[0] != 'id_card_number':
             merged_df.rename(columns={id_cols[0]: 'id_card_number'}, inplace=True)
        elif 'id_card_number' not in merged_df.columns and not id_cols:
             merged_df['id_card_number'] = None

        logger.debug(f"Consolidation: Adding metadata for batch {batch_id}")
        merged_df['_import_batch_id'] = uuid.UUID(batch_id) # Ensure UUID type

        # --- Data Cleaning for specific columns in merged_df ---
        if 'sal_employment_start_date' in merged_df.columns:
            logger.info(f"Consolidation: Cleaning sal_employment_start_date in merged_df. Original unique values (sample): {merged_df['sal_employment_start_date'].unique()[:20]}")
            
            # Step 1: Explicitly replace empty strings and pure whitespace strings with pd.NaT
            # to ensure pd.to_datetime handles them as missing.
            def clean_date_input(x):
                if isinstance(x, str):
                    if x.strip() == "":
                        return None # CHANGED: Return None instead of pd.NaT for apply
                return x
            
            merged_df['sal_employment_start_date'] = merged_df['sal_employment_start_date'].apply(clean_date_input)
            logger.info(f"Consolidation: After pre-cleaning empty/whitespace strings for sal_employment_start_date. Sample unique: {merged_df['sal_employment_start_date'].unique()[:20]}")

            # Step 2: Attempt to convert to datetime objects, coercing errors to NaT
            merged_df['sal_employment_start_date'] = pd.to_datetime(merged_df['sal_employment_start_date'], errors='coerce')
            logger.info(f"Consolidation: After pd.to_datetime for sal_employment_start_date. Sample unique (contains NaT for errors): {merged_df['sal_employment_start_date'].unique()[:20]}")

            # Step 3: Convert valid datetime objects to date objects (YYYY-MM-DD), and NaT/None to None
            merged_df['sal_employment_start_date'] = merged_df['sal_employment_start_date'].dt.date.where(merged_df['sal_employment_start_date'].notna(), None)
            logger.info(f"Consolidation: Cleaned sal_employment_start_date. Final unique values (sample, None for errors): {merged_df['sal_employment_start_date'].unique()[:20]}")
        else:
            logger.warning("Consolidation: sal_employment_start_date not found in merged_df for cleaning.")

        target_table_name = models.ConsolidatedDataTable.__tablename__
        consolidated_schema = models.ConsolidatedDataTable.__table_args__[-1].get('schema')

        if not consolidated_schema:
            logger.error("CRITICAL: ConsolidatedDataTable model does not have schema defined in __table_args__!")
            raise ValueError("ConsolidatedDataTable schema not defined in model.")

        logger.info(f"Consolidation: Preparing to write {len(merged_df)} merged rows to {consolidated_schema}.{target_table_name} for batch {batch_id}.")
        
        # Ensure NaNs are converted to None for database compatibility
        merged_df = merged_df.where(pd.notnull(merged_df), None)
        
        # Add _consolidation_timestamp to the actual DataFrame before writing
        merged_df['_consolidation_timestamp'] = datetime.datetime.utcnow()

        # Remove primary key if it was accidentally included in merged_df
        consolidated_pk = '_consolidated_data_id' 
        if consolidated_pk in merged_df.columns:
            logger.debug(f"Consolidation: Dropping '{consolidated_pk}' from merged_df before schema check.")
            merged_df = merged_df.drop(columns=[consolidated_pk])

        # --- SQL-BASED SCHEMA COMPARISON --- START ---
        try:
            logger.info("Initiating SQL-based schema comparison for staging.consolidated_data.")
            python_columns = set(merged_df.columns.tolist())
            python_columns_lower = {col.lower() for col in python_columns}
            
            db_columns_query = text("SELECT column_name FROM information_schema.columns WHERE table_schema = 'staging' AND table_name = 'consolidated_data'")
            result = db.execute(db_columns_query)
            db_columns_raw = {row[0] for row in result.fetchall()}
            db_columns_lower = {col.lower() for col in db_columns_raw}

            unmatched_in_df_lower = python_columns_lower - db_columns_lower
            unmatched_in_db_lower = db_columns_lower - python_columns_lower

            if unmatched_in_df_lower:
                # For more precise reporting, find original case for columns found in df but not db
                unmatched_in_df_original_case = sorted([col for col in python_columns if col.lower() in unmatched_in_df_lower])
                logger.error(f"SCHEMA MISMATCH: Columns in DataFrame (merged_df) but NOT in DB table 'staging.consolidated_data': {unmatched_in_df_original_case}")
            else:
                logger.info("SCHEMA CHECK: All columns in DataFrame (merged_df) appear to exist in DB table 'staging.consolidated_data' (case-insensitive).")

            if unmatched_in_db_lower:
                # For more precise reporting, find original case for columns found in db but not df
                unmatched_in_db_original_case = sorted([col for col in db_columns_raw if col.lower() in unmatched_in_db_lower])
                logger.warning(f"SCHEMA MISMATCH: Columns in DB table 'staging.consolidated_data' but NOT in DataFrame (merged_df): {unmatched_in_db_original_case}")
            
        except Exception as e_schema_check:
            logger.error(f"Error during SQL-based schema comparison: {e_schema_check}", exc_info=True)
            # Decide if this should be fatal. For now, just log and continue to insert attempt.
        # --- SQL-BASED SCHEMA COMPARISON --- END ---

        # --- Filter merged_df columns to match ConsolidatedDataTable model --- START ---
        inspector = inspect(models.ConsolidatedDataTable)
        model_columns = {c.key for c in inspector.columns} # 使用 c.key 获取属性名

        # 找出 merged_df 中存在但模型中不存在的列
        extra_cols_in_df = [col for col in merged_df.columns if col not in model_columns]
        if extra_cols_in_df:
            logger.info(f"Consolidation: Columns to be dropped from merged_df to match ConsolidatedDataTable model: {extra_cols_in_df}")
            merged_df = merged_df.drop(columns=extra_cols_in_df, errors='ignore') # errors='ignore' 以防万一

        # 确保模型中所有列都存在于df中，如果缺少则可能需要添加空列或记录警告
        # _consolidated_data_id 是主键，通常不在df中，由数据库生成
        # _consolidation_timestamp 和 _import_batch_id 是在写入前添加或已存在的元数据列，应在 model_columns 中
        missing_cols_in_df = [m_col for m_col in model_columns 
                                if m_col not in merged_df.columns and 
                                m_col not in ['_consolidated_data_id']] 
        if missing_cols_in_df:
            logger.warning(f"Consolidation: Columns in ConsolidatedDataTable model but MISSING from merged_df (will be null if not set before insert): {missing_cols_in_df}")
            # SQLAlchemy 应该会为模型中定义但 DataFrame 中没有的 nullable 列插入 NULL
            # 如果有非 nullable 且没有默认值的列在这里缺失，插入会失败，这是期望的行为，说明数据准备有问题
            # for missing_col in missing_cols_in_df:
            #     merged_df[missing_col] = None # 通常不需要，除非有特殊处理
        logger.info(f"Consolidation: merged_df columns after filtering to match model: {merged_df.columns.tolist()}")
        # --- Filter merged_df columns to match ConsolidatedDataTable model --- END ---

        # --- Final Preparation before writing to ConsolidatedDataTable --- START ---
        if merged_df.empty:
            logger.info(f"Consolidation: No data available after merging all sources for batch {batch_id}. Nothing to write.")
            return # Exit if no data to consolidate

        # Check for existing data for the pay_period before attempting to insert
        existing_data_query = db.query(models.ConsolidatedDataTable.pay_period_identifier).filter(
            models.ConsolidatedDataTable.pay_period_identifier == pay_period
        ).limit(1)
            
        if db.execute(existing_data_query).scalar_one_or_none() is not None:
            logger.warning(f"Consolidation: Data for pay period {pay_period} already exists. Import operation will be rejected.")
            raise ValueError(f'薪资周期 {pay_period} 的数据已存在。请在"薪酬记录管理"界面删除现有记录后再尝试导入。')

        # Add batch ID and consolidation timestamp
        merged_df['_import_batch_id'] = batch_id

        # --- NEW CHUNKED INSERT LOGIC --- START ---
        if not merged_df.empty:
            db_table_model = models.ConsolidatedDataTable
            db_table = db_table_model.__table__ # Get the SQLAlchemy Table object
            
            chunk_size = 100000  # Effectively disable chunking for debugging by using a very large size
            num_chunks = (len(merged_df) - 1) // chunk_size + 1
            
            logger.info(f"Consolidation: Starting chunked insert of {len(merged_df)} rows into {consolidated_schema}.{target_table_name} in {num_chunks} chunks of size {chunk_size}.")

            for i, chunk_start in enumerate(range(0, len(merged_df), chunk_size)):
                chunk = merged_df.iloc[chunk_start:chunk_start + chunk_size]

                # --- ADD THIS LINE TO REPLACE NaT with None ---
                chunk = chunk.replace({pd.NaT: None})
                # --- END OF ADDED LINE ---

                logger.info(f"Consolidation: Chunk {i+1}/{num_chunks} - Preparing to convert to dict. Columns: {list(chunk.columns)}")
                
                # Date cleaning for sal_employment_start_date (if it exists in the CHUNK)
                if 'sal_employment_start_date' in chunk.columns:
                    logger.info(f"Consolidation: Chunk {i+1}/{num_chunks} - sal_employment_start_date unique values before to_dict: {chunk['sal_employment_start_date'].unique()[:20]}")
                    # logger.info(f"Consolidation: Chunk {i+1}/{num_chunks} - sal_employment_start_date dtypes: {pd.Series(list(chunk['sal_employment_start_date'].apply(type))).value_counts()}")
                else:
                    logger.warning(f"Consolidation: Chunk {i+1}/{num_chunks} - sal_employment_start_date NOT IN COLUMNS before to_dict.")

                # Convert chunk to list of dictionaries
                chunk_records = chunk.to_dict(orient='records')
                
                try:
                    # We are within the main transaction managed by the calling router function.
                    # db.execute will use the existing transaction.
                    db.execute(db_table.insert().values(chunk_records))
                    logger.info(f"Consolidation: Successfully inserted chunk {i+1}/{num_chunks} ({len(chunk)} rows) into {consolidated_schema}.{target_table_name}.")
                except Exception as e_chunk_insert:
                    logger.error(f"Consolidation: Error inserting chunk {i+1}/{num_chunks} ({len(chunk)} rows) into {consolidated_schema}.{target_table_name}. Error: {e_chunk_insert}", exc_info=True)
                    logger.error(f"Data for failed chunk {i+1} (first 3 rows): \\n{chunk.head(3).to_string()}")
                    # Re-raise the exception to be caught by the main try-except block of _consolidate_staging_data
                    raise Exception(f"Failed to insert chunk {i+1} into {consolidated_schema}.{target_table_name}: {e_chunk_insert}")
            
            logger.info(f"Consolidation: Successfully wrote all {len(merged_df)} rows via chunked insert to {consolidated_schema}.{target_table_name} for batch {batch_id}.")
        else:
            logger.info(f"Consolidation: Merged DataFrame is empty for batch {batch_id}. Nothing to write to {consolidated_schema}.{target_table_name}.")
        # --- NEW CHUNKED INSERT LOGIC --- END ---
            
    except Exception as e:
        logger.error(f"Consolidation: Error during staging data consolidation for batch {batch_id}: {e}", exc_info=True)
        raise Exception(f"合并暂存数据失败: {e}") # Re-raise to ensure transaction rollback by router

# --- Mapping for staging table primary keys ---
# Used to drop the PK column before inserting, allowing the DB to generate it.
PK_COLUMN_MAP = {
    'raw_salary_data_staging': '_staging_id',
    'raw_annuity_staging': '_annuity_staging_id',
    'raw_housingfund_staging': '_housingfund_staging_id',
    'raw_medical_staging': '_medical_staging_id',
    'raw_pension_staging': '_pension_staging_id',
    'raw_tax_staging': '_tax_staging_id',
    # Note: consolidated_data is handled separately and usually built, not directly inserted like this.
}

def _write_dataframe_to_db(df: pd.DataFrame, table_name: str, db: Session, schema: str = 'staging'):
    """Helper function to write DataFrame to the specified table, dropping PK if exists."""
    # --- DEBUGGING START ---
    logger.debug(f"_write_dataframe_to_db called for table: {schema}.{table_name}")
    logger.debug(f"DataFrame columns on entry: {df.columns.tolist()}")
    # --- DEBUGGING END ---

    # --- Added logic to drop PK ---
    pk_column = PK_COLUMN_MAP.get(table_name)
    # --- DEBUGGING START ---
    logger.debug(f"PK column from map for '{table_name}': {pk_column}")
    # --- DEBUGGING END ---
    df_to_write = df.copy() # Work on a copy
    if pk_column and pk_column in df_to_write.columns:
        # --- DEBUGGING START ---
        logger.debug(f"Attempting to drop PK column '{pk_column}'...")
        # --- DEBUGGING END ---
        df_to_write = df_to_write.drop(columns=[pk_column])
        # --- DEBUGGING START ---
        logger.debug(f"Columns after attempting drop: {df_to_write.columns.tolist()}")
        # --- DEBUGGING END ---
    elif pk_column:
        logger.debug(f"PK column '{pk_column}' found in map but not present in DataFrame columns: {df_to_write.columns.tolist()}")
    else:
        logger.debug(f"No PK column defined in map for table '{table_name}'.")
    # --- End added logic ---

    # Ensure connection is handled correctly within the session context
    connection = None
    try:
        connection = db.connection()
        # --- DEBUGGING START ---
        logger.debug(f"Columns being passed to to_sql: {df_to_write.columns.tolist()}")
        # --- DEBUGGING END ---
        df_to_write.to_sql(
            name=table_name,
            con=connection,
            schema=schema,
            if_exists='append',
            index=False,
            method='multi',
            chunksize=1000
        )
        logger.debug(f"Successfully wrote {len(df_to_write)} rows to {schema}.{table_name}")
    except Exception as e:
        logger.error(f"Error writing to table {schema}.{table_name}: {e}", exc_info=True)
        raise e

def process_excel_file(file_stream: IO[bytes], upload_id: str, db: Session, pay_period: str, filename: Optional[str] = None) -> Dict[str, Any]:
    """
    Processes the uploaded Excel file stream:
    1. Determines sheet type using DB mapping.
    2. Fetches field configuration from DB (using ORM versions).
    3. Validates and maps columns.
    4. Cleans data.
    5. Checks if all employees (by Name) exist in the 'employees' table (using ORM version).
    6. Adds metadata (including pay_period_identifier).
    7. Writes valid data for the sheet to the staging table ('staging.raw_salary_data_staging').
       ***NOTE: This target needs to be dynamic based on sheet type later!***
    Returns a dictionary summarizing results for each sheet.
    """
    overall_result = {
        "message": "文件处理已启动",
        "batch_id": upload_id,
        "sheet_results": []
    }
    sheets_with_errors = 0
    sheets_processed_successfully = 0
    sheets_skipped = 0
    total_rows_written = 0

    try:
        # Read the entire file content into memory first
        file_content = file_stream.read()
        # 自动判断engine
        engine = None
        if filename:
            if filename.lower().endswith('.xlsx'):
                engine = 'openpyxl'
            elif filename.lower().endswith('.xls'):
                engine = 'xlrd'
        try:
            excel_file = pd.ExcelFile(BytesIO(file_content), engine=engine)
        except Exception as e:
            logger.error(f"Excel文件读取失败: {e}", exc_info=True)
            overall_result["message"] = f"处理失败：无法读取Excel文件 ({e})"
            return overall_result
        # Use the ORM version now
        sheet_mappings = get_sheet_name_mapping(db) 
    except ValueError as config_err: # Catch errors from get_sheet_name_mapping
         logger.error(f"Failed to load initial configuration: {config_err}", exc_info=True)
         overall_result["message"] = f"处理失败：无法加载数据库配置 ({config_err})"
         return overall_result # Cannot proceed without mappings
    except Exception as file_read_err:
        logger.error(f"Failed to read Excel file stream: {file_read_err}", exc_info=True)
        overall_result["message"] = f"处理失败：无法读取上传的 Excel 文件 ({file_read_err})"
        return overall_result

    for sheet_name in excel_file.sheet_names:
        sheet_result = {
            "sheet": sheet_name,
            "status": "skipped", # Default status
            "message": "未处理",
            "details": {}
        }
        logger.info(f"Processing sheet: '{sheet_name}' for batch ID: {upload_id}")

        try:
            # 1. Determine Processing Info (Type Key and Target Table)
            processing_info = get_sheet_processing_info(str(sheet_name), sheet_mappings) # Call renamed function
            
            # Refined check: ensure processing_info exists and target_table is a non-empty string
            if not processing_info or not isinstance(processing_info.get('target_table'), str) or not processing_info.get('target_table'):
                sheet_result["message"] = "无法识别的工作表类型或未配置有效的目标暂存表名"
                logger.warning(f"Skipping sheet '{sheet_name}'. Reason: {sheet_result['message']}")
                sheets_skipped += 1
                overall_result["sheet_results"].append(sheet_result)
                continue
                
            employee_type_key = processing_info['type_key']
            # Use typing.cast to assure the type checker
            target_table_name = typing.cast(str, processing_info['target_table'])
            target_schema = 'staging' # Assuming all targets are in staging
            logger.info(f"Sheet '{sheet_name}' identified as type '{employee_type_key}', target table: '{target_schema}.{target_table_name}'")

            # 2. Fetch Field Configuration (Uses ORM version)
            try:
                field_config = get_field_config(db, employee_type_key)
                if not field_config.get('column_mapping_cn_to_db'):
                    sheet_result["message"] = f"未找到类型 '{employee_type_key}' 的字段配置"
                    sheet_result["status"] = "error"
                    sheets_with_errors += 1
                    overall_result["sheet_results"].append(sheet_result)
                    continue
            except ValueError as config_err:
                 sheet_result["message"] = f"加载类型 '{employee_type_key}' 的配置时出错: {config_err}"
                 sheet_result["status"] = "error"
                 sheets_with_errors += 1
                 overall_result["sheet_results"].append(sheet_result)
                 continue

            # 3. Read and Validate/Map Columns
            try:
                 df_original = pd.read_excel(excel_file, sheet_name=sheet_name, dtype=str, keep_default_na=False)
                 df_original = df_original.replace({'': None})
                 df_original.columns = df_original.columns.str.strip()

                 if df_original.empty:
                     sheet_result["message"] = "工作表为空"
                     sheet_result["status"] = "warning"
                     sheets_skipped += 1
                     overall_result["sheet_results"].append(sheet_result)
                     continue 

                 mapped_df, missing_required_cn, unexpected_columns_cn = validate_and_map_columns(df_original, field_config)
                 sheet_result["details"]["unexpected_columns"] = unexpected_columns_cn

                 if missing_required_cn:
                     sheet_result["message"] = f"缺少必需的列: {', '.join(missing_required_cn)}"
                     sheet_result["status"] = "error"
                     sheet_result["details"]["missing_required"] = missing_required_cn
                     sheets_with_errors += 1
                     overall_result["sheet_results"].append(sheet_result)
                     continue

            except Exception as read_val_err:
                 logger.error(f"Error reading/validating sheet '{sheet_name}': {read_val_err}", exc_info=True)
                 sheet_result["message"] = f"读取或验证工作表时出错: {read_val_err}"
                 sheet_result["status"] = "error"
                 sheets_with_errors += 1
                 overall_result["sheet_results"].append(sheet_result)
                 continue

            # 4. Clean Data
            cleaned_df = clean_data(mapped_df.copy())

            # 5. Check Employee Existence (using Name) (Uses ORM version)
            try:
                check_successful, check_errors, df_with_id = check_employee_existence(cleaned_df, field_config, db)
                if not check_successful:
                    error_messages = []
                    if "not_found" in check_errors: error_messages.append(f"姓名未找到: {', '.join(check_errors['not_found'])}")
                    if "duplicates" in check_errors: error_messages.append(f"姓名重复: {', '.join(check_errors['duplicates'])}")
                    if "config_error" in check_errors: error_messages.append(f"配置错误: {', '.join(check_errors['config_error'])}")
                    if "missing_column" in check_errors: error_messages.append(f"列缺失错误: {', '.join(check_errors['missing_column'])}")
                    if "mapping_error" in check_errors: error_messages.append(f"内部映射错误: {', '.join(check_errors['mapping_error'])}")
                    
                    sheet_result["message"] = f"员工校验失败. {'; '.join(error_messages)}"
                    sheet_result["status"] = "error"
                    sheet_result["details"]["employee_check_errors"] = check_errors
                    sheets_with_errors += 1
                    overall_result["sheet_results"].append(sheet_result)
                    continue
                else:
                     final_cleaned_df = df_with_id
                     logger.debug(f"Columns in DataFrame before add_metadata for sheet '{sheet_name}': {final_cleaned_df.columns.tolist()}")
            except ValueError as emp_check_err: 
                 sheet_result["message"] = f"检查员工是否存在时出错: {emp_check_err}"
                 sheet_result["status"] = "error"
                 sheets_with_errors += 1
                 overall_result["sheet_results"].append(sheet_result)
                 continue

            # 6. Add Metadata & Align Columns with Table Schema
            try:
                inspector = inspect(db.get_bind())
                # Use dynamic target_table_name and target_schema
                target_schema = 'staging' # Define target schema
                staging_columns = [col['name'] for col in inspector.get_columns(target_table_name, schema=target_schema)] 
                logger.debug(f"Target table '{target_schema}.{target_table_name}' columns: {staging_columns}")

                # Add metadata BEFORE aligning columns, so metadata columns are considered
                final_df_with_meta = add_metadata(final_cleaned_df.copy(), upload_id, employee_type_key, pay_period, validation_status='valid')
                
                # Align DataFrame columns with the actual target table columns
                current_df_cols = set(final_df_with_meta.columns)
                table_cols_set = set(staging_columns)

                # Add missing table columns to DataFrame (as None)
                cols_to_add = list(table_cols_set - current_df_cols)
                if cols_to_add:
                    logger.debug(f"Adding missing target table columns to DataFrame for sheet '{sheet_name}': {cols_to_add}")
                    for col in cols_to_add:
                        final_df_with_meta[col] = None
                    
                # Identify and drop columns in DataFrame not present in the target table
                cols_to_drop = list(current_df_cols - table_cols_set)
                if cols_to_drop:
                    final_df_aligned = final_df_with_meta.drop(columns=cols_to_drop)
                    logger.warning(f"Dropped columns from DataFrame not in target table '{target_schema}.{target_table_name}' for sheet '{sheet_name}': {cols_to_drop}")
                else:
                    final_df_aligned = final_df_with_meta

                # Ensure final DataFrame columns are in the same order as the table
                # Filter staging_columns to only include those present in the final_df_aligned
                final_columns_order = [col for col in staging_columns if col in final_df_aligned.columns]
                final_df = final_df_aligned[final_columns_order]
                logger.debug(f"Final DataFrame columns after alignment for sheet '{sheet_name}': {final_df.columns.tolist()}")

            except Exception as meta_align_err:
                logger.error(f"Error adding metadata or aligning columns for sheet '{sheet_name}': {meta_align_err}", exc_info=True)
                sheet_result["message"] = f"处理元数据时出错: {meta_align_err}"
                sheet_result["status"] = "error"
                sheets_with_errors += 1
                overall_result["sheet_results"].append(sheet_result)
                continue

            # 7. Write to Database
            try:
                if final_df.empty:
                    logger.warning(f"DataFrame for sheet '{sheet_name}' is empty before writing. Skipping write.")
                    sheet_result["message"] = "处理成功，但工作表数据为空或不符合要求，未写入任何行"
                    sheet_result["status"] = "success" # Or 'warning' depending on how you want to treat empty sheets
                    # sheets_processed_successfully += 1 # only count if actual rows written
                else:
                    logger.info(f"Attempting to write {len(final_df)} rows from sheet '{sheet_name}' to {target_schema}.{target_table_name} via _write_dataframe_to_db.")
                    _write_dataframe_to_db(df=final_df, table_name=target_table_name, db=db, schema=target_schema)
                    
                    # --- NEW: Transaction Health Check --- 
                    try:
                        db.flush() # Attempt to flush changes for this sheet to the DB connection buffer
                        db.execute(text("SELECT 1")) # Execute a simple query to check if transaction is alive
                        logger.info(f"DB flush and test query successful after writing sheet '{sheet_name}'. Transaction appears healthy.")
                        # If flush and test query passed, then we can consider this sheet's write truly successful at this stage
                        sheet_result["message"] = f"成功处理并导入 {len(final_df)} 行"
                        sheet_result["status"] = "success"
                        sheets_processed_successfully += 1
                        total_rows_written += len(final_df)
                        # logger.info(f"Successfully wrote data from sheet '{sheet_name}'.") # Logged inside _write_dataframe_to_db
                    except Exception as post_write_check_err:
                        logger.error(f"CRITICAL: Transaction ABORTED or flush failed AFTER writing sheet '{sheet_name}'. Error: {post_write_check_err}", exc_info=True)
                        sheet_result["message"] = f"写入数据库后事务中止或刷新失败: {post_write_check_err}"
                        sheet_result["status"] = "error"
                        # sheets_with_errors incremented by the outer except block
                        raise # Re-raise to be caught by the outer try-except in this loop iteration
                    # --- END: Transaction Health Check ---

            except Exception as sheet_write_err: # Catches errors from _write_dataframe_to_db or the new health check
                # Ensure status is error if not already set by health check's re-raise
                if sheet_result.get("status") != "error":
                    logger.error(f"Error during DB write or post-write check for sheet '{sheet_name}': {sheet_write_err}", exc_info=True)
                    sheet_result["message"] = f"写入或写入后检查时出错: {sheet_write_err}"
                    sheet_result["status"] = "error"
                
                sheets_with_errors += 1
                # The sheet_result is appended outside this try/except in the main loop to avoid duplicates
                # However, if an exception occurs here, it will propagate up, and the router will rollback.
                # The main loop needs to ensure this sheet_result (with error status) is the one added.
                # Re-raise the exception to ensure the main processing loop for this sheet is aborted
                # and the router-level transaction management handles rollback.
                raise sheet_write_err

        except Exception as sheet_proc_err:
            logger.error(f"Unexpected error processing sheet '{sheet_name}': {sheet_proc_err}", exc_info=True)
            # Ensure status is error if not already set
            if sheet_result.get("status") != "error":
                sheet_result["message"] = f"处理工作表时发生意外错误: {sheet_proc_err}"
                sheet_result["status"] = "error"
            sheets_with_errors += 1
            # No re-raise here, just record the error and continue to next sheet, 
            # but the has_fatal_error flag will prevent consolidation.

        # Append sheet_result (it will have success or error status from above blocks)
        # This logic should ensure only one result per sheet is added.
        # Check if a result for this sheet (possibly an earlier error) already exists
        existing_sr_index = -1
        for idx, sr in enumerate(overall_result["sheet_results"]):
            if sr['sheet'] == sheet_name:
                existing_sr_index = idx
                break
        if existing_sr_index != -1:
            # If an error was recorded, it should take precedence or be updated
            if overall_result["sheet_results"][existing_sr_index].get("status") != "error" or sheet_result.get("status") == "error":
                 overall_result["sheet_results"][existing_sr_index].update(sheet_result)
        else:
            overall_result["sheet_results"].append(sheet_result)
    
    # --- Consolidation Step --- START ---
    # 检查是否有任何工作表处理失败
    has_fatal_error = any(result.get('status') == 'error' for result in overall_result["sheet_results"])
    
    if not has_fatal_error and overall_result["sheet_results"]: # 只有在没有致命错误且至少处理了一个工作表时才合并
        logger.info(f"所有工作表初步处理完成，批次 {upload_id} 没有致命错误，尝试合并数据...")
        try:
            _consolidate_staging_data(db=db, batch_id=upload_id, pay_period=pay_period)
            overall_result['consolidation_status'] = 'success'
            overall_result['message'] = overall_result.get('message', '') + " 数据合并成功。"
            logger.info(f"批次 {upload_id} 数据合并成功。")
        except Exception as consolidation_err:
            logger.error(f"合并批次 {upload_id} 数据失败: {consolidation_err}", exc_info=True)
            # 将合并失败信息添加到结果中，但不覆盖原始的工作表处理信息
            overall_result['consolidation_status'] = 'error'
            overall_result['consolidation_error'] = f"数据合并步骤失败: {consolidation_err}"
            overall_result['message'] = overall_result.get('message', '') + " 但数据合并步骤失败。"
            # 注意：因为这里抛出了异常，所以路由器的 finally 块应该会回滚事务
            raise Exception(f"数据合并失败: {consolidation_err}") # 重新抛出异常以确保事务回滚
    elif has_fatal_error:
         logger.warning(f"批次 {upload_id} 存在工作表处理错误，跳过数据合并步骤。")
         overall_result['consolidation_status'] = 'skipped_due_to_errors'
    else: # sheet_results is empty
        logger.info(f"批次 {upload_id} 没有处理任何工作表，跳过数据合并步骤。")
        overall_result['consolidation_status'] = 'skipped_no_sheets'
    # --- Consolidation Step --- END ---

    # Return final overall result including sheet details and consolidation status
    return overall_result

# ... (Ensure necessary models are defined in models.py/models_db.py) ...

# --- Define SheetNameMapping Model (Example - should be in models.py/models_db.py) ---
# class SheetNameMapping(Base):
#     __tablename__ = 'sheet_name_mappings'
#     __table_args__ = {'schema': 'core'}
#     sheet_name = Column(String, primary_key=True)
#     employee_type_key = Column(String(50), nullable=False)

# --- Define SalaryFieldMapping Model (Example - should be in models.py/models_db.py) ---
# class SalaryFieldMapping(Base):
#     __tablename__ = 'salary_field_mappings'
#     __table_args__ = {'schema': 'core'}
#     id = Column(Integer, Identity(always=False), primary_key=True)
#     source_name = Column(String(255), nullable=False, unique=True)
#     target_name = Column(String(255), nullable=False, unique=True)
#     is_intermediate = Column(Boolean, nullable=True)
#     is_final = Column(Boolean, nullable=True)
#     description = Column(Text, nullable=True)
#     data_type = Column(String(50), nullable=True)

# --- EmployeeTypeFieldRule should already be in models.py ---

# --- Employee should already be in models.py ---