import time
import logging
import psutil
import gc
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from sqlalchemy.engine import Engine
from sqlalchemy import event

logger = logging.getLogger("api_performance")

# FastAPI全局请求耗时日志中间件 - 🚀 增强版
class RequestTimingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # 🔍 性能监控开始
        start_time = time.time()
        start_memory = psutil.Process().memory_info().rss / 1024 / 1024  # MB
        
        # 记录请求前状态
        gc_before = gc.get_count()
        
        response = await call_next(request)
        
        # 🔍 性能监控结束
        end_time = time.time()
        end_memory = psutil.Process().memory_info().rss / 1024 / 1024  # MB
        process_time = (end_time - start_time) * 1000  # ms
        memory_delta = end_memory - start_memory
        gc_after = gc.get_count()
        
        # 🚨 慢请求详细分析
        if process_time > 2000:  # 超过2秒的请求
            logger.warning(
                f"🚨 [SLOW API] {request.method} {request.url.path} - {response.status_code} - {process_time:.2f}ms | "
                f"内存变化: {memory_delta:.2f}MB | GC: {gc_before} -> {gc_after}"
            )
        else:
            logger.info(
                f"[API] {request.method} {request.url.path} - {response.status_code} - {process_time:.2f}ms"
            )
        
        return response

# SQLAlchemy SQL执行耗时日志 - 🚀 增强版
class SQLTimingTracker:
    def __init__(self):
        self.current_queries = {}
        self.total_sql_time = 0
        self.query_count = 0
    
    def reset(self):
        """重置统计"""
        self.total_sql_time = 0
        self.query_count = 0

def setup_sql_timing_logging(engine: Engine):
    sql_tracker = SQLTimingTracker()
    
    @event.listens_for(engine, "before_cursor_execute")
    def before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
        context._query_start_time = time.time()
        context._statement = statement
        sql_tracker.query_count += 1

    @event.listens_for(engine, "after_cursor_execute")
    def after_cursor_execute(conn, cursor, statement, parameters, context, executemany):
        if hasattr(context, '_query_start_time'):
            query_time = (time.time() - context._query_start_time) * 1000
            sql_tracker.total_sql_time += query_time
            
            # 🚨 慢查询警告
            if query_time > 1000:  # 超过1秒的查询
                logger.warning(
                    f"🚨 [SLOW SQL] {statement[:150]}... - {query_time:.2f}ms"
                )
            else:
                logger.info(f"[SQL] {statement[:100]}... - {query_time:.2f}ms")

# 🚀 新增：请求级别的详细性能分解
class DetailedPerformanceMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # 性能分解开始
        timestamps = {
            'request_start': time.time(),
            'middleware_start': time.time()
        }
        
        # 添加性能跟踪到请求状态
        request.state.performance_tracker = timestamps
        
        # 记录中间件处理结束时间
        timestamps['middleware_end'] = time.time()
        
        # 执行请求处理
        response = await call_next(request)
        
        # 记录响应处理时间
        timestamps['response_start'] = time.time()
        
        # 计算各阶段耗时
        total_time = (timestamps['response_start'] - timestamps['request_start']) * 1000
        middleware_time = (timestamps['middleware_end'] - timestamps['middleware_start']) * 1000
        
        # 🔍 详细时间分解
        if total_time > 1000:  # 超过1秒的请求进行详细分析
            logger.warning(
                f"🔍 [详细分析] {request.method} {request.url.path} | "
                f"总耗时: {total_time:.2f}ms | "
                f"中间件: {middleware_time:.2f}ms | "
                f"业务逻辑: {(total_time - middleware_time):.2f}ms"
            )
        
        timestamps['response_end'] = time.time()
        return response

# 🚀 数据库连接池监控
def monitor_db_pool(engine: Engine):
    """监控数据库连接池状态"""
    pool = engine.pool
    logger.info(
        f"🏊 [DB Pool] 连接池状态 - "
        f"大小: {pool.size()} | "
        f"使用中: {pool.checked_out()} | "
        f"溢出: {pool.overflow()} | "
        f"无效: {pool.invalid()}"
    )