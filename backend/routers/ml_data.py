from collections import defaultdict

from datetime import (
    date,
    datetime,
    time,
    timedelta
)

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query
)

from sqlalchemy.orm import Session

from database import get_db

from models import (
    Hall,
    Schedule,
    User
)

from schemas import MLHistoryResponse

from rbac import require_permission


# =====================================================
# ROUTER
# =====================================================

router = APIRouter(
    prefix="/api/ml-data",
    tags=["Dữ liệu học máy"]
)


# =====================================================
# THỜI GIAN HOẠT ĐỘNG NHÀ THI ĐẤU
# 08:00 -> 22:00 = 14 giờ
# =====================================================

OPEN_HOUR = 8
CLOSE_HOUR = 22

OPEN_MINUTES = (
    CLOSE_HOUR - OPEN_HOUR
) * 60


# =====================================================
# API LẤY DỮ LIỆU LỊCH SỬ / FEATURES
# =====================================================

@router.get(
    "/history",
    response_model=list[MLHistoryResponse]
)
def get_ml_history(
    hall_id: int | None = Query(
        default=None,
        alias="hallId"
    ),

    date_from: date | None = Query(
        default=None,
        alias="dateFrom"
    ),

    date_to: date | None = Query(
        default=None,
        alias="dateTo"
    ),

    db: Session = Depends(get_db),

    current_user: User = Depends(
        require_permission(
            "PREDICTION_VIEW"
        )
    )
):

    # =================================================
    # NGÀY KẾT THÚC
    # Chỉ lấy lịch sử, không lấy tương lai
    # =================================================

    yesterday = (
        date.today()
        - timedelta(days=1)
    )

    if date_to is None:
        date_to = yesterday

    if date_to > yesterday:
        date_to = yesterday

    # =================================================
    # NGÀY BẮT ĐẦU
    # Mặc định lấy 90 ngày
    # =================================================

    if date_from is None:

        date_from = (
            date_to
            - timedelta(days=89)
        )

    if date_from > date_to:

        raise HTTPException(
            status_code=400,
            detail=(
                "dateFrom phải nhỏ hơn "
                "hoặc bằng dateTo"
            )
        )

    # =================================================
    # LẤY HALL
    # =================================================

    hall_query = db.query(Hall)

    if hall_id is not None:

        hall_query = hall_query.filter(
            Hall.id == hall_id
        )

    halls = (
        hall_query
        .order_by(Hall.id.asc())
        .all()
    )

    if not halls:

        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy khu vực thi đấu"
        )

    hall_ids = [
        hall.id
        for hall in halls
    ]

    # =================================================
    # LẤY SCHEDULE LỊCH SỬ
    #
    # Chỉ lấy COMPLETED
    # và chỉ lấy lịch đã xảy ra
    # =================================================

    start_datetime = datetime.combine(
        date_from,
        time.min
    )

    end_datetime = datetime.combine(
        date_to,
        time.max
    )

    schedules = (
        db.query(Schedule)
        .filter(
            Schedule.hall_id.in_(
                hall_ids
            ),

            Schedule.status == "COMPLETED",

            Schedule.start_time
            <= end_datetime,

            Schedule.end_time
            >= start_datetime,

            Schedule.end_time
            < datetime.now()
        )
        .order_by(
            Schedule.start_time.asc()
        )
        .all()
    )

    # =================================================
    # TÍNH SỐ PHÚT SỬ DỤNG THEO HALL / NGÀY
    # =================================================

    usage_minutes = defaultdict(float)

    for schedule in schedules:

        current_date = max(
            schedule.start_time.date(),
            date_from
        )

        last_date = min(
            schedule.end_time.date(),
            date_to
        )

        while current_date <= last_date:

            day_open = datetime.combine(
                current_date,
                time(
                    OPEN_HOUR,
                    0
                )
            )

            day_close = datetime.combine(
                current_date,
                time(
                    CLOSE_HOUR,
                    0
                )
            )

            overlap_start = max(
                schedule.start_time,
                day_open
            )

            overlap_end = min(
                schedule.end_time,
                day_close
            )

            if overlap_end > overlap_start:

                minutes = (
                    overlap_end
                    - overlap_start
                ).total_seconds() / 60

                usage_minutes[
                    (
                        schedule.hall_id,
                        current_date
                    )
                ] += minutes

            current_date += timedelta(
                days=1
            )

    # =================================================
    # TẠO FEATURES CHO FRONTEND + RANDOM FOREST
    # =================================================

    result = []

    for hall in halls:

        current_date = date_from

        while current_date <= date_to:

            minutes = usage_minutes.get(
                (
                    hall.id,
                    current_date
                ),
                0
            )

            usage_percent = (
                minutes
                / OPEN_MINUTES
                * 100
            )

            usage_percent = min(
                usage_percent,
                100
            )

            weekday = (
                current_date.weekday()
            )

            is_weekend = (
                1
                if weekday >= 5
                else 0
            )

            result.append(
                {
                    "hall_id": hall.id,

                    "hall_code": hall.code,

                    "hall_name": hall.name,

                    "date": current_date,

                    "capacity": hall.capacity,

                    "weekday": weekday,

                    "month": (
                        current_date.month
                    ),

                    "is_weekend": (
                        is_weekend
                    ),

                    "usage_minutes": round(
                        minutes,
                        2
                    ),

                    "usage_percent": round(
                        usage_percent,
                        2
                    )
                }
            )

            current_date += timedelta(
                days=1
            )

    return result