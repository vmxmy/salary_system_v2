"""
工具类相关的API路由
"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from fastapi.responses import HTMLResponse, FileResponse
from sqlalchemy.orm import Session
from typing import Optional, List
import os
import tempfile
import logging
from datetime import datetime

# Set up logging for this module
logger = logging.getLogger(__name__)

from webapp.v2.database import get_db_v2
from webapp.v2.pydantic_models.system import (
    UtilityOperationResponse, ExcelConversionRequest, ExcelConversionResultResponse,
    TemplateListResponse, TemplateInfo
)
from webapp.v2.pydantic_models.common import DataResponse
from webapp import auth

router = APIRouter(
    prefix="/utilities",
    tags=["Utilities"],
)


@router.get("/converter", response_class=HTMLResponse)
async def get_converter_page():
    """
    Excel转CSV转换器页面
    
    替代原来的 GET /converter 接口
    
    提供Excel文件转换为CSV格式的Web界面
    如果HTML文件不存在，返回简单的转换器说明页面
    """
    try:
        # 尝试读取转换器HTML文件
        html_file_path = os.path.join(os.path.dirname(__file__), "../../../converter.html")
        
        if os.path.exists(html_file_path):
            with open(html_file_path, "r", encoding="utf-8") as f:
                html_content = f.read()
            return HTMLResponse(content=html_content)
        else:
            # 如果文件不存在，返回简单的转换器页面
            simple_converter_html = """
            <!DOCTYPE html>
            <html>
            <head>
                <title>Excel to CSV Converter</title>
                <meta charset="utf-8">
                <style>
                    body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
                    .container { background: #f5f5f5; padding: 30px; border-radius: 8px; }
                    h1 { color: #333; text-align: center; }
                    .info { background: #e3f2fd; padding: 15px; border-radius: 4px; margin: 20px 0; }
                    .endpoint { background: #fff; padding: 10px; border-left: 4px solid #2196f3; margin: 10px 0; }
                    code { background: #f1f1f1; padding: 2px 4px; border-radius: 2px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Excel to CSV Converter</h1>
                    
                    <div class="info">
                        <h3>API 转换工具</h3>
                        <p>使用以下API端点进行Excel文件转换：</p>
                    </div>
                    
                    <div class="endpoint">
                        <strong>POST /v2/utilities/excel-to-csv</strong>
                        <p>上传Excel文件并转换为CSV格式</p>
                        <p><strong>参数:</strong> file (multipart/form-data)</p>
                    </div>
                    
                    <div class="endpoint">
                        <strong>GET /v2/utilities/templates</strong>
                        <p>获取可用的模板文件列表</p>
                    </div>
                    
                    <div class="info">
                        <h3>使用说明</h3>
                        <ul>
                            <li>支持 .xlsx 和 .xls 格式的Excel文件</li>
                            <li>支持多工作表文件（可指定工作表名称）</li>
                            <li>自动处理中文编码</li>
                            <li>保持数据格式和精度</li>
                        </ul>
                    </div>
                </div>
            </body>
            </html>
            """
            return HTMLResponse(content=simple_converter_html)
            
    except Exception as e:
        logger.error(f"Error serving converter page: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="转换器页面加载失败"
        )


@router.post("/excel-to-csv", response_model=ExcelConversionResultResponse)
async def convert_excel_to_csv(
    file: UploadFile = File(..., description="Excel文件"),
    sheet_name: Optional[str] = Query(None, description="工作表名称，不指定则使用第一个工作表"),
    include_headers: bool = Query(True, description="是否包含表头"),
    db: Session = Depends(get_db_v2),
    current_user = Depends(auth.require_permissions(["file:convert"]))
):
    """
    Excel文件转CSV格式
    
    将上传的Excel文件转换为CSV格式：
    - 支持.xlsx和.xls格式
    - 可指定工作表名称
    - 可选择是否包含表头
    - 返回转换后的文件下载链接
    
    需要 file:convert 权限
    """
    try:
        # 验证文件类型
        if not file.filename.lower().endswith(('.xlsx', '.xls')):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="仅支持Excel文件格式 (.xlsx, .xls)"
            )
        
        # 创建临时文件
        with tempfile.NamedTemporaryFile(delete=False, suffix='.xlsx') as temp_input:
            content = await file.read()
            temp_input.write(content)
            temp_input_path = temp_input.name
        
        try:
            import pandas as pd
            
            # 读取Excel文件
            if sheet_name:
                df = pd.read_excel(temp_input_path, sheet_name=sheet_name, header=0 if include_headers else None)
            else:
                df = pd.read_excel(temp_input_path, header=0 if include_headers else None)
            
            # 生成输出文件名
            base_name = os.path.splitext(file.filename)[0]
            output_filename = f"{base_name}.csv"
            
            # 创建输出文件
            with tempfile.NamedTemporaryFile(delete=False, suffix='.csv', mode='w', encoding='utf-8') as temp_output:
                df.to_csv(temp_output.name, index=False, encoding='utf-8')
                temp_output_path = temp_output.name
            
            # 这里应该将文件保存到永久存储位置，并生成下载链接
            # 目前返回临时路径（实际项目中需要实现文件存储服务）
            download_url = f"/v2/utilities/download/{os.path.basename(temp_output_path)}"
            
            logger.info(f"Excel file converted successfully: {file.filename} -> {output_filename}")
            
            conversion_result = {
                "success": True,
                "message": "Excel文件转换成功",
                "output_file": output_filename,
                "download_url": download_url,
                "records_count": len(df)
            }
            
            return DataResponse(
                success=True,
                message="Excel转换完成",
                data=conversion_result
            )
            
        finally:
            # 清理临时文件
            if os.path.exists(temp_input_path):
                os.unlink(temp_input_path)
                
    except ImportError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Excel处理库未安装，请联系管理员"
        )
    except Exception as e:
        logger.error(f"Excel conversion failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Excel转换失败: {str(e)}"
        )


@router.get("/templates", response_model=TemplateListResponse)
async def get_templates(
    category: Optional[str] = Query(None, description="模板分类: employee, payroll, report"),
    db: Session = Depends(get_db_v2),
    current_user = Depends(auth.require_permissions(["template:view"]))
):
    """
    获取可用模板列表
    
    返回系统中可用的模板文件：
    - 员工导入模板
    - 薪资数据模板
    - 报表模板
    - 按分类筛选
    
    需要 template:view 权限
    """
    try:
        # 这里应该从实际的模板存储位置读取
        # 目前返回模拟数据
        
        templates = [
            TemplateInfo(
                name="员工信息导入模板",
                description="用于批量导入员工基本信息的Excel模板",
                file_type="xlsx",
                download_url="/v2/utilities/download/employee_import_template.xlsx",
                size=15360,
                last_modified="2025-01-23T10:00:00Z"
            ),
            TemplateInfo(
                name="薪资数据导入模板", 
                description="用于导入薪资计算数据的Excel模板",
                file_type="xlsx",
                download_url="/v2/utilities/download/payroll_import_template.xlsx",
                size=20480,
                last_modified="2025-01-23T10:00:00Z"
            ),
            TemplateInfo(
                name="月度报表模板",
                description="月度薪资报表生成模板",
                file_type="xlsx", 
                download_url="/v2/utilities/download/monthly_report_template.xlsx",
                size=25600,
                last_modified="2025-01-23T10:00:00Z"
            )
        ]
        
        # 按分类筛选
        if category:
            if category == "employee":
                templates = [t for t in templates if "员工" in t.name]
            elif category == "payroll":
                templates = [t for t in templates if "薪资" in t.name]
            elif category == "report":
                templates = [t for t in templates if "报表" in t.name]
        
        return DataResponse(
            success=True,
            message=f"成功获取{len(templates)}个模板",
            data=templates
        )
        
    except Exception as e:
        logger.error(f"Failed to get templates: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="模板列表获取失败"
        )


@router.get("/download/{filename}")
async def download_file(
    filename: str,
    current_user = Depends(auth.require_permissions(["file:download"]))
):
    """
    下载文件
    
    提供文件下载服务：
    - 转换后的CSV文件
    - 模板文件
    - 报表文件
    
    需要 file:download 权限
    """
    try:
        # 这里应该实现真实的文件下载逻辑
        # 包括文件路径验证、权限检查、安全检查等
        
        # 示例：从临时目录或文件存储服务获取文件
        file_path = f"/tmp/{filename}"  # 实际项目中应该有完整的文件管理系统
        
        if not os.path.exists(file_path):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="文件不存在或已过期"
            )
        
        return FileResponse(
            path=file_path,
            filename=filename,
            media_type='application/octet-stream'
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"File download failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="文件下载失败"
        )


@router.post("/export", response_model=UtilityOperationResponse)
async def export_data(
    export_type: str = Query(..., description="导出类型: employees, payroll, reports"),
    format: str = Query("xlsx", description="导出格式: xlsx, csv, pdf"),
    filters: Optional[str] = Query(None, description="筛选条件（JSON格式）"),
    db: Session = Depends(get_db_v2),
    current_user = Depends(auth.require_permissions(["data:export"]))
):
    """
    数据导出工具
    
    导出各种系统数据：
    - 员工数据
    - 薪资数据  
    - 报表数据
    - 支持多种格式
    
    需要 data:export 权限
    """
    try:
        # 这里应该实现真实的数据导出逻辑
        # 根据类型和格式生成相应的导出文件
        
        logger.info(f"Data export requested: type={export_type}, format={format}, user={current_user.id}")
        
        # 模拟导出过程
        export_filename = f"{export_type}_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.{format}"
        download_url = f"/v2/utilities/download/{export_filename}"
        
        result = {
            "success": True,
            "message": f"数据导出任务已创建",
            "data": {
                "export_type": export_type,
                "format": format,
                "filename": export_filename
            },
            "file_url": download_url
        }
        
        return DataResponse(
            success=True,
            message="数据导出完成",
            data=result
        )
        
    except Exception as e:
        logger.error(f"Data export failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"数据导出失败: {str(e)}"
        )


@router.get("/file-info/{filename}")
async def get_file_info(
    filename: str,
    current_user = Depends(auth.require_permissions(["file:view"]))
):
    """
    获取文件信息
    
    返回指定文件的详细信息：
    - 文件大小
    - 创建时间
    - 修改时间
    - 文件类型
    
    需要 file:view 权限
    """
    try:
        # 这里应该从文件存储系统获取真实的文件信息
        
        file_info = {
            "filename": filename,
            "size": 1024000,  # 示例大小
            "created_at": "2025-01-23T10:00:00Z",
            "modified_at": "2025-01-23T10:00:00Z",
            "file_type": filename.split('.')[-1] if '.' in filename else "unknown",
            "download_count": 5,
            "is_available": True
        }
        
        return DataResponse(
            success=True,
            message="文件信息获取成功",
            data=file_info
        )
        
    except Exception as e:
        logger.error(f"Failed to get file info: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="文件信息获取失败"
        )