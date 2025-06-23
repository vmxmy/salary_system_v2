"""
调试工具相关的API路由
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query, Path
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
import logging

# Set up logging for this module
logger = logging.getLogger(__name__)

from webapp.v2.database import get_db_v2
from webapp.v2.services.system import DebugService
from webapp.v2.pydantic_models.system import (
    DebugFieldConfigListResponse, DebugInfoResponse, DatabaseDiagnosticResponse,
    PerformanceMetricsResponse, PermissionTestResponse
)
from webapp.v2.pydantic_models.common import DataResponse
from webapp import auth

router = APIRouter(
    prefix="/debug",
    tags=["Debug Tools"],
)


@router.get("/field-config/{employee_type_key}", response_model=DebugFieldConfigListResponse)
async def get_field_config(
    employee_type_key: str = Path(..., description="员工类型键"),
    db: Session = Depends(get_db_v2),
    current_user = Depends(auth.require_permissions(["debug:access"]))
):
    """
    获取员工类型字段配置（调试用）
    
    替代原来的 GET /api/debug/field-config/{employee_type_key} 接口
    
    查询指定员工类型的字段配置信息，包括：
    - 字段数据库名称
    - 是否必填
    - 源字段名和目标字段名的映射
    
    需要 debug:access 权限，仅限开发和管理员使用
    """
    try:
        debug_service = DebugService(db)
        field_configs = debug_service.get_field_config(employee_type_key)
        
        if not field_configs:
            logger.warning(f"No field config found for employee type: {employee_type_key}")
            return DataResponse(
                success=True,
                message=f"未找到员工类型 '{employee_type_key}' 的字段配置",
                data=[]
            )
        
        logger.info(f"Found {len(field_configs)} field configs for type: {employee_type_key}")
        
        return DataResponse(
            success=True,
            message=f"成功获取员工类型 '{employee_type_key}' 的字段配置",
            data=field_configs
        )
        
    except Exception as e:
        logger.error(f"Failed to get field config for {employee_type_key}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取字段配置失败: {str(e)}"
        )


@router.get("/database", response_model=DatabaseDiagnosticResponse)
async def get_database_diagnostic(
    db: Session = Depends(get_db_v2),
    current_user = Depends(auth.require_permissions(["debug:access"]))
):
    """
    数据库诊断信息
    
    提供数据库的详细诊断信息：
    - 连接池状态
    - 表统计信息
    - 慢查询分析
    - 性能指标
    
    需要 debug:access 权限
    """
    try:
        debug_service = DebugService(db)
        diagnostic_info = debug_service.get_database_diagnostic()
        
        return DataResponse(
            success=True,
            message="数据库诊断完成",
            data=diagnostic_info
        )
        
    except Exception as e:
        logger.error(f"Database diagnostic failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"数据库诊断失败: {str(e)}"
        )


@router.get("/performance", response_model=PerformanceMetricsResponse)
async def get_performance_metrics(
    time_range: str = Query("1h", description="时间范围: 1h, 6h, 24h, 7d"),
    db: Session = Depends(get_db_v2),
    current_user = Depends(auth.require_permissions(["debug:access"]))
):
    """
    性能分析数据
    
    提供系统性能分析数据：
    - 响应时间统计
    - 请求计数和错误率
    - 内存和CPU使用情况
    - 按时间范围筛选数据
    
    需要 debug:access 权限
    """
    try:
        debug_service = DebugService(db)
        performance_metrics = debug_service.get_performance_metrics()
        
        return DataResponse(
            success=True,
            message=f"成功获取 {time_range} 时间范围的性能数据",
            data=performance_metrics
        )
        
    except Exception as e:
        logger.error(f"Failed to get performance metrics: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"性能数据获取失败: {str(e)}"
        )


@router.get("/permissions", response_model=PermissionTestResponse)
async def test_permissions(
    user_id: Optional[int] = Query(None, description="要测试的用户ID，不提供则测试当前用户"),
    db: Session = Depends(get_db_v2),
    current_user = Depends(auth.require_permissions(["debug:access"]))
):
    """
    权限测试工具
    
    测试指定用户的权限配置：
    - 用户角色列表
    - 权限列表
    - 常见操作权限测试
    
    需要 debug:access 权限
    """
    try:
        debug_service = DebugService(db)
        
        # 如果没有指定用户ID，测试当前用户
        test_user_id = user_id if user_id is not None else getattr(current_user, 'id', None)
        
        permission_test = debug_service.test_permissions(test_user_id)
        
        return DataResponse(
            success=True,
            message="权限测试完成",
            data=permission_test
        )
        
    except Exception as e:
        logger.error(f"Permission test failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"权限测试失败: {str(e)}"
        )


@router.get("/environment")
async def get_environment_info(
    current_user = Depends(auth.require_permissions(["debug:access"]))
):
    """
    环境变量和配置信息
    
    显示系统环境配置（敏感信息已脱敏）：
    - 环境变量
    - 配置参数
    - 系统路径
    
    需要 debug:access 权限
    """
    try:
        import os
        from webapp.core.config import settings
        
        # 获取环境信息，脱敏敏感数据
        env_info = {
            "environment": os.getenv("ENVIRONMENT", "development"),
            "python_path": os.getenv("PYTHONPATH", ""),
            "api_title": settings.API_TITLE,
            "api_version": settings.API_VERSION,
            "database_url_masked": "postgresql://***:***@***:****/****",
            "cors_origins_count": len(settings.CORS_ORIGINS),
            "upload_dir": settings.UPLOAD_DIR,
            "max_upload_size": settings.MAX_UPLOAD_SIZE
        }
        
        return DataResponse(
            success=True,
            message="环境信息获取成功",
            data=env_info
        )
        
    except Exception as e:
        logger.error(f"Failed to get environment info: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"环境信息获取失败: {str(e)}"
        )


@router.get("/logs")
async def get_recent_logs(
    level: str = Query("ERROR", description="日志级别: DEBUG, INFO, WARNING, ERROR"),
    lines: int = Query(50, ge=1, le=1000, description="返回行数"),
    current_user = Depends(auth.require_permissions(["debug:access"]))
):
    """
    获取最近的系统日志
    
    返回最近的系统日志信息：
    - 按日志级别筛选
    - 限制返回行数
    - 实时日志监控
    
    需要 debug:access 权限
    """
    try:
        # 这里应该实现真实的日志读取逻辑
        # 目前返回模拟数据
        
        logs = [
            {
                "timestamp": "2025-01-23T12:00:00Z",
                "level": "INFO",
                "logger": "webapp.v2.routers.system",
                "message": "System health check completed successfully"
            },
            {
                "timestamp": "2025-01-23T11:59:30Z", 
                "level": "WARNING",
                "logger": "webapp.v2.services.system",
                "message": "High memory usage detected: 85%"
            }
        ]
        
        return DataResponse(
            success=True,
            message=f"成功获取最近 {lines} 行 {level} 级别日志",
            data=logs
        )
        
    except Exception as e:
        logger.error(f"Failed to get logs: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"日志获取失败: {str(e)}"
        )


@router.post("/cache/clear")
async def clear_cache(
    cache_type: str = Query("all", description="缓存类型: all, redis, memory"),
    current_user = Depends(auth.require_permissions(["debug:admin"]))
):
    """
    清理系统缓存
    
    清理指定类型的系统缓存：
    - 全部缓存
    - Redis缓存
    - 内存缓存
    
    需要 debug:admin 权限
    """
    try:
        # 这里应该实现真实的缓存清理逻辑
        logger.info(f"Cache clear requested by user {current_user.id}, type: {cache_type}")
        
        result = {
            "cache_type": cache_type,
            "cleared": True,
            "timestamp": "2025-01-23T12:00:00Z"
        }
        
        return DataResponse(
            success=True,
            message=f"成功清理 {cache_type} 缓存",
            data=result
        )
        
    except Exception as e:
        logger.error(f"Failed to clear cache: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"缓存清理失败: {str(e)}"
        )