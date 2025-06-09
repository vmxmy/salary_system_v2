"""
基础报表生成器类
定义所有报表生成器的通用接口和方法
"""

from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from datetime import datetime
import logging

from .excel_utils import ExcelExportUtils

logger = logging.getLogger(__name__)

class BaseReportGenerator(ABC):
    """基础报表生成器抽象类"""
    
    def __init__(self, db: Session):
        self.db = db
        self.logger = logging.getLogger(self.__class__.__name__)
    
    @abstractmethod
    def generate_report(
        self,
        config: Dict[str, Any],
        output_dir: str,
        export_format: str = "xlsx"
    ) -> str:
        """
        生成报表
        
        Args:
            config: 报表配置
            output_dir: 输出目录
            export_format: 导出格式
            
        Returns:
            生成的文件路径
        """
        pass
    
    @abstractmethod
    def get_report_data(self, config: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        获取报表数据
        
        Args:
            config: 报表配置
            
        Returns:
            报表数据列表
        """
        pass
    
    @abstractmethod
    def get_columns_config(self) -> List[Dict[str, Any]]:
        """
        获取列配置
        
        Returns:
            列配置列表
        """
        pass
    
    def get_report_title(self, config: Dict[str, Any]) -> str:
        """
        获取报表标题
        
        Args:
            config: 报表配置
            
        Returns:
            报表标题
        """
        return self.__class__.__name__.replace('Generator', '报表')
    
    def get_report_subtitle(self, config: Dict[str, Any]) -> Optional[str]:
        """
        获取报表副标题
        
        Args:
            config: 报表配置
            
        Returns:
            报表副标题
        """
        period_id = config.get('period_id')
        if period_id:
            # 这里可以查询期间名称
            return f"期间ID: {period_id} - 生成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
        return f"生成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
    
    def get_summary_data(self, data: List[Dict[str, Any]], config: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        获取汇总数据
        
        Args:
            data: 报表数据
            config: 报表配置
            
        Returns:
            汇总数据字典
        """
        if not data:
            return None
        
        return {
            "总记录数": len(data),
            "生成时间": datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }
    
    def generate_filename(self, config: Dict[str, Any], export_format: str) -> str:
        """
        生成文件名
        
        Args:
            config: 报表配置
            export_format: 导出格式
            
        Returns:
            文件名
        """
        report_name = self.__class__.__name__.replace('Generator', '')
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        return f"{report_name}_{timestamp}.{export_format}"
    
    def create_excel_file(
        self,
        data: List[Dict[str, Any]],
        file_path: str,
        config: Dict[str, Any]
    ) -> str:
        """
        创建Excel文件
        
        Args:
            data: 报表数据
            file_path: 文件路径
            config: 报表配置
            
        Returns:
            生成的文件路径
        """
        try:
            title = self.get_report_title(config)
            subtitle = self.get_report_subtitle(config)
            columns_config = self.get_columns_config()
            summary_data = self.get_summary_data(data, config)
            include_charts = config.get('include_charts', False)
            
            return ExcelExportUtils.create_excel_file(
                data=data,
                file_path=file_path,
                title=title,
                subtitle=subtitle,
                columns_config=columns_config,
                summary_data=summary_data,
                include_charts=include_charts
            )
            
        except Exception as e:
            self.logger.error(f"创建Excel文件失败: {str(e)}")
            raise
    
    def create_csv_file(
        self,
        data: List[Dict[str, Any]],
        file_path: str,
        config: Dict[str, Any]
    ) -> str:
        """
        创建CSV文件
        
        Args:
            data: 报表数据
            file_path: 文件路径
            config: 报表配置
            
        Returns:
            生成的文件路径
        """
        try:
            import pandas as pd
            import os
            
            # 确保目录存在
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            
            if not data:
                # 创建空的CSV文件
                df = pd.DataFrame()
                df.to_csv(file_path, index=False, encoding='utf-8-sig')
                self.logger.warning(f"创建了空的CSV文件: {file_path}")
                return file_path
            
            # 转换数据为DataFrame
            df = pd.DataFrame(data)
            
            # 写入CSV文件
            df.to_csv(file_path, index=False, encoding='utf-8-sig')
            
            self.logger.info(f"成功创建CSV文件: {file_path}, 数据行数: {len(df)}")
            return file_path
            
        except Exception as e:
            self.logger.error(f"创建CSV文件失败: {str(e)}")
            raise
    
    def validate_config(self, config: Dict[str, Any]) -> bool:
        """
        验证配置参数
        
        Args:
            config: 报表配置
            
        Returns:
            是否有效
        """
        # 基础验证，子类可以重写
        return True
    
    def log_generation_start(self, config: Dict[str, Any]):
        """记录生成开始"""
        self.logger.info(f"开始生成报表: {self.__class__.__name__}, 配置: {config}")
    
    def log_generation_end(self, file_path: str, data_count: int):
        """记录生成结束"""
        self.logger.info(f"报表生成完成: {file_path}, 数据行数: {data_count}")
    
    def handle_generation_error(self, error: Exception, config: Dict[str, Any]):
        """处理生成错误"""
        self.logger.error(f"报表生成失败: {self.__class__.__name__}, 配置: {config}, 错误: {str(error)}")
        raise 