from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Query, BackgroundTasks
from typing import Dict, Any
from sqlalchemy.orm import Session
import logging
from sqlalchemy.exc import SQLAlchemyError
import uuid
import os

from .. import auth, file_converter
from ..database import get_db
from ..core.config import settings

# 配置logger
logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/convert",
    tags=["File Conversion"]
)

@router.post("/excel-to-csv")
async def process_salary_excel_import(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    pay_period: str = Query(..., regex=r"^\d{4}-\d{2}$", description="Pay period in YYYY-MM format"),
    db: Session = Depends(get_db),
    current_user: Any = Depends(auth.require_role(["Super Admin", "Data Admin"])) 
):
    """
    处理上传的Excel文件，直接进行处理。
    """
    upload_id = str(uuid.uuid4())
    filename = file.filename if file.filename else "unknown_file"
    logger.info(f"开始处理上传文件: {upload_id}, 文件名: {filename}, 薪资周期: {pay_period}")

    try:
        # 直接将UploadFile的file对象和文件名传递给file_converter
        overall_result = file_converter.process_excel_file(
            file_stream=file.file,
            upload_id=upload_id,
            db=db,
            pay_period=pay_period,
            filename=filename
        )
        db.commit()
        logger.info(f"成功处理文件: {upload_id}")
        return overall_result

    except SQLAlchemyError as db_err:
        logger.error(f"处理文件时发生数据库错误 {upload_id}: {db_err}", exc_info=True)
        db.rollback()
        logger.info(f"数据库事务已回滚 {upload_id}.")
        raise HTTPException(
             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
             detail=f"数据库处理错误 {filename}: {db_err}"
        )
    except HTTPException as http_err:
        logger.warning(f"处理文件时发生HTTP异常 {upload_id}: {http_err.detail}")
        raise http_err 
    except Exception as e:
        logger.error(f"处理文件时发生意外错误 {upload_id}, {filename}: {e}", exc_info=True)
        try:
            db.rollback()
            logger.info(f"数据库事务已回滚 {upload_id}.")
        except Exception as rollback_err:
            logger.error(f"无法回滚事务 {upload_id}: {rollback_err}", exc_info=True)
            
        raise HTTPException(
             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
             detail=f"处理文件时发生错误 {filename}."
        )
    finally:
        if file and hasattr(file, 'file') and hasattr(file.file, 'close'):
            file.file.close()
            logger.info(f"已关闭文件 {filename} (上传ID: {upload_id})") 