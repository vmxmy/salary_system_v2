"""
员工薪资配置服务模块
处理员工薪资配置的创建、更新、复制等业务逻辑
"""

from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc
from datetime import datetime, date
from decimal import Decimal
import logging

from ...models.payroll_config import EmployeeSalaryConfig
from ...models.hr import Employee
from ...models.payroll import PayrollPeriod

logger = logging.getLogger(__name__)

class EmployeeSalaryConfigService:
    """员工薪资配置服务"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def copy_salary_configs_for_period(
        self,
        source_period_id: int,
        target_period_id: int,
        user_id: int
    ) -> Dict[str, Any]:
        """
        🎯 专门复制工资配置（基本工资和专项扣除），不复制社保和公积金基数
        
        Args:
            source_period_id: 源期间ID
            target_period_id: 目标期间ID  
            user_id: 操作用户ID
            
        Returns:
            复制结果统计
        """
        try:
            logger.info(f"🚀 [复制薪资配置] 开始复制: 从期间 {source_period_id} 到期间 {target_period_id}")
            
            # 获取源期间和目标期间信息
            source_period = self.db.query(PayrollPeriod).filter(
                PayrollPeriod.id == source_period_id
            ).first()
            target_period = self.db.query(PayrollPeriod).filter(
                PayrollPeriod.id == target_period_id
            ).first()
            
            if not source_period or not target_period:
                raise ValueError("源期间或目标期间不存在")
            
            logger.info(f"✅ [复制薪资配置] 期间验证通过: {source_period.name} -> {target_period.name}")
            
            # 获取源期间的薪资配置（有效期包含源期间的配置）
            # 🎯 修正：处理is_active为null的情况，查询在源期间有效的配置
            source_configs = self.db.query(EmployeeSalaryConfig).filter(
                and_(
                    # 放宽is_active条件：包含null和true的记录
                    or_(EmployeeSalaryConfig.is_active.is_(None), EmployeeSalaryConfig.is_active == True),
                    EmployeeSalaryConfig.effective_date <= source_period.end_date,
                    or_(
                        EmployeeSalaryConfig.end_date.is_(None),
                        EmployeeSalaryConfig.end_date >= source_period.start_date
                    ),
                    # 🎯 确保有基本工资数据（工资配置复制的重点）
                    EmployeeSalaryConfig.basic_salary.isnot(None)
                )
            ).all()
            
            logger.info(f"📋 [复制薪资配置] 找到源配置 {len(source_configs)} 条")
            
            if not source_configs:
                logger.warning(f"⚠️ [复制薪资配置] 源期间没有可复制的薪资配置")
                return {
                    "success": True,
                    "copied_count": 0,
                    "skipped_count": 0,
                    "updated_count": 0,
                    "message": "源期间没有可复制的薪资配置"
                }
            
            # 获取活跃员工列表
            active_employees = self.db.query(Employee.id).filter(
                Employee.is_active == True
            ).all()
            active_employee_ids = {emp.id for emp in active_employees}
            
            logger.info(f"👥 [复制薪资配置] 活跃员工数: {len(active_employee_ids)}")
            
            # 统计变量
            copied_count = 0
            skipped_count = 0
            updated_count = 0
            
            # 目标期间的开始和结束日期
            target_start_date = target_period.start_date
            target_end_date = target_period.end_date
            
            logger.info(f"📅 [复制薪资配置] 目标期间时间范围: {target_start_date} ~ {target_end_date}")
            
            for source_config in source_configs:
                try:
                    # 验证员工是否仍然活跃
                    if source_config.employee_id not in active_employee_ids:
                        logger.debug(f"跳过非活跃员工 {source_config.employee_id}")
                        skipped_count += 1
                        continue
                    
                    # 检查目标期间是否已有该员工的配置
                    existing_config = self.db.query(EmployeeSalaryConfig).filter(
                        and_(
                            EmployeeSalaryConfig.employee_id == source_config.employee_id,
                            # 🎯 同样处理is_active为null的情况
                            or_(EmployeeSalaryConfig.is_active.is_(None), EmployeeSalaryConfig.is_active == True),
                            EmployeeSalaryConfig.effective_date <= target_end_date,
                            or_(
                                EmployeeSalaryConfig.end_date.is_(None),
                                EmployeeSalaryConfig.end_date >= target_start_date
                            )
                        )
                    ).first()
                    
                    if existing_config:
                        # 🎯 只更新工资配置，不覆盖社保和公积金基数
                        existing_config.basic_salary = source_config.basic_salary
                        existing_config.salary_grade_id = source_config.salary_grade_id
                        existing_config.child_education_deduction = source_config.child_education_deduction
                        existing_config.continuing_education_deduction = source_config.continuing_education_deduction
                        existing_config.medical_deduction = source_config.medical_deduction
                        existing_config.housing_loan_deduction = source_config.housing_loan_deduction
                        existing_config.housing_rent_deduction = source_config.housing_rent_deduction
                        existing_config.elderly_care_deduction = source_config.elderly_care_deduction
                        existing_config.overtime_rate_multiplier = source_config.overtime_rate_multiplier
                        # 🚫 不复制社保和公积金基数，保留现有值
                        # existing_config.social_insurance_base = source_config.social_insurance_base
                        # existing_config.housing_fund_base = source_config.housing_fund_base
                        existing_config.updated_at = datetime.now()
                        existing_config.updated_by = user_id
                        
                        updated_count += 1
                        logger.debug(f"更新员工 {source_config.employee_id} 的工资配置（保留原缴费基数）")
                    else:
                        # 🎯 创建新配置，社保和公积金基数使用默认值或从最新配置获取
                        # 获取员工最新的缴费基数配置
                        latest_base_config = self.db.query(EmployeeSalaryConfig).filter(
                            and_(
                                EmployeeSalaryConfig.employee_id == source_config.employee_id,
                                or_(EmployeeSalaryConfig.is_active.is_(None), EmployeeSalaryConfig.is_active == True),
                                or_(
                                    EmployeeSalaryConfig.social_insurance_base.isnot(None),
                                    EmployeeSalaryConfig.housing_fund_base.isnot(None)
                                )
                            )
                        ).order_by(desc(EmployeeSalaryConfig.effective_date)).first()
                        
                        # 设置缴费基数：优先使用最新配置，否则使用合理默认值
                        social_base = latest_base_config.social_insurance_base if latest_base_config else source_config.basic_salary
                        housing_base = latest_base_config.housing_fund_base if latest_base_config else source_config.basic_salary
                        
                        new_config = EmployeeSalaryConfig(
                            employee_id=source_config.employee_id,
                            # 🎯 复制工资相关配置
                            basic_salary=source_config.basic_salary,
                            salary_grade_id=source_config.salary_grade_id,
                            child_education_deduction=source_config.child_education_deduction,
                            continuing_education_deduction=source_config.continuing_education_deduction,
                            medical_deduction=source_config.medical_deduction,
                            housing_loan_deduction=source_config.housing_loan_deduction,
                            housing_rent_deduction=source_config.housing_rent_deduction,
                            elderly_care_deduction=source_config.elderly_care_deduction,
                            overtime_rate_multiplier=source_config.overtime_rate_multiplier,
                            # 🎯 缴费基数使用最新值或合理默认值，不从源配置复制
                            social_insurance_base=social_base,
                            housing_fund_base=housing_base,
                            is_active=True,
                            effective_date=target_start_date,
                            end_date=target_end_date,
                            created_at=datetime.now(),
                            created_by=user_id
                        )
                        self.db.add(new_config)
                        copied_count += 1
                        logger.debug(f"为员工 {source_config.employee_id} 创建新工资配置（使用最新缴费基数）")
                    
                    # 每50条提交一次，提高性能
                    if (copied_count + updated_count) % 50 == 0:
                        self.db.commit()
                        logger.info(f"📊 [复制薪资配置] 进度更新: 已处理 {copied_count + updated_count + skipped_count}/{len(source_configs)} 条")
                        
                except Exception as e:
                    logger.error(f"❌ [复制薪资配置] 处理员工 {source_config.employee_id} 配置失败: {e}")
                    skipped_count += 1
                    continue
            
            # 最终提交
            self.db.commit()
            
            result = {
                "success": True,
                "copied_count": copied_count,
                "updated_count": updated_count,
                "skipped_count": skipped_count,
                "total_processed": len(source_configs),
                "message": f"工资配置复制完成: 新建 {copied_count} 条, 更新 {updated_count} 条, 跳过 {skipped_count} 条（已保留现有缴费基数）"
            }
            
            logger.info(f"🎉 [复制工资配置] 复制完成: {result['message']}")
            return result
            
        except Exception as e:
            logger.error(f"💥 [复制薪资配置] 复制失败: {e}", exc_info=True)
            self.db.rollback()
            raise
    
    def get_employee_config_for_period(
        self,
        employee_id: int,
        period_start: date,
        period_end: date
    ) -> Optional[EmployeeSalaryConfig]:
        """
        获取员工在指定期间的薪资配置
        
        Args:
            employee_id: 员工ID
            period_start: 期间开始日期
            period_end: 期间结束日期
            
        Returns:
            员工薪资配置或None
        """
        return self.db.query(EmployeeSalaryConfig).filter(
            and_(
                EmployeeSalaryConfig.employee_id == employee_id,
                EmployeeSalaryConfig.is_active == True,
                EmployeeSalaryConfig.effective_date <= period_end,
                or_(
                    EmployeeSalaryConfig.end_date.is_(None),
                    EmployeeSalaryConfig.end_date >= period_start
                )
            )
        ).order_by(desc(EmployeeSalaryConfig.effective_date)).first()
    
    def copy_insurance_base_amounts_for_period(
        self,
        source_period_id: int,
        target_period_id: int,
        user_id: int
    ) -> Dict[str, Any]:
        """
        专门复制社保和公积金缴费基数到目标期间
        
        Args:
            source_period_id: 源期间ID
            target_period_id: 目标期间ID  
            user_id: 操作用户ID
            
        Returns:
            复制结果统计
        """
        try:
            logger.info(f"🚀 [复制缴费基数] 开始复制基数: 从期间 {source_period_id} 到期间 {target_period_id}")
            
            # 获取源期间和目标期间信息
            source_period = self.db.query(PayrollPeriod).filter(
                PayrollPeriod.id == source_period_id
            ).first()
            target_period = self.db.query(PayrollPeriod).filter(
                PayrollPeriod.id == target_period_id
            ).first()
            
            if not source_period or not target_period:
                raise ValueError("源期间或目标期间不存在")
            
            logger.info(f"✅ [复制缴费基数] 期间验证通过: {source_period.name} -> {target_period.name}")
            
            # 获取源期间的薪资配置（有效期包含源期间的配置）
            # 🎯 修正：处理is_active为null的情况，查询在源期间有效的配置
            source_configs = self.db.query(EmployeeSalaryConfig).filter(
                and_(
                    # 放宽is_active条件：包含null和true的记录
                    or_(EmployeeSalaryConfig.is_active.is_(None), EmployeeSalaryConfig.is_active == True),
                    EmployeeSalaryConfig.effective_date <= source_period.end_date,
                    or_(
                        EmployeeSalaryConfig.end_date.is_(None),
                        EmployeeSalaryConfig.end_date >= source_period.start_date
                    ),
                    # 🎯 确保有实际的缴费基数数据
                    or_(
                        EmployeeSalaryConfig.social_insurance_base.isnot(None),
                        EmployeeSalaryConfig.housing_fund_base.isnot(None)
                    )
                )
            ).all()
            
            logger.info(f"📋 [复制缴费基数] 找到源配置 {len(source_configs)} 条")
            
            if not source_configs:
                logger.warning(f"⚠️ [复制缴费基数] 源期间没有可复制的薪资配置")
                return {
                    "success": True,
                    "copied_count": 0,
                    "skipped_count": 0,
                    "updated_count": 0,
                    "message": "源期间没有可复制的缴费基数配置"
                }
            
            # 获取活跃员工列表
            active_employees = self.db.query(Employee.id).filter(
                Employee.is_active == True
            ).all()
            active_employee_ids = {emp.id for emp in active_employees}
            
            logger.info(f"👥 [复制缴费基数] 活跃员工数: {len(active_employee_ids)}")
            
            # 统计变量
            copied_count = 0
            skipped_count = 0
            updated_count = 0
            
            # 目标期间的开始和结束日期
            target_start_date = target_period.start_date
            target_end_date = target_period.end_date
            
            logger.info(f"📅 [复制缴费基数] 目标期间时间范围: {target_start_date} ~ {target_end_date}")
            
            for source_config in source_configs:
                try:
                    # 验证员工是否仍然活跃
                    if source_config.employee_id not in active_employee_ids:
                        logger.debug(f"跳过非活跃员工 {source_config.employee_id}")
                        skipped_count += 1
                        continue
                    
                    # 检查目标期间是否已有该员工的配置
                    existing_config = self.db.query(EmployeeSalaryConfig).filter(
                        and_(
                            EmployeeSalaryConfig.employee_id == source_config.employee_id,
                            # 🎯 同样处理is_active为null的情况
                            or_(EmployeeSalaryConfig.is_active.is_(None), EmployeeSalaryConfig.is_active == True),
                            EmployeeSalaryConfig.effective_date <= target_end_date,
                            or_(
                                EmployeeSalaryConfig.end_date.is_(None),
                                EmployeeSalaryConfig.end_date >= target_start_date
                            )
                        )
                    ).first()
                    
                    if existing_config:
                        # 🎯 只更新社保和公积金基数
                        existing_config.social_insurance_base = source_config.social_insurance_base
                        existing_config.housing_fund_base = source_config.housing_fund_base
                        # 🔧 添加职业年金缴费基数复制
                        if hasattr(source_config, 'occupational_pension_base'):
                            existing_config.occupational_pension_base = source_config.occupational_pension_base
                        existing_config.updated_at = datetime.now()
                        existing_config.updated_by = user_id
                        
                        updated_count += 1
                        logger.debug(f"更新员工 {source_config.employee_id} 的缴费基数: 社保基数={source_config.social_insurance_base}, 公积金基数={source_config.housing_fund_base}, 职业年金基数={getattr(source_config, 'occupational_pension_base', None)}")
                    else:
                        # 🎯 只创建包含基数的最小配置
                        # 获取当前员工的基础薪资信息（从最近的配置中获取）
                        latest_config = self.db.query(EmployeeSalaryConfig).filter(
                            and_(
                                EmployeeSalaryConfig.employee_id == source_config.employee_id,
                                # 🎯 查找最新的薪资配置，包括is_active为null的情况
                                or_(EmployeeSalaryConfig.is_active.is_(None), EmployeeSalaryConfig.is_active == True)
                            )
                        ).order_by(desc(EmployeeSalaryConfig.effective_date)).first()
                        
                        # 设置基本工资，如果没有历史记录则使用默认值
                        basic_salary = latest_config.basic_salary if latest_config else Decimal('5000.00')
                        
                        # 获取职业年金基数（如果存在）
                        occupational_pension_base = getattr(source_config, 'occupational_pension_base', None)
                        
                        new_config = EmployeeSalaryConfig(
                            employee_id=source_config.employee_id,
                            basic_salary=basic_salary,  # 保留基本工资，其他薪资相关字段使用默认值
                            salary_grade_id=latest_config.salary_grade_id if latest_config else None,
                            # 🎯 核心：复制社保、公积金和职业年金基数
                            social_insurance_base=source_config.social_insurance_base,
                            housing_fund_base=source_config.housing_fund_base,
                            occupational_pension_base=occupational_pension_base,  # 🔧 添加职业年金基数
                            # 专项扣除使用默认值（不复制）
                            child_education_deduction=Decimal('0'),
                            continuing_education_deduction=Decimal('0'),
                            medical_deduction=Decimal('0'),
                            housing_loan_deduction=Decimal('0'),
                            housing_rent_deduction=Decimal('0'),
                            elderly_care_deduction=Decimal('0'),
                            overtime_rate_multiplier=Decimal('1.5'),
                            is_active=True,
                            effective_date=target_start_date,
                            end_date=target_end_date,
                            created_at=datetime.now(),
                            created_by=user_id
                        )
                        self.db.add(new_config)
                        copied_count += 1
                        logger.debug(f"为员工 {source_config.employee_id} 创建新缴费基数配置: 社保基数={source_config.social_insurance_base}, 公积金基数={source_config.housing_fund_base}, 职业年金基数={occupational_pension_base}")
                    
                    # 每50条提交一次，提高性能
                    if (copied_count + updated_count) % 50 == 0:
                        self.db.commit()
                        logger.info(f"📊 [复制缴费基数] 进度更新: 已处理 {copied_count + updated_count + skipped_count}/{len(source_configs)} 条")
                        
                except Exception as e:
                    logger.error(f"❌ [复制缴费基数] 处理员工 {source_config.employee_id} 配置失败: {e}")
                    skipped_count += 1
                    continue
            
            # 最终提交
            self.db.commit()
            
            result = {
                "success": True,
                "copied_count": copied_count,
                "updated_count": updated_count,
                "skipped_count": skipped_count,
                "total_processed": len(source_configs),
                "message": f"缴费基数复制完成: 新建 {copied_count} 条, 更新 {updated_count} 条, 跳过 {skipped_count} 条"
            }
            
            logger.info(f"🎉 [复制缴费基数] 复制完成: {result['message']}")
            return result
            
        except Exception as e:
            logger.error(f"💥 [复制缴费基数] 复制失败: {e}", exc_info=True)
            self.db.rollback()
            raise

    def batch_update_salary_configs(
        self,
        updates: List[Dict[str, Any]],
        user_id: int
    ) -> Dict[str, Any]:
        """
        批量更新员工薪资配置
        
        Args:
            updates: 更新数据列表，每个元素包含employee_id和要更新的字段
            user_id: 操作用户ID
            
        Returns:
            更新结果统计
        """
        try:
            logger.info(f"🚀 [批量更新薪资配置] 开始更新 {len(updates)} 条记录")
            
            updated_count = 0
            failed_count = 0
            
            for update_data in updates:
                try:
                    employee_id = update_data.get('employee_id')
                    if not employee_id:
                        failed_count += 1
                        continue
                    
                    # 查找当前有效的配置
                    config = self.db.query(EmployeeSalaryConfig).filter(
                        and_(
                            EmployeeSalaryConfig.employee_id == employee_id,
                            EmployeeSalaryConfig.is_active == True,
                            EmployeeSalaryConfig.effective_date <= date.today(),
                            or_(
                                EmployeeSalaryConfig.end_date.is_(None),
                                EmployeeSalaryConfig.end_date >= date.today()
                            )
                        )
                    ).first()
                    
                    if config:
                        # 更新配置
                        for field, value in update_data.items():
                            if field != 'employee_id' and hasattr(config, field):
                                setattr(config, field, value)
                        
                        config.updated_at = datetime.now()
                        config.updated_by = user_id
                        updated_count += 1
                    else:
                        logger.warning(f"员工 {employee_id} 没有有效的薪资配置")
                        failed_count += 1
                        
                except Exception as e:
                    logger.error(f"更新员工 {employee_id} 薪资配置失败: {e}")
                    failed_count += 1
                    continue
            
            self.db.commit()
            
            result = {
                "success": True,
                "updated_count": updated_count,
                "failed_count": failed_count,
                "total_requested": len(updates),
                "message": f"批量更新完成: 成功 {updated_count} 条, 失败 {failed_count} 条"
            }
            
            logger.info(f"✅ [批量更新薪资配置] {result['message']}")
            return result
            
        except Exception as e:
            logger.error(f"💥 [批量更新薪资配置] 批量更新失败: {e}", exc_info=True)
            self.db.rollback()
            raise

    def batch_validate_salary_bases(
        self,
        period_id: int,
        base_updates: List[Dict[str, Any]],
        overwrite_mode: bool = False
    ) -> Dict[str, Any]:
        """
        批量验证缴费基数导入数据
        
        Args:
            period_id: 薪资周期ID
            base_updates: 缴费基数更新数据列表
            overwrite_mode: 是否覆盖现有配置
            
        Returns:
            验证结果统计和详细信息
        """
        try:
            logger.info(f"🔍 [批量验证缴费基数] 开始验证 {len(base_updates)} 条记录, 周期ID: {period_id}")
            
            # 预加载数据以提高性能
            employees_map = self._preload_employees_for_validation()
            existing_configs_map = self._preload_existing_configs_for_period(period_id)
            period = self._validate_period_exists(period_id)
            
            validated_data = []
            total = len(base_updates)
            valid = 0
            invalid = 0
            warnings = 0
            global_errors = []
            
            for i, base_data in enumerate(base_updates):
                validation_result = self._validate_single_salary_base(
                    base_data, i, employees_map, existing_configs_map, 
                    period, overwrite_mode
                )
                
                validated_data.append(validation_result)
                
                if validation_result["is_valid"]:
                    valid += 1
                else:
                    invalid += 1
                    # 记录详细的验证失败信息
                    logger.warning(f"❌ [验证失败] 记录 {i}: {validation_result['errors']}, 数据: {base_data}")
                    
                if validation_result["warnings"]:
                    warnings += 1
            
            result = {
                "total": total,
                "valid": valid,
                "invalid": invalid,
                "warnings": warnings,
                "errors": global_errors,
                "validated_data": validated_data
            }
            
            logger.info(f"✅ [批量验证缴费基数] 验证完成: 总计 {total} 条, 有效 {valid} 条, 无效 {invalid} 条, 警告 {warnings} 条")
            return result
            
        except Exception as e:
            logger.error(f"💥 [批量验证缴费基数] 验证失败: {e}", exc_info=True)
            raise

    def batch_update_salary_bases(
        self,
        period_id: int,
        base_updates: List[Dict[str, Any]],
        user_id: int,
        overwrite_mode: bool = False
    ) -> Dict[str, Any]:
        """
        批量更新缴费基数
        
        Args:
            period_id: 薪资周期ID
            base_updates: 缴费基数更新数据列表
            user_id: 操作用户ID
            overwrite_mode: 是否覆盖现有配置
            
        Returns:
            更新结果统计
        """
        try:
            logger.info(f"🚀 [批量更新缴费基数] 开始更新 {len(base_updates)} 条记录, 周期ID: {period_id}")
            
            # 预加载数据
            employees_map = self._preload_employees_for_validation()
            period = self._validate_period_exists(period_id)
            
            created_count = 0
            updated_count = 0
            failed_count = 0
            errors = []
            
            for base_data in base_updates:
                try:
                    # 解析员工信息
                    employee_id = base_data.get("employee_id")
                    employee_info = base_data.get("employee_info", {})
                    
                    logger.info(f"🔍 [导入记录 {i+1}] 处理数据: employee_id={employee_id}, employee_info={employee_info}")
                    
                    if not employee_id and employee_info:
                        # 通过员工信息匹配员工ID
                        last_name = employee_info.get("last_name", "").strip()
                        first_name = employee_info.get("first_name", "").strip()
                        id_number = employee_info.get("id_number", "").strip()
                        
                        logger.info(f"🔍 [导入记录 {i+1}] 员工信息: 姓={last_name}, 名={first_name}, 身份证={id_number}")
                        
                        if last_name and first_name and id_number:
                            # 优先使用姓名+身份证号匹配
                            key = f"{last_name}_{first_name}_{id_number}"
                            employee_data = employees_map.get(key)
                            if employee_data:
                                employee_id = employee_data["id"]
                                logger.info(f"✅ [导入记录 {i+1}] 通过姓名+身份证号匹配到员工: {employee_id}")
                        elif id_number:
                            # 只有身份证号的情况
                            employee_data = employees_map.get(f"id_number_{id_number}")
                            if employee_data:
                                employee_id = employee_data["id"]
                                logger.info(f"✅ [导入记录 {i+1}] 通过身份证号匹配到员工: {employee_id}")
                        elif last_name and first_name:
                            # 🆕 只有姓名的情况（没有身份证号）
                            name_key = f"name_{last_name}_{first_name}"
                            name_match = employees_map.get(name_key)
                            
                            if name_match:
                                if isinstance(name_match, list):
                                    # 姓名重复，无法确定具体员工
                                    failed_count += 1
                                    error_msg = f"发现多个同名员工（{len(name_match)}人），请提供身份证号以精确匹配"
                                    errors.append(f"记录 {i+1}: {error_msg}")
                                    logger.warning(f"❌ [导入记录 {i+1}] {error_msg}")
                                    continue
                                else:
                                    # 唯一姓名匹配
                                    employee_data = name_match
                                    employee_id = employee_data["id"]
                                    logger.info(f"⚠️ [导入记录 {i+1}] 仅通过姓名匹配到员工: {employee_id}，建议提供身份证号")
                    
                    if not employee_id:
                        failed_count += 1
                        error_msg = f"无法匹配员工: {employee_info}"
                        errors.append(f"记录 {i+1}: {error_msg}")
                        logger.warning(f"❌ [导入记录 {i+1}] {error_msg}")
                        continue
                    
                    # 查找现有配置
                    existing_config = self.db.query(EmployeeSalaryConfig).filter(
                        and_(
                            EmployeeSalaryConfig.employee_id == employee_id,
                            EmployeeSalaryConfig.is_active == True,
                            EmployeeSalaryConfig.effective_date <= period.end_date,
                            or_(
                                EmployeeSalaryConfig.end_date.is_(None),
                                EmployeeSalaryConfig.end_date >= period.start_date
                            )
                        )
                    ).first()
                    
                    if existing_config:
                        if overwrite_mode:
                            # 更新现有配置
                            if base_data.get("social_insurance_base") is not None:
                                existing_config.social_insurance_base = base_data["social_insurance_base"]
                            if base_data.get("housing_fund_base") is not None:
                                existing_config.housing_fund_base = base_data["housing_fund_base"]
                            if base_data.get("occupational_pension_base") is not None:
                                existing_config.occupational_pension_base = base_data["occupational_pension_base"]
                            
                            existing_config.updated_at = datetime.now()
                            existing_config.updated_by = user_id
                            updated_count += 1
                        else:
                            failed_count += 1
                            errors.append(f"员工 {employee_id} 已有配置且未启用覆盖模式")
                            continue
                    else:
                        # 创建新配置
                        basic_salary = base_data.get("basic_salary", 0.0)  # 从数据中获取基本工资，默认为0
                        new_config = EmployeeSalaryConfig(
                            employee_id=employee_id,
                            basic_salary=basic_salary,
                            social_insurance_base=base_data.get("social_insurance_base"),
                            housing_fund_base=base_data.get("housing_fund_base"),
                            occupational_pension_base=base_data.get("occupational_pension_base"),
                            effective_date=period.start_date,
                            end_date=period.end_date,
                            is_active=True,
                            created_at=datetime.now(),
                            created_by=user_id,
                            updated_at=datetime.now(),
                            updated_by=user_id
                        )
                        self.db.add(new_config)
                        created_count += 1
                        
                except Exception as e:
                    logger.error(f"处理员工 {employee_id} 缴费基数失败: {e}")
                    failed_count += 1
                    errors.append(f"员工 {employee_id}: {str(e)}")
                    continue
            
            self.db.commit()
            
            result = {
                "success": True,
                "created_count": created_count,
                "updated_count": updated_count,
                "failed_count": failed_count,
                "total_requested": len(base_updates),
                "errors": errors,
                "message": f"批量更新完成: 新建 {created_count} 条, 更新 {updated_count} 条, 失败 {failed_count} 条"
            }
            
            logger.info(f"✅ [批量更新缴费基数] {result['message']}")
            return result
            
        except Exception as e:
            logger.error(f"💥 [批量更新缴费基数] 批量更新失败: {e}", exc_info=True)
            self.db.rollback()
            raise

    def _preload_employees_for_validation(self) -> Dict[str, Dict[str, Any]]:
        """预加载员工数据用于验证"""
        try:
            from webapp.v2.models.hr import Employee
            
            employees = self.db.query(Employee).filter(
                Employee.is_active == True
            ).all()
            
            employees_map = {}
            
            for emp in employees:
                # 按ID索引
                employees_map[f"id_{emp.id}"] = {
                    "id": emp.id,
                    "employee_code": emp.employee_code,
                    "last_name": emp.last_name,
                    "first_name": emp.first_name,
                    "id_number": emp.id_number,
                    "is_active": emp.is_active
                }
                
                # 按姓名+身份证号索引
                if emp.last_name and emp.first_name and emp.id_number:
                    key = f"{emp.last_name}_{emp.first_name}_{emp.id_number}"
                    employees_map[key] = employees_map[f"id_{emp.id}"]
                
                # 按身份证号索引
                if emp.id_number:
                    employees_map[f"id_number_{emp.id_number}"] = employees_map[f"id_{emp.id}"]
                
                # 🆕 按姓名索引（用于没有身份证号的情况）
                if emp.last_name and emp.first_name:
                    name_key = f"name_{emp.last_name}_{emp.first_name}"
                    if name_key in employees_map:
                        # 如果姓名重复，转换为列表
                        if not isinstance(employees_map[name_key], list):
                            employees_map[name_key] = [employees_map[name_key]]
                        employees_map[name_key].append(employees_map[f"id_{emp.id}"])
                    else:
                        employees_map[name_key] = employees_map[f"id_{emp.id}"]
            
            logger.info(f"📊 [预加载员工数据] 加载了 {len(employees)} 个活跃员工")
            return employees_map
            
        except Exception as e:
            logger.error(f"❌ [预加载员工数据] 失败: {e}")
            return {}

    def _preload_existing_configs_for_period(self, period_id: int) -> Dict[int, Dict[str, Any]]:
        """预加载指定周期的现有薪资配置"""
        try:
            from webapp.v2.models.payroll import PayrollPeriod
            from sqlalchemy import and_, or_
            
            # 获取周期信息
            period = self.db.query(PayrollPeriod).filter(PayrollPeriod.id == period_id).first()
            if not period:
                return {}
            
            # 查询该周期内的现有配置
            existing_configs = self.db.query(EmployeeSalaryConfig).filter(
                and_(
                    or_(EmployeeSalaryConfig.is_active.is_(None), EmployeeSalaryConfig.is_active == True),
                    EmployeeSalaryConfig.effective_date <= period.end_date,
                    or_(
                        EmployeeSalaryConfig.end_date.is_(None),
                        EmployeeSalaryConfig.end_date >= period.start_date
                    )
                )
            ).all()
            
            configs_map = {}
            for config in existing_configs:
                configs_map[config.employee_id] = {
                    "id": config.id,
                    "employee_id": config.employee_id,
                    "social_insurance_base": config.social_insurance_base,
                    "housing_fund_base": config.housing_fund_base,
                    "occupational_pension_base": getattr(config, 'occupational_pension_base', None),
                    "effective_date": config.effective_date,
                    "end_date": config.end_date
                }
            
            logger.info(f"📊 [预加载配置数据] 加载了 {len(existing_configs)} 个现有配置")
            return configs_map
            
        except Exception as e:
            logger.error(f"❌ [预加载配置数据] 失败: {e}")
            return {}

    def _validate_period_exists(self, period_id: int):
        """验证薪资周期是否存在"""
        from webapp.v2.models.payroll import PayrollPeriod
        
        period = self.db.query(PayrollPeriod).filter(PayrollPeriod.id == period_id).first()
        if not period:
            raise ValueError(f"薪资周期 {period_id} 不存在")
        return period

    def _validate_single_salary_base(
        self,
        base_data: Dict[str, Any],
        index: int,
        employees_map: Dict[str, Dict[str, Any]],
        existing_configs_map: Dict[int, Dict[str, Any]],
        period,
        overwrite_mode: bool
    ) -> Dict[str, Any]:
        """验证单条缴费基数记录"""
        errors = []
        warnings = []
        employee_data = None
        
        # 1. 员工身份验证
        employee_id = base_data.get("employee_id")
        employee_info = base_data.get("employee_info", {})
        
        if employee_id:
            # 通过员工ID匹配
            employee_data = employees_map.get(f"id_{employee_id}")
            if not employee_data:
                errors.append(f"员工ID {employee_id} 不存在或不活跃")
        elif employee_info:
            # 通过员工信息匹配
            last_name = employee_info.get("last_name", "").strip()
            first_name = employee_info.get("first_name", "").strip()
            id_number = employee_info.get("id_number", "").strip()
            
            if last_name and first_name and id_number:
                # 优先使用姓名+身份证号匹配
                key = f"{last_name}_{first_name}_{id_number}"
                employee_data = employees_map.get(key)
                
                if not employee_data and id_number:
                    # 降级到只用身份证号匹配
                    employee_data = employees_map.get(f"id_number_{id_number}")
                    if employee_data:
                        warnings.append("通过身份证号匹配到员工，但姓名可能不一致")
            elif id_number:
                # 只有身份证号的情况
                employee_data = employees_map.get(f"id_number_{id_number}")
            elif last_name and first_name:
                # 🆕 只有姓名的情况（没有身份证号）
                name_key = f"name_{last_name}_{first_name}"
                name_match = employees_map.get(name_key)
                
                if name_match:
                    if isinstance(name_match, list):
                        # 姓名重复，需要用户提供身份证号来区分
                        errors.append(f"发现多个同名员工（{len(name_match)}人），请提供身份证号以精确匹配")
                    else:
                        # 唯一姓名匹配
                        employee_data = name_match
                        warnings.append("仅通过姓名匹配到员工，建议提供身份证号以确保准确性")
            
            if not employee_data and not errors:
                errors.append("无法匹配到员工，请检查姓名和身份证号")
        else:
            errors.append("必须提供员工ID或员工信息（姓名+身份证号）")
        
        # 2. 数据格式验证
        social_insurance_base = base_data.get("social_insurance_base")
        housing_fund_base = base_data.get("housing_fund_base")
        occupational_pension_base = base_data.get("occupational_pension_base")
        
        if social_insurance_base is not None:
            try:
                social_insurance_base = float(social_insurance_base)
                if social_insurance_base < 0:
                    errors.append("社保缴费基数不能为负数")
                elif social_insurance_base > 100000:  # 合理性检查
                    warnings.append("社保缴费基数较高，请确认是否正确")
            except (ValueError, TypeError):
                errors.append("社保缴费基数必须是有效数字")
        
        if housing_fund_base is not None:
            try:
                housing_fund_base = float(housing_fund_base)
                if housing_fund_base < 0:
                    errors.append("公积金缴费基数不能为负数")
                elif housing_fund_base > 100000:  # 合理性检查
                    warnings.append("公积金缴费基数较高，请确认是否正确")
            except (ValueError, TypeError):
                errors.append("公积金缴费基数必须是有效数字")
        
        if occupational_pension_base is not None:
            try:
                occupational_pension_base = float(occupational_pension_base)
                if occupational_pension_base < 0:
                    errors.append("职业年金缴费基数不能为负数")
                elif occupational_pension_base > 100000:  # 合理性检查
                    warnings.append("职业年金缴费基数较高，请确认是否正确")
            except (ValueError, TypeError):
                errors.append("职业年金缴费基数必须是有效数字")
        
        # 检查是否至少提供了一个基数
        if social_insurance_base is None and housing_fund_base is None and occupational_pension_base is None:
            errors.append("必须至少提供社保缴费基数、公积金缴费基数或职业年金缴费基数")
        
        # 3. 业务逻辑验证
        if employee_data:
            employee_id = employee_data["id"]
            existing_config = existing_configs_map.get(employee_id)
            
            if existing_config:
                if not overwrite_mode:
                    errors.append("该员工已有缴费基数配置，且未启用覆盖模式")
                else:
                    warnings.append("将覆盖现有缴费基数配置")
        
        # 构建验证结果
        result = {
            "employee_id": employee_data["id"] if employee_data else None,
            "employee_name": f"{employee_data['last_name']}{employee_data['first_name']}" if employee_data else None,
            "social_insurance_base": social_insurance_base,
            "housing_fund_base": housing_fund_base,
            "occupational_pension_base": occupational_pension_base,
            "is_valid": len(errors) == 0,
            "errors": errors,
            "warnings": warnings,
            "clientId": base_data.get("clientId"),
            "originalIndex": index
        }
        
        return result

    def batch_update_insurance_bases_only(
        self,
        period_id: int,
        base_updates: List[Dict[str, Any]],
        user_id: int,
        create_if_missing: bool = False
    ) -> Dict[str, Any]:
        """
        专门用于批量更新缴费基数的方法
        
        这个方法只更新现有薪资配置记录的缴费基数字段，不会创建新的完整薪资配置。
        如果员工没有现有配置且create_if_missing=True，则只创建包含缴费基数的最小配置。
        
        Args:
            period_id: 薪资周期ID
            base_updates: 缴费基数更新数据列表
            user_id: 操作用户ID
            create_if_missing: 如果员工没有现有配置，是否创建最小配置
            
        Returns:
            更新结果统计
        """
        try:
            logger.info(f"🎯 [专门更新缴费基数] 开始更新 {len(base_updates)} 条记录, 周期ID: {period_id}")
            
            # 预加载数据
            employees_map = self._preload_employees_for_validation()
            period = self._validate_period_exists(period_id)
            
            updated_count = 0
            created_count = 0
            skipped_count = 0
            failed_count = 0
            errors = []
            
            for i, base_data in enumerate(base_updates):
                try:
                    # 解析员工信息
                    employee_id = base_data.get("employee_id")
                    employee_info = base_data.get("employee_info", {})
                    
                    logger.info(f"🔍 [导入记录 {i+1}] 处理数据: employee_id={employee_id}, employee_info={employee_info}")
                    
                    if not employee_id and employee_info:
                        # 通过员工信息匹配员工ID
                        last_name = employee_info.get("last_name", "").strip()
                        first_name = employee_info.get("first_name", "").strip()
                        id_number = employee_info.get("id_number", "").strip()
                        
                        logger.info(f"🔍 [导入记录 {i+1}] 员工信息: 姓={last_name}, 名={first_name}, 身份证={id_number}")
                        
                        if last_name and first_name and id_number:
                            # 优先使用姓名+身份证号匹配
                            key = f"{last_name}_{first_name}_{id_number}"
                            employee_data = employees_map.get(key)
                            if employee_data:
                                employee_id = employee_data["id"]
                                logger.info(f"✅ [导入记录 {i+1}] 通过姓名+身份证号匹配到员工: {employee_id}")
                        elif id_number:
                            # 只有身份证号的情况
                            employee_data = employees_map.get(f"id_number_{id_number}")
                            if employee_data:
                                employee_id = employee_data["id"]
                                logger.info(f"✅ [导入记录 {i+1}] 通过身份证号匹配到员工: {employee_id}")
                        elif last_name and first_name:
                            # 🆕 只有姓名的情况（没有身份证号）
                            name_key = f"name_{last_name}_{first_name}"
                            name_match = employees_map.get(name_key)
                            
                            if name_match:
                                if isinstance(name_match, list):
                                    # 姓名重复，无法确定具体员工
                                    failed_count += 1
                                    error_msg = f"发现多个同名员工（{len(name_match)}人），请提供身份证号以精确匹配"
                                    errors.append(f"记录 {i+1}: {error_msg}")
                                    logger.warning(f"❌ [导入记录 {i+1}] {error_msg}")
                                    continue
                                else:
                                    # 唯一姓名匹配
                                    employee_data = name_match
                                    employee_id = employee_data["id"]
                                    logger.info(f"⚠️ [导入记录 {i+1}] 仅通过姓名匹配到员工: {employee_id}，建议提供身份证号")
                    
                    if not employee_id:
                        failed_count += 1
                        error_msg = f"无法匹配员工: {employee_info}"
                        errors.append(f"记录 {i+1}: {error_msg}")
                        logger.warning(f"❌ [导入记录 {i+1}] {error_msg}")
                        continue
                    
                    # 查找现有配置
                    existing_config = self.db.query(EmployeeSalaryConfig).filter(
                        and_(
                            EmployeeSalaryConfig.employee_id == employee_id,
                            EmployeeSalaryConfig.is_active == True,
                            EmployeeSalaryConfig.effective_date <= period.end_date,
                            or_(
                                EmployeeSalaryConfig.end_date.is_(None),
                                EmployeeSalaryConfig.end_date >= period.start_date
                            )
                        )
                    ).first()
                    
                    if existing_config:
                        # 更新现有配置的缴费基数字段
                        updated = False
                        if base_data.get("social_insurance_base") is not None:
                            existing_config.social_insurance_base = base_data["social_insurance_base"]
                            updated = True
                        if base_data.get("housing_fund_base") is not None:
                            existing_config.housing_fund_base = base_data["housing_fund_base"]
                            updated = True
                        if base_data.get("occupational_pension_base") is not None:
                            existing_config.occupational_pension_base = base_data["occupational_pension_base"]
                            updated = True
                        
                        if updated:
                            existing_config.updated_at = datetime.now()
                            existing_config.updated_by = user_id
                            updated_count += 1
                        else:
                            skipped_count += 1
                            
                    elif create_if_missing:
                        # 创建最小配置（只包含缴费基数，basic_salary设为0）
                        new_config = EmployeeSalaryConfig(
                            employee_id=employee_id,
                            basic_salary=0.0,  # 设置为0，表示这是一个仅用于缴费基数的配置
                            social_insurance_base=base_data.get("social_insurance_base"),
                            housing_fund_base=base_data.get("housing_fund_base"),
                            occupational_pension_base=base_data.get("occupational_pension_base"),
                            effective_date=period.start_date,
                            end_date=period.end_date,
                            is_active=True,
                            created_at=datetime.now(),
                            created_by=user_id,
                            updated_at=datetime.now(),
                            updated_by=user_id
                        )
                        self.db.add(new_config)
                        created_count += 1
                    else:
                        # 跳过没有现有配置的员工
                        skipped_count += 1
                        errors.append(f"员工 {employee_id} 没有现有薪资配置，已跳过")
                        
                except Exception as e:
                    logger.error(f"处理员工 {employee_id} 缴费基数失败: {e}")
                    failed_count += 1
                    errors.append(f"员工 {employee_id}: {str(e)}")
                    continue
            
            self.db.commit()
            
            result = {
                "success": True,
                "updated_count": updated_count,
                "created_count": created_count,
                "skipped_count": skipped_count,
                "failed_count": failed_count,
                "total_requested": len(base_updates),
                "errors": errors,
                "message": f"缴费基数更新完成: 更新 {updated_count} 条, 新建 {created_count} 条, 跳过 {skipped_count} 条, 失败 {failed_count} 条"
            }
            
            logger.info(f"✅ [专门更新缴费基数] {result['message']}")
            return result
            
        except Exception as e:
            logger.error(f"💥 [专门更新缴费基数] 批量更新失败: {e}", exc_info=True)
            self.db.rollback()
            raise 