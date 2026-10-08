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