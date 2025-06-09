"""
数据源基础CRUD操作模块
负责数据源的基本增删改查操作
"""

from typing import List, Optional
from sqlalchemy.orm import Session
from ...models.reports import ReportDataSource
from ...pydantic_models.reports import ReportDataSourceCreate, ReportDataSourceUpdate


class ReportDataSourceBasicCRUD:
    """数据源基础CRUD操作类"""
    
    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 100) -> List[ReportDataSource]:
        """获取所有数据源"""
        return db.query(ReportDataSource).offset(skip).limit(limit).all()

    @staticmethod
    def get_by_id(db: Session, data_source_id: int) -> Optional[ReportDataSource]:
        """根据ID获取数据源"""
        return db.query(ReportDataSource).filter(ReportDataSource.id == data_source_id).first()

    @staticmethod
    def create(db: Session, data_source: ReportDataSourceCreate, user_id: int) -> ReportDataSource:
        """创建数据源"""
        try:
            # 现在使用动态字段获取，不再需要手动创建字段记录
            db_data_source = ReportDataSource(
                **data_source.dict(),
                created_by=user_id,
                enable_dynamic_fields=True,  # 默认启用动态字段
                field_grouping_enabled=True,  # 默认启用字段分组
                auto_infer_categories=True   # 默认启用自动推断分类
            )
            db.add(db_data_source)
            db.commit()
            db.refresh(db_data_source)
            return db_data_source
        except Exception as e:
            db.rollback()
            # 检查是否是唯一约束冲突
            if "uq_data_source_schema_table" in str(e):
                raise ValueError(f"数据源已存在：模式 '{data_source.schema_name}' 中的表 '{data_source.table_name}' 已经被其他数据源使用")
            elif "uq_report_data_sources_code" in str(e):
                raise ValueError(f"数据源编码 '{data_source.code}' 已存在，请使用不同的编码")
            else:
                raise e

    @staticmethod
    def update(db: Session, data_source_id: int, data_source: ReportDataSourceUpdate) -> Optional[ReportDataSource]:
        """更新数据源"""
        db_data_source = db.query(ReportDataSource).filter(ReportDataSource.id == data_source_id).first()
        if db_data_source:
            update_data = data_source.dict(exclude_unset=True)
            for field, value in update_data.items():
                setattr(db_data_source, field, value)
            db.commit()
            db.refresh(db_data_source)
        return db_data_source

    @staticmethod
    def delete(db: Session, data_source_id: int) -> bool:
        """删除数据源"""
        db_data_source = db.query(ReportDataSource).filter(ReportDataSource.id == data_source_id).first()
        if db_data_source:
            db.delete(db_data_source)
            db.commit()
            return True
        return False
