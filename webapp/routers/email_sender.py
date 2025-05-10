import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
import uuid # Add this import at the top
from datetime import datetime # Ensure datetime is imported for completed_at

from .. import auth, models_db, schemas, models
from ..database import get_db, SessionLocal # SessionLocal for background task
from ..pydantic_models.email_sender import SendPayslipRequest, SendPayslipResponse, PayslipSentDetail
from ..pydantic_models.email_sender import (
    EmailSendingTaskResponse,
    EmailSendingTaskHistoryResponse,
    EmailSendingTaskHistoryItem,
    TaskEmailLogsResponse,
    EmailLogResponse # EmailLogResponse might not be directly used as a response model for an endpoint but is part of TaskEmailLogsResponse
)
from ..auth import decrypt_data # For decrypting email server password
import logging
import jinja2 # For HTML email templates

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/email-sender",
    tags=["Email Sender"],
)

# --- Email Sending Logic (Background Task) ---

def format_salary_data_for_email(salary_data: Dict[str, Any]) -> str:
    """Formats salary data into a simple HTML table for email body."""
    if not salary_data:
        return "<p>无工资数据。</p>"

    # Define which columns to include and their display names
    # This can be made more configurable later
    display_fields = {
        "employee_name": "姓名",
        "pay_period_identifier": "工资周期",
        "sal_basic_salary": "基本工资",
        "sal_performance_salary": "绩效工资",
        "sal_allowance": "津贴",
        "sal_subsidy": "补贴",
        "pen_pension_employee_contribution": "养老保险(个人)",
        "med_employee_medical_contribution": "医疗保险(个人)",
        "pen_unemployment_employee_contribution": "失业保险(个人)",
        "hf_housingfund_employee_contribution": "住房公积金(个人)",
        "tax_individual_income_tax": "个人所得税",
        # Add more fields as needed
    }

    html = "<table border='1' cellpadding='5' cellspacing='0' style='border-collapse: collapse;'>"
    html += "<tr><th>项目</th><th>金额</th></tr>"
    for key, display_name in display_fields.items():
        value = salary_data.get(key, 'N/A')
        html += f"<tr><td>{display_name}</td><td>{value}</td></tr>"
    html += "</table>"
    return html

# Basic HTML Email Template (can be loaded from a file)
DEFAULT_EMAIL_TEMPLATE = """
<html>
<head></head>
<body>
    <p>尊敬的 {employee_name}：</p>
    <p>您好！这是您 {pay_period} 的工资单详情。</p>
    {salary_table}
    <p>请注意查收。</p>
    <p>此邮件为系统自动发送，请勿直接回复。</p>
    <p>高新区工资管理系统</p>
</body>
</html>
"""

async def _attempt_smtp_connection(
    task_id: str,
    email_config: models.EmailServerConfig,
    smtp_password: str,
) -> Optional[smtplib.SMTP]:
    logger.info(f"[{task_id}] Attempting SMTP connection for config: {email_config.server_name} (ID: {email_config.id})")

    # Ensure host is stripped of whitespace
    host_to_connect = email_config.host.strip() if email_config.host else None
    if not host_to_connect:
        logger.error(f"[{task_id}] Host is not defined for email config ID: {email_config.id}")
        return None

    smtp_server = None
    last_error = None

    connection_methods_config = [
        {
            "name": "SSL连接",
            "port": 465,
            "use_ssl_implicit": True,
            "needs_tls_explicit": False,
            "config_flag_ssl": True # Corresponds to email_config.use_ssl
        },
        {
            "name": "普通连接+TLS (Port 587)",
            "port": 587,
            "use_ssl_implicit": False,
            "needs_tls_explicit": True,
            "config_flag_tls": True # Corresponds to email_config.use_tls
        },
        {
            "name": "普通连接+TLS (Port 25)",
            "port": 25,
            "use_ssl_implicit": False,
            "needs_tls_explicit": True,
            "config_flag_tls": True # Corresponds to email_config.use_tls (as an alternative)
        },
        {
            "name": "普通连接 (Port 25)", # Potentially unencrypted, last resort
            "port": 25,
            "use_ssl_implicit": False,
            "needs_tls_explicit": False,
            "config_flag_plain": True # If neither SSL nor TLS is set
        }
    ]

    ordered_methods_to_try = []
    if email_config.use_ssl:
        logger.info(f"[{task_id}] Config prefers SSL. Adding SSL method.")
        ordered_methods_to_try.extend([m for m in connection_methods_config if m.get("config_flag_ssl")] )
    elif email_config.use_tls: # Important: elif, so if use_ssl is true, this won't add TLS methods unless logic changes
        logger.info(f"[{task_id}] Config prefers TLS (STARTTLS). Adding STARTTLS methods.")
        ordered_methods_to_try.extend([m for m in connection_methods_config if m.get("config_flag_tls") and m["port"] == 587])
        ordered_methods_to_try.extend([m for m in connection_methods_config if m.get("config_flag_tls") and m["port"] == 25])
    else: # Neither SSL nor TLS is explicitly preferred by config
        logger.info(f"[{task_id}] Config does not specify SSL/TLS, or prefers plain. Adding all methods, STARTTLS first, then Plain, then SSL (as fallback).")
        # Fallback order: STARTTLS 587, STARTTLS 25, Plain 25, SSL 465 (if nothing else specified)
        ordered_methods_to_try.extend([m for m in connection_methods_config if m["name"] == "普通连接+TLS (Port 587)"])
        ordered_methods_to_try.extend([m for m in connection_methods_config if m["name"] == "普通连接+TLS (Port 25)"])
        ordered_methods_to_try.extend([m for m in connection_methods_config if m["name"] == "普通连接 (Port 25)"])
        ordered_methods_to_try.extend([m for m in connection_methods_config if m["name"] == "SSL连接"]) # SSL as last resort if no preference

    # Deduplicate if any method was added multiple times by mistake (e.g. if use_ssl and use_tls were both true)
    final_methods_list = []
    seen_method_names = set()
    for method_cfg in ordered_methods_to_try:
        if method_cfg["name"] not in seen_method_names:
            final_methods_list.append(method_cfg)
            seen_method_names.add(method_cfg["name"])

    if not final_methods_list:
        logger.error(f"[{task_id}] No suitable connection methods determined for {email_config.server_name} based on its config (use_ssl: {email_config.use_ssl}, use_tls: {email_config.use_tls}). Cannot attempt connection.")
        return None

    logger.info(f"[{task_id}] Determined connection attempt order for {email_config.server_name}: {[m['name'] for m in final_methods_list]}")

    for method in final_methods_list:
        current_host = host_to_connect
        current_port = method["port"] # Strictly use the port defined in the method

        logger.info(f"[{task_id}] Trying method: '{method['name']}' to {current_host}:{current_port}")

        if method["name"] == "普通连接 (Port 25)" and not method["needs_tls_explicit"]:
            logger.warning(f"[{task_id}] WARNING: Attempting potentially unencrypted plain connection to {current_host}:{current_port}.")

        temp_smtp_server = None # Temporary server instance for this attempt
        try:
            if method["use_ssl_implicit"]:
                ssl_context = ssl.create_default_context()
                try:
                    ssl_context.minimum_version = ssl.TLSVersion.TLSv1_2
                    logger.info(f"[{task_id}] SSL Context for '{method['name']}': Set minimum_version to TLSv1_2")
                except AttributeError:
                    logger.warning(f"[{task_id}] SSL Context for '{method['name']}': AttributeError - Could not set minimum_version (Python < 3.6 or SSL lib outdated).")
                temp_smtp_server = smtplib.SMTP_SSL(current_host, current_port, context=ssl_context, timeout=10)
            elif method["needs_tls_explicit"]:
                temp_smtp_server = smtplib.SMTP(current_host, current_port, timeout=10)
                temp_smtp_server.ehlo()
                temp_smtp_server.starttls(context=ssl.create_default_context()) # Ensure context for STARTTLS
                temp_smtp_server.ehlo()
            else: # Plain connection
                temp_smtp_server = smtplib.SMTP(current_host, current_port, timeout=10)

            logger.info(f"[{task_id}] Attempting login to {current_host} with username: {email_config.username}")
            temp_smtp_server.login(email_config.username, smtp_password)

            logger.info(f"[{task_id}] SUCCESS: Method '{method['name']}' to {current_host}:{current_port} succeeded.")
            smtp_server = temp_smtp_server # Assign to the main server variable on success
            break # Exit loop on successful connection

        except smtplib.SMTPException as smtp_exc:
            logger.warning(f"[{task_id}] SMTP Error with '{method['name']}' to {current_host}:{current_port}: {smtp_exc}", exc_info=False) # exc_info=False for brevity on common SMTP errors
            last_error = smtp_exc
            if temp_smtp_server:
                try: temp_smtp_server.quit()
                except: pass
        except Exception as e:
            logger.warning(f"[{task_id}] General Error with '{method['name']}' to {current_host}:{current_port}: {e}", exc_info=True)
            last_error = e # Keep full trace for general errors
            if temp_smtp_server:
                try: temp_smtp_server.quit()
                except: pass

    if smtp_server:
        logger.info(f"[{task_id}] Successfully established SMTP connection to {email_config.host} using '{method['name']}' on port {current_port}.")
        return smtp_server
    else:
        logger.error(f"[{task_id}] All attempted connection methods failed for {email_config.host}. Last error: {last_error}")
        return None


async def send_payslip_email_task(
    request_data: SendPayslipRequest,
    task_uuid: uuid.UUID, # New parameter
    requested_by_user_id: Optional[int] # New parameter
):
    # task_id is now task_uuid, passed as an argument
    # db session is now created inside this task, and closed appropriately
    db: Session = SessionLocal()
    logger.info(f"[{task_uuid}] Background task started for sending payslips for period {request_data.pay_period}. Config ID: {request_data.email_config_id}")

    # Initial Task Record Creation (moved from API endpoint)
    # This happens before any potential failure points like email config loading or decryption.
    # total_employees_matched will be updated later after querying employees.
    try:
        models_db.create_email_sending_task(
            db=db,
            task_uuid=task_uuid,
            pay_period=request_data.pay_period,
            email_config_id=request_data.email_config_id,
            filters_applied=request_data.filters.model_dump(), # Store filters
            subject_template=request_data.subject_template,
            requested_by_user_id=requested_by_user_id,
            total_employees_matched=0 # Initial value, will be updated
        )
        logger.info(f"[{task_uuid}] Initial EmailSendingTask record created.")
    except Exception as task_create_exc:
        logger.error(f"[{task_uuid}] CRITICAL: Failed to create initial EmailSendingTask record: {task_create_exc}. Aborting task.", exc_info=True)
        if db: db.close()
        return


    email_config_orm = models_db.get_email_server_config(db, request_data.email_config_id)
    if not email_config_orm:
        err_msg = f"Email server config ID {request_data.email_config_id} not found."
        logger.error(f"[{task_uuid}] {err_msg} Aborting task.")
        models_db.update_email_sending_task_status(db, task_uuid, status="failed", completed_at=datetime.utcnow(), error_message=err_msg)
        if db: db.close()
        return

    try:
        smtp_password = decrypt_data(email_config_orm.encrypted_password)
        if not smtp_password:
            err_msg = f"Failed to decrypt password for email config {email_config_orm.server_name}."
            logger.error(f"[{task_uuid}] {err_msg} Aborting task.")
            models_db.update_email_sending_task_status(db, task_uuid, status="failed", completed_at=datetime.utcnow(), error_message=err_msg)
            if db: db.close()
            return
    except Exception as e:
        err_msg = f"Decryption error for email config {email_config_orm.server_name}: {e}."
        logger.error(f"[{task_uuid}] {err_msg} Aborting task.")
        models_db.update_email_sending_task_status(db, task_uuid, status="failed", completed_at=datetime.utcnow(), error_message=str(e))
        if db: db.close()
        return

    smtp_server_instance = None
    overall_task_status = "processing" # Default to processing
    final_error_message_for_task = None
    sent_count = 0
    failed_count = 0
    skipped_count = 0

    try:
        # Update task status to 'processing'
        models_db.update_email_sending_task_status(db, task_uuid, status="processing")
        logger.info(f"[{task_uuid}] EmailSendingTask status updated to 'processing'.")

        smtp_server_instance = await _attempt_smtp_connection(str(task_uuid), email_config_orm, smtp_password)

        if not smtp_server_instance:
            err_msg = f"SMTP connection failed for {email_config_orm.server_name}, cannot send emails."
            logger.error(f"[{task_uuid}] {err_msg}")
            overall_task_status = "failed"
            final_error_message_for_task = err_msg
            # Exception with details is already logged by _attempt_smtp_connection if all methods failed.
            # db session will be closed in the finally block of this main try.
            return # Task cannot proceed, finally block will update status

        # If connection successful, proceed with email sending
        employee_query = db.query(models.Employee)
        if request_data.filters.employee_ids:
            employee_query = employee_query.filter(models.Employee.id.in_(request_data.filters.employee_ids))
        elif request_data.filters.department_ids:
            employee_query = employee_query.filter(models.Employee.department_id.in_(request_data.filters.department_ids))
        elif request_data.filters.unit_ids:
            employee_query = employee_query.join(models.Department).filter(models.Department.unit_id.in_(request_data.filters.unit_ids))

        employees_to_email = employee_query.all()
        total_employees_actually_matched = len(employees_to_email)
        logger.info(f"[{task_uuid}] Found {total_employees_actually_matched} employees matching criteria for config {email_config_orm.server_name}.")

        # Update total_employees_matched in the task record
        models_db.update_email_sending_task_stats(db, task_uuid, matched_employees=total_employees_actually_matched)


        for emp in employees_to_email:
            logger.info(f"[{task_uuid}] Preparing email for {emp.name} (ID: {emp.id})")
            log_status = ""
            log_error_msg = None

            if not emp.email:
                logger.warning(f"[{task_uuid}] No email for {emp.name}. Skipping.")
                log_status = "skipped_no_email"
                skipped_count += 1
                models_db.create_email_log_entry(
                    db=db, sender_email=email_config_orm.sender_email, recipient_emails=[f"NO_EMAIL_FOR_EMPLOYEE_ID_{emp.id}"],
                    subject=f"工资单发送跳过 (无邮箱): {emp.name} - {request_data.pay_period}", status=log_status,
                    task_uuid=task_uuid, # Add task_uuid
                    sender_employee_id=requested_by_user_id # Log who initiated if available
                )
                models_db.update_email_sending_task_stats(db, task_uuid, skipped_increment=1)
                continue

            salary_data = models_db.get_employee_payslip_data(db, emp.id_card_number, request_data.pay_period)
            if not salary_data:
                logger.warning(f"[{task_uuid}] No salary data for {emp.name}, period {request_data.pay_period}. Skipping.")
                log_status = "skipped_no_salary_data"
                skipped_count += 1
                models_db.create_email_log_entry(
                    db=db, sender_email=email_config_orm.sender_email, recipient_emails=[emp.email or f"NO_EMAIL_FOR_{emp.id}"],
                    subject=f"工资单发送跳过 (无数据): {emp.name} - {request_data.pay_period}", status=log_status,
                    task_uuid=task_uuid, # Add task_uuid
                    sender_employee_id=requested_by_user_id
                )
                models_db.update_email_sending_task_stats(db, task_uuid, skipped_increment=1)
                continue

            subject = request_data.subject_template.format(pay_period=request_data.pay_period, employee_name=emp.name)
            salary_table_html = format_salary_data_for_email(salary_data)
            html_body = DEFAULT_EMAIL_TEMPLATE.format(employee_name=emp.name, pay_period=request_data.pay_period, salary_table=salary_table_html)

            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = email_config_orm.sender_email
            msg['To'] = emp.email
            part_html = MIMEText(html_body, 'html', 'utf-8')
            msg.attach(part_html)

            try:
                smtp_server_instance.sendmail(email_config_orm.sender_email, [emp.email], msg.as_string())
                logger.info(f"[{task_uuid}] Successfully sent payslip to {emp.name} ({emp.email}) for period {request_data.pay_period}")
                log_status = "sent"
                sent_count += 1
                models_db.create_email_log_entry(
                    db=db, sender_email=email_config_orm.sender_email, recipient_emails=[emp.email],
                    subject=subject, status=log_status, body=html_body,
                    task_uuid=task_uuid, # Add task_uuid
                    sender_employee_id=requested_by_user_id
                )
                models_db.update_email_sending_task_stats(db, task_uuid, sent_increment=1)
            except smtplib.SMTPException as send_exc:
                logger.error(f"[{task_uuid}] Failed to send email to {emp.name} ({emp.email}): {send_exc}")
                log_status = "failed"
                log_error_msg = str(send_exc)
                failed_count += 1
                models_db.create_email_log_entry(
                    db=db, sender_email=email_config_orm.sender_email, recipient_emails=[emp.email],
                    subject=subject, status=log_status, body=html_body, error_message=log_error_msg,
                    task_uuid=task_uuid, # Add task_uuid
                    sender_employee_id=requested_by_user_id
                )
                models_db.update_email_sending_task_stats(db, task_uuid, failed_increment=1)
            except Exception as general_send_exc: # Catch other potential errors during send
                logger.error(f"[{task_uuid}] Unexpected error sending email to {emp.name} ({emp.email}): {general_send_exc}", exc_info=True)
                log_status = "failed"
                log_error_msg = str(general_send_exc)
                failed_count += 1
                models_db.create_email_log_entry(
                    db=db, sender_email=email_config_orm.sender_email, recipient_emails=[emp.email],
                    subject=subject, status=log_status, body=html_body, error_message=log_error_msg,
                    task_uuid=task_uuid, # Add task_uuid
                    sender_employee_id=requested_by_user_id
                )
                models_db.update_email_sending_task_stats(db, task_uuid, failed_increment=1)

        # After loop, determine overall task status
        if failed_count > 0 and sent_count > 0:
            overall_task_status = "completed_with_errors"
        elif failed_count > 0 and sent_count == 0 and skipped_count == 0 : # All attempted emails failed
             overall_task_status = "failed"
             final_error_message_for_task = "All email attempts failed. Check individual logs."
        elif failed_count > 0 and sent_count == 0 and skipped_count > 0:
             overall_task_status = "completed_with_errors" # Some skipped, some failed, none sent
             final_error_message_for_task = "Some emails failed, others were skipped. No emails sent successfully."
        elif sent_count > 0 and failed_count == 0 and skipped_count == 0: # All matched were sent successfully
            overall_task_status = "completed"
        elif sent_count > 0 and (failed_count > 0 or skipped_count > 0):
             overall_task_status = "completed_with_errors"
        elif sent_count == 0 and failed_count == 0 and skipped_count > 0 and skipped_count == total_employees_actually_matched: # All were skipped
             overall_task_status = "completed_with_skips" # Or perhaps just "completed" if skipping isn't an error state for the task itself
        elif total_employees_actually_matched == 0:
             overall_task_status = "completed_no_recipients"
        else: # Default to completed if no other specific error state, or some other mixed scenario
            overall_task_status = "completed"
            if failed_count > 0:
                overall_task_status = "completed_with_errors"
                final_error_message_for_task = f"{failed_count} emails failed. Check logs."
            elif skipped_count > 0:
                # If only skips and no sends/failures, it's still 'completed' but with context.
                # The individual logs and counts (sent, failed, skipped) provide details.
                pass


    except Exception as e: # Catch-all for errors during the main email sending loop or setup before it
        logger.error(f"[{task_uuid}] Critical error in send_payslip_email_task for config {request_data.email_config_id}: {e}", exc_info=True)
        overall_task_status = "failed"
        final_error_message_for_task = str(e)
    finally:
        if smtp_server_instance:
            try:
                logger.info(f"[{task_uuid}] Closing SMTP server connection for {email_config_orm.server_name if 'email_config_orm' in locals() else 'N/A'}.")
                smtp_server_instance.quit()
            except Exception as quit_exc:
                logger.warning(f"[{task_uuid}] Error quitting SMTP server: {quit_exc}")

        # Update final task status
        try:
            models_db.update_email_sending_task_status(
                db,
                task_uuid,
                status=overall_task_status,
                completed_at=datetime.utcnow(),
                error_message=final_error_message_for_task
            )
            logger.info(f"[{task_uuid}] Final EmailSendingTask status set to '{overall_task_status}'.")
        except Exception as final_status_update_exc:
            logger.error(f"[{task_uuid}] CRITICAL: Failed to update final EmailSendingTask status: {final_status_update_exc}", exc_info=True)

        if db:
            logger.info(f"[{task_uuid}] Closing database session.")
            db.close()

    logger.info(f"[{task_uuid}] Background task send_payslip_email_task finished for period {request_data.pay_period}. Config ID: {request_data.email_config_id}. Final Status: {overall_task_status}")


@router.post("/send-payslip", response_model=SendPayslipResponse, status_code=status.HTTP_202_ACCEPTED)
async def send_payslips_api(
    request_data: SendPayslipRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db), # For initial checks before queueing
    current_user: schemas.UserResponse = Depends(auth.require_role(["Super Admin", "Data Admin"]))
):
    """
    通过后台任务发送工资单邮件。
    - 接收单位、部门或员工ID列表以及工资周期作为参数。
    - 使用指定的邮件服务器配置。
    - 返回一个任务ID用于后续状态查询。
    """
    if not request_data.filters.unit_ids and \
       not request_data.filters.department_ids and \
       not request_data.filters.employee_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="至少需要提供一个筛选条件 (单位ID, 部门ID, 或员工ID列表)。"
        )

    # Quick check if email config exists before queueing
    email_config = models_db.get_email_server_config(db, request_data.email_config_id)
    if not email_config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"邮件服务器配置 ID {request_data.email_config_id} 未找到。"
        )

    # Generate a UUID for this task
    task_uuid_obj = uuid.uuid4()
    task_uuid_str = str(task_uuid_obj)

    # Estimate number of employees for initial response (actual count in task will be more accurate)
    # This is a rough estimate and might differ from actual emails sent
    employee_query = db.query(models.Employee.id) # Query only IDs for count
    if request_data.filters.employee_ids:
        employee_query = employee_query.filter(models.Employee.id.in_(request_data.filters.employee_ids))
    elif request_data.filters.department_ids:
        employee_query = employee_query.filter(models.Employee.department_id.in_(request_data.filters.department_ids))
    elif request_data.filters.unit_ids:
        employee_query = employee_query.join(models.Department).filter(models.Department.unit_id.in_(request_data.filters.unit_ids))

    total_matched_estimate = employee_query.count()

    logger.info(f"Queuing payslip email task {task_uuid_str} for period {request_data.pay_period} by user {current_user.username}. Estimated employees: {total_matched_estimate}")

    # The background task will now create the EmailSendingTask record itself.
    # We pass task_uuid and requested_by_user_id to the task.
    background_tasks.add_task(send_payslip_email_task, request_data, task_uuid_obj, current_user.id)

    return SendPayslipResponse(
        message="工资单邮件发送任务已加入队列。",
        task_uuid=task_uuid_str, # Return the UUID string
        total_employees_matched=total_matched_estimate # Return initial estimate
    )

# --- API Endpoints for Task Status and History --- START ---

@router.get("/tasks/history", response_model=EmailSendingTaskHistoryResponse)
async def get_email_sending_tasks_history(
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db)
    # 暂时移除认证要求，以便测试功能
    # current_user: schemas.UserResponse = Depends(auth.require_role(["Super Admin", "Data Admin"])) # Or any appropriate role
):
    """获取邮件发送任务的历史记录 (分页)。"""
    tasks, total_count = models_db.get_email_sending_tasks_history(
        db,
        skip=skip,
        limit=limit
        # 暂时移除用户ID筛选，以便测试功能
        # requested_by_user_id=current_user.id # Optional: Filter by current user or allow admins to see all
    )

    # 将EmailSendingTask对象转换为EmailSendingTaskHistoryItem对象
    task_history_items = []
    for task in tasks:
        task_history_item = EmailSendingTaskHistoryItem(
            task_uuid=task.task_uuid,
            pay_period=task.pay_period,
            status=task.status,
            total_employees_matched=task.total_employees_matched,
            total_sent_successfully=task.total_sent_successfully,
            total_failed=task.total_failed,
            total_skipped=task.total_skipped,
            started_at=task.started_at,
            completed_at=task.completed_at,
            requested_by_user_id=task.requested_by_user_id
        )
        task_history_items.append(task_history_item)

    return EmailSendingTaskHistoryResponse(total_count=total_count, tasks=task_history_items)

@router.get("/tasks/{task_uuid_str}", response_model=EmailSendingTaskResponse)
async def get_email_sending_task_status(
    task_uuid_str: str, # Receive as string
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(auth.require_role(["Super Admin", "Data Admin"])) # Or any appropriate role
):
    """获取特定邮件发送任务的详细状态。"""
    try:
        task_uuid = uuid.UUID(task_uuid_str) # Convert string to UUID
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="无效的任务UUID格式。")

    task = models_db.get_email_sending_task_by_uuid(db, task_uuid)
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"任务ID {task_uuid_str} 未找到。")

    # Optional: Add check if current_user is allowed to view this task
    # if task.requested_by_user_id != current_user.id and not current_user.role.name in ["Super Admin", "Data Admin"]:
    #     raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="无权查看此任务。")

    return task

@router.get("/tasks/{task_uuid_str}/logs", response_model=TaskEmailLogsResponse)
async def get_detailed_logs_for_task(
    task_uuid_str: str, # Receive as string
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(auth.require_role(["Super Admin", "Data Admin"])) # Or any appropriate role
):
    """获取特定任务的详细邮件发送日志 (分页)。"""
    try:
        task_uuid = uuid.UUID(task_uuid_str) # Convert string to UUID
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="无效的任务UUID格式。")

    # First, check if the task itself exists to provide a clear error if not
    task = models_db.get_email_sending_task_by_uuid(db, task_uuid)
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"任务ID {task_uuid_str} 未找到，无法获取日志。")

    # Optional: Add check if current_user is allowed to view logs for this task
    # if task.requested_by_user_id != current_user.id and not current_user.role.name in ["Super Admin", "Data Admin"]:
    #     raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="无权查看此任务的日志。")

    logs, total_count = models_db.get_detailed_email_logs_for_task(
        db, task_uuid=task_uuid, skip=skip, limit=limit
    )

    # 将EmailLog对象转换为EmailLogResponse对象
    email_log_responses = []
    for log in logs:
        # 尝试从邮件主题中提取收件人姓名
        recipient_name = None
        if log.subject:
            # 尝试从主题中提取姓名，格式通常是 "工资单 - {employee_name}"
            if " - " in log.subject:
                try:
                    recipient_name = log.subject.split(" - ")[-1]
                except:
                    pass

        email_log_response = EmailLogResponse(
            id=log.id,
            task_uuid=log.task_uuid,
            sender_email=log.sender_email,
            recipient_emails=log.recipient_emails,
            recipient_name=recipient_name,
            subject=log.subject,
            status=log.status,
            sent_at=log.sent_at,
            error_message=log.error_message,
            sender_employee_id=log.sender_employee_id
        )
        email_log_responses.append(email_log_response)

    return TaskEmailLogsResponse(total_count=total_count, logs=email_log_responses)

# --- API Endpoints for Task Status and History --- END ---

# --- Debug API Endpoints --- START ---
@router.post("/tasks/{task_uuid_str}/create-test-log", status_code=status.HTTP_201_CREATED)
async def create_test_email_log(
    task_uuid_str: str,
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(auth.require_role(["Super Admin", "Data Admin"]))
):
    """创建测试邮件日志，用于调试前端显示问题"""
    try:
        task_uuid = uuid.UUID(task_uuid_str)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="无效的任务UUID格式。")

    # 检查任务是否存在
    task = models_db.get_email_sending_task_by_uuid(db, task_uuid)
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"任务ID {task_uuid_str} 未找到。")

    # 创建测试邮件日志
    email_log = models_db.create_test_email_log_for_task(
        db=db,
        task_uuid=task_uuid,
        employee_name="测试员工",
        employee_email="test@example.com",
        status="sent"
    )

    if not email_log:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="创建测试邮件日志失败。")

    return {"message": "测试邮件日志创建成功", "log_id": email_log.id}
# --- Debug API Endpoints --- END ---