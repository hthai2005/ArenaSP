from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status
)

from sqlalchemy.orm import Session

from database import get_db

from models import (
    Booking,
    Hall,
    Schedule,
    User
)

from schemas import (
    BookingCreate,
    BookingResponse
)

from rbac import require_permission


# =====================================================
# ROUTER
# =====================================================

router = APIRouter(
    prefix="/api/bookings",
    tags=["Đặt chỗ"]
)


# =====================================================
# KIỂM TRA TRÙNG VỚI LỊCH HOẠT ĐỘNG
# =====================================================

def check_schedule_conflict(
    db: Session,
    hall_id: int,
    start_time,
    end_time
):

    conflict = (
        db.query(Schedule)
        .filter(
            Schedule.hall_id == hall_id,

            Schedule.status != "CANCELLED",

            Schedule.start_time < end_time,

            Schedule.end_time > start_time
        )
        .first()
    )

    return conflict


# =====================================================
# KIỂM TRA TRÙNG VỚI BOOKING
# =====================================================

def check_booking_conflict(
    db: Session,
    hall_id: int,
    start_time,
    end_time,
    exclude_booking_id: int | None = None,
    include_pending: bool = True
):

    statuses = ["APPROVED"]

    if include_pending:
        statuses.append("PENDING")

    query = db.query(Booking).filter(
        Booking.hall_id == hall_id,

        Booking.status.in_(statuses),

        Booking.start_time < end_time,

        Booking.end_time > start_time
    )

    if exclude_booking_id is not None:

        query = query.filter(
            Booking.id != exclude_booking_id
        )

    return query.first()


# =====================================================
# LẤY DANH SÁCH BOOKING
# =====================================================

@router.get(
    "/",
    response_model=list[BookingResponse]
)
def get_bookings(
    db: Session = Depends(get_db),

    current_user: User = Depends(
        require_permission("BOOKING_VIEW")
    )
):

    query = db.query(Booking)

    # Đơn vị sử dụng chỉ được xem booking của chính mình
    if (
        current_user.role
        and current_user.role.name == "ORGANIZATION"
    ):

        query = query.filter(
            Booking.user_id == current_user.id
        )

    bookings = (
        query
        .order_by(Booking.id.desc())
        .all()
    )

    return bookings


# =====================================================
# XEM CHI TIẾT BOOKING
# =====================================================

@router.get(
    "/{booking_id}",
    response_model=BookingResponse
)
def get_booking(
    booking_id: int,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        require_permission("BOOKING_VIEW")
    )
):

    booking = db.query(Booking).filter(
        Booking.id == booking_id
    ).first()

    if not booking:

        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy yêu cầu đặt chỗ"
        )

    # ORGANIZATION chỉ được xem booking của mình
    if (
        current_user.role
        and current_user.role.name == "ORGANIZATION"
        and booking.user_id != current_user.id
    ):

        raise HTTPException(
            status_code=403,
            detail="Bạn không được xem booking của người khác"
        )

    return booking


# =====================================================
# TẠO YÊU CẦU ĐẶT CHỖ
# =====================================================

@router.post(
    "/",
    response_model=BookingResponse,
    status_code=status.HTTP_201_CREATED
)
def create_booking(
    data: BookingCreate,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        require_permission("BOOKING_CREATE")
    )
):

    # -------------------------------------------------
    # Kiểm tra khu vực tồn tại
    # -------------------------------------------------

    hall = db.query(Hall).filter(
        Hall.id == data.hall_id
    ).first()

    if not hall:

        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy khu vực thi đấu"
        )

    # -------------------------------------------------
    # Không cho đặt khu vực đang bảo trì / inactive
    # -------------------------------------------------

    if hall.status != "active":

        raise HTTPException(
            status_code=400,
            detail=(
                "Khu vực hiện không hoạt động "
                "hoặc đang bảo trì"
            )
        )

    # -------------------------------------------------
    # Kiểm tra trùng với lịch hoạt động
    # -------------------------------------------------

    schedule_conflict = check_schedule_conflict(
        db=db,
        hall_id=data.hall_id,
        start_time=data.start_time,
        end_time=data.end_time
    )

    if schedule_conflict:

        raise HTTPException(
            status_code=400,
            detail=(
                "Khung giờ này đã có lịch hoạt động"
            )
        )

    # -------------------------------------------------
    # Kiểm tra trùng booking PENDING / APPROVED
    # -------------------------------------------------

    booking_conflict = check_booking_conflict(
        db=db,
        hall_id=data.hall_id,
        start_time=data.start_time,
        end_time=data.end_time,
        include_pending=True
    )

    if booking_conflict:

        raise HTTPException(
            status_code=400,
            detail=(
                "Khung giờ này đã có yêu cầu đặt chỗ"
            )
        )

    # -------------------------------------------------
    # Tạo booking
    # user_id lấy trực tiếp từ JWT
    # Frontend không được tự gửi user_id
    # -------------------------------------------------

    new_booking = Booking(
        user_id=current_user.id,
        hall_id=data.hall_id,
        title=data.title,
        start_time=data.start_time,
        end_time=data.end_time,
        status="PENDING",
        note=data.note
    )

    db.add(new_booking)
    db.commit()
    db.refresh(new_booking)

    return new_booking


# =====================================================
# DUYỆT BOOKING
# =====================================================

@router.post(
    "/{booking_id}/approve",
    response_model=BookingResponse
)
def approve_booking(
    booking_id: int,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        require_permission("BOOKING_APPROVE")
    )
):

    booking = db.query(Booking).filter(
        Booking.id == booking_id
    ).first()

    if not booking:

        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy yêu cầu đặt chỗ"
        )

    if booking.status != "PENDING":

        raise HTTPException(
            status_code=400,
            detail="Chỉ có thể duyệt booking đang PENDING"
        )

    # -------------------------------------------------
    # Kiểm tra khu vực
    # -------------------------------------------------

    hall = db.query(Hall).filter(
        Hall.id == booking.hall_id
    ).first()

    if not hall:

        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy khu vực thi đấu"
        )

    if hall.status != "active":

        raise HTTPException(
            status_code=400,
            detail=(
                "Khu vực hiện không hoạt động "
                "hoặc đang bảo trì"
            )
        )

    # -------------------------------------------------
    # Trước khi duyệt phải kiểm tra lại lịch
    # Vì trong thời gian booking chờ duyệt,
    # lịch có thể đã thay đổi.
    # -------------------------------------------------

    schedule_conflict = check_schedule_conflict(
        db=db,
        hall_id=booking.hall_id,
        start_time=booking.start_time,
        end_time=booking.end_time
    )

    if schedule_conflict:

        raise HTTPException(
            status_code=400,
            detail=(
                "Không thể duyệt vì khung giờ "
                "đã có lịch hoạt động"
            )
        )

    # -------------------------------------------------
    # Kiểm tra booking APPROVED khác
    # Không tính chính booking đang duyệt
    # -------------------------------------------------

    approved_conflict = check_booking_conflict(
        db=db,
        hall_id=booking.hall_id,
        start_time=booking.start_time,
        end_time=booking.end_time,
        exclude_booking_id=booking.id,
        include_pending=False
    )

    if approved_conflict:

        raise HTTPException(
            status_code=400,
            detail=(
                "Không thể duyệt vì đã có booking "
                "khác được duyệt trong khung giờ này"
            )
        )

    # -------------------------------------------------
    # Duyệt booking
    # -------------------------------------------------

    booking.status = "APPROVED"

    # -------------------------------------------------
    # Khi APPROVED -> tạo lịch hoạt động
    # -------------------------------------------------

    new_schedule = Schedule(
        hall_id=booking.hall_id,
        title=booking.title,
        start_time=booking.start_time,
        end_time=booking.end_time,
        status="SCHEDULED",
        description=(
            f"Lịch được tạo từ booking #{booking.id}"
        )
    )

    db.add(new_schedule)

    db.commit()
    db.refresh(booking)

    return booking


# =====================================================
# TỪ CHỐI BOOKING
# =====================================================

@router.post(
    "/{booking_id}/reject",
    response_model=BookingResponse
)
def reject_booking(
    booking_id: int,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        require_permission("BOOKING_REJECT")
    )
):

    booking = db.query(Booking).filter(
        Booking.id == booking_id
    ).first()

    if not booking:

        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy yêu cầu đặt chỗ"
        )

    if booking.status != "PENDING":

        raise HTTPException(
            status_code=400,
            detail="Chỉ có thể từ chối booking đang PENDING"
        )

    booking.status = "REJECTED"

    db.commit()
    db.refresh(booking)

    return booking


# =====================================================
# HỦY BOOKING
# =====================================================

@router.post(
    "/{booking_id}/cancel",
    response_model=BookingResponse
)
def cancel_booking(
    booking_id: int,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        require_permission("BOOKING_CANCEL")
    )
):

    booking = db.query(Booking).filter(
        Booking.id == booking_id
    ).first()

    if not booking:

        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy yêu cầu đặt chỗ"
        )

    # -------------------------------------------------
    # ORGANIZATION chỉ được hủy booking của mình
    # -------------------------------------------------

    if (
        current_user.role
        and current_user.role.name == "ORGANIZATION"
        and booking.user_id != current_user.id
    ):

        raise HTTPException(
            status_code=403,
            detail="Bạn không được hủy booking của người khác"
        )

    # -------------------------------------------------
    # Không cho hủy nếu đã rejected/cancelled
    # -------------------------------------------------

    if booking.status in (
        "REJECTED",
        "CANCELLED"
    ):

        raise HTTPException(
            status_code=400,
            detail="Booking này không thể hủy"
        )

    old_status = booking.status

    booking.status = "CANCELLED"

    # -------------------------------------------------
    # Nếu booking trước đó đã APPROVED
    # thì tìm schedule tương ứng và CANCELLED.
    #
    # Do thiết kế DB hiện tại không có booking_id
    # trong schedules nên đối chiếu bằng:
    # hall + title + start + end
    # -------------------------------------------------

    if old_status == "APPROVED":

        schedule = db.query(Schedule).filter(
            Schedule.hall_id == booking.hall_id,
            Schedule.title == booking.title,
            Schedule.start_time == booking.start_time,
            Schedule.end_time == booking.end_time,
            Schedule.status != "CANCELLED"
        ).first()

        if schedule:
            schedule.status = "CANCELLED"

    db.commit()
    db.refresh(booking)

    return booking