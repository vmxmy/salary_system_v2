"""
表格配置相关的API路由。
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any

from ..database import get_db_v2
from ..pydantic_models.common import DataResponse
from webapp.auth import get_current_user, require_permissions
from ..utils import create_error_response
from webapp.models.user_table_config import (
    create_table_config, get_table_configs, get_table_config,
    update_table_config, delete_table_config
)
import logging

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/table-config",
    tags=["Table Configuration"],
)

# 表格列配置的数据结构
PAYROLL_ENTRIES_COLUMNS_CONFIG = {
    "id": {
        "title": "payroll_entries:table.column_id",
        "dataIndex": "id",
        "key": "id",
        "width": 80,
        "sorter": True,
        "search": False,
        "valueType": "digit",
        "fixed": False,
        "required": True
    },
    "employee_name": {
        "title": "payroll_entries:table.column_employee_name",
        "dataIndex": "employee_name",
        "key": "employee_name",
        "width": 120,
        "sorter": True,
        "search": True,
        "valueType": "text",
        "fixed": False,
        "required": True
    },
    "gross_pay": {
        "title": "payroll_entries:table.column_gross_pay",
        "dataIndex": "gross_pay",
        "key": "gross_pay",
        "width": 120,
        "sorter": True,
        "search": False,
        "valueType": "money",
        "align": "right",
        "fixed": False,
        "required": False
    },
    "total_deductions": {
        "title": "payroll_entries:table.column_total_deductions",
        "dataIndex": "total_deductions",
        "key": "total_deductions",
        "width": 120,
        "sorter": True,
        "search": False,
        "valueType": "money",
        "align": "right",
        "fixed": False,
        "required": False
    },
    "net_pay": {
        "title": "payroll_entries:table.column_net_pay",
        "dataIndex": "net_pay",
        "key": "net_pay",
        "width": 120,
        "sorter": True,
        "search": False,
        "valueType": "money",
        "align": "right",
        "fixed": False,
        "required": True
    },
    "status": {
        "title": "payroll_entries:table.column_status",
        "dataIndex": "status_lookup_value_id",
        "key": "status",
        "width": 120,
        "sorter": True,
        "search": False,
        "valueType": "select",
        "fixed": False,
        "required": False
    },
    "remarks": {
        "title": "payroll_entries:table.column_remarks",
        "dataIndex": "remarks",
        "key": "remarks",
        "width": 200,
        "sorter": True,
        "search": True,
        "valueType": "text",
        "fixed": False,
        "required": False
    },
    "action": {
        "title": "common:action.title",
        "key": "action",
        "width": 150,
        "sorter": False,
        "search": False,
        "valueType": "option",
        "fixed": "right",
        "required": True
    }
}

# 默认显示的列
DEFAULT_VISIBLE_COLUMNS = [
    "id", "employee_name", "gross_pay", "total_deductions", 
    "net_pay", "status", "action"
]

@router.get("/columns/{table_id}")
async def get_table_columns_config(
    table_id: str,
    db: Session = Depends(get_db_v2),
    current_user = Depends(get_current_user)
):
    """
    获取表格列配置。
    
    - **table_id**: 表格标识符，如 'payroll_entries'
    """
    try:
        # 根据table_id返回对应的列配置
        if table_id == "payroll_entries":
            # 获取用户自定义的列配置
            user_configs = get_table_configs(
                db=db,
                user_id=current_user.id,
                table_id=table_id,
                config_type="LAYOUT"
            )
            
            # 如果用户有自定义配置，使用用户配置
            if user_configs:
                default_config = user_configs[0]  # 获取第一个配置
                visible_columns = default_config.config_data.get("visible_columns", DEFAULT_VISIBLE_COLUMNS)
                column_order = default_config.config_data.get("column_order", DEFAULT_VISIBLE_COLUMNS)
            else:
                visible_columns = DEFAULT_VISIBLE_COLUMNS
                column_order = DEFAULT_VISIBLE_COLUMNS
            
            # 构建返回的列配置
            columns_config = []
            for col_key in column_order:
                if col_key in PAYROLL_ENTRIES_COLUMNS_CONFIG and col_key in visible_columns:
                    columns_config.append({
                        **PAYROLL_ENTRIES_COLUMNS_CONFIG[col_key],
                        "visible": True
                    })
            
            return DataResponse(data={
                "columns": columns_config,
                "all_columns": PAYROLL_ENTRIES_COLUMNS_CONFIG,
                "visible_columns": visible_columns,
                "column_order": column_order
            })
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=create_error_response(
                    status_code=404,
                    message="Not Found",
                    details=f"Table configuration for '{table_id}' not found"
                )
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting table columns config: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="Internal Server Error",
                details=f"Failed to retrieve table columns config: {str(e)}"
            )
        )

@router.post("/columns/{table_id}")
async def save_table_columns_config(
    table_id: str,
    config_data: Dict[str, Any],
    config_name: str = "default",
    db: Session = Depends(get_db_v2),
    current_user = Depends(get_current_user)
):
    """
    保存表格列配置。
    
    - **table_id**: 表格标识符
    - **config_data**: 配置数据，包含 visible_columns 和 column_order
    - **config_name**: 配置名称，默认为 'default'
    """
    try:
        # 验证配置数据
        if "visible_columns" not in config_data or "column_order" not in config_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=create_error_response(
                    status_code=400,
                    message="Bad Request",
                    details="Config data must contain 'visible_columns' and 'column_order'"
                )
            )
        
        # 创建或更新配置
        db_config = create_table_config(
            db=db,
            user_id=current_user.id,
            table_id=table_id,
            config_type="LAYOUT",
            name=config_name,
            config_data=config_data,
            is_default=True
        )
        
        return DataResponse(data={
            "id": db_config.id,
            "message": "Table columns configuration saved successfully"
        })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error saving table columns config: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="Internal Server Error",
                details=f"Failed to save table columns config: {str(e)}"
            )
        ) 