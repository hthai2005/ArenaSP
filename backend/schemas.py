from datetime import date, datetime
from typing import Literal

from pydantic import (
    AliasChoices,
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    model_validator
)


# =====================================================
# CẤU HÌNH CHUNG
# snake_case Python <-> camelCase Frontend
# Ví dụ:
# stadium_id <-> stadiumId
# full_name  <-> fullName
# =====================================================

def to_camel(value: str) -> str:
    parts = value.split("_")

    return (
        parts[0]
        + "".join(
            part.capitalize()
            for part in parts[1:]
        )
    )


class APIModel(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
        alias_generator=to_camel
    )


# =====================================================
# AUTH / USER
# =====================================================

class RegisterRequest(APIModel):
    # Frontend có thể không gửi username
    # Backend sẽ dùng email hoặc phone làm username
    username: str | None = None

    password: str = Field(
        min_length=6
    )

    # Chấp nhận:
    # full_name
    # fullName
    # name
    full_name: str = Field(
        validation_alias=AliasChoices(
            "full_name",
            "fullName",
            "name"
        )
    )

    email: EmailStr | None = None

    phone: str | None = None


class LoginRequest(APIModel):
    # Có thể đăng nhập bằng:
    # username
    # identifier
    # email
    # phone
    username: str = Field(
        validation_alias=AliasChoices(
            "username",
            "identifier",
            "email",
            "phone"
        )
    )

    password: str


class UserResponse(APIModel):
    id: int

    username: str

    full_name: str

    email: str | None = None

    phone: str | None = None

    role_id: int

    # models.py có property role_name
    role: str | None = Field(
        default=None,
        validation_alias=AliasChoices(
            "role_name",
            "role"
        )
    )

    status: str


# =====================================================
# USER MANAGEMENT
# =====================================================

class UserUpdate(APIModel):
    full_name: str | None = None

    email: EmailStr | None = None

    phone: str | None = None


class UserRoleUpdate(APIModel):
    role_id: int = Field(
        ge=1
    )


class UserStatusUpdate(APIModel):
    status: Literal[
        "ACTIVE",
        "INACTIVE"
    ]


# =====================================================
# STADIUM / NHÀ THI ĐẤU
# =====================================================

class StadiumCreate(APIModel):
    name: str

    official_name: str | None = None

    address: str

    area: int = Field(
        default=0,
        ge=0
    )

    capacity: int = Field(
        default=0,
        ge=0
    )

    description: str | None = None

    status: Literal[
        "active",
        "maintenance",
        "inactive"
    ] = "active"


class StadiumUpdate(APIModel):
    name: str | None = None

    official_name: str | None = None

    address: str | None = None

    area: int | None = Field(
        default=None,
        ge=0
    )

    capacity: int | None = Field(
        default=None,
        ge=0
    )

    description: str | None = None

    status: Literal[
        "active",
        "maintenance",
        "inactive"
    ] | None = None


class StadiumResponse(APIModel):
    id: int

    name: str

    official_name: str | None = None

    address: str

    area: int

    capacity: int

    description: str | None = None

    status: str


# =====================================================
# HALL / KHU VỰC THI ĐẤU
# =====================================================

class HallCreate(APIModel):
    # Nếu không gửi code
    # backend tự tạo HT-01, HT-02...
    code: str | None = None

    stadium_id: int

    name: str

    type: str | None = None

    capacity: int = Field(
        gt=0
    )

    image: str | None = None

    status: Literal[
        "active",
        "maintenance",
        "inactive"
    ] = "active"

    description: str | None = None


class HallUpdate(APIModel):
    code: str | None = None

    stadium_id: int | None = None

    name: str | None = None

    type: str | None = None

    capacity: int | None = Field(
        default=None,
        gt=0
    )

    image: str | None = None

    status: Literal[
        "active",
        "maintenance",
        "inactive"
    ] | None = None

    description: str | None = None


class HallResponse(APIModel):
    id: int

    code: str

    stadium_id: int

    name: str

    type: str | None = None

    capacity: int

    image: str | None = None

    status: str

    description: str | None = None

    # Không lưu trực tiếp trong bảng halls.
    # models.py tạo từ relationship equipments.
    equipment: str | None = None


# =====================================================
# EQUIPMENT / THIẾT BỊ
# =====================================================

class EquipmentCreate(APIModel):
    # Nếu không gửi code
    # backend tự tạo TB-01, TB-02...
    code: str | None = None

    # Có thể NULL cho thiết bị khu kỹ thuật chung
    hall_id: int | None = None

    name: str

    quantity: int = Field(
        default=1,
        gt=0
    )

    inspected_at: date | None = None

    status: Literal[
        "active",
        "maintenance",
        "inactive"
    ] = "active"

    description: str | None = None


class EquipmentUpdate(APIModel):
    code: str | None = None

    hall_id: int | None = None

    name: str | None = None

    quantity: int | None = Field(
        default=None,
        gt=0
    )

    inspected_at: date | None = None

    status: Literal[
        "active",
        "maintenance",
        "inactive"
    ] | None = None

    description: str | None = None


class EquipmentResponse(APIModel):
    id: int

    code: str

    hall_id: int | None = None

    name: str

    quantity: int

    inspected_at: date | None = None

    status: str

    description: str | None = None


# =====================================================
# SCHEDULE / LỊCH HOẠT ĐỘNG
# =====================================================

class ScheduleCreate(APIModel):
    hall_id: int

    title: str

    start_time: datetime

    end_time: datetime

    status: Literal[
        "SCHEDULED",
        "ONGOING",
        "COMPLETED",
        "CANCELLED"
    ] = "SCHEDULED"

    description: str | None = None

    @model_validator(mode="after")
    def validate_time(self):

        if self.end_time <= self.start_time:
            raise ValueError(
                "end_time phải lớn hơn start_time"
            )

        return self


class ScheduleUpdate(APIModel):
    hall_id: int | None = None

    title: str | None = None

    start_time: datetime | None = None

    end_time: datetime | None = None

    status: Literal[
        "SCHEDULED",
        "ONGOING",
        "COMPLETED",
        "CANCELLED"
    ] | None = None

    description: str | None = None


class ScheduleResponse(APIModel):
    id: int

    hall_id: int

    title: str

    start_time: datetime

    end_time: datetime

    status: str

    description: str | None = None

    created_at: datetime | None = None

    updated_at: datetime | None = None


# =====================================================
# BOOKING / YÊU CẦU ĐẶT KHU VỰC
# =====================================================

class BookingCreate(APIModel):
    # Không cho frontend gửi user_id.
    # Backend lấy user_id từ JWT.
    hall_id: int

    title: str

    start_time: datetime

    end_time: datetime

    note: str | None = None

    @model_validator(mode="after")
    def validate_time(self):

        if self.end_time <= self.start_time:
            raise ValueError(
                "end_time phải lớn hơn start_time"
            )

        return self


class BookingUpdate(APIModel):
    hall_id: int | None = None

    title: str | None = None

    start_time: datetime | None = None

    end_time: datetime | None = None

    note: str | None = None


class BookingResponse(APIModel):
    id: int

    user_id: int

    hall_id: int

    title: str

    start_time: datetime

    end_time: datetime

    status: str

    note: str | None = None

    created_at: datetime | None = None

    updated_at: datetime | None = None


# =====================================================
# USER BEHAVIOR
# =====================================================

class UserBehaviorResponse(APIModel):
    id: int

    user_id: int

    action: str

    target: str | None = None

    timestamp: datetime


# =====================================================
# PREDICTION / RANDOM FOREST
# =====================================================

class PredictionCreate(APIModel):
    hall_id: int

    prediction_date: date

    predicted_usage: float | None = None

    risk_level: Literal[
        "LOW",
        "MEDIUM",
        "HIGH"
    ] | None = None

    recommended_time: str | None = None


# Request dùng cho:
# POST /api/predictions/predict
class PredictionRequest(APIModel):
    hall_id: int

    prediction_date: date


# Response sau khi train Random Forest
class PredictionTrainResponse(APIModel):
    message: str

    samples: int

    date_from: date

    date_to: date

    mae: float | None = None

    r2: float | None = None


class PredictionResponse(APIModel):
    id: int

    hall_id: int

    prediction_date: date

    predicted_usage: float | None = None

    risk_level: Literal[
        "LOW",
        "MEDIUM",
        "HIGH"
    ] | None = None

    recommended_time: str | None = None

    created_at: datetime | None = None


# =====================================================
# ACTIVITY LOG
# =====================================================

class ActivityLogResponse(APIModel):
    id: int

    user_id: int

    action: str

    target: str | None = None

    description: str | None = None

    created_at: datetime

# =====================================================
# ML DATA / DỮ LIỆU LỊCH SỬ CHO RANDOM FOREST
# =====================================================

class MLHistoryResponse(APIModel):
    hall_id: int

    hall_code: str

    hall_name: str

    date: date

    capacity: int

    weekday: int

    month: int

    is_weekend: int

    usage_minutes: float

    usage_percent: float

# =====================================================
# REPORT / THỐNG KÊ DASHBOARD
# =====================================================

class DashboardSummaryResponse(APIModel):
    total_stadiums: int
    total_halls: int
    active_halls: int
    maintenance_halls: int
    total_users: int
    pending_bookings: int
    approved_bookings: int
    total_schedules: int
    average_occupancy: float
    high_risk_predictions: int


class HallOccupancyResponse(APIModel):
    hall_id: int
    hall_code: str
    hall_name: str
    usage_minutes: float
    available_minutes: float
    usage_percent: float
    schedule_count: int


class DailyOccupancyResponse(APIModel):
    date: date
    usage_minutes: float
    available_minutes: float
    usage_percent: float

