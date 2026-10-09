import os

from datetime import datetime, timedelta, timezone

from fastapi import (
    APIRouter,
    Depends,
    HTTPException
)

from fastapi.security import (
    HTTPBearer,
    HTTPAuthorizationCredentials
)

from sqlalchemy.orm import Session

from jose import JWTError, jwt
from pwdlib import PasswordHash
from dotenv import load_dotenv

from database import get_db
from models import User

from schemas import (
    RegisterRequest,
    LoginRequest,
    UserResponse
)


# Đọc file .env
load_dotenv()


SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"

ACCESS_TOKEN_EXPIRE_MINUTES = int(
    os.getenv(
        "ACCESS_TOKEN_EXPIRE_MINUTES",
        "60"
    )
)


router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"]
)


# Mã hóa mật khẩu
password_hash = PasswordHash.recommended()


# Bearer Token
security = HTTPBearer()


# TẠO JWT TOKEN


def create_access_token(user_id: int):

    expire = datetime.now(timezone.utc) + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    payload = {
        "sub": str(user_id),
        "exp": expire
    }

    token = jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM
    )

    return token



# LẤY USER HIỆN TẠI TỪ TOKEN


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):

    token = credentials.credentials

    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        user_id = payload.get("sub")

        if user_id is None:
            raise HTTPException(
                status_code=401,
                detail="Token không hợp lệ"
            )

    except JWTError:
        raise HTTPException(
            status_code=401,
            detail="Token không hợp lệ hoặc đã hết hạn"
        )

    user = db.query(User).filter(
        User.id == int(user_id)
    ).first()

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Không tìm thấy người dùng"
        )

    if user.status != "ACTIVE":
        raise HTTPException(
            status_code=403,
            detail="Tài khoản đã bị khóa"
        )

    return user



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

    # Kiểm tra email
    if data.email:

        existing_email = db.query(User).filter(
            User.email == data.email
        ).first()

        if existing_email:
            raise HTTPException(
                status_code=400,
                detail="Email đã được sử dụng"
            )

    # Hash mật khẩu
    hashed_password = password_hash.hash(
        data.password
    )

    # User đăng ký mặc định là ORGANIZATION
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

    # Kiểm tra trạng thái
    if user.status != "ACTIVE":
        raise HTTPException(
            status_code=403,
            detail="Tài khoản đã bị khóa"
        )

    # Tạo JWT
    access_token = create_access_token(
        user.id
    )

    return {
        "message": "Đăng nhập thành công",

        "access_token": access_token,

        "token_type": "bearer",

        "user": {
            "id": user.id,
            "username": user.username,
            "full_name": user.full_name,
            "email": user.email,
            "phone": user.phone,
            "role_id": user.role_id,

            "role": (
                user.role.name
                if user.role
                else None
            )
        }
    }


# THÔNG TIN USER ĐANG ĐĂNG NHẬP

@router.get(
    "/me",
    response_model=UserResponse
)
def get_me(
    current_user: User = Depends(
        get_current_user
    )
):

    return current_user