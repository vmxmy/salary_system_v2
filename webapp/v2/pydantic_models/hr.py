"""
人事相关的Pydantic模型。
"""
from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Dict, Any
from datetime import date, datetime

# Employee Models
class EmployeeBase(BaseModel):
    """员工基础模型"""
    employee_code: str = Field(..., description="Unique employee ID/Code")
    first_name: str = Field(..., description="Employee's first name")
    last_name: str = Field(..., description="Employee's last name")
    date_of_birth: Optional[date] = Field(None, description="Employee's date of birth")
    gender_lookup_value_id: Optional[int] = Field(None, description="Foreign key to gender lookup value")
    id_number: Optional[str] = Field(None, description="National ID or passport number")
    nationality: Optional[str] = Field(None, description="Employee's nationality")
    hire_date: date = Field(..., description="Employee's hire date")
    status_lookup_value_id: int = Field(..., description="Foreign key to employee status lookup value")
    employment_type_lookup_value_id: Optional[int] = Field(None, description="Foreign key to employment type lookup value")
    education_level_lookup_value_id: Optional[int] = Field(None, description="Foreign key to education level lookup value")
    marital_status_lookup_value_id: Optional[int] = Field(None, description="Foreign key to marital status lookup value")
    political_status_lookup_value_id: Optional[int] = Field(None, description="Foreign key to political status lookup value")
    contract_type_lookup_value_id: Optional[int] = Field(None, description="Foreign key to contract type lookup value")
    email: Optional[EmailStr] = Field(None, description="Employee's email address")
    phone_number: Optional[str] = Field(None, description="Employee's phone number")

    # Fields added for direct update in hr.employees table (these were missing in EmployeeUpdate initially)
    home_address: Optional[str] = Field(None, description="Employee's home address")
    emergency_contact_name: Optional[str] = Field(None, description="Emergency contact's name")
    emergency_contact_phone: Optional[str] = Field(None, description="Emergency contact's phone number")
    department_id: Optional[int] = Field(None, description="Current department ID")
    job_title_id: Optional[int] = Field(None, description="Current job title ID")

    # Fields for bank account, to be processed for hr.employee_bank_accounts table (also missing)
    bank_name: Optional[str] = Field(None, description="Bank name for employee's account")
    bank_account_number: Optional[str] = Field(None, description="Employee's bank account number")


class EmployeeCreate(EmployeeBase):
    """创建员工模型"""
    pass


class EmployeeUpdate(BaseModel):
    """更新员工模型"""
    employee_code: Optional[str] = Field(None, description="Unique employee ID/Code")
    first_name: Optional[str] = Field(None, description="Employee's first name")
    last_name: Optional[str] = Field(None, description="Employee's last name")
    date_of_birth: Optional[date] = Field(None, description="Employee's date of birth")
    gender_lookup_value_id: Optional[int] = Field(None, description="Foreign key to gender lookup value")
    id_number: Optional[str] = Field(None, description="National ID or passport number")
    nationality: Optional[str] = Field(None, description="Employee's nationality")
    hire_date: Optional[date] = Field(None, description="Employee's hire date")
    status_lookup_value_id: Optional[int] = Field(None, description="Foreign key to employee status lookup value")
    employment_type_lookup_value_id: Optional[int] = Field(None, description="Foreign key to employment type lookup value")
    education_level_lookup_value_id: Optional[int] = Field(None, description="Foreign key to education level lookup value")
    marital_status_lookup_value_id: Optional[int] = Field(None, description="Foreign key to marital status lookup value")
    political_status_lookup_value_id: Optional[int] = Field(None, description="Foreign key to political status lookup value")
    contract_type_lookup_value_id: Optional[int] = Field(None, description="Foreign key to contract type lookup value")
    email: Optional[EmailStr] = Field(None, description="Employee's email address")
    phone_number: Optional[str] = Field(None, description="Employee's phone number")

    # Fields added for direct update in hr.employees table
    home_address: Optional[str] = Field(None, description="Employee's home address")
    emergency_contact_name: Optional[str] = Field(None, description="Emergency contact's name")
    emergency_contact_phone: Optional[str] = Field(None, description="Emergency contact's phone number")
    department_id: Optional[int] = Field(None, description="Current department ID")
    job_title_id: Optional[int] = Field(None, description="Current job title ID")

    # Fields for bank account, to be processed for hr.employee_bank_accounts table
    bank_name: Optional[str] = Field(None, description="Bank name for employee's account")
    bank_account_number: Optional[str] = Field(None, description="Employee's bank account number")


class Employee(EmployeeBase):
    """员工响应模型"""
    id: int = Field(..., description="Primary key")
    created_at: datetime = Field(..., description="Record creation timestamp")
    updated_at: datetime = Field(..., description="Record last update timestamp")

    class Config:
        from_attributes = True


class EmployeeWithNames(Employee):
    """员工响应模型，包含部门和职位名称"""
    departmentName: Optional[str] = Field(None, description="Current department name")
    positionName: Optional[str] = Field(None, description="Current job title name")


class EmployeeListResponse(BaseModel):
    """员工列表响应模型"""
    data: List[EmployeeWithNames]
    meta: Dict[str, Any] = Field(
        default_factory=lambda: {"page": 1, "size": 10, "total": 0, "totalPages": 1}
    )


# Department Models
class DepartmentBase(BaseModel):
    """部门基础模型"""
    code: str = Field(..., description="Unique department code")
    name: str = Field(..., description="Department name")
    parent_department_id: Optional[int] = Field(None, description="Foreign key to parent department")
    effective_date: date = Field(..., description="Department definition effective date")
    end_date: Optional[date] = Field(None, description="Department definition end date")
    is_active: bool = Field(True, description="Whether the department is currently active")


class DepartmentCreate(DepartmentBase):
    """创建部门模型"""
    pass


class DepartmentUpdate(BaseModel):
    """更新部门模型"""
    code: Optional[str] = Field(None, description="Unique department code")
    name: Optional[str] = Field(None, description="Department name")
    parent_department_id: Optional[int] = Field(None, description="Foreign key to parent department")
    effective_date: Optional[date] = Field(None, description="Department definition effective date")
    end_date: Optional[date] = Field(None, description="Department definition end date")
    is_active: Optional[bool] = Field(None, description="Whether the department is currently active")


class Department(DepartmentBase):
    """部门响应模型"""
    id: int = Field(..., description="Primary key")

    class Config:
        from_attributes = True


class DepartmentListResponse(BaseModel):
    """部门列表响应模型"""
    data: List[Department]
    meta: Dict[str, Any] = Field(
        default_factory=lambda: {"page": 1, "size": 10, "total": 0, "totalPages": 1}
    )


# JobTitle Models
class JobTitleBase(BaseModel):
    """职位基础模型"""
    code: str = Field(..., description="Unique job title code")
    name: str = Field(..., description="Job title name")
    description: Optional[str] = Field(None, description="Description of the job title")
    parent_job_title_id: Optional[int] = Field(None, description="Foreign key to parent job title")
    effective_date: date = Field(..., description="Job title definition effective date")
    end_date: Optional[date] = Field(None, description="Job title definition end date")
    is_active: bool = Field(True, description="Whether the job title is currently in use")


class JobTitleCreate(JobTitleBase):
    """创建职位模型"""
    pass


class JobTitleUpdate(BaseModel):
    """更新职位模型"""
    code: Optional[str] = Field(None, description="Unique job title code")
    name: Optional[str] = Field(None, description="Job title name")
    description: Optional[str] = Field(None, description="Description of the job title")
    parent_job_title_id: Optional[int] = Field(None, description="Foreign key to parent job title")
    effective_date: Optional[date] = Field(None, description="Job title definition effective date")
    end_date: Optional[date] = Field(None, description="Job title definition end date")
    is_active: Optional[bool] = Field(None, description="Whether the job title is currently in use")


class JobTitle(JobTitleBase):
    """职位响应模型"""
    id: int = Field(..., description="Primary key")

    class Config:
        from_attributes = True


class JobTitleListResponse(BaseModel):
    """职位列表响应模型"""
    data: List[JobTitle]
    meta: Dict[str, Any] = Field(
        default_factory=lambda: {"page": 1, "size": 10, "total": 0, "totalPages": 1}
    )


# EmployeeJobHistory Models
class EmployeeJobHistoryBase(BaseModel):
    """员工工作历史基础模型"""
    employee_id: int = Field(..., description="Foreign key to employees")
    department_id: int = Field(..., description="Foreign key to departments at this period")
    job_title_id: int = Field(..., description="Foreign key to job_titles at this period")
    manager_id: Optional[int] = Field(None, description="Foreign key to manager employee at this period")
    location: Optional[str] = Field(None, description="Work location at this period")
    effective_date: date = Field(..., description="Record effective date")
    end_date: Optional[date] = Field(None, description="Record end date")


class EmployeeJobHistoryCreate(EmployeeJobHistoryBase):
    """创建员工工作历史模型"""
    pass


class EmployeeJobHistoryUpdate(BaseModel):
    """更新员工工作历史模型"""
    employee_id: Optional[int] = Field(None, description="Foreign key to employees")
    department_id: Optional[int] = Field(None, description="Foreign key to departments at this period")
    job_title_id: Optional[int] = Field(None, description="Foreign key to job_titles at this period")
    manager_id: Optional[int] = Field(None, description="Foreign key to manager employee at this period")
    location: Optional[str] = Field(None, description="Work location at this period")
    effective_date: Optional[date] = Field(None, description="Record effective date")
    end_date: Optional[date] = Field(None, description="Record end date")


class EmployeeJobHistory(EmployeeJobHistoryBase):
    """员工工作历史响应模型"""
    id: int = Field(..., description="Primary key")

    class Config:
        from_attributes = True


class EmployeeJobHistoryListResponse(BaseModel):
    """员工工作历史列表响应模型"""
    data: List[EmployeeJobHistory]
    meta: Dict[str, Any] = Field(
        default_factory=lambda: {"page": 1, "size": 10, "total": 0, "totalPages": 1}
    )
