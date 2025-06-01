from typing import List, Optional
from sqlalchemy.orm import Session
from ...models.reports import ReportViewExecution
from ...pydantic_models.reports import ReportViewExecutionCreate


class ReportViewExecutionCRUD:
    """报表视图执行记录CRUD操作"""
    
    @staticmethod
    def create(db: Session, execution_data: ReportViewExecutionCreate, executed_by: int) -> ReportViewExecution:
        """创建执行记录"""
        from ...models.reports import ReportViewExecution
        
        db_execution = ReportViewExecution(
            **execution_data.dict(),
            executed_by=executed_by
        )
        db.add(db_execution)
        db.commit()
        db.refresh(db_execution)
        return db_execution
    
    @staticmethod
    def get_by_view_id(db: Session, view_id: int, skip: int = 0, limit: int = 100) -> List[ReportViewExecution]:
        """获取指定视图的执行记录"""
        return db.query(ReportViewExecution).filter(
            ReportViewExecution.report_view_id == view_id
        ).order_by(ReportViewExecution.executed_at.desc()).offset(skip).limit(limit).all()
    
    @staticmethod
    def update_execution_result(db: Session, execution_id: int, result_count: int = None, 
                              execution_time: float = None, status: str = "success", 
                              error_message: str = None) -> Optional[ReportViewExecution]:
        """更新执行结果"""
        db_execution = db.query(ReportViewExecution).filter(ReportViewExecution.id == execution_id).first()
        if not db_execution:
            return None
        
        if result_count is not None:
            db_execution.result_count = result_count
        if execution_time is not None:
            db_execution.execution_time = execution_time
        if status:
            db_execution.status = status
        if error_message:
            db_execution.error_message = error_message
        
        db.commit()
        db.refresh(db_execution)
        return db_execution 