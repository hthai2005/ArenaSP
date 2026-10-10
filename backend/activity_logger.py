from sqlalchemy.orm import Session

from models import ActivityLog


def write_activity_log(
    db: Session,
    user_id: int,
    action: str,
    target: str | None = None,
    description: str | None = None
):
    log = ActivityLog(
        user_id=user_id,
        action=action,
        target=target,
        description=description
    )

    db.add(log)
    db.commit()
    db.refresh(log)

    return log