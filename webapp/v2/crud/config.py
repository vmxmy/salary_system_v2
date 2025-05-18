"""
配置相关的CRUD操作。
"""
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional, Tuple, Dict, Any
from datetime import date
from sqlalchemy.orm import selectinload

from ..models.config import LookupType, LookupValue, SystemParameter, PayrollComponentDefinition, TaxBracket, SocialSecurityRate
from ..pydantic_models.config import (
    LookupTypeCreate, LookupTypeUpdate, LookupValueCreate, LookupValueUpdate,
    SystemParameterCreate, SystemParameterUpdate,
    PayrollComponentDefinitionCreate, PayrollComponentDefinitionUpdate,
    TaxBracketCreate, TaxBracketUpdate,
    SocialSecurityRateCreate, SocialSecurityRateUpdate
)

# LookupType CRUD
def get_lookup_types(
    db: Session,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
) -> Tuple[List[LookupType], int]:
    """
    获取查找类型列表。

    Args:
        db: 数据库会话
        search: 搜索关键字
        skip: 跳过的记录数
        limit: 返回的记录数

    Returns:
        查找类型列表和总记录数
    """
    query = db.query(LookupType)

    # 应用搜索过滤
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (LookupType.code.ilike(search_term)) |
            (LookupType.name.ilike(search_term)) |
            (LookupType.description.ilike(search_term))
        )

    # 获取总记录数
    total = query.count()

    # 应用分页
    query = query.offset(skip).limit(limit)

    return query.all(), total


def get_lookup_type(db: Session, lookup_type_id: int) -> Optional[LookupType]:
    """
    根据ID获取查找类型。

    Args:
        db: 数据库会话
        lookup_type_id: 查找类型ID

    Returns:
        查找类型对象，如果不存在则返回None
    """
    return db.query(LookupType).filter(LookupType.id == lookup_type_id).first()


def get_lookup_type_by_code(db: Session, code: str) -> Optional[LookupType]:
    """
    根据代码获取查找类型。

    Args:
        db: 数据库会话
        code: 查找类型代码

    Returns:
        查找类型对象，如果不存在则返回None
    """
    return db.query(LookupType).filter(LookupType.code == code).first()


def create_lookup_type(db: Session, lookup_type: LookupTypeCreate) -> LookupType:
    """
    创建查找类型。

    Args:
        db: 数据库会话
        lookup_type: 查找类型创建模型

    Returns:
        创建的查找类型对象
    """
    # 检查代码是否已存在
    existing = get_lookup_type_by_code(db, lookup_type.code)
    if existing:
        raise ValueError(f"Lookup type with code '{lookup_type.code}' already exists")

    # 创建新的查找类型
    db_lookup_type = LookupType(**lookup_type.model_dump())
    db.add(db_lookup_type)
    db.commit()
    db.refresh(db_lookup_type)
    return db_lookup_type


def update_lookup_type(db: Session, lookup_type_id: int, lookup_type: LookupTypeUpdate) -> Optional[LookupType]:
    """
    更新查找类型。

    Args:
        db: 数据库会话
        lookup_type_id: 查找类型ID
        lookup_type: 查找类型更新模型

    Returns:
        更新后的查找类型对象，如果不存在则返回None
    """
    # 获取要更新的查找类型
    db_lookup_type = get_lookup_type(db, lookup_type_id)
    if not db_lookup_type:
        return None

    # 如果代码发生变化，检查新代码是否已存在
    if lookup_type.code is not None and lookup_type.code != db_lookup_type.code:
        existing = get_lookup_type_by_code(db, lookup_type.code)
        if existing:
            raise ValueError(f"Lookup type with code '{lookup_type.code}' already exists")

    # 更新查找类型
    update_data = lookup_type.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_lookup_type, key, value)

    db.commit()
    db.refresh(db_lookup_type)
    return db_lookup_type


def delete_lookup_type(db: Session, lookup_type_id: int) -> bool:
    """
    删除查找类型。

    Args:
        db: 数据库会话
        lookup_type_id: 查找类型ID

    Returns:
        是否成功删除
    """
    # 获取要删除的查找类型
    db_lookup_type = get_lookup_type(db, lookup_type_id)
    if not db_lookup_type:
        return False

    # 删除查找类型
    db.delete(db_lookup_type)
    db.commit()
    return True


# LookupValue CRUD
def get_lookup_values(
    db: Session,
    lookup_type_id: Optional[int] = None,
    is_active: Optional[bool] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
) -> Tuple[List[LookupValue], int]:
    """
    获取查找值列表。

    Args:
        db: 数据库会话
        lookup_type_id: 查找类型ID
        is_active: 是否激活
        search: 搜索关键字
        skip: 跳过的记录数
        limit: 返回的记录数

    Returns:
        查找值列表和总记录数
    """
    query = db.query(LookupValue)

    # 应用过滤条件
    if lookup_type_id:
        query = query.filter(LookupValue.lookup_type_id == lookup_type_id)

    if is_active is not None:
        query = query.filter(LookupValue.is_active == is_active)

    # 应用搜索过滤
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (LookupValue.code.ilike(search_term)) |
            (LookupValue.name.ilike(search_term)) |
            (LookupValue.description.ilike(search_term))
        )

    # 获取总记录数 (在应用options之前进行，以确保准确性)
    total = query.with_entities(func.count(LookupValue.id)).scalar()

    # Eager load parent and children for the main query results
    query = query.options(
        selectinload(LookupValue.parent),
        selectinload(LookupValue.children)
    )

    # 应用排序和分页
    query = query.order_by(LookupValue.lookup_type_id, LookupValue.sort_order, LookupValue.name)
    query = query.offset(skip).limit(limit)

    return query.all(), total


def get_lookup_value(db: Session, lookup_value_id: int) -> Optional[LookupValue]:
    """
    根据ID获取查找值。

    Args:
        db: 数据库会话
        lookup_value_id: 查找值ID

    Returns:
        查找值对象，如果不存在则返回None
    """
    return db.query(LookupValue).options(
        selectinload(LookupValue.parent),
        selectinload(LookupValue.children)
    ).filter(LookupValue.id == lookup_value_id).first()


def get_lookup_value_by_code(db: Session, lookup_type_id: int, code: str) -> Optional[LookupValue]:
    """
    根据查找类型ID和代码获取查找值。

    Args:
        db: 数据库会话
        lookup_type_id: 查找类型ID
        code: 查找值代码

    Returns:
        查找值对象，如果不存在则返回None
    """
    return db.query(LookupValue).filter(
        LookupValue.lookup_type_id == lookup_type_id,
        LookupValue.code == code
    ).first()


def create_lookup_value(db: Session, lookup_value: LookupValueCreate) -> LookupValue:
    """
    创建查找值。

    Args:
        db: 数据库会话
        lookup_value: 查找值创建模型

    Returns:
        创建的查找值对象
    """
    # 检查查找类型是否存在
    lookup_type = get_lookup_type(db, lookup_value.lookup_type_id)
    if not lookup_type:
        raise ValueError(f"Lookup type with ID {lookup_value.lookup_type_id} does not exist")

    # 检查代码是否已存在
    existing = get_lookup_value_by_code(db, lookup_value.lookup_type_id, lookup_value.code)
    if existing:
        raise ValueError(f"Lookup value with code '{lookup_value.code}' already exists for lookup type ID {lookup_value.lookup_type_id}")

    # 创建新的查找值
    db_lookup_value = LookupValue(**lookup_value.model_dump())
    db.add(db_lookup_value)
    db.commit()
    db.refresh(db_lookup_value)
    return db_lookup_value


def update_lookup_value(db: Session, lookup_value_id: int, lookup_value: LookupValueUpdate) -> Optional[LookupValue]:
    """
    更新查找值。

    Args:
        db: 数据库会话
        lookup_value_id: 查找值ID
        lookup_value: 查找值更新模型

    Returns:
        更新后的查找值对象，如果不存在则返回None
    """
    # 获取要更新的查找值
    db_lookup_value = get_lookup_value(db, lookup_value_id)
    if not db_lookup_value:
        return None

    # 如果查找类型ID和代码发生变化，检查新的组合是否已存在
    if (lookup_value.lookup_type_id is not None and lookup_value.code is not None and
        (lookup_value.lookup_type_id != db_lookup_value.lookup_type_id or lookup_value.code != db_lookup_value.code)):
        existing = get_lookup_value_by_code(db, lookup_value.lookup_type_id, lookup_value.code)
        if existing:
            raise ValueError(f"Lookup value with code '{lookup_value.code}' already exists for lookup type ID {lookup_value.lookup_type_id}")
    elif lookup_value.lookup_type_id is not None and lookup_value.lookup_type_id != db_lookup_value.lookup_type_id:
        # 检查查找类型是否存在
        lookup_type = get_lookup_type(db, lookup_value.lookup_type_id)
        if not lookup_type:
            raise ValueError(f"Lookup type with ID {lookup_value.lookup_type_id} does not exist")
    elif lookup_value.code is not None and lookup_value.code != db_lookup_value.code:
        existing = get_lookup_value_by_code(db, db_lookup_value.lookup_type_id, lookup_value.code)
        if existing:
            raise ValueError(f"Lookup value with code '{lookup_value.code}' already exists for lookup type ID {db_lookup_value.lookup_type_id}")

    # 更新查找值
    update_data = lookup_value.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_lookup_value, key, value)

    db.commit()
    db.refresh(db_lookup_value)
    return db_lookup_value


def delete_lookup_value(db: Session, lookup_value_id: int) -> bool:
    """
    删除查找值。

    Args:
        db: 数据库会话
        lookup_value_id: 查找值ID

    Returns:
        是否成功删除
    """
    # 获取要删除的查找值
    db_lookup_value = get_lookup_value(db, lookup_value_id)
    if not db_lookup_value:
        return False

    # 删除查找值
    db.delete(db_lookup_value)
    db.commit()
    return True


# SystemParameter CRUD
def get_system_parameters(
    db: Session,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
) -> Tuple[List[SystemParameter], int]:
    """
    获取系统参数列表。

    Args:
        db: 数据库会话
        search: 搜索关键字
        skip: 跳过的记录数
        limit: 返回的记录数

    Returns:
        系统参数列表和总记录数
    """
    query = db.query(SystemParameter)

    # 应用搜索过滤
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (SystemParameter.key.ilike(search_term)) |
            (SystemParameter.value.ilike(search_term)) |
            (SystemParameter.description.ilike(search_term))
        )

    # 获取总记录数
    total = query.count()

    # 应用排序和分页
    query = query.order_by(SystemParameter.key)
    query = query.offset(skip).limit(limit)

    return query.all(), total


def get_system_parameter_by_key(db: Session, param_key: str) -> Optional[SystemParameter]:
    """
    根据键获取系统参数。

    Args:
        db: 数据库会话
        param_key: 系统参数键

    Returns:
        系统参数对象，如果不存在则返回None
    """
    return db.query(SystemParameter).filter(SystemParameter.key == param_key).first()


def get_system_parameter_by_id(db: Session, param_id: int) -> Optional[SystemParameter]:
    """
    根据ID获取系统参数。

    Args:
        db: 数据库会话
        param_id: 系统参数ID

    Returns:
        系统参数对象，如果不存在则返回None
    """
    return db.query(SystemParameter).filter(SystemParameter.id == param_id).first()


def create_system_parameter(db: Session, parameter: SystemParameterCreate) -> SystemParameter:
    """
    创建系统参数。

    Args:
        db: 数据库会话
        parameter: 系统参数创建模型

    Returns:
        创建的系统参数对象
    """
    # 检查键是否已存在
    existing = get_system_parameter_by_key(db, parameter.key)
    if existing:
        raise ValueError(f"System parameter with key '{parameter.key}' already exists")

    # 创建新的系统参数
    db_parameter = SystemParameter(**parameter.model_dump())
    db.add(db_parameter)
    db.commit()
    db.refresh(db_parameter)
    return db_parameter


def update_system_parameter(db: Session, param_key: str, parameter: SystemParameterUpdate) -> Optional[SystemParameter]:
    """
    更新系统参数。

    Args:
        db: 数据库会话
        param_key: 系统参数键
        parameter: 系统参数更新模型

    Returns:
        更新后的系统参数对象，如果不存在则返回None
    """
    # 获取要更新的系统参数
    db_parameter = get_system_parameter_by_key(db, param_key)
    if not db_parameter:
        return None

    # 更新系统参数
    update_data = parameter.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_parameter, key, value)

    db.commit()
    db.refresh(db_parameter)
    return db_parameter


def delete_system_parameter(db: Session, param_key: str) -> bool:
    """
    删除系统参数。

    Args:
        db: 数据库会话
        param_key: 系统参数键

    Returns:
        是否成功删除
    """
    # 获取要删除的系统参数
    db_parameter = get_system_parameter_by_key(db, param_key)
    if not db_parameter:
        return False

    # 删除系统参数
    db.delete(db_parameter)
    db.commit()
    return True


# PayrollComponentDefinition CRUD
def get_payroll_component_definitions(
    db: Session,
    component_type: Optional[str] = None,
    is_active: Optional[bool] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
) -> Tuple[List[PayrollComponentDefinition], int]:
    """
    获取工资组件定义列表。

    Args:
        db: 数据库会话
        component_type: 组件类型
        is_active: 是否激活
        search: 搜索关键字
        skip: 跳过的记录数
        limit: 返回的记录数

    Returns:
        工资组件定义列表和总记录数
    """
    query = db.query(PayrollComponentDefinition)

    # 应用过滤条件
    if component_type:
        query = query.filter(PayrollComponentDefinition.type == component_type)

    if is_active is not None:
        query = query.filter(PayrollComponentDefinition.is_active == is_active)

    # 应用搜索过滤
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (PayrollComponentDefinition.code.ilike(search_term)) |
            (PayrollComponentDefinition.name.ilike(search_term)) |
            (PayrollComponentDefinition.description.ilike(search_term))
        )

    # 获取总记录数
    total = query.count()

    # 应用排序和分页
    query = query.order_by(PayrollComponentDefinition.type, PayrollComponentDefinition.display_order, PayrollComponentDefinition.name)
    query = query.offset(skip).limit(limit)

    return query.all(), total


def get_payroll_component_definition(db: Session, component_id: int) -> Optional[PayrollComponentDefinition]:
    """
    根据ID获取工资组件定义。

    Args:
        db: 数据库会话
        component_id: 工资组件定义ID

    Returns:
        工资组件定义对象，如果不存在则返回None
    """
    return db.query(PayrollComponentDefinition).filter(PayrollComponentDefinition.id == component_id).first()


def get_payroll_component_definition_by_code(db: Session, code: str) -> Optional[PayrollComponentDefinition]:
    """
    根据代码获取工资组件定义。

    Args:
        db: 数据库会话
        code: 工资组件定义代码

    Returns:
        工资组件定义对象，如果不存在则返回None
    """
    return db.query(PayrollComponentDefinition).filter(PayrollComponentDefinition.code == code).first()


def create_payroll_component_definition(db: Session, component: PayrollComponentDefinitionCreate) -> PayrollComponentDefinition:
    """
    创建工资组件定义。

    Args:
        db: 数据库会话
        component: 工资组件定义创建模型

    Returns:
        创建的工资组件定义对象
    """
    # 检查代码是否已存在
    existing = get_payroll_component_definition_by_code(db, component.code)
    if existing:
        raise ValueError(f"Payroll component definition with code '{component.code}' already exists")

    # 创建新的工资组件定义
    db_component = PayrollComponentDefinition(**component.model_dump())
    db.add(db_component)
    db.commit()
    db.refresh(db_component)
    return db_component


def update_payroll_component_definition(db: Session, component_id: int, component: PayrollComponentDefinitionUpdate) -> Optional[PayrollComponentDefinition]:
    """
    更新工资组件定义。

    Args:
        db: 数据库会话
        component_id: 工资组件定义ID
        component: 工资组件定义更新模型

    Returns:
        更新后的工资组件定义对象，如果不存在则返回None
    """
    # 获取要更新的工资组件定义
    db_component = get_payroll_component_definition(db, component_id)
    if not db_component:
        return None

    # 如果代码发生变化，检查新代码是否已存在
    if component.code is not None and component.code != db_component.code:
        existing = get_payroll_component_definition_by_code(db, component.code)
        if existing:
            raise ValueError(f"Payroll component definition with code '{component.code}' already exists")

    # 更新工资组件定义
    update_data = component.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_component, key, value)

    db.commit()
    db.refresh(db_component)
    return db_component


def delete_payroll_component_definition(db: Session, component_id: int) -> bool:
    """
    删除工资组件定义。

    Args:
        db: 数据库会话
        component_id: 工资组件定义ID

    Returns:
        是否成功删除
    """
    # 获取要删除的工资组件定义
    db_component = get_payroll_component_definition(db, component_id)
    if not db_component:
        return False

    # 删除工资组件定义
    db.delete(db_component)
    db.commit()
    return True


# TaxBracket CRUD
def get_tax_brackets(
    db: Session,
    region_code: Optional[str] = None,
    tax_type: Optional[str] = None,
    effective_date: Optional[date] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
) -> Tuple[List[TaxBracket], int]:
    """
    获取税率档位列表。

    Args:
        db: 数据库会话
        region_code: 地区代码
        tax_type: 税种类型
        effective_date: 生效日期
        search: 搜索关键字
        skip: 跳过的记录数
        limit: 返回的记录数

    Returns:
        税率档位列表和总记录数
    """
    query = db.query(TaxBracket)

    # 应用过滤条件
    if region_code:
        query = query.filter(TaxBracket.region_code == region_code)

    if tax_type:
        query = query.filter(TaxBracket.tax_type == tax_type)

    if effective_date:
        query = query.filter(
            (TaxBracket.effective_date <= effective_date) &
            ((TaxBracket.end_date >= effective_date) | (TaxBracket.end_date.is_(None)))
        )

    # 应用搜索过滤
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (TaxBracket.region_code.ilike(search_term)) |
            (TaxBracket.tax_type.ilike(search_term)) |
            (TaxBracket.description.ilike(search_term))
        )

    # 获取总记录数
    total = query.count()

    # 应用排序和分页
    query = query.order_by(TaxBracket.region_code, TaxBracket.tax_type, TaxBracket.effective_date, TaxBracket.income_range_start)
    query = query.offset(skip).limit(limit)

    return query.all(), total


def get_tax_bracket(db: Session, bracket_id: int) -> Optional[TaxBracket]:
    """
    根据ID获取税率档位。

    Args:
        db: 数据库会话
        bracket_id: 税率档位ID

    Returns:
        税率档位对象，如果不存在则返回None
    """
    return db.query(TaxBracket).filter(TaxBracket.id == bracket_id).first()


def create_tax_bracket(db: Session, tax_bracket: TaxBracketCreate) -> TaxBracket:
    """
    创建税率档位。

    Args:
        db: 数据库会话
        tax_bracket: 税率档位创建模型

    Returns:
        创建的税率档位对象
    """
    # 创建新的税率档位
    db_tax_bracket = TaxBracket(**tax_bracket.model_dump())
    db.add(db_tax_bracket)
    db.commit()
    db.refresh(db_tax_bracket)
    return db_tax_bracket


def update_tax_bracket(db: Session, bracket_id: int, tax_bracket: TaxBracketUpdate) -> Optional[TaxBracket]:
    """
    更新税率档位。

    Args:
        db: 数据库会话
        bracket_id: 税率档位ID
        tax_bracket: 税率档位更新模型

    Returns:
        更新后的税率档位对象，如果不存在则返回None
    """
    # 获取要更新的税率档位
    db_tax_bracket = get_tax_bracket(db, bracket_id)
    if not db_tax_bracket:
        return None

    # 更新税率档位
    update_data = tax_bracket.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_tax_bracket, key, value)

    db.commit()
    db.refresh(db_tax_bracket)
    return db_tax_bracket


def delete_tax_bracket(db: Session, bracket_id: int) -> bool:
    """
    删除税率档位。

    Args:
        db: 数据库会话
        bracket_id: 税率档位ID

    Returns:
        是否成功删除
    """
    # 获取要删除的税率档位
    db_tax_bracket = get_tax_bracket(db, bracket_id)
    if not db_tax_bracket:
        return False

    # 删除税率档位
    db.delete(db_tax_bracket)
    db.commit()
    return True


# SocialSecurityRate CRUD
def get_social_security_rates(
    db: Session,
    region_code: Optional[str] = None,
    rate_type: Optional[str] = None,
    effective_date: Optional[date] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
) -> Tuple[List[SocialSecurityRate], int]:
    """
    获取社保费率列表。

    Args:
        db: 数据库会话
        region_code: 地区代码
        rate_type: 费率类型
        effective_date: 生效日期
        search: 搜索关键字
        skip: 跳过的记录数
        limit: 返回的记录数

    Returns:
        社保费率列表和总记录数
    """
    query = db.query(SocialSecurityRate)

    # 应用过滤条件
    if region_code:
        query = query.filter(SocialSecurityRate.region_code == region_code)

    if rate_type:
        query = query.filter(SocialSecurityRate.contribution_type == rate_type)

    if effective_date:
        query = query.filter(
            (SocialSecurityRate.effective_date <= effective_date) &
            ((SocialSecurityRate.end_date >= effective_date) | (SocialSecurityRate.end_date.is_(None)))
        )

    # 应用搜索过滤
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (SocialSecurityRate.region_code.ilike(search_term)) |
            (SocialSecurityRate.contribution_type.ilike(search_term)) |
            (SocialSecurityRate.participant_type.ilike(search_term))
        )

    # 获取总记录数
    total = query.count()

    # 应用排序和分页
    query = query.order_by(SocialSecurityRate.region_code, SocialSecurityRate.contribution_type, SocialSecurityRate.effective_date)
    query = query.offset(skip).limit(limit)

    return query.all(), total


def get_social_security_rate(db: Session, rate_id: int) -> Optional[SocialSecurityRate]:
    """
    根据ID获取社保费率。

    Args:
        db: 数据库会话
        rate_id: 社保费率ID

    Returns:
        社保费率对象，如果不存在则返回None
    """
    return db.query(SocialSecurityRate).filter(SocialSecurityRate.id == rate_id).first()


def create_social_security_rate(db: Session, rate: SocialSecurityRateCreate) -> SocialSecurityRate:
    """
    创建社保费率。

    Args:
        db: 数据库会话
        rate: 社保费率创建模型

    Returns:
        创建的社保费率对象
    """
    # 创建新的社保费率
    db_rate = SocialSecurityRate(**rate.model_dump())
    db.add(db_rate)
    db.commit()
    db.refresh(db_rate)
    return db_rate


def update_social_security_rate(db: Session, rate_id: int, rate: SocialSecurityRateUpdate) -> Optional[SocialSecurityRate]:
    """
    更新社保费率。

    Args:
        db: 数据库会话
        rate_id: 社保费率ID
        rate: 社保费率更新模型

    Returns:
        更新后的社保费率对象，如果不存在则返回None
    """
    # 获取要更新的社保费率
    db_rate = get_social_security_rate(db, rate_id)
    if not db_rate:
        return None

    # 更新社保费率
    update_data = rate.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_rate, key, value)

    db.commit()
    db.refresh(db_rate)
    return db_rate


def delete_social_security_rate(db: Session, rate_id: int) -> bool:
    """
    删除社保费率。

    Args:
        db: 数据库会话
        rate_id: 社保费率ID

    Returns:
        是否成功删除
    """
    # 获取要删除的社保费率
    db_rate = get_social_security_rate(db, rate_id)
    if not db_rate:
        return False

    # 删除社保费率
    db.delete(db_rate)
    db.commit()
    return True
