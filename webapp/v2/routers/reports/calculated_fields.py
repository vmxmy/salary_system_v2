from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from ...database import get_db_v2
from ...models.security import User
from ....auth import get_current_user
from ...crud.reports import ReportCalculatedFieldCRUD
from ...pydantic_models.reports import (
    ReportCalculatedField, ReportCalculatedFieldCreate, ReportCalculatedFieldUpdate
)
from ...pydantic_models.common import PaginationResponse, PaginationMeta

router = APIRouter(tags=["calculated-fields"])


@router.get("", response_model=PaginationResponse[ReportCalculatedField])
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


@router.get("/{field_id}", response_model=ReportCalculatedField)
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


@router.post("", response_model=ReportCalculatedField)
async def create_calculated_field(
    field: ReportCalculatedFieldCreate,
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """创建计算字段"""
    return ReportCalculatedFieldCRUD.create(db, field, current_user.id)


@router.put("/{field_id}", response_model=ReportCalculatedField)
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


@router.delete("/{field_id}")
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


@router.post("/test-formula")
async def test_calculated_field_formula(
    formula: str,
    data_source_id: Optional[int] = None,
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """测试计算字段公式"""
    return ReportCalculatedFieldCRUD.test_formula(db, formula, data_source_id) 