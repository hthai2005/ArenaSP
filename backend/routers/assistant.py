from fastapi import (
    APIRouter,
    Depends,
    HTTPException
)
from sqlalchemy.orm import Session

from database import get_db
from models import User
from schemas import (
    AssistantChatRequest,
    AssistantChatResponse
)
from rbac import require_permission
from ai_module.assistant_logic import process_assistant_query
from activity_logger import write_activity_log


router = APIRouter(
    prefix="/api/assistant",
    tags=["Trợ lý AI - Assistant"]
)


@router.post(
    "/chat",
    response_model=AssistantChatResponse
)
def chat_with_assistant(
    data: AssistantChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_permission("AI_USE")
    )
):
    """
    API gửi câu hỏi đến Trợ lý AI ArenaSP.
    Tự động truy xuất cơ sở dữ liệu sân bãi và mô hình Random Forest.
    """
    if not data.message or not data.message.strip():
        raise HTTPException(
            status_code=400,
            detail="Tin nhắn không được để trống"
        )

    try:
        response = process_assistant_query(
            message=data.message,
            db=db,
            hall_id=data.hall_id,
            target_date_str=data.target_date
        )

        # Ghi log hoạt động sử dụng AI
        try:
            write_activity_log(
                db=db,
                user_id=current_user.id,
                action="AI_CHAT",
                target="ai_assistant",
                description=f"Hỏi: {data.message[:100]}"
            )
        except Exception:
            pass

        return response
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Lỗi xử lý trợ lý AI: {str(error)}"
        )
