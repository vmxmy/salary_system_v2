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
                        existing_config.updated_at = datetime.now()
                        existing_config.updated_by = user_id
                        
                        updated_count += 1
                        logger.debug(f"更新员工 {source_config.employee_id} 的缴费基数: 社保基数={source_config.social_insurance_base}, 公积金基数={source_config.housing_fund_base}")
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
                        
                        new_config = EmployeeSalaryConfig(
                            employee_id=source_config.employee_id,
                            basic_salary=basic_salary,  # 保留基本工资，其他薪资相关字段使用默认值
                            salary_grade_id=latest_config.salary_grade_id if latest_config else None,
                            # 🎯 核心：只复制社保和公积金基数
                            social_insurance_base=source_config.social_insurance_base,
                            housing_fund_base=source_config.housing_fund_base,
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
                        logger.debug(f"为员工 {source_config.employee_id} 创建新缴费基数配置: 社保基数={source_config.social_insurance_base}, 公积金基数={source_config.housing_fund_base}")
                    
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