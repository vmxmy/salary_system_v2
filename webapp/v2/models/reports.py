from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, JSON, DECIMAL
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import BaseV2 as Base


class ReportDataSource(Base):
    """报表数据源模型"""
    __tablename__ = "report_data_sources"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, comment="数据源名称")
    table_name = Column(String(100), nullable=False, comment="表名")
    schema_name = Column(String(100), nullable=False, default="public", comment="模式名")
    description = Column(Text, comment="描述")
    connection_config = Column(JSON, comment="连接配置")
    is_active = Column(Boolean, default=True, comment="是否激活")
    created_by = Column(Integer, ForeignKey("security.users.id"), comment="创建者")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), comment="更新时间")

    # 关系
    creator = relationship("User", back_populates="created_data_sources")
    fields = relationship("ReportDataSourceField", back_populates="data_source", cascade="all, delete-orphan")
    templates = relationship("ReportTemplate", back_populates="data_source")


class ReportDataSourceField(Base):
    """报表数据源字段模型"""
    __tablename__ = "report_data_source_fields"

    id = Column(Integer, primary_key=True, index=True)
    data_source_id = Column(Integer, ForeignKey("report_data_sources.id"), nullable=False)
    field_name = Column(String(100), nullable=False, comment="字段名")
    field_type = Column(String(50), nullable=False, comment="字段类型")
    is_nullable = Column(Boolean, default=True, comment="是否可为空")
    comment = Column(String(200), comment="字段注释")
    display_name_zh = Column(String(100), comment="中文显示名称")
    display_name_en = Column(String(100), comment="英文显示名称")
    is_visible = Column(Boolean, default=True, comment="是否可见")
    sort_order = Column(Integer, default=0, comment="排序顺序")

    # 关系
    data_source = relationship("ReportDataSource", back_populates="fields")


class ReportCalculatedField(Base):
    """报表计算字段模型"""
    __tablename__ = "report_calculated_fields"

    id = Column(Integer, primary_key=True, index=True)
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
    created_by = Column(Integer, ForeignKey("security.users.id"), comment="创建者")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), comment="更新时间")

    # 关系
    creator = relationship("User", back_populates="created_calculated_fields")


class ReportTemplate(Base):
    """报表模板模型"""
    __tablename__ = "report_templates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, comment="模板名称")
    title = Column(String(200), comment="自定义标题")
    description = Column(Text, comment="描述")
    category = Column(String(50), comment="分类")
    data_source_id = Column(Integer, ForeignKey("report_data_sources.id"), comment="数据源ID")
    template_config = Column(JSON, comment="模板配置")
    is_active = Column(Boolean, default=True, comment="是否激活")
    is_public = Column(Boolean, default=False, comment="是否公开")
    sort_order = Column(Integer, default=0, comment="排序顺序")
    usage_count = Column(Integer, default=0, comment="使用次数")
    created_by = Column(Integer, ForeignKey("security.users.id"), comment="创建者")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), comment="更新时间")

    # 关系
    creator = relationship("User", back_populates="created_report_templates")
    data_source = relationship("ReportDataSource", back_populates="templates")
    fields = relationship("ReportTemplateField", back_populates="template", cascade="all, delete-orphan")
    executions = relationship("ReportExecution", back_populates="template")


class ReportTemplateField(Base):
    """报表模板字段模型"""
    __tablename__ = "report_template_fields"

    id = Column(Integer, primary_key=True, index=True)
    template_id = Column(Integer, ForeignKey("report_templates.id"), nullable=False)
    field_name = Column(String(100), nullable=False, comment="字段名")
    field_alias = Column(String(100), comment="字段别名")
    data_source = Column(String(50), nullable=False, comment="数据源类型")
    field_type = Column(String(50), nullable=False, comment="字段类型")
    display_order = Column(Integer, default=0, comment="显示顺序")
    is_visible = Column(Boolean, default=True, comment="是否可见")
    is_sortable = Column(Boolean, default=True, comment="是否可排序")
    is_filterable = Column(Boolean, default=True, comment="是否可筛选")
    width = Column(Integer, comment="列宽")
    formatting_config = Column(JSON, comment="格式化配置")
    calculation_formula = Column(Text, comment="计算公式")

    # 关系
    template = relationship("ReportTemplate", back_populates="fields")


class ReportExecution(Base):
    """报表执行记录模型"""
    __tablename__ = "report_executions"

    id = Column(Integer, primary_key=True, index=True)
    template_id = Column(Integer, ForeignKey("report_templates.id"), nullable=False)
    execution_params = Column(JSON, comment="执行参数")
    status = Column(String(20), default="pending", comment="执行状态")
    result_count = Column(Integer, comment="结果数量")
    execution_time = Column(DECIMAL(10, 3), comment="执行时间(秒)")
    error_message = Column(Text, comment="错误信息")
    file_path = Column(String(500), comment="导出文件路径")
    executed_by = Column(Integer, ForeignKey("security.users.id"), comment="执行者")
    executed_at = Column(DateTime(timezone=True), server_default=func.now(), comment="执行时间")

    # 关系
    template = relationship("ReportTemplate", back_populates="executions")
    executor = relationship("User", back_populates="report_executions") 