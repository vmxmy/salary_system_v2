import os  # Add os import for path manipulation
import sys # Add sys import for path manipulation
from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context

# This line assumes your models.py is directly inside salary_system
# Adjust the path if your project structure is different
# project_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'salary_system'))
# sys.path.insert(0, os.path.dirname(project_dir)) # Add the parent directory of salary_system to sys.path
salary_system_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
webapp_dir = os.path.join(salary_system_dir, 'webapp') # Explicitly define webapp path
if salary_system_dir not in sys.path:
    sys.path.insert(0, salary_system_dir) # Add the salary_system directory to sys.path
if webapp_dir not in sys.path:
    sys.path.insert(0, webapp_dir) # Add the webapp directory too

# Explicitly import the Base from where it's defined
from webapp.database import Base
# Import the models module solely for its side effect of registering models
import webapp.models # <<< Ensure this import happens BEFORE setting target_metadata

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line reads the ini file and sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# add your model's MetaData object here
# for 'autogenerate' support
# from myapp import mymodel
# target_metadata = mymodel.Base.metadata
# target_metadata = models.Base.metadata # Use Base from the imported models module (Old way)
target_metadata = Base.metadata # Use the directly imported Base

# --- DEBUGGING PRINT STATEMENTS --- START ---
print("--- Alembic env.py Debug --- ")
print(f"Base object ID: {id(Base)}")
print(f"target_metadata object ID: {id(target_metadata)}")
print(f"Tables known to target_metadata:")
for t_name, t_obj in target_metadata.tables.items():
    print(f"  - {t_name} (Schema: {t_obj.schema})")
print("--- End Alembic env.py Debug ---")
# --- DEBUGGING PRINT STATEMENTS --- END ---

# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.


# Add this function to filter objects for autogenerate
def include_object(object, name, type_, reflected, compare_to):
    """
    Should you include this database object in the autogenerate process?
    """
    if type_ == "table":
        # The 'object' parameter is the SQLAlchemy Table object.
        # 'name' parameter passed by Alembic is usually just the table name without schema.
        table_schema = object.schema
        table_name = object.name # Use object.name for consistency

        if table_schema:
            qualified_name_in_metadata = f"{table_schema}.{table_name}"
        else:
            qualified_name_in_metadata = table_name
            
        # Check against the keys of target_metadata.tables
        # target_metadata.tables contains Table objects, keyed by name (or schema.name)
        # However, the printout of target_metadata.tables.items() shows schema.name as keys for non-default schema
        # Let's ensure we are checking correctly.
        # The `name` argument to include_object is the simple name. 
        # The `object.fullname` gives schema.name if schema is present.

        # Fallback: if qualified_name_in_metadata based on object.schema/object.name fails, try with `name` directly if schema is None.
        # This handles cases where an object from default schema is being considered.
        key_to_check = qualified_name_in_metadata
        if not object.schema and name in target_metadata.tables: # For default schema objects, key is just name
             key_to_check = name

        if key_to_check in target_metadata.tables:
            print(f"DEBUG include_object: INCLUDING table '{key_to_check}' (from object: {object.fullname if hasattr(object, 'fullname') else name}), Reflected: {reflected}")
            return True
        else:
            print(f"DEBUG include_object: EXCLUDING table '{key_to_check}' (from object: {object.fullname if hasattr(object, 'fullname') else name}) - not in target_metadata keys. Reflected: {reflected}")
            # Also print what keys *are* in target_metadata.tables for debugging if a specific table is missed.
            # if name == 'your_problematic_table_name': # Add this for specific table debugging
            #    print(f"DEBUG target_metadata.tables keys: {list(target_metadata.tables.keys())}")
            return False
            
    elif type_ == "schema":
        # Only include schemas if they are part of our models (e.g., a table is defined in that schema)
        # This prevents Alembic from trying to create schemas that are only in the DB but not in models.
        # A schema is relevant if any table in target_metadata belongs to it.
        if any(t.schema == name for t in target_metadata.tables.values()):
            print(f"DEBUG include_object: INCLUDING schema '{name}' (referenced by a model)")
            return True
        else:
            print(f"DEBUG include_object: EXCLUDING schema '{name}' (not referenced by any model)")
            return False
        
    # For other types like sequences, foreign keys, indexes, etc.
    # print(f"DEBUG include_object: EXCLUDING object '{name}' of type '{type_}' for now.")
    return False # Be restrictive for non-table/non-schema types for now


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata, # Ensure Base.metadata is used
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        include_schemas=True, # Also good to have for consistency, though less critical in offline
        compare_type=True,
        compare_server_default=True,
        # include_object=include_object, # Offline mode might not use this in the same way
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    # --- ADDED DEBUG PRINT FOR DATABASE URL ---
    print(f"--- Alembic env.py: CONFIG.SQLALCHEMY.URL: {config.get_main_option('sqlalchemy.url')} ---")
    print(f"--- Alembic env.py: Connecting to DB: {connectable.url} ---")
    # --- END DEBUG PRINT ---

    with connectable.connect() as connection:
        context.configure(
            connection=connection, 
            target_metadata=target_metadata, # Ensure Base.metadata is used
            # Add these arguments for autogenerate filtering and comparison
            include_object=include_object,
            compare_type=True,
            compare_server_default=True,
            include_schemas=True  # <<< ENSURE THIS IS PRESENT AND TRUE
            # process_revision_directives=process_revision_directives, # If you use this
            # render_as_batch=True # If using SQLite
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
