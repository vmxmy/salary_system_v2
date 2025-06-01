from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import text, func
from ...models.reports import ReportView # Assuming ReportView model is here
import time
import traceback

def _sync_view_to_database_logic(db: Session, db_view: ReportView, force_recreate: bool = False) -> bool:
    """Logic to sync a single view to the database."""
    try:
        check_sql = text("""
            SELECT COUNT(*) 
            FROM information_schema.views 
            WHERE table_schema = :schema_name AND table_name = :view_name
        """)
        result = db.execute(check_sql, {
            'schema_name': db_view.schema_name,
            'view_name': db_view.view_name
        })
        view_exists = result.scalar() > 0
        
        if view_exists and force_recreate:
            drop_sql = text(f"DROP VIEW IF EXISTS {db_view.schema_name}.{db_view.view_name}")
            db.execute(drop_sql)
            # db.commit() # Commit happens after create or replace
        
        create_sql = text(f"""
            CREATE OR REPLACE VIEW {db_view.schema_name}.{db_view.view_name} AS
            {db_view.sql_query}
        """)
        db.execute(create_sql)
        # db.commit() # Commit happens after status update
        
        db_view.view_status = "created"
        db_view.last_sync_at = func.now()
        db_view.sync_error = None
        # db.commit() # Commit will be handled by the caller or at the end of the main method
        return True
    except Exception as e:
        db_view.view_status = "error"
        db_view.sync_error = str(e)
        # db.commit() # Commit will be handled by the caller
        print(f"Error syncing view {db_view.view_name}: {e}")
        print(traceback.format_exc())
        return False

def _drop_database_view_logic(db: Session, schema_name: str, view_name: str):
    """Logic to drop a database view."""
    drop_sql = text(f"DROP VIEW IF EXISTS {schema_name}.{view_name}")
    db.execute(drop_sql)
    # db.commit() # Commit will be handled by the caller

def _validate_sql_logic(db: Session, sql_query: str, schema_name: str = "reports") -> Dict[str, Any]:
    """Logic to validate SQL query."""
    temp_view_name = f"temp_validation_{int(time.time())}"
    try:
        validation_sql = text(f"EXPLAIN {sql_query}")
        db.execute(validation_sql)
        
        try:
            create_temp_sql = text(f"""
                CREATE OR REPLACE VIEW {schema_name}.{temp_view_name} AS
                {sql_query}
            """)
            db.execute(create_temp_sql)
            
            columns_info_sql = text("""
                SELECT column_name, data_type
                FROM information_schema.columns
                WHERE table_schema = :schema_name AND table_name = :view_name
                ORDER BY ordinal_position
            """)
            result = db.execute(columns_info_sql, {
                'schema_name': schema_name,
                'view_name': temp_view_name
            })
            columns = [{'name': row[0], 'type': row[1]} for row in result.fetchall()]
            
            return {
                'is_valid': True,
                'error_message': None,
                'columns': columns,
                'estimated_rows': None # Placeholder, implement if needed
            }
        finally:
            # Ensure temporary view is dropped
            drop_temp_sql = text(f"DROP VIEW IF EXISTS {schema_name}.{temp_view_name}")
            db.execute(drop_temp_sql)
            # db.commit() # Commit handled by caller if necessary or within a transaction
            
    except Exception as e:
        return {
            'is_valid': False,
            'error_message': str(e),
            'columns': None,
            'estimated_rows': None
        }

def _query_view_data_logic(db: Session, db_view: ReportView, filters: Dict = None, 
                           sorting: List = None, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
    """Logic to query data from a view."""
    start_time = time.time()
    try:
        base_sql = f"SELECT * FROM {db_view.schema_name}.{db_view.view_name}"
        where_conditions = []
        order_conditions = []
        
        if filters:
            for field, value in filters.items():
                if value is not None and value != '':
                    # Basic ILIKE for strings, equality for others. Adjust as needed.
                    if isinstance(value, str):
                        # Ensure to escape percent signs if the value itself might contain them
                        # and you intend them as literals, not wildcards.
                        # For simplicity, here we assume value doesn't contain SQL wildcards that need escaping.
                        where_conditions.append(f"{db.engine.dialect.identifier_preparer.quote_identifier(field)} ILIKE '%%{value}%%'")
                    else:
                        where_conditions.append(f"{db.engine.dialect.identifier_preparer.quote_identifier(field)} = '{value}'")
        
        if sorting:
            for sort_item in sorting:
                field = sort_item.get('field')
                direction = sort_item.get('direction', 'asc').upper()
                if field and direction in ['ASC', 'DESC']:
                    order_conditions.append(f"{db.engine.dialect.identifier_preparer.quote_identifier(field)} {direction}")
        
        query_sql = base_sql
        if where_conditions:
            query_sql += " WHERE " + " AND ".join(where_conditions)
        if order_conditions:
            query_sql += " ORDER BY " + ", ".join(order_conditions)
        
        count_sql = f"SELECT COUNT(*) FROM ({query_sql}) AS count_query"
        total_result = db.execute(text(count_sql))
        total = total_result.scalar_one_or_none() or 0
        
        offset = (page - 1) * page_size
        query_sql += f" LIMIT {page_size} OFFSET {offset}"
        
        result = db.execute(text(query_sql))
        columns = [str(col) for col in result.keys()] # Ensure column names are strings
        data = [dict(zip(columns, row)) for row in result.fetchall()]
        
        db_view.usage_count = (db_view.usage_count or 0) + 1
        db_view.last_used_at = func.now()
        # db.commit() # Commit handled by the caller
        
        execution_time = time.time() - start_time
        
        return {
            'columns': [{'key': col, 'title': col, 'dataIndex': col} for col in columns],
            'data': data,
            'total': total,
            'page': page,
            'page_size': page_size,
            'execution_time': round(execution_time, 3)
        }
    except Exception as e:
        # Log or handle the error appropriately
        print(f"Error querying view data for {db_view.view_name}: {str(e)}")
        print(traceback.format_exc())
        raise ValueError(f"查询视图数据失败: {str(e)}") from e 