"""
模板CRUD操作模块
负责报表模板的基本操作
"""

from typing import List, Optional
from sqlalchemy.orm import Session  
from ...models.reports import ReportTemplate
from ...pydantic_models.reports import ReportTemplateCreate, ReportTemplateUpdate


class ReportTemplateCRUD:
    """报表模板CRUD操作类"""
    
    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 100, is_public: Optional[bool] = None) -> List[ReportTemplate]:
        """获取所有模板"""
        query = db.query(ReportTemplate)
        if is_public is not None:
            query = query.filter(ReportTemplate.is_public == is_public)
        return query.offset(skip).limit(limit).all()
    
    @staticmethod
    def get_by_id(db: Session, template_id: int) -> Optional[ReportTemplate]:
        """根据ID获取模板"""
        return db.query(ReportTemplate).filter(ReportTemplate.id == template_id).first()
    
    @staticmethod
    def create(db: Session, template: ReportTemplateCreate, user_id: int) -> ReportTemplate:
        """创建模板"""
        # 排除template_config中的fields，单独处理
        template_data_for_db = template.dict(exclude_none=True)
        
        # 确保template_config被保留，如果不存在则使用空字典
        actual_template_config_for_db = template_data_for_db.pop('template_config', {})
        if actual_template_config_for_db is None:
            actual_template_config_for_db = {}

        db_template = ReportTemplate(
            **template_data_for_db,
            template_config=actual_template_config_for_db,
            created_by=user_id,
            usage_count=0
        )
        db.add(db_template)
        db.flush()  # 获取db_template.id用于ReportTemplateField实例

        # 如果template_config.fields存在，添加字段
        if template.template_config and template.template_config.fields:
            from ...models.reports import ReportTemplateField
            for field_data_from_config in template.template_config.fields:
                field_to_create_data = {
                    "template_id": db_template.id,
                    "field_name": field_data_from_config.field_name,
                    "field_alias": field_data_from_config.field_alias,
                    "data_source": field_data_from_config.source_data_source_id or field_data_from_config.data_source,
                    "field_type": field_data_from_config.field_type,
                    "display_order": field_data_from_config.display_order,
                    "is_visible": field_data_from_config.is_visible,
                    "is_sortable": field_data_from_config.is_sortable,
                    "is_filterable": field_data_from_config.is_filterable,
                    "width": field_data_from_config.width,
                    "formatting_config": field_data_from_config.formatting_config.dict(exclude_none=True) if field_data_from_config.formatting_config else None,
                    "calculation_formula": field_data_from_config.calculation_formula,
                }
                db_field = ReportTemplateField(**field_to_create_data)
                db.add(db_field)

        db.commit()
        db.refresh(db_template)
        return db_template
    
    @staticmethod
    def update(db: Session, template_id: int, template: ReportTemplateUpdate) -> Optional[ReportTemplate]:
        """更新模板"""
        db_template = db.query(ReportTemplate).filter(ReportTemplate.id == template_id).first()
        if db_template:
            update_data = template.dict(exclude_unset=True)
            for field, value in update_data.items():
                setattr(db_template, field, value)
            db.commit()
            db.refresh(db_template)
        return db_template

    @staticmethod
    def increment_usage(db: Session, template_id: int):
        """增加模板使用次数"""
        db_template = db.query(ReportTemplate).filter(ReportTemplate.id == template_id).first()
        if db_template:
            db_template.usage_count = (db_template.usage_count or 0) + 1
            db.commit()
        
    @staticmethod
    def delete(db: Session, template_id: int) -> bool:
        """删除模板"""
        db_template = db.query(ReportTemplate).filter(ReportTemplate.id == template_id).first()
        if db_template:
            db.delete(db_template)
            db.commit()
            return True
        return False
