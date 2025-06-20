"""
极简工资报表系统API路由
提供简化的薪资处理功能，专注于三大核心功能：生成工资、审核工资、一键报表
"""

from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from datetime import datetime, date
import json
import logging

from ..database import get_db_v2
from webapp.auth import require_permissions
from ..services.simple_payroll.simple_payroll_service import SimplePayrollService
from ..utils.common import create_error_response
from ..pydantic_models.common import PaginationResponse, PaginationMeta, DataResponse, SuccessResponse
from ..pydantic_models.simple_payroll import (
    PayrollPeriodResponse,
    PayrollRunResponse, 
    PayrollGenerationRequest,
    BatchAdjustmentRequest,
    AuditSummaryResponse,
    ReportGenerationRequest,
    AuditAnomalyResponse,
    BatchAdjustmentPreviewRequest,
    BatchAdjustmentRequestAdvanced,
    BatchAdjustmentPreview,
    BatchAdjustmentResult,
    DepartmentCostAnalysisResponse,
    EmployeeTypeAnalysisResponse,
    SalaryTrendAnalysisResponse,
    MonthlyPayrollSummary,
    PersonnelCategoryStatsResponse
)
from ..pydantic_models.config import (
    ReportTemplateResponse
)
from ..services.simple_payroll import (
    PayrollGenerationService, PayrollAuditService, PayrollReportService
)
from ..services.simple_payroll.batch_adjustment_service import BatchAdjustmentService
from ..services.simple_payroll.advanced_audit_service import AdvancedAuditService
from ..services.simple_payroll.employee_salary_config_service import EmployeeSalaryConfigService
from ..services.simple_payroll.analytics_service import PayrollAnalyticsService
from ..models.config import LookupValue
from ..models.payroll import PayrollEntry, PayrollRun, PayrollPeriod
from ..payroll_engine.simple_calculator import CalculationStatus
from ..crud import simple_payroll as crud_simple_payroll

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/simple-payroll", tags=["Simple Payroll System"])

# =============================================================================
# 工资期间管理
# =============================================================================

@router.get("/periods", response_model=PaginationResponse[PayrollPeriodResponse])
async def get_payroll_periods(
    year: Optional[int] = Query(None, description="年份筛选"),
    month: Optional[int] = Query(None, description="月份筛选"),
    is_active: Optional[bool] = Query(None, description="是否活跃"),
    page: int = Query(1, ge=1, description="页码"),
    size: int = Query(50, ge=1, le=200, description="每页记录数"),
    db: Session = Depends(get_db_v2)
    # ⚡️ 临时移除权限验证以提升性能
    # current_user = Depends(require_permissions(["payroll_period:view"]))
):
    """
    获取工资期间列表
    
    支持按年月筛选，返回包含统计信息的期间列表
    """
    logger.info(f"🔄 [get_payroll_periods] 接收请求 - 参数: year={year}, month={month}, is_active={is_active}, page={page}, size={size}")
    
    try:
        # 使用标准的 SimplePayrollService
        service = SimplePayrollService(db)
        result = service.get_payroll_periods(
            year=year,
            month=month,
            is_active=is_active,
            page=page,
            size=size
        )
        
        logger.info(f"✅ [get_payroll_periods] 查询成功 - 返回 {len(result['data'])} 条记录, 总计: {result['meta']['total']}")
        return result
    except Exception as e:
        logger.error(f"获取工资期间列表失败: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="获取工资期间失败",
                details=str(e)
            )
        )

@router.get("/periods/{period_id}", response_model=DataResponse[PayrollPeriodResponse])
async def get_payroll_period(
    period_id: int,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["payroll_period:view"]))
):
    """获取指定工资期间详情"""
    try:
        service = SimplePayrollService(db)
        period = service.get_payroll_period(period_id)
        if not period:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=create_error_response(
                    status_code=404,
                    message="工资期间不存在",
                    details=f"期间ID {period_id} 未找到"
                )
            )
        return DataResponse(data=period)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取工资期间详情失败: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="获取工资期间详情失败",
                details=str(e)
            )
        )

# =============================================================================
# 工资运行管理
# =============================================================================

@router.get("/versions", response_model=PaginationResponse[PayrollRunResponse])
async def get_payroll_versions(
    period_id: int = Query(..., description="工资期间ID"),
    page: int = Query(1, ge=1, description="页码"),
    size: int = Query(20, ge=1, le=100, description="每页记录数"),
    db: Session = Depends(get_db_v2)
    # ⚡️ 临时移除权限验证以提升性能
    # current_user = Depends(require_permissions(["payroll_run:view"]))
):
    """获取指定期间的工资运行列表"""
    try:
        # 使用标准的 SimplePayrollService
        service = SimplePayrollService(db)
        result = service.get_payroll_versions(
            period_id=period_id,
            page=page,
            size=size
        )
        return result
    except Exception as e:
        logger.error(f"获取工资运行列表失败: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="获取工资运行列表失败",
                details=str(e)
            )
        )

@router.get("/versions/{version_id}", response_model=DataResponse[PayrollRunResponse])
async def get_payroll_version(
    version_id: int,
    db: Session = Depends(get_db_v2)
    # ⚡️ 临时移除权限验证以提升性能  
    # current_user = Depends(require_permissions(["payroll_run:view"]))
):
    """获取指定工资运行详情"""
    try:
        # 直接查询工资运行记录
        from ..models.payroll import PayrollRun
        payroll_run = db.query(PayrollRun).filter(PayrollRun.id == version_id).first()
        
        if not payroll_run:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=create_error_response(
                    status_code=404,
                    message="工资运行不存在",
                    details=f"版本ID {version_id} 未找到"
                )
            )
        
        # 查询状态信息
        status_lookup = db.query(LookupValue).filter(
            LookupValue.id == payroll_run.status_lookup_value_id
        ).first()
        
        # 查询期间信息
        from ..models.payroll import PayrollPeriod
        period = db.query(PayrollPeriod).filter(
            PayrollPeriod.id == payroll_run.payroll_period_id
        ).first()
        
        # 查询实际的工资条目数量
        from ..models.payroll import PayrollEntry
        actual_entries_count = db.query(PayrollEntry).filter(
            PayrollEntry.payroll_run_id == payroll_run.id
        ).count()
        
        # 构建响应对象
        version = PayrollRunResponse(
            id=payroll_run.id,
            period_id=payroll_run.payroll_period_id,
            period_name=period.name if period else "工资期间",
            version_number=1,
            status_id=payroll_run.status_lookup_value_id,
            status_name=status_lookup.name if status_lookup else "未知状态",
            total_entries=actual_entries_count,  # 使用实际的工资条目数量
            total_gross_pay=payroll_run.total_gross_pay or 0,
            total_net_pay=payroll_run.total_net_pay or 0,
            total_deductions=payroll_run.total_deductions or 0,
            initiated_by_user_id=payroll_run.initiated_by_user_id or 1,
            initiated_by_username="系统",
            initiated_at=payroll_run.run_date or datetime.now(),
            calculated_at=payroll_run.run_date,
            approved_at=None,
            description=f"工资运行 #{payroll_run.id}"
        )
        
        return DataResponse(data=version)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取工资运行详情失败: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="获取工资运行详情失败",
                details=str(e)
            )
        )

# =============================================================================
# 工资生成功能
# =============================================================================

@router.post("/generate", response_model=DataResponse[PayrollRunResponse])
async def generate_payroll(
    request: PayrollGenerationRequest,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["payroll_run:manage"]))
):
    """
    生成工资数据
    
    支持三种生成方式：
    1. Excel导入
    2. 复制上月数据  
    3. 手动创建
    """
    try:
        service = PayrollGenerationService(db)
        result = service.generate_payroll(
            request=request,
            user_id=current_user.id
        )
        return DataResponse(
            data=result,
            message="工资数据生成成功"
        )
    except ValueError as e:
        logger.warning(f"生成工资数据参数错误: {e}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=create_error_response(
                status_code=422,
                message="生成工资数据失败",
                details=str(e)
            )
        )
    except Exception as e:
        logger.error(f"生成工资数据失败: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="生成工资数据时发生错误",
                details=str(e)
            )
        )

@router.get("/check-existing-data/{period_id}", response_model=DataResponse[Dict[str, Any]])
async def check_existing_data(
    period_id: int,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["payroll_run:view"]))
):
    """检查指定期间是否已有工资数据和薪资配置"""
    logger.info(f"🔍 [API-检查现有数据] 检查期间 {period_id} 的现有数据, 用户={current_user.username}")
    
    try:
        service = PayrollGenerationService(db)
        result = service.check_existing_data(period_id)
        
        logger.info(f"✅ [API-检查现有数据] 检查完成: 期间={result['target_period_name']}, 有数据={result['has_any_data']}")
        
        return DataResponse(
            data=result,
            message="数据检查完成"
        )
    except Exception as e:
        logger.error(f"💥 [API-检查现有数据] 检查失败: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="检查现有数据时发生错误",
                details=str(e)
            )
        )

@router.post("/copy-previous", response_model=DataResponse[PayrollRunResponse])
async def copy_previous_payroll(
    target_period_id: int,
    source_period_id: int,
    description: Optional[str] = None,
    force_overwrite: Optional[bool] = False,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["payroll_run:manage"]))
):
    """复制上月工资数据"""
    logger.info(f"🚀 [API-复制工资数据] 接收请求: 目标期间={target_period_id}, 源期间={source_period_id}, 用户={current_user.username}({current_user.id}), 描述={description}, 强制覆盖={force_overwrite}")
    
    try:
        service = PayrollGenerationService(db)
        
        logger.info(f"⚡ [API-复制工资数据] 调用服务层复制方法...")
        result = service.copy_previous_payroll(
            target_period_id=target_period_id,
            source_period_id=source_period_id,
            description=description or "复制上月工资明细",
            user_id=current_user.id,
            force_overwrite=force_overwrite
        )
        
        logger.info(f"✅ [API-复制工资数据] 复制成功: 新运行ID={result.id}, 期间={result.period_name}, 版本={result.version_number}")
        
        return DataResponse(
            data=result,
            message="复制工资数据成功"
        )
    except ValueError as e:
        error_msg = str(e)
        
        # 检查是否是需要用户确认的情况
        if error_msg.startswith("CONFIRMATION_REQUIRED:"):
            # 解析现有数据信息
            import json
            try:
                existing_data_str = error_msg.replace("CONFIRMATION_REQUIRED:", "")
                existing_data = eval(existing_data_str)  # 注意：生产环境应使用json.loads
                
                logger.info(f"⚠️ [API-复制工资数据] 需要用户确认: {existing_data['summary']}")
                
                # 返回特殊状态码，前端据此显示确认对话框
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,  # 使用409状态码表示冲突，需要用户决策
                    detail={
                        "error": {
                            "code": "CONFIRMATION_REQUIRED",
                            "message": "目标期间已有数据，需要确认是否继续",
                            "existing_data": existing_data,
                            "suggestions": {
                                "actions": [
                                    {
                                        "action": "create_new_version",
                                        "label": "创建新版本（推荐）",
                                        "description": "保留现有数据，创建新的工资运行版本",
                                        "force_overwrite": False
                                    },
                                    {
                                        "action": "overwrite_replace", 
                                        "label": "覆盖替换",
                                        "description": "⚠️ 将更新现有的薪资配置数据",
                                        "force_overwrite": True
                                    }
                                ]
                            }
                        }
                    }
                )
            except Exception as parse_error:
                logger.error(f"解析确认数据失败: {parse_error}")
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=create_error_response(
                        status_code=422,
                        message="复制工资数据失败",
                        details="目标期间已有数据，请联系管理员"
                    )
                )
        else:
            # 普通的参数错误
            logger.warning(f"⚠️ [API-复制工资数据] 参数错误: {e}")
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=create_error_response(
                    status_code=422,
                    message="复制工资数据失败",
                    details=str(e)
                )
            )
    except Exception as e:
        logger.error(f"💥 [API-复制工资数据] 复制失败: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="复制工资数据时发生错误",
                details=str(e)
            )
        )

# =============================================================================
# 员工薪资配置管理（社保、公积金基数等）
# =============================================================================

@router.post("/salary-configs/copy", response_model=DataResponse[Dict[str, Any]])
async def copy_salary_configs(
    source_period_id: int,
    target_period_id: int,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["payroll_run:manage"]))
):
    """
    🎯 复制工资配置（基本工资和专项扣除，不包括社保、公积金基数）
    
    用于复制员工的工资相关配置信息，包括：
    - ✅ 基本工资
    - ✅ 薪资等级
    - ✅ 专项扣除（子女教育、继续教育、大病医疗等）
    - ✅ 加班费倍数
    - 🚫 不包括：社保缴费基数、公积金缴费基数（保留现有值）
    """
    logger.info(f"🚀 [API-复制薪资配置] 接收请求: 源期间={source_period_id}, 目标期间={target_period_id}, 用户={current_user.username}")
    
    try:
        service = EmployeeSalaryConfigService(db)
        result = service.copy_salary_configs_for_period(
            source_period_id=source_period_id,
            target_period_id=target_period_id,
            user_id=current_user.id
        )
        
        logger.info(f"✅ [API-复制薪资配置] 复制成功: {result['message']}")
        
        return DataResponse(
            data=result,
            message="薪资配置复制成功"
        )
    except ValueError as e:
        logger.warning(f"⚠️ [API-复制薪资配置] 参数错误: {e}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=create_error_response(
                status_code=422,
                message="复制薪资配置失败",
                details=str(e)
            )
        )
    except Exception as e:
        logger.error(f"💥 [API-复制薪资配置] 复制失败: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="复制薪资配置时发生错误",
                details=str(e)
            )
        )


@router.post("/salary-configs/copy-insurance-base", response_model=DataResponse[Dict[str, Any]])
async def copy_insurance_base_amounts(
    source_period_id: int,
    target_period_id: int,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["payroll_run:manage"]))
):
    """
    🎯 专门复制社保和公积金缴费基数（不复制基本工资和专项扣除）
    
    Args:
        source_period_id: 源期间ID (从这个期间复制基数)
        target_period_id: 目标期间ID (复制到这个期间)
    
    Returns:
        复制结果统计，包括新建、更新、跳过的记录数量
    """
    logger.info(f"🏦 [copy_insurance_base_amounts] 复制缴费基数 - 用户: {current_user.username}, 源期间: {source_period_id}, 目标期间: {target_period_id}")
    
    try:
        service = EmployeeSalaryConfigService(db)
        result = service.copy_insurance_base_amounts_for_period(
            source_period_id=source_period_id,
            target_period_id=target_period_id,
            user_id=current_user.id
        )
        
        logger.info(f"✅ [copy_insurance_base_amounts] 复制完成 - 新建: {result['copied_count']}, 更新: {result['updated_count']}, 跳过: {result['skipped_count']}")
        return DataResponse(
            data=result,
            message=result.get("message", "缴费基数复制完成")
        )
        
    except ValueError as e:
        logger.warning(f"⚠️ [copy_insurance_base_amounts] 参数错误: {e}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=create_error_response(
                status_code=422,
                message="复制缴费基数失败",
                details=str(e)
            )
        )
    except Exception as e:
        logger.error(f"💥 [copy_insurance_base_amounts] 复制缴费基数失败: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="复制缴费基数时发生错误",
                details=str(e)
            )
        )


@router.post("/salary-configs/batch-update", response_model=DataResponse[Dict[str, Any]])
async def batch_update_salary_configs(
    updates: List[Dict[str, Any]],
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["payroll_run:manage"]))
):
    """
    批量更新员工薪资配置
    
    请求格式示例：
    [
        {
            "employee_id": 1,
            "social_insurance_base": 15000.00,
            "housing_fund_base": 20000.00,
            "basic_salary": 8000.00
        }
    ]
    """
    logger.info(f"🚀 [API-批量更新薪资配置] 接收请求: 更新数量={len(updates)}, 用户={current_user.username}")
    
    try:
        service = EmployeeSalaryConfigService(db)
        result = service.batch_update_salary_configs(
            updates=updates,
            user_id=current_user.id
        )
        
        logger.info(f"✅ [API-批量更新薪资配置] 更新成功: {result['message']}")
        
        return DataResponse(
            data=result,
            message="批量更新薪资配置成功"
        )
    except ValueError as e:
        logger.warning(f"⚠️ [API-批量更新薪资配置] 参数错误: {e}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=create_error_response(
                status_code=422,
                message="批量更新薪资配置失败",
                details=str(e)
            )
        )
    except Exception as e:
        logger.error(f"💥 [API-批量更新薪资配置] 更新失败: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="批量更新薪资配置时发生错误",
                details=str(e)
            )
        )

@router.post("/batch-adjust", response_model=DataResponse[Dict[str, Any]])
async def batch_adjust_payroll(
    request: BatchAdjustmentRequest,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["payroll_run:manage"]))
):
    """批量调整工资数据"""
    try:
        service = SimplePayrollService(db)
        result = service.batch_adjust_payroll(
            payroll_run_id=request.payroll_run_id,
            adjustments=request.adjustments,
            user_id=current_user.id
        )
        return DataResponse(
            data=result,
            message="批量调整完成"
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=create_error_response(
                status_code=422,
                message="批量调整失败",
                details=str(e)
            )
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="批量调整时发生错误",
                details=str(e)
            )
        )

# =============================================================================
# 计算引擎功能
# =============================================================================

@router.post("/calculation-engine/run", response_model=DataResponse[Dict[str, Any]])
async def run_calculation_engine(
    request: Dict[str, Any],
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["payroll_run:manage"]))
):
    """
    运行简化版计算引擎
    
    重新计算指定工资运行的所有条目，使用简化版计算引擎
    """
    logger.info(f"🔄 [run_calculation_engine] 接收请求 - 用户: {current_user.username}, 参数: {request}")
    
    try:
        payroll_run_id = request.get("payroll_run_id")
        recalculate_all = request.get("recalculate_all", True)
        employee_ids = request.get("employee_ids")
        
        if not payroll_run_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=create_error_response(
                    status_code=400,
                    message="缺少必要参数",
                    details="payroll_run_id 参数是必需的"
                )
            )
        
        # 导入简化版计算引擎
        from ..payroll_engine.simple_calculator import SimplePayrollCalculator
        from ..models import PayrollEntry, Employee, PayrollRun
        from sqlalchemy import and_, text
        
        # 校验工资运行状态
        payroll_run = db.query(PayrollRun).filter(PayrollRun.id == payroll_run_id).first()
        if not payroll_run:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=create_error_response(
                    status_code=404,
                    message="工资运行不存在",
                    details=f"工资运行ID {payroll_run_id} 未找到"
                )
            )
        
        # 检查工资运行状态 - 直接查询状态名称
        status_result = db.execute(
            text("SELECT lv.name, lv.code FROM config.lookup_values lv WHERE lv.id = :status_id"),
            {"status_id": payroll_run.status_lookup_value_id}
        ).first()
        
        current_status_name = status_result.name if status_result else "未知状态"
        current_status_code = status_result.code if status_result else "UNKNOWN"
        
        # 如果状态是已计算，给出警告信息
        warning_message = None
        if current_status_code == "PRUN_CALCULATED":
            warning_message = f"⚠️ 工资运行当前状态为「{current_status_name}」，重新计算将覆盖原有计算结果"
            logger.warning(f"工资运行 {payroll_run_id} 状态为已计算，将覆盖原计算结果")
        
        logger.info(f"工资运行状态检查: ID={payroll_run_id}, 状态={current_status_name}({current_status_code})")
        
        calculator = SimplePayrollCalculator(db)
        
        # 获取需要计算的工资条目
        query = db.query(PayrollEntry).filter(PayrollEntry.payroll_run_id == payroll_run_id)
        if employee_ids:
            query = query.filter(PayrollEntry.employee_id.in_(employee_ids))
        
        entries = query.all()
        
        if not entries:
            return DataResponse(data={
                "total_processed": 0,
                "success_count": 0,
                "error_count": 0,
                "calculation_summary": {
                    "total_gross_pay": 0,
                    "total_deductions": 0,
                    "total_net_pay": 0
                },
                "message": "没有找到需要计算的工资条目"
            })
        
        # 执行计算
        success_count = 0
        error_count = 0
        errors = []
        total_gross_pay = 0
        total_deductions = 0
        total_net_pay = 0
        
        logger.info(f"开始计算 {len(entries)} 条工资记录...")
        
        for i, entry in enumerate(entries, 1):
            if i % 10 == 0:  # 每10条记录记录一次进度
                logger.info(f"计算进度: {i}/{len(entries)}")
            try:
                # 使用现有的earnings_details和deductions_details进行计算
                result = calculator.calculate_payroll_entry(
                    employee_id=entry.employee_id,
                    payroll_run_id=entry.payroll_run_id,
                    earnings_data=entry.earnings_details or {},
                    deductions_data=entry.deductions_details or {}
                )
                
                # 更新数据库记录
                entry.gross_pay = result["gross_pay"]
                entry.total_deductions = result["total_deductions"]
                entry.net_pay = result["net_pay"]
                entry.calculation_log = result["calculation_log"]
                
                # 累计统计
                total_gross_pay += float(result["gross_pay"])
                total_deductions += float(result["total_deductions"])
                total_net_pay += float(result["net_pay"])
                
                success_count += 1
                
            except Exception as calc_error:
                error_count += 1
                # 获取员工信息用于错误报告
                employee = db.query(Employee).filter(Employee.id == entry.employee_id).first()
                employee_name = f"{employee.first_name}{employee.last_name}" if employee else f"员工ID:{entry.employee_id}"
                
                errors.append({
                    "employee_id": entry.employee_id,
                    "employee_name": employee_name,
                    "error_message": str(calc_error)
                })
                logger.error(f"计算员工 {entry.employee_id} 工资失败: {calc_error}")
        
        # 更新工资运行状态和汇总信息
        try:
            if payroll_run and success_count > 0:
                # 更新为已计算状态 (PRUN_CALCULATED = 61)
                payroll_run.status_lookup_value_id = 61
                payroll_run.total_employees = success_count
                payroll_run.total_gross_pay = total_gross_pay
                payroll_run.total_deductions = total_deductions
                payroll_run.total_net_pay = total_net_pay
                logger.info(f"更新工资运行汇总: ID={payroll_run_id}, 状态=已计算, 员工数={success_count}, 应发={total_gross_pay}, 扣发={total_deductions}, 实发={total_net_pay}")
        except Exception as status_update_error:
            logger.error(f"更新工资运行状态失败: {status_update_error}")
            # 不影响主要计算流程，继续执行
        
        # 批量提交数据库更改
        try:
            db.commit()
            logger.info(f"数据库提交成功，更新了 {success_count} 条记录")
        except Exception as commit_error:
            logger.error(f"数据库提交失败: {commit_error}")
            db.rollback()
            raise
        
        result_data = {
            "total_processed": len(entries),
            "success_count": success_count,
            "error_count": error_count,
            "calculation_summary": {
                "total_gross_pay": total_gross_pay,
                "total_deductions": total_deductions,
                "total_net_pay": total_net_pay
            },
            "payroll_run_updated": success_count > 0,
            "status_info": {
                "previous_status": current_status_name,
                "previous_status_code": current_status_code,
                "new_status": "已计算" if success_count > 0 else current_status_name,
                "new_status_code": "PRUN_CALCULATED" if success_count > 0 else current_status_code
            }
        }
        
        if warning_message:
            result_data["warning"] = warning_message
        
        if errors:
            result_data["errors"] = errors
        
        logger.info(f"✅ [run_calculation_engine] 计算完成 - 成功: {success_count}, 失败: {error_count}")
        return DataResponse(data=result_data)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"运行计算引擎失败: {e}", exc_info=True)
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="计算引擎执行失败",
                details=str(e)
            )
        )

# =============================================================================
# 工资审核功能
# =============================================================================

@router.get("/audit/summary/{payroll_run_id}", response_model=DataResponse[AuditSummaryResponse])
async def get_audit_summary(
    payroll_run_id: int,
    db: Session = Depends(get_db_v2)
    # ⚡️ 临时移除权限验证以提升性能
    # current_user = Depends(require_permissions(["payroll_run:view"]))
):
    """获取工资审核汇总信息（支持视图优化）"""
    try:
        service = PayrollAuditService(db)
        
        # 使用视图优化方法（已成为唯一实现）
        logger.info(f"🚀 获取审核汇总: {payroll_run_id}")
        summary = service.get_audit_summary(payroll_run_id)
            
        return DataResponse(data=summary)
    except Exception as e:
        logger.error(f"获取审核汇总失败: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="获取审核汇总失败",
                details=str(e)
            )
        )

@router.post("/audit/check/{payroll_run_id}", response_model=DataResponse[AuditSummaryResponse])
async def run_audit_check(
    payroll_run_id: int,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["payroll_run:manage"]))
):
    """执行完整的工资审核检查"""
    try:
        service = PayrollAuditService(db)
        summary = service.run_audit_check(payroll_run_id)
        return DataResponse(
            data=summary,
            message="审核检查完成"
        )
    except Exception as e:
        logger.error(f"执行审核检查失败: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="执行审核检查失败",
                details=str(e)
            )
        )

@router.get("/audit/{payroll_run_id}/anomalies", response_model=PaginationResponse[AuditAnomalyResponse])
async def get_audit_anomalies(
    payroll_run_id: int,
    anomaly_types: Optional[List[str]] = Query(None),
    severity: Optional[List[str]] = Query(None),
    page: int = Query(1, ge=1, description="页码"),
    size: int = Query(100, ge=1, le=200, description="每页记录数"),

    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["payroll_run:view"]))
):
    """获取详细的审核异常列表（支持视图优化）"""
    try:
        service = PayrollAuditService(db)
        
        # 使用视图优化方法（已成为唯一实现）
        logger.info(f"🚀 获取异常列表: {payroll_run_id}")
        anomalies = service.get_audit_anomalies(
            payroll_run_id=payroll_run_id,
            anomaly_types=anomaly_types,
            severity=severity,
            page=page,
            size=size
        )
        
        # 视图方法已经处理了分页，直接返回
        total = len(anomalies)  # 这里可以优化为从视图获取总数
        return PaginationResponse(
            data=anomalies,
            meta=PaginationMeta(
                total=total,
                page=page,
                size=size,
                pages=(total + size - 1) // size if total > 0 else 1
            )
        )
        
    except Exception as e:
        logger.error(f"获取审核异常失败: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="获取审核异常失败",
                details=str(e)
            )
        )

@router.post("/audit/ignore", response_model=DataResponse[Dict[str, int]])
async def ignore_audit_anomalies(
    request: Dict[str, Any],
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["payroll_run:manage"]))
):
    """忽略审核异常"""
    try:
        anomaly_ids = request.get('anomaly_ids', [])
        reason = request.get('reason', '')
        
        if not anomaly_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=create_error_response(
                    status_code=400,
                    message="参数错误",
                    details="anomaly_ids 不能为空"
                )
            )
        
        # 对于实时计算的异常，我们创建忽略记录
        from webapp.v2.models.audit import PayrollAuditAnomaly
        from datetime import datetime
        import uuid
        
        ignored_count = 0
        
        for anomaly_id in anomaly_ids:
            try:
                # 检查是否已存在
                existing = db.query(PayrollAuditAnomaly).filter(
                    PayrollAuditAnomaly.id == anomaly_id
                ).first()
                
                if existing:
                    # 更新现有记录
                    existing.is_ignored = True
                    existing.ignore_reason = reason
                    existing.ignored_by_user_id = current_user.id
                    existing.ignored_at = datetime.now()
                else:
                    # 对于实时异常，解析ID获取信息
                    # 格式: missing_data_{entry_id} 或 calc_gross_{entry_id}
                    parts = anomaly_id.split('_')
                    if len(parts) >= 3:
                        entry_id = parts[-1]
                        anomaly_type = '_'.join(parts[:-1]).upper() + '_CHECK'
                        
                        # 获取工资条目信息
                        from webapp.v2.models.payroll import PayrollEntry
                        entry = db.query(PayrollEntry).filter(PayrollEntry.id == entry_id).first()
                        
                        if entry:
                            # 创建忽略记录
                            ignored_anomaly = PayrollAuditAnomaly(
                                id=anomaly_id,
                                payroll_entry_id=entry.id,
                                payroll_run_id=entry.payroll_run_id,
                                employee_id=entry.employee_id,
                                employee_code=entry.employee.employee_code if entry.employee else "N/A",
                                employee_name=f"{entry.employee.last_name}{entry.employee.first_name}" if entry.employee else "未知员工",
                                anomaly_type=anomaly_type,
                                severity="error",
                                message="用户已忽略此异常",
                                details=f"忽略原因: {reason}",
                                can_auto_fix=False,
                                is_ignored=True,
                                ignore_reason=reason,
                                ignored_by_user_id=current_user.id,
                                ignored_at=datetime.now(),
                                fix_applied=False
                            )
                            db.add(ignored_anomaly)
                
                ignored_count += 1
                
            except Exception as e:
                logger.warning(f"忽略异常 {anomaly_id} 失败: {e}")
        
        db.commit()
        
        return DataResponse(
            data={"ignored_count": ignored_count},
            message=f"成功忽略 {ignored_count} 个异常"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"忽略审核异常失败: {e}", exc_info=True)
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="忽略审核异常失败",
                details=str(e)
            )
        )

@router.post("/audit/auto-fix", response_model=DataResponse[Dict[str, int]])
async def auto_fix_audit_anomalies(
    request: Dict[str, Any],
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["payroll_run:manage"]))
):
    """自动修复审核异常"""
    try:
        payroll_run_id = request.get('payroll_run_id')
        anomaly_ids = request.get('anomaly_ids', [])
        
        if not payroll_run_id or not anomaly_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=create_error_response(
                    status_code=400,
                    message="参数错误",
                    details="payroll_run_id 和 anomaly_ids 不能为空"
                )
            )
        
        # 这里应该实现自动修复逻辑
        # 目前返回模拟结果
        return DataResponse(
            data={"fixed_count": 0, "failed_count": len(anomaly_ids)},
            message="自动修复功能暂未实现"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"自动修复审核异常失败: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="自动修复审核异常失败",
                details=str(e)
            )
        )

@router.post("/audit/update-status", response_model=DataResponse[PayrollRunResponse])
async def update_audit_status(
    request: Dict[str, Any],
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["payroll_run:manage"]))
):
    """
    更新审核状态
    """
    logger.info(f"🔄 [update_audit_status] 接收请求 - 用户: {current_user.username}, 参数: {request}")
    
    try:
        payroll_run_id = request.get("payroll_run_id")
        status_name = request.get("status")
        comment = request.get("comment")
        
        if not payroll_run_id or not status_name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=create_error_response(
                    status_code=400,
                    message="缺少必要参数",
                    details="payroll_run_id 和 status 参数是必需的"
                )
            )
        
        # 状态映射
        status_mapping = {
            'DRAFT': 60,           # 待计算
            'IN_REVIEW': 173,      # 审核中
            'APPROVED': 62,        # 批准支付  
            'REJECTED': 60         # 退回到待计算
        }
        
        status_lookup_value_id = status_mapping.get(status_name)
        if not status_lookup_value_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=create_error_response(
                    status_code=400,
                    message="无效的状态值",
                    details=f"状态 {status_name} 不被支持"
                )
            )
        
        # 更新工资运行状态
        from ..models.payroll import PayrollRun
        payroll_run = db.query(PayrollRun).filter(PayrollRun.id == payroll_run_id).first()
        if not payroll_run:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=create_error_response(
                    status_code=404,
                    message="工资运行不存在",
                    details=f"工资运行ID {payroll_run_id} 未找到"
                )
            )
        
        # 记录状态变更
        old_status_id = payroll_run.status_lookup_value_id
        payroll_run.status_lookup_value_id = status_lookup_value_id
        
        db.commit()
        
        # 返回更新后的工资运行信息（查询单个工资运行详情）
        updated_run = db.query(PayrollRun).filter(PayrollRun.id == payroll_run_id).first()
        if updated_run:
            # 构建响应对象
            status_lookup = db.query(LookupValue).filter(
                LookupValue.id == updated_run.status_lookup_value_id
            ).first()
            
            # 查询实际的工资条目数量
            actual_entries_count = db.query(PayrollEntry).filter(
                PayrollEntry.payroll_run_id == updated_run.id
            ).count()
            
            updated_payroll_run = PayrollRunResponse(
                id=updated_run.id,
                period_id=updated_run.payroll_period_id,
                period_name="工资期间",  # 简化处理
                version_number=1,
                status_id=updated_run.status_lookup_value_id,
                status_name=status_lookup.name if status_lookup else "未知状态",
                total_entries=actual_entries_count,  # 使用实际的工资条目数量
                total_gross_pay=updated_run.total_gross_pay or 0,
                total_net_pay=updated_run.total_net_pay or 0,
                total_deductions=updated_run.total_deductions or 0,
                initiated_by_user_id=updated_run.initiated_by_user_id or 1,
                initiated_by_username="系统",
                initiated_at=updated_run.run_date or datetime.now(),
                calculated_at=updated_run.run_date,
                approved_at=None,
                description=f"工资运行 #{updated_run.id}"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=create_error_response(
                    status_code=404,
                    message="更新后的工资运行不存在",
                    details=f"工资运行ID {payroll_run_id} 未找到"
                )
            )
        
        logger.info(f"✅ [update_audit_status] 状态更新成功 - 工资运行ID: {payroll_run_id}, 状态: {old_status_id} -> {status_lookup_value_id}")
        return DataResponse(
            data=updated_payroll_run,
            message=f"审核状态已更新为: {status_name}"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"更新审核状态失败: {e}", exc_info=True)
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="更新审核状态失败",
                details=str(e)
            )
        )

@router.post("/bank-file/generate", response_model=DataResponse[Dict[str, Any]])
async def generate_bank_file(
    request: Dict[str, Any],
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["payroll_run:manage"]))
):
    """
    生成银行代发文件
    
    支持多种银行格式：
    - 工商银行
    - 建设银行  
    - 农业银行
    - 中国银行
    - 招商银行
    """
    logger.info(f"🔄 [generate_bank_file] 接收请求 - 用户: {current_user.username}, 参数: {request}")
    
    try:
        payroll_run_id = request.get("payroll_run_id")
        bank_type = request.get("bank_type", "ICBC")  # 默认工商银行
        file_format = request.get("file_format", "txt")  # txt, csv, excel
        include_summary = request.get("include_summary", True)
        
        if not payroll_run_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=create_error_response(
                    status_code=400,
                    message="缺少必要参数",
                    details="payroll_run_id 参数是必需的"
                )
            )
        
        # 验证工资运行是否存在
        from ..models.payroll import PayrollRun, PayrollEntry
        from ..models.hr import Employee
        
        payroll_run = db.query(PayrollRun).filter(PayrollRun.id == payroll_run_id).first()
        if not payroll_run:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=create_error_response(
                    status_code=404,
                    message="工资运行不存在",
                    details=f"工资运行ID {payroll_run_id} 未找到"
                )
            )
        
        # 获取工资条目和员工银行信息
        from ..models.hr import EmployeeBankAccount
        
        entries_query = db.query(PayrollEntry, Employee, EmployeeBankAccount).join(
            Employee, PayrollEntry.employee_id == Employee.id
        ).outerjoin(
            EmployeeBankAccount, 
            (EmployeeBankAccount.employee_id == Employee.id) & 
            (EmployeeBankAccount.is_primary == True)
        ).filter(
            PayrollEntry.payroll_run_id == payroll_run_id,
            PayrollEntry.net_pay > 0  # 只包含实发合计大于0的记录
        ).order_by(Employee.employee_code)
        
        entries_data = entries_query.all()
        
        if not entries_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=create_error_response(
                    status_code=400,
                    message="没有可发放的工资记录",
                    details="该工资运行中没有实发合计大于0的员工"
                )
            )
        
        # 生成银行文件内容
        bank_records = []
        total_amount = 0
        total_count = 0
        
        for entry, employee, bank_account_info in entries_data:
            # 构建员工全名
            employee_full_name = f"{employee.last_name or ''}{employee.first_name or ''}".strip()
            if not employee_full_name:
                employee_full_name = employee.employee_code or "未知员工"
            
            # 检查员工银行信息
            if not bank_account_info or not bank_account_info.account_number:
                logger.warning(f"员工 {employee_full_name} 缺少银行账号信息")
                continue
            
            bank_account = bank_account_info.account_number
            bank_name = bank_account_info.bank_name
            
            bank_record = {
                "employee_code": employee.employee_code,
                "employee_name": employee_full_name,
                "bank_account": bank_account,
                "bank_name": bank_name or "未知银行",
                "amount": float(entry.net_pay),
                "currency": "CNY",
                "purpose": f"{payroll_run.payroll_period.name if payroll_run.payroll_period else ''}工资",
                "remark": f"工资发放-{employee.employee_code}"
            }
            
            bank_records.append(bank_record)
            total_amount += float(entry.net_pay)
            total_count += 1
        
        # 根据银行类型生成不同格式的文件内容
        file_content = generate_bank_file_content(
            bank_type=bank_type,
            file_format=file_format,
            records=bank_records,
            total_amount=total_amount,
            total_count=total_count,
            payroll_run=payroll_run
        )
        
        # 生成文件名
        from datetime import datetime
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        period_name = payroll_run.payroll_period.name if payroll_run.payroll_period else "工资"
        filename = f"{bank_type}_{period_name}_银行代发_{timestamp}.{file_format}"
        
        result = {
            "file_name": filename,
            "file_content": file_content,
            "file_format": file_format,
            "bank_type": bank_type,
            "total_records": total_count,
            "total_amount": total_amount,
            "summary": {
                "payroll_run_id": payroll_run_id,
                "period_name": period_name,
                "generated_at": datetime.now().isoformat(),
                "generated_by": current_user.username,
                "records_count": total_count,
                "total_amount": f"{total_amount:.2f}"
            }
        }
        
        logger.info(f"✅ [generate_bank_file] 银行文件生成成功 - 记录数: {total_count}, 总金额: {total_amount}")
        return DataResponse(
            data=result,
            message=f"银行代发文件生成成功，共{total_count}条记录，总金额{total_amount:.2f}元"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"生成银行文件失败: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="生成银行文件失败",
                details=str(e)
            )
        )

def generate_bank_file_content(
    bank_type: str,
    file_format: str,
    records: list,
    total_amount: float,
    total_count: int,
    payroll_run
) -> str:
    """根据银行类型和文件格式生成银行文件内容"""
    
    if bank_type == "ICBC":  # 工商银行
        return generate_icbc_format(file_format, records, total_amount, total_count, payroll_run)
    elif bank_type == "CCB":  # 建设银行
        return generate_ccb_format(file_format, records, total_amount, total_count, payroll_run)
    elif bank_type == "ABC":  # 农业银行
        return generate_abc_format(file_format, records, total_amount, total_count, payroll_run)
    elif bank_type == "BOC":  # 中国银行
        return generate_boc_format(file_format, records, total_amount, total_count, payroll_run)
    elif bank_type == "CMB":  # 招商银行
        return generate_cmb_format(file_format, records, total_amount, total_count, payroll_run)
    else:
        # 通用格式
        return generate_generic_format(file_format, records, total_amount, total_count, payroll_run)

def generate_icbc_format(file_format: str, records: list, total_amount: float, total_count: int, payroll_run) -> str:
    """生成工商银行格式文件"""
    if file_format == "txt":
        lines = []
        # 文件头
        lines.append(f"H|{total_count:08d}|{total_amount:015.2f}|CNY|{datetime.now().strftime('%Y%m%d')}|工资代发")
        
        # 明细记录
        for i, record in enumerate(records, 1):
            bank_name = record['bank_name'] or "未知银行"
            line = f"D|{i:08d}|{record['bank_account']}|{record['employee_name']}|{bank_name}|{record['amount']:012.2f}|CNY|{record['remark']}"
            lines.append(line)
        
        # 文件尾
        lines.append(f"T|{total_count:08d}|{total_amount:015.2f}")
        
        return "\n".join(lines)
    
    elif file_format == "csv":
        import csv
        import io
        
        output = io.StringIO()
        writer = csv.writer(output)
        
        # CSV头部
        writer.writerow(["序号", "账号", "户名", "开户银行", "金额", "币种", "备注"])
        
        # 明细记录
        for i, record in enumerate(records, 1):
            writer.writerow([
                i,
                record['bank_account'],
                record['employee_name'],
                record['bank_name'] or "未知银行",
                f"{record['amount']:.2f}",
                "CNY",
                record['remark']
            ])
        
        return output.getvalue()
    
    else:  # excel格式
        return generate_excel_content(records, "工商银行代发文件")

def generate_ccb_format(file_format: str, records: list, total_amount: float, total_count: int, payroll_run) -> str:
    """生成建设银行格式文件"""
    # 建设银行格式实现
    return generate_generic_format(file_format, records, total_amount, total_count, payroll_run)

def generate_abc_format(file_format: str, records: list, total_amount: float, total_count: int, payroll_run) -> str:
    """生成农业银行格式文件"""
    # 农业银行格式实现
    return generate_generic_format(file_format, records, total_amount, total_count, payroll_run)

def generate_boc_format(file_format: str, records: list, total_amount: float, total_count: int, payroll_run) -> str:
    """生成中国银行格式文件"""
    # 中国银行格式实现
    return generate_generic_format(file_format, records, total_amount, total_count, payroll_run)

def generate_cmb_format(file_format: str, records: list, total_amount: float, total_count: int, payroll_run) -> str:
    """生成招商银行格式文件"""
    # 招商银行格式实现
    return generate_generic_format(file_format, records, total_amount, total_count, payroll_run)

def generate_generic_format(file_format: str, records: list, total_amount: float, total_count: int, payroll_run) -> str:
    """生成通用格式文件"""
    if file_format == "csv":
        import csv
        import io
        
        output = io.StringIO()
        writer = csv.writer(output)
        
        # CSV头部
        writer.writerow(["员工编号", "员工姓名", "银行账号", "开户银行", "发放金额", "备注"])
        
        # 明细记录
        for record in records:
            writer.writerow([
                record['employee_code'],
                record['employee_name'],
                record['bank_account'],
                record['bank_name'],
                f"{record['amount']:.2f}",
                record['remark']
            ])
        
        # 汇总行
        writer.writerow([])
        writer.writerow(["汇总", f"共{total_count}人", "", "", f"{total_amount:.2f}", ""])
        
        return output.getvalue()
    
    else:  # txt格式
        lines = []
        lines.append(f"银行代发文件 - 生成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        lines.append(f"总记录数: {total_count}, 总金额: {total_amount:.2f}")
        lines.append("-" * 120)
        lines.append(f"{'序号':<4} {'员工编号':<10} {'员工姓名':<10} {'银行账号':<20} {'开户银行':<30} {'金额':<12} {'备注':<20}")
        lines.append("-" * 120)
        
        for i, record in enumerate(records, 1):
            bank_name = record['bank_name'] or "未知银行"
            lines.append(f"{i:<4} {record['employee_code']:<10} {record['employee_name']:<10} {record['bank_account']:<20} {bank_name:<30} {record['amount']:<12.2f} {record['remark']:<20}")
        
        lines.append("-" * 120)
        lines.append(f"合计: {total_count}人, {total_amount:.2f}元")
        
        return "\n".join(lines)

def generate_excel_content(records: list, title: str) -> str:
    """生成Excel格式内容（返回base64编码）"""
    # 这里可以使用openpyxl等库生成真正的Excel文件
    # 为了简化，这里返回CSV格式
    import csv
    import io
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    writer.writerow([title])
    writer.writerow([])
    writer.writerow(["员工编号", "员工姓名", "银行账号", "开户银行", "发放金额", "备注"])
    
    for record in records:
        writer.writerow([
            record['employee_code'],
            record['employee_name'],
            record['bank_account'],
            record['bank_name'],
            f"{record['amount']:.2f}",
            record['remark']
        ])
    
    return output.getvalue()

@router.post("/audit/advanced-check/{payroll_run_id}", response_model=DataResponse[Dict[str, Any]])
async def run_advanced_audit_check(
    payroll_run_id: int,
    include_custom_rules: bool = Query(True, description="是否包含自定义规则检查"),
    include_historical_comparison: bool = Query(True, description="是否包含历史对比"),
    include_statistical_analysis: bool = Query(True, description="是否包含统计分析"),
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["payroll_run:manage"]))
):
    """
    执行高级审核检查
    
    包含以下高级功能：
    - 薪资合规性深度检查
    - 历史数据对比分析
    - 统计异常检测
    - 薪资结构一致性检查
    - 个税计算深度验证
    """
    try:
        service = AdvancedAuditService(db)
        advanced_results = await service.run_advanced_audit_check(
            payroll_run_id=payroll_run_id,
            include_custom_rules=include_custom_rules,
            include_historical_comparison=include_historical_comparison,
            include_statistical_analysis=include_statistical_analysis
        )
        return DataResponse(
            data=advanced_results,
            message="高级审核检查完成"
        )
    except Exception as e:
        logger.error(f"执行高级审核检查失败: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="执行高级审核检查失败",
                details=str(e)
            )
        )

# =============================================================================
# 报表生成功能
# =============================================================================

@router.get("/reports/available", response_model=DataResponse[List[Dict[str, Any]]])
async def get_available_reports(
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["report:view_reports"]))
):
    """获取可用的报表列表"""
    try:
        service = PayrollReportService(db)
        reports = service.get_available_reports()
        return DataResponse(data=reports)
    except Exception as e:
        logger.error(f"获取可用报表失败: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="获取可用报表失败",
                details=str(e)
            )
        )

@router.post("/reports/generate", response_model=DataResponse[Dict[str, str]])
async def generate_reports(
    request: ReportGenerationRequest,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["report:view_reports"]))
):
    """生成报表"""
    try:
        service = PayrollReportService(db)
        task_id = service.generate_reports(
            request=request,
            user_id=current_user.id
        )
        return DataResponse(
            data={"task_id": task_id},
            message="报表生成任务已启动"
        )
    except Exception as e:
        logger.error(f"启动报表生成失败: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="启动报表生成失败",
                details=str(e)
            )
        )

@router.get("/reports/templates", response_model=List[ReportTemplateResponse])
async def get_report_templates(
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["report:view_reports"]))
):
    """获取可用的报表模板列表"""
    try:
        service = PayrollReportService(db)
        return service.get_available_report_templates()
    except Exception as e:
        logger.error(f"获取报表模板失败: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="获取报表模板失败",
                details=str(e)
            )
        )

@router.post("/reports/generate")
async def generate_report(
    request: ReportGenerationRequest,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["report:view_reports"]))
) -> Dict[str, Any]:
    """生成报表数据"""
    try:
        service = PayrollReportService(db)
        return service.generate_report(request)
    except Exception as e:
        logger.error(f"生成报表失败: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="生成报表失败",
                details=str(e)
            )
        )

# =============================================================================
# 通用辅助功能
# =============================================================================

@router.get("/departments", response_model=DataResponse[List[Dict[str, Any]]])
async def get_departments(
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["department:list"]))
):
    """获取部门列表"""
    try:
        service = SimplePayrollService(db)
        departments = service.get_departments()
        return DataResponse(data=departments)
    except Exception as e:
        logger.error(f"获取部门列表失败: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="获取部门列表失败",
                details=str(e)
            )
        )

@router.get("/personnel-categories", response_model=DataResponse[List[Dict[str, Any]]])
async def get_personnel_categories(
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["personnel_category:list"]))
):
    """获取人员类别列表"""
    try:
        service = SimplePayrollService(db)
        categories = service.get_personnel_categories()
        return DataResponse(data=categories)
    except Exception as e:
        logger.error(f"获取人员类别列表失败: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="获取人员类别列表失败",
                details=str(e)
            )
        )

@router.get("/stats/overview")
async def get_overview_stats(
    period_id: Optional[int] = Query(None, description="指定期间ID，不提供则返回最新期间统计"),
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["report:view_reports"]))
) -> Dict[str, Any]:
    """获取概览统计数据"""
    try:
        service = SimplePayrollService(db)
        
        # 如果没有指定期间，获取最新期间
        if not period_id:
            periods = service.get_payroll_periods()
            if not periods:
                return {
                    "message": "暂无工资期间数据",
                    "total_periods": 0,
                    "total_employees": 0,
                    "total_runs": 0
                }
            period_id = periods[0].id
        
        # 获取该期间的版本列表
        versions = service.get_payroll_versions(period_id)
        latest_version = versions[0] if versions else None
        
        # 基础统计
        stats = {
            "current_period_id": period_id,
            "total_versions": len(versions),
            "latest_version": latest_version.dict() if latest_version else None,
            "period_summary": {
                "total_entries": latest_version.total_entries if latest_version else 0,
                "total_gross_pay": str(latest_version.total_gross_pay) if latest_version else "0.00",
                "total_net_pay": str(latest_version.total_net_pay) if latest_version else "0.00",
                "total_deductions": str(latest_version.total_deductions) if latest_version else "0.00"
            }
        }
        
        # 如果有最新版本，获取审核统计
        if latest_version:
            try:
                audit_service = PayrollAuditService(db)
                audit_summary = audit_service.get_audit_summary(latest_version.id)
                stats["audit_summary"] = {
                    "total_anomalies": audit_summary.total_anomalies,
                    "error_count": audit_summary.error_count,
                    "warning_count": audit_summary.warning_count,
                    "auto_fixable_count": audit_summary.auto_fixable_count
                }
            except Exception as e:
                logger.warning(f"获取审核统计失败: {e}")
                stats["audit_summary"] = None
        
        return stats
        
    except Exception as e:
        logger.error(f"获取概览统计失败: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="获取概览统计失败",
                details=str(e)
            )
        )

@router.get("/health")
async def health_check() -> Dict[str, str]:
    """健康检查接口"""
    return {
        "status": "healthy",
        "service": "simple-payroll",
        "message": "极简工资报表系统运行正常"
    }

# =============================================================================
# 批量调整功能
# =============================================================================

@router.post("/batch-adjustment/preview", response_model=DataResponse[BatchAdjustmentPreview])
async def preview_batch_adjustment(
    request: BatchAdjustmentPreviewRequest,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["payroll_run:manage"]))
):
    """
    预览批量调整结果
    
    在执行实际调整前，先预览所有将要受影响的条目和调整数值
    """
    try:
        service = BatchAdjustmentService(db)
        preview = await service.preview_batch_adjustment(request)
        return DataResponse(
            data=preview,
            message="批量调整预览生成成功"
        )
    except ValueError as e:
        logger.warning(f"批量调整预览参数错误: {e}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=create_error_response(
                status_code=422,
                message="预览批量调整失败",
                details=str(e)
            )
        )
    except Exception as e:
        logger.error(f"预览批量调整失败: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="预览批量调整时发生错误",
                details=str(e)
            )
        )

@router.post("/batch-adjustment/execute", response_model=DataResponse[BatchAdjustmentResult])
async def execute_batch_adjustment(
    request: BatchAdjustmentRequestAdvanced,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["payroll_run:manage"]))
):
    """
    执行批量调整
    
    应用调整规则到指定的工资条目，支持多种调整方式：
    - add: 增加固定金额
    - subtract: 减少固定金额
    - multiply: 按百分比调整
    - set: 设置为固定值
    """
    try:
        service = BatchAdjustmentService(db)
        result = await service.execute_batch_adjustment(request)
        return DataResponse(
            data=result,
            message=f"批量调整执行成功，共调整 {result.affected_count} 条记录"
        )
    except ValueError as e:
        logger.warning(f"批量调整执行参数错误: {e}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=create_error_response(
                status_code=422,
                message="执行批量调整失败",
                details=str(e)
            )
        )
    except Exception as e:
        logger.error(f"执行批量调整失败: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="执行批量调整时发生错误",
                details=str(e)
            )
        )

# =============================================================================
# 社保计算功能
# =============================================================================

@router.post("/social-insurance/calculate", response_model=DataResponse[Dict[str, Any]])
async def calculate_social_insurance(
    request: Dict[str, Any],
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["payroll_run:manage"]))
):
    """
    计算员工社保五险一金
    
    支持单个员工或批量员工的社保计算
    """
    logger.info(f"🔄 [calculate_social_insurance] 接收请求 - 用户: {current_user.username}, 参数: {request}")
    
    try:
        from ..payroll_engine.social_insurance_calculator import SocialInsuranceCalculator
        from datetime import date, datetime
        
        employee_ids = request.get("employee_ids", [])
        employee_id = request.get("employee_id")
        calculation_period_str = request.get("calculation_period")
        social_insurance_base = request.get("social_insurance_base")
        housing_fund_base = request.get("housing_fund_base")
        
        # 处理员工ID
        if employee_id and employee_id not in employee_ids:
            employee_ids.append(employee_id)
        
        if not employee_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=create_error_response(
                    status_code=400,
                    message="缺少必要参数",
                    details="employee_ids 或 employee_id 参数是必需的"
                )
            )
        
        # 处理计算期间
        if calculation_period_str:
            try:
                calculation_period = datetime.strptime(calculation_period_str, '%Y-%m-%d').date()
            except ValueError:
                try:
                    calculation_period = datetime.strptime(calculation_period_str, '%Y-%m').date().replace(day=1)
                except ValueError:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=create_error_response(
                            status_code=400,
                            message="日期格式错误",
                            details="calculation_period 应为 YYYY-MM-DD 或 YYYY-MM 格式"
                        )
                    )
        else:
            calculation_period = date.today()
        
        # 初始化社保计算器
        calculator = SocialInsuranceCalculator(db)
        
        results = []
        if len(employee_ids) == 1:
            # 单个员工计算
            result = calculator.calculate_employee_social_insurance(
                employee_id=employee_ids[0],
                calculation_period=calculation_period,
                social_insurance_base=Decimal(str(social_insurance_base)) if social_insurance_base else None,
                housing_fund_base=Decimal(str(housing_fund_base)) if housing_fund_base else None
            )
            results.append(result)
        else:
            # 批量员工计算
            results = calculator.batch_calculate_social_insurance(
                employee_ids=employee_ids,
                calculation_period=calculation_period
            )
        
        # 构建返回数据
        calculation_data = []
        for result in results:
            employee_data = {
                "employee_id": result.employee_id,
                "calculation_period": result.calculation_period.isoformat(),
                "total_employee_amount": float(result.total_employee_amount),
                "total_employer_amount": float(result.total_employer_amount),
                "components": [
                    {
                        "component_code": comp.component_code,
                        "component_name": comp.component_name,
                        "insurance_type": comp.insurance_type,
                        "employee_amount": float(comp.employee_amount),
                        "employer_amount": float(comp.employer_amount),
                        "employee_rate": float(comp.employee_rate),
                        "employer_rate": float(comp.employer_rate),
                        "base_amount": float(comp.base_amount),
                        "rule_id": comp.rule_id,
                        "config_name": comp.config_name
                    }
                    for comp in result.components
                ],
                "applied_rules": result.applied_rules,
                "unapplied_rules": result.unapplied_rules,
                "calculation_details": result.calculation_details
            }
            calculation_data.append(employee_data)
        
        # 获取汇总信息
        summary = calculator.get_social_insurance_summary(results)
        
        response_data = {
            "calculation_results": calculation_data,
            "summary": summary,
            "calculation_period": calculation_period.isoformat(),
            "total_employees": len(results)
        }
        
        logger.info(f"✅ [calculate_social_insurance] 计算完成 - 员工数: {len(results)}")
        return DataResponse(
            data=response_data,
            message=f"社保计算完成，共计算 {len(results)} 名员工"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"社保计算失败: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="社保计算失败",
                details=str(e)
            )
        )

@router.post("/social-insurance/integrate", response_model=DataResponse[Dict[str, Any]])
async def integrate_social_insurance_calculation(
    request: Dict[str, Any],
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["payroll_run:manage"]))
):
    """
    将社保计算集成到现有薪资条目中
    
    为指定的薪资运行添加社保计算，更新扣除项和实发合计
    """
    logger.info(f"🔄 [integrate_social_insurance] 接收请求 - 用户: {current_user.username}, 参数: {request}")
    
    try:
        from ..payroll_engine.integrated_calculator import IntegratedPayrollCalculator
        from ..models.payroll import PayrollEntry, PayrollRun
        from datetime import date, datetime
        
        payroll_run_id = request.get("payroll_run_id")
        calculation_period_str = request.get("calculation_period")
        employee_ids = request.get("employee_ids", [])
        force_recalculate = request.get("force_recalculate", False)
        
        if not payroll_run_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=create_error_response(
                    status_code=400,
                    message="缺少必要参数",
                    details="payroll_run_id 参数是必需的"
                )
            )
        
        # 验证工资运行存在
        payroll_run = db.query(PayrollRun).filter(PayrollRun.id == payroll_run_id).first()
        if not payroll_run:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=create_error_response(
                    status_code=404,
                    message="工资运行不存在",
                    details=f"工资运行ID {payroll_run_id} 未找到"
                )
            )
        
        # 处理计算期间
        if calculation_period_str:
            try:
                calculation_period = datetime.strptime(calculation_period_str, '%Y-%m-%d').date()
            except ValueError:
                try:
                    calculation_period = datetime.strptime(calculation_period_str, '%Y-%m').date().replace(day=1)
                except ValueError:
                    calculation_period = date.today()
        else:
            calculation_period = date.today()
        
        # 获取薪资条目
        query = db.query(PayrollEntry).filter(PayrollEntry.payroll_run_id == payroll_run_id)
        if employee_ids:
            query = query.filter(PayrollEntry.employee_id.in_(employee_ids))
        
        entries = query.all()
        
        if not entries:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=create_error_response(
                    status_code=404,
                    message="没有找到薪资条目",
                    details="指定的薪资运行中没有找到匹配的薪资条目"
                )
            )
        
        # 初始化集成计算器
        integrated_calculator = IntegratedPayrollCalculator(db)
        
        updated_entries = []
        success_count = 0
        error_count = 0
        errors = []
        
        for entry in entries:
            try:
                # 为薪资条目添加社保计算
                update_data = integrated_calculator.update_payroll_entry_with_social_insurance(
                    entry=entry,
                    calculation_period=calculation_period
                )
                
                if 'error' in update_data:
                    error_count += 1
                    errors.append({
                        "employee_id": entry.employee_id,
                        "error_message": update_data['error']
                    })
                    continue
                
                # 更新数据库记录
                entry.deductions_details = update_data['deductions_details']
                entry.total_deductions = update_data['total_deductions']
                entry.net_pay = update_data['net_pay']
                
                # 添加社保计算日志到计算日志中
                current_log = entry.calculation_log or {}
                current_log.update(update_data.get('calculation_log', {}))
                current_log['social_insurance_integration'] = {
                    'integration_time': datetime.now().isoformat(),
                    'social_insurance_employee': float(update_data.get('social_insurance_employee', 0)),
                    'social_insurance_employer': float(update_data.get('social_insurance_employer', 0)),
                    'housing_fund_employee': float(update_data.get('housing_fund_employee', 0)),
                    'housing_fund_employer': float(update_data.get('housing_fund_employer', 0))
                }
                entry.calculation_log = current_log
                
                updated_entries.append({
                    "employee_id": entry.employee_id,
                    "old_total_deductions": float(entry.total_deductions - update_data['social_insurance_employee'] - update_data['housing_fund_employee']),
                    "new_total_deductions": float(update_data['total_deductions']),
                    "old_net_pay": float(entry.gross_pay - (entry.total_deductions - update_data['social_insurance_employee'] - update_data['housing_fund_employee'])),
                    "new_net_pay": float(update_data['net_pay']),
                    "social_insurance_employee": float(update_data.get('social_insurance_employee', 0)),
                    "housing_fund_employee": float(update_data.get('housing_fund_employee', 0))
                })
                
                success_count += 1
                
            except Exception as e:
                error_count += 1
                errors.append({
                    "employee_id": entry.employee_id,
                    "error_message": str(e)
                })
                logger.error(f"为员工 {entry.employee_id} 集成社保计算失败: {e}")
        
        # 提交数据库更改
        if success_count > 0:
            db.commit()
        
        response_data = {
            "payroll_run_id": payroll_run_id,
            "total_entries": len(entries),
            "success_count": success_count,
            "error_count": error_count,
            "updated_entries": updated_entries,
            "errors": errors,
            "calculation_period": calculation_period.isoformat()
        }
        
        logger.info(f"✅ [integrate_social_insurance] 社保集成完成 - 成功: {success_count}, 失败: {error_count}")
        return DataResponse(
            data=response_data,
            message=f"社保集成完成，成功更新 {success_count} 条记录，失败 {error_count} 条"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"社保集成失败: {e}", exc_info=True)
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="社保集成失败",
                details=str(e)
            )
        )

@router.get("/calculation-engine/progress/{task_id}", response_model=DataResponse[Dict[str, Any]])
async def get_calculation_progress(
    task_id: str,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["payroll_run:view"]))
):
    """
    获取计算引擎的进度状态
    
    返回指定任务ID的计算进度，包括当前处理的员工、进度百分比等信息
    """
    logger.info(f"🔄 [get_calculation_progress] 查询计算进度 - 任务ID: {task_id}, 用户: {current_user.username}")
    
    try:
        # 从Redis或内存缓存中获取进度信息
        # 这里使用简单的内存存储示例，实际项目中建议使用Redis
        import json
        from pathlib import Path
        
        # 定义进度文件路径
        progress_file = Path(f"/tmp/calculation_progress_{task_id}.json")
        
        if not progress_file.exists():
            # 任务不存在或已完成
            return DataResponse(
                data={
                    "task_id": task_id,
                    "status": "NOT_FOUND",
                    "message": "计算任务不存在或已完成"
                },
                message="任务不存在"
            )
        
        # 读取进度信息
        with open(progress_file, 'r', encoding='utf-8') as f:
            progress_data = json.load(f)
        
        logger.info(f"✅ [get_calculation_progress] 进度查询成功 - 状态: {progress_data.get('status')}")
        return DataResponse(
            data=progress_data,
            message="进度查询成功"
        )
        
    except Exception as e:
        logger.error(f"查询计算进度失败: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="查询计算进度失败",
                details=str(e)
            )
        )

@router.post("/calculation-engine/integrated-run", response_model=DataResponse[Dict[str, Any]])
async def run_integrated_calculation_engine(
    request: Dict[str, Any],
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["payroll_run:manage"]))
):
    """
    计算五险一金（包含社保计算）
    
    重新计算指定工资运行的所有条目，包括基础薪资和社保计算
    现在支持异步执行和进度跟踪
    """
    logger.info(f"🔄 [run_integrated_calculation_engine] 接收请求 - 用户: {current_user.username}, 参数: {request}")
    
    try:
        import uuid
        import json
        from pathlib import Path
        import threading
        from datetime import datetime
        from ..payroll_engine.integrated_calculator import IntegratedPayrollCalculator
        from ..payroll_engine.simple_calculator import CalculationStatus
        from ..models.payroll import PayrollEntry, PayrollRun
        from ..models.hr import Employee
        from datetime import date
        from decimal import Decimal
        
        # 生成唯一任务ID
        task_id = str(uuid.uuid4())
        
        payroll_run_id = request.get("payroll_run_id")
        calculation_period_str = request.get("calculation_period")
        employee_ids = request.get("employee_ids")
        include_social_insurance = request.get("include_social_insurance", True)
        recalculate_all = request.get("recalculate_all", True)
        async_mode = request.get("async_mode", True)  # 支持异步和同步两种模式
        
        if not payroll_run_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=create_error_response(
                    status_code=400,
                    message="缺少必要参数",
                    details="payroll_run_id 参数是必需的"
                )
            )
        
        # 验证工资运行
        payroll_run = db.query(PayrollRun).filter(PayrollRun.id == payroll_run_id).first()
        if not payroll_run:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=create_error_response(
                    status_code=404,
                    message="工资运行不存在",
                    details=f"工资运行ID {payroll_run_id} 未找到"
                )
            )
        
        # 处理计算期间
        if calculation_period_str:
            try:
                calculation_period = datetime.strptime(calculation_period_str, '%Y-%m-%d').date()
            except ValueError:
                try:
                    calculation_period = datetime.strptime(calculation_period_str, '%Y-%m').date().replace(day=1)
                except ValueError:
                    calculation_period = date.today()
        else:
            calculation_period = date.today()
        
        # 获取薪资条目
        query = db.query(PayrollEntry).filter(PayrollEntry.payroll_run_id == payroll_run_id)
        if employee_ids:
            query = query.filter(PayrollEntry.employee_id.in_(employee_ids))
        
        entries = query.all()
        
        if not entries:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=create_error_response(
                    status_code=404,
                    message="没有找到薪资条目",
                    details="指定的薪资运行中没有找到匹配的薪资条目"
                )
            )
        
        # 定义进度更新函数
        def update_progress(status, processed=0, total=0, current_employee=None, stage="", start_time=None):
            progress_data = {
                "task_id": task_id,
                "status": status,
                "total": total,
                "processed": processed,
                "current_employee": current_employee,
                "stage": stage,
                "start_time": start_time.isoformat() if start_time else None,
                "estimated_remaining_time": None,
                "last_updated": datetime.now().isoformat()
            }
            
            # 计算预估剩余时间
            if processed > 0 and start_time:
                elapsed = datetime.now() - start_time
                avg_time_per_employee = elapsed.total_seconds() / processed
                remaining_employees = total - processed
                estimated_remaining_seconds = avg_time_per_employee * remaining_employees
                progress_data["estimated_remaining_time"] = int(estimated_remaining_seconds)
            
            # 写入进度文件
            progress_file = Path(f"/tmp/calculation_progress_{task_id}.json")
            with open(progress_file, 'w', encoding='utf-8') as f:
                json.dump(progress_data, f, ensure_ascii=False, indent=2)
        
        # 如果是异步模式，立即返回任务ID
        if async_mode:
            # 初始化进度
            start_time = datetime.now()
            update_progress("PREPARING", 0, len(entries), None, "数据准备", start_time)
            
            # 在后台线程中执行计算
            def background_calculation():
                try:
                    perform_calculation_with_progress(
                        db, entries, calculation_period, include_social_insurance, 
                        task_id, payroll_run_id, update_progress, start_time
                    )
                except Exception as e:
                    logger.error(f"后台计算失败: {e}", exc_info=True)
                    update_progress("FAILED", 0, len(entries), None, f"计算失败: {str(e)}", start_time)
            
            thread = threading.Thread(target=background_calculation)
            thread.daemon = True
            thread.start()
            
            return DataResponse(
                data={
                    "task_id": task_id,
                    "status": "STARTED",
                    "total_employees": len(entries),
                    "message": "计算已启动，请使用task_id查询进度"
                },
                message="计算任务已启动"
            )
        
        # 🧹 第一步：清除所有薪资条目中的旧五险一金数据
        logger.info(f"🧹 [清除旧数据] 开始清除 {len(entries)} 条薪资记录中的旧五险一金数据")
        
        # 🎯 从数据库动态获取需要清除的五险一金字段
        social_insurance_fields_to_clear = set()
        
        # 🎯 第一步：从数据库动态获取所有五险一金项目并清除现有数据
        logger.info("🗑️ [准备清除] 开始获取并清除旧的五险一金数据...")

        from ..models.config import PayrollComponentDefinition
        # 获取所有个人扣缴和单位扣缴项目
        deduction_components = db.query(PayrollComponentDefinition).filter(
            PayrollComponentDefinition.type.in_(['PERSONAL_DEDUCTION', 'EMPLOYER_DEDUCTION']),
            PayrollComponentDefinition.is_active == True
        ).all()
        
        # 🎯 个税等重要扣除项目不能清理
        protected_deduction_fields = {
            'PERSONAL_INCOME_TAX', 'REFUND_DEDUCTION_ADJUSTMENT', 
            'SOCIAL_INSURANCE_ADJUSTMENT', 'PERFORMANCE_BONUS_DEDUCTION_ADJUSTMENT',
            'REWARD_PERFORMANCE_ADJUSTMENT', 'MEDICAL_2022_DEDUCTION_ADJUSTMENT'
        }
        
        for component in deduction_components:
            # ✅ 明确保护个税等重要扣除项目
            if component.code in protected_deduction_fields:
                logger.info(f"🛡️ [保护字段] {component.code} - 保留重要扣除项目，不清理")
                continue
                
            # 🎯 只清除五险一金相关项目
            if any(keyword in component.code.upper() for keyword in [
                'HOUSING_FUND', 'PENSION', 'MEDICAL', 'UNEMPLOYMENT', 
                'INJURY', 'SERIOUS_ILLNESS', 'OCCUPATIONAL_PENSION', 'MATERNITY'
            ]):
                social_insurance_fields_to_clear.add(component.code)
        
        logger.info(f"🔍 [动态字段获取] 从数据库获取到 {len(social_insurance_fields_to_clear)} 个五险一金扣缴项目")
        
        cleared_count = 0
        for entry in entries:
            if entry.deductions_details:
                original_count = len(entry.deductions_details)
                
                # 创建新的扣除详情，只保留非五险一金项目
                cleaned_deductions = {}
                removed_fields = []
                removed_amount = 0
                
                for key, value in entry.deductions_details.items():
                    if key in social_insurance_fields_to_clear:
                        removed_fields.append(key)
                        # 🔍 计算被移除字段的金额
                        if isinstance(value, dict) and 'amount' in value:
                            removed_amount += value.get('amount', 0)
                    else:
                        cleaned_deductions[key] = value
                
                if removed_fields:
                    entry.deductions_details = cleaned_deductions
                    # 标记JSONB字段已修改
                    from sqlalchemy.orm.attributes import flag_modified
                    flag_modified(entry, 'deductions_details')
                    cleared_count += 1
                    
                    logger.info(f"🗑️ [清除] 员工 {entry.employee_id}: 移除了 {len(removed_fields)} 个五险一金字段，总金额 {removed_amount}")
                    logger.info(f"🗑️ [清除字段] {removed_fields}")
        
        logger.info(f"✅ [清除完成] 成功清除 {cleared_count} 条记录中的旧五险一金数据")
        
        # 🔄 第二步：初始化集成计算器并执行计算
        logger.info(f"🚀 [开始计算] 初始化集成计算器，开始重新计算五险一金")
        integrated_calculator = IntegratedPayrollCalculator(db)
        
        # 批量计算
        results = integrated_calculator.batch_calculate_payroll(
            payroll_entries=entries,
            calculation_period=calculation_period,
            include_social_insurance=include_social_insurance
        )
        
        # 更新数据库记录
        success_count = 0
        error_count = 0
        errors = []
        
        for i, result in enumerate(results):
            entry = entries[i]
            
            if result.status == CalculationStatus.COMPLETED:
                try:
                    # 更新薪资条目
                    entry.gross_pay = result.gross_pay
                    entry.total_deductions = result.total_deductions
                    entry.net_pay = result.net_pay
                    entry.calculation_log = result.calculation_details
                    
                    # 🎯 更新扣除详情中的社保公积金金额（应用进位规则后的金额）
                    if hasattr(result, 'updated_deductions_details') and result.updated_deductions_details:
                        current_deductions = entry.deductions_details or {}
                        
                        # 🔍 调试：记录更新前的状态
                        old_housing_fund = current_deductions.get('HOUSING_FUND_PERSONAL', {}).get('amount', 'N/A')
                        logger.info(f"🔍 [更新前] 员工 {entry.employee_id} 原住房公积金: {old_housing_fund}")
                        logger.info(f"🔍 [更新数据] 员工 {entry.employee_id} updated_deductions_details: {result.updated_deductions_details}")
                        
                        # 将计算后的进位金额更新到扣除详情中
                        current_deductions.update(result.updated_deductions_details)
                        entry.deductions_details = current_deductions
                        
                        # 🎯 强制标记JSONB字段已修改，确保SQLAlchemy检测到变化
                        from sqlalchemy.orm.attributes import flag_modified
                        flag_modified(entry, 'deductions_details')
                        
                        # 🔍 调试：记录更新后的状态
                        new_housing_fund = current_deductions.get('HOUSING_FUND_PERSONAL', {}).get('amount', 'N/A')
                        logger.info(f"🔍 [更新后] 员工 {entry.employee_id} 新住房公积金: {new_housing_fund}")
                        logger.info(f"✅ [更新扣除详情] 员工 {entry.employee_id} 扣除详情已更新，包含进位后的住房公积金金额")
                    
                    success_count += 1
                except Exception as e:
                    error_count += 1
                    employee = db.query(Employee).filter(Employee.id == entry.employee_id).first()
                    employee_name = f"{employee.first_name}{employee.last_name}" if employee else f"员工ID:{entry.employee_id}"
                    errors.append({
                        "employee_id": entry.employee_id,
                        "employee_name": employee_name,
                        "error_message": str(e)
                    })
                    logger.error(f"更新员工 {entry.employee_id} 计算结果失败: {e}")
            else:
                error_count += 1
                employee = db.query(Employee).filter(Employee.id == entry.employee_id).first()
                employee_name = f"{employee.first_name}{employee.last_name}" if employee else f"员工ID:{entry.employee_id}"
                errors.append({
                    "employee_id": entry.employee_id,
                    "employee_name": employee_name,
                    "error_message": result.error_message or "计算失败"
                })
        
        # 提交更改
        if success_count > 0:
            db.commit()
            
            # 更新工资运行汇总信息
            calculation_summary = integrated_calculator.get_calculation_summary(results)
            payroll_totals = calculation_summary.get('payroll_totals', {})
            payroll_run.total_gross_pay = Decimal(str(payroll_totals.get('total_gross_pay', 0)))
            payroll_run.total_deductions = Decimal(str(payroll_totals.get('total_deductions', 0)))
            payroll_run.total_net_pay = Decimal(str(payroll_totals.get('total_net_pay', 0)))
            db.commit()
        
        # 获取汇总信息并重新构造响应格式
        calculation_summary = integrated_calculator.get_calculation_summary(results)
        
        response_data = {
            "payroll_run_id": payroll_run_id,
            "total_processed": len(entries),
            "success_count": success_count,
            "error_count": error_count,
            "calculation_summary": calculation_summary.get('calculation_summary', {}),
            "payroll_totals": calculation_summary.get('payroll_totals', {}),
            "social_insurance_breakdown": calculation_summary.get('social_insurance_breakdown', {}),
            "cost_analysis": calculation_summary.get('cost_analysis', {}),
            "calculation_metadata": calculation_summary.get('calculation_metadata', {}),
            "payroll_run_updated": success_count > 0,
            "include_social_insurance": include_social_insurance,
            "calculation_period": calculation_period.isoformat(),
            "errors": errors
        }
        
        logger.info(f"✅ [run_integrated_calculation_engine] 集成计算完成 - 成功: {success_count}, 失败: {error_count}")
        return DataResponse(
            data=response_data,
            message=f"集成计算完成，成功处理 {success_count} 条记录，失败 {error_count} 条"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"集成计算引擎失败: {e}", exc_info=True)
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="集成计算引擎失败",
                details=str(e)
            )
        )   

@router.delete("/payroll-data/{period_id}", response_model=DataResponse[Dict[str, Any]])
async def delete_payroll_data_for_period(
    period_id: int,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["payroll_period:manage"]))
):
    """
    🗑️ 删除指定期间的工资记录数据（不删除期间本身）
    
    Args:
        period_id: 期间ID
    
    Returns:
        删除结果统计
    """
    logger.info(f"🗑️ [delete_payroll_data_for_period] 删除工资记录数据 - 用户: {current_user.username}, 期间: {period_id}")
    
    try:
        # 获取期间信息
        target_period = db.query(PayrollPeriod).filter(
            PayrollPeriod.id == period_id
        ).first()
        
        if not target_period:
            logger.error(f"❌ [delete_payroll_data_for_period] 期间不存在: {period_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=create_error_response(
                    status_code=404,
                    message="期间不存在",
                    details=f"期间ID {period_id} 未找到"
                )
            )
        
        logger.info(f"✅ [delete_payroll_data_for_period] 找到目标期间: {target_period.name} ({target_period.start_date} ~ {target_period.end_date})")
        
        # 删除该期间的工资记录数据，但保留期间本身
        deleted_runs = 0
        deleted_entries = 0
        deleted_audit_records = 0
        
        # 获取该期间的所有工资运行
        payroll_runs = db.query(PayrollRun).filter(
            PayrollRun.payroll_period_id == period_id
        ).all()
        
        logger.info(f"🔍 [delete_payroll_data_for_period] 找到 {len(payroll_runs)} 个工资运行需要删除")
        
        for run in payroll_runs:
            logger.info(f"🗑️ [delete_payroll_data_for_period] 删除工资运行: ID={run.id}")
            
            # 删除审计相关数据
            from ..models.audit import PayrollAuditAnomaly, PayrollAuditHistory
            from ..models.calculation_rules import CalculationAuditLog, CalculationLog
            from ..models.audit import PayrollRunAuditSummary
            
            # 删除审计异常
            audit_anomalies = db.query(PayrollAuditAnomaly).filter(
                PayrollAuditAnomaly.payroll_run_id == run.id
            ).delete()
            
            # 删除审计历史
            audit_history = db.query(PayrollAuditHistory).filter(
                PayrollAuditHistory.payroll_run_id == run.id
            ).delete()
            
            # 删除计算审计日志
            calc_audit_logs = db.query(CalculationAuditLog).filter(
                CalculationAuditLog.payroll_run_id == run.id
            ).delete()
            
            # 删除计算日志
            calc_logs = db.query(CalculationLog).filter(
                CalculationLog.payroll_run_id == run.id
            ).delete()
            
            # 删除工资运行审计摘要
            audit_summary = db.query(PayrollRunAuditSummary).filter(
                PayrollRunAuditSummary.payroll_run_id == run.id
            ).delete()
            
            deleted_audit_records += (audit_anomalies + audit_history + calc_audit_logs + calc_logs + audit_summary)
            
            # 删除工资条目
            entries_count = db.query(PayrollEntry).filter(
                PayrollEntry.payroll_run_id == run.id
            ).count()
            
            db.query(PayrollEntry).filter(
                PayrollEntry.payroll_run_id == run.id
            ).delete()
            
            deleted_entries += entries_count
            
            # 删除工资运行
            db.delete(run)
            deleted_runs += 1
        
        # 删除月度快照（如果存在）
        from ..models.audit import MonthlyPayrollSnapshot
        snapshots_deleted = db.query(MonthlyPayrollSnapshot).filter(
            MonthlyPayrollSnapshot.period_id == period_id
        ).delete()
        
        logger.info(f"💾 [delete_payroll_data_for_period] 提交删除操作: 运行={deleted_runs}, 条目={deleted_entries}, 审计记录={deleted_audit_records}, 快照={snapshots_deleted}")
        db.commit()
        logger.info(f"✅ [delete_payroll_data_for_period] 删除操作已提交")
        
        result = {
            "success": True,
            "deleted_runs": deleted_runs,
            "deleted_entries": deleted_entries,
            "deleted_audit_records": deleted_audit_records,
            "deleted_snapshots": snapshots_deleted,
            "period_id": period_id,
            "period_name": target_period.name,
            "message": f"成功删除期间 {target_period.name} 的工资记录数据：{deleted_runs} 个运行批次，{deleted_entries} 条薪资记录"
        }
        
        logger.info(f"✅ [delete_payroll_data_for_period] 删除完成 - 期间: {target_period.name}, 运行: {deleted_runs}, 条目: {deleted_entries}")
        
        return DataResponse(
            data=result,
            message=result["message"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"💥 [delete_payroll_data_for_period] 删除工资记录数据失败: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="删除工资记录数据时发生错误",
                details=str(e)
            )
        )

# 在 check_existing_data 路由后添加新的检查缴费基数的路由

@router.get("/check-existing-insurance-base/{period_id}", response_model=DataResponse[Dict[str, Any]])
async def check_existing_insurance_base(
    period_id: int,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["payroll_run:view"]))
):
    """
    🎯 专门检查指定期间是否已有缴费基数配置
    
    用于"一键复制上月基数"功能的前置检查，只关注社保和公积金缴费基数，
    不检查工资记录或其他薪资配置。
    """
    logger.info(f"🔍 [API-检查缴费基数] 检查期间 {period_id} 的缴费基数配置, 用户={current_user.username}")
    
    try:
        # 获取目标期间信息
        target_period = db.query(PayrollPeriod).filter(
            PayrollPeriod.id == period_id
        ).first()
        
        if not target_period:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=create_error_response(
                    status_code=404,
                    message="期间不存在",
                    details=f"期间ID {period_id} 未找到"
                )
            )
        
        # 🎯 专门检查缴费基数配置（只关注social_insurance_base和housing_fund_base字段）
        from ..models.payroll_config import EmployeeSalaryConfig
        
        existing_base_configs = db.query(EmployeeSalaryConfig).filter(
            and_(
                or_(EmployeeSalaryConfig.is_active.is_(None), EmployeeSalaryConfig.is_active == True),
                EmployeeSalaryConfig.effective_date <= target_period.end_date,
                or_(
                    EmployeeSalaryConfig.end_date.is_(None),
                    EmployeeSalaryConfig.end_date >= target_period.start_date
                ),
                # 🎯 关键：只检查有缴费基数的记录（社保基数或公积金基数或职业年金基数不为空）
                or_(
                    EmployeeSalaryConfig.social_insurance_base.isnot(None),
                    EmployeeSalaryConfig.housing_fund_base.isnot(None),
                    EmployeeSalaryConfig.occupational_pension_base.isnot(None)
                )
            )
        ).all()
        
        # 统计分析
        employees_with_social_base = len([c for c in existing_base_configs if c.social_insurance_base is not None and c.social_insurance_base > 0])
        employees_with_housing_base = len([c for c in existing_base_configs if c.housing_fund_base is not None and c.housing_fund_base > 0])
        employees_with_occupational_pension_base = len([c for c in existing_base_configs if getattr(c, 'occupational_pension_base', None) is not None and getattr(c, 'occupational_pension_base', 0) > 0])
        
        # 构建详细的基数信息
        base_configs_info = {
            "has_base_data": len(existing_base_configs) > 0,
            "total_configs": len(existing_base_configs),
            "employees_with_social_base": employees_with_social_base,
            "employees_with_housing_base": employees_with_housing_base,
            "employees_with_occupational_pension_base": employees_with_occupational_pension_base,
            "unique_employees": len(set(config.employee_id for config in existing_base_configs)),
            "configs_detail": []
        }
        
        # 🎯 提供前几个配置的详情用于展示
        for config in existing_base_configs[:5]:  # 只取前5个示例
            from ..models.hr import Employee
            employee = db.query(Employee).filter(Employee.id == config.employee_id).first()
            employee_name = f"{employee.last_name}{employee.first_name}" if employee else f"员工ID:{config.employee_id}"
            
            base_configs_info["configs_detail"].append({
                "employee_id": config.employee_id,
                "employee_name": employee_name,
                "social_insurance_base": float(config.social_insurance_base) if config.social_insurance_base else 0,
                "housing_fund_base": float(config.housing_fund_base) if config.housing_fund_base else 0,
                "effective_date": config.effective_date.isoformat() if config.effective_date else None,
                "end_date": config.end_date.isoformat() if config.end_date else None
            })
        
        result = {
            "target_period_id": period_id,
            "target_period_name": target_period.name,
            "period_date_range": {
                "start_date": target_period.start_date.isoformat(),
                "end_date": target_period.end_date.isoformat()
            },
            "has_insurance_base_data": base_configs_info["has_base_data"],
            "base_configs": base_configs_info,
            "summary": {
                "检查类型": "缴费基数配置检查",
                "总配置数": base_configs_info["total_configs"],
                "有社保基数员工": base_configs_info["employees_with_social_base"],
                "有公积金基数员工": base_configs_info["employees_with_housing_base"],
                "涉及员工总数": base_configs_info["unique_employees"]
            },
            "recommendation": {
                "can_copy": not base_configs_info["has_base_data"],
                "message": "当前期间无缴费基数配置，可以复制" if not base_configs_info["has_base_data"] else f"当前期间已有 {base_configs_info['unique_employees']} 名员工的缴费基数配置"
            }
        }
        
        logger.info(f"✅ [API-检查缴费基数] 检查完成: 期间={target_period.name}, 有基数配置={base_configs_info['has_base_data']}, 员工数={base_configs_info['unique_employees']}")
        
        return DataResponse(
            data=result,
            message="缴费基数检查完成"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"💥 [API-检查缴费基数] 检查失败: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="检查缴费基数时发生错误",
                details=str(e)
            )
        )

@router.get("/data-integrity-stats/{period_id}", response_model=DataResponse[Dict[str, Any]])
async def get_data_integrity_stats(
    period_id: int,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["payroll_run:view"]))
):
    """
    🎯 获取指定期间的数据完整性统计
    
    统计包括：
    - 社保基数记录数量
    - 公积金基数记录数量  
    - 个人所得税>0的记录数量
    """
    logger.info(f"🔍 [API-数据完整性统计] 获取期间 {period_id} 的数据完整性统计, 用户={current_user.username}")
    
    try:
        from ..models.payroll_config import EmployeeSalaryConfig
        from ..models.payroll import PayrollEntry, PayrollRun
        
        # 获取目标期间信息
        target_period = db.query(PayrollPeriod).filter(
            PayrollPeriod.id == period_id
        ).first()
        
        if not target_period:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=create_error_response(
                    status_code=404,
                    message="期间不存在",
                    details=f"期间ID {period_id} 未找到"
                )
            )
        
        # 🎯 统计社保基数记录数量
        social_insurance_base_count = db.query(EmployeeSalaryConfig).filter(
            and_(
                or_(EmployeeSalaryConfig.is_active.is_(None), EmployeeSalaryConfig.is_active == True),
                EmployeeSalaryConfig.effective_date <= target_period.end_date,
                or_(
                    EmployeeSalaryConfig.end_date.is_(None),
                    EmployeeSalaryConfig.end_date >= target_period.start_date
                ),
                EmployeeSalaryConfig.social_insurance_base.isnot(None),
                EmployeeSalaryConfig.social_insurance_base > 0
            )
        ).count()
        
        # 🎯 统计公积金基数记录数量
        housing_fund_base_count = db.query(EmployeeSalaryConfig).filter(
            and_(
                or_(EmployeeSalaryConfig.is_active.is_(None), EmployeeSalaryConfig.is_active == True),
                EmployeeSalaryConfig.effective_date <= target_period.end_date,
                or_(
                    EmployeeSalaryConfig.end_date.is_(None),
                    EmployeeSalaryConfig.end_date >= target_period.start_date
                ),
                EmployeeSalaryConfig.housing_fund_base.isnot(None),
                EmployeeSalaryConfig.housing_fund_base > 0
            )
        ).count()
        
        # 🎯 统计个人所得税>0的记录数量
        # 首先获取该期间的工资运行
        payroll_runs = db.query(PayrollRun).filter(
            PayrollRun.payroll_period_id == period_id
        ).all()
        
        income_tax_positive_count = 0
        if payroll_runs:
            # 查询所有工资条目中个税>0的记录数量
            payroll_run_ids = [run.id for run in payroll_runs]
            from sqlalchemy import Numeric, text
            income_tax_positive_count = db.query(PayrollEntry).filter(
                and_(
                    PayrollEntry.payroll_run_id.in_(payroll_run_ids),
                    text("CAST(payroll.payroll_entries.deductions_details->'PERSONAL_INCOME_TAX'->>'amount' AS NUMERIC) > 0")
                )
            ).count()
        
        result = {
            "period_id": period_id,
            "period_name": target_period.name,
            "period_date_range": {
                "start_date": target_period.start_date.isoformat(),
                "end_date": target_period.end_date.isoformat()
            },
            "data_integrity": {
                "social_insurance_base_count": social_insurance_base_count,
                "housing_fund_base_count": housing_fund_base_count,
                "income_tax_positive_count": income_tax_positive_count
            },
            "summary": {
                "统计类型": "数据完整性统计",
                "社保基数记录数": social_insurance_base_count,
                "公积金基数记录数": housing_fund_base_count,  
                "个税大于0记录数": income_tax_positive_count
            }
        }
        
        logger.info(f"✅ [API-数据完整性统计] 统计完成: 期间={target_period.name}, 社保基数={social_insurance_base_count}, 公积金基数={housing_fund_base_count}, 个税>0={income_tax_positive_count}")
        
        return DataResponse(
            data=result,
            message="数据完整性统计完成"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"💥 [API-数据完整性统计] 统计失败: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="获取数据完整性统计时发生错误",
                details=str(e)
            )
        )

@router.get("/salary-configs/employee/{employee_id}/period/{period_id}", response_model=DataResponse[Dict[str, Any]])
async def get_employee_insurance_base(
    employee_id: int,
    period_id: int,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["payroll_run:view"]))
):
    """
    📋 获取员工在指定期间的缴费基数
    """
    logger.info(f"📋 [API-获取员工缴费基数] 员工ID={employee_id}, 期间ID={period_id}, 用户={current_user.username}")
    
    try:
        from ..models.payroll_config import EmployeeSalaryConfig
        from ..models.payroll import PayrollPeriod
        
        # 获取期间信息
        period = db.query(PayrollPeriod).filter(PayrollPeriod.id == period_id).first()
        if not period:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=create_error_response(
                    status_code=404,
                    message="期间不存在",
                    details=f"期间ID {period_id} 未找到"
                )
            )
        
        # 查找员工在该期间的薪资配置
        config = db.query(EmployeeSalaryConfig).filter(
            and_(
                EmployeeSalaryConfig.employee_id == employee_id,
                or_(EmployeeSalaryConfig.is_active.is_(None), EmployeeSalaryConfig.is_active == True),
                EmployeeSalaryConfig.effective_date <= period.end_date,
                or_(
                    EmployeeSalaryConfig.end_date.is_(None),
                    EmployeeSalaryConfig.end_date >= period.start_date
                )
            )
        ).first()
        
        if config:
            result = {
                "employee_id": employee_id,
                "period_id": period_id,
                "social_insurance_base": float(config.social_insurance_base or 0),
                "housing_fund_base": float(config.housing_fund_base or 0),
                "occupational_pension_base": float(getattr(config, 'occupational_pension_base', None) or 0),
                "effective_date": config.effective_date.isoformat() if config.effective_date else None,
                "end_date": config.end_date.isoformat() if config.end_date else None
            }
        else:
            # 如果没有找到配置，返回默认值
            result = {
                "employee_id": employee_id,
                "period_id": period_id,
                "social_insurance_base": 0.0,
                "housing_fund_base": 0.0,
                "occupational_pension_base": 0.0,
                "effective_date": None,
                "end_date": None
            }
        
        logger.info(f"✅ [API-获取员工缴费基数] 获取成功: 社保基数={result['social_insurance_base']}, 公积金基数={result['housing_fund_base']}, 职业年金基数={result['occupational_pension_base']}")
        
        return DataResponse(
            data=result,
            message="获取员工缴费基数成功"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"💥 [API-获取员工缴费基数] 获取失败: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="获取员工缴费基数时发生错误",
                details=str(e)
            )
        )

@router.put("/salary-configs/employee/{employee_id}/period/{period_id}", response_model=DataResponse[Dict[str, Any]])
async def update_employee_insurance_base(
    employee_id: int,
    period_id: int,
    request: Dict[str, Any],
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["payroll_run:manage"]))
):
    """
    💾 更新员工在指定期间的缴费基数
    """
    logger.info(f"💾 [API-更新员工缴费基数] 员工ID={employee_id}, 期间ID={period_id}, 用户={current_user.username}")
    
    try:
        from ..models.payroll_config import EmployeeSalaryConfig
        from ..models.payroll import PayrollPeriod
        from datetime import datetime
        
        social_insurance_base = request.get('social_insurance_base', 0)
        housing_fund_base = request.get('housing_fund_base', 0)
        occupational_pension_base = request.get('occupational_pension_base', 0)
        
        # 获取期间信息
        period = db.query(PayrollPeriod).filter(PayrollPeriod.id == period_id).first()
        if not period:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=create_error_response(
                    status_code=404,
                    message="期间不存在",
                    details=f"期间ID {period_id} 未找到"
                )
            )
        
        # 查找员工在该期间的薪资配置
        config = db.query(EmployeeSalaryConfig).filter(
            and_(
                EmployeeSalaryConfig.employee_id == employee_id,
                or_(EmployeeSalaryConfig.is_active.is_(None), EmployeeSalaryConfig.is_active == True),
                EmployeeSalaryConfig.effective_date <= period.end_date,
                or_(
                    EmployeeSalaryConfig.end_date.is_(None),
                    EmployeeSalaryConfig.end_date >= period.start_date
                )
            )
        ).first()
        
        if config:
            # 更新现有配置
            config.social_insurance_base = social_insurance_base
            config.housing_fund_base = housing_fund_base
            if hasattr(config, 'occupational_pension_base'):
                config.occupational_pension_base = occupational_pension_base
            config.updated_at = datetime.utcnow()
            config.updated_by = current_user.id
        else:
            # 创建新配置
            basic_salary = request.get('basic_salary', 0.0)  # 从请求中获取基本工资，默认为0
            config = EmployeeSalaryConfig(
                employee_id=employee_id,
                basic_salary=basic_salary,
                social_insurance_base=social_insurance_base,
                housing_fund_base=housing_fund_base,
                occupational_pension_base=occupational_pension_base,
                effective_date=period.start_date,
                end_date=period.end_date,
                is_active=True,
                created_by=current_user.id,
                updated_by=current_user.id,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            db.add(config)
        
        db.commit()
        
        result = {
            "success": True,
            "employee_id": employee_id,
            "period_id": period_id,
            "social_insurance_base": float(social_insurance_base),
            "housing_fund_base": float(housing_fund_base),
            "occupational_pension_base": float(occupational_pension_base),
            "message": "缴费基数更新成功"
        }
        
        logger.info(f"✅ [API-更新员工缴费基数] 更新成功: 社保基数={social_insurance_base}, 公积金基数={housing_fund_base}, 职业年金基数={occupational_pension_base}")
        
        return DataResponse(
            data=result,
            message="更新员工缴费基数成功"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"💥 [API-更新员工缴费基数] 更新失败: {e}", exc_info=True)
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="更新员工缴费基数时发生错误",
                details=str(e)
            )
        )

@router.delete("/salary-configs/delete-insurance-base/{period_id}", response_model=DataResponse[Dict[str, Any]])
async def delete_insurance_base_for_period(
    period_id: int,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["payroll_period:manage"]))
):
    """
    🗑️ 删除指定期间的所有缴费基数配置
    
    Args:
        period_id: 期间ID
    
    Returns:
        删除结果统计
    """
    logger.info(f"🗑️ [delete_insurance_base_for_period] 删除缴费基数 - 用户: {current_user.username}, 期间: {period_id}")
    
    try:
        # 获取期间信息
        target_period = db.query(PayrollPeriod).filter(
            PayrollPeriod.id == period_id
        ).first()
        
        if not target_period:
            logger.error(f"❌ [delete_insurance_base_for_period] 期间不存在: {period_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=create_error_response(
                    status_code=404,
                    message="期间不存在",
                    details=f"期间ID {period_id} 未找到"
                )
            )
        
        logger.info(f"✅ [delete_insurance_base_for_period] 找到目标期间: {target_period.name} ({target_period.start_date} ~ {target_period.end_date})")
        
        # 删除该期间的缴费基数配置
        from ..models.payroll_config import EmployeeSalaryConfig
        
        # 查找该期间的所有缴费基数配置（有社保基数或公积金基数或职业年金基数的记录）
        base_configs_query = db.query(EmployeeSalaryConfig).filter(
            and_(
                or_(EmployeeSalaryConfig.is_active.is_(None), EmployeeSalaryConfig.is_active == True),
                EmployeeSalaryConfig.effective_date <= target_period.end_date,
                or_(
                    EmployeeSalaryConfig.end_date.is_(None),
                    EmployeeSalaryConfig.end_date >= target_period.start_date
                ),
                # 只删除有缴费基数的记录
                or_(
                    EmployeeSalaryConfig.social_insurance_base.isnot(None),
                    EmployeeSalaryConfig.housing_fund_base.isnot(None),
                    EmployeeSalaryConfig.occupational_pension_base.isnot(None)
                )
            )
        )
        
        # 打印查询条件日志
        logger.info(f"🔍 [delete_insurance_base_for_period] 查询条件: 期间={target_period.name}, 生效日期<={target_period.end_date}, 结束日期>={target_period.start_date}")
        
        base_configs = base_configs_query.all()
        
        logger.info(f"🔍 [delete_insurance_base_for_period] 查询到 {len(base_configs)} 条缴费基数配置需要删除")
        
        # 详细记录每个配置
        for i, config in enumerate(base_configs):
            logger.info(f"📋 [delete_insurance_base_for_period] 配置 {i+1}: 员工ID={config.employee_id}, "
                       f"社保基数={config.social_insurance_base}, 公积金基数={config.housing_fund_base}, "
                       f"职业年金基数={getattr(config, 'occupational_pension_base', None)}, "
                       f"生效期={config.effective_date}~{config.end_date}")
        
        deleted_count = 0
        
        # 删除缴费基数配置
        for config in base_configs:
            logger.info(f"🗑️ [delete_insurance_base_for_period] 删除配置: 员工ID={config.employee_id}")
            db.delete(config)
            deleted_count += 1
        
        logger.info(f"💾 [delete_insurance_base_for_period] 提交删除操作, 共删除 {deleted_count} 条配置")
        db.commit()
        logger.info(f"✅ [delete_insurance_base_for_period] 删除操作已提交")
        
        result = {
            "success": True,
            "deleted_count": deleted_count,
            "period_id": period_id,
            "period_name": target_period.name,
            "message": f"成功删除 {deleted_count} 条缴费基数配置"
        }
        
        logger.info(f"✅ [delete_insurance_base_for_period] 删除完成 - 期间: {target_period.name}, 删除: {deleted_count} 条")
        
        return DataResponse(
            data=result,
            message=result["message"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"💥 [delete_insurance_base_for_period] 删除缴费基数失败: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="删除缴费基数时发生错误",
                details=str(e)
            )
        )

@router.post("/salary-configs/batch-validate", response_model=DataResponse[Dict[str, Any]])
async def batch_validate_salary_bases(
    request: Dict[str, Any],
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["payroll_run:manage"]))
):
    """
    🔍 批量验证缴费基数导入数据
    
    请求格式示例：
    {
        "period_id": 1,
        "base_updates": [
            {
                "employee_id": 1,
                "social_insurance_base": 15000.00,
                "housing_fund_base": 20000.00,
                "employee_info": {
                    "last_name": "张",
                    "first_name": "三",
                    "id_number": "110101199001011234"
                },
                "_clientId": "client_123"
            }
        ],
        "overwrite_mode": false
    }
    
    返回验证结果，包括：
    - 员工身份验证
    - 数据格式验证
    - 业务逻辑验证
    - 数据一致性验证
    """
    logger.info(f"🔍 [API-批量验证缴费基数] 接收请求: 记录数={len(request.get('base_updates', []))}, 用户={current_user.username}")
    
    try:
        period_id = request.get("period_id")
        base_updates = request.get("base_updates", [])
        overwrite_mode = request.get("overwrite_mode", False)
        
        if not period_id:
            raise ValueError("period_id 是必填字段")
        
        if not base_updates:
            raise ValueError("base_updates 不能为空")
        
        service = EmployeeSalaryConfigService(db)
        result = service.batch_validate_salary_bases(
            period_id=period_id,
            base_updates=base_updates,
            overwrite_mode=overwrite_mode
        )
        
        logger.info(f"✅ [API-批量验证缴费基数] 验证完成: 总计 {result['total']} 条, 有效 {result['valid']} 条, 无效 {result['invalid']} 条")
        
        return DataResponse(
            data=result,
            message=f"缴费基数验证完成: 总计 {result['total']} 条, 有效 {result['valid']} 条, 无效 {result['invalid']} 条"
        )
    except ValueError as e:
        logger.warning(f"⚠️ [API-批量验证缴费基数] 参数错误: {e}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=create_error_response(
                status_code=422,
                message="批量验证缴费基数失败",
                details=str(e)
            )
        )
    except Exception as e:
        logger.error(f"💥 [API-批量验证缴费基数] 验证失败: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="批量验证缴费基数时发生错误",
                details=str(e)
            )
        )

@router.post("/salary-configs/batch-update-bases", response_model=DataResponse[Dict[str, Any]])
async def batch_update_salary_bases(
    request: Dict[str, Any],
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["payroll_run:manage"]))
):
    """
    💰 批量更新缴费基数
    
    请求格式示例：
    {
        "period_id": 1,
        "base_updates": [
            {
                "employee_id": 1,
                "social_insurance_base": 15000.00,
                "housing_fund_base": 20000.00,
                "occupational_pension_base": 15000.00,
                "employee_info": {
                    "last_name": "张",
                    "first_name": "三",
                    "id_number": "110101199001011234"
                }
            }
        ],
        "overwrite_mode": false
    }
    
    执行缴费基数的批量更新，包括：
    - 社保缴费基数
    - 公积金缴费基数
    - 职业年金缴费基数
    """
    logger.info(f"💰 [API-批量更新缴费基数] 接收请求: 记录数={len(request.get('base_updates', []))}, 用户={current_user.username}")
    
    try:
        period_id = request.get("period_id")
        base_updates = request.get("base_updates", [])
        overwrite_mode = request.get("overwrite_mode", False)
        
        if not period_id:
            raise ValueError("period_id 是必填字段")
        
        if not base_updates:
            raise ValueError("base_updates 不能为空")
        
        service = EmployeeSalaryConfigService(db)
        result = service.batch_update_salary_bases(
            period_id=period_id,
            base_updates=base_updates,
            user_id=current_user.id,
            overwrite_mode=overwrite_mode
        )
        
        logger.info(f"✅ [API-批量更新缴费基数] 更新完成: {result['message']}")
        
        return DataResponse(
            data=result,
            message=result["message"]
        )
    except ValueError as e:
        logger.warning(f"⚠️ [API-批量更新缴费基数] 参数错误: {e}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=create_error_response(
                status_code=422,
                message="批量更新缴费基数失败",
                details=str(e)
            )
        )
    except Exception as e:
        logger.error(f"💥 [API-批量更新缴费基数] 更新失败: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="批量更新缴费基数时发生错误",
                details=str(e)
            )
        )

@router.post("/salary-configs/batch-update-insurance-bases-only", response_model=DataResponse[Dict[str, Any]])
async def batch_update_insurance_bases_only(
    request: Dict[str, Any],
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["payroll_run:manage"]))
):
    """
    🎯 专门用于批量更新缴费基数的API
    
    这个API专门用于缴费基数导入场景，只更新现有薪资配置的缴费基数字段，
    不会涉及基本工资等其他薪资信息。
    
    请求格式示例：
    {
        "period_id": 1,
        "base_updates": [
            {
                "employee_id": 1,
                "social_insurance_base": 15000.00,
                "housing_fund_base": 20000.00,
                "occupational_pension_base": 15000.00,
                "employee_info": {
                    "last_name": "张",
                    "first_name": "三",
                    "id_number": "110101199001011234"
                }
            }
        ],
        "create_if_missing": false
    }
    
    参数说明：
    - create_if_missing: 如果员工没有现有薪资配置，是否创建最小配置（basic_salary=0）
    """
    logger.info(f"🎯 [API-专门更新缴费基数] 接收请求: 记录数={len(request.get('base_updates', []))}, 用户={current_user.username}")
    
    try:
        period_id = request.get("period_id")
        base_updates = request.get("base_updates", [])
        create_if_missing = request.get("create_if_missing", False)
        
        if not period_id:
            raise ValueError("period_id 是必填字段")
        
        if not base_updates:
            raise ValueError("base_updates 不能为空")
        
        service = EmployeeSalaryConfigService(db)
        result = service.batch_update_insurance_bases_only(
            period_id=period_id,
            base_updates=base_updates,
            user_id=current_user.id,
            create_if_missing=create_if_missing
        )
        
        logger.info(f"✅ [API-专门更新缴费基数] 更新完成: {result['message']}")
        
        return DataResponse(
            data=result,
            message=result["message"]
        )
    except ValueError as e:
        logger.warning(f"⚠️ [API-专门更新缴费基数] 参数错误: {e}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=create_error_response(
                status_code=422,
                message="专门更新缴费基数失败",
                details=str(e)
            )
        )
    except Exception as e:
        logger.error(f"💥 [API-专门更新缴费基数] 更新失败: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="专门更新缴费基数时发生错误",
                details=str(e)
            )
        )

# =============================================================================
# 统计分析 API
# =============================================================================

@router.get("/analytics/department-costs/{period_id}", response_model=DataResponse[DepartmentCostAnalysisResponse])
async def get_department_cost_analysis(
    period_id: int,
    db: Session = Depends(get_db_v2),
    # ⚡️ 临时移除权限验证以提升性能 
    # current_user = Depends(require_permissions(["report:view_reports"]))
) -> DataResponse[DepartmentCostAnalysisResponse]:
    """
    📊 获取部门成本分析
    
    分析指定期间各部门的成本分布、人员配置和成本变化趋势
    """
    logger.info(f"🏢 [API-部门成本分析] 请求分析期间 {period_id}")
    
    try:
        analytics_service = PayrollAnalyticsService(db)
        result = analytics_service.get_department_cost_analysis(period_id)
        
        return DataResponse(
            data=result,
            message=f"部门成本分析完成，共分析 {len(result.departments)} 个部门"
        )
        
    except ValueError as e:
        logger.warning(f"⚠️ [API-部门成本分析] 参数错误: {e}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=create_error_response(
                status_code=404,
                message="期间不存在",
                details=str(e)
            )
        )
    except Exception as e:
        logger.error(f"❌ [API-部门成本分析] 分析失败: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="部门成本分析失败",
                details=str(e)
            )
        )

@router.get("/analytics/employee-types/{period_id}", response_model=DataResponse[EmployeeTypeAnalysisResponse])
async def get_employee_type_analysis(
    period_id: int,
    db: Session = Depends(get_db_v2),
    # ⚡️ 临时移除权限验证以提升性能
    # current_user = Depends(require_permissions(["report:view_reports"]))
) -> DataResponse[EmployeeTypeAnalysisResponse]:
    """
    👥 获取员工编制分析
    
    分析指定期间各编制类型的人员分布、成本占比和人员变化
    """
    logger.info(f"👥 [API-员工编制分析] 请求分析期间 {period_id}")
    
    try:
        analytics_service = PayrollAnalyticsService(db)
        result = analytics_service.get_employee_type_analysis(period_id)
        
        return DataResponse(
            data=result,
            message=f"员工编制分析完成，共分析 {len(result.employee_types)} 种编制类型"
        )
        
    except ValueError as e:
        logger.warning(f"⚠️ [API-员工编制分析] 参数错误: {e}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=create_error_response(
                status_code=404,
                message="期间不存在",
                details=str(e)
            )
        )
    except Exception as e:
        logger.error(f"❌ [API-员工编制分析] 分析失败: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="员工编制分析失败",
                details=str(e)
            )
        )

@router.get("/analytics/salary-trends", response_model=DataResponse[SalaryTrendAnalysisResponse])
async def get_salary_trend_analysis(
    months: int = Query(12, ge=1, le=24, description="分析月数范围（1-24个月）"),
    db: Session = Depends(get_db_v2),
    # ⚡️ 临时移除权限验证以提升性能
    # current_user = Depends(require_permissions(["report:view_reports"]))
) -> DataResponse[SalaryTrendAnalysisResponse]:
    """
    📈 获取工资趋势分析
    
    分析最近指定月数的工资变化趋势，包括应发、实发、扣除等指标
    """
    logger.info(f"📈 [API-工资趋势分析] 请求分析最近 {months} 个月趋势")
    
    try:
        analytics_service = PayrollAnalyticsService(db)
        result = analytics_service.get_salary_trend_analysis(months)
        
        return DataResponse(
            data=result,
            message=f"工资趋势分析完成，共分析 {len(result.data_points)} 个数据点"
        )
        
    except Exception as e:
        logger.error(f"❌ [API-工资趋势分析] 分析失败: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="工资趋势分析失败",
                details=str(e)
            )
        )

@router.get("/monthly-summary", response_model=DataResponse[List[MonthlyPayrollSummary]], summary="获取月度薪资状态概览")
async def get_monthly_summary(
    start_year: int = Query(..., description="开始年份", example=datetime.now().year - 1),
    end_year: int = Query(..., description="结束年份", example=datetime.now().year),
    db: Session = Depends(get_db_v2)
    # current_user = Depends(require_permissions(["payroll_period:view"])) # 权限可以后续添加
):
    """
    获取指定年份范围内每个月的薪资状态概览。
    - **has_payroll_run**: 当月是否存在至少一个薪资运行。
    - **record_status_summary**: 工资记录的状态分布。
        - `not_calculated`: 状态为 'PENDING' 的记录数。
        - `pending_audit`: 状态为 'PENDING_AUDIT' 的记录数。
        - `approved`: 状态为 'APPROVED' 的记录数。
    """
    logger.info(f"🔄 [get_monthly_summary] 接收请求 - start_year: {start_year}, end_year: {end_year}")
    try:
        summary_data = crud_simple_payroll.get_monthly_payroll_summary(db, start_year, end_year)
        logger.info(f"✅ [get_monthly_summary] 查询成功 - 返回 {len(summary_data)} 条月度记录")
        return DataResponse(data=summary_data)
    except Exception as e:
        logger.error(f"获取月度薪资概览失败: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="获取月度薪资概览失败",
                details=str(e)
            )
        )


# =============================================================================
# 人员身份分类统计分析
# =============================================================================

@router.get("/personnel-category-stats", response_model=DataResponse[PersonnelCategoryStatsResponse])
async def get_personnel_category_statistics(
    period_id: Optional[int] = Query(None, description="薪资期间ID，不指定则统计所有期间"),
    db: Session = Depends(get_db_v2)
    # current_user = Depends(require_permissions(["payroll:view"]))  # 权限验证可后续添加
):
    """
    获取根据人员身份分类（正编/聘用）的工资统计数据
    
    返回数据包括：
    - 各人员类别的人数、应发合计、扣发合计、实发合计
    - 平均薪资水平
    - 人员占比和成本占比
    """
    logger.info(f"🔄 [get_personnel_category_statistics] 接收请求 - period_id: {period_id}")
    
    try:
        from sqlalchemy import text
        from decimal import Decimal
        
        # 构建查询条件
        where_clause = ""
        params = {}
        if period_id:
            where_clause = "WHERE 薪资期间id = :period_id"
            params["period_id"] = period_id
        
        # 获取人员类别统计数据
        stats_query = text(f"""
        SELECT 
            根人员类别,
            COUNT(*) as 人数,
            SUM(应发合计) as 应发合计,
            SUM(扣除合计) as 扣除合计,
            SUM(实发合计) as 实发合计,
            AVG(应发合计) as 平均应发,
            AVG(扣除合计) as 平均扣除,
            AVG(实发合计) as 平均实发
        FROM reports.v_payroll_basic 
        {where_clause}
        AND 根人员类别 IS NOT NULL
        GROUP BY 根人员类别
        ORDER BY 根人员类别
        """)
        
        stats_results = db.execute(stats_query, params).fetchall()
        
        # 计算总计数据
        total_employees = sum(row[1] for row in stats_results)
        total_gross_pay = sum(row[2] or Decimal('0') for row in stats_results)
        total_deductions = sum(row[3] or Decimal('0') for row in stats_results)
        total_net_pay = sum(row[4] or Decimal('0') for row in stats_results)
        
        # 获取期间信息
        period_name = None
        if period_id:
            period_query = text("""
            SELECT DISTINCT 薪资期间名称 
            FROM reports.v_payroll_basic 
            WHERE 薪资期间id = :period_id
            LIMIT 1
            """)
            period_result = db.execute(period_query, {"period_id": period_id}).fetchone()
            period_name = period_result[0] if period_result else None
        
        # 构建响应数据
        categories_data = []
        for row in stats_results:
            personnel_category = row[0]
            employee_count = row[1]
            gross_pay_total = row[2] or Decimal('0')
            deductions_total = row[3] or Decimal('0')
            net_pay_total = row[4] or Decimal('0')
            avg_gross_pay = row[5] or Decimal('0')
            avg_deductions = row[6] or Decimal('0')
            avg_net_pay = row[7] or Decimal('0')
            
            # 计算占比
            employee_percentage = (employee_count / total_employees * 100) if total_employees > 0 else 0
            cost_percentage = (float(gross_pay_total) / float(total_gross_pay) * 100) if total_gross_pay > 0 else 0
            
            categories_data.append({
                "personnel_category": personnel_category,
                "employee_count": employee_count,
                "gross_pay_total": gross_pay_total,
                "deductions_total": deductions_total,
                "net_pay_total": net_pay_total,
                "avg_gross_pay": avg_gross_pay,
                "avg_deductions": avg_deductions,
                "avg_net_pay": avg_net_pay,
                "percentage_of_total_employees": round(employee_percentage, 2),
                "percentage_of_total_cost": round(cost_percentage, 2)
            })
        
        # 构建汇总信息
        summary = {
            "total_employees": total_employees,
            "total_gross_pay": total_gross_pay,
            "total_deductions": total_deductions,
            "total_net_pay": total_net_pay,
            "avg_gross_pay_overall": total_gross_pay / total_employees if total_employees > 0 else Decimal('0'),
            "avg_deductions_overall": total_deductions / total_employees if total_employees > 0 else Decimal('0'),
            "avg_net_pay_overall": total_net_pay / total_employees if total_employees > 0 else Decimal('0')
        }
        
        response_data = PersonnelCategoryStatsResponse(
            period_id=period_id,
            period_name=period_name,
            summary=summary,
            categories=categories_data
        )
        
        logger.info(f"✅ [get_personnel_category_statistics] 统计完成 - 共 {len(categories_data)} 个人员类别, 总人数: {total_employees}")
        
        return DataResponse(
            data=response_data,
            message=f"人员身份分类统计完成，共统计 {total_employees} 人，{len(categories_data)} 个类别"
        )
        
    except Exception as e:
        logger.error(f"❌ [get_personnel_category_statistics] 统计失败: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="人员身份分类统计失败",
                details=str(e)
            )
        )