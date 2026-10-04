import { useEffect, useState } from 'react'
import StatusBadge from '../components/StatusBadge'
import { useData } from '../context/DataContext'
import { usePageMeta } from '../layouts/AppLayout'

export default function Portal() {
  const setMeta = usePageMeta()
  const { halls } = useData()
  const [q, setQ] = useState('')

  useEffect(() => {
    setMeta({ title: 'Cổng thông tin đơn vị thuê', crumbs: 'Cổng đơn vị · Hội trường & sân' })
  }, [setMeta])

  const list = halls.filter((h) => h.name.toLowerCase().includes(q.toLowerCase()))

  return (
    <>
      <section className="hero-portal">
        <div>
          <p className="eyebrow">Hệ thống thể thao tỉnh</p>
          <h2>Tra cứu & tham quan cơ sở vật chất nhà thi đấu tỉnh</h2>
          <p>Xem hội trường, sức chứa và trạng thái. Đặt chỗ sẽ mở ở tuần 4.</p>
        </div>
        <div className="hero-stats">
          <div><strong>{halls.length}</strong><span>hội trường / sân</span></div>
          <div><strong>{halls.reduce((a, h) => a + h.capacity, 0).toLocaleString('vi-VN')}</strong><span>sức chứa</span></div>
          <div><strong>24/7</strong><span>tra cứu online</span></div>
        </div>
      </section>

      <div className="toolbar">
        <input placeholder="Tìm hội trường..." value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="card-grid">
        {list.map((h) => (
          <article className="hall-card" key={h.id}>
            <img src={h.image} alt="" />
            <div>
              <StatusBadge status={h.status} />
              <h3>{h.name}</h3>
              <p>{h.capacity.toLocaleString('vi-VN')} chỗ · {h.type}</p>
              <p className="muted">{h.equipment}</p>
              <div className="row-gap">
                <button className="btn ghost" type="button">Xem chi tiết</button>
                <button className="btn" type="button" disabled title="Sắp ra mắt – tuần 4">Gửi yêu cầu đặt chỗ</button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </>
  )
}
