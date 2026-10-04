import { useEffect, useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import Modal from '../components/Modal'
import StatusBadge from '../components/StatusBadge'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { usePageMeta } from '../layouts/AppLayout'

const empty = { name: '', stadiumId: '', type: 'Hội trường', capacity: '', equipment: '', status: 'active' }

export default function Halls() {
  const setMeta = usePageMeta()
  const { user } = useAuth()
  const { stadiums, halls, addHall, updateHall, removeHall } = useData()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('all')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(empty)
  const [error, setError] = useState('')

  useEffect(() => {
    setMeta({ title: 'Quản lý danh mục hội trường & sân thi đấu', crumbs: 'Trang chủ · Hội trường' })
  }, [setMeta])

  const filtered = useMemo(() => {
    return halls.filter((h) => {
      const matchQ = h.name.toLowerCase().includes(q.toLowerCase())
      const matchS = status === 'all' || h.status === status
      return matchQ && matchS
    })
  }, [halls, q, status])

  const canEdit = user.role === 'admin'
  const stadiumName = (id) => stadiums.find((s) => s.id === Number(id))?.name || '—'

  const openCreate = () => {
    setEditing(null)
    setForm({ ...empty, stadiumId: stadiums[0]?.id || '' })
    setError('')
    setOpen(true)
  }

  const save = (e) => {
    e.preventDefault()
    if (!form.name.trim()) return setError('Tên hội trường không được trống.')
    if (!form.stadiumId) return setError('Vui lòng chọn nhà thi đấu.')
    if (Number(form.capacity) <= 0) return setError('Sức chứa phải lớn hơn 0.')
    const payload = { ...form, stadiumId: Number(form.stadiumId), capacity: Number(form.capacity) }
    if (editing) updateHall(editing.id, payload)
    else addHall(payload)
    setOpen(false)
  }

  if (user.role === 'user') {
    return (
      <div className="card-grid">
        {filtered.map((h) => (
          <article className="hall-card" key={h.id}>
            <img src={h.image} alt={h.name} />
            <div>
              <StatusBadge status={h.status} />
              <h3>{h.name}</h3>
              <p>{h.capacity.toLocaleString('vi-VN')} chỗ · {h.type}</p>
              <div className="row-gap">
                <button className="btn ghost" type="button">Xem chi tiết</button>
                <button className="btn" type="button" disabled title="Sắp ra mắt – tuần 4">Gửi yêu cầu đặt chỗ</button>
              </div>
            </div>
          </article>
        ))}
      </div>
    )
  }

  return (
    <>
      <div className="stats compact">
        <article className="stat"><span>Tổng hội trường</span><strong>{halls.length}</strong></article>
        <article className="stat"><span>Đang hoạt động</span><strong>{halls.filter((h) => h.status === 'active').length}</strong></article>
        <article className="stat"><span>Bảo trì</span><strong>{halls.filter((h) => h.status === 'maintenance').length}</strong></article>
        <article className="stat"><span>Sức chứa</span><strong>{halls.reduce((a, h) => a + h.capacity, 0).toLocaleString('vi-VN')}</strong></article>
      </div>

      <div className="toolbar">
        <input placeholder="Tìm hội trường..." value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">Tất cả trạng thái</option>
          <option value="active">Hoạt động</option>
          <option value="maintenance">Bảo trì</option>
          <option value="inactive">Ngưng</option>
        </select>
        {canEdit ? (
          <button className="btn primary" type="button" onClick={openCreate}>
            <Plus size={16} /> Thêm hội trường
          </button>
        ) : null}
      </div>

      {filtered.length === 0 ? (
        <section className="empty">
          <div className="empty-art" />
          <h3>Chưa có hội trường nào được tạo</h3>
          <p>Nhà thi đấu này chưa có phân khu sân hoặc hội trường.</p>
          {canEdit ? <button className="btn primary" type="button" onClick={openCreate}>+ Thêm hội trường</button> : null}
        </section>
      ) : (
        <section className="card">
          <table>
            <thead>
              <tr>
                <th>Mã</th>
                <th>Tên hội trường / sân</th>
                <th>Nhà thi đấu</th>
                <th>Loại hình</th>
                <th>Sức chứa</th>
                <th>Thiết bị</th>
                <th>Trạng thái</th>
                {canEdit ? <th /> : null}
              </tr>
            </thead>
            <tbody>
              {filtered.map((h) => (
                <tr key={h.id}>
                  <td>{h.code}</td>
                  <td>{h.name}</td>
                  <td>{stadiumName(h.stadiumId)}</td>
                  <td>{h.type}</td>
                  <td>{h.capacity.toLocaleString('vi-VN')}</td>
                  <td>{h.equipment}</td>
                  <td><StatusBadge status={h.status} /></td>
                  {canEdit ? (
                    <td className="actions">
                      <button type="button" onClick={() => { setEditing(h); setForm(h); setOpen(true) }}>Sửa</button>
                      <button type="button" className="danger-text" onClick={() => removeHall(h.id)}>Xóa</button>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Sửa hội trường' : 'Thêm hội trường mới'}>
        <form className="form" onSubmit={save}>
          {error ? <div className="alert danger">{error}</div> : null}
          <label>
            Nhà thi đấu *
            <select value={form.stadiumId} onChange={(e) => setForm((f) => ({ ...f, stadiumId: e.target.value }))}>
              <option value="">-- Chọn nhà thi đấu --</option>
              {stadiums.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
          <label>
            Tên hội trường *
            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </label>
          <div className="grid-2">
            <label>
              Loại hình
              <input value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} />
            </label>
            <label>
              Sức chứa *
              <input type="number" value={form.capacity} onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))} />
            </label>
          </div>
          <label>
            Thiết bị chuyên dụng
            <input value={form.equipment} onChange={(e) => setForm((f) => ({ ...f, equipment: e.target.value }))} />
          </label>
          <label>
            Trạng thái
            <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
              <option value="active">Hoạt động</option>
              <option value="maintenance">Bảo trì</option>
              <option value="inactive">Ngưng sử dụng</option>
            </select>
          </label>
          <div className="form-actions">
            <button type="button" className="btn ghost" onClick={() => setOpen(false)}>Hủy bỏ</button>
            <button className="btn primary" type="submit">Lưu dữ liệu</button>
          </div>
        </form>
      </Modal>
    </>
  )
}
