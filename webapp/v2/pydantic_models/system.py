"""
系统相关的Pydantic模型定义
"""
from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field
from .common import DataResponse


class SystemInfo(BaseModel):
    """系统基本信息响应模型"""
    app_name: str = Field(..., description="应用程序名称")
    version: str = Field(..., description="应用程序版本")
    api_version: str = Field(..., description="API版本")
    environment: str = Field(..., description="运行环境")
    uptime: str = Field(..., description="运行时长")
    startup_time: datetime = Field(..., description="启动时间")
    message: str = Field(..., description="欢迎消息")


class DatabaseStatus(BaseModel):
    """数据库状态模型"""
    status: str = Field(..., description="数据库状态")
    connection_pool_size: Optional[int] = Field(None, description="连接池大小")
    active_connections: Optional[int] = Field(None, description="活跃连接数")
    response_time_ms: Optional[float] = Field(None, description="响应时间(毫秒)")


class SystemMetrics(BaseModel):
    """系统运行指标"""
    cpu_usage: Optional[float] = Field(None, description="CPU使用率")
    memory_usage: Optional[float] = Field(None, description="内存使用率")
    disk_usage: Optional[float] = Field(None, description="磁盘使用率")
    request_count: Optional[int] = Field(None, description="总请求数")
    error_count: Optional[int] = Field(None, description="错误请求数")


class HealthCheck(BaseModel):
    """健康检查响应模型"""
    status: str = Field(..., description="总体健康状态")
    timestamp: datetime = Field(..., description="检查时间")
    database: DatabaseStatus = Field(..., description="数据库状态")
    version: str = Field(..., description="应用版本")
    uptime: str = Field(..., description="运行时长")
    metrics: Optional[SystemMetrics] = Field(None, description="系统指标")
    details: Optional[Dict[str, Any]] = Field(None, description="详细信息")


class VersionInfo(BaseModel):
    """版本信息响应模型"""
    app_version: str = Field(..., description="应用版本")
    api_version: str = Field(..., description="API版本")
    database_version: Optional[str] = Field(None, description="数据库版本")
    python_version: str = Field(..., description="Python版本")
    build_date: Optional[str] = Field(None, description="构建日期")
    git_commit: Optional[str] = Field(None, description="Git提交哈希")
    dependencies: Optional[Dict[str, str]] = Field(None, description="主要依赖版本")


class DebugFieldConfig(BaseModel):
    """调试字段配置响应模型"""
    employee_type_key: str = Field(..., description="员工类型键")
    field_db_name: str = Field(..., description="字段数据库名称")
    is_required: bool = Field(..., description="是否必填")
    source_name: Optional[str] = Field(None, description="源字段名")
    target_name: Optional[str] = Field(None, description="目标字段名")


class DebugInfo(BaseModel):
    """调试信息响应模型"""
    component: str = Field(..., description="组件名称")
    status: str = Field(..., description="状态")
    data: Dict[str, Any] = Field(..., description="调试数据")
    timestamp: datetime = Field(..., description="检查时间")
    message: Optional[str] = Field(None, description="附加消息")


class DatabaseDiagnostic(BaseModel):
    """数据库诊断信息"""
    connection_status: str = Field(..., description="连接状态")
    pool_info: Dict[str, Any] = Field(..., description="连接池信息")
    query_performance: Optional[Dict[str, Any]] = Field(None, description="查询性能")
    slow_queries: Optional[List[Dict[str, Any]]] = Field(None, description="慢查询")
    table_stats: Optional[Dict[str, Any]] = Field(None, description="表统计信息")


class PerformanceMetrics(BaseModel):
    """性能指标模型"""
    response_times: Dict[str, float] = Field(..., description="响应时间统计")
    request_counts: Dict[str, int] = Field(..., description="请求计数")
    error_rates: Dict[str, float] = Field(..., description="错误率")
    memory_usage: Optional[Dict[str, Any]] = Field(None, description="内存使用")
    cpu_usage: Optional[float] = Field(None, description="CPU使用率")


class PermissionTest(BaseModel):
    """权限测试结果"""
    user_id: Optional[int] = Field(None, description="用户ID")
    username: Optional[str] = Field(None, description="用户名")
    roles: List[str] = Field(..., description="用户角色")
    permissions: List[str] = Field(..., description="用户权限")
    test_results: Dict[str, bool] = Field(..., description="权限测试结果")


class UtilityResponse(BaseModel):
    """工具类操作响应"""
    success: bool = Field(..., description="操作是否成功")
    message: str = Field(..., description="操作消息")
    data: Optional[Dict[str, Any]] = Field(None, description="返回数据")
    file_url: Optional[str] = Field(None, description="文件下载链接")


class ExcelConversionRequest(BaseModel):
    """Excel转换请求"""
    file_name: str = Field(..., description="文件名")
    sheet_name: Optional[str] = Field(None, description="工作表名")
    output_format: str = Field(default="csv", description="输出格式")
    include_headers: bool = Field(default=True, description="是否包含表头")


class ExcelConversionResponse(BaseModel):
    """Excel转换响应"""
    success: bool = Field(..., description="转换是否成功")
    message: str = Field(..., description="转换消息")
    output_file: Optional[str] = Field(None, description="输出文件路径")
    download_url: Optional[str] = Field(None, description="下载链接")
    records_count: Optional[int] = Field(None, description="转换记录数")


class TemplateInfo(BaseModel):
    """模板信息"""
    name: str = Field(..., description="模板名称")
    description: str = Field(..., description="模板描述")
    file_type: str = Field(..., description="文件类型")
    download_url: str = Field(..., description="下载链接")
    size: Optional[int] = Field(None, description="文件大小(字节)")
    last_modified: Optional[datetime] = Field(None, description="最后修改时间")


# 响应类型定义
SystemInfoResponse = DataResponse[SystemInfo]
HealthCheckResponse = DataResponse[HealthCheck]
VersionInfoResponse = DataResponse[VersionInfo]
DebugFieldConfigListResponse = DataResponse[List[DebugFieldConfig]]
DebugInfoResponse = DataResponse[DebugInfo]
DatabaseDiagnosticResponse = DataResponse[DatabaseDiagnostic]
PerformanceMetricsResponse = DataResponse[PerformanceMetrics]
PermissionTestResponse = DataResponse[PermissionTest]
UtilityOperationResponse = DataResponse[UtilityResponse]
ExcelConversionResultResponse = DataResponse[ExcelConversionResponse]
TemplateListResponse = DataResponse[List[TemplateInfo]]