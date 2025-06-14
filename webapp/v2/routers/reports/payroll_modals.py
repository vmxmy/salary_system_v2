from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from decimal import Decimal
from ...database import get_db_v2
from ...models.security import User
from ....auth import get_current_user
from ...pydantic_models.payroll import PayrollModalData
from ...pydantic_models.common import PaginationResponse, PaginationMeta

router = APIRouter(prefix="/payroll-modal", tags=["payroll-modals"])


@router.get("/data/{payroll_entry_id}", response_model=PayrollModalData)
async def get_payroll_modal_data(
    payroll_entry_id: int,
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """获取单个薪资模态框数据 - 专门为前端模态框优化的API"""
    try:
        # 动态获取所有应发和扣除字段
        # 1. 先获取基础信息（包含编制信息）
        basic_query = text("""
        SELECT 
            pb."薪资条目id",
            pb."员工编号",
            pb."姓名",
            pb."部门名称", 
            pb."职位名称",
            pb."人员类别",
            pb."根人员类别" AS "编制",
            pb."薪资期间名称",
            pb."薪资期间开始日期",
            pb."薪资期间结束日期",
            pb."应发合计",
            pb."扣除合计", 
            pb."实发合计"
        FROM reports.v_payroll_basic pb
        WHERE pb."薪资条目id" = :payroll_entry_id
        """)
        
        basic_result = db.execute(basic_query, {"payroll_entry_id": payroll_entry_id}).fetchone()
        if not basic_result:
            raise HTTPException(status_code=404, detail="薪资条目不存在")
        
        # 2. 动态获取所有应发明细字段
        earnings_columns_query = text("""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'reports' 
            AND table_name = 'v_payroll_earnings' 
            AND column_name NOT IN ('薪资条目id', '员工id', '原始应发明细')
        ORDER BY ordinal_position
        """)
        earnings_columns = [row[0] for row in db.execute(earnings_columns_query).fetchall()]
        
        # 3. 动态获取所有扣除明细字段
        deductions_columns_query = text("""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'reports' 
            AND table_name = 'v_payroll_deductions' 
            AND column_name NOT IN ('薪资条目id', '员工id', '原始扣除明细')
        ORDER BY ordinal_position
        """)
        deductions_columns = [row[0] for row in db.execute(deductions_columns_query).fetchall()]
        
        # 4. 动态获取所有计算参数字段
        calculations_columns_query = text("""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'reports' 
            AND table_name = 'v_payroll_calculations' 
            AND column_name NOT IN ('薪资条目id', '员工id', '原始计算输入', '原始计算日志')
        ORDER BY ordinal_position
        """)
        calculations_columns = [row[0] for row in db.execute(calculations_columns_query).fetchall()]
        
        # 5. 动态查询应发明细数据
        earnings_data = {}
        if earnings_columns:
            earnings_select = ', '.join([f'COALESCE(pe."{col}", 0.00) AS "{col}"' for col in earnings_columns])
            earnings_query = text(f"""
            SELECT {earnings_select}
            FROM reports.v_payroll_earnings pe
            WHERE pe."薪资条目id" = :payroll_entry_id
            """)
            earnings_result = db.execute(earnings_query, {"payroll_entry_id": payroll_entry_id}).fetchone()
            if earnings_result:
                earnings_data = {col: earnings_result[i] or Decimal('0.00') for i, col in enumerate(earnings_columns)}
        
        # 6. 动态查询扣除明细数据
        deductions_data = {}
        if deductions_columns:
            deductions_select = ', '.join([f'COALESCE(pd."{col}", 0.00) AS "{col}"' for col in deductions_columns])
            deductions_query = text(f"""
            SELECT {deductions_select}
            FROM reports.v_payroll_deductions pd
            WHERE pd."薪资条目id" = :payroll_entry_id
            """)
            deductions_result = db.execute(deductions_query, {"payroll_entry_id": payroll_entry_id}).fetchone()
            if deductions_result:
                deductions_data = {col: deductions_result[i] or Decimal('0.00') for i, col in enumerate(deductions_columns)}
        
        # 7. 动态查询计算参数数据
        calculations_data = {}
        if calculations_columns:
            calculations_select = ', '.join([f'COALESCE(pc."{col}", 0.00) AS "{col}"' for col in calculations_columns])
            calculations_query = text(f"""
            SELECT {calculations_select}
            FROM reports.v_payroll_calculations pc
            WHERE pc."薪资条目id" = :payroll_entry_id
            """)
            calculations_result = db.execute(calculations_query, {"payroll_entry_id": payroll_entry_id}).fetchone()
            if calculations_result:
                calculations_data = {col: calculations_result[i] or Decimal('0.00') for i, col in enumerate(calculations_columns)}
        
        # 8. 构建响应数据
        modal_data = PayrollModalData(
            **{
                "薪资条目id": basic_result[0],
                "基础信息": {
                    "员工编号": basic_result[1],
                    "员工姓名": basic_result[2], 
                    "部门名称": basic_result[3],
                    "职位名称": basic_result[4],
                    "人员类别": basic_result[5],
                    "编制": basic_result[6],
                    "薪资期间名称": basic_result[7],
                    "期间开始日期": basic_result[8],
                    "期间结束日期": basic_result[9]
                },
                "汇总信息": {
                    "应发合计": basic_result[10] or Decimal('0.00'),
                    "扣除合计": basic_result[11] or Decimal('0.00'),
                    "实发合计": basic_result[12] or Decimal('0.00')
                },
                "应发明细": {
                    # 标准应发明细字段
                    "基本工资": earnings_data.get("基本工资", Decimal('0.00')),
                    "岗位工资": earnings_data.get("岗位工资", Decimal('0.00')),
                    "绩效工资": earnings_data.get("绩效工资", Decimal('0.00')),
                    "补助": earnings_data.get("补助", Decimal('0.00')),
                    "信访岗位津贴": earnings_data.get("信访工作人员岗位工作津贴", Decimal('0.00')),
                    "基础绩效": earnings_data.get("基础绩效", Decimal('0.00')),
                    "津贴": earnings_data.get("津贴", Decimal('0.00')),
                    "职务技术等级工资": earnings_data.get("职务/技术等级工资", Decimal('0.00')),
                    "级别岗位级别工资": earnings_data.get("级别/岗位级别工资", Decimal('0.00')),
                    "93年工改保留补贴": earnings_data.get("九三年工改保留津补贴", Decimal('0.00')),
                    "独生子女父母奖励金": earnings_data.get("独生子女父母奖励金", Decimal('0.00')),
                    "公务员规范性津贴补贴": earnings_data.get("公务员规范后津补贴", Decimal('0.00')),
                    "公务交通补贴": earnings_data.get("公务交通补贴", Decimal('0.00')),
                    "基础绩效奖": earnings_data.get("基础绩效奖", Decimal('0.00')),
                    "薪级工资": earnings_data.get("薪级工资", Decimal('0.00')),
                    "见习试用期工资": earnings_data.get("试用期工资", Decimal('0.00')),
                    "月基础绩效": earnings_data.get("基础性绩效工资", Decimal('0.00')),
                    "月奖励绩效": earnings_data.get("月奖励绩效", Decimal('0.00')),
                    "岗位职务补贴": earnings_data.get("岗位职务补贴", Decimal('0.00')),
                    "信访工作人员岗位津贴": earnings_data.get("信访工作人员岗位工作津贴", Decimal('0.00')),
                    "乡镇工作补贴": earnings_data.get("乡镇工作补贴", Decimal('0.00')),
                    "补扣社保": earnings_data.get("补扣社保", Decimal('0.00')),
                    "一次性补扣发": earnings_data.get("一次性补扣发", Decimal('0.00')),
                    "绩效奖金补扣发": earnings_data.get("绩效奖金补扣发", Decimal('0.00')),
                    "奖励绩效补扣发": earnings_data.get("奖励绩效补发", Decimal('0.00')),
                    # 其他应发项目（排除标准字段和合计字段）
                    "其他应发项目": {k: v for k, v in earnings_data.items() 
                                     if k not in [
                                         "基本工资", "岗位工资", "绩效工资", "补助", "信访工作人员岗位工作津贴", 
                                         "基础绩效", "津贴", "职务/技术等级工资", "级别/岗位级别工资", 
                                         "九三年工改保留津补贴", "独生子女父母奖励金", "公务员规范后津补贴", 
                                         "公务交通补贴", "基础绩效奖", "薪级工资", "试用期工资", 
                                         "基础性绩效工资", "月奖励绩效", "岗位职务补贴", "乡镇工作补贴", 
                                         "补扣社保", "一次性补扣发", "绩效奖金补扣发", "奖励绩效补发",
                                         "应发合计", "扣除合计", "实发合计"
                                     ] and v > 0}
                },
                "扣除明细": {
                    # 个人扣缴项目
                    "个人扣缴项目": {
                        "养老保险个人应缴费额": deductions_data.get("养老保险个人应缴费额", Decimal('0.00')),
                        "医疗保险个人应缴费额": deductions_data.get("医疗保险个人应缴费额", Decimal('0.00')),
                        "失业保险个人应缴费额": deductions_data.get("失业保险个人应缴费额", Decimal('0.00')),
                        "职业年金个人应缴费额": deductions_data.get("职业年金个人应缴费额", Decimal('0.00')),
                        "住房公积金个人应缴费额": deductions_data.get("住房公积金个人应缴费额", Decimal('0.00')),
                        "个人所得税": deductions_data.get("个人所得税", Decimal('0.00')),
                        "其他个人扣缴": {k: v for k, v in deductions_data.items() 
                                        if k not in [
                                            "养老保险个人应缴费额", "医疗保险个人应缴费额", "失业保险个人应缴费额", 
                                            "职业年金个人应缴费额", "住房公积金个人应缴费额", "个人所得税",
                                            "养老保险单位应缴费额", "医疗保险单位应缴总额", "医疗保险单位应缴费额", 
                                            "大病医疗单位应缴费额", "失业保险单位应缴费额", "工伤保险单位应缴费额", 
                                            "职业年金单位应缴费额", "住房公积金单位应缴费额",
                                            "应发合计", "扣除合计", "实发合计"
                                        ] and v > 0 and not k.endswith("单位应缴费额") and not k.endswith("单位应缴总额")}
                    },
                    # 单位扣缴项目
                    "单位扣缴项目": {
                        "养老保险单位应缴费额": deductions_data.get("养老保险单位应缴费额", Decimal('0.00')),
                        "医疗保险单位应缴总额": deductions_data.get("医疗保险单位应缴总额", Decimal('0.00')),
                        "医疗保险单位应缴费额": deductions_data.get("医疗保险单位应缴费额", Decimal('0.00')),
                        "大病医疗单位应缴费额": deductions_data.get("大病医疗单位应缴费额", Decimal('0.00')),
                        "失业保险单位应缴费额": deductions_data.get("失业保险单位应缴费额", Decimal('0.00')),
                        "工伤保险单位应缴费额": deductions_data.get("工伤保险单位应缴费额", Decimal('0.00')),
                        "职业年金单位应缴费额": deductions_data.get("职业年金单位应缴费额", Decimal('0.00')),
                        "住房公积金单位应缴费额": deductions_data.get("住房公积金单位应缴费额", Decimal('0.00')),
                        "其他单位扣缴": {k: v for k, v in deductions_data.items() 
                                        if k not in [
                                            "养老保险个人应缴费额", "医疗保险个人应缴费额", "失业保险个人应缴费额", 
                                            "职业年金个人应缴费额", "住房公积金个人应缴费额", "个人所得税",
                                            "养老保险单位应缴费额", "医疗保险单位应缴总额", "医疗保险单位应缴费额", 
                                            "大病医疗单位应缴费额", "失业保险单位应缴费额", "工伤保险单位应缴费额", 
                                            "职业年金单位应缴费额", "住房公积金单位应缴费额",
                                            "应发合计", "扣除合计", "实发合计"
                                        ] and v > 0 and (k.endswith("单位应缴费额") or k.endswith("单位应缴总额"))}
                    }
                },
                "计算参数": {
                    "社保缴费基数": calculations_data.get("社保缴费基数", Decimal('0.00')),
                    "住房公积金缴费基数": calculations_data.get("住房公积金缴费基数", Decimal('0.00')),
                    "养老保险个人费率": calculations_data.get("养老保险个人费率", Decimal('0.00')),
                    "医疗保险个人费率": calculations_data.get("医疗保险个人费率", Decimal('0.00')),
                    "住房公积金个人费率": calculations_data.get("住房公积金个人费率", Decimal('0.00')),
                    "其他计算参数": {k: v for k, v in calculations_data.items() 
                                    if k not in [
                                        "社保缴费基数", "住房公积金缴费基数", "养老保险个人费率", 
                                        "医疗保险个人费率", "住房公积金个人费率"
                                    ] and v > 0}
                }
            }
        )
        
        return modal_data
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取薪资模态框数据失败: {str(e)}")


@router.post("/batch-data", response_model=List[PayrollModalData])
async def get_batch_payroll_modal_data(
    payroll_entry_ids: List[int],
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """批量获取薪资模态框数据 - 高效批量处理"""
    if not payroll_entry_ids:
        return []
    
    if len(payroll_entry_ids) > 100:
        raise HTTPException(status_code=400, detail="批量查询最多支持100条记录")
    
    try:
        # 批量获取基础信息
        ids_str = ','.join(map(str, payroll_entry_ids))
        basic_query = text(f"""
        SELECT 
            pb."薪资条目id",
            pb."员工编号",
            pb."姓名",
            pb."部门名称", 
            pb."职位名称",
            pb."人员类别",
            pb."根人员类别" AS "编制",
            pb."薪资期间名称",
            pb."薪资期间开始日期",
            pb."薪资期间结束日期",
            pb."应发合计",
            pb."扣除合计", 
            pb."实发合计"
        FROM reports.v_payroll_basic pb
        WHERE pb."薪资条目id" IN ({ids_str})
        ORDER BY pb."薪资条目id"
        """)
        
        basic_results = db.execute(basic_query).fetchall()
        if not basic_results:
            return []
        
        # 构建基础信息字典
        basic_data_dict = {}
        for row in basic_results:
            basic_data_dict[row[0]] = {
                "薪资条目id": row[0],
                "基础信息": {
                    "员工编号": row[1],
                    "员工姓名": row[2], 
                    "部门名称": row[3],
                    "职位名称": row[4],
                    "人员类别": row[5],
                    "编制": row[6],
                    "薪资期间名称": row[7],
                    "期间开始日期": row[8],
                    "期间结束日期": row[9]
                },
                "汇总信息": {
                    "应发合计": row[10] or Decimal('0.00'),
                    "扣除合计": row[11] or Decimal('0.00'),
                    "实发合计": row[12] or Decimal('0.00')
                }
            }
        
        # 批量获取应发明细 - 简化查询，只获取核心字段
        earnings_query = text(f"""
        SELECT 
            pe."薪资条目id",
            COALESCE(pe."基本工资", 0.00) AS "基本工资",
            COALESCE(pe."岗位工资", 0.00) AS "岗位工资",
            COALESCE(pe."绩效工资", 0.00) AS "绩效工资",
            COALESCE(pe."补助", 0.00) AS "补助",
            COALESCE(pe."津贴", 0.00) AS "津贴"
        FROM reports.v_payroll_earnings pe
        WHERE pe."薪资条目id" IN ({ids_str})
        ORDER BY pe."薪资条目id"
        """)
        earnings_results = db.execute(earnings_query).fetchall()
        
        # 批量获取扣除明细 - 简化查询，只获取核心字段
        deductions_query = text(f"""
        SELECT 
            pd."薪资条目id",
            COALESCE(pd."养老保险个人应缴费额", 0.00) AS "养老保险个人应缴费额",
            COALESCE(pd."医疗保险个人应缴费额", 0.00) AS "医疗保险个人应缴费额",
            COALESCE(pd."个人所得税", 0.00) AS "个人所得税",
            COALESCE(pd."养老保险单位应缴费额", 0.00) AS "养老保险单位应缴费额",
            COALESCE(pd."医疗保险单位应缴费额", 0.00) AS "医疗保险单位应缴费额"
        FROM reports.v_payroll_deductions pd
        WHERE pd."薪资条目id" IN ({ids_str})
        ORDER BY pd."薪资条目id"
        """)
        deductions_results = db.execute(deductions_query).fetchall()
        
        # 批量获取计算参数 - 简化查询，只获取核心字段
        calculations_query = text(f"""
        SELECT 
            pc."薪资条目id",
            COALESCE(pc."社保缴费基数", 0.00) AS "社保缴费基数",
            COALESCE(pc."住房公积金缴费基数", 0.00) AS "住房公积金缴费基数"
        FROM reports.v_payroll_calculations pc
        WHERE pc."薪资条目id" IN ({ids_str})
        ORDER BY pc."薪资条目id"
        """)
        calculations_results = db.execute(calculations_query).fetchall()
        
        # 构建完整的模态框数据列表
        modal_data_list = []
        for entry_id in payroll_entry_ids:
            if entry_id not in basic_data_dict:
                continue
                
            # 获取该条目的应发明细
            earnings_data = {}
            for row in earnings_results:
                if row[0] == entry_id:
                    earnings_data = {
                        "基本工资": row[1] or Decimal('0.00'),
                        "岗位工资": row[2] or Decimal('0.00'),
                        "绩效工资": row[3] or Decimal('0.00'),
                        "补助": row[4] or Decimal('0.00'),
                        "津贴": row[5] or Decimal('0.00')
                    }
                    break
            
            # 获取该条目的扣除明细
            deductions_data = {}
            for row in deductions_results:
                if row[0] == entry_id:
                    deductions_data = {
                        "养老保险个人应缴费额": row[1] or Decimal('0.00'),
                        "医疗保险个人应缴费额": row[2] or Decimal('0.00'),
                        "个人所得税": row[3] or Decimal('0.00'),
                        "养老保险单位应缴费额": row[4] or Decimal('0.00'),
                        "医疗保险单位应缴费额": row[5] or Decimal('0.00')
                    }
                    break
            
            # 获取该条目的计算参数
            calculations_data = {}
            for row in calculations_results:
                if row[0] == entry_id:
                    calculations_data = {
                        "社保缴费基数": row[1] or Decimal('0.00'),
                        "住房公积金缴费基数": row[2] or Decimal('0.00')
                    }
                    break
            
            # 构建完整的模态框数据（简化版，只包含核心字段）
            modal_data = PayrollModalData(
                **{
                    **basic_data_dict[entry_id],
                    "应发明细": {
                        "基本工资": earnings_data.get("基本工资", Decimal('0.00')),
                        "岗位工资": earnings_data.get("岗位工资", Decimal('0.00')),
                        "绩效工资": earnings_data.get("绩效工资", Decimal('0.00')),
                        "其他应发项目": {k: v for k, v in earnings_data.items() if v > 0}
                    },
                    "扣除明细": {
                        "个人扣缴项目": {
                            "养老保险个人应缴费额": deductions_data.get("养老保险个人应缴费额", Decimal('0.00')),
                            "医疗保险个人应缴费额": deductions_data.get("医疗保险个人应缴费额", Decimal('0.00')),
                            "个人所得税": deductions_data.get("个人所得税", Decimal('0.00')),
                            "其他个人扣缴": {}
                        },
                        "单位扣缴项目": {
                            "养老保险单位应缴费额": deductions_data.get("养老保险单位应缴费额", Decimal('0.00')),
                            "医疗保险单位应缴费额": deductions_data.get("医疗保险单位应缴费额", Decimal('0.00')),
                            "其他单位扣缴": {}
                        }
                    },
                    "计算参数": {
                        "社保缴费基数": calculations_data.get("社保缴费基数", Decimal('0.00')),
                        "住房公积金缴费基数": calculations_data.get("住房公积金缴费基数", Decimal('0.00')),
                        "其他计算参数": {k: v for k, v in calculations_data.items() if v > 0}
                    }
                }
            )
            modal_data_list.append(modal_data)
        
        return modal_data_list
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"批量获取薪资模态框数据失败: {str(e)}")


@router.get("/period/{period_id}", response_model=List[PayrollModalData])
async def get_payroll_modal_data_by_period(
    period_id: int,
    limit: int = Query(50, le=100, description="返回记录数限制"),
    offset: int = Query(0, ge=0, description="偏移量"),
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """根据薪资期间获取模态框数据列表"""
    try:
        # 先获取该期间的薪资条目ID列表
        entry_ids_query = text("""
        SELECT "薪资条目id"
        FROM reports.v_payroll_basic
        WHERE "薪资期间id" = :period_id
        ORDER BY "薪资条目id"
        LIMIT :limit OFFSET :offset
        """)
        
        entry_ids_result = db.execute(entry_ids_query, {
            "period_id": period_id,
            "limit": limit,
            "offset": offset
        }).fetchall()
        
        if not entry_ids_result:
            return []
        
        # 提取薪资条目ID列表
        entry_ids = [row[0] for row in entry_ids_result]
        
        # 调用批量获取API
        return await get_batch_payroll_modal_data(entry_ids, db, current_user)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"根据期间获取薪资模态框数据失败: {str(e)}") 