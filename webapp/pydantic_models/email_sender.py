from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime

class PayslipRecepientFilter(BaseModel):
    unit_ids: Optional[List[int]] = Field(None, description="要发送工资单的单位ID列表")
    department_ids: Optional[List[int]] = Field(None, description="要发送工资单的部门ID列表")
    employee_ids: Optional[List[int]] = Field(None, description="要发送工资单的员工ID列表")

class SendPayslipRequest(BaseModel):
    pay_period: str = Field(..., description="工资单所属的工资周期 (例如 'YYYY-MM')")
    email_config_id: int = Field(..., description="用于发送邮件的邮件服务器配置ID")
    subject_template: Optional[str] = Field("您的 {pay_period} 工资单", description="邮件主题模板, {pay_period} 和 {employee_name} 会被替换")
    # body_template_path: Optional[str] = Field(None, description="邮件正文HTML模板文件路径 (可选, 默认为内置模板)")
    filters: PayslipRecepientFilter = Field(..., description="筛选接收工资单的员工")

    # Ensure at least one filter is provided
    # @validator('filters')
    # def check_at_least_one_filter(cls, v):
    #     if not v.unit_ids and not v.department_ids and not v.employee_ids:
    #         raise ValueError('至少需要提供一个筛选条件 (单位, 部门, 或员工列表)')
    #     return v

class PayslipSentDetail(BaseModel):
    employee_id: int
    employee_name: str
    email: EmailStr
    status: str # "sent", "failed", "skipped_no_email", "skipped_no_salary_data"
    error_message: Optional[str] = None

class SendPayslipResponse(BaseModel):
    message: str
    task_uuid: Optional[str] = Field(None, description="工资单发送任务的唯一ID，用于后续状态查询")
    total_employees_matched: int
    # details: List[PayslipSentDetail] # Detailed status might be too verbose for immediate response, better logged

# --- Pydantic Models for Task Status and History --- START ---

class EmailSendingTaskBase(BaseModel):
    task_uuid: uuid.UUID
    pay_period: str
    email_config_id: int
    filters_applied: Optional[Dict[str, Any]] = None
    subject_template: Optional[str] = None
    requested_by_user_id: Optional[int] = None
    status: str
    total_employees_matched: Optional[int] = 0
    total_sent_successfully: Optional[int] = 0
    total_failed: Optional[int] = 0
    total_skipped: Optional[int] = 0
    started_at: datetime
    completed_at: Optional[datetime] = None
    last_error_message: Optional[str] = None

    class Config:
        orm_mode = True # Enable ORM mode to work with SQLAlchemy models
        json_encoders = {
            datetime: lambda dt: dt.isoformat() if dt else None,
            uuid.UUID: lambda u: str(u) if u else None
        }

class EmailSendingTaskResponse(EmailSendingTaskBase):
    # Inherits all fields from EmailSendingTaskBase
    # Can add specific fields for detailed response if needed later
    pass

class EmailSendingTaskHistoryItem(BaseModel):
    task_uuid: uuid.UUID
    pay_period: str
    status: str
    total_employees_matched: Optional[int] = 0
    total_sent_successfully: Optional[int] = 0
    total_failed: Optional[int] = 0
    total_skipped: Optional[int] = 0
    started_at: datetime
    completed_at: Optional[datetime] = None
    requested_by_user_id: Optional[int] = None # Consider adding username later if needed

    class Config:
        orm_mode = True
        json_encoders = {
            datetime: lambda dt: dt.isoformat() if dt else None,
            uuid.UUID: lambda u: str(u) if u else None
        }

class EmailSendingTaskHistoryResponse(BaseModel):
    total_count: int
    tasks: List[EmailSendingTaskHistoryItem]

class EmailLogResponse(BaseModel):
    id: int
    task_uuid: Optional[uuid.UUID] = None # Made optional as older logs might not have it
    sender_email: str
    recipient_emails: List[EmailStr] # Assuming recipient_emails in DB is a list of strings
    recipient_name: Optional[str] = None # 添加收件人姓名字段
    subject: str
    # body: Optional[str] = None # Usually not needed for log listing
    status: str
    sent_at: datetime
    error_message: Optional[str] = None
    sender_employee_id: Optional[int] = None

    class Config:
        orm_mode = True
        json_encoders = {
            datetime: lambda dt: dt.isoformat() if dt else None,
            uuid.UUID: lambda u: str(u) if u else None
        }

class TaskEmailLogsResponse(BaseModel):
    total_count: int
    logs: List[EmailLogResponse]

# --- Pydantic Models for Task Status and History --- END ---