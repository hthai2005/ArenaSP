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
    Booking,
    Hall,
    Prediction,
    Schedule,
    Stadium,
    User
)

from schemas import (
    DashboardSummaryResponse,
    HallOccupancyResponse,
    DailyOccupancyResponse
)

from rbac import require_permission


# =====================================================
# ROUTER
# =====================================================

router = APIRouter(
    prefix="/api/reports",
    tags=["Thống kê"]
)


# =====================================================
# THỜI GIAN HOẠT ĐỘNG
# 08:00 -> 22:00
# =====================================================

OPEN_HOUR = 8
CLOSE_HOUR = 22

OPEN_MINUTES = (
    CLOSE_HOUR - OPEN_HOUR
) * 60


# =====================================================
# HÀM TÍNH SỐ PHÚT SỬ DỤNG
# =====================================================

def calculate_schedule_minutes(
    schedule: Schedule,
    date_from: date,
    date_to: date
):

    total_minutes = 0.0

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

            total_minutes += (
                overlap_end
                - overlap_start
            ).total_seconds() / 60

        current_date += timedelta(
            days=1
        )

    return total_minutes


# =====================================================
# CHUẨN HÓA KHOẢNG NGÀY
# =====================================================

def resolve_date_range(
    date_from: date | None,
    date_to: date | None
):

    today = date.today()

    if date_to is None:
        date_to = today

    if date_from is None:
        date_from = (
            date_to
            - timedelta(days=29)
        )

    if date_from > date_to:

        raise HTTPException(
            status_code=400,
            detail=(
                "dateFrom phải nhỏ hơn "
                "hoặc bằng dateTo"
            )
        )

    return (
        date_from,
        date_to
    )


# =====================================================
# DASHBOARD TỔNG QUAN
# =====================================================

@router.get(
    "/dashboard",
    response_model=DashboardSummaryResponse
)
def get_dashboard_summary(
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
            "REPORT_VIEW"
        )
    )
):

    (
        date_from,
        date_to
    ) = resolve_date_range(
        date_from,
        date_to
    )

    # =================================================
    # THỐNG KÊ CƠ BẢN
    # =================================================

    total_stadiums = (
        db.query(Stadium)
        .count()
    )

    total_halls = (
        db.query(Hall)
        .count()
    )

    active_halls = (
        db.query(Hall)
        .filter(
            Hall.status == "active"
        )
        .count()
    )

    maintenance_halls = (
        db.query(Hall)
        .filter(
            Hall.status == "maintenance"
        )
        .count()
    )

    total_users = (
        db.query(User)
        .count()
    )

    pending_bookings = (
        db.query(Booking)
        .filter(
            Booking.status == "PENDING"
        )
        .count()
    )

    approved_bookings = (
        db.query(Booking)
        .filter(
            Booking.status == "APPROVED"
        )
        .count()
    )

    high_risk_predictions = (
        db.query(Prediction)
        .filter(
            Prediction.risk_level == "HIGH"
        )
        .count()
    )

    # =================================================
    # SCHEDULE TRONG KHOẢNG NGÀY
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
            Schedule.status != "CANCELLED",

            Schedule.start_time
            <= end_datetime,

            Schedule.end_time
            >= start_datetime
        )
        .all()
    )

    total_schedules = len(
        schedules
    )

    # =================================================
    # TÍNH TỶ LỆ LẤP ĐẦY
    # =================================================

    total_usage_minutes = 0.0

    for schedule in schedules:

        total_usage_minutes += (
            calculate_schedule_minutes(
                schedule,
                date_from,
                date_to
            )
        )

    number_of_days = (
        date_to - date_from
    ).days + 1

    available_minutes = (
        active_halls
        * number_of_days
        * OPEN_MINUTES
    )

    if available_minutes > 0:

        average_occupancy = (
            total_usage_minutes
            / available_minutes
            * 100
        )

    else:

        average_occupancy = 0

    average_occupancy = min(
        average_occupancy,
        100
    )

    return {
        "total_stadiums": (
            total_stadiums
        ),

        "total_halls": (
            total_halls
        ),

        "active_halls": (
            active_halls
        ),

        "maintenance_halls": (
            maintenance_halls
        ),

        "total_users": (
            total_users
        ),

        "pending_bookings": (
            pending_bookings
        ),

        "approved_bookings": (
            approved_bookings
        ),

        "total_schedules": (
            total_schedules
        ),

        "average_occupancy": round(
            average_occupancy,
            2
        ),

        "high_risk_predictions": (
            high_risk_predictions
        )
    }


# =====================================================
# THỐNG KÊ LẤP ĐẦY THEO KHU VỰC
# =====================================================

@router.get(
    "/occupancy",
    response_model=list[
        HallOccupancyResponse
    ]
)
def get_hall_occupancy(
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
            "REPORT_VIEW"
        )
    )
):

    (
        date_from,
        date_to
    ) = resolve_date_range(
        date_from,
        date_to
    )

    halls = (
        db.query(Hall)
        .order_by(
            Hall.id.asc()
        )
        .all()
    )

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
            Schedule.status != "CANCELLED",

            Schedule.start_time
            <= end_datetime,

            Schedule.end_time
            >= start_datetime
        )
        .all()
    )

    schedules_by_hall = defaultdict(
        list
    )

    for schedule in schedules:

        schedules_by_hall[
            schedule.hall_id
        ].append(
            schedule
        )

    number_of_days = (
        date_to
        - date_from
    ).days + 1

    result = []

    for hall in halls:

        hall_schedules = (
            schedules_by_hall.get(
                hall.id,
                []
            )
        )

        usage_minutes = 0.0

        for schedule in hall_schedules:

            usage_minutes += (
                calculate_schedule_minutes(
                    schedule,
                    date_from,
                    date_to
                )
            )

        available_minutes = (
            number_of_days
            * OPEN_MINUTES
        )

        if available_minutes > 0:

            usage_percent = (
                usage_minutes
                / available_minutes
                * 100
            )

        else:

            usage_percent = 0

        usage_percent = min(
            usage_percent,
            100
        )

        result.append(
            {
                "hall_id": hall.id,

                "hall_code": hall.code,

                "hall_name": hall.name,

                "usage_minutes": round(
                    usage_minutes,
                    2
                ),

                "available_minutes": round(
                    available_minutes,
                    2
                ),

                "usage_percent": round(
                    usage_percent,
                    2
                ),

                "schedule_count": len(
                    hall_schedules
                )
            }
        )

    return result


# =====================================================
# BIỂU ĐỒ LẤP ĐẦY THEO NGÀY
# =====================================================

@router.get(
    "/occupancy/daily",
    response_model=list[
        DailyOccupancyResponse
    ]
)
def get_daily_occupancy(
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
            "REPORT_VIEW"
        )
    )
):

    (
        date_from,
        date_to
    ) = resolve_date_range(
        date_from,
        date_to
    )

    active_halls = (
        db.query(Hall)
        .filter(
            Hall.status == "active"
        )
        .all()
    )

    active_hall_ids = [
        hall.id
        for hall in active_halls
    ]

    # Không có hall active
    if not active_hall_ids:

        return []

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
                active_hall_ids
            ),

            Schedule.status
            != "CANCELLED",

            Schedule.start_time
            <= end_datetime,

            Schedule.end_time
            >= start_datetime
        )
        .all()
    )

    result = []

    current_date = date_from

    while current_date <= date_to:

        usage_minutes = 0.0

        for schedule in schedules:

            if (
                schedule.start_time.date()
                <= current_date
                <= schedule.end_time.date()
            ):

                usage_minutes += (
                    calculate_schedule_minutes(
                        schedule,
                        current_date,
                        current_date
                    )
                )

        available_minutes = (
            len(active_halls)
            * OPEN_MINUTES
        )

        if available_minutes > 0:

            usage_percent = (
                usage_minutes
                / available_minutes
                * 100
            )

        else:

            usage_percent = 0

        usage_percent = min(
            usage_percent,
            100
        )

        result.append(
            {
                "date": current_date,

                "usage_minutes": round(
                    usage_minutes,
                    2
                ),

                "available_minutes": round(
                    available_minutes,
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