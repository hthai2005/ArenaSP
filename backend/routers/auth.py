from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pwdlib import PasswordHash

from database import get_db
from models import User
from schemas import (
    RegisterRequest,
    LoginRequest,
    UserResponse
)


router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"]
)


# Mã hóa mật khẩu
password_hash = PasswordHash.recommended()



# ĐĂNG KÝ


@router.post(
    "/register",
    response_model=UserResponse
)
def register(
    data: RegisterRequest,
    db: Session = Depends(get_db)
):

    # Kiểm tra username
    existing_username = db.query(User).filter(
        User.username == data.username
    ).first()

    if existing_username:
        raise HTTPException(
            status_code=400,
            detail="Tên đăng nhập đã tồn tại"
        )

    # Kiểm tra email nếu người dùng nhập email
    if data.email:
        existing_email = db.query(User).filter(
            User.email == data.email
        ).first()

        if existing_email:
            raise HTTPException(
                status_code=400,
                detail="Email đã được sử dụng"
            )

    # Mã hóa mật khẩu
    hashed_password = password_hash.hash(data.password)

    # Tạo user
    # role_id = 4 -> ORGANIZATION
    new_user = User(
        username=data.username,
        password_hash=hashed_password,
        full_name=data.full_name,
        email=data.email,
        phone=data.phone,
        role_id=4
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user



# ĐĂNG NHẬP


@router.post("/login")
def login(
    data: LoginRequest,
    db: Session = Depends(get_db)
):

    user = db.query(User).filter(
        User.username == data.username
    ).first()

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Sai tên đăng nhập hoặc mật khẩu"
        )

    # Kiểm tra mật khẩu
    if not password_hash.verify(
        data.password,
        user.password_hash
    ):
        raise HTTPException(
            status_code=401,
            detail="Sai tên đăng nhập hoặc mật khẩu"
        )

    # Kiểm tra trạng thái tài khoản
    if user.status != "ACTIVE":
        raise HTTPException(
            status_code=403,
            detail="Tài khoản đã bị khóa"
        )

    return {
        "message": "Đăng nhập thành công",

        "user": {
            "id": user.id,
            "username": user.username,
            "full_name": user.full_name,
            "email": user.email,
            "phone": user.phone,
            "role_id": user.role_id,
            "role": user.role.name
                if user.role
                else None
        }
    }