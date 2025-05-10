from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
import smtplib
import ssl
import logging
import uuid

from .. import auth, models_db, schemas, models # Adjusted import based on common structure
from ..database import get_db
from ..auth import decrypt_data # 用于解密密码
from ..pydantic_models.email_config import (
    EmailServerConfigCreate,
    EmailServerConfigUpdate,
    EmailServerConfigResponse,
    EmailServerConfigListResponse,
    EmailServerTestResponse
)
from .email_sender import _attempt_smtp_connection # Import the shared function

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/email-configs",
    tags=["Email Server Configurations"],
    dependencies=[Depends(auth.require_role(["Super Admin"]))], # Only Super Admins can manage email configs
)

@router.post("/", response_model=EmailServerConfigResponse, status_code=status.HTTP_201_CREATED)
async def create_email_config(
    config_in: EmailServerConfigCreate,
    db: Session = Depends(get_db)
):
    """
    创建新的邮件服务器配置。
    密码将使用 bcrypt 加密存储。
    """
    try:
        logger.info(f"Attempting to create email server config: {config_in.server_name}")
        # Check if config with the same name already exists
        existing_config = models_db.get_email_server_config_by_name(db, server_name=config_in.server_name)
        if existing_config:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Email server configuration with name '{config_in.server_name}' already exists."
            )

        created_config = models_db.create_email_server_config(db=db, config_in=config_in)
        return created_config
    except HTTPException as http_exc:
        logger.error(f"HTTPException during email config creation for '{config_in.server_name}': {http_exc.detail}")
        raise http_exc
    except Exception as e:
        logger.error(f"Failed to create email server config '{config_in.server_name}': {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred: {str(e)}"
        )

@router.get("/{config_id}", response_model=EmailServerConfigResponse)
async def get_email_config(
    config_id: int,
    db: Session = Depends(get_db)
):
    """
    根据ID获取单个邮件服务器配置。
    """
    logger.info(f"Fetching email server config with ID: {config_id}")
    db_config = models_db.get_email_server_config(db, config_id=config_id)
    if db_config is None:
        logger.warning(f"Email server config with ID {config_id} not found.")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Email server configuration not found")
    return db_config

@router.get("/", response_model=EmailServerConfigListResponse)
async def list_email_configs(
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1, description="Page number starting from 1"),
    size: int = Query(10, ge=1, le=100, description="Number of items per page")
):
    """
    获取邮件服务器配置列表，支持分页。
    """
    logger.info(f"Listing email server configs: page={page}, size={size}")
    skip = (page - 1) * size
    configs, total_count = models_db.get_email_server_configs(db, skip=skip, limit=size)
    return EmailServerConfigListResponse(data=configs, total=total_count)

@router.put("/{config_id}", response_model=EmailServerConfigResponse)
async def update_email_config(
    config_id: int,
    config_in: EmailServerConfigUpdate,
    db: Session = Depends(get_db)
):
    """
    更新现有的邮件服务器配置。
    如果提供了密码，将进行 bcrypt 加密并更新。
    """
    try:
        logger.info(f"Attempting to update email server config ID: {config_id}")
        updated_config = models_db.update_email_server_config(db=db, config_id=config_id, config_in=config_in)
        if updated_config is None:
            logger.warning(f"Email server config with ID {config_id} not found for update.")
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Email server configuration not found")
        return updated_config
    except HTTPException as http_exc:
        logger.error(f"HTTPException during email config update for ID {config_id}: {http_exc.detail}")
        raise http_exc
    except Exception as e:
        logger.error(f"Failed to update email server config ID {config_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred: {str(e)}"
        )

@router.delete("/{config_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_email_config(
    config_id: int,
    db: Session = Depends(get_db)
):
    """
    删除邮件服务器配置。
    """
    logger.info(f"Attempting to delete email server config ID: {config_id}")
    success = models_db.delete_email_server_config(db=db, config_id=config_id)
    if not success:
        logger.warning(f"Email server config with ID {config_id} not found for deletion.")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Email server configuration not found")
    logger.info(f"Successfully deleted email server config ID: {config_id}")
    return None # FastAPI handles 204 No Content

@router.post("/{config_id}/test", response_model=EmailServerTestResponse)
async def test_email_config(
    config_id: int,
    db: Session = Depends(get_db)
):
    test_id = str(uuid.uuid4())
    logger.info(f"[{test_id}] Testing email server config ID: {config_id}")

    email_config = models_db.get_email_server_config(db, config_id=config_id)
    if not email_config:
        logger.warning(f"[{test_id}] Email server config with ID {config_id} not found for testing.")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Email server configuration not found")

    try:
        smtp_password = decrypt_data(email_config.encrypted_password)
        if not smtp_password:
            logger.error(f"[{test_id}] Failed to decrypt password for email config {email_config.server_name}.")
            return EmailServerTestResponse(
                success=False,
                message="无法解密邮箱密码，请检查系统配置。"
            )
    except Exception as e:
        logger.error(f"[{test_id}] Decryption error for email config {email_config.server_name}: {e}")
        return EmailServerTestResponse(
            success=False,
            message=f"密码解密错误: {str(e)}"
        )

    smtp_server = None
    try:
        # Call the shared connection logic
        # Note: _attempt_smtp_connection is async, so await it
        smtp_server = await _attempt_smtp_connection(test_id, email_config, smtp_password)

        if smtp_server:
            logger.info(f"[{test_id}] Successfully connected and logged in to SMTP server: {email_config.host} via test function.")
            return EmailServerTestResponse(
                success=True,
                message=f"成功连接到邮件服务器 {email_config.host} (端口通过连接方法自动确定) 并验证登录。"
            )
        else:
            # Error is already logged by _attempt_smtp_connection
            logger.error(f"[{test_id}] Connection test failed for {email_config.host} after trying all suitable methods.")
            return EmailServerTestResponse(
                success=False,
                message=f"连接测试失败。检查日志 (ID: {test_id}) 获取详情。"
            )
    except Exception as e:
        # This catches errors in the flow of test_email_config itself, or if _attempt_smtp_connection raises an unexpected error
        logger.error(f"[{test_id}] Unexpected error during email config test for {email_config.server_name}: {e}", exc_info=True)
        return EmailServerTestResponse(
            success=False,
            message=f"测试过程中发生意外错误: {str(e)}"
        )
    finally:
        if smtp_server:
            try:
                smtp_server.quit()
                logger.info(f"[{test_id}] SMTP server connection closed for {email_config.host}.")
            except Exception as e_quit:
                logger.warning(f"[{test_id}] Error quitting SMTP server during test: {e_quit}")