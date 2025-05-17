"""
职位相关的API路由。
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any

from ..database import get_db_v2
from ..crud import hr as crud
from ..pydantic_models.hr import JobTitleCreate, JobTitleUpdate, JobTitle, JobTitleListResponse
from ...auth import require_permissions
from ..utils import create_error_response

router = APIRouter(
    prefix="/v2/job-titles",
    tags=["v2 Job Titles"],
)


@router.get("/", response_model=JobTitleListResponse)
async def get_job_titles(
    parent_id: Optional[int] = None,
    is_active: Optional[bool] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(10, ge=1, le=100, description="Page size"),
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["P_JOB_TITLE_VIEW"]))
):
    """
    获取职位列表，支持分页、搜索和过滤。

    - **parent_id**: 父职位ID，用于获取特定职位的子职位
    - **is_active**: 是否激活，用于过滤激活或未激活的职位
    - **search**: 搜索关键字，可以匹配职位代码、名称或描述
    - **page**: 页码，从1开始
    - **size**: 每页记录数，最大100
    """
    try:
        # 计算跳过的记录数
        skip = (page - 1) * size

        # 获取职位列表
        job_titles, total = crud.get_job_titles(
            db=db,
            parent_id=parent_id,
            is_active=is_active,
            search=search,
            skip=skip,
            limit=size
        )

        # 计算总页数
        total_pages = (total + size - 1) // size if total > 0 else 1

        # 返回标准响应格式
        return {
            "data": job_titles,
            "meta": {
                "page": page,
                "size": size,
                "total": total,
                "totalPages": total_pages
            }
        }
    except Exception as e:
        # 返回标准错误响应格式
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="Internal Server Error",
                details=str(e)
            )
        )


@router.get("/{job_title_id}", response_model=Dict[str, JobTitle])
async def get_job_title(
    job_title_id: int,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["P_JOB_TITLE_VIEW"]))
):
    """
    根据ID获取职位详情。

    - **job_title_id**: 职位ID
    """
    try:
        # 获取职位
        job_title = crud.get_job_title(db, job_title_id)
        if not job_title:
            # 返回标准错误响应格式
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=create_error_response(
                    status_code=404,
                    message="Not Found",
                    details=f"Job title with ID {job_title_id} not found"
                )
            )

        # 返回标准响应格式
        return {"data": job_title}
    except HTTPException:
        raise
    except Exception as e:
        # 返回标准错误响应格式
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="Internal Server Error",
                details=str(e)
            )
        )


@router.post("/", response_model=Dict[str, JobTitle], status_code=status.HTTP_201_CREATED)
async def create_job_title(
    job_title: JobTitleCreate,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["P_JOB_TITLE_MANAGE"]))
):
    """
    创建新职位。

    - 需要 P_JOB_TITLE_MANAGE 权限
    """
    try:
        # 创建职位
        db_job_title = crud.create_job_title(db, job_title)

        # 返回标准响应格式
        return {"data": db_job_title}
    except ValueError as e:
        # 返回标准错误响应格式
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=create_error_response(
                status_code=422,
                message="Unprocessable Entity",
                details=str(e)
            )
        )
    except Exception as e:
        # 返回标准错误响应格式
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="Internal Server Error",
                details=str(e)
            )
        )


@router.put("/{job_title_id}", response_model=Dict[str, JobTitle])
async def update_job_title(
    job_title_id: int,
    job_title: JobTitleUpdate,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["P_JOB_TITLE_MANAGE"]))
):
    """
    更新职位信息。

    - **job_title_id**: 职位ID
    - 需要 P_JOB_TITLE_MANAGE 权限
    """
    try:
        # 更新职位
        db_job_title = crud.update_job_title(db, job_title_id, job_title)
        if not db_job_title:
            # 返回标准错误响应格式
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=create_error_response(
                    status_code=404,
                    message="Not Found",
                    details=f"Job title with ID {job_title_id} not found"
                )
            )

        # 返回标准响应格式
        return {"data": db_job_title}
    except ValueError as e:
        # 返回标准错误响应格式
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=create_error_response(
                status_code=422,
                message="Unprocessable Entity",
                details=str(e)
            )
        )
    except HTTPException:
        raise
    except Exception as e:
        # 返回标准错误响应格式
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="Internal Server Error",
                details=str(e)
            )
        )


@router.delete("/{job_title_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_job_title(
    job_title_id: int,
    db: Session = Depends(get_db_v2),
    current_user = Depends(require_permissions(["P_JOB_TITLE_MANAGE"]))
):
    """
    删除职位。

    - **job_title_id**: 职位ID
    - 需要 P_JOB_TITLE_MANAGE 权限
    """
    try:
        # 删除职位
        success = crud.delete_job_title(db, job_title_id)
        if not success:
            # 返回标准错误响应格式
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=create_error_response(
                    status_code=404,
                    message="Not Found",
                    details=f"Job title with ID {job_title_id} not found"
                )
            )

        # 返回204 No Content
        return None
    except ValueError as e:
        # 返回标准错误响应格式
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=create_error_response(
                status_code=409,
                message="Conflict",
                details=str(e)
            )
        )
    except HTTPException:
        raise
    except Exception as e:
        # 返回标准错误响应格式
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=create_error_response(
                status_code=500,
                message="Internal Server Error",
                details=str(e)
            )
        )
