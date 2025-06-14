from typing import List, Optional, Dict, Any, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import text, func, or_, select, table, column, MetaData, inspect, Table
from sqlalchemy.exc import NoSuchTableError
from ...models.reports import ReportDataSource
# ReportDataSourceField 已移除，改为动态获取字段
from ...pydantic_models.reports import (
    ReportDataSourceCreate, ReportDataSourceUpdate,
    DataSourceFieldDetection, DetectedField,
    DataSourceConnectionTest, DataSourceConnectionTestResponse
)
from ._report_data_source_helpers import (
    _detect_fields_logic, _test_connection_logic, _get_access_logs_logic
)
import re

# 数据源CRUD
class ReportDataSourceCRUD:
    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 100) -> List[ReportDataSource]:
        return db.query(ReportDataSource).offset(skip).limit(limit).all()

    @staticmethod
    def get_all_with_filter(
        db: Session, 
        skip: int = 0, 
        limit: int = 100,
        search: Optional[str] = None,
        is_active: Optional[bool] = None,
        schema_name: Optional[str] = None
    ) -> Tuple[List[ReportDataSource], int]:
        query = db.query(ReportDataSource)

        if search:
            search_term = f"%{search}%"
            query = query.filter(
                or_(
                    ReportDataSource.name.ilike(search_term),
                    ReportDataSource.code.ilike(search_term),
                    ReportDataSource.description.ilike(search_term)
                )
            )
        
        if is_active is not None:
            query = query.filter(ReportDataSource.is_active == is_active)

        if schema_name:
            query = query.filter(ReportDataSource.schema_name == schema_name)

        total = query.count()
        data_sources = query.offset(skip).limit(limit).all()
        
        return data_sources, total

    @staticmethod
    def get_by_id(db: Session, data_source_id: int) -> Optional[ReportDataSource]:
        return db.query(ReportDataSource).filter(ReportDataSource.id == data_source_id).first()

    @staticmethod
    def get_by_code(db: Session, data_source_code: str) -> Optional[ReportDataSource]:
        return db.query(ReportDataSource).filter(ReportDataSource.code == data_source_code).first()

    @staticmethod
    def create(db: Session, data_source: ReportDataSourceCreate, user_id: int) -> ReportDataSource:
        try:
            db_data_source = ReportDataSource(
                **data_source.dict(exclude={'fields'}),
                created_by=user_id
            )
            db.add(db_data_source)
            db.flush()

            # 不再创建字段记录，改为动态获取
            # if data_source.fields:
            #     for field_data in data_source.fields:
            #         db_field = ReportDataSourceField(
            #             **field_data.dict(),
            #             data_source_id=db_data_source.id
            #         )
            #         db.add(db_field)

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
                raise

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
        """
        删除数据源，支持级联删除依赖记录
        """
        try:
            db_data_source = db.query(ReportDataSource).filter(ReportDataSource.id == data_source_id).first()
            if not db_data_source:
                return False

            # 检查并处理依赖关系
            # from sqlalchemy import text  # 已在顶部导入
            
            # 1. 删除报表类型定义中的引用
            db.execute(text("DELETE FROM reports.report_type_definitions WHERE data_source_id = :data_source_id"),
                      {"data_source_id": data_source_id})
            
            # 2. 删除报表模板中的引用  
            db.execute(text("DELETE FROM config.report_templates WHERE data_source_id = :data_source_id"),
                      {"data_source_id": data_source_id})
            
            # 3. 删除访问日志记录
            db.execute(text("DELETE FROM config.report_data_source_access_logs WHERE data_source_id = :data_source_id"),
                      {"data_source_id": data_source_id})
            
            # 4. 最后删除数据源本身
            db.delete(db_data_source)
            db.commit()
            return True
            
        except Exception as e:
            db.rollback()
            # 记录错误但不抛出异常，返回False表示删除失败
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"删除数据源失败 - ID: {data_source_id}, 错误: {str(e)}")
            return False

    @staticmethod
    def detect_fields(db: Session, detection: DataSourceFieldDetection) -> List[DetectedField]:
        return _detect_fields_logic(db, detection)

    @staticmethod
    def test_connection(db: Session, connection_test: DataSourceConnectionTest) -> DataSourceConnectionTestResponse:
        return _test_connection_logic(db, connection_test)

    @staticmethod
    def sync_fields(db: Session, data_source_id: int) -> List[Dict[str, Any]]:
        """同步字段信息 - 现在只更新数据源的字段统计，不再维护字段表"""
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
            
            # 更新数据源的字段统计信息
            data_source.field_count = len(detected_fields)
            data_source.last_sync_at = func.now()
            db.commit()
            
            # 将检测到的字段转换为字典格式返回（用于API响应）
            synced_fields = []
            for i, detected_field in enumerate(detected_fields):
                field_dict = {
                    "id": i + 1,  # 临时ID
                    "field_name": detected_field.field_name,
                    "field_type": detected_field.field_type,
                    "data_type": detected_field.data_type,
                    "is_nullable": detected_field.is_nullable,
                    "is_primary_key": detected_field.is_primary_key,
                    "is_foreign_key": detected_field.is_foreign_key,
                    "is_indexed": detected_field.is_indexed,
                    "description": detected_field.comment,
                    "is_visible": True,
                    "is_searchable": True,
                    "is_sortable": True,
                    "is_filterable": True,
                    "is_exportable": True,
                    "sort_order": i + 1,
                    "display_name_zh": detected_field.display_name_zh if hasattr(detected_field, 'display_name_zh') else None,
                    "display_name_en": detected_field.display_name_en if hasattr(detected_field, 'display_name_en') else None
                }
                synced_fields.append(field_dict)
            
            return synced_fields
        except Exception as e:
            db.rollback()
            raise

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
            raise

    @staticmethod
    def get_access_logs(db: Session, data_source_id: int, skip: int = 0, limit: int = 10) -> List[Dict[str, Any]]:
        return _get_access_logs_logic(db, data_source_id, skip, limit) # Delegated to helper

    @staticmethod
    def preview_data(
        db: Session, 
        data_source_id: int, 
        skip: int = 0, 
        limit: int = 10, 
        filters: Optional[Dict[str, Any]] = None,
        sorting: Optional[List[Dict[str, str]]] = None
    ) -> Dict[str, Any]:
        """
        安全地预览数据源的数据，并支持分页、筛选和排序。
        """
        data_source = ReportDataSourceCRUD.get_by_id(db, data_source_id)
        if not data_source:
            raise ValueError("数据源不存在")

        if not data_source.source_type in ['table', 'view'] or not data_source.schema_name:
            raise ValueError("仅支持预览类型为'table'或'view'且已定义schema的数据源")
        
        target_name = data_source.table_name or data_source.view_name
        if not target_name:
            raise ValueError("数据源未指定表或视图名称")

        # 安全校验: 确保 schema 和 table name 不包含非法字符
        if not re.match(r'^[a-zA-Z0-9_]+$', data_source.schema_name) or \
           not re.match(r'^[a-zA-Z0-9_]+$', target_name):
            raise ValueError("Schema或表/视图名称包含非法字符")

        try:
            # 使用 SQLAlchemy Core 的反射机制来安全地引用表
            metadata = MetaData()
            reflected_table = Table(target_name, metadata, autoload_with=db.bind, schema=data_source.schema_name)
            
            # 构建查询
            query = select(reflected_table)
            count_query = select(func.count()).select_from(reflected_table)

            # 处理筛选
            if filters:
                filter_clauses = []
                for field, value in filters.items():
                    if hasattr(reflected_table.c, field):
                        # 简单处理，可以扩展为支持 'like', 'in' 等
                        filter_clauses.append(getattr(reflected_table.c, field) == value)
                if filter_clauses:
                    query = query.where(*filter_clauses)
                    count_query = count_query.where(*filter_clauses)

            # 获取总数
            total_records = db.execute(count_query).scalar_one()

            # 处理排序
            if sorting:
                order_by_clauses = []
                for sort_item in sorting:
                    field = sort_item.get('field')
                    direction = sort_item.get('direction', 'asc')
                    if hasattr(reflected_table.c, field):
                        col = getattr(reflected_table.c, field)
                        order_by_clauses.append(col.asc() if direction == 'asc' else col.desc())
                if order_by_clauses:
                    query = query.order_by(*order_by_clauses)

            # 处理分页
            query = query.offset(skip).limit(limit)

            # 执行查询
            result = db.execute(query)
            data = [dict(row) for row in result.mappings()]

            return {"total": total_records, "items": data}

        except NoSuchTableError:
            raise ValueError(f"表或视图 '{data_source.schema_name}.{target_name}' 不存在于数据库中")
        except Exception as e:
            # 其他数据库异常
            raise ValueError(f"预览数据时发生数据库错误: {e}")

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