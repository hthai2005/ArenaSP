from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query
)

from sqlalchemy.orm import Session

from database import get_db

from models import (
    ActivityLog,
    User
)

from schemas import ActivityLogResponse

from rbac import require_permission


router = APIRouter(
    prefix="/api/activity-logs",
    tags=["Nhật ký hoạt động"]
)


# =====================================================
# LẤY DANH SÁCH LOG
# =====================================================

@router.get(
    "/",
    response_model=list[ActivityLogResponse]
)
def get_activity_logs(
    user_id: int | None = Query(default=None),

    db: Session = Depends(get_db),

    current_user: User = Depends(
        require_permission("LOG_VIEW")
    )
):

    query = db.query(ActivityLog)

    if user_id is not None:
        query = query.filter(
            ActivityLog.user_id == user_id
        )

    return (
        query
        .order_by(ActivityLog.id.desc())
        .all()
    )


# =====================================================
# XEM CHI TIẾT LOG
# =====================================================

@router.get(
    "/{log_id}",
    response_model=ActivityLogResponse
)
def get_activity_log(
    log_id: int,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        require_permission("LOG_VIEW")
    )
):

    log = db.query(ActivityLog).filter(
        ActivityLog.id == log_id
    ).first()

    if not log:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy nhật ký hoạt động"
        )

    return log