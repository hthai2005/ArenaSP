import sys
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from database import SessionLocal
from models import User, Stadium, Hall
from routers.auth import password_hash

def seed_demo_data():
    db = SessionLocal()
    try:
        # Seed users if not exist
        demo_users = [
            {
                "username": "admin",
                "email": "admin@arenasp.vn",
                "full_name": "Trần Văn Bình",
                "phone": "0901234567",
                "role_id": 1,
                "status": "ACTIVE",
            },
            {
                "username": "staff",
                "email": "staff@arenasp.vn",
                "full_name": "Nguyễn Văn Tuấn",
                "phone": "0902345678",
                "role_id": 3,
                "status": "ACTIVE",
            },
            {
                "username": "user",
                "email": "user@arenasp.vn",
                "full_name": "CLB Thể thao Tỉnh",
                "phone": "0903456789",
                "role_id": 4,
                "status": "ACTIVE",
            },
        ]

        hashed_pwd = password_hash.hash("123456")

        for u_data in demo_users:
            existing = db.query(User).filter((User.email == u_data["email"]) | (User.username == u_data["username"])).first()
            if not existing:
                new_user = User(
                    username=u_data["username"],
                    email=u_data["email"],
                    password_hash=hashed_pwd,
                    full_name=u_data["full_name"],
                    phone=u_data["phone"],
                    role_id=u_data["role_id"],
                    status=u_data["status"],
                )
                db.add(new_user)
                print(f"Created user: {u_data['email']}")

        db.commit()

        # Seed stadium if not exist
        stadium = db.query(Stadium).filter(Stadium.id == 1).first()
        if not stadium:
            stadium = Stadium(
                id=1,
                name="Nhà thi đấu thể thao thành phố",
                official_name="Nhà thi đấu tỉnh",
                address="42 Đường Trường Chinh, Phường 3, TP. Tân An",
                area=48000,
                capacity=22000,
                description="Sàn gỗ, 3 lớp LED, 4 phòng thay đồ, hệ thống PCCC đạt chuẩn.",
                status="active"
            )
            db.add(stadium)
            db.commit()
            print("Created stadium: Nhà thi đấu thể thao thành phố")

        # Seed halls
        demo_halls = [
            {
                "code": "HT-01",
                "name": "Sân trung tâm đa năng A",
                "stadium_id": 1,
                "type": "Sân trong nhà",
                "capacity": 5200,
                "status": "active",
                "image": "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&q=80"
            },
            {
                "code": "HT-02",
                "name": "Hội trường khánh tiết",
                "stadium_id": 1,
                "type": "Hội trường",
                "capacity": 350,
                "status": "active",
                "image": "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80"
            },
            {
                "code": "HT-03",
                "name": "Sân cầu lông B",
                "stadium_id": 1,
                "type": "Sân cầu lông",
                "capacity": 800,
                "status": "maintenance",
                "image": "https://images.unsplash.com/photo-1613918431703-aa504eda44b1?w=800&q=80"
            },
            {
                "code": "HT-04",
                "name": "Bể bơi Olympic 50m",
                "stadium_id": 1,
                "type": "Bể bơi",
                "capacity": 2100,
                "status": "active",
                "image": "https://images.unsplash.com/photo-1519315901367-f34ff9154487?w=800&q=80"
            },
            {
                "code": "HT-05",
                "name": "Sân tập thể lực",
                "stadium_id": 1,
                "type": "Sân tập",
                "capacity": 200,
                "status": "active",
                "image": "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80"
            }
        ]

        for h in demo_halls:
            existing = db.query(Hall).filter(Hall.code == h["code"]).first()
            if not existing:
                hall = Hall(**h)
                db.add(hall)
                print(f"Created hall: {h['name']} ({h['code']})")

        db.commit()
        print("Demo seeding complete!")
    finally:
        db.close()

if __name__ == "__main__":
    seed_demo_data()
