from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    status
)

from sqlalchemy.orm import Session

from activity_logger import write_activity_log
from database import get_db

from models import (
    Booking,
    Hall,
    Stadium,
    User
)

from schemas import (
    HallCreate,
    HallUpdate,
    HallResponse
)

from rbac import require_permission


# =====================================================
# ROUTER
# =====================================================

router = APIRouter(
    prefix="/api/halls",
    tags=["Khu vực thi đấu"]
)


# =====================================================
# TỰ ĐỘNG TẠO MÃ KHU VỰC
# Ví dụ: HT-01, HT-02, HT-03...
# =====================================================

def generate_hall_code(
    db: Session
):
    number = 1

    while True:

        code = f"HT-{number:02d}"

        existing = (
            db.query(Hall)
            .filter(
                Hall.code == code
            )
            .first()
        )

        if not existing:
            return code

        number += 1


# =====================================================
# LẤY DANH SÁCH KHU VỰC
# Có thể lọc theo stadiumId
# =====================================================

@router.get(
    "/",
    response_model=list[HallResponse]
)
def get_halls(
    stadium_id: int | None = Query(
        default=None,
        alias="stadiumId"
    ),

    db: Session = Depends(get_db),

    current_user: User = Depends(
        require_permission("HALL_VIEW")
    )
):
    query = db.query(Hall)

    if stadium_id is not None:

        query = query.filter(
            Hall.stadium_id == stadium_id
        )

    halls = (
        query
        .order_by(Hall.id.asc())
        .all()
    )

    return halls


# =====================================================
# LẤY CHI TIẾT MỘT KHU VỰC
# =====================================================

@router.get(
    "/{hall_id}",
    response_model=HallResponse
)
def get_hall(
    hall_id: int,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        require_permission("HALL_VIEW")
    )
):
    hall = (
        db.query(Hall)
        .filter(
            Hall.id == hall_id
        )
        .first()
    )

    if not hall:

        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy khu vực thi đấu"
        )

    return hall


# =====================================================
# TẠO KHU VỰC MỚI
# =====================================================

@router.post(
    "/",
    response_model=HallResponse,
    status_code=status.HTTP_201_CREATED
)
def create_hall(
    data: HallCreate,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        require_permission("HALL_CREATE")
    )
):
    # -------------------------------------------------
    # Kiểm tra nhà thi đấu tồn tại
    # -------------------------------------------------

    stadium = (
        db.query(Stadium)
        .filter(
            Stadium.id == data.stadium_id
        )
        .first()
    )

    if not stadium:

        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy nhà thi đấu"
        )

    # -------------------------------------------------
    # Nếu frontend không gửi code
    # backend tự tạo HT-01...
    # -------------------------------------------------

    code = data.code

    if code:
        code = code.strip()

    if not code:
        code = generate_hall_code(db)

    # -------------------------------------------------
    # Kiểm tra mã khu vực trùng
    # -------------------------------------------------

    existing_code = (
        db.query(Hall)
        .filter(
            Hall.code == code
        )
        .first()
    )

    if existing_code:

        raise HTTPException(
            status_code=400,
            detail="Mã khu vực đã tồn tại"
        )

    # -------------------------------------------------
    # Tạo khu vực
    # -------------------------------------------------

    new_hall = Hall(
        code=code,
        stadium_id=data.stadium_id,
        name=data.name,
        type=data.type,
        capacity=data.capacity,
        image=data.image,
        status=data.status,
        description=data.description
    )

    db.add(new_hall)
    db.commit()
    db.refresh(new_hall)

    # -------------------------------------------------
    # ACTIVITY LOG
    # -------------------------------------------------

    write_activity_log(
        db=db,
        user_id=current_user.id,
        action="CREATE_HALL",
        target=f"hall:{new_hall.id}",
        description=(
            f"Tạo khu vực "
            f"{new_hall.code} - "
            f"{new_hall.name} "
            f"thuộc {stadium.name}"
        )
    )

    return new_hall


# =====================================================
# CẬP NHẬT KHU VỰC
# =====================================================

@router.put(
    "/{hall_id}",
    response_model=HallResponse
)
def update_hall(
    hall_id: int,

    data: HallUpdate,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        require_permission("HALL_UPDATE")
    )
):
    hall = (
        db.query(Hall)
        .filter(
            Hall.id == hall_id
        )
        .first()
    )

    if not hall:

        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy khu vực thi đấu"
        )

    # Lưu thông tin cũ để ghi log
    old_code = hall.code
    old_name = hall.name

    update_data = data.model_dump(
        exclude_unset=True
    )

    # -------------------------------------------------
    # Nếu đổi nhà thi đấu
    # kiểm tra stadium mới tồn tại
    # -------------------------------------------------

    if "stadium_id" in update_data:

        stadium_id = update_data[
            "stadium_id"
        ]

        if stadium_id is None:

            raise HTTPException(
                status_code=400,
                detail="stadium_id không được để trống"
            )

        stadium = (
            db.query(Stadium)
            .filter(
                Stadium.id == stadium_id
            )
            .first()
        )

        if not stadium:

            raise HTTPException(
                status_code=404,
                detail="Không tìm thấy nhà thi đấu"
            )

    # -------------------------------------------------
    # Nếu đổi mã khu vực
    # kiểm tra mã không bị trùng
    # -------------------------------------------------

    if "code" in update_data:

        code = update_data["code"]

        if (
            code is None
            or not code.strip()
        ):

            raise HTTPException(
                status_code=400,
                detail="Mã khu vực không được để trống"
            )

        code = code.strip()

        existing_code = (
            db.query(Hall)
            .filter(
                Hall.code == code,
                Hall.id != hall_id
            )
            .first()
        )

        if existing_code:

            raise HTTPException(
                status_code=400,
                detail="Mã khu vực đã tồn tại"
            )

        update_data["code"] = code

    # -------------------------------------------------
    # Cập nhật dữ liệu
    # -------------------------------------------------

    for field, value in update_data.items():

        setattr(
            hall,
            field,
            value
        )

    db.commit()
    db.refresh(hall)

    # -------------------------------------------------
    # ACTIVITY LOG
    # -------------------------------------------------

    changed_fields = ", ".join(
        update_data.keys()
    )

    write_activity_log(
        db=db,
        user_id=current_user.id,
        action="UPDATE_HALL",
        target=f"hall:{hall.id}",
        description=(
            f"Cập nhật khu vực "
            f"{old_code} - {old_name}. "
            f"Trường thay đổi: "
            f"{changed_fields}"
        )
    )

    return hall


# =====================================================
# XÓA KHU VỰC
# =====================================================

@router.delete(
    "/{hall_id}"
)
def delete_hall(
    hall_id: int,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        require_permission("HALL_DELETE")
    )
):
    hall = (
        db.query(Hall)
        .filter(
            Hall.id == hall_id
        )
        .first()
    )

    if not hall:

        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy khu vực thi đấu"
        )

    # -------------------------------------------------
    # Không xóa khu vực nếu đã có booking
    # Vì cần giữ lại lịch sử đặt chỗ
    # -------------------------------------------------

    booking = (
        db.query(Booking)
        .filter(
            Booking.hall_id == hall_id
        )
        .first()
    )

    if booking:

        raise HTTPException(
            status_code=400,
            detail=(
                "Khu vực đã có dữ liệu đặt chỗ. "
                "Không thể xóa. "
                "Hãy chuyển trạng thái thành inactive."
            )
        )

    # -------------------------------------------------
    # Lưu thông tin trước khi xóa
    # -------------------------------------------------

    deleted_hall_id = hall.id
    deleted_hall_code = hall.code
    deleted_hall_name = hall.name

    db.delete(hall)
    db.commit()

    # -------------------------------------------------
    # ACTIVITY LOG
    # -------------------------------------------------

    write_activity_log(
        db=db,
        user_id=current_user.id,
        action="DELETE_HALL",
        target=f"hall:{deleted_hall_id}",
        description=(
            f"Xóa khu vực "
            f"{deleted_hall_code} - "
            f"{deleted_hall_name}"
        )
    )

    return {
        "message": "Xóa khu vực thi đấu thành công"
    }