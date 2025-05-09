from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from sqlalchemy.orm import Session
import datetime

from .. import auth, models_db, schemas
from ..database import get_db
from pydantic import BaseModel, Field
import logging

# 配置logger
logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/table-configs",
    tags=["Table Configurations"]
)

# --- Pydantic模型 ---

class TableConfigBase(BaseModel):
    table_id: str = Field(..., description="表格标识符，如'salaryTable'")
    name: str = Field(..., description="配置名称")
    is_default: bool = Field(False, description="是否为默认配置")
    is_shared: bool = Field(False, description="是否共享给其他用户")

class TableLayoutCreate(TableConfigBase):
    config_data: dict = Field(..., description="表格布局配置数据")

class TableLayoutUpdate(BaseModel):
    name: Optional[str] = Field(None, description="配置名称")
    config_data: Optional[dict] = Field(None, description="表格布局配置数据")
    is_default: Optional[bool] = Field(None, description="是否为默认配置")
    is_shared: Optional[bool] = Field(None, description="是否共享给其他用户")

class FilterPresetCreate(TableConfigBase):
    config_data: dict = Field(..., description="筛选方案配置数据")

class FilterPresetUpdate(BaseModel):
    name: Optional[str] = Field(None, description="配置名称")
    config_data: Optional[dict] = Field(None, description="筛选方案配置数据")
    is_default: Optional[bool] = Field(None, description="是否为默认配置")
    is_shared: Optional[bool] = Field(None, description="是否共享给其他用户")

class TableConfigResponse(TableConfigBase):
    id: int
    user_id: int
    config_type: str
    created_at: str
    updated_at: str
    config_data: dict  # 添加 config_data 字段

    class Config:
        orm_mode = True
        json_encoders = {
            datetime.datetime: lambda v: v.isoformat()
        }

# --- 表格布局配置API ---

@router.post("/layouts", response_model=TableConfigResponse)
async def create_table_layout(
    layout: TableLayoutCreate,
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(auth.get_current_user)
):
    """创建新的表格布局配置"""
    return models_db.create_table_config(
        db=db,
        user_id=current_user.id,
        table_id=layout.table_id,
        config_type="LAYOUT",
        name=layout.name,
        config_data=layout.config_data,
        is_default=layout.is_default,
        is_shared=layout.is_shared
    )

@router.get("/layouts", response_model=List[TableConfigResponse])
async def get_table_layouts(
    table_id: str = Query(..., description="表格标识符"),
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(auth.get_current_user)
):
    """获取用户的表格布局配置列表"""
    return models_db.get_table_configs(
        db=db,
        user_id=current_user.id,
        table_id=table_id,
        config_type="LAYOUT"
    )

@router.put("/layouts/{config_id}", response_model=TableConfigResponse)
async def update_table_layout(
    config_id: int,
    layout: TableLayoutUpdate,
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(auth.get_current_user)
):
    """更新表格布局配置"""
    updated_config = models_db.update_table_config(
        db=db,
        config_id=config_id,
        user_id=current_user.id,
        config_data=layout.config_data,
        name=layout.name,
        is_default=layout.is_default,
        is_shared=layout.is_shared
    )

    if not updated_config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="配置不存在或不属于当前用户"
        )

    return updated_config

@router.delete("/layouts/{config_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_table_layout(
    config_id: int,
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(auth.get_current_user)
):
    """删除表格布局配置"""
    result = models_db.delete_table_config(
        db=db,
        config_id=config_id,
        user_id=current_user.id
    )

    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="配置不存在或不属于当前用户"
        )

    return None

# --- 高级筛选配置API ---

@router.post("/filters", response_model=TableConfigResponse)
async def create_filter_preset(
    filter_preset: FilterPresetCreate,
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(auth.get_current_user)
):
    """创建新的筛选方案配置"""
    return models_db.create_table_config(
        db=db,
        user_id=current_user.id,
        table_id=filter_preset.table_id,
        config_type="FILTER",
        name=filter_preset.name,
        config_data=filter_preset.config_data,
        is_default=filter_preset.is_default,
        is_shared=filter_preset.is_shared
    )

@router.get("/filters", response_model=List[TableConfigResponse])
async def get_filter_presets(
    table_id: str = Query(..., description="表格标识符"),
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(auth.get_current_user)
):
    """获取用户的筛选方案配置列表"""
    return models_db.get_table_configs(
        db=db,
        user_id=current_user.id,
        table_id=table_id,
        config_type="FILTER"
    )

@router.put("/filters/{config_id}", response_model=TableConfigResponse)
async def update_filter_preset(
    config_id: int,
    filter_preset: FilterPresetUpdate,
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(auth.get_current_user)
):
    """更新筛选方案配置"""
    updated_config = models_db.update_table_config(
        db=db,
        config_id=config_id,
        user_id=current_user.id,
        config_data=filter_preset.config_data,
        name=filter_preset.name,
        is_default=filter_preset.is_default,
        is_shared=filter_preset.is_shared
    )

    if not updated_config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="配置不存在或不属于当前用户"
        )

    return updated_config

@router.delete("/filters/{config_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_filter_preset(
    config_id: int,
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(auth.get_current_user)
):
    """删除筛选方案配置"""
    result = models_db.delete_table_config(
        db=db,
        config_id=config_id,
        user_id=current_user.id
    )

    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="配置不存在或不属于当前用户"
        )

    return None