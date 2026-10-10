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
    Equipment,
    Hall,
    User
)

from schemas import (
    EquipmentCreate,
    EquipmentUpdate,
    EquipmentResponse
)

from rbac import require_permission


# =====================================================
# ROUTER
# =====================================================

router = APIRouter(
    prefix="/api/equipments",
    tags=["Thiết bị"]
)


# =====================================================
# TỰ ĐỘNG TẠO MÃ THIẾT BỊ
# Ví dụ: TB-01, TB-02...
# =====================================================

def generate_equipment_code(
    db: Session
):
    number = 1

    while True:

        code = f"TB-{number:02d}"

        existing = (
            db.query(Equipment)
            .filter(
                Equipment.code == code
            )
            .first()
        )

        if not existing:
            return code

        number += 1


# =====================================================
# LẤY DANH SÁCH THIẾT BỊ
# Có thể lọc theo hallId
# =====================================================

@router.get(
    "/",
    response_model=list[EquipmentResponse]
)
def get_equipments(
    hall_id: int | None = Query(
        default=None,
        alias="hallId"
    ),

    db: Session = Depends(get_db),

    current_user: User = Depends(
        require_permission("EQUIPMENT_VIEW")
    )
):
    query = db.query(Equipment)

    if hall_id is not None:

        query = query.filter(
            Equipment.hall_id == hall_id
        )

    equipments = (
        query
        .order_by(Equipment.id.asc())
        .all()
    )

    return equipments


# =====================================================
# LẤY CHI TIẾT THIẾT BỊ
# =====================================================

@router.get(
    "/{equipment_id}",
    response_model=EquipmentResponse
)
def get_equipment(
    equipment_id: int,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        require_permission("EQUIPMENT_VIEW")
    )
):
    equipment = (
        db.query(Equipment)
        .filter(
            Equipment.id == equipment_id
        )
        .first()
    )

    if not equipment:

        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy thiết bị"
        )

    return equipment


# =====================================================
# TẠO THIẾT BỊ
# =====================================================

@router.post(
    "/",
    response_model=EquipmentResponse,
    status_code=status.HTTP_201_CREATED
)
def create_equipment(
    data: EquipmentCreate,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        require_permission("EQUIPMENT_CREATE")
    )
):
    hall = None

    # -------------------------------------------------
    # Nếu có hall_id thì kiểm tra hall tồn tại
    # hall_id có thể NULL vì có thiết bị khu kỹ thuật chung
    # -------------------------------------------------

    if data.hall_id is not None:

        hall = (
            db.query(Hall)
            .filter(
                Hall.id == data.hall_id
            )
            .first()
        )

        if not hall:

            raise HTTPException(
                status_code=404,
                detail="Không tìm thấy khu vực thi đấu"
            )

    # -------------------------------------------------
    # Tạo code nếu frontend không gửi
    # -------------------------------------------------

    code = data.code

    if code:
        code = code.strip()

    if not code:
        code = generate_equipment_code(db)

    # -------------------------------------------------
    # Kiểm tra code trùng
    # -------------------------------------------------

    existing_code = (
        db.query(Equipment)
        .filter(
            Equipment.code == code
        )
        .first()
    )

    if existing_code:

        raise HTTPException(
            status_code=400,
            detail="Mã thiết bị đã tồn tại"
        )

    # -------------------------------------------------
    # Tạo thiết bị
    # -------------------------------------------------

    new_equipment = Equipment(
        code=code,
        hall_id=data.hall_id,
        name=data.name,
        quantity=data.quantity,
        inspected_at=data.inspected_at,
        status=data.status,
        description=data.description
    )

    db.add(new_equipment)
    db.commit()
    db.refresh(new_equipment)

    # -------------------------------------------------
    # ACTIVITY LOG
    # -------------------------------------------------

    hall_name = (
        hall.name
        if hall
        else "Khu kỹ thuật chung"
    )

    write_activity_log(
        db=db,
        user_id=current_user.id,
        action="CREATE_EQUIPMENT",
        target=f"equipment:{new_equipment.id}",
        description=(
            f"Tạo thiết bị "
            f"{new_equipment.code} - "
            f"{new_equipment.name}. "
            f"Khu vực: {hall_name}"
        )
    )

    return new_equipment


# =====================================================
# CẬP NHẬT THIẾT BỊ
# =====================================================

@router.put(
    "/{equipment_id}",
    response_model=EquipmentResponse
)
def update_equipment(
    equipment_id: int,

    data: EquipmentUpdate,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        require_permission("EQUIPMENT_UPDATE")
    )
):
    equipment = (
        db.query(Equipment)
        .filter(
            Equipment.id == equipment_id
        )
        .first()
    )

    if not equipment:

        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy thiết bị"
        )

    # Lưu thông tin cũ để ghi log
    old_code = equipment.code
    old_name = equipment.name

    update_data = data.model_dump(
        exclude_unset=True
    )

    # -------------------------------------------------
    # Nếu đổi hall_id
    # hall_id = None vẫn hợp lệ
    # -------------------------------------------------

    if (
        "hall_id" in update_data
        and update_data["hall_id"] is not None
    ):

        hall = (
            db.query(Hall)
            .filter(
                Hall.id == update_data["hall_id"]
            )
            .first()
        )

        if not hall:

            raise HTTPException(
                status_code=404,
                detail="Không tìm thấy khu vực thi đấu"
            )

    # -------------------------------------------------
    # Nếu đổi code
    # -------------------------------------------------

    if "code" in update_data:

        code = update_data["code"]

        if (
            code is None
            or not code.strip()
        ):

            raise HTTPException(
                status_code=400,
                detail="Mã thiết bị không được để trống"
            )

        code = code.strip()

        existing_code = (
            db.query(Equipment)
            .filter(
                Equipment.code == code,
                Equipment.id != equipment_id
            )
            .first()
        )

        if existing_code:

            raise HTTPException(
                status_code=400,
                detail="Mã thiết bị đã tồn tại"
            )

        update_data["code"] = code

    # -------------------------------------------------
    # Cập nhật dữ liệu
    # -------------------------------------------------

    for field, value in update_data.items():

        setattr(
            equipment,
            field,
            value
        )

    db.commit()
    db.refresh(equipment)

    # -------------------------------------------------
    # ACTIVITY LOG
    # -------------------------------------------------

    changed_fields = ", ".join(
        update_data.keys()
    )

    write_activity_log(
        db=db,
        user_id=current_user.id,
        action="UPDATE_EQUIPMENT",
        target=f"equipment:{equipment.id}",
        description=(
            f"Cập nhật thiết bị "
            f"{old_code} - {old_name}. "
            f"Trường thay đổi: "
            f"{changed_fields}"
        )
    )

    return equipment


# =====================================================
# XÓA THIẾT BỊ
# =====================================================

@router.delete(
    "/{equipment_id}"
)
def delete_equipment(
    equipment_id: int,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        require_permission("EQUIPMENT_DELETE")
    )
):
    equipment = (
        db.query(Equipment)
        .filter(
            Equipment.id == equipment_id
        )
        .first()
    )

    if not equipment:

        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy thiết bị"
        )

    # -------------------------------------------------
    # Lưu thông tin trước khi xóa
    # -------------------------------------------------

    deleted_equipment_id = equipment.id
    deleted_equipment_code = equipment.code
    deleted_equipment_name = equipment.name

    db.delete(equipment)
    db.commit()

    # -------------------------------------------------
    # ACTIVITY LOG
    # -------------------------------------------------

    write_activity_log(
        db=db,
        user_id=current_user.id,
        action="DELETE_EQUIPMENT",
        target=f"equipment:{deleted_equipment_id}",
        description=(
            f"Xóa thiết bị "
            f"{deleted_equipment_code} - "
            f"{deleted_equipment_name}"
        )
    )

    return {
        "message": "Xóa thiết bị thành công"
    }