from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class EmailServerConfigBase(BaseModel):
    server_name: str = Field(..., description="邮件服务器配置的唯一名称")
    host: str = Field(..., description="邮件服务器主机名或IP地址")
    port: int = Field(..., gt=0, lt=65536, description="邮件服务器端口")
    use_tls: bool = Field(True, description="是否使用TLS加密")
    use_ssl: bool = Field(False, description="是否使用SSL加密 (通常TLS优先)")
    username: str = Field(..., description="邮箱用户名")
    sender_email: EmailStr = Field(..., description="发送方邮箱地址")
    is_default: bool = Field(False, description="是否设为默认邮箱服务器")

class EmailServerConfigCreate(EmailServerConfigBase):
    password: str = Field(..., min_length=1, description="邮箱密码 (将进行加密存储)")

class EmailServerConfigUpdate(BaseModel):
    server_name: Optional[str] = Field(None, description="邮件服务器配置的唯一名称")
    host: Optional[str] = Field(None, description="邮件服务器主机名或IP地址")
    port: Optional[int] = Field(None, gt=0, lt=65536, description="邮件服务器端口")
    use_tls: Optional[bool] = Field(None, description="是否使用TLS加密")
    use_ssl: Optional[bool] = Field(None, description="是否使用SSL加密")
    username: Optional[str] = Field(None, description="邮箱用户名")
    password: Optional[str] = Field(None, min_length=1, description="新邮箱密码 (如果提供，将更新并加密存储)")
    sender_email: Optional[EmailStr] = Field(None, description="发送方邮箱地址")

class EmailServerConfigResponse(EmailServerConfigBase):
    id: int
    # encryption_method: Optional[str] = None # 一般不暴露加密方法
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class EmailServerConfigListResponse(BaseModel):
    data: list[EmailServerConfigResponse]
    total: int

class EmailServerTestResponse(BaseModel):
    """邮件服务器连接测试响应"""
    success: bool = Field(..., description="测试是否成功")
    message: str = Field(..., description="测试结果消息")