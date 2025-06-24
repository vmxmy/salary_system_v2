from typing import Dict, Any, List
import time
import logging
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from ...database import get_db_v2
from ...models.security import User
from ....auth import get_current_user
from ...crud.reports import ReportDataSourceCRUD

router = APIRouter(tags=["optimization"])


@router.get("/stats")
async def get_optimization_stats(
    hours: int = Query(24, ge=1, le=168, description="统计时间范围（小时）"),
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """获取优化统计信息"""
    try:
        # 这里可以添加实际的统计查询逻辑
        # 目前返回模拟数据
        stats = {
            "total_queries": 150,
            "optimized_queries": 120,
            "optimization_rate": 80.0,
            "avg_execution_time": 0.85,
            "avg_optimized_time": 0.45,
            "performance_improvement": 47.1,
            "time_range_hours": hours
        }
        return stats
    except Exception as e:
        logging.error(f"获取优化统计失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"获取优化统计失败: {str(e)}")


@router.get("/data-sources/{data_source_id}/suggestions")
async def get_optimization_suggestions(
    data_source_id: int,
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """获取数据源优化建议"""
    try:
        # 检查数据源是否存在
        data_source = ReportDataSourceCRUD.get_by_id(db, data_source_id)
        if not data_source:
            raise HTTPException(status_code=404, detail="数据源不存在")
        
        # 分析数据源并生成优化建议
        suggestions = await _analyze_data_source_for_optimization(db, data_source)
        
        return {
            "data_source_id": data_source_id,
            "data_source_name": data_source.name,
            "suggestions": suggestions,
            "analysis_time": time.time()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"获取优化建议失败 - 数据源ID: {data_source_id}, 错误: {str(e)}")
        raise HTTPException(status_code=500, detail=f"获取优化建议失败: {str(e)}")


@router.post("/test-view-performance")
async def test_view_performance(
    test_request: Dict[str, Any],
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """测试视图性能"""
    try:
        view_name = test_request.get('view_name')
        original_query = test_request.get('original_query')
        test_params = test_request.get('params', {})
        
        if not view_name:
            raise HTTPException(status_code=400, detail="缺少视图名称")
        
        # 测试视图查询性能
        view_performance = await _test_view_query_performance(db, view_name, test_params)
        
        # 如果提供了原始查询，也测试原始查询性能
        original_performance = None
        if original_query:
            original_performance = await _test_original_query_performance(db, original_query, test_params)
        
        result = {
            "view_name": view_name,
            "view_performance": view_performance,
            "original_performance": original_performance,
            "improvement": None
        }
        
        # 计算性能提升
        if original_performance and view_performance:
            original_time = original_performance.get('execution_time', 0)
            view_time = view_performance.get('execution_time', 0)
            if original_time > 0:
                improvement = ((original_time - view_time) / original_time) * 100
                result["improvement"] = round(improvement, 2)
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"测试视图性能失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"测试视图性能失败: {str(e)}")


@router.get("/available-views")
async def get_available_optimization_views(
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """获取可用的优化视图列表"""
    try:
        # 查询系统中可用的优化视图
        views = await _get_available_views(db)
        
        return {
            "total": len(views),
            "views": views,
            "categories": _categorize_views(views)
        }
        
    except Exception as e:
        logging.error(f"获取可用视图失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"获取可用视图失败: {str(e)}")


@router.post("/data-sources/preview-multi")
async def preview_multi_datasource_data(
    request: Dict[str, Any],
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """多数据源预览数据"""
    try:
        data_source_ids = request.get('data_source_ids', [])
        limit = request.get('limit', 10)
        use_optimized = request.get('use_optimized', True)
        
        if not data_source_ids:
            raise HTTPException(status_code=400, detail="缺少数据源ID列表")
        
        results = {}
        
        for data_source_id in data_source_ids:
            try:
                data_source = ReportDataSourceCRUD.get_by_id(db, data_source_id)
                if not data_source:
                    results[str(data_source_id)] = {"error": "数据源不存在"}
                    continue
                
                # 预览数据
                preview_data = await _preview_data_source(db, data_source, limit, use_optimized)
                results[str(data_source_id)] = {
                    "name": data_source.name,
                    "data": preview_data
                }
                
            except Exception as e:
                results[str(data_source_id)] = {"error": str(e)}
        
        return results
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"多数据源预览失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"多数据源预览失败: {str(e)}")


# 辅助函数
async def _analyze_data_source_for_optimization(db: Session, data_source) -> List[Dict[str, Any]]:
    """分析数据源并生成优化建议"""
    suggestions = []
    
    try:
        # 检查是否有对应的优化视图
        if data_source.schema_name == 'payroll' and data_source.table_name in ['payroll_entries', 'payroll_periods', 'payroll_runs']:
            suggestions.append({
                "type": "view_optimization",
                "priority": "high",
                "title": "使用优化视图",
                "description": f"建议使用 v_{data_source.table_name}_detailed 视图来提高查询性能",
                "estimated_improvement": "40-60%"
            })
        
        # 检查表大小和索引
        table_stats = await _get_table_statistics(db, data_source)
        if table_stats and table_stats.get('row_count', 0) > 10000:
            suggestions.append({
                "type": "indexing",
                "priority": "medium",
                "title": "添加索引优化",
                "description": "表数据量较大，建议添加适当的索引来提高查询性能",
                "estimated_improvement": "20-40%"
            })
        
        # 检查查询模式
        suggestions.append({
            "type": "query_pattern",
            "priority": "low",
            "title": "查询模式优化",
            "description": "建议使用分页查询和适当的筛选条件来减少数据传输量",
            "estimated_improvement": "10-30%"
        })
        
    except Exception as e:
        logging.error(f"分析数据源优化建议失败: {str(e)}")
    
    return suggestions


async def _test_view_query_performance(db: Session, view_name: str, params: Dict[str, Any]) -> Dict[str, Any]:
    """测试视图查询性能"""
    start_time = time.time()
    
    try:
        # 构建测试查询
        query = f"SELECT * FROM {view_name} LIMIT 100"
        result = db.execute(text(query))
        rows = result.fetchall()
        
        execution_time = time.time() - start_time
        
        return {
            "execution_time": round(execution_time, 4),
            "row_count": len(rows),
            "status": "success"
        }
        
    except Exception as e:
        execution_time = time.time() - start_time
        return {
            "execution_time": round(execution_time, 4),
            "row_count": 0,
            "status": "error",
            "error": str(e)
        }


async def _test_original_query_performance(db: Session, query: str, params: Dict[str, Any]) -> Dict[str, Any]:
    """测试原始查询性能"""
    start_time = time.time()
    
    try:
        result = db.execute(text(query), params)
        rows = result.fetchall()
        
        execution_time = time.time() - start_time
        
        return {
            "execution_time": round(execution_time, 4),
            "row_count": len(rows),
            "status": "success"
        }
        
    except Exception as e:
        execution_time = time.time() - start_time
        return {
            "execution_time": round(execution_time, 4),
            "row_count": 0,
            "status": "error",
            "error": str(e)
        }


async def _get_available_views(db: Session) -> List[Dict[str, Any]]:
    """获取可用的优化视图"""
    try:
        # 查询系统视图
        query = """
        SELECT 
            schemaname,
            viewname,
            definition
        FROM pg_views 
        WHERE schemaname IN ('public', 'reports')
        AND viewname LIKE 'v_%'
        ORDER BY schemaname, viewname
        """
        
        result = db.execute(text(query))
        views = []
        
        for row in result:
            views.append({
                "schema": row[0],
                "name": row[1],
                "full_name": f"{row[0]}.{row[1]}",
                "type": _determine_view_type(row[1])
            })
        
        return views
        
    except Exception as e:
        logging.error(f"获取可用视图失败: {str(e)}")
        return []


def _categorize_views(views: List[Dict[str, Any]]) -> Dict[str, List[str]]:
    """对视图进行分类"""
    categories = {
        "payroll": [],
        "hr": [],
        "config": [],
        "reports": [],
        "other": []
    }
    
    for view in views:
        view_name = view.get('name', '')
        if 'payroll' in view_name:
            categories['payroll'].append(view['full_name'])
        elif 'employee' in view_name or 'hr' in view_name:
            categories['hr'].append(view['full_name'])
        elif 'config' in view_name or 'lookup' in view_name:
            categories['config'].append(view['full_name'])
        elif 'report' in view_name:
            categories['reports'].append(view['full_name'])
        else:
            categories['other'].append(view['full_name'])
    
    return categories


def _determine_view_type(view_name: str) -> str:
    """确定视图类型"""
    if 'detailed' in view_name:
        return 'detailed'
    elif 'summary' in view_name:
        return 'summary'
    elif 'basic' in view_name:
        return 'basic'
    else:
        return 'general'


async def _get_table_statistics(db: Session, data_source) -> Dict[str, Any]:
    """获取表统计信息"""
    try:
        query = """
        SELECT 
            schemaname,
            tablename,
            n_tup_ins as inserts,
            n_tup_upd as updates,
            n_tup_del as deletes,
            n_live_tup as live_tuples,
            n_dead_tup as dead_tuples
        FROM pg_stat_user_tables 
        WHERE schemaname = :schema_name AND tablename = :table_name
        """
        
        result = db.execute(text(query), {
            'schema_name': data_source.schema_name,
            'table_name': data_source.table_name
        })
        
        row = result.fetchone()
        if row:
            return {
                "schema": row[0],
                "table": row[1],
                "inserts": row[2] or 0,
                "updates": row[3] or 0,
                "deletes": row[4] or 0,
                "row_count": row[5] or 0,
                "dead_tuples": row[6] or 0
            }
        
        return None
        
    except Exception as e:
        logging.error(f"获取表统计信息失败: {str(e)}")
        return None


async def _preview_data_source(db: Session, data_source, limit: int, use_optimized: bool) -> Dict[str, Any]:
    """预览数据源数据"""
    try:
        # 确定查询的表或视图
        if use_optimized and data_source.schema_name == 'payroll':
            # 使用优化视图
            view_mapping = {
                'payroll_entries': 'v_payroll_entries_detailed',
                'payroll_periods': 'v_payroll_periods_detail',
                'payroll_runs': 'v_payroll_runs_detail'
            }
            table_name = view_mapping.get(data_source.table_name, data_source.table_name)
            schema_name = 'reports' if table_name.startswith('v_') else data_source.schema_name
        else:
            table_name = data_source.table_name
            schema_name = data_source.schema_name
        
        # 构建查询
        query = f"SELECT * FROM {schema_name}.{table_name} LIMIT {limit}"
        
        start_time = time.time()
        result = db.execute(text(query))
        execution_time = time.time() - start_time
        
        columns = [{"key": col, "title": col, "dataIndex": col} for col in result.keys()]
        data = [dict(zip(result.keys(), row)) for row in result.fetchall()]
        
        return {
            "columns": columns,
            "data": data,
            "execution_time": round(execution_time, 4),
            "row_count": len(data),
            "used_optimized": use_optimized
        }
        
    except Exception as e:
        logging.error(f"预览数据源失败: {str(e)}")
        raise 