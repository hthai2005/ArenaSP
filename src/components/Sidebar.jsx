import {
  Bot,
  Building2,
  CalendarDays,
  CircuitBoard,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  PlusCircle,
  ShieldAlert,
  Users,
  Warehouse,
} from 'lucide-react'

import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ITEMS = [
  {
    to: '/',
    label: 'Tổng quan',
    icon: LayoutDashboard,
    roles: [
      'admin',
      'manager',
      'staff',
    ],
  },

  {
    to: '/admin/users',
    label: 'Quản trị người dùng',
    icon: Users,
    roles: ['admin'],
  },

  {
    to: '/portal',
    label: 'Cổng đơn vị',
    icon: Building2,
    roles: ['user'],
  },

  {
    to: '/stadiums',
    label: 'Nhà thi đấu',
    icon: Warehouse,
    roles: [
      'admin',
      'manager',
      'staff',
    ],
  },

  {
    to: '/halls',
    label: 'Hội trường & sân',
    icon: Building2,
    roles: [
      'admin',
      'manager',
      'staff',
      'user',
    ],
  },

  {
    to: '/equipment',
    label: 'Thiết bị',
    icon: CircuitBoard,
    roles: [
      'admin',
      'manager',
      'staff',
    ],
  },

  {
    to: '/status',
    label: 'Cập nhật tình trạng',
    icon: ShieldAlert,
    roles: [
      'admin',
      'manager',
      'staff',
    ],
  },

  {
    to: '/schedule',
    label: 'Tra cứu lịch',
    icon: CalendarDays,
    roles: [
      'admin',
      'manager',
      'staff',
      'user',
    ],
  },

  {
    to: '/my-bookings',
    label: 'Đơn đăng ký',
    icon: ClipboardList,
    roles: [
      'admin',
      'manager',
      'staff',
      'user',
    ],
  },

  {
    to: '/booking/simple',
    label: 'Đăng ký hội trường',
    icon: PlusCircle,
    roles: ['user'],
  },

  {
    to: '/booking/new',
    label: 'Đăng ký nâng cao',
    icon: PlusCircle,
    roles: ['user'],
  },

  {
    to: '/ai-assistant',
    label: 'Trợ lý AI',
    icon: Bot,
    roles: [
      'admin',
      'manager',
      'staff',
      'user',
    ],
  },
]

const ROLE_LABELS = {
  admin: 'Quản trị viên',
  manager: 'Ban quản lý',
  staff: 'Nhân viên vận hành',
  user: 'Đơn vị sử dụng',
}

export default function Sidebar() {
  const {
    user,
    logout,
  } = useAuth()

  const items =
    ITEMS.filter(
      (item) =>
        item.roles.includes(
          user.role,
        ),
    )

  return (
    <aside className="sidebar">

      <div className="brand">

        <div className="brand-mark">
          A
        </div>

        <div>
          <strong>ArenaSP</strong>
          <span>Nhà thi đấu tỉnh</span>
        </div>

      </div>

      <nav>

        {items.map(
          (item) => {

            const Icon =
              item.icon

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={
                  item.to === '/'
                }
                className="nav-item"
              >
                <Icon size={18} />

                <span>
                  {item.label}
                </span>
              </NavLink>
            )
          },
        )}

      </nav>

      <div className="sidebar-user">

        <div className="avatar">
          {user.name
            ?.slice(0, 1)
            .toUpperCase()}
        </div>

        <div>

          <strong>
            {user.name}
          </strong>

          <span>
            {ROLE_LABELS[user.role] ||
              user.title ||
              'Người dùng'}
          </span>

        </div>

        <button
          type="button"
          className="icon-btn"
          onClick={logout}
          title="Đăng xuất"
        >
          <LogOut size={16} />
        </button>

      </div>

    </aside>
  )
}