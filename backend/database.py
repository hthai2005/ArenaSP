from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base


# Kết nối MySQL
# Thay MAT_KHAU_MYSQL bằng mật khẩu MySQL của bạn
DATABASE_URL = "mysql+pymysql://root:09092005@localhost:3306/quan_ly_san_vd"


engine = create_engine(
    DATABASE_URL,
    echo=True
)


SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)


Base = declarative_base()


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()