from fastapi import (
    APIRouter,
    Depends,
    HTTPException
)

from sqlalchemy.orm import Session

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

    stadiums = db.query(Stadium).all()

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

    stadium = db.query(Stadium).filter(
        Stadium.id == stadium_id
    ).first()

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
    response_model=StadiumResponse
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
        address=data.address,
        description=data.description,
        status=data.status
    )

    db.add(new_stadium)
    db.commit()
    db.refresh(new_stadium)

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

    stadium = db.query(Stadium).filter(
        Stadium.id == stadium_id
    ).first()

    if not stadium:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy nhà thi đấu"
        )

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

    return stadium


# =====================================================
# XÓA NHÀ THI ĐẤU
# =====================================================

@router.delete("/{stadium_id}")
def delete_stadium(
    stadium_id: int,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        require_permission("STADIUM_DELETE")
    )
):

    stadium = db.query(Stadium).filter(
        Stadium.id == stadium_id
    ).first()

    if not stadium:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy nhà thi đấu"
        )

    db.delete(stadium)
    db.commit()

    return {
        "message": "Xóa nhà thi đấu thành công"
    }