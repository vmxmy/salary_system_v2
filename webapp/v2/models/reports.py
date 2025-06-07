from sqlalchemy import Column, BigInteger, Integer, String, Text, Boolean, DateTime, ForeignKey, JSON, DECIMAL, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import JSONB
from ..database import BaseV2 as Base


class ReportDataSource(Base):
    """报表数据源模型 - 增强版"""
    __tablename__ = "report_data_sources"
    __table_args__ = (
        Index('idx_data_source_type_active', 'source_type', 'is_active'),
        Index('idx_data_source_category', 'category'),
        Index('idx_data_source_schema_table', 'schema_name', 'table_name'),
        {'schema': 'config'}
    )

    id = Column(BigInteger, primary_key=True, index=True)
    
    # 基础信息
    name = Column(String(200), nullable=False, comment="数据源名称")
    code = Column(String(100), unique=True, nullable=False, comment="数据源编码")
    description = Column(Text, comment="数据源描述")
    category = Column(String(50), comment="数据源分类")
    
    # 数据库连接信息
    connection_type = Column(String(50), nullable=False, default="postgresql", comment="连接类型")
    schema_name = Column(String(100), nullable=False, default="public", comment="模式名")
    table_name = Column(String(255), comment="表名")
    view_name = Column(String(100), comment="视图名")
    custom_query = Column(Text, comment="自定义查询SQL")
    
    # 数据源类型：table, view, query, procedure
    source_type = Column(String(20), nullable=False, default="table", comment="数据源类型")
    
    # 连接配置
    connection_config = Column(JSONB, comment="连接配置信息")
    
    # 字段映射和配置
    field_mapping = Column(JSONB, comment="字段映射配置")
    default_filters = Column(JSONB, comment="默认筛选条件")
    sort_config = Column(JSONB, comment="默认排序配置")
    
    # 权限和访问控制
    access_level = Column(String(20), default="public", comment="访问级别: public, private, restricted")
    allowed_roles = Column(JSONB, comment="允许访问的角色列表")
    allowed_users = Column(JSONB, comment="允许访问的用户列表")
    
    # 缓存和性能配置
    cache_enabled = Column(Boolean, default=False, comment="是否启用缓存")
    cache_duration = Column(Integer, default=3600, comment="缓存时长(秒)")
    max_rows = Column(Integer, default=10000, comment="最大返回行数")
    
    # 状态和显示
    is_active = Column(Boolean, default=True, nullable=False, comment="是否激活")
    is_system = Column(Boolean, default=False, nullable=False, comment="是否系统内置")
    sort_order = Column(Integer, default=0, nullable=False, comment="排序顺序")
    tags = Column(JSONB, comment="标签")
    
    # 统计信息
    field_count = Column(Integer, default=0, comment="字段数量")
    usage_count = Column(Integer, default=0, comment="使用次数")
    last_used_at = Column(DateTime(timezone=True), comment="最后使用时间")
    last_sync_at = Column(DateTime(timezone=True), comment="最后同步时间")
    
    # 审计字段
    created_by = Column(BigInteger, ForeignKey("security.users.id"), comment="创建者")
    updated_by = Column(BigInteger, ForeignKey("security.users.id"), comment="更新者")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, comment="创建时间")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False, comment="更新时间")

    # 关系
    creator = relationship("User", foreign_keys=[created_by], back_populates="created_data_sources")
    updater = relationship("User", foreign_keys=[updated_by])
    fields = relationship("ReportDataSourceField", back_populates="data_source", cascade="all, delete-orphan")
    templates = relationship("ReportTemplate", back_populates="data_source")
    access_logs = relationship("ReportDataSourceAccessLog", back_populates="data_source")


class ReportDataSourceField(Base):
    """报表数据源字段模型 - 增强版"""
    __tablename__ = "report_data_source_fields"
    __table_args__ = (
        Index('idx_ds_field_source_name', 'data_source_id', 'field_name'),
        Index('idx_ds_field_visible_sortable', 'is_visible', 'sort_order'),
        {'schema': 'config'}
    )

    id = Column(BigInteger, primary_key=True, index=True)
    data_source_id = Column(BigInteger, ForeignKey("config.report_data_sources.id"), nullable=False)
    
    # 基础字段信息
    field_name = Column(String(100), nullable=False, comment="原始字段名")
    field_alias = Column(String(100), comment="字段别名")
    field_type = Column(String(50), nullable=False, comment="字段类型")
    data_type = Column(String(50), comment="数据库数据类型")
    
    # 显示配置
    display_name_zh = Column(String(200), comment="中文显示名称")
    display_name_en = Column(String(200), comment="英文显示名称")
    description = Column(Text, comment="字段描述")
    
    # 字段属性
    is_nullable = Column(Boolean, default=True, comment="是否可为空")
    is_primary_key = Column(Boolean, default=False, comment="是否主键")
    is_foreign_key = Column(Boolean, default=False, comment="是否外键")
    is_indexed = Column(Boolean, default=False, comment="是否有索引")
    
    # 显示和权限控制
    is_visible = Column(Boolean, default=True, comment="是否可见")
    is_searchable = Column(Boolean, default=True, comment="是否可搜索")
    is_sortable = Column(Boolean, default=True, comment="是否可排序")
    is_filterable = Column(Boolean, default=True, comment="是否可筛选")
    is_exportable = Column(Boolean, default=True, comment="是否可导出")
    
    # 分组和分类
    field_group = Column(String(50), comment="字段分组")
    field_category = Column(String(50), comment="字段分类")
    sort_order = Column(Integer, default=0, comment="排序顺序")
    
    # 格式化配置
    format_config = Column(JSONB, comment="格式化配置")
    validation_rules = Column(JSONB, comment="验证规则")
    lookup_config = Column(JSONB, comment="查找表配置")
    
    # 统计配置
    enable_aggregation = Column(Boolean, default=False, comment="是否启用聚合")
    aggregation_functions = Column(JSONB, comment="可用聚合函数")
    
    # 审计字段
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), comment="更新时间")

    # 关系
    data_source = relationship("ReportDataSource", back_populates="fields")


class ReportDataSourceAccessLog(Base):
    """数据源访问日志"""
    __tablename__ = "report_data_source_access_logs"
    __table_args__ = {'schema': 'config'}
    
    id = Column(BigInteger, primary_key=True, index=True)
    data_source_id = Column(BigInteger, ForeignKey("config.report_data_sources.id"), nullable=False)
    user_id = Column(BigInteger, ForeignKey("security.users.id"), nullable=False)
    
    access_type = Column(String(20), nullable=False, comment="访问类型: view, query, export")
    access_result = Column(String(20), nullable=False, comment="访问结果: success, failed, denied")
    query_params = Column(JSONB, comment="查询参数")
    result_count = Column(Integer, comment="返回记录数")
    execution_time = Column(DECIMAL(10, 3), comment="执行时间(秒)")
    error_message = Column(Text, comment="错误信息")
    ip_address = Column(String(45), comment="IP地址")
    user_agent = Column(String(500), comment="用户代理")
    
    accessed_at = Column(DateTime(timezone=True), server_default=func.now(), comment="访问时间")
    
    # 关系
    data_source = relationship("ReportDataSource", back_populates="access_logs")
    user = relationship("User")


class ReportCalculatedField(Base):
    """报表计算字段模型"""
    __tablename__ = "report_calculated_fields"
    __table_args__ = {'schema': 'config'}

    id = Column(BigInteger, primary_key=True, index=True)
    name = Column(String(100), nullable=False, comment="字段名称")
    alias = Column(String(100), nullable=False, comment="字段别名")
    formula = Column(Text, nullable=False, comment="计算公式")
    return_type = Column(String(50), nullable=False, comment="返回类型")
    description = Column(Text, comment="描述")
    display_name_zh = Column(String(100), comment="中文显示名称")
    display_name_en = Column(String(100), comment="英文显示名称")
    is_global = Column(Boolean, default=True, comment="是否全局字段")
    is_active = Column(Boolean, default=True, comment="是否激活")
    category = Column(String(50), comment="分类")
    created_by = Column(BigInteger, ForeignKey("security.users.id"), comment="创建者")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), comment="更新时间")

    # 关系
    creator = relationship("User", back_populates="created_calculated_fields")


class ReportTemplate(Base):
    """报表模板模型"""
    __tablename__ = "report_templates"
    __table_args__ = {'schema': 'config'}

    id = Column(BigInteger, primary_key=True, index=True)
    name = Column(String(255), nullable=False, comment="模板名称")
    title = Column(String(500), comment="自定义标题")
    description = Column(Text, comment="描述")
    category = Column(String(100), comment="分类")
    data_source_id = Column(BigInteger, ForeignKey("config.report_data_sources.id"), comment="数据源ID")
    template_config = Column(JSONB, nullable=False, comment="模板配置")
    is_active = Column(Boolean, default=True, nullable=False, comment="是否激活")
    is_public = Column(Boolean, default=False, nullable=False, comment="是否公开")
    sort_order = Column(Integer, default=0, nullable=False, comment="排序顺序")
    usage_count = Column(Integer, default=0, nullable=False, comment="使用次数")
    created_by = Column(BigInteger, ForeignKey("security.users.id"), comment="创建者")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, comment="创建时间")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False, comment="更新时间")

    # 关系
    creator = relationship("User", back_populates="created_report_templates")
    data_source = relationship("ReportDataSource", back_populates="templates")
    fields = relationship("ReportTemplateField", back_populates="template", cascade="all, delete-orphan")
    executions = relationship("ReportExecution", back_populates="template")


class ReportTemplateField(Base):
    """报表模板字段模型"""
    __tablename__ = "report_template_fields"
    __table_args__ = {'schema': 'config'}

    id = Column(BigInteger, primary_key=True, index=True)
    template_id = Column(BigInteger, ForeignKey("config.report_templates.id"), nullable=False)
    field_name = Column(String(100), nullable=False, comment="字段名")
    field_alias = Column(String(100), comment="字段别名")
    data_source = Column(String(50), nullable=False, comment="数据源类型")
    field_type = Column(String(50), nullable=False, comment="字段类型")
    display_order = Column(Integer, default=0, comment="显示顺序")
    is_visible = Column(Boolean, default=True, comment="是否可见")
    is_sortable = Column(Boolean, default=True, comment="是否可排序")
    is_filterable = Column(Boolean, default=True, comment="是否可筛选")
    width = Column(Integer, comment="列宽")
    formatting_config = Column(JSONB, comment="格式化配置")
    calculation_formula = Column(Text, comment="计算公式")

    # 关系
    template = relationship("ReportTemplate", back_populates="fields")


class ReportExecution(Base):
    """报表执行记录模型"""
    __tablename__ = "report_executions"
    __table_args__ = {'schema': 'config'}

    id = Column(BigInteger, primary_key=True, index=True)
    template_id = Column(BigInteger, ForeignKey("config.report_templates.id"), nullable=False)
    execution_params = Column(JSONB, comment="执行参数")
    status = Column(String(20), default="pending", comment="执行状态")
    result_count = Column(Integer, comment="结果数量")
    execution_time = Column(DECIMAL(10, 3), comment="执行时间(秒)")
    error_message = Column(Text, comment="错误信息")
    file_path = Column(String(500), comment="导出文件路径")
    file_size = Column(BigInteger, comment="文件大小(字节)")
    file_format = Column(String(20), comment="文件格式")
    executed_by = Column(BigInteger, ForeignKey("security.users.id"), comment="执行者")
    executed_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, comment="执行时间")

    # 关系
    template = relationship("ReportTemplate", back_populates="executions")
    executor = relationship("User", back_populates="report_executions")


class ReportPermission(Base):
    """报表权限模型"""
    __tablename__ = "report_permissions"
    __table_args__ = (
        Index('idx_report_permissions_subject', 'subject_type', 'subject_id'),
        Index('idx_report_permissions_object', 'object_type', 'object_id'),
        Index('idx_report_permissions_type', 'permission_type'),
        {'schema': 'config'}
    )

    id = Column(BigInteger, primary_key=True, index=True)
    
    # 权限主体
    subject_type = Column(String(20), nullable=False, comment="主体类型: user, role, department")
    subject_id = Column(BigInteger, nullable=False, comment="主体ID")
    
    # 权限对象
    object_type = Column(String(20), nullable=False, comment="对象类型: data_source, template, field")
    object_id = Column(BigInteger, nullable=False, comment="对象ID")
    
    # 权限类型
    permission_type = Column(String(20), nullable=False, comment="权限类型: read, write, execute, export, admin")
    
    # 权限配置
    is_granted = Column(Boolean, default=True, comment="是否授权")
    conditions = Column(JSONB, comment="权限条件")
    
    # 审计字段
    granted_by = Column(BigInteger, ForeignKey("security.users.id"), comment="授权者")
    granted_at = Column(DateTime(timezone=True), server_default=func.now(), comment="授权时间")
    expires_at = Column(DateTime(timezone=True), comment="过期时间")

    # 关系
    grantor = relationship("User", foreign_keys=[granted_by])


class ReportUserPreference(Base):
    """用户偏好设置模型"""
    __tablename__ = "report_user_preferences"
    __table_args__ = (
        Index('idx_user_preferences_user', 'user_id'),
        Index('idx_user_preferences_type', 'preference_type'),
        # 唯一约束
        Index('uq_user_preference', 'user_id', 'preference_type', 'object_type', 'object_id', unique=True),
        {'schema': 'config'}
    )

    id = Column(BigInteger, primary_key=True, index=True)
    user_id = Column(BigInteger, ForeignKey("security.users.id"), nullable=False)
    
    # 偏好类型
    preference_type = Column(String(50), nullable=False, comment="偏好类型: layout, filter, sort, export")
    object_type = Column(String(20), comment="对象类型: template, data_source")
    object_id = Column(BigInteger, comment="对象ID")
    
    # 偏好配置
    preference_config = Column(JSONB, nullable=False, comment="偏好配置")
    
    # 审计字段
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), comment="更新时间")

    # 关系
    user = relationship("User", back_populates="report_preferences")


class ReportView(Base):
    """基于SQL视图的简化报表模型"""
    __tablename__ = "report_views"
    __table_args__ = {'schema': 'reports'}

    id = Column(BigInteger, primary_key=True, index=True)
    name = Column(String(255), nullable=False, comment="报表名称")
    description = Column(Text, comment="报表描述")
    view_name = Column(String(100), nullable=False, unique=True, comment="视图名称")
    sql_query = Column(Text, nullable=False, comment="SQL查询语句")
    schema_name = Column(String(50), nullable=False, default="reports", comment="视图所在模式")
    
    # 报表配置
    is_active = Column(Boolean, default=True, nullable=False, comment="是否激活")
    is_public = Column(Boolean, default=False, nullable=False, comment="是否公开")
    category = Column(String(100), comment="报表分类")
    report_title = Column(String(500), comment="报表标题")
    description_lines = Column(JSONB, comment="报表说明行列表")
    
    # 视图状态
    view_status = Column(String(20), default="draft", comment="视图状态: draft, created, error")
    last_sync_at = Column(DateTime(timezone=True), comment="最后同步时间")
    sync_error = Column(Text, comment="同步错误信息")
    
    # 使用统计
    usage_count = Column(Integer, default=0, nullable=False, comment="使用次数")
    last_used_at = Column(DateTime(timezone=True), comment="最后使用时间")
    
    # 审计字段
    created_by = Column(BigInteger, ForeignKey("security.users.id"), comment="创建者")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, comment="创建时间")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False, comment="更新时间")

    # 关系
    creator = relationship("User", back_populates="created_report_views")
    executions = relationship("ReportViewExecution", back_populates="report_view", cascade="all, delete-orphan")


class ReportViewExecution(Base):
    """报表视图执行记录"""
    __tablename__ = "report_view_executions"
    __table_args__ = {'schema': 'reports'}

    id = Column(BigInteger, primary_key=True, index=True)
    report_view_id = Column(BigInteger, ForeignKey("reports.report_views.id"), nullable=False)
    
    # 执行参数
    execution_params = Column(JSONB, comment="执行参数(筛选条件等)")
    result_count = Column(Integer, comment="结果数量")
    execution_time = Column(DECIMAL(10, 3), comment="执行时间(秒)")
    
    # 执行状态
    status = Column(String(20), default="success", comment="执行状态: success, error")
    error_message = Column(Text, comment="错误信息")
    
    # 导出信息
    export_format = Column(String(20), comment="导出格式: excel, csv, pdf")
    file_path = Column(String(500), comment="导出文件路径")
    file_size = Column(BigInteger, comment="文件大小(字节)")
    
    # 审计字段
    executed_by = Column(BigInteger, ForeignKey("security.users.id"), comment="执行者")
    executed_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, comment="执行时间")

    # 关系
    report_view = relationship("ReportView", back_populates="executions")
    executor = relationship("User", back_populates="report_view_executions")


# 更新User模型的关系（需要在security模型中添加）
# User.created_report_views = relationship("ReportView", back_populates="creator")
# User.report_view_executions = relationship("ReportViewExecution", back_populates="executor")

# 更新ReportView模型的关系
ReportView.executions = relationship("ReportViewExecution", back_populates="report_view", cascade="all, delete-orphan")


class BatchReportTask(Base):
    """批量报表生成任务模型"""
    __tablename__ = "batch_report_tasks"
    __table_args__ = (
        Index('idx_batch_task_status', 'status'),
        Index('idx_batch_task_created', 'created_at'),
        Index('idx_batch_task_user', 'created_by'),
        {'schema': 'config'}
    )

    id = Column(BigInteger, primary_key=True, index=True)
    
    # 任务基本信息
    task_name = Column(String(255), nullable=False, comment="任务名称")
    description = Column(Text, comment="任务描述")
    task_type = Column(String(50), nullable=False, default="batch_export", comment="任务类型")
    
    # 任务配置
    source_config = Column(JSONB, nullable=False, comment="数据源配置")
    export_config = Column(JSONB, nullable=False, comment="导出配置")
    filter_config = Column(JSONB, comment="筛选条件配置")
    
    # 任务状态
    status = Column(String(20), nullable=False, default="pending", comment="任务状态: pending, running, completed, failed, cancelled")
    progress = Column(Integer, default=0, comment="进度百分比(0-100)")
    
    # 执行信息
    started_at = Column(DateTime(timezone=True), comment="开始执行时间")
    completed_at = Column(DateTime(timezone=True), comment="完成时间")
    execution_time = Column(DECIMAL(10, 3), comment="执行时间(秒)")
    
    # 结果信息
    total_reports = Column(Integer, default=0, comment="总报表数量")
    completed_reports = Column(Integer, default=0, comment="已完成报表数量")
    failed_reports = Column(Integer, default=0, comment="失败报表数量")
    
    # 文件信息
    output_directory = Column(String(500), comment="输出目录")
    archive_file_path = Column(String(500), comment="打包文件路径")
    archive_file_size = Column(BigInteger, comment="打包文件大小(字节)")
    
    # 错误信息
    error_message = Column(Text, comment="错误信息")
    error_details = Column(JSONB, comment="详细错误信息")
    
    # 审计字段
    created_by = Column(BigInteger, ForeignKey("security.users.id"), nullable=False, comment="创建者")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, comment="创建时间")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False, comment="更新时间")

    # 关系
    creator = relationship("User", back_populates="created_batch_tasks")
    task_items = relationship("BatchReportTaskItem", back_populates="task", cascade="all, delete-orphan")


class BatchReportTaskItem(Base):
    """批量报表任务项模型"""
    __tablename__ = "batch_report_task_items"
    __table_args__ = (
        Index('idx_batch_item_task', 'task_id'),
        Index('idx_batch_item_status', 'status'),
        {'schema': 'config'}
    )

    id = Column(BigInteger, primary_key=True, index=True)
    task_id = Column(BigInteger, ForeignKey("config.batch_report_tasks.id"), nullable=False)
    
    # 报表信息
    report_type = Column(String(50), nullable=False, comment="报表类型")
    report_name = Column(String(255), nullable=False, comment="报表名称")
    report_config = Column(JSONB, nullable=False, comment="报表配置")
    
    # 执行状态
    status = Column(String(20), nullable=False, default="pending", comment="状态: pending, running, completed, failed, skipped")
    execution_order = Column(Integer, default=0, comment="执行顺序")
    
    # 执行信息
    started_at = Column(DateTime(timezone=True), comment="开始时间")
    completed_at = Column(DateTime(timezone=True), comment="完成时间")
    execution_time = Column(DECIMAL(10, 3), comment="执行时间(秒)")
    
    # 结果信息
    result_count = Column(Integer, comment="结果数量")
    file_path = Column(String(500), comment="生成文件路径")
    file_size = Column(BigInteger, comment="文件大小(字节)")
    file_format = Column(String(20), comment="文件格式")
    
    # 错误信息
    error_message = Column(Text, comment="错误信息")
    error_details = Column(JSONB, comment="详细错误信息")
    
    # 审计字段
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), comment="更新时间")

    # 关系
    task = relationship("BatchReportTask", back_populates="task_items")


class ReportFileManager(Base):
    """报表文件管理模型"""
    __tablename__ = "report_file_manager"
    __table_args__ = (
        Index('idx_file_manager_type', 'file_type'),
        Index('idx_file_manager_created', 'created_at'),
        Index('idx_file_manager_expires', 'expires_at'),
        {'schema': 'config'}
    )

    id = Column(BigInteger, primary_key=True, index=True)
    
    # 文件基本信息
    file_name = Column(String(255), nullable=False, comment="文件名")
    file_path = Column(String(500), nullable=False, comment="文件路径")
    file_size = Column(BigInteger, comment="文件大小(字节)")
    file_type = Column(String(50), nullable=False, comment="文件类型: report, archive, temp")
    file_format = Column(String(20), comment="文件格式: xlsx, csv, pdf, zip")
    
    # 关联信息
    source_type = Column(String(50), comment="来源类型: single_report, batch_task, manual_export")
    source_id = Column(BigInteger, comment="来源ID")
    
    # 文件状态
    status = Column(String(20), nullable=False, default="active", comment="状态: active, archived, deleted")
    is_temporary = Column(Boolean, default=False, comment="是否临时文件")
    
    # 访问控制
    access_level = Column(String(20), default="private", comment="访问级别: public, private, restricted")
    download_count = Column(Integer, default=0, comment="下载次数")
    last_accessed_at = Column(DateTime(timezone=True), comment="最后访问时间")
    
    # 生命周期管理
    expires_at = Column(DateTime(timezone=True), comment="过期时间")
    auto_cleanup = Column(Boolean, default=True, comment="是否自动清理")
    
    # 元数据
    metadata_info = Column(JSONB, comment="文件元数据")
    checksum = Column(String(64), comment="文件校验和")
    
    # 审计字段
    created_by = Column(BigInteger, ForeignKey("security.users.id"), comment="创建者")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, comment="创建时间")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False, comment="更新时间")

    # 关系
    creator = relationship("User", back_populates="created_files") 