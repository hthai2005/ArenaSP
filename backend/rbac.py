from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import (
    User,
    Permission,
    RolePermission
)

from routers.auth import get_current_user


def require_permission(permission_name: str):

    def permission_checker(
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
    ):

        permission = (
            db.query(Permission)
            .join(
                RolePermission,
                Permission.id == RolePermission.permission_id
            )
            .filter(
                RolePermission.role_id == current_user.role_id,
                Permission.name == permission_name
            )
            .first()
        )

        if not permission:
            raise HTTPException(
                status_code=403,
                detail=f"Bạn không có quyền {permission_name}"
            )

        return current_user

    return permission_checker