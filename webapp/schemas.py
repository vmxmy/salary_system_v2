from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any, Literal, Union
from datetime import datetime, date

# --- Token Schemas ---

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None
    scopes: List[str] = [] # Optional: If we implement finer-grained scopes later

# --- Role Schemas ---

class RoleBase(BaseModel):
    name: str = Field(..., max_length=50)
    description: Optional[str] = None

class RoleCreate(RoleBase):
    pass # No extra fields needed for creation typically

class RoleUpdate(BaseModel): # Separate model for updates
    name: Optional[str] = Field(None, max_length=50)
    description: Optional[str] = None

class RoleInDBBase(RoleBase):
    id: int

    class Config:
        from_attributes = True # Changed from orm_mode=True for Pydantic v2

# Response model for single role and list items
class RoleResponse(RoleInDBBase):
    pass # Inherits all fields

# Response model for list roles
class RoleListResponse(BaseModel):
    data: List[RoleResponse]
    total: int # Optional: if pagination is needed for roles

# --- User Schemas ---

class UserBase(BaseModel):
    username: str = Field(..., max_length=100)
    email: EmailStr
    is_active: Optional[bool] = True

class UserCreate(UserBase):
    password: str # Password needed only for creation
    role_id: int # Role required for creation

class UserRegister(BaseModel): # NEW Schema for registration
    username: str = Field(..., max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8) # Add min length validation

class UserUpdate(BaseModel): # All fields optional for update
    username: Optional[str] = Field(None, max_length=100)
    email: Optional[EmailStr] = None # ADDED optional email update
    password: Optional[str] = None # Allow password update
    role_id: Optional[int] = None
    is_active: Optional[bool] = None

class UserInDBBase(UserBase):
    id: int
    role_id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    # hashed_password should NOT be included in API responses

    class Config:
        from_attributes = True

# Response model used when getting user details or listing users
class UserResponse(UserInDBBase):
    role: Optional[RoleResponse] = None # Include role details in response

# Response model for listing users with pagination
class UserListResponse(BaseModel):
    data: List[UserResponse]
    total: int 

# --- Password Update Schema ---
class PasswordUpdate(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8) 

# --- Pydantic Model for Department --- END

# --- Pydantic Model for Report Link --- START
class ReportLinkBase(BaseModel):
    """基础报表链接模型"""
    name: str = Field(..., description="报表名称")
    url: str = Field(..., description="报表URL链接")
    description: Optional[str] = Field(None, description="报表描述")
    category: Optional[str] = Field(None, description="报表分类")
    is_active: bool = Field(True, description="是否激活")
    display_order: int = Field(0, description="显示顺序")
    require_role: Optional[str] = Field(None, description="查看所需角色")

class ReportLinkCreate(ReportLinkBase):
    """创建报表链接模型"""
    pass

class ReportLinkUpdate(BaseModel):
    """更新报表链接模型"""
    name: Optional[str] = None
    url: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    is_active: Optional[bool] = None
    display_order: Optional[int] = None
    require_role: Optional[str] = None

class ReportLinkResponse(ReportLinkBase):
    """报表链接响应模型"""
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class ReportLinkListResponse(BaseModel):
    """报表链接列表响应模型"""
    data: List[ReportLinkResponse]
    total: int

class ActiveReportLinkResponse(BaseModel):
    """活跃报表链接响应模型（用于菜单）"""
    id: int
    name: str
    url: str
    category: Optional[str]
    display_order: int

    class Config:
        orm_mode = True

# --- Pydantic Model for Salary Record (Used in get_salary_data) --- START
# TODO: Define this more precisely based on view_level1_calculations columns
# ... existing code ... 

# --- NEWLY MOVED SCHEMAS --- START ---

# --- Pydantic Model for Unit --- START ---
class UnitBase(BaseModel):
    name: str
    description: Optional[str] = None

class UnitCreate(UnitBase):
    pass

class UnitUpdate(BaseModel): # Explicitly define optional fields for update
    name: Optional[str] = None
    description: Optional[str] = None

class UnitInDBBase(UnitBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Response model for single Unit
class Unit(UnitInDBBase):
    pass

# Response model for list of Units
class UnitListResponse(BaseModel):
    data: List[Unit]
    total: int
# --- Pydantic Model for Unit --- END ---

# --- Pydantic Model for Department --- START ---
class DepartmentBase(BaseModel):
    name: str
    unit_id: int # Foreign key to Unit
    description: Optional[str] = None

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentUpdate(BaseModel): # Explicitly define optional fields for update
    name: Optional[str] = None
    description: Optional[str] = None
    # unit_id is typically not updated directly

class DepartmentInDBBase(DepartmentBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Response model for single Department (includes unit name)
class Department(DepartmentInDBBase):
    unit_name: Optional[str] = None # Will be populated by CRUD function

# Response model for list of Departments
class DepartmentListResponse(BaseModel):
    data: List[Department]
    total: int

# Simpler model for dropdowns/lists
class DepartmentInfo(BaseModel):
    id: int
    name: str
# --- Pydantic Model for Department --- END ---

# --- Pydantic Model for Establishment Type --- START ---
class EstablishmentTypeBase(BaseModel):
    name: str
    description: Optional[str] = None

class EstablishmentTypeCreate(EstablishmentTypeBase):
    pass

class EstablishmentTypeUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class EstablishmentTypeInDBBase(EstablishmentTypeBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Response model for single Type
class EstablishmentType(EstablishmentTypeInDBBase):
    pass

# Response model for list of Types
class EstablishmentTypeListResponse(BaseModel):
    data: List[EstablishmentType]
    total: int

# Simpler model for dropdowns/lists
class EstablishmentTypeInfo(BaseModel):
    id: int
    name: str
# --- Pydantic Model for Establishment Type --- END ---

# --- Pydantic Model for Employee --- START
class EmployeeBase(BaseModel):
    name: str
    id_card_number: str # Consider adding validation regex
    department_id: Optional[int] = None
    employee_unique_id: Optional[str] = None # Optional: 工号
    bank_account_number: Optional[str] = None
    bank_name: Optional[str] = None
    establishment_type_id: Optional[int] = None

class EmployeeCreate(EmployeeBase):
    pass

class EmployeeUpdate(BaseModel):
    name: Optional[str] = None
    id_card_number: Optional[str] = None
    department_id: Optional[int] = None
    employee_unique_id: Optional[str] = None
    bank_account_number: Optional[str] = None
    bank_name: Optional[str] = None
    establishment_type_id: Optional[int] = None

class EmployeeInDBBase(EmployeeBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Used for API responses for Employee
class EmployeeResponse(EmployeeInDBBase):
    department_name: Optional[str] = None
    unit_name: Optional[str] = None
    establishment_type_name: Optional[str] = None

# Used for listing Employees
class EmployeeListResponse(BaseModel):
    data: List[EmployeeResponse]
    total: int
# --- Pydantic Model for Employee --- END ---

# --- Pydantic Model for Pay Periods --- START
class PayPeriodsResponse(BaseModel):
    data: List[str]
# --- Pydantic Model for Pay Periods --- END ---

# --- Pydantic Model for Field Mapping --- START
class FieldMappingBase(BaseModel):
    target_name: str
    is_intermediate: Optional[bool] = None
    is_final: Optional[bool] = None
    description: Optional[str] = None
    data_type: Optional[str] = None

class FieldMappingCreate(FieldMappingBase):
    source_name: str

class FieldMappingUpdate(FieldMappingBase):
    pass

class FieldMappingInDB(FieldMappingCreate):
    pass

class FieldMappingListResponse(BaseModel):
    data: List[FieldMappingInDB]
# --- Pydantic Model for Field Mapping --- END ---

# --- Pydantic Model for Salary Record --- START
class SalaryRecord(BaseModel):
    # Identifiers
    employee_id: int
    pay_period_identifier: str
    establishment_type_id: Optional[int] = None
    # Employee Info
    employee_name: Optional[str] = None
    id_card_number: Optional[str] = None
    # Dimension Attributes
    department_name: Optional[str] = None
    unit_name: Optional[str] = None
    establishment_type_name: Optional[str] = None
    # Job Attributes (Add all needed from view)
    job_attr_personnel_identity: Optional[str] = None
    job_attr_personnel_rank: Optional[str] = None
    job_attr_post_category: Optional[str] = None
    # Salary Components (Add all needed from view)
    salary_post_salary: Optional[float] = None
    salary_salary_step: Optional[float] = None
    salary_basic_salary: Optional[float] = None
    salary_performance_salary: Optional[float] = None
    # Deductions (Add all needed from view)
    deduct_self_pension_contribution: Optional[float] = None
    deduct_self_medical_contribution: Optional[float] = None
    deduct_individual_income_tax: Optional[float] = None
    # Contributions (Add all needed from view)
    contrib_employer_pension_contribution: Optional[float] = None
    contrib_employer_medical_contribution: Optional[float] = None
    # Calculated Totals (Add all needed from view)
    calc_total_payable: Optional[float] = None
    calc_net_pay: Optional[float] = None
    # Other fields
    other_remarks: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class PaginatedSalaryResponse(BaseModel):
    data: List[SalaryRecord]
    total: int
# --- Pydantic Model for Salary Record --- END ---

# --- NEWLY MOVED SCHEMAS --- END --- 