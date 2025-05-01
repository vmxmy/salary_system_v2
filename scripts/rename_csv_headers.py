import pandas as pd
import json
import argparse
import logging
import os
import sys

# Configure logging
# Use standard format codes
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def load_mapping(json_path: str) -> dict:
    """Loads the header mapping from a JSON file."""
    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            mapping = json.load(f)
        # Use standard f-string formatting
        logging.info(f"Successfully loaded mapping from {json_path}")
        return mapping
    except FileNotFoundError:
        logging.error(f"Error: Mapping file not found at {json_path}")
        sys.exit(1)
    except json.JSONDecodeError:
        # Use standard f-string formatting
        logging.error(f"Error: Could not decode JSON from {json_path}. Please check the file format.")
        sys.exit(1)
    except Exception as e:
        # Use standard f-string formatting
        logging.error(f"An unexpected error occurred while loading the mapping file: {e}")
        sys.exit(1)

# Define known prefixes
KNOWN_PREFIXES = ["job_attr_", "salary_", "deduct_", "contrib_", "other_"]

def rename_csv_headers(input_csv: str, output_csv: str, mapping_json: str):
    """Reads a CSV, renames headers based on the mapping (handling prefixes), and writes to a new CSV."""
    header_mapping = load_mapping(mapping_json)

    df = None # Initialize df
    try:
        # Try reading with utf-8 first, then gbk if it fails
        try:
            df = pd.read_csv(input_csv, encoding='utf-8')
            logging.info(f"Successfully read input CSV {input_csv} with UTF-8 encoding.")
        except UnicodeDecodeError:
            logging.warning(f"UTF-8 decoding failed for {input_csv}, trying GBK encoding.")
            df = pd.read_csv(input_csv, encoding='gbk')
            logging.info(f"Successfully read input CSV {input_csv} with GBK encoding.")

    except FileNotFoundError:
        logging.error(f"Error: Input CSV file not found at {input_csv}")
        sys.exit(1)
    # Catch pandas specific errors if possible, e.g., EmptyDataError
    except pd.errors.EmptyDataError:
         logging.error(f"Error: Input CSV file {input_csv} is empty.")
         sys.exit(1)
    except Exception as e:
        # More specific error message
        logging.error(f"An error occurred while reading the input CSV file {input_csv}: {e}")
        sys.exit(1)

    # Ensure dataframe was loaded
    if df is None:
         # This should ideally not be reached if exceptions above are caught
         logging.error(f"Could not load dataframe from {input_csv} using UTF-8 or GBK encoding.")
         sys.exit(1)

    original_columns = df.columns.tolist()
    new_columns = []
    unmapped_columns = []

    for col in original_columns:
        col_stripped = str(col).strip()
        mapped_name = None
        prefix_found = None

        # 1. Check for known prefixes
        for prefix in KNOWN_PREFIXES:
            if col_stripped.startswith(prefix):
                prefix_found = prefix
                chinese_part = col_stripped[len(prefix):]
                # 2. Try mapping the Chinese part
                if chinese_part in header_mapping:
                    mapped_name = f"{prefix_found}{header_mapping[chinese_part]}"
                    logging.debug(f"Mapped '{col_stripped}' -> '{mapped_name}' (using prefix '{prefix_found}' and Chinese part '{chinese_part}')")
                else:
                     logging.debug(f"Prefix '{prefix_found}' found in '{col_stripped}', but Chinese part '{chinese_part}' not in mapping.")
                break # Stop checking prefixes once one is found

        # 3. If no prefix matched OR Chinese part wasn't mapped, try mapping the full name
        if mapped_name is None:
            if col_stripped in header_mapping:
                mapped_name = header_mapping[col_stripped]
                logging.debug(f"Mapped '{col_stripped}' -> '{mapped_name}' (using full name)")

        # 4. Handle unmapped columns
        if mapped_name is None:
            logging.warning(f"Column '{col_stripped}' (or its Chinese part if prefixed) not found in mapping file. Keeping original name.")
            new_columns.append(col_stripped)
            unmapped_columns.append(col_stripped)
        else:
            new_columns.append(mapped_name)

    if unmapped_columns:
        # Use standard f-string formatting for the warning
        logging.warning(f"The following columns were not found in the mapping and kept their original names: {unmapped_columns}")
    else:
        logging.info("All columns successfully mapped to English names.")

    df.columns = new_columns

    try:
        # Ensure output directory exists
        output_dir = os.path.dirname(output_csv)
        # Check if output_dir is not empty before creating
        if output_dir and not os.path.exists(output_dir):
            os.makedirs(output_dir)
            logging.info(f"Created output directory: {output_dir}")

        # Change encoding to utf-8-sig for better compatibility with Excel
        df.to_csv(output_csv, index=False, encoding='utf-8-sig')
        logging.info(f"Successfully wrote renamed CSV to {output_csv} with utf-8-sig encoding.")
    except Exception as e:
        # Use standard f-string formatting for the error
        logging.error(f"An error occurred while writing the output CSV file {output_csv}: {e}")
        sys.exit(1)

# Ensure __main__ check is correct
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Rename CSV headers from Chinese to English based on a JSON mapping.")
    parser.add_argument("--input-csv", required=True, help="Path to the input CSV file with Chinese headers.")
    parser.add_argument("--output-csv", required=True, help="Path to save the output CSV file with English headers.")

    # Use a more robust way to get the script directory for the default mapping path
    script_dir = os.path.dirname(os.path.abspath(__file__))
    # Construct default path correctly using os.path.join
    default_mapping_path = os.path.normpath(os.path.join(script_dir, "..", "config", "salary_field_definitions_data.json"))
    # Provide default value and help text using f-string
    parser.add_argument("--mapping-json", default=default_mapping_path,
                        help=f"Path to the JSON file containing the header mapping. Default: {default_mapping_path}")

    args = parser.parse_args()

    # Use the mapping path directly from args, as default is handled by argparse
    rename_csv_headers(args.input_csv, args.output_csv, args.mapping_json) 