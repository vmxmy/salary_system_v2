import pandas as pd
import json
import logging
import os
from typing import Dict, List, Tuple
import re
from datetime import datetime
import psycopg2
from psycopg2.extras import RealDictCursor
from sqlalchemy.orm import Session
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

# Configure basic logging if needed within the module,
# or rely on FastAPI's logging configuration.
# Using basicConfig here might interfere if FastAPI already configured root logger.
# Consider getting a logger instance: logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__) # Get a logger for this module

# Define known prefixes (Copied from rename_csv_headers.py)
KNOWN_PREFIXES = ["job_attr_", "salary_", "deduct_", "contrib_", "other_"]

# --- Configuration Constants (from preprocess script) ---
# Note: Logging setup might need consolidation if used by both parts
SALARY_DETAIL_SHEET_PATTERN = r'工资明细-(.+)'
DEDUCTION_CONTRIB_SHEET_NAMES = ['医疗保险', '养老保险', '职业年金', '住房公积金']
SHEETS_TO_IGNORE = ['汇总', 'Summary', '员工信息']
KEY_JOIN_COLUMN_STAGING = 'id_card_number' # This is the intermediate name after first mapping
POTENTIAL_NAME_COLUMNS_EXCEL = ['姓名', '人员姓名']
NAME_COLUMN_STAGING = 'employee_name' # This is the intermediate name after first mapping

# --- Database Mapping Function --- START
def get_field_mapping_from_db(db: Session) -> Dict[str, str]:
    """
    Fetches the source_name -> target_name mapping from the database 
    using SQLAlchemy Session.
    Prioritizes mappings marked as 'is_final'.
    """
    mapping = {}
    query = text("""
        SELECT source_name, target_name 
        FROM public.salary_field_mappings 
        WHERE is_final = TRUE -- Prioritize final mappings
        ORDER BY source_name; -- Optional: order for consistency 
    """)
    try:
        result = db.execute(query)
        for row in result.fetchall():
            # Ensure we handle potential None values if the query could return them
            source, target = row[0], row[1]
            if source and target:
                mapping[source] = target
            else:
                 logger.warning(f"Found mapping row with None value: Source='{source}', Target='{target}'")
        
        # Optionally fetch intermediate mappings if needed as fallback (complex logic)
        # ... fetch where is_intermediate = TRUE ...
        # ... merge logic if needed ...

        logger.info(f"Fetched {len(mapping)} final field mappings from database.")
        return mapping
    except SQLAlchemyError as e:
        logger.error(f"SQLAlchemy error fetching field mappings: {e}", exc_info=True)
        return {} # Return empty dict on error
    except Exception as e:
        logger.error(f"Unexpected error fetching field mappings: {e}", exc_info=True)
        return {}

def rename_dataframe_headers(df: pd.DataFrame, db: Session) -> pd.DataFrame:
    """
    Renames DataFrame headers based on the mapping fetched from the database using SQLAlchemy Session.
    Handles potential missing columns and applies final renaming.
    """
    logger.info("Starting final header renaming using DB mapping.")
    # Get mapping from DB (uses SQLAlchemy Session)
    db_mapping = get_field_mapping_from_db(db)
    
    if not db_mapping:
        logger.error("Failed to fetch mapping from DB or mapping is empty. Cannot rename headers.")
        # Decide behavior: return original df? Raise error? For now, return original.
        return df

    # Create rename map based on current columns and DB mapping
    rename_map = {}
    current_columns = df.columns.tolist()
    logger.debug(f"Columns before final rename: {current_columns}")
    
    for intermediate_col_name in current_columns:
        final_col_name = db_mapping.get(intermediate_col_name)
        if final_col_name:
            rename_map[intermediate_col_name] = final_col_name
            logger.debug(f"Mapping intermediate '{intermediate_col_name}' to final '{final_col_name}'")
        else:
            # Decide how to handle columns not in mapping: keep original? Drop? Log warning?
            # Let's keep them for now but log a warning.
            logger.warning(f"Column '{intermediate_col_name}' not found in final DB mapping. Keeping original name.")
            # Optionally, add to rename_map to keep original explicitly: rename_map[intermediate_col_name] = intermediate_col_name

    # Apply renaming
    try:
        df_renamed = df.rename(columns=rename_map)
        logger.info("Header renaming applied based on DB mapping.")
        logger.debug(f"Columns after final rename: {df_renamed.columns.tolist()}")
        return df_renamed
    except Exception as e:
        logger.error(f"Error applying rename map: {e}", exc_info=True)
        # Return the DataFrame before attempting rename on error
        return df 

# --- Helper Functions (from preprocess script) ---
def get_pay_period_from_filename(filename):
    """从文件名提取工资周期 (e.g., YYYY-MM)"""
    basename = os.path.basename(filename)
    # Try YYYY-MM or YYYYMM format
    match = re.search(r'(\d{4})[-_]?(\d{2})', basename)
    if match:
        year, month = int(match.group(1)), int(match.group(2))
        if 2000 < year < 2100 and 1 <= month <= 12:
            return f"{year}-{month:02d}"
    # Try extracting from full path if filename fails (e.g., containing folders)
    match_path = re.search(r'/(\d{4})[-_]?(\d{2})/', filename) # Look for /YYYY-MM/
    if match_path:
        year, month = int(match_path.group(1)), int(match_path.group(2))
        if 2000 < year < 2100 and 1 <= month <= 12:
            logger.info(f"Extracted period from path: {filename}")
            return f"{year}-{month:02d}"

    logger.warning(f"Could not extract pay period (YYYY-MM) from filename/path: {filename}")
    # Fallback to current month if extraction fails?
    # return datetime.now().strftime('%Y-%m')
    return None # Return None if extraction fails

def get_common_column_mapping():
    # Maps Excel Chinese names to intermediate English names (before final rename)
    return {
        '身份证号': KEY_JOIN_COLUMN_STAGING,
        '工号': 'employee_unique_id',
        '编制': 'establishment_type_name',
        '备注': 'other_备注', # Keep prefix for potential later mapping
    }

def get_salary_and_jobattr_mapping(establishment_type=None):
    # Maps Excel Chinese names to intermediate English names (before final rename)
    # Uses prefixes for categorization
    mapping = {}
    job_attr_map = {
        '人员身份': 'job_attr_人员身份', '人员职级': 'job_attr_人员职级', '岗位类别': 'job_attr_岗位类别',
        '参照正编岗位工资级别': 'job_attr_参照正编岗位工资级别', '参照正编薪级工资级次': 'job_attr_参照正编薪级工资级次',
        '工资级别': 'job_attr_工资级别', '工资档次': 'job_attr_工资档次', '固定薪酬全年应发数': 'job_attr_固定薪酬全年应发数',
    }
    salary_comp_map = {
        '一次性补扣发': 'salary_一次性补扣发', '基础绩效奖补扣发': 'salary_基础绩效奖补扣发',
        '职务/技术等级工资': 'salary_职务技术等级工资', '级别/岗位级别工资': 'salary_级别岗位级别工资',
        '93年工改保留补贴': 'salary_93年工改保留补贴', '独生子女父母奖励金': 'salary_独生子女父母奖励金',
        '岗位职务补贴': 'salary_岗位职务补贴', '公务员规范性津贴补贴': 'salary_公务员规范性津贴补贴',
        '公务交通补贴': 'salary_公务交通补贴', '基础绩效奖': 'salary_基础绩效奖', '见习试用期工资': 'salary_见习试用期工资',
        '信访工作人员岗位津贴': 'salary_信访工作人员岗位津贴', '奖励绩效补扣发': 'salary_奖励绩效补扣发',
        '岗位工资': 'salary_岗位工资', '薪级工资':'salary_薪级工资', '月基础绩效': 'salary_月基础绩效',
        '月奖励绩效': 'salary_月奖励绩效', '基本工资': 'salary_基本工资', '绩效工资': 'salary_绩效工资',
        '其他补助': 'salary_其他补助', '补发工资': 'salary_补发工资', '津贴': 'salary_津贴',
        '补助': 'salary_补助', '信访岗位津贴': 'salary_信访岗位津贴',
        '补扣发合计': 'salary_补扣发合计', '生活津贴': 'salary_生活津贴',
        '季度考核绩效奖': 'salary_季度考核绩效奖',
        '补发薪级合计': 'salary_补发薪级合计',
        '补发合计': 'salary_total_backpay_amount' 
    }
    mapping.update(job_attr_map)
    mapping.update(salary_comp_map)
    mapping.update(get_common_column_mapping()) # Add common mappings (ID, Name, Remark etc.)
    return mapping

def get_deduction_contrib_mapping(sheet_name):
    # Maps Excel Chinese names to intermediate English names (before final rename)
    mapping = {}
    if sheet_name == '医疗保险':
        mapping.update({
            '单位应缴费额': 'contrib_单位缴医疗保险费',
            '个人应缴费额': 'deduct_个人缴医疗保险费',
        })
    elif sheet_name == '养老保险':
         mapping.update({
            '单位应缴费额': 'contrib_单位缴养老保险费',
            '个人应缴费额': 'deduct_个人缴养老保险费',
         })
    elif sheet_name == '职业年金':
         mapping.update({
            '单位应缴费额': 'contrib_单位缴职业年金',
            '个人应缴费额': 'deduct_个人缴职业年金',
         })
    elif sheet_name == '住房公积金':
         mapping.update({
             '单位应缴费额': 'contrib_单位缴住房公积金',
             '个人应缴费额': 'deduct_个人缴住房公积金',
         })
    # Add mappings for other potential sheets if needed
    return mapping

def normalize_dataframe(df: pd.DataFrame, sheet_name: str, establishment_type: str = None, is_deduction_contrib: bool = False) -> Tuple[pd.DataFrame, List[str]]:
    """Normalizes a single sheet's DataFrame based on its type."""
    logger.debug(f"[{sheet_name}] Normalizing dataframe. Is deduction/contrib: {is_deduction_contrib}")
    if is_deduction_contrib:
        mapping = get_deduction_contrib_mapping(sheet_name)
        logger.debug(f"[{sheet_name}] Using DEDUCTION mapping: {mapping}")
    else:
        mapping = get_salary_and_jobattr_mapping(establishment_type)
        logger.debug(f"[{sheet_name}] Using SALARY mapping for type '{establishment_type}': {mapping}")

    # --- Dynamic Name & ID Mapping Logic (from preprocess script) ---
    original_columns = df.columns.tolist()
    logger.info(f"[{sheet_name}] Columns BEFORE normalization: {original_columns}")
    df = df.copy() # Ensure we work on a copy
    df.columns = df.columns.astype(str).str.strip() # Ensure columns are strings and stripped
    excel_headers_lower_map = {col.lower(): col for col in df.columns}
    rename_map = {}
    mapped_target_cols = []
    found_name_col_excel = None

    # Map Name first
    for potential_name in POTENTIAL_NAME_COLUMNS_EXCEL:
        excel_header = excel_headers_lower_map.get(potential_name.lower())
        if excel_header:
            logger.info(f"[{sheet_name}] Found name column '{excel_header}', mapping to '{NAME_COLUMN_STAGING}'.")
            rename_map[excel_header] = NAME_COLUMN_STAGING
            mapped_target_cols.append(NAME_COLUMN_STAGING)
            found_name_col_excel = excel_header # Store the original Excel header found
            break
    if not found_name_col_excel:
         logger.warning(f"[{sheet_name}] Could not find any potential name column {POTENTIAL_NAME_COLUMNS_EXCEL}. Name column might be missing.")

    # Process other mappings
    logger.debug(f"[{sheet_name}] Processing other mappings...")
    for map_key, map_value in mapping.items():
        # Skip if it's the name column we already handled
        if found_name_col_excel and map_key.lower() == found_name_col_excel.lower():
            continue
        # Skip if it's another potential name key (prevent accidental mapping)
        if map_key in POTENTIAL_NAME_COLUMNS_EXCEL:
            continue

        excel_header = excel_headers_lower_map.get(map_key.lower())
        if excel_header:
            # Avoid remapping if the target is already the name column
            if map_value == NAME_COLUMN_STAGING and found_name_col_excel:
                 logger.debug(f"[{sheet_name}] Skipping mapping for '{excel_header}' to '{map_value}' as name is already mapped.")
                 continue
            logger.debug(f"[{sheet_name}] Mapping '{excel_header}' to '{map_value}'")
            rename_map[excel_header] = map_value
            mapped_target_cols.append(map_value)

    logger.debug(f"[{sheet_name}] Final rename map for first stage: {rename_map}")
    df.rename(columns=rename_map, inplace=True)
    current_cols = df.columns.tolist()
    logger.info(f"[{sheet_name}] Columns AFTER first stage rename: {current_cols}")
    unique_mapped_targets = list(set(mapped_target_cols))

    # Check for required columns AFTER normalization
    if NAME_COLUMN_STAGING not in current_cols:
        logger.error(f"CRITICAL [{sheet_name}]: Intermediate name column ('{NAME_COLUMN_STAGING}') not found after normalization. Skipping sheet.")
        return None, []
    if not is_deduction_contrib and KEY_JOIN_COLUMN_STAGING not in current_cols:
        logger.error(f"CRITICAL [{sheet_name}]: Intermediate ID Card column ('{KEY_JOIN_COLUMN_STAGING}') missing for SALARY sheet. Skipping sheet.")
        return None, []

    # Add establishment type if missing and relevant
    if not is_deduction_contrib and 'establishment_type_name' not in current_cols:
        if establishment_type:
             df['establishment_type_name'] = establishment_type
             logger.info(f"[{sheet_name}] Added establishment_type_name column with value: {establishment_type}")
        else:
             logger.warning(f"[{sheet_name}] Salary sheet missing establishment type name.")
             df['establishment_type_name'] = "Unknown"

    logger.info(f"[{sheet_name}] Normalization successful.")
    return df, unique_mapped_targets

def process_excel_to_dataframe(excel_file_path: str, pay_period: str = None) -> pd.DataFrame | None:
    """
    Processes an Excel file, reads sheets, normalizes, and merges them
    into a single Pandas DataFrame with intermediate (Chinese + prefix) headers.

    Args:
        excel_file_path: Path to the input Excel file.
        pay_period: The pay period (YYYY-MM). If None, attempts extraction from filename.

    Returns:
        A Pandas DataFrame containing the combined and processed data, or None if processing fails.
    """
    if pay_period is None:
        pay_period = get_pay_period_from_filename(excel_file_path)
        if pay_period is None:
             logger.error(f"Pay period could not be determined for file: {excel_file_path}. Aborting.")
             return None # Cannot proceed without pay period

    logger.info(f"Processing Excel file: {excel_file_path} for period: {pay_period}")
    salary_dataframes = []
    deduction_contrib_dataframes = {} # {sheet_name: df}

    try:
        # Use openpyxl engine
        excel_sheets = pd.read_excel(excel_file_path, sheet_name=None, header=0, dtype=str, engine='openpyxl')
        logger.info(f"Found sheets: {list(excel_sheets.keys())}")

        for sheet_name, df in excel_sheets.items():
            logger.info(f"--- Processing sheet: '{sheet_name}' ---")
            df_copy = df.copy()
            # Skip ignored sheets
            if any(pattern in sheet_name for pattern in SHEETS_TO_IGNORE):
                logger.info(f"Ignoring sheet '{sheet_name}'.")
                continue
            if df_copy.empty:
                 logger.info(f"Skipping empty sheet: '{sheet_name}'.")
                 continue

            # --- Initial Key Check & NaN Drop (from preprocess script) ---
            is_deduction_sheet_type = sheet_name in DEDUCTION_CONTRIB_SHEET_NAMES
            required_raw_keys = POTENTIAL_NAME_COLUMNS_EXCEL if is_deduction_sheet_type else ['身份证号'] + POTENTIAL_NAME_COLUMNS_EXCEL
            found_required_raw_key = False
            key_to_check = None
            for raw_key in required_raw_keys:
                 if raw_key in df_copy.columns:
                      if not df_copy[raw_key].isnull().all():
                           logger.info(f"[{sheet_name}] Using '{raw_key}' as the key for initial NaN drop.")
                           found_required_raw_key = True
                           key_to_check = raw_key
                           break
            if not found_required_raw_key:
                 logger.warning(f"[{sheet_name}] Could not find any required raw key with data in {required_raw_keys}. Skipping sheet.")
                 continue

            initial_rows = len(df_copy)
            df_copy.dropna(subset=[key_to_check], inplace=True)
            final_rows = len(df_copy)
            logger.info(f"[{sheet_name}] Rows before dropna on '{key_to_check}': {initial_rows}, after: {final_rows}.")
            if df_copy.empty:
                 logger.warning(f"[{sheet_name}] Sheet empty after NaN drop. Skipping.")
                 continue
            # --- End Key Check ---

            # Identify sheet type
            establishment_type = None
            is_salary_sheet = False
            is_deduction_contrib = sheet_name in DEDUCTION_CONTRIB_SHEET_NAMES

            salary_match = re.match(SALARY_DETAIL_SHEET_PATTERN, sheet_name)
            if salary_match:
                establishment_type = salary_match.group(1).strip()
                is_salary_sheet = True
                logger.info(f"Identified SALARY sheet: '{sheet_name}'. Type: '{establishment_type}'.")
            elif is_deduction_contrib:
                 logger.info(f"Identified DEDUCTION/CONTRIB sheet: '{sheet_name}'.")
            else:
                 logger.warning(f"Sheet '{sheet_name}' type unknown. Skipping.")
                 continue

            # Normalize the dataframe for this sheet
            df_normalized, mapped_targets = normalize_dataframe(
                df_copy, sheet_name, establishment_type=establishment_type, is_deduction_contrib=is_deduction_contrib
            )

            if df_normalized is None:
                logger.error(f"Normalization failed for sheet '{sheet_name}'. Skipping.")
                continue

            # Process based on sheet type
            if is_salary_sheet:
                df_normalized['_airbyte_source_file'] = os.path.basename(excel_file_path)
                df_normalized['_airbyte_source_sheet'] = sheet_name
                df_normalized['pay_period_identifier'] = pay_period
                salary_dataframes.append(df_normalized)
            elif is_deduction_contrib:
                logger.info(f"Processing post-normalization steps for DEDUCTION/CONTRIB sheet: '{sheet_name}'")

                # --- Added Logic: Filter columns for deduction/contrib sheets ---
                if NAME_COLUMN_STAGING not in df_normalized.columns:
                     logger.error(f"CRITICAL [{sheet_name}]: Normalized deduction sheet missing required name column '{NAME_COLUMN_STAGING}'. Skipping merge for this sheet.")
                     continue # Skip this sheet if name column is missing after normalization

                cols_to_keep = [NAME_COLUMN_STAGING]
                for col in df_normalized.columns:
                    if col.startswith('deduct_') or col.startswith('contrib_'):
                        cols_to_keep.append(col)
                
                # Remove duplicates while preserving order (important for NAME_COLUMN_STAGING at the start)
                cols_to_keep = list(dict.fromkeys(cols_to_keep)) 

                if len(cols_to_keep) <= 1: # Only name column present
                    logger.warning(f"[{sheet_name}] No deduct_ or contrib_ columns found after normalization. Skipping merge for this sheet.")
                    continue

                logger.info(f"[{sheet_name}] Selecting columns for merge: {cols_to_keep}")
                df_filtered = df_normalized[cols_to_keep].copy()
                # --- End Added Logic ---

                # Check for duplicate names *after* filtering, as it's crucial for the merge key
                duplicate_names_df = df_filtered[df_filtered.duplicated(subset=[NAME_COLUMN_STAGING], keep=False)]
                if not duplicate_names_df.empty:
                    duplicate_names_list = duplicate_names_df[NAME_COLUMN_STAGING].unique().tolist()
                    error_message = f"FATAL ERROR: Duplicate names in sheet '{sheet_name}' of '{os.path.basename(excel_file_path)}': {duplicate_names_list}. Aborting."
                    logger.error(error_message)
                    # Raise error to be caught by the main API endpoint
                    raise ValueError(error_message)

                # Use the filtered dataframe
                deduction_contrib_dataframes[sheet_name] = df_filtered
                logger.debug(f"[{sheet_name}] Example Deduction row data (filtered): {df_filtered.head(1).to_dict('records')}")
                # --- End Post-Normalization Logic (Modified) ---

        # --- Merge DataFrames --- (Adapted from preprocess script)
        if not salary_dataframes:
            logger.warning(f"No valid salary detail data processed from file {excel_file_path}. Returning None.")
            return None

        # Combine all salary sheets first
        combined_salary_df = pd.concat(salary_dataframes, ignore_index=True, sort=False)
        # Deduplicate based on ID and period (if ID exists)
        if KEY_JOIN_COLUMN_STAGING in combined_salary_df.columns:
            combined_salary_df.drop_duplicates(subset=[KEY_JOIN_COLUMN_STAGING, 'pay_period_identifier'], keep='first', inplace=True)
            logger.info(f"Combined {len(combined_salary_df)} unique salary rows (by ID & Period)")
        else:
            logger.warning(f"Key join column '{KEY_JOIN_COLUMN_STAGING}' not found in combined salary df. Deduplication skipped.")
            logger.info(f"Combined {len(combined_salary_df)} salary rows.")


        final_df = combined_salary_df
        # Merge deduction/contribution sheets using the intermediate NAME column
        if deduction_contrib_dataframes:
            logger.info(f"Merging deduction/contribution data using '{NAME_COLUMN_STAGING}'. Start rows: {len(final_df)}")
            merged_df = final_df
            for i, right_df in enumerate(deduction_contrib_dataframes.values()):
                sheet_name = list(deduction_contrib_dataframes.keys())[i]
                logger.debug(f"Merging with {sheet_name} on '{NAME_COLUMN_STAGING}'")
                if NAME_COLUMN_STAGING not in merged_df.columns:
                     logger.error(f"CRITICAL: Left side missing merge key '{NAME_COLUMN_STAGING}' before merging {sheet_name}. Aborting merge step.")
                     # Return the combined salary df without deduction merges if key is missing
                     return merged_df
                if NAME_COLUMN_STAGING not in right_df.columns:
                    logger.warning(f"Cannot merge '{sheet_name}', lacks key '{NAME_COLUMN_STAGING}'. Skipping.")
                    continue

                # Ensure merge key is unique on the right side before merging
                if right_df.duplicated(subset=[NAME_COLUMN_STAGING]).any():
                    logger.warning(f"Duplicate keys ('{NAME_COLUMN_STAGING}') found in right DataFrame ('{sheet_name}'). Merge might produce unexpected results.")
                    # Consider dropping duplicates or raising error depending on requirement
                    # right_df = right_df.drop_duplicates(subset=[NAME_COLUMN_STAGING], keep='first')

                merged_df = pd.merge(merged_df, right_df, on=NAME_COLUMN_STAGING, how='left', suffixes=("", f"_DUPLICATE_{sheet_name}")) # Add suffix to avoid potential column name collisions
                logger.debug(f"Rows after merging {sheet_name}: {len(merged_df)}")
            final_df = merged_df
            logger.info(f"Final merged dataframe size: {len(final_df)} rows.")

        # Optional: Add column type conversions here if needed before returning?
        # Example: Convert numeric columns
        # for col in final_df.select_dtypes(include=['object']).columns:
        #     if col.startswith('salary_') or col.startswith('deduct_') or col.startswith('contrib_'):
        #         final_df[col] = pd.to_numeric(final_df[col], errors='coerce')

        logger.info(f"Successfully processed Excel file. Returning combined DataFrame.")
        return final_df

    except ValueError as ve:
        logger.error(f"Error during processing (likely duplicate names): {ve}")
        raise ve # Re-raise to be caught by API endpoint
    except FileNotFoundError:
        logger.error(f"Excel file not found at: {excel_file_path}")
        raise # Re-raise
    except Exception as e:
        logger.error(f"Critical error processing Excel file {excel_file_path}: {e}", exc_info=True)
        raise e # Re-raise other critical errors

# --- End of migrated logic --- 