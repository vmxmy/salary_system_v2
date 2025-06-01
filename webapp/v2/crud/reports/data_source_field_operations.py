"""
数据源字段操作模块
负责字段检测、同步等操作
"""

from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import text, func
from ...models.reports import ReportDataSource, ReportDataSourceField
from ...pydantic_models.reports import DataSourceFieldDetection, DetectedField


class ReportDataSourceFieldOperations:
    """数据源字段操作类"""
    
    @staticmethod
    def detect_fields(db: Session, detection: DataSourceFieldDetection) -> List[DetectedField]:
        """检测数据源表的字段信息"""
        try:
            # 验证必要参数
            if not detection.schema_name:
                raise ValueError("Schema name is required")
            
            table_name = detection.table_name or detection.view_name
            if not table_name:
                raise ValueError("Table name or view name is required")
            
            # 首先检查表是否存在
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
            
            # 使用 information_schema 查询字段信息
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
                # 构建字段类型信息
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
                    is_primary_key=False,  # 需要额外查询确定
                    is_foreign_key=False,  # 需要额外查询确定
                    is_indexed=False,      # 需要额外查询确定
                    comment=row.column_comment or None
                ))
            
            # 查询主键信息
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
            
            # 更新主键标识
            for field in detected_fields:
                if field.field_name in primary_keys:
                    field.is_primary_key = True
            
            return detected_fields
            
        except Exception as e:
            # 记录详细错误信息
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to detect fields for {detection.schema_name}.{table_name}: {str(e)}")
            raise e
