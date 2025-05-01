import pandas as pd
import os
import logging
import argparse # For command-line arguments
from sqlalchemy import create_engine, text
from dotenv import load_dotenv
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

# --- 配置 (Defaults & Column Mapping) ---
DEFAULT_SHEET_NAME = '员工信息'
LOG_FILE = 'employee_import.log'

# **重要：修改这里的字典以匹配你的 Excel 列名**
COLUMN_MAPPING = {
    # '工号': 'employee_unique_id', # Removed as per user confirmation
    '姓名': 'name',
    '身份证号': 'id_card_number',
    '银行帐号': 'bank_account_number', # Updated key
    '开户行名称': 'bank_name',          # Updated key
    '入职日期': 'hire_date',
    '状态': 'employment_status',     # Updated key
    '单位': 'unit_name',            # Updated key
    '部门': 'department_name',        # Updated key
    '备注': 'remarks',
}

# 配置日志
logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(levelname)s - [%(funcName)s] %(message)s',
                    handlers=[logging.FileHandler(LOG_FILE), logging.StreamHandler()])

# --- 辅助函数 ---
def get_db_connection_string(args):
    """获取数据库连接字符串，优先使用参数，其次 .env"""
    load_dotenv() # Load .env file if present

    db_host = args.db_host or os.getenv('DB_HOST', 'localhost')
    db_port = args.db_port or os.getenv('DB_PORT', '5432')
    db_name = args.db_name or os.getenv('DB_NAME')
    db_user = args.db_user or os.getenv('DB_USER')
    # !! 建议通过环境变量或 .env 传递密码 !!
    db_password = args.db_password or os.getenv('DB_PASSWORD')

    if not all([db_name, db_user, db_password]):
        raise ValueError("Database configuration (DB_NAME, DB_USER, DB_PASSWORD) not provided via arguments or .env file.")

    conn_string = f"postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"
    logging.info(f"Using database connection: postgresql://{db_user}:***@{db_host}:{db_port}/{db_name}") # Log without password
    return conn_string


def get_lookup_map(engine, table_name, key_column, value_column='id'):
    """从数据库加载查找表到字典"""
    lookup_map = {}
    try:
        with engine.connect() as connection:
            result = connection.execute(text(f"SELECT {key_column}, {value_column} FROM {table_name}"))
            for row in result:
                key = getattr(row, key_column)
                value = getattr(row, value_column)
                if key in lookup_map:
                     logging.warning(f"Duplicate key '{key}' found in table '{table_name}' column '{key_column}'. Using ID: {lookup_map[key]}.")
                else:
                     lookup_map[key] = value
            logging.info(f"Loaded {len(lookup_map)} entries from '{table_name}' based on '{key_column}'.")
            return lookup_map
    except SQLAlchemyError as e:
        logging.error(f"Error loading lookup table '{table_name}': {e}", exc_info=True)
        raise

def get_department_lookup_map(engine):
    """加载部门查找表，key 为 (unit_id, department_name)"""
    lookup_map = {}
    try:
        with engine.connect() as connection:
            result = connection.execute(text(f"SELECT id, name, unit_id FROM departments"))
            for row in result:
                key = (row.unit_id, row.name) # 使用 (unit_id, name) 作为复合键
                value = row.id
                if key in lookup_map:
                     logging.warning(f"Duplicate key '{key}' found in departments table. Using ID: {lookup_map[key]}.")
                else:
                     lookup_map[key] = value
            logging.info(f"Loaded {len(lookup_map)} entries from 'departments'.")
            return lookup_map
    except SQLAlchemyError as e:
        logging.error(f"Error loading departments lookup table: {e}", exc_info=True)
        raise

# --- 主程序逻辑 ---
def run_import(args):
    """执行导入的主要逻辑"""
    logging.info("Starting employee import process...")
    logging.info(f"Excel File: {args.excel_file}")
    logging.info(f"Sheet Name: {args.sheet_name}")

    # 1. 加载数据库连接
    try:
        db_url = get_db_connection_string(args)
        engine = create_engine(db_url)
        # Test connection briefly
        with engine.connect() as conn:
            logging.info("Database connection successful.")
    except ValueError as e:
        logging.error(f"Configuration error: {e}")
        return False
    except SQLAlchemyError as e:
        logging.error(f"Database connection error: {e}")
        return False

    # 2. 加载查找表
    try:
        unit_map = get_lookup_map(engine, 'units', 'name', 'id')
        department_map = get_department_lookup_map(engine)
    except Exception as e:
        logging.error(f"Failed to load lookup tables. Aborting. Error: {e}")
        return False

    # 3. 读取 Excel 文件
    try:
        logging.info(f"Reading sheet '{args.sheet_name}' from Excel file: {args.excel_file}")
        df = pd.read_excel(args.excel_file, sheet_name=args.sheet_name, dtype=str)
        logging.info(f"Read {len(df)} rows from Excel.")
    except FileNotFoundError:
        logging.error(f"Excel file not found at: {args.excel_file}")
        return False
    except ValueError as e:
         logging.error(f"Error reading sheet '{args.sheet_name}'. Does it exist? Error: {e}")
         return False
    except Exception as e:
        logging.error(f"Error reading Excel file: {e}", exc_info=True)
        return False

    # 4. 标准化列名
    logging.info("Normalizing column names...")
    original_columns = df.columns.tolist()
    df.rename(columns={k: v for k, v in COLUMN_MAPPING.items() if k in original_columns}, inplace=True)
    normalized_columns = df.columns.tolist()
    logging.debug(f"Columns after normalization: {normalized_columns}")

    # 检查关键列是否存在 (不再检查 employee_unique_id)
    required_staging_cols = ['name', 'id_card_number', 'unit_name', 'department_name']
    # Removed employee_unique_id check:
    # if COLUMN_MAPPING.get('工号') in COLUMN_MAPPING.values():
    #     required_staging_cols.append('employee_unique_id')

    missing_cols = [col for col in required_staging_cols if col not in df.columns]
    if missing_cols:
        logging.error(f"Missing required columns after renaming: {missing_cols}. Check COLUMN_MAPPING and Excel sheet '{args.sheet_name}'.")
        return False

    # 5. 数据处理和查找 ID
    logging.info("Processing data and looking up foreign keys...")
    df_processed = df.copy()
    df_processed['unit_id'] = df_processed['unit_name'].map(unit_map)
    df_processed['department_id'] = df_processed.apply(
        lambda row: department_map.get((row['unit_id'], row['department_name']), None)
                    if pd.notna(row['unit_id']) and pd.notna(row['department_name']) else None,
        axis=1
    )

    if 'hire_date' in df_processed.columns:
        df_processed['hire_date'] = pd.to_datetime(df_processed['hire_date'], errors='coerce').dt.date

    missing_unit_ids = df_processed[df_processed['unit_id'].isna()]['unit_name'].unique()
    missing_dept_ids = df_processed[df_processed['department_id'].isna() & df_processed['unit_id'].notna()][['unit_name', 'department_name']].drop_duplicates().to_dict('records')

    if len(missing_unit_ids) > 0:
        logging.warning(f"Could not find matching unit_id for unit names: {list(missing_unit_ids)}")
    if len(missing_dept_ids) > 0:
         logging.warning(f"Could not find matching department_id for combinations: {missing_dept_ids}")

    original_row_count = len(df_processed)
    df_processed.dropna(subset=['unit_id', 'department_id', 'id_card_number'], inplace=True) # Ensure key columns are not null
    skipped_rows = original_row_count - len(df_processed)
    if skipped_rows > 0:
        logging.warning(f"Skipped {skipped_rows} rows due to missing unit_id, department_id, or id_card_number.")

    if df_processed.empty:
        logging.warning("No valid rows remaining after lookup checks. Aborting insertion.")
        return True # Indicate processing finished, but nothing inserted

    # 6. 准备最终插入的数据
    # (不再包含 employee_unique_id)
    final_columns = [
        # 'employee_unique_id', # Removed
        'name', 'id_card_number', 'bank_account_number',
        'bank_name', 'hire_date', 'employment_status', 'unit_id',
        'department_id', 'remarks'
    ]
    columns_to_insert = [col for col in final_columns if col in df_processed.columns]
    df_to_insert = df_processed[columns_to_insert]

    logging.info(f"Prepared {len(df_to_insert)} rows for insertion into 'employees' table.")
    logging.debug(f"Columns to insert: {df_to_insert.columns.tolist()}")

    # 7. 插入数据到数据库
    try:
        logging.info("Attempting to insert data into 'employees' table...")
        df_to_insert.to_sql(
            'employees', con=engine, if_exists='append', index=False,
            chunksize=1000, method='multi'
        )
        logging.info(f"Successfully inserted/appended {len(df_to_insert)} rows into 'employees' table.")
        return True

    except IntegrityError as e:
        logging.error(f"Database integrity error (e.g., duplicate key): {e}", exc_info=True)
        return False
    except SQLAlchemyError as e:
        logging.error(f"Database error during insertion: {e}", exc_info=True)
        return False
    except Exception as e:
        logging.error(f"An unexpected error occurred during data insertion: {e}", exc_info=True)
        return False

# --- 命令行参数解析和主入口 ---
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Import employee data from Excel to PostgreSQL.')

    # 文件和 Sheet 参数
    parser.add_argument('--excel-file', required=True, help='Path to the input Excel file.')
    parser.add_argument('--sheet-name', default=DEFAULT_SHEET_NAME, help=f'Name of the sheet containing employee data (default: "{DEFAULT_SHEET_NAME}").')

    # 数据库连接参数 (可选，优先于 .env)
    parser.add_argument('--db-host', help='Database host address.')
    parser.add_argument('--db-port', help='Database port.')
    parser.add_argument('--db-name', help='Database name.')
    parser.add_argument('--db-user', help='Database username.')
    parser.add_argument('--db-password', help='Database password (use with caution, prefer .env or environment variables).')

    args = parser.parse_args()

    if run_import(args):
        logging.info("Employee import process completed successfully (or nothing to insert).")
    else:
        logging.error("Employee import process failed.")
        exit(1) # Exit with error code 