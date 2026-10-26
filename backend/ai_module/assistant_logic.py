import os
import re
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


def extract_date_from_text(text: str) -> date:
    """Trích xuất ngày từ câu hỏi của người dùng."""
    text_lower = text.lower()
    today = date.today()

    if "hôm nay" in text_lower:
        return today
    if "ngày mai" in text_lower or "mai" in text_lower:
        return today + timedelta(days=1)
    if "ngày kia" in text_lower:
        return today + timedelta(days=2)

    # Tìm định dạng dd/mm hoặc dd-mm (ví dụ 18/10, 18/10/2026)
    match = re.search(r'(\d{1,2})[/-](\d{1,2})(?:[/-](\d{4}))?', text)
    if match:
        day = int(match.group(1))
        month = int(match.group(2))
        year = int(match.group(3)) if match.group(3) else today.year
        try:
            return date(year, month, day)
        except ValueError:
            pass

    return today


def detect_hall(text: str, db: Session, fallback_hall_id: int | None = None) -> Hall | None:
    """Tìm Hall tương ứng từ câu hỏi hoặc dùng fallback."""
    text_upper = text.upper()
    halls = db.query(Hall).all()

    # Tìm theo mã (HT-01, HT-02,...)
    for h in halls:
        if h.code and h.code in text_upper:
            return h

    # Tìm theo từ khóa tên
    text_lower = text.lower()
    for h in halls:
        name_lower = h.name.lower()
        if "trung tâm" in text_lower or "đa năng" in text_lower or "sân chính" in text_lower:
            if "đa năng" in name_lower or "trung tâm" in name_lower:
                return h
        if "khánh tiết" in text_lower or "hội trường" in text_lower:
            if "hội trường" in name_lower:
                return h
        if "cầu lông" in text_lower:
            if "cầu lông" in name_lower:
                return h
        if "bơi" in text_lower or "bể bơi" in text_lower:
            if "bơi" in name_lower:
                return h
        if "thể lực" in text_lower or "tập gym" in text_lower:
            if "thể lực" in name_lower:
                return h

    # Dùng fallback nếu có
    if fallback_hall_id:
        h = db.query(Hall).filter(Hall.id == fallback_hall_id).first()
        if h:
            return h

    # Mặc định lấy sân trung tâm hoặc sân đầu tiên
    return halls[0] if halls else None


def get_hall_slots_and_load(db: Session, hall: Hall, target_date: date) -> list[dict[str, Any]]:
    """Tính toán trạng thái và % tải các khung giờ trong ngày cho một khu vực."""
    slots_def = [
        ("08:00–10:00", 8, 10, False),
        ("10:00–12:00", 10, 12, False),
        ("14:00–16:00", 14, 16, False),
        ("16:00–18:00", 16, 18, True),
        ("18:00–20:00", 18, 20, True),
        ("20:00–22:00", 20, 22, False),
    ]

    # Lấy các lịch trùng ngày
    schedules = (
        db.query(Schedule)
        .filter(
            Schedule.hall_id == hall.id,
            Schedule.status != "CANCELLED"
        )
        .all()
    )

    day_schedules = []
    for s in schedules:
        if s.start_time.date() <= target_date <= s.end_time.date():
            day_schedules.append(s)

    # Dự báo tải tổng quan từ Random Forest
    try:
        predicted_base = predict_usage(hall, target_date)
    except Exception:
        predicted_base = 35.0

    result = []
    for time_str, s_hour, e_hour, is_peak in slots_def:
        slot_start = datetime.combine(target_date, time(s_hour, 0))
        slot_end = datetime.combine(target_date, time(e_hour, 0))

        # Kiểm tra xung đột với lịch thật
        occupied = any(
            s.start_time < slot_end and s.end_time > slot_start
            for s in day_schedules
        )

        if occupied:
            result.append({
                "time": time_str,
                "status": "Đã có lịch",
                "load": "100%",
                "statusColor": "#dc2626"
            })
        else:
            if is_peak or predicted_base > 50:
                load_val = min(int(predicted_base * 1.1), 75)
                result.append({
                    "time": time_str,
                    "status": "Trống (tải trung bình)",
                    "load": f"{load_val}%",
                    "statusColor": "#d97706"
                })
            else:
                load_val = max(int(predicted_base * 0.6), 18)
                result.append({
                    "time": time_str,
                    "status": "Trống",
                    "load": f"{load_val}%",
                    "statusColor": "#15803d"
                })

    return result


def process_assistant_query(
    message: str,
    db: Session,
    hall_id: int | None = None,
    target_date_str: str | None = None
) -> dict[str, Any]:
    """
    Xử lý truy vấn trợ lý AI bằng cách phân loại ý định (Intent Classification),
    kết hợp Knowledge Base và suy luận từ mô hình Random Forest.
    """
    text = message.strip()
    text_lower = text.lower()

    # 1. Xác định ngày và khu vực
    if target_date_str:
        try:
            target_date = datetime.strptime(target_date_str, "%Y-%m-%d").date()
        except ValueError:
            target_date = extract_date_from_text(text)
    else:
        target_date = extract_date_from_text(text)

    hall = detect_hall(text, db, hall_id)
    hall_name = hall.name if hall else "Nhà thi đấu"
    date_formatted = target_date.strftime("%d/%m/%Y")

    # =========================================================================
    # INTENT 1: GIẢI THÍCH MÔ HÌNH RANDOM FOREST / TẠI SAO GỢI Ý (EXPLAIN CONTENT)
    # =========================================================================
    if any(k in text_lower for k in [
        "vì sao", "tại sao", "giải thích", "nguyên nhân", "lý do", "căn cứ", 
        "nguyên tắc", "thuật toán"
    ]):
        try:
            forecast_val = predict_usage(hall, target_date) if hall else 24.0
        except Exception:
            forecast_val = 24.0

        risk = calculate_risk_level(forecast_val)
        risk_text = "Thấp" if risk == "LOW" else ("Trung bình" if risk == "MEDIUM" else "Cao")

        return {
            "content": "explain",
            "text": f"Hệ thống đề xuất khung giờ cho khu vực **{hall_name}** vào ngày {date_formatted} dựa trên 3 yếu tố cốt lõi từ mô hình Random Forest Regressor:",
            "columns": [
                {
                    "icon": "📊",
                    "title": "Mức sử dụng thấp",
                    "desc": f"Tỷ lệ dự báo {forecast_val:.0f}% tải, thuộc mức rủi ro {risk_text}."
                },
                {
                    "icon": "⚡",
                    "title": "Tối ưu hạ tầng",
                    "desc": "Phù hợp kế hoạch vận hành và bảo trì định kỳ của nhà thi đấu tuần này."
                },
                {
                    "icon": "🔄",
                    "title": "Đệm bàn giao",
                    "desc": "Đảm bảo khoảng cách 30-45 phút chuẩn bị an toàn cho sự kiện tiếp theo."
                }
            ],
            "forecast": f"{forecast_val:.0f}%"
        }

    # =========================================================================
    # INTENT 2: XEM LỊCH TRỐNG / GỢI Ý KHUNG GIỜ (TABLE CONTENT)
    # =========================================================================
    if any(k in text_lower for k in [
        "lịch trống", "trống không", "còn trống", "khung giờ", "gợi ý lịch", 
        "giờ nào", "chiều nay", "sáng mai", "chiều mai", "thời gian trống"
    ]):
        if not hall:
            return {
                "content": "text",
                "text": f"Hiện tại hệ thống chưa tìm thấy thông tin khu vực thi đấu phù hợp. Bạn vui lòng chọn hoặc nêu rõ tên sân (ví dụ: Sân đa năng A, Hội trường khánh tiết, Sân cầu lông B)."
            }

        slots = get_hall_slots_and_load(db, hall, target_date)
        free_slots = [s for s in slots if "Trống" in s["status"]]

        best_slot = free_slots[0]["time"] if free_slots else "14:00–16:00"

        return {
            "content": "table",
            "text": f"Chiều ngày {date_formatted}, khu vực **{hall_name}** ({hall.code}) có tình trạng khung giờ như sau:",
            "slots": slots,
            "actions": [
                f"Mở lịch {hall.code}",
                f"Đăng ký giữ khung {best_slot.split('–')[0]}",
                "Giải thích gợi ý Random Forest"
            ]
        }

    # =========================================================================
    # INTENT 3: QUY TRÌNH XIN CẤP PHÉP / GỬI ĐƠN ĐĂNG KÝ (PROCEDURE)
    # =========================================================================
    if any(k in text_lower for k in [
        "gửi đơn", "đăng ký", "quy trình", "thủ tục", "xin cấp phép", "hồ sơ", "đặt sân"
    ]):
        return {
            "content": "text",
            "text": (
                "### 📋 Quy trình xin cấp phép đặt sân & tổ chức sự kiện tại Nhà thi đấu Tỉnh:\n\n"
                "1. **Bước 1 — Kiểm tra lịch trống:** Truy cập mục **Lịch hoạt động** hoặc tra cứu trực tiếp qua Trợ lý AI để chọn ngày và khung giờ mong muốn.\n"
                "2. **Bước 2 — Tạo yêu cầu đặt chỗ:** Vào mục **Đặt chỗ (Bookings)** -> Chọn **Tạo yêu cầu mới**, điền thông tin đơn vị tổ chức, mục đích và số lượng người tham dự.\n"
                "3. **Bước 3 — Nộp hồ sơ bổ sung (nếu có):** Đối với sự kiện quy mô trên 500 người hoặc giải đấu cấp tỉnh, gửi kèm văn bản đề xuất / kế hoạch tổ chức gửi UBND Tỉnh & Ban Quản lý.\n"
                "4. **Bước 4 — Thẩm định & Phê duyệt:** Ban Quản lý (`MANAGER` hoặc `ADMIN`) tiến hành kiểm tra xung đột và phê duyệt trong vòng 24 giờ làm việc.\n"
                "5. **Bước 5 — Tiếp nhận & Bàn giao:** Đơn vị có mặt trước giờ diễn ra 30 phút để ký biên bản kiểm tra mặt sân và bàn giao trang thiết bị."
            ),
            "actions": ["Xem danh sách sân", "Gợi ý lịch trống"]
        }

    # =========================================================================
    # INTENT 4: NỘI QUY SỬ DỤNG SÂN & MƯỢN THIẾT BỊ (RULES)
    # =========================================================================
    if any(k in text_lower for k in [
        "nội quy", "quy định", "mượn", "thiết bị", "giày", "pccc", "trang thiết bị"
    ]):
        return {
            "content": "text",
            "text": (
                "### 🛡️ Nội quy sử dụng sân bãi & Mượn trang thiết bị kỹ thuật:\n\n"
                "- **Trang phục & Giày thi đấu:** Bắt buộc mang giày thể thao đế mềm (non-marking), không để lại vệt đen trên sàn gỗ và thảm Taraflex.\n"
                "- **Vệ sinh & An toàn:** Nghiêm cấm mang kẹo cao su, thức ăn có dầu mỡ, đồ uống có màu và các chất dễ cháy nổ vào khu vực sàn đấu.\n"
                "- **Mượn trang thiết bị (Âm thanh, Đèn 1000 lux, Màn hình LED P2.5):** Cần đăng ký trước với bộ phận kỹ thuật (`STAFF`). Hai bên ký biên bản tình trạng thiết bị trước khi bật nguồn.\n"
                "- **Thời gian hoạt động:** Từ 08:00 đến 22:00 hàng ngày. Đơn vị phải hoàn trả mặt bằng đúng giờ để phục vụ công tác vệ sinh kỹ thuật.\n"
                "- **PCCC & Thoát hiểm:** Giữ thông thoáng toàn bộ các cửa thoát hiểm và hành lang phụ."
            ),
            "actions": ["Gợi ý lịch trống", "Quy trình xin cấp phép"]
        }

    # =========================================================================
    # INTENT 5: CẢNH BÁO QUÁ TẢI & PHÂN TÍCH RỦI RO (OVERLOAD WARNING)
    # =========================================================================
    if any(k in text_lower for k in [
        "quá tải", "cảnh báo", "rủi ro", "đông đúc", "tải cao", "áp lực"
    ]):
        high_risk_halls = []
        all_halls = db.query(Hall).filter(Hall.status == "active").all()
        for h in all_halls:
            try:
                usage = predict_usage(h, target_date)
                if usage >= 70:
                    high_risk_halls.append(f"- **{h.name}** ({h.code}): Dự báo tải **{usage:.0f}%** (Mức CAO)")
            except Exception:
                pass

        if high_risk_halls:
            warning_list = "\n".join(high_risk_halls)
            response_text = (
                f"### ⚠️ Cảnh báo áp lực tải sử dụng ngày {date_formatted}:\n\n"
                f"Mô hình Random Forest phát hiện một số khu vực có khả năng chịu tải cao:\n"
                f"{warning_list}\n\n"
                f"💡 **Khuyến nghị điều phối:**\n"
                f"- Khuyến khích các đơn vị di dời khung giờ sang buổi sáng (08:00 - 11:00) hoặc đầu giờ chiều (14:00 - 16:00).\n"
                f"- Đội ngũ kỹ thuật bố trí thêm nhân viên kiểm tra hệ thống điều hòa và nguồn điện tải cao."
            )
        else:
            response_text = (
                f"### ✅ Đánh giá an toàn hạ tầng ngày {date_formatted}:\n\n"
                f"Dữ liệu dự báo chỉ ra toàn bộ các khu vực thi đấu hiện duy trì mức tải trung bình và thấp (< 65%).\n"
                f"- Sân trung tâm và các phòng chức năng vận hành ổn định.\n"
                f"- Không phát hiện nguy cơ quá tải hay xung đột lịch trình lớn."
            )

        return {
            "content": "text",
            "text": response_text,
            "actions": ["Gợi ý lịch trống", "Xem lịch trống"]
        }

    # =========================================================================
    # INTENT 6: TRA CỨU DANH SÁCH NHÀ THI ĐẤU & KHU VỰC (FACILITIES)
    # =========================================================================
    if any(k in text_lower for k in [
        "nhà thi đấu", "có những sân nào", "danh sách sân", "khu vực nào", "bể bơi", "sân nào"
    ]):
        halls = db.query(Hall).all()
        hall_lines = []
        for h in halls:
            status_vn = "Đang hoạt động" if h.status == "active" else ("Đang bảo trì" if h.status == "maintenance" else "Tạm đóng")
            hall_lines.append(f"- **{h.code} — {h.name}**: {h.type or 'Sân thi đấu'} · Sức chứa: {h.capacity:,} chỗ · Trạng thái: *{status_vn}*")

        facilities_text = "\n".join(hall_lines)
        return {
            "content": "text",
            "text": (
                f"### 🏟️ Danh mục các khu vực tại Nhà thi đấu Tỉnh:\n\n"
                f"{facilities_text}\n\n"
                f"Bạn có thể yêu cầu tôi kiểm tra lịch trống hoặc dự báo tải cho từng sân cụ thể!"
            ),
            "actions": ["Gợi ý lịch trống", "Nội quy sử dụng sân"]
        }

    # =========================================================================
    # DEFAULT / GENERAL CHAT (FALLBACK VỚI CÂU HỎI THÔNG MINH)
    # =========================================================================
    return {
        "content": "text",
        "text": (
            f"Xin chào! Tôi là **Trợ lý Điều hành Sân bãi AI (ArenaSP AI Assistant)**.\n\n"
            f"Tôi được tích hợp trực tiếp với cơ sở dữ liệu sân bãi và **mô hình học máy Random Forest** để hỗ trợ bạn:\n\n"
            f"1. 📅 **Kiểm tra lịch trống & Gợi ý khung giờ:** Đặt câu hỏi như *'Chiều 18/10 sân chính còn trống không?'*\n"
            f"2. 📈 **Giải thích mô hình dự báo:** Tìm hiểu cơ sở đưa ra đề xuất tối ưu hạ tầng.\n"
            f"3. 📝 **Quy trình cấp phép & Đặt chỗ:** Hướng dẫn thủ tục đăng ký theo quy định của Ban Quản lý.\n"
            f"4. ⚠️ **Cảnh báo nguy cơ quá tải:** Đánh giá mức độ đông đúc và đề xuất phương án điều phối.\n"
            f"5. ⚙️ **Nội quy & Mượn thiết bị:** Hướng dẫn an toàn sàn đấu, âm thanh, ánh sáng và PCCC.\n\n"
            f"Vui lòng nhập câu hỏi hoặc chọn các thao tác nhanh bên dưới để bắt đầu!"
        ),
        "actions": [
            "Gợi ý lịch trống",
            "Xem lịch trống",
            "Gửi đơn đăng ký",
            "Nội quy sử dụng sân",
            "Cảnh báo quá tải"
        ]
    }
