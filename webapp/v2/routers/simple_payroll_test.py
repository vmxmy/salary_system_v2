"""
简化版工资计算引擎测试API

提供简单的API端点来测试简化版计算引擎功能
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any, List
import logging

from ...database import get_db
from ..payroll_engine.simple_calculator import SimplePayrollCalculator, SimplePayrollDataMapper

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/simple-payroll", tags=["Simple Payroll Test"])


@router.post("/test-calculation")
async def test_simple_calculation(
    test_data: Dict[str, Any],
    db: Session = Depends(get_db)
):
    """
    测试简化版工资计算
    
    请求体示例:
    {
        "employee_id": 354,
        "payroll_run_id": 1,
        "import_data": {
            "人员编号": "00001",
            "人员姓名": "张三",
            "基本工资": "3000.00",
            "岗位工资": "1500.00",
            "基础绩效奖": "800.00",
            "个人缴养老保险费": "240.00",
            "个人缴医疗保险费": "60.00",
            "个人所得税": "45.00"
        }
    }
    """
    try:
        # 1. 初始化计算器和映射器
        calculator = SimplePayrollCalculator(db)
        mapper = SimplePayrollDataMapper()
        
        # 2. 获取测试数据
        employee_id = test_data.get("employee_id", 354)
        payroll_run_id = test_data.get("payroll_run_id", 1)
        import_data = test_data.get("import_data", {})
        
        # 3. 数据映射
        import_data["employee_id"] = employee_id
        payroll_data = mapper.map_import_data_to_payroll_data(import_data)
        
        # 4. 执行计算
        result = calculator.calculate_payroll_entry(
            employee_id=employee_id,
            payroll_run_id=payroll_run_id,
            earnings_data=payroll_data["earnings"],
            deductions_data=payroll_data["deductions"]
        )
        
        return {
            "success": True,
            "message": "计算成功",
            "input_data": {
                "employee_id": employee_id,
                "payroll_run_id": payroll_run_id,
                "mapped_earnings": payroll_data["earnings"],
                "mapped_deductions": payroll_data["deductions"]
            },
            "calculation_result": result
        }
        
    except Exception as e:
        logger.error(f"简化版计算测试失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"计算失败: {str(e)}")


@router.post("/test-batch-calculation")
async def test_batch_calculation(
    test_data: Dict[str, Any],
    db: Session = Depends(get_db)
):
    """
    测试批量工资计算
    
    请求体示例:
    {
        "payroll_run_id": 1,
        "employees": [
            {
                "employee_id": 354,
                "人员姓名": "张三",
                "基本工资": "3000.00",
                "个人所得税": "45.00"
            },
            {
                "employee_id": 355,
                "人员姓名": "李四", 
                "基本工资": "3200.00",
                "个人所得税": "50.00"
            }
        ]
    }
    """
    try:
        # 1. 初始化计算器和映射器
        calculator = SimplePayrollCalculator(db)
        mapper = SimplePayrollDataMapper()
        
        # 2. 获取测试数据
        payroll_run_id = test_data.get("payroll_run_id", 1)
        employees_data = test_data.get("employees", [])
        
        # 3. 准备批量数据
        batch_data = []
        for emp_data in employees_data:
            employee_id = emp_data.get("employee_id")
            if not employee_id:
                continue
                
            # 数据映射
            emp_data["employee_id"] = employee_id
            payroll_data = mapper.map_import_data_to_payroll_data(emp_data)
            batch_data.append(payroll_data)
        
        # 4. 执行批量计算
        results = calculator.batch_calculate(payroll_run_id, batch_data)
        
        return {
            "success": True,
            "message": f"批量计算完成，成功处理 {len(results)} 条记录",
            "payroll_run_id": payroll_run_id,
            "total_processed": len(results),
            "results": results
        }
        
    except Exception as e:
        logger.error(f"批量计算测试失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"批量计算失败: {str(e)}")


@router.get("/test-data-mapping")
async def test_data_mapping():
    """
    测试数据映射功能
    """
    try:
        mapper = SimplePayrollDataMapper()
        
        # 测试数据
        test_import_data = {
            "employee_id": 354,
            "人员编号": "00001",
            "人员姓名": "张三",
            "基本工资": "3000.00",
            "岗位工资": "1500.00",
            "薪级工资": "800.00",
            "基础绩效奖": "1200.00",
            "公务交通补贴": "500.00",
            "个人缴养老保险费": "240.00",
            "个人缴医疗保险费": "60.00",
            "个人缴住房公积金": "360.00",
            "个人所得税": "45.00"
        }
        
        # 执行映射
        mapped_data = mapper.map_import_data_to_payroll_data(test_import_data)
        
        return {
            "success": True,
            "message": "数据映射测试成功",
            "original_data": test_import_data,
            "mapped_data": mapped_data,
            "earnings_mapping": mapper.EARNINGS_MAPPING,
            "deductions_mapping": mapper.DEDUCTIONS_MAPPING
        }
        
    except Exception as e:
        logger.error(f"数据映射测试失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"数据映射失败: {str(e)}") 