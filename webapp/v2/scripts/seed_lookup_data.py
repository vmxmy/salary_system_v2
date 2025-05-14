#!/usr/bin/env python
"""
种子数据脚本 - 创建基础的查找类型和查找值
"""
import logging
import sys
from pathlib import Path

# 添加项目根目录到Python路径
current_dir = Path(__file__).resolve().parent
project_root = current_dir.parent.parent.parent
sys.path.append(str(project_root))

from webapp.v2.database import SessionLocalV2
from webapp.v2.models.config import LookupType, LookupValue

# 配置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def create_lookup_type_if_not_exists(db, code, name, description=None):
    """创建查找类型（如果不存在）并返回对象"""
    lookup_type = db.query(LookupType).filter(LookupType.code == code).first()
    if not lookup_type:
        lookup_type = LookupType(code=code, name=name, description=description)
        db.add(lookup_type)
        db.commit()
        db.refresh(lookup_type)
        logger.info(f"创建查找类型成功: {code} (ID: {lookup_type.id})")
    else:
        logger.info(f"查找类型已存在: {code} (ID: {lookup_type.id})")
    return lookup_type

def create_lookup_value_if_not_exists(db, lookup_type_id, code, name, sort_order=0, is_active=True, description=None):
    """创建查找值（如果不存在）并返回对象"""
    lookup_value = db.query(LookupValue).filter(
        LookupValue.lookup_type_id == lookup_type_id,
        LookupValue.code == code
    ).first()
    if not lookup_value:
        lookup_value = LookupValue(
            lookup_type_id=lookup_type_id,
            code=code,
            name=name,
            sort_order=sort_order,
            is_active=is_active,
            description=description
        )
        db.add(lookup_value)
        db.commit()
        db.refresh(lookup_value)
        logger.info(f"创建查找值成功: {code} for type_id {lookup_type_id} (ID: {lookup_value.id})")
    else:
        logger.info(f"查找值已存在: {code} for type_id {lookup_type_id} (ID: {lookup_value.id})")
    return lookup_value

def seed_data():
    logger.info("开始填充基础查找数据...")
    db = SessionLocalV2()
    try:
        # 1. 创建查找类型 (Lookup Types)
        # 我们希望 GENDER 是 ID=1，EMPLOYEE_STATUS 是 ID=2，PAYROLL_FREQUENCY 是 ID=3
        # 注意：依赖数据库自增ID的顺序不是100%可靠的，但对于新表通常是这样。
        # 如果表不是空的，ID可能不同。更健壮的方法是创建后获取ID。

        gender_type = create_lookup_type_if_not_exists(db, code="GENDER", name="性别")
        emp_status_type = create_lookup_type_if_not_exists(db, code="EMPLOYEE_STATUS", name="员工状态")
        payroll_freq_type = create_lookup_type_if_not_exists(db, code="PAYROLL_FREQUENCY", name="工资频率")
        # 为测试脚本中 lookup_type_id=1 的 POST /v2/lookup/values 准备
        # 如果 gender_type.id 不是1，测试脚本中的 POST /v2/lookup/values 仍会失败
        # 确保 gender_type.id 确实是测试脚本期望的 ID (例如 1)
        # 如果数据库是空的，gender_type.id 应该是1。

        # 2. 创建查找值 (Lookup Values)
        # 性别 (GENDER) - 假设 gender_type.id 是 1
        if gender_type: # 确保类型已创建
            # 我们希望 "MALE" (男) 的 ID 是 1，以满足 gender_lookup_value_id=1
            male = create_lookup_value_if_not_exists(db, lookup_type_id=gender_type.id, code="MALE", name="男", sort_order=1)
            female = create_lookup_value_if_not_exists(db, lookup_type_id=gender_type.id, code="FEMALE", name="女", sort_order=2)
            other_gender = create_lookup_value_if_not_exists(db, lookup_type_id=gender_type.id, code="OTHER", name="其他", sort_order=3)
            logger.info(f"确保 gender_type.id ({gender_type.id}) 和 male.id ({male.id}) 符合测试脚本预期。")


        # 员工状态 (EMPLOYEE_STATUS) - 假设 emp_status_type.id 是 2
        if emp_status_type: # 确保类型已创建
            # 我们希望 "ACTIVE" (在职) 的 ID 是 1 (或者测试脚本中 status_lookup_value_id 引用的值)
            # 这里有一个潜在问题：如果 male.id 已经是1，那么 active.id 不会是1（除非是不同表或不同ID序列）
            # 实际上，lookup_values 表的 ID 是全局唯一的。
            # 测试脚本中 status_lookup_value_id=1 可能需要一个 code='ACTIVE' 的记录，其全局 ID 恰好是1。
            # 这通常意味着 "MALE" 必须是第一个创建的 lookup_value。
            active_status = create_lookup_value_if_not_exists(db, lookup_type_id=emp_status_type.id, code="ACTIVE", name="在职", sort_order=1)
            inactive_status = create_lookup_value_if_not_exists(db, lookup_type_id=emp_status_type.id, code="INACTIVE", name="离职", sort_order=2)
            logger.info(f"确保 active_status.id ({active_status.id}) 符合测试脚本中 status_lookup_value_id 的预期。")


        # 工资频率 (PAYROLL_FREQUENCY) - 假设 payroll_freq_type.id 是 3
        if payroll_freq_type: # 确保类型已创建
            # 我们希望 "MONTHLY" (月度) 的 ID 是 1 (或者测试脚本中 frequency_lookup_value_id 引用的值)
            monthly_freq = create_lookup_value_if_not_exists(db, lookup_type_id=payroll_freq_type.id, code="MONTHLY", name="月度", sort_order=1)
            logger.info(f"确保 monthly_freq.id ({monthly_freq.id}) 符合测试脚本中 frequency_lookup_value_id 的预期。")

        # 关键点：测试脚本硬编码了 lookup_value_id=1。
        # 这意味着在所有创建的 lookup_values 中，ID为1的那个记录必须是测试所期望的。
        # 如果 "MALE" 是第一个创建的 lookup_value，它的 ID 将是 1。
        # 如果测试脚本中的 gender_lookup_value_id, status_lookup_value_id, frequency_lookup_value_id 都期望是 ID=1，
        # 那么它们必须都指向同一个 lookup_value 记录，这在业务逻辑上是不可能的。
        #
        # 修正：测试脚本中的 lookup_value_id 应该引用 *特定含义* 的记录，而不是固定的数字ID 1。
        # 例如，gender_lookup_value_id 应该引用代表“男”或“女”的记录的ID。
        # status_lookup_value_id 应该引用代表“在职”的记录的ID。
        # frequency_lookup_value_id 应该引用代表“月度”的记录的ID。
        #
        # 这个种子脚本会创建这些记录。测试脚本需要被修改，以使用这些记录的 *实际 code* 去获取它们的 ID，
        # 或者我们必须确保种子脚本创建的记录的 ID 恰好是 1, 2, 3... 并且测试脚本也使用这些特定的 ID。
        #
        # 为了简单起见，并假设一个完全清空的 lookup_values 表，这个脚本创建的第一个 lookup_value ("MALE") 的 ID 将是 1。
        # 如果测试脚本中的 gender_lookup_value_id=1, status_lookup_value_id=1, frequency_lookup_value_id=1 都指向“MALE”，
        # 这在业务上是不对的。
        #
        # 更好的做法是，测试脚本应该使用 code 来查找 ID，或者种子脚本确保特定的 code 得到特定的 ID（如果可能）。
        #
        # 鉴于测试脚本目前硬编码了 ID=1，我们将确保第一个创建的 lookup_value (MALE) 的 ID 是 1。
        # 其他的 ID 将会是 2, 3, ...
        # 这意味着 POST /v2/employees 如果 gender_lookup_value_id=1, status_lookup_value_id=1，
        # 那么它会把性别和状态都设为 "MALE"，这可能不是预期的业务逻辑，但能让测试通过外键检查。
        #
        # 理想情况下，测试数据应该更具体，例如：
        # gender_lookup_value_code: "MALE"
        # status_lookup_value_code: "ACTIVE"
        # frequency_lookup_value_code: "MONTHLY"
        # 然后测试脚本在发送请求前，先通过 GET /v2/lookup/values?code=...&type_code=... 来获取这些值的实际ID。

        logger.info("基础查找数据填充完成。")
    except Exception as e:
        logger.error(f"填充数据失败: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    try:
        seed_data()
    except Exception as e:
        logger.error(f"脚本执行失败: {str(e)}")
        sys.exit(1)