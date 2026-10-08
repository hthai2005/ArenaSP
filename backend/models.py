from sqlalchemy import (
    Column,
    Integer,
    String,
    ForeignKey,
    Enum,
    DateTime
)

from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from database import Base


class Role(Base):
    __tablename__ = "roles"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    name = Column(
        String(50),
        nullable=False,
        unique=True
    )

    description = Column(
        String(255)
    )


class User(Base):
    __tablename__ = "users"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    username = Column(
        String(100),
        nullable=False,
        unique=True
    )

    password_hash = Column(
        String(255),
        nullable=False
    )

    full_name = Column(
        String(150),
        nullable=False
    )

    email = Column(
        String(150),
        unique=True
    )

    phone = Column(
        String(20)
    )

    role_id = Column(
        Integer,
        ForeignKey("roles.id"),
        nullable=False,
        default=4
    )

    status = Column(
        Enum("ACTIVE", "INACTIVE"),
        nullable=False,
        default="ACTIVE"
    )

    created_at = Column(
        DateTime,
        server_default=func.now()
    )

    updated_at = Column(
        DateTime,
        server_default=func.now(),
        onupdate=func.now()
    )

    role = relationship("Role")