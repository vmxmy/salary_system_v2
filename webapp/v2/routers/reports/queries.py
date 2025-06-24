from typing import List, Dict, Any
import time
import logging
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from ...database import get_db_v2
from ...models.security import User
from ....auth import get_current_user
from ...crud.reports import ReportTemplateCRUD, ReportExecutionCRUD
from ...pydantic_models.reports import (
    ReportExecution, ReportExecutionCreate, ReportQuery, ReportData
)
from ...pydantic_models.common import PaginationResponse, PaginationMeta

router = APIRouter(tags=["queries"])


@router.get("/executions", response_model=PaginationResponse[ReportExecution])
async def get_report_executions(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """获取报表执行列表，支持分页"""
    executions, total = ReportExecutionCRUD.get_all(db, skip=skip, limit=limit)
    
    total_pages = (total + limit - 1) // limit if total > 0 else 1

    pagination_meta = PaginationMeta(
        page=(skip // limit) + 1,
        size=limit,
        total=total,
        totalPages=total_pages
    )
    return PaginationResponse[ReportExecution](
        data=executions,
        meta=pagination_meta
    )


@router.get("/executions/{execution_id}", response_model=ReportExecution)
async def get_report_execution(
    execution_id: int,
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """获取报表执行记录详情"""
    execution = ReportExecutionCRUD.get_by_id(db, execution_id)
    if not execution:
        raise HTTPException(status_code=404, detail="执行记录不存在")
    return execution


@router.post("/executions", response_model=ReportExecution)
async def create_report_execution(
    execution: ReportExecutionCreate,
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """创建报表执行记录"""
    return ReportExecutionCRUD.create(db, execution, current_user.id)


@router.post("/query", response_model=ReportData)
async def query_report_data(
    query: ReportQuery,
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """查询报表数据 - 优化版本，智能使用视图"""
    template = ReportTemplateCRUD.get_by_id(db, query.template_id)
    if not template:
        raise HTTPException(status_code=404, detail="报表模板不存在")
    
    # 增加使用次数
    ReportTemplateCRUD.increment_usage(db, query.template_id)
    
    start_time = time.time()
    
    try:
        # 获取数据源信息
        data_source = template.data_source
        if not data_source:
            raise HTTPException(status_code=400, detail="报表模板未配置数据源")
        
        # 使用优化服务进行智能查询
        from ...services.report_optimization_service import ReportOptimizationService
        
        use_optimized_view = ReportOptimizationService.should_use_optimized_view(data_source, query)
        
        if use_optimized_view:
            # 使用优化视图查询
            result = await ReportOptimizationService.execute_optimized_query(db, data_source, query, template)
        else:
            # 使用传统查询
            result = await _query_with_traditional_method(db, data_source, query, template)
        
        execution_time = time.time() - start_time
        
        # 记录查询性能
        _log_query_performance(db, template.id, execution_time, use_optimized_view, len(result.get('data', [])))
        
        return ReportData(
            columns=result.get('columns', []),
            data=result.get('data', []),
            total=result.get('total', 0),
            page=query.page,
            page_size=query.page_size,
            execution_time=round(execution_time, 3)
        )
        
    except Exception as e:
        execution_time = time.time() - start_time
        logging.error(f"报表查询失败 - 模板ID: {query.template_id}, 错误: {str(e)}, 耗时: {execution_time:.3f}s")
        raise HTTPException(status_code=500, detail=f"报表查询失败: {str(e)}")


@router.post("/query-fast", response_model=ReportData)
async def query_report_data_fast(
    query: ReportQuery,
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """快速查询报表数据 - 专门为高性能场景优化"""
    template = ReportTemplateCRUD.get_by_id(db, query.template_id)
    if not template:
        raise HTTPException(status_code=404, detail="报表模板不存在")
    
    start_time = time.time()
    
    try:
        # 获取数据源信息
        data_source = template.data_source
        if not data_source:
            raise HTTPException(status_code=400, detail="报表模板未配置数据源")
        
        # 强制使用优化视图
        result = await _query_with_optimized_view(db, data_source, query, template)
        
        execution_time = time.time() - start_time
        
        return ReportData(
            columns=result.get('columns', []),
            data=result.get('data', []),
            total=result.get('total', 0),
            page=query.page,
            page_size=query.page_size,
            execution_time=round(execution_time, 3)
        )
        
    except Exception as e:
        execution_time = time.time() - start_time
        logging.error(f"快速报表查询失败 - 模板ID: {query.template_id}, 错误: {str(e)}, 耗时: {execution_time:.3f}s")
        raise HTTPException(status_code=500, detail=f"快速报表查询失败: {str(e)}")


# 辅助函数
async def _query_with_traditional_method(
    db: Session,
    data_source,
    query: ReportQuery,
    template
) -> Dict[str, Any]:
    """使用传统方法进行查询"""
    try:
        filters = query.filters or {}
        limit = query.page_size
        offset = (query.page - 1) * query.page_size
        
        # 构建查询
        if data_source.source_type == 'query' and data_source.custom_query:
            base_query = data_source.custom_query
        else:
            table_name = data_source.table_name or data_source.view_name
            base_query = f"SELECT * FROM {data_source.schema_name}.{table_name}"
        
        # 添加筛选条件
        where_conditions = []
        params = {}
        for field, value in filters.items():
            if value is not None and value != '':
                where_conditions.append(f"{field} = :{field}")
                params[field] = value
        
        if where_conditions:
            base_query += " WHERE " + " AND ".join(where_conditions)
        
        # 获取总数
        count_query = f"SELECT COUNT(*) FROM ({base_query}) AS count_subquery"
        total_result = db.execute(text(count_query), params)
        total = total_result.scalar() or 0
        
        # 添加排序和分页
        if query.sorting:
            order_parts = []
            for sort_item in query.sorting:
                field = sort_item.get('field')
                direction = sort_item.get('direction', 'asc').upper()
                if field and direction in ['ASC', 'DESC']:
                    order_parts.append(f"{field} {direction}")
            if order_parts:
                base_query += f" ORDER BY {', '.join(order_parts)}"
        
        base_query += f" LIMIT {limit} OFFSET {offset}"
        
        # 执行查询
        result = db.execute(text(base_query), params)
        columns = [{"key": col, "title": col, "dataIndex": col} for col in result.keys()]
        data = [dict(zip(result.keys(), row)) for row in result.fetchall()]
        
        return {
            "columns": columns,
            "data": data,
            "total": total
        }
        
    except Exception as e:
        logging.error(f"传统查询方法失败: {str(e)}")
        raise


async def _query_with_optimized_view(
    db: Session, 
    data_source, 
    query: ReportQuery, 
    template
) -> Dict[str, Any]:
    """使用优化视图进行查询"""
    # 映射到对应的优化视图
    view_mapping = {
        ('payroll', 'payroll_entries'): 'v_payroll_entries_detailed',
        ('payroll', 'payroll_periods'): 'v_payroll_periods_detail', 
        ('payroll', 'payroll_runs'): 'v_payroll_runs_detail',
        ('hr', 'employees'): 'v_employees_basic',
        ('config', 'payroll_component_definitions'): 'v_payroll_components_basic'
    }
    
    # 确定使用的视图名称
    if data_source.source_type == 'view' and data_source.view_name:
        view_name = f"{data_source.schema_name}.{data_source.view_name}"
    else:
        view_key = (data_source.schema_name, data_source.table_name)
        if view_key in view_mapping:
            view_name = f"reports.{view_mapping[view_key]}"
        else:
            # 回退到原始表
            view_name = f"{data_source.schema_name}.{data_source.table_name}"
    
    # 构建查询
    select_fields = _build_select_fields(template, query)
    where_clause, params = _build_where_clause(query.filters or {})
    order_clause = _build_order_clause(query.sorting or [])
    
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


def _build_select_fields(template, query: ReportQuery) -> str:
    """构建SELECT字段"""
    # 简化实现，返回所有字段
    return "*"


def _build_where_clause(filters: Dict[str, Any]) -> tuple[str, Dict[str, Any]]:
    """构建WHERE子句"""
    conditions = []
    params = {}
    
    for field, value in filters.items():
        if value is not None and value != '':
            conditions.append(f"{field} = :{field}")
            params[field] = value
    
    where_clause = " AND ".join(conditions) if conditions else ""
    return where_clause, params


def _build_order_clause(sorting: List[Dict[str, Any]]) -> str:
    """构建ORDER BY子句"""
    order_parts = []
    for sort_item in sorting:
        field = sort_item.get('field')
        direction = sort_item.get('direction', 'asc').upper()
        if field and direction in ['ASC', 'DESC']:
            order_parts.append(f"{field} {direction}")
    
    return ", ".join(order_parts) if order_parts else ""


def _log_query_performance(
    db: Session, 
    template_id: int, 
    execution_time: float, 
    used_optimized_view: bool, 
    result_count: int
):
    """记录查询性能"""
    try:
        # 这里可以添加性能日志记录逻辑
        logging.info(f"查询性能 - 模板ID: {template_id}, 耗时: {execution_time:.3f}s, "
                    f"使用优化视图: {used_optimized_view}, 结果数: {result_count}")
    except Exception as e:
        logging.error(f"记录查询性能失败: {str(e)}") 