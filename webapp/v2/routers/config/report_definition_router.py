"""
报表定义 (Report Definitions) 相关配置的API路由，包括报表模板、报表字段、计算字段和数据源。
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import Optional, List

from ...database import get_db_v2
from webapp.v2.crud import config as crud
from ...pydantic_models.config import (
    ReportTemplateResponse, ReportTemplateWithFields, ReportTemplateCreate, ReportTemplateUpdate,
    ReportFieldResponse, ReportFieldCreate, ReportFieldUpdate,
    CalculatedFieldResponse, CalculatedFieldCreate, CalculatedFieldUpdate,
    ReportDataSourceResponse, ReportDataSourceCreate, ReportDataSourceUpdate
)
from ...pydantic_models.common import DataResponse # Assuming DataResponse is in common
from webapp.auth import get_current_user # User model for dependency
from ...utils import create_error_response
from ...pydantic_models import security as v2_security_schemas # Import security schemas for User model
import logging

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/report-definitions",
    tags=["Configuration - Report Definitions"],
)

# --- 报表模板相关路由 (Report Template) ---
@router.get("/templates", response_model=List[ReportTemplateResponse])
async def get_report_templates(
    user_id: Optional[int] = Query(None, description="用户ID"),
    category: Optional[str] = Query(None, description="报表分类"),
    is_active: Optional[bool] = Query(None, description="是否激活"),
    is_public: Optional[bool] = Query(None, description="是否公开"),
    search: Optional[str] = Query(None, description="搜索关键字"),
    skip: int = Query(0, ge=0, description="跳过的记录数"),
    limit: int = Query(100, ge=1, le=1000, description="返回的记录数"),
    db: Session = Depends(get_db_v2),
    current_user: v2_security_schemas.User = Depends(get_current_user)
):
    """获取报表模板列表"""
    try:
        if user_id is None:
            user_id = current_user.id
        
        templates, total = crud.get_report_templates(
            db=db,
            user_id=user_id,
            category=category,
            is_active=is_active,
            is_public=is_public,
            search=search,
            skip=skip,
            limit=limit
        )
        return templates # Original return was List, assuming total is handled by crud or not directly returned
    except Exception as e:
        logger.error(f"Error getting report templates: {str(e)}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=create_error_response(500, "Internal server error", str(e)))

@router.get("/templates/{template_id}", response_model=ReportTemplateWithFields)
async def get_report_template(
    template_id: int,
    db: Session = Depends(get_db_v2),
    current_user: v2_security_schemas.User = Depends(get_current_user)
):
    """获取报表模板详情（包含字段）"""
    try:
        template = crud.get_report_template_with_fields(db=db, template_id=template_id)
        if not template:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=create_error_response(404, "Report template not found"))
        
        if not template.is_public and template.created_by != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=create_error_response(403, "Access denied"))
        
        return template
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting report template {template_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=create_error_response(500, "Internal server error", str(e)))

@router.post("/templates", response_model=ReportTemplateResponse, status_code=status.HTTP_201_CREATED)
async def create_report_template(
    template: ReportTemplateCreate,
    db: Session = Depends(get_db_v2),
    current_user: v2_security_schemas.User = Depends(get_current_user)
):
    """创建报表模板"""
    try:
        created_template = crud.create_report_template(
            db=db,
            template=template,
            user_id=current_user.id
        )
        return created_template
    except Exception as e:
        logger.error(f"Error creating report template: {str(e)}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=create_error_response(500, "Internal server error", str(e)))

@router.put("/templates/{template_id}", response_model=ReportTemplateResponse)
async def update_report_template(
    template_id: int,
    template: ReportTemplateUpdate,
    db: Session = Depends(get_db_v2),
    current_user: v2_security_schemas.User = Depends(get_current_user)
):
    """更新报表模板"""
    try:
        updated_template = crud.update_report_template(
            db=db,
            template_id=template_id,
            template=template,
            user_id=current_user.id
        )
        if not updated_template:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=create_error_response(404, "Report template not found or access denied"))
        
        return updated_template
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating report template {template_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=create_error_response(500, "Internal server error", str(e)))

@router.delete("/templates/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_report_template(
    template_id: int,
    db: Session = Depends(get_db_v2),
    current_user: v2_security_schemas.User = Depends(get_current_user)
):
    """删除报表模板"""
    try:
        success = crud.delete_report_template(
            db=db,
            template_id=template_id,
            user_id=current_user.id
        )
        if not success:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=create_error_response(404, "Report template not found or access denied"))
        
        return None # Returns 204 No Content
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting report template {template_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=create_error_response(500, "Internal server error", str(e)))


# --- 报表字段相关路由 (Report Fields) ---
@router.get("/templates/{template_id}/fields", response_model=List[ReportFieldResponse])
async def get_report_fields(
    template_id: int,
    db: Session = Depends(get_db_v2),
    current_user: v2_security_schemas.User = Depends(get_current_user)
):
    """获取报表字段列表"""
    try:
        template = crud.get_report_template(db=db, template_id=template_id)
        if not template:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=create_error_response(404, "Report template not found"))
        
        if not template.is_public and template.created_by != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=create_error_response(403, "Access denied"))
        
        fields = crud.get_report_fields(db=db, template_id=template_id)
        return fields
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting report fields for template {template_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=create_error_response(500, "Internal server error", str(e)))

@router.post("/fields", response_model=ReportFieldResponse, status_code=status.HTTP_201_CREATED)
async def create_report_field(
    field: ReportFieldCreate,
    db: Session = Depends(get_db_v2),
    current_user: v2_security_schemas.User = Depends(get_current_user)
):
    """创建报表字段"""
    try:
        template = crud.get_report_template(db=db, template_id=field.template_id)
        if not template:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=create_error_response(404, "Report template not found"))
        
        if template.created_by != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=create_error_response(403, "Access denied"))
        
        created_field = crud.create_report_field(db=db, field=field)
        return created_field
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating report field: {str(e)}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=create_error_response(500, "Internal server error", str(e)))

@router.put("/fields/{field_id}", response_model=ReportFieldResponse)
async def update_report_field(
    field_id: int,
    field: ReportFieldUpdate,
    db: Session = Depends(get_db_v2),
    current_user: v2_security_schemas.User = Depends(get_current_user)
):
    """更新报表字段"""
    try:
        existing_field = crud.get_report_field(db=db, field_id=field_id)
        if not existing_field:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=create_error_response(404, "Report field not found"))
        
        template = crud.get_report_template(db=db, template_id=existing_field.template_id)
        if template.created_by != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=create_error_response(403, "Access denied"))
        
        updated_field = crud.update_report_field(db=db, field_id=field_id, field=field)
        return updated_field
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating report field {field_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=create_error_response(500, "Internal server error", str(e)))

@router.delete("/fields/{field_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_report_field(
    field_id: int,
    db: Session = Depends(get_db_v2),
    current_user: v2_security_schemas.User = Depends(get_current_user)
):
    """删除报表字段"""
    try:
        existing_field = crud.get_report_field(db=db, field_id=field_id)
        if not existing_field:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=create_error_response(404, "Report field not found"))
        
        template = crud.get_report_template(db=db, template_id=existing_field.template_id)
        if template.created_by != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=create_error_response(403, "Access denied"))
        
        success = crud.delete_report_field(db=db, field_id=field_id)
        if not success:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=create_error_response(404, "Report field not found or failed to delete"))
        
        return None # Returns 204 No Content
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting report field {field_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=create_error_response(500, "Internal server error", str(e)))


# --- 计算字段相关路由 (Calculated Fields) ---
@router.get("/calculated-fields", response_model=List[CalculatedFieldResponse])
async def get_calculated_fields(
    user_id: Optional[int] = Query(None, description="用户ID"),
    is_global: Optional[bool] = Query(None, description="是否全局字段"),
    is_active: Optional[bool] = Query(None, description="是否激活"),
    category: Optional[str] = Query(None, description="字段分类"),
    search: Optional[str] = Query(None, description="搜索关键字"),
    skip: int = Query(0, ge=0, description="跳过的记录数"),
    limit: int = Query(100, ge=1, le=1000, description="返回的记录数"),
    db: Session = Depends(get_db_v2),
    current_user: v2_security_schemas.User = Depends(get_current_user)
):
    """获取计算字段列表"""
    try:
        if user_id is None:
            user_id = current_user.id
        
        fields, total = crud.get_calculated_fields(
            db=db,
            user_id=user_id,
            is_global=is_global,
            is_active=is_active,
            category=category,
            search=search,
            skip=skip,
            limit=limit
        )
        return fields
    except Exception as e:
        logger.error(f"Error getting calculated fields: {str(e)}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=create_error_response(500, "Internal server error", str(e)))

@router.post("/calculated-fields", response_model=CalculatedFieldResponse, status_code=status.HTTP_201_CREATED)
async def create_calculated_field(
    field: CalculatedFieldCreate,
    db: Session = Depends(get_db_v2),
    current_user: v2_security_schemas.User = Depends(get_current_user)
):
    """创建计算字段"""
    try:
        created_field = crud.create_calculated_field(
            db=db,
            field=field,
            user_id=current_user.id
        )
        return created_field
    except Exception as e:
        logger.error(f"Error creating calculated field: {str(e)}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=create_error_response(500, "Internal server error", str(e)))

@router.put("/calculated-fields/{field_id}", response_model=CalculatedFieldResponse)
async def update_calculated_field(
    field_id: int,
    field: CalculatedFieldUpdate,
    db: Session = Depends(get_db_v2),
    current_user: v2_security_schemas.User = Depends(get_current_user)
):
    """更新计算字段"""
    try:
        updated_field = crud.update_calculated_field(
            db=db,
            field_id=field_id,
            field=field,
            user_id=current_user.id
        )
        if not updated_field:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=create_error_response(404, "Calculated field not found or access denied"))
        
        return updated_field
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating calculated field {field_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=create_error_response(500, "Internal server error", str(e)))

@router.delete("/calculated-fields/{field_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_calculated_field(
    field_id: int,
    db: Session = Depends(get_db_v2),
    current_user: v2_security_schemas.User = Depends(get_current_user)
):
    """删除计算字段"""
    try:
        success = crud.delete_calculated_field(
            db=db,
            field_id=field_id,
            user_id=current_user.id
        )
        if not success:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=create_error_response(404, "Calculated field not found or access denied"))
        
        return None # Returns 204 No Content
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting calculated field {field_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=create_error_response(500, "Internal server error", str(e)))


# --- 报表数据源相关路由 (Report Data Sources) ---
@router.get("/data-sources", response_model=List[ReportDataSourceResponse])
async def get_report_data_sources(
    is_active: Optional[bool] = Query(None, description="是否激活"),
    schema_name: Optional[str] = Query(None, description="模式名"),
    search: Optional[str] = Query(None, description="搜索关键字"),
    skip: int = Query(0, ge=0, description="跳过的记录数"),
    limit: int = Query(100, ge=1, le=1000, description="返回的记录数"),
    db: Session = Depends(get_db_v2),
    current_user: v2_security_schemas.User = Depends(get_current_user)
):
    """获取报表数据源列表"""
    try:
        sources, total = crud.get_report_data_sources(
            db=db,
            is_active=is_active,
            schema_name=schema_name,
            search=search,
            skip=skip,
            limit=limit
        )
        return sources
    except Exception as e:
        logger.error(f"Error getting report data sources: {str(e)}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=create_error_response(500, "Internal server error", str(e)))

@router.post("/data-sources", response_model=ReportDataSourceResponse, status_code=status.HTTP_201_CREATED)
async def create_report_data_source(
    source: ReportDataSourceCreate,
    db: Session = Depends(get_db_v2),
    current_user: v2_security_schemas.User = Depends(get_current_user)
):
    """创建报表数据源"""
    try:
        created_source = crud.create_report_data_source(db=db, source=source)
        return created_source
    except Exception as e:
        logger.error(f"Error creating report data source: {str(e)}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=create_error_response(500, "Internal server error", str(e)))

@router.put("/data-sources/{source_id}", response_model=ReportDataSourceResponse)
async def update_report_data_source(
    source_id: int,
    source: ReportDataSourceUpdate,
    db: Session = Depends(get_db_v2),
    current_user: v2_security_schemas.User = Depends(get_current_user)
):
    """更新报表数据源"""
    try:
        updated_source = crud.update_report_data_source(
            db=db,
            source_id=source_id,
            source=source
        )
        if not updated_source:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=create_error_response(404, "Report data source not found"))
        
        return updated_source
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating report data source {source_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=create_error_response(500, "Internal server error", str(e)))

@router.delete("/data-sources/{source_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_report_data_source(
    source_id: int,
    db: Session = Depends(get_db_v2),
    current_user: v2_security_schemas.User = Depends(get_current_user)
):
    """删除报表数据源"""
    try:
        success = crud.delete_report_data_source(db=db, source_id=source_id)
        if not success:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=create_error_response(404, "Report data source not found or failed to delete"))
        
        return None # Returns 204 No Content
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting report data source {source_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=create_error_response(500, "Internal server error", str(e)))
