"""
服务层模块

提供业务逻辑的抽象和封装，包括：
- 基础服务类
- 视图服务
- CRUD服务  
- 业务编排服务
"""

from .base import BaseService, BaseViewService, BaseCRUDService, BusinessService
from .payroll import (
    PayrollPeriodsViewService,
    PayrollRunsViewService, 
    PayrollEntriesViewService,
    PayrollComponentsViewService,
    PayrollSummaryViewService,
    EmployeeSalaryHistoryViewService,
    PayrollBusinessService
)
from .hr import (
    EmployeesViewService,
    DepartmentsViewService,
    PositionsViewService,
    PersonnelCategoriesViewService,
    HRBusinessService
)
from .config import (
    LookupTypesViewService,
    LookupValuesViewService,
    PayrollComponentsViewService as ConfigPayrollComponentsViewService,
    TaxBracketsViewService,
    SocialSecurityRatesViewService,
    SystemParametersViewService,
    ConfigBusinessService
)

__all__ = [
    # 基础服务
    "BaseService",
    "BaseViewService", 
    "BaseCRUDService",
    "BusinessService",
    
    # 薪资服务
    "PayrollPeriodsViewService",
    "PayrollRunsViewService",
    "PayrollEntriesViewService", 
    "PayrollComponentsViewService",
    "PayrollSummaryViewService",
    "EmployeeSalaryHistoryViewService",
    "PayrollBusinessService",
    
    # 人力资源服务
    "EmployeesViewService",
    "DepartmentsViewService",
    "PositionsViewService",
    "PersonnelCategoriesViewService",
    "HRBusinessService",
    
    # 配置服务
    "LookupTypesViewService",
    "LookupValuesViewService",
    "ConfigPayrollComponentsViewService",
    "TaxBracketsViewService",
    "SocialSecurityRatesViewService",
    "SystemParametersViewService",
    "ConfigBusinessService",
] 