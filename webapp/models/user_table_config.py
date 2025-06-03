from typing import Optional, List, Dict, Any, TYPE_CHECKING
import logging
import uuid

from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, TIMESTAMP, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Session, relationship
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from fastapi import HTTPException, status

# 导入Base类
from webapp.database import Base

if TYPE_CHECKING:
    from .user import User

logger = logging.getLogger(__name__)

# --- 用户表格配置模型 ---
class UserTableConfig(Base):
    __tablename__ = 'user_table_configs'
    __table_args__ = (
        UniqueConstraint('user_id', 'table_id', 'config_type', 'name', name='uq_user_table_config'),
        {'schema': 'core'}
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('core.users.id', ondelete='CASCADE'), nullable=False, index=True)
    table_id = Column(String(50), nullable=False, index=True)
    config_type = Column(String(20), nullable=False)  # 'LAYOUT' 或 'FILTER'
    name = Column(String(100), nullable=False)
    config_data = Column(JSONB, nullable=False)
    is_default = Column(Boolean, default=False)
    is_shared = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # 关联到用户 - 使用字符串引用避免循环导入
    user = relationship("User", back_populates="table_configs")

# --- ORM CRUD Functions for User Table Configs --- START ---

def create_table_config(db: Session, user_id: int, table_id: str, config_type: str,
                       name: str, config_data: Dict[str, Any], is_default: bool = False,
                       is_shared: bool = False) -> UserTableConfig:
    """创建表格配置"""
    
    if is_default:
        db.query(UserTableConfig).filter(
            UserTableConfig.user_id == user_id,
            UserTableConfig.table_id == table_id,
            UserTableConfig.config_type == config_type,
            UserTableConfig.is_default == True
        ).update({"is_default": False}, synchronize_session=False) # Added synchronize_session

    db_config = UserTableConfig(
        user_id=user_id,
        table_id=table_id,
        config_type=config_type,
        name=name,
        config_data=config_data,
        is_default=is_default,
        is_shared=is_shared
    )

    try:
        db.add(db_config)
        db.commit()
        db.refresh(db_config)
        # No manual datetime to string conversion here, Pydantic models handle serialization
        return db_config
    except IntegrityError as e:
        db.rollback()
        logger.error(f"Integrity error creating table config: {e}", exc_info=True)
        # Assuming 'uq_user_table_config' is the unique constraint name for (user_id, table_id, config_type, name)
        if "uq_user_table_config" in str(e.orig).lower() or \
           (hasattr(e.orig, 'diag') and hasattr(e.orig.diag, 'constraint_name') and "uq_user_table_config" in e.orig.diag.constraint_name.lower()):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"配置名称 '{name}' 已存在于用户 {user_id} 的表格 '{table_id}' 和类型 '{config_type}' 下。"
            )
        else: # Generic integrity error
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"创建配置时发生数据库完整性错误: {e.orig}"
            ) from e
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"SQLAlchemy error creating table config: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="创建配置时发生数据库错误。"
        ) from e

def get_table_config(db: Session, config_id: int) -> Optional[UserTableConfig]:
    """获取单个表格配置"""
    
    try:
        return db.query(UserTableConfig).filter(
            UserTableConfig.id == config_id
        ).first()
    except SQLAlchemyError as e:
        logger.error(f"SQLAlchemy error fetching table config {config_id}: {e}", exc_info=True)
        return None

def get_table_configs(db: Session, user_id: int, table_id: str, config_type: str) -> List[UserTableConfig]:
    """获取用户的表格配置列表 (自己的和共享的)"""
    
    try:
        configs = db.query(UserTableConfig).filter(
            ((UserTableConfig.user_id == user_id) |
             (UserTableConfig.is_shared == True)),
            UserTableConfig.table_id == table_id,
            UserTableConfig.config_type == config_type
        ).order_by(
            UserTableConfig.is_default.desc(),
            UserTableConfig.updated_at.desc() # Assuming updated_at exists and is a DateTime
        ).all()
        # No manual datetime to string conversion here
        return configs
    except SQLAlchemyError as e:
        logger.error(f"SQLAlchemy error fetching table configs for user {user_id}, table {table_id}, type {config_type}: {e}", exc_info=True)
        return []

def update_table_config(db: Session, config_id: int, user_id: int, 
                        config_data: Optional[Dict[str, Any]] = None,
                        name: Optional[str] = None, 
                        is_default: Optional[bool] = None, 
                        is_shared: Optional[bool] = None) -> Optional[UserTableConfig]:
    """更新表格配置. 只有配置的拥有者可以更新."""
    
    db_config = db.query(UserTableConfig).filter(
        UserTableConfig.id == config_id,
        UserTableConfig.user_id == user_id
    ).first()

    if not db_config:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"配置 ID {config_id} 未找到或不属于用户 {user_id}。")


    update_fields_provided = False
    if config_data is not None:
        db_config.config_data = config_data
        update_fields_provided = True
    if name is not None:
        db_config.name = name
        update_fields_provided = True
    if is_shared is not None:
        db_config.is_shared = is_shared
        update_fields_provided = True

    if is_default is not None and is_default != db_config.is_default:
        update_fields_provided = True
        if is_default:
            db.query(UserTableConfig).filter(
                UserTableConfig.user_id == user_id,
                UserTableConfig.table_id == db_config.table_id,
                UserTableConfig.config_type == db_config.config_type,
                UserTableConfig.id != config_id,
                UserTableConfig.is_default == True
            ).update({"is_default": False}, synchronize_session=False) # Added synchronize_session
        db_config.is_default = is_default
    
    if not update_fields_provided and is_default is None: # No actual data change
        return db_config


    try:
        db.commit()
        db.refresh(db_config)
        return db_config
    except IntegrityError as e:
        db.rollback()
        logger.error(f"Integrity error updating table config {config_id}: {e}", exc_info=True)
        if "uq_user_table_config" in str(e.orig).lower() or \
           (hasattr(e.orig, 'diag') and hasattr(e.orig.diag, 'constraint_name') and "uq_user_table_config" in e.orig.diag.constraint_name.lower()):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"配置名称 '{name or db_config.name}' 已存在于用户 {user_id} 的表格 '{db_config.table_id}' 和类型 '{db_config.config_type}' 下。"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"更新配置时发生数据库完整性错误: {e.orig}"
            ) from e
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"SQLAlchemy error updating table config {config_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="更新配置时发生数据库错误。"
        ) from e

def delete_table_config(db: Session, config_id: int, user_id: int) -> bool:
    """删除表格配置. 只有配置的拥有者可以删除."""
    
    try:
        # First, check if the config exists and belongs to the user
        config_to_delete = db.query(UserTableConfig).filter(
            UserTableConfig.id == config_id,
            UserTableConfig.user_id == user_id
        ).first()

        if not config_to_delete:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"配置 ID {config_id} 未找到或不属于用户 {user_id}。")

        # If found, proceed with deletion
        db.delete(config_to_delete)
        db.commit()
        return True # Successfully deleted
    except SQLAlchemyError as e: # Catch any DB error during delete
        db.rollback()
        logger.error(f"SQLAlchemy error deleting table config {config_id} for user {user_id}: {e}", exc_info=True)
        return False # Deletion failed

# --- ORM CRUD Functions for User Table Configs --- END ---
