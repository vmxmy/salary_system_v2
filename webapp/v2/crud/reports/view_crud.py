"""
报表视图CRUD操作模块
负责报表视图的完整管理功能
"""

from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import text, func
from ...models.reports import ReportView
from ...pydantic_models.reports import ReportViewCreate, ReportViewUpdate


class ReportViewCRUD:
    """报表视图CRUD操作类"""
    
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
        
        # 检查SQL查询是否真正发生变化
        sql_changed = False
        if 'sql_query' in update_data:
            old_sql = db_view.sql_query.strip() if db_view.sql_query else ""
            new_sql = update_data['sql_query'].strip() if update_data['sql_query'] else ""
            sql_changed = old_sql != new_sql
        
        # 更新字段
        for field, value in update_data.items():
            setattr(db_view, field, value)
        
        # 只有在SQL查询真正发生变化时才重置视图状态
        if sql_changed:
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
        drop_sql = text(f"DROP VIEW IF EXISTS {schema_name}.{view_name}")
        db.execute(drop_sql)
        db.commit()
    
    @staticmethod
    def validate_sql(db: Session, sql_query: str, schema_name: str = "reports") -> Dict[str, Any]:
        """验证SQL查询"""
        import time
        
        try:
            # 创建一个临时视图来验证SQL
            temp_view_name = f"temp_validation_{int(time.time())}"
            
            # 先尝试执行查询以验证语法
            validation_sql = text(f"EXPLAIN {sql_query}")
            db.execute(validation_sql)
            
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
        db_view = db.query(ReportView).filter(ReportView.id == view_id).first()
        if not db_view:
            raise ValueError("视图不存在")
        
        if db_view.view_status != "created":
            raise ValueError("视图未同步到数据库")
        
        try:
            # 构建基本查询
            base_query = f"SELECT * FROM {db_view.schema_name}.{db_view.view_name}"
            count_query = f"SELECT COUNT(*) FROM {db_view.schema_name}.{db_view.view_name}"
            
            where_conditions = []
            params = {}
            
            # 添加筛选条件
            if filters:
                for field, value in filters.items():
                    if value is not None:
                        where_conditions.append(f"{field} = :{field}")
                        params[field] = value
            
            where_clause = ""
            if where_conditions:
                where_clause = " WHERE " + " AND ".join(where_conditions)
                base_query += where_clause
                count_query += where_clause
            
            # 添加排序
            if sorting:
                order_clauses = []
                for sort_item in sorting:
                    field = sort_item.get('field')
                    direction = sort_item.get('direction', 'asc').upper()
                    if field and direction in ['ASC', 'DESC']:
                        order_clauses.append(f"{field} {direction}")
                
                if order_clauses:
                    base_query += " ORDER BY " + ", ".join(order_clauses)
            
            # 添加分页
            offset = (page - 1) * page_size
            base_query += f" LIMIT {page_size} OFFSET {offset}"
            
            # 执行查询
            result = db.execute(text(base_query), params)
            columns = result.keys()
            rows = result.fetchall()
            
            # 获取总数
            count_result = db.execute(text(count_query), params)
            total_count = count_result.scalar()
            
            # 构建列信息 - 为了兼容前端期望的格式
            column_info = []
            for col in columns:
                column_info.append({
                    'key': str(col),
                    'title': str(col),
                    'dataIndex': str(col)
                })
            
            # 转换数据
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
                    row_dict[str(col)] = value
                data.append(row_dict)
            
            db_view.last_used_at = func.now()
            db.commit()
            db.refresh(db_view)

            return {
                'columns': column_info,
                'data': data,
                'total': total_count,
                'page': page,
                'page_size': page_size
            }
            
        except Exception as e:
            raise ValueError(f"查询视图数据失败: {str(e)}")
