from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import (
    auth,
    stadiums,
    halls,
    equipments,
    schedules,
    bookings,
    users,
    activity_logs,
    predictions
)


# =====================================================
# KHỞI TẠO FASTAPI
# =====================================================

app = FastAPI(
    title="ArenaSP API",
    description="API hệ thống quản lý nhà thi đấu tỉnh",
    version="1.0.0"
)


# =====================================================
# CORS
# Cho phép React Frontend gọi FastAPI Backend
# =====================================================

app.add_middleware(
    CORSMiddleware,

    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"]
)


# =====================================================
# ĐĂNG KÝ ROUTER
# =====================================================

# Authentication
app.include_router(auth.router)

# Nhà thi đấu
app.include_router(stadiums.router)

# Khu vực / sân / phòng chức năng
app.include_router(halls.router)

# Thiết bị
app.include_router(equipments.router)

# LỊCH HOẠT ĐỘNG
app.include_router(schedules.router)

# Đặt chỗ
app.include_router(bookings.router)

# Người dùng
app.include_router(users.router)

# Nhật ký hoạt động
app.include_router(activity_logs.router)

# Dự đoán
app.include_router(predictions.router)

# =====================================================
# API KIỂM TRA BACKEND
# =====================================================

@app.get("/")
def home():
    return {
        "message": "ArenaSP Backend API đang hoạt động"
    }