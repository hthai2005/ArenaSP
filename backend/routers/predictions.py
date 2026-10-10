from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query
)

from sqlalchemy.orm import Session

from database import get_db

from models import (
    Hall,
    Prediction,
    User
)

from schemas import (
    PredictionRequest,
    PredictionResponse,
    PredictionTrainResponse
)

from rbac import require_permission

from activity_logger import (
    write_activity_log
)

from ai_module.random_forest import (
    train_random_forest,
    predict_usage,
    calculate_risk_level,
    recommend_free_time
)


router = APIRouter(
    prefix="/api/predictions",
    tags=["Random Forest - Dự báo"]
)


# =====================================================
# TRAIN RANDOM FOREST
# =====================================================

@router.post(
    "/train",
    response_model=PredictionTrainResponse
)
def train_model(
    db: Session = Depends(get_db),

    current_user: User = Depends(
        require_permission(
            "PREDICTION_RUN"
        )
    )
):

    try:

        result = train_random_forest(
            db
        )

    except ValueError as error:

        raise HTTPException(
            status_code=400,
            detail=str(error)
        )

    write_activity_log(
        db=db,
        user_id=current_user.id,
        action="TRAIN_RANDOM_FOREST",
        target="prediction_model",
        description=(
            f"Huấn luyện Random Forest "
            f"với {result['samples']} mẫu"
        )
    )

    return {
        "message": (
            "Huấn luyện Random Forest "
            "thành công"
        ),

        "samples": result["samples"],

        "date_from": result[
            "date_from"
        ],

        "date_to": result[
            "date_to"
        ],

        "mae": result["mae"],

        "r2": result["r2"]
    }


# =====================================================
# TẠO DỰ BÁO
# =====================================================

@router.post(
    "/predict",
    response_model=PredictionResponse
)
def create_prediction(
    data: PredictionRequest,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        require_permission(
            "PREDICTION_VIEW"
        )
    )
):

    hall = db.query(Hall).filter(
        Hall.id == data.hall_id
    ).first()

    if not hall:

        raise HTTPException(
            status_code=404,
            detail=(
                "Không tìm thấy khu vực thi đấu"
            )
        )

    try:

        predicted_usage = predict_usage(
            hall=hall,
            prediction_date=(
                data.prediction_date
            )
        )

    except FileNotFoundError as error:

        raise HTTPException(
            status_code=400,
            detail=str(error)
        )

    risk_level = calculate_risk_level(
        predicted_usage
    )

    recommended_time = (
        recommend_free_time(
            db=db,
            hall_id=hall.id,
            prediction_date=(
                data.prediction_date
            )
        )
    )

    # -------------------------------------------------
    # Nếu ngày/hall đã dự báo rồi thì cập nhật
    # -------------------------------------------------

    prediction = (
        db.query(Prediction)
        .filter(
            Prediction.hall_id
            == hall.id,

            Prediction.prediction_date
            == data.prediction_date
        )
        .first()
    )

    if prediction:

        prediction.predicted_usage = (
            predicted_usage
        )

        prediction.risk_level = (
            risk_level
        )

        prediction.recommended_time = (
            recommended_time
        )

    else:

        prediction = Prediction(
            hall_id=hall.id,

            prediction_date=(
                data.prediction_date
            ),

            predicted_usage=(
                predicted_usage
            ),

            risk_level=(
                risk_level
            ),

            recommended_time=(
                recommended_time
            )
        )

        db.add(prediction)

    db.commit()
    db.refresh(prediction)

    return prediction


# =====================================================
# DANH SÁCH DỰ BÁO
# =====================================================

@router.get(
    "/",
    response_model=list[
        PredictionResponse
    ]
)
def get_predictions(
    hall_id: int | None = Query(
        default=None
    ),

    db: Session = Depends(get_db),

    current_user: User = Depends(
        require_permission(
            "PREDICTION_VIEW"
        )
    )
):

    query = db.query(Prediction)

    if hall_id is not None:

        query = query.filter(
            Prediction.hall_id
            == hall_id
        )

    return (
        query
        .order_by(
            Prediction.created_at.desc()
        )
        .all()
    )


# =====================================================
# DỰ BÁO GẦN NHẤT
# =====================================================

@router.get(
    "/latest",
    response_model=PredictionResponse
)
def get_latest_prediction(
    hall_id: int | None = Query(
        default=None
    ),

    db: Session = Depends(get_db),

    current_user: User = Depends(
        require_permission(
            "PREDICTION_VIEW"
        )
    )
):

    query = db.query(Prediction)

    if hall_id is not None:

        query = query.filter(
            Prediction.hall_id
            == hall_id
        )

    prediction = (
        query
        .order_by(
            Prediction.created_at.desc()
        )
        .first()
    )

    if not prediction:

        raise HTTPException(
            status_code=404,
            detail="Chưa có dữ liệu dự báo"
        )

    return prediction


# =====================================================
# CHI TIẾT DỰ BÁO
# =====================================================

@router.get(
    "/{prediction_id}",
    response_model=PredictionResponse
)
def get_prediction(
    prediction_id: int,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        require_permission(
            "PREDICTION_VIEW"
        )
    )
):

    prediction = (
        db.query(Prediction)
        .filter(
            Prediction.id
            == prediction_id
        )
        .first()
    )

    if not prediction:

        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy dự báo"
        )

    return prediction