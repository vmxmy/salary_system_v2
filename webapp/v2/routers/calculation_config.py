"""
薪资计算配置路由
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from ..database import get_db_v2
from ...auth import get_current_user
from ..models.payroll_config import SocialInsuranceConfig, TaxConfig

router = APIRouter(prefix="/payroll/calculation-config", tags=["计算配置管理"])


@router.get("/social-insurance-comprehensive", response_model=List[dict])
async def get_comprehensive_social_insurance_configs(
    region_code: Optional[str] = Query(None, description="地区代码"),
    is_active: Optional[bool] = Query(None, description="是否启用"),
    db: Session = Depends(get_db_v2),
    current_user = Depends(get_current_user)
):
    """获取综合社保配置列表（按配置组合返回）"""
    try:
        query = db.query(SocialInsuranceConfig)

        if region_code:
            query = query.filter(SocialInsuranceConfig.region_code == region_code)

        if is_active is not None:
            query = query.filter(SocialInsuranceConfig.is_active == is_active)

        configs = query.order_by(SocialInsuranceConfig.created_at.desc()).all()

        # 按配置名称和地区分组
        grouped_configs = {}
        for config in configs:
            key = f"{config.config_name}_{config.region_code or 'default'}"
            if key not in grouped_configs:
                grouped_configs[key] = {
                    "id": config.id,  # 使用第一个配置的ID作为组ID
                    "name": config.config_name,
                    "region": config.region_code or "",
                    "effective_date": config.effective_date.isoformat(),
                    "expiry_date": config.end_date.isoformat() if config.end_date else None,
                    "base_calculation_method": config.base_calculation_method,
                    "is_active": config.is_active,
                    "created_at": config.created_at.isoformat(),
                    "updated_at": config.updated_at.isoformat() if config.updated_at else None,
                    # 初始化所有费率为0
                    "pension_employee_rate": 0.0,
                    "pension_employer_rate": 0.0,
                    "occupational_pension_employee_rate": 0.0,
                    "occupational_pension_employer_rate": 0.0,
                    "medical_employee_rate": 0.0,
                    "medical_employer_rate": 0.0,
                    "serious_illness_employee_rate": 0.0,
                    "serious_illness_employer_rate": 0.0,
                    "unemployment_employee_rate": 0.0,
                    "unemployment_employer_rate": 0.0,
                    "injury_employer_rate": 0.0,
                    "maternity_employer_rate": 0.0,
                    "housing_fund_employee_rate": 0.0,
                    "housing_fund_employer_rate": 0.0,
                    # 初始化基数上下限
                    "pension_base_min": 0.0,
                    "pension_base_max": 0.0,
                    "medical_base_min": 0.0,
                    "medical_base_max": 0.0,
                    "unemployment_base_min": 0.0,
                    "unemployment_base_max": 0.0,
                    "housing_fund_base_min": 0.0,
                    "housing_fund_base_max": 0.0,
                }

            # 根据保险类型设置对应的费率
            if config.insurance_type == "PENSION":
                grouped_configs[key]["pension_employee_rate"] = float(config.employee_rate)
                grouped_configs[key]["pension_employer_rate"] = float(config.employer_rate)
                grouped_configs[key]["pension_base_min"] = float(config.min_base) if config.min_base else 0.0
                grouped_configs[key]["pension_base_max"] = float(config.max_base) if config.max_base else 0.0
            elif config.insurance_type == "OCCUPATIONAL_PENSION":
                grouped_configs[key]["occupational_pension_employee_rate"] = float(config.employee_rate)
                grouped_configs[key]["occupational_pension_employer_rate"] = float(config.employer_rate)
            elif config.insurance_type == "MEDICAL":
                grouped_configs[key]["medical_employee_rate"] = float(config.employee_rate)
                grouped_configs[key]["medical_employer_rate"] = float(config.employer_rate)
                grouped_configs[key]["medical_base_min"] = float(config.min_base) if config.min_base else 0.0
                grouped_configs[key]["medical_base_max"] = float(config.max_base) if config.max_base else 0.0
            elif config.insurance_type == "SERIOUS_ILLNESS":
                grouped_configs[key]["serious_illness_employee_rate"] = float(config.employee_rate)
                grouped_configs[key]["serious_illness_employer_rate"] = float(config.employer_rate)
            elif config.insurance_type == "UNEMPLOYMENT":
                grouped_configs[key]["unemployment_employee_rate"] = float(config.employee_rate)
                grouped_configs[key]["unemployment_employer_rate"] = float(config.employer_rate)
                grouped_configs[key]["unemployment_base_min"] = float(config.min_base) if config.min_base else 0.0
                grouped_configs[key]["unemployment_base_max"] = float(config.max_base) if config.max_base else 0.0
            elif config.insurance_type == "INJURY":
                grouped_configs[key]["injury_employer_rate"] = float(config.employer_rate)
            elif config.insurance_type == "MATERNITY":
                grouped_configs[key]["maternity_employer_rate"] = float(config.employer_rate)
            elif config.insurance_type == "HOUSING_FUND":
                grouped_configs[key]["housing_fund_employee_rate"] = float(config.employee_rate)
                grouped_configs[key]["housing_fund_employer_rate"] = float(config.employer_rate)
                grouped_configs[key]["housing_fund_base_min"] = float(config.min_base) if config.min_base else 0.0
                grouped_configs[key]["housing_fund_base_max"] = float(config.max_base) if config.max_base else 0.0

        return list(grouped_configs.values())

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取综合社保配置失败: {str(e)}")


@router.post("/social-insurance-comprehensive")
async def create_comprehensive_social_insurance_config(
    request: dict,
    db: Session = Depends(get_db_v2),
    current_user = Depends(get_current_user)
):
    """创建综合社保配置（创建多个保险类型的配置）"""
    try:
        created_configs = []
        
        # 定义保险类型映射
        insurance_types = [
            ("PENSION", "pension_employee_rate", "pension_employer_rate", "pension_base_min", "pension_base_max"),
            ("OCCUPATIONAL_PENSION", "occupational_pension_employee_rate", "occupational_pension_employer_rate", None, None),
            ("MEDICAL", "medical_employee_rate", "medical_employer_rate", "medical_base_min", "medical_base_max"),
            ("SERIOUS_ILLNESS", "serious_illness_employee_rate", "serious_illness_employer_rate", None, None),
            ("UNEMPLOYMENT", "unemployment_employee_rate", "unemployment_employer_rate", "unemployment_base_min", "unemployment_base_max"),
            ("INJURY", None, "injury_employer_rate", None, None),
            ("MATERNITY", None, "maternity_employer_rate", None, None),
            ("HOUSING_FUND", "housing_fund_employee_rate", "housing_fund_employer_rate", "housing_fund_base_min", "housing_fund_base_max"),
        ]

        for insurance_type, employee_rate_key, employer_rate_key, min_base_key, max_base_key in insurance_types:
            employee_rate = request.get(employee_rate_key, 0.0) if employee_rate_key else 0.0
            employer_rate = request.get(employer_rate_key, 0.0)
            min_base = request.get(min_base_key) if min_base_key else None
            max_base = request.get(max_base_key) if max_base_key else None

            # 只有当费率大于0时才创建配置
            if employer_rate > 0 or employee_rate > 0:
                config = SocialInsuranceConfig(
                    config_name=request["name"],
                    insurance_type=insurance_type,
                    employee_rate=employee_rate,
                    employer_rate=employer_rate,
                    base_calculation_method=request["base_calculation_method"],
                    min_base=min_base,
                    max_base=max_base,
                    region_code=request.get("region"),
                    is_active=True,
                    effective_date=datetime.strptime(request["effective_date"], "%Y-%m-%d").date(),
                    end_date=datetime.strptime(request["expiry_date"], "%Y-%m-%d").date() if request.get("expiry_date") else None
                )

                db.add(config)
                created_configs.append(config)

        db.commit()

        return {"message": f"成功创建 {len(created_configs)} 个社保配置", "count": len(created_configs)}

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"创建综合社保配置失败: {str(e)}")


@router.put("/social-insurance-comprehensive/{config_id}")
async def update_comprehensive_social_insurance_config(
    config_id: int,
    request: dict,
    db: Session = Depends(get_db_v2),
    current_user = Depends(get_current_user)
):
    """更新综合社保配置"""
    try:
        # 先删除该配置名称和地区的所有现有配置
        existing_configs = db.query(SocialInsuranceConfig).filter(
            SocialInsuranceConfig.config_name == request["name"],
            SocialInsuranceConfig.region_code == request.get("region")
        ).all()

        for config in existing_configs:
            db.delete(config)
        
        # 🎯 立即刷新删除操作，确保在创建新配置前删除已生效
        db.flush()

        # 重新创建配置
        created_configs = []
        
        insurance_types = [
            ("PENSION", "pension_employee_rate", "pension_employer_rate", "pension_base_min", "pension_base_max"),
            ("OCCUPATIONAL_PENSION", "occupational_pension_employee_rate", "occupational_pension_employer_rate", None, None),
            ("MEDICAL", "medical_employee_rate", "medical_employer_rate", "medical_base_min", "medical_base_max"),
            ("SERIOUS_ILLNESS", "serious_illness_employee_rate", "serious_illness_employer_rate", None, None),
            ("UNEMPLOYMENT", "unemployment_employee_rate", "unemployment_employer_rate", "unemployment_base_min", "unemployment_base_max"),
            ("INJURY", None, "injury_employer_rate", None, None),
            ("MATERNITY", None, "maternity_employer_rate", None, None),
            ("HOUSING_FUND", "housing_fund_employee_rate", "housing_fund_employer_rate", "housing_fund_base_min", "housing_fund_base_max"),
        ]

        for insurance_type, employee_rate_key, employer_rate_key, min_base_key, max_base_key in insurance_types:
            employee_rate = request.get(employee_rate_key, 0.0) if employee_rate_key else 0.0
            employer_rate = request.get(employer_rate_key, 0.0)
            min_base = request.get(min_base_key) if min_base_key else None
            max_base = request.get(max_base_key) if max_base_key else None

            if employer_rate > 0 or employee_rate > 0:
                config = SocialInsuranceConfig(
                    config_name=request["name"],
                    insurance_type=insurance_type,
                    employee_rate=employee_rate,
                    employer_rate=employer_rate,
                    base_calculation_method=request["base_calculation_method"],
                    min_base=min_base,
                    max_base=max_base,
                    region_code=request.get("region"),
                    is_active=True,
                    effective_date=datetime.strptime(request["effective_date"], "%Y-%m-%d").date(),
                    end_date=datetime.strptime(request["expiry_date"], "%Y-%m-%d").date() if request.get("expiry_date") else None
                )

                db.add(config)
                created_configs.append(config)

        db.commit()

        return {"message": f"成功更新 {len(created_configs)} 个社保配置", "count": len(created_configs)}

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"更新综合社保配置失败: {str(e)}")


# 税务配置相关端点
@router.get("/tax-configs", response_model=List[dict])
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

        # 转换为前端需要的格式
        result = []
        for config in configs:
            result.append({
                "id": config.id,
                "name": config.config_name,
                "tax_type": config.tax_type,
                "tax_year": 2025,  # 默认年份，可以根据需要调整
                "effective_date": config.effective_date.isoformat(),
                "expiry_date": config.end_date.isoformat() if config.end_date else None,
                "tax_brackets": config.tax_brackets,
                "standard_deduction": float(config.basic_deduction),
                "additional_deduction_child": 1000.0,  # 默认值，可以从配置中读取
                "additional_deduction_elderly": 2000.0,
                "additional_deduction_education": 400.0,
                "additional_deduction_housing": 1000.0,
                "additional_deduction_medical": 0.0,
                "region_code": config.region_code or "",
                "calculation_method": config.calculation_method,
                "additional_config": config.additional_config,
                "is_active": config.is_active,
                "created_at": config.created_at.isoformat(),
                "updated_at": config.updated_at.isoformat() if config.updated_at else None,
            })

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取税务配置失败: {str(e)}")


@router.get("/rule-sets", response_model=List[dict])
async def get_rule_sets(
    db: Session = Depends(get_db_v2),
    current_user = Depends(get_current_user)
):
    """获取规则集配置 (返回空数组占位)"""
    # 暂时返回空数组占位
    # 后续需要实现实际逻辑
    return []

@router.get("/tax-configs/{config_id}", response_model=dict)
async def get_tax_config(
    config_id: int,
    db: Session = Depends(get_db_v2),
    current_user = Depends(get_current_user)
):
    """获取单个税务配置详情"""
    try:
        config = db.query(TaxConfig).filter(TaxConfig.id == config_id).first()
        
        if not config:
            raise HTTPException(status_code=404, detail="税务配置不存在")

        return {
            "id": config.id,
            "name": config.config_name,
            "tax_type": config.tax_type,
            "tax_year": 2025,
            "effective_date": config.effective_date.isoformat(),
            "expiry_date": config.end_date.isoformat() if config.end_date else None,
            "tax_brackets": config.tax_brackets,
            "standard_deduction": float(config.basic_deduction),
            "additional_deduction_child": 1000.0,
            "additional_deduction_elderly": 2000.0,
            "additional_deduction_education": 400.0,
            "additional_deduction_housing": 1000.0,
            "additional_deduction_medical": 0.0,
            "region_code": config.region_code or "",
            "calculation_method": config.calculation_method,
            "additional_config": config.additional_config,
            "is_active": config.is_active,
            "created_at": config.created_at.isoformat(),
            "updated_at": config.updated_at.isoformat() if config.updated_at else None,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取税务配置失败: {str(e)}")


@router.post("/tax-configs")
async def create_tax_config(
    request: dict,
    db: Session = Depends(get_db_v2),
    current_user = Depends(get_current_user)
):
    """创建税务配置"""
    try:
        config = TaxConfig(
            config_name=request["name"],
            tax_type=request.get("tax_type", "PERSONAL_INCOME"),
            basic_deduction=request["standard_deduction"],
            tax_brackets=request["tax_brackets"],
            calculation_method=request.get("calculation_method"),
            additional_config=request.get("additional_config"),
            region_code=request.get("region_code"),
            is_active=True,
            effective_date=datetime.strptime(request["effective_date"], "%Y-%m-%d").date(),
            end_date=datetime.strptime(request["expiry_date"], "%Y-%m-%d").date() if request.get("expiry_date") else None
        )

        db.add(config)
        db.commit()
        db.refresh(config)

        return {"message": "税务配置创建成功", "id": config.id}

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"创建税务配置失败: {str(e)}")


@router.put("/tax-configs/{config_id}")
async def update_tax_config(
    config_id: int,
    request: dict,
    db: Session = Depends(get_db_v2),
    current_user = Depends(get_current_user)
):
    """更新税务配置"""
    try:
        config = db.query(TaxConfig).filter(TaxConfig.id == config_id).first()
        
        if not config:
            raise HTTPException(status_code=404, detail="税务配置不存在")

        # 更新字段
        if "name" in request:
            config.config_name = request["name"]
        if "tax_type" in request:
            config.tax_type = request["tax_type"]
        if "standard_deduction" in request:
            config.basic_deduction = request["standard_deduction"]
        if "tax_brackets" in request:
            config.tax_brackets = request["tax_brackets"]
        if "calculation_method" in request:
            config.calculation_method = request["calculation_method"]
        if "additional_config" in request:
            config.additional_config = request["additional_config"]
        if "region_code" in request:
            config.region_code = request["region_code"]
        if "effective_date" in request:
            config.effective_date = datetime.strptime(request["effective_date"], "%Y-%m-%d").date()
        if "expiry_date" in request:
            config.end_date = datetime.strptime(request["expiry_date"], "%Y-%m-%d").date() if request["expiry_date"] else None
        if "is_active" in request:
            config.is_active = request["is_active"]

        config.updated_at = datetime.now()
        db.commit()

        return {"message": "税务配置更新成功"}

    except HTTPException:
        raise
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
        config = db.query(TaxConfig).filter(TaxConfig.id == config_id).first()
        
        if not config:
            raise HTTPException(status_code=404, detail="税务配置不存在")

        db.delete(config)
        db.commit()

        return {"message": "税务配置删除成功"}

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"删除税务配置失败: {str(e)}") 