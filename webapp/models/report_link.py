from typing import Optional, List, Tuple
import logging

from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError, IntegrityError # Added IntegrityError
from fastapi import HTTPException, status # Added for error handling

# Assuming schemas.py defines Pydantic models like ReportLinkCreate, ReportLinkUpdate
# and models.py defines the ORM model ReportLink
from .. import schemas
from .. import models # Adjusted import

logger = logging.getLogger(__name__)

# --- ORM Functions for Report Link Management --- START ---

def create_report_link(db: Session, report_link: schemas.ReportLinkCreate) -> 'models.ReportLink':
    """创建新报表链接"""
    try:
        db_report_link = models.ReportLink(**report_link.model_dump()) # Use model_dump() for Pydantic v2
        db.add(db_report_link)
        db.commit()
        db.refresh(db_report_link)
        return db_report_link
    except IntegrityError as e: # Catch unique constraint violations or other integrity issues
        db.rollback()
        logger.error(f"Integrity error creating report link: {e}", exc_info=True)
        # Determine specific error if possible, e.g., duplicate name if there's a unique constraint
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Report link creation failed due to integrity constraint: {e.orig}") from e
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"SQLAlchemy error creating report link: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Database error creating report link.") from e

def get_report_links(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    active_only: bool = False,
    category: Optional[str] = None
) -> Tuple[List['models.ReportLink'], int]:
    """获取报表链接列表，支持分页和过滤"""
    try:
        query = db.query(models.ReportLink)

        if active_only:
            query = query.filter(models.ReportLink.is_active == True)
        if category:
            query = query.filter(models.ReportLink.category == category)

        total_count = query.count()
        report_links_list = query.order_by(models.ReportLink.display_order, models.ReportLink.name).offset(skip).limit(limit).all()
        return report_links_list, total_count
    except SQLAlchemyError as e:
        logger.error(f"SQLAlchemy error fetching report links: {e}", exc_info=True)
        return [], 0

def get_report_link_by_id(db: Session, report_link_id: int) -> Optional['models.ReportLink']:
    """通过ID获取单个报表链接"""
    try:
        return db.query(models.ReportLink).filter(models.ReportLink.id == report_link_id).first()
    except SQLAlchemyError as e:
        logger.error(f"SQLAlchemy error fetching report link by ID {report_link_id}: {e}", exc_info=True)
        return None

def update_report_link(
    db: Session,
    report_link_id: int,
    report_link_update: schemas.ReportLinkUpdate
) -> Optional['models.ReportLink']:
    """更新报表链接"""
    db_report_link = get_report_link_by_id(db, report_link_id) # Use existing function
    if not db_report_link:
        return None

    update_data = report_link_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_report_link, key, value)

    try:
        db.commit()
        db.refresh(db_report_link)
        return db_report_link
    except IntegrityError as e:
        db.rollback()
        logger.error(f"Integrity error updating report link {report_link_id}: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Report link update failed due to integrity constraint: {e.orig}") from e
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"SQLAlchemy error updating report link {report_link_id}: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Database error updating report link.") from e

def delete_report_link(db: Session, report_link_id: int) -> bool:
    """删除报表链接"""
    db_report_link = get_report_link_by_id(db, report_link_id) # Use existing function
    if not db_report_link:
        # Consider raising HTTPException 404 Not Found
        # raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Report link with ID {report_link_id} not found.")
        return False # Or return False as per original possible intent

    try:
        db.delete(db_report_link)
        db.commit()
        return True
    except IntegrityError as e: # Should not happen if no FKs to ReportLink, but good practice
        db.rollback()
        logger.error(f"Integrity error deleting report link {report_link_id}: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Cannot delete report link {report_link_id} due to existing associations.") from e
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"SQLAlchemy error deleting report link {report_link_id}: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Database error deleting report link.") from e

# --- ORM Functions for Report Link Management --- END --- 