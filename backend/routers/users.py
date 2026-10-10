from fastapi import (
    APIRouter,
    Depends,
    HTTPException
)

from sqlalchemy.orm import Session

from database import get_db

from models import (
    Role,
    User
)

from schemas import (
    UserResponse,
    UserUpdate,
    UserRoleUpdate,
    UserStatusUpdate
)

from rbac import require_permission
from activity_logger import write_activity_log


# =====================================================
# ROUTER
# =====================================================

router = APIRouter(
    prefix="/api/users",
    tags=["Quản lý người dùng"]
)


# =====================================================
# LẤY DANH SÁCH USER
# =====================================================

@router.get(
    "/",
    response_model=list[UserResponse]
)
def get_users(
    db: Session = Depends(get_db),

    current_user: User = Depends(
        require_permission("USER_VIEW")
    )
):

    users = (
        db.query(User)
        .order_by(User.id.asc())
        .all()
    )

    return users


# =====================================================
# XEM CHI TIẾT USER
# =====================================================

@router.get(
    "/{user_id}",
    response_model=UserResponse
)
def get_user(
    user_id: int,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        require_permission("USER_VIEW")
    )
):

    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if not user:

        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy người dùng"
        )

    return user


# =====================================================
# CẬP NHẬT THÔNG TIN USER
# =====================================================

@router.put(
    "/{user_id}",
    response_model=UserResponse
)
def update_user(
    user_id: int,
    data: UserUpdate,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        require_permission("USER_UPDATE")
    )
):

    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if not user:

        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy người dùng"
        )

    update_data = data.model_dump(
        exclude_unset=True
    )

    # =================================================
    # KIỂM TRA EMAIL TRÙNG
    # =================================================

    if (
        "email" in update_data
        and update_data["email"] is not None
    ):

        existing_email = db.query(User).filter(
            User.email == update_data["email"],
            User.id != user_id
        ).first()

        if existing_email:

            raise HTTPException(
                status_code=400,
                detail="Email đã được sử dụng"
            )

    # =================================================
    # KIỂM TRA PHONE TRÙNG
    # =================================================

    if (
        "phone" in update_data
        and update_data["phone"] is not None
    ):

        existing_phone = db.query(User).filter(
            User.phone == update_data["phone"],
            User.id != user_id
        ).first()

        if existing_phone:

            raise HTTPException(
                status_code=400,
                detail="Số điện thoại đã được sử dụng"
            )

    # =================================================
    # CẬP NHẬT USER
    # =================================================

    for field, value in update_data.items():

        setattr(
            user,
            field,
            value
        )

    db.commit()
    db.refresh(user)

    # =================================================
    # GHI LOG
    # =================================================

    write_activity_log(
        db=db,
        user_id=current_user.id,
        action="UPDATE_USER",
        target=f"user:{user.id}",
        description=(
            f"Cập nhật thông tin người dùng "
            f"{user.username}"
        )
    )

    return user


# =====================================================
# CẤP / ĐỔI ROLE CHO USER
# =====================================================

@router.put(
    "/{user_id}/role",
    response_model=UserResponse
)
def change_user_role(
    user_id: int,
    data: UserRoleUpdate,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        require_permission("USER_ROLE_ASSIGN")
    )
):

    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if not user:

        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy người dùng"
        )

    # =================================================
    # KHÔNG CHO ADMIN TỰ ĐỔI ROLE
    # =================================================

    if user.id == current_user.id:

        raise HTTPException(
            status_code=400,
            detail=(
                "Bạn không thể tự thay đổi "
                "role của chính mình"
            )
        )

    # =================================================
    # KIỂM TRA ROLE TỒN TẠI
    # =================================================

    role = db.query(Role).filter(
        Role.id == data.role_id
    ).first()

    if not role:

        raise HTTPException(
            status_code=404,
            detail="Role không tồn tại"
        )

    # =================================================
    # ĐỔI ROLE
    # =================================================

    user.role_id = role.id

    db.commit()
    db.refresh(user)

    # =================================================
    # GHI LOG ĐỔI ROLE
    # =================================================

    write_activity_log(
        db=db,
        user_id=current_user.id,
        action="CHANGE_USER_ROLE",
        target=f"user:{user.id}",
        description=(
            f"Thay đổi role của "
            f"{user.username} "
            f"thành {role.name}"
        )
    )

    return user


# =====================================================
# KHÓA / MỞ KHÓA TÀI KHOẢN
# =====================================================

@router.put(
    "/{user_id}/status",
    response_model=UserResponse
)
def change_user_status(
    user_id: int,
    data: UserStatusUpdate,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        require_permission("USER_UPDATE")
    )
):

    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if not user:

        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy người dùng"
        )

    # =================================================
    # KHÔNG CHO ADMIN TỰ KHÓA MÌNH
    # =================================================

    if (
        user.id == current_user.id
        and data.status == "INACTIVE"
    ):

        raise HTTPException(
            status_code=400,
            detail=(
                "Bạn không thể tự khóa "
                "tài khoản của chính mình"
            )
        )

    # =================================================
    # ĐỔI TRẠNG THÁI
    # =================================================

    user.status = data.status

    db.commit()
    db.refresh(user)

    # =================================================
    # GHI LOG
    # =================================================

    write_activity_log(
        db=db,
        user_id=current_user.id,
        action="CHANGE_USER_STATUS",
        target=f"user:{user.id}",
        description=(
            f"Thay đổi trạng thái của "
            f"{user.username} "
            f"thành {data.status}"
        )
    )

    return user