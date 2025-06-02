"""
计算配置管理API路由
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import date, datetime # Import datetime

from ..database import get_db_v2
from webapp.auth import get_current_user
from ..pydantic_models.payroll_calculation import (
    CalculationConfigRequest,
    CalculationConfigResponse
)
from ..models import (
    CalculationRuleSet, CalculationRule, PayrollComponentConfig,
    SocialInsuranceConfig, TaxConfig
)

router = APIRouter(prefix="/payroll/calculation-config", tags=["计算配置管理"])


@router.get("/rule-sets", response_model=List[CalculationConfigResponse])
async def get_calculation_rule_sets(
    is_active: Optional[bool] = Query(None, description="是否启用"),
    is_default: Optional[bool] = Query(None, description="是否为默认规则集"),
    db: Session = Depends(get_db_v2),
    current_user = Depends(get_current_user)
):
    """获取计算规则集列表"""
    try:
        query = db.query(CalculationRuleSet)

        if is_active is not None:
            query = query.filter(CalculationRuleSet.is_active == is_active)

        if is_default is not None:
            query = query.filter(CalculationRuleSet.is_default == is_default)

        rule_sets = query.order_by(CalculationRuleSet.created_at.desc()).all()

        return [
            CalculationConfigResponse(
                id=rs.id,
                config_name=rs.rule_set_name,
                config_data={
                    "description": rs.description,
                    "version": rs.version,
                    "applicable_departments": rs.applicable_departments,
                    "applicable_positions": rs.applicable_positions,
                    "applicable_employee_types": rs.applicable_employee_types,
                    "calculation_order": rs.calculation_order,
                    "default_configs": rs.default_configs
                },
                is_active=rs.is_active,
                effective_date=rs.effective_date,
                end_date=rs.end_date,
                created_at=rs.created_at,
                updated_at=rs.updated_at
            )
            for rs in rule_sets
        ]

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取规则集失败: {str(e)}")


@router.get("/rule-sets/{rule_set_id}", response_model=CalculationConfigResponse)
async def get_calculation_rule_set(
    rule_set_id: int,
    db: Session = Depends(get_db_v2),
    current_user = Depends(get_current_user)
):
    """获取单个计算规则集"""
    try:
        rule_set = db.query(CalculationRuleSet).filter(
            CalculationRuleSet.id == rule_set_id
        ).first()

        if not rule_set:
            raise HTTPException(status_code=404, detail="规则集不存在")

        return CalculationConfigResponse(
            id=rule_set.id,
            config_name=rule_set.rule_set_name,
            config_data={
                "description": rule_set.description,
                "version": rule_set.version,
                "applicable_departments": rule_set.applicable_departments,
                "applicable_positions": rule_set.applicable_positions,
                "applicable_employee_types": rule_set.applicable_employee_types,
                "calculation_order": rule_set.calculation_order,
                "default_configs": rule_set.default_configs
            },
            is_active=rule_set.is_active,
            effective_date=rule_set.effective_date,
            end_date=rule_set.end_date,
            created_at=rule_set.created_at,
            updated_at=rule_set.updated_at
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取规则集失败: {str(e)}")


@router.post("/rule-sets", response_model=CalculationConfigResponse)
async def create_calculation_rule_set(
    request: CalculationConfigRequest,
    db: Session = Depends(get_db_v2),
    current_user = Depends(get_current_user)
):
    """创建计算规则集"""
    try:
        # 如果设置为默认规则集，需要先取消其他默认规则集
        if request.config_data.get("is_default", False):
            db.query(CalculationRuleSet).filter(
                CalculationRuleSet.is_default == True
            ).update({"is_default": False})

        rule_set = CalculationRuleSet(
            rule_set_name=request.config_name,
            description=request.config_data.get("description"),
            version=request.config_data.get("version", "1.0"),
            applicable_departments=request.applicable_departments,
            applicable_positions=request.applicable_positions,
            applicable_employee_types=request.config_data.get("applicable_employee_types"),
            calculation_order=request.config_data.get("calculation_order", []),
            default_configs=request.config_data.get("default_configs"),
            is_active=True,
            is_default=request.config_data.get("is_default", False),
            effective_date=request.effective_date,
            end_date=request.end_date
        )

        db.add(rule_set)
        db.commit()
        db.refresh(rule_set)

        return CalculationConfigResponse(
            id=rule_set.id,
            config_name=rule_set.rule_set_name,
            config_data=request.config_data,
            is_active=rule_set.is_active,
            effective_date=rule_set.effective_date,
            end_date=rule_set.end_date,
            created_at=rule_set.created_at,
            updated_at=rule_set.updated_at
        )

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"创建规则集失败: {str(e)}")

@router.put("/rule-sets/{rule_set_id}", response_model=CalculationConfigResponse)
async def update_calculation_rule_set(
    rule_set_id: int,
    request: CalculationConfigRequest,
    db: Session = Depends(get_db_v2),

    current_user = Depends(get_current_user)
):
    """更新计算规则集"""
    try:
        rule_set = db.query(CalculationRuleSet).filter(
            CalculationRuleSet.id == rule_set_id
        ).first()

        if not rule_set:
            raise HTTPException(status_code=404, detail="规则集不存在")

        # 如果设置为默认规则集，需要先取消其他默认规则集
        if request.config_data.get("is_default", False):
            db.query(CalculationRuleSet).filter(
                CalculationRuleSet.is_default == True
            ).update({"is_default": False})

        rule_set.rule_set_name = request.config_name
        rule_set.description = request.config_data.get("description")
        rule_set.version = request.config_data.get("version", "1.0")
        rule_set.applicable_departments = request.applicable_departments
        rule_set.applicable_positions = request.applicable_positions
        rule_set.applicable_employee_types = request.config_data.get("applicable_employee_types")
        rule_set.calculation_order = request.config_data.get("calculation_order", [])
        rule_set.default_configs = request.config_data.get("default_configs")
        rule_set.is_active = request.is_active # Allow updating active status
        rule_set.is_default = request.config_data.get("is_default", False)
        rule_set.effective_date = request.effective_date
        rule_set.end_date = request.end_date
        rule_set.updated_at = datetime.utcnow() # Update timestamp

        db.commit()
        db.refresh(rule_set)

        return CalculationConfigResponse(
            id=rule_set.id,
            config_name=rule_set.rule_set_name,
            config_data=request.config_data,
            is_active=rule_set.is_active,
            effective_date=rule_set.effective_date,
            end_date=rule_set.end_date,
            created_at=rule_set.created_at,
            updated_at=rule_set.updated_at
        )

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"更新规则集失败: {str(e)}")

@router.delete("/rule-sets/{rule_set_id}")
async def delete_calculation_rule_set(
    rule_set_id: int,
    db: Session = Depends(get_db_v2),

    current_user = Depends(get_current_user)
):
    """删除计算规则集"""
    try:
        rule_set = db.query(CalculationRuleSet).filter(
            CalculationRuleSet.id == rule_set_id
        ).first()

        if not rule_set:
            raise HTTPException(status_code=404, detail="规则集不存在")

        db.delete(rule_set)
        db.commit()

        return {"message": "规则集已删除"}

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"删除规则集失败: {str(e)}")


@router.get("/social-insurance", response_model=List[CalculationConfigResponse])
async def get_social_insurance_configs(
    insurance_type: Optional[str] = Query(None, description="保险类型"),
    region_code: Optional[str] = Query(None, description="地区代码"),
    is_active: Optional[bool] = Query(None, description="是否启用"),
    db: Session = Depends(get_db_v2),

    current_user = Depends(get_current_user)
):
    """获取社保配置列表"""
    try:
        query = db.query(SocialInsuranceConfig)

        if insurance_type:
            query = query.filter(SocialInsuranceConfig.insurance_type == insurance_type)

        if region_code:
            query = query.filter(SocialInsuranceConfig.region_code == region_code)

        if is_active is not None:
            query = query.filter(SocialInsuranceConfig.is_active == is_active)

        configs = query.order_by(SocialInsuranceConfig.created_at.desc()).all()

        return [
            CalculationConfigResponse(
                id=config.id,
                config_name=config.config_name,
                config_data={
                    "insurance_type": config.insurance_type,
                    "employee_rate": float(config.employee_rate),
                    "employer_rate": float(config.employer_rate),
                    "base_calculation_method": config.base_calculation_method,
                    "min_base": float(config.min_base) if config.min_base else None,
                    "max_base": float(config.max_base) if config.max_base else None,
                    "region_code": config.region_code
                },
                is_active=config.is_active,
                effective_date=config.effective_date,
                end_date=config.end_date,
                created_at=config.created_at,
                updated_at=config.updated_at
            )
            for config in configs
        ]

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取社保配置失败: {str(e)}")

@router.get("/social-insurance/{config_id}", response_model=CalculationConfigResponse)
async def get_social_insurance_config(
    config_id: int,
    db: Session = Depends(get_db_v2),

    current_user = Depends(get_current_user)
):
    """获取单个社保配置"""
    try:
        config = db.query(SocialInsuranceConfig).filter(
            SocialInsuranceConfig.id == config_id
        ).first()

        if not config:
            raise HTTPException(status_code=404, detail="社保配置不存在")

        return CalculationConfigResponse(
            id=config.id,
            config_name=config.config_name,
            config_data={
                "insurance_type": config.insurance_type,
                "employee_rate": float(config.employee_rate),
                "employer_rate": float(config.employer_rate),
                "base_calculation_method": config.base_calculation_method,
                "min_base": float(config.min_base) if config.min_base else None,
                "max_base": float(config.max_base) if config.max_base else None,
                "region_code": config.region_code
            },
            is_active=config.is_active,
            effective_date=config.effective_date,
            end_date=config.end_date,
            created_at=config.created_at,
            updated_at=config.updated_at
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取社保配置失败: {str(e)}")


@router.post("/social-insurance", response_model=CalculationConfigResponse)
async def create_social_insurance_config(
    request: CalculationConfigRequest,
    db: Session = Depends(get_db_v2),

    current_user = Depends(get_current_user)
):
    """创建社保配置"""
    try:
        config = SocialInsuranceConfig(
            config_name=request.config_name,
            insurance_type=request.config_data["insurance_type"],
            employee_rate=request.config_data["employee_rate"],
            employer_rate=request.config_data["employer_rate"],
            base_calculation_method=request.config_data["base_calculation_method"],
            min_base=request.config_data.get("min_base"),
            max_base=request.config_data.get("max_base"),
            region_code=request.config_data.get("region_code"),
            is_active=True,
            effective_date=request.effective_date,
            end_date=request.end_date
        )

        db.add(config)
        db.commit()
        db.refresh(config)

        return CalculationConfigResponse(
            id=config.id,
            config_name=config.config_name,
            config_data=request.config_data,
            is_active=config.is_active,
            effective_date=config.effective_date,
            end_date=config.end_date,
            created_at=config.created_at,
            updated_at=config.updated_at
        )

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"创建社保配置失败: {str(e)}")

@router.put("/social-insurance/{config_id}", response_model=CalculationConfigResponse)
async def update_social_insurance_config(
    config_id: int,
    request: CalculationConfigRequest,
    db: Session = Depends(get_db_v2),

    current_user = Depends(get_current_user)
):
    """更新社保配置"""
    try:
        config = db.query(SocialInsuranceConfig).filter(
            SocialInsuranceConfig.id == config_id
        ).first()

        if not config:
            raise HTTPException(status_code=404, detail="社保配置不存在")

        config.config_name = request.config_name
        config.insurance_type = request.config_data["insurance_type"]
        config.employee_rate = request.config_data["employee_rate"]
        config.employer_rate = request.config_data["employer_rate"]
        config.base_calculation_method = request.config_data["base_calculation_method"]
        config.min_base = request.config_data.get("min_base")
        config.max_base = request.config_data.get("max_base")
        config.region_code = request.config_data.get("region_code")
        config.is_active = request.is_active # Allow updating active status
        config.effective_date = request.effective_date
        config.end_date = request.end_date
        config.updated_at = datetime.utcnow() # Update timestamp

        db.commit()
        db.refresh(config)

        return CalculationConfigResponse(
            id=config.id,
            config_name=config.config_name,
            config_data=request.config_data,
            is_active=config.is_active,
            effective_date=config.effective_date,
            end_date=config.end_date,
            created_at=config.created_at,
            updated_at=config.updated_at
        )

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"更新社保配置失败: {str(e)}")

@router.delete("/social-insurance/{config_id}")
async def delete_social_insurance_config(
    config_id: int,
    db: Session = Depends(get_db_v2),

    current_user = Depends(get_current_user)
):
    """删除社保配置"""
    try:
        config = db.query(SocialInsuranceConfig).filter(
            SocialInsuranceConfig.id == config_id
        ).first()

        if not config:
            raise HTTPException(status_code=404, detail="社保配置不存在")

        db.delete(config)
        db.commit()

        return {"message": "社保配置已删除"}

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"删除社保配置失败: {str(e)}")

@router.put("/social-insurance", response_model=List[CalculationConfigResponse])
async def update_social_insurance_configs(
    requests: List[CalculationConfigRequest],
    db: Session = Depends(get_db_v2),

    current_user = Depends(get_current_user)
):
    """批量更新社保配置"""
    updated_configs = []
    try:
        for request in requests:
            config = db.query(SocialInsuranceConfig).filter(
                SocialInsuranceConfig.id == request.id # Assuming request includes ID for update
            ).first()

            if not config:
                # Optionally raise HTTPException or skip
                continue

            config.config_name = request.config_name
            config.insurance_type = request.config_data["insurance_type"]
            config.employee_rate = request.config_data["employee_rate"]
            config.employer_rate = request.config_data["employer_rate"]
            config.base_calculation_method = request.config_data["base_calculation_method"]
            config.min_base = request.config_data.get("min_base")
            config.max_base = request.config_data.get("max_base")
            config.region_code = request.config_data.get("region_code")
            config.is_active = request.is_active
            config.effective_date = request.effective_date
            config.end_date = request.end_date
            config.updated_at = datetime.utcnow()

            db.add(config)
            updated_configs.append(config)

        db.commit()
        for config in updated_configs:
            db.refresh(config)

        return [
            CalculationConfigResponse(
                id=config.id,
                config_name=config.config_name,
                config_data={
                    "insurance_type": config.insurance_type,
                    "employee_rate": float(config.employee_rate),
                    "employer_rate": float(config.employer_rate),
                    "base_calculation_method": config.base_calculation_method,
                    "min_base": float(config.min_base) if config.min_base else None,
                    "max_base": float(config.max_base) if config.max_base else None,
                    "region_code": config.region_code
                },
                is_active=config.is_active,
                effective_date=config.effective_date,
                end_date=config.end_date,
                created_at=config.created_at,
                updated_at=config.updated_at
            )
            for config in updated_configs
        ]

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"批量更新社保配置失败: {str(e)}")

@router.delete("/social-insurance")
async def delete_social_insurance_configs(
    config_ids: List[int] = Query(..., description="要删除的社保配置ID列表"),
    db: Session = Depends(get_db_v2),

    current_user = Depends(get_current_user)
):
    """批量删除社保配置"""
    try:
        deleted_count = db.query(SocialInsuranceConfig).filter(
            SocialInsuranceConfig.id.in_(config_ids)
        ).delete(synchronize_session=False)
        db.commit()

        return {"message": f"已删除 {deleted_count} 条社保配置"}

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"批量删除社保配置失败: {str(e)}")


@router.get("/tax-configs", response_model=List[CalculationConfigResponse])
async def get_tax_configs(
    tax_type: Optional[str] = Query(None, description="税种类型"),
    region_code: Optional[str] = Query(None, description="地区代码"),
    is_active: Optional[bool] = Query(None, description="是否启用"),
    db: Session = Depends(get_db_v2),

    current_user = Depends(get_current_user)
):
    """获取税务配置列表"""
    try:
        query = db.query(TaxConfig)

        if tax_type:
            query = query.filter(TaxConfig.tax_type == tax_type)

        if region_code:
            query = query.filter(TaxConfig.region_code == region_code)

        if is_active is not None:
            query = query.filter(TaxConfig.is_active == is_active)

        configs = query.order_by(TaxConfig.created_at.desc()).all()

        return [
            CalculationConfigResponse(
                id=config.id,
                config_name=config.config_name,
                config_data={
                    "tax_type": config.tax_type,
                    "basic_deduction": float(config.basic_deduction),
                    "tax_brackets": config.tax_brackets,
                    "calculation_method": config.calculation_method,
                    "additional_config": config.additional_config,
                    "region_code": config.region_code
                },
                is_active=config.is_active,
                effective_date=config.effective_date,
                end_date=config.end_date,
                created_at=config.created_at,
                updated_at=config.updated_at
            )
            for config in configs
        ]

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取税务配置失败: {str(e)}")

@router.get("/tax-configs/{config_id}", response_model=CalculationConfigResponse)
async def get_tax_config(
    config_id: int,
    db: Session = Depends(get_db_v2),

    current_user = Depends(get_current_user)
):
    """获取单个税务配置"""
    try:
        config = db.query(TaxConfig).filter(
            TaxConfig.id == config_id
        ).first()

        if not config:
            raise HTTPException(status_code=404, detail="税务配置不存在")

        return CalculationConfigResponse(
            id=config.id,
            config_name=config.config_name,
            config_data={
                "tax_type": config.tax_type,
                "basic_deduction": float(config.basic_deduction),
                "tax_brackets": config.tax_brackets,
                "calculation_method": config.calculation_method,
                "additional_config": config.additional_config,
                "region_code": config.region_code
            },
            is_active=config.is_active,
            effective_date=config.effective_date,
            end_date=config.end_date,
            created_at=config.created_at,
            updated_at=config.updated_at
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取税务配置失败: {str(e)}")


@router.post("/tax-configs", response_model=CalculationConfigResponse)
async def create_tax_config(
    request: CalculationConfigRequest,
    db: Session = Depends(get_db_v2),

    current_user = Depends(get_current_user)
):
    """创建税务配置"""
    try:
        config = TaxConfig(
            config_name=request.config_name,
            tax_type=request.config_data["tax_type"],
            basic_deduction=request.config_data["basic_deduction"],
            tax_brackets=request.config_data["tax_brackets"],
            calculation_method=request.config_data.get("calculation_method"),
            additional_config=request.config_data.get("additional_config"),
            region_code=request.config_data.get("region_code"),
            is_active=True,
            effective_date=request.effective_date,
            end_date=request.end_date
        )

        db.add(config)
        db.commit()
        db.refresh(config)

        return CalculationConfigResponse(
            id=config.id,
            config_name=config.config_name,
            config_data=request.config_data,
            is_active=config.is_active,
            effective_date=config.effective_date,
            end_date=config.end_date,
            created_at=config.created_at,
            updated_at=config.updated_at
        )

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"创建税务配置失败: {str(e)}")

@router.put("/tax-configs/{config_id}", response_model=CalculationConfigResponse)
async def update_tax_config(
    config_id: int,
    request: CalculationConfigRequest,
    db: Session = Depends(get_db_v2),

    current_user = Depends(get_current_user)
):
    """更新税务配置"""
    try:
        config = db.query(TaxConfig).filter(
            TaxConfig.id == config_id
        ).first()

        if not config:
            raise HTTPException(status_code=404, detail="税务配置不存在")

        config.config_name = request.config_name
        config.tax_type = request.config_data["tax_type"]
        config.basic_deduction = request.config_data["basic_deduction"]
        config.tax_brackets = request.config_data["tax_brackets"]
        config.calculation_method = request.config_data.get("calculation_method")
        config.additional_config = request.config_data.get("additional_config")
        config.region_code = request.config_data.get("region_code")
        config.is_active = request.is_active # Allow updating active status
        config.effective_date = request.effective_date
        config.end_date = request.end_date
        config.updated_at = datetime.utcnow() # Update timestamp

        db.commit()
        db.refresh(config)

        return CalculationConfigResponse(
            id=config.id,
            config_name=config.config_name,
            config_data=request.config_data,
            is_active=config.is_active,
            effective_date=config.effective_date,
            end_date=config.end_date,
            created_at=config.created_at,
            updated_at=config.updated_at
        )

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"更新税务配置失败: {str(e)}")

@router.delete("/tax-configs/{config_id}")
async def delete_tax_config(
    config_id: int,
    db: Session = Depends(get_db_v2),

    current_user = Depends(get_current_user)
):
    """删除税务配置"""
    try:
        config = db.query(TaxConfig).filter(
            TaxConfig.id == config_id
        ).first()

        if not config:
            raise HTTPException(status_code=404, detail="税务配置不存在")

        db.delete(config)
        db.commit()

        return {"message": "税务配置已删除"}

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"删除税务配置失败: {str(e)}")

@router.put("/tax-configs", response_model=List[CalculationConfigResponse])
async def update_tax_configs(
    requests: List[CalculationConfigRequest],
    db: Session = Depends(get_db_v2),

    current_user = Depends(get_current_user)
):
    """批量更新税务配置"""
    updated_configs = []
    try:
        for request in requests:
            config = db.query(TaxConfig).filter(
                TaxConfig.id == request.id # Assuming request includes ID for update
            ).first()

            if not config:
                # Optionally raise HTTPException or skip
                continue

            config.config_name = request.config_name
            config.tax_type = request.config_data["tax_type"]
            config.basic_deduction = request.config_data["basic_deduction"]
            config.tax_brackets = request.config_data["tax_brackets"]
            config.calculation_method = request.config_data.get("calculation_method")
            config.additional_config = request.config_data.get("additional_config")
            config.region_code = request.config_data.get("region_code")
            config.is_active = request.is_active
            config.effective_date = request.effective_date
            config.end_date = request.end_date
            config.updated_at = datetime.utcnow()

            db.add(config)
            updated_configs.append(config)

        db.commit()
        for config in updated_configs:
            db.refresh(config)

        return [
            CalculationConfigResponse(
                id=config.id,
                config_name=config.config_name,
                config_data={
                    "tax_type": config.tax_type,
                    "basic_deduction": float(config.basic_deduction),
                    "tax_brackets": config.tax_brackets,
                    "calculation_method": config.calculation_method,
                    "additional_config": config.additional_config,
                    "region_code": config.region_code
                },
                is_active=config.is_active,
                effective_date=config.effective_date,
                end_date=config.end_date,
                created_at=config.created_at,
                updated_at=config.updated_at
            )
            for config in updated_configs
        ]

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"批量更新税务配置失败: {str(e)}")

@router.delete("/tax-configs")
async def delete_tax_configs(
    config_ids: List[int] = Query(..., description="要删除的税务配置ID列表"),
    db: Session = Depends(get_db_v2),

    current_user = Depends(get_current_user)
):
    """批量删除税务配置"""
    try:
        deleted_count = db.query(TaxConfig).filter(
            TaxConfig.id.in_(config_ids)
        ).delete(synchronize_session=False)
        db.commit()

        return {"message": f"已删除 {deleted_count} 条税务配置"}

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"批量删除税务配置失败: {str(e)}")

@router.put("/rule-sets/{rule_set_id}/activate")
async def activate_rule_set(
    rule_set_id: int,
    db: Session = Depends(get_db_v2),

    current_user = Depends(get_current_user)
):
    """激活规则集"""
    try:
        rule_set = db.query(CalculationRuleSet).filter(
            CalculationRuleSet.id == rule_set_id
        ).first()

        if not rule_set:
            raise HTTPException(status_code=404, detail="规则集不存在")

        rule_set.is_active = True
        db.commit()

        return {"message": "规则集已激活"}

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"激活规则集失败: {str(e)}")


@router.put("/rule-sets/{rule_set_id}/deactivate")
async def deactivate_rule_set(
    rule_set_id: int,
    db: Session = Depends(get_db_v2),

    current_user = Depends(get_current_user)
):
    """停用规则集"""
    try:
        rule_set = db.query(CalculationRuleSet).filter(
            CalculationRuleSet.id == rule_set_id
        ).first()

        if not rule_set:
            raise HTTPException(status_code=404, detail="规则集不存在")

        rule_set.is_active = False
        db.commit()

        return {"message": "规则集已停用"}

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"停用规则集失败: {str(e)}")