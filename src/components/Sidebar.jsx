import {
  Building2,
  CalendarDays,
  CircuitBoard,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  ShieldAlert,
  Sparkles,
  Warehouse,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { ROLES } from '../data/mock'
import { useAuth } from '../context/AuthContext'

const ITEMS = [
  { to: '/', label: 'Tổng quan', icon: LayoutDashboard, roles: ['admin', 'staff'] },
  { to: '/portal', label: 'Cổng đơn vị', icon: Building2, roles: ['user'] },
  { to: '/stadiums', label: 'Nhà thi đấu', icon: Warehouse, roles: ['admin'] },
  { to: '/halls', label: 'Hội trường & sân', icon: Building2, roles: ['admin', 'staff', 'user'] },
  { to: '/equipment', label: 'Thiết bị', icon: CircuitBoard, roles: ['admin', 'staff'] },
  { to: '/status', label: 'Cập nhật tình trạng', icon: ShieldAlert, roles: ['staff'] },
  { to: '/coming/schedule', label: 'Lịch & đặt chỗ', icon: CalendarDays, later: true, roles: ['admin', 'staff', 'user'] },
  { to: '/coming/rf', label: 'Dự báo RF', icon: Sparkles, later: true, roles: ['admin'] },
  { to: '/coming/ai', label: 'Trợ lý AI', icon: MessageSquare, later: true, roles: ['admin', 'staff', 'user'] },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const items = ITEMS.filter((item) => item.roles.includes(user.role))

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">A</div>
        <div>
          <strong>ArenaSP</strong>
          <span>Nhà thi đấu tỉnh</span>
        </div>
      </div>

      <nav>
        {items.map((item) => {
          const Icon = item.icon
          if (item.later) {
            return (
              <div key={item.to} className="nav-item later" title="Sẽ mở ở tuần sau">
                <Icon size={18} />
                <span>{item.label}</span>
                <em>Tuần sau</em>
              </div>
            )
          }
          return (
            <NavLink key={item.to} to={item.to} end={item.to === '/'} className="nav-item">
              <Icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          )
        })}
      </nav>

      <div className="sidebar-user">
        <div className="avatar">{user.name.slice(0, 1)}</div>
        <div>
          <strong>{user.name}</strong>
          <span>{ROLES[user.role]}</span>
        </div>
        <button type="button" className="icon-btn" onClick={logout} title="Đăng xuất">
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  )
}
