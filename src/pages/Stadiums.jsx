import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import Modal from '../components/Modal'
import StatusBadge from '../components/StatusBadge'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { usePageMeta } from '../layouts/AppLayout'

const empty = {
  name: '',
  officialName: '',
  address: '',
  area: '',
  capacity: '',
  description: '',
  status: 'active',
}

export default function Stadiums() {
  const setMeta = usePageMeta()
  const { user } = useAuth()
  const { stadiums, halls, addStadium, updateStadium, removeStadium } = useData()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(empty)
  const [error, setError] = useState('')

  useEffect(() => {
    setMeta({ title: 'Danh mục nhà thi đấu tỉnh', crumbs: 'Trang chủ · Nhà thi đấu' })
  }, [setMeta])

  const openCreate = () => {
    setEditing(null)
    setForm(empty)
    setError('')
    setOpen(true)
  }

  const openEdit = (item) => {
    setEditing(item)
    setForm(item)
    setError('')
    setOpen(true)
  }

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const save = (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.address.trim()) {
      setError('Vui lòng nhập tên và địa chỉ nhà thi đấu.')
      return
    }
    const payload = {
      ...form,
      area: Number(form.area || 0),
      capacity: Number(form.capacity || 0),
    }
    if (editing) updateStadium(editing.id, payload)
    else addStadium(payload)
    setOpen(false)
  }

  return (
    <>
      <div className="toolbar">
        <p className="muted">Đăng ký hồ sơ cơ sở thể thao vào hệ thống tỉnh.</p>
        {user.role === 'admin' ? (
          <button className="btn primary" type="button" onClick={openCreate}>
            <Plus size={16} /> Thêm nhà thi đấu
          </button>
        ) : null}
      </div>

      <section className="card">
        <table>
          <thead>
            <tr>
              <th>Tên</th>
              <th>Địa chỉ</th>
              <th>Số hội trường</th>
              <th>Sức chứa kê</th>
              <th>Trạng thái</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {stadiums.map((s) => (
              <tr key={s.id}>
                <td>
                  <strong>{s.name}</strong>
                  <div className="muted">{s.officialName}</div>
                </td>
                <td>{s.address}</td>
                <td>{halls.filter((h) => h.stadiumId === s.id).length}</td>
                <td>{Number(s.capacity).toLocaleString('vi-VN')}</td>
                <td><StatusBadge status={s.status} /></td>
                <td className="actions">
                  <button type="button" onClick={() => openEdit(s)}>Sửa</button>
                  {user.role === 'admin' ? (
                    <button type="button" className="danger-text" onClick={() => removeStadium(s.id)}>Xóa</button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Cập nhật nhà thi đấu' : 'Thêm mới nhà thi đấu tỉnh'}
        subtitle="Đăng ký hồ sơ cơ sở thể thao vào hệ thống tỉnh."
        wide
      >
        <form className="form" onSubmit={save}>
          {error ? <div className="alert danger">{error}</div> : null}
          <div className="grid-2">
            <label>
              Tên nhà thi đấu *
              <input value={form.name} onChange={set('name')} />
            </label>
            <label>
              Tên đăng ký chính thức
              <input value={form.officialName} onChange={set('officialName')} />
            </label>
          </div>
          <label>
            Địa chỉ chính thức *
            <input value={form.address} onChange={set('address')} />
          </label>
          <div className="grid-2">
            <label>
              Tổng diện tích sân (m²)
              <input type="number" value={form.area} onChange={set('area')} />
            </label>
            <label>
              Sức chứa kê (chỗ ngồi)
              <input type="number" value={form.capacity} onChange={set('capacity')} />
            </label>
          </div>
          <label>
            Mô tả tổng quan cơ sở vật chất
            <textarea rows={3} value={form.description} onChange={set('description')} />
          </label>
          <fieldset className="status-options">
            <legend>Trạng thái hoạt động *</legend>
            <div className="status-options-row">
              <label className="check">
                <input type="radio" name="st" checked={form.status === 'active'} onChange={() => setForm((f) => ({ ...f, status: 'active' }))} />
                <span>Đang hoạt động</span>
              </label>
              <label className="check">
                <input type="radio" name="st" checked={form.status === 'maintenance'} onChange={() => setForm((f) => ({ ...f, status: 'maintenance' }))} />
                <span>Đang bảo trì hệ thống</span>
              </label>
            </div>
          </fieldset>
          {/* Tuần sau: có thể gắn map theo địa chỉ (geocode), tuần 3 chưa dùng. */}
          <div className="form-actions">
            <button type="button" className="btn ghost" onClick={() => setOpen(false)}>Hủy bỏ</button>
            <button type="submit" className="btn primary">Lưu dữ liệu</button>
          </div>
        </form>
      </Modal>
    </>
  )
}
