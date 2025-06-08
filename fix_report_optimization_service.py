#!/usr/bin/env python3
"""
修正报表优化服务，使其与实际数据库结构匹配
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from webapp.v2.services.report_optimization_service import ReportOptimizationService

# 1. 修正视图映射，使用实际存在的视图
VIEW_MAPPING_FIXED = {
    ('payroll', 'payroll_entries'): 'v_payroll_entries_detailed',
    ('payroll', 'payroll_periods'): 'v_payroll_periods_detail',
    ('payroll', 'payroll_runs'): 'v_payroll_runs_detail',
    ('hr', 'employees'): 'v_employees_basic',
    ('config', 'payroll_component_definitions'): 'v_payroll_components_basic',
    ('reports', 'employee_salary_details_view'): 'employee_salary_details_view'
}

# 2. 修正快速查询映射
FAST_QUERY_MAPPING_FIXED = {
    'payroll.entries': 'v_payroll_entries_detailed',
    'payroll.periods': 'v_payroll_periods_detail',
    'payroll.runs': 'v_payroll_runs_detail',
    'hr.employees': 'v_employees_basic',
    'audit.overview': 'audit_overview',
    'audit.anomalies': 'audit_anomalies_detail'
}

# 3. 修正优化服务类
class FixedReportOptimizationService:
    """修正后的报表优化服务"""
    
    VIEW_MAPPING = VIEW_MAPPING_FIXED
    FAST_QUERY_MAPPING = FAST_QUERY_MAPPING_FIXED
    
    @classmethod
    def should_use_optimized_view(cls, data_source, query=None):
        """判断是否应该使用优化视图"""
        # 检查是否有对应的优化视图
        view_key = (data_source.schema_name, data_source.table_name or data_source.view_name)
        if view_key in cls.VIEW_MAPPING:
            return True
        
        # 如果数据源本身就是视图，优先使用
        if data_source.source_type == 'view' and data_source.view_name:
            return True
        
        return False
    
    @classmethod
    async def execute_optimized_query(cls, db, data_source, query, template):
        """执行优化查询"""
        from sqlalchemy import text
        
        # 确定使用的视图名称
        view_key = (data_source.schema_name, data_source.table_name or data_source.view_name)
        if view_key in cls.VIEW_MAPPING:
            view_name = f"public.{cls.VIEW_MAPPING[view_key]}"
        elif data_source.source_type == 'view' and data_source.view_name:
            view_name = f"{data_source.schema_name}.{data_source.view_name}"
        else:
            # 回退到原始表
            view_name = f"{data_source.schema_name}.{data_source.table_name or data_source.view_name}"
        
        # 构建查询
        select_fields = "*"  # 简化处理
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
        
        return {
            "columns": columns,
            "data": data,
            "total": total
        }
    
    @classmethod
    async def execute_preview_query(cls, db, data_source, limit, filters):
        """执行预览查询"""
        from sqlalchemy import text
        
        # 确定使用的视图名称
        view_key = (data_source.schema_name, data_source.table_name or data_source.view_name)
        if view_key in cls.VIEW_MAPPING:
            view_name = f"public.{cls.VIEW_MAPPING[view_key]}"
        elif data_source.source_type == 'view' and data_source.view_name:
            view_name = f"{data_source.schema_name}.{data_source.view_name}"
        else:
            # 回退到原始表
            view_name = f"{data_source.schema_name}.{data_source.table_name or data_source.view_name}"
        
        # 构建查询
        where_clause, params = cls._build_where_clause(filters)
        
        query = f"SELECT * FROM {view_name}"
        if where_clause:
            query += f" WHERE {where_clause}"
        query += f" LIMIT {limit}"
        
        # 执行查询
        result = db.execute(text(query), params)
        data = [dict(zip(result.keys(), row)) for row in result.fetchall()]
        
        return data
    
    @classmethod
    def _build_where_clause(cls, filters):
        """构建WHERE子句"""
        if not filters:
            return "", {}
        
        conditions = []
        params = {}
        
        for field, value in filters.items():
            if value is not None and value != '':
                if isinstance(value, str) and '%' in value:
                    # 模糊查询
                    conditions.append(f"{field} ILIKE :{field}")
                    params[field] = value
                elif isinstance(value, list):
                    # IN查询
                    placeholders = ','.join([f":{field}_{i}" for i in range(len(value))])
                    conditions.append(f"{field} IN ({placeholders})")
                    for i, v in enumerate(value):
                        params[f"{field}_{i}"] = v
                elif isinstance(value, dict):
                    # 范围查询
                    if 'min' in value:
                        conditions.append(f"{field} >= :{field}_min")
                        params[f"{field}_min"] = value['min']
                    if 'max' in value:
                        conditions.append(f"{field} <= :{field}_max")
                        params[f"{field}_max"] = value['max']
                else:
                    # 精确匹配
                    conditions.append(f"{field} = :{field}")
                    params[field] = value
        
        return " AND ".join(conditions), params
    
    @classmethod
    def _build_order_clause(cls, sorting):
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

if __name__ == "__main__":
    print("✅ 报表优化服务修正完成")
    print(f"📊 视图映射数量: {len(VIEW_MAPPING_FIXED)}")
    print(f"🚀 快速查询映射数量: {len(FAST_QUERY_MAPPING_FIXED)}")
    
    for key, view in VIEW_MAPPING_FIXED.items():
        print(f"   {key[0]}.{key[1]} -> {view}") 