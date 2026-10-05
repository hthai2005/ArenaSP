# Module AI - Dự báo mức sử dụng nhà thi đấu bằng Random Forest
**Đồ án ngành:** Xây dựng hệ thống Web quản lý nhà thi đấu tỉnh sử dụng thuật toán Random Forest tích hợp trợ lý AI
**Sinh viên phụ trách:** Phạm Trần Khánh Nhân (MSSV: 23050182)

---

## 1. Giới thiệu
Module này chịu trách nhiệm:
- Sinh và chuẩn hóa dữ liệu mẫu lịch sử đặt sân (2.000 bản ghi dựa trên 6 hội trường thực tế trong `src/data/mock.js` của dự án ArenaSP).
- Xây dựng Pipeline tiền xử lý dữ liệu (Feature Engineering, Scaling, One-Hot Encoding).
- Chuẩn bị dữ liệu huấn luyện và kiểm thử sẵn sàng cho mô hình Random Forest ở Tuần 4 & Tuần 5.
- Cung cấp API/logic tiền xử lý suy luận (Inference Pipeline) để tích hợp vào Backend ở Tuần 6.

## 2. Cấu trúc thư mục
```
ai_module/
├── data/
│   └── arena_sample_dataset.csv       # Bộ dữ liệu mẫu chuẩn hóa 2.000 bản ghi
├── processed/
│   ├── X_train.csv                    # Tập đặc trưng huấn luyện (1.600 mẫu, 29 đặc trưng)
│   ├── y_train.csv                    # Tập nhãn huấn luyện (target_cls, target_reg, target_risk)
│   ├── X_test.csv                     # Tập đặc trưng kiểm thử (400 mẫu, 29 đặc trưng)
│   ├── y_test.csv                     # Tập nhãn kiểm thử
│   └── pipeline_metadata.json         # Tham số chuẩn hóa & từ điển mã hóa
├── scripts/
│   ├── generate_sample_data.py        # Script sinh tập dữ liệu mô phỏng thực tế
│   ├── preprocessing_pipeline.py      # Lớp ArenaDataPreprocessor và pipeline tiền xử lý
│   ├── test_inference_pipeline.py     # Script kiểm thử tiền xử lý 1 yêu cầu đặt sân mới
│   └── train_random_forest_template.py# Script mẫu huấn luyện cho Tuần 4-5
└── README.md
```

## 3. Hướng dẫn chạy
1. **Sinh dữ liệu mẫu:**
   ```bash
   python3 ai_module/scripts/generate_sample_data.py
   ```
2. **Chạy pipeline tiền xử lý:**
   ```bash
   python3 ai_module/scripts/preprocessing_pipeline.py
   ```
3. **Thử nghiệm chuyển đổi một yêu cầu đặt sân mới:**
   ```bash
   python3 ai_module/scripts/test_inference_pipeline.py
   ```
