"""
批量报表生成服务。
"""
import os
import zipfile
import asyncio
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import logging
from sqlalchemy.orm import Session

from ..crud import batch_reports as crud_batch_reports
from ..models.reports import BatchReportTask, BatchReportTaskItem
from ..pydantic_models.reports import BatchReportTaskItemUpdate, ReportFileManagerCreate

# 设置logger
logger = logging.getLogger(__name__)


class BatchReportService:
    """批量报表生成服务"""
    
    def __init__(self, db: Session):
        self.db = db
        self.output_base_dir = "reports/batch_exports"
        
        # 确保输出目录存在
        os.makedirs(self.output_base_dir, exist_ok=True)
    
    async def execute_batch_report_task(self, task_id: int) -> None:
        """
        执行批量报表生成任务
        
        Args:
            task_id: 任务ID
        """
        try:
            # 获取任务
            task = crud_batch_reports.get_batch_report_task(self.db, task_id)
            if not task:
                logger.error(f"批量报表任务不存在: {task_id}")
                return
            
            # 更新任务状态为运行中
            crud_batch_reports.update_batch_report_task(
                self.db,
                task_id,
                crud_batch_reports.BatchReportTaskUpdate(
                    status="running",
                    started_at=datetime.utcnow()
                )
            )
            
            logger.info(f"开始执行批量报表任务: {task_id}")
            
            # 创建任务输出目录
            task_output_dir = os.path.join(
                self.output_base_dir,
                f"task_{task_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            )
            os.makedirs(task_output_dir, exist_ok=True)
            
            # 更新任务输出目录
            crud_batch_reports.update_batch_report_task(
                self.db,
                task_id,
                crud_batch_reports.BatchReportTaskUpdate(output_directory=task_output_dir)
            )
            
            # 获取任务项
            task_items = crud_batch_reports.get_batch_report_task_items(self.db, task_id)
            
            # 执行每个报表项
            generated_files = []
            for item in task_items:
                try:
                    file_path = await self._execute_report_item(task, item, task_output_dir)
                    if file_path:
                        generated_files.append(file_path)
                        
                        # 更新任务项状态为完成
                        crud_batch_reports.update_batch_report_task_item(
                            self.db,
                            item.id,
                            BatchReportTaskItemUpdate(
                                status="completed",
                                completed_at=datetime.utcnow(),
                                file_path=file_path,
                                file_size=os.path.getsize(file_path) if os.path.exists(file_path) else 0,
                                file_format=task.export_config.get("export_format", "xlsx")
                            )
                        )
                    else:
                        # 更新任务项状态为失败
                        crud_batch_reports.update_batch_report_task_item(
                            self.db,
                            item.id,
                            BatchReportTaskItemUpdate(
                                status="failed",
                                completed_at=datetime.utcnow(),
                                error_message="报表生成失败"
                            )
                        )
                        
                except Exception as e:
                    logger.error(f"执行报表项失败 {item.id}: {str(e)}")
                    
                    # 更新任务项状态为失败
                    crud_batch_reports.update_batch_report_task_item(
                        self.db,
                        item.id,
                        BatchReportTaskItemUpdate(
                            status="failed",
                            completed_at=datetime.utcnow(),
                            error_message=str(e)
                        )
                    )
            
            # 如果需要打包，创建压缩文件
            archive_file_path = None
            if task.export_config.get("include_archive", True) and generated_files:
                archive_file_path = await self._create_archive(task_id, task_output_dir, generated_files)
            
            # 更新任务状态为完成
            task_update = crud_batch_reports.BatchReportTaskUpdate(
                status="completed",
                completed_at=datetime.utcnow(),
                progress=100
            )
            
            if archive_file_path:
                task_update.archive_file_path = archive_file_path
                task_update.archive_file_size = os.path.getsize(archive_file_path)
            
            crud_batch_reports.update_batch_report_task(self.db, task_id, task_update)
            
            # 创建文件管理记录
            if archive_file_path:
                await self._create_file_record(task, archive_file_path, "archive")
            
            for file_path in generated_files:
                await self._create_file_record(task, file_path, "report")
            
            logger.info(f"批量报表任务执行完成: {task_id}, 生成 {len(generated_files)} 个文件")
            
        except Exception as e:
            logger.error(f"执行批量报表任务失败 {task_id}: {str(e)}")
            
            # 更新任务状态为失败
            crud_batch_reports.update_batch_report_task(
                self.db,
                task_id,
                crud_batch_reports.BatchReportTaskUpdate(
                    status="failed",
                    completed_at=datetime.utcnow(),
                    error_message=str(e)
                )
            )
    
    async def _execute_report_item(
        self,
        task: BatchReportTask,
        item: BatchReportTaskItem,
        output_dir: str
    ) -> Optional[str]:
        """
        执行单个报表项
        
        Args:
            task: 批量报表任务
            item: 报表任务项
            output_dir: 输出目录
            
        Returns:
            生成的文件路径或None
        """
        try:
            # 更新任务项状态为运行中
            crud_batch_reports.update_batch_report_task_item(
                self.db,
                item.id,
                BatchReportTaskItemUpdate(
                    status="running",
                    started_at=datetime.utcnow()
                )
            )
            
            logger.info(f"开始执行报表项: {item.id} - {item.report_name}")
            
            # 根据报表类型生成报表
            file_path = None
            report_config = item.report_config
            export_format = task.export_config.get("export_format", "xlsx")
            
            if item.report_type == "payroll_summary":
                file_path = await self._generate_payroll_summary(
                    report_config, output_dir, export_format
                )
            elif item.report_type == "payroll_detail":
                file_path = await self._generate_payroll_detail(
                    report_config, output_dir, export_format
                )
            elif item.report_type == "department_summary":
                file_path = await self._generate_department_summary(
                    report_config, output_dir, export_format
                )
            elif item.report_type == "tax_report":
                file_path = await self._generate_tax_report(
                    report_config, output_dir, export_format
                )
            elif item.report_type == "social_insurance":
                file_path = await self._generate_social_insurance_report(
                    report_config, output_dir, export_format
                )
            elif item.report_type == "attendance_summary":
                file_path = await self._generate_attendance_summary(
                    report_config, output_dir, export_format
                )
            else:
                raise ValueError(f"不支持的报表类型: {item.report_type}")
            
            logger.info(f"报表项执行完成: {item.id} - {file_path}")
            return file_path
            
        except Exception as e:
            logger.error(f"执行报表项失败 {item.id}: {str(e)}")
            raise
    
    async def _generate_payroll_summary(
        self,
        config: Dict[str, Any],
        output_dir: str,
        export_format: str
    ) -> str:
        """生成薪资汇总表"""
        period_id = config.get("period_id")
        department_ids = config.get("department_ids", [])
        employee_ids = config.get("employee_ids", [])
        
        # 调用薪资报表服务生成报表
        file_name = f"薪资汇总表_{datetime.now().strftime('%Y%m%d_%H%M%S')}.{export_format}"
        file_path = os.path.join(output_dir, file_name)
        
        # 这里应该调用实际的报表生成逻辑
        # 暂时创建一个示例文件
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(f"薪资汇总表\n期间ID: {period_id}\n部门: {department_ids}\n员工: {employee_ids}\n")
        
        return file_path
    
    async def _generate_payroll_detail(
        self,
        config: Dict[str, Any],
        output_dir: str,
        export_format: str
    ) -> str:
        """生成薪资明细表"""
        period_id = config.get("period_id")
        
        file_name = f"薪资明细表_{datetime.now().strftime('%Y%m%d_%H%M%S')}.{export_format}"
        file_path = os.path.join(output_dir, file_name)
        
        # 这里应该调用实际的报表生成逻辑
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(f"薪资明细表\n期间ID: {period_id}\n")
        
        return file_path
    
    async def _generate_department_summary(
        self,
        config: Dict[str, Any],
        output_dir: str,
        export_format: str
    ) -> str:
        """生成部门薪资汇总"""
        period_id = config.get("period_id")
        department_ids = config.get("department_ids", [])
        
        file_name = f"部门薪资汇总_{datetime.now().strftime('%Y%m%d_%H%M%S')}.{export_format}"
        file_path = os.path.join(output_dir, file_name)
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(f"部门薪资汇总\n期间ID: {period_id}\n部门: {department_ids}\n")
        
        return file_path
    
    async def _generate_tax_report(
        self,
        config: Dict[str, Any],
        output_dir: str,
        export_format: str
    ) -> str:
        """生成个税申报表"""
        period_id = config.get("period_id")
        
        file_name = f"个税申报表_{datetime.now().strftime('%Y%m%d_%H%M%S')}.{export_format}"
        file_path = os.path.join(output_dir, file_name)
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(f"个税申报表\n期间ID: {period_id}\n")
        
        return file_path
    
    async def _generate_social_insurance_report(
        self,
        config: Dict[str, Any],
        output_dir: str,
        export_format: str
    ) -> str:
        """生成社保缴费表"""
        period_id = config.get("period_id")
        
        file_name = f"社保缴费表_{datetime.now().strftime('%Y%m%d_%H%M%S')}.{export_format}"
        file_path = os.path.join(output_dir, file_name)
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(f"社保缴费表\n期间ID: {period_id}\n")
        
        return file_path
    
    async def _generate_attendance_summary(
        self,
        config: Dict[str, Any],
        output_dir: str,
        export_format: str
    ) -> str:
        """生成考勤汇总表"""
        period_id = config.get("period_id")
        
        file_name = f"考勤汇总表_{datetime.now().strftime('%Y%m%d_%H%M%S')}.{export_format}"
        file_path = os.path.join(output_dir, file_name)
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(f"考勤汇总表\n期间ID: {period_id}\n")
        
        return file_path
    
    async def _create_archive(
        self,
        task_id: int,
        output_dir: str,
        file_paths: List[str]
    ) -> str:
        """
        创建压缩文件
        
        Args:
            task_id: 任务ID
            output_dir: 输出目录
            file_paths: 文件路径列表
            
        Returns:
            压缩文件路径
        """
        try:
            archive_name = f"批量报表_{task_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.zip"
            archive_path = os.path.join(output_dir, archive_name)
            
            with zipfile.ZipFile(archive_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
                for file_path in file_paths:
                    if os.path.exists(file_path):
                        # 使用文件名作为压缩包内的路径
                        arcname = os.path.basename(file_path)
                        zipf.write(file_path, arcname)
            
            logger.info(f"创建压缩文件成功: {archive_path}")
            return archive_path
            
        except Exception as e:
            logger.error(f"创建压缩文件失败: {str(e)}")
            raise
    
    async def _create_file_record(
        self,
        task: BatchReportTask,
        file_path: str,
        file_type: str
    ) -> None:
        """
        创建文件管理记录
        
        Args:
            task: 批量报表任务
            file_path: 文件路径
            file_type: 文件类型
        """
        try:
            file_size = os.path.getsize(file_path) if os.path.exists(file_path) else 0
            file_format = os.path.splitext(file_path)[1][1:] if '.' in file_path else None
            
            # 计算过期时间
            auto_cleanup_hours = task.export_config.get("auto_cleanup_hours", 24)
            expires_at = datetime.utcnow() + timedelta(hours=auto_cleanup_hours)
            
            file_data = ReportFileManagerCreate(
                file_name=os.path.basename(file_path),
                file_path=file_path,
                file_size=file_size,
                file_type=file_type,
                file_format=file_format,
                source_type="batch_task",
                source_id=task.id,
                access_level="private",
                is_temporary=True,
                expires_at=expires_at,
                auto_cleanup=True,
                metadata_info={
                    "task_id": task.id,
                    "task_name": task.task_name,
                    "generated_at": datetime.utcnow().isoformat()
                }
            )
            
            crud_batch_reports.create_report_file(
                self.db,
                file_data,
                task.created_by
            )
            
        except Exception as e:
            logger.error(f"创建文件记录失败: {str(e)}")
            # 不抛出异常，避免影响主流程 