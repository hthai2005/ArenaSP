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
    # Frontend hiện có thể chưa gửi username
    username: str | None = None

    password: str = Field(
        min_length=6
    )

    # Cho phép backend nhận:
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
    # email
    # phone
    # identifier
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

    role: str | None = Field(
        default=None,
        validation_alias=AliasChoices(
            "role_name",
            "role"
        )
    )

    status: str


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
    # Nếu không gửi code, backend có thể tự tạo HT-01...
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

    # Không lưu trong halls.
    # Giá trị này lấy từ relationship equipments.
    equipment: str | None = None


# =====================================================
# EQUIPMENT / THIẾT BỊ
# =====================================================

class EquipmentCreate(APIModel):
    # Nếu không gửi code backend có thể tự tạo TB-01...
    code: str | None = None

    # Có thể NULL cho "Khu kỹ thuật chung"
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


class PredictionResponse(APIModel):
    id: int

    hall_id: int

    prediction_date: date

    predicted_usage: float | None = None

    risk_level: str | None = None

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