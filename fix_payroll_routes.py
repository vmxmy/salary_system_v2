#!/usr/bin/env python3
"""
修复 payroll-components 路由问题的脚本
在 config.py 中添加兼容性路由别名
"""

def fix_payroll_routes():
    """修复 payroll-components 路由"""
    
    config_file = "webapp/v2/routers/config.py"
    
    # 读取原文件
    with open(config_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 查找插入点
    insert_point = content.find('# PayrollComponentDefinition endpoints')
    
    if insert_point == -1:
        print("❌ 找不到插入点")
        return False
    
    # 在文件末尾添加兼容性路由
    additional_routes = '''

# ==================== 兼容性路由别名 ====================
# 为了兼容前端的 /payroll-components 路径

@router.get("/payroll-components", response_model=PayrollComponentDefinitionListResponse)
async def get_payroll_components_compat(
    component_type: Optional[str] = None,
    is_active: Optional[bool] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(10, ge=1, le=100, description="Page size"),
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["payroll_component:view"]))
):
    """获取工资组件定义列表 (兼容性路由)"""
    try:
        skip = (page - 1) * size
        result = crud.get_payroll_component_definitions(
            db=db,
            component_type=component_type,
            is_active=is_active,
            search=search,
            skip=skip,
            limit=size
        )
        return result
    except Exception as e:
        logging.error(f"Error getting payroll components: {str(e)}")
        return {
            "data": [],
            "meta": {
                "page": page,
                "size": size,
                "total": 0,
                "totalPages": 1
            }
        }

@router.get("/payroll-components/{component_id}", response_model=DataResponse[PayrollComponentDefinition])
async def get_payroll_component_compat(
    component_id: int,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["payroll_component:view"]))
):
    """根据ID获取工资组件定义详情 (兼容性路由)"""
    try:
        component = crud.get_payroll_component_definition(db, component_id)
        if not component:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=create_error_response(
                    status_code=404,
                    message="Not Found",
                    details=f"Payroll component definition with ID {component_id} not found"
                )
            )
        return DataResponse[PayrollComponentDefinition](data=component)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="Internal Server Error",
                details=str(e)
            )
        )
'''
    
    # 在文件末尾添加兼容性路由
    content += additional_routes
    
    # 写回文件
    with open(config_file, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("✅ 已添加兼容性路由")
    return True

if __name__ == "__main__":
    success = fix_payroll_routes()
    if success:
        print("✅ 路由修复完成！")
        print("💡 现在前端可以使用 /config/payroll-components 路径了")
    else:
        print("❌ 路由修复失败！") 