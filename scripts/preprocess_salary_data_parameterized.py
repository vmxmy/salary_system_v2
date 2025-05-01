import pandas as pd
import os
import logging
import argparse
import re
from datetime import datetime

# --- 配置 (Defaults & Column Mapping) ---
LOG_FILE = 'preprocess_salary.log'
# Sheet Name Patterns/Names
SALARY_DETAIL_SHEET_PATTERN = r'工资明细-(.+)'
# **明确列出所有专项 Sheet 的名称**
# DIRECT_ESTABLISHMENT_SHEET_NAMES = ['专项', '专技', '区聘', '原投服'] # <-- REVERTED: Remove this list
# **明确列出所有专项 Sheet 的名称**
DEDUCTION_CONTRIB_SHEET_NAMES = ['医疗保险', '养老保险', '职业年金', '住房公积金'] # 可能还有失业保险等
# 需要忽略的 Sheet 名称或模式列表 (例如汇总表)
SHEETS_TO_IGNORE = ['汇总', 'Summary', '员工信息'] # 显式忽略员工信息表
KEY_JOIN_COLUMN_STAGING = 'id_card_number'
# Potential Name Columns in Excel (priority order)
POTENTIAL_NAME_COLUMNS_EXCEL = ['姓名', '人员姓名']
NAME_COLUMN_STAGING = 'employee_name'

# --- 辅助函数 ---
def setup_logging():
    log_path = os.path.join(os.path.dirname(__file__) or '.', LOG_FILE)
    logging.basicConfig(
        level=logging.DEBUG, # <-- Set level to DEBUG
        format='%(asctime)s - %(levelname)s - [%(funcName)s:%(lineno)d] %(message)s', # Added lineno
        handlers=[logging.FileHandler(log_path, mode='w'), logging.StreamHandler()]
    )

def get_pay_period_from_filename(filename):
    """从文件名提取工资周期"""
    basename = os.path.basename(filename)
    match = re.search(r'(\d{4})[-_]?(\d{2})', basename)
    if match:
        year, month = int(match.group(1)), int(match.group(2))
        if 2000 < year < 2100 and 1 <= month <= 12:
            return f"{year}-{month:02d}"
    logging.warning(f"Could not extract pay period from filename: {filename}")
    return "unknown_period" # 返回默认值而非 None

def get_common_column_mapping():
    # REMOVED Name mapping - will be handled dynamically
    return {
        '身份证号': KEY_JOIN_COLUMN_STAGING,
        '工号': 'employee_unique_id',
        '编制': 'establishment_type_name',
        '备注': 'other_备注',
    }

def get_salary_and_jobattr_mapping(establishment_type=None):
    # ... (Salary/Job Attr mappings remain the same) ...
    mapping = {}
    job_attr_map = { # ... same as before ...
        '人员身份': 'job_attr_人员身份', '人员职级': 'job_attr_人员职级', '岗位类别': 'job_attr_岗位类别',
        '参照正编岗位工资级别': 'job_attr_参照正编岗位工资级别', '参照正编薪级工资级次': 'job_attr_参照正编薪级工资级次',
        '工资级别': 'job_attr_工资级别', '工资档次': 'job_attr_工资档次', '固定薪酬全年应发数': 'job_attr_固定薪酬全年应发数',
    }
    salary_comp_map = { # ... same as before ...
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
    mapping.update(get_common_column_mapping()) # Add common mappings (ID, etc.)
    return mapping

def get_deduction_contrib_mapping(sheet_name):
    # REMOVED Name mapping - handled dynamically
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
    return mapping

def normalize_dataframe(df, sheet_name, establishment_type=None, is_deduction_contrib=False):
    logging.debug(f"[{sheet_name}] Normalizing dataframe. Is deduction/contrib: {is_deduction_contrib}")
    if is_deduction_contrib:
        mapping = get_deduction_contrib_mapping(sheet_name)
        logging.debug(f"[{sheet_name}] Using DEDUCTION mapping: {mapping}")
    else:
        mapping = get_salary_and_jobattr_mapping(establishment_type)
        logging.debug(f"[{sheet_name}] Using SALARY mapping for type '{establishment_type}': {mapping}") # Log type here

    original_columns = df.columns.tolist()
    logging.info(f"[{sheet_name}] Columns BEFORE normalization: {original_columns}") # Log original columns
    df.columns = df.columns.str.strip()
    excel_headers_lower_map = {col.lower(): col for col in df.columns}
    rename_map = {}
    mapped_target_cols = []
    found_name_col = None

    # --- Dynamically map Name column ---
    for potential_name in POTENTIAL_NAME_COLUMNS_EXCEL:
        excel_header = excel_headers_lower_map.get(potential_name.lower())
        if excel_header:
            logging.info(f"[{sheet_name}] Found name column '{excel_header}', mapping to '{NAME_COLUMN_STAGING}'.")
            rename_map[excel_header] = NAME_COLUMN_STAGING
            mapped_target_cols.append(NAME_COLUMN_STAGING)
            found_name_col = excel_header
            break
    if not found_name_col:
         logging.warning(f"[{sheet_name}] Could not find any potential name column {POTENTIAL_NAME_COLUMNS_EXCEL}")
    # --- End Dynamic Name Mapping ---

    # Process other mappings
    logging.debug(f"[{sheet_name}] Processing other mappings...")
    for map_key, map_value in mapping.items():
        if found_name_col and map_key.lower() == found_name_col.lower():
            logging.debug(f"[{sheet_name}] Skipping mapping for '{map_key}' as it was handled as name.")
            continue
        if map_key in POTENTIAL_NAME_COLUMNS_EXCEL:
             logging.debug(f"[{sheet_name}] Skipping mapping for '{map_key}' as it is a potential name key.")
             continue

        excel_header = excel_headers_lower_map.get(map_key.lower())
        if excel_header:
            logging.debug(f"[{sheet_name}] Mapping '{excel_header}' to '{map_value}'")
            rename_map[excel_header] = map_value
            mapped_target_cols.append(map_value)
        #else:
        #    logging.debug(f"[{sheet_name}] Mapping key '{map_key}' not found in source columns.")

    logging.debug(f"[{sheet_name}] Final rename map: {rename_map}")
    df.rename(columns=rename_map, inplace=True)
    current_cols = df.columns.tolist()
    logging.info(f"[{sheet_name}] Columns AFTER rename: {current_cols}") # Log columns after rename
    unique_mapped_targets = list(set(mapped_target_cols))
    logging.debug(f"[{sheet_name}] Mapped target columns (unique): {unique_mapped_targets}")

    # --- Check for required columns AFTER dynamic mapping ---
    if NAME_COLUMN_STAGING not in current_cols:
        logging.error(f"CRITICAL [{sheet_name}]: Name column ('{NAME_COLUMN_STAGING}') not found after normalization. Potential keys: {POTENTIAL_NAME_COLUMNS_EXCEL}. Available columns: {current_cols}. Skipping sheet.")
        return None, []
    else:
        logging.info(f"[{sheet_name}] Check PASSED: Name column '{NAME_COLUMN_STAGING}' found.")

    if not is_deduction_contrib and KEY_JOIN_COLUMN_STAGING not in current_cols:
         logging.error(f"CRITICAL [{sheet_name}]: ID Card column ('{KEY_JOIN_COLUMN_STAGING}') missing for SALARY sheet. Available columns: {current_cols}. Skipping sheet.")
         return None, []
    elif not is_deduction_contrib:
        logging.info(f"[{sheet_name}] Check PASSED: ID Card column '{KEY_JOIN_COLUMN_STAGING}' found.")
    # --- End Modified Checks ---

    if not is_deduction_contrib and 'establishment_type_name' not in current_cols:
        if establishment_type:
             df['establishment_type_name'] = establishment_type
             logging.info(f"[{sheet_name}] Added establishment_type_name column with value: {establishment_type}")
        else:
             logging.warning(f"[{sheet_name}] Salary sheet missing establishment type.")
             df['establishment_type_name'] = "Unknown"

    logging.info(f"[{sheet_name}] Normalization successful.")
    return df, unique_mapped_targets

# --- 核心处理逻辑 (process_excel_file remains largely the same, relies on normalize_dataframe) ---
def process_excel_file(file_path, pay_period):
    logging.info(f"Processing file: {file_path} for period: {pay_period}")
    salary_dataframes = []
    deduction_contrib_dataframes = {} # {sheet_name: df}

    try:
        # Explicitly use openpyxl engine for potentially complex files
        excel_sheets = pd.read_excel(file_path, sheet_name=None, header=0, dtype=str, engine='openpyxl')
        logging.info(f"Found sheets: {list(excel_sheets.keys())} in {file_path}")

        for sheet_name, df in excel_sheets.items():
            logging.info(f"--- Processing sheet: '{sheet_name}' ---")
            df_copy = df.copy()
            if any(pattern in sheet_name for pattern in SHEETS_TO_IGNORE):
                logging.info(f"Ignoring sheet '{sheet_name}' based on SHEETS_TO_IGNORE.")
                continue
            if df_copy.empty:
                 logging.info(f"Skipping empty sheet: '{sheet_name}'.")
                 continue

            # Initial raw key check
            is_deduction_sheet_type = sheet_name in DEDUCTION_CONTRIB_SHEET_NAMES
            required_raw_keys = POTENTIAL_NAME_COLUMNS_EXCEL if is_deduction_sheet_type else ['身份证号'] + POTENTIAL_NAME_COLUMNS_EXCEL
            found_required_raw_key = False
            key_to_check = None
            logging.debug(f"[{sheet_name}] Checking for required raw keys: {required_raw_keys}")
            for raw_key in required_raw_keys:
                 if raw_key in df_copy.columns:
                      logging.debug(f"[{sheet_name}] Found potential raw key '{raw_key}'. Checking for non-null data.")
                      if not df_copy[raw_key].isnull().all():
                           logging.info(f"[{sheet_name}] Using '{raw_key}' as the key for initial NaN drop.")
                           found_required_raw_key = True
                           key_to_check = raw_key
                           break
            if not found_required_raw_key:
                 logging.warning(f"[{sheet_name}] Could not find any required raw key with data in {required_raw_keys}. Skipping sheet.")
                 continue
            else:
                logging.info(f"[{sheet_name}] Raw key check passed using '{key_to_check}'.") # Log success

            initial_rows = len(df_copy)
            df_copy.dropna(subset=[key_to_check], inplace=True)
            final_rows = len(df_copy)
            logging.info(f"[{sheet_name}] Rows before dropna on '{key_to_check}': {initial_rows}, after: {final_rows}. Diff: {initial_rows - final_rows}")
            if df_copy.empty:
                 logging.warning(f"[{sheet_name}] Sheet became empty after dropping rows with null key '{key_to_check}'. Skipping.")
                 continue

            # --- REVERTED SHEET TYPE IDENTIFICATION --- START ---
            establishment_type = None
            is_salary_sheet = False
            is_deduction_contrib = sheet_name in DEDUCTION_CONTRIB_SHEET_NAMES

            salary_match = re.match(SALARY_DETAIL_SHEET_PATTERN, sheet_name)
            if salary_match:
                establishment_type = salary_match.group(1).strip()
                is_salary_sheet = True
                logging.info(f"MATCHED SALARY SHEET (Pattern): '{sheet_name}'. Extracted Type: '{establishment_type}'. Attempting normalization.")
            elif is_deduction_contrib:
                 logging.info(f"MATCHED DEDUCTION/CONTRIB SHEET: '{sheet_name}'. Attempting normalization.")
            else:
                 logging.warning(f"Sheet '{sheet_name}' did not match any known salary or deduction/contrib pattern. Skipping.")
                 continue
            # --- REVERTED SHEET TYPE IDENTIFICATION --- END ---

            # Call normalize_dataframe (Pass correct flags)
            df_normalized, mapped_targets = normalize_dataframe(df_copy, sheet_name, establishment_type=establishment_type, is_deduction_contrib=is_deduction_contrib)

            if df_normalized is None:
                logging.error(f"Normalization FAILED for sheet '{sheet_name}'. Skipping further processing for this sheet.")
                continue
            else:
                 logging.info(f"Normalization SUCCEEDED for sheet '{sheet_name}'. Proceeding.")

            # --- REVERTED POST-NORMALIZATION LOGIC --- START ---
            if is_salary_sheet:
                logging.info(f"Processing post-normalization steps for SALARY sheet: '{sheet_name}'")
                df_normalized['_airbyte_source_file'] = os.path.basename(file_path)
                df_normalized['_airbyte_source_sheet'] = sheet_name
                logging.debug(f"[{sheet_name}] Before adding pay_period_identifier. Columns: {df_normalized.columns.tolist()}")
                df_normalized['pay_period_identifier'] = pay_period
                logging.debug(f"[{sheet_name}] After adding pay_period_identifier. Columns: {df_normalized.columns.tolist()}")
                logging.debug(f"[{sheet_name}] Example Salary row data: {df_normalized.head(1).to_dict('records')}")
                salary_dataframes.append(df_normalized)
            elif is_deduction_contrib:
                 logging.info(f"Processing post-normalization steps for DEDUCTION/CONTRIB sheet: '{sheet_name}'")
                 # Original logic to check for duplicate names in deduction sheets
                 duplicate_names_df = df_normalized[df_normalized.duplicated(subset=[NAME_COLUMN_STAGING], keep=False)]
                 if not duplicate_names_df.empty:
                     duplicate_names_list = duplicate_names_df[NAME_COLUMN_STAGING].unique().tolist()
                     error_message = f"FATAL ERROR: Duplicate names in sheet '{sheet_name}' of '{os.path.basename(file_path)}': {duplicate_names_list}. Aborting."
                     logging.error(error_message)
                     raise ValueError(error_message)

                 # Original logic to select specific columns for deduction sheets
                 cols_to_keep = [NAME_COLUMN_STAGING]
                 for target_col in mapped_targets:
                     if target_col.startswith('contrib_') or target_col.startswith('deduct_'):
                         if target_col in df_normalized.columns:
                             cols_to_keep.append(target_col)
                 cols_to_keep = list(dict.fromkeys(cols_to_keep))
                 logging.info(f"[{sheet_name}] Selecting columns: {cols_to_keep}")
                 if len(cols_to_keep) <= 1:
                      logging.warning(f"[{sheet_name}] No contrib/deduct columns found/mapped. Skipping merge.")
                      continue
                 df_filtered = df_normalized[cols_to_keep].copy()
                 deduction_contrib_dataframes[sheet_name] = df_filtered
                 logging.debug(f"[{sheet_name}] Example Deduction row data: {df_filtered.head(1).to_dict('records')}")
            # --- REVERTED POST-NORMALIZATION LOGIC --- END ---

        # --- Merging Logic --- (Remains the same)
        if not salary_dataframes:
            logging.warning(f"No valid salary detail data processed from file {file_path}. Cannot proceed.")
            return None
        combined_salary_df = pd.concat(salary_dataframes, ignore_index=True, sort=False)
        combined_salary_df.drop_duplicates(subset=[KEY_JOIN_COLUMN_STAGING, 'pay_period_identifier'], keep='first', inplace=True)
        logging.info(f"Combined {len(combined_salary_df)} unique salary rows (by ID & Period)")

        final_df = combined_salary_df
        if deduction_contrib_dataframes:
            logging.info(f"Merging deduction/contribution data using '{NAME_COLUMN_STAGING}'. Start rows: {len(final_df)}")
            merged_df = final_df
            for i, right_df in enumerate(deduction_contrib_dataframes.values()):
                sheet_name = list(deduction_contrib_dataframes.keys())[i]
                logging.debug(f"Merging with {sheet_name} on '{NAME_COLUMN_STAGING}'")
                if NAME_COLUMN_STAGING not in merged_df.columns:
                     logging.error(f"CRITICAL: Left side missing merge key '{NAME_COLUMN_STAGING}' before merging {sheet_name}. Aborting.")
                     return None
                if NAME_COLUMN_STAGING not in right_df.columns:
                    logging.warning(f"Cannot merge '{sheet_name}', lacks key '{NAME_COLUMN_STAGING}'. Skipping.")
                    continue
                merged_df = pd.merge(merged_df, right_df, on=NAME_COLUMN_STAGING, how='left', suffixes=("", f"_{sheet_name}"))
                logging.debug(f"Rows after merging {sheet_name}: {len(merged_df)}")
            final_df = merged_df
            logging.info(f"Final merged dataframe size: {len(final_df)} rows.")
        return final_df

    except ValueError as ve:
        raise ve
    except Exception as e:
        # Catch potential errors during file reading (e.g., bad format, password protected)
        if isinstance(e, FileNotFoundError):
             logging.error(f"Excel file not found: {file_path}")
        elif "Excel file format cannot be determined" in str(e) or "Unsupported format, or corrupt file" in str(e):
             logging.error(f"Could not read Excel file - possible format issue or corruption: {file_path}. Error: {e}")
        else:
             logging.error(f"Critical error processing file {file_path}: {e}", exc_info=True)
        return None

# --- 主程序逻辑 (run_preprocessing remains the same) ---
def run_preprocessing(args):
    setup_logging()
    logging.info(f"Starting salary data preprocessing for period: {args.pay_period}")
    logging.info(f"Input Excel File: {args.excel_file}")
    logging.info(f"Output Folder: {args.output_folder}")
    logging.warning("Using EMPLOYEE NAME ('姓名' or '人员姓名') as the key for merging deduction sheets.")

    if not os.path.isfile(args.excel_file):
        logging.error(f"Input Excel file not found: {args.excel_file}")
        return False
    if args.excel_file.startswith('~$'):
        logging.error(f"Input file is temporary: {args.excel_file}")
        return False

    try:
        final_combined_df = process_excel_file(args.excel_file, args.pay_period)
        if final_combined_df is None:
             logging.error(f"Failed to process data from file: {args.excel_file}.")
             return False

        logging.info(f"Successfully processed data. Rows: {len(final_combined_df)}")

        # --- Filename Formatting & Output --- (Remains the same)
        try:
            period_dt = datetime.strptime(args.pay_period, '%Y-%m')
            output_filename = f"salary_record_{period_dt.strftime('%Y%m')}.csv"
        except ValueError:
            logging.error(f"Invalid pay_period format: '{args.pay_period}'.")
            output_filename = "salary_record_invalid_period.csv"
        output_full_path = os.path.join(args.output_folder, output_filename)
        logging.info(f"Output CSV path: {output_full_path}")

        expected_staging_columns = [
             KEY_JOIN_COLUMN_STAGING, NAME_COLUMN_STAGING,
             'employee_unique_id', 'establishment_type_name', 'pay_period_identifier',
             # Job Attrs
             'job_attr_人员身份', 'job_attr_人员职级', 'job_attr_岗位类别', 'job_attr_参照正编岗位工资级别', 'job_attr_参照正编薪级工资级次', 'job_attr_工资级别', 'job_attr_工资档次', 'job_attr_固定薪酬全年应发数',
             # Salary Components
             'salary_一次性补扣发', 'salary_基础绩效奖补扣发', 'salary_职务技术等级工资', 'salary_级别岗位级别工资', 'salary_93年工改保留补贴', 'salary_独生子女父母奖励金', 'salary_岗位职务补贴', 'salary_公务员规范性津贴补贴', 'salary_公务交通补贴', 'salary_基础绩效奖', 'salary_见习试用期工资', 'salary_信访工作人员岗位津贴', 'salary_奖励绩效补扣发', 'salary_岗位工资', 'salary_薪级工资', 'salary_月基础绩效', 'salary_月奖励绩效', 'salary_基本工资', 'salary_绩效工资', 'salary_其他补助', 'salary_补发工资', 'salary_津贴', 'salary_季度考核绩效奖', 'salary_补助', 'salary_信访岗位津贴', 'salary_补扣发合计', 'salary_生活津贴', 'salary_补发薪级合计',
             'salary_total_backpay_amount',
             # Deductions
             'deduct_个人缴养老保险费', 'deduct_个人缴医疗保险费', 'deduct_个人缴职业年金', 'deduct_个人缴住房公积金', 'deduct_个人缴失业保险费',
             'deduct_个人所得税', 'deduct_其他扣款', 'deduct_补扣退社保缴费', 'deduct_补扣退公积金', 'deduct_补扣个税',
             # Contributions
             'contrib_单位缴养老保险费', 'contrib_单位缴医疗保险费', 'contrib_单位缴职业年金', 'contrib_单位缴住房公积金', 'contrib_单位缴失业保险费',
             'contrib_大病医疗单位缴纳',
             'other_备注',
             '_airbyte_source_file', '_airbyte_source_sheet',
        ]
        present_columns = final_combined_df.columns.tolist()
        final_columns_to_keep = []
        for col in expected_staging_columns:
            if col in present_columns:
                final_columns_to_keep.append(col)
            else:
                final_combined_df[col] = None
                final_columns_to_keep.append(col)
                logging.warning(f"Expected column '{col}' missing, added with NULLs.")
        final_output_df = final_combined_df[final_columns_to_keep].copy()

        try:
            os.makedirs(args.output_folder, exist_ok=True)
            final_output_df.to_csv(output_full_path, index=False, encoding='utf-8-sig')
            logging.info(f"Successfully saved preprocessed data to {output_full_path}. Total rows: {len(final_output_df)}")
            return True
        except Exception as e:
            logging.error(f"Failed to write output CSV: {e}", exc_info=True)
            return False

    except ValueError as ve:
        logging.error(f"Script aborted due to duplicate names: {ve}")
        return False
    except Exception as e:
        logging.error(f"Unexpected error during preprocessing: {e}", exc_info=True)
        return False

# --- 命令行参数解析和主入口 ---
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Preprocess a single salary Excel file into a CSV.')
    parser.add_argument('--excel-file', required=True, help='Path to the input Excel file.')
    parser.add_argument('--output-folder', required=True, help='Folder where the output CSV file will be saved.')
    parser.add_argument('--pay-period', required=True, help='Pay period identifier (e.g., YYYY-MM).')
    args = parser.parse_args()
    if run_preprocessing(args):
        logging.info("Preprocessing finished successfully.")
    else:
        logging.error("Preprocessing failed or aborted. Check logs.")
        exit(1)