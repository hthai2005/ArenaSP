from collections import defaultdict
from datetime import (
    date,
    datetime,
    time,
    timedelta
)
from pathlib import Path

import joblib

from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import (
    mean_absolute_error,
    r2_score
)

from sqlalchemy.orm import Session

from models import (
    Hall,
    Schedule
)


# =====================================================
# ĐƯỜNG DẪN MODEL
# =====================================================

MODEL_PATH = (
    Path(__file__).resolve().parent
    / "random_forest_usage.joblib"
)


# =====================================================
# THỜI GIAN HOẠT ĐỘNG
# 08:00 -> 22:00 = 14 giờ
# =====================================================

OPEN_HOUR = 8
CLOSE_HOUR = 22

OPEN_MINUTES = (
    CLOSE_HOUR - OPEN_HOUR
) * 60


# =====================================================
# TẠO FEATURES CHO RANDOM FOREST
# =====================================================

def create_features(
    hall: Hall,
    prediction_date: date
):

    weekday = prediction_date.weekday()

    is_weekend = (
        1 if weekday >= 5 else 0
    )

    return [
        hall.id,
        hall.capacity,
        weekday,
        prediction_date.month,
        is_weekend
    ]


# =====================================================
# TẠO DATASET TỪ LỊCH SỬ SCHEDULE
# =====================================================

def build_training_dataset(
    db: Session
):

    halls = db.query(Hall).all()

    if not halls:
        raise ValueError(
            "Chưa có khu vực thi đấu để huấn luyện"
        )

    schedules = (
        db.query(Schedule)
        .filter(
            Schedule.status != "CANCELLED"
        )
        .order_by(
            Schedule.start_time.asc()
        )
        .all()
    )

    if not schedules:
        raise ValueError(
            "Chưa có dữ liệu lịch sử để huấn luyện Random Forest"
        )

    # -------------------------------------------------
    # Xác định khoảng thời gian lịch sử
    # -------------------------------------------------

    min_date = min(
        schedule.start_time.date()
        for schedule in schedules
    )

    max_date = max(
        schedule.end_time.date()
        for schedule in schedules
    )

    # Chỉ lấy tối đa 365 ngày gần nhất
    earliest_date = (
        max_date - timedelta(days=364)
    )

    if min_date < earliest_date:
        min_date = earliest_date

    # -------------------------------------------------
    # Tính tổng số phút sử dụng mỗi hall / ngày
    # -------------------------------------------------

    usage_minutes = defaultdict(float)

    for schedule in schedules:

        current_date = (
            schedule.start_time.date()
        )

        last_date = (
            schedule.end_time.date()
        )

        while current_date <= last_date:

            day_open = datetime.combine(
                current_date,
                time(OPEN_HOUR, 0)
            )

            day_close = datetime.combine(
                current_date,
                time(CLOSE_HOUR, 0)
            )

            overlap_start = max(
                schedule.start_time,
                day_open
            )

            overlap_end = min(
                schedule.end_time,
                day_close
            )

            if overlap_end > overlap_start:

                minutes = (
                    overlap_end
                    - overlap_start
                ).total_seconds() / 60

                usage_minutes[
                    (
                        schedule.hall_id,
                        current_date
                    )
                ] += minutes

            current_date += timedelta(
                days=1
            )

    # -------------------------------------------------
    # Tạo từng mẫu training
    # -------------------------------------------------

    records = []

    for hall in halls:

        current_date = min_date

        while current_date <= max_date:

            minutes = usage_minutes.get(
                (
                    hall.id,
                    current_date
                ),
                0
            )

            usage_percent = (
                minutes
                / OPEN_MINUTES
                * 100
            )

            usage_percent = min(
                usage_percent,
                100
            )

            records.append(
                (
                    current_date,
                    create_features(
                        hall,
                        current_date
                    ),
                    usage_percent
                )
            )

            current_date += timedelta(
                days=1
            )

    # -------------------------------------------------
    # Sắp xếp theo ngày
    # -------------------------------------------------

    records.sort(
        key=lambda item: item[0]
    )

    if len(records) < 14:

        raise ValueError(
            "Cần ít nhất 14 mẫu dữ liệu lịch sử "
            "để huấn luyện Random Forest"
        )

    X = [
        record[1]
        for record in records
    ]

    y = [
        record[2]
        for record in records
    ]

    return (
        X,
        y,
        min_date,
        max_date
    )


# =====================================================
# TRAIN RANDOM FOREST
# =====================================================

def train_random_forest(
    db: Session
):

    (
        X,
        y,
        date_from,
        date_to
    ) = build_training_dataset(db)

    mae = None
    r2 = None

    # -------------------------------------------------
    # Nếu đủ dữ liệu thì đánh giá mô hình
    # 80% train - 20% test
    # -------------------------------------------------

    if len(X) >= 20:

        split_index = int(
            len(X) * 0.8
        )

        X_train = X[:split_index]
        X_test = X[split_index:]

        y_train = y[:split_index]
        y_test = y[split_index:]

        evaluation_model = (
            RandomForestRegressor(
                n_estimators=200,
                random_state=42,
                min_samples_leaf=2
            )
        )

        evaluation_model.fit(
            X_train,
            y_train
        )

        predictions = (
            evaluation_model.predict(
                X_test
            )
        )

        mae = mean_absolute_error(
            y_test,
            predictions
        )

        if (
            len(y_test) >= 2
            and len(set(y_test)) > 1
        ):

            r2 = r2_score(
                y_test,
                predictions
            )

    # -------------------------------------------------
    # Train lại bằng toàn bộ dataset
    # -------------------------------------------------

    model = RandomForestRegressor(
        n_estimators=200,
        random_state=42,
        min_samples_leaf=2
    )

    model.fit(
        X,
        y
    )

    # -------------------------------------------------
    # Lưu model
    # -------------------------------------------------

    model_data = {
        "model": model,
        "samples": len(X),
        "date_from": date_from,
        "date_to": date_to,
        "mae": (
            round(float(mae), 2)
            if mae is not None
            else None
        ),
        "r2": (
            round(float(r2), 4)
            if r2 is not None
            else None
        ),
        "trained_at": datetime.now()
    }

    joblib.dump(
        model_data,
        MODEL_PATH
    )

    return model_data


# =====================================================
# LOAD MODEL
# =====================================================

def load_random_forest():

    if not MODEL_PATH.exists():

        raise FileNotFoundError(
            "Model Random Forest chưa được train"
        )

    return joblib.load(
        MODEL_PATH
    )


# =====================================================
# DỰ BÁO %
# =====================================================

def predict_usage(
    hall: Hall,
    prediction_date: date
):

    model_data = load_random_forest()

    model = model_data["model"]

    features = create_features(
        hall,
        prediction_date
    )

    result = model.predict(
        [features]
    )[0]

    result = max(
        0,
        min(float(result), 100)
    )

    return round(
        result,
        2
    )


# =====================================================
# XÁC ĐỊNH MỨC RỦI RO
# =====================================================

def calculate_risk_level(
    predicted_usage: float
):

    if predicted_usage < 50:
        return "LOW"

    if predicted_usage < 80:
        return "MEDIUM"

    return "HIGH"


# =====================================================
# GỢI Ý KHUNG GIỜ TRỐNG
# =====================================================

def recommend_free_time(
    db: Session,
    hall_id: int,
    prediction_date: date
):

    schedules = (
        db.query(Schedule)
        .filter(
            Schedule.hall_id == hall_id,
            Schedule.status != "CANCELLED"
        )
        .all()
    )

    current_hour = OPEN_HOUR

    while current_hour < CLOSE_HOUR:

        slot_start = datetime.combine(
            prediction_date,
            time(current_hour, 0)
        )

        slot_end = (
            slot_start
            + timedelta(hours=1)
        )

        conflict = False

        for schedule in schedules:

            if (
                schedule.start_time
                < slot_end
                and schedule.end_time
                > slot_start
            ):
                conflict = True
                break

        if not conflict:

            return (
                f"{slot_start:%H:%M}"
                f" - "
                f"{slot_end:%H:%M}"
            )

        current_hour += 1

    return "Không còn khung giờ trống"