import os
import json
import logging
from sqlalchemy import create_engine, text, MetaData, Table, Column, insert, delete
from sqlalchemy.exc import SQLAlchemyError
from dotenv import load_dotenv
import sys

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# --- Configuration ---
# Assume the script is run from the project root directory
CONFIG_DIR = os.path.join("webapp", "config")
RULES_JSON_PATH = os.path.join(CONFIG_DIR, "中文字段归集.json")
# Database connection URL from .env file
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

# Database table names
MAPPINGS_TABLE = "salary_field_mappings"
RULES_TABLE = "employee_type_field_rules"


def load_json_config(json_path):
    """Loads JSON data from the specified path."""
    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        logger.error(f"Error: Configuration file not found at {json_path}")
        sys.exit(1)
    except json.JSONDecodeError:
        logger.error(f"Error: Could not decode JSON from {json_path}")
        sys.exit(1)
    except Exception as e:
        logger.error(f"An unexpected error occurred loading {json_path}: {e}")
        sys.exit(1)

def get_chinese_to_db_name_map(engine):
    """Fetches the mapping from salary_field_mappings table."""
    mapping = {}
    try:
        with engine.connect() as connection:
            # Use text() for simple query, adjust columns if needed
            query = text(f'SELECT source_name, target_name FROM {MAPPINGS_TABLE}')
            result = connection.execute(query)
            for row in result:
                 # Use ._mapping to access columns by name reliably
                 mapping[row._mapping['source_name']] = row._mapping['target_name']
            logger.info(f"Successfully fetched {len(mapping)} field mappings from {MAPPINGS_TABLE}.")
            return mapping
    except SQLAlchemyError as e:
        logger.error(f"Database error fetching field mappings: {e}")
        sys.exit(1)
    except Exception as e:
        logger.error(f"An unexpected error occurred fetching field mappings: {e}")
        sys.exit(1)

def prepare_rules_data(json_data, name_map):
    """Prepares the list of dictionaries to insert into employee_type_field_rules."""
    rules_to_insert = []
    warnings = 0

    for emp_type_key, config in json_data.items():
        logger.info(f"Processing rules for employee type: {emp_type_key}")
        # Process required fields
        for chinese_name in config.get("required_fields", []):
            db_name = name_map.get(chinese_name)
            if db_name:
                rules_to_insert.append({
                    "employee_type_key": emp_type_key,
                    "field_db_name": db_name,
                    "is_required": True
                })
            else:
                logger.warning(f"[{emp_type_key}] Required field '{chinese_name}' not found in salary_field_mappings. Skipping.")
                warnings += 1
        
        # Process optional fields
        for chinese_name in config.get("optional_fields", []):
            db_name = name_map.get(chinese_name)
            if db_name:
                # Avoid duplicating if a field was listed as both required and optional
                if not any(r['employee_type_key'] == emp_type_key and r['field_db_name'] == db_name for r in rules_to_insert):
                     rules_to_insert.append({
                        "employee_type_key": emp_type_key,
                        "field_db_name": db_name,
                        "is_required": False
                    })
            else:
                logger.warning(f"[{emp_type_key}] Optional field '{chinese_name}' not found in salary_field_mappings. Skipping.")
                warnings += 1
                
    logger.info(f"Prepared {len(rules_to_insert)} rules to insert.")
    if warnings > 0:
        logger.warning(f"Encountered {warnings} warnings due to missing field mappings.")
        
    return rules_to_insert

def insert_rules_data(engine, rules_data):
    """Deletes existing rules and inserts the new rules data into the database."""
    if not rules_data:
        logger.info("No rules data prepared. Skipping database insertion.")
        return

    metadata = MetaData()
    rules_table = Table(RULES_TABLE, metadata, autoload_with=engine) # Autoload table structure
    
    try:
        with engine.begin() as connection: # Use transaction
            # Make idempotent: Delete existing rules first
            logger.info(f"Deleting existing data from {RULES_TABLE}...")
            del_stmt = delete(rules_table)
            connection.execute(del_stmt)
            logger.info("Existing data deleted.")
            
            # Insert new rules
            logger.info(f"Inserting {len(rules_data)} new rules into {RULES_TABLE}...")
            ins_stmt = insert(rules_table).values(rules_data)
            connection.execute(ins_stmt)
            logger.info("New rules inserted successfully.")
            # Transaction commits automatically on exiting `with engine.begin()` block

    except SQLAlchemyError as e:
        logger.error(f"Database error during rules insertion: {e}")
        logger.error("Transaction rolled back. No changes were made to the rules table.")
        sys.exit(1)
    except Exception as e:
        logger.error(f"An unexpected error occurred during rules insertion: {e}")
        sys.exit(1)


if __name__ == "__main__":
    logger.info("Starting configuration migration script...")

    if not DATABASE_URL:
        logger.error("Error: DATABASE_URL environment variable not set. Please configure it in your .env file.")
        sys.exit(1)

    # Create SQLAlchemy engine
    try:
        engine = create_engine(DATABASE_URL)
        # Test connection briefly
        with engine.connect() as conn:
            logger.info("Database connection successful.")
    except Exception as e:
        logger.error(f"Failed to create database engine or connect: {e}")
        sys.exit(1)
        
    # 1. Load JSON config
    logger.info(f"Loading rules configuration from {RULES_JSON_PATH}...")
    json_config_data = load_json_config(RULES_JSON_PATH)
    
    # 2. Get Chinese name to DB name mapping
    logger.info("Fetching field name mappings from database...")
    chinese_to_db_map = get_chinese_to_db_name_map(engine)
    
    # 3. Prepare data for insertion
    logger.info("Preparing rules data for database insertion...")
    rules_data_to_insert = prepare_rules_data(json_config_data, chinese_to_db_map)
    
    # 4. Insert data into database
    insert_rules_data(engine, rules_data_to_insert)
    
    logger.info("Configuration migration script finished successfully!") 