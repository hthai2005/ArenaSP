import json
import os
import pandas as pd
import numpy as np

class ArenaDataPreprocessor:
    """
    Pipeline tiền xử lý dữ liệu phục vụ mô hình Random Forest
    cho hệ thống ArenaSP (Hệ thống quản lý nhà thi đấu tỉnh).
    Tác giả: Phạm Trần Khánh Nhân - MSSV 23050182 (Tuần 3)
    """

    def __init__(self):
        self.categorical_cols = ["hall_code", "event_type", "organizer_type"]
        self.numerical_cols = [
            "month", "day_of_week", "start_hour", "duration_hours", "end_hour",
            "is_weekend", "is_peak_hour", "hall_capacity", "registered_attendees",
            "declared_occupancy_ratio", "is_large_event", "has_special_equipment",
            "hist_avg_occupancy"
        ]
        self.target_col_reg = "actual_occupancy_rate"
        self.target_col_cls = "utilization_level"
        self.target_col_risk = "overload_risk"

        self.label_mapping = {
            "Thấp": 0,
            "Trung bình": 1,
            "Cao": 2,
            "Quá tải": 3
        }
        self.reverse_label_mapping = {v: k for k, v in self.label_mapping.items()}

        self.fitted_categories = {}
        self.scaler_params = {}
        self.feature_columns_out = []

    def feature_engineering(self, df: pd.DataFrame) -> pd.DataFrame:
        """Trích xuất và làm giàu các đặc trưng nghiệp vụ."""
        df_feat = df.copy()

        # 1. Tính toán giờ kết thúc (end_hour)
        if "end_hour" not in df_feat.columns:
            df_feat["end_hour"] = df_feat["start_hour"] + df_feat["duration_hours"]

        # 2. Tính tỷ lệ lấp đầy theo đăng ký ban đầu (declared_occupancy_ratio)
        if "declared_occupancy_ratio" not in df_feat.columns:
            df_feat["declared_occupancy_ratio"] = (
                df_feat["registered_attendees"] / df_feat["hall_capacity"]
            ).round(4)

        # 3. Phân loại sự kiện quy mô lớn (> 500 người)
        if "is_large_event" not in df_feat.columns:
            df_feat["is_large_event"] = (df_feat["registered_attendees"] >= 500).astype(int)

        # 4. Giờ cao điểm nếu chưa có
        if "is_peak_hour" not in df_feat.columns:
            df_feat["is_peak_hour"] = df_feat["start_hour"].isin([8, 9, 15, 16, 18, 19]).astype(int)

        # 5. Cuối tuần nếu chưa có
        if "is_weekend" not in df_feat.columns:
            df_feat["is_weekend"] = df_feat["day_of_week"].isin([7, 8]).astype(int)

        return df_feat

    def fit(self, df: pd.DataFrame):
        """Fit scaler và lưu các danh mục categorical từ tập Train."""
        df_feat = self.feature_engineering(df)

        # Thu thập các danh mục One-Hot Encoding
        for col in self.categorical_cols:
            unique_vals = sorted(list(df_feat[col].dropna().unique()))
            self.fitted_categories[col] = unique_vals

        # Tính mean và std cho Standard Scaling
        for col in self.numerical_cols:
            mean_val = float(df_feat[col].mean())
            std_val = float(df_feat[col].std())
            if std_val == 0 or np.isnan(std_val):
                std_val = 1.0
            self.scaler_params[col] = {"mean": mean_val, "std": std_val}

        # Lưu danh sách tên cột sau khi encode để đảm bảo thống nhất
        encoded_cat_cols = []
        for col in self.categorical_cols:
            for val in self.fitted_categories[col]:
                encoded_cat_cols.append(f"{col}_{val}")
        
        self.feature_columns_out = self.numerical_cols + encoded_cat_cols
        return self

    def transform(self, df: pd.DataFrame, include_target: bool = True):
        """Biến đổi dữ liệu mới dựa trên tham số đã fit."""
        df_feat = self.feature_engineering(df)

        # Xử lý missing values nếu có
        for col in self.numerical_cols:
            if col in df_feat.columns:
                df_feat[col] = df_feat[col].fillna(self.scaler_params[col]["mean"])

        # 1. Scale Numerical Features (StandardScaler z = (x - mean) / std)
        scaled_num = pd.DataFrame(index=df_feat.index)
        for col in self.numerical_cols:
            m = self.scaler_params[col]["mean"]
            s = self.scaler_params[col]["std"]
            scaled_num[col] = ((df_feat[col] - m) / s).round(5)

        # 2. One-Hot Encoding cho Categorical Features
        encoded_cat = pd.DataFrame(index=df_feat.index)
        for col in self.categorical_cols:
            for val in self.fitted_categories[col]:
                col_name = f"{col}_{val}"
                encoded_cat[col_name] = (df_feat[col] == val).astype(int)

        # Ghép đặc trưng đầu vào X
        X_out = pd.concat([scaled_num, encoded_cat], axis=1)
        X_out = X_out[self.feature_columns_out]

        if not include_target:
            return X_out

        # Trích xuất và mã hóa các biến mục tiêu
        targets = pd.DataFrame(index=df_feat.index)
        if self.target_col_cls in df_feat.columns:
            targets["target_cls"] = df_feat[self.target_col_cls].map(self.label_mapping).fillna(0).astype(int)
        if self.target_col_reg in df_feat.columns:
            targets["target_reg"] = df_feat[self.target_col_reg].astype(float)
        if self.target_col_risk in df_feat.columns:
            targets["target_risk"] = df_feat[self.target_col_risk].astype(int)

        return X_out, targets

    def fit_transform(self, df: pd.DataFrame):
        self.fit(df)
        return self.transform(df)

    def save_metadata(self, filepath: str):
        """Lưu metadata cấu hình pipeline dạng JSON."""
        meta = {
            "categorical_cols": self.categorical_cols,
            "numerical_cols": self.numerical_cols,
            "feature_columns_out": self.feature_columns_out,
            "fitted_categories": self.fitted_categories,
            "scaler_params": self.scaler_params,
            "label_mapping": self.label_mapping,
            "reverse_label_mapping": self.reverse_label_mapping
        }
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(meta, f, ensure_ascii=False, indent=2)
        print(f"Metadata saved to {filepath}")

    @classmethod
    def load_metadata(cls, filepath: str):
        """Khôi phục pipeline từ metadata JSON."""
        instance = cls()
        with open(filepath, "r", encoding="utf-8") as f:
            meta = json.load(f)
        instance.categorical_cols = meta["categorical_cols"]
        instance.numerical_cols = meta["numerical_cols"]
        instance.feature_columns_out = meta["feature_columns_out"]
        instance.fitted_categories = meta["fitted_categories"]
        instance.scaler_params = meta["scaler_params"]
        instance.label_mapping = meta["label_mapping"]
        instance.reverse_label_mapping = meta["reverse_label_mapping"]
        return instance

def run_pipeline():
    raw_path = "ai_module/data/arena_sample_dataset.csv"
    if not os.path.exists(raw_path):
        print(f"Error: {raw_path} not found.")
        return

    df = pd.read_csv(raw_path)
    print(f"Loaded dataset: {df.shape[0]} rows, {df.shape[1]} columns")

    # Chia train/test theo tỉ lệ 80% / 20%
    # Dùng shuffle với seed cố định
    shuffled_indices = np.random.RandomState(seed=42).permutation(len(df))
    train_size = int(len(df) * 0.8)
    train_idx = shuffled_indices[:train_size]
    test_idx = shuffled_indices[train_size:]

    df_train = df.iloc[train_idx].reset_index(drop=True)
    df_test = df.iloc[test_idx].reset_index(drop=True)

    print(f"Train split: {len(df_train)} records")
    print(f"Test split:  {len(df_test)} records")

    preprocessor = ArenaDataPreprocessor()
    X_train, y_train = preprocessor.fit_transform(df_train)
    X_test, y_test = preprocessor.transform(df_test)

    # Lưu kết quả
    os.makedirs("ai_module/processed", exist_ok=True)
    X_train.to_csv("ai_module/processed/X_train.csv", index=False)
    y_train.to_csv("ai_module/processed/y_train.csv", index=False)
    X_test.to_csv("ai_module/processed/X_test.csv", index=False)
    y_test.to_csv("ai_module/processed/y_test.csv", index=False)

    preprocessor.save_metadata("ai_module/processed/pipeline_metadata.json")

    print("\n[SUCCESS] Pipeline executed successfully!")
    print(f"Number of engineered features: {X_train.shape[1]}")
    print("Features list:", list(X_train.columns))
    print("\nTrain features head (first 2 rows):")
    print(X_train.head(2))

if __name__ == "__main__":
    run_pipeline()
