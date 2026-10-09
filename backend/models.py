from sqlalchemy import (
    CheckConstraint,
    Column,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text
)

from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from database import Base


# =====================================================
# ROLE
# =====================================================

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


# =====================================================
# PERMISSION
# =====================================================

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


# =====================================================
# ROLE PERMISSION
# =====================================================

class RolePermission(Base):
    __tablename__ = "role_permissions"

    role_id = Column(
        Integer,
        ForeignKey(
            "roles.id",
            ondelete="CASCADE"
        ),
        primary_key=True
    )

    permission_id = Column(
        Integer,
        ForeignKey(
            "permissions.id",
            ondelete="CASCADE"
        ),
        primary_key=True
    )


# =====================================================
# USER
# =====================================================

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
        String(20),
        unique=True
    )

    role_id = Column(
        Integer,
        ForeignKey("roles.id"),
        nullable=False,
        default=4
    )

    status = Column(
        Enum(
            "ACTIVE",
            "INACTIVE"
        ),
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

    @property
    def role_name(self):
        return self.role.name if self.role else None


# =====================================================
# STADIUM
# =====================================================

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

    official_name = Column(
        String(200)
    )

    address = Column(
        String(255),
        nullable=False
    )

    area = Column(
        Integer,
        nullable=False,
        default=0
    )

    capacity = Column(
        Integer,
        nullable=False,
        default=0
    )

    description = Column(
        Text
    )

    status = Column(
        Enum(
            "active",
            "maintenance",
            "inactive"
        ),
        nullable=False,
        default="active"
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

    halls = relationship(
        "Hall",
        back_populates="stadium",
        passive_deletes=True
    )


# =====================================================
# HALL / KHU VỰC THI ĐẤU
# =====================================================

class Hall(Base):
    __tablename__ = "halls"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    code = Column(
        String(20),
        nullable=False,
        unique=True
    )

    stadium_id = Column(
        Integer,
        ForeignKey(
            "stadiums.id",
            ondelete="CASCADE"
        ),
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

    image = Column(
        String(500)
    )

    status = Column(
        Enum(
            "active",
            "maintenance",
            "inactive"
        ),
        nullable=False,
        default="active"
    )

    description = Column(
        Text
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

    stadium = relationship(
        "Stadium",
        back_populates="halls"
    )

    equipments = relationship(
        "Equipment",
        back_populates="hall",
        passive_deletes=True
    )

    @property
    def equipment(self):
        names = [
            item.name
            for item in self.equipments
        ]

        return ", ".join(names) if names else None


# =====================================================
# EQUIPMENT
# =====================================================

class Equipment(Base):
    __tablename__ = "equipments"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    code = Column(
        String(20),
        nullable=False,
        unique=True
    )

    hall_id = Column(
        Integer,
        ForeignKey(
            "halls.id",
            ondelete="SET NULL"
        ),
        nullable=True
    )

    name = Column(
        String(150),
        nullable=False
    )

    quantity = Column(
        Integer,
        nullable=False,
        default=1
    )

    inspected_at = Column(
        Date
    )

    status = Column(
        Enum(
            "active",
            "maintenance",
            "inactive"
        ),
        nullable=False,
        default="active"
    )

    description = Column(
        Text
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

    hall = relationship(
        "Hall",
        back_populates="equipments"
    )


# =====================================================
# SCHEDULE
# =====================================================

class Schedule(Base):
    __tablename__ = "schedules"

    __table_args__ = (
        CheckConstraint(
            "end_time > start_time",
            name="check_schedule_time"
        ),
    )

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    hall_id = Column(
        Integer,
        ForeignKey(
            "halls.id",
            ondelete="CASCADE"
        ),
        nullable=False
    )

    title = Column(
        String(200),
        nullable=False
    )

    start_time = Column(
        DateTime,
        nullable=False
    )

    end_time = Column(
        DateTime,
        nullable=False
    )

    status = Column(
        Enum(
            "SCHEDULED",
            "ONGOING",
            "COMPLETED",
            "CANCELLED"
        ),
        nullable=False,
        default="SCHEDULED"
    )

    description = Column(
        Text
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

    hall = relationship("Hall")


# =====================================================
# BOOKING
# =====================================================

class Booking(Base):
    __tablename__ = "bookings"

    __table_args__ = (
        CheckConstraint(
            "end_time > start_time",
            name="check_booking_time"
        ),
    )

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    hall_id = Column(
        Integer,
        ForeignKey("halls.id"),
        nullable=False
    )

    title = Column(
        String(200),
        nullable=False
    )

    start_time = Column(
        DateTime,
        nullable=False
    )

    end_time = Column(
        DateTime,
        nullable=False
    )

    status = Column(
        Enum(
            "PENDING",
            "APPROVED",
            "REJECTED",
            "CANCELLED"
        ),
        nullable=False,
        default="PENDING"
    )

    note = Column(
        Text
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

    user = relationship("User")
    hall = relationship("Hall")


# =====================================================
# USER BEHAVIOR
# =====================================================

class UserBehavior(Base):
    __tablename__ = "user_behaviors"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey(
            "users.id",
            ondelete="CASCADE"
        ),
        nullable=False
    )

    action = Column(
        String(100),
        nullable=False
    )

    target = Column(
        String(150)
    )

    timestamp = Column(
        DateTime,
        server_default=func.now()
    )

    user = relationship("User")


# =====================================================
# PREDICTION
# =====================================================

class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    hall_id = Column(
        Integer,
        ForeignKey(
            "halls.id",
            ondelete="CASCADE"
        ),
        nullable=False
    )

    prediction_date = Column(
        Date,
        nullable=False
    )

    predicted_usage = Column(
        Numeric(5, 2)
    )

    risk_level = Column(
        Enum(
            "LOW",
            "MEDIUM",
            "HIGH"
        )
    )

    recommended_time = Column(
        String(100)
    )

    created_at = Column(
        DateTime,
        server_default=func.now()
    )

    hall = relationship("Hall")


# ACTIVITY LOG

class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey(
            "users.id",
            ondelete="CASCADE"
        ),
        nullable=False
    )

    action = Column(
        String(100),
        nullable=False
    )

    target = Column(
        String(150)
    )

    description = Column(
        Text
    )

    created_at = Column(
        DateTime,
        server_default=func.now()
    )

    user = relationship("User")