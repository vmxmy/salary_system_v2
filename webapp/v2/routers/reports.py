from typing import List, Optional, Dict, Any
import datetime
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
    ReportTemplateCRUD, ReportTemplateFieldCRUD, ReportExecutionCRUD,
    ReportViewCRUD, ReportViewExecutionCRUD
)
from ..pydantic_models.reports import (
    ReportDataSource, ReportDataSourceCreate, ReportDataSourceUpdate,
    ReportDataSourceField, ReportDataSourceFieldCreate, ReportDataSourceFieldUpdate,
    ReportCalculatedField, ReportCalculatedFieldCreate, ReportCalculatedFieldUpdate,
    ReportTemplate, ReportTemplateCreate, ReportTemplateUpdate, ReportTemplateListItem,
    ReportTemplateField, ReportTemplateFieldCreate, ReportTemplateFieldUpdate,
    ReportExecution, ReportExecutionCreate,
    DataSourceFieldDetection, DetectedField, ReportQuery, ReportData,
    DataSourceConnectionTest, DataSourceConnectionTestResponse,
    ReportViewListItem, ReportView, ReportViewCreate, ReportViewUpdate,
    ReportViewSyncRequest, ReportViewValidationRequest, ReportViewValidationResponse,
    ReportViewQueryRequest, ReportViewQueryResponse, ReportViewExecution,
    ReportViewExecutionCreate
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
    current_user: User = Depends(get_current_user)
):
    """创建数据源"""
    if not has_permission(current_user, "report:create_datasource"):
        raise HTTPException(status_code=403, detail="无权创建数据源")
    
    try:
        return ReportDataSourceCRUD.create(db, data_source, current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"创建数据源失败: {str(e)}")


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


@router.post("/data-sources/test-connection")
async def test_data_source_connection(
    connection_test: DataSourceConnectionTest,
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(require_permission("report:test_connection"))
):
    """测试数据源连接"""
    try:
        result = ReportDataSourceCRUD.test_connection(db, connection_test)
        return result
    except Exception as e:
        return DataSourceConnectionTestResponse(
            success=False,
            message=f"连接测试失败: {str(e)}",
            error_details=str(e)
        )


@router.post("/data-sources/detect-fields", response_model=List[DetectedField])
async def detect_data_source_fields(
    detection: DataSourceFieldDetection,
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(require_permission("report:detect_fields"))
):
    """检测数据源字段"""
    return ReportDataSourceCRUD.detect_fields(db, detection)


@router.post("/data-sources/{data_source_id}/sync-fields")
async def sync_data_source_fields(
    data_source_id: int,
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """同步数据源字段"""
    # 先获取数据源检查权限
    data_source = ReportDataSourceCRUD.get_by_id(db, data_source_id)
    if not data_source:
        raise HTTPException(status_code=404, detail="数据源不存在")
    
    # 检查同步字段权限
    if not can_edit_datasource(current_user, data_source.created_by):
        raise HTTPException(status_code=403, detail="无权同步此数据源的字段")
    
    try:
        # 执行字段同步
        synced_fields = ReportDataSourceCRUD.sync_fields(db, data_source_id)
        return {
            "message": "字段同步成功",
            "synced_count": len(synced_fields),
            "fields": synced_fields
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"字段同步失败: {str(e)}")


@router.get("/data-sources/{data_source_id}/statistics")
async def get_data_source_statistics(
    data_source_id: int,
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """获取数据源统计信息"""
    # 先获取数据源检查权限
    data_source = ReportDataSourceCRUD.get_by_id(db, data_source_id)
    if not data_source:
        raise HTTPException(status_code=404, detail="数据源不存在")
    
    # 检查访问权限
    if not has_permission(current_user, "report:admin") and data_source.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="无权访问此数据源")
    
    try:
        statistics = ReportDataSourceCRUD.get_statistics(db, data_source_id)
        return statistics
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取统计信息失败: {str(e)}")


@router.get("/data-sources/{data_source_id}/access-logs")
async def get_data_source_access_logs(
    data_source_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """获取数据源访问日志"""
    # 先获取数据源检查权限
    data_source = ReportDataSourceCRUD.get_by_id(db, data_source_id)
    if not data_source:
        raise HTTPException(status_code=404, detail="数据源不存在")
    
    # 检查访问权限
    if not has_permission(current_user, "report:admin") and data_source.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="无权访问此数据源")
    
    try:
        access_logs = ReportDataSourceCRUD.get_access_logs(db, data_source_id, skip, limit)
        return access_logs
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取访问日志失败: {str(e)}")


@router.get("/data-sources/{data_source_id}/preview")
async def preview_data_source_data(
    data_source_id: int,
    limit: int = Query(10, ge=1, le=100),
    filters: Optional[str] = Query(None, description="JSON格式的筛选条件"),
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """预览数据源数据"""
    # 先获取数据源检查权限
    data_source = ReportDataSourceCRUD.get_by_id(db, data_source_id)
    if not data_source:
        raise HTTPException(status_code=404, detail="数据源不存在")
    
    # 检查访问权限
    if not has_permission(current_user, "report:admin") and data_source.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="无权访问此数据源")
    
    try:
        import json
        filter_dict = {}
        if filters:
            try:
                filter_dict = json.loads(filters)
            except json.JSONDecodeError:
                raise HTTPException(status_code=400, detail="筛选条件格式错误")
        
        preview_data = ReportDataSourceCRUD.preview_data(db, data_source_id, limit, filter_dict)
        return {
            "data": preview_data,
            "total_count": len(preview_data),
            "limit": limit
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"预览数据失败: {str(e)}")


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
@router.get("/templates", response_model=List[ReportTemplateListItem])
async def get_report_templates(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    is_public: Optional[bool] = Query(None),
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """获取报表模板列表 (摘要信息)"""
    # Add permission check if needed, e.g., require_permission("report:view_templates")
    # For now, allowing any authenticated user to list templates, filtering public/private later if needed.
    
    templates_orm = ReportTemplateCRUD.get_all(db, skip=skip, limit=limit, is_public=is_public)
    
    # Manually construct the list of ReportTemplateListItem from ORM objects
    # This ensures only the fields defined in ReportTemplateListItem are returned.
    templates_list = [
        ReportTemplateListItem.from_orm(template)
        for template in templates_orm
    ]
    # Add filtering based on current_user's access to non-public templates if necessary here
    # For example, if template.is_public is False, check if current_user.id == template.created_by
    # or if user has admin rights.
    
    # Example of further filtering (if not handled by CRUD or a permission utility):
    # accessible_templates = []
    # for template_data in templates_list:
    #     orm_template = next((t for t in templates_orm if t.id == template_data.id), None)
    #     if orm_template:
    #         if orm_template.is_public or (current_user and orm_template.created_by == current_user.id) or has_permission(current_user, "report:admin"):
    #             accessible_templates.append(template_data)
    # return accessible_templates
    
    return templates_list # Return the list of Pydantic models


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


@router.post("/data-sources/preview-multi")
async def preview_multi_datasource_data(
    request: Dict[str, Any],
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """预览多数据源关联数据"""
    try:
        # 验证权限
        if not has_permission(current_user, "report:view"):
            raise HTTPException(status_code=403, detail="无权访问")
        
        # 提取参数
        data_sources = request.get("dataSources", [])
        joins = request.get("joins", [])
        fields = request.get("fields", [])
        filters = request.get("filters", {})
        limit = request.get("pageSize", 20)
        offset = request.get("offset", 0)
        
        if len(data_sources) < 1:
            raise HTTPException(status_code=400, detail="至少需要一个数据源")
        
        # 构建多数据源查询
        from ..crud.reports import ReportDataSourceCRUD
        result = ReportDataSourceCRUD.preview_multi_datasource_data(
            db=db,
            data_source_ids=[int(ds_id) for ds_id in data_sources],
            joins=joins,
            fields=fields,
            filters=filters,
            limit=limit,
            offset=offset
        )
        
        return {
            "data": result["data"],
            "total_count": result["total"],
            "success": True
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"多数据源查询失败: {str(e)}")


# ==================== 报表视图相关路由 ====================

@router.get("/views", response_model=List[ReportViewListItem])
async def get_report_views(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    category: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """获取报表视图列表"""
    from ..crud.reports import ReportViewCRUD
    from ..pydantic_models.reports import ReportViewListItem
    
    views = ReportViewCRUD.get_all(db, skip=skip, limit=limit, category=category, is_active=is_active)
    return [ReportViewListItem.from_orm(view) for view in views]


@router.get("/views/{view_id}", response_model=ReportView)
async def get_report_view(
    view_id: int,
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """获取报表视图详情"""
    from ..crud.reports import ReportViewCRUD
    
    view = ReportViewCRUD.get_by_id(db, view_id)
    if not view:
        raise HTTPException(status_code=404, detail="报表视图不存在")
    return view


@router.post("/views", response_model=ReportView)
async def create_report_view(
    view_data: ReportViewCreate,
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """创建报表视图"""
    from ..crud.reports import ReportViewCRUD
    
    # 检查视图名称是否已存在
    existing_view = ReportViewCRUD.get_by_view_name(db, view_data.view_name)
    if existing_view:
        raise HTTPException(status_code=400, detail="视图名称已存在")
    
    return ReportViewCRUD.create(db, view_data, current_user.id)


@router.put("/views/{view_id}", response_model=ReportView)
async def update_report_view(
    view_id: int,
    view_data: ReportViewUpdate,
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """更新报表视图"""
    from ..crud.reports import ReportViewCRUD
    
    updated_view = ReportViewCRUD.update(db, view_id, view_data)
    if not updated_view:
        raise HTTPException(status_code=404, detail="报表视图不存在")
    return updated_view


@router.delete("/views/{view_id}")
async def delete_report_view(
    view_id: int,
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """删除报表视图"""
    from ..crud.reports import ReportViewCRUD
    
    success = ReportViewCRUD.delete(db, view_id)
    if not success:
        raise HTTPException(status_code=404, detail="报表视图不存在")
    return {"message": "报表视图删除成功"}


@router.post("/views/{view_id}/sync")
async def sync_report_view(
    view_id: int,
    sync_request: ReportViewSyncRequest,
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """同步报表视图到数据库"""
    from ..crud.reports import ReportViewCRUD
    
    success = ReportViewCRUD.sync_view_to_database(db, view_id, sync_request.force_recreate)
    if not success:
        raise HTTPException(status_code=400, detail="视图同步失败")
    return {"message": "视图同步成功"}


@router.post("/views/validate-sql", response_model=ReportViewValidationResponse)
async def validate_report_view_sql(
    validation_request: ReportViewValidationRequest,
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """验证报表视图SQL"""
    from ..crud.reports import ReportViewCRUD
    
    result = ReportViewCRUD.validate_sql(
        db, 
        validation_request.sql_query, 
        validation_request.schema_name
    )
    return ReportViewValidationResponse(**result)


@router.post("/views/{view_id}/query", response_model=ReportViewQueryResponse)
async def query_report_view_data(
    view_id: int,
    query_request: ReportViewQueryRequest,
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """查询报表视图数据"""
    from ..crud.reports import ReportViewCRUD
    
    try:
        result = ReportViewCRUD.query_view_data(
            db=db,
            view_id=view_id,
            filters=query_request.filters,
            sorting=query_request.sorting,
            page=query_request.page,
            page_size=query_request.page_size
        )
        return ReportViewQueryResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/views/{view_id}/executions", response_model=List[ReportViewExecution])
async def get_report_view_executions(
    view_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """获取报表视图执行记录"""
    from ..crud.reports import ReportViewExecutionCRUD
    
    executions = ReportViewExecutionCRUD.get_by_view_id(db, view_id, skip=skip, limit=limit)
    return executions


@router.post("/views/{view_id}/export")
async def export_report_view_data(
    view_id: int,
    query_request: ReportViewQueryRequest,
    export_format: str = Query("excel", regex="^(excel|csv|pdf)$"),
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """导出报表视图数据"""
    from ..crud.reports import ReportViewCRUD, ReportViewExecutionCRUD
    from ..pydantic_models.reports import ReportViewExecutionCreate
    import tempfile
    import os
    from fastapi.responses import FileResponse
    
    try:
        # 创建执行记录
        execution_data = ReportViewExecutionCreate(
            report_view_id=view_id,
            execution_params=query_request.dict(),
            export_format=export_format
        )
        execution = ReportViewExecutionCRUD.create(db, execution_data, current_user.id)
        
        # 查询数据（不分页，获取所有数据）
        query_request.page_size = 10000  # 设置一个较大的值
        result = ReportViewCRUD.query_view_data(
            db=db,
            view_id=view_id,
            filters=query_request.filters,
            sorting=query_request.sorting,
            page=1,
            page_size=query_request.page_size
        )
        
        # 生成文件
        view = ReportViewCRUD.get_by_id(db, view_id)
        filename = f"{view.name}_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        if export_format == "excel":
            import pandas as pd
            # Create DataFrame
            df = pd.DataFrame(result['data'])

            # Convert timezone-aware datetimes to timezone-naive
            for col in df.columns:
                if pd.api.types.is_datetime64_any_dtype(df[col]):
                    # Check if the datetime objects are timezone-aware
                    # Accessing .dt can be slow on object dtypes, try to be more specific if possible
                    # A common way to check is to see if the first non-null value has a tz attribute
                    first_valid_index = df[col].first_valid_index()
                    if first_valid_index is not None and hasattr(df[col][first_valid_index], 'tzinfo') and df[col][first_valid_index].tzinfo is not None:
                        try:
                            # Attempt to convert to UTC then remove timezone information
                            # This standardizes the time before making it naive
                            df[col] = df[col].dt.tz_convert(None) # More direct way to make naive if already localized or UTC
                        except TypeError:
                            # If already naive (though the error suggests they are aware)
                            # or if conversion fails for some other reason, log and continue
                            # This might happen if a column has mixed (aware and naive) datetimes, which is problematic
                            print(f"Warning: Could not convert column {col} to timezone-naive for Excel export.")
            
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.xlsx')
            df.to_excel(temp_file.name, index=False)
            filename += ".xlsx"
            media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            
        elif export_format == "csv":
            import pandas as pd
            df = pd.DataFrame(result['data'])
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.csv')
            df.to_csv(temp_file.name, index=False, encoding='utf-8-sig')
            filename += ".csv"
            media_type = "text/csv"
            
        else:  # pdf
            # PDF导出需要额外的库，这里先返回错误
            raise HTTPException(status_code=501, detail="PDF导出功能暂未实现")
        
        # 更新执行记录
        file_size = os.path.getsize(temp_file.name)
        ReportViewExecutionCRUD.update_execution_result(
            db, execution.id, 
            result_count=len(result['data']),
            execution_time=result.get('execution_time'),
            status="success"
        )
        
        return FileResponse(
            path=temp_file.name,
            filename=filename,
            media_type=media_type
        )
        
    except Exception as e:
        # 更新执行记录为失败状态
        ReportViewExecutionCRUD.update_execution_result(
            db, execution.id if 'execution' in locals() else None,
            status="error",
            error_message=str(e)
        )
        raise HTTPException(status_code=500, detail=f"导出失败: {str(e)}") 