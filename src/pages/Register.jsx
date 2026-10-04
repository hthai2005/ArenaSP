import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const { user, register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    confirm: '',
  })
  const [error, setError] = useState('')

  if (user) return <Navigate to="/portal" replace />

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const onSubmit = (e) => {
    e.preventDefault()
    if (form.password.length < 6) return setError('Mật khẩu tối thiểu 6 ký tự.')
    if (form.password !== form.confirm) return setError('Xác nhận mật khẩu không khớp.')
    const res = register(form)
    if (!res.ok) return setError(res.message)
    navigate('/portal')
  }

  return (
    <div className="auth-split">
      <section className="auth-hero">
        <div className="auth-logo">ArenaSP</div>
        <p className="eyebrow">Dành cho đơn vị thuê sân</p>
        <h2>Tạo tài khoản đơn vị sử dụng</h2>
        <p>Đăng ký để xem hội trường, sức chứa và trạng thái hoạt động.</p>
      </section>
      <section className="auth-form">
        <div className="tabs">
          <Link to="/login">Đăng nhập</Link>
          <span className="active">Đăng ký tài khoản mới</span>
        </div>
        <h1>Đăng ký tài khoản</h1>
        {error ? <div className="alert danger">{error}</div> : null}
        <form onSubmit={onSubmit}>
          <label>
            Họ và tên / Tên đơn vị *
            <input value={form.name} onChange={set('name')} required />
          </label>
          <div className="grid-2">
            <label>
              Số điện thoại *
              <input value={form.phone} onChange={set('phone')} required />
            </label>
            <label>
              Email liên hệ *
              <input type="email" value={form.email} onChange={set('email')} required />
            </label>
          </div>
          <div className="grid-2">
            <label>
              Mật khẩu *
              <input type="password" value={form.password} onChange={set('password')} required />
            </label>
            <label>
              Xác nhận mật khẩu *
              <input type="password" value={form.confirm} onChange={set('confirm')} required />
            </label>
          </div>
          <button className="btn primary block" type="submit">Đăng ký tài khoản →</button>
        </form>
      </section>
    </div>
  )
}
