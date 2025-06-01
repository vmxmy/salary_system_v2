from typing import Optional, List, Dict, Any, Tuple, Union
import logging
from fastapi import HTTPException, status
from datetime import datetime, timezone
import uuid

# 注意：此文件已完成从psycopg2到SQLAlchemy ORM的迁移
# 所有数据库操作现在都使用SQLAlchemy ORM实现

# Import SQLAlchemy components
from sqlalchemy.orm import Session, joinedload, selectinload, relationship # type: ignore
import sqlalchemy
from sqlalchemy import func, or_, and_, text, Column, String, Integer, BigInteger, UniqueConstraint, ForeignKey, TIMESTAMP, Identity, Text, Numeric, Boolean # type: ignore
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
# We need JSONB specific type for PostgreSQL
from sqlalchemy.dialects.postgresql import JSONB # type: ignore

# Assuming schemas.py defines the Pydantic models like UserCreate, UserUpdate, RoleCreate etc.
from . import schemas
from . import models as db_models # Renaming to avoid conflict with the new 'models' package
from .database import Base
# 导入SalaryRecordUpdate类型
from .pydantic_models import SalaryRecordUpdate # type: ignore

logger = logging.getLogger(__name__)

# All functions have been moved to the webapp.models sub-package.
# Importing them here to maintain compatibility for any code
# that still imports directly from webapp.models_db
from .models import *