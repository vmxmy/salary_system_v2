"""
数据源统计信息模块
负责获取数据源的统计信息和访问日志
"""

from typing import Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import text
from .data_source_basic_crud import ReportDataSourceBasicCRUD


class ReportDataSourceStatistics:
    """数据源统计信息类"""
    
    @staticmethod
    def get_statistics(db: Session, data_source_id: int) -> Dict[str, Any]:
        """获取数据源统计信息"""
        data_source = ReportDataSourceBasicCRUD.get_by_id(db, data_source_id)
        if not data_source:
            raise ValueError("数据源不存在")
        
        try:
            # 基本统计信息
            stats = {
                "total_records": 0,
                "field_count": data_source.field_count or 0,
                "usage_count": data_source.usage_count or 0,
                "last_used_at": data_source.last_used_at,
                "last_sync_at": data_source.last_sync_at,
                "data_size": {
                    "total": 0,
                    "data": 0,
                    "index": 0
                }
            }
            
            # 如果是表或视图，尝试获取记录数
            if data_source.source_type in ['table', 'view'] and data_source.schema_name:
                table_name = data_source.table_name or data_source.view_name
                if table_name:
                    try:
                        # 查询记录数
                        count_query = text(f"""
                            SELECT COUNT(*) as total_records
                            FROM {data_source.schema_name}.{table_name}
                        """)
                        result = db.execute(count_query)
                        stats["total_records"] = result.fetchone()[0]
                        
                        # 查询表大小信息（PostgreSQL）
                        size_query = text("""
                            SELECT 
                                pg_total_relation_size(schemaname||'.'||tablename) / 1024 / 1024 as total_mb,
                                pg_relation_size(schemaname||'.'||tablename) / 1024 / 1024 as data_mb,
                                (pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) / 1024 / 1024 as index_mb
                            FROM pg_tables 
                            WHERE schemaname = :schema_name AND tablename = :table_name
                        """)
                        size_result = db.execute(size_query, {
                            'schema_name': data_source.schema_name,
                            'table_name': table_name
                        })
                        size_row = size_result.fetchone()
                        if size_row:
                            stats["data_size"] = {
                                "total": round(size_row[0], 2),
                                "data": round(size_row[1], 2),
                                "index": round(size_row[2], 2)
                            }
                    except Exception as e:
                        # 如果查询失败，保持默认值
                        pass
            
            return stats
            
        except Exception as e:
            raise e

    @staticmethod
    def get_access_logs(db: Session, data_source_id: int, skip: int = 0, limit: int = 10) -> List[Dict[str, Any]]:
        """获取数据源访问日志"""
        # 这里返回模拟数据，实际项目中应该从日志表查询
        import datetime
        
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
        
        # 应用分页
        return mock_logs[skip:skip + limit]
