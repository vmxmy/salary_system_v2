import os
import json
import logging
from sqlalchemy import create_engine, text, MetaData, Table, insert, delete
from sqlalchemy.exc import SQLAlchemyError
from dotenv import load_dotenv
import sys

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# --- Configuration ---
# Assume the script is run from the project root directory
CONFIG_DIR = os.path.join("webapp", "config")
SHEET_MAP_JSON_PATH = os.path.join(CONFIG_DIR, "sheet_to_type_key_map.json")
# Database connection URL from .env file
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

# Database table name
TARGET_TABLE = "sheet_name_mappings"

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

def prepare_sheet_map_data(json_data):
    """Prepares the list of dictionaries to insert into sheet_name_mappings."""
    data_to_insert = []
    for sheet_name, emp_type_key in json_data.items():
        data_to_insert.append({
            "sheet_name": sheet_name,
            "employee_type_key": emp_type_key
        })
    logger.info(f"Prepared {len(data_to_insert)} sheet name mappings for insertion.")
    return data_to_insert

def insert_sheet_map_data(engine, data_to_insert):
    """Deletes existing mappings and inserts the new data into the database."""
    if not data_to_insert:
        logger.info("No sheet map data prepared. Skipping database insertion.")
        return

    metadata = MetaData()
    map_table = Table(TARGET_TABLE, metadata, autoload_with=engine) # Autoload table structure
    
    try:
        with engine.begin() as connection: # Use transaction
            # Make idempotent: Delete existing mappings first
            logger.info(f"Deleting existing data from {TARGET_TABLE}...")
            del_stmt = delete(map_table)
            connection.execute(del_stmt)
            logger.info("Existing data deleted.")
            
            # Insert new mappings
            logger.info(f"Inserting {len(data_to_insert)} new sheet mappings into {TARGET_TABLE}...")
            ins_stmt = insert(map_table).values(data_to_insert)
            connection.execute(ins_stmt)
            logger.info("New sheet mappings inserted successfully.")
            # Transaction commits automatically

    except SQLAlchemyError as e:
        logger.error(f"Database error during sheet map insertion: {e}")
        logger.error("Transaction rolled back. No changes were made to the sheet mapping table.")
        sys.exit(1)
    except Exception as e:
        logger.error(f"An unexpected error occurred during sheet map insertion: {e}")
        sys.exit(1)


if __name__ == "__main__":
    logger.info("Starting sheet name mapping migration script...")

    if not DATABASE_URL:
        logger.error("Error: DATABASE_URL environment variable not set. Please configure it in your .env file.")
        sys.exit(1)

    # Create SQLAlchemy engine
    try:
        engine = create_engine(DATABASE_URL)
        with engine.connect() as conn:
            logger.info("Database connection successful.")
    except Exception as e:
        logger.error(f"Failed to create database engine or connect: {e}")
        sys.exit(1)
        
    # 1. Load JSON config
    logger.info(f"Loading sheet map configuration from {SHEET_MAP_JSON_PATH}...")
    json_config_data = load_json_config(SHEET_MAP_JSON_PATH)
    
    # 2. Prepare data for insertion
    logger.info("Preparing sheet map data for database insertion...")
    map_data_to_insert = prepare_sheet_map_data(json_config_data)
    
    # 3. Insert data into database
    insert_sheet_map_data(engine, map_data_to_insert)
    
    logger.info("Sheet name mapping migration script finished successfully!") 