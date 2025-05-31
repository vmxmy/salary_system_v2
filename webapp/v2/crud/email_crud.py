from typing import Optional, List, Dict, Any, Tuple
import logging
from fastapi import HTTPException, status
from datetime import datetime, timezone
import uuid

from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from sqlalchemy import func, or_, and_, text, Column, String, Integer, BigInteger, UniqueConstraint, ForeignKey, TIMESTAMP, Identity, Text, Numeric, Boolean
from sqlalchemy.dialects.postgresql import JSONB

from ... import schemas
from ... import models
from ...database import Base
from ...pydantic_models import SalaryRecordUpdate # This might not be needed in email_crud, will review later

logger = logging.getLogger(__name__)

# --- ORM CRUD Functions for Email Server Configs --- START ---

def create_email_server_config(db: Session, config_in: schemas.EmailServerConfigCreate) -> models.EmailServerConfig:
    """Creates a new email server configuration, symmetrically encrypting the password."""
    from ...auth import encrypt_data # Use symmetric encryption

    encrypted_pass = encrypt_data(config_in.password)
    if not encrypted_pass:
        # Handle encryption failure, perhaps by raising an HTTPException
        logger.error(f"Failed to encrypt password for email server config: {config_in.server_name}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Password encryption failed.")

    # 如果要设置为默认配置，先将所有其他配置的is_default设为False
    if config_in.is_default:
        try:
            db.query(models.EmailServerConfig).filter(models.EmailServerConfig.is_default == True).update({"is_default": False})
            db.flush()  # 确保更新已应用但不提交事务
        except Exception as e:
            logger.error(f"Error resetting default email server configs: {e}")
            # 继续执行，因为唯一索引会确保只有一个默认配置

    db_config = models.EmailServerConfig(
        server_name=config_in.server_name,
        host=config_in.host,
        port=config_in.port,
        use_tls=config_in.use_tls,
        use_ssl=config_in.use_ssl,
        username=config_in.username,
        encrypted_password=encrypted_pass, # Store symmetrically encrypted password
        encryption_method="fernet", # Explicitly Fernet
        sender_email=config_in.sender_email,
        is_default=config_in.is_default
    )
    try:
        db.add(db_config)
        db.commit()
        db.refresh(db_config)
        return db_config
    except IntegrityError as e:
        db.rollback()
        logger.error(f"Integrity error creating email server config '{config_in.server_name}': {e}", exc_info=True)
        if "uq_email_server_configs_server_name" in str(e).lower() or "email_server_configs_server_name_key" in str(e).lower():
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Email server configuration with name '{config_in.server_name}' already exists.")
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Database integrity error during email server config creation.")
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating email server config: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Could not create email server configuration.")

def get_email_server_config(db: Session, config_id: int) -> Optional[models.EmailServerConfig]:
    """Fetches an email server configuration by ID."""
    return db.query(models.EmailServerConfig).filter(models.EmailServerConfig.id == config_id).first()

def get_email_server_config_by_name(db: Session, server_name: str) -> Optional[models.EmailServerConfig]:
    """Fetches an email server configuration by server_name."""
    return db.query(models.EmailServerConfig).filter(models.EmailServerConfig.server_name == server_name).first()

def get_email_server_configs(db: Session, skip: int = 0, limit: int = 100) -> Tuple[List[models.EmailServerConfig], int]:
    """Fetches a paginated list of email server configurations."""
    query = db.query(models.EmailServerConfig)
    total_count = query.count()
    configs = query.order_by(models.EmailServerConfig.server_name).offset(skip).limit(limit).all()
    return configs, total_count

def update_email_server_config(db: Session, config_id: int, config_in: schemas.EmailServerConfigUpdate) -> Optional[models.EmailServerConfig]:
    """Updates an email server configuration. Symmetrically encrypts password if provided."""
    from ...auth import encrypt_data # Use symmetric encryption

    db_config = get_email_server_config(db, config_id)
    if not db_config:
        return None

    update_data = config_in.model_dump(exclude_unset=True)

    if "password" in update_data and update_data["password"]:
        encrypted_pass = encrypt_data(update_data["password"])
        if not encrypted_pass:
            logger.error(f"Failed to encrypt password during update for email server config ID: {config_id}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Password encryption failed during update.")
        db_config.encrypted_password = encrypted_pass
        db_config.encryption_method = "fernet" # Ensure method is updated
        del update_data["password"] # Remove plain password from update_data

    if "server_name" in update_data and update_data["server_name"] != db_config.server_name:
        existing_config = get_email_server_config_by_name(db, update_data["server_name"])
        if existing_config and existing_config.id != config_id:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Email server configuration with name '{update_data['server_name']}' already exists.")

    # 如果要设置为默认配置，先将所有其他配置的is_default设为False
    if update_data.get('is_default'):
        try:
            db.query(models.EmailServerConfig).filter(
                models.EmailServerConfig.id != config_id,
                models.EmailServerConfig.is_default == True
            ).update({"is_default": False})
            db.flush()  # 确保更新已应用但不提交事务
        except Exception as e:
            logger.error(f"Error resetting default email server configs during update: {e}")
            # 继续执行，因为唯一索引会确保只有一个默认配置

    for key, value in update_data.items():
        setattr(db_config, key, value)

    try:
        db.commit()
        db.refresh(db_config)
        return db_config
    except IntegrityError as e:
        db.rollback()
        logger.error(f"Integrity error updating email server config ID {config_id}: {e}", exc_info=True)
        if "uq_email_server_configs_server_name" in str(e).lower() or "email_server_configs_server_name_key" in str(e).lower():
             raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Email server configuration name conflict during update.")
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Database integrity error during email server config update.")
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating email server config ID {config_id}: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Could not update email server configuration.")

def delete_email_server_config(db: Session, config_id: int) -> bool:
    """Deletes an email server configuration."""
    db_config = get_email_server_config(db, config_id)
    if not db_config:
        return False
    try:
        db.delete(db_config)
        db.commit()
        return True
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting email server config ID {config_id}: {e}", exc_info=True)
        # Consider if there are dependencies before allowing deletion or raise specific error
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Could not delete email server configuration.")

# --- ORM CRUD Functions for Email Server Configs --- END ---
# --- ORM CRUD Functions for Email Logs --- START ---

def create_email_log_entry(
    db: Session,
    sender_email: str,
    recipient_emails: List[str],
    subject: str,
    status: str, # "sent", "failed", "pending", "skipped_no_email", "skipped_no_salary_data"
    task_uuid: uuid.UUID, # New parameter
    body: Optional[str] = None,
    error_message: Optional[str] = None,
    sender_employee_id: Optional[int] = None
) -> models.EmailLog:
    """Creates an email log entry in the database."""
    db_log = models.EmailLog(
        sender_email=sender_email,
        recipient_emails=recipient_emails, # Pydantic model will handle conversion to JSON for DB if needed
        subject=subject,
        body=body,
        status=status,
        error_message=error_message,
        sender_employee_id=sender_employee_id,
        task_uuid=task_uuid # Save the new field
    )
    try:
        db.add(db_log)
        db.commit()
        db.refresh(db_log)
        return db_log
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Error creating email log entry: {e}")
        # Depending on how critical this is, you might re-raise or handle differently
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Could not save email log.")

# --- ORM CRUD Functions for Email Logs --- END ---
# --- ORM Functions for Payslip Data --- START ---

def get_employee_payslip_data(db: Session, employee_id_card: str, pay_period: str) -> Optional[Dict[str, Any]]:
    """
    Fetches salary data for a specific employee and pay period from the
    staging.consolidated_data table.
    Returns a dictionary of the salary record or None if not found.
    """
    # Assuming 'id_card_number' is the link to employees and is present in consolidated_data
    # And 'pay_period_identifier' matches the pay_period format 'YYYY-MM'

    # This function reuses parts of the existing get_salary_data logic but is more targeted.
    # We select all columns for simplicity, but you could specify them.

    query_sql = text(f"""
        SELECT *
        FROM staging.consolidated_data
        WHERE id_card_number = :id_card_number AND pay_period_identifier = :pay_period
        LIMIT 1;
    """)

    params = {"id_card_number": employee_id_card, "pay_period": pay_period}

    try:
        result = db.execute(query_sql, params)
        row = result.mappings().first() # Use .first() as we expect at most one record

        if row:
            return dict(row)
        return None

    except SQLAlchemyError as e:
        logger.error(f"SQLAlchemy error fetching payslip data for employee ID card {employee_id_card}, period {pay_period}: {e}", exc_info=True)
        # Depending on how critical this is, you might raise an HTTPException or return None
        # For now, returning None to indicate data not found or error.
        return None
    except Exception as e:
        logger.error(f"Unexpected error fetching payslip data for employee ID card {employee_id_card}, period {pay_period}: {e}", exc_info=True)
        return None

# --- ORM Functions for Payslip Data --- END ---

# --- Email Sending Task DB Operations --- START ---

def create_email_sending_task(
    db: Session,
    task_uuid: uuid.UUID,
    pay_period: str,
    email_config_id: int,
    filters_applied: Optional[Dict[str, Any]],
    subject_template: Optional[str],
    requested_by_user_id: Optional[int],
    total_employees_matched: Optional[int] = 0
) -> models.EmailSendingTask:
    """Creates a new email sending task record."""
    db_task = models.EmailSendingTask(
        task_uuid=task_uuid,
        pay_period=pay_period,
        email_config_id=email_config_id,
        filters_applied=filters_applied,
        subject_template=subject_template,
        requested_by_user_id=requested_by_user_id,
        total_employees_matched=total_employees_matched,
        status='queued' # Initial status
    )
    try:
        db.add(db_task)
        db.commit()
        db.refresh(db_task)
        return db_task
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Error creating email sending task: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Could not create email sending task.")

def get_email_sending_task_by_uuid(db: Session, task_uuid: uuid.UUID) -> Optional[models.EmailSendingTask]:
    """Fetches an email sending task by its UUID."""
    try:
        return db.query(models.EmailSendingTask).filter(models.EmailSendingTask.task_uuid == task_uuid).first()
    except SQLAlchemyError as e:
        logger.error(f"Error fetching email sending task {task_uuid}: {e}")
        return None

def update_email_sending_task_status(
    db: Session,
    task_uuid: uuid.UUID,
    status: str,
    completed_at: Optional[datetime] = None,
    error_message: Optional[str] = None
) -> Optional[models.EmailSendingTask]:
    """Updates the status and optionally completed_at and error_message of an email sending task."""
    try:
        db_task = db.query(models.EmailSendingTask).filter(models.EmailSendingTask.task_uuid == task_uuid).first()
        if db_task:
            db_task.status = status
            if completed_at:
                db_task.completed_at = completed_at
            if error_message is not None: # Allow clearing error message with empty string
                db_task.last_error_message = error_message
            db.commit()
            db.refresh(db_task)
            return db_task
        return None
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Error updating status for email sending task {task_uuid}: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Could not update task status.")

def update_email_sending_task_stats(
    db: Session,
    task_uuid: uuid.UUID,
    sent_increment: int = 0,
    failed_increment: int = 0,
    skipped_increment: int = 0,
    matched_employees: Optional[int] = None
) -> Optional[models.EmailSendingTask]:
    """Atomically updates the statistics for an email sending task.
       Can also set the total_employees_matched if provided.
    """
    try:
        db_task = db.query(models.EmailSendingTask).filter(models.EmailSendingTask.task_uuid == task_uuid).with_for_update().first()
        if db_task:
            if matched_employees is not None:
                db_task.total_employees_matched = matched_employees
            db_task.total_sent_successfully = (db_task.total_sent_successfully or 0) + sent_increment
            db_task.total_failed = (db_task.total_failed or 0) + failed_increment
            db_task.total_skipped = (db_task.total_skipped or 0) + skipped_increment
            db.commit()
            db.refresh(db_task)
            return db_task
        return None
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Error updating stats for email sending task {task_uuid}: {e}")
        # Not raising HTTPException here as this might be called in a background task loop
        return None # Allow caller to handle this

def get_email_sending_tasks_history(
    db: Session,
    skip: int = 0,
    limit: int = 10,
    requested_by_user_id: Optional[int] = None
) -> Tuple[List[models.EmailSendingTask], int]:
    """Fetches a paginated history of email sending tasks, optionally filtered by user."""
    try:
        query = db.query(models.EmailSendingTask)
        # 暂时移除用户ID筛选，以便测试功能
        # if requested_by_user_id:
        #     query = query.filter(models.EmailSendingTask.requested_by_user_id == requested_by_user_id)

        total_count = query.count() # Get total count before pagination
        tasks = query.order_by(models.EmailSendingTask.started_at.desc()).offset(skip).limit(limit).all()
        return tasks, total_count
    except SQLAlchemyError as e:
        logger.error(f"Error fetching email sending tasks history: {e}")
        return [], 0

def get_detailed_email_logs_for_task(
    db: Session,
    task_uuid: uuid.UUID,
    skip: int = 0,
    limit: int = 100
) -> Tuple[List[models.EmailLog], int]:
    """Fetches paginated detailed email logs for a specific task UUID."""
    try:
        # 打印task_uuid的值和类型，用于调试
        logger.info(f"Fetching email logs for task_uuid: {task_uuid} (type: {type(task_uuid)})")

        # 查询数据库中的所有EmailLog记录，用于调试
        all_logs = db.query(models.EmailLog).all()
        logger.info(f"Total email logs in database: {len(all_logs)}")
        for log in all_logs[:5]:  # 只打印前5条记录，避免日志过长
            logger.info(f"Log ID: {log.id}, task_uuid: {log.task_uuid} (type: {type(log.task_uuid) if log.task_uuid else None})")

        # 使用字符串比较，避免UUID类型不匹配的问题
        query = db.query(models.EmailLog).filter(models.EmailLog.task_uuid == task_uuid)
        total_count = query.count()
        logger.info(f"Found {total_count} logs matching task_uuid: {task_uuid}")

        logs = query.order_by(models.EmailLog.sent_at.desc()).offset(skip).limit(limit).all()
        return logs, total_count
    except SQLAlchemyError as e:
        logger.error(f"Error fetching detailed email logs for task {task_uuid}: {e}")
        return [], 0

def create_test_email_log_for_task(
    db: Session,
    task_uuid: uuid.UUID,
    employee_id: int = 1,
    employee_name: str = "测试员工",
    employee_email: str = "test@example.com",
    status: str = "sent"
) -> models.EmailLog:
    """创建测试邮件日志，用于调试前端显示问题"""
    try:
        # 获取任务详情
        task = get_email_sending_task_by_uuid(db, task_uuid)
        if not task:
            logger.error(f"Task {task_uuid} not found when creating test email log")
            return None

        # 创建测试邮件日志
        email_log = models.EmailLog(
            task_uuid=task_uuid,
            sender_email="system@example.com",
            recipient_emails=[employee_email],
            subject=f"{task.pay_period}工资单 - {employee_name}", # 修改主题格式，使其与实际邮件格式一致
            body=f"<p>这是一封测试邮件，发送给 {employee_name}，工资周期为 {task.pay_period}。</p>",
            status=status,
            sent_at=datetime.utcnow(),
            error_message=None if status == "sent" else "测试错误信息",
            sender_employee_id=task.requested_by_user_id
        )

        db.add(email_log)
        db.commit()
        db.refresh(email_log)
        logger.info(f"Created test email log: {email_log.id} for task {task_uuid}")
        return email_log
    except Exception as e:
        logger.error(f"Error creating test email log for task {task_uuid}: {e}")
        db.rollback()
        return None

# --- Email Sending Task DB Operations --- END ---