from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import text, func
from ...models.reports import ReportDataSource, ReportDataSourceField
from ...pydantic_models.reports import (
    ReportDataSourceCreate, ReportDataSourceUpdate,
    DataSourceFieldDetection, DetectedField,
    DataSourceConnectionTest, DataSourceConnectionTestResponse
)
from ._report_data_source_helpers import (
    _detect_fields_logic, _test_connection_logic, _get_access_logs_logic
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
        return _detect_fields_logic(db, detection)

    @staticmethod
    def test_connection(db: Session, connection_test: DataSourceConnectionTest) -> DataSourceConnectionTestResponse:
        return _test_connection_logic(db, connection_test)

    @staticmethod
    def sync_fields(db: Session, data_source_id: int) -> List[ReportDataSourceField]:
        data_source = ReportDataSourceCRUD.get_by_id(db, data_source_id)
        if not data_source:
            raise ValueError("数据源不存在")
        try:
            detection = DataSourceFieldDetection(
                schema_name=data_source.schema_name,
                table_name=data_source.table_name,
                view_name=data_source.view_name,
                custom_query=data_source.custom_query
            )
            try:
                detected_fields = _detect_fields_logic(db, detection)
            except Exception as detect_error:
                db.rollback()
                data_source = ReportDataSourceCRUD.get_by_id(db, data_source_id)
                if not data_source:
                    raise ValueError("数据源不存在")
                raise ValueError(f"字段检测失败: {str(detect_error)}")
            
            existing_fields = db.query(ReportDataSourceField).filter(
                ReportDataSourceField.data_source_id == data_source_id
            ).all()
            
            existing_field_names = {field.field_name for field in existing_fields}
            synced_fields = []
            
            for detected_field in detected_fields:
                if detected_field.field_name not in existing_field_names:
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
            
            data_source.field_count = len(detected_fields)
            data_source.last_sync_at = func.now()
            db.commit()
            for field in synced_fields:
                db.refresh(field)
            return synced_fields
        except Exception as e:
            db.rollback()
            raise e

    @staticmethod
    def get_statistics(db: Session, data_source_id: int) -> Dict[str, Any]:
        data_source = ReportDataSourceCRUD.get_by_id(db, data_source_id)
        if not data_source:
            raise ValueError("数据源不存在")
        try:
            stats = {
                "total_records": 0,
                "field_count": data_source.field_count or 0,
                "usage_count": data_source.usage_count or 0,
                "last_used_at": data_source.last_used_at,
                "last_sync_at": data_source.last_sync_at,
                "data_size": {"total": 0, "data": 0, "index": 0}
            }
            if data_source.source_type in ['table', 'view'] and data_source.schema_name:
                table_name = data_source.table_name or data_source.view_name
                if table_name:
                    try:
                        count_query = text(f"SELECT COUNT(*) as total_records FROM {data_source.schema_name}.{table_name}")
                        result = db.execute(count_query)
                        stats["total_records"] = result.fetchone()[0]
                        size_query = text("""SELECT pg_total_relation_size(schemaname||'.'||tablename) / 1024 / 1024 as total_mb,
                                       pg_relation_size(schemaname||'.'||tablename) / 1024 / 1024 as data_mb,
                                       (pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) / 1024 / 1024 as index_mb
                                FROM pg_tables WHERE schemaname = :schema_name AND tablename = :table_name""")
                        size_result = db.execute(size_query, {'schema_name': data_source.schema_name, 'table_name': table_name})
                        size_row = size_result.fetchone()
                        if size_row:
                            stats["data_size"] = {"total": round(size_row[0], 2), "data": round(size_row[1], 2), "index": round(size_row[2], 2)}
                    except Exception as e:
                        pass # Keep default values if query fails
            return stats
        except Exception as e:
            raise e

    @staticmethod
    def get_access_logs(db: Session, data_source_id: int, skip: int = 0, limit: int = 10) -> List[Dict[str, Any]]:
        return _get_access_logs_logic(db, data_source_id, skip, limit) # Delegated to helper

    @staticmethod
    def preview_data(db: Session, data_source_id: int, limit: int = 10, filters: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        data_source = ReportDataSourceCRUD.get_by_id(db, data_source_id)
        if not data_source:
            raise ValueError("数据源不存在")
        try:
            if data_source.source_type in ['table', 'view'] and data_source.schema_name:
                table_name = data_source.table_name or data_source.view_name
                if table_name:
                    query = f"SELECT * FROM {data_source.schema_name}.{table_name}"
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
                    result = db.execute(text(query), params)
                    columns = result.keys()
                    rows = result.fetchall()
                    data = []
                    for row in rows:
                        row_dict = {}
                        for i, col in enumerate(columns):
                            value = row[i]
                            if hasattr(value, 'isoformat'): value = value.isoformat()
                            elif hasattr(value, '__str__') and not isinstance(value, (str, int, float, bool)): value = str(value)
                            row_dict[col] = value
                        data.append(row_dict)
                    return data
            elif data_source.source_type == 'query' and data_source.custom_query:
                query = data_source.custom_query
                if not query.upper().strip().endswith('LIMIT'): query += f" LIMIT {limit}"
                result = db.execute(text(query))
                columns = result.keys()
                rows = result.fetchall()
                data = []
                for row in rows:
                    row_dict = {}
                    for i, col in enumerate(columns):
                        value = row[i]
                        if hasattr(value, 'isoformat'): value = value.isoformat()
                        elif hasattr(value, '__str__') and not isinstance(value, (str, int, float, bool)): value = str(value)
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
        try:
            data_sources = {}
            for ds_id in data_source_ids:
                ds = ReportDataSourceCRUD.get_by_id(db, ds_id)
                if not ds: raise ValueError(f"数据源 {ds_id} 不存在")
                data_sources[str(ds_id)] = ds
            
            if not fields:
                main_ds_id = str(data_source_ids[0])
                main_ds = data_sources[main_ds_id]
                fields = [f"{main_ds_id}.id", f"{main_ds_id}.name"]
            
            select_fields = []
            for field in fields:
                if '.' in field:
                    ds_id, field_name = field.split('.', 1)
                    if ds_id in data_sources:
                        select_fields.append(f'ds_{ds_id}.{field_name} AS "{field}"')
                else:
                    main_ds_id = str(data_source_ids[0])
                    select_fields.append(f'ds_{main_ds_id}.{field} AS "{main_ds_id}.{field}"')
            
            if not select_fields: select_fields = ["*"]
            
            main_ds_id = str(data_source_ids[0])
            main_ds = data_sources[main_ds_id]
            main_table = main_ds.table_name or main_ds.view_name
            if not main_table: raise ValueError(f"主数据源 {main_ds.name} 没有指定表或视图")
            from_clause = f"{main_ds.schema_name}.{main_table} AS ds_{main_ds_id}"
            
            join_clauses = []
            for join in joins:
                left_ds_id = str(join.get('left_data_source_id'))
                right_ds_id = str(join.get('right_data_source_id'))
                if right_ds_id not in data_sources: continue
                right_ds = data_sources[right_ds_id]
                right_table = right_ds.table_name or right_ds.view_name
                if not right_table: continue
                join_clause = f"{join.get('join_type', 'left').upper()} JOIN {right_ds.schema_name}.{right_table} AS ds_{right_ds_id}"
                join_clause += f" ON ds_{left_ds_id}.{join.get('left_field_name')} = ds_{right_ds_id}.{join.get('right_field_name')}"
                if join.get('condition'): join_clause += f" AND {join['condition']}"
                join_clauses.append(join_clause)
            
            query = f"SELECT {', '.join(select_fields)}\nFROM {from_clause}"
            for join_clause in join_clauses: query += f"\n{join_clause}"
            
            where_conditions = []
            params = {}
            if filters:
                for field, value in filters.items():
                    if value is not None:
                        if '.' in field:
                            ds_id, field_name = field.split('.', 1)
                            where_conditions.append(f"ds_{ds_id}.{field_name} = :param_{field.replace('.', '_')}")
                            params[f"param_{field.replace('.', '_')}"] = value
                        else:
                            where_conditions.append(f"ds_{main_ds_id}.{field} = :param_{field}")
                            params[f"param_{field}"] = value
            if where_conditions: query += "\nWHERE " + " AND ".join(where_conditions)
            
            count_query = f"SELECT COUNT(*) FROM {from_clause}"
            for join_clause in join_clauses: count_query += f"\n{join_clause}"
            if where_conditions: count_query += "\nWHERE " + " AND ".join(where_conditions)
            total_result = db.execute(text(count_query), params)
            total_count = total_result.scalar()

            query += f"\nLIMIT {limit}"
            if offset > 0: query += f" OFFSET {offset}"
            
            result = db.execute(text(query), params)
            columns = result.keys()
            data = [dict(zip(columns, row)) for row in result.fetchall()]
            
            return {"data": data, "total": total_count}
            
        except Exception as e:
            import traceback
            traceback.print_exc()
            raise ValueError(f"多数据源查询失败: {str(e)}") 