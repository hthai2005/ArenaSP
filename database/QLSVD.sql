CREATE DATABASE quan_ly_san_vd;
USE quan_ly_san_vd;

-- bảng vai trò người dùng
CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255)
);

-- bảng phân quyền
CREATE TABLE permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(255)
);

-- bảng liên kết vai trò và quyền
CREATE TABLE role_permissions (
    role_id INT NOT NULL,
    permission_id INT NOT NULL,

    PRIMARY KEY (role_id, permission_id),

    FOREIGN KEY (role_id)
        REFERENCES roles(id)
        ON DELETE CASCADE,

    FOREIGN KEY (permission_id)
        REFERENCES permissions(id)
        ON DELETE CASCADE
);

-- bảng người dùng 
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE,
    phone VARCHAR(20) UNIQUE,
    role_id INT NOT NULL DEFAULT 4,
    status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (role_id)
        REFERENCES roles(id)
);

-- bảng nhà thi đấu
CREATE TABLE stadiums (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    official_name VARCHAR(200),
    address VARCHAR(255) NOT NULL,
    area INT NOT NULL DEFAULT 0,
    capacity INT NOT NULL DEFAULT 0,
    description TEXT,

    status ENUM(
        'active',
        'maintenance',
        'inactive'
    ) DEFAULT 'active',

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);

-- bảng khu vực / sân / phòng chức năng trong nhà thi đấu
CREATE TABLE halls (
    id INT AUTO_INCREMENT PRIMARY KEY,

    code VARCHAR(20) NOT NULL UNIQUE,

    stadium_id INT NOT NULL,

    name VARCHAR(150) NOT NULL,

    type VARCHAR(100),

    capacity INT NOT NULL,

    image VARCHAR(500),

    status ENUM(
        'active',
        'maintenance',
        'inactive'
    ) DEFAULT 'active',

    description TEXT,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (stadium_id)
        REFERENCES stadiums(id)
        ON DELETE CASCADE
);

-- bảng thiết bị
CREATE TABLE equipments (
    id INT AUTO_INCREMENT PRIMARY KEY,

    code VARCHAR(20) NOT NULL UNIQUE,

    hall_id INT NULL,

    name VARCHAR(150) NOT NULL,

    quantity INT NOT NULL DEFAULT 1,

    inspected_at DATE,

    status ENUM(
        'active',
        'maintenance',
        'inactive'
    ) DEFAULT 'active',

    description TEXT,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (hall_id)
        REFERENCES halls(id)
        ON DELETE SET NULL
);

-- bảng lịch sử hoạt động
CREATE TABLE schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    hall_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    CHECK (end_time > start_time),
    status ENUM(
        'SCHEDULED',
        'ONGOING',
        'COMPLETED',
        'CANCELLED'
    ) DEFAULT 'SCHEDULED',
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (hall_id)
        REFERENCES halls(id)
        ON DELETE CASCADE
);

-- bảng đặt chỗ / đăng ký thuê
CREATE TABLE bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    hall_id INT NOT NULL,
	title VARCHAR(200) NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    CHECK (end_time > start_time),

    status ENUM(
        'PENDING',
        'APPROVED',
        'REJECTED',
        'CANCELLED'
    ) DEFAULT 'PENDING',

    note TEXT,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
        REFERENCES users(id),

    FOREIGN KEY (hall_id)
        REFERENCES halls(id)
);

-- bảng hành vi người dùng
CREATE TABLE user_behaviors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    action VARCHAR(100) NOT NULL,
    target VARCHAR(150),
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- bảng kết quả dự báo random forest
CREATE TABLE predictions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    hall_id INT NOT NULL,
    prediction_date DATE NOT NULL,
    predicted_usage DECIMAL(5,2),
    risk_level ENUM(
        'LOW',
        'MEDIUM',
        'HIGH'
    ),
    recommended_time VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (hall_id)
        REFERENCES halls(id)
        ON DELETE CASCADE
);

-- bảng nhật ký hoạt động
CREATE TABLE activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    action VARCHAR(100) NOT NULL,
    target VARCHAR(150),
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

INSERT INTO roles (id, name, description)
VALUES
(1, 'ADMIN', 'Quản trị hệ thống'),
(2, 'MANAGER', 'Ban quản lý nhà thi đấu'),
(3, 'STAFF', 'Nhân viên vận hành'),
(4, 'ORGANIZATION', 'Đơn vị sử dụng');


INSERT INTO permissions (name, description)
VALUES
('USER_VIEW', 'Xem danh sách người dùng'),
('USER_CREATE', 'Tạo người dùng'),
('USER_UPDATE', 'Cập nhật người dùng'),
('USER_DELETE', 'Xóa người dùng'),

('USER_ROLE_ASSIGN', 'Cấp hoặc thay đổi vai trò cho người dùng'),
('ROLE_PERMISSION_ASSIGN', 'Cấp hoặc thay đổi quyền cho vai trò'),

('STADIUM_VIEW', 'Xem nhà thi đấu'),
('STADIUM_CREATE', 'Thêm nhà thi đấu'),
('STADIUM_UPDATE', 'Cập nhật nhà thi đấu'),
('STADIUM_DELETE', 'Xóa nhà thi đấu'),

('HALL_VIEW', 'Xem khu vực / sân / phòng chức năng'),
('HALL_CREATE', 'Thêm khu vực / sân / phòng chức năng'),
('HALL_UPDATE', 'Cập nhật khu vực / sân / phòng chức năng'),
('HALL_DELETE', 'Xóa khu vực / sân / phòng chức năng'),

('EQUIPMENT_VIEW', 'Xem thiết bị'),
('EQUIPMENT_CREATE', 'Thêm thiết bị'),
('EQUIPMENT_UPDATE', 'Cập nhật thiết bị'),
('EQUIPMENT_DELETE', 'Xóa thiết bị'),

('SCHEDULE_VIEW', 'Xem lịch hoạt động'),
('SCHEDULE_CREATE', 'Tạo lịch hoạt động'),
('SCHEDULE_UPDATE', 'Cập nhật lịch hoạt động'),
('SCHEDULE_DELETE', 'Xóa lịch hoạt động'),

('BOOKING_VIEW', 'Xem yêu cầu đặt khu vực'),
('BOOKING_CREATE', 'Tạo yêu cầu đặt khu vực'),
('BOOKING_APPROVE', 'Duyệt yêu cầu đặt khu vực'),
('BOOKING_REJECT', 'Từ chối yêu cầu đặt khu vực'),
('BOOKING_CANCEL', 'Hủy yêu cầu đặt khu vực'),

('PREDICTION_VIEW', 'Xem kết quả dự báo'),
('PREDICTION_RUN', 'Thực hiện dự báo Random Forest'),

('AI_USE', 'Sử dụng trợ lý AI'),

('REPORT_VIEW', 'Xem thống kê và báo cáo'),

('LOG_VIEW', 'Xem nhật ký hoạt động');


INSERT INTO role_permissions (role_id, permission_id)
SELECT 1, id
FROM permissions;

INSERT INTO role_permissions (role_id, permission_id)
SELECT 2, id
FROM permissions
WHERE name IN (
    'STADIUM_VIEW',
    'STADIUM_CREATE',
    'STADIUM_UPDATE',

    'HALL_VIEW',
    'HALL_CREATE',
    'HALL_UPDATE',

    'EQUIPMENT_VIEW',
    'EQUIPMENT_CREATE',
    'EQUIPMENT_UPDATE',

    'SCHEDULE_VIEW',
    'SCHEDULE_CREATE',
    'SCHEDULE_UPDATE',

    'BOOKING_VIEW',
    'BOOKING_APPROVE',
    'BOOKING_REJECT',
    'BOOKING_CANCEL',

    'PREDICTION_VIEW',
    'AI_USE',
    'REPORT_VIEW'
);
INSERT INTO role_permissions (role_id, permission_id)
SELECT 3, id
FROM permissions
WHERE name IN (
    'STADIUM_VIEW',

    'HALL_VIEW',
    'HALL_UPDATE',

    'EQUIPMENT_VIEW',
    'EQUIPMENT_UPDATE',

    'SCHEDULE_VIEW',

    'BOOKING_VIEW',

    'AI_USE'
);
INSERT INTO role_permissions (role_id, permission_id)
SELECT 4, id
FROM permissions
WHERE name IN (
    'STADIUM_VIEW',
    'HALL_VIEW',
    'SCHEDULE_VIEW',

    'BOOKING_VIEW',
    'BOOKING_CREATE',
    'BOOKING_CANCEL',

    'PREDICTION_VIEW',
    'AI_USE'
);
SELECT
    r.name AS role_name,
    p.name AS permission_name,
    p.description
FROM roles r
JOIN role_permissions rp
    ON r.id = rp.role_id
JOIN permissions p
    ON rp.permission_id = p.id
ORDER BY r.id, p.id;
SELECT * FROM users;
SELECT
    r.name AS role_name,
    p.name AS permission_name
FROM roles r
JOIN role_permissions rp
    ON r.id = rp.role_id
JOIN permissions p
    ON rp.permission_id = p.id
ORDER BY r.id, p.id;
SELECT * FROM stadiums;
