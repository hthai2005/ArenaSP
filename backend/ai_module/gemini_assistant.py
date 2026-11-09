import os
import json
from datetime import date, datetime, time, timedelta
from typing import Any
from sqlalchemy.orm import Session

from models import Hall, Schedule, Stadium, Booking, Equipment
from ai_module.random_forest import (
    predict_usage,
    calculate_risk_level,
    recommend_free_time,
    OPEN_HOUR,
    CLOSE_HOUR
)

try:
    from google import genai
    from google.genai import types
except ImportError:
    genai = None


def get_system_context(db: Session, target_date: date) -> str:
    """Thu thập dữ liệu thời gian thực súc tích để nạp cho Gemini (tối ưu token & tốc độ)."""
    halls = db.query(Hall).filter(Hall.status == "active").all()
    schedules = (
        db.query(Schedule)
        .filter(Schedule.status != "CANCELLED")
        .all()
    )

    day_schedules = [
        s for s in schedules 
        if s.start_time.date() <= target_date <= s.end_time.date()
    ]

    slots_def = [
        ("08:00–10:00", 8, 10),
        ("10:00–12:00", 10, 12),
        ("14:00–16:00", 14, 16),
        ("16:00–18:00", 16, 18),
        ("18:00–20:00", 18, 20),
        ("20:00–22:00", 20, 22),
    ]

    context_lines = []
    context_lines.append(f"NGÀY TRA CỨU: {target_date.strftime('%d/%m/%Y')} (Giờ mở cửa: 08:00-22:00)")
    context_lines.append("TÌNH TRẠNG CÁC SÂN:")

    for h in halls:
        line_parts = [f"- {h.name} ({h.code}, chứa {h.capacity} người):"]
        for time_str, s_hour, e_hour in slots_def:
            slot_start = datetime.combine(target_date, time(s_hour, 0))
            slot_end = datetime.combine(target_date, time(e_hour, 0))

            occupied = any(
                s.hall_id == h.id and s.start_time < slot_end and s.end_time > slot_start
                for s in day_schedules
            )

            if occupied:
                line_parts.append(f"  + {time_str}: KÍN LỊCH")
            else:
                try:
                    pred = predict_usage(h, target_date, hour_slot=s_hour)
                except Exception:
                    pred = 25.0
                line_parts.append(f"  + {time_str}: TRỐNG (tải RF: {int(pred)}%)")
        context_lines.append("\n".join(line_parts))

    context_lines.append("\nQUY TRÌNH & NỘI QUY TÓM TẮT:")
    context_lines.append("- Khách đặt trên web -> BQL duyệt 24h -> Nhận sân trước 30p.")
    context_lines.append("- Giày đế mềm (non-marking), cấm thức ăn/chất nổ, mượn âm thanh/đèn/LED báo trước.")

    return "\n".join(context_lines)


def call_gemini_assistant(message: str, context: str, api_key: str) -> dict[str, Any]:
    """Gọi Gemini LLM để trả lời tự nhiên với model gemini-3.1-flash-lite siêu nhanh."""
    client = genai.Client(api_key=api_key)

    prompt = (
        f"Bạn là Trợ lý Điều hành Sân bãi AI (ArenaSP) của Nhà thi đấu Thể thao Tỉnh.\n"
        f"Nhiệm vụ: Tư vấn lịch trống, gợi ý giờ tối ưu theo Random Forest, hướng dẫn thủ tục và nội quy.\n"
        f"Trả lời bằng tiếng Việt thân thiện, súc tích, định dạng Markdown rõ ràng.\n\n"
        f"DỮ LIỆU HỆ THỐNG:\n{context}\n\n"
        f"CÂU HỎI CỦA KHÁCH: {message}"
    )

    try:
        response = client.models.generate_content(
            model='gemini-3.1-flash-lite',
            contents=prompt
        )

        reply_text = response.text or ""
        if reply_text.strip():
            actions = ["Gợi ý lịch trống", "Xem lịch trống"]
            lower_reply = reply_text.lower()
            if "đăng ký" in lower_reply or "đặt" in lower_reply or "trống" in lower_reply:
                actions.insert(0, "Đăng ký đặt sân ngay")
            if "random forest" in lower_reply or "tải" in lower_reply:
                actions.append("Giải thích gợi ý Random Forest")

            return {
                "content": "text",
                "text": reply_text,
                "actions": actions[:4]
            }
    except Exception as e:
        print(f"Lỗi gọi Gemini: {e}")

    return None
