import pandas as pd
import numpy as np
import random
from datetime import datetime, timedelta

# Cố định seed để tái lập kết quả
np.random.seed(42)
random.seed(42)

# 1. Định nghĩa danh mục dựa trên mock.js của ArenaSP
HALLS = [
    {"code": "HT-01", "name": "Sân trung tâm A", "type": "Sân thi đấu chính", "capacity": 3500},
    {"code": "HT-02", "name": "Hội trường khánh tiết", "type": "Hội trường", "capacity": 500},
    {"code": "HT-03", "name": "Sân cầu lông B", "type": "Sân cầu lông", "capacity": 800},
    {"code": "HT-04", "name": "Bể bơi Olympic 50m", "type": "Bể bơi", "capacity": 2100},
    {"code": "HT-05", "name": "Sân tập thể lực", "type": "Sân tập", "capacity": 200},
    {"code": "HT-06", "name": "Nhà thi đấu đa năng D", "type": "Sân đa năng", "capacity": 1200},
]

EVENT_TYPES = [
    "Giải thi đấu thể thao",
    "Tập luyện CLB / Đội tuyển",
    "Hội nghị / Sự kiện",
    "Giao lưu phong trào",
    "Tập thể thao tự do"
]

ORGANIZER_TYPES = [
    "CLB_ChuyenNghiep",
    "SoBanNganh_DoanThe",
    "TruongHoc_DaiHoc",
    "DoanhNghiep_TuNhan",
    "NhomCaNhan"
]

# Tạo 2.000 lượt đặt sân mẫu trong khoảng 6 tháng (01/01/2026 - 30/06/2026)
start_date = datetime(2026, 1, 1)
end_date = datetime(2026, 6, 30)
days_range = (end_date - start_date).days

records = []

for i in range(1, 2001):
    random_day = start_date + timedelta(days=random.randint(0, days_range))
    day_of_week = random_day.weekday() + 2  # 2: Thứ 2, ..., 8: Chủ Nhật
    is_weekend = 1 if day_of_week in [7, 8] else 0
    month = random_day.month

    # Chọn ngẫu nhiên hội trường
    hall = random.choice(HALLS)
    hall_code = hall["code"]
    hall_type = hall["type"]
    capacity = hall["capacity"]

    # Chọn khung giờ bắt đầu và thời lượng
    # Khung giờ: 6h - 21h
    # Giờ cao điểm: Sáng 8-10h, Chiều 15-17h, Tối 18-20h
    start_hour = random.choice([6, 7, 8, 9, 10, 13, 14, 15, 16, 17, 18, 19, 20])
    duration = random.choice([1.5, 2.0, 2.5, 3.0, 4.0])

    is_peak_hour = 1 if (start_hour in [8, 9, 15, 16, 18, 19]) else 0

    # Phù hợp loại sự kiện với loại hội trường
    if hall_type == "Hội trường":
        event_type = random.choice(["Hội nghị / Sự kiện", "Giao lưu phong trào"])
        organizer = random.choice(["SoBanNganh_DoanThe", "DoanhNghiep_TuNhan", "TruongHoc_DaiHoc"])
    elif hall_type == "Bể bơi":
        event_type = random.choice(["Tập thể thao tự do", "Tập luyện CLB / Đội tuyển", "Giải thi đấu thể thao"])
        organizer = random.choice(["CLB_ChuyenNghiep", "NhomCaNhan", "TruongHoc_DaiHoc"])
    elif hall_type in ["Sân thi đấu chính", "Sân đa năng"]:
        event_type = random.choice(["Giải thi đấu thể thao", "Giao lưu phong trào", "Tập luyện CLB / Đội tuyển"])
        organizer = random.choice(["CLB_ChuyenNghiep", "SoBanNganh_DoanThe", "DoanhNghiep_TuNhan"])
    else:
        event_type = random.choice(["Tập luyện CLB / Đội tuyển", "Tập thể thao tự do", "Giao lưu phong trào"])
        organizer = random.choice(["NhomCaNhan", "CLB_ChuyenNghiep", "TruongHoc_DaiHoc"])

    # Thiết bị chuyên dụng
    if event_type in ["Giải thi đấu thể thao", "Hội nghị / Sự kiện"]:
        has_special_equipment = 1 if random.random() < 0.85 else 0
    else:
        has_special_equipment = 1 if random.random() < 0.25 else 0

    # Số người đăng ký dự kiến (registered_attendees)
    if event_type == "Giải thi đấu thể thao":
        base_rate = random.uniform(0.65, 0.95)
    elif event_type == "Hội nghị / Sự kiện":
        base_rate = random.uniform(0.50, 0.85)
    elif is_weekend and is_peak_hour:
        base_rate = random.uniform(0.60, 0.90)
    elif is_peak_hour:
        base_rate = random.uniform(0.40, 0.75)
    else:
        base_rate = random.uniform(0.15, 0.50)

    # Thêm yếu tố biến động ngẫu nhiên
    registered_attendees = int(capacity * base_rate * random.uniform(0.9, 1.1))
    registered_attendees = max(10, min(registered_attendees, int(capacity * 1.2)))  # Có thể đăng ký vượt sức chứa

    # Tỷ lệ sử dụng thực tế (actual_occupancy_rate)
    # Lượng người thực tế đến tham gia thường có chút sai lệch so với đăng ký
    actual_attendees = int(registered_attendees * random.uniform(0.85, 1.15))
    actual_attendees = max(5, actual_attendees)

    occupancy_rate = round(actual_attendees / capacity, 4)

    # Phân loại mức độ nhu cầu / sử dụng (utilization_level):
    # Low: < 40%, Medium: 40% - 75%, High: 75% - 100%, Overload: > 100%
    if occupancy_rate > 1.0:
        utilization_level = "Quá tải"
        overload_risk = 1
    elif occupancy_rate >= 0.75:
        utilization_level = "Cao"
        overload_risk = 1 if occupancy_rate >= 0.90 else 0
    elif occupancy_rate >= 0.40:
        utilization_level = "Trung bình"
        overload_risk = 0
    else:
        utilization_level = "Thấp"
        overload_risk = 0

    # Lịch sử mức sử dụng trung bình của hội trường đó (mô phỏng)
    hist_base = {"HT-01": 0.68, "HT-02": 0.55, "HT-03": 0.82, "HT-04": 0.72, "HT-05": 0.60, "HT-06": 0.45}
    hist_avg = round(hist_base.get(hall_code, 0.5) + random.uniform(-0.08, 0.08), 3)

    records.append({
        "booking_id": f"BK-{i:05d}",
        "booking_date": random_day.strftime("%Y-%m-%d"),
        "month": month,
        "day_of_week": day_of_week,
        "is_weekend": is_weekend,
        "start_hour": start_hour,
        "duration_hours": duration,
        "is_peak_hour": is_peak_hour,
        "hall_code": hall_code,
        "hall_type": hall_type,
        "hall_capacity": capacity,
        "event_type": event_type,
        "organizer_type": organizer,
        "has_special_equipment": has_special_equipment,
        "hist_avg_occupancy": hist_avg,
        "registered_attendees": registered_attendees,
        "actual_attendees": actual_attendees,
        "actual_occupancy_rate": occupancy_rate,
        "utilization_level": utilization_level,
        "overload_risk": overload_risk
    })

df = pd.DataFrame(records)
df.to_csv("ai_module/data/arena_sample_dataset.csv", index=False, encoding="utf-8-sig")
print("Successfully generated ai_module/data/arena_sample_dataset.csv")
print(f"Total records: {len(df)}")
print("\nDistribution of utilization_level:")
print(df["utilization_level"].value_counts(normalize=True))
print("\nSample records:")
print(df.head(3).T)
