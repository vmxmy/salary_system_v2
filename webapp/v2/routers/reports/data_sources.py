from typing import List, Optional, Dict, Any
import time
import json
import logging
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from ...database import get_db_v2
from ...models.security import User
from ....auth import get_current_user
from ...utils.permissions import (
    require_permission, has_permission, can_edit_datasource, 
    can_delete_datasource, filter_accessible_items
)
from ...crud.reports import ReportDataSourceCRUD
from ...pydantic_models.reports import (
    ReportDataSource, ReportDataSourceCreate, ReportDataSourceUpdate,
    DataSourceFieldDetection, DetectedField,
    DataSourceConnectionTest, DataSourceConnectionTestResponse
)
from ...pydantic_models.common import PaginationResponse, PaginationMeta

router = APIRouter(tags=["data-sources"])


@router.get("", response_model=PaginationResponse[ReportDataSource])
async def get_data_sources(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """获取数据源列表"""
    try:
        # 使用正确的CRUD方法
        data_sources, total = ReportDataSourceCRUD.get_all_with_filter(db, skip=skip, limit=limit)
        
        total_pages = (total + limit - 1) // limit if total > 0 else 1
        pagination_meta = PaginationMeta(
            page=(skip // limit) + 1,
            size=limit,
            total=total,
            totalPages=total_pages
        )
        return PaginationResponse[ReportDataSource](
            data=data_sources,
            meta=pagination_meta
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取数据源列表失败: {str(e)}")


@router.get("/{data_source_id}", response_model=ReportDataSource)
async def get_data_source(
    data_source_id: int,
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """获取数据源详情"""
    data_source = ReportDataSourceCRUD.get_by_id(db, data_source_id)
    if not data_source:
        raise HTTPException(status_code=404, detail="数据源不存在")
    
    # 检查访问权限
    if not has_permission(current_user, "report:admin") and data_source.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="无权访问此数据源")
    
    return data_source


@router.post("", response_model=ReportDataSource)
async def create_data_source(
    data_source: ReportDataSourceCreate,
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """创建数据源"""
    if not has_permission(current_user, "report:create_datasource"):
        raise HTTPException(status_code=403, detail="无权创建数据源")
    
    try:
        return ReportDataSourceCRUD.create(db, data_source, current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"创建数据源失败: {str(e)}")


@router.put("/{data_source_id}", response_model=ReportDataSource)
async def update_data_source(
    data_source_id: int,
    data_source: ReportDataSourceUpdate,
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """更新数据源"""
    # 先获取数据源检查权限
    existing_data_source = ReportDataSourceCRUD.get_by_id(db, data_source_id)
    if not existing_data_source:
        raise HTTPException(status_code=404, detail="数据源不存在")
    
    if not can_edit_datasource(current_user, existing_data_source.created_by):
        raise HTTPException(status_code=403, detail="无权编辑此数据源")
    
    updated_data_source = ReportDataSourceCRUD.update(db, data_source_id, data_source)
    return updated_data_source


@router.delete("/{data_source_id}")
async def delete_data_source(
    data_source_id: int,
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """删除数据源"""
    # 先获取数据源检查权限
    existing_data_source = ReportDataSourceCRUD.get_by_id(db, data_source_id)
    if not existing_data_source:
        raise HTTPException(status_code=404, detail="数据源不存在")
    
    if not can_delete_datasource(current_user, existing_data_source.created_by):
        raise HTTPException(status_code=403, detail="无权删除此数据源")
    
    success = ReportDataSourceCRUD.delete(db, data_source_id)
    return {"message": "数据源删除成功"}


@router.post("/test-connection")
async def test_data_source_connection(
    connection_test: DataSourceConnectionTest,
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """测试数据源连接"""
    try:
        result = ReportDataSourceCRUD.test_connection(db, connection_test)
        return result
    except Exception as e:
        return DataSourceConnectionTestResponse(
            success=False,
            message=f"连接测试失败: {str(e)}",
            error_details=str(e)
        )


@router.post("/detect-fields", response_model=List[DetectedField])
async def detect_data_source_fields(
    detection: DataSourceFieldDetection,
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """检测数据源字段"""
    return ReportDataSourceCRUD.detect_fields(db, detection)


@router.post("/{data_source_id}/sync-fields")
async def sync_data_source_fields(
    data_source_id: int,
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """同步数据源字段"""
    # 先获取数据源检查权限
    data_source = ReportDataSourceCRUD.get_by_id(db, data_source_id)
    if not data_source:
        raise HTTPException(status_code=404, detail="数据源不存在")
    
    # 检查同步字段权限
    if not can_edit_datasource(current_user, data_source.created_by):
        raise HTTPException(status_code=403, detail="无权同步此数据源的字段")
    
    try:
        # 执行字段同步
        synced_fields = ReportDataSourceCRUD.sync_fields(db, data_source_id)
        return {
            "message": "字段同步成功",
            "synced_count": len(synced_fields),
            "fields": synced_fields
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"字段同步失败: {str(e)}")


@router.get("/{data_source_id}/statistics")
async def get_data_source_statistics(
    data_source_id: int,
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """获取数据源统计信息"""
    # 先获取数据源检查权限
    data_source = ReportDataSourceCRUD.get_by_id(db, data_source_id)
    if not data_source:
        raise HTTPException(status_code=404, detail="数据源不存在")
    
    # 检查访问权限
    if not has_permission(current_user, "report:admin") and data_source.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="无权访问此数据源")
    
    try:
        statistics = ReportDataSourceCRUD.get_statistics(db, data_source_id)
        return statistics
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取统计信息失败: {str(e)}")


@router.get("/{data_source_id}/access-logs")
async def get_data_source_access_logs(
    data_source_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """获取数据源访问日志"""
    # 先获取数据源检查权限
    data_source = ReportDataSourceCRUD.get_by_id(db, data_source_id)
    if not data_source:
        raise HTTPException(status_code=404, detail="数据源不存在")
    
    # 检查访问权限
    if not has_permission(current_user, "report:admin") and data_source.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="无权访问此数据源")
    
    try:
        access_logs = ReportDataSourceCRUD.get_access_logs(db, data_source_id, skip, limit)
        return access_logs
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取访问日志失败: {str(e)}")


@router.get("/{data_source_id}/preview")
async def preview_data_source_data(
    data_source_id: int,
    limit: int = Query(10, ge=1, le=100),
    filters: Optional[str] = Query(None, description="JSON格式的筛选条件"),
    use_optimized_view: bool = Query(True, description="是否使用优化视图"),
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """预览数据源数据 - 支持视图优化"""
    # 先获取数据源检查权限
    data_source = ReportDataSourceCRUD.get_by_id(db, data_source_id)
    if not data_source:
        raise HTTPException(status_code=404, detail="数据源不存在")
    
    # 检查访问权限
    if not has_permission(current_user, "report:admin") and data_source.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="无权访问此数据源")
    
    start_time = time.time()
    
    try:
        filter_dict = {}
        if filters:
            try:
                filter_dict = json.loads(filters)
            except json.JSONDecodeError:
                raise HTTPException(status_code=400, detail="筛选条件格式错误")
        
        # 选择查询策略
        from ...services.report_optimization_service import ReportOptimizationService
        
        if use_optimized_view and ReportOptimizationService.should_use_optimized_view(data_source):
            preview_data = await ReportOptimizationService.execute_preview_query(db, data_source, limit, filter_dict)
            used_optimized = True
        else:
            # 使用原有方法
            preview_data = ReportDataSourceCRUD.preview_data(db, data_source_id, limit, filter_dict)
            used_optimized = False
        
        execution_time = time.time() - start_time
        
        return {
            "data": preview_data,
            "total_count": len(preview_data),
            "limit": limit,
            "execution_time": round(execution_time, 3),
            "used_optimized_view": used_optimized
        }
    except Exception as e:
        execution_time = time.time() - start_time
        logging.error(f"数据预览失败 - 数据源ID: {data_source_id}, 错误: {str(e)}, 耗时: {execution_time:.3f}s")
        raise HTTPException(status_code=500, detail=f"预览数据失败: {str(e)}")


@router.post("/preview-multi")
async def preview_multi_datasource_data(
    request: Dict[str, Any],
    db: Session = Depends(get_db_v2),
    current_user: User = Depends(get_current_user)
):
    """多数据源预览"""
    # 这里可以添加多数据源预览的逻辑
    # 暂时返回空实现
    return {"message": "多数据源预览功能待实现"} 