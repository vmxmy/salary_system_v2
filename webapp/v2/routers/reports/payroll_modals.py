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
                    # 基础工资项目
                    "基本工资": earnings_data.get("基本工资", Decimal('0.00')),
                    "岗位工资": earnings_data.get("岗位工资", Decimal('0.00')),
                    "绩效工资": earnings_data.get("绩效工资", Decimal('0.00')),
                    "补助": earnings_data.get("补助", Decimal('0.00')),
                    "信访工作人员岗位工作津贴": earnings_data.get("信访工作人员岗位工作津贴", Decimal('0.00')),
                    "基础绩效": earnings_data.get("基础绩效", Decimal('0.00')),
                    "津贴": earnings_data.get("津贴", Decimal('0.00')),
                    "职务技术等级工资": earnings_data.get("职务/技术等级工资", Decimal('0.00')),
                    "级别岗位级别工资": earnings_data.get("级别/岗位级别工资", Decimal('0.00')),
                    "九三年工改保留津补贴": earnings_data.get("九三年工改保留津补贴", Decimal('0.00')),
                    "独生子女父母奖励金": earnings_data.get("独生子女父母奖励金", Decimal('0.00')),
                    "公务员规范性津贴补贴": earnings_data.get("公务员规范后津补贴", Decimal('0.00')),
                    "公务交通补贴": earnings_data.get("公务交通补贴", Decimal('0.00')),
                    "基础绩效奖": earnings_data.get("基础绩效奖", Decimal('0.00')),
                    "薪级工资": earnings_data.get("薪级工资", Decimal('0.00')),
                    "试用期工资": earnings_data.get("试用期工资", Decimal('0.00')),
                    "基础性绩效工资": earnings_data.get("基础性绩效工资", Decimal('0.00')),
                    "月奖励绩效": earnings_data.get("月奖励绩效", Decimal('0.00')),
                    "岗位职务补贴": earnings_data.get("岗位职务补贴", Decimal('0.00')),
                    "乡镇工作补贴": earnings_data.get("乡镇工作补贴", Decimal('0.00')),
                    "补扣社保": earnings_data.get("补扣社保", Decimal('0.00')),
                    "一次性补扣发": earnings_data.get("一次性补扣发", Decimal('0.00')),
                    "绩效奖金补扣发": earnings_data.get("绩效奖金补扣发", Decimal('0.00')),
                    "奖励绩效补扣发": earnings_data.get("奖励绩效补扣发", Decimal('0.00')),
                    # 其他应发项目（包含所有剩余字段）
                    "其他应发项目": {k: v for k, v in earnings_data.items() 
                                      if k not in ["基本工资", "岗位工资", "绩效工资", "补助", "信访工作人员岗位工作津贴", 
                                                   "基础绩效", "津贴", "职务/技术等级工资", "级别/岗位级别工资", 
                                                   "九三年工改保留津补贴", "独生子女父母奖励金", "公务员规范后津补贴", 
                                                   "公务交通补贴", "基础绩效奖", "薪级工资", "试用期工资", 
                                                   "基础性绩效工资", "月奖励绩效", "岗位职务补贴", "乡镇工作补贴", 
                                                   "补扣社保", "一次性补扣发", "绩效奖金补扣发", "奖励绩效补扣发"] and v > 0}
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
        
        # 批量获取应发明细 - 包含所有字段
        earnings_query = text(f"""
        SELECT 
            pe."薪资条目id",
            -- 基础工资项目
            COALESCE(pe."基本工资", 0.00) AS "基本工资",
            COALESCE(pe."岗位工资", 0.00) AS "岗位工资",
            COALESCE(pe."薪级工资", 0.00) AS "薪级工资",
            COALESCE(pe."级别工资", 0.00) AS "级别工资",
            COALESCE(pe."级别/岗位级别工资", 0.00) AS "级别/岗位级别工资",
            COALESCE(pe."职务/技术等级工资", 0.00) AS "职务/技术等级工资",
            COALESCE(pe."事业单位人员薪级工资", 0.00) AS "事业单位人员薪级工资",
            COALESCE(pe."试用期工资", 0.00) AS "试用期工资",
            -- 绩效工资项目
            COALESCE(pe."绩效工资", 0.00) AS "绩效工资",
            COALESCE(pe."奖励性绩效工资", 0.00) AS "奖励性绩效工资",
            COALESCE(pe."基础性绩效工资", 0.00) AS "基础性绩效工资",
            COALESCE(pe."绩效奖", 0.00) AS "绩效奖",
            COALESCE(pe."基础绩效", 0.00) AS "基础绩效",
            COALESCE(pe."基础绩效奖", 0.00) AS "基础绩效奖",
            COALESCE(pe."月奖励绩效", 0.00) AS "月奖励绩效",
            COALESCE(pe."月奖励绩效津贴", 0.00) AS "月奖励绩效津贴",
            COALESCE(pe."季度绩效考核薪酬", 0.00) AS "季度绩效考核薪酬",
            COALESCE(pe."1季度绩效考核薪酬", 0.00) AS "1季度绩效考核薪酬",
            COALESCE(pe."绩效工资补发", 0.00) AS "绩效工资补发",
            COALESCE(pe."奖励绩效补发", 0.00) AS "奖励绩效补发",
            COALESCE(pe."奖励绩效补扣发", 0.00) AS "奖励绩效补扣发",
            COALESCE(pe."绩效奖金补扣发", 0.00) AS "绩效奖金补扣发",
            -- 津贴补贴项目
            COALESCE(pe."津贴", 0.00) AS "津贴",
            COALESCE(pe."补助", 0.00) AS "补助",
            COALESCE(pe."公务员规范后津补贴", 0.00) AS "公务员规范后津补贴",
            COALESCE(pe."公务交通补贴", 0.00) AS "公务交通补贴",
            COALESCE(pe."乡镇工作补贴", 0.00) AS "乡镇工作补贴",
            COALESCE(pe."艰苦边远地区津贴", 0.00) AS "艰苦边远地区津贴",
            COALESCE(pe."公检法艰苦边远地区津贴", 0.00) AS "公检法艰苦边远地区津贴",
            COALESCE(pe."住房补贴", 0.00) AS "住房补贴",
            COALESCE(pe."生活性津贴", 0.00) AS "生活性津贴",
            COALESCE(pe."工作性津贴", 0.00) AS "工作性津贴",
            COALESCE(pe."特殊岗位津贴", 0.00) AS "特殊岗位津贴",
            COALESCE(pe."岗位职务补贴", 0.00) AS "岗位职务补贴",
            COALESCE(pe."国家规定的其他津补贴项目", 0.00) AS "国家规定的其他津补贴项目",
            -- 专业津贴项目
            COALESCE(pe."教龄津贴", 0.00) AS "教龄津贴",
            COALESCE(pe."护龄津贴", 0.00) AS "护龄津贴",
            COALESCE(pe."警衔津贴", 0.00) AS "警衔津贴",
            COALESCE(pe."特级教师津贴", 0.00) AS "特级教师津贴",
            -- 公安相关津贴
            COALESCE(pe."公安岗位津贴", 0.00) AS "公安岗位津贴",
            COALESCE(pe."公安执勤津贴", 0.00) AS "公安执勤津贴",
            COALESCE(pe."公安法定工作日之外加班补贴", 0.00) AS "公安法定工作日之外加班补贴",
            COALESCE(pe."人民警察值勤岗位津贴", 0.00) AS "人民警察值勤岗位津贴",
            COALESCE(pe."人民警察加班补贴", 0.00) AS "人民警察加班补贴",
            -- 法院检察院相关
            COALESCE(pe."法院检察院工改保留津贴", 0.00) AS "法院检察院工改保留津贴",
            COALESCE(pe."法院检察院执勤津贴", 0.00) AS "法院检察院执勤津贴",
            COALESCE(pe."法院检察院规范津补贴", 0.00) AS "法院检察院规范津补贴",
            COALESCE(pe."法检基础性绩效津补贴", 0.00) AS "法检基础性绩效津补贴",
            COALESCE(pe."法医毒物化验人员保健津贴", 0.00) AS "法医毒物化验人员保健津贴",
            -- 其他专项津贴
            COALESCE(pe."纪检津贴", 0.00) AS "纪检津贴",
            COALESCE(pe."纪委监委机构改革保留补贴", 0.00) AS "纪委监委机构改革保留补贴",
            COALESCE(pe."政法委机关工作津贴", 0.00) AS "政法委机关工作津贴",
            COALESCE(pe."信访工作人员岗位工作津贴", 0.00) AS "信访工作人员岗位工作津贴",
            -- 卫生相关
            COALESCE(pe."卫生九三年工改保留津补贴", 0.00) AS "卫生九三年工改保留津补贴",
            COALESCE(pe."卫生援藏津贴", 0.00) AS "卫生援藏津贴",
            COALESCE(pe."卫生独生子女费", 0.00) AS "卫生独生子女费",
            COALESCE(pe."援藏津贴", 0.00) AS "援藏津贴",
            -- 奖励项目
            COALESCE(pe."年度考核奖", 0.00) AS "年度考核奖",
            COALESCE(pe."公务员十三月奖励工资", 0.00) AS "公务员十三月奖励工资",
            COALESCE(pe."独生子女父母奖励金", 0.00) AS "独生子女父母奖励金",
            -- 历史保留项目
            COALESCE(pe."九三年工改保留津补贴", 0.00) AS "九三年工改保留津补贴",
            COALESCE(pe."老粮贴", 0.00) AS "老粮贴",
            COALESCE(pe."回民补贴", 0.00) AS "回民补贴",
            COALESCE(pe."中小学教师或护士保留原额百分之十工资", 0.00) AS "中小学教师或护士保留原额百分之十工资",
            COALESCE(pe."中小学教师或护士提高百分之十", 0.00) AS "中小学教师或护士提高百分之十",
            -- 补发补扣项目
            COALESCE(pe."补发工资", 0.00) AS "补发工资",
            COALESCE(pe."补发津贴", 0.00) AS "补发津贴",
            COALESCE(pe."补扣（退）款", 0.00) AS "补扣（退）款",
            COALESCE(pe."一次性补扣发", 0.00) AS "一次性补扣发"
        FROM reports.v_payroll_earnings pe
        WHERE pe."薪资条目id" IN ({ids_str})
        ORDER BY pe."薪资条目id"
        """)
        earnings_results = db.execute(earnings_query).fetchall()
        
        # 批量获取扣除明细 - 包含所有字段
        deductions_query = text(f"""
        SELECT 
            pd."薪资条目id",
            -- 个人扣缴项目
            COALESCE(pd."养老保险个人应缴费额", 0.00) AS "养老保险个人应缴费额",
            COALESCE(pd."医疗保险个人应缴费额", 0.00) AS "医疗保险个人应缴费额",
            COALESCE(pd."失业保险个人应缴费额", 0.00) AS "失业保险个人应缴费额",
            COALESCE(pd."职业年金个人应缴费额", 0.00) AS "职业年金个人应缴费额",
            COALESCE(pd."住房公积金个人应缴费额", 0.00) AS "住房公积金个人应缴费额",
            COALESCE(pd."个人所得税", 0.00) AS "个人所得税",
            -- 单位扣缴项目
            COALESCE(pd."养老保险单位应缴费额", 0.00) AS "养老保险单位应缴费额",
            COALESCE(pd."医疗保险单位应缴费额", 0.00) AS "医疗保险单位应缴费额",
            COALESCE(pd."医疗保险单位应缴总额", 0.00) AS "医疗保险单位应缴总额",
            COALESCE(pd."大病医疗单位应缴费额", 0.00) AS "大病医疗单位应缴费额",
            COALESCE(pd."失业保险单位应缴费额", 0.00) AS "失业保险单位应缴费额",
            COALESCE(pd."工伤保险单位应缴费额", 0.00) AS "工伤保险单位应缴费额",
            COALESCE(pd."职业年金单位应缴费额", 0.00) AS "职业年金单位应缴费额",
            COALESCE(pd."住房公积金单位应缴费额", 0.00) AS "住房公积金单位应缴费额",
            -- 其他扣缴项目
            COALESCE(pd."补扣2022年医保款", 0.00) AS "补扣2022年医保款",
            COALESCE(pd."补扣社保", 0.00) AS "补扣社保"
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
        
        # 批量获取员工详细信息
        employee_details_query = text(f"""
        SELECT 
            pb."薪资条目id",
            pb."员工id",
            eb.phone_number,
            eb.email,
            eb.home_address,
            eb.emergency_contact_name,
            eb.emergency_contact_phone,
            eb.id_number,
            eb.date_of_birth,
            eb.gender,
            eb.nationality,
            eb.ethnicity,
            eb.marital_status,
            eb.education_level,
            eb.political_status,
            eb.hire_date,
            eb.first_work_date,
            eb.current_position_start_date,
            eb.interrupted_service_years,
            eb.employee_status,
            eb.employment_type,
            eb.contract_type,
            eb.salary_level,
            eb.salary_grade,
            eb.job_position_level,
            eb.social_security_client_number,
            eb.housing_fund_client_number,
            eb.primary_bank_name,
            eb.primary_account_holder_name,
            eb.primary_account_number,
            eb.primary_branch_name,
            eb.primary_bank_code,
            eb.primary_account_type
        FROM reports.v_payroll_basic pb
        LEFT JOIN reports.v_employees_basic eb ON pb."员工id" = eb.id
        WHERE pb."薪资条目id" IN ({ids_str})
        ORDER BY pb."薪资条目id"
        """)
        employee_details_results = db.execute(employee_details_query).fetchall()
        
        # 构建完整的模态框数据列表
        modal_data_list = []
        for entry_id in payroll_entry_ids:
            if entry_id not in basic_data_dict:
                continue
                
            # 获取该条目的应发明细
            earnings_data = {}
            for row in earnings_results:
                if row[0] == entry_id:
                    # 应发明细字段映射（按SQL查询顺序）
                    earnings_fields = [
                        "基本工资", "岗位工资", "薪级工资", "级别工资", "级别/岗位级别工资", "职务/技术等级工资", 
                        "事业单位人员薪级工资", "试用期工资", "绩效工资", "奖励性绩效工资", "基础性绩效工资", 
                        "绩效奖", "基础绩效", "基础绩效奖", "月奖励绩效", "月奖励绩效津贴", "季度绩效考核薪酬", 
                        "1季度绩效考核薪酬", "绩效工资补发", "奖励绩效补发", "奖励绩效补扣发", "绩效奖金补扣发", 
                        "津贴", "补助", "公务员规范后津补贴", "公务交通补贴", "乡镇工作补贴", "艰苦边远地区津贴", 
                        "公检法艰苦边远地区津贴", "住房补贴", "生活性津贴", "工作性津贴", "特殊岗位津贴", 
                        "岗位职务补贴", "国家规定的其他津补贴项目", "教龄津贴", "护龄津贴", "警衔津贴", 
                        "特级教师津贴", "公安岗位津贴", "公安执勤津贴", "公安法定工作日之外加班补贴", 
                        "人民警察值勤岗位津贴", "人民警察加班补贴", "法院检察院工改保留津贴", "法院检察院执勤津贴", 
                        "法院检察院规范津补贴", "法检基础性绩效津补贴", "法医毒物化验人员保健津贴", "纪检津贴", 
                        "纪委监委机构改革保留补贴", "政法委机关工作津贴", "信访工作人员岗位工作津贴", 
                        "卫生九三年工改保留津补贴", "卫生援藏津贴", "卫生独生子女费", "援藏津贴", "年度考核奖", 
                        "公务员十三月奖励工资", "独生子女父母奖励金", "九三年工改保留津补贴", "老粮贴", "回民补贴", 
                        "中小学教师或护士保留原额百分之十工资", "中小学教师或护士提高百分之十", "补发工资", 
                        "补发津贴", "补扣（退）款", "一次性补扣发"
                    ]
                    
                    # 构建应发明细数据字典
                    for i, field_name in enumerate(earnings_fields, 1):  # 从索引1开始，因为索引0是薪资条目id
                        earnings_data[field_name] = row[i] or Decimal('0.00')
                    break
            
            # 获取该条目的扣除明细
            deductions_data = {}
            for row in deductions_results:
                if row[0] == entry_id:
                    deductions_data = {
                        # 个人扣缴项目
                        "养老保险个人应缴费额": row[1] or Decimal('0.00'),
                        "医疗保险个人应缴费额": row[2] or Decimal('0.00'),
                        "失业保险个人应缴费额": row[3] or Decimal('0.00'),
                        "职业年金个人应缴费额": row[4] or Decimal('0.00'),
                        "住房公积金个人应缴费额": row[5] or Decimal('0.00'),
                        "个人所得税": row[6] or Decimal('0.00'),
                        # 单位扣缴项目
                        "养老保险单位应缴费额": row[7] or Decimal('0.00'),
                        "医疗保险单位应缴费额": row[8] or Decimal('0.00'),
                        "医疗保险单位应缴总额": row[9] or Decimal('0.00'),
                        "大病医疗单位应缴费额": row[10] or Decimal('0.00'),
                        "失业保险单位应缴费额": row[11] or Decimal('0.00'),
                        "工伤保险单位应缴费额": row[12] or Decimal('0.00'),
                        "职业年金单位应缴费额": row[13] or Decimal('0.00'),
                        "住房公积金单位应缴费额": row[14] or Decimal('0.00'),
                        # 其他扣缴项目
                        "补扣2022年医保款": row[15] or Decimal('0.00'),
                        "补扣社保": row[16] or Decimal('0.00')
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
            
            # 获取该条目的员工详细信息
            employee_details_data = None
            for row in employee_details_results:
                if row[0] == entry_id:
                    employee_details_data = {
                        "联系信息": {
                            "电话": row[2],
                            "邮箱": row[3],
                            "家庭住址": row[4],
                            "紧急联系人": row[5],
                            "紧急联系电话": row[6]
                        },
                        "个人信息": {
                            "身份证号": row[7],
                            "出生日期": row[8],
                            "性别": row[9],
                            "民族": row[10],
                            "民族详情": row[11],
                            "婚姻状况": row[12],
                            "学历": row[13],
                            "政治面貌": row[14]
                        },
                        "工作信息": {
                            "入职日期": row[15],
                            "首次工作日期": row[16],
                            "现职位开始日期": row[17],
                            "中断服务年限": row[18],
                            "员工状态": row[19],
                            "用工类型": row[20],
                            "合同类型": row[21],
                            "薪级": row[22],
                            "薪档": row[23],
                            "职位等级": row[24]
                        },
                        "社保公积金信息": {
                            "社保客户号": row[25],
                            "住房公积金客户号": row[26]
                        },
                        "银行账号信息": {
                            "开户银行": row[27],
                            "账户持有人": row[28],
                            "银行账号": row[29],
                            "开户支行": row[30],
                            "银行代码": row[31],
                            "账户类型": row[32]
                        }
                    }
                    break
            
            # 构建完整的模态框数据（简化版，只包含核心字段）
            modal_data = PayrollModalData(
                **{
                    **basic_data_dict[entry_id],
                    "员工详细信息": employee_details_data,
                    "应发明细": {
                        # 基础工资项目
                        "基本工资": earnings_data.get("基本工资", Decimal('0.00')),
                        "岗位工资": earnings_data.get("岗位工资", Decimal('0.00')),
                        "绩效工资": earnings_data.get("绩效工资", Decimal('0.00')),
                        "补助": earnings_data.get("补助", Decimal('0.00')),
                        "信访工作人员岗位工作津贴": earnings_data.get("信访工作人员岗位工作津贴", Decimal('0.00')),
                        "基础绩效": earnings_data.get("基础绩效", Decimal('0.00')),
                        "津贴": earnings_data.get("津贴", Decimal('0.00')),
                        "职务技术等级工资": earnings_data.get("职务/技术等级工资", Decimal('0.00')),
                        "级别岗位级别工资": earnings_data.get("级别/岗位级别工资", Decimal('0.00')),
                        "九三年工改保留津补贴": earnings_data.get("九三年工改保留津补贴", Decimal('0.00')),
                        "独生子女父母奖励金": earnings_data.get("独生子女父母奖励金", Decimal('0.00')),
                        "公务员规范性津贴补贴": earnings_data.get("公务员规范后津补贴", Decimal('0.00')),
                        "公务交通补贴": earnings_data.get("公务交通补贴", Decimal('0.00')),
                        "基础绩效奖": earnings_data.get("基础绩效奖", Decimal('0.00')),
                        "薪级工资": earnings_data.get("薪级工资", Decimal('0.00')),
                        "试用期工资": earnings_data.get("试用期工资", Decimal('0.00')),
                        "基础性绩效工资": earnings_data.get("基础性绩效工资", Decimal('0.00')),
                        "月奖励绩效": earnings_data.get("月奖励绩效", Decimal('0.00')),
                        "岗位职务补贴": earnings_data.get("岗位职务补贴", Decimal('0.00')),
                        "乡镇工作补贴": earnings_data.get("乡镇工作补贴", Decimal('0.00')),
                        "补扣社保": earnings_data.get("补扣社保", Decimal('0.00')),
                        "一次性补扣发": earnings_data.get("一次性补扣发", Decimal('0.00')),
                        "绩效奖金补扣发": earnings_data.get("绩效奖金补扣发", Decimal('0.00')),
                        "奖励绩效补扣发": earnings_data.get("奖励绩效补扣发", Decimal('0.00')),
                        # 其他应发项目（包含所有剩余字段）
                        "其他应发项目": {k: v for k, v in earnings_data.items() 
                                      if k not in ["基本工资", "岗位工资", "绩效工资", "补助", "信访工作人员岗位工作津贴", 
                                                   "基础绩效", "津贴", "职务/技术等级工资", "级别/岗位级别工资", 
                                                   "九三年工改保留津补贴", "独生子女父母奖励金", "公务员规范后津补贴", 
                                                   "公务交通补贴", "基础绩效奖", "薪级工资", "试用期工资", 
                                                   "基础性绩效工资", "月奖励绩效", "岗位职务补贴", "乡镇工作补贴", 
                                                   "补扣社保", "一次性补扣发", "绩效奖金补扣发", "奖励绩效补扣发"] and v > 0}
                    },
                    "扣除明细": {
                        "个人扣缴项目": {
                            "养老保险个人应缴费额": deductions_data.get("养老保险个人应缴费额", Decimal('0.00')),
                            "医疗保险个人应缴费额": deductions_data.get("医疗保险个人应缴费额", Decimal('0.00')),
                            "失业保险个人应缴费额": deductions_data.get("失业保险个人应缴费额", Decimal('0.00')),
                            "职业年金个人应缴费额": deductions_data.get("职业年金个人应缴费额", Decimal('0.00')),
                            "住房公积金个人应缴费额": deductions_data.get("住房公积金个人应缴费额", Decimal('0.00')),
                            "个人所得税": deductions_data.get("个人所得税", Decimal('0.00')),
                            "其他个人扣缴": {
                                "补扣2022年医保款": deductions_data.get("补扣2022年医保款", Decimal('0.00')),
                                "补扣社保": deductions_data.get("补扣社保", Decimal('0.00'))
                            }
                        },
                        "单位扣缴项目": {
                            "养老保险单位应缴费额": deductions_data.get("养老保险单位应缴费额", Decimal('0.00')),
                            "医疗保险单位应缴费额": deductions_data.get("医疗保险单位应缴费额", Decimal('0.00')),
                            "医疗保险单位应缴总额": deductions_data.get("医疗保险单位应缴总额", Decimal('0.00')),
                            "大病医疗单位应缴费额": deductions_data.get("大病医疗单位应缴费额", Decimal('0.00')),
                            "失业保险单位应缴费额": deductions_data.get("失业保险单位应缴费额", Decimal('0.00')),
                            "工伤保险单位应缴费额": deductions_data.get("工伤保险单位应缴费额", Decimal('0.00')),
                            "职业年金单位应缴费额": deductions_data.get("职业年金单位应缴费额", Decimal('0.00')),
                            "住房公积金单位应缴费额": deductions_data.get("住房公积金单位应缴费额", Decimal('0.00')),
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