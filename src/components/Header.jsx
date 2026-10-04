import { Bell, Clock3 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Header({ title, crumbs }) {
  const { user } = useAuth()
  const now = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })

  return (
    <header className="topbar">
      <div>
        <div className="crumbs">{crumbs}</div>
        <h1>{title}</h1>
      </div>
      <div className="topbar-right">
        <span className="chip">
          <Clock3 size={14} /> Ca trực: 07:00 – 16:30 · {now}
        </span>
        <button className="icon-btn ghost" type="button" aria-label="Thông báo">
          <Bell size={18} />
        </button>
        <div className="who">
          <div className="avatar sm">{user.name.slice(0, 1)}</div>
          <div>
            <strong>{user.name}</strong>
            <span>{user.title}</span>
          </div>
        </div>
      </div>
    </header>
  )
}
