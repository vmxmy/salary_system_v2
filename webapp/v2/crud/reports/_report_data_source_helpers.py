from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import text, func
from ...models.reports import ReportDataSource, ReportDataSourceField
from ...pydantic_models.reports import (
    ReportDataSourceCreate, ReportDataSourceUpdate,
    DataSourceFieldDetection, DetectedField,
    DataSourceConnectionTest, DataSourceConnectionTestResponse
)
import logging
import time
import datetime # Added for mock_logs in get_access_logs

logger = logging.getLogger(__name__)


def _detect_fields_logic(db: Session, detection: DataSourceFieldDetection) -> List[DetectedField]:
    """Logic for detecting data source table fields."""
    try:
        if not detection.schema_name:
            raise ValueError("Schema name is required")
        
        table_name = detection.table_name or detection.view_name
        if not table_name:
            raise ValueError("Table name or view name is required")
        
        table_exists_query = text("""
            SELECT COUNT(*) as table_count
            FROM information_schema.tables 
            WHERE table_schema = :schema_name 
            AND table_name = :table_name
        """)
        
        result = db.execute(table_exists_query, {
            'schema_name': detection.schema_name,
            'table_name': table_name
        })
        table_exists = result.fetchone()[0] > 0
        
        if not table_exists:
            raise ValueError(f"表 {detection.schema_name}.{table_name} 不存在")
        
        sql = text("""
            SELECT 
                column_name,
                data_type,
                is_nullable,
                column_default,
                character_maximum_length,
                numeric_precision,
                numeric_scale,
                COALESCE(col_description(pgc.oid, cols.ordinal_position), '') as column_comment
            FROM information_schema.columns cols
            LEFT JOIN pg_class pgc ON pgc.relname = cols.table_name
            LEFT JOIN pg_namespace pgn ON pgn.oid = pgc.relnamespace AND pgn.nspname = cols.table_schema
            WHERE cols.table_name = :table_name 
            AND cols.table_schema = :schema_name
            ORDER BY cols.ordinal_position
        """)
        
        result = db.execute(sql, {
            'table_name': table_name,
            'schema_name': detection.schema_name
        })
        
        detected_fields = []
        for row in result:
            field_type = row.data_type.upper()
            if row.character_maximum_length:
                field_type += f"({row.character_maximum_length})"
            elif row.numeric_precision and row.numeric_scale:
                field_type += f"({row.numeric_precision},{row.numeric_scale})"
            elif row.numeric_precision:
                field_type += f"({row.numeric_precision})"
            
            detected_fields.append(DetectedField(
                field_name=row.column_name,
                field_type=field_type,
                data_type=row.data_type,
                is_nullable=row.is_nullable == 'YES',
                is_primary_key=False, 
                is_foreign_key=False,
                is_indexed=False,
                comment=row.column_comment or None
            ))
        
        pk_query = text("""
            SELECT column_name
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu 
                ON tc.constraint_name = kcu.constraint_name
                AND tc.table_schema = kcu.table_schema
            WHERE tc.constraint_type = 'PRIMARY KEY'
            AND tc.table_schema = :schema_name
            AND tc.table_name = :table_name
        """)
        
        pk_result = db.execute(pk_query, {
            'schema_name': detection.schema_name,
            'table_name': table_name
        })
        
        primary_keys = {row.column_name for row in pk_result}
        
        for field in detected_fields:
            if field.field_name in primary_keys:
                field.is_primary_key = True
        
        return detected_fields
            
    except Exception as e:
        logger.error(f"Failed to detect fields for {detection.schema_name}.{table_name}: {str(e)}")
        raise e

def _test_connection_logic(db: Session, connection_test: DataSourceConnectionTest) -> DataSourceConnectionTestResponse:
    """Logic for testing data source connection."""
    start_time = time.time()
    try:
        if connection_test.connection_type.lower() == 'postgresql':
            result = db.execute(text("SELECT current_database(), current_user, version()"))
            db_info = result.fetchone()
            table_count = 0
            if connection_test.schema_name:
                try:
                    schema_query = text("""
                        SELECT COUNT(*) as table_count
                        FROM information_schema.tables 
                        WHERE table_schema = :schema_name
                    """)
                    schema_result = db.execute(schema_query, {'schema_name': connection_test.schema_name})
                    table_count = schema_result.fetchone()[0]
                    if connection_test.table_name:
                        table_query = text("""
                            SELECT COUNT(*) as exists_count
                            FROM information_schema.tables 
                            WHERE table_schema = :schema_name 
                            AND table_name = :table_name
                        """)
                        table_result = db.execute(table_query, {
                            'schema_name': connection_test.schema_name,
                            'table_name': connection_test.table_name
                        })
                        table_exists = table_result.fetchone()[0] > 0
                        if not table_exists:
                            return DataSourceConnectionTestResponse(
                                success=False,
                                message=f"表 {connection_test.schema_name}.{connection_test.table_name} 不存在",
                                response_time=round((time.time() - start_time) * 1000, 2),
                                table_count=table_count
                            )
                except Exception as e:
                    return DataSourceConnectionTestResponse(
                        success=False,
                        message=f"访问schema '{connection_test.schema_name}' 失败: {str(e)}",
                        response_time=round((time.time() - start_time) * 1000, 2),
                        error_details=str(e)
                    )
            response_time = round((time.time() - start_time) * 1000, 2)
            success_message = f"连接成功! 数据库: {db_info[0]}, 用户: {db_info[1]}"
            if connection_test.schema_name:
                success_message += f", Schema: {connection_test.schema_name} (包含 {table_count} 个表)"
            if connection_test.table_name:
                success_message += f", 表: {connection_test.table_name} 存在"
            return DataSourceConnectionTestResponse(
                success=True,
                message=success_message,
                response_time=response_time,
                table_count=table_count
            )
        else:
            return DataSourceConnectionTestResponse(
                success=True,
                message=f"连接类型 {connection_test.connection_type} 暂不支持详细测试",
                response_time=round((time.time() - start_time) * 1000, 2)
            )
    except Exception as e:
        return DataSourceConnectionTestResponse(
            success=False,
            message=f"连接失败: {str(e)}",
            response_time=round((time.time() - start_time) * 1000, 2),
            error_details=str(e)
        )

def _get_access_logs_logic(db: Session, data_source_id: int, skip: int = 0, limit: int = 10) -> List[Dict[str, Any]]:
    """Logic for getting data source access logs (mocked)."""
    mock_logs = [
        {
            "id": 1,
            "accessed_at": datetime.datetime.now() - datetime.timedelta(hours=1),
            "access_type": "query",
            "access_result": "success",
            "execution_time": 250,
            "user_id": 1,
            "user_name": "管理员"
        },
        {
            "id": 2,
            "accessed_at": datetime.datetime.now() - datetime.timedelta(hours=2),
            "access_type": "sync",
            "access_result": "success",
            "execution_time": 1200,
            "user_id": 1,
            "user_name": "管理员"
        },
        {
            "id": 3,
            "accessed_at": datetime.datetime.now() - datetime.timedelta(hours=3),
            "access_type": "preview",
            "access_result": "success",
            "execution_time": 180,
            "user_id": 2,
            "user_name": "用户"
        }
    ]
    return mock_logs[skip:skip + limit] 