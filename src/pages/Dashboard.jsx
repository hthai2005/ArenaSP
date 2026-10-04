import { useEffect } from 'react'
import { Building2, CircuitBoard, Users, Warehouse } from 'lucide-react'
import { useData } from '../context/DataContext'
import { usePageMeta } from '../layouts/AppLayout'
import StatusBadge from '../components/StatusBadge'

export default function Dashboard() {
  const setMeta = usePageMeta()
  const { stadiums, halls, equipment } = useData()

  useEffect(() => {
    setMeta({ title: 'Tổng quan vận hành cơ sở thể thao tỉnh', crumbs: 'Trang chủ · Vận hành' })
  }, [setMeta])

  const activeHalls = halls.filter((h) => h.status === 'active').length
  const maintEq = equipment.filter((e) => e.status !== 'active').length
  const capacity = halls.reduce((sum, h) => sum + Number(h.capacity || 0), 0)
  const attentionEq = equipment.filter((e) => e.status !== 'active')
  const hallName = (hallId) => halls.find((h) => h.id === Number(hallId))?.name || 'Khu kỹ thuật chung'

  return (
    <>
      <div className="stats">
        <article className="stat">
          <Warehouse />
          <div>
            <span>Số nhà thi đấu</span>
            <strong>{String(stadiums.length).padStart(2, '0')}</strong>
          </div>
        </article>
        <article className="stat">
          <Building2 />
          <div>
            <span>Hội trường / sân</span>
            <strong>{String(halls.length).padStart(2, '0')}</strong>
            <small>{activeHalls} đang hoạt động</small>
          </div>
        </article>
        <article className="stat">
          <CircuitBoard />
          <div>
            <span>Thiết bị cần chú ý</span>
            <strong>{String(maintEq).padStart(2, '0')}</strong>
          </div>
        </article>
        <article className="stat">
          <Users />
          <div>
            <span>Tổng sức chứa</span>
            <strong>{capacity.toLocaleString('vi-VN')}</strong>
          </div>
        </article>
      </div>

      <div className="grid-main">
        <section className="card">
          <h3>Phân bổ tài nguyên & sức chứa cơ sở</h3>
          <table>
            <thead>
              <tr>
                <th>Hội trường</th>
                <th>Loại</th>
                <th>Sức chứa</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {halls.map((h) => (
                <tr key={h.id}>
                  <td>{h.name}</td>
                  <td>{h.type}</td>
                  <td>{h.capacity.toLocaleString('vi-VN')}</td>
                  <td><StatusBadge status={h.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <section className="card">
          <h3>Thiết bị cần chú ý</h3>
          {attentionEq.length === 0 ? (
            <p className="muted">Không có thiết bị bảo trì hoặc ngưng sử dụng.</p>
          ) : (
            <ul className="plain-list">
              {attentionEq.map((item) => (
                <li key={item.id}>
                  <div className="item-text">
                    <strong>{hallName(item.hallId)}</strong>
                    <span>{item.name}</span>
                  </div>
                  <StatusBadge status={item.status} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  )
}
