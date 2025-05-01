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
if salary_system_dir not in sys.path:
    sys.path.insert(0, salary_system_dir) # Add the salary_system directory to sys.path

# Import Base from your models module
# from models import Base
import models # Import the models.py file as a module

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
target_metadata = models.Base.metadata # Use Base from the imported models module

# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.


# Add this function to filter objects for autogenerate
def include_object(object, name, type_, reflected, compare_to):
    """
    Should you include this database object in the autogenerate process?

    Filters based on type and whether the table name exists in our SQLAlchemy metadata.
    """
    # Ensure target_metadata is available in this scope if not already
    # (it should be, as it's defined globally in this script)
    
    if type_ == "table":
        # Only include tables that are explicitly defined in our SQLAlchemy Base metadata
        return name in target_metadata.tables 
    # You might want to include sequences or other object types if Alembic manages them
    # elif type_ == "sequence":
    #     return True
    else:
        # Exclude everything else (views, functions, etc.)
        return False


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

    with connectable.connect() as connection:
        context.configure(
            connection=connection, 
            target_metadata=target_metadata, # Ensure Base.metadata is used
            # Add these arguments for autogenerate filtering and comparison
            include_object=include_object,
            compare_type=True,
            compare_server_default=True
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
