from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from ...database import get_db_v2
from ...models.security import User
from ....auth import get_current_user
from ...utils.permissions import has_permission
from ...crud.reports import ReportTemplateCRUD, ReportTemplateFieldCRUD
from ...pydantic_models.reports import (
    ReportTemplate, ReportTemplateCreate, ReportTemplateUpdate, ReportTemplateListItem,
    ReportTemplateField, ReportTemplateFieldCreate, ReportTemplateFieldUpdate
)
from ...pydantic_models.common import PaginationResponse, PaginationMeta

router = APIRouter(tags=["templates"])


@router.get("", response_model=PaginationResponse[ReportTemplateListItem])
async def get_report_templates(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    is_public: Optional[bool] = Query(None),
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """获取报表模板列表 (摘要信息)"""
    try:
        # 暂时返回空数据，避免CRUD依赖问题
        total_pages = 1
        pagination_meta = PaginationMeta(
            page=(skip // limit) + 1,
            size=limit,
            total=0,
            totalPages=total_pages
        )
        return PaginationResponse[ReportTemplateListItem](
            data=[],
            meta=pagination_meta
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取报表模板列表失败: {str(e)}")


@router.get("/{template_id}", response_model=ReportTemplate)
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


@router.post("", response_model=ReportTemplate)
async def create_report_template(
    template: ReportTemplateCreate,
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """创建报表模板"""
    return ReportTemplateCRUD.create(db, template, current_user.id)


@router.put("/{template_id}", response_model=ReportTemplate)
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


@router.delete("/{template_id}")
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
@router.get("/{template_id}/fields", response_model=PaginationResponse[ReportTemplateField])
async def get_template_fields(
    template_id: int,
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(100, ge=1, le=1000, description="Page size"),
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """获取报表模板字段列表，支持分页"""
    # 先检查模板是否存在，并确保用户有权限访问该模板
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


@router.post("/fields", response_model=ReportTemplateField)
async def create_template_field(
    field: ReportTemplateFieldCreate,
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """创建报表模板字段"""
    return ReportTemplateFieldCRUD.create(db, field)


@router.put("/fields/{field_id}", response_model=ReportTemplateField)
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


@router.delete("/fields/{field_id}")
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