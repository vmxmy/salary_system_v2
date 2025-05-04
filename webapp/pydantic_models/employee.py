from pydantic import BaseModel
from typing import List, Optional, Sequence
from datetime import datetime

# --- Employee Related Models ---

class EmployeeBase(BaseModel):
    """员工基础模型"""
    name: str
    id_card_number: str # Consider adding validation regex
    department_id: Optional[int] = None
    employee_unique_id: Optional[str] = None # 工号
    bank_account_number: Optional[str] = None # Added
    bank_name: Optional[str] = None # Added
    establishment_type_id: Optional[int] = None # Added HERE

class EmployeeCreate(EmployeeBase):
    """用于创建新员工的模型"""
    pass

class EmployeeUpdate(BaseModel):
    """用于更新员工信息的模型，所有字段均为可选"""
    name: Optional[str] = None
    id_card_number: Optional[str] = None # Allow updating, but uniqueness check needed
    department_id: Optional[int] = None
    employee_unique_id: Optional[str] = None
    bank_account_number: Optional[str] = None # Added
    bank_name: Optional[str] = None # Added
    establishment_type_id: Optional[int] = None # Added for editing establishment

class EmployeeInDBBase(EmployeeBase):
    """数据库中的员工模型，包含ID和时间戳"""
    id: int # Primary key from DB
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    class Config:
        # orm_mode = True
        from_attributes = True # Use from_attributes for Pydantic v2 compatibility

class EmployeeResponse(EmployeeInDBBase):
    """用于API响应的员工模型，包含关联数据"""
    # Optionally include related data like department name
    department_name: Optional[str] = None
    unit_name: Optional[str] = None
    # establishment_type_id is inherited from EmployeeInDBBase -> EmployeeBase
    establishment_type_name: Optional[str] = None # Added: Name corresponding to establishment_type_id

class EmployeeListResponse(BaseModel):
    """员工列表响应模型，包含分页信息"""
    data: Sequence[EmployeeResponse]  # 使用Sequence替代List
    total: int 