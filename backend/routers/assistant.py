import json
from fastapi import (
    APIRouter,
    Depends,
    HTTPException
)
from sqlalchemy.orm import Session

from database import get_db
from models import User, ChatMessage
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


@router.get("/history")
def get_chat_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("AI_USE"))
):
    """Lấy danh sách các tin nhắn trong lịch sử chat của người dùng hiện tại."""
    messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.user_id == current_user.id)
        .order_by(ChatMessage.created_at.asc())
        .limit(50)
        .all()
    )

    result = []
    for m in messages:
        item = {
            "id": m.id,
            "role": m.role,
            "content": m.content_type,
            "text": m.text,
            "time": m.created_at.strftime("%H:%M") if m.created_at else ""
        }
        if m.extra_data:
            try:
                extra = json.loads(m.extra_data)
                item.update(extra)
            except Exception:
                pass
        result.append(item)

    return result


@router.delete("/history")
def clear_chat_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("AI_USE"))
):
    """Xóa lịch sử chat của người dùng hiện tại."""
    db.query(ChatMessage).filter(ChatMessage.user_id == current_user.id).delete()
    db.commit()
    return {"message": "Đã xóa lịch sử chat thành công"}


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
    Đồng thời lưu tin nhắn vào bảng chat_messages.
    """
    if not data.message or not data.message.strip():
        raise HTTPException(
            status_code=400,
            detail="Tin nhắn không được để trống"
        )

    try:
        # Lưu tin nhắn của User vào DB
        user_msg = ChatMessage(
            user_id=current_user.id,
            role="user",
            content_type="text",
            text=data.message.strip()
        )
        db.add(user_msg)
        db.commit()

        # Xử lý câu trả lời
        response = process_assistant_query(
            message=data.message,
            db=db,
            hall_id=data.hall_id,
            target_date_str=data.target_date
        )

        # Lưu tin nhắn của AI vào DB
        extra = {}
        if response.get("slots"):
            extra["slots"] = response["slots"]
        if response.get("actions"):
            extra["actions"] = response["actions"]
        if response.get("columns"):
            extra["columns"] = response["columns"]
        if response.get("forecast"):
            extra["forecast"] = response["forecast"]

        ai_msg = ChatMessage(
            user_id=current_user.id,
            role="ai",
            content_type=response.get("content", "text"),
            text=response.get("text"),
            extra_data=json.dumps(extra, ensure_ascii=False) if extra else None
        )
        db.add(ai_msg)
        db.commit()

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

