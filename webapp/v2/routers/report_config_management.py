"""
报表配置管理API路由
包含报表类型定义、字段定义、配置预设的管理接口
"""
from fastapi import APIRouter, Depends, HTTPException, Query, Path
from sqlalchemy.orm import Session
from typing import List, Optional
import logging

from ..database import get_db_v2 as get_db
from ...auth import get_current_user
from ..models.security import User
from ..pydantic_models.reports import (
    # 报表类型定义
    ReportTypeDefinition,
    ReportTypeDefinitionCreate,
    ReportTypeDefinitionUpdate,
    ReportTypeDefinitionListItem,
    
    # 报表字段定义
    ReportFieldDefinition,
    ReportFieldDefinitionCreate,
    ReportFieldDefinitionUpdate,
    
    # 报表配置预设
    ReportConfigPreset,
    ReportConfigPresetCreate,
    ReportConfigPresetUpdate,
    ReportConfigPresetListItem,
)
from ..crud.reports import report_config_management as crud

# 设置logger
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/report-config", tags=["报表配置管理"])


# ==================== 报表类型定义 API ====================

@router.get("/types", response_model=List[ReportTypeDefinitionListItem])
async def get_report_type_definitions(
    skip: int = Query(0, ge=0, description="跳过的记录数"),
    limit: int = Query(100, ge=1, le=1000, description="返回的记录数"),
    category: Optional[str] = Query(None, description="分类筛选"),
    is_active: Optional[bool] = Query(None, description="是否激活筛选"),
    is_system: Optional[bool] = Query(None, description="是否系统内置筛选"),
    search: Optional[str] = Query(None, description="搜索关键词"),
    sort_by: str = Query("sort_order", description="排序字段"),
    sort_order: str = Query("asc", description="排序方向"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    获取报表类型定义列表
    """
    try:
        definitions, total = crud.get_report_type_definitions(
            db=db,
            skip=skip,
            limit=limit,
            category=category,
            is_active=is_active,
            is_system=is_system,
            search=search,
            sort_by=sort_by,
            sort_order=sort_order
        )
        
        return [ReportTypeDefinitionListItem.model_validate(definition) for definition in definitions]
        
    except Exception as e:
        logger.error(f"获取报表类型定义列表失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"获取报表类型定义列表失败: {str(e)}")


@router.get("/types/{type_id}", response_model=ReportTypeDefinition)
async def get_report_type_definition(
    type_id: int = Path(..., description="报表类型ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    获取报表类型定义详情
    """
    try:
        definition = crud.get_report_type_definition(db=db, definition_id=type_id)
        if not definition:
            raise HTTPException(status_code=404, detail="报表类型定义不存在")
        
        return ReportTypeDefinition.model_validate(definition)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取报表类型定义详情失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"获取报表类型定义详情失败: {str(e)}")


@router.post("/types", response_model=ReportTypeDefinition)
async def create_report_type_definition(
    type_data: ReportTypeDefinitionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    创建报表类型定义
    """
    try:
        definition = crud.create_report_type_definition(
            db=db,
            definition=type_data,
            user_id=current_user.id
        )
        
        return ReportTypeDefinition.model_validate(definition)
        
    except Exception as e:
        logger.error(f"创建报表类型定义失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"创建报表类型定义失败: {str(e)}")


@router.put("/types/{type_id}", response_model=ReportTypeDefinition)
async def update_report_type_definition(
    type_data: ReportTypeDefinitionUpdate,
    type_id: int = Path(..., description="报表类型ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    更新报表类型定义
    """
    try:
        definition = crud.update_report_type_definition(
            db=db,
            definition_id=type_id,
            definition=type_data,
            user_id=current_user.id
        )
        
        if not definition:
            raise HTTPException(status_code=404, detail="报表类型定义不存在")
        
        return ReportTypeDefinition.model_validate(definition)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"更新报表类型定义失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"更新报表类型定义失败: {str(e)}")


@router.delete("/types/{type_id}")
async def delete_report_type_definition(
    type_id: int = Path(..., description="报表类型ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    删除报表类型定义
    """
    try:
        success = crud.delete_report_type_definition(db=db, definition_id=type_id)
        
        if not success:
            raise HTTPException(status_code=404, detail="报表类型定义不存在")
        
        return {"message": "报表类型定义删除成功"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"删除报表类型定义失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"删除报表类型定义失败: {str(e)}")


# ==================== 报表字段定义 API ====================

@router.get("/types/{type_id}/fields", response_model=List[ReportFieldDefinition])
async def get_report_field_definitions(
    type_id: int = Path(..., description="报表类型ID"),
    skip: int = Query(0, ge=0, description="跳过的记录数"),
    limit: int = Query(100, ge=1, le=1000, description="返回的记录数"),
    is_visible: Optional[bool] = Query(None, description="是否可见筛选"),
    field_type: Optional[str] = Query(None, description="字段类型筛选"),
    sort_by: str = Query("display_order", description="排序字段"),
    sort_order: str = Query("asc", description="排序方向"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    获取报表字段定义列表
    """
    try:
        fields, total = crud.get_report_field_definitions(
            db=db,
            report_type_id=type_id,
            skip=skip,
            limit=limit,
            is_visible=is_visible,
            field_type=field_type,
            sort_by=sort_by,
            sort_order=sort_order
        )
        
        return [ReportFieldDefinition.model_validate(field) for field in fields]
        
    except Exception as e:
        logger.error(f"获取报表字段定义列表失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"获取报表字段定义列表失败: {str(e)}")


@router.post("/types/{type_id}/fields", response_model=ReportFieldDefinition)
async def create_report_field_definition(
    field_data: ReportFieldDefinitionCreate,
    type_id: int = Path(..., description="报表类型ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    创建报表字段定义
    """
    try:
        # 设置报表类型ID
        field_data.report_type_id = type_id
        
        field = crud.create_report_field_definition(
            db=db,
            field=field_data
        )
        
        return ReportFieldDefinition.model_validate(field)
        
    except Exception as e:
        logger.error(f"创建报表字段定义失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"创建报表字段定义失败: {str(e)}")


@router.put("/fields/{field_id}", response_model=ReportFieldDefinition)
async def update_report_field_definition(
    field_data: ReportFieldDefinitionUpdate,
    field_id: int = Path(..., description="字段ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    更新报表字段定义
    """
    try:
        field = crud.update_report_field_definition(
            db=db,
            field_id=field_id,
            field=field_data
        )
        
        if not field:
            raise HTTPException(status_code=404, detail="报表字段定义不存在")
        
        return ReportFieldDefinition.model_validate(field)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"更新报表字段定义失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"更新报表字段定义失败: {str(e)}")


@router.delete("/fields/{field_id}")
async def delete_report_field_definition(
    field_id: int = Path(..., description="字段ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    删除报表字段定义
    """
    try:
        success = crud.delete_report_field_definition(db=db, field_id=field_id)
        
        if not success:
            raise HTTPException(status_code=404, detail="报表字段定义不存在")
        
        return {"message": "报表字段定义删除成功"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"删除报表字段定义失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"删除报表字段定义失败: {str(e)}")


@router.get("/batch-report-types")
async def get_batch_report_types(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    获取可用于批量报表的报表类型
    """
    try:
        report_types = crud.get_active_report_types_for_batch(db=db)
        
        return {
            "report_types": report_types,
            "total_count": len(report_types)
        }
        
    except Exception as e:
        logger.error(f"获取批量报表类型失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"获取批量报表类型失败: {str(e)}")


@router.get("/batch-report-presets")
async def get_batch_report_presets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    获取可用于批量报表的配置预设
    """
    try:
        presets = crud.get_active_presets_for_batch(db=db)
        
        return {
            "presets": presets,
            "total_count": len(presets)
        }
        
    except Exception as e:
        logger.error(f"获取批量报表预设失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"获取批量报表预设失败: {str(e)}")


# ==================== 报表配置预设 API ====================

@router.get("/presets", response_model=List[ReportConfigPresetListItem])
async def get_report_config_presets(
    skip: int = Query(0, ge=0, description="跳过的记录数"),
    limit: int = Query(100, ge=1, le=1000, description="返回的记录数"),
    category: Optional[str] = Query(None, description="分类筛选"),
    is_active: Optional[bool] = Query(None, description="是否激活筛选"),
    is_public: Optional[bool] = Query(None, description="是否公开筛选"),
    search: Optional[str] = Query(None, description="搜索关键词"),
    sort_by: str = Query("sort_order", description="排序字段"),
    sort_order: str = Query("asc", description="排序方向"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    获取报表配置预设列表
    """
    try:
        presets, total = crud.get_report_config_presets(
            db=db,
            skip=skip,
            limit=limit,
            category=category,
            is_active=is_active,
            is_public=is_public,
            search=search,
            sort_by=sort_by,
            sort_order=sort_order
        )
        
        return [ReportConfigPresetListItem.model_validate(preset) for preset in presets]
        
    except Exception as e:
        logger.error(f"获取报表配置预设列表失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"获取报表配置预设列表失败: {str(e)}")


@router.get("/presets/{preset_id}", response_model=ReportConfigPreset)
async def get_report_config_preset(
    preset_id: int = Path(..., description="预设ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    获取报表配置预设详情
    """
    try:
        preset = crud.get_report_config_preset(db=db, preset_id=preset_id)
        if not preset:
            raise HTTPException(status_code=404, detail="报表配置预设不存在")
        
        return ReportConfigPreset.model_validate(preset)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取报表配置预设详情失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"获取报表配置预设详情失败: {str(e)}")


@router.post("/presets", response_model=ReportConfigPreset)
async def create_report_config_preset(
    preset_data: ReportConfigPresetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    创建报表配置预设
    """
    try:
        preset = crud.create_report_config_preset(
            db=db,
            preset=preset_data,
            user_id=current_user.id
        )
        
        return ReportConfigPreset.model_validate(preset)
        
    except Exception as e:
        logger.error(f"创建报表配置预设失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"创建报表配置预设失败: {str(e)}")


@router.put("/presets/{preset_id}", response_model=ReportConfigPreset)
async def update_report_config_preset(
    preset_data: ReportConfigPresetUpdate,
    preset_id: int = Path(..., description="预设ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    更新报表配置预设
    """
    try:
        preset = crud.update_report_config_preset(
            db=db,
            preset_id=preset_id,
            preset=preset_data,
            user_id=current_user.id
        )
        
        if not preset:
            raise HTTPException(status_code=404, detail="报表配置预设不存在")
        
        return ReportConfigPreset.model_validate(preset)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"更新报表配置预设失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"更新报表配置预设失败: {str(e)}")


@router.delete("/presets/{preset_id}")
async def delete_report_config_preset(
    preset_id: int = Path(..., description="预设ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    删除报表配置预设
    """
    try:
        success = crud.delete_report_config_preset(db=db, preset_id=preset_id)
        
        if not success:
            raise HTTPException(status_code=404, detail="报表配置预设不存在")
        
        return {"message": "报表配置预设删除成功"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"删除报表配置预设失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"删除报表配置预设失败: {str(e)}")


# ==================== 使用统计 API ====================

@router.post("/usage/preset/{preset_id}")
async def update_preset_usage(
    preset_id: int = Path(..., description="预设ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    更新配置预设使用统计
    """
    try:
        success = crud.update_preset_usage(db=db, preset_id=preset_id)
        
        if not success:
            raise HTTPException(status_code=404, detail="报表配置预设不存在")
        
        return {"message": "使用统计更新成功"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"更新使用统计失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"更新使用统计失败: {str(e)}") 