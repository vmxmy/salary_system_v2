from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import text, func, and_, or_, inspect
from ..models.reports import (
    ReportDataSource, ReportDataSourceField, ReportCalculatedField,
    ReportTemplate, ReportTemplateField, ReportExecution, ReportView, ReportViewExecution
)
from ..pydantic_models.reports import (
    ReportDataSourceCreate, ReportDataSourceUpdate,
    ReportDataSourceFieldCreate, ReportDataSourceFieldUpdate,
    ReportCalculatedFieldCreate, ReportCalculatedFieldUpdate,
    ReportTemplateCreate, ReportTemplateUpdate,
    ReportTemplateFieldCreate, ReportTemplateFieldUpdate,
    ReportExecutionCreate,
    DataSourceFieldDetection, DetectedField,
    DataSourceConnectionTest, DataSourceConnectionTestResponse,
    ReportViewCreate, ReportViewUpdate, ReportViewExecutionCreate
)


# 数据源CRUD
class ReportDataSourceCRUD:
    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 100) -> List[ReportDataSource]:
        return db.query(ReportDataSource).offset(skip).limit(limit).all()

    @staticmethod
    def get_by_id(db: Session, data_source_id: int) -> Optional[ReportDataSource]:
        return db.query(ReportDataSource).filter(ReportDataSource.id == data_source_id).first()

    @staticmethod
    def create(db: Session, data_source: ReportDataSourceCreate, user_id: int) -> ReportDataSource:
        try:
            db_data_source = ReportDataSource(
                **data_source.dict(exclude={'fields'}),
                created_by=user_id
            )
            db.add(db_data_source)
            db.flush()

            # 添加字段（如果有的话）
            if data_source.fields:
                for field_data in data_source.fields:
                    db_field = ReportDataSourceField(
                        **field_data.dict(),
                        data_source_id=db_data_source.id
                    )
                    db.add(db_field)

            db.commit()
            db.refresh(db_data_source)
            return db_data_source
        except Exception as e:
            db.rollback()
            # 检查是否是唯一约束冲突
            if "uq_data_source_schema_table" in str(e):
                raise ValueError(f"数据源已存在：模式 '{data_source.schema_name}' 中的表 '{data_source.table_name}' 已经被其他数据源使用")
            elif "uq_report_data_sources_code" in str(e):
                raise ValueError(f"数据源编码 '{data_source.code}' 已存在，请使用不同的编码")
            else:
                raise e

    @staticmethod
    def update(db: Session, data_source_id: int, data_source: ReportDataSourceUpdate) -> Optional[ReportDataSource]:
        db_data_source = db.query(ReportDataSource).filter(ReportDataSource.id == data_source_id).first()
        if db_data_source:
            update_data = data_source.dict(exclude_unset=True)
            for field, value in update_data.items():
                setattr(db_data_source, field, value)
            db.commit()
            db.refresh(db_data_source)
        return db_data_source

    @staticmethod
    def delete(db: Session, data_source_id: int) -> bool:
        db_data_source = db.query(ReportDataSource).filter(ReportDataSource.id == data_source_id).first()
        if db_data_source:
            db.delete(db_data_source)
            db.commit()
            return True
        return False

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

    @staticmethod
    def test_connection(db: Session, connection_test: 'DataSourceConnectionTest') -> 'DataSourceConnectionTestResponse':
        """测试数据源连接"""
        import time
        
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

    @staticmethod
    def sync_fields(db: Session, data_source_id: int) -> List[ReportDataSourceField]:
        """同步数据源字段"""
        # 获取数据源信息
        data_source = ReportDataSourceCRUD.get_by_id(db, data_source_id)
        if not data_source:
            raise ValueError("数据源不存在")
        
        try:
            # 检测当前表结构
            detection = DataSourceFieldDetection(
                schema_name=data_source.schema_name,
                table_name=data_source.table_name,
                view_name=data_source.view_name,
                custom_query=data_source.custom_query
            )
            
            # 在单独的事务中检测字段，避免事务污染
            try:
                detected_fields = ReportDataSourceCRUD.detect_fields(db, detection)
            except Exception as detect_error:
                # 如果检测失败，回滚当前事务并重新开始
                db.rollback()
                # 重新获取数据源对象（因为回滚后对象可能失效）
                data_source = ReportDataSourceCRUD.get_by_id(db, data_source_id)
                if not data_source:
                    raise ValueError("数据源不存在")
                
                # 如果检测字段失败，返回空列表或使用默认字段
                detected_fields = []
                # 可以选择抛出错误或者继续处理
                raise ValueError(f"字段检测失败: {str(detect_error)}")
            
            # 获取现有字段
            existing_fields = db.query(ReportDataSourceField).filter(
                ReportDataSourceField.data_source_id == data_source_id
            ).all()
            
            existing_field_names = {field.field_name for field in existing_fields}
            synced_fields = []
            
            # 添加新字段
            for detected_field in detected_fields:
                if detected_field.field_name not in existing_field_names:
                    # 创建新字段
                    new_field = ReportDataSourceField(
                        data_source_id=data_source_id,
                        field_name=detected_field.field_name,
                        field_type=detected_field.field_type,
                        data_type=detected_field.data_type,
                        is_nullable=detected_field.is_nullable,
                        is_primary_key=detected_field.is_primary_key,
                        is_foreign_key=detected_field.is_foreign_key,
                        is_indexed=detected_field.is_indexed,
                        description=detected_field.comment,
                        is_visible=True,
                        is_searchable=True,
                        is_sortable=True,
                        is_filterable=True,
                        is_exportable=True,
                        sort_order=len(synced_fields)
                    )
                    db.add(new_field)
                    synced_fields.append(new_field)
                else:
                    # 更新现有字段的类型信息
                    existing_field = next(
                        field for field in existing_fields 
                        if field.field_name == detected_field.field_name
                    )
                    existing_field.field_type = detected_field.field_type
                    existing_field.data_type = detected_field.data_type
                    existing_field.is_nullable = detected_field.is_nullable
                    existing_field.is_primary_key = detected_field.is_primary_key
                    existing_field.is_foreign_key = detected_field.is_foreign_key
                    existing_field.is_indexed = detected_field.is_indexed
                    if detected_field.comment:
                        existing_field.description = detected_field.comment
                    synced_fields.append(existing_field)
            
            # 更新数据源的字段数量和同步时间
            data_source.field_count = len(detected_fields)
            data_source.last_sync_at = func.now()
            
            db.commit()
            
            # 刷新字段对象以获取最新数据
            for field in synced_fields:
                db.refresh(field)
            
            return synced_fields
            
        except Exception as e:
            db.rollback()
            raise e

    @staticmethod
    def get_statistics(db: Session, data_source_id: int) -> Dict[str, Any]:
        """获取数据源统计信息"""
        data_source = ReportDataSourceCRUD.get_by_id(db, data_source_id)
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

    @staticmethod
    def preview_data(db: Session, data_source_id: int, limit: int = 10, filters: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """预览数据源数据"""
        data_source = ReportDataSourceCRUD.get_by_id(db, data_source_id)
        if not data_source:
            raise ValueError("数据源不存在")
        
        try:
            if data_source.source_type in ['table', 'view'] and data_source.schema_name:
                table_name = data_source.table_name or data_source.view_name
                if table_name:
                    # 构建查询
                    query = f"SELECT * FROM {data_source.schema_name}.{table_name}"
                    
                    # 添加筛选条件
                    where_conditions = []
                    params = {}
                    if filters:
                        for field, value in filters.items():
                            if value is not None:
                                where_conditions.append(f"{field} = :{field}")
                                params[field] = value
                    
                    if where_conditions:
                        query += " WHERE " + " AND ".join(where_conditions)
                    
                    query += f" LIMIT {limit}"
                    
                    # 执行查询
                    result = db.execute(text(query), params)
                    columns = result.keys()
                    rows = result.fetchall()
                    
                    # 转换为字典列表
                    data = []
                    for row in rows:
                        row_dict = {}
                        for i, col in enumerate(columns):
                            value = row[i]
                            # 处理特殊类型
                            if hasattr(value, 'isoformat'):  # datetime
                                value = value.isoformat()
                            elif hasattr(value, '__str__') and not isinstance(value, (str, int, float, bool)):
                                value = str(value)
                            row_dict[col] = value
                        data.append(row_dict)
                    
                    return data
            
            elif data_source.source_type == 'query' and data_source.custom_query:
                # 自定义查询
                query = data_source.custom_query
                if not query.upper().strip().endswith('LIMIT'):
                    query += f" LIMIT {limit}"
                
                result = db.execute(text(query))
                columns = result.keys()
                rows = result.fetchall()
                
                data = []
                for row in rows:
                    row_dict = {}
                    for i, col in enumerate(columns):
                        value = row[i]
                        if hasattr(value, 'isoformat'):
                            value = value.isoformat()
                        elif hasattr(value, '__str__') and not isinstance(value, (str, int, float, bool)):
                            value = str(value)
                        row_dict[col] = value
                    data.append(row_dict)
                
                return data
            
            return []
            
        except Exception as e:
            raise e

    @staticmethod
    def preview_multi_datasource_data(
        db: Session, 
        data_source_ids: List[int], 
        joins: List[Dict[str, Any]],
        fields: List[str],
        filters: Dict[str, Any] = None,
        limit: int = 20,
        offset: int = 0
    ) -> Dict[str, Any]:
        """预览多数据源关联数据"""
        try:
            print(f"=== Multi-datasource query parameters ===")
            print(f"data_source_ids: {data_source_ids}")
            print(f"joins: {joins}")
            print(f"fields: {fields}")
            print(f"filters: {filters}")
            print(f"limit: {limit}, offset: {offset}")
            
            # 获取所有数据源信息
            data_sources = {}
            for ds_id in data_source_ids:
                ds = ReportDataSourceCRUD.get_by_id(db, ds_id)
                if not ds:
                    raise ValueError(f"数据源 {ds_id} 不存在")
                data_sources[str(ds_id)] = ds
                print(f"Data source {ds_id}: {ds.name} -> {ds.schema_name}.{ds.table_name}")
            
            # 如果没有字段，使用默认字段
            if not fields:
                # 获取主数据源的所有字段
                main_ds_id = str(data_source_ids[0])
                main_ds = data_sources[main_ds_id]
                main_table = main_ds.table_name or main_ds.view_name
                fields = [f"{main_ds_id}.id", f"{main_ds_id}.name"]  # 默认字段
                print(f"No fields provided, using default fields: {fields}")
            
            # 构建 SELECT 子句
            select_fields = []
            field_aliases = {}
            
            for field in fields:
                print(f"Processing field: {field}")
                if '.' in field:
                    # 完全限定字段名，例如 "4.last_name"
                    parts = field.split('.', 1)
                    ds_id = parts[0]
                    field_name = parts[1]
                    
                    if ds_id in data_sources:
                        table_alias = f"ds_{ds_id}"
                        # 使用双引号包裹字段别名，确保返回的字段名与前端期望的格式一致
                        alias_name = f'"{field}"'
                        full_field = f'{table_alias}.{field_name} AS {alias_name}'
                        select_fields.append(full_field)
                        # 不需要field_aliases，因为我们直接使用AS子句
                        print(f"  -> Mapped to: {full_field}")
                    else:
                        print(f"  -> WARNING: Data source {ds_id} not found")
                else:
                    # 没有数据源前缀，使用主数据源
                    main_ds_id = str(data_source_ids[0])
                    table_alias = f"ds_{main_ds_id}"
                    alias_name = f'"{main_ds_id}.{field}"'
                    full_field = f'{table_alias}.{field} AS {alias_name}'
                    select_fields.append(full_field)
                    print(f"  -> Mapped to: {full_field} (using main data source)")
            
            if not select_fields:
                # 如果没有有效字段，使用 * 
                select_fields = ["*"]
                print("No valid fields found, using SELECT *")
            
            print(f"Final select fields: {select_fields}")
            
            # 构建 FROM 子句
            main_ds_id = str(data_source_ids[0])
            main_ds = data_sources[main_ds_id]
            main_table = main_ds.table_name or main_ds.view_name
            if not main_table:
                raise ValueError(f"主数据源 {main_ds.name} 没有指定表或视图")
            
            from_clause = f"{main_ds.schema_name}.{main_table} AS ds_{main_ds_id}"
            print(f"FROM clause: {from_clause}")
            
            # 构建 JOIN 子句
            join_clauses = []
            print(f"Processing {len(joins)} joins...")
            
            for i, join in enumerate(joins):
                print(f"Join {i+1}: {join}")
                
                left_ds_id = str(join.get('left_data_source_id'))
                right_ds_id = str(join.get('right_data_source_id'))
                left_field = join.get('left_field_name')
                right_field = join.get('right_field_name')
                join_type = join.get('join_type', 'left').upper()
                
                print(f"  left_ds_id: {left_ds_id}, right_ds_id: {right_ds_id}")
                print(f"  left_field: {left_field}, right_field: {right_field}")
                print(f"  join_type: {join_type}")
                
                if right_ds_id not in data_sources:
                    print(f"  WARNING: Right data source {right_ds_id} not found in available data sources")
                    continue
                
                right_ds = data_sources[right_ds_id]
                right_table = right_ds.table_name or right_ds.view_name
                if not right_table:
                    print(f"  WARNING: Right data source {right_ds.name} has no table or view")
                    continue
                
                join_clause = f"{join_type} JOIN {right_ds.schema_name}.{right_table} AS ds_{right_ds_id}"
                join_clause += f" ON ds_{left_ds_id}.{left_field} = ds_{right_ds_id}.{right_field}"
                
                # 添加额外条件
                if join.get('condition'):
                    join_clause += f" AND {join['condition']}"
                
                join_clauses.append(join_clause)
                print(f"  Generated JOIN: {join_clause}")
            
            # 构建完整的 SQL 查询
            query = f"SELECT {', '.join(select_fields)}\nFROM {from_clause}"
            
            for join_clause in join_clauses:
                query += f"\n{join_clause}"
            
            # 添加 WHERE 子句
            where_conditions = []
            params = {}
            if filters:
                print(f"Processing filters: {filters}")
                for field, value in filters.items():
                    if value is not None:
                        if '.' in field:
                            ds_id, field_name = field.split('.', 1)
                            table_alias = f"ds_{ds_id}"
                            where_conditions.append(f"{table_alias}.{field_name} = :param_{field.replace('.', '_')}")
                            params[f"param_{field.replace('.', '_')}"] = value
                        else:
                            main_alias = f"ds_{main_ds_id}"
                            where_conditions.append(f"{main_alias}.{field} = :param_{field}")
                            params[f"param_{field}"] = value
            
            if where_conditions:
                query += "\nWHERE " + " AND ".join(where_conditions)
            
            # 添加 LIMIT 和 OFFSET
            query += f"\nLIMIT {limit}"
            if offset > 0:
                query += f" OFFSET {offset}"
            
            # 执行查询
            print(f"=== Final SQL Query ===")
            print(f"{query}")
            print(f"Parameters: {params}")
            print("=" * 50)
            
            result = db.execute(text(query), params)
            columns = result.keys()
            rows = result.fetchall()
            
            print(f"Query returned {len(rows)} rows with columns: {list(columns)}")
            
            # 转换为字典列表
            data = []
            for row in rows:
                row_dict = {}
                for i, col in enumerate(columns):
                    # 字段名已经通过AS子句正确格式化，直接使用
                    col_name = str(col)
                    row_dict[col_name] = row[i]
                data.append(row_dict)
            
            print(f"Converted data sample: {data[:2] if data else 'No data'}")
            
            # 获取总数（不带 LIMIT）
            count_query = f"SELECT COUNT(*) FROM {from_clause}"
            for join_clause in join_clauses:
                count_query += f"\n{join_clause}"
            if where_conditions:
                count_query += "\nWHERE " + " AND ".join(where_conditions)
            
            total_result = db.execute(text(count_query), params)
            total_count = total_result.scalar()
            
            print(f"Total count: {total_count}")
            
            return {
                "data": data,
                "total": total_count
            }
            
        except Exception as e:
            print(f"Multi-datasource query error: {str(e)}")
            import traceback
            traceback.print_exc()
            raise ValueError(f"多数据源查询失败: {str(e)}")


# 数据源字段CRUD
class ReportDataSourceFieldCRUD:
    @staticmethod
    def get_by_data_source(db: Session, data_source_id: int) -> List[ReportDataSourceField]:
        return db.query(ReportDataSourceField).filter(
            ReportDataSourceField.data_source_id == data_source_id
        ).order_by(ReportDataSourceField.sort_order).all()

    @staticmethod
    def create(db: Session, field: ReportDataSourceFieldCreate) -> ReportDataSourceField:
        db_field = ReportDataSourceField(**field.dict())
        db.add(db_field)
        db.commit()
        db.refresh(db_field)
        return db_field

    @staticmethod
    def update(db: Session, field_id: int, field: ReportDataSourceFieldUpdate) -> Optional[ReportDataSourceField]:
        db_field = db.query(ReportDataSourceField).filter(ReportDataSourceField.id == field_id).first()
        if db_field:
            update_data = field.dict(exclude_unset=True)
            for field_name, value in update_data.items():
                setattr(db_field, field_name, value)
            db.commit()
            db.refresh(db_field)
        return db_field

    @staticmethod
    def delete(db: Session, field_id: int) -> bool:
        db_field = db.query(ReportDataSourceField).filter(ReportDataSourceField.id == field_id).first()
        if db_field:
            db.delete(db_field)
            db.commit()
            return True
        return False


# 计算字段CRUD
class ReportCalculatedFieldCRUD:
    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 100, is_global: Optional[bool] = None) -> List[ReportCalculatedField]:
        query = db.query(ReportCalculatedField)
        if is_global is not None:
            query = query.filter(ReportCalculatedField.is_global == is_global)
        return query.offset(skip).limit(limit).all()

    @staticmethod
    def get_by_id(db: Session, field_id: int) -> Optional[ReportCalculatedField]:
        return db.query(ReportCalculatedField).filter(ReportCalculatedField.id == field_id).first()

    @staticmethod
    def create(db: Session, field: ReportCalculatedFieldCreate, user_id: int) -> ReportCalculatedField:
        db_field = ReportCalculatedField(**field.dict(), created_by=user_id)
        db.add(db_field)
        db.commit()
        db.refresh(db_field)
        return db_field

    @staticmethod
    def update(db: Session, field_id: int, field: ReportCalculatedFieldUpdate) -> Optional[ReportCalculatedField]:
        db_field = db.query(ReportCalculatedField).filter(ReportCalculatedField.id == field_id).first()
        if db_field:
            update_data = field.dict(exclude_unset=True)
            for field_name, value in update_data.items():
                setattr(db_field, field_name, value)
            db.commit()
            db.refresh(db_field)
        return db_field

    @staticmethod
    def delete(db: Session, field_id: int) -> bool:
        db_field = db.query(ReportCalculatedField).filter(ReportCalculatedField.id == field_id).first()
        if db_field:
            db.delete(db_field)
            db.commit()
            return True
        return False

    @staticmethod
    def test_formula(db: Session, formula: str, data_source_id: Optional[int] = None) -> Dict[str, Any]:
        """测试计算公式"""
        try:
            # 这里可以实现公式验证逻辑
            # 简单示例：检查公式语法
            if not formula.strip():
                return {"valid": False, "error": "公式不能为空"}
            
            # 可以添加更复杂的公式验证逻辑
            return {"valid": True, "result": "公式语法正确"}
        except Exception as e:
            return {"valid": False, "error": str(e)}


# 报表模板CRUD
class ReportTemplateCRUD:
    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 100, is_public: Optional[bool] = None) -> List[ReportTemplate]:
        query = db.query(ReportTemplate)
        if is_public is not None:
            query = query.filter(ReportTemplate.is_public == is_public)
        return query.offset(skip).limit(limit).all()

    @staticmethod
    def get_by_id(db: Session, template_id: int) -> Optional[ReportTemplate]:
        return db.query(ReportTemplate).filter(ReportTemplate.id == template_id).first()

    @staticmethod
    def create(db: Session, template: ReportTemplateCreate, user_id: int) -> ReportTemplate:
        # Exclude template_config from the initial ReportTemplate creation,
        # as its 'fields' part will be processed separately.
        # The rest of template_config (like reportTitle) is part of the JSONB column.
        template_data_for_db = template.dict(exclude_none=True)
        
        # Ensure template_config is preserved if it exists, otherwise use an empty dict
        # The ReportTemplate model expects a dict for template_config.
        actual_template_config_for_db = template_data_for_db.pop('template_config', {})
        if actual_template_config_for_db is None: # handle if template_config was explicitly None in input
            actual_template_config_for_db = {}


        db_template = ReportTemplate(
            **template_data_for_db, # Pass other fields like name, description etc.
            template_config=actual_template_config_for_db, # Pass the main config object
            created_by=user_id,
            usage_count=0 # Ensure usage_count is initialized
        )
        db.add(db_template)
        db.flush() # Get the db_template.id for ReportTemplateField instances

        # Add fields from template_config.fields if template_config and its fields exist
        if template.template_config and template.template_config.fields:
            for field_data_from_config in template.template_config.fields:
                # Map ReportFieldPydantic to ReportTemplateField model structure
                field_to_create_data = {
                    "template_id": db_template.id,
                    "field_name": field_data_from_config.field_name,
                    "field_alias": field_data_from_config.field_alias,
                    # Use source_data_source_id if available, else the 'data_source' field itself
                    "data_source": field_data_from_config.source_data_source_id or field_data_from_config.data_source,
                    "field_type": field_data_from_config.field_type,
                    "display_order": field_data_from_config.display_order,
                    "is_visible": field_data_from_config.is_visible,
                    "is_sortable": field_data_from_config.is_sortable,
                    "is_filterable": field_data_from_config.is_filterable,
                    "width": field_data_from_config.width,
                    "formatting_config": field_data_from_config.formatting_config.dict(exclude_none=True) if field_data_from_config.formatting_config else None,
                    "calculation_formula": field_data_from_config.calculation_formula,
                    # Note: ReportTemplateField doesn't store 'aggregation' or 'qualified_field_name' directly.
                    # These remain part of the template_config JSON if needed for rendering.
                }
                db_field = ReportTemplateField(**field_to_create_data)
                db.add(db_field)

        db.commit()
        db.refresh(db_template)
        # Manually load the fields relationship if needed by the caller,
        # as db.refresh might not automatically populate it perfectly after this type of multi-stage creation.
        # db.refresh(db_template, ['fields']) # Or let the caller query it if necessary.
        return db_template

    @staticmethod
    def update(db: Session, template_id: int, template: ReportTemplateUpdate) -> Optional[ReportTemplate]:
        db_template = db.query(ReportTemplate).filter(ReportTemplate.id == template_id).first()
        if db_template:
            update_data = template.dict(exclude_unset=True)
            for field, value in update_data.items():
                setattr(db_template, field, value)
            db.commit()
            db.refresh(db_template)
        return db_template

    @staticmethod
    def delete(db: Session, template_id: int) -> bool:
        db_template = db.query(ReportTemplate).filter(ReportTemplate.id == template_id).first()
        if db_template:
            db.delete(db_template)
            db.commit()
            return True
        return False

    @staticmethod
    def increment_usage(db: Session, template_id: int):
        """增加模板使用次数"""
        db_template = db.query(ReportTemplate).filter(ReportTemplate.id == template_id).first()
        if db_template:
            db_template.usage_count += 1
            db.commit()


# 报表模板字段CRUD
class ReportTemplateFieldCRUD:
    @staticmethod
    def get_by_template(db: Session, template_id: int) -> List[ReportTemplateField]:
        return db.query(ReportTemplateField).filter(
            ReportTemplateField.template_id == template_id
        ).order_by(ReportTemplateField.display_order).all()

    @staticmethod
    def create(db: Session, field: ReportTemplateFieldCreate) -> ReportTemplateField:
        db_field = ReportTemplateField(**field.dict())
        db.add(db_field)
        db.commit()
        db.refresh(db_field)
        return db_field

    @staticmethod
    def update(db: Session, field_id: int, field: ReportTemplateFieldUpdate) -> Optional[ReportTemplateField]:
        db_field = db.query(ReportTemplateField).filter(ReportTemplateField.id == field_id).first()
        if db_field:
            update_data = field.dict(exclude_unset=True)
            for field_name, value in update_data.items():
                setattr(db_field, field_name, value)
            db.commit()
            db.refresh(db_field)
        return db_field

    @staticmethod
    def delete(db: Session, field_id: int) -> bool:
        db_field = db.query(ReportTemplateField).filter(ReportTemplateField.id == field_id).first()
        if db_field:
            db.delete(db_field)
            db.commit()
            return True
        return False


# 报表执行CRUD
class ReportExecutionCRUD:
    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 100) -> List[ReportExecution]:
        return db.query(ReportExecution).offset(skip).limit(limit).all()

    @staticmethod
    def get_by_id(db: Session, execution_id: int) -> Optional[ReportExecution]:
        return db.query(ReportExecution).filter(ReportExecution.id == execution_id).first()

    @staticmethod
    def create(db: Session, execution: ReportExecutionCreate, user_id: int) -> ReportExecution:
        db_execution = ReportExecution(**execution.dict(), executed_by=user_id)
        db.add(db_execution)
        db.commit()
        db.refresh(db_execution)
        return db_execution

    @staticmethod
    def update_status(db: Session, execution_id: int, status: str, 
                     result_count: Optional[int] = None, 
                     execution_time: Optional[float] = None,
                     error_message: Optional[str] = None,
                     file_path: Optional[str] = None) -> Optional[ReportExecution]:
        db_execution = db.query(ReportExecution).filter(ReportExecution.id == execution_id).first()
        if db_execution:
            db_execution.status = status
            if result_count is not None:
                db_execution.result_count = result_count
            if execution_time is not None:
                db_execution.execution_time = execution_time
            if error_message is not None:
                db_execution.error_message = error_message
            if file_path is not None:
                db_execution.file_path = file_path
            db.commit()
            db.refresh(db_execution)
        return db_execution 


# 报表视图CRUD
class ReportViewCRUD:
    """报表视图CRUD操作"""
    
    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 100, category: str = None, is_active: bool = None) -> List[ReportView]:
        """获取报表视图列表"""
        query = db.query(ReportView)
        
        if category:
            query = query.filter(ReportView.category == category)
        if is_active is not None:
            query = query.filter(ReportView.is_active == is_active)
            
        return query.offset(skip).limit(limit).all()
    
    @staticmethod
    def get_by_id(db: Session, view_id: int) -> Optional[ReportView]:
        """根据ID获取报表视图"""
        return db.query(ReportView).filter(ReportView.id == view_id).first()
    
    @staticmethod
    def get_by_view_name(db: Session, view_name: str) -> Optional[ReportView]:
        """根据视图名称获取报表视图"""
        return db.query(ReportView).filter(ReportView.view_name == view_name).first()
    
    @staticmethod
    def create(db: Session, view_data: ReportViewCreate, created_by: int) -> ReportView:
        """创建报表视图"""
        from ..models.reports import ReportView
        
        db_view = ReportView(
            **view_data.dict(),
            created_by=created_by,
            view_status="draft"
        )
        db.add(db_view)
        db.commit()
        db.refresh(db_view)
        return db_view
    
    @staticmethod
    def update(db: Session, view_id: int, view_data: ReportViewUpdate) -> Optional[ReportView]:
        """更新报表视图"""
        db_view = db.query(ReportView).filter(ReportView.id == view_id).first()
        if not db_view:
            return None
        
        update_data = view_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_view, field, value)
        
        # 如果SQL查询发生变化，重置视图状态
        if 'sql_query' in update_data:
            db_view.view_status = "draft"
            db_view.sync_error = None
        
        db.commit()
        db.refresh(db_view)
        return db_view
    
    @staticmethod
    def delete(db: Session, view_id: int) -> bool:
        """删除报表视图"""
        db_view = db.query(ReportView).filter(ReportView.id == view_id).first()
        if not db_view:
            return False
        
        # 先删除数据库中的视图
        try:
            ReportViewCRUD.drop_database_view(db, db_view.schema_name, db_view.view_name)
        except Exception as e:
            # 即使删除视图失败，也继续删除记录
            print(f"Warning: Failed to drop database view {db_view.schema_name}.{db_view.view_name}: {e}")
        
        db.delete(db_view)
        db.commit()
        return True
    
    @staticmethod
    def sync_view_to_database(db: Session, view_id: int, force_recreate: bool = False) -> bool:
        """同步视图到数据库"""
        from ..models.reports import ReportView
        from sqlalchemy import text
        import traceback
        
        db_view = db.query(ReportView).filter(ReportView.id == view_id).first()
        if not db_view:
            return False
        
        try:
            # 检查视图是否已存在
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
            
            # 如果视图存在且需要强制重新创建，先删除
            if view_exists and force_recreate:
                drop_sql = text(f"DROP VIEW IF EXISTS {db_view.schema_name}.{db_view.view_name}")
                db.execute(drop_sql)
                db.commit()
            
            # 创建或替换视图
            create_sql = text(f"""
                CREATE OR REPLACE VIEW {db_view.schema_name}.{db_view.view_name} AS
                {db_view.sql_query}
            """)
            db.execute(create_sql)
            db.commit()
            
            # 更新视图状态
            db_view.view_status = "created"
            db_view.last_sync_at = func.now()
            db_view.sync_error = None
            db.commit()
            
            return True
            
        except Exception as e:
            # 更新错误状态
            db_view.view_status = "error"
            db_view.sync_error = str(e)
            db.commit()
            print(f"Error syncing view {db_view.view_name}: {e}")
            print(traceback.format_exc())
            return False
    
    @staticmethod
    def drop_database_view(db: Session, schema_name: str, view_name: str):
        """删除数据库视图"""
        from sqlalchemy import text
        
        drop_sql = text(f"DROP VIEW IF EXISTS {schema_name}.{view_name}")
        db.execute(drop_sql)
        db.commit()
    
    @staticmethod
    def validate_sql(db: Session, sql_query: str, schema_name: str = "reports") -> Dict[str, Any]:
        """验证SQL查询"""
        from sqlalchemy import text
        import time
        
        try:
            # 创建一个临时视图来验证SQL
            temp_view_name = f"temp_validation_{int(time.time())}"
            
            # 先尝试执行查询以验证语法
            validation_sql = text(f"EXPLAIN {sql_query}")
            db.execute(validation_sql)
            
            # 获取列信息
            columns_sql = text(f"""
                SELECT column_name, data_type 
                FROM (
                    {sql_query}
                ) AS temp_query
                LIMIT 0
            """)
            
            # 由于上面的查询可能不工作，我们使用另一种方法
            # 创建临时视图并查询其结构
            try:
                create_temp_sql = text(f"""
                    CREATE OR REPLACE VIEW {schema_name}.{temp_view_name} AS
                    {sql_query}
                """)
                db.execute(create_temp_sql)
                
                # 查询视图列信息
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
                
                # 删除临时视图
                drop_temp_sql = text(f"DROP VIEW IF EXISTS {schema_name}.{temp_view_name}")
                db.execute(drop_temp_sql)
                db.commit()
                
                return {
                    'is_valid': True,
                    'error_message': None,
                    'columns': columns,
                    'estimated_rows': None
                }
                
            except Exception as inner_e:
                # 清理临时视图
                try:
                    drop_temp_sql = text(f"DROP VIEW IF EXISTS {schema_name}.{temp_view_name}")
                    db.execute(drop_temp_sql)
                    db.commit()
                except:
                    pass
                raise inner_e
                
        except Exception as e:
            return {
                'is_valid': False,
                'error_message': str(e),
                'columns': None,
                'estimated_rows': None
            }
    
    @staticmethod
    def query_view_data(db: Session, view_id: int, filters: Dict = None, sorting: List = None, 
                       page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        """查询视图数据"""
        from sqlalchemy import text
        import time
        
        start_time = time.time()
        
        db_view = db.query(ReportView).filter(ReportView.id == view_id).first()
        if not db_view:
            raise ValueError("报表视图不存在")
        
        if db_view.view_status != "created":
            raise ValueError("视图尚未创建或创建失败")
        
        try:
            # 构建查询SQL
            base_sql = f"SELECT * FROM {db_view.schema_name}.{db_view.view_name}"
            where_conditions = []
            order_conditions = []
            
            # 添加筛选条件
            if filters:
                for field, value in filters.items():
                    if value is not None and value != '':
                        if isinstance(value, str):
                            where_conditions.append(f"{field} ILIKE '%{value}%'")
                        else:
                            where_conditions.append(f"{field} = '{value}'")
            
            # 添加排序条件
            if sorting:
                for sort_item in sorting:
                    field = sort_item.get('field')
                    direction = sort_item.get('direction', 'asc').upper()
                    if field:
                        order_conditions.append(f"{field} {direction}")
            
            # 构建完整查询
            query_sql = base_sql
            if where_conditions:
                query_sql += " WHERE " + " AND ".join(where_conditions)
            if order_conditions:
                query_sql += " ORDER BY " + ", ".join(order_conditions)
            
            # 获取总数
            count_sql = f"SELECT COUNT(*) FROM ({query_sql}) AS count_query"
            total_result = db.execute(text(count_sql))
            total = total_result.scalar()
            
            # 添加分页
            offset = (page - 1) * page_size
            query_sql += f" LIMIT {page_size} OFFSET {offset}"
            
            # 执行查询
            result = db.execute(text(query_sql))
            columns = result.keys()
            data = [dict(zip(columns, row)) for row in result.fetchall()]
            
            # 更新使用统计
            db_view.usage_count += 1
            db_view.last_used_at = func.now()
            db.commit()
            
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
            raise ValueError(f"查询视图数据失败: {str(e)}")


class ReportViewExecutionCRUD:
    """报表视图执行记录CRUD操作"""
    
    @staticmethod
    def create(db: Session, execution_data: ReportViewExecutionCreate, executed_by: int) -> ReportViewExecution:
        """创建执行记录"""
        from ..models.reports import ReportViewExecution
        
        db_execution = ReportViewExecution(
            **execution_data.dict(),
            executed_by=executed_by
        )
        db.add(db_execution)
        db.commit()
        db.refresh(db_execution)
        return db_execution
    
    @staticmethod
    def get_by_view_id(db: Session, view_id: int, skip: int = 0, limit: int = 100) -> List[ReportViewExecution]:
        """获取指定视图的执行记录"""
        return db.query(ReportViewExecution).filter(
            ReportViewExecution.report_view_id == view_id
        ).order_by(ReportViewExecution.executed_at.desc()).offset(skip).limit(limit).all()
    
    @staticmethod
    def update_execution_result(db: Session, execution_id: int, result_count: int = None, 
                              execution_time: float = None, status: str = "success", 
                              error_message: str = None) -> Optional[ReportViewExecution]:
        """更新执行结果"""
        db_execution = db.query(ReportViewExecution).filter(ReportViewExecution.id == execution_id).first()
        if not db_execution:
            return None
        
        if result_count is not None:
            db_execution.result_count = result_count
        if execution_time is not None:
            db_execution.execution_time = execution_time
        if status:
            db_execution.status = status
        if error_message:
            db_execution.error_message = error_message
        
        db.commit()
        db.refresh(db_execution)
        return db_execution 