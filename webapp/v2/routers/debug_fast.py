"""
调试用的超快接口 - 排查性能瓶颈
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime
import time

from ..database import get_db_v2
from ..pydantic_models.common import OptimizedResponse

router = APIRouter(prefix="/debug-fast", tags=["调试性能接口"])

@router.get("/ping")
async def ping():
    """最简单的ping接口 - 无数据库查询"""
    return {
        "status": "ok",
        "message": "服务器响应正常",
        "timestamp": datetime.now().isoformat()
    }

@router.get("/db-simple")
async def db_simple_test(db: Session = Depends(get_db_v2)):
    """简单数据库连接测试"""
    start_time = time.time()
    
    try:
        # 最简单的数据库查询
        result = db.execute(text("SELECT 1 as test"))
        row = result.fetchone()
        
        elapsed = (time.time() - start_time) * 1000
        
        return OptimizedResponse(
            success=True,
            data={"test_value": row[0], "query_time_ms": round(elapsed, 2)},
            message=f"数据库连接正常，查询耗时: {elapsed:.2f}ms"
        )
    except Exception as e:
        elapsed = (time.time() - start_time) * 1000
        return OptimizedResponse(
            success=False,
            data={"error": str(e), "query_time_ms": round(elapsed, 2)},
            message=f"数据库连接失败: {e}"
        )

@router.get("/db-count-test")
async def db_count_test(db: Session = Depends(get_db_v2)):
    """测试简单的count查询"""
    start_time = time.time()
    
    try:
        # 测试一个简单的count查询
        result = db.execute(text("SELECT COUNT(*) FROM payroll.payroll_periods"))
        count = result.scalar()
        
        elapsed = (time.time() - start_time) * 1000
        
        return OptimizedResponse(
            success=True,
            data={"periods_count": count, "query_time_ms": round(elapsed, 2)},
            message=f"期间数量查询完成，耗时: {elapsed:.2f}ms"
        )
    except Exception as e:
        elapsed = (time.time() - start_time) * 1000
        return OptimizedResponse(
            success=False,
            data={"error": str(e), "query_time_ms": round(elapsed, 2)},
            message=f"查询失败: {e}"
        )

@router.get("/periods-ultra-simple")
async def periods_ultra_simple(db: Session = Depends(get_db_v2)):
    """超简化的期间查询 - 仅获取基本字段"""
    start_time = time.time()
    
    try:
        # 只查询最基本的字段，无JOIN，无复杂逻辑
        query = text("""
            SELECT id, name, start_date, end_date
            FROM payroll.payroll_periods
            ORDER BY id DESC
            LIMIT 5
        """)
        
        result = db.execute(query)
        periods = [dict(row._mapping) for row in result]
        
        elapsed = (time.time() - start_time) * 1000
        
        return OptimizedResponse(
            success=True,
            data={"periods": periods, "query_time_ms": round(elapsed, 2)},
            message=f"期间查询完成，耗时: {elapsed:.2f}ms"
        )
    except Exception as e:
        elapsed = (time.time() - start_time) * 1000
        return OptimizedResponse(
            success=False,
            data={"error": str(e), "query_time_ms": round(elapsed, 2)},
            message=f"查询失败: {e}"
        )

@router.get("/departments-ultra-simple")
async def departments_ultra_simple(db: Session = Depends(get_db_v2)):
    """超简化的部门查询"""
    start_time = time.time()
    
    try:
        # 只查询最基本的字段
        query = text("""
            SELECT id, name, code
            FROM hr.departments
            WHERE is_active = true
            ORDER BY code
            LIMIT 10
        """)
        
        result = db.execute(query)
        departments = [dict(row._mapping) for row in result]
        
        elapsed = (time.time() - start_time) * 1000
        
        return OptimizedResponse(
            success=True,
            data={"departments": departments, "query_time_ms": round(elapsed, 2)},
            message=f"部门查询完成，耗时: {elapsed:.2f}ms"
        )
    except Exception as e:
        elapsed = (time.time() - start_time) * 1000
        return OptimizedResponse(
            success=False,
            data={"error": str(e), "query_time_ms": round(elapsed, 2)},
            message=f"查询失败: {e}"
        ) 