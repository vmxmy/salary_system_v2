from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func # Removed text as it's used in helpers
from ...models.reports import ReportView
from ...pydantic_models.reports import ReportViewCreate, ReportViewUpdate
from ._report_view_helpers import (
    _sync_view_to_database_logic,
    _drop_database_view_logic,
    _validate_sql_logic,
    _query_view_data_logic
)

# 报表视图CRUD
class ReportViewCRUD:
    """报表视图CRUD操作"""
    
    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 100, category: str = None, is_active: bool = None) -> List[ReportView]:
        query = db.query(ReportView)
        if category:
            query = query.filter(ReportView.category == category)
        if is_active is not None:
            query = query.filter(ReportView.is_active == is_active)
        return query.offset(skip).limit(limit).all()
    
    @staticmethod
    def get_by_id(db: Session, view_id: int) -> Optional[ReportView]:
        return db.query(ReportView).filter(ReportView.id == view_id).first()
    
    @staticmethod
    def get_by_view_name(db: Session, view_name: str) -> Optional[ReportView]:
        return db.query(ReportView).filter(ReportView.view_name == view_name).first()
    
    @staticmethod
    def create(db: Session, view_data: ReportViewCreate, created_by: int) -> ReportView:
        db_view = ReportView(
            **view_data.dict(),
            created_by=created_by,
            view_status="draft"
        )
        db.add(db_view)
        db.commit()
        db.refresh(db_view)
        return db_view
    
    @staticmethod
    def update(db: Session, view_id: int, view_data: ReportViewUpdate) -> Optional[ReportView]:
        db_view = db.query(ReportView).filter(ReportView.id == view_id).first()
        if not db_view:
            return None
        
        update_data = view_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_view, field, value)
        
        if 'sql_query' in update_data:
            db_view.view_status = "draft"
            db_view.sync_error = None
        
        db.commit()
        db.refresh(db_view)
        return db_view
    
    @staticmethod
    def delete(db: Session, view_id: int) -> bool:
        db_view = db.query(ReportView).filter(ReportView.id == view_id).first()
        if not db_view:
            return False
        try:
            _drop_database_view_logic(db, db_view.schema_name, db_view.view_name)
            # If drop_database_view_logic doesn't commit, commit here or after delete.
            # For now, assuming it handles its transaction or commit is done after db.delete.
        except Exception as e:
            print(f"Warning: Failed to drop database view {db_view.schema_name}.{db_view.view_name}: {e}")
        
        db.delete(db_view)
        db.commit() # Commit after all operations
        return True
    
    @staticmethod
    def sync_view_to_database(db: Session, view_id: int, force_recreate: bool = False) -> bool:
        db_view = db.query(ReportView).filter(ReportView.id == view_id).first()
        if not db_view:
            return False
        
        success = _sync_view_to_database_logic(db, db_view, force_recreate)
        db.commit() # Commit after the logic function call
        return success
    
    @staticmethod
    def drop_database_view(db: Session, schema_name: str, view_name: str):
        _drop_database_view_logic(db, schema_name, view_name)
        db.commit() # Commit after the logic function call

    @staticmethod
    def validate_sql(db: Session, sql_query: str, schema_name: str = "reports") -> Dict[str, Any]:
        # _validate_sql_logic might involve DDL that needs its own transaction management
        # or be called within a transaction that can be rolled back.
        # For simplicity, assuming it's self-contained or commit/rollback is handled correctly within.
        result = _validate_sql_logic(db, sql_query, schema_name)
        # If _validate_sql_logic created temp views and didn't commit drop, ensure commit here if needed.
        # However, DDL like CREATE/DROP VIEW often auto-commits or needs careful transaction handling.
        # If it uses a separate transaction, no explicit commit needed here unless it modified db state to persist.
        # If it did, db.commit() might be needed. For now, assuming helper handles it or no commit needed.
        return result

    @staticmethod
    def query_view_data(db: Session, view_id: int, filters: Dict = None, sorting: List = None, 
                       page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        db_view = db.query(ReportView).filter(ReportView.id == view_id).first()
        if not db_view:
            raise ValueError("报表视图不存在")
        if db_view.view_status != "created":
            raise ValueError("视图尚未创建或创建失败")
            
        result = _query_view_data_logic(db, db_view, filters, sorting, page, page_size)
        db.commit() # Commit usage count and last_used_at updates
        return result 