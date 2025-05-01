from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import logging

from ..database import get_db
from .. import schemas, models_db, auth

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/", response_model=schemas.ReportLinkResponse, status_code=status.HTTP_201_CREATED)
async def create_report_link(
    report_link: schemas.ReportLinkCreate,
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(auth.require_role(["Super Admin"]))
):
    """创建新的报表链接"""
    try:
        result = models_db.create_report_link(db, report_link)
        return result
    except Exception as e:
        logger.error(f"创建报表链接时发生错误: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="创建报表链接时发生服务器错误"
        )

@router.get("/", response_model=schemas.ReportLinkListResponse)
async def get_report_links(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    active_only: bool = Query(False),
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(auth.get_current_user)
):
    """获取报表链接列表"""
    try:
        report_links, total = models_db.get_report_links(
            db, skip=skip, limit=limit, active_only=active_only, category=category
        )
        return {"data": report_links, "total": total}
    except Exception as e:
        logger.error(f"获取报表链接列表时发生错误: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="获取报表链接时发生服务器错误"
        )

@router.get("/active", response_model=List[schemas.ActiveReportLinkResponse])
async def get_active_report_links(
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(auth.get_current_user)
):
    """获取活跃的报表链接列表（用于菜单）"""
    try:
        report_links, _ = models_db.get_report_links(
            db, active_only=True, category=category, limit=1000 # Fetch more for filtering initially
        )
        
        # 基于用户角色过滤报表
        # Correct: Access the single role name from the nested role object
        user_role_name = current_user.role.name if current_user.role else None
        
        filtered_links = [
            link for link in report_links 
            # Correct: Check if report requires no role OR if user's role matches the required role
            if not link.require_role or (user_role_name and link.require_role == user_role_name)
        ]
        
        return filtered_links
    except Exception as e:
        logger.error(f"获取活跃报表链接时发生错误: {e}", exc_info=True) # Add exc_info for more details
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="获取活跃报表链接时发生服务器错误"
        )

@router.get("/{report_link_id}", response_model=schemas.ReportLinkResponse)
async def get_report_link(
    report_link_id: int,
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(auth.get_current_user)
):
    """获取特定报表链接"""
    report_link = models_db.get_report_link_by_id(db, report_link_id)
    if not report_link:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"ID为{report_link_id}的报表链接不存在"
        )
    return report_link

@router.put("/{report_link_id}", response_model=schemas.ReportLinkResponse)
async def update_report_link(
    report_link_id: int,
    report_link_update: schemas.ReportLinkUpdate,
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(auth.require_role(["Super Admin"]))
):
    """更新报表链接"""
    updated_link = models_db.update_report_link(db, report_link_id, report_link_update)
    if not updated_link:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"ID为{report_link_id}的报表链接不存在"
        )
    return updated_link

@router.delete("/{report_link_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_report_link(
    report_link_id: int,
    db: Session = Depends(get_db),
    current_user: schemas.UserResponse = Depends(auth.require_role(["Super Admin"]))
):
    """删除报表链接"""
    deleted = models_db.delete_report_link(db, report_link_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"ID为{report_link_id}的报表链接不存在"
        )
    return None 