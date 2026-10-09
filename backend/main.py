from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware

from routers import auth, stadiums
from models import User
from rbac import require_permission

app = FastAPI(
    title="ArenaSP API",
    description="API hệ thống quản lý nhà thi đấu tỉnh",
    version="1.0.0"
)


# Cho phép React gọi Backend
app.add_middleware(
    CORSMiddleware,

    allow_origins=[
        "http://localhost:5173"
    ],

    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


# Authentication API
app.include_router(auth.router)
app.include_router(stadiums.router)


@app.get("/")
def home():
    return {
        "message": "ArenaSP Backend API đang hoạt động"
    }


@app.get("/api/test/stadium-view")
def test_stadium_view(
    current_user: User = Depends(
        require_permission("STADIUM_VIEW")
    )
):
    return {
        "message": "Bạn có quyền xem nhà thi đấu",
        "username": current_user.username,
        "role": current_user.role.name
    }


@app.post("/api/test/stadium-create")
def test_stadium_create(
    current_user: User = Depends(
        require_permission("STADIUM_CREATE")
    )
):
    return {
        "message": "Bạn có quyền tạo nhà thi đấu",
        "username": current_user.username,
        "role": current_user.role.name
    }