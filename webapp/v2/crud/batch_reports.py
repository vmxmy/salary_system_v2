"""
批量报表生成相关的CRUD操作。
"""
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import func, and_, or_, desc
from typing import List, Optional, Tuple, Dict, Any
from datetime import datetime, timedelta
import logging
import os
import zipfile
import hashlib

from ..models.reports import BatchReportTask, BatchReportTaskItem, ReportFileManager
from ..models.security import User
from ..pydantic_models.reports import (
    BatchReportTaskCreate, BatchReportTaskUpdate, BatchReportTaskItemCreate, 
    BatchReportTaskItemUpdate, ReportFileManagerCreate, ReportFileManagerUpdate,
    BatchReportGenerationRequest
)

# 设置logger
logger = logging.getLogger(__name__)


# ==================== 批量报表任务 CRUD ====================

def create_batch_report_task(
    db: Session,
    task_data: BatchReportTaskCreate,
    user_id: int
) -> BatchReportTask:
    """
    创建批量报表任务
    
    Args:
        db: 数据库会话
        task_data: 任务创建数据
        user_id: 创建者ID
        
    Returns:
        创建的批量报表任务
    """
    try:
        # 创建主任务
        db_task = BatchReportTask(
            task_name=task_data.task_name,
            description=task_data.description,
            task_type=task_data.task_type,
            source_config=task_data.source_config,
            export_config=task_data.export_config,
            filter_config=task_data.filter_config,
            total_reports=len(task_data.report_items),
            created_by=user_id
        )
        
        db.add(db_task)
        db.flush()  # 获取任务ID
        
        # 创建任务项
        for i, item_data in enumerate(task_data.report_items):
            db_item = BatchReportTaskItem(
                task_id=db_task.id,
                report_type=item_data.get("report_type"),
                report_name=item_data.get("report_name"),
                report_config=item_data.get("report_config", {}),
                execution_order=i + 1
            )
            db.add(db_item)
        
        db.commit()
        db.refresh(db_task)
        
        logger.info(f"创建批量报表任务成功: {db_task.id}, 包含 {len(task_data.report_items)} 个报表项")
        return db_task
        
    except Exception as e:
        db.rollback()
        logger.error(f"创建批量报表任务失败: {str(e)}")
        raise


def get_batch_report_task(
    db: Session,
    task_id: int,
    user_id: Optional[int] = None
) -> Optional[BatchReportTask]:
    """
    获取批量报表任务详情
    
    Args:
        db: 数据库会话
        task_id: 任务ID
        user_id: 用户ID（用于权限检查）
        
    Returns:
        批量报表任务或None
    """
    query = db.query(BatchReportTask).options(
        selectinload(BatchReportTask.task_items),
        selectinload(BatchReportTask.creator)
    ).filter(BatchReportTask.id == task_id)
    
    if user_id:
        query = query.filter(BatchReportTask.created_by == user_id)
    
    return query.first()


def get_batch_report_tasks(
    db: Session,
    user_id: Optional[int] = None,
    status: Optional[str] = None,
    task_type: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
) -> Tuple[List[BatchReportTask], int]:
    """
    获取批量报表任务列表
    
    Args:
        db: 数据库会话
        user_id: 用户ID（筛选条件）
        status: 任务状态（筛选条件）
        task_type: 任务类型（筛选条件）
        skip: 跳过的记录数
        limit: 返回的记录数
        
    Returns:
        任务列表和总数
    """
    query = db.query(BatchReportTask).options(
        selectinload(BatchReportTask.creator)
    )
    
    # 应用筛选条件
    if user_id:
        query = query.filter(BatchReportTask.created_by == user_id)
    if status:
        query = query.filter(BatchReportTask.status == status)
    if task_type:
        query = query.filter(BatchReportTask.task_type == task_type)
    
    # 获取总数
    total = query.count()
    
    # 应用分页和排序
    tasks = query.order_by(desc(BatchReportTask.created_at)).offset(skip).limit(limit).all()
    
    return tasks, total


def update_batch_report_task(
    db: Session,
    task_id: int,
    task_update: BatchReportTaskUpdate,
    user_id: Optional[int] = None
) -> Optional[BatchReportTask]:
    """
    更新批量报表任务
    
    Args:
        db: 数据库会话
        task_id: 任务ID
        task_update: 更新数据
        user_id: 用户ID（用于权限检查）
        
    Returns:
        更新后的任务或None
    """
    try:
        query = db.query(BatchReportTask).filter(BatchReportTask.id == task_id)
        
        if user_id:
            query = query.filter(BatchReportTask.created_by == user_id)
        
        db_task = query.first()
        if not db_task:
            return None
        
        # 更新字段
        update_data = task_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_task, key, value)
        
        db_task.updated_at = func.now()
        db.commit()
        db.refresh(db_task)
        
        logger.info(f"更新批量报表任务成功: {task_id}")
        return db_task
        
    except Exception as e:
        db.rollback()
        logger.error(f"更新批量报表任务失败: {str(e)}")
        raise


def delete_batch_report_task(
    db: Session,
    task_id: int,
    user_id: Optional[int] = None
) -> bool:
    """
    删除批量报表任务
    
    Args:
        db: 数据库会话
        task_id: 任务ID
        user_id: 用户ID（用于权限检查）
        
    Returns:
        是否删除成功
    """
    try:
        query = db.query(BatchReportTask).filter(BatchReportTask.id == task_id)
        
        if user_id:
            query = query.filter(BatchReportTask.created_by == user_id)
        
        db_task = query.first()
        if not db_task:
            return False
        
        # 删除关联的文件
        if db_task.archive_file_path and os.path.exists(db_task.archive_file_path):
            os.remove(db_task.archive_file_path)
        
        # 删除任务项的文件
        for item in db_task.task_items:
            if item.file_path and os.path.exists(item.file_path):
                os.remove(item.file_path)
        
        db.delete(db_task)
        db.commit()
        
        logger.info(f"删除批量报表任务成功: {task_id}")
        return True
        
    except Exception as e:
        db.rollback()
        logger.error(f"删除批量报表任务失败: {str(e)}")
        raise


# ==================== 批量报表任务项 CRUD ====================

def get_batch_report_task_items(
    db: Session,
    task_id: int,
    status: Optional[str] = None
) -> List[BatchReportTaskItem]:
    """
    获取批量报表任务项列表
    
    Args:
        db: 数据库会话
        task_id: 任务ID
        status: 状态筛选
        
    Returns:
        任务项列表
    """
    query = db.query(BatchReportTaskItem).filter(BatchReportTaskItem.task_id == task_id)
    
    if status:
        query = query.filter(BatchReportTaskItem.status == status)
    
    return query.order_by(BatchReportTaskItem.execution_order).all()


def update_batch_report_task_item(
    db: Session,
    item_id: int,
    item_update: BatchReportTaskItemUpdate
) -> Optional[BatchReportTaskItem]:
    """
    更新批量报表任务项
    
    Args:
        db: 数据库会话
        item_id: 任务项ID
        item_update: 更新数据
        
    Returns:
        更新后的任务项或None
    """
    try:
        db_item = db.query(BatchReportTaskItem).filter(BatchReportTaskItem.id == item_id).first()
        if not db_item:
            return None
        
        # 更新字段
        update_data = item_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_item, key, value)
        
        db_item.updated_at = func.now()
        
        # 如果任务项完成，更新主任务的统计信息
        if item_update.status in ["completed", "failed"]:
            task = db_item.task
            if item_update.status == "completed":
                task.completed_reports = task.completed_reports + 1
            elif item_update.status == "failed":
                task.failed_reports = task.failed_reports + 1
            
            # 更新进度
            total = task.total_reports
            completed = task.completed_reports + task.failed_reports
            task.progress = int((completed / total) * 100) if total > 0 else 0
            
            # 检查是否所有任务项都完成
            if completed >= total:
                task.status = "completed"
                task.completed_at = func.now()
        
        db.commit()
        db.refresh(db_item)
        
        return db_item
        
    except Exception as e:
        db.rollback()
        logger.error(f"更新批量报表任务项失败: {str(e)}")
        raise


# ==================== 报表文件管理 CRUD ====================

def create_report_file(
    db: Session,
    file_data: ReportFileManagerCreate,
    user_id: Optional[int] = None
) -> ReportFileManager:
    """
    创建报表文件记录
    
    Args:
        db: 数据库会话
        file_data: 文件数据
        user_id: 创建者ID
        
    Returns:
        创建的文件记录
    """
    try:
        # 计算文件校验和
        checksum = None
        if os.path.exists(file_data.file_path):
            with open(file_data.file_path, 'rb') as f:
                checksum = hashlib.md5(f.read()).hexdigest()
        
        db_file = ReportFileManager(
            **file_data.model_dump(),
            checksum=checksum,
            created_by=user_id
        )
        
        db.add(db_file)
        db.commit()
        db.refresh(db_file)
        
        logger.info(f"创建报表文件记录成功: {db_file.id}")
        return db_file
        
    except Exception as e:
        db.rollback()
        logger.error(f"创建报表文件记录失败: {str(e)}")
        raise


def get_report_files(
    db: Session,
    file_type: Optional[str] = None,
    source_type: Optional[str] = None,
    source_id: Optional[int] = None,
    user_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100
) -> Tuple[List[ReportFileManager], int]:
    """
    获取报表文件列表
    
    Args:
        db: 数据库会话
        file_type: 文件类型筛选
        source_type: 来源类型筛选
        source_id: 来源ID筛选
        user_id: 用户ID筛选
        skip: 跳过的记录数
        limit: 返回的记录数
        
    Returns:
        文件列表和总数
    """
    query = db.query(ReportFileManager)
    
    # 应用筛选条件
    if file_type:
        query = query.filter(ReportFileManager.file_type == file_type)
    if source_type:
        query = query.filter(ReportFileManager.source_type == source_type)
    if source_id:
        query = query.filter(ReportFileManager.source_id == source_id)
    if user_id:
        query = query.filter(ReportFileManager.created_by == user_id)
    
    # 只返回活跃状态的文件
    query = query.filter(ReportFileManager.status == "active")
    
    # 获取总数
    total = query.count()
    
    # 应用分页和排序
    files = query.order_by(desc(ReportFileManager.created_at)).offset(skip).limit(limit).all()
    
    return files, total


def update_report_file_access(
    db: Session,
    file_id: int
) -> Optional[ReportFileManager]:
    """
    更新报表文件访问记录
    
    Args:
        db: 数据库会话
        file_id: 文件ID
        
    Returns:
        更新后的文件记录或None
    """
    try:
        db_file = db.query(ReportFileManager).filter(ReportFileManager.id == file_id).first()
        if not db_file:
            return None
        
        db_file.download_count = db_file.download_count + 1
        db_file.last_accessed_at = func.now()
        
        db.commit()
        db.refresh(db_file)
        
        return db_file
        
    except Exception as e:
        db.rollback()
        logger.error(f"更新报表文件访问记录失败: {str(e)}")
        raise


def cleanup_expired_files(db: Session) -> int:
    """
    清理过期的报表文件
    
    Args:
        db: 数据库会话
        
    Returns:
        清理的文件数量
    """
    try:
        now = datetime.utcnow()
        
        # 查找过期的文件
        expired_files = db.query(ReportFileManager).filter(
            and_(
                ReportFileManager.expires_at <= now,
                ReportFileManager.auto_cleanup == True,
                ReportFileManager.status == "active"
            )
        ).all()
        
        cleaned_count = 0
        for file_record in expired_files:
            try:
                # 删除物理文件
                if file_record.file_path and os.path.exists(file_record.file_path):
                    os.remove(file_record.file_path)
                
                # 更新数据库记录状态
                file_record.status = "deleted"
                cleaned_count += 1
                
            except Exception as e:
                logger.error(f"清理文件失败 {file_record.file_path}: {str(e)}")
        
        db.commit()
        
        if cleaned_count > 0:
            logger.info(f"清理过期文件成功: {cleaned_count} 个文件")
        
        return cleaned_count
        
    except Exception as e:
        db.rollback()
        logger.error(f"清理过期文件失败: {str(e)}")
        raise


# ==================== 批量报表生成业务逻辑 ====================

def create_batch_report_generation_task(
    db: Session,
    request: BatchReportGenerationRequest,
    user_id: int
) -> BatchReportTask:
    """
    创建批量报表生成任务
    
    Args:
        db: 数据库会话
        request: 批量报表生成请求
        user_id: 用户ID
        
    Returns:
        创建的批量报表任务
    """
    try:
        # 构建数据源配置
        source_config = {
            "period_id": request.period_id,
            "department_ids": request.department_ids or [],
            "employee_ids": request.employee_ids or []
        }
        
        # 构建导出配置
        export_config = {
            "export_format": request.export_format,
            "include_archive": request.include_archive,
            "auto_cleanup_hours": request.auto_cleanup_hours
        }
        
        # 构建报表项列表
        report_items = []
        for i, report_type in enumerate(request.report_types):
            report_items.append({
                "report_type": report_type,
                "report_name": f"{report_type}_报表",
                "report_config": {
                    "period_id": request.period_id,
                    "export_format": request.export_format,
                    "department_ids": request.department_ids,
                    "employee_ids": request.employee_ids
                }
            })
        
        # 创建任务数据
        task_data = BatchReportTaskCreate(
            task_name=request.task_name,
            description=request.description,
            task_type="batch_export",
            source_config=source_config,
            export_config=export_config,
            report_items=report_items
        )
        
        # 创建任务
        task = create_batch_report_task(db, task_data, user_id)
        
        logger.info(f"创建批量报表生成任务成功: {task.id}, 用户: {user_id}")
        return task
        
    except Exception as e:
        logger.error(f"创建批量报表生成任务失败: {str(e)}")
        raise


def get_batch_report_task_progress(
    db: Session,
    task_id: int,
    user_id: Optional[int] = None
) -> Optional[Dict[str, Any]]:
    """
    获取批量报表任务进度
    
    Args:
        db: 数据库会话
        task_id: 任务ID
        user_id: 用户ID（用于权限检查）
        
    Returns:
        进度信息字典或None
    """
    task = get_batch_report_task(db, task_id, user_id)
    if not task:
        return None
    
    # 获取当前正在处理的报表
    current_item = db.query(BatchReportTaskItem).filter(
        and_(
            BatchReportTaskItem.task_id == task_id,
            BatchReportTaskItem.status == "running"
        )
    ).first()
    
    # 计算预估剩余时间
    estimated_remaining_time = None
    if task.progress > 0 and task.started_at:
        elapsed_time = (datetime.utcnow() - task.started_at).total_seconds()
        if task.progress < 100:
            estimated_remaining_time = int((elapsed_time / task.progress) * (100 - task.progress))
    
    return {
        "task_id": task.id,
        "status": task.status,
        "progress": task.progress,
        "total_reports": task.total_reports,
        "completed_reports": task.completed_reports,
        "failed_reports": task.failed_reports,
        "current_report": current_item.report_name if current_item else None,
        "estimated_remaining_time": estimated_remaining_time,
        "error_message": task.error_message
    } 