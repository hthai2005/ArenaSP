import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Forbidden() {
  const { user } = useAuth()
  const home = user?.role === 'user' ? '/portal' : '/'
  return (
    <div className="empty">
      <h2>403 — Bạn không có quyền truy cập</h2>
      <p>Chức năng này dành cho vai trò khác. Quay về trang phù hợp với tài khoản của bạn.</p>
      <Link className="btn primary" to={home}>Về trang chính</Link>
    </div>
  )
}
