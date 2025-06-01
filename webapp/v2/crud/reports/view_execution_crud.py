"""
视图执行记录CRUD操作模块
负责报表视图执行记录的管理
"""

from typing import List, Optional
from sqlalchemy.orm import Session
from ...models.reports import ReportViewExecution
from ...pydantic_models.reports import ReportViewExecutionCreate


class ReportViewExecutionCRUD:
    """报表视图执行记录CRUD操作类"""
    
    @staticmethod
    def create(db: Session, execution_data: ReportViewExecutionCreate, executed_by: int) -> ReportViewExecution:
        """创建视图执行记录"""
        db_execution = ReportViewExecution(
            report_view_id=execution_data.report_view_id,
            execution_params=execution_data.execution_params,
            executed_by=executed_by,
            status="running"
        )
        db.add(db_execution)
        db.commit()
        db.refresh(db_execution)
        return db_execution
    
    @staticmethod
    def get_by_view_id(db: Session, view_id: int, skip: int = 0, limit: int = 100) -> List[ReportViewExecution]:
        """根据视图ID获取执行记录"""
        return db.query(ReportViewExecution).filter(
            ReportViewExecution.view_id == view_id
        ).order_by(ReportViewExecution.executed_at.desc()).offset(skip).limit(limit).all()
    
    @staticmethod
    def update_execution_result(db: Session, execution_id: int, result_count: int = None, 
                              execution_time: float = None, status: str = "success", 
                              error_message: str = None, file_path: str = None, file_size: int = None) -> Optional[ReportViewExecution]:
        """更新执行结果"""
        db_execution = db.query(ReportViewExecution).filter(ReportViewExecution.id == execution_id).first()
        if db_execution:
            if result_count is not None:
                db_execution.result_count = result_count
            if execution_time is not None:
                db_execution.execution_time = execution_time
            db_execution.status = status
            if error_message:
                db_execution.error_message = error_message
            if file_path is not None:
                db_execution.file_path = file_path
            if file_size is not None:
                db_execution.file_size = file_size
            db.commit()
            db.refresh(db_execution)
        return db_execution
