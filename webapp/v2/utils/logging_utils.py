"""
API调用日志记录工具
"""
import logging
from typing import Optional, Dict, Any
from datetime import datetime

# 创建专门的API日志记录器
api_logger = logging.getLogger("api_calls")


def log_api_call(
    endpoint: str,
    method: str,
    user_id: Optional[int] = None,
    status: str = "success",
    error_message: Optional[str] = None,
    request_data: Optional[Dict[str, Any]] = None,
    response_data: Optional[Dict[str, Any]] = None,
    execution_time: Optional[float] = None
):
    """
    记录API调用日志
    
    Args:
        endpoint: API端点
        method: HTTP方法
        user_id: 用户ID
        status: 状态 (success, error, warning)
        error_message: 错误信息
        request_data: 请求数据
        response_data: 响应数据
        execution_time: 执行时间(秒)
    """
    log_data = {
        "timestamp": datetime.now().isoformat(),
        "endpoint": endpoint,
        "method": method.upper(),
        "user_id": user_id,
        "status": status,
        "execution_time": execution_time
    }
    
    if error_message:
        log_data["error_message"] = error_message
    
    if request_data:
        log_data["request_data"] = request_data
    
    if response_data:
        log_data["response_data"] = response_data
    
    # 根据状态选择日志级别
    if status == "error":
        api_logger.error(f"API调用失败: {log_data}")
    elif status == "warning":
        api_logger.warning(f"API调用警告: {log_data}")
    else:
        api_logger.info(f"API调用成功: {log_data}")


def log_user_action(
    user_id: int,
    action: str,
    resource_type: str,
    resource_id: Optional[int] = None,
    details: Optional[Dict[str, Any]] = None
):
    """
    记录用户操作日志
    
    Args:
        user_id: 用户ID
        action: 操作类型 (create, update, delete, view, apply等)
        resource_type: 资源类型 (preset, report, config等)
        resource_id: 资源ID
        details: 操作详情
    """
    log_data = {
        "timestamp": datetime.now().isoformat(),
        "user_id": user_id,
        "action": action,
        "resource_type": resource_type,
        "resource_id": resource_id,
        "details": details or {}
    }
    
    api_logger.info(f"用户操作: {log_data}")


def log_performance_metric(
    operation: str,
    execution_time: float,
    record_count: Optional[int] = None,
    additional_metrics: Optional[Dict[str, Any]] = None
):
    """
    记录性能指标
    
    Args:
        operation: 操作名称
        execution_time: 执行时间(秒)
        record_count: 处理记录数
        additional_metrics: 额外指标
    """
    log_data = {
        "timestamp": datetime.now().isoformat(),
        "operation": operation,
        "execution_time": execution_time,
        "record_count": record_count
    }
    
    if additional_metrics:
        log_data.update(additional_metrics)
    
    # 性能警告阈值
    if execution_time > 5.0:  # 超过5秒
        api_logger.warning(f"性能警告: {log_data}")
    else:
        api_logger.info(f"性能指标: {log_data}")


def log_security_event(
    event_type: str,
    user_id: Optional[int] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None
):
    """
    记录安全事件
    
    Args:
        event_type: 事件类型 (login_failed, permission_denied, suspicious_activity等)
        user_id: 用户ID
        ip_address: IP地址
        user_agent: 用户代理
        details: 事件详情
    """
    log_data = {
        "timestamp": datetime.now().isoformat(),
        "event_type": event_type,
        "user_id": user_id,
        "ip_address": ip_address,
        "user_agent": user_agent,
        "details": details or {}
    }
    
    # 安全事件使用警告级别
    api_logger.warning(f"安全事件: {log_data}")


def log_data_change(
    table_name: str,
    operation: str,
    record_id: Optional[int] = None,
    user_id: Optional[int] = None,
    old_values: Optional[Dict[str, Any]] = None,
    new_values: Optional[Dict[str, Any]] = None
):
    """
    记录数据变更日志
    
    Args:
        table_name: 表名
        operation: 操作类型 (INSERT, UPDATE, DELETE)
        record_id: 记录ID
        user_id: 操作用户ID
        old_values: 旧值
        new_values: 新值
    """
    log_data = {
        "timestamp": datetime.now().isoformat(),
        "table_name": table_name,
        "operation": operation.upper(),
        "record_id": record_id,
        "user_id": user_id
    }
    
    if old_values:
        log_data["old_values"] = old_values
    
    if new_values:
        log_data["new_values"] = new_values
    
    api_logger.info(f"数据变更: {log_data}") 