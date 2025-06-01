"""
数据源预览模块
负责数据源数据预览和多数据源关联查询
"""

from typing import Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import text
from .data_source_basic_crud import ReportDataSourceBasicCRUD


class ReportDataSourcePreview:
    """数据源预览类"""
    
    @staticmethod
    def preview_data(db: Session, data_source_id: int, limit: int = 10, filters: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """预览数据源数据"""
        data_source = ReportDataSourceBasicCRUD.get_by_id(db, data_source_id)
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
            # 获取所有数据源信息
            data_sources = {}
            for ds_id in data_source_ids:
                ds = ReportDataSourceBasicCRUD.get_by_id(db, ds_id)
                if not ds:
                    raise ValueError(f"数据源 {ds_id} 不存在")
                data_sources[str(ds_id)] = ds
            
            # 如果没有字段，使用默认字段
            if not fields:
                # 获取主数据源的所有字段
                main_ds_id = str(data_source_ids[0])
                main_ds = data_sources[main_ds_id]
                fields = [f"{main_ds_id}.id", f"{main_ds_id}.name"]  # 默认字段
            
            # 构建 SELECT 子句
            select_fields = []
            
            for field in fields:
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
                else:
                    # 没有数据源前缀，使用主数据源
                    main_ds_id = str(data_source_ids[0])
                    table_alias = f"ds_{main_ds_id}"
                    alias_name = f'"{main_ds_id}.{field}"'
                    full_field = f'{table_alias}.{field} AS {alias_name}'
                    select_fields.append(full_field)
            
            if not select_fields:
                # 如果没有有效字段，使用 * 
                select_fields = ["*"]
            
            # 构建 FROM 子句
            main_ds_id = str(data_source_ids[0])
            main_ds = data_sources[main_ds_id]
            main_table = main_ds.table_name or main_ds.view_name
            if not main_table:
                raise ValueError(f"主数据源 {main_ds.name} 没有指定表或视图")
            
            from_clause = f"{main_ds.schema_name}.{main_table} AS ds_{main_ds_id}"
            
            # 构建 JOIN 子句
            join_clauses = []
            
            for join in joins:
                left_ds_id = str(join.get('left_data_source_id'))
                right_ds_id = str(join.get('right_data_source_id'))
                left_field = join.get('left_field_name')
                right_field = join.get('right_field_name')
                join_type = join.get('join_type', 'left').upper()
                
                if right_ds_id not in data_sources:
                    continue
                
                right_ds = data_sources[right_ds_id]
                right_table = right_ds.table_name or right_ds.view_name
                if not right_table:
                    continue
                
                join_clause = f"{join_type} JOIN {right_ds.schema_name}.{right_table} AS ds_{right_ds_id}"
                join_clause += f" ON ds_{left_ds_id}.{left_field} = ds_{right_ds_id}.{right_field}"
                
                # 添加额外条件
                if join.get('condition'):
                    join_clause += f" AND {join['condition']}"
                
                join_clauses.append(join_clause)
            
            # 构建完整的 SQL 查询
            query = f"SELECT {', '.join(select_fields)}\nFROM {from_clause}"
            
            for join_clause in join_clauses:
                query += f"\n{join_clause}"
            
            # 添加 WHERE 子句
            where_conditions = []
            params = {}
            if filters:
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
            result = db.execute(text(query), params)
            columns = result.keys()
            rows = result.fetchall()
            
            # 转换为字典列表
            data = []
            for row in rows:
                row_dict = {}
                for i, col in enumerate(columns):
                    # 字段名已经通过AS子句正确格式化，直接使用
                    col_name = str(col)
                    row_dict[col_name] = row[i]
                data.append(row_dict)
            
            # 获取总数（不带 LIMIT）
            count_query = f"SELECT COUNT(*) FROM {from_clause}"
            for join_clause in join_clauses:
                count_query += f"\n{join_clause}"
            if where_conditions:
                count_query += "\nWHERE " + " AND ".join(where_conditions)
            
            total_result = db.execute(text(count_query), params)
            total_count = total_result.scalar()
            
            return {
                "data": data,
                "total": total_count
            }
            
        except Exception as e:
            raise ValueError(f"多数据源查询失败: {str(e)}")
