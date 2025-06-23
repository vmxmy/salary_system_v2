"""
系统服务模块

提供系统相关的业务逻辑，包括：
- 系统信息收集
- 健康状态检查
- 性能指标监控
- 调试工具服务
"""

import os
import sys
import psutil
import platform
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import text, inspect
import logging

from .base import BaseService
from ..database import engine_v2
from ..pydantic_models.system import (
    SystemInfo, HealthCheck, VersionInfo, DatabaseStatus, SystemMetrics,
    DebugFieldConfig, DebugInfo, DatabaseDiagnostic, PerformanceMetrics,
    PermissionTest
)
from ...core.config import settings

logger = logging.getLogger(__name__)


class SystemService(BaseService):
    """系统信息服务"""
    
    def __init__(self, db: Session):
        super().__init__(db)
        self._startup_time = datetime.now(timezone.utc)
    
    def get_system_info(self) -> SystemInfo:
        """获取系统基本信息"""
        uptime = self._calculate_uptime()
        
        return SystemInfo(
            app_name=settings.API_TITLE,
            version=settings.API_VERSION,
            api_version=settings.API_V2_PREFIX,
            environment=os.getenv("ENVIRONMENT", "development"),
            uptime=uptime,
            startup_time=self._startup_time,
            message="Welcome to the Salary Information Management System API"
        )
    
    def get_health_check(self) -> HealthCheck:
        """执行系统健康检查"""
        try:
            # 数据库状态检查
            db_status = self._check_database_status()
            
            # 系统指标收集
            metrics = self._collect_system_metrics()
            
            # 判断总体健康状态
            overall_status = "healthy" if db_status.status == "connected" else "unhealthy"
            
            return HealthCheck(
                status=overall_status,
                timestamp=datetime.now(timezone.utc),
                database=db_status,
                version=settings.API_VERSION,
                uptime=self._calculate_uptime(),
                metrics=metrics,
                details={
                    "python_version": platform.python_version(),
                    "platform": platform.platform(),
                    "architecture": platform.architecture()[0]
                }
            )
            
        except Exception as e:
            logger.error(f"Health check failed: {str(e)}")
            return HealthCheck(
                status="unhealthy",
                timestamp=datetime.now(timezone.utc),
                database=DatabaseStatus(
                    status="error",
                    response_time_ms=None
                ),
                version=settings.API_VERSION,
                uptime=self._calculate_uptime(),
                details={"error": str(e)}
            )
    
    def get_version_info(self) -> VersionInfo:
        """获取详细版本信息"""
        try:
            # 获取数据库版本
            db_version = self._get_database_version()
            
            # 获取主要依赖版本
            dependencies = self._get_dependencies_versions()
            
            return VersionInfo(
                app_version=settings.API_VERSION,
                api_version=settings.API_V2_PREFIX,
                database_version=db_version,
                python_version=platform.python_version(),
                build_date=os.getenv("BUILD_DATE"),
                git_commit=os.getenv("GIT_COMMIT"),
                dependencies=dependencies
            )
            
        except Exception as e:
            logger.error(f"Failed to get version info: {str(e)}")
            return VersionInfo(
                app_version=settings.API_VERSION,
                api_version=settings.API_V2_PREFIX,
                python_version=platform.python_version(),
                dependencies={}
            )
    
    def _check_database_status(self) -> DatabaseStatus:
        """检查数据库状态"""
        try:
            start_time = datetime.now()
            
            # 执行简单查询测试连接
            with engine_v2.connect() as connection:
                connection.execute(text("SELECT 1"))
            
            end_time = datetime.now()
            response_time = (end_time - start_time).total_seconds() * 1000
            
            # 获取连接池信息
            pool_info = self._get_pool_info()
            
            return DatabaseStatus(
                status="connected",
                connection_pool_size=pool_info.get("pool_size"),
                active_connections=pool_info.get("active_connections"),
                response_time_ms=round(response_time, 2)
            )
            
        except Exception as e:
            logger.error(f"Database health check failed: {str(e)}")
            return DatabaseStatus(
                status="error",
                response_time_ms=None
            )
    
    def _collect_system_metrics(self) -> Optional[SystemMetrics]:
        """收集系统运行指标"""
        try:
            process = psutil.Process()
            
            return SystemMetrics(
                cpu_usage=round(process.cpu_percent(), 2),
                memory_usage=round(process.memory_percent(), 2),
                disk_usage=round(psutil.disk_usage('/').percent, 2),
                request_count=None,  # 需要从监控系统获取
                error_count=None     # 需要从监控系统获取
            )
            
        except Exception as e:
            logger.warning(f"Failed to collect system metrics: {str(e)}")
            return None
    
    def _calculate_uptime(self) -> str:
        """计算系统运行时间"""
        uptime_delta = datetime.now(timezone.utc) - self._startup_time
        days = uptime_delta.days
        hours, remainder = divmod(uptime_delta.seconds, 3600)
        minutes, seconds = divmod(remainder, 60)
        
        if days > 0:
            return f"{days}d {hours}h {minutes}m {seconds}s"
        elif hours > 0:
            return f"{hours}h {minutes}m {seconds}s"
        else:
            return f"{minutes}m {seconds}s"
    
    def _get_database_version(self) -> Optional[str]:
        """获取数据库版本"""
        try:
            with engine_v2.connect() as connection:
                result = connection.execute(text("SELECT version()"))
                version = result.scalar()
                return version.split(' ')[0] if version else None
        except Exception:
            return None
    
    def _get_dependencies_versions(self) -> Dict[str, str]:
        """获取主要依赖版本"""
        dependencies = {}
        
        try:
            import fastapi
            dependencies["fastapi"] = fastapi.__version__
        except ImportError:
            pass
            
        try:
            import sqlalchemy
            dependencies["sqlalchemy"] = sqlalchemy.__version__
        except ImportError:
            pass
            
        try:
            import pydantic
            dependencies["pydantic"] = pydantic.__version__
        except ImportError:
            pass
            
        try:
            import uvicorn
            dependencies["uvicorn"] = uvicorn.__version__
        except ImportError:
            pass
        
        return dependencies
    
    def _get_pool_info(self) -> Dict[str, Any]:
        """获取数据库连接池信息"""
        try:
            pool = engine_v2.pool
            return {
                "pool_size": pool.size(),
                "active_connections": pool.checkedin(),
                "checked_out": pool.checkedout(),
                "overflow": pool.overflow(),
                "invalid": pool.invalid()
            }
        except Exception:
            return {}


class DebugService(BaseService):
    """调试工具服务"""
    
    def get_field_config(self, employee_type_key: str) -> List[DebugFieldConfig]:
        """获取员工类型字段配置"""
        try:
            query = text("""
                SELECT
                    etfr.employee_type_key,
                    etfr.field_db_name,
                    etfr.is_required,
                    sfm.source_name,
                    sfm.target_name
                FROM core.employee_type_field_rules etfr
                JOIN core.salary_field_mappings sfm ON etfr.field_db_name = sfm.target_name
                WHERE etfr.employee_type_key = :employee_type_key
            """)
            
            result = self.db.execute(query, {"employee_type_key": employee_type_key})
            rows = result.mappings().all()
            
            return [
                DebugFieldConfig(
                    employee_type_key=row["employee_type_key"],
                    field_db_name=row["field_db_name"],
                    is_required=row["is_required"],
                    source_name=row["source_name"],
                    target_name=row["target_name"]
                )
                for row in rows
            ]
            
        except Exception as e:
            logger.error(f"Failed to get field config for {employee_type_key}: {str(e)}")
            return []
    
    def get_database_diagnostic(self) -> DatabaseDiagnostic:
        """获取数据库诊断信息"""
        try:
            # 获取连接池信息
            pool_info = self._get_detailed_pool_info()
            
            # 获取表统计信息
            table_stats = self._get_table_statistics()
            
            # 获取慢查询（如果可用）
            slow_queries = self._get_slow_queries()
            
            return DatabaseDiagnostic(
                connection_status="connected",
                pool_info=pool_info,
                table_stats=table_stats,
                slow_queries=slow_queries
            )
            
        except Exception as e:
            logger.error(f"Database diagnostic failed: {str(e)}")
            return DatabaseDiagnostic(
                connection_status="error",
                pool_info={"error": str(e)}
            )
    
    def get_performance_metrics(self) -> PerformanceMetrics:
        """获取性能指标"""
        # 这里应该从监控系统或日志中获取实际数据
        # 目前返回模拟数据
        return PerformanceMetrics(
            response_times={
                "avg": 150.5,
                "p50": 120.0,
                "p95": 300.0,
                "p99": 500.0
            },
            request_counts={
                "total": 10000,
                "success": 9800,
                "error": 200
            },
            error_rates={
                "total": 2.0,
                "4xx": 1.5,
                "5xx": 0.5
            },
            memory_usage={
                "used_mb": 512,
                "total_mb": 2048,
                "percentage": 25.0
            },
            cpu_usage=15.5
        )
    
    def test_permissions(self, user_id: Optional[int] = None) -> PermissionTest:
        """测试用户权限"""
        try:
            if user_id:
                # 获取用户权限信息
                query = text("""
                    SELECT u.username, r.name as role_name, p.name as permission_name
                    FROM security.users u
                    LEFT JOIN security.user_roles ur ON u.id = ur.user_id
                    LEFT JOIN security.roles r ON ur.role_id = r.id
                    LEFT JOIN security.role_permissions rp ON r.id = rp.role_id
                    LEFT JOIN security.permissions p ON rp.permission_id = p.id
                    WHERE u.id = :user_id
                """)
                
                result = self.db.execute(query, {"user_id": user_id})
                rows = result.mappings().all()
                
                if not rows:
                    return PermissionTest(
                        user_id=user_id,
                        roles=[],
                        permissions=[],
                        test_results={"user_exists": False}
                    )
                
                username = rows[0]["username"]
                roles = list(set(row["role_name"] for row in rows if row["role_name"]))
                permissions = list(set(row["permission_name"] for row in rows if row["permission_name"]))
                
                # 测试常见权限
                test_results = {
                    "can_view_employees": "employee:view" in permissions,
                    "can_manage_payroll": "payroll:manage" in permissions,
                    "can_admin_system": "SUPER_ADMIN" in roles,
                    "has_hr_access": "HR_MANAGER" in roles or "HR_SPECIALIST" in roles
                }
                
                return PermissionTest(
                    user_id=user_id,
                    username=username,
                    roles=roles,
                    permissions=permissions,
                    test_results=test_results
                )
            else:
                # 返回系统权限概览
                return PermissionTest(
                    roles=[],
                    permissions=[],
                    test_results={"test_mode": "system_overview"}
                )
                
        except Exception as e:
            logger.error(f"Permission test failed: {str(e)}")
            return PermissionTest(
                user_id=user_id,
                roles=[],
                permissions=[],
                test_results={"error": str(e)}
            )
    
    def _get_detailed_pool_info(self) -> Dict[str, Any]:
        """获取详细连接池信息"""
        try:
            pool = engine_v2.pool
            return {
                "size": pool.size(),
                "checked_in": pool.checkedin(),
                "checked_out": pool.checkedout(),
                "overflow": pool.overflow(),
                "invalid": pool.invalid(),
                "total_connections": pool.size() + pool.overflow()
            }
        except Exception as e:
            return {"error": str(e)}
    
    def _get_table_statistics(self) -> Dict[str, Any]:
        """获取表统计信息"""
        try:
            # 获取主要表的记录数
            stats = {}
            tables = [
                ("hr.employees", "员工表"),
                ("payroll.payroll_periods", "薪资周期表"),
                ("payroll.payroll_runs", "薪资运行表"),
                ("payroll.payroll_entries", "薪资条目表"),
                ("security.users", "用户表")
            ]
            
            for table_name, description in tables:
                try:
                    result = self.db.execute(text(f"SELECT COUNT(*) as count FROM {table_name}"))
                    count = result.scalar()
                    stats[table_name] = {
                        "description": description,
                        "record_count": count
                    }
                except Exception:
                    stats[table_name] = {
                        "description": description,
                        "record_count": "N/A"
                    }
            
            return stats
            
        except Exception as e:
            return {"error": str(e)}
    
    def _get_slow_queries(self) -> Optional[List[Dict[str, Any]]]:
        """获取慢查询（PostgreSQL）"""
        try:
            # 这需要启用 pg_stat_statements 扩展
            query = text("""
                SELECT query, mean_time, calls, total_time
                FROM pg_stat_statements
                WHERE mean_time > 100
                ORDER BY mean_time DESC
                LIMIT 10
            """)
            
            result = self.db.execute(query)
            rows = result.mappings().all()
            
            return [
                {
                    "query": row["query"][:100] + "..." if len(row["query"]) > 100 else row["query"],
                    "mean_time_ms": round(row["mean_time"], 2),
                    "calls": row["calls"],
                    "total_time_ms": round(row["total_time"], 2)
                }
                for row in rows
            ]
            
        except Exception:
            # pg_stat_statements 可能未启用
            return None