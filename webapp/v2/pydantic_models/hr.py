"""
人事相关的Pydantic模型。
"""
from pydantic import BaseModel, Field, EmailStr, computed_field
from typing import Optional, List, Dict, Any, ForwardRef, TypeVar, Generic
from datetime import date, datetime

from .config import LookupValue  # Import LookupValue from config module
from .common import PaginationResponse, PaginationMeta
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
    # id字段应该通过URL路径提供，而不是请求体 - 符合RESTful设计原则
    # 使用PUT /employee-appraisals/{appraisal_id}的方式更新特定考核记录
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

class EmployeeAppraisalListResponse(PaginationResponse[EmployeeAppraisal]):
    """员工考核列表响应模型"""
    pass

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
    
    # 工资级别相关字段的名称 - 添加到基础模型中以便响应时包含
    salary_level_lookup_value_id: Optional[int] = Field(None, description="Salary level lookup ID")
    salary_grade_lookup_value_id: Optional[int] = Field(None, description="Salary grade lookup ID")
    ref_salary_level_lookup_value_id: Optional[int] = Field(None, description="Reference salary level lookup ID")
    
    # 职务级别相关字段
    job_position_level_lookup_value_id: Optional[int] = Field(None, description="Job position level lookup ID")
    
    # 社保个人客户号字段
    social_security_client_number: Optional[str] = Field(None, description="Social security client number")


class EmployeeCreate(EmployeeBase):
    """创建员工模型"""
    # 移除id字段 - POST接口严格用于创建新员工，不支持通过id更新现有员工
    # 如需更新现有员工，请使用PUT /{employee_id}接口
    
    # Fields for resolving department and position by name
    department_name: Optional[str] = Field(None, description="Department name for resolving department_id")
    position_name: Optional[str] = Field(None, description="Position name for resolving actual_position_id")
    personnel_category_name: Optional[str] = Field(None, description="Personnel category name for resolving ID")
    
    # Fields for resolving lookups by name (用于通过名称解析ID)
    gender_lookup_value_name: Optional[str] = Field(None, description="Gender name for resolving gender_lookup_value_id")
    status_lookup_value_name: Optional[str] = Field(None, description="Employee status name for resolving status_lookup_value_id")
    employment_type_lookup_value_name: Optional[str] = Field(None, description="Employment type name for resolving employment_type_lookup_value_id")
    education_level_lookup_value_name: Optional[str] = Field(None, description="Education level name for resolving education_level_lookup_value_id")
    marital_status_lookup_value_name: Optional[str] = Field(None, description="Marital status name for resolving marital_status_lookup_value_id")
    political_status_lookup_value_name: Optional[str] = Field(None, description="Political status name for resolving political_status_lookup_value_id")
    contract_type_lookup_value_name: Optional[str] = Field(None, description="Contract type name for resolving contract_type_lookup_value_id")
    job_position_level_lookup_value_name: Optional[str] = Field(None, description="Job position level name for resolving job_position_level_lookup_value_id")
    salary_level_lookup_value_name: Optional[str] = Field(None, description="Salary level name for resolving salary_level_lookup_value_id")
    salary_grade_lookup_value_name: Optional[str] = Field(None, description="Salary grade name for resolving salary_grade_lookup_value_id")
    ref_salary_level_lookup_value_name: Optional[str] = Field(None, description="Reference salary level name for resolving ref_salary_level_lookup_value_id")

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
    
    # 职务级别字段
    job_position_level_lookup_value_id: Optional[int] = Field(None, description="Job position level lookup ID")
    
    # 社保个人客户号字段
    social_security_client_number: Optional[str] = Field(None, description="Social security client number")

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
    
    # 职务级别 resolved字段
    job_position_level: Optional[LookupValue] = Field(None, description="Resolved job position level lookup value")
    
    # Resolved related objects
    current_department: Optional['DepartmentBase'] = Field(None, description="Resolved department object (base details) from ORM's current_department")
    personnel_category: Optional['PersonnelCategoryBase'] = Field(None, description="Resolved personnel category object (base details)")
    actual_position: Optional['PositionBase'] = Field(None, description="Resolved actual position object (base details)")
    
    appraisals: List["EmployeeAppraisal"] = Field(default_factory=list, description="List of employee appraisals")
    job_history: List["EmployeeJobHistory"] = Field(default_factory=list, description="List of employee job history records")
    # bank_accounts: List["EmployeeBankAccount"] = Field(default_factory=list, description="List of employee bank accounts") # Assuming EmployeeBankAccount schema exists

    class Config:
        from_attributes = True

class EmployeeWithNames(Employee):
    """员工响应模型，包含部门和职位名称"""
    @computed_field
    @property
    def actualPositionName(self) -> Optional[str]:
        if self.actual_position:
            return self.actual_position.name
        return None

    @computed_field
    @property
    def jobPositionLevelName(self) -> Optional[str]:
        if self.job_position_level:
            return self.job_position_level.name # Assuming LookupValue has a .name attribute
        return None

    @computed_field
    @property
    def departmentName(self) -> Optional[str]:
        if self.current_department:
            return self.current_department.name
        return None

    @computed_field
    @property
    def personnelCategoryName(self) -> Optional[str]:
        if self.personnel_category:
            return self.personnel_category.name
        return None

    class Config:
        from_attributes = True


class EmployeeListResponse(PaginationResponse[EmployeeWithNames]):
    """员工列表响应模型"""
    pass


# Department Models
class DepartmentBase(BaseModel):
    """部门基础模型"""
    code: str = Field(..., description="Unique department code")
    name: str = Field(..., description="Department name")
    parent_department_id: Optional[int] = Field(None, description="Foreign key to parent department")
    effective_date: date = Field(..., description="Department definition effective date")
    end_date: Optional[date] = Field(None, description="Department definition end date")
    is_active: bool = Field(True, description="Whether the department is currently active")

    class Config:
        from_attributes = True


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

class DepartmentListResponse(PaginationResponse[Department]):
    """部门列表响应模型"""
    pass


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

    class Config:
        from_attributes = True


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

class PersonnelCategoryListResponse(PaginationResponse[PersonnelCategorySchema]):
    """人员类别列表响应模型"""
    pass


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

class EmployeeJobHistoryListResponse(PaginationResponse[EmployeeJobHistory]):
    """员工工作历史列表响应模型"""
    pass


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

    class Config:
        from_attributes = True


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

class PositionListResponse(PaginationResponse[Position]):
    """职务列表响应模型"""
    pass

# Update forward refs for all models involved in recursion
# For Pydantic V2, model_rebuild() is preferred and handles forward refs automatically in most cases.

DepartmentChildrenItem.model_rebuild()
Department.model_rebuild()

PersonnelCategoryChildrenItem.model_rebuild()
PersonnelCategorySchema.model_rebuild()

PositionChildrenItem.model_rebuild()
Position.model_rebuild()

EmployeeAppraisal.model_rebuild()
Employee.model_rebuild()
EmployeeJobHistory.model_rebuild()
EmployeeWithNames.model_rebuild()

# Ensure other models that might use ForwardRef also call model_rebuild()
# Example for EmployeeAppraisal and LookupValue if they were to use ForwardRef, though they might not need it here.
# LookupValue.model_rebuild() # If LookupValue has self-references or forward refs to resolve

# 在文件末尾添加批量创建的响应模型
class BulkEmployeeFailedRecord(BaseModel):
    """批量创建员工时失败的记录信息"""
    original_index: int = Field(..., description="原始记录在批次中的索引（从0开始）")
    employee_code: Optional[str] = Field(None, description="员工代码")
    id_number: Optional[str] = Field(None, description="身份证号")
    first_name: Optional[str] = Field(None, description="名")
    last_name: Optional[str] = Field(None, description="姓")
    full_name: Optional[str] = Field(None, description="完整姓名")
    errors: List[str] = Field(..., description="错误信息列表")

class BulkEmployeeCreateResult(BaseModel):
    """批量创建员工的结果"""
    success_count: int = Field(..., description="成功创建/更新的员工数量")
    failed_count: int = Field(..., description="失败的记录数量")
    total_count: int = Field(..., description="总记录数量")
    created_employees: List[Employee] = Field(..., description="成功创建/更新的员工列表")
    failed_records: List[BulkEmployeeFailedRecord] = Field(..., description="失败的记录列表")


# 批量导入相关模型
class EmployeeBatchImportItem(BaseModel):
    """批量导入员工数据项"""
    client_id: Optional[str] = Field(None, description="客户端生成的唯一ID")
    
    # 基础字段
    employee_code: Optional[str] = Field(None, description="员工编号")
    first_name: Optional[str] = Field(None, description="名")
    last_name: Optional[str] = Field(None, description="姓")
    id_number: Optional[str] = Field(None, description="身份证号")
    hire_date: Optional[date] = Field(None, description="入职日期")
    
    # 个人信息字段
    date_of_birth: Optional[date] = Field(None, description="出生日期")
    nationality: Optional[str] = Field(None, description="国籍")
    ethnicity: Optional[str] = Field(None, description="民族")
    email: Optional[EmailStr] = Field(None, description="邮箱")
    phone_number: Optional[str] = Field(None, description="电话号码")
    home_address: Optional[str] = Field(None, description="家庭地址")
    emergency_contact_name: Optional[str] = Field(None, description="紧急联系人姓名")
    emergency_contact_phone: Optional[str] = Field(None, description="紧急联系人电话")
    
    # 工作信息字段
    first_work_date: Optional[date] = Field(None, description="首次工作日期")
    current_position_start_date: Optional[date] = Field(None, description="当前职位开始日期")
    career_position_level_date: Optional[date] = Field(None, description="职级评定日期")
    interrupted_service_years: Optional[float] = Field(None, description="中断服务年限")
    social_security_client_number: Optional[str] = Field(None, description="社保个人客户号")
    housing_fund_client_number: Optional[str] = Field(None, description="公积金个人客户号")
    
    # 银行账户字段
    bank_name: Optional[str] = Field(None, description="银行名称")
    bank_account_number: Optional[str] = Field(None, description="银行账号")
    account_holder_name: Optional[str] = Field(None, description="账户持有人姓名")
    branch_name: Optional[str] = Field(None, description="开户支行")
    
    # 字典值字段（通过名称）
    gender_name: Optional[str] = Field(None, description="性别")
    employee_status: Optional[str] = Field(None, description="员工状态")
    employment_type_name: Optional[str] = Field(None, description="雇佣类型")
    education_level_name: Optional[str] = Field(None, description="教育水平")
    marital_status_name: Optional[str] = Field(None, description="婚姻状况")
    political_status_name: Optional[str] = Field(None, description="政治面貌")
    contract_type_name: Optional[str] = Field(None, description="合同类型")
    job_position_level_name: Optional[str] = Field(None, description="职务级别")
    salary_level_name: Optional[str] = Field(None, description="工资级别")
    salary_grade_name: Optional[str] = Field(None, description="工资档次")
    
    # 关联字段（通过名称）
    department_name: Optional[str] = Field(None, description="部门名称")
    position_name: Optional[str] = Field(None, description="职位名称")
    personnel_category_name: Optional[str] = Field(None, description="人员类别名称")


class EmployeeBatchValidationRequest(BaseModel):
    """员工批量验证请求"""
    employees: List[EmployeeBatchImportItem] = Field(..., description="待验证的员工数据列表")
    overwrite_mode: str = Field("append", description="覆盖模式：append(追加) 或 replace(替换)")


class EmployeeBatchValidationError(BaseModel):
    """验证错误信息"""
    field: str = Field(..., description="错误字段")
    message: str = Field(..., description="错误消息")


class EmployeeBatchValidationWarning(BaseModel):
    """验证警告信息"""
    field: str = Field(..., description="警告字段")
    message: str = Field(..., description="警告消息")


class EmployeeBatchValidationResult(BaseModel):
    """单个员工验证结果"""
    client_id: Optional[str] = Field(None, description="客户端ID")
    is_valid: bool = Field(..., description="是否验证通过")
    errors: List[EmployeeBatchValidationError] = Field(default_factory=list, description="错误列表")
    warnings: List[EmployeeBatchValidationWarning] = Field(default_factory=list, description="警告列表")
    employee_id: Optional[int] = Field(None, description="如果是更新现有员工，返回员工ID")


class EmployeeBatchValidationResponse(BaseModel):
    """员工批量验证响应"""
    validation_results: List[EmployeeBatchValidationResult] = Field(..., description="验证结果列表")
    summary: Dict[str, Any] = Field(default_factory=dict, description="验证摘要信息")


class EmployeeBatchImportRequest(BaseModel):
    """员工批量导入请求"""
    employees: List[EmployeeBatchImportItem] = Field(..., description="待导入的员工数据列表")
    overwrite_mode: str = Field("append", description="覆盖模式：append(追加) 或 replace(替换)")


class EmployeeBatchImportResponse(BaseModel):
    """员工批量导入响应"""
    success_count: int = Field(..., description="成功导入的员工数量")
    error_count: int = Field(..., description="导入失败的员工数量")
    message: str = Field(..., description="导入结果消息")
    details: Dict[str, Any] = Field(default_factory=dict, description="详细信息")

# 重新构建所有模型以解决前向引用
BulkEmployeeCreateResult.model_rebuild()
EmployeeBatchValidationResult.model_rebuild()
EmployeeBatchValidationResponse.model_rebuild()
EmployeeBatchImportResponse.model_rebuild()
