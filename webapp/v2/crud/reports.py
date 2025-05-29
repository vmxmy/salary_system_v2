from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import text, inspect
from ..models.reports import (
    ReportDataSource, ReportDataSourceField, ReportCalculatedField,
    ReportTemplate, ReportTemplateField, ReportExecution
)
from ..pydantic_models.reports import (
    ReportDataSourceCreate, ReportDataSourceUpdate,
    ReportDataSourceFieldCreate, ReportDataSourceFieldUpdate,
    ReportCalculatedFieldCreate, ReportCalculatedFieldUpdate,
    ReportTemplateCreate, ReportTemplateUpdate,
    ReportTemplateFieldCreate, ReportTemplateFieldUpdate,
    ReportExecutionCreate, DataSourceFieldDetection, DetectedField
)


# 数据源CRUD
class ReportDataSourceCRUD:
    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 100) -> List[ReportDataSource]:
        return db.query(ReportDataSource).offset(skip).limit(limit).all()

    @staticmethod
    def get_by_id(db: Session, data_source_id: int) -> Optional[ReportDataSource]:
        return db.query(ReportDataSource).filter(ReportDataSource.id == data_source_id).first()

    @staticmethod
    def create(db: Session, data_source: ReportDataSourceCreate, user_id: int) -> ReportDataSource:
        db_data_source = ReportDataSource(
            **data_source.dict(exclude={'fields'}),
            created_by=user_id
        )
        db.add(db_data_source)
        db.flush()

        # 添加字段
        for field_data in data_source.fields:
            db_field = ReportDataSourceField(
                **field_data.dict(),
                data_source_id=db_data_source.id
            )
            db.add(db_field)

        db.commit()
        db.refresh(db_data_source)
        return db_data_source

    @staticmethod
    def update(db: Session, data_source_id: int, data_source: ReportDataSourceUpdate) -> Optional[ReportDataSource]:
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
        db_data_source = db.query(ReportDataSource).filter(ReportDataSource.id == data_source_id).first()
        if db_data_source:
            db.delete(db_data_source)
            db.commit()
            return True
        return False

    @staticmethod
    def detect_fields(db: Session, detection: DataSourceFieldDetection) -> List[DetectedField]:
        """检测数据源表的字段信息"""
        try:
            # 使用SQLAlchemy的inspect功能获取表结构
            inspector = inspect(db.bind)
            columns = inspector.get_columns(detection.table_name, schema=detection.schema_name)
            
            detected_fields = []
            for column in columns:
                detected_fields.append(DetectedField(
                    field_name=column['name'],
                    field_type=str(column['type']),
                    is_nullable=column['nullable'],
                    comment=column.get('comment')
                ))
            
            return detected_fields
        except Exception as e:
            # 如果inspect失败，尝试使用SQL查询
            try:
                sql = text(f"""
                    SELECT 
                        column_name,
                        data_type,
                        is_nullable,
                        column_comment
                    FROM information_schema.columns 
                    WHERE table_name = :table_name 
                    AND table_schema = :schema_name
                    ORDER BY ordinal_position
                """)
                
                result = db.execute(sql, {
                    'table_name': detection.table_name,
                    'schema_name': detection.schema_name
                })
                
                detected_fields = []
                for row in result:
                    detected_fields.append(DetectedField(
                        field_name=row.column_name,
                        field_type=row.data_type,
                        is_nullable=row.is_nullable == 'YES',
                        comment=row.column_comment
                    ))
                
                return detected_fields
            except Exception:
                return []


# 数据源字段CRUD
class ReportDataSourceFieldCRUD:
    @staticmethod
    def get_by_data_source(db: Session, data_source_id: int) -> List[ReportDataSourceField]:
        return db.query(ReportDataSourceField).filter(
            ReportDataSourceField.data_source_id == data_source_id
        ).order_by(ReportDataSourceField.sort_order).all()

    @staticmethod
    def create(db: Session, field: ReportDataSourceFieldCreate) -> ReportDataSourceField:
        db_field = ReportDataSourceField(**field.dict())
        db.add(db_field)
        db.commit()
        db.refresh(db_field)
        return db_field

    @staticmethod
    def update(db: Session, field_id: int, field: ReportDataSourceFieldUpdate) -> Optional[ReportDataSourceField]:
        db_field = db.query(ReportDataSourceField).filter(ReportDataSourceField.id == field_id).first()
        if db_field:
            update_data = field.dict(exclude_unset=True)
            for field_name, value in update_data.items():
                setattr(db_field, field_name, value)
            db.commit()
            db.refresh(db_field)
        return db_field

    @staticmethod
    def delete(db: Session, field_id: int) -> bool:
        db_field = db.query(ReportDataSourceField).filter(ReportDataSourceField.id == field_id).first()
        if db_field:
            db.delete(db_field)
            db.commit()
            return True
        return False


# 计算字段CRUD
class ReportCalculatedFieldCRUD:
    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 100, is_global: Optional[bool] = None) -> List[ReportCalculatedField]:
        query = db.query(ReportCalculatedField)
        if is_global is not None:
            query = query.filter(ReportCalculatedField.is_global == is_global)
        return query.offset(skip).limit(limit).all()

    @staticmethod
    def get_by_id(db: Session, field_id: int) -> Optional[ReportCalculatedField]:
        return db.query(ReportCalculatedField).filter(ReportCalculatedField.id == field_id).first()

    @staticmethod
    def create(db: Session, field: ReportCalculatedFieldCreate, user_id: int) -> ReportCalculatedField:
        db_field = ReportCalculatedField(**field.dict(), created_by=user_id)
        db.add(db_field)
        db.commit()
        db.refresh(db_field)
        return db_field

    @staticmethod
    def update(db: Session, field_id: int, field: ReportCalculatedFieldUpdate) -> Optional[ReportCalculatedField]:
        db_field = db.query(ReportCalculatedField).filter(ReportCalculatedField.id == field_id).first()
        if db_field:
            update_data = field.dict(exclude_unset=True)
            for field_name, value in update_data.items():
                setattr(db_field, field_name, value)
            db.commit()
            db.refresh(db_field)
        return db_field

    @staticmethod
    def delete(db: Session, field_id: int) -> bool:
        db_field = db.query(ReportCalculatedField).filter(ReportCalculatedField.id == field_id).first()
        if db_field:
            db.delete(db_field)
            db.commit()
            return True
        return False

    @staticmethod
    def test_formula(db: Session, formula: str, data_source_id: Optional[int] = None) -> Dict[str, Any]:
        """测试计算公式"""
        try:
            # 这里可以实现公式验证逻辑
            # 简单示例：检查公式语法
            if not formula.strip():
                return {"valid": False, "error": "公式不能为空"}
            
            # 可以添加更复杂的公式验证逻辑
            return {"valid": True, "result": "公式语法正确"}
        except Exception as e:
            return {"valid": False, "error": str(e)}


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
        db_template = ReportTemplate(
            **template.dict(exclude={'fields'}),
            created_by=user_id
        )
        db.add(db_template)
        db.flush()

        # 添加字段
        for field_data in template.fields:
            db_field = ReportTemplateField(
                **field_data.dict(),
                template_id=db_template.id
            )
            db.add(db_field)

        db.commit()
        db.refresh(db_template)
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


# 报表模板字段CRUD
class ReportTemplateFieldCRUD:
    @staticmethod
    def get_by_template(db: Session, template_id: int) -> List[ReportTemplateField]:
        return db.query(ReportTemplateField).filter(
            ReportTemplateField.template_id == template_id
        ).order_by(ReportTemplateField.display_order).all()

    @staticmethod
    def create(db: Session, field: ReportTemplateFieldCreate) -> ReportTemplateField:
        db_field = ReportTemplateField(**field.dict())
        db.add(db_field)
        db.commit()
        db.refresh(db_field)
        return db_field

    @staticmethod
    def update(db: Session, field_id: int, field: ReportTemplateFieldUpdate) -> Optional[ReportTemplateField]:
        db_field = db.query(ReportTemplateField).filter(ReportTemplateField.id == field_id).first()
        if db_field:
            update_data = field.dict(exclude_unset=True)
            for field_name, value in update_data.items():
                setattr(db_field, field_name, value)
            db.commit()
            db.refresh(db_field)
        return db_field

    @staticmethod
    def delete(db: Session, field_id: int) -> bool:
        db_field = db.query(ReportTemplateField).filter(ReportTemplateField.id == field_id).first()
        if db_field:
            db.delete(db_field)
            db.commit()
            return True
        return False


# 报表执行CRUD
class ReportExecutionCRUD:
    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 100) -> List[ReportExecution]:
        return db.query(ReportExecution).offset(skip).limit(limit).all()

    @staticmethod
    def get_by_id(db: Session, execution_id: int) -> Optional[ReportExecution]:
        return db.query(ReportExecution).filter(ReportExecution.id == execution_id).first()

    @staticmethod
    def create(db: Session, execution: ReportExecutionCreate, user_id: int) -> ReportExecution:
        db_execution = ReportExecution(**execution.dict(), executed_by=user_id)
        db.add(db_execution)
        db.commit()
        db.refresh(db_execution)
        return db_execution

    @staticmethod
    def update_status(db: Session, execution_id: int, status: str, 
                     result_count: Optional[int] = None, 
                     execution_time: Optional[float] = None,
                     error_message: Optional[str] = None,
                     file_path: Optional[str] = None) -> Optional[ReportExecution]:
        db_execution = db.query(ReportExecution).filter(ReportExecution.id == execution_id).first()
        if db_execution:
            db_execution.status = status
            if result_count is not None:
                db_execution.result_count = result_count
            if execution_time is not None:
                db_execution.execution_time = execution_time
            if error_message is not None:
                db_execution.error_message = error_message
            if file_path is not None:
                db_execution.file_path = file_path
            db.commit()
            db.refresh(db_execution)
        return db_execution 