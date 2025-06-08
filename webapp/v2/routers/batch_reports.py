"""
批量报表生成相关的API路由。
"""
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query, Path
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
import logging
import os
from datetime import datetime, timedelta

from ..database import get_db_v2 as get_db
from ...auth import get_current_user
from ..models.security import User
from ..pydantic_models.reports import (
    BatchReportGenerationRequest, BatchReportGenerationResponse,
    BatchReportProgressResponse, BatchReportDownloadResponse,
    BatchReportTask, BatchReportTaskListItem, BatchReportTaskItem,
    ReportFileManager
)
from ..crud import batch_reports as crud_batch_reports

# 设置logger
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/batch-reports", tags=["批量报表生成"])


@router.post("/generate", response_model=BatchReportGenerationResponse)
async def create_batch_report_generation(
    request: BatchReportGenerationRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    创建批量报表生成任务
    
    Args:
        request: 批量报表生成请求
        background_tasks: 后台任务
        db: 数据库会话
        current_user: 当前用户
        
    Returns:
        批量报表生成响应
    """
    try:
        # 创建批量报表任务
        task = crud_batch_reports.create_batch_report_generation_task(
            db=db,
            request=request,
            user_id=current_user.id
        )
        
        # 启动后台任务执行报表生成
        from ..services.batch_report_service import BatchReportService
        batch_service = BatchReportService(db)
        background_tasks.add_task(
            batch_service.execute_batch_report_task,
            task.id
        )
        
        logger.info(f"用户 {current_user.id} 创建批量报表生成任务: {task.id}")
        
        return BatchReportGenerationResponse(
            task_id=task.id,
            task_name=task.task_name,
            status=task.status,
            total_reports=task.total_reports,
            message=f"批量报表生成任务已创建，包含 {task.total_reports} 个报表"
        )
        
    except Exception as e:
        logger.error(f"创建批量报表生成任务失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"创建批量报表生成任务失败: {str(e)}")


@router.get("/tasks", response_model=List[BatchReportTaskListItem])
async def get_batch_report_tasks(
    status: Optional[str] = Query(None, description="任务状态筛选"),
    task_type: Optional[str] = Query(None, description="任务类型筛选"),
    skip: int = Query(0, ge=0, description="跳过的记录数"),
    limit: int = Query(100, ge=1, le=1000, description="返回的记录数"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    获取批量报表任务列表
    
    Args:
        status: 任务状态筛选
        task_type: 任务类型筛选
        skip: 跳过的记录数
        limit: 返回的记录数
        db: 数据库会话
        current_user: 当前用户
        
    Returns:
        批量报表任务列表
    """
    try:
        tasks, total = crud_batch_reports.get_batch_report_tasks(
            db=db,
            user_id=current_user.id,
            status=status,
            task_type=task_type,
            skip=skip,
            limit=limit
        )
        
        return [BatchReportTaskListItem.model_validate(task) for task in tasks]
        
    except Exception as e:
        logger.error(f"获取批量报表任务列表失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"获取批量报表任务列表失败: {str(e)}")


@router.get("/tasks/{task_id}", response_model=BatchReportTask)
async def get_batch_report_task(
    task_id: int = Path(..., description="任务ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    获取批量报表任务详情
    
    Args:
        task_id: 任务ID
        db: 数据库会话
        current_user: 当前用户
        
    Returns:
        批量报表任务详情
    """
    try:
        task = crud_batch_reports.get_batch_report_task(
            db=db,
            task_id=task_id,
            user_id=current_user.id
        )
        
        if not task:
            raise HTTPException(status_code=404, detail="批量报表任务不存在")
        
        return BatchReportTask.model_validate(task)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取批量报表任务详情失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"获取批量报表任务详情失败: {str(e)}")


@router.get("/tasks/{task_id}/progress", response_model=BatchReportProgressResponse)
async def get_batch_report_task_progress(
    task_id: int = Path(..., description="任务ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    获取批量报表任务进度
    
    Args:
        task_id: 任务ID
        db: 数据库会话
        current_user: 当前用户
        
    Returns:
        批量报表任务进度
    """
    try:
        progress = crud_batch_reports.get_batch_report_task_progress(
            db=db,
            task_id=task_id,
            user_id=current_user.id
        )
        
        if not progress:
            raise HTTPException(status_code=404, detail="批量报表任务不存在")
        
        return BatchReportProgressResponse(**progress)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取批量报表任务进度失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"获取批量报表任务进度失败: {str(e)}")


@router.get("/tasks/{task_id}/items", response_model=List[BatchReportTaskItem])
async def get_batch_report_task_items(
    task_id: int = Path(..., description="任务ID"),
    status: Optional[str] = Query(None, description="状态筛选"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    获取批量报表任务项列表
    
    Args:
        task_id: 任务ID
        status: 状态筛选
        db: 数据库会话
        current_user: 当前用户
        
    Returns:
        批量报表任务项列表
    """
    try:
        # 验证任务是否存在且属于当前用户
        task = crud_batch_reports.get_batch_report_task(
            db=db,
            task_id=task_id,
            user_id=current_user.id
        )
        
        if not task:
            raise HTTPException(status_code=404, detail="批量报表任务不存在")
        
        items = crud_batch_reports.get_batch_report_task_items(
            db=db,
            task_id=task_id,
            status=status
        )
        
        return [BatchReportTaskItem.model_validate(item) for item in items]
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取批量报表任务项列表失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"获取批量报表任务项列表失败: {str(e)}")


@router.get("/tasks/{task_id}/download", response_model=BatchReportDownloadResponse)
async def get_batch_report_download_info(
    task_id: int = Path(..., description="任务ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    获取批量报表下载信息
    
    Args:
        task_id: 任务ID
        db: 数据库会话
        current_user: 当前用户
        
    Returns:
        批量报表下载信息
    """
    try:
        task = crud_batch_reports.get_batch_report_task(
            db=db,
            task_id=task_id,
            user_id=current_user.id
        )
        
        if not task:
            raise HTTPException(status_code=404, detail="批量报表任务不存在")
        
        if task.status != "completed":
            raise HTTPException(status_code=400, detail="批量报表任务尚未完成")
        
        if not task.archive_file_path or not os.path.exists(task.archive_file_path):
            raise HTTPException(status_code=404, detail="批量报表文件不存在")
        
        # 生成下载链接（这里简化处理，实际应该生成临时下载令牌）
        download_url = f"/api/v2/batch-reports/tasks/{task_id}/download-file"
        
        return BatchReportDownloadResponse(
            download_url=download_url,
            file_name=os.path.basename(task.archive_file_path),
            file_size=task.archive_file_size or 0,
            expires_at=datetime.utcnow() + timedelta(hours=24),
            file_count=task.completed_reports
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取批量报表下载信息失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"获取批量报表下载信息失败: {str(e)}")


@router.get("/tasks/{task_id}/download-file")
async def download_batch_report_file(
    task_id: int = Path(..., description="任务ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    下载批量报表文件
    
    Args:
        task_id: 任务ID
        db: 数据库会话
        current_user: 当前用户
        
    Returns:
        文件响应
    """
    try:
        task = crud_batch_reports.get_batch_report_task(
            db=db,
            task_id=task_id,
            user_id=current_user.id
        )
        
        if not task:
            raise HTTPException(status_code=404, detail="批量报表任务不存在")
        
        if task.status != "completed":
            raise HTTPException(status_code=400, detail="批量报表任务尚未完成")
        
        if not task.archive_file_path or not os.path.exists(task.archive_file_path):
            raise HTTPException(status_code=404, detail="批量报表文件不存在")
        
        # 更新文件访问记录（如果有文件管理记录）
        try:
            file_records = crud_batch_reports.get_report_files(
                db=db,
                source_type="batch_task",
                source_id=task_id,
                limit=1
            )
            
            if file_records and len(file_records[0]) > 0:
                crud_batch_reports.update_report_file_access(db, file_records[0][0].id)
        except Exception as e:
            logger.warning(f"更新文件访问记录失败: {str(e)}")
        
        logger.info(f"用户 {current_user.id} 下载批量报表文件: {task.archive_file_path}")
        
        return FileResponse(
            path=task.archive_file_path,
            filename=os.path.basename(task.archive_file_path),
            media_type='application/zip'
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"下载批量报表文件失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"下载批量报表文件失败: {str(e)}")


@router.delete("/tasks/{task_id}")
async def delete_batch_report_task(
    task_id: int = Path(..., description="任务ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    删除批量报表任务
    
    Args:
        task_id: 任务ID
        db: 数据库会话
        current_user: 当前用户
        
    Returns:
        删除结果
    """
    try:
        success = crud_batch_reports.delete_batch_report_task(
            db=db,
            task_id=task_id,
            user_id=current_user.id
        )
        
        if not success:
            raise HTTPException(status_code=404, detail="批量报表任务不存在")
        
        logger.info(f"用户 {current_user.id} 删除批量报表任务: {task_id}")
        
        return {"message": "批量报表任务删除成功"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"删除批量报表任务失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"删除批量报表任务失败: {str(e)}")


@router.post("/cleanup-expired")
async def cleanup_expired_files(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    清理过期的报表文件
    
    Args:
        db: 数据库会话
        current_user: 当前用户
        
    Returns:
        清理结果
    """
    try:
        # 这里可以添加权限检查，只允许管理员执行清理操作
        cleaned_count = crud_batch_reports.cleanup_expired_files(db)
        
        logger.info(f"用户 {current_user.id} 执行文件清理，清理了 {cleaned_count} 个文件")
        
        return {
            "message": f"文件清理完成，共清理 {cleaned_count} 个过期文件",
            "cleaned_count": cleaned_count
        }
        
    except Exception as e:
        logger.error(f"清理过期文件失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"清理过期文件失败: {str(e)}")


@router.get("/files", response_model=List[ReportFileManager])
async def get_report_files(
    file_type: Optional[str] = Query(None, description="文件类型筛选"),
    source_type: Optional[str] = Query(None, description="来源类型筛选"),
    skip: int = Query(0, ge=0, description="跳过的记录数"),
    limit: int = Query(100, ge=1, le=1000, description="返回的记录数"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    获取报表文件列表
    
    Args:
        file_type: 文件类型筛选
        source_type: 来源类型筛选
        skip: 跳过的记录数
        limit: 返回的记录数
        db: 数据库会话
        current_user: 当前用户
        
    Returns:
        报表文件列表
    """
    try:
        files, total = crud_batch_reports.get_report_files(
            db=db,
            file_type=file_type,
            source_type=source_type,
            user_id=current_user.id,
            skip=skip,
            limit=limit
        )
        
        return [ReportFileManager.model_validate(file) for file in files]
        
    except Exception as e:
        logger.error(f"获取报表文件列表失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"获取报表文件列表失败: {str(e)}")


@router.get("/report-types")
async def get_available_report_types(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    获取可用的报表类型列表
    
    Args:
        db: 数据库会话
        current_user: 当前用户
        
    Returns:
        可用的报表类型列表
    """
    try:
        # 从数据库配置中获取报表类型
        from ..crud.reports.report_config_management import get_active_report_types_for_batch
        
        report_types = get_active_report_types_for_batch(db=db)
        
        return {
            "report_types": report_types,
            "total_count": len(report_types)
        }
        
    except Exception as e:
        logger.error(f"获取可用报表类型失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"获取可用报表类型失败: {str(e)}")


@router.get("/report-presets")
async def get_available_report_presets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    获取可用的报表配置预设列表
    
    Args:
        db: 数据库会话
        current_user: 当前用户
        
    Returns:
        可用的报表配置预设列表
    """
    try:
        # 从数据库配置中获取预设配置
        from ..crud.reports.report_config_management import get_active_presets_for_batch
        
        presets = get_active_presets_for_batch(db=db)
        
        return {
            "presets": presets,
            "total_count": len(presets)
        }
        
    except Exception as e:
        logger.error(f"获取可用报表预设失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"获取可用报表预设失败: {str(e)}") 