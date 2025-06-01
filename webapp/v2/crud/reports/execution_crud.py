"""
执行记录CRUD操作模块
负责报表执行记录的管理
"""

from typing import List, Optional
from sqlalchemy.orm import Session
from ...models.reports import ReportExecution
from ...pydantic_models.reports import ReportExecutionCreate


class ReportExecutionCRUD:
    """报表执行记录CRUD操作类"""
    
    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 100) -> List[ReportExecution]:
        """获取所有执行记录"""
        return db.query(ReportExecution).offset(skip).limit(limit).all()

    @staticmethod
    def get_by_id(db: Session, execution_id: int) -> Optional[ReportExecution]:
        """根据ID获取执行记录"""
        return db.query(ReportExecution).filter(ReportExecution.id == execution_id).first()

    @staticmethod
    def create(db: Session, execution: ReportExecutionCreate, user_id: int) -> ReportExecution:
        """创建执行记录"""
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
        """更新执行状态"""
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
