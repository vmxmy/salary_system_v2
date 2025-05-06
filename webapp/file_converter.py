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

# Import ORM models
from . import models # Assuming models.py defines SheetNameMapping, SalaryFieldMapping, EmployeeTypeFieldRule, Employee

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Define a type hint for the return value
class SheetMappingInfo(TypedDict):
    type_key: str
    target_table: Optional[str]

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
    df['_import_timestamp'] = datetime.now(timezone.utc) # Use imported timezone
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

    # 1. 定义源表和前缀
    source_tables_config = {
        'raw_annuity_staging': 'ann_',
        'raw_housingfund_staging': 'hf_',
        'raw_medical_staging': 'med_',
        'raw_pension_staging': 'pen_',
        'raw_salary_data_staging': 'sal_',
        'raw_tax_staging': 'tax_'
    }

    # 核心键列 (不加前缀)
    key_columns = ['employee_name', 'pay_period_identifier', 'id_card_number']

    all_dfs = []
    try:
        # 2. & 3. 循环读取源表数据并重命名数据列
        for table_name, prefix in source_tables_config.items():
            logger.debug(f"正在读取暂存表: {table_name} (批次: {batch_id})")
            # 构建查询以选择特定批次的数据
            # 注意：需要确保每个暂存表都有 _import_batch_id 列
            # 理论上所有这些表都应该有 pay_period_identifier，但我们这里主要靠 batch_id 关联
            query = text(f'SELECT * FROM "{table_name}" WHERE "_import_batch_id" = :batch_id')
            
            try:
                # 使用 db.connection() 获取底层连接
                connection = db.connection()
                df = pd.read_sql(query, connection, params={'batch_id': batch_id})
            except Exception as read_err:
                # 如果某个暂存表读取失败（例如表不存在或批次ID无效），可以选择记录警告并跳过，或者直接失败
                # 这里选择记录警告并跳过，允许部分合并（如果适用）
                logger.warning(f"读取暂存表 {table_name} 失败 (批次: {batch_id}): {read_err}", exc_info=True)
                continue # 跳过这个表
            
            if df.empty:
                logger.info(f"暂存表 {table_name} 在批次 {batch_id} 中没有数据，跳过合并。")
                continue

            # 规范化 employee_name
            if 'employee_name' in df.columns:
                 df['employee_name'] = df['employee_name'].apply(lambda x: normalize_whitespace(x) if isinstance(x, str) else x)
            else:
                logger.warning(f"暂存表 {table_name} 缺少 'employee_name' 列，无法参与合并。")
                continue # 没有主键无法合并
                
            # 确保 pay_period_identifier 存在 (作为合并键)
            if 'pay_period_identifier' not in df.columns:
                # 如果确实需要，可以在这里基于传入的 pay_period 参数添加列
                # df['pay_period_identifier'] = pay_period 
                # 但更稳妥的是要求源表必须包含此列
                logger.warning(f"暂存表 {table_name} 缺少 'pay_period_identifier' 列，无法参与合并。")
                continue
                
            # 确保 id_card_number 列存在，如果不存在则添加空列，以便后续合并处理
            if 'id_card_number' not in df.columns:
                 df['id_card_number'] = None

            # 找出需要加前缀的数据列 (排除键列和内部元数据列)
            internal_meta_cols = ['_source_filename', '_row_number', '_import_timestamp', '_import_batch_id', '_validation_status', '_validation_errors']
            # Also exclude the primary key of the staging table itself (e.g., _annuity_staging_id)
            primary_key_col = f'_{table_name.replace("raw_", "")}_id' # Heuristic assumption
            cols_to_exclude = set(key_columns + internal_meta_cols + [primary_key_col])
            
            data_columns = [col for col in df.columns if col not in cols_to_exclude]
            rename_map = {col: f"{prefix}{col}" for col in data_columns}
            
            # 重命名列
            df.rename(columns=rename_map, inplace=True)
            
            # 选择最终需要的列 (键列 + 重命名后的数据列)
            final_columns = key_columns + list(rename_map.values())
            # 确保所有需要的列都存在于DataFrame中（例如，id_card_number可能已添加）
            df_final = df[[col for col in final_columns if col in df.columns]].copy()
            
            all_dfs.append(df_final)

        if not all_dfs:
            logger.warning(f"批次 {batch_id} 没有找到任何有效的暂存数据进行合并。")
            return # 或者可以认为是一种成功，只是没有合并任何东西

        # 4. 使用 outer merge 合并 DataFrames
        logger.debug(f"开始合并 {len(all_dfs)} 个数据帧 (批次: {batch_id})")
        merged_df = all_dfs[0]
        for i in range(1, len(all_dfs)):
            merged_df = pd.merge(
                merged_df, 
                all_dfs[i], 
                on=['employee_name', 'pay_period_identifier'], 
                how='outer',
                suffixes=(f'_l{i-1}', f'_r{i}') # 使用动态后缀处理多重合并的 id_card_number 冲突
            )
            logger.debug(f"合并第 {i+1} 个数据帧后的大小: {merged_df.shape}")

        # 5. 处理 id_card_number 冲突
        id_cols = [col for col in merged_df.columns if col.startswith('id_card_number')]
        if len(id_cols) > 1: # 只有当合并产生了多个id_card_number列时才处理
            logger.debug(f"检测到多个id_card_number列: {id_cols}，进行合并...")
            # 使用后向填充优先获取第一个非空值
            merged_df['id_card_number'] = merged_df[id_cols].bfill(axis=1).iloc[:, 0]
            # 删除原始带后缀的列
            merged_df.drop(columns=id_cols, inplace=True)
            logger.debug("id_card_number 列合并完成。")
        elif len(id_cols) == 1 and id_cols[0] != 'id_card_number':
            # 如果只有一个且名字不对（例如 id_card_number_l0），重命名它
             merged_df.rename(columns={id_cols[0]: 'id_card_number'}, inplace=True)
        elif 'id_card_number' not in merged_df.columns:
             merged_df['id_card_number'] = None # 确保列存在

        # 6. 添加元数据列
        logger.debug(f"添加元数据列 (批次: {batch_id})")
        merged_df['_import_batch_id'] = batch_id
        # _consolidation_timestamp 会由数据库 default=func.now() 处理，无需在此添加

        # 7. 将合并后的 DataFrame 写入 consolidated_data 表
        target_table_name = models.ConsolidatedDataTable.__tablename__
        logger.info(f"准备将 {len(merged_df)} 条合并记录写入表 '{target_table_name}' (批次: {batch_id})...")
        
        # 获取目标表的 SQLAlchemy 模型，以便 to_sql 知道列类型
        # 注意：直接使用模型可能不适用于 to_sql 的 dtype 参数，但确保模型已定义
        
        # 清理数据类型，特别是 Pandas 可能推断错误的类型 (例如整数变浮点数)
        # 可以在这里添加更具体的类型转换，或者依赖 to_sql 和数据库
        merged_df = merged_df.where(pd.notnull(merged_df), None) # 将 NaN 替换为 None
        
        # 确保列顺序和类型与模型匹配（可选但推荐）
        # mapper = inspect(models.ConsolidatedDataTable)
        # model_columns = [c.key for c in mapper.columns]
        # merged_df = merged_df.reindex(columns=model_columns, fill_value=None)

        try:
            # 使用 to_sql 写入。method='multi' 可以提高性能。
            # dtype 参数可以帮助指定类型，但通常 SQLAlchemy engine 可以处理
            # 使用 db.connection() 获取底层连接
            connection = db.connection()
            merged_df.to_sql(
                name=target_table_name,
                con=connection, # 使用 Connection 对象
                if_exists='append', # 追加数据
                index=False,
                method='multi',
                chunksize=1000 # 分块写入以优化内存使用
            )
            logger.info(f"成功将 {len(merged_df)} 条记录写入 '{target_table_name}' (批次: {batch_id})。")
        except Exception as write_err:
            logger.error(f"写入合并数据到 '{target_table_name}' 失败 (批次: {batch_id}): {write_err}", exc_info=True)
            # 8. 错误处理：失败时抛出异常，以便事务回滚
            raise Exception(f"合并数据写入数据库失败: {write_err}")
            
    except Exception as e:
        logger.error(f"合并批次 {batch_id} 的暂存数据时发生意外错误: {e}", exc_info=True)
        # 8. 错误处理：确保任何未捕获的异常也能触发回滚
        raise Exception(f"合并暂存数据失败: {e}")

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
            write_successful = False
            try:
                # Use dynamic target_table_name and target_schema
                logger.info(f"Attempting to write {len(final_df)} rows from sheet '{sheet_name}' to {target_schema}.{target_table_name}.")
                logger.debug(f"DataFrame shape before to_sql for sheet '{sheet_name}': {final_df.shape}")
                if final_df.empty:
                    logger.warning(f"DataFrame for sheet '{sheet_name}' is empty before writing. Skipping write.")
                    sheet_result["message"] = "处理成功，但工作表数据为空或不符合要求，未写入任何行"
                    sheet_result["status"] = "success"
                    sheets_processed_successfully += 1
                else:
                    with db.begin_nested(): 
                        logger.debug(f"Starting nested transaction for sheet '{sheet_name}'")
                        final_df.to_sql(
                            name=target_table_name, # Use dynamic name
                            schema=target_schema, # Use dynamic schema
                            con=db.connection(),
                            if_exists='append',
                            index=False,
                            chunksize=500,
                            method='multi'
                        )
                        logger.info(f"to_sql command executed successfully within transaction for sheet '{sheet_name}'.")
                    logger.info(f"Nested transaction committed successfully for sheet '{sheet_name}'.")
                    write_successful = True
                    sheet_result["message"] = f"成功处理并导入 {len(final_df)} 行"
                    sheet_result["status"] = "success"
                    sheets_processed_successfully += 1
                    total_rows_written += len(final_df)
                    logger.info(f"Successfully wrote data from sheet '{sheet_name}'.")

            except SQLAlchemyError as db_write_err:
                logger.error(f"Database write error for sheet '{sheet_name}': {db_write_err}", exc_info=True)
                sheet_result["message"] = f"写入数据库时出错: {db_write_err}"
                sheet_result["status"] = "error"
                sheets_with_errors += 1
                overall_result["sheet_results"].append(sheet_result)
            except Exception as write_err:
                logger.error(f"Unexpected error writing data for sheet '{sheet_name}': {write_err}", exc_info=True)
                sheet_result["message"] = f"写入数据时发生意外错误: {write_err}"
                sheet_result["status"] = "error"
                sheets_with_errors += 1
                overall_result["sheet_results"].append(sheet_result)

        except Exception as sheet_proc_err:
            logger.error(f"Unexpected error processing sheet '{sheet_name}': {sheet_proc_err}", exc_info=True)
            sheet_result["message"] = f"处理工作表时发生意外错误: {sheet_proc_err}"
            sheet_result["status"] = "error"
            sheets_with_errors += 1
            if sheet_result not in overall_result["sheet_results"]:
                 overall_result["sheet_results"].append(sheet_result)

        if sheet_result["status"] == "success": # Append success result if not already appended on error
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