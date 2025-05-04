from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from sqlalchemy.orm import Session
import logging

# Adjust imports based on actual locations of these modules/functions
from .. import schemas, models_db, auth
from ..database import get_db # Ensure this is relative
from ..schemas import UnitBase, UnitCreate, UnitUpdate, Unit, UnitListResponse

logger = logging.getLogger(__name__) # Ensure logger is setup for this module

router = APIRouter(
    prefix="/units",
    tags=["Units"]
)

# --- CRUD Endpoints for Units ---

@router.post("/", response_model=Unit, status_code=status.HTTP_201_CREATED)
async def create_unit_endpoint(
    unit: UnitCreate,
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(auth.require_role(["Super Admin", "Data Admin"]))
):
    """创建新单位，需要Super Admin或Data Admin权限"""
    logger.info(f"用户 {current_user.username} 创建了新单位 '{unit.name}'")
    try:
        # Call the ORM function from models_db
        created_unit = models_db.create_unit_orm(db=db, unit=unit)
        logger.info(f"Successfully created unit '{created_unit.name}' with ID {created_unit.id}")
        return created_unit
    except Exception as e:
        logger.error(f"创建单位失败: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"创建单位失败: {str(e)}"
        )

@router.get("/", response_model=UnitListResponse)
async def get_units(
    search: Optional[str] = None,
    page: int = Query(1, ge=1, description="页码，从1开始"),
    page_size: int = Query(10, ge=1, le=100, description="每页记录数"),
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(auth.get_current_user)
):
    """获取单位列表，支持分页和搜索"""
    offset = (page - 1) * page_size
    logger.info(f"User {current_user.username} fetching units. Filters: search='{search}', page={page}, size={page_size}")
    try:
        units, total = models_db.get_units_orm(
            db=db,
            search=search,
            skip=offset,
            limit=page_size
        )
        logger.info(f"Found {total} units matching criteria. Returning {len(units)} for page {page}.")
        
        # 添加调试日志，查看每个单位的详细信息
        for unit in units:
            logger.info(f"Unit data: ID={unit.id}, Name={unit.name}, Description={unit.description}")
        
        response = {"data": units, "total": total}
        logger.info(f"Response structure: {response}")
        
        # Pydantic handles the conversion from ORM objects for the response model
        return response
    except Exception as e:
        logger.error(f"Error fetching units: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An internal server error occurred while fetching units."
        ) from e

@router.get("/{unit_id}", response_model=Unit)
async def get_unit(
    unit_id: int,
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(auth.get_current_user)
):
    """获取单个单位详情"""
    logger.info(f"User {current_user.username} attempting to fetch unit with ID: {unit_id}")
    try:
        unit = models_db.get_unit_by_id_orm(db=db, unit_id=unit_id)
        if unit is None:
            logger.warning(f"Unit with ID {unit_id} not found.")
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Unit with ID {unit_id} not found.")
        
        logger.info(f"Successfully fetched unit '{unit.name}' (ID: {unit_id})")
        # Pydantic handles the conversion from the ORM object
        return unit
    except HTTPException as http_exc:
        # Re-raise known HTTP exceptions (like the 404 above)
        raise http_exc
    except Exception as e:
        logger.error(f"Error fetching unit {unit_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An internal server error occurred while fetching unit {unit_id}."
        ) from e

@router.put("/{unit_id}", response_model=Unit)
async def update_unit_endpoint(
    unit_id: int,
    unit_update: UnitUpdate,
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(auth.require_role(["Super Admin", "Data Admin"]))
):
    """更新单位信息，需要Super Admin或Data Admin权限"""
    logger.info(f"User {current_user.username} attempting to update unit ID: {unit_id} with data: {unit_update.model_dump(exclude_unset=True)}")
    try:
        updated_unit = models_db.update_unit_orm(
            db=db, 
            unit_id=unit_id, 
            unit_update=unit_update
        )
        # update_unit_orm returns None if not found, and raises 409 on conflict
        if updated_unit is None:
             logger.warning(f"Attempted to update non-existent unit ID: {unit_id}")
             raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Unit with ID {unit_id} not found.")
             
        logger.info(f"Successfully updated unit ID: {unit_id}")
        return updated_unit
    except HTTPException as http_exc:
        # Re-raise known HTTP exceptions (404, 409, etc.)
        logger.warning(f"HTTPException during update for unit ID {unit_id}: {http_exc.detail}")
        raise http_exc
    except Exception as e:
        logger.error(f"Error updating unit {unit_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An internal server error occurred while updating unit {unit_id}."
        ) from e

@router.delete("/{unit_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_unit_endpoint(
    unit_id: int,
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(auth.require_role(["Super Admin", "Data Admin"]))
):
    """删除单位，需要Super Admin或Data Admin权限"""
    # 检查是否有部门关联到此单位
    departments = models_db.get_departments_by_unit_id_orm(db, unit_id)
    if departments and len(departments) > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"无法删除单位，该单位下有 {len(departments)} 个关联部门"
        )
    
    logger.info(f"User {current_user.username} attempting to delete unit ID: {unit_id}")
    try:
        # delete_unit_orm raises 404 or 409 if deletion cannot proceed
        deleted = models_db.delete_unit_orm(db=db, unit_id=unit_id)
        
        # If delete_unit_orm was modified to return False instead of raising 404, 
        # uncomment the following check:
        # if not deleted:
        #     logger.warning(f"Attempted to delete non-existent unit ID: {unit_id}")
        #     raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Unit with ID {unit_id} not found.")

        # If the function returned True (or didn't raise an exception like 404/409)
        logger.info(f"Successfully deleted unit ID: {unit_id}")
        # FastAPI automatically returns 204 No Content based on the status_code
        return

    except HTTPException as http_exc:
        # Re-raise known HTTP exceptions (like 404 Not Found or 409 Conflict from models_db)
        logger.warning(f"HTTPException during delete for unit ID {unit_id}: {http_exc.detail}")
        raise http_exc
    except Exception as e:
        logger.error(f"Error deleting unit {unit_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An internal server error occurred while deleting unit {unit_id}."
        ) from e

@router.get("/list/names", response_model=List[str])
async def get_unit_names(
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(auth.get_current_user)
):
    """获取所有单位名称，用于下拉菜单等场景"""
    names = models_db.get_all_unit_names_orm(db)
    return names

# Endpoints for Units are now complete in this router file. 