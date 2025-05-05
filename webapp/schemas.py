from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any, Literal, Union
from datetime import datetime, date
from pydantic import ConfigDict
from decimal import Decimal # Import Decimal

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

    class Config:
        from_attributes = True # Replaced orm_mode

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
        from_attributes = True

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
        from_attributes = True

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
    employee_type_key: str
    name: str

# --- Pydantic Model for Establishment Type --- END ---

# --- Pydantic Model for Employee --- START
class EmployeeBase(BaseModel):
    name: str
    id_card_number: str # Consider adding validation regex
    department_id: Optional[int] = None
    employee_unique_id: Optional[str] = None # Optional: 工号
    bank_account_number: Optional[str] = None
    bank_name: Optional[str] = None # Renamed from bank_branch_name
    establishment_type_id: Optional[int] = None
    work_start_date: Optional[date] = None # Renamed from employment_start_date
    employment_status: Optional[str] = Field(default='在职')
    remarks: Optional[str] = None
    
    # Added new fields (all optional in base/create/update)
    gender: Optional[str] = None
    ethnicity: Optional[str] = None
    date_of_birth: Optional[date] = None
    education_level: Optional[str] = None
    service_interruption_years: Optional[Decimal] = None 
    continuous_service_years: Optional[Decimal] = None # Use Decimal for Numeric(4,2)
    actual_position: Optional[str] = None
    actual_position_start_date: Optional[date] = None
    position_level_start_date: Optional[date] = None

class EmployeeCreate(EmployeeBase):
    # Ensure required fields for creation are enforced if needed
    # Example: department_id and establishment_type_id might be required on create
    # Remove redundant declarations, rely on base class and API validation
    # department_id: int 
    # establishment_type_id: int
    pass

class EmployeeUpdate(BaseModel):
    name: Optional[str] = None
    id_card_number: Optional[str] = None
    department_id: Optional[int] = None
    employee_unique_id: Optional[str] = None
    bank_account_number: Optional[str] = None
    bank_name: Optional[str] = None # Renamed from bank_branch_name
    establishment_type_id: Optional[int] = None
    work_start_date: Optional[date] = None # Renamed from employment_start_date
    employment_status: Optional[str] = None
    remarks: Optional[str] = None

    # Added new fields (all optional for update)
    gender: Optional[str] = None
    ethnicity: Optional[str] = None
    date_of_birth: Optional[date] = None
    education_level: Optional[str] = None
    service_interruption_years: Optional[Decimal] = None 
    continuous_service_years: Optional[Decimal] = None # Use Decimal for Numeric(4,2)
    actual_position: Optional[str] = None
    actual_position_start_date: Optional[date] = None
    position_level_start_date: Optional[date] = None

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
    # Add new fields to response (all optional as DB columns are nullable)
    work_start_date: Optional[date] = None # Renamed from employment_start_date
    gender: Optional[str] = None
    ethnicity: Optional[str] = None
    date_of_birth: Optional[date] = None
    education_level: Optional[str] = None
    service_interruption_years: Optional[Decimal] = None
    continuous_service_years: Optional[Decimal] = None
    actual_position: Optional[str] = None
    actual_position_start_date: Optional[date] = None
    position_level_start_date: Optional[date] = None

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

# --- Pydantic Model for EmployeeTypeFieldRule ---
class EmployeeTypeFieldRuleBase(BaseModel):
    employee_type_key: str
    field_db_name: str
    is_required: bool = False

class EmployeeTypeFieldRuleCreate(EmployeeTypeFieldRuleBase):
    pass

class EmployeeTypeFieldRuleUpdate(BaseModel):
    employee_type_key: Optional[str] = None
    field_db_name: Optional[str] = None
    is_required: Optional[bool] = None

class EmployeeTypeFieldRuleInDB(EmployeeTypeFieldRuleBase):
    rule_id: int

    class Config:
        from_attributes = True

class EmployeeTypeFieldRuleResponse(EmployeeTypeFieldRuleInDB):
    pass

class EmployeeTypeFieldRuleListResponse(BaseModel):
    data: List[EmployeeTypeFieldRuleResponse]
    total: int

# --- NEWLY MOVED SCHEMAS --- END --- 

# --- Calculation Formula Schemas ---

class CalculationFormulaBase(BaseModel):
    name: str
    expression: str
    description: Optional[str] = None

    model_config = ConfigDict(
        json_schema_extra={ "example": {
            "name": "Standard Performance Bonus",
            "expression": "salary_basic_salary * 0.1 + job_level_bonus",
            "description": "Calculates the standard monthly performance bonus based on basic salary and job level."
        }}
    )

class CalculationFormulaCreate(CalculationFormulaBase):
    pass # Inherits all fields from Base

class CalculationFormulaUpdate(BaseModel):
    name: Optional[str] = None
    expression: Optional[str] = None
    description: Optional[str] = None
    # Allow setting description to null explicitly
    # description: Optional[Union[str, None]] = Field(None, description="Set to null to clear description")

class CalculationFormulaResponse(CalculationFormulaBase):
    formula_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True # Enable ORM mode
    )

# --- Calculation Rule Condition Schemas ---

class CalculationRuleConditionBase(BaseModel):
    source_field_db_name: str = Field(..., description="Field name in the context to check against (e.g., ctx_employee_type_key or a calculated field name)")
    operator: str = Field(..., description="Comparison operator (e.g., '==', '>', 'is_null', 'in')")
    comparison_value: str = Field(..., description="Value to compare against (as string). For 'in' operator, use comma-separated values.")

class CalculationRuleConditionCreate(CalculationRuleConditionBase):
    pass # No extra fields needed for creation

class CalculationRuleConditionResponse(CalculationRuleConditionBase):
    condition_id: int
    # rule_id: int # Usually not needed in response as it's part of the parent rule

    model_config = ConfigDict(
        from_attributes=True
    )

# --- Calculation Rule Schemas ---

class CalculationRuleBase(BaseModel):
    name: str = Field(..., description="User-friendly name for the rule.")
    description: Optional[str] = None
    target_field_db_name: str = Field(..., description="The database field name this rule calculates.")
    action_type: str = Field(..., description="Action to perform ('APPLY_FORMULA' or 'SET_FIXED_VALUE')")
    formula_id: Optional[int] = Field(None, description="ID of the formula to use if action_type is APPLY_FORMULA")
    fixed_value: Optional[float] = Field(None, description="Fixed value to set if action_type is SET_FIXED_VALUE") # Assuming numeric
    priority: int = Field(0, description="Execution priority (lower number runs first)")
    is_active: bool = Field(True, description="Whether the rule is currently active")

    # Add validation logic here if needed (e.g., using @model_validator)
    # Example: ensure formula_id is set if action is APPLY_FORMULA, etc.

class CalculationRuleCreate(CalculationRuleBase):
    conditions: List[CalculationRuleConditionCreate] = Field([], description="List of conditions that must ALL be met for the rule to trigger.")

class CalculationRuleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    target_field_db_name: Optional[str] = None
    action_type: Optional[str] = None
    formula_id: Optional[int] = None
    fixed_value: Optional[float] = None # Assuming numeric
    priority: Optional[int] = None
    is_active: Optional[bool] = None
    # Updating conditions is complex. Options:
    # 1. Replace all: conditions: Optional[List[CalculationRuleConditionCreate]] = None
    # 2. Separate endpoints for adding/removing/updating conditions (more RESTful)
    # We'll start with option 1 (replace all) for simplicity in the PUT request.
    conditions: Optional[List[CalculationRuleConditionCreate]] = None

class CalculationRuleResponse(CalculationRuleBase):
    rule_id: int
    created_at: datetime
    updated_at: datetime
    conditions: List[CalculationRuleConditionResponse] = []
    formula: Optional[CalculationFormulaResponse] = None # Optionally include full formula details

    model_config = ConfigDict(
        from_attributes=True
    )

class CalculationRuleListResponse(BaseModel):
    data: List[CalculationRuleResponse]
    total: int

# --- NEWLY MOVED SCHEMAS --- END --- 

# --- Calculated Salary Record Schemas ---

class CalculatedSalaryRecordBase(BaseModel):
    employee_id: int
    pay_period_identifier: str
    calculated_data: Dict[str, Any] # The core calculated results
    calculation_engine_version: Optional[str] = None
    rules_applied_ids: Optional[List[int]] = None # Assuming list of rule IDs
    # Maybe exclude source_data_snapshot from default response?
    # source_data_snapshot: Optional[Dict[str, Any]] = None 

class CalculatedSalaryRecordResponse(CalculatedSalaryRecordBase):
    calculated_record_id: int
    calculation_timestamp: datetime
    # Add employee details if needed by joining in CRUD or endpoint
    # employee_name: Optional[str] = None 

    model_config = ConfigDict(
        from_attributes=True # Enable ORM mode
    )

# Schema for the trigger endpoint's successful response (alternative)
class CalculationTriggerResponse(BaseModel):
    message: str = "Calculation successful"
    record_id: int
    timestamp: datetime
    # Optionally include the calculated data itself
    # calculated_data: Dict[str, Any]

# --- NEWLY MOVED SCHEMAS --- END --- 

# --- Pydantic Model for SheetNameMapping --- START ---
class SheetNameMappingBase(BaseModel):
    sheet_name: str = Field(..., description="Excel sheet name")
    employee_type_key: str = Field(..., description="Corresponding employee type key (e.g., gwy, sy)")
    target_staging_table: str = Field(..., description="Target staging table name (e.g., raw_salary_data_staging)")

class SheetNameMappingCreate(SheetNameMappingBase):
    pass # No extra fields for creation

class SheetNameMappingUpdate(BaseModel):
    # sheet_name is the identifier, usually not updatable
    employee_type_key: Optional[str] = Field(None, description="Update employee type key")
    target_staging_table: Optional[str] = Field(None, description="Update target staging table name")

class SheetNameMappingResponse(SheetNameMappingBase):
    # No extra fields needed for response if PK is sheet_name
    # If an ID column were added later, it would go here.
    
    model_config = ConfigDict(
        from_attributes=True # Enable ORM mode for reading from model instance
    )

class SheetNameMappingListResponse(BaseModel):
    data: List[SheetNameMappingResponse]
    # Add total if pagination is implemented
    # total: int

# --- Pydantic Model for SheetNameMapping --- END ---

# --- Calculation Formula Schemas ---
# ... rest of the file ...