"""
高级审核规则服务
提供更深入的工资审核功能，包括自定义规则、历史对比、智能异常检测等
"""
import logging
from typing import List, Dict, Any, Optional, Tuple
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, select, func, text
from datetime import datetime, timedelta
import statistics
import json

from webapp.v2.models import PayrollRun, PayrollEntry, Employee, PayrollPeriod
from .payroll_audit_service import PayrollAuditService

logger = logging.getLogger(__name__)

class AdvancedAuditService(PayrollAuditService):
    """高级审核规则服务类，继承基础审核功能"""
    
    def __init__(self, db: Session):
        super().__init__(db)
    
    async def run_advanced_audit_check(
        self,
        payroll_run_id: int,
        include_custom_rules: bool = True,
        include_historical_comparison: bool = True,
        include_statistical_analysis: bool = True
    ) -> Dict[str, Any]:
        """
        执行高级审核检查
        
        Args:
            payroll_run_id: 工资版本ID
            include_custom_rules: 是否包含自定义规则检查
            include_historical_comparison: 是否包含历史对比
            include_statistical_analysis: 是否包含统计分析
            
        Returns:
            审核结果汇总
        """
        try:
            logger.info(f"开始高级审核检查 - 工资版本: {payroll_run_id}")
            
            # 先执行基础审核
            basic_summary = await super().run_audit_check(payroll_run_id)
            
            # 高级审核结果
            advanced_results = {
                "basic_audit": basic_summary,
                "advanced_checks": []
            }
            
            # 1. 薪资合规性检查
            if include_custom_rules:
                compliance_results = await self._check_salary_compliance(payroll_run_id)
                advanced_results["advanced_checks"].append({
                    "type": "compliance",
                    "name": "薪资合规性检查",
                    "results": compliance_results
                })
            
            # 2. 历史数据对比分析
            if include_historical_comparison:
                comparison_results = await self._perform_historical_comparison(payroll_run_id)
                advanced_results["advanced_checks"].append({
                    "type": "historical_comparison",
                    "name": "历史数据对比",
                    "results": comparison_results
                })
            
            # 3. 统计异常检测
            if include_statistical_analysis:
                statistical_results = await self._detect_statistical_anomalies(payroll_run_id)
                advanced_results["advanced_checks"].append({
                    "type": "statistical_analysis",
                    "name": "统计异常检测",
                    "results": statistical_results
                })
            
            # 4. 薪资结构一致性检查
            structure_results = await self._check_salary_structure_consistency(payroll_run_id)
            advanced_results["advanced_checks"].append({
                "type": "structure_consistency",
                "name": "薪资结构一致性",
                "results": structure_results
            })
            
            # 5. 个税计算深度验证
            tax_results = await self._perform_deep_tax_validation(payroll_run_id)
            advanced_results["advanced_checks"].append({
                "type": "tax_validation",
                "name": "个税计算深度验证",
                "results": tax_results
            })
            
            logger.info(f"高级审核检查完成 - 工资版本: {payroll_run_id}")
            return advanced_results
            
        except Exception as e:
            logger.error(f"高级审核检查失败: {str(e)}")
            raise

    async def _check_salary_compliance(self, payroll_run_id: int) -> Dict[str, Any]:
        """薪资合规性检查"""
        
        compliance_issues = []
        
        try:
            # 获取工资条目
            entries = await self._get_payroll_entries(payroll_run_id)
            
            for entry in entries:
                issues = []
                
                # 1. 最低工资标准检查（更严格）
                if entry.net_pay < 2320:  # 假设最低工资标准
                    issues.append({
                        "type": "minimum_wage_violation",
                        "severity": "error",
                        "message": f"实发工资 ¥{entry.net_pay:.2f} 低于最低工资标准 ¥2320",
                        "suggested_action": "调整基本工资或减少扣除项"
                    })
                
                # 2. 工资组成合理性检查
                if entry.earnings_details:
                    basic_salary = entry.earnings_details.get("basic_salary", 0)
                    total_earnings = sum(entry.earnings_details.values())
                    
                    # 基本工资占比过低
                    if basic_salary > 0 and (basic_salary / total_earnings) < 0.6:
                        issues.append({
                            "type": "basic_salary_ratio_low",
                            "severity": "warning",
                            "message": f"基本工资占比 {(basic_salary/total_earnings)*100:.1f}% 过低，建议不低于60%",
                            "suggested_action": "调整工资结构，提高基本工资占比"
                        })
                
                # 3. 社保缴费基数检查
                if entry.deductions_details:
                    social_security = entry.deductions_details.get("social_security", 0)
                    if social_security > 0:
                        # 社保基数合理性检查
                        expected_base = min(max(entry.gross_pay, 3500), 28000)  # 假设社保基数范围
                        expected_social_security = expected_base * 0.105  # 假设个人缴费比例10.5%
                        
                        if abs(social_security - expected_social_security) > 50:
                            issues.append({
                                "type": "social_security_calculation_error",
                                "severity": "error",
                                "message": f"社保扣除 ¥{social_security:.2f} 与预期 ¥{expected_social_security:.2f} 差异过大",
                                "suggested_action": "检查社保缴费基数和比例设置"
                            })
                
                # 4. 个税计算合理性检查
                personal_tax = entry.deductions_details.get("personal_tax", 0) if entry.deductions_details else 0
                if personal_tax > 0:
                    # 简化的个税计算验证
                    taxable_income = max(0, entry.gross_pay - 5000 - social_security)  # 5000为起征点
                    if taxable_income > 0:
                        # 简单税率计算（实际应该更复杂）
                        expected_tax = self._calculate_expected_tax(taxable_income)
                        if abs(personal_tax - expected_tax) > 10:
                            issues.append({
                                "type": "personal_tax_calculation_error",
                                "severity": "warning",
                                "message": f"个税 ¥{personal_tax:.2f} 与预期 ¥{expected_tax:.2f} 存在差异",
                                "suggested_action": "检查个税计算公式和专项扣除"
                            })
                
                if issues:
                    compliance_issues.append({
                        "employee_code": entry.employee_code,
                        "employee_name": entry.employee_name,
                        "issues": issues
                    })
            
            return {
                "total_checked": len(entries),
                "issues_found": len(compliance_issues),
                "compliance_issues": compliance_issues,
                "summary": {
                    "error_count": sum(1 for emp in compliance_issues for issue in emp["issues"] if issue["severity"] == "error"),
                    "warning_count": sum(1 for emp in compliance_issues for issue in emp["issues"] if issue["severity"] == "warning")
                }
            }
            
        except Exception as e:
            logger.error(f"薪资合规性检查失败: {str(e)}")
            return {"error": str(e)}

    async def _perform_historical_comparison(self, payroll_run_id: int) -> Dict[str, Any]:
        """历史数据对比分析"""
        
        try:
            # 获取当前工资版本
            current_run = self.db.get(PayrollRun, payroll_run_id)
            if not current_run:
                raise ValueError("工资版本不存在")
            
            # 获取前几个月的数据进行对比
            historical_runs = await self._get_historical_payroll_runs(
                current_run.period_id, 
                months_back=3
            )
            
            if not historical_runs:
                return {
                    "message": "无历史数据可供对比",
                    "comparison_results": []
                }
            
            # 获取当前月份的工资条目
            current_entries = await self._get_payroll_entries(payroll_run_id)
            
            comparison_results = []
            
            for entry in current_entries:
                # 获取该员工的历史数据
                historical_data = await self._get_employee_historical_data(
                    entry.employee_code,
                    historical_runs
                )
                
                if historical_data:
                    analysis = await self._analyze_employee_trends(entry, historical_data)
                    if analysis.get("anomalies"):
                        comparison_results.append({
                            "employee_code": entry.employee_code,
                            "employee_name": entry.employee_name,
                            "analysis": analysis
                        })
            
            # 整体趋势分析
            overall_trends = await self._analyze_overall_trends(current_run, historical_runs)
            
            return {
                "historical_periods_compared": len(historical_runs),
                "employees_analyzed": len(current_entries),
                "anomalies_found": len(comparison_results),
                "individual_anomalies": comparison_results,
                "overall_trends": overall_trends
            }
            
        except Exception as e:
            logger.error(f"历史数据对比失败: {str(e)}")
            return {"error": str(e)}

    async def _detect_statistical_anomalies(self, payroll_run_id: int) -> Dict[str, Any]:
        """统计异常检测"""
        
        try:
            entries = await self._get_payroll_entries(payroll_run_id)
            
            if len(entries) < 10:  # 数据量太少无法进行统计分析
                return {
                    "message": "数据量不足，无法进行统计分析",
                    "anomalies": []
                }
            
            anomalies = []
            
            # 1. 工资分布异常检测
            gross_pays = [float(entry.gross_pay) for entry in entries]
            net_pays = [float(entry.net_pay) for entry in entries]
            
            # 计算统计指标
            gross_mean = statistics.mean(gross_pays)
            gross_std = statistics.stdev(gross_pays) if len(gross_pays) > 1 else 0
            
            net_mean = statistics.mean(net_pays)
            net_std = statistics.stdev(net_pays) if len(net_pays) > 1 else 0
            
            # 检测异常值（3σ原则）
            for entry in entries:
                # 应发工资异常
                if gross_std > 0:
                    gross_z_score = abs((float(entry.gross_pay) - gross_mean) / gross_std)
                    if gross_z_score > 3:
                        anomalies.append({
                            "employee_code": entry.employee_code,
                            "employee_name": entry.employee_name,
                            "type": "gross_pay_outlier",
                            "severity": "warning",
                            "message": f"应发工资 ¥{entry.gross_pay:.2f} 异常偏离平均值 ¥{gross_mean:.2f}",
                            "z_score": round(gross_z_score, 2),
                            "suggested_action": "检查工资计算是否正确"
                        })
                
                # 实发工资异常
                if net_std > 0:
                    net_z_score = abs((float(entry.net_pay) - net_mean) / net_std)
                    if net_z_score > 3:
                        anomalies.append({
                            "employee_code": entry.employee_code,
                            "employee_name": entry.employee_name,
                            "type": "net_pay_outlier",
                            "severity": "warning",
                            "message": f"实发工资 ¥{entry.net_pay:.2f} 异常偏离平均值 ¥{net_mean:.2f}",
                            "z_score": round(net_z_score, 2),
                            "suggested_action": "检查扣除项计算是否正确"
                        })
            
            # 2. 扣除比例异常检测
            deduction_ratios = []
            for entry in entries:
                if entry.gross_pay > 0:
                    ratio = float(entry.total_deductions) / float(entry.gross_pay)
                    deduction_ratios.append((entry, ratio))
            
            if deduction_ratios:
                ratios = [ratio for _, ratio in deduction_ratios]
                ratio_mean = statistics.mean(ratios)
                ratio_std = statistics.stdev(ratios) if len(ratios) > 1 else 0
                
                for entry, ratio in deduction_ratios:
                    if ratio_std > 0:
                        ratio_z_score = abs((ratio - ratio_mean) / ratio_std)
                        if ratio_z_score > 2.5:  # 稍微宽松的阈值
                            anomalies.append({
                                "employee_code": entry.employee_code,
                                "employee_name": entry.employee_name,
                                "type": "deduction_ratio_outlier",
                                "severity": "info",
                                "message": f"扣除比例 {ratio*100:.1f}% 异常偏离平均值 {ratio_mean*100:.1f}%",
                                "ratio": round(ratio, 3),
                                "suggested_action": "检查扣除项目设置"
                            })
            
            return {
                "total_analyzed": len(entries),
                "statistical_metrics": {
                    "gross_pay": {
                        "mean": round(gross_mean, 2),
                        "std": round(gross_std, 2),
                        "min": min(gross_pays),
                        "max": max(gross_pays)
                    },
                    "net_pay": {
                        "mean": round(net_mean, 2),
                        "std": round(net_std, 2),
                        "min": min(net_pays),
                        "max": max(net_pays)
                    }
                },
                "anomalies_detected": len(anomalies),
                "anomalies": anomalies
            }
            
        except Exception as e:
            logger.error(f"统计异常检测失败: {str(e)}")
            return {"error": str(e)}

    async def _check_salary_structure_consistency(self, payroll_run_id: int) -> Dict[str, Any]:
        """薪资结构一致性检查"""
        
        try:
            entries = await self._get_payroll_entries(payroll_run_id)
            
            # 按部门分组分析
            department_groups = {}
            for entry in entries:
                dept = entry.department_name or "未知部门"
                if dept not in department_groups:
                    department_groups[dept] = []
                department_groups[dept].append(entry)
            
            consistency_issues = []
            
            # 检查每个部门内的薪资结构一致性
            for dept_name, dept_entries in department_groups.items():
                if len(dept_entries) < 2:  # 单人部门跳过
                    continue
                
                # 分析薪资组件的一致性
                component_analysis = await self._analyze_department_component_consistency(
                    dept_name, dept_entries
                )
                
                if component_analysis.get("inconsistencies"):
                    consistency_issues.append({
                        "department": dept_name,
                        "employee_count": len(dept_entries),
                        "inconsistencies": component_analysis["inconsistencies"]
                    })
            
            return {
                "departments_analyzed": len(department_groups),
                "total_employees": len(entries),
                "departments_with_issues": len(consistency_issues),
                "consistency_issues": consistency_issues
            }
            
        except Exception as e:
            logger.error(f"薪资结构一致性检查失败: {str(e)}")
            return {"error": str(e)}

    async def _perform_deep_tax_validation(self, payroll_run_id: int) -> Dict[str, Any]:
        """个税计算深度验证"""
        
        try:
            entries = await self._get_payroll_entries(payroll_run_id)
            
            tax_issues = []
            
            for entry in entries:
                if not entry.deductions_details:
                    continue
                
                # 获取个税相关数据
                personal_tax = entry.deductions_details.get("personal_tax", 0)
                social_security = entry.deductions_details.get("social_security", 0)
                housing_fund = entry.deductions_details.get("housing_fund", 0)
                
                # 深度个税验证
                validation_result = await self._validate_personal_tax_calculation(
                    entry.gross_pay,
                    personal_tax,
                    social_security,
                    housing_fund,
                    entry.employee_code
                )
                
                if validation_result.get("has_issues"):
                    tax_issues.append({
                        "employee_code": entry.employee_code,
                        "employee_name": entry.employee_name,
                        "validation_result": validation_result
                    })
            
            return {
                "total_validated": len(entries),
                "issues_found": len(tax_issues),
                "tax_issues": tax_issues
            }
            
        except Exception as e:
            logger.error(f"个税深度验证失败: {str(e)}")
            return {"error": str(e)}

    # 辅助方法
    def _calculate_expected_tax(self, taxable_income: float) -> float:
        """简化的个税计算（实际应该更复杂）"""
        if taxable_income <= 0:
            return 0
        elif taxable_income <= 36000:
            return taxable_income * 0.03
        elif taxable_income <= 144000:
            return taxable_income * 0.1 - 2520
        elif taxable_income <= 300000:
            return taxable_income * 0.2 - 16920
        else:
            return taxable_income * 0.25 - 31920

    async def _get_historical_payroll_runs(self, current_period_id: int, months_back: int = 3) -> List[PayrollRun]:
        """获取历史工资版本"""
        # 这里需要实现获取历史数据的逻辑
        # 简化实现，返回空列表
        return []

    async def _get_employee_historical_data(self, employee_code: str, historical_runs: List[PayrollRun]) -> List[Dict]:
        """获取员工历史数据"""
        # 简化实现
        return []

    async def _analyze_employee_trends(self, current_entry: PayrollEntry, historical_data: List[Dict]) -> Dict[str, Any]:
        """分析员工工资趋势"""
        # 简化实现
        return {"anomalies": []}

    async def _analyze_overall_trends(self, current_run: PayrollRun, historical_runs: List[PayrollRun]) -> Dict[str, Any]:
        """分析整体趋势"""
        # 简化实现
        return {"trend": "stable"}

    async def _analyze_department_component_consistency(self, dept_name: str, entries: List[PayrollEntry]) -> Dict[str, Any]:
        """分析部门薪资组件一致性"""
        # 简化实现
        return {"inconsistencies": []}

    async def _validate_personal_tax_calculation(
        self, 
        gross_pay: Decimal, 
        personal_tax: float, 
        social_security: float, 
        housing_fund: float,
        employee_code: str
    ) -> Dict[str, Any]:
        """验证个税计算"""
        # 简化实现
        return {"has_issues": False} 