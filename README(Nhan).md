# 🏟️ HƯỚNG DẪN KHỞI CHẠY HỆ THỐNG ARENASP (BY NHÂN)

> Dự án: **Hệ thống Quản lý & Đặt sân Nhà thi đấu Thể thao Tỉnh (ArenaSP)**
> Tích hợp mô hình học máy **Random Forest** (dự báo tải theo khung giờ) và **Trợ lý AI** (kết hợp Gemini LLM & RAG dữ liệu thời gian thực).

---

## 📌 YÊU CẦU MÔI TRƯỜNG CẦN CÀI ĐẶT
1. **Node.js** (Phiên bản 18+ trở lên).
2. **Python** (Phiên bản 3.10 - 3.12+).
3. **XAMPP** (để chạy máy chủ MySQL Server và phpMyAdmin).

---

## BƯỚC 1: KHỞI ĐỘNG CƠ SỞ DỮ LIỆU (MYSQL)

1. Mở **XAMPP Control Panel** -> Bấm nút **Start** ở cả 2 dịch vụ: **Apache** và **MySQL**.
2. Mở trình duyệt vào trang quản lý: `http://localhost/phpmyadmin`
3. Kiểm tra xem đã có cơ sở dữ liệu tên là:
   ```sql
   quan_ly_san_vd
   ```
   - *Nếu chưa có:* Bấm nút **Mới (New)** -> Đặt tên `quan_ly_san_vd` -> Chọn bảng mã `utf8mb4_unicode_ci` -> Bấm **Tạo (Create)**.
   - Sau đó chọn tab **Nhập (Import)** -> Chọn file `ArenaSP/database/QLSVD.sql` để nạp dữ liệu ban đầu.

---

## BƯỚC 2: CẤU HÌNH FILE MÔI TRƯỜNG (.ENV)

Mở file `ArenaSP/backend/.env` và kiểm tra các thông số:
```env
DATABASE_URL=mysql+pymysql://root:@127.0.0.1:3306/quan_ly_san_vd
SECRET_KEY=9a6d3f2e1b8c4a5d7e0f2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e
ACCESS_TOKEN_EXPIRE_MINUTES=1440
GEMINI_API_KEY=your_gemini_api_key_here
```
> **Lưu ý:**
> - Nếu MySQL XAMPP không có mật khẩu, giữ nguyên `root:@127.0.0.1:3306`.
> - Dán mã `GEMINI_API_KEY` bạn đã lấy từ Google AI Studio vào sau dấu `=`.

---

## BƯỚC 3: KHỞI CHẠY BACKEND (FASTAPI)

Mở cửa sổ dòng lệnh thứ nhất (**Git Bash** hoặc **PowerShell**):

```bash
# 1. Di chuyển vào thư mục backend
cd ArenaSP/backend

# 2. Cài đặt các thư viện cần thiết (nếu là lần đầu chạy)
./venv/Scripts/pip install fastapi uvicorn sqlalchemy pymysql python-jose[cryptography] passlib[bcrypt] python-multipart email-validator "pwdlib[argon2]" python-dotenv joblib scikit-learn numpy pandas google-genai

# 3. Huấn luyện mô hình Random Forest theo khung giờ (chỉ cần chạy 1 lần)
./venv/Scripts/python -c "from database import SessionLocal; from ai_module.random_forest import train_random_forest; db = SessionLocal(); res = train_random_forest(db); print('Da train thanh cong:', res['samples'], 'mau du lieu'); db.close()"

# 4. Khởi chạy Server Backend
./venv/Scripts/uvicorn main:app --reload --port 8000
```

> ✅ Khi thấy dòng chữ `Uvicorn running on http://127.0.0.1:8000` là Backend đã chạy thành công!
> - Tài liệu API Swagger UI: `http://127.0.0.1:8000/docs`

---

## BƯỚC 4: KHỞI CHẠY FRONTEND (REACT VITE)

Mở cửa sổ dòng lệnh thứ hai (**Git Bash** hoặc **PowerShell** riêng biệt):

```bash
# 1. Di chuyển vào thư mục Frontend
cd ArenaSP

# 2. Cài đặt node modules (nếu là lần đầu chạy)
npm install

# 3. Khởi chạy giao diện nhà thi đấu
npm run dev
```

> ✅ Mở trình duyệt và truy cập vào: **`http://localhost:5173`**

---

## 🔑 TÀI KHOẢN ĐĂNG NHẬP THỬ NGHIỆM (DEMO)

Tất cả tài khoản đều dùng chung mật khẩu: **`123456`**

| Vai trò (Role) | Email đăng nhập | Quyền hạn chính |
|----------------|-----------------|-----------------|
| **Quản trị viên (Admin)** | `admin@arenasp.vn` | Toàn quyền: Xem Dashboard thống kê, duyệt đặt sân, quản lý người dùng, quản lý nhà thi đấu & thiết bị, huấn luyện AI |
| **Nhân viên (Staff)** | `staff@arenasp.vn` | Quản lý thiết bị kỹ thuật, cập nhật trạng thái bảo trì, hỗ trợ điều phối lịch |
| **Đơn vị đặt sân (User)** | `user@arenasp.vn` | Tra cứu lịch hoạt động, đặt sân trực tuyến, hỏi đáp với Trợ lý AI ArenaSP |

---

## 🤖 CÁC TÍNH NĂNG NỔI BẬT CỦA TRỢ LÝ AI (ARENASP AI ASSISTANT)

1. **Tra cứu sân trống linh hoạt:** 
   - *"Hôm nay có những sân nào đang trống ở các khung giờ nào?"*
   - *"Sân nào đang trống lúc 16h?"*
2. **Dự báo mức tải Random Forest theo từng khung giờ:**
   - Dự đoán chính xác tỷ lệ lấp đầy (%) và cảnh báo nguy cơ quá tải cho từng khung giờ (08-10h, 10-12h, 14-16h, 16-18h, 18-20h, 20-22h).
3. **Hỏi đáp tự nhiên không giới hạn (Gemini LLM RAG):**
   - Trả lời thông minh các câu hỏi về: quy trình cấp phép UBND Tỉnh, nội quy giày thi đấu, mượn trang thiết bị (âm thanh, ánh sáng 1000 lux, màn hình LED).
4. **Tự động lưu lịch sử hội thoại:**
   - Tin nhắn và bảng biểu được lưu trực tiếp vào database MySQL (`chat_messages`), tải lại trang không bị mất.

