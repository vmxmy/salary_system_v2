"""
人事相关的Pydantic模型。
"""
from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Dict, Any, ForwardRef
from datetime import date, datetime

from .config import LookupValue  # Import LookupValue from config module
# from .hr import EmployeeAppraisalUpdate # Make sure EmployeeAppraisalUpdate is imported if not already visible or defined above

# EmployeeAppraisal Models (Moved Up)
class EmployeeAppraisalBase(BaseModel):
    """员工年度考核基础模型"""
    employee_id: int = Field(..., description="Foreign key to employees")
    appraisal_year: int = Field(..., description="Year of appraisal")
    appraisal_result_lookup_id: int = Field(..., description="Foreign key to appraisal result lookup value")
    appraisal_date: Optional[date] = Field(None, description="Date of appraisal")
    remarks: Optional[str] = Field(None, description="Remarks or comments on appraisal")


class EmployeeAppraisalCreate(EmployeeAppraisalBase):
    """创建员工年度考核模型"""
    pass


class EmployeeAppraisalUpdate(BaseModel):
    """更新员工年度考核模型"""
    # Making 'id' optional for update, as it's part of the record to identify for update, not something to change.
    # employee_id might not be changeable once an appraisal is linked, or it might. For now, keeping it optional if allowed by DB constraints.
    id: Optional[int] = Field(None, description="Primary key, used to identify existing record for update") # Added ID for updates
    employee_id: Optional[int] = Field(None, description="Foreign key to employees")
    appraisal_year: Optional[int] = Field(None, description="Year of appraisal")
    appraisal_result_lookup_id: Optional[int] = Field(None, description="Foreign key to appraisal result lookup value")
    appraisal_date: Optional[date] = Field(None, description="Date of appraisal")
    remarks: Optional[str] = Field(None, description="Remarks or comments on appraisal")


class EmployeeAppraisal(EmployeeAppraisalBase):
    """员工年度考核响应模型"""
    id: int = Field(..., description="Primary key")
    created_at: datetime = Field(..., description="Record creation timestamp")
    updated_at: datetime = Field(..., description="Record last update timestamp")
    appraisal_result: Optional[LookupValue] = Field(None, description="Lookup value for appraisal result")

    class Config:
        from_attributes = True

class EmployeeAppraisalListResponse(BaseModel):
    """员工年度考核列表响应模型"""
    data: List[EmployeeAppraisal]
    meta: Dict[str, Any] = Field(
        default_factory=lambda: {"page": 1, "size": 10, "total": 0, "totalPages": 1}
    )

    class Config:
        from_attributes = True

# Employee Models
class EmployeeBase(BaseModel):
    """员工基础模型"""
    employee_code: Optional[str] = Field(None, description="Unique employee ID/Code")
    first_name: str = Field(..., description="Employee's first name")
    last_name: str = Field(..., description="Employee's last name")
    date_of_birth: Optional[date] = Field(None, description="Employee's date of birth")
    gender_lookup_value_id: Optional[int] = Field(None, description="Foreign key to gender lookup value")
    id_number: Optional[str] = Field(None, description="National ID or passport number")
    nationality: Optional[str] = Field(None, description="Employee's nationality")
    ethnicity: Optional[str] = Field(None, description="Employee's ethnicity")
    first_work_date: Optional[date] = Field(None, description="Date when employee first started working in their career")
    interrupted_service_years: Optional[float] = Field(None, description="Years of interrupted service")
    hire_date: date = Field(..., description="Employee's hire date at current company")
    career_position_level_date: Optional[date] = Field(None, description="Date when employee first reached this position level in their entire career")
    current_position_start_date: Optional[date] = Field(None, description="Date when employee started this position in current organization")
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
    personnel_category_id: Optional[int] = Field(None, description="Current personnel category ID")
    actual_position_id: Optional[int] = Field(None, description="Current actual position ID")

    # Fields for bank account, to be processed for hr.employee_bank_accounts table
    bank_name: Optional[str] = Field(None, description="Bank name for employee's account")
    bank_account_number: Optional[str] = Field(None, description="Employee's bank account number")


class EmployeeCreate(EmployeeBase):
    """创建员工模型"""
    # Fields for resolving lookups by name
    gender_lookup_value_name: Optional[str] = Field(None, description="Gender name, e.g., '男', '女'")
    status_lookup_value_name: str = Field(..., description="Status name, e.g., '在职', '离职'")
    employment_type_lookup_value_name: Optional[str] = Field(None, description="Employment type name")
    education_level_lookup_value_name: Optional[str] = Field(None, description="Education level name")
    marital_status_lookup_value_name: Optional[str] = Field(None, description="Marital status name")
    political_status_lookup_value_name: Optional[str] = Field(None, description="Political status name")
    contract_type_lookup_value_name: Optional[str] = Field(None, description="Contract type name")
    
    # 新增字段 - 工资级别、工资档次、参照正编薪级
    salary_level_lookup_value_id: Optional[int] = Field(None, description="Salary level lookup ID")
    salary_level_lookup_value_name: Optional[str] = Field(None, description="Salary level name")
    salary_grade_lookup_value_id: Optional[int] = Field(None, description="Salary grade lookup ID")
    salary_grade_lookup_value_name: Optional[str] = Field(None, description="Salary grade name")
    ref_salary_level_lookup_value_id: Optional[int] = Field(None, description="Reference salary level lookup ID")
    ref_salary_level_lookup_value_name: Optional[str] = Field(None, description="Reference salary level name")

    # Fields for resolving department and position by name
    department_name: Optional[str] = Field(None, description="Department name for resolving department_id")
    position_name: Optional[str] = Field(None, description="Position name for resolving actual_position_id")
    personnel_category_name: Optional[str] = Field(None, description="Personnel category name for resolving ID")

    # Allow creating appraisals along with the employee (though not used for bulk import of employees only)
    appraisals: Optional[List[EmployeeAppraisalCreate]] = Field(default_factory=list, description="List of employee appraisals to create")



class EmployeeUpdate(BaseModel):
    """更新员工模型"""
    employee_code: Optional[str] = Field(None, description="Unique employee ID/Code")
    first_name: Optional[str] = Field(None, description="Employee's first name")
    last_name: Optional[str] = Field(None, description="Employee's last name")
    date_of_birth: Optional[date] = Field(None, description="Employee's date of birth")
    gender_lookup_value_id: Optional[int] = Field(None, description="Foreign key to gender lookup value")
    id_number: Optional[str] = Field(None, description="National ID or passport number")
    nationality: Optional[str] = Field(None, description="Employee's nationality")
    ethnicity: Optional[str] = Field(None, description="Employee's ethnicity")
    first_work_date: Optional[date] = Field(None, description="Date when employee first started working in their career")
    interrupted_service_years: Optional[float] = Field(None, description="Years of interrupted service")
    hire_date: Optional[date] = Field(None, description="Employee's hire date at current company")
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
    personnel_category_id: Optional[int] = Field(None, description="Current personnel category ID")
    actual_position_id: Optional[int] = Field(None, description="Current actual position ID")

    # Fields for bank account, to be processed for hr.employee_bank_accounts table
    bank_name: Optional[str] = Field(None, description="Bank name for employee's account")
    bank_account_number: Optional[str] = Field(None, description="Employee's bank account number")

    # Allow updating appraisals along with the employee
    appraisals: Optional[List[EmployeeAppraisalUpdate]] = Field(None, description="List of employee appraisals to update/create. For existing appraisals, include 'id'. For new ones, omit 'id'. The backend will sync based on this list.")


class Employee(EmployeeBase):
    """员工响应模型"""
    id: int = Field(..., description="Primary key")
    created_at: datetime = Field(..., description="Record creation timestamp")
    updated_at: datetime = Field(..., description="Record last update timestamp")

    # Resolved LookupValue fields
    gender: Optional[LookupValue] = Field(None, description="Resolved gender lookup value")
    status: Optional[LookupValue] = Field(None, description="Resolved employee status lookup value")
    employment_type: Optional[LookupValue] = Field(None, description="Resolved employment type lookup value")
    education_level: Optional[LookupValue] = Field(None, description="Resolved education level lookup value")
    marital_status: Optional[LookupValue] = Field(None, description="Resolved marital status lookup value")
    political_status: Optional[LookupValue] = Field(None, description="Resolved political status lookup value")
    contract_type: Optional[LookupValue] = Field(None, description="Resolved contract type lookup value")
    
    # Resolved related objects
    department: Optional["Department"] = Field(None, description="Resolved department object")
    personnel_category: Optional["PersonnelCategorySchema"] = Field(None, description="Resolved personnel category object")
    actual_position: Optional["Position"] = Field(None, description="Resolved actual position object")
    
    appraisals: List["EmployeeAppraisal"] = Field(default_factory=list, description="List of employee appraisals")
    job_history: List["EmployeeJobHistory"] = Field(default_factory=list, description="List of employee job history records")
    # bank_accounts: List["EmployeeBankAccount"] = Field(default_factory=list, description="List of employee bank accounts") # Assuming EmployeeBankAccount schema exists

    class Config:
        from_attributes = True

class EmployeeWithNames(Employee):
    """员工响应模型，包含部门和职位名称"""
    departmentName: Optional[str] = Field(None, description="Current department name")
    personnelCategoryName: Optional[str] = Field(None, description="Current personnel category name")
    actualPositionName: Optional[str] = Field(None, description="Current actual position name")

    class Config:
        from_attributes = True


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


# New model for child departments to break recursion
class DepartmentChildrenItem(DepartmentBase):
    id: int = Field(..., description="Primary key")
    # Note: No parent_department here to break the loop when listed as a child
    # Children can still have their own children, using the same restricted type
    child_departments: List["DepartmentChildrenItem"] = Field(default_factory=list)
    # Include other fields from Department that should appear for children, if any beyond DepartmentBase
    # For example, if created_at/updated_at are relevant for children items directly:
    # created_at: datetime = Field(..., description="Record creation timestamp")
    # updated_at: datetime = Field(..., description="Record last update timestamp")

    class Config:
        from_attributes = True


class Department(DepartmentBase):
    """部门响应模型"""
    id: int = Field(..., description="Primary key")
    parent_department: Optional["Department"] = Field(None, description="Parent department, if any") # Parent can be full for upward nav
    child_departments: List[DepartmentChildrenItem] = Field(default_factory=list, description="Child departments (restricted model)")
    # created_at: datetime = Field(..., description="Record creation timestamp") # Already in DepartmentBase if defined there, or add here
    # updated_at: datetime = Field(..., description="Record last update timestamp") # Already in DepartmentBase if defined there, or add here

    class Config:
        from_attributes = True

class DepartmentListResponse(BaseModel):
    """部门列表响应模型"""
    data: List[Department]
    meta: Dict[str, Any] = Field(
        default_factory=lambda: {"page": 1, "size": 10, "total": 0, "totalPages": 1}
    )

    class Config:
        from_attributes = True


# PersonnelCategory Models
class PersonnelCategoryBase(BaseModel):
    """人员类别基础模型"""
    code: str = Field(..., description="Unique personnel category code")
    name: str = Field(..., description="Personnel category name")
    description: Optional[str] = Field(None, description="Description of the personnel category")
    parent_category_id: Optional[int] = Field(None, description="Foreign key to parent personnel category")
    effective_date: date = Field(..., description="Personnel category definition effective date")
    end_date: Optional[date] = Field(None, description="Personnel category definition end date")
    is_active: bool = Field(True, description="Whether the personnel category is currently in use")


class PersonnelCategoryCreate(PersonnelCategoryBase):
    """创建人员类别模型"""
    pass


class PersonnelCategoryUpdate(BaseModel):
    """更新人员类别模型"""
    code: Optional[str] = Field(None, description="Unique personnel category code")
    name: Optional[str] = Field(None, description="Personnel category name")
    description: Optional[str] = Field(None, description="Description of the personnel category")
    parent_category_id: Optional[int] = Field(None, description="Foreign key to parent personnel category")
    effective_date: Optional[date] = Field(None, description="Personnel category definition effective date")
    end_date: Optional[date] = Field(None, description="Personnel category definition end date")
    is_active: Optional[bool] = Field(None, description="Whether the personnel category is currently in use")

# New model for child personnel categories to break recursion
class PersonnelCategoryChildrenItem(PersonnelCategoryBase):
    id: int = Field(..., description="Primary key")
    # No parent_category here
    child_categories: List[ForwardRef('PersonnelCategoryChildrenItem')] = Field(default_factory=list) # Self-referencing

    class Config:
        from_attributes = True

class PersonnelCategorySchema(PersonnelCategoryBase):
    """人员类别响应模型"""
    id: int = Field(..., description="Primary key")
    parent_category: Optional[ForwardRef('PersonnelCategorySchema')] = Field(None, description="Parent personnel category, if any") # Self-reference for parent
    child_categories: List[PersonnelCategoryChildrenItem] = Field(default_factory=list, description="Child personnel categories (restricted model)")

    class Config:
        from_attributes = True

class PersonnelCategoryListResponse(BaseModel):
    """人员类别列表响应模型"""
    data: List[PersonnelCategorySchema]
    meta: Dict[str, Any] = Field(
        default_factory=lambda: {"page": 1, "size": 10, "total": 0, "totalPages": 1}
    )

    class Config:
        from_attributes = True


# EmployeeJobHistory Models
class EmployeeJobHistoryBase(BaseModel):
    """员工工作历史基础模型"""
    employee_id: int = Field(..., description="Foreign key to employees")
    department_id: int = Field(..., description="Foreign key to departments at this period")
    position_id: int = Field(..., description="Foreign key to positions at this period")
    personnel_category_id: int = Field(..., description="Foreign key to personnel_categories at this period")
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
    position_id: Optional[int] = Field(None, description="Foreign key to positions at this period")
    personnel_category_id: Optional[int] = Field(None, description="Foreign key to personnel_categories at this period")
    manager_id: Optional[int] = Field(None, description="Foreign key to manager employee at this period")
    location: Optional[str] = Field(None, description="Work location at this period")
    effective_date: Optional[date] = Field(None, description="Record effective date")
    end_date: Optional[date] = Field(None, description="Record end date")


class EmployeeJobHistory(EmployeeJobHistoryBase):
    """员工工作历史响应模型"""
    id: int = Field(..., description="Primary key")
    created_at: datetime = Field(..., description="Record creation timestamp")
    updated_at: datetime = Field(..., description="Record last update timestamp")

    department: Optional["Department"] = Field(None, description="Resolved department object")
    position: Optional["Position"] = Field(None, description="Resolved position object")
    personnel_category: Optional["PersonnelCategorySchema"] = Field(None, description="Resolved personnel category object")
    manager: Optional[EmployeeBase] = Field(None, description="Resolved manager employee object (base details)")

    class Config:
        from_attributes = True

class EmployeeJobHistoryListResponse(BaseModel):
    """员工工作历史列表响应模型"""
    data: List[EmployeeJobHistory]
    meta: Dict[str, Any] = Field(
        default_factory=lambda: {"page": 1, "size": 10, "total": 0, "totalPages": 1}
    )

    class Config:
        from_attributes = True


# Position Models (实际职务，原 job_titles 中扩展出的概念)
class PositionBase(BaseModel):
    """职务基础模型"""
    code: Optional[str] = Field(None, description="Unique position code")
    name: str = Field(..., description="Position name")
    description: Optional[str] = Field(None, description="Description of the position")
    parent_position_id: Optional[int] = Field(None, description="Foreign key to parent position")
    effective_date: date = Field(..., description="Position definition effective date")
    end_date: Optional[date] = Field(None, description="Position definition end date")
    is_active: bool = Field(True, description="Whether the position is currently in use")


class PositionCreate(PositionBase):
    """创建职务模型"""
    pass


class PositionUpdate(BaseModel):
    """更新职务模型"""
    code: Optional[str] = Field(None, description="Unique position code")
    name: Optional[str] = Field(None, description="Position name")
    description: Optional[str] = Field(None, description="Description of the position")
    parent_position_id: Optional[int] = Field(None, description="Foreign key to parent position")
    effective_date: Optional[date] = Field(None, description="Position definition effective date")
    end_date: Optional[date] = Field(None, description="Position definition end date")
    is_active: Optional[bool] = Field(None, description="Whether the position is currently in use")

# Position ChildrenItem model
class PositionChildrenItem(PositionBase): # Renamed from PositionChildrenItemModel
    id: int = Field(..., description="Primary key")
    # No parent here
    children: List[ForwardRef('PositionChildrenItem')] = Field(default_factory=list) # Self-referencing
    
    class Config:
        from_attributes = True

# Position Ref model for parent, or use main Position schema if appropriate
# PositionRef = ForwardRef('PositionRef') # No longer needed as separate variable

class Position(PositionBase): # This is the main Position schema
    """职务响应模型""" 
    id: int = Field(..., description="Primary key")
    parent: Optional[ForwardRef('Position')] = Field(None, description="Parent position, if any") # Self-reference for parent
    children: List[PositionChildrenItem] = Field(default_factory=list, description="Child positions (restricted model)")

    class Config:
        from_attributes = True

class PositionListResponse(BaseModel):
    """职务列表响应模型"""
    data: List[Position]
    meta: Dict[str, Any] = Field(
        default_factory=lambda: {"page": 1, "size": 10, "total": 0, "totalPages": 1}
    )

    class Config:
        from_attributes = True

# Update forward refs for all models involved in recursion
# For Pydantic V2, model_rebuild() is preferred and handles forward refs automatically in most cases.

DepartmentChildrenItem.model_rebuild()
Department.model_rebuild()

PersonnelCategoryChildrenItem.model_rebuild()
PersonnelCategorySchema.model_rebuild()

PositionChildrenItem.model_rebuild()
Position.model_rebuild()

Employee.model_rebuild()
EmployeeJobHistory.model_rebuild()

# Ensure other models that might use ForwardRef also call model_rebuild()
# Example for EmployeeAppraisal and LookupValue if they were to use ForwardRef, though they might not need it here.
EmployeeAppraisal.model_rebuild() # Added for the moved models
# LookupValue.model_rebuild() # If LookupValue has self-references or forward refs to resolve
