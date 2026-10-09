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
class Permission(Base):
    __tablename__ = "permissions"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    name = Column(
        String(100),
        nullable=False,
        unique=True
    )

    description = Column(
        String(255)
    )


class RolePermission(Base):
    __tablename__ = "role_permissions"

    role_id = Column(
        Integer,
        ForeignKey("roles.id"),
        primary_key=True
    )

    permission_id = Column(
        Integer,
        ForeignKey("permissions.id"),
        primary_key=True
    )
class Stadium(Base):
    __tablename__ = "stadiums"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    name = Column(
        String(200),
        nullable=False
    )

    address = Column(
        String(255),
        nullable=False
    )

    description = Column(
        String(1000)
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
class Hall(Base):
    __tablename__ = "halls"

    id = Column(Integer, primary_key=True, index=True)

    stadium_id = Column(
        Integer,
        ForeignKey("stadiums.id"),
        nullable=False
    )

    name = Column(
        String(150),
        nullable=False
    )

    type = Column(
        String(100)
    )

    capacity = Column(
        Integer,
        nullable=False
    )

    status = Column(
        Enum(
            "AVAILABLE",
            "MAINTENANCE",
            "INACTIVE"
        ),
        default="AVAILABLE",
        nullable=False
    )

    description = Column(
        String(1000)
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

    stadium = relationship("Stadium")