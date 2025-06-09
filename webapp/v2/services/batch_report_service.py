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
from .report_generators import (
    PayrollSummaryGenerator,
    PayrollDetailGenerator,
    DepartmentSummaryGenerator,
    TaxDeclarationGenerator,
    SocialInsuranceGenerator,
    AttendanceSummaryGenerator
)

# 设置logger
logger = logging.getLogger(__name__)


class BatchReportService:
    """批量报表生成服务"""
    
    def __init__(self, db: Session):
        self.db = db
        self.output_base_dir = "reports/batch_exports"
        
        # 确保输出目录存在
        os.makedirs(self.output_base_dir, exist_ok=True)
        
        # 报表类型映射 - 将数据库中的报表类型映射到现有的生成器
        self.report_type_mapping = {
            # 薪资相关报表映射到薪资明细生成器
            "yingfa_PY": "payroll_detail",      # 04实发表-正编
            "yingfa_ZB": "payroll_detail",      # 01、02、03应发表-正编  
            "yingfa-PY": "payroll_detail",      # 06应发表-区聘
            "shifa-PY": "payroll_detail",       # 10聘用实发表月度
            
            # 部门汇总相关报表映射到部门汇总生成器
            "ZBDRDPT": "department_summary",    # 05正编导入大平台工资数据
            "PYGZDRDPT": "department_summary",  # 13聘用工资导入大平台表月度
            "PYGZHZYD": "department_summary",   # 12聘用工资汇总月度
            
            # 专项报表映射到薪资汇总生成器
            "ZJYFYD": "payroll_summary",        # 09专技应发月度
            "YTFYFYD": "payroll_summary",       # 07原投服应发月度
            "ZXYFYD": "payroll_summary",        # 08专项应发月度
            "ZJSFBYD": "payroll_summary",       # 11专技实发表月度
            
            # 🚀 新增：失败的报表类型映射
            "gong_wu_yuan_can_gong_shi_ye_shi_fa": "payroll_detail",  # 公务员参工事业实发
            "zheng_bian_dao_ru_da_ping_tai_gong_zi_shu_ju": "department_summary",  # 正编导入大平台工资数据
            "pin_yong_shi_fa_biao_yue_du_shi_tu": "payroll_detail",  # 聘用实发表月度视图
            "zhuan_ji_shi_fa_biao_yue_du_shi_tu": "payroll_detail",  # 专技实发表月度视图
            "pin_yong_gong_zi_hui_zong_yue_du_shi_tu": "payroll_summary",  # 聘用工资汇总月度视图
            "pin_yong_gong_zi_dao_ru_da_ping_tai_biao_yue_du": "department_summary",  # 聘用工资导入大平台表月度
            
            # 社保相关报表映射到社保生成器
            "NJZZMX": "social_insurance",       # 43年金做账明细
            "GJJZZMXB": "social_insurance",     # 39公积金做账明细表
            "JBZZMX": "social_insurance",       # 42机保做账明细
            "SBSYGSZZMX": "social_insurance",   # 44社保、失业工伤做账明细
            "YLBXZZMX": "social_insurance",     # 45医疗保险做账明细
            
            # 用款计划报表映射到薪资汇总生成器
            "ZBGZYKJH": "payroll_summary",      # 52正编工资用款计划
            "PYGZYKJH": "payroll_summary",      # 53聘用工资用款计划
            "SBGJJYKJH": "social_insurance",    # 54社保公积金用款计划
        }
    
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
            
            # 🚀 增强的报表类型映射逻辑
            if item.report_type in self.report_type_mapping:
                report_type = self.report_type_mapping[item.report_type]
                file_path = await self._generate_report(report_type, report_config, output_dir, export_format)
            else:
                # 💡 智能回退策略：根据报表名称推断报表类型
                logger.warning(f"未知的报表类型: {item.report_type}，尝试智能推断...")
                
                report_type = self._infer_report_type_from_name(item.report_name, item.report_type)
                if report_type:
                    logger.info(f"智能推断报表类型: {item.report_type} -> {report_type}")
                    file_path = await self._generate_report(report_type, report_config, output_dir, export_format)
                else:
                    # 最后的回退：使用默认的薪资明细生成器
                    logger.warning(f"无法推断报表类型，使用默认生成器: {item.report_type}")
                    file_path = await self._generate_report("payroll_detail", report_config, output_dir, export_format)
            
            logger.info(f"报表项执行完成: {item.id} - {file_path}")
            return file_path
            
        except Exception as e:
            logger.error(f"执行报表项失败 {item.id}: {str(e)}")
            raise
    
    def _infer_report_type_from_name(self, report_name: str, report_type: str) -> Optional[str]:
        """
        🔍 根据报表名称和类型智能推断对应的生成器类型
        
        Args:
            report_name: 报表名称
            report_type: 原始报表类型编码
            
        Returns:
            推断的生成器类型，如果无法推断则返回None
        """
        name_lower = report_name.lower()
        type_lower = report_type.lower()
        
        # 关键词映射规则
        if any(keyword in name_lower for keyword in ['实发', '明细', 'shi_fa', 'detail']):
            return "payroll_detail"
        elif any(keyword in name_lower for keyword in ['汇总', '导入', '大平台', 'hui_zong', 'summary']):
            return "department_summary"  
        elif any(keyword in type_lower for keyword in ['pin_yong', '聘用', 'payroll']):
            return "payroll_summary"
        elif any(keyword in name_lower for keyword in ['社保', '公积金', '年金', 'social', 'insurance']):
            return "social_insurance"
        elif any(keyword in name_lower for keyword in ['个税', '税', 'tax']):
            return "tax_report"
        elif any(keyword in name_lower for keyword in ['考勤', 'attendance']):
            return "attendance_summary"
        
        # 无法推断，返回None
        return None
    
    async def _generate_report(
        self,
        report_type: str,
        config: Dict[str, Any],
        output_dir: str,
        export_format: str
    ) -> str:
        """生成报表"""
        try:
            generator = None
            if report_type == "payroll_summary":
                generator = PayrollSummaryGenerator(self.db)
            elif report_type == "payroll_detail":
                generator = PayrollDetailGenerator(self.db)
            elif report_type == "department_summary":
                generator = DepartmentSummaryGenerator(self.db)
            elif report_type == "tax_report":
                generator = TaxDeclarationGenerator(self.db)
            elif report_type == "social_insurance":
                generator = SocialInsuranceGenerator(self.db)
            elif report_type == "attendance_summary":
                generator = AttendanceSummaryGenerator(self.db)
            else:
                raise ValueError(f"不支持的报表类型: {report_type}")
            
            return generator.generate_report(config, output_dir, export_format)
        except Exception as e:
            logger.error(f"生成报表失败: {str(e)}")
            raise
    
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