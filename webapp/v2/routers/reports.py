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
    ReportDataSourceCRUD, ReportCalculatedFieldCRUD,
    # ReportDataSourceFieldCRUD,  # 已移除字段表
    ReportTemplateCRUD, ReportTemplateFieldCRUD, ReportExecutionCRUD
)
from ..pydantic_models.reports import (
    ReportDataSource, ReportDataSourceCreate, ReportDataSourceUpdate,
    # ReportDataSourceField, ReportDataSourceFieldCreate, ReportDataSourceFieldUpdate,  # 已移除字段表
    ReportCalculatedField, ReportCalculatedFieldCreate, ReportCalculatedFieldUpdate,
    ReportTemplate, ReportTemplateCreate, ReportTemplateUpdate, ReportTemplateListItem,
    ReportTemplateField, ReportTemplateFieldCreate, ReportTemplateFieldUpdate,
    ReportExecution, ReportExecutionCreate,
    DataSourceFieldDetection, DetectedField, ReportQuery, ReportData,
    DataSourceConnectionTest, DataSourceConnectionTestResponse
)
from ..pydantic_models.common import PaginationResponse, PaginationMeta
import logging

router = APIRouter(prefix="/reports", tags=["reports"])


# 数据源管理
@router.get("/data-sources", response_model=PaginationResponse[ReportDataSource])
async def get_data_sources(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(require_permission("report:view_datasources"))
):
    """获取数据源列表"""
    data_sources, total = ReportDataSourceCRUD.get_all_with_total(db, skip=skip, limit=limit)
    
    # 根据权限过滤可访问的数据源
    # filter_accessible_items 返回的是 List[Any]，这里需要将其转换为 ReportDataSource 列表
    # 并计算过滤后的总数。由于 filter_accessible_items 是在分页后进行的，所以这里直接返回过滤后的列表长度作为 total。
    # 如果需要精确的总数，需要在 filter_accessible_items 之前进行总数统计，但这会使逻辑复杂。
    # 鉴于通常情况下，前端只展示当前页的数据，这个实现方式是可接受的。
    accessible_data_sources = filter_accessible_items(current_user, data_sources)
    
    total_pages = (total + limit - 1) // limit if total > 0 else 1

    pagination_meta = PaginationMeta(
        page= (skip // limit) + 1,
        size=limit,
        total=total,
        totalPages=total_pages
    )
    return PaginationResponse[ReportDataSource](
        data=accessible_data_sources,
        meta=pagination_meta
    )


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
    use_optimized_view: bool = Query(True, description="是否使用优化视图"),
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """预览数据源数据 - 支持视图优化"""
    import json
    import time
    
    # 先获取数据源检查权限
    data_source = ReportDataSourceCRUD.get_by_id(db, data_source_id)
    if not data_source:
        raise HTTPException(status_code=404, detail="数据源不存在")
    
    # 检查访问权限
    if not has_permission(current_user, "report:admin") and data_source.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="无权访问此数据源")
    
    start_time = time.time()
    
    try:
        filter_dict = {}
        if filters:
            try:
                filter_dict = json.loads(filters)
            except json.JSONDecodeError:
                raise HTTPException(status_code=400, detail="筛选条件格式错误")
        
        # 选择查询策略
        from ..services.report_optimization_service import ReportOptimizationService
        
        if use_optimized_view and ReportOptimizationService.should_use_optimized_view(data_source):
            preview_data = await ReportOptimizationService.execute_preview_query(db, data_source, limit, filter_dict)
            used_optimized = True
        else:
            # 使用原有方法
            preview_data = ReportDataSourceCRUD.preview_data(db, data_source_id, limit, filter_dict)
            used_optimized = False
        
        execution_time = time.time() - start_time
        
        return {
            "data": preview_data,
            "total_count": len(preview_data),
            "limit": limit,
            "execution_time": round(execution_time, 3),
            "used_optimized_view": used_optimized
        }
    except Exception as e:
        execution_time = time.time() - start_time
        logging.error(f"数据预览失败 - 数据源ID: {data_source_id}, 错误: {str(e)}, 耗时: {execution_time:.3f}s")
        raise HTTPException(status_code=500, detail=f"预览数据失败: {str(e)}")


# 这些函数已被 ReportOptimizationService 替代，保留作为备用


# 数据源字段管理 - 已移除，改为动态获取
# @router.get("/data-sources/{data_source_id}/fields", response_model=PaginationResponse[ReportDataSourceField])
# async def get_data_source_fields(
#     data_source_id: int,
#     page: int = Query(1, ge=1, description="Page number"),
#     size: int = Query(100, ge=1, le=1000, description="Page size"),
#     db: Session = Depends(get_db_v2),
#     current_user: User = Depends(get_current_user)
# ):
#     """获取数据源字段列表，支持分页"""
#     skip = (page - 1) * size
#     fields, total = ReportDataSourceFieldCRUD.get_by_data_source(db, data_source_id, skip=skip, limit=size)
#     
#     total_pages = (total + size - 1) // size if total > 0 else 1
#     
#     pagination_meta = PaginationMeta(
#         page=page,
#         size=size,
#         total=total,
#         totalPages=total_pages
#     )
#     return PaginationResponse[ReportDataSourceField](
#         data=fields,
#         meta=pagination_meta
#     )


# @router.post("/data-source-fields", response_model=ReportDataSourceField)
# async def create_data_source_field(
#     field: ReportDataSourceFieldCreate,
#     db: Session = Depends(get_db_v2),
#     current_user: User = Depends(get_current_user)
# ):
#     """创建数据源字段"""
#     return ReportDataSourceFieldCRUD.create(db, field)


# @router.put("/data-source-fields/{field_id}", response_model=ReportDataSourceField)
# async def update_data_source_field(
#     field_id: int,
#     field: ReportDataSourceFieldUpdate,
#     db: Session = Depends(get_db_v2),
#     current_user: User = Depends(get_current_user)
# ):
#     """更新数据源字段"""
#     updated_field = ReportDataSourceFieldCRUD.update(db, field_id, field)
#     if not updated_field:
#         raise HTTPException(status_code=404, detail="字段不存在")
#     return updated_field


# @router.delete("/data-source-fields/{field_id}")
# async def delete_data_source_field(
#     field_id: int,
#     db: Session = Depends(get_db_v2),
#     current_user: User = Depends(get_current_user)
# ):
#     """删除数据源字段"""
#     success = ReportDataSourceFieldCRUD.delete(db, field_id)
#     if not success:
#         raise HTTPException(status_code=404, detail="字段不存在")
#     return {"message": "字段删除成功"}


# 计算字段管理
@router.get("/calculated-fields", response_model=PaginationResponse[ReportCalculatedField])
async def get_calculated_fields(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    is_global: Optional[bool] = Query(None),
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """获取计算字段列表，支持分页和过滤"""
    fields, total = ReportCalculatedFieldCRUD.get_all(db, skip=skip, limit=limit, is_global=is_global)
    
    total_pages = (total + limit - 1) // limit if total > 0 else 1

    pagination_meta = PaginationMeta(
        page=(skip // limit) + 1,
        size=limit,
        total=total,
        totalPages=total_pages
    )
    return PaginationResponse[ReportCalculatedField](
        data=fields,
        meta=pagination_meta
    )


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
@router.get("/templates", response_model=PaginationResponse[ReportTemplateListItem])
async def get_report_templates(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    is_public: Optional[bool] = Query(None),
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """
    获取报表模板列表 (摘要信息)
    """
    # Add permission check if needed, e.g., require_permission("report:view_templates")
    # For now, allowing any authenticated user to list templates, filtering public/private later if needed.
    
    templates_orm, total = ReportTemplateCRUD.get_all(db, skip=skip, limit=limit, is_public=is_public)
    
    # Manually construct the list of ReportTemplateListItem from ORM objects
    # This ensures only the fields defined in ReportTemplateListItem are returned.
    templates_list = [
        ReportTemplateListItem.model_validate(template)
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
    
    total_pages = (total + limit - 1) // limit if total > 0 else 1

    pagination_meta = PaginationMeta(
        page=(skip // limit) + 1,
        size=limit,
        total=total,
        totalPages=total_pages
    )
    return PaginationResponse[ReportTemplateListItem](
        data=templates_list,
        meta=pagination_meta
    )


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
@router.get("/templates/{template_id}/fields", response_model=PaginationResponse[ReportTemplateField])
async def get_template_fields(
    template_id: int,
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(100, ge=1, le=1000, description="Page size"),
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """获取报表模板字段列表，支持分页"""
    # 先检查模板是否存在，并确保用户有权限访问该模板（如果是非公开模板）
    template = ReportTemplateCRUD.get_by_id(db, template_id)
    if not template:
        raise HTTPException(status_code=404, detail="报表模板不存在")

    # 权限检查
    if not template.is_public and not (current_user and template.created_by == current_user.id) and not has_permission(current_user, "report:admin"):
        raise HTTPException(status_code=403, detail="无权访问此报表模板的字段")
    
    skip = (page - 1) * size
    fields, total = ReportTemplateFieldCRUD.get_by_template(db, template_id, skip=skip, limit=size)
    
    total_pages = (total + size - 1) // size if total > 0 else 1
    
    pagination_meta = PaginationMeta(
        page=page,
        size=size,
        total=total,
        totalPages=total_pages
    )
    return PaginationResponse[ReportTemplateField](
        data=fields,
        meta=pagination_meta
    )


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
@router.get("/executions", response_model=PaginationResponse[ReportExecution])
async def get_report_executions(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """获取报表执行列表，支持分页"""
    executions, total = ReportExecutionCRUD.get_all(db, skip=skip, limit=limit)
    
    total_pages = (total + limit - 1) // limit if total > 0 else 1

    pagination_meta = PaginationMeta(
        page=(skip // limit) + 1,
        size=limit,
        total=total,
        totalPages=total_pages
    )
    return PaginationResponse[ReportExecution](
        data=executions,
        meta=pagination_meta
    )


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
    """查询报表数据 - 优化版本，智能使用视图"""
    from sqlalchemy import text
    import time
    
    template = ReportTemplateCRUD.get_by_id(db, query.template_id)
    if not template:
        raise HTTPException(status_code=404, detail="报表模板不存在")
    
    # 增加使用次数
    ReportTemplateCRUD.increment_usage(db, query.template_id)
    
    start_time = time.time()
    
    try:
        # 获取数据源信息
        data_source = template.data_source
        if not data_source:
            raise HTTPException(status_code=400, detail="报表模板未配置数据源")
        
        # 使用优化服务进行智能查询
        from ..services.report_optimization_service import ReportOptimizationService
        
        use_optimized_view = ReportOptimizationService.should_use_optimized_view(data_source, query)
        
        if use_optimized_view:
            # 使用优化视图查询
            result = await ReportOptimizationService.execute_optimized_query(db, data_source, query, template)
        else:
            # 使用传统查询
            result = await _query_with_traditional_method(db, data_source, query, template)
        
        execution_time = time.time() - start_time
        
        # 记录查询性能
        _log_query_performance(db, template.id, execution_time, use_optimized_view, len(result.get('data', [])))
        
        return ReportData(
            columns=result.get('columns', []),
            data=result.get('data', []),
            total=result.get('total', 0),
            page=query.page,
            page_size=query.page_size,
            execution_time=round(execution_time, 3)
        )
        
    except Exception as e:
        execution_time = time.time() - start_time
        logging.error(f"报表查询失败 - 模板ID: {query.template_id}, 错误: {str(e)}, 耗时: {execution_time:.3f}s")
        raise HTTPException(status_code=500, detail=f"报表查询失败: {str(e)}")


def _should_use_optimized_view(data_source: ReportDataSource, query: ReportQuery) -> bool:
    """判断是否应该使用优化视图"""
    # 如果数据源本身就是视图，优先使用
    if data_source.source_type == 'view' and data_source.view_name:
        return True
    
    # 对于薪资相关的表，检查是否有对应的优化视图
    if data_source.schema_name == 'payroll':
        if data_source.table_name in ['payroll_entries', 'payroll_periods', 'payroll_runs']:
            return True
    
    # 对于HR相关的表，检查是否有对应的优化视图
    if data_source.schema_name == 'hr' and data_source.table_name == 'employees':
        return True
    
    # 如果查询包含复杂的聚合或JOIN，建议使用视图
    template_config = query.template_config or {}
    if template_config.get('has_aggregation') or template_config.get('has_complex_joins'):
        return True
    
    return False


async def _query_with_optimized_view(
    db: Session, 
    data_source: ReportDataSource, 
    query: ReportQuery, 
    template: ReportTemplate
) -> Dict[str, Any]:
    """使用优化视图进行查询"""
    from sqlalchemy import text
    
    # 映射到对应的优化视图
    view_mapping = {
        ('payroll', 'payroll_entries'): 'v_payroll_entries_detailed',
        ('payroll', 'payroll_periods'): 'v_payroll_periods_detail', 
        ('payroll', 'payroll_runs'): 'v_payroll_runs_detail',
        ('hr', 'employees'): 'v_employees_basic',
        ('config', 'payroll_component_definitions'): 'v_payroll_components_basic'
    }
    
    # 确定使用的视图名称
    if data_source.source_type == 'view' and data_source.view_name:
        view_name = f"{data_source.schema_name}.{data_source.view_name}"
    else:
        view_key = (data_source.schema_name, data_source.table_name)
        if view_key in view_mapping:
            view_name = f"public.{view_mapping[view_key]}"
        else:
            # 回退到原始表
            view_name = f"{data_source.schema_name}.{data_source.table_name}"
    
    # 构建查询
    select_fields = _build_select_fields(template, query)
    where_clause, params = _build_where_clause(query.filters or {})
    order_clause = _build_order_clause(query.sorting or [])
    
    # 构建基础查询
    base_query = f"SELECT {select_fields} FROM {view_name}"
    if where_clause:
        base_query += f" WHERE {where_clause}"
    if order_clause:
        base_query += f" ORDER BY {order_clause}"
    
    # 获取总数
    count_query = f"SELECT COUNT(*) FROM {view_name}"
    if where_clause:
        count_query += f" WHERE {where_clause}"
    
    total_result = db.execute(text(count_query), params)
    total = total_result.scalar() or 0
    
    # 添加分页
    offset = (query.page - 1) * query.page_size
    paginated_query = f"{base_query} LIMIT {query.page_size} OFFSET {offset}"
    
    # 执行查询
    result = db.execute(text(paginated_query), params)
    columns = [{"key": col, "title": col, "dataIndex": col} for col in result.keys()]
    data = [dict(zip(result.keys(), row)) for row in result.fetchall()]
    
    return {
        "columns": columns,
        "data": data,
        "total": total
    }


async def _query_with_traditional_method(
    db: Session,
    data_source: ReportDataSource, 
    query: ReportQuery,
    template: ReportTemplate
) -> Dict[str, Any]:
    """使用传统方法进行查询"""
    # 使用现有的预览数据方法作为基础
    try:
        filters = query.filters or {}
        limit = query.page_size
        offset = (query.page - 1) * query.page_size
        
        # 构建查询
        if data_source.source_type == 'query' and data_source.custom_query:
            base_query = data_source.custom_query
        else:
            table_name = data_source.table_name or data_source.view_name
            base_query = f"SELECT * FROM {data_source.schema_name}.{table_name}"
        
        # 添加筛选条件
        where_conditions = []
        params = {}
        for field, value in filters.items():
            if value is not None and value != '':
                where_conditions.append(f"{field} = :{field}")
                params[field] = value
        
        if where_conditions:
            base_query += " WHERE " + " AND ".join(where_conditions)
        
        # 获取总数
        count_query = f"SELECT COUNT(*) FROM ({base_query}) AS count_subquery"
        total_result = db.execute(text(count_query), params)
        total = total_result.scalar() or 0
        
        # 添加排序和分页
        if query.sorting:
            order_parts = []
            for sort_item in query.sorting:
                field = sort_item.get('field')
                direction = sort_item.get('direction', 'asc').upper()
                if field and direction in ['ASC', 'DESC']:
                    order_parts.append(f"{field} {direction}")
            if order_parts:
                base_query += f" ORDER BY {', '.join(order_parts)}"
        
        paginated_query = f"{base_query} LIMIT {limit} OFFSET {offset}"
        
        # 执行查询
        result = db.execute(text(paginated_query), params)
        columns = [{"key": col, "title": col, "dataIndex": col} for col in result.keys()]
        data = [dict(zip(result.keys(), row)) for row in result.fetchall()]
        
        return {
            "columns": columns,
            "data": data,
            "total": total
        }
        
    except Exception as e:
        raise ValueError(f"传统查询方法失败: {str(e)}")


def _build_select_fields(template: ReportTemplate, query: ReportQuery) -> str:
    """构建SELECT字段列表"""
    template_config = template.template_config or {}
    selected_fields = template_config.get('selected_fields', [])
    
    if selected_fields:
        return ", ".join(selected_fields)
    else:
        return "*"


def _build_where_clause(filters: Dict[str, Any]) -> tuple[str, Dict[str, Any]]:
    """构建WHERE子句"""
    where_conditions = []
    params = {}
    
    for field, value in filters.items():
        if value is not None and value != '':
            if isinstance(value, str) and '%' in value:
                # 支持模糊查询
                where_conditions.append(f"{field} ILIKE :{field}")
                params[field] = value
            elif isinstance(value, list):
                # 支持IN查询
                placeholders = [f":{field}_{i}" for i in range(len(value))]
                where_conditions.append(f"{field} IN ({', '.join(placeholders)})")
                for i, v in enumerate(value):
                    params[f"{field}_{i}"] = v
            else:
                # 精确匹配
                where_conditions.append(f"{field} = :{field}")
                params[field] = value
    
    where_clause = " AND ".join(where_conditions) if where_conditions else ""
    return where_clause, params


def _build_order_clause(sorting: List[Dict[str, Any]]) -> str:
    """构建ORDER BY子句"""
    if not sorting:
        return ""
    
    order_parts = []
    for sort_item in sorting:
        field = sort_item.get('field')
        direction = sort_item.get('direction', 'asc').upper()
        if field and direction in ['ASC', 'DESC']:
            order_parts.append(f"{field} {direction}")
    
    return ", ".join(order_parts)


def _log_query_performance(
    db: Session, 
    template_id: int, 
    execution_time: float, 
    used_optimized_view: bool, 
    result_count: int
):
    """记录查询性能日志"""
    try:
        # 这里可以记录到性能监控表或日志系统
        logging.info(
            f"报表查询性能 - 模板ID: {template_id}, "
            f"执行时间: {execution_time:.3f}s, "
            f"使用优化视图: {used_optimized_view}, "
            f"结果数量: {result_count}"
        )
    except Exception as e:
        logging.warning(f"记录查询性能失败: {str(e)}")


# 新增：快速报表查询API（专门使用视图优化）
@router.post("/query-fast", response_model=ReportData)
async def query_report_data_fast(
    query: ReportQuery,
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """快速报表查询 - 强制使用优化视图"""
    from sqlalchemy import text
    import time
    
    start_time = time.time()
    
    try:
        # 使用优化服务进行快速查询
        from ..services.report_optimization_service import ReportOptimizationService
        
        result = await ReportOptimizationService.execute_fast_query(
            db=db,
            data_source_type=query.data_source_type,
            category=query.category,
            filters=query.filters,
            sorting=query.sorting,
            page=query.page,
            page_size=query.page_size,
            fields=getattr(query, 'fields', None)
        )
        
        return ReportData(
            columns=result.get('columns', []),
            data=result.get('data', []),
            total=result.get('total', 0),
            page=query.page,
            page_size=query.page_size,
            execution_time=result.get('execution_time', 0)
        )
        
    except Exception as e:
        execution_time = time.time() - start_time
        logging.error(f"快速报表查询失败: {str(e)}, 耗时: {execution_time:.3f}s")
        raise HTTPException(status_code=500, detail=f"快速报表查询失败: {str(e)}")


def _get_optimized_view_name(data_source_type: str, category: str) -> str:
    """获取优化视图名称"""
    view_mapping = {
        ('payroll', 'entries'): 'public.v_payroll_entries_detailed',
        ('payroll', 'entries_basic'): 'public.v_payroll_entries_basic',
        ('payroll', 'periods'): 'public.v_payroll_periods_detail',
        ('payroll', 'runs'): 'public.v_payroll_runs_detail',
        ('payroll', 'summary'): 'public.v_payroll_summary_analysis',
        ('payroll', 'components'): 'public.v_payroll_components_basic',
        ('payroll', 'component_usage'): 'public.v_payroll_component_usage',
        ('hr', 'employees'): 'public.v_employees_basic',
        ('hr', 'salary_history'): 'public.v_employee_salary_history',
        ('reports', 'salary_details'): 'reports.employee_salary_details_view',
        ('audit', 'overview'): 'payroll.audit_overview',
        ('audit', 'anomalies'): 'payroll.audit_anomalies_detail'
    }
    
    return view_mapping.get((data_source_type, category), "")


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



# ==================== 报表优化相关路由 ====================

@router.get("/optimization/stats")
async def get_optimization_stats(
    hours: int = Query(24, ge=1, le=168, description="统计时间范围（小时）"),
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """获取报表优化性能统计"""
    from ..services.report_optimization_service import ReportOptimizationService
    
    try:
        stats = ReportOptimizationService.get_performance_stats(db, hours)
        return {
            "success": True,
            "data": stats,
            "time_range_hours": hours
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取优化统计失败: {str(e)}")


@router.get("/data-sources/{data_source_id}/optimization-suggestions")
async def get_optimization_suggestions(
    data_source_id: int,
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """获取数据源优化建议"""
    from ..services.report_optimization_service import ReportOptimizationService
    
    # 获取数据源
    data_source = ReportDataSourceCRUD.get_by_id(db, data_source_id)
    if not data_source:
        raise HTTPException(status_code=404, detail="数据源不存在")
    
    # 检查访问权限
    if not has_permission(current_user, "report:admin") and data_source.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="无权访问此数据源")
    
    try:
        suggestions = ReportOptimizationService.suggest_optimization(data_source)
        return {
            "success": True,
            "data_source_id": data_source_id,
            "data_source_name": data_source.name,
            "suggestions": suggestions["suggestions"],
            "optimization_score": suggestions["optimization_score"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取优化建议失败: {str(e)}")


@router.post("/optimization/test-view-performance")
async def test_view_performance(
    test_request: Dict[str, Any],
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """测试视图性能对比"""
    from ..services.report_optimization_service import ReportOptimizationService
    import time
    
    try:
        data_source_id = test_request.get("data_source_id")
        query_params = test_request.get("query_params", {})
        
        if not data_source_id:
            raise HTTPException(status_code=400, detail="缺少数据源ID")
        
        # 获取数据源
        data_source = ReportDataSourceCRUD.get_by_id(db, data_source_id)
        if not data_source:
            raise HTTPException(status_code=404, detail="数据源不存在")
        
        # 测试传统查询
        start_time = time.time()
        try:
            traditional_data = ReportDataSourceCRUD.preview_data(
                db, data_source_id, 
                limit=query_params.get("limit", 10),
                filters=query_params.get("filters", {})
            )
            traditional_time = time.time() - start_time
            traditional_success = True
        except Exception as e:
            traditional_time = time.time() - start_time
            traditional_success = False
            traditional_data = []
        
        # 测试优化视图查询
        start_time = time.time()
        try:
            optimized_data = await ReportOptimizationService.execute_preview_query(
                db, data_source,
                limit=query_params.get("limit", 10),
                filters=query_params.get("filters", {})
            )
            optimized_time = time.time() - start_time
            optimized_success = True
        except Exception as e:
            optimized_time = time.time() - start_time
            optimized_success = False
            optimized_data = []
        
        # 计算性能提升
        performance_improvement = 0
        if traditional_success and optimized_success and traditional_time > 0:
            performance_improvement = ((traditional_time - optimized_time) / traditional_time) * 100
        
        return {
            "success": True,
            "data_source_id": data_source_id,
            "test_results": {
                "traditional_query": {
                    "execution_time": round(traditional_time, 3),
                    "success": traditional_success,
                    "result_count": len(traditional_data)
                },
                "optimized_query": {
                    "execution_time": round(optimized_time, 3),
                    "success": optimized_success,
                    "result_count": len(optimized_data)
                },
                "performance_improvement_percent": round(performance_improvement, 2),
                "recommendation": "使用优化视图" if performance_improvement > 10 else "性能提升不明显"
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"性能测试失败: {str(e)}")


@router.get("/optimization/available-views")
async def get_available_optimization_views(
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """获取可用的优化视图列表"""
    from ..services.report_optimization_service import ReportOptimizationService
    from sqlalchemy import text
    
    try:
        # 检查数据库中实际存在的视图
        view_check_query = """
        SELECT schemaname, viewname, definition 
        FROM pg_views 
        WHERE schemaname IN ('public', 'payroll', 'hr', 'reports')
        ORDER BY schemaname, viewname
        """
        
        result = db.execute(text(view_check_query))
        existing_views = [
            {
                "schema": row[0],
                "name": row[1],
                "full_name": f"{row[0]}.{row[1]}",
                "definition_preview": row[2][:200] + "..." if len(row[2]) > 200 else row[2]
            }
            for row in result.fetchall()
        ]
        
        # 获取配置的视图映射
        configured_mappings = []
        for (schema, table), view_name in ReportOptimizationService.VIEW_MAPPING.items():
            configured_mappings.append({
                "source_table": f"{schema}.{table}",
                "optimized_view": f"public.{view_name}",
                "exists": any(v["name"] == view_name for v in existing_views if v["schema"] == "public")
            })
        
        return {
            "success": True,
            "existing_views": existing_views,
            "configured_mappings": configured_mappings,
            "total_views": len(existing_views),
            "total_mappings": len(configured_mappings)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取优化视图列表失败: {str(e)}") 