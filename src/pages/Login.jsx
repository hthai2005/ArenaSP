import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('admin@arenasp.vn')
  const [password, setPassword] = useState('123456')
  const [error, setError] = useState('')

  if (user) {
    return <Navigate to={user.role === 'user' ? '/portal' : '/'} replace />
  }

  const onSubmit = (e) => {
    e.preventDefault()
    const res = login(email, password)
    if (!res.ok) {
      setError(res.message)
      return
    }
    navigate(res.role === 'user' ? '/portal' : '/')
  }

  return (
    <div className="auth-split">
      <section className="auth-hero">
        <div className="auth-logo">ArenaSP</div>
        <p className="eyebrow">Cổng thông tin & dịch vụ thể thao tỉnh</p>
        <h2>Khám phá & đặt lịch cơ sở thể thao tỉnh</h2>
        <p>Kết nối nhà thi đấu, hội trường và đơn vị sử dụng trên một nền tảng.</p>
        <ul>
          <li><strong>12+</strong> môn</li>
          <li><strong>07:00–22:00</strong> phục vụ</li>
          <li><strong>Online</strong> đăng nhập</li>
        </ul>
      </section>
      <section className="auth-form">
        <div className="tabs">
          <span className="active">Đăng nhập</span>
          <Link to="/register">Đăng ký tài khoản mới</Link>
        </div>
        <h1>Đăng nhập tài khoản</h1>
        <p className="muted">Chào mừng quay lại hệ thống quản lý nhà thi đấu tỉnh.</p>
        {error ? <div className="alert danger">{error}</div> : null}
        <form onSubmit={onSubmit}>
          <label>
            Số điện thoại hoặc Email *
            <input value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label>
            Mật khẩu *
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
          <div className="row-between">
            <label className="check">
              <input type="checkbox" defaultChecked />
              <span>Ghi nhớ đăng nhập</span>
            </label>
            <span className="muted">Quên mật khẩu?</span>
          </div>
          <button className="btn primary block" type="submit">Đăng nhập →</button>
        </form>
        <div className="demo-box">
          <p>Tài khoản demo tuần 3</p>
          <code>admin@arenasp.vn / 123456</code>
          <code>staff@arenasp.vn / 123456</code>
          <code>user@arenasp.vn / 123456</code>
        </div>
      </section>
    </div>
  )
}
