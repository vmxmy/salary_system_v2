import os
import pandas as pd
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# 1. 加载环境变量 (与您的 database.py 类似)
#    确保 DATABASE_URL 指向正确的数据库
dotenv_path = os.path.join(os.path.dirname(__file__), 'webapp/.env') # 假设脚本放在 salary_system 目录下
if not os.path.exists(dotenv_path):
    # 如果 webapp/.env 不存在，尝试项目根目录的 .env
    project_root_dotenv_path = os.path.join(os.path.dirname(__file__), '.env')
    if os.path.exists(project_root_dotenv_path):
        dotenv_path = project_root_dotenv_path
    else:
        dotenv_path = None # 未找到 .env 文件

if dotenv_path and os.path.exists(dotenv_path):
    print(f"Loading environment variables from: {dotenv_path}")
    load_dotenv(dotenv_path=dotenv_path)
else:
    print(f"Warning: .env file not found. Attempting to use direct environment variables for DATABASE_URL.")

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("CRITICAL: DATABASE_URL environment variable not set (either in .env or system environment)! Cannot proceed.")
    exit(1)

print(f"Attempting to connect to DB specified by DATABASE_URL (host/db will be shown by engine if successful).")

# 2. 创建 SQLAlchemy 引擎和会话 (与您的 database.py 类似)
try:
    # เพิ่ม connect_args={'options': '-csearch_path=staging,public'} เพื่อตั้งค่า search_path โดยตรง
    # Adjust connect_args based on your specific SQLAlchemy version and PostgreSQL driver if needed
    engine = create_engine(DATABASE_URL) #, connect_args={'options': '-csearch_path=staging,public'})
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    print("Database session created successfully.")
except Exception as e:
    print(f"Error creating database engine or session: {e}")
    exit(1)

# 3. 定义要查询的表
schema_name = "staging"
table_name = "raw_annuity_staging" # 您确认这个表在 staging schema 中存在

qualified_table_name = f'{schema_name}."{table_name}"' # 正确引用

# 4. 执行查询
try:
    print(f"Attempting to query: SELECT * FROM {qualified_table_name} LIMIT 1;")
    query_simple = text(f'SELECT * FROM {qualified_table_name} LIMIT 1;')
    
    connection = db.connection() # 从会话获取连接
    
    # 打印 search_path
    try:
        current_search_path_df = pd.read_sql(text("SHOW search_path;"), connection)
        if not current_search_path_df.empty:
            current_search_path = current_search_path_df.iloc[0,0]
            print(f"Current search_path for this connection: {current_search_path}")
        else:
            print("Could not determine search_path.")
    except Exception as e_path:
        print(f"Error determining search_path: {e_path}")
    finally:
        # 如果从会话获取连接，通常不需要手动关闭它，会话关闭时会处理
        # connection.close() # 如果这是一个独立的连接，则需要关闭
        pass 

    # 重新获取连接以防万一 search_path 查询影响了状态 (不太可能，但为了安全)
    # 或者直接在同一个 connection 上执行后续查询
    # connection = db.connection() 

    # 执行实际的查询
    df_test = pd.read_sql(query_simple, db.connection()) # 使用 db.connection() 获取新连接或从池中获取

    if not df_test.empty:
        print(f"Successfully read {len(df_test)} row(s) from {qualified_table_name}.")
        print("Sample data:")
        print(df_test.head().to_string())
    else:
        print(f"Query to {qualified_table_name} executed successfully, but returned no data (0 rows). This might indicate the table exists but is empty.")

except Exception as e:
    print(f"Error during database query for {qualified_table_name}: {e}")
    import traceback
    traceback.print_exc()

finally:
    if 'db' in locals() and db and db.is_active:
        db.close()
        print("Database session closed.")
    if 'engine' in locals() and engine: 
        engine.dispose()
        print("Database engine disposed.") 