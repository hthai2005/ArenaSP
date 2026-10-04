import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import Modal from '../components/Modal'
import StatusBadge from '../components/StatusBadge'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { usePageMeta } from '../layouts/AppLayout'

const empty = { name: '', hallId: '', quantity: 1, status: 'active', inspectedAt: '' }

export default function Equipment() {
  const setMeta = usePageMeta()
  const { user } = useAuth()
  const { halls, equipment, addEquipment, updateEquipment, removeEquipment } = useData()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(empty)

  useEffect(() => {
    setMeta({ title: 'Danh mục trang thiết bị & hệ thống kỹ thuật', crumbs: 'Trang chủ · Thiết bị' })
  }, [setMeta])

  const hallName = (id) => halls.find((h) => h.id === Number(id))?.name || 'Khu kỹ thuật chung'
  const canEdit = user.role === 'admin'

  const save = (e) => {
    e.preventDefault()
    const payload = { ...form, hallId: form.hallId ? Number(form.hallId) : null, quantity: Number(form.quantity) }
    if (editing) updateEquipment(editing.id, payload)
    else addEquipment(payload)
    setOpen(false)
  }

  return (
    <>
      <div className="stats compact">
        <article className="stat"><span>Tổng thiết bị</span><strong>{equipment.length}</strong></article>
        <article className="stat"><span>Đang hoạt động</span><strong>{equipment.filter((e) => e.status === 'active').length}</strong></article>
        <article className="stat"><span>Bảo dưỡng</span><strong>{equipment.filter((e) => e.status === 'maintenance').length}</strong></article>
        <article className="stat"><span>Hỏng / ngưng</span><strong>{equipment.filter((e) => e.status === 'inactive').length}</strong></article>
      </div>

      <div className="toolbar">
        <p className="muted">Theo dõi số lượng, vị trí lắp đặt và trạng thái vận hành.</p>
        {canEdit ? (
          <button className="btn primary" type="button" onClick={() => { setEditing(null); setForm(empty); setOpen(true) }}>
            <Plus size={16} /> Thêm thiết bị
          </button>
        ) : null}
      </div>

      <section className="card">
        <table>
          <thead>
            <tr>
              <th>Mã</th>
              <th>Tên thiết bị kỹ thuật</th>
              <th>Hội trường lắp đặt</th>
              <th>Số lượng</th>
              <th>Ngày kiểm định</th>
              <th>Trạng thái</th>
              {canEdit ? <th /> : null}
            </tr>
          </thead>
          <tbody>
            {equipment.map((item) => (
              <tr key={item.id}>
                <td>{item.code}</td>
                <td>{item.name}</td>
                <td>{hallName(item.hallId)}</td>
                <td>{item.quantity}</td>
                <td>{item.inspectedAt || '—'}</td>
                <td><StatusBadge status={item.status} /></td>
                {canEdit ? (
                  <td className="actions">
                    <button type="button" onClick={() => { setEditing(item); setForm({ ...item, hallId: item.hallId || '' }); setOpen(true) }}>Sửa</button>
                    <button type="button" className="danger-text" onClick={() => removeEquipment(item.id)}>Xóa</button>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Sửa thiết bị' : 'Thêm thiết bị mới'}>
        <form className="form" onSubmit={save}>
          <label>
            Tên thiết bị *
            <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </label>
          <label>
            Hội trường / khu vực
            <select value={form.hallId} onChange={(e) => setForm((f) => ({ ...f, hallId: e.target.value }))}>
              <option value="">Khu kỹ thuật chung</option>
              {halls.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
          </label>
          <div className="grid-2">
            <label>
              Số lượng
              <input type="number" min="1" value={form.quantity} onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))} />
            </label>
            <label>
              Ngày kiểm định
              <input type="date" value={form.inspectedAt} onChange={(e) => setForm((f) => ({ ...f, inspectedAt: e.target.value }))} />
            </label>
          </div>
          <label>
            Trạng thái
            <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
              <option value="active">Hoạt động</option>
              <option value="maintenance">Bảo trì</option>
              <option value="inactive">Ngưng / hỏng</option>
            </select>
          </label>
          <div className="form-actions">
            <button type="button" className="btn ghost" onClick={() => setOpen(false)}>Hủy</button>
            <button className="btn primary" type="submit">Lưu</button>
          </div>
        </form>
      </Modal>
    </>
  )
}
