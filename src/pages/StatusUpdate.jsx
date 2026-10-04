import { useEffect, useState } from 'react'
import StatusBadge from '../components/StatusBadge'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { usePageMeta } from '../layouts/AppLayout'

export default function StatusUpdate() {
  const setMeta = usePageMeta()
  const { user } = useAuth()
  const { halls, equipment, updateHall, updateEquipment, logs, addLog } = useData()
  const [kind, setKind] = useState('hall')
  const [targetId, setTargetId] = useState(halls[0]?.id || '')
  const [status, setStatus] = useState('active')
  const [note, setNote] = useState('')
  const [ok, setOk] = useState('')

  useEffect(() => {
    setMeta({ title: 'Ghi nhận & cập nhật tình trạng sân bãi – thiết bị trong ngày', crumbs: 'Trang chủ · Vận hành sân bãi' })
  }, [setMeta])

  const options = kind === 'hall' ? halls : equipment

  const submit = (e) => {
    e.preventDefault()
    if (!targetId) return
    if (kind === 'hall') updateHall(Number(targetId), { status })
    else updateEquipment(Number(targetId), { status })
    const target = options.find((o) => o.id === Number(targetId))
    addLog({
      target: target?.name,
      status,
      note,
      at: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      by: user.name,
    })
    setNote('')
    setOk('Đã cập nhật trạng thái.')
  }

  return (
    <div className="split-page">
      <form className="card form" onSubmit={submit}>
        {ok ? <div className="alert success">{ok}</div> : null}
        <h3>1. Chọn đối tượng cần cập nhật</h3>
        <div className="choice">
          <button type="button" className={kind === 'hall' ? 'on' : ''} onClick={() => setKind('hall')}>Hội trường & sân thi đấu</button>
          <button type="button" className={kind === 'eq' ? 'on' : ''} onClick={() => setKind('eq')}>Trang thiết bị chuyên dụng</button>
        </div>
        <h3>2. Danh mục chọn cụ thể</h3>
        <select value={targetId} onChange={(e) => setTargetId(e.target.value)}>
          {options.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
        <h3>3. Chuyển đổi trạng thái mới</h3>
        <div className="status-picks">
          {[
            ['active', 'Hoạt động'],
            ['maintenance', 'Bảo trì / Sửa chữa'],
            ['inactive', 'Ngưng sử dụng'],
          ].map(([value, label]) => (
            <button key={value} type="button" className={`pick ${value} ${status === value ? 'on' : ''}`} onClick={() => setStatus(value)}>
              {label}
            </button>
          ))}
        </div>
        <h3>4. Ghi chú hiện trường</h3>
        <textarea rows={4} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ví dụ: thay thế bóng đèn góc A..." />
        <div className="form-actions">
          <button className="btn primary" type="submit">Xác nhận & cập nhật trạng thái</button>
        </div>
      </form>

      <aside className="card">
        <h3>Nhật ký cập nhật gần nhất</h3>
        <ul className="timeline">
          {logs.map((log) => (
            <li key={log.id}>
              <div>
                <strong>{log.target}</strong>
                <StatusBadge status={log.status} />
              </div>
              <p>{log.note}</p>
              <small>{log.at} · {log.by}</small>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  )
}
