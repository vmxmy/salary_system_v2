from typing import List, Optional
from sqlalchemy.orm import Session
from ...models.reports import ReportTemplate, ReportTemplateField
from ...pydantic_models.reports import (
    ReportTemplateCreate, ReportTemplateUpdate
)


# 报表模板CRUD
class ReportTemplateCRUD:
    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 100, is_public: Optional[bool] = None) -> List[ReportTemplate]:
        query = db.query(ReportTemplate)
        if is_public is not None:
            query = query.filter(ReportTemplate.is_public == is_public)
        return query.offset(skip).limit(limit).all()

    @staticmethod
    def get_by_id(db: Session, template_id: int) -> Optional[ReportTemplate]:
        return db.query(ReportTemplate).filter(ReportTemplate.id == template_id).first()

    @staticmethod
    def create(db: Session, template: ReportTemplateCreate, user_id: int) -> ReportTemplate:
        # Exclude template_config from the initial ReportTemplate creation,
        # as its 'fields' part will be processed separately.
        # The rest of template_config (like reportTitle) is part of the JSONB column.
        template_data_for_db = template.dict(exclude_none=True)
        
        # Ensure template_config is preserved if it exists, otherwise use an empty dict
        # The ReportTemplate model expects a dict for template_config.
        actual_template_config_for_db = template_data_for_db.pop('template_config', {})
        if actual_template_config_for_db is None: # handle if template_config was explicitly None in input
            actual_template_config_for_db = {}


        db_template = ReportTemplate(
            **template_data_for_db, # Pass other fields like name, description etc.
            template_config=actual_template_config_for_db, # Pass the main config object
            created_by=user_id,
            usage_count=0 # Ensure usage_count is initialized
        )
        db.add(db_template)
        db.flush() # Get the db_template.id for ReportTemplateField instances

        # Add fields from template_config.fields if template_config and its fields exist
        if template.template_config and template.template_config.fields:
            for field_data_from_config in template.template_config.fields:
                # Map ReportFieldPydantic to ReportTemplateField model structure
                field_to_create_data = {
                    "template_id": db_template.id,
                    "field_name": field_data_from_config.field_name,
                    "field_alias": field_data_from_config.field_alias,
                    # Use source_data_source_id if available, else the 'data_source' field itself
                    "data_source": field_data_from_config.source_data_source_id or field_data_from_config.data_source,
                    "field_type": field_data_from_config.field_type,
                    "display_order": field_data_from_config.display_order,
                    "is_visible": field_data_from_config.is_visible,
                    "is_sortable": field_data_from_config.is_sortable,
                    "is_filterable": field_data_from_config.is_filterable,
                    "width": field_data_from_config.width,
                    "formatting_config": field_data_from_config.formatting_config.dict(exclude_none=True) if field_data_from_config.formatting_config else None,
                    "calculation_formula": field_data_from_config.calculation_formula,
                    # Note: ReportTemplateField doesn't store 'aggregation' or 'qualified_field_name' directly.
                    # These remain part of the template_config JSON if needed for rendering.
                }
                db_field = ReportTemplateField(**field_to_create_data)
                db.add(db_field)

        db.commit()
        db.refresh(db_template)
        # Manually load the fields relationship if needed by the caller,
        # as db.refresh might not automatically populate it perfectly after this type of multi-stage creation.
        # db.refresh(db_template, ['fields']) # Or let the caller query it if necessary.
        return db_template

    @staticmethod
    def update(db: Session, template_id: int, template: ReportTemplateUpdate) -> Optional[ReportTemplate]:
        db_template = db.query(ReportTemplate).filter(ReportTemplate.id == template_id).first()
        if db_template:
            update_data = template.dict(exclude_unset=True)
            for field, value in update_data.items():
                setattr(db_template, field, value)
            db.commit()
            db.refresh(db_template)
        return db_template

    @staticmethod
    def delete(db: Session, template_id: int) -> bool:
        db_template = db.query(ReportTemplate).filter(ReportTemplate.id == template_id).first()
        if db_template:
            db.delete(db_template)
            db.commit()
            return True
        return False

    @staticmethod
    def increment_usage(db: Session, template_id: int):
        """增加模板使用次数"""
        db_template = db.query(ReportTemplate).filter(ReportTemplate.id == template_id).first()
        if db_template:
            db_template.usage_count += 1
            db.commit() 