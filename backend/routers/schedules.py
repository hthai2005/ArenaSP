from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    status
)

from sqlalchemy.orm import Session

from database import get_db

from models import (
    Hall,
    Schedule,
    User
)

from schemas import (
    ScheduleCreate,
    ScheduleUpdate,
    ScheduleResponse
)

from rbac import require_permission


router = APIRouter(
    prefix="/api/schedules",
    tags=["Lịch hoạt động"]
)


# =====================================================
# KIỂM TRA TRÙNG LỊCH
# =====================================================

def check_schedule_conflict(
    db: Session,
    hall_id: int,
    start_time,
    end_time,
    exclude_schedule_id: int | None = None
):

    query = db.query(Schedule).filter(
        Schedule.hall_id == hall_id,
        Schedule.status != "CANCELLED",
        Schedule.start_time < end_time,
        Schedule.end_time > start_time
    )

    if exclude_schedule_id is not None:
        query = query.filter(
            Schedule.id != exclude_schedule_id
        )

    return query.first()


# =====================================================
# LẤY DANH SÁCH LỊCH
# =====================================================

@router.get(
    "/",
    response_model=list[ScheduleResponse]
)
def get_schedules(
    hall_id: int | None = Query(default=None),

    db: Session = Depends(get_db),

    current_user: User = Depends(
        require_permission("SCHEDULE_VIEW")
    )
):

    query = db.query(Schedule)

    if hall_id is not None:
        query = query.filter(
            Schedule.hall_id == hall_id
        )

    return (
        query
        .order_by(Schedule.start_time.asc())
        .all()
    )


# =====================================================
# XEM CHI TIẾT LỊCH
# =====================================================

@router.get(
    "/{schedule_id}",
    response_model=ScheduleResponse
)
def get_schedule(
    schedule_id: int,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        require_permission("SCHEDULE_VIEW")
    )
):

    schedule = db.query(Schedule).filter(
        Schedule.id == schedule_id
    ).first()

    if not schedule:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy lịch hoạt động"
        )

    return schedule


# =====================================================
# TẠO LỊCH
# =====================================================

@router.post(
    "/",
    response_model=ScheduleResponse,
    status_code=status.HTTP_201_CREATED
)
def create_schedule(
    data: ScheduleCreate,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        require_permission("SCHEDULE_CREATE")
    )
):

    hall = db.query(Hall).filter(
        Hall.id == data.hall_id
    ).first()

    if not hall:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy khu vực thi đấu"
        )

    if hall.status != "active":
        raise HTTPException(
            status_code=400,
            detail="Khu vực hiện không hoạt động hoặc đang bảo trì"
        )

    conflict = check_schedule_conflict(
        db=db,
        hall_id=data.hall_id,
        start_time=data.start_time,
        end_time=data.end_time
    )

    if conflict:
        raise HTTPException(
            status_code=400,
            detail="Khung giờ này đã có lịch hoạt động"
        )

    new_schedule = Schedule(
        hall_id=data.hall_id,
        title=data.title,
        start_time=data.start_time,
        end_time=data.end_time,
        status=data.status,
        description=data.description
    )

    db.add(new_schedule)
    db.commit()
    db.refresh(new_schedule)

    return new_schedule


# =====================================================
# CẬP NHẬT LỊCH
# =====================================================

@router.put(
    "/{schedule_id}",
    response_model=ScheduleResponse
)
def update_schedule(
    schedule_id: int,
    data: ScheduleUpdate,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        require_permission("SCHEDULE_UPDATE")
    )
):

    schedule = db.query(Schedule).filter(
        Schedule.id == schedule_id
    ).first()

    if not schedule:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy lịch hoạt động"
        )

    update_data = data.model_dump(
        exclude_unset=True
    )

    hall_id = update_data.get(
        "hall_id",
        schedule.hall_id
    )

    start_time = update_data.get(
        "start_time",
        schedule.start_time
    )

    end_time = update_data.get(
        "end_time",
        schedule.end_time
    )

    if end_time <= start_time:
        raise HTTPException(
            status_code=400,
            detail="end_time phải lớn hơn start_time"
        )

    hall = db.query(Hall).filter(
        Hall.id == hall_id
    ).first()

    if not hall:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy khu vực thi đấu"
        )

    conflict = check_schedule_conflict(
        db=db,
        hall_id=hall_id,
        start_time=start_time,
        end_time=end_time,
        exclude_schedule_id=schedule_id
    )

    if conflict:
        raise HTTPException(
            status_code=400,
            detail="Khung giờ này bị trùng lịch"
        )

    for field, value in update_data.items():
        setattr(
            schedule,
            field,
            value
        )

    db.commit()
    db.refresh(schedule)

    return schedule


# =====================================================
# XÓA LỊCH
# =====================================================

@router.delete("/{schedule_id}")
def delete_schedule(
    schedule_id: int,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        require_permission("SCHEDULE_DELETE")
    )
):

    schedule = db.query(Schedule).filter(
        Schedule.id == schedule_id
    ).first()

    if not schedule:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy lịch hoạt động"
        )

    db.delete(schedule)
    db.commit()

    return {
        "message": "Xóa lịch hoạt động thành công"
    }