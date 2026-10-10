import random

from datetime import (
    date,
    datetime,
    time,
    timedelta
)

from database import SessionLocal

from models import (
    Hall,
    Schedule
)


# =====================================================
# CẤU HÌNH
# =====================================================

NUMBER_OF_DAYS = 90

random.seed(42)


def seed_history():

    db = SessionLocal()

    try:

        # =================================================
        # LẤY CÁC KHU VỰC ĐANG HOẠT ĐỘNG
        # =================================================

        halls = (
            db.query(Hall)
            .filter(
                Hall.status == "active"
            )
            .all()
        )

        if not halls:

            print(
                "Không có khu vực active. "
                "Hãy tạo Hall trước."
            )

            return

        print(
            f"Tìm thấy {len(halls)} khu vực."
        )

        # =================================================
        # XÓA DỮ LIỆU SEED CŨ
        # Không xóa dữ liệu thật
        # =================================================

        deleted = (
            db.query(Schedule)
            .filter(
                Schedule.title.like(
                    "[ML-SEED]%"
                )
            )
            .delete(
                synchronize_session=False
            )
        )

        db.commit()

        print(
            f"Đã xóa {deleted} lịch mẫu cũ."
        )

        # =================================================
        # TẠO 90 NGÀY LỊCH SỬ
        # =================================================

        end_date = (
            date.today()
            - timedelta(days=1)
        )

        start_date = (
            end_date
            - timedelta(
                days=NUMBER_OF_DAYS - 1
            )
        )

        total_created = 0

        for hall in halls:

            current_date = start_date

            while current_date <= end_date:

                weekday = (
                    current_date.weekday()
                )

                # =========================================
                # Thứ 2 - Thứ 6
                # mức sử dụng thấp/trung bình
                # =========================================

                if weekday < 5:

                    duration_hours = random.choice(
                        [
                            2,
                            3,
                            4,
                            5,
                            6
                        ]
                    )

                # =========================================
                # Thứ 7 - Chủ nhật
                # thường đông hơn
                # =========================================

                else:

                    duration_hours = random.choice(
                        [
                            6,
                            7,
                            8,
                            9,
                            10
                        ]
                    )

                # =========================================
                # Chọn giờ bắt đầu
                # Nhà thi đấu hoạt động 08:00 - 22:00
                # =========================================

                latest_start = (
                    22
                    - duration_hours
                )

                possible_start_hours = list(
                    range(
                        8,
                        latest_start + 1
                    )
                )

                start_hour = random.choice(
                    possible_start_hours
                )

                start_time = datetime.combine(
                    current_date,
                    time(
                        start_hour,
                        0
                    )
                )

                end_time = (
                    start_time
                    + timedelta(
                        hours=duration_hours
                    )
                )

                # =========================================
                # TẠO SCHEDULE LỊCH SỬ
                # =========================================

                schedule = Schedule(
                    hall_id=hall.id,

                    title=(
                        "[ML-SEED] "
                        f"Lịch sử khu vực "
                        f"{hall.code}"
                    ),

                    start_time=start_time,

                    end_time=end_time,

                    status="COMPLETED",

                    description=(
                        "Dữ liệu lịch sử mẫu "
                        "phục vụ huấn luyện "
                        "Random Forest"
                    )
                )

                db.add(schedule)

                total_created += 1

                current_date += timedelta(
                    days=1
                )

        db.commit()

        # =================================================
        # KẾT QUẢ
        # =================================================

        print(
            "================================="
        )

        print(
            "TẠO DỮ LIỆU THÀNH CÔNG"
        )

        print(
            "================================="
        )

        print(
            f"Số Hall: {len(halls)}"
        )

        print(
            f"Từ ngày: {start_date}"
        )

        print(
            f"Đến ngày: {end_date}"
        )

        print(
            f"Số Schedule tạo: "
            f"{total_created}"
        )

        print(
            "================================="
        )

    except Exception as error:

        db.rollback()

        print(
            f"Lỗi: {error}"
        )

    finally:

        db.close()


if __name__ == "__main__":

    seed_history()