"""
用户偏好设置路由
处理工资数据模态框预设配置的CRUD操作
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, Boolean

from ...database import get_db_v2
from ...models.reports import ReportUserPreference, ReportUserPreferenceGroup
from ...pydantic_models.security import User
from ...pydantic_models.user_preferences import (
    PayrollDataModalPresetCreate,
    PayrollDataModalPresetUpdate,
    PayrollDataModalPresetResponse,
    PayrollDataModalPresetList,
    PresetDuplicateRequest,
    PresetGroupCreate,
    PresetGroupUpdate,
    PresetGroupResponse,
    PresetGroupListResponse,
    PresetGroupStatsResponse,
    PresetGroupReorderRequest
)
from ...utils.auth import get_current_user
from ...utils.logging_utils import log_api_call

router = APIRouter(tags=["用户偏好设置"])

# 预设类型常量
PAYROLL_DATA_MODAL_PRESET = "payroll_data_modal_preset"

@router.get("/payroll-data-modal", response_model=PayrollDataModalPresetList)
async def get_payroll_data_modal_presets(
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """获取用户的工资数据模态框预设列表"""
    try:
        # 查询用户的预设和公共预设
        presets = db.query(ReportUserPreference).filter(
            and_(
                ReportUserPreference.preference_type == PAYROLL_DATA_MODAL_PRESET,
                or_(
                    ReportUserPreference.user_id == current_user.id,
                    ReportUserPreference.preference_config.op('->>')('is_public').cast(Boolean) == True
                )
            )
        ).order_by(
            ReportUserPreference.preference_config.op('->>')('is_default').cast(Boolean).desc(),
            ReportUserPreference.updated_at.desc()
        ).all()

        # 转换为响应格式
        preset_list = []
        for preset in presets:
            config = preset.preference_config
            preset_data = PayrollDataModalPresetResponse(
                id=preset.id,
                name=config.get('name', ''),
                description=config.get('description'),
                category=config.get('category'),  # 添加分组字段
                filterConfig=config.get('filter_config', {}),
                columnSettings=config.get('column_settings', {}),
                tableFilterState=config.get('table_filter_state', {}),
                isDefault=config.get('is_default', False),
                isPublic=config.get('is_public', False),
                usageCount=config.get('usage_count', 0),
                lastUsedAt=config.get('last_used_at'),
                createdAt=preset.created_at,
                updatedAt=preset.updated_at
            )
            preset_list.append(preset_data)

        return PayrollDataModalPresetList(
            presets=preset_list,
            total=len(preset_list)
        )

    except Exception as e:
        log_api_call(
            endpoint="/user-preferences/payroll-data-modal",
            method="GET",
            user_id=current_user.id,
            status="error",
            error_message=str(e)
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取预设列表失败: {str(e)}"
        )

@router.post("/payroll-data-modal", response_model=PayrollDataModalPresetResponse)
async def create_payroll_data_modal_preset(
    preset_data: PayrollDataModalPresetCreate,
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """创建新的工资数据模态框预设"""
    try:
        # 检查名称是否已存在
        existing = db.query(ReportUserPreference).filter(
            and_(
                ReportUserPreference.user_id == current_user.id,
                ReportUserPreference.preference_type == PAYROLL_DATA_MODAL_PRESET,
                ReportUserPreference.preference_config.op('->>')('name') == preset_data.name
            )
        ).first()

        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"预设名称 '{preset_data.name}' 已存在"
            )

        # 如果设置为默认预设，先取消其他默认预设
        if preset_data.isDefault:
            db.query(ReportUserPreference).filter(
                and_(
                    ReportUserPreference.user_id == current_user.id,
                    ReportUserPreference.preference_type == PAYROLL_DATA_MODAL_PRESET
                )
            ).update({
                ReportUserPreference.preference_config: 
                    ReportUserPreference.preference_config.op('||')('{"is_default": false}')
            })

        # 创建新预设
        preference_config = {
            "name": preset_data.name,
            "description": preset_data.description,
            "category": preset_data.category,  # 添加分组字段
            "filter_config": preset_data.filterConfig.model_dump(),
            "column_settings": preset_data.columnSettings,
            "table_filter_state": preset_data.tableFilterState or {},
            "is_default": preset_data.isDefault,
            "is_public": preset_data.isPublic,
            "usage_count": 0,
            "last_used_at": None
        }

        new_preset = ReportUserPreference(
            user_id=current_user.id,
            preference_type=PAYROLL_DATA_MODAL_PRESET,
            object_type="payroll_data_modal",
            object_id=None,
            preference_config=preference_config
        )

        db.add(new_preset)
        db.commit()
        db.refresh(new_preset)

        # 返回创建的预设
        config = new_preset.preference_config
        return PayrollDataModalPresetResponse(
            id=new_preset.id,
            name=config.get('name', ''),
            description=config.get('description'),
            category=config.get('category'),  # 添加分组字段
            filterConfig=config.get('filter_config', {}),
            columnSettings=config.get('column_settings', {}),
            tableFilterState=config.get('table_filter_state', {}),
            isDefault=config.get('is_default', False),
            isPublic=config.get('is_public', False),
            usageCount=config.get('usage_count', 0),
            lastUsedAt=config.get('last_used_at'),
            createdAt=new_preset.created_at,
            updatedAt=new_preset.updated_at
        )

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        log_api_call(
            endpoint="/user-preferences/payroll-data-modal",
            method="POST",
            user_id=current_user.id,
            status="error",
            error_message=str(e)
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"创建预设失败: {str(e)}"
        )

@router.put("/payroll-data-modal/{preset_id}", response_model=PayrollDataModalPresetResponse)
async def update_payroll_data_modal_preset(
    preset_id: int,
    preset_data: PayrollDataModalPresetUpdate,
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """更新工资数据模态框预设"""
    try:
        # 查找预设
        preset = db.query(ReportUserPreference).filter(
            and_(
                ReportUserPreference.id == preset_id,
                ReportUserPreference.user_id == current_user.id,
                ReportUserPreference.preference_type == PAYROLL_DATA_MODAL_PRESET
            )
        ).first()

        if not preset:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="预设不存在或无权限访问"
            )

        # 检查名称冲突（如果更新了名称）
        if preset_data.name and preset_data.name != preset.preference_config.get('name'):
            existing = db.query(ReportUserPreference).filter(
                and_(
                    ReportUserPreference.user_id == current_user.id,
                    ReportUserPreference.preference_type == PAYROLL_DATA_MODAL_PRESET,
                    ReportUserPreference.preference_config.op('->>')('name') == preset_data.name,
                    ReportUserPreference.id != preset_id
                )
            ).first()

            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"预设名称 '{preset_data.name}' 已存在"
                )

        # 如果设置为默认预设，先取消其他默认预设
        if preset_data.isDefault:
            db.query(ReportUserPreference).filter(
                and_(
                    ReportUserPreference.user_id == current_user.id,
                    ReportUserPreference.preference_type == PAYROLL_DATA_MODAL_PRESET,
                    ReportUserPreference.id != preset_id
                )
            ).update({
                ReportUserPreference.preference_config: 
                    ReportUserPreference.preference_config.op('||')('{"is_default": false}')
            })

        # 更新预设配置
        current_config = preset.preference_config.copy()
        
        if preset_data.name is not None:
            current_config['name'] = preset_data.name
        if preset_data.description is not None:
            current_config['description'] = preset_data.description
        if preset_data.category is not None:
            current_config['category'] = preset_data.category
        if preset_data.filterConfig is not None:
            current_config['filter_config'] = preset_data.filterConfig.model_dump()
        if preset_data.columnSettings is not None:
            current_config['column_settings'] = preset_data.columnSettings
        if preset_data.tableFilterState is not None:
            current_config['table_filter_state'] = preset_data.tableFilterState
        if preset_data.isDefault is not None:
            current_config['is_default'] = preset_data.isDefault
        if preset_data.isPublic is not None:
            current_config['is_public'] = preset_data.isPublic

        preset.preference_config = current_config
        db.commit()
        db.refresh(preset)

        # 返回更新后的预设
        config = preset.preference_config
        return PayrollDataModalPresetResponse(
            id=preset.id,
            name=config.get('name', ''),
            description=config.get('description'),
            category=config.get('category'),
            filterConfig=config.get('filter_config', {}),
            columnSettings=config.get('column_settings', {}),
            tableFilterState=config.get('table_filter_state', {}),
            isDefault=config.get('is_default', False),
            isPublic=config.get('is_public', False),
            usageCount=config.get('usage_count', 0),
            lastUsedAt=config.get('last_used_at'),
            createdAt=preset.created_at,
            updatedAt=preset.updated_at
        )

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        log_api_call(
            endpoint=f"/user-preferences/payroll-data-modal/{preset_id}",
            method="PUT",
            user_id=current_user.id,
            status="error",
            error_message=str(e)
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"更新预设失败: {str(e)}"
        )

@router.delete("/payroll-data-modal/{preset_id}")
async def delete_payroll_data_modal_preset(
    preset_id: int,
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """删除工资数据模态框预设"""
    try:
        # 查找预设
        preset = db.query(ReportUserPreference).filter(
            and_(
                ReportUserPreference.id == preset_id,
                ReportUserPreference.user_id == current_user.id,
                ReportUserPreference.preference_type == PAYROLL_DATA_MODAL_PRESET
            )
        ).first()

        if not preset:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="预设不存在或无权限访问"
            )

        db.delete(preset)
        db.commit()

        return {"message": "预设删除成功"}

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        log_api_call(
            endpoint=f"/user-preferences/payroll-data-modal/{preset_id}",
            method="DELETE",
            user_id=current_user.id,
            status="error",
            error_message=str(e)
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"删除预设失败: {str(e)}"
        )

@router.get("/payroll-data-modal/default", response_model=Optional[PayrollDataModalPresetResponse])
async def get_default_payroll_data_modal_preset(
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """获取用户的默认工资数据模态框预设"""
    try:
        # 查找用户的默认预设
        preset = db.query(ReportUserPreference).filter(
            and_(
                ReportUserPreference.user_id == current_user.id,
                ReportUserPreference.preference_type == PAYROLL_DATA_MODAL_PRESET,
                ReportUserPreference.preference_config.op('->>')('is_default').cast(Boolean) == True
            )
        ).first()

        if not preset:
            return None

        # 返回默认预设
        config = preset.preference_config
        return PayrollDataModalPresetResponse(
            id=preset.id,
            name=config.get('name', ''),
            description=config.get('description'),
            category=config.get('category'),
            filterConfig=config.get('filter_config', {}),
            columnSettings=config.get('column_settings', {}),
            tableFilterState=config.get('table_filter_state', {}),
            isDefault=config.get('is_default', False),
            isPublic=config.get('is_public', False),
            usageCount=config.get('usage_count', 0),
            lastUsedAt=config.get('last_used_at'),
            createdAt=preset.created_at,
            updatedAt=preset.updated_at
        )

    except Exception as e:
        log_api_call(
            endpoint="/user-preferences/payroll-data-modal/default",
            method="GET",
            user_id=current_user.id,
            status="error",
            error_message=str(e)
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取默认预设失败: {str(e)}"
        )

@router.post("/payroll-data-modal/{preset_id}/apply", response_model=PayrollDataModalPresetResponse)
async def apply_payroll_data_modal_preset(
    preset_id: int,
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """应用工资数据模态框预设（记录使用统计）"""
    try:
        # 查找预设（用户自己的或公共的）
        preset = db.query(ReportUserPreference).filter(
            and_(
                ReportUserPreference.id == preset_id,
                ReportUserPreference.preference_type == PAYROLL_DATA_MODAL_PRESET,
                or_(
                    ReportUserPreference.user_id == current_user.id,
                    ReportUserPreference.preference_config.op('->>')('is_public').cast(Boolean) == True
                )
            )
        ).first()

        if not preset:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="预设不存在或无权限访问"
            )

        # 更新使用统计
        from datetime import datetime
        current_config = preset.preference_config.copy()
        current_config['usage_count'] = current_config.get('usage_count', 0) + 1
        current_config['last_used_at'] = datetime.now().isoformat()
        
        preset.preference_config = current_config
        db.commit()
        db.refresh(preset)

        # 返回预设数据
        config = preset.preference_config
        return PayrollDataModalPresetResponse(
            id=preset.id,
            name=config.get('name', ''),
            description=config.get('description'),
            category=config.get('category'),
            filterConfig=config.get('filter_config', {}),
            columnSettings=config.get('column_settings', {}),
            tableFilterState=config.get('table_filter_state', {}),
            isDefault=config.get('is_default', False),
            isPublic=config.get('is_public', False),
            usageCount=config.get('usage_count', 0),
            lastUsedAt=config.get('last_used_at'),
            createdAt=preset.created_at,
            updatedAt=preset.updated_at
        )

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        log_api_call(
            endpoint=f"/user-preferences/payroll-data-modal/{preset_id}/apply",
            method="POST",
            user_id=current_user.id,
            status="error",
            error_message=str(e)
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"应用预设失败: {str(e)}"
        )

@router.post("/payroll-data-modal/{preset_id}/duplicate", response_model=PayrollDataModalPresetResponse)
async def duplicate_payroll_data_modal_preset(
    preset_id: int,
    duplicate_data: PresetDuplicateRequest,
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """复制工资数据模态框预设"""
    try:
        # 查找原预设
        original_preset = db.query(ReportUserPreference).filter(
            and_(
                ReportUserPreference.id == preset_id,
                ReportUserPreference.preference_type == PAYROLL_DATA_MODAL_PRESET,
                or_(
                    ReportUserPreference.user_id == current_user.id,
                    ReportUserPreference.preference_config.op('->>')('is_public').cast(Boolean) == True
                )
            )
        ).first()

        if not original_preset:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="原预设不存在或无权限访问"
            )

        # 检查新名称是否已存在
        existing = db.query(ReportUserPreference).filter(
            and_(
                ReportUserPreference.user_id == current_user.id,
                ReportUserPreference.preference_type == PAYROLL_DATA_MODAL_PRESET,
                ReportUserPreference.preference_config.op('->>')('name') == duplicate_data.newName
            )
        ).first()

        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"预设名称 '{duplicate_data.newName}' 已存在"
            )

        # 复制预设配置
        original_config = original_preset.preference_config.copy()
        new_config = {
            "name": duplicate_data.newName,
            "description": duplicate_data.description or f"复制自: {original_config.get('name', '')}",
            "category": duplicate_data.category or original_config.get('category'),
            "filter_config": original_config.get('filter_config', {}),
            "column_settings": original_config.get('column_settings', {}),
            "table_filter_state": original_config.get('table_filter_state', {}),
            "is_default": False,  # 复制的预设不设为默认
            "is_public": False,   # 复制的预设不设为公共
            "usage_count": 0,
            "last_used_at": None
        }

        # 创建新预设
        new_preset = ReportUserPreference(
            user_id=current_user.id,
            preference_type=PAYROLL_DATA_MODAL_PRESET,
            object_type="payroll_data_modal",
            object_id=None,
            preference_config=new_config
        )

        db.add(new_preset)
        db.commit()
        db.refresh(new_preset)

        # 返回新预设
        config = new_preset.preference_config
        return PayrollDataModalPresetResponse(
            id=new_preset.id,
            name=config.get('name', ''),
            description=config.get('description'),
            category=config.get('category'),
            filterConfig=config.get('filter_config', {}),
            columnSettings=config.get('column_settings', {}),
            tableFilterState=config.get('table_filter_state', {}),
            isDefault=config.get('is_default', False),
            isPublic=config.get('is_public', False),
            usageCount=config.get('usage_count', 0),
            lastUsedAt=config.get('last_used_at'),
            createdAt=new_preset.created_at,
            updatedAt=new_preset.updated_at
        )

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        log_api_call(
            endpoint=f"/user-preferences/payroll-data-modal/{preset_id}/duplicate",
            method="POST",
            user_id=current_user.id,
            status="error",
            error_message=str(e)
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"复制预设失败: {str(e)}"
        )

@router.post("/payroll-data-modal/{preset_id}/set-default")
async def set_default_payroll_data_modal_preset(
    preset_id: int,
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """设置默认工资数据模态框预设"""
    try:
        # 查找预设
        preset = db.query(ReportUserPreference).filter(
            and_(
                ReportUserPreference.id == preset_id,
                ReportUserPreference.user_id == current_user.id,
                ReportUserPreference.preference_type == PAYROLL_DATA_MODAL_PRESET
            )
        ).first()

        if not preset:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="预设不存在或无权限访问"
            )

        # 取消其他默认预设
        db.query(ReportUserPreference).filter(
            and_(
                ReportUserPreference.user_id == current_user.id,
                ReportUserPreference.preference_type == PAYROLL_DATA_MODAL_PRESET,
                ReportUserPreference.id != preset_id
            )
        ).update({
            ReportUserPreference.preference_config: 
                ReportUserPreference.preference_config.op('||')('{"is_default": false}')
        })

        # 设置当前预设为默认
        current_config = preset.preference_config.copy()
        current_config['is_default'] = True
        preset.preference_config = current_config
        
        db.commit()

        return {"message": "默认预设设置成功"}

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        log_api_call(
            endpoint=f"/user-preferences/payroll-data-modal/{preset_id}/set-default",
            method="POST",
            user_id=current_user.id,
            status="error",
            error_message=str(e)
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"设置默认预设失败: {str(e)}"
        )


# ===== 预设分组相关API =====

@router.get("/groups", response_model=PresetGroupListResponse)
async def get_preset_groups(
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """获取用户的预设分组列表"""
    try:
        groups = db.query(ReportUserPreferenceGroup).filter(
            and_(
                ReportUserPreferenceGroup.user_id == current_user.id,
                ReportUserPreferenceGroup.is_active == True
            )
        ).order_by(ReportUserPreferenceGroup.sort_order, ReportUserPreferenceGroup.created_at).all()

        group_responses = []
        for group in groups:
            group_responses.append(PresetGroupResponse(
                id=group.id,
                user_id=group.user_id,
                name=group.name,
                description=group.description,
                color=group.color,
                icon=group.icon,
                sort_order=group.sort_order,
                is_active=group.is_active,
                created_at=group.created_at,
                updated_at=group.updated_at
            ))

        return PresetGroupListResponse(
            groups=group_responses,
            total=len(group_responses)
        )

    except Exception as e:
        log_api_call(
            endpoint="/user-preferences/groups",
            method="GET",
            user_id=current_user.id,
            status="error",
            error_message=str(e)
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取分组列表失败: {str(e)}"
        )


@router.post("/groups", response_model=PresetGroupResponse)
async def create_preset_group(
    group_data: PresetGroupCreate,
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """创建预设分组"""
    try:
        # 检查分组名称是否已存在
        existing = db.query(ReportUserPreferenceGroup).filter(
            and_(
                ReportUserPreferenceGroup.user_id == current_user.id,
                ReportUserPreferenceGroup.name == group_data.name,
                ReportUserPreferenceGroup.is_active == True
            )
        ).first()

        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"分组名称 '{group_data.name}' 已存在"
            )

        # 创建新分组
        new_group = ReportUserPreferenceGroup(
            user_id=current_user.id,
            name=group_data.name,
            description=group_data.description,
            color=group_data.color,
            icon=group_data.icon,
            sort_order=group_data.sort_order,
            is_active=group_data.is_active
        )

        db.add(new_group)
        db.commit()
        db.refresh(new_group)

        return PresetGroupResponse(
            id=new_group.id,
            user_id=new_group.user_id,
            name=new_group.name,
            description=new_group.description,
            color=new_group.color,
            icon=new_group.icon,
            sort_order=new_group.sort_order,
            is_active=new_group.is_active,
            created_at=new_group.created_at,
            updated_at=new_group.updated_at
        )

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        log_api_call(
            endpoint="/user-preferences/groups",
            method="POST",
            user_id=current_user.id,
            status="error",
            error_message=str(e)
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"创建分组失败: {str(e)}"
        )


@router.put("/groups/{group_id}", response_model=PresetGroupResponse)
async def update_preset_group(
    group_id: int,
    group_data: PresetGroupUpdate,
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """更新预设分组"""
    try:
        # 查找分组
        group = db.query(ReportUserPreferenceGroup).filter(
            and_(
                ReportUserPreferenceGroup.id == group_id,
                ReportUserPreferenceGroup.user_id == current_user.id
            )
        ).first()

        if not group:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="分组不存在或无权限访问"
            )

        # 检查名称冲突（如果更新了名称）
        if group_data.name and group_data.name != group.name:
            existing = db.query(ReportUserPreferenceGroup).filter(
                and_(
                    ReportUserPreferenceGroup.user_id == current_user.id,
                    ReportUserPreferenceGroup.name == group_data.name,
                    ReportUserPreferenceGroup.is_active == True,
                    ReportUserPreferenceGroup.id != group_id
                )
            ).first()

            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"分组名称 '{group_data.name}' 已存在"
                )

        # 更新分组属性
        if group_data.name is not None:
            group.name = group_data.name
        if group_data.description is not None:
            group.description = group_data.description
        if group_data.color is not None:
            group.color = group_data.color
        if group_data.icon is not None:
            group.icon = group_data.icon
        if group_data.sort_order is not None:
            group.sort_order = group_data.sort_order
        if group_data.is_active is not None:
            group.is_active = group_data.is_active

        db.commit()
        db.refresh(group)

        return PresetGroupResponse(
            id=group.id,
            user_id=group.user_id,
            name=group.name,
            description=group.description,
            color=group.color,
            icon=group.icon,
            sort_order=group.sort_order,
            is_active=group.is_active,
            created_at=group.created_at,
            updated_at=group.updated_at
        )

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        log_api_call(
            endpoint=f"/user-preferences/groups/{group_id}",
            method="PUT",
            user_id=current_user.id,
            status="error",
            error_message=str(e)
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"更新分组失败: {str(e)}"
        )


@router.delete("/groups/{group_id}")
async def delete_preset_group(
    group_id: int,
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """删除预设分组"""
    try:
        # 查找分组
        group = db.query(ReportUserPreferenceGroup).filter(
            and_(
                ReportUserPreferenceGroup.id == group_id,
                ReportUserPreferenceGroup.user_id == current_user.id
            )
        ).first()

        if not group:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="分组不存在或无权限访问"
            )

        # 检查是否有关联的预设
        preset_count = db.query(ReportUserPreference).filter(
            and_(
                ReportUserPreference.user_id == current_user.id,
                ReportUserPreference.preference_type == PAYROLL_DATA_MODAL_PRESET,
                ReportUserPreference.preference_config.op('->>')('category') == group.name
            )
        ).count()

        if preset_count > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"无法删除分组，还有 {preset_count} 个预设使用此分组"
            )

        db.delete(group)
        db.commit()

        return {"message": "分组删除成功"}

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        log_api_call(
            endpoint=f"/user-preferences/groups/{group_id}",
            method="DELETE",
            user_id=current_user.id,
            status="error",
            error_message=str(e)
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"删除分组失败: {str(e)}"
        )


@router.get("/groups/stats", response_model=List[PresetGroupStatsResponse])
async def get_preset_groups_stats(
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """获取预设分组统计信息"""
    try:
        # 获取用户的所有分组
        groups = db.query(ReportUserPreferenceGroup).filter(
            and_(
                ReportUserPreferenceGroup.user_id == current_user.id,
                ReportUserPreferenceGroup.is_active == True
            )
        ).all()

        stats = []
        for group in groups:
            # 统计该分组下的预设数量
            preset_count = db.query(ReportUserPreference).filter(
                and_(
                    ReportUserPreference.user_id == current_user.id,
                    ReportUserPreference.preference_type == PAYROLL_DATA_MODAL_PRESET,
                    ReportUserPreference.preference_config.op('->>')('category') == group.name
                )
            ).count()

            # 获取最近使用时间
            latest_preset = db.query(ReportUserPreference).filter(
                and_(
                    ReportUserPreference.user_id == current_user.id,
                    ReportUserPreference.preference_type == PAYROLL_DATA_MODAL_PRESET,
                    ReportUserPreference.preference_config.op('->>')('category') == group.name,
                    ReportUserPreference.preference_config.op('->>')('last_used_at').isnot(None)
                )
            ).order_by(
                ReportUserPreference.preference_config.op('->>')('last_used_at').desc()
            ).first()

            last_used_at = None
            if latest_preset and latest_preset.preference_config.get('last_used_at'):
                from datetime import datetime
                last_used_at = datetime.fromisoformat(latest_preset.preference_config['last_used_at'])

            stats.append(PresetGroupStatsResponse(
                group_id=group.id,
                preset_count=preset_count,
                last_used_at=last_used_at
            ))

        return stats

    except Exception as e:
        log_api_call(
            endpoint="/user-preferences/groups/stats",
            method="GET",
            user_id=current_user.id,
            status="error",
            error_message=str(e)
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取分组统计失败: {str(e)}"
        )


@router.put("/groups/reorder")
async def reorder_preset_groups(
    reorder_data: PresetGroupReorderRequest,
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """重新排序预设分组"""
    try:
        # 验证所有分组ID都属于当前用户
        user_groups = db.query(ReportUserPreferenceGroup).filter(
            and_(
                ReportUserPreferenceGroup.user_id == current_user.id,
                ReportUserPreferenceGroup.id.in_(reorder_data.group_ids)
            )
        ).all()

        if len(user_groups) != len(reorder_data.group_ids):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="包含无效的分组ID"
            )

        # 更新排序
        for index, group_id in enumerate(reorder_data.group_ids):
            db.query(ReportUserPreferenceGroup).filter(
                and_(
                    ReportUserPreferenceGroup.id == group_id,
                    ReportUserPreferenceGroup.user_id == current_user.id
                )
            ).update({ReportUserPreferenceGroup.sort_order: index})

        db.commit()

        return {"message": "分组排序更新成功"}

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        log_api_call(
            endpoint="/user-preferences/groups/reorder",
            method="PUT",
            user_id=current_user.id,
            status="error",
            error_message=str(e)
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"更新分组排序失败: {str(e)}"
        ) 