from typing import Optional, List
import logging

import sqlalchemy
from sqlalchemy.orm import Session

# Assuming models.py defines the ORM model like Role
from .. import models # Adjusted import for sibling 'models.py'

logger = logging.getLogger(__name__)

# --- Role DB Operations (SQLAlchemy ORM Version) ---

def get_role_by_id(db: Session, role_id: int) -> Optional['models.Role']:
    """Fetches a role by its ID using SQLAlchemy ORM."""
    try:
        return db.query(models.Role).filter(models.Role.id == role_id).first()
    except sqlalchemy.exc.SQLAlchemyError as e:
        logger.error(f"SQLAlchemy error fetching role by ID {role_id}: {e}")
        return None

def get_role_by_name(db: Session, role_name: str) -> Optional['models.Role']:
    """Fetches a role by its name using SQLAlchemy ORM."""
    try:
        return db.query(models.Role).filter(models.Role.name == role_name).first()
    except sqlalchemy.exc.SQLAlchemyError as e:
        logger.error(f"SQLAlchemy error fetching role by name {role_name}: {e}")
        return None

def get_roles(db: Session) -> List['models.Role']:
    """Fetches all roles from the database using SQLAlchemy ORM."""
    try:
        return db.query(models.Role).order_by(models.Role.id).all()
    except sqlalchemy.exc.SQLAlchemyError as e:
        logger.error(f"SQLAlchemy error fetching all roles: {e}")
        return [] 