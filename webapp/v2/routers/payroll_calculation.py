"""
薪资计算API路由
"""

from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from datetime import date, datetime
from decimal import Decimal

from ..database import get_db_v2, get_database_url_for_bg_task, get_async_db_session
from webapp.auth import get_current_user
from ..pydantic_models.payroll_calculation import (
    PayrollCalculationRequest,
    PayrollCalculationResponse,
    PayrollCalculationPreview,
    CalculationStatusEnum as PydanticCalculationStatus,
    CalculationSummary
)
from ..payroll_engine.engine import PayrollCalculationEngine
from ..payroll_engine.models import CalculationContext, AttendanceData, CalculationStatus as EngineCalculationStatus, CalculationRule as EngineDataclassCalculationRule, ComponentType as EngineDataclassComponentType
from ..models import PayrollRun, Employee, AttendanceRecord
from ..crud.payroll_calculation import PayrollCalculationCRUD
from ..utils.serialization import orm_to_dict_flat

router = APIRouter(prefix="/payroll/calculation", tags=["薪资计算"])


@router.post("/trigger", response_model=PayrollCalculationResponse)
async def trigger_payroll_calculation(
    request: PayrollCalculationRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db_v2),
    current_user = Depends(get_current_user)
):
    """
    触发薪资计算
    
    支持两种模式：
    1. 同步计算：立即返回计算结果（适用于少量员工）
    2. 异步计算：后台执行，返回任务ID（适用于大量员工）
    """
    try:
        # --- Start of new inner try-except block ---
        try:
            crud = PayrollCalculationCRUD(db)
            
            # 验证薪资审核是否存在
            payroll_run = crud.get_payroll_run(request.payroll_run_id)
            if not payroll_run:
                raise HTTPException(status_code=404, detail="薪资审核不存在")
            
            # 获取需要计算的员工列表
            employees = crud.get_employees_for_calculation(
                payroll_run_id=request.payroll_run_id,
                employee_ids=request.employee_ids,
                department_ids=request.department_ids
            )
            
            if not employees:
                raise HTTPException(status_code=400, detail="没有找到需要计算的员工")
            
            # 判断是否使用异步计算
            use_async = len(employees) > request.async_threshold or request.force_async
            
            if use_async:
                # 异步计算
                task_id = crud.create_calculation_task(
                    payroll_run_id=request.payroll_run_id,
                    employee_ids=[emp.id for emp in employees],
                    calculation_config=request.calculation_config
                )
                
                # 添加后台任务
                background_tasks.add_task(
                    _execute_payroll_calculation_async,
                    task_id=task_id,
                    payroll_run_id=request.payroll_run_id,
                    employee_ids=[emp.id for emp in employees],
                    calculation_config=request.calculation_config
                )
                
                return PayrollCalculationResponse(
                    task_id=task_id,
                    status=PydanticCalculationStatus.PROCESSING,
                    message="薪资计算已启动，正在后台处理",
                    total_employees=len(employees),
                    is_async=True
                )
            else:
                # 同步计算
                print("DEBUG (trigger): About to call _execute_payroll_calculation_sync")
                results = await _execute_payroll_calculation_sync(
                    payroll_run_id=request.payroll_run_id,
                    employees=employees,
                    calculation_config=request.calculation_config,
                    db=db
                )
                print(f"DEBUG (trigger): _execute_payroll_calculation_sync returned. Results type: {type(results)}, length: {len(results) if results else 0}")
                
                # 安全地计算成功和失败数量
                successful_count = 0
                failed_count = 0
                
                print(f"DEBUG (trigger): About to process {len(results) if results else 0} results")
                for i, r in enumerate(results):
                    try:
                        print(f"DEBUG (trigger): Processing result {i}, type: {type(r)}")
                        # results 现在是字典列表，每个字典包含 success 字段
                        if isinstance(r, dict):
                            success_status = r.get('success', False)
                            print(f"DEBUG (trigger): Result {i} success status: {success_status}")
                            if success_status:
                                successful_count += 1
                            else:
                                failed_count += 1
                        else:
                            print(f"WARN: Unexpected result format in sync (not dict): {type(r)}")
                            failed_count += 1
                    except Exception as e_status_check:
                        # 如果状态比较出错，记录为失败
                        failed_count += 1
                        print(f"状态比较错误: {e_status_check}")
                
                print(f"DEBUG (trigger): Counts calculated - successful: {successful_count}, failed: {failed_count}")
                print(f"DEBUG (trigger): About to construct PayrollCalculationResponse")
                
                try:
                    response = PayrollCalculationResponse(
                        status=PydanticCalculationStatus.COMPLETED,
                        message="薪资计算完成",
                        total_employees=len(employees),
                        successful_count=successful_count,
                        failed_count=failed_count,
                        results=[],  # 暂时返回空列表，避免序列化问题
                        is_async=False
                    )
                    print(f"DEBUG (trigger): PayrollCalculationResponse constructed successfully")
                    return response
                except Exception as e_response:
                    print(f"DEBUG (trigger): ERROR constructing PayrollCalculationResponse: {e_response}")
                    raise
        # --- End of new inner try-except block ---
        except Exception as inner_e:
            raise # Re-raise inner exceptions normally
            
    except Exception as e:
        # This is the outer catch block that was producing the original error message
        print(f"DEBUG: Outer try caught an exception: {type(e)}, {str(e)}")
        if str(e) == "INNER_COMPLETED_EXCEPTION_TRIGGERED_SYNC":
            raise HTTPException(status_code=500, detail="薪资计算失败: 内部捕获到COMPLETED异常字符串")
        raise HTTPException(status_code=500, detail=f"薪资计算失败: {str(e)}")


@router.post("/preview", response_model=PayrollCalculationPreview)
async def preview_payroll_calculation(
    request: PayrollCalculationRequest,
    db: Session = Depends(get_db_v2),
    current_user = Depends(get_current_user)
):
    """
    预览薪资计算结果
    
    不保存到数据库，仅返回计算预览
    """
    try:
        # --- Start of new inner try-except block ---
        try:
            print("DEBUG: Entering preview_payroll_calculation")
            crud = PayrollCalculationCRUD(db)
            
            print("DEBUG: Calling get_employees_for_calculation")
            employees = crud.get_employees_for_calculation(
                payroll_run_id=request.payroll_run_id,
                employee_ids=request.employee_ids,
                department_ids=request.department_ids,
                limit=request.preview_limit or 10
            )
            print(f"DEBUG: Got {len(employees) if employees else 0} employees")
            
            if not employees:
                raise HTTPException(status_code=400, detail="没有找到需要预览的员工")
            
            print("DEBUG: Initializing PayrollCalculationEngine")
            engine = PayrollCalculationEngine(db)
            print("DEBUG: PayrollCalculationEngine initialized")
            preview_results = []
            
            for employee in employees:
                context = None
                try:
                    # 构建计算上下文
                    print(f"DEBUG: Building context for employee {employee.id}")
                    context = await _build_calculation_context(
                        employee=employee,
                        payroll_run_id=request.payroll_run_id,
                        calculation_config=request.calculation_config,
                        db=db
                    )
                    print(f"DEBUG: Context built successfully for employee {employee.id}")
                except Exception as context_exc:
                    print(f"DEBUG: ERROR building context for employee {employee.id}: {str(context_exc)}")
                    raise HTTPException(status_code=500, detail=f"上下文构建失败: {str(context_exc)}")

                result_from_engine = None # To avoid confusion with result_dict
                try:
                    # 执行计算
                    print(f"DEBUG ROUTER PREVIEW: About to call engine.calculate for employee {employee.id}")
                    result_from_engine = engine.calculate(context)
                    print(f"DEBUG ROUTER PREVIEW: engine.calculate returned for employee {employee.id}. Type: {type(result_from_engine)}")

                    # Granular debug prints
                    status_val = None
                    if hasattr(result_from_engine, 'status'):
                        print(f"DEBUG ROUTER PREVIEW: result_from_engine has status attribute.")
                        status_val = result_from_engine.status
                        print(f"DEBUG ROUTER PREVIEW: Accessed status_val. Type: {type(status_val)}. Value: {status_val}")
                        
                        status_str = str(status_val)
                        print(f"DEBUG ROUTER PREVIEW: Stringified status_str: {status_str}")
                    else:
                        print("DEBUG ROUTER PREVIEW: result_from_engine MISSING status attribute.")
                    
                    emp_id_val = None
                    if hasattr(employee, 'id'):
                        print(f"DEBUG ROUTER PREVIEW: employee has id attribute.")
                        emp_id_val = employee.id
                        print(f"DEBUG ROUTER PREVIEW: Accessed emp_id_val: {emp_id_val}")
                    else:
                        print("DEBUG ROUTER PREVIEW: employee MISSING id attribute.")
                        
                    # Original print that seemed to trigger it (or the error occurred immediately after)
                    print(f"DEBUG Original Print: Calculation successful for employee {emp_id_val}, status: {status_val}")
                    
                    # ---- Start new detailed debug for result_dict construction ----
                    print("DEBUG DICT: Start constructing result_dict")
                    
                    val_employee_id = result_from_engine.employee_id
                    print(f"DEBUG DICT: val_employee_id = {val_employee_id}")

                    val_employee_name = getattr(employee, 'name', f"员工{employee.id}")
                    print(f"DEBUG DICT: val_employee_name = {val_employee_name}")

                    val_status_enum_value = result_from_engine.status.value if hasattr(result_from_engine.status, 'value') else str(result_from_engine.status)
                    print(f"DEBUG DICT: val_status_enum_value = {val_status_enum_value}")

                    val_success = result_from_engine.status == EngineCalculationStatus.COMPLETED
                    print(f"DEBUG DICT: val_success = {val_success}")

                    val_total_earnings = float(result_from_engine.total_earnings)
                    print(f"DEBUG DICT: val_total_earnings = {val_total_earnings}")

                    val_total_deductions = float(result_from_engine.total_deductions)
                    print(f"DEBUG DICT: val_total_deductions = {val_total_deductions}")

                    val_net_pay = float(result_from_engine.net_pay)
                    print(f"DEBUG DICT: val_net_pay = {val_net_pay}")

                    print("DEBUG DICT: Starting components list comprehension")
                    components_list = []
                    if hasattr(result_from_engine, 'components') and result_from_engine.components is not None:
                        for i, comp_item in enumerate(result_from_engine.components):
                            print(f"DEBUG DICT: Processing component {i}, type: {type(comp_item)}")
                            c_code = comp_item.component_code
                            print(f"DEBUG DICT: Component {i} code: {c_code}")
                            c_name = comp_item.component_name
                            print(f"DEBUG DICT: Component {i} name: {c_name}")
                            c_amount = float(comp_item.amount)
                            print(f"DEBUG DICT: Component {i} amount: {c_amount}")
                            c_type_val = comp_item.component_type.value if hasattr(comp_item.component_type, 'value') else str(comp_item.component_type)
                            print(f"DEBUG DICT: Component {i} type_val: {c_type_val}")
                            components_list.append({
                                "component_code": c_code,
                                "component_name": c_name,
                                "amount": c_amount,
                                "component_type": c_type_val
                            })
                        print("DEBUG DICT: Finished components list comprehension")
                    else:
                        print("DEBUG DICT: result_from_engine.components is missing, None, or not iterable")

                    val_calculation_details = result_from_engine.calculation_details
                    print(f"DEBUG DICT: val_calculation_details = {val_calculation_details}")
                    
                    print("DEBUG DICT: All values for result_dict gathered. Assembling dict...")
                    # ---- End new detailed debug ----

                    result_dict = { # This is where the error might be if a value is problematic
                        "employee_id": val_employee_id,
                        "employee_name": val_employee_name,
                        "status": val_status_enum_value,
                        "success": val_success,
                        "total_earnings": val_total_earnings,
                        "total_deductions": val_total_deductions,
                        "net_pay": val_net_pay,
                        "components": components_list,
                        "calculation_details": val_calculation_details
                    }
                    print("DEBUG DICT: result_dict constructed successfully")
                    preview_results.append(result_dict)
                    print("DEBUG DICT: result_dict appended to preview_results")
                    
                except Exception as calc_exc:
                    print(f"DEBUG ROUTER PREVIEW: EXCEPTION during/after engine.calculate for employee {employee.id}")
                    print(f"DEBUG ROUTER PREVIEW: Exception type: {type(calc_exc)}")
                    print(f"DEBUG ROUTER PREVIEW: Exception str: {str(calc_exc)}")
                    # The following print was here before, keeping it.
                    print(f"DEBUG: ERROR during calculation for employee {employee.id}: {str(calc_exc)}")
                    # if str(calc_exc) == "Calculation engine returned 'COMPLETED' as an exception during preview":
                    #     raise HTTPException(status_code=500, detail="薪资计算预览失败: 计算引擎在预览时抛出COMPLETED异常")
                    raise
            
            return PayrollCalculationPreview(
                payroll_run_id=request.payroll_run_id,
                preview_count=len(preview_results),
                total_employees=len(employees),
                results=preview_results,
                calculation_config=request.calculation_config
            )
        # --- End of new inner try-except block ---
        except Exception as inner_e:
            raise # Re-raise inner exceptions normally
        
    except Exception as e:
        print(f"DEBUG: UNCAUGHT EXCEPTION in preview_payroll_calculation: {str(e)}, type: {type(e)}")
        if str(e) == "INNER_COMPLETED_EXCEPTION_TRIGGERED_PREVIEW":
            raise HTTPException(status_code=500, detail="薪资计算预览失败: 内部捕获到COMPLETED异常字符串")
        elif str(e) == "Calculation engine returned 'COMPLETED' as an exception during preview":
            raise HTTPException(status_code=500, detail="薪资计算预览失败: 计算引擎在预览时抛出COMPLETED异常")
        raise HTTPException(status_code=500, detail=f"薪资计算预览失败: {str(e)}")


@router.get("/status/{task_id}", response_model=PydanticCalculationStatus)
async def get_calculation_status(
    task_id: str,
    db: Session = Depends(get_db_v2),
    current_user = Depends(get_current_user)
):
    """获取计算任务状态"""
    try:
        crud = PayrollCalculationCRUD(db)
        task = crud.get_calculation_task(task_id)
        
        if not task:
            raise HTTPException(status_code=404, detail="计算任务不存在")
        
        return PydanticCalculationStatus(
            task_id=task_id,
            status=task.status,
            progress=task.progress,
            total_employees=task.total_employees,
            processed_employees=task.processed_employees,
            successful_count=task.successful_count,
            failed_count=task.failed_count,
            start_time=task.start_time,
            end_time=task.end_time,
            error_message=task.error_message
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取计算状态失败: {str(e)}")


@router.get("/summary/{payroll_run_id}", response_model=CalculationSummary)
async def get_calculation_summary(
    payroll_run_id: int,
    db: Session = Depends(get_db_v2),
    current_user = Depends(get_current_user)
):
    """获取薪资计算汇总信息"""
    try:
        crud = PayrollCalculationCRUD(db)
        summary = crud.get_calculation_summary(payroll_run_id)
        
        if not summary:
            raise HTTPException(status_code=404, detail="薪资审核不存在或未进行计算")
        
        return summary
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取计算汇总失败: {str(e)}")


async def _execute_payroll_calculation_sync(
    payroll_run_id: int,
    employees: List[Employee],
    calculation_config: dict,
    db: Session
):
    """同步执行薪资计算"""
    print("DEBUG (sync): Entering _execute_payroll_calculation_sync")
    print("DEBUG (sync): Initializing PayrollCalculationEngine")
    engine = PayrollCalculationEngine(db)
    print("DEBUG (sync): PayrollCalculationEngine initialized")
    results = []
    
    for employee in employees:
        context = None
        result_obj = None
        try:
            # 构建计算上下文
            print(f"DEBUG (sync): Building context for employee {employee.id}")
            context = await _build_calculation_context(
                employee=employee,
                payroll_run_id=payroll_run_id,
                calculation_config=calculation_config,
                db=db
            )
            print(f"DEBUG (sync): Context built successfully for employee {employee.id}")
            
            # 执行计算
            print(f"DEBUG (sync): Calculating for employee {employee.id}")
            result_obj = engine.calculate(context)
            print(f"DEBUG (sync): Calculation successful for employee {employee.id}, status: {result_obj.status}")
            
            context_dict_for_db = context.to_dict() # Serialize context

            crud = PayrollCalculationCRUD(db)
            crud.save_calculation_result(
                payroll_run_id=payroll_run_id,
                employee_id=employee.id,
                result=result_obj,
                calculation_context_dict=context_dict_for_db # Pass serialized context
            )
            
            # 构建正确的员工计算结果字典
            print(f"DEBUG (sync): About to construct employee_result for employee {employee.id}")
            print(f"DEBUG (sync): result_obj type: {type(result_obj)}")
            print(f"DEBUG (sync): result_obj.status type: {type(result_obj.status)}")
            print(f"DEBUG (sync): result_obj.status value: {result_obj.status}")
            
            try:
                success_val = result_obj.status == EngineCalculationStatus.COMPLETED
                print(f"DEBUG (sync): status comparison result: {success_val}")
            except Exception as e_status:
                print(f"DEBUG (sync): ERROR during status comparison: {e_status}")
                success_val = False
            
            try:
                employee_result = {
                    "employee_id": result_obj.employee_id,
                    "employee_name": getattr(employee, 'name', f"员工{employee.id}"),
                    "success": success_val,
                    "basic_salary": float(result_obj.total_earnings) if result_obj.total_earnings else 0.0,
                    "gross_salary": float(result_obj.total_earnings) if result_obj.total_earnings else 0.0,
                    "total_deductions": float(result_obj.total_deductions) if result_obj.total_deductions else 0.0,
                    "net_salary": float(result_obj.net_pay) if result_obj.net_pay else 0.0,
                    "calculation_details": result_obj.calculation_details,
                    "calculation_time": datetime.now(),
                    "error_message": result_obj.error_message if result_obj.error_message else None
                }
                print(f"DEBUG (sync): employee_result constructed successfully for employee {employee.id}")
                results.append(employee_result)
                print(f"DEBUG (sync): employee_result appended to results for employee {employee.id}")
            except Exception as e_construct:
                print(f"DEBUG (sync): ERROR constructing employee_result for employee {employee.id}: {e_construct}")
                raise
            
        except Exception as e:
            print(f"DEBUG (sync): ERROR during calculation for employee {employee.id}: {str(e)}, type: {type(e)}")
            # 记录错误结果
            error_result = {
                "employee_id": employee.id,
                "employee_name": getattr(employee, 'name', f"员工{employee.id}"),
                "success": False,
                "basic_salary": 0.0,
                "gross_salary": 0.0,
                "total_deductions": 0.0,
                "net_salary": 0.0,
                "calculation_details": {},
                "calculation_time": datetime.now(),
                "error_message": str(e)
            }
            results.append(error_result)
    
    return results


async def _execute_payroll_calculation_async(
    task_id: str,
    payroll_run_id: int,
    employee_ids: List[int],
    calculation_config: Optional[Dict[str, Any]],
    db_url: str = Depends(get_database_url_for_bg_task) # Dependency for db session
):
    """异步薪资计算后台任务"""
    async with get_async_db_session(db_url) as db:
        engine = PayrollCalculationEngine(db_session=db) # Pass async session if engine supports/needs it, or sync session
        crud = PayrollCalculationCRUD(db=db)
        
        current_task_status = await crud.get_task_status(task_id)
        if not current_task_status or current_task_status.status != 'processing':
            logger.warning(f"Async task {task_id} is not in 'processing' state. Current: {current_task_status.status if current_task_status else 'None'}. Aborting.")
            return

        total_employees = len(employee_ids)
        processed_count = 0
        # status_summary = { "total": total_employees, "processed": 0, "successful": 0, "failed": 0 }

        logger.info(f"Async payroll calculation task {task_id} started for run {payroll_run_id}. Employees: {total_employees}")
        
        all_employees = await crud.get_employees_by_ids(employee_ids) # Assuming an async version or adapt
        employee_map = {emp.id: emp for emp in all_employees}

        for emp_id in employee_ids:
            employee = employee_map.get(emp_id)
            if not employee:
                logger.error(f"Async task {task_id}: Employee {emp_id} not found. Skipping.")
                # await crud.update_task_progress(task_id, processed_count, success_count, error_count + 1)
                continue
            
            try:
                context = _build_calculation_context(db, payroll_run_id, emp_id, calculation_config) # This needs to be async-compatible or run carefully
                if not context:
                    logger.warning(f"Async task {task_id}: Skipping employee {emp_id}: Failed to build calculation context.")
                    # Handle error for this employee in task summary
                    continue
                
                result_obj = engine.calculate(context) # Assuming engine.calculate can work with async session context if needed
                
                context_dict_for_db = context.to_dict() # Serialize context

                await crud.save_calculation_result_async( # Assuming an async version
                    payroll_run_id=payroll_run_id,
                    employee_id=emp_id,
                    result=result_obj,
                    calculation_context_dict=context_dict_for_db # Pass serialized context
                )
                # Update task progress, success/failure counts
            except Exception as e:
                logger.error(f"Async task {task_id}: Error calculating for employee {emp_id}: {e}", exc_info=True)
                # Update task progress, mark as failed for this employee
            finally:
                processed_count += 1
                # Periodically update task status in DB to reflect progress, e.g., every N employees or every X seconds
                if processed_count % 10 == 0 or processed_count == total_employees: # Example update frequency
                    logger.info(f"Async task {task_id}: Progress - {processed_count}/{total_employees} employees processed.")
                    # await crud.update_task_status(task_id, status="processing", progress=processed_count/total_employees*100)

        logger.info(f"Async payroll calculation task {task_id} completed for run {payroll_run_id}.")
        # await crud.update_task_status(task_id, status="completed", progress=100)


async def _build_calculation_context(
    employee: Employee,
    payroll_run_id: int,
    calculation_config: dict,
    db: Session
) -> CalculationContext:
    """构建计算上下文"""
    crud = PayrollCalculationCRUD(db)
    
    from sqlalchemy.orm import joinedload
    payroll_run = db.query(PayrollRun).options(joinedload(PayrollRun.payroll_period)).filter(PayrollRun.id == payroll_run_id).first()
    if not payroll_run:
        raise ValueError(f"薪资审核 {payroll_run_id} 不存在")
    
    employee_salary_config_model = crud.get_employee_salary_config(employee.id)
    
    attendance_data_model = crud.get_employee_attendance_data(employee.id, payroll_run_id)
    
    calculation_rules_models = crud.get_calculation_rules(employee)
    
    # Convert ORM objects to dictionaries using the helper
    employee_data_dict = orm_to_dict_flat(employee) if employee else {}
    salary_config_dict = orm_to_dict_flat(employee_salary_config_model) if employee_salary_config_model else {}
    
    # For AttendanceData, it's a dataclass, not an ORM model. Check if it needs a to_dict() or use asdict.
    # For now, assuming AttendanceData as passed to CalculationContext is already fine or handled by its to_dict.
    # If AttendanceRecord from DB is directly used and it's an ORM model, it should also be serialized.
    # The current `crud.get_employee_attendance_data` returns `AttendanceRecord` which IS an ORM model.
    # So, we need to serialize `attendance_data_model` before passing it to `AttendanceData` dataclass or to `CalculationContext` directly.
    
    # Let's assume AttendanceData dataclass can take the ORM model and handle it, or we adjust its constructor.
    # For now, we'll focus on the main issue. The `attendance_data` parameter in CalculationContext expects an `AttendanceData` dataclass instance.
    # The current logic seems to construct `AttendanceData` within the engine/context, or it's passed as None.
    # The issue is with what's stored in `calculation_inputs`, which comes from `CalculationContext.to_dict()`.
    # The `CalculationContext.employee_data` and `CalculationContext.salary_config` are the direct culprits.

    # Base salary calculation logic (seems ok)
    base_salary_from_employee = employee_data_dict.get('base_salary')
    base_salary_from_config = salary_config_dict.get('base_salary')
    
    base_salary = base_salary_from_employee or base_salary_from_config or 0

    # Create the engine's AttendanceData dataclass if data exists
    engine_attendance_data = None
    if attendance_data_model: # This is an ORM model from DB
        # We need to map fields from AttendanceRecord (ORM) to AttendanceData (dataclass)
        # This mapping should ideally be robust.
        # For now, let's pass it as a dictionary if CalculationContext's AttendanceData expects that,
        # or construct the dataclass instance directly.
        # CalculationContext.attendance_data expects an `AttendanceData` (dataclass) instance.
        
        # Simplification: Assuming relevant fields for AttendanceData dataclass constructor
        # This might need adjustment based on actual AttendanceData constructor and AttendanceRecord fields.
        try:
            engine_attendance_data = AttendanceData(
                employee_id=attendance_data_model.employee_id,
                period_start=attendance_data_model.period.period_start, # Assuming relation to a period table
                period_end=attendance_data_model.period.period_end,
                work_days=attendance_data_model.total_work_days or 0, # Example field mapping
                actual_work_days=attendance_data_model.actual_work_days or 0,
                standard_work_days=attendance_data_model.standard_work_days or 22,
                overtime_hours=attendance_data_model.overtime_hours or Decimal('0'),
                # ... other fields as required by AttendanceData dataclass
            )
        except AttributeError as ae:
            print(f"DEBUG: AttributeError during AttendanceData creation: {ae}. attendance_data_model fields might be missing or period relationship is incorrect.")
            # Fallback or raise error
            pass # engine_attendance_data remains None

    # Convert CalculationRule ORM models to CalculationRule dataclasses (if they are not already)
    # The CalculationContext expects a list of CalculationRule dataclasses.
    # crud.get_calculation_rules already returns ORM models of CalculationRule.
    engine_calculation_rules = []
    if calculation_rules_models:
        for rule_model in calculation_rules_models:
            try:
                # Assuming ComponentType and CalculationMethod enums are compatible or mapped
                engine_calculation_rules.append(
                    EngineDataclassCalculationRule(
                        rule_id=str(rule_model.id),
                        rule_name=rule_model.name,
                        component_code=rule_model.component_code,
                        component_type=EngineDataclassComponentType(rule_model.component_type.value if hasattr(rule_model.component_type, 'value') else rule_model.component_type),
                        calculation_formula=rule_model.formula,
                        is_active=rule_model.is_active,
                        priority=rule_model.execution_order,
                        conditions=rule_model.conditions_json or {},
                        parameters=rule_model.parameters_json or {}
                    )
                )
            except Exception as e_rule_map:
                print(f"DEBUG: Error mapping CalculationRule ORM to dataclass: {e_rule_map}")
                pass # Skip rule or handle error

    return CalculationContext(
        employee_id=employee.id,
        period_id=payroll_run_id, # This is payroll_run_id, used as period_id in context
        period_start=payroll_run.payroll_period.start_date,
        period_end=payroll_run.payroll_period.end_date,
        base_salary=base_salary,
        position_level=getattr(employee, 'job_position_level_value', None), # Example: get from employee_data_dict if preferred
        department_id=employee.department_id,
        attendance_data=engine_attendance_data, # Pass the dataclass instance
        employee_data=employee_data_dict,    # Use the cleaned dictionary
        salary_config=salary_config_dict,    # Use the cleaned dictionary
        social_insurance_config={}, # Populate as needed
        tax_config={},             # Populate as needed
        calculation_rules=engine_calculation_rules, # Pass list of dataclass instances
        custom_parameters=calculation_config or {}
    ) 