"""
薪资服务模块

提供薪资相关的业务逻辑，包括：
- 薪资周期视图服务
- 薪资运行视图服务  
- 薪资条目视图服务
- 薪资组件视图服务
- 薪资业务编排服务
"""

from typing import Any, Dict, List, Optional, Type, Tuple
from sqlalchemy.orm import Session

from .base import BaseViewService, BaseCRUDService, BusinessService
from ..models.payroll import PayrollPeriod, PayrollRun, PayrollEntry
from ..models.config import PayrollComponentDefinition


class PayrollPeriodsViewService(BaseViewService):
    """薪资周期视图服务"""
    
    @property
    def view_name(self) -> str:
        return "v_payroll_periods_detail"
    
    @property
    def default_fields(self) -> List[str]:
        return [
            "id", "name", "description", "frequency_name", "status_name", 
            "is_active", "start_date::text as start_date", "end_date::text as end_date", 
            "runs_count", "entries_count", "created_at::text as created_at", 
            "updated_at::text as updated_at"
        ]
    
    @property
    def field_mappings(self) -> Dict[str, str]:
        return {
            "frequency_id": "frequency_lookup_value_id",
            "status_id": "status_lookup_value_id",
            "active": "is_active"
        }


class PayrollRunsViewService(BaseViewService):
    """薪资运行视图服务"""
    
    @property
    def view_name(self) -> str:
        return "v_payroll_runs_detail"
    
    @property
    def default_fields(self) -> List[str]:
        return [
            "id", "period_id", "period_name", "period_description", "status_name",
            "initiated_by_username", "total_entries", "total_gross_pay", 
            "total_net_pay", "total_deductions", "initiated_at::text as initiated_at", 
            "calculated_at::text as calculated_at", "approved_at::text as approved_at"
        ]
    
    @property
    def field_mappings(self) -> Dict[str, str]:
        return {
            "payroll_period_id": "period_id",
            "status_lookup_value_id": "status_id"
        }


class PayrollEntriesViewService(BaseViewService):
    """薪资条目视图服务"""
    
    @property
    def view_name(self) -> str:
        return "v_comprehensive_employee_payroll"
    
    def get_view_columns(self) -> List[dict]:
        """动态获取视图的所有列信息"""
        try:
            from sqlalchemy import text
            result = self.db.execute(text("""
                SELECT 
                    column_name,
                    data_type,
                    is_nullable,
                    column_default,
                    ordinal_position
                FROM information_schema.columns 
                WHERE table_schema = 'reports' 
                AND table_name = 'v_comprehensive_employee_payroll'
                ORDER BY ordinal_position
            """))
            
            columns = []
            for row in result:
                columns.append({
                    'name': row.column_name,
                    'type': row.data_type,
                    'nullable': row.is_nullable == 'YES',
                    'default': row.column_default,
                    'position': row.ordinal_position
                })
            return columns
        except Exception as e:
            logger.error(f"获取视图列信息失败: {e}")
            return []
    
    def get_all_available_fields(self) -> List[str]:
        """获取视图中所有可用的字段名（中文字段名）"""
        columns = self.get_view_columns()
        return [col['name'] for col in columns if col['name'] not in ['原始应发明细', '原始扣除明细', '原始计算输入', '原始计算日志']]
    
    @property
    def default_fields(self) -> List[str]:
        """动态生成默认字段列表 - 现在使用中文字段名"""
        # 优先显示的核心字段（使用中文字段名）
        priority_fields = [
            "薪资条目ID as id", 
            "员工ID as employee_id", 
            "员工编号 as employee_code", 
            "姓名 as employee_name", 
            "部门名称 as department_name", 
            "职位名称 as position_name", 
            "薪资期间名称 as period_name",
            "应发合计 as gross_pay", 
            "实发合计 as net_pay", 
            "扣除合计 as total_deductions",
            
            # 主要应发项目
            "基本工资 as basic_salary",
            "奖励性绩效工资 as performance_bonus", 
            "岗位工资 as position_salary",
            "级别工资 as grade_salary",
            "薪级工资 as salary_grade",
            "津贴 as allowance",
            "补助 as subsidy",
            
            # 主要扣除项目
            "个人所得税 as personal_income_tax",
            "养老保险个人应缴金额 as pension_personal",
            "医疗保险个人缴纳金额 as medical_personal",
            "个人缴住房公积金 as housing_fund_personal",
            
            # 新增字段
            "工资统发 as unified_payroll_flag",
            "财政供养 as fiscal_support_flag",
            
            # 时间字段
            "计算时间 as calculated_at",
            "更新时间 as updated_at"
        ]
        
        return priority_fields
    
    @property
    def field_mappings(self) -> Dict[str, str]:
        return {
            "payroll_period_id": "payroll_period_id",
            "payroll_run_id": "payroll_run_id",
            "department_id": "department_id",
            "period_id": "payroll_period_id",
            "run_id": "payroll_run_id"
        }


class PayrollComponentsViewService(BaseViewService):
    """薪资组件视图服务"""
    
    @property
    def view_name(self) -> str:
        return "v_payroll_components_basic"
    
    @property
    def default_fields(self) -> List[str]:
        return [
            "id", "name", "description", "component_type", "calculation_method",
            "is_active", "config_params", "employees_count",
            "created_at::text as created_at", "updated_at::text as updated_at"
        ]
    
    @property
    def field_mappings(self) -> Dict[str, str]:
        return {
            "type": "component_type",
            "active": "is_active"
        }


class PayrollSummaryViewService(BaseViewService):
    """薪资汇总分析视图服务"""
    
    @property
    def view_name(self) -> str:
        return "v_payroll_summary_analysis"
    
    @property
    def default_fields(self) -> List[str]:
        return [
            "period_id", "period_name", "department_id", "department_name",
            "employee_count", "unique_employee_count",
            "total_gross_pay", "total_net_pay", "total_deductions",
            "avg_gross_pay", "avg_net_pay", "avg_deductions",
            "total_basic_salary", "total_performance_salary", 
            "total_allowance", "total_subsidy",
            "total_income_tax", "total_pension_deduction", 
            "total_medical_deduction", "total_housing_fund_deduction",
            "first_entry_date::text as first_entry_date", 
            "last_updated_date::text as last_updated_date"
        ]


# CRUD服务类
class PayrollPeriodCRUDService(BaseCRUDService):
    """薪资周期CRUD服务"""
    
    @property
    def model_class(self) -> Type:
        return PayrollPeriod


class PayrollRunCRUDService(BaseCRUDService):
    """薪资运行CRUD服务"""
    
    @property
    def model_class(self) -> Type:
        return PayrollRun


class PayrollEntryCRUDService(BaseCRUDService):
    """薪资条目CRUD服务"""
    
    @property
    def model_class(self) -> Type:
        return PayrollEntry


class PayrollComponentCRUDService(BaseCRUDService):
    """薪资组件CRUD服务"""
    
    @property
    def model_class(self) -> Type:
        return PayrollComponentDefinition


# 业务服务类
class PayrollPeriodsBusinessService(BusinessService):
    """薪资周期业务服务"""
    
    @property
    def view_service_class(self) -> Type[BaseViewService]:
        return PayrollPeriodsViewService
    
    @property
    def crud_service_class(self) -> Type[BaseCRUDService]:
        return PayrollPeriodCRUDService
    
    def get_periods_with_stats(
        self, 
        page: int = 1, 
        size: int = 50,
        **filters
    ) -> Dict[str, Any]:
        """获取包含统计信息的薪资周期列表"""
        # 使用视图获取数据，包含统计信息
        data, total = self.view_service.get_paginated_data(
            page=page, 
            size=size, 
            filters=filters,
            order_by="created_at DESC"
        )
        
        return self.format_pagination_response(data, total, page, size)


class PayrollRunsBusinessService(BusinessService):
    """薪资运行业务服务"""
    
    @property
    def view_service_class(self) -> Type[BaseViewService]:
        return PayrollRunsViewService
    
    @property
    def crud_service_class(self) -> Type[BaseCRUDService]:
        return PayrollRunCRUDService
    
    def get_runs_with_summary(
        self, 
        page: int = 1, 
        size: int = 50,
        **filters
    ) -> Dict[str, Any]:
        """获取包含汇总信息的薪资运行列表"""
        data, total = self.view_service.get_paginated_data(
            page=page, 
            size=size, 
            filters=filters,
            order_by="initiated_at DESC"
        )
        
        return self.format_pagination_response(data, total, page, size)


class PayrollEntriesBusinessService(BusinessService):
    """薪资条目业务服务"""
    
    @property
    def view_service_class(self) -> Type[BaseViewService]:
        return PayrollEntriesViewService
    
    @property
    def crud_service_class(self) -> Type[BaseCRUDService]:
        return PayrollEntryCRUDService
    
    def get_detailed_entries(
        self, 
        page: int = 1, 
        size: int = 50,
        **filters
    ) -> Dict[str, Any]:
        """获取详细的薪资条目列表（JSONB字段已展开）"""
        data, total = self.view_service.get_paginated_data(
            page=page, 
            size=size, 
            filters=filters,
            order_by="employee_code, id"
        )
        
        return self.format_pagination_response(data, total, page, size)
    
    def get_entry_summary_by_department(
        self, 
        period_id: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """获取按部门汇总的薪资条目统计"""
        summary_service = PayrollSummaryViewService(self.db)
        filters = {}
        if period_id:
            filters["period_id"] = period_id
        
        return summary_service.query_view(
            filters=filters,
            order_by="department_name"
        )


class PayrollComponentsBusinessService(BusinessService):
    """薪资组件业务服务"""
    
    @property
    def view_service_class(self) -> Type[BaseViewService]:
        return PayrollComponentsViewService
    
    @property
    def crud_service_class(self) -> Type[BaseCRUDService]:
        return PayrollComponentCRUDService
    
    def get_components_with_usage(
        self, 
        page: int = 1, 
        size: int = 50,
        **filters
    ) -> Dict[str, Any]:
        """获取包含使用统计的薪资组件列表"""
        data, total = self.view_service.get_paginated_data(
            page=page, 
            size=size, 
            filters=filters,
            order_by="component_type, name"
        )
        
        return self.format_pagination_response(data, total, page, size)


class EmployeeSalaryHistoryViewService(BaseViewService):
    """员工薪资历史视图服务"""
    
    @property
    def view_name(self) -> str:
        return "v_employee_salary_history"
    
    @property
    def default_fields(self) -> List[str]:
        return [
            "id", "employee_id", "employee_code", "employee_name", 
            "department_name", "position_name", "personnel_category_name",
            "period_id", "period_name", "payroll_run_id",
            "gross_pay", "net_pay", "total_deductions",
            # 收入明细字段
            "basic_salary", "performance_salary", "position_salary", "grade_salary",
            "allowance", "subsidy", "traffic_allowance", "township_allowance",
            "position_allowance", "civil_servant_allowance", "back_pay",
            # 扣除明细字段
            "personal_income_tax", "pension_personal", "medical_personal", 
            "unemployment_personal", "housing_fund_personal", "annuity_personal",
            # 汇总字段
            "basic_wage_total", "performance_total", "allowance_total", 
            "social_insurance_total",
            # 排名和统计字段
            "salary_rank_in_period", "salary_rank_in_department",
            "calculated_at::text as calculated_at", "updated_at::text as updated_at"
        ]
    
    @property
    def field_mappings(self) -> Dict[str, str]:
        return {
            "employee_id": "employee_id",
            "period_id": "period_id",
            "department_id": "department_id",
            "min_gross_pay": "gross_pay",
            "max_gross_pay": "gross_pay"
        }
    
    def get_employee_salary_history(
        self,
        employee_id: Optional[int] = None,
        period_id: Optional[int] = None,
        department_id: Optional[int] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        min_gross_pay: Optional[float] = None,
        max_gross_pay: Optional[float] = None,
        page: int = 1,
        size: int = 50,
        order_by: Optional[str] = None
    ) -> Tuple[List[Dict[str, Any]], int]:
        """获取员工薪资历史数据"""
        
        # 构建过滤条件
        filters = {}
        if employee_id is not None:
            filters["employee_id"] = employee_id
        if period_id is not None:
            filters["period_id"] = period_id
        if department_id is not None:
            filters["department_id"] = department_id
        
        # 构建复杂查询条件
        additional_conditions = []
        params = {}
        
        if start_date:
            additional_conditions.append("calculated_at >= :start_date")
            params["start_date"] = start_date
        if end_date:
            additional_conditions.append("calculated_at <= :end_date")
            params["end_date"] = end_date
        if min_gross_pay is not None:
            additional_conditions.append("gross_pay >= :min_gross_pay")
            params["min_gross_pay"] = min_gross_pay
        if max_gross_pay is not None:
            additional_conditions.append("gross_pay <= :max_gross_pay")
            params["max_gross_pay"] = max_gross_pay
        
        # 默认排序
        if not order_by:
            order_by = "calculated_at DESC, gross_pay DESC"
        
        # 如果有复杂条件，使用自定义查询
        if additional_conditions:
            # 构建字段列表
            fields_str = ", ".join(self.default_fields)
            
            # 构建基础查询
            query = f"SELECT {fields_str} FROM {self.view_name}"
            
            # 添加WHERE条件
            all_conditions = []
            if filters:
                base_conditions, base_params = self.build_where_conditions(filters, self.field_mappings)
                all_conditions.extend(base_conditions)
                params.update(base_params)
            
            all_conditions.extend(additional_conditions)
            
            if all_conditions:
                query += f" WHERE {' AND '.join(all_conditions)}"
            
            # 添加排序
            query += f" ORDER BY {order_by}"
            
            # 计算偏移量
            offset = (page - 1) * size
            query += f" LIMIT {size} OFFSET {offset}"
            
            # 执行查询
            from sqlalchemy import text
            result = self.db.execute(text(query), params)
            data = [dict(row._mapping) for row in result]
            
            # 获取总数
            count_query = f"SELECT COUNT(*) FROM {self.view_name}"
            if all_conditions:
                count_query += f" WHERE {' AND '.join(all_conditions)}"
            
            count_result = self.db.execute(text(count_query), params)
            total = count_result.scalar()
            
            return data, total
        else:
            # 使用基础方法
            return self.get_paginated_data(
                page=page,
                size=size,
                filters=filters,
                order_by=order_by
            )
    
    def get_employee_salary_trend(
        self,
        employee_id: int,
        limit: int = 12
    ) -> List[Dict[str, Any]]:
        """获取员工薪资趋势数据（最近N个周期）"""
        
        query = f"""
        SELECT 
            period_name,
            gross_pay,
            net_pay,
            total_deductions,
            basic_salary,
            performance_salary,
            calculated_at::text as calculated_at
        FROM {self.view_name}
        WHERE employee_id = :employee_id
        ORDER BY calculated_at DESC
        LIMIT :limit
        """
        
        from sqlalchemy import text
        result = self.db.execute(text(query), {
            "employee_id": employee_id,
            "limit": limit
        })
        
        return [dict(row._mapping) for row in result]


# 统一的薪资业务服务
class PayrollBusinessService(BusinessService):
    """薪资业务服务 - 整合所有薪资相关的视图和CRUD服务"""
    
    def __init__(self, db: Session):
        super().__init__(db)
        self._periods_service = None
        self._entries_service = None
        self._components_service = None
        self._salary_history_service = None
    
    @property
    def view_service_class(self):
        return PayrollEntriesViewService
    
    @property
    def crud_service_class(self):
        # 这里可以返回对应的CRUD服务类
        return None
    
    @property
    def periods(self) -> PayrollPeriodsViewService:
        """薪资周期服务"""
        if self._periods_service is None:
            self._periods_service = PayrollPeriodsViewService(self.db)
        return self._periods_service
    
    @property
    def entries(self) -> PayrollEntriesViewService:
        """薪资条目服务"""
        if self._entries_service is None:
            self._entries_service = PayrollEntriesViewService(self.db)
        return self._entries_service
    
    @property
    def components(self) -> PayrollComponentsViewService:
        """薪资组件服务"""
        if self._components_service is None:
            self._components_service = PayrollComponentsViewService(self.db)
        return self._components_service
    
    @property
    def salary_history(self) -> EmployeeSalaryHistoryViewService:
        """员工薪资历史服务"""
        if self._salary_history_service is None:
            self._salary_history_service = EmployeeSalaryHistoryViewService(self.db)
        return self._salary_history_service
    
    def get_dashboard_summary(self) -> Dict[str, Any]:
        """获取薪资仪表板汇总数据"""
        # 使用视图服务获取汇总数据
        summary_service = PayrollSummaryViewService(self.db)
        
        # 获取最近的薪资汇总
        recent_summary = summary_service.query_view(
            limit=10,
            order_by="period_name DESC, department_name"
        )
        
        return {
            "recent_periods": recent_summary,
            "total_departments": len(set(item["department_name"] for item in recent_summary)),
            "total_employees": sum(item["employee_count"] for item in recent_summary),
            "total_gross_pay": sum(item["total_gross_pay"] for item in recent_summary)
        } 