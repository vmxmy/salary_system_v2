"""
报表配置管理API路由
包含报表类型定义、字段定义、配置预设的管理接口
"""
from fastapi import APIRouter, Depends, HTTPException, Query, Path, Request
from sqlalchemy.orm import Session
from typing import List, Optional, Any, Dict
import logging
import json

from ..database import get_db_v2 as get_db
from ...auth import get_current_user
from ..models.security import User
from ..models.reports import ReportDataSource
# ReportDataSourceField 已移除，改为动态获取字段
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
    
    # 数据源相关
    ReportDataSource as ReportDataSourcePydantic,
    ReportDataSourceCreate,
    ReportDataSourceUpdate,
    # ReportDataSourceField as ReportDataSourceFieldPydantic,  # 已移除
    ReportDataPreviewResponse,
)
from ..crud.reports import report_config_management as crud
from ..crud.reports import report_data_source_crud

# 设置logger
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/report-config", tags=["报表配置管理"])

# Dependency to get data source by ID or Code
async def get_data_source_by_id_or_code(
    data_source_id_or_code: str = Path(..., description="数据源的ID或编码"),
    db: Session = Depends(get_db)
) -> ReportDataSource:
    if data_source_id_or_code.isdigit():
        data_source = report_data_source_crud.ReportDataSourceCRUD.get_by_id(db, int(data_source_id_or_code))
    else:
        data_source = report_data_source_crud.ReportDataSourceCRUD.get_by_code(db, data_source_id_or_code)
    
    if not data_source:
        raise HTTPException(
            status_code=404, 
            detail=f"Data source with identifier '{data_source_id_or_code}' not found"
        )
    return data_source

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
        
        # 为每个定义添加数据源名称
        result = []
        for definition in definitions:
            definition_dict = definition.__dict__.copy()
            if definition.data_source:
                definition_dict['data_source_name'] = definition.data_source.name
            result.append(ReportTypeDefinitionListItem.model_validate(definition_dict))
        
        return result
        
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
        
        # 添加数据源名称
        definition_dict = definition.__dict__.copy()
        if definition.data_source:
            definition_dict['data_source_name'] = definition.data_source.name
        
        return ReportTypeDefinition.model_validate(definition_dict)
        
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
        
        # 添加数据源名称
        definition_dict = definition.__dict__.copy()
        if definition.data_source:
            definition_dict['data_source_name'] = definition.data_source.name
        
        return ReportTypeDefinition.model_validate(definition_dict)
        
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
        
        # 添加数据源名称
        definition_dict = definition.__dict__.copy()
        if definition.data_source:
            definition_dict['data_source_name'] = definition.data_source.name
        
        return ReportTypeDefinition.model_validate(definition_dict)
        
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
            logger.warning(f"报表类型定义不存在或已被删除: {type_id}")
            raise HTTPException(status_code=404, detail=f"报表类型定义不存在 (ID: {type_id})")
        
        logger.info(f"✅ 报表类型定义删除成功: {type_id}")
        return {"message": "报表类型定义删除成功"}
        
    except ValueError as e:
        # 处理系统内置类型删除错误
        logger.warning(f"尝试删除系统内置报表类型: {str(e)}")
        raise HTTPException(status_code=403, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"删除报表类型定义失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"删除报表类型定义失败: {str(e)}")


@router.get("/types/{type_id}/preview")
async def preview_report_type_data(
    request: Request,
    type_id: int = Path(..., description="报表类型ID"),
    skip: int = Query(0, ge=0, description="跳过的记录数"),
    limit: int = Query(5, ge=1, le=100, description="返回的记录数"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    预览报表类型的数据
    """
    try:
        # 获取报表类型定义
        report_type = crud.get_report_type_definition(db=db, definition_id=type_id)
        if not report_type:
            raise HTTPException(status_code=404, detail="报表类型定义不存在")
        
        # 获取关联的数据源
        if not report_type.data_source_id:
            raise HTTPException(status_code=400, detail="报表类型未配置数据源")
        
        # 解析筛选条件
        filters = None
        query_params = dict(request.query_params)
        
        # 检查是否有筛选条件参数
        if 'filters' in query_params:
            try:
                filters_str = query_params['filters']
                if filters_str:
                    filter_config = json.loads(filters_str)
                    logger.info(f"解析到筛选条件配置: {filter_config}")
                    
                    # 将筛选条件转换为数据源预览方法期望的格式
                    filters = {}
                    if isinstance(filter_config, dict) and 'conditions' in filter_config:
                        for condition in filter_config['conditions']:
                            field_name = condition.get('field_name')
                            operator = condition.get('operator', 'equals')
                            value = condition.get('value')
                            
                            if field_name and value is not None:
                                # 目前简化处理，只支持等于操作
                                if operator == 'equals':
                                    filters[field_name] = value
                                # 可以扩展支持其他操作符
                                elif operator == 'contains' and isinstance(value, str):
                                    # 对于包含操作，暂时跳过，因为当前预览方法不支持LIKE
                                    logger.warning(f"暂不支持操作符 {operator}，跳过字段 {field_name}")
                                    continue
                                else:
                                    logger.warning(f"暂不支持操作符 {operator}，跳过字段 {field_name}")
                                    continue
                    
                    logger.info(f"转换后的筛选条件: {filters}")
            except json.JSONDecodeError as e:
                logger.warning(f"筛选条件JSON解析失败: {e}")
                filters = None
        
        # 使用数据源预览功能
        from webapp.v2.crud.reports import report_data_source_crud
        
        result = report_data_source_crud.ReportDataSourceCRUD.preview_data(
            db=db, 
            data_source_id=report_type.data_source_id, 
            skip=skip, 
            limit=limit, 
            filters=filters, 
            sorting=None
        )
        
        return {
            "report_type_id": type_id,
            "report_type_name": report_type.name,
            "data_source_id": report_type.data_source_id,
            "applied_filters": filters,
            "total": result.get("total", 0),
            "items": result.get("items", [])
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"预览报表类型数据失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"预览报表类型数据失败: {str(e)}")


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


@router.get("/types/{type_id}/available-fields")
async def get_available_fields_for_report_type(
    type_id: int = Path(..., description="报表类型ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    获取报表类型可用的字段列表（基于报表类型配置的data_source_id和fields）
    """
    try:
        # 获取报表类型定义
        report_type = crud.get_report_type_definition(db=db, definition_id=type_id)
        if not report_type:
            raise HTTPException(status_code=404, detail="报表类型定义不存在")
        
        # 获取关联的数据源
        if not report_type.data_source_id:
            raise HTTPException(status_code=400, detail="报表类型未配置数据源")
        
        # 动态获取数据源所有字段
        from webapp.v2.services.dynamic_field_service import DynamicDataSourceService
        
        all_fields = DynamicDataSourceService.get_data_source_fields_dynamic(
            db=db, 
            data_source_id=report_type.data_source_id
        )
        
        # 如果报表类型配置了特定字段，则只返回这些字段
        selected_fields = all_fields
        if report_type.fields:
            try:
                # fields 字段存储的是逗号分隔的字段ID或字段名
                field_identifiers = [f.strip() for f in report_type.fields.split(',') if f.strip()]
                
                # 尝试按字段名匹配（优先）或按ID匹配
                selected_fields = []
                for field in all_fields:
                    # 检查字段名是否在配置中
                    if field.get('field_name') in field_identifiers:
                        selected_fields.append(field)
                    # 检查字段ID是否在配置中（如果ID是数字）
                    elif str(field.get('id', '')) in field_identifiers:
                        selected_fields.append(field)
                
                # 如果没有匹配到任何字段，返回所有字段
                if not selected_fields:
                    logger.warning(f"报表类型 {type_id} 配置的字段 '{report_type.fields}' 未找到匹配项，返回所有字段")
                    selected_fields = all_fields
                    
            except Exception as e:
                logger.warning(f"解析报表类型字段配置失败: {str(e)}，返回所有字段")
                selected_fields = all_fields
        
        return {
            "report_type_id": type_id,
            "report_type_name": report_type.name,
            "data_source_id": report_type.data_source_id,
            "configured_fields": report_type.fields,
            "total_available_fields": len(all_fields),
            "total_selected_fields": len(selected_fields),
            "fields": selected_fields
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取报表类型可用字段失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"获取报表类型可用字段失败: {str(e)}")


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


# ==================== 数据源管理 API ====================

@router.get("/data-sources", response_model=List[ReportDataSourcePydantic])
async def get_data_sources(
    is_active: Optional[bool] = Query(None, description="是否激活筛选"),
    schema_name: Optional[str] = Query(None, description="模式名筛选"),
    search: Optional[str] = Query(None, description="搜索关键词"),
    skip: int = Query(0, ge=0, description="跳过的记录数"),
    limit: int = Query(1000, ge=1, le=1000, description="返回的记录数"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    获取数据源列表
    """
    logger.info(
        f"获取数据源列表, search='{search}', is_active={is_active}, "
        f"schema_name='{schema_name}', skip={skip}, limit={limit}"
    )
    try:
        # 使用类方法获取数据源列表
        data_sources, total = report_data_source_crud.ReportDataSourceCRUD.get_all_with_filter(
            db=db,
            skip=skip,
            limit=limit,
            search=search,
            is_active=is_active,
            schema_name=schema_name
        )
        logger.info(f"查询到 {total} 个数据源")
        
        return [ReportDataSourcePydantic.model_validate(ds) for ds in data_sources]
        
    except Exception as e:
        logger.error(f"获取数据源列表失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"获取数据源列表失败: {str(e)}")


@router.get("/data-sources/{data_source_id_or_code}", response_model=ReportDataSourcePydantic)
async def get_data_source(
    data_source: ReportDataSource = Depends(get_data_source_by_id_or_code)
):
    """
    获取数据源详情
    """
    logger.info(f"获取ID为 {data_source.id} 的数据源详情")
    return ReportDataSourcePydantic.model_validate(data_source)


@router.post("/data-sources", response_model=ReportDataSourcePydantic)
async def create_data_source(
    data_source_data: ReportDataSourceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    创建数据源
    """
    logger.info(f"创建新的数据源, code='{data_source_data.source_code}'")
    try:
        data_source = report_data_source_crud.ReportDataSourceCRUD.create(
            db=db,
            data_source=data_source_data,
            user_id=current_user.id
        )
        
        return ReportDataSourcePydantic.model_validate(data_source)
        
    except Exception as e:
        logger.error(f"创建数据源失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"创建数据源失败: {str(e)}")


@router.put("/data-sources/{data_source_id_or_code}", response_model=ReportDataSourcePydantic)
async def update_data_source(
    data_source_data: ReportDataSourceUpdate,
    data_source: ReportDataSource = Depends(get_data_source_by_id_or_code),
    db: Session = Depends(get_db)
):
    """
    更新数据源
    """
    logger.info(f"更新ID为 {data_source.id} 的数据源")
    try:
        updated_source = report_data_source_crud.ReportDataSourceCRUD.update(
            db=db,
            data_source_id=data_source.id,
            data_source=data_source_data
        )
        
        if not updated_source:
            raise HTTPException(status_code=404, detail="数据源不存在")
        
        return ReportDataSourcePydantic.model_validate(updated_source)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"更新数据源失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"更新数据源失败: {str(e)}")


@router.delete("/data-sources/{data_source_id_or_code}")
async def delete_data_source(
    data_source: ReportDataSource = Depends(get_data_source_by_id_or_code),
    db: Session = Depends(get_db)
):
    """
    删除数据源
    """
    logger.info(f"删除ID为 {data_source.id} 的数据源")
    try:
        report_data_source_crud.ReportDataSourceCRUD.delete(db=db, data_source_id=data_source.id)
        
        return {"message": "数据源删除成功"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"删除数据源失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"删除数据源失败: {str(e)}")


@router.get("/data-sources/{data_source_id_or_code}/fields")
async def get_data_source_fields(
    data_source: ReportDataSource = Depends(get_data_source_by_id_or_code),
    skip: int = Query(0, ge=0),
    limit: int = Query(1000, ge=1),
    db: Session = Depends(get_db)
):
    """
    动态获取数据源字段列表（不依赖字段表）
    """
    logger.info(f"动态获取ID为 {data_source.id} 的数据源的字段列表")
    try:
        from webapp.v2.services.dynamic_field_service import DynamicDataSourceService
        
        # 使用动态服务获取字段信息
        fields = DynamicDataSourceService.get_data_source_fields_dynamic(db, data_source.id)
        
        # 应用分页
        paginated_fields = fields[skip : skip + limit]
        
        logger.info(f"动态获取到 {len(fields)} 个字段，返回 {len(paginated_fields)} 个")
        return paginated_fields
        
    except Exception as e:
        logger.error(f"动态获取数据源字段列表失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"动态获取数据源字段列表失败: {str(e)}")


@router.post("/data-sources/{data_source_id_or_code}/sync-fields")
async def sync_data_source_fields(
    data_source: ReportDataSource = Depends(get_data_source_by_id_or_code),
    db: Session = Depends(get_db)
):
    """
    同步数据源的字段结构
    """
    try:
        synced_fields = report_data_source_crud.ReportDataSourceCRUD.sync_fields(db=db, data_source_id=data_source.id)
        if synced_fields is None:
             raise HTTPException(status_code=404, detail="数据源不存在")
        return synced_fields  # 直接返回字典列表
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"同步数据源字段失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"同步数据源字段失败: {str(e)}")


@router.get("/data-sources/{data_source_id_or_code}/preview", response_model=ReportDataPreviewResponse)
async def preview_data_source_data(
    data_source: ReportDataSource = Depends(get_data_source_by_id_or_code),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=200),
    db: Session = Depends(get_db)
):
    """
    预览数据源的实际数据
    """
    try:
        result = report_data_source_crud.ReportDataSourceCRUD.preview_data(
            db=db, data_source_id=data_source.id, skip=skip, limit=limit, filters=None, sorting=None
        )
        return ReportDataPreviewResponse.model_validate(result)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"预览数据源数据失败: {e}")
        raise HTTPException(status_code=500, detail=f"预览数据源数据失败: {e}")