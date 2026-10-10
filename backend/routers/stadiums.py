from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status
)

from sqlalchemy.orm import Session

from activity_logger import write_activity_log
from database import get_db

from models import (
    Stadium,
    User
)

from schemas import (
    StadiumCreate,
    StadiumUpdate,
    StadiumResponse
)

from rbac import require_permission


# =====================================================
# ROUTER
# =====================================================

router = APIRouter(
    prefix="/api/stadiums",
    tags=["Stadiums"]
)


# =====================================================
# LẤY DANH SÁCH NHÀ THI ĐẤU
# =====================================================

@router.get(
    "/",
    response_model=list[StadiumResponse]
)
def get_stadiums(
    db: Session = Depends(get_db),

    current_user: User = Depends(
        require_permission("STADIUM_VIEW")
    )
):
    stadiums = (
        db.query(Stadium)
        .order_by(Stadium.id.asc())
        .all()
    )

    return stadiums


# =====================================================
# LẤY CHI TIẾT NHÀ THI ĐẤU
# =====================================================

@router.get(
    "/{stadium_id}",
    response_model=StadiumResponse
)
def get_stadium(
    stadium_id: int,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        require_permission("STADIUM_VIEW")
    )
):
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

    return stadium


# =====================================================
# TẠO NHÀ THI ĐẤU
# =====================================================

@router.post(
    "/",
    response_model=StadiumResponse,
    status_code=status.HTTP_201_CREATED
)
def create_stadium(
    data: StadiumCreate,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        require_permission("STADIUM_CREATE")
    )
):
    new_stadium = Stadium(
        name=data.name,
        official_name=data.official_name,
        address=data.address,
        area=data.area,
        capacity=data.capacity,
        description=data.description,
        status=data.status
    )

    db.add(new_stadium)
    db.commit()
    db.refresh(new_stadium)

    # =================================================
    # ACTIVITY LOG
    # =================================================

    write_activity_log(
        db=db,
        user_id=current_user.id,
        action="CREATE_STADIUM",
        target=f"stadium:{new_stadium.id}",
        description=(
            f"Tạo nhà thi đấu: "
            f"{new_stadium.name}"
        )
    )

    return new_stadium


# =====================================================
# CẬP NHẬT NHÀ THI ĐẤU
# =====================================================

@router.put(
    "/{stadium_id}",
    response_model=StadiumResponse
)
def update_stadium(
    stadium_id: int,
    data: StadiumUpdate,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        require_permission("STADIUM_UPDATE")
    )
):
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

    # Lưu tên cũ để ghi log nếu cần
    old_name = stadium.name

    update_data = data.model_dump(
        exclude_unset=True
    )

    for field, value in update_data.items():
        setattr(
            stadium,
            field,
            value
        )

    db.commit()
    db.refresh(stadium)

    # =================================================
    # ACTIVITY LOG
    # =================================================

    changed_fields = ", ".join(
        update_data.keys()
    )

    write_activity_log(
        db=db,
        user_id=current_user.id,
        action="UPDATE_STADIUM",
        target=f"stadium:{stadium.id}",
        description=(
            f"Cập nhật nhà thi đấu "
            f"{old_name}. "
            f"Trường thay đổi: "
            f"{changed_fields}"
        )
    )

    return stadium


# =====================================================
# XÓA NHÀ THI ĐẤU
# =====================================================

@router.delete(
    "/{stadium_id}"
)
def delete_stadium(
    stadium_id: int,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        require_permission("STADIUM_DELETE")
    )
):
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

    # =================================================
    # KHÔNG CHO XÓA NẾU CÒN HALL
    # =================================================
    #
    # Tránh xóa dây chuyền:
    # Stadium
    #   ↓
    # Hall
    #   ↓
    # Schedule / Prediction / Equipment...
    # =================================================

    if stadium.halls:
        raise HTTPException(
            status_code=400,
            detail=(
                "Nhà thi đấu vẫn còn khu vực trực thuộc. "
                "Hãy xóa/chuyển các khu vực trước hoặc "
                "chuyển nhà thi đấu sang trạng thái inactive."
            )
        )

    # Lưu thông tin trước khi xóa
    deleted_stadium_id = stadium.id
    deleted_stadium_name = stadium.name

    db.delete(stadium)
    db.commit()

    # =================================================
    # ACTIVITY LOG
    # =================================================

    write_activity_log(
        db=db,
        user_id=current_user.id,
        action="DELETE_STADIUM",
        target=f"stadium:{deleted_stadium_id}",
        description=(
            f"Xóa nhà thi đấu: "
            f"{deleted_stadium_name}"
        )
    )

    return {
        "message": "Xóa nhà thi đấu thành công"
    }