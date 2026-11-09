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
# TẠO FEATURES CHO RANDOM FOREST (THEO KHUNG GIỜ)
# Features: [hall_id, capacity, weekday, month, is_weekend, hour_slot]
# =====================================================

def create_features(
    hall: Hall,
    prediction_date: date,
    hour_slot: int = 14
):
    weekday = prediction_date.weekday()
    is_weekend = 1 if weekday >= 5 else 0

    return [
        hall.id,
        hall.capacity,
        weekday,
        prediction_date.month,
        is_weekend,
        hour_slot
    ]


# =====================================================
# TẠO DATASET TỪ LỊCH SỬ SCHEDULE (THEO KHUNG GIỜ)
# =====================================================

def build_training_dataset(
    db: Session
):
    halls = db.query(Hall).all()

    if not halls:
        raise ValueError("Chưa có khu vực thi đấu để huấn luyện")

    schedules = (
        db.query(Schedule)
        .filter(
            Schedule.status == "COMPLETED",
            Schedule.end_time < datetime.now()
        )
        .order_by(Schedule.start_time.asc())
        .all()
    )

    if not schedules:
        raise ValueError("Chưa có dữ liệu lịch sử để huấn luyện Random Forest")

    min_date = min(schedule.start_time.date() for schedule in schedules)
    max_date = max(schedule.end_time.date() for schedule in schedules)

    earliest_date = max_date - timedelta(days=364)
    if min_date < earliest_date:
        min_date = earliest_date

    # 6 khung giờ hoạt động chính của nhà thi đấu (mỗi slot 2 tiếng)
    slots = [8, 10, 14, 16, 18, 20]

    # Tính số phút hoạt động trong từng slot (hall_id, date, start_hour) -> minutes
    slot_usage = defaultdict(float)

    for schedule in schedules:
        current_date = schedule.start_time.date()
        last_date = schedule.end_time.date()

        while current_date <= last_date:
            for s_hour in slots:
                slot_start = datetime.combine(current_date, time(s_hour, 0))
                slot_end = slot_start + timedelta(hours=2)

                overlap_start = max(schedule.start_time, slot_start)
                overlap_end = min(schedule.end_time, slot_end)

                if overlap_end > overlap_start:
                    mins = (overlap_end - overlap_start).total_seconds() / 60.0
                    slot_usage[(schedule.hall_id, current_date, s_hour)] += mins

            current_date += timedelta(days=1)

    records = []
    for hall in halls:
        current_date = min_date
        while current_date <= max_date:
            for s_hour in slots:
                mins = slot_usage.get((hall.id, current_date, s_hour), 0.0)
                usage_pct = min((mins / 120.0) * 100.0, 100.0)

                feat = create_features(hall, current_date, hour_slot=s_hour)
                records.append((current_date, feat, usage_pct))

            current_date += timedelta(days=1)

    records.sort(key=lambda item: item[0])

    if len(records) < 20:
        raise ValueError("Cần ít nhất 20 mẫu dữ liệu lịch sử để huấn luyện Random Forest")

    X = [r[1] for r in records]
    y = [r[2] for r in records]

    return X, y, min_date, max_date



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
# DỰ BÁO % THEO KHUNG GIỜ
# =====================================================

def predict_usage(
    hall: Hall,
    prediction_date: date,
    hour_slot: int = 14
):
    model_data = load_random_forest()
    model = model_data["model"]

    features = create_features(
        hall,
        prediction_date,
        hour_slot=hour_slot
    )

    result = model.predict([features])[0]
    result = max(0, min(float(result), 100))

    return round(result, 2)



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