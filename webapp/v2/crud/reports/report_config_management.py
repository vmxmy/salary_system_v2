"""
报表配置管理CRUD操作
包含报表类型定义、字段定义、配置预设的增删改查操作
"""
from typing import List, Optional, Tuple, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc, asc, func
from datetime import datetime

from ...models.reports import (
    ReportTypeDefinition, 
    ReportFieldDefinition, 
    ReportConfigPreset
)
from ...pydantic_models.reports import (
    ReportTypeDefinitionCreate,
    ReportTypeDefinitionUpdate,
    ReportFieldDefinitionCreate,
    ReportFieldDefinitionUpdate,
    ReportConfigPresetCreate,
    ReportConfigPresetUpdate,
)


# ==================== 报表类型定义 CRUD ====================

def get_report_type_definitions(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    category: Optional[str] = None,
    is_active: Optional[bool] = None,
    is_system: Optional[bool] = None,
    search: Optional[str] = None,
    sort_by: str = "sort_order",
    sort_order: str = "asc"
) -> Tuple[List[ReportTypeDefinition], int]:
    """
    获取报表类型定义列表
    
    Args:
        db: 数据库会话
        skip: 跳过的记录数
        limit: 返回的记录数
        category: 分类筛选
        is_active: 是否激活筛选
        is_system: 是否系统内置筛选
        search: 搜索关键词
        sort_by: 排序字段
        sort_order: 排序方向
        
    Returns:
        (报表类型定义列表, 总数)
    """
    query = db.query(ReportTypeDefinition)
    
    # 筛选条件
    filters = []
    if category:
        filters.append(ReportTypeDefinition.category == category)
    if is_active is not None:
        filters.append(ReportTypeDefinition.is_active == is_active)
    if is_system is not None:
        filters.append(ReportTypeDefinition.is_system == is_system)
    if search:
        search_filter = or_(
            ReportTypeDefinition.name.ilike(f"%{search}%"),
            ReportTypeDefinition.code.ilike(f"%{search}%"),
            ReportTypeDefinition.description.ilike(f"%{search}%")
        )
        filters.append(search_filter)
    
    if filters:
        query = query.filter(and_(*filters))
    
    # 总数
    total = query.count()
    
    # 排序
    sort_column = getattr(ReportTypeDefinition, sort_by, ReportTypeDefinition.sort_order)
    if sort_order.lower() == "desc":
        query = query.order_by(desc(sort_column))
    else:
        query = query.order_by(asc(sort_column))
    
    # 分页
    items = query.offset(skip).limit(limit).all()
    
    return items, total


def get_report_type_definition(
    db: Session, 
    definition_id: Optional[int] = None,
    code: Optional[str] = None
) -> Optional[ReportTypeDefinition]:
    """
    根据ID或编码获取报表类型定义
    
    Args:
        db: 数据库会话
        definition_id: 定义ID
        code: 报表类型编码
        
    Returns:
        报表类型定义或None
    """
    if definition_id:
        return db.query(ReportTypeDefinition).filter(
            ReportTypeDefinition.id == definition_id
        ).first()
    elif code:
        return db.query(ReportTypeDefinition).filter(
            ReportTypeDefinition.code == code
        ).first()
    return None


def create_report_type_definition(
    db: Session,
    definition: ReportTypeDefinitionCreate,
    user_id: int
) -> ReportTypeDefinition:
    """
    创建报表类型定义
    
    Args:
        db: 数据库会话
        definition: 报表类型定义数据
        user_id: 创建者ID
        
    Returns:
        创建的报表类型定义
    """
    db_definition = ReportTypeDefinition(
        **definition.model_dump(),
        created_by=user_id,
        updated_by=user_id
    )
    
    db.add(db_definition)
    db.commit()
    db.refresh(db_definition)
    
    return db_definition


def update_report_type_definition(
    db: Session,
    definition_id: int,
    definition: ReportTypeDefinitionUpdate,
    user_id: int
) -> Optional[ReportTypeDefinition]:
    """
    更新报表类型定义
    
    Args:
        db: 数据库会话
        definition_id: 定义ID
        definition: 更新数据
        user_id: 更新者ID
        
    Returns:
        更新后的报表类型定义或None
    """
    db_definition = db.query(ReportTypeDefinition).filter(
        ReportTypeDefinition.id == definition_id
    ).first()
    
    if not db_definition:
        return None
    
    # 更新字段
    update_data = definition.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_definition, field, value)
    
    db_definition.updated_by = user_id
    db_definition.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(db_definition)
    
    return db_definition


def delete_report_type_definition(
    db: Session,
    definition_id: int
) -> bool:
    """
    删除报表类型定义
    
    Args:
        db: 数据库会话
        definition_id: 定义ID
        
    Returns:
        是否删除成功
    """
    db_definition = db.query(ReportTypeDefinition).filter(
        ReportTypeDefinition.id == definition_id
    ).first()
    
    if not db_definition:
        return False
    
    # 检查是否为系统内置
    if db_definition.is_system:
        return False
    
    db.delete(db_definition)
    db.commit()
    
    return True


# ==================== 报表字段定义 CRUD ====================

def get_report_field_definitions(
    db: Session,
    report_type_id: int,
    skip: int = 0,
    limit: int = 100,
    is_visible: Optional[bool] = None,
    field_type: Optional[str] = None,
    sort_by: str = "display_order",
    sort_order: str = "asc"
) -> Tuple[List[ReportFieldDefinition], int]:
    """
    获取报表字段定义列表
    
    Args:
        db: 数据库会话
        report_type_id: 报表类型ID
        skip: 跳过的记录数
        limit: 返回的记录数
        is_visible: 是否可见筛选
        field_type: 字段类型筛选
        sort_by: 排序字段
        sort_order: 排序方向
        
    Returns:
        (字段定义列表, 总数)
    """
    query = db.query(ReportFieldDefinition).filter(
        ReportFieldDefinition.report_type_id == report_type_id
    )
    
    # 筛选条件
    filters = []
    if is_visible is not None:
        filters.append(ReportFieldDefinition.is_visible == is_visible)
    if field_type:
        filters.append(ReportFieldDefinition.field_type == field_type)
    
    if filters:
        query = query.filter(and_(*filters))
    
    # 总数
    total = query.count()
    
    # 排序
    sort_column = getattr(ReportFieldDefinition, sort_by, ReportFieldDefinition.display_order)
    if sort_order.lower() == "desc":
        query = query.order_by(desc(sort_column))
    else:
        query = query.order_by(asc(sort_column))
    
    # 分页
    items = query.offset(skip).limit(limit).all()
    
    return items, total


def get_report_field_definition(
    db: Session,
    field_id: int
) -> Optional[ReportFieldDefinition]:
    """
    获取报表字段定义
    
    Args:
        db: 数据库会话
        field_id: 字段ID
        
    Returns:
        字段定义或None
    """
    return db.query(ReportFieldDefinition).filter(
        ReportFieldDefinition.id == field_id
    ).first()


def create_report_field_definition(
    db: Session,
    field: ReportFieldDefinitionCreate
) -> ReportFieldDefinition:
    """
    创建报表字段定义
    
    Args:
        db: 数据库会话
        field: 字段定义数据
        
    Returns:
        创建的字段定义
    """
    db_field = ReportFieldDefinition(**field.model_dump())
    
    db.add(db_field)
    db.commit()
    db.refresh(db_field)
    
    return db_field


def update_report_field_definition(
    db: Session,
    field_id: int,
    field: ReportFieldDefinitionUpdate
) -> Optional[ReportFieldDefinition]:
    """
    更新报表字段定义
    
    Args:
        db: 数据库会话
        field_id: 字段ID
        field: 更新数据
        
    Returns:
        更新后的字段定义或None
    """
    db_field = db.query(ReportFieldDefinition).filter(
        ReportFieldDefinition.id == field_id
    ).first()
    
    if not db_field:
        return None
    
    # 更新字段
    update_data = field.model_dump(exclude_unset=True)
    for field_name, value in update_data.items():
        setattr(db_field, field_name, value)
    
    db_field.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(db_field)
    
    return db_field


def delete_report_field_definition(
    db: Session,
    field_id: int
) -> bool:
    """
    删除报表字段定义
    
    Args:
        db: 数据库会话
        field_id: 字段ID
        
    Returns:
        是否删除成功
    """
    db_field = db.query(ReportFieldDefinition).filter(
        ReportFieldDefinition.id == field_id
    ).first()
    
    if not db_field:
        return False
    
    db.delete(db_field)
    db.commit()
    
    return True


# ==================== 报表配置预设 CRUD ====================

def get_report_config_presets(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    category: Optional[str] = None,
    is_active: Optional[bool] = None,
    is_public: Optional[bool] = None,
    search: Optional[str] = None,
    sort_by: str = "sort_order",
    sort_order: str = "asc"
) -> Tuple[List[ReportConfigPreset], int]:
    """
    获取报表配置预设列表
    
    Args:
        db: 数据库会话
        skip: 跳过的记录数
        limit: 返回的记录数
        category: 分类筛选
        is_active: 是否激活筛选
        is_public: 是否公开筛选
        search: 搜索关键词
        sort_by: 排序字段
        sort_order: 排序方向
        
    Returns:
        (配置预设列表, 总数)
    """
    query = db.query(ReportConfigPreset)
    
    # 筛选条件
    filters = []
    if category:
        filters.append(ReportConfigPreset.category == category)
    if is_active is not None:
        filters.append(ReportConfigPreset.is_active == is_active)
    if is_public is not None:
        filters.append(ReportConfigPreset.is_public == is_public)
    if search:
        search_filter = or_(
            ReportConfigPreset.name.ilike(f"%{search}%"),
            ReportConfigPreset.description.ilike(f"%{search}%")
        )
        filters.append(search_filter)
    
    if filters:
        query = query.filter(and_(*filters))
    
    # 总数
    total = query.count()
    
    # 排序
    sort_column = getattr(ReportConfigPreset, sort_by, ReportConfigPreset.sort_order)
    if sort_order.lower() == "desc":
        query = query.order_by(desc(sort_column))
    else:
        query = query.order_by(asc(sort_column))
    
    # 分页
    items = query.offset(skip).limit(limit).all()
    
    return items, total


def get_report_config_preset(
    db: Session,
    preset_id: int
) -> Optional[ReportConfigPreset]:
    """
    获取报表配置预设
    
    Args:
        db: 数据库会话
        preset_id: 预设ID
        
    Returns:
        配置预设或None
    """
    return db.query(ReportConfigPreset).filter(
        ReportConfigPreset.id == preset_id
    ).first()


def create_report_config_preset(
    db: Session,
    preset: ReportConfigPresetCreate,
    user_id: int
) -> ReportConfigPreset:
    """
    创建报表配置预设
    
    Args:
        db: 数据库会话
        preset: 预设数据
        user_id: 创建者ID
        
    Returns:
        创建的配置预设
    """
    db_preset = ReportConfigPreset(
        **preset.model_dump(),
        created_by=user_id
    )
    
    db.add(db_preset)
    db.commit()
    db.refresh(db_preset)
    
    return db_preset


def update_report_config_preset(
    db: Session,
    preset_id: int,
    preset: ReportConfigPresetUpdate,
    user_id: int
) -> Optional[ReportConfigPreset]:
    """
    更新报表配置预设
    
    Args:
        db: 数据库会话
        preset_id: 预设ID
        preset: 更新数据
        user_id: 更新者ID
        
    Returns:
        更新后的配置预设或None
    """
    db_preset = db.query(ReportConfigPreset).filter(
        ReportConfigPreset.id == preset_id
    ).first()
    
    if not db_preset:
        return None
    
    # 更新字段
    update_data = preset.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_preset, field, value)
    
    db_preset.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(db_preset)
    
    return db_preset


def delete_report_config_preset(
    db: Session,
    preset_id: int
) -> bool:
    """
    删除报表配置预设
    
    Args:
        db: 数据库会话
        preset_id: 预设ID
        
    Returns:
        是否删除成功
    """
    db_preset = db.query(ReportConfigPreset).filter(
        ReportConfigPreset.id == preset_id
    ).first()
    
    if not db_preset:
        return False
    
    db.delete(db_preset)
    db.commit()
    
    return True


# ==================== 使用统计更新 ====================

def update_report_type_usage(
    db: Session,
    definition_id: int
) -> bool:
    """
    更新报表类型使用统计
    
    Args:
        db: 数据库会话
        definition_id: 报表类型定义ID
        
    Returns:
        是否更新成功
    """
    db_definition = db.query(ReportTypeDefinition).filter(
        ReportTypeDefinition.id == definition_id
    ).first()
    
    if not db_definition:
        return False
    
    db_definition.usage_count = (db_definition.usage_count or 0) + 1
    db_definition.last_used_at = datetime.utcnow()
    
    db.commit()
    
    return True


def update_preset_usage(
    db: Session,
    preset_id: int
) -> bool:
    """
    更新预设使用统计
    
    Args:
        db: 数据库会话
        preset_id: 预设ID
        
    Returns:
        是否更新成功
    """
    db_preset = db.query(ReportConfigPreset).filter(
        ReportConfigPreset.id == preset_id
    ).first()
    
    if not db_preset:
        return False
    
    db_preset.usage_count = (db_preset.usage_count or 0) + 1
    db_preset.last_used_at = datetime.utcnow()
    
    db.commit()
    
    return True


# ==================== 辅助函数 ====================

def get_active_report_types_for_batch(
    db: Session
) -> List[Dict[str, Any]]:
    """
    获取可用于批量报表的激活报表类型
    
    Args:
        db: 数据库会话
        
    Returns:
        报表类型列表
    """
    definitions = db.query(ReportTypeDefinition).filter(
        ReportTypeDefinition.is_active == True
    ).order_by(ReportTypeDefinition.sort_order).all()
    
    return [
        {
            "code": definition.code,
            "name": definition.name,
            "description": definition.description,
            "category": definition.category,
            "default_config": definition.default_config,
            "required_permissions": definition.required_permissions,
            "allowed_roles": definition.allowed_roles
        }
        for definition in definitions
    ]


def get_active_presets_for_batch(
    db: Session
) -> List[Dict[str, Any]]:
    """
    获取可用于批量报表的激活预设
    
    Args:
        db: 数据库会话
        
    Returns:
        预设列表
    """
    presets = db.query(ReportConfigPreset).filter(
        and_(
            ReportConfigPreset.is_active == True,
            ReportConfigPreset.is_public == True
        )
    ).order_by(ReportConfigPreset.sort_order).all()
    
    return [
        {
            "id": preset.id,
            "name": preset.name,
            "description": preset.description,
            "category": preset.category,
            "report_types": preset.report_types,
            "default_config": preset.default_config,
            "filter_config": preset.filter_config,
            "export_config": preset.export_config
        }
        for preset in presets
    ] 