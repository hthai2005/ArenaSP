from pydantic import BaseModel, EmailStr, ConfigDict


class RegisterRequest(BaseModel):
    username: str
    password: str
    full_name: str
    email: EmailStr | None = None
    phone: str | None = None


class LoginRequest(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    id: int
    username: str
    full_name: str
    email: str | None = None
    phone: str | None = None
    role_id: int
    status: str

    model_config = ConfigDict(
        from_attributes=True
    )
from typing import Literal


class StadiumCreate(BaseModel):
    name: str
    address: str
    description: str | None = None
    status: Literal["ACTIVE", "INACTIVE"] = "ACTIVE"


class StadiumUpdate(BaseModel):
    name: str | None = None
    address: str | None = None
    description: str | None = None
    status: Literal["ACTIVE", "INACTIVE"] | None = None


class StadiumResponse(BaseModel):
    id: int
    name: str
    address: str
    description: str | None = None
    status: str

    model_config = ConfigDict(
        from_attributes=True
    )