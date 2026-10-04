export const ROLES = {
  admin: 'Ban quản lý',
  staff: 'Nhân viên vận hành',
  user: 'Đơn vị sử dụng',
}

export const USERS = [
  {
    id: 1,
    name: 'Trần Văn Bình',
    email: 'admin@arenasp.vn',
    password: '123456',
    role: 'admin',
    title: 'Ban quản lý nhà thi đấu',
  },
  {
    id: 2,
    name: 'Nguyễn Văn Tuấn',
    email: 'staff@arenasp.vn',
    password: '123456',
    role: 'staff',
    title: 'Nhân viên vận hành',
  },
  {
    id: 3,
    name: 'CLB Thể thao Tỉnh',
    email: 'user@arenasp.vn',
    password: '123456',
    role: 'user',
    title: 'Đơn vị sử dụng',
  },
]

export const INITIAL_STADIUMS = [
  {
    id: 1,
    name: 'Nhà thi đấu thể thao thành phố',
    officialName: 'Nhà thi đấu tỉnh',
    address: '42 Đường Trường Chinh, Phường 3, TP. Tân An',
    area: 48000,
    capacity: 22000,
    description: 'Sàn gỗ, 3 lớp LED, 4 phòng thay đồ, hệ thống PCCC đạt chuẩn.',
    status: 'active',
    lat: 10.535,
    lng: 106.405,
  },
]

export const INITIAL_HALLS = [
  {
    id: 1,
    code: 'HT-01',
    name: 'Sân trung tâm đa năng A',
    stadiumId: 1,
    type: 'Sân trong nhà',
    capacity: 5200,
    equipment: 'Đèn LED 4 mặt, sàn Taraflex',
    status: 'active',
    image: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&q=80',
  },
  {
    id: 2,
    code: 'HT-02',
    name: 'Hội trường khánh tiết',
    stadiumId: 1,
    type: 'Hội trường',
    capacity: 350,
    equipment: 'Màn hình LED P2.5, micro',
    status: 'active',
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80',
  },
  {
    id: 3,
    code: 'HT-03',
    name: 'Sân cầu lông B',
    stadiumId: 1,
    type: 'Sân cầu lông',
    capacity: 800,
    equipment: 'Đèn 1000 lux, lưới BWF',
    status: 'maintenance',
    image: 'https://images.unsplash.com/photo-1613918431703-aa504eda44b1?w=800&q=80',
  },
  {
    id: 4,
    code: 'HT-04',
    name: 'Bể bơi Olympic 50m',
    stadiumId: 1,
    type: 'Bể bơi',
    capacity: 2100,
    equipment: 'Lọc nước, camera góc rộng',
    status: 'active',
    image: 'https://images.unsplash.com/photo-1519315901367-f34ff9154487?w=800&q=80',
  },
  {
    id: 5,
    code: 'HT-05',
    name: 'Sân tập thể lực',
    stadiumId: 1,
    type: 'Sân tập',
    capacity: 200,
    equipment: 'Giàn tạ, thảm',
    status: 'active',
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80',
  },
  {
    id: 6,
    code: 'HT-06',
    name: 'Nhà thi đấu đa năng D',
    stadiumId: 1,
    type: 'Sân đa năng',
    capacity: 1200,
    equipment: 'Bảng điểm, loa',
    status: 'inactive',
    image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80',
  },
]

export const INITIAL_EQUIPMENT = [
  { id: 1, code: 'TB-01', name: 'Dàn đèn LED Philips ArenaVision', hallId: 1, quantity: 48, status: 'active', inspectedAt: '2026-01-15' },
  { id: 2, code: 'TB-02', name: 'Bảng điểm điện tử 4 mặt', hallId: 1, quantity: 1, status: 'active', inspectedAt: '2026-02-10' },
  { id: 3, code: 'TB-03', name: 'Thảm sàn Taraflex Sport M Plus', hallId: 3, quantity: 6, status: 'maintenance', inspectedAt: '2026-02-20' },
  { id: 4, code: 'TB-04', name: 'Máy làm lạnh Chiller Daikin', hallId: null, quantity: 1, status: 'inactive', inspectedAt: '2026-03-12' },
  { id: 5, code: 'TB-05', name: 'Hệ thống loa Line Array JBL', hallId: 2, quantity: 16, status: 'active', inspectedAt: '2026-01-10' },
  { id: 6, code: 'TB-06', name: 'Bảng chấm điện tử bể bơi', hallId: 4, quantity: 10, status: 'active', inspectedAt: '2025-12-18' },
]

export const INITIAL_LOGS = [
  { id: 1, target: 'Hội trường khánh tiết', status: 'active', note: 'Sẵn sàng cho họp chiều.', at: '14:15', by: 'Nguyễn Văn Tuấn' },
  { id: 2, target: 'Sân cầu lông B', status: 'maintenance', note: 'Đèn góc A cần thay.', at: '10:30', by: 'Nguyễn Văn Tuấn' },
  { id: 3, target: 'Sân trung tâm A', status: 'active', note: 'Lau sàn Taraflex xong.', at: '08:45', by: 'Nguyễn Văn Tuấn' },
]

export const STATUS_META = {
  active: { label: 'Hoạt động', tone: 'success' },
  maintenance: { label: 'Bảo trì / Sửa chữa', tone: 'warning' },
  inactive: { label: 'Ngưng sử dụng', tone: 'danger' },
}
