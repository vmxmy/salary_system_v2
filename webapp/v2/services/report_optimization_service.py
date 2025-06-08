"""
报表优化服务
提供智能的视图选择、查询优化和性能监控功能
"""

from typing import Dict, List, Any, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import text
import time
import logging
from datetime import datetime, timedelta

from ..models.reports import ReportDataSource, ReportTemplate
from ..pydantic_models.reports import ReportQuery


class ReportOptimizationService:
    """报表优化服务"""
    
    # 视图映射配置
    VIEW_MAPPING = {
        ('payroll', 'payroll_entries'): 'v_payroll_entries_detailed',
        ('payroll', 'payroll_periods'): 'v_payroll_periods_detail',
        ('payroll', 'payroll_runs'): 'v_payroll_runs_detail',
        ('hr', 'employees'): 'v_employees_basic',
        ('config', 'payroll_component_definitions'): 'v_payroll_components_basic',
        ('reports', 'employee_salary_details'): 'employee_salary_details_view'
    }
    
    # 快速查询视图映射
    FAST_QUERY_MAPPING = {
        ('payroll', 'entries'): 'public.v_payroll_entries_detailed',
        ('payroll', 'entries_basic'): 'public.v_payroll_entries_basic',
        ('payroll', 'periods'): 'public.v_payroll_periods_detail',
        ('payroll', 'runs'): 'public.v_payroll_runs_detail',
        ('payroll', 'summary'): 'public.v_payroll_summary_analysis',
        ('payroll', 'components'): 'public.v_payroll_components_basic',
        ('payroll', 'component_usage'): 'public.v_payroll_component_usage',
        ('hr', 'employees'): 'public.v_employees_basic',
        ('hr', 'salary_history'): 'public.v_employee_salary_history',
        ('reports', 'salary_details'): 'reports.employee_salary_details_view',
        ('audit', 'overview'): 'payroll.audit_overview',
        ('audit', 'anomalies'): 'payroll.audit_anomalies_detail'
    }
    
    @classmethod
    def should_use_optimized_view(
        cls, 
        data_source: ReportDataSource, 
        query: Optional[ReportQuery] = None
    ) -> bool:
        """判断是否应该使用优化视图"""
        # 如果数据源本身就是视图，优先使用
        if data_source.source_type == 'view' and data_source.view_name:
            return True
        
        # 检查是否有对应的优化视图
        view_key = (data_source.schema_name, data_source.table_name)
        if view_key in cls.VIEW_MAPPING:
            return True
        
        # 如果查询包含复杂的聚合或JOIN，建议使用视图
        if query:
            template_config = getattr(query, 'template_config', {}) or {}
            if template_config.get('has_aggregation') or template_config.get('has_complex_joins'):
                return True
        
        return False
    
    @classmethod
    def get_optimized_view_name(
        cls, 
        data_source: ReportDataSource, 
        use_public_schema: bool = True
    ) -> str:
        """获取优化视图名称"""
        # 如果数据源本身就是视图
        if data_source.source_type == 'view' and data_source.view_name:
            return f"{data_source.schema_name}.{data_source.view_name}"
        
        # 查找映射的优化视图
        view_key = (data_source.schema_name, data_source.table_name)
        if view_key in cls.VIEW_MAPPING:
            view_name = cls.VIEW_MAPPING[view_key]
            schema_prefix = "public." if use_public_schema else ""
            return f"{schema_prefix}{view_name}"
        
        # 回退到原始表
        return f"{data_source.schema_name}.{data_source.table_name}"
    
    @classmethod
    def get_fast_query_view_name(cls, data_source_type: str, category: str) -> str:
        """获取快速查询视图名称"""
        return cls.FAST_QUERY_MAPPING.get((data_source_type, category), "")
    
    @classmethod
    async def execute_optimized_query(
        cls,
        db: Session,
        data_source: ReportDataSource,
        query: ReportQuery,
        template: Optional[ReportTemplate] = None
    ) -> Dict[str, Any]:
        """执行优化查询"""
        start_time = time.time()
        
        try:
            # 获取优化视图名称
            view_name = cls.get_optimized_view_name(data_source)
            
            # 构建查询
            select_fields = cls._build_select_fields(template, query)
            where_clause, params = cls._build_where_clause(query.filters or {})
            order_clause = cls._build_order_clause(query.sorting or [])
            
            # 构建基础查询
            base_query = f"SELECT {select_fields} FROM {view_name}"
            if where_clause:
                base_query += f" WHERE {where_clause}"
            if order_clause:
                base_query += f" ORDER BY {order_clause}"
            
            # 获取总数
            count_query = f"SELECT COUNT(*) FROM {view_name}"
            if where_clause:
                count_query += f" WHERE {where_clause}"
            
            total_result = db.execute(text(count_query), params)
            total = total_result.scalar() or 0
            
            # 添加分页
            offset = (query.page - 1) * query.page_size
            paginated_query = f"{base_query} LIMIT {query.page_size} OFFSET {offset}"
            
            # 执行查询
            result = db.execute(text(paginated_query), params)
            columns = [{"key": col, "title": col, "dataIndex": col} for col in result.keys()]
            data = [dict(zip(result.keys(), row)) for row in result.fetchall()]
            
            execution_time = time.time() - start_time
            
            # 记录性能
            cls._log_performance(
                template_id=template.id if template else None,
                execution_time=execution_time,
                used_optimized_view=True,
                result_count=len(data),
                view_name=view_name
            )
            
            return {
                "columns": columns,
                "data": data,
                "total": total,
                "execution_time": round(execution_time, 3),
                "used_optimized_view": True,
                "view_name": view_name
            }
            
        except Exception as e:
            execution_time = time.time() - start_time
            logging.error(f"优化查询失败: {str(e)}, 耗时: {execution_time:.3f}s")
            raise ValueError(f"优化查询失败: {str(e)}")
    
    @classmethod
    async def execute_fast_query(
        cls,
        db: Session,
        data_source_type: str,
        category: str,
        filters: Dict[str, Any] = None,
        sorting: List[Dict[str, Any]] = None,
        page: int = 1,
        page_size: int = 20,
        fields: List[str] = None
    ) -> Dict[str, Any]:
        """执行快速查询"""
        start_time = time.time()
        
        try:
            # 获取快速查询视图
            view_name = cls.get_fast_query_view_name(data_source_type, category)
            if not view_name:
                raise ValueError("该查询类型暂不支持快速查询")
            
            # 构建查询
            select_fields = ", ".join(fields) if fields else "*"
            where_clause, params = cls._build_where_clause(filters or {})
            order_clause = cls._build_order_clause(sorting or [])
            
            base_query = f"SELECT {select_fields} FROM {view_name}"
            if where_clause:
                base_query += f" WHERE {where_clause}"
            if order_clause:
                base_query += f" ORDER BY {order_clause}"
            
            # 获取总数
            count_query = f"SELECT COUNT(*) FROM {view_name}"
            if where_clause:
                count_query += f" WHERE {where_clause}"
            
            total_result = db.execute(text(count_query), params)
            total = total_result.scalar() or 0
            
            # 添加分页
            offset = (page - 1) * page_size
            paginated_query = f"{base_query} LIMIT {page_size} OFFSET {offset}"
            
            # 执行查询
            result = db.execute(text(paginated_query), params)
            columns = [{"key": col, "title": col, "dataIndex": col} for col in result.keys()]
            data = [dict(zip(result.keys(), row)) for row in result.fetchall()]
            
            execution_time = time.time() - start_time
            
            # 记录性能
            cls._log_performance(
                template_id=None,
                execution_time=execution_time,
                used_optimized_view=True,
                result_count=len(data),
                view_name=view_name,
                query_type="fast_query"
            )
            
            return {
                "columns": columns,
                "data": data,
                "total": total,
                "execution_time": round(execution_time, 3),
                "used_optimized_view": True,
                "view_name": view_name
            }
            
        except Exception as e:
            execution_time = time.time() - start_time
            logging.error(f"快速查询失败: {str(e)}, 耗时: {execution_time:.3f}s")
            raise ValueError(f"快速查询失败: {str(e)}")
    
    @classmethod
    async def execute_preview_query(
        cls,
        db: Session,
        data_source: ReportDataSource,
        limit: int = 10,
        filters: Dict[str, Any] = None
    ) -> List[Dict[str, Any]]:
        """执行预览查询"""
        start_time = time.time()
        
        try:
            # 获取优化视图名称
            view_name = cls.get_optimized_view_name(data_source)
            
            # 构建查询
            query = f"SELECT * FROM {view_name}"
            params = {}
            
            # 添加筛选条件
            if filters:
                where_conditions = []
                for field, value in filters.items():
                    if value is not None and value != '':
                        where_conditions.append(f"{field} = :{field}")
                        params[field] = value
                
                if where_conditions:
                    query += " WHERE " + " AND ".join(where_conditions)
            
            # 添加限制
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
                    # 处理特殊数据类型
                    if hasattr(value, 'isoformat'):
                        value = value.isoformat()
                    elif hasattr(value, '__str__') and not isinstance(value, (str, int, float, bool, type(None))):
                        value = str(value)
                    row_dict[col] = value
                data.append(row_dict)
            
            execution_time = time.time() - start_time
            
            # 记录性能
            cls._log_performance(
                template_id=None,
                execution_time=execution_time,
                used_optimized_view=True,
                result_count=len(data),
                view_name=view_name,
                query_type="preview"
            )
            
            return data
            
        except Exception as e:
            execution_time = time.time() - start_time
            logging.error(f"预览查询失败: {str(e)}, 耗时: {execution_time:.3f}s")
            raise ValueError(f"预览查询失败: {str(e)}")
    
    @classmethod
    def _build_select_fields(cls, template: Optional[ReportTemplate], query: ReportQuery) -> str:
        """构建SELECT字段列表"""
        if template:
            template_config = template.template_config or {}
            selected_fields = template_config.get('selected_fields', [])
            if selected_fields:
                return ", ".join(selected_fields)
        
        # 检查查询中是否指定了字段
        if hasattr(query, 'fields') and query.fields:
            return ", ".join(query.fields)
        
        return "*"
    
    @classmethod
    def _build_where_clause(cls, filters: Dict[str, Any]) -> Tuple[str, Dict[str, Any]]:
        """构建WHERE子句"""
        where_conditions = []
        params = {}
        
        for field, value in filters.items():
            if value is not None and value != '':
                if isinstance(value, str) and '%' in value:
                    # 支持模糊查询
                    where_conditions.append(f"{field} ILIKE :{field}")
                    params[field] = value
                elif isinstance(value, list):
                    # 支持IN查询
                    placeholders = [f":{field}_{i}" for i in range(len(value))]
                    where_conditions.append(f"{field} IN ({', '.join(placeholders)})")
                    for i, v in enumerate(value):
                        params[f"{field}_{i}"] = v
                elif isinstance(value, dict):
                    # 支持范围查询
                    if 'min' in value and value['min'] is not None:
                        where_conditions.append(f"{field} >= :{field}_min")
                        params[f"{field}_min"] = value['min']
                    if 'max' in value and value['max'] is not None:
                        where_conditions.append(f"{field} <= :{field}_max")
                        params[f"{field}_max"] = value['max']
                else:
                    # 精确匹配
                    where_conditions.append(f"{field} = :{field}")
                    params[field] = value
        
        where_clause = " AND ".join(where_conditions) if where_conditions else ""
        return where_clause, params
    
    @classmethod
    def _build_order_clause(cls, sorting: List[Dict[str, Any]]) -> str:
        """构建ORDER BY子句"""
        if not sorting:
            return ""
        
        order_parts = []
        for sort_item in sorting:
            field = sort_item.get('field')
            direction = sort_item.get('direction', 'asc').upper()
            if field and direction in ['ASC', 'DESC']:
                order_parts.append(f"{field} {direction}")
        
        return ", ".join(order_parts)
    
    @classmethod
    def _log_performance(
        cls,
        template_id: Optional[int],
        execution_time: float,
        used_optimized_view: bool,
        result_count: int,
        view_name: str,
        query_type: str = "standard"
    ):
        """记录查询性能日志"""
        try:
            logging.info(
                f"报表查询性能 - "
                f"类型: {query_type}, "
                f"模板ID: {template_id}, "
                f"视图: {view_name}, "
                f"执行时间: {execution_time:.3f}s, "
                f"使用优化视图: {used_optimized_view}, "
                f"结果数量: {result_count}"
            )
        except Exception as e:
            logging.warning(f"记录查询性能失败: {str(e)}")
    
    @classmethod
    def get_performance_stats(cls, db: Session, hours: int = 24) -> Dict[str, Any]:
        """获取性能统计信息"""
        try:
            # 这里可以从日志或性能监控表中获取统计信息
            # 暂时返回模拟数据
            return {
                "total_queries": 0,
                "optimized_queries": 0,
                "average_execution_time": 0.0,
                "optimization_rate": 0.0,
                "top_slow_queries": [],
                "view_usage_stats": {}
            }
        except Exception as e:
            logging.error(f"获取性能统计失败: {str(e)}")
            return {}
    
    @classmethod
    def suggest_optimization(cls, data_source: ReportDataSource) -> Dict[str, Any]:
        """建议优化策略"""
        suggestions = []
        
        # 检查是否有对应的优化视图
        view_key = (data_source.schema_name, data_source.table_name)
        if view_key in cls.VIEW_MAPPING:
            suggestions.append({
                "type": "use_optimized_view",
                "message": f"建议使用优化视图 {cls.VIEW_MAPPING[view_key]}",
                "priority": "high"
            })
        
        # 检查数据源配置
        if not data_source.cache_enabled:
            suggestions.append({
                "type": "enable_cache",
                "message": "建议启用数据源缓存以提升性能",
                "priority": "medium"
            })
        
        if data_source.max_rows > 10000:
            suggestions.append({
                "type": "limit_rows",
                "message": "建议限制最大返回行数以避免性能问题",
                "priority": "medium"
            })
        
        return {
            "suggestions": suggestions,
            "optimization_score": len([s for s in suggestions if s["priority"] == "high"]) * 30 + 
                               len([s for s in suggestions if s["priority"] == "medium"]) * 20
        } 