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
    ReportConfigPreset,
    ReportDataSource
)
from ...pydantic_models.reports import (
    ReportTypeDefinitionCreate,
    ReportTypeDefinitionUpdate,
    ReportFieldDefinitionCreate,
    ReportFieldDefinitionUpdate,
    ReportConfigPresetCreate,
    ReportConfigPresetUpdate,
)
from ...services.report_generator_registry import auto_infer_generator_config
from ...utils.report_utils import generate_pseudo_id, find_view_by_pseudo_id


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
    from sqlalchemy.orm import joinedload
    
    query = db.query(ReportTypeDefinition).options(
        joinedload(ReportTypeDefinition.data_source)
    )
    
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
    from sqlalchemy.orm import joinedload
    
    query = db.query(ReportTypeDefinition).options(
        joinedload(ReportTypeDefinition.data_source)
    )
    
    if definition_id:
        return query.filter(ReportTypeDefinition.id == definition_id).first()
    elif code:
        return query.filter(ReportTypeDefinition.code == code).first()
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
    # 🔧 重要修复：处理动态数据源伪ID
    data_dict = definition.model_dump()
    
    # 🚀 自动推断生成器配置
    if not data_dict.get('generator_class') or not data_dict.get('generator_module'):
        # 获取数据源名称用于推断
        data_source_name = None
        if data_dict.get('data_source_id'):
            if 10000 <= data_dict['data_source_id'] < 11000:
                # 动态数据源，从伪ID推断视图名称
                for view_name in ['v_employee_details', 'v_monthly_fulltime_net_pay', 'v_comprehensive_employee_payroll']:
                    if generate_pseudo_id(view_name) == data_dict['data_source_id']:
                        data_source_name = view_name
                        break
            else:
                # 静态数据源，从数据库查询
                data_source = db.query(ReportDataSource).filter(ReportDataSource.id == data_dict['data_source_id']).first()
                if data_source:
                    data_source_name = data_source.name or data_source.table_name or data_source.view_name
        
        # 自动推断生成器配置
        auto_config = auto_infer_generator_config(
            report_name=data_dict['name'],
            report_category=data_dict.get('category'),
            data_source_name=data_source_name
        )
        
        # 如果没有手动指定，使用自动推断的值
        if not data_dict.get('generator_class'):
            data_dict['generator_class'] = auto_config['generator_class']
        if not data_dict.get('generator_module'):
            data_dict['generator_module'] = auto_config['generator_module']
        
        print(f"🚀 自动推断生成器配置: {auto_config}")
    
    # 检查是否为动态数据源伪ID（范围：10000-10999）
    if data_dict.get('data_source_id') and 10000 <= data_dict['data_source_id'] <= 10999:
        dynamic_data_source_id = data_dict['data_source_id']
        
        # 检查是否已存在对应的数据源记录
        existing_source = db.query(ReportDataSource).filter(
            ReportDataSource.id == dynamic_data_source_id
        ).first()
        
        if not existing_source:
            # 使用预定义视图列表快速查找，避免昂贵的系统表查询
            target_view_name = find_view_by_pseudo_id(dynamic_data_source_id)
            
            if target_view_name:
                # 创建动态数据源记录
                new_data_source = ReportDataSource(
                    id=dynamic_data_source_id,  # 使用伪ID作为真实ID
                    name=target_view_name,
                    code=target_view_name,
                    description=f"动态数据源: {target_view_name}",
                    schema_name='reports',
                    view_name=target_view_name,
                    source_type='view',
                    connection_config={},
                    is_active=True,
                    is_system=False,
                    created_by=user_id,
                    updated_by=user_id
                )
                
                db.add(new_data_source)
                db.flush()  # 确保数据源先插入
                
                print(f"✅ 创建动态数据源记录: ID={dynamic_data_source_id}, 名称={target_view_name}")
            else:
                # 如果找不到对应的视图，设置为None以避免外键错误
                print(f"⚠️ 找不到伪ID {dynamic_data_source_id} 对应的视图，将 data_source_id 设为 None")
                data_dict['data_source_id'] = None
    
    db_definition = ReportTypeDefinition(
        **data_dict,
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
    
    # 转换更新数据为字典
    update_data = definition.model_dump(exclude_unset=True)
    
    # 🚀 自动推断生成器配置（仅在编辑时未手动指定的情况下）
    should_auto_infer = (
        ('generator_class' not in update_data or not update_data.get('generator_class')) or
        ('generator_module' not in update_data or not update_data.get('generator_module'))
    )
    
    if should_auto_infer:
        # 获取当前报表的名称、分类（可能来自更新数据或现有数据）
        report_name = update_data.get('name', db_definition.name)
        report_category = update_data.get('category', db_definition.category)
        
        # 获取数据源名称用于推断
        data_source_name = None
        data_source_id = update_data.get('data_source_id', db_definition.data_source_id)
        
        if data_source_id:
            if 10000 <= data_source_id < 11000:
                # 动态数据源，从伪ID推断视图名称
                for view_name in ['v_employee_details', 'v_monthly_fulltime_net_pay', 'v_comprehensive_employee_payroll']:
                    if generate_pseudo_id(view_name) == data_source_id:
                        data_source_name = view_name
                        break
            else:
                # 静态数据源，从数据库查询
                data_source = db.query(ReportDataSource).filter(ReportDataSource.id == data_source_id).first()
                if data_source:
                    data_source_name = data_source.name or data_source.table_name or data_source.view_name
        
        # 自动推断生成器配置
        auto_config = auto_infer_generator_config(
            report_name=report_name,
            report_category=report_category,
            data_source_name=data_source_name
        )
        
        # 如果没有手动指定，使用自动推断的值
        if 'generator_class' not in update_data or not update_data.get('generator_class'):
            update_data['generator_class'] = auto_config['generator_class']
        if 'generator_module' not in update_data or not update_data.get('generator_module'):
            update_data['generator_module'] = auto_config['generator_module']
        
        print(f"🚀 编辑时自动推断生成器配置: {auto_config}")
    
    # 🔧 处理动态数据源的伪ID（编辑时也需要处理）
    if update_data.get('data_source_id') and 10000 <= update_data['data_source_id'] <= 10999:
        dynamic_data_source_id = update_data['data_source_id']
        
        # 检查是否已存在对应的数据源记录
        existing_source = db.query(ReportDataSource).filter(
            ReportDataSource.id == dynamic_data_source_id
        ).first()
        
        if not existing_source:
            # 使用预定义视图列表快速查找，避免昂贵的系统表查询
            target_view_name = find_view_by_pseudo_id(dynamic_data_source_id)
            
            if target_view_name:
                # 创建动态数据源记录
                new_data_source = ReportDataSource(
                    id=dynamic_data_source_id,  # 使用伪ID作为真实ID
                    name=target_view_name,
                    code=target_view_name,
                    description=f"动态数据源: {target_view_name}",
                    schema_name='reports',
                    view_name=target_view_name,
                    source_type='view',
                    connection_config={},
                    is_active=True,
                    is_system=False,
                    created_by=user_id,
                    updated_by=user_id
                )
                
                db.add(new_data_source)
                db.flush()  # 确保数据源先插入
                
                print(f"✅ 编辑时创建动态数据源记录: ID={dynamic_data_source_id}, 名称={target_view_name}")
            else:
                # 如果找不到对应的视图，设置为None以避免外键错误
                print(f"⚠️ 编辑时找不到伪ID {dynamic_data_source_id} 对应的视图，将 data_source_id 设为 None")
                update_data['data_source_id'] = None
    
    # 更新字段
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
        
    Raises:
        ValueError: 当尝试删除系统内置类型时
    """
    import logging
    logger = logging.getLogger(__name__)
    
    logger.info(f"🗑️ 尝试删除报表类型定义 ID: {definition_id}")
    
    db_definition = db.query(ReportTypeDefinition).filter(
        ReportTypeDefinition.id == definition_id
    ).first()
    
    if not db_definition:
        logger.warning(f"❌ 报表类型定义不存在 ID: {definition_id}")
        return False
    
    # 检查是否为系统内置
    if db_definition.is_system:
        logger.warning(f"❌ 尝试删除系统内置报表类型: {db_definition.code}")
        raise ValueError(f"系统内置报表类型 '{db_definition.name}' 无法删除")
    
    logger.info(f"✅ 删除报表类型定义: {db_definition.code} - {db_definition.name}")
    
    try:
        db.delete(db_definition)
        db.commit()
        logger.info(f"✅ 成功删除报表类型定义 ID: {definition_id}")
        return True
    except Exception as e:
        logger.error(f"❌ 删除报表类型定义失败 ID: {definition_id}, 错误: {str(e)}")
        db.rollback()
        raise e


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