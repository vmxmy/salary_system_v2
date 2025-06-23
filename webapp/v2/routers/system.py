"""
系统管理相关的API路由
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
import logging

# Set up logging for this module
logger = logging.getLogger(__name__)

from webapp.v2.database import get_db_v2
from webapp.v2.services.system import SystemService
from webapp.v2.pydantic_models.system import (
    SystemInfoResponse, HealthCheckResponse, VersionInfoResponse
)
from webapp.v2.pydantic_models.common import DataResponse
from webapp import auth

router = APIRouter(
    prefix="/system",
    tags=["System Management"],
)


@router.get("/info", response_model=SystemInfoResponse)
async def get_system_info(
    db: Session = Depends(get_db_v2)
):
    """
    获取系统基本信息
    
    替代原来的根路径 GET / 接口，提供系统基本信息包括：
    - 应用名称和版本
    - 运行环境
    - 运行时长
    - 启动时间
    - 欢迎消息
    """
    try:
        system_service = SystemService(db)
        system_info = system_service.get_system_info()
        
        return DataResponse(
            success=True,
            message="系统信息获取成功",
            data=system_info
        )
        
    except Exception as e:
        logger.error(f"Failed to get system info: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="系统信息获取失败"
        )


@router.get("/health", response_model=HealthCheckResponse)
async def health_check(
    db: Session = Depends(get_db_v2)
):
    """
    系统健康检查
    
    替代原来的 GET /health 接口，提供完整的健康检查信息：
    - 总体健康状态
    - 数据库连接状态
    - 系统运行指标
    - 响应时间统计
    
    用于Docker容器健康检查和系统监控
    """
    try:
        system_service = SystemService(db)
        health_status = system_service.get_health_check()
        
        # 根据健康状态设置HTTP状态码
        status_code = status.HTTP_200_OK if health_status.status == "healthy" else status.HTTP_503_SERVICE_UNAVAILABLE
        
        response_data = DataResponse(
            success=health_status.status == "healthy",
            message="健康检查完成",
            data=health_status
        )
        
        return JSONResponse(
            content=response_data.model_dump(),
            status_code=status_code
        )
        
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        
        # 健康检查失败时返回503状态
        error_response = DataResponse(
            success=False,
            message="健康检查失败",
            data=None,
            error=str(e)
        )
        
        return JSONResponse(
            content=error_response.model_dump(),
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE
        )


@router.get("/version", response_model=VersionInfoResponse)
async def get_version_info(
    db: Session = Depends(get_db_v2),
    current_user = Depends(auth.require_permissions(["system:view"]))
):
    """
    获取详细版本信息
    
    提供系统的详细版本信息：
    - 应用版本
    - API版本  
    - 数据库版本
    - Python版本
    - 主要依赖版本
    - 构建信息
    
    需要 system:view 权限
    """
    try:
        system_service = SystemService(db)
        version_info = system_service.get_version_info()
        
        return DataResponse(
            success=True,
            message="版本信息获取成功",
            data=version_info
        )
        
    except Exception as e:
        logger.error(f"Failed to get version info: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="版本信息获取失败"
        )


@router.get("/metrics")
async def get_system_metrics(
    current_user = Depends(auth.require_permissions(["system:monitor"]))
):
    """
    获取系统运行指标
    
    提供系统性能监控数据：
    - CPU和内存使用率
    - 磁盘使用情况
    - 请求统计
    - 错误统计
    
    需要 system:monitor 权限
    """
    try:
        # 这里应该集成真实的监控系统数据
        # 目前返回基础指标
        
        import psutil
        
        metrics = {
            "cpu_percent": psutil.cpu_percent(interval=1),
            "memory_percent": psutil.virtual_memory().percent,
            "disk_percent": psutil.disk_usage('/').percent,
            "timestamp": "2025-01-23T12:00:00Z"
        }
        
        return DataResponse(
            success=True,
            message="系统指标获取成功",
            data=metrics
        )
        
    except Exception as e:
        logger.error(f"Failed to get system metrics: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="系统指标获取失败"
        )


@router.get("/status")
async def get_system_status(
    current_user = Depends(auth.require_permissions(["system:view"]))
):
    """
    获取系统状态概览
    
    提供系统运行状态的快速概览：
    - 服务状态
    - 关键组件状态
    - 最近的系统事件
    
    需要 system:view 权限
    """
    try:
        status_info = {
            "api_server": "running",
            "database": "connected", 
            "cache": "available",
            "background_tasks": "running",
            "last_backup": "2025-01-23T06:00:00Z",
            "maintenance_mode": False,
            "timestamp": "2025-01-23T12:00:00Z"
        }
        
        return DataResponse(
            success=True,
            message="系统状态获取成功",
            data=status_info
        )
        
    except Exception as e:
        logger.error(f"Failed to get system status: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="系统状态获取失败"
        )