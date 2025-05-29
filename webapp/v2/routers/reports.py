from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from ..database import get_db_v2
from ..models.security import User
from ...auth import get_current_user
from ..utils.permissions import (
    require_permission, has_permission, can_edit_datasource, 
    can_delete_datasource, filter_accessible_items
)
from ..crud.reports import (
    ReportDataSourceCRUD, ReportDataSourceFieldCRUD, ReportCalculatedFieldCRUD,
    ReportTemplateCRUD, ReportTemplateFieldCRUD, ReportExecutionCRUD
)
from ..pydantic_models.reports import (
    ReportDataSource, ReportDataSourceCreate, ReportDataSourceUpdate,
    ReportDataSourceField, ReportDataSourceFieldCreate, ReportDataSourceFieldUpdate,
    ReportCalculatedField, ReportCalculatedFieldCreate, ReportCalculatedFieldUpdate,
    ReportTemplate, ReportTemplateCreate, ReportTemplateUpdate,
    ReportTemplateField, ReportTemplateFieldCreate, ReportTemplateFieldUpdate,
    ReportExecution, ReportExecutionCreate,
    DataSourceFieldDetection, DetectedField, ReportQuery, ReportData
)

router = APIRouter(prefix="/reports", tags=["reports"])


# 数据源管理
@router.get("/data-sources", response_model=List[ReportDataSource])
async def get_data_sources(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(require_permission("report:view_datasources"))
):
    """获取数据源列表"""
    data_sources = ReportDataSourceCRUD.get_all(db, skip=skip, limit=limit)
    # 根据权限过滤可访问的数据源
    return filter_accessible_items(current_user, data_sources)


@router.get("/data-sources/{data_source_id}", response_model=ReportDataSource)
async def get_data_source(
    data_source_id: int,
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(require_permission("report:view_datasources"))
):
    """获取数据源详情"""
    data_source = ReportDataSourceCRUD.get_by_id(db, data_source_id)
    if not data_source:
        raise HTTPException(status_code=404, detail="数据源不存在")
    
    # 检查访问权限
    if not has_permission(current_user, "report:admin") and data_source.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="无权访问此数据源")
    
    return data_source


@router.post("/data-sources", response_model=ReportDataSource)
async def create_data_source(
    data_source: ReportDataSourceCreate,
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(require_permission("report:create_datasource"))
):
    """创建数据源"""
    return ReportDataSourceCRUD.create(db, data_source, current_user.id)


@router.put("/data-sources/{data_source_id}", response_model=ReportDataSource)
async def update_data_source(
    data_source_id: int,
    data_source: ReportDataSourceUpdate,
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """更新数据源"""
    # 先获取数据源检查权限
    existing_data_source = ReportDataSourceCRUD.get_by_id(db, data_source_id)
    if not existing_data_source:
        raise HTTPException(status_code=404, detail="数据源不存在")
    
    if not can_edit_datasource(current_user, existing_data_source.created_by):
        raise HTTPException(status_code=403, detail="无权编辑此数据源")
    
    updated_data_source = ReportDataSourceCRUD.update(db, data_source_id, data_source)
    return updated_data_source


@router.delete("/data-sources/{data_source_id}")
async def delete_data_source(
    data_source_id: int,
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """删除数据源"""
    # 先获取数据源检查权限
    existing_data_source = ReportDataSourceCRUD.get_by_id(db, data_source_id)
    if not existing_data_source:
        raise HTTPException(status_code=404, detail="数据源不存在")
    
    if not can_delete_datasource(current_user, existing_data_source.created_by):
        raise HTTPException(status_code=403, detail="无权删除此数据源")
    
    success = ReportDataSourceCRUD.delete(db, data_source_id)
    return {"message": "数据源删除成功"}


@router.post("/data-sources/detect-fields", response_model=List[DetectedField])
async def detect_data_source_fields(
    detection: DataSourceFieldDetection,
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(require_permission("report:detect_fields"))
):
    """检测数据源字段"""
    return ReportDataSourceCRUD.detect_fields(db, detection)


# 数据源字段管理
@router.get("/data-sources/{data_source_id}/fields", response_model=List[ReportDataSourceField])
async def get_data_source_fields(
    data_source_id: int,
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """获取数据源字段列表"""
    return ReportDataSourceFieldCRUD.get_by_data_source(db, data_source_id)


@router.post("/data-source-fields", response_model=ReportDataSourceField)
async def create_data_source_field(
    field: ReportDataSourceFieldCreate,
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """创建数据源字段"""
    return ReportDataSourceFieldCRUD.create(db, field)


@router.put("/data-source-fields/{field_id}", response_model=ReportDataSourceField)
async def update_data_source_field(
    field_id: int,
    field: ReportDataSourceFieldUpdate,
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """更新数据源字段"""
    updated_field = ReportDataSourceFieldCRUD.update(db, field_id, field)
    if not updated_field:
        raise HTTPException(status_code=404, detail="字段不存在")
    return updated_field


@router.delete("/data-source-fields/{field_id}")
async def delete_data_source_field(
    field_id: int,
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """删除数据源字段"""
    success = ReportDataSourceFieldCRUD.delete(db, field_id)
    if not success:
        raise HTTPException(status_code=404, detail="字段不存在")
    return {"message": "字段删除成功"}


# 计算字段管理
@router.get("/calculated-fields", response_model=List[ReportCalculatedField])
async def get_calculated_fields(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    is_global: Optional[bool] = Query(None),
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """获取计算字段列表"""
    return ReportCalculatedFieldCRUD.get_all(db, skip=skip, limit=limit, is_global=is_global)


@router.get("/calculated-fields/{field_id}", response_model=ReportCalculatedField)
async def get_calculated_field(
    field_id: int,
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """获取计算字段详情"""
    field = ReportCalculatedFieldCRUD.get_by_id(db, field_id)
    if not field:
        raise HTTPException(status_code=404, detail="计算字段不存在")
    return field


@router.post("/calculated-fields", response_model=ReportCalculatedField)
async def create_calculated_field(
    field: ReportCalculatedFieldCreate,
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """创建计算字段"""
    return ReportCalculatedFieldCRUD.create(db, field, current_user.id)


@router.put("/calculated-fields/{field_id}", response_model=ReportCalculatedField)
async def update_calculated_field(
    field_id: int,
    field: ReportCalculatedFieldUpdate,
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """更新计算字段"""
    updated_field = ReportCalculatedFieldCRUD.update(db, field_id, field)
    if not updated_field:
        raise HTTPException(status_code=404, detail="计算字段不存在")
    return updated_field


@router.delete("/calculated-fields/{field_id}")
async def delete_calculated_field(
    field_id: int,
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """删除计算字段"""
    success = ReportCalculatedFieldCRUD.delete(db, field_id)
    if not success:
        raise HTTPException(status_code=404, detail="计算字段不存在")
    return {"message": "计算字段删除成功"}


@router.post("/calculated-fields/test-formula")
async def test_calculated_field_formula(
    formula: str,
    data_source_id: Optional[int] = None,
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """测试计算字段公式"""
    return ReportCalculatedFieldCRUD.test_formula(db, formula, data_source_id)


# 报表模板管理
@router.get("/templates", response_model=List[ReportTemplate])
async def get_report_templates(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    is_public: Optional[bool] = Query(None),
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """获取报表模板列表"""
    return ReportTemplateCRUD.get_all(db, skip=skip, limit=limit, is_public=is_public)


@router.get("/templates/{template_id}", response_model=ReportTemplate)
async def get_report_template(
    template_id: int,
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """获取报表模板详情"""
    template = ReportTemplateCRUD.get_by_id(db, template_id)
    if not template:
        raise HTTPException(status_code=404, detail="报表模板不存在")
    return template


@router.post("/templates", response_model=ReportTemplate)
async def create_report_template(
    template: ReportTemplateCreate,
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """创建报表模板"""
    return ReportTemplateCRUD.create(db, template, current_user.id)


@router.put("/templates/{template_id}", response_model=ReportTemplate)
async def update_report_template(
    template_id: int,
    template: ReportTemplateUpdate,
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """更新报表模板"""
    updated_template = ReportTemplateCRUD.update(db, template_id, template)
    if not updated_template:
        raise HTTPException(status_code=404, detail="报表模板不存在")
    return updated_template


@router.delete("/templates/{template_id}")
async def delete_report_template(
    template_id: int,
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """删除报表模板"""
    success = ReportTemplateCRUD.delete(db, template_id)
    if not success:
        raise HTTPException(status_code=404, detail="报表模板不存在")
    return {"message": "报表模板删除成功"}


# 报表模板字段管理
@router.get("/templates/{template_id}/fields", response_model=List[ReportTemplateField])
async def get_template_fields(
    template_id: int,
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """获取报表模板字段列表"""
    return ReportTemplateFieldCRUD.get_by_template(db, template_id)


@router.post("/template-fields", response_model=ReportTemplateField)
async def create_template_field(
    field: ReportTemplateFieldCreate,
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """创建报表模板字段"""
    return ReportTemplateFieldCRUD.create(db, field)


@router.put("/template-fields/{field_id}", response_model=ReportTemplateField)
async def update_template_field(
    field_id: int,
    field: ReportTemplateFieldUpdate,
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """更新报表模板字段"""
    updated_field = ReportTemplateFieldCRUD.update(db, field_id, field)
    if not updated_field:
        raise HTTPException(status_code=404, detail="模板字段不存在")
    return updated_field


@router.delete("/template-fields/{field_id}")
async def delete_template_field(
    field_id: int,
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """删除报表模板字段"""
    success = ReportTemplateFieldCRUD.delete(db, field_id)
    if not success:
        raise HTTPException(status_code=404, detail="模板字段不存在")
    return {"message": "模板字段删除成功"}


# 报表执行管理
@router.get("/executions", response_model=List[ReportExecution])
async def get_report_executions(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """获取报表执行记录列表"""
    return ReportExecutionCRUD.get_all(db, skip=skip, limit=limit)


@router.get("/executions/{execution_id}", response_model=ReportExecution)
async def get_report_execution(
    execution_id: int,
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """获取报表执行记录详情"""
    execution = ReportExecutionCRUD.get_by_id(db, execution_id)
    if not execution:
        raise HTTPException(status_code=404, detail="执行记录不存在")
    return execution


@router.post("/executions", response_model=ReportExecution)
async def create_report_execution(
    execution: ReportExecutionCreate,
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """创建报表执行记录"""
    return ReportExecutionCRUD.create(db, execution, current_user.id)


# 报表查询和预览
@router.post("/query", response_model=ReportData)
async def query_report_data(
    query: ReportQuery,
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """查询报表数据"""
    # 这里需要实现具体的报表查询逻辑
    # 根据模板配置和查询参数生成SQL并执行
    template = ReportTemplateCRUD.get_by_id(db, query.template_id)
    if not template:
        raise HTTPException(status_code=404, detail="报表模板不存在")
    
    # 增加使用次数
    ReportTemplateCRUD.increment_usage(db, query.template_id)
    
    # 这里应该实现具体的查询逻辑
    # 暂时返回模拟数据
    return ReportData(
        columns=[
            {"key": "id", "title": "ID", "dataIndex": "id"},
            {"key": "name", "title": "姓名", "dataIndex": "name"},
        ],
        data=[
            {"id": 1, "name": "张三"},
            {"id": 2, "name": "李四"},
        ],
        total=2,
        page=query.page,
        page_size=query.page_size
    ) 