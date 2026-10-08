from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import auth


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


@app.get("/")
def home():
    return {
        "message": "ArenaSP Backend API đang hoạt động"
    }