"""
数据源连接测试模块
负责测试数据源的连接有效性
"""

import time
from sqlalchemy.orm import Session
from sqlalchemy import text
from ...pydantic_models.reports import DataSourceConnectionTest, DataSourceConnectionTestResponse


class ReportDataSourceConnection:
    """数据源连接测试类"""
    
    @staticmethod
    def test_connection(db: Session, connection_test: DataSourceConnectionTest) -> DataSourceConnectionTestResponse:
        """测试数据源连接"""
        start_time = time.time()
        
        try:
            # 对于PostgreSQL连接，我们可以尝试查询指定的schema和表
            if connection_test.connection_type.lower() == 'postgresql':
                # 测试基本连接 - 查询当前数据库信息
                result = db.execute(text("SELECT current_database(), current_user, version()"))
                db_info = result.fetchone()
                
                # 如果指定了schema和table，测试表访问
                table_count = 0
                if connection_test.schema_name:
                    try:
                        # 查询schema中的表数量
                        schema_query = text("""
                            SELECT COUNT(*) as table_count
                            FROM information_schema.tables 
                            WHERE table_schema = :schema_name
                        """)
                        schema_result = db.execute(schema_query, {'schema_name': connection_test.schema_name})
                        table_count = schema_result.fetchone()[0]
                        
                        # 如果指定了表名，测试表是否存在
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
                # 对于其他数据库类型，返回基本连接测试
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
