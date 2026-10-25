import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Phone, X } from 'lucide-react'
import { usePageMeta } from '../layouts/AppLayout'

// ── Mock data ─────────────────────────────────────────────────────────────
const HALLS = [
  { id: 'h1', name: 'Nhà thi đấu chính', capacity: '5.000 chỗ', image: 'https://images.unsplash.com/photo-1626248801379-51a0748a5f96?w=400&q=70' },
  { id: 'h2', name: 'Nhà tập đa năng', capacity: '1.200 chỗ', image: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=400&q=70' },
  { id: 'h3', name: 'Sân thi đấu phụ', capacity: '600 chỗ', image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&q=70' },
]

const SESSIONS = ['Sáng (06:00–12:00)', 'Chiều (13:00–17:00)', 'Tối (18:00–22:00)']
const SESSION_TIMES = ['06:00–12:00', '13:00–17:00', '18:00–22:00']

const DAYS = [
  { label: 'T2', date: '12/10' },
  { label: 'T3', date: '13/10' },
  { label: 'T4', date: '14/10' },
  { label: 'T5', date: '15/10' },
  { label: 'T6', date: '16/10' },
  { label: 'T7', date: '17/10' },
  { label: 'CN', date: '18/10' },
]

// status: free | approved | pending | maintenance | overload
const SLOT_DATA = {
  h1: {
    0: ['approved', 'free', 'approved', 'approved', 'pending', 'free', 'approved'],
    1: ['free', 'approved', 'free', 'approved', 'overload', 'pending', 'free'],
    2: ['pending', 'free', 'maintenance', 'free', 'approved', 'free', 'pending'],
  },
  h2: {
    0: ['free', 'free', 'approved', 'free', 'free', 'approved', 'free'],
    1: ['approved', 'pending', 'free', 'free', 'approved', 'free', 'approved'],
    2: ['free', 'approved', 'free', 'overload', 'free', 'maintenance', 'free'],
  },
  h3: {
    0: ['free', 'approved', 'free', 'pending', 'free', 'free', 'approved'],
    1: ['maintenance', 'free', 'approved', 'free', 'free', 'approved', 'overload'],
    2: ['free', 'free', 'free', 'approved', 'pending', 'free', 'free'],
  },
}

const SLOT_LABELS = {
  free: { label: 'Trống', cls: 'slot-free' },
  approved: { label: 'Đã duyệt', cls: 'slot-approved' },
  pending: { label: 'Chờ duyệt', cls: 'slot-pending' },
  maintenance: { label: 'Bảo trì', cls: 'slot-maintenance' },
  overload: { label: 'Cảnh báo tải', cls: 'slot-overload' },
}

const AI_ANALYSIS = [
  { name: 'Hệ thống chiếu sáng', status: 'Tốt', ok: true },
  { name: 'Hệ thống âm thanh', status: 'Kiểm tra trước 2h', ok: false },
  { name: 'Điều hòa trung tâm', status: 'Hoạt động tốt', ok: true },
  { name: 'Sàn thi đấu', status: 'Đã vệ sinh', ok: true },
]

export default function ScheduleView() {
  const setMeta = usePageMeta()
  const [view, setView] = useState('week')
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [weekOffset, setWeekOffset] = useState(0)

  useEffect(() => {
    setMeta({ title: 'Tra cứu lịch sử dụng', crumbs: 'Lịch & đặt chỗ · Tra cứu' })
  }, [setMeta])

  function handleSlotClick(hallId, sessionIdx, dayIdx, status) {
    setSelectedSlot({ hallId, sessionIdx, dayIdx, status })
  }

  const selectedHall = selectedSlot ? HALLS.find((h) => h.id === selectedSlot.hallId) : null

  return (
    <>
      {/* Page header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ margin: '0 0 4px' }}>Tra cứu lịch sử dụng &amp; Khung giờ khả dụng</h2>
            <p className="muted" style={{ margin: 0, fontSize: 13 }}>
              Kiểm tra tình trạng vận hành, tải khán đài và bảo trì kỹ thuật trước khi tạo hồ sơ thuê sân.
            </p>
          </div>
          <span className="badge badge-success" style={{ fontSize: 13, padding: '6px 14px' }}>
            Tỷ lệ sử dụng tuần này: 68.5%
          </span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="toolbar" style={{ marginBottom: 14 }}>
        <select style={{ minWidth: 220 }}>
          <option>Nhà thi đấu chính</option>
          <option>Tất cả khu vực</option>
        </select>
        <div className="week-nav">
          <button onClick={() => setWeekOffset((w) => w - 1)}><ChevronLeft size={14} /></button>
          <span style={{ fontSize: 13, fontWeight: 600, padding: '0 4px' }}>
            Tuần {42 + weekOffset}: 12/10 – 18/10/2026
          </span>
          <button onClick={() => setWeekOffset((w) => w + 1)}><ChevronRight size={14} /></button>
        </div>
        <div className="toggle-view" style={{ marginLeft: 'auto' }}>
          <button className={view === 'day' ? 'active' : ''} onClick={() => setView('day')}>Ngày</button>
          <button className={view === 'week' ? 'active' : ''} onClick={() => setView('week')}>Tuần (Chi tiết)</button>
        </div>
      </div>

      {/* Legend */}
      <div className="legend-bar">
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)' }}>Chú giải:</span>
        {Object.entries(SLOT_LABELS).map(([k, v]) => (
          <span key={k} className="legend-dot">
            <span className={v.cls} style={{ display: 'inline-block', width: 12, height: 12, borderRadius: 3 }} />
            {v.label}
          </span>
        ))}
      </div>

      {/* Main grid + detail panel */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedSlot ? '1fr 320px' : '1fr', gap: 16 }}>
        {/* Schedule grid */}
        <div className="card" style={{ padding: 12, overflowX: 'auto' }}>
          <table className="schedule-grid">
            <thead>
              <tr>
                <th style={{ minWidth: 130 }}>Hội trường / Khung giờ</th>
                {DAYS.map((d) => (
                  <th key={d.date}>{d.label}<br /><span style={{ fontWeight: 400, fontSize: 10 }}>{d.date}</span></th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HALLS.map((hall) => (
                <>
                  <tr key={`${hall.id}-label`}>
                    <td className="hall-label" rowSpan={SESSIONS.length + 1} style={{ verticalAlign: 'top', paddingTop: 12 }}>
                      <div style={{ fontWeight: 700 }}>{hall.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{hall.capacity}</div>
                    </td>
                  </tr>
                  {SESSIONS.map((session, sIdx) => (
                    <tr key={`${hall.id}-${sIdx}`}>
                      {DAYS.map((_, dIdx) => {
                        const status = SLOT_DATA[hall.id][sIdx][dIdx]
                        const info = SLOT_LABELS[status]
                        const isSelected =
                          selectedSlot &&
                          selectedSlot.hallId === hall.id &&
                          selectedSlot.sessionIdx === sIdx &&
                          selectedSlot.dayIdx === dIdx
                        return (
                          <td key={dIdx} style={{ padding: 2 }}>
                            <div
                              className={`slot-cell ${info.cls}`}
                              onClick={() => handleSlotClick(hall.id, sIdx, dIdx, status)}
                              style={isSelected ? { outline: '2px solid var(--navy)', outlineOffset: -2 } : {}}
                            >
                              <span>{info.label}</span>
                              <span style={{ fontSize: 10, fontWeight: 400 }}>{SESSION_TIMES[sIdx].split('–')[0]}</span>
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>

        {/* Detail panel */}
        {selectedSlot && (
          <div className="card slot-detail-panel" style={{ padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <strong style={{ fontSize: 14 }}>Chi tiết khung giờ đã chọn</strong>
              <button className="icon-btn" onClick={() => setSelectedSlot(null)} style={{ padding: 4 }}>
                <X size={16} />
              </button>
            </div>
            <img
              src={selectedHall.image}
              alt=""
              style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 10, marginBottom: 12 }}
            />
            <div style={{ fontSize: 13, marginBottom: 10 }}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>{selectedHall.name}</div>
              <div className="muted">ID khung: SL-{selectedSlot.hallId.toUpperCase()}-{selectedSlot.sessionIdx + 1}{selectedSlot.dayIdx + 1}</div>
              <div className="muted" style={{ marginTop: 2 }}>
                Thời gian: {SESSION_TIMES[selectedSlot.sessionIdx]} — {DAYS[selectedSlot.dayIdx].label} {DAYS[selectedSlot.dayIdx].date}/2026
              </div>
              <div className="muted" style={{ marginTop: 2 }}>Địa điểm: {selectedHall.name}</div>
            </div>

            <div className="alert" style={{ background: '#f0fdf4', color: '#15803d', marginBottom: 10, fontSize: 13 }}>
              <strong>Trạng thái dự báo:</strong> {SLOT_LABELS[selectedSlot.status].label}
              <br />Sức phục vụ: {selectedHall.capacity}
            </div>

            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', marginBottom: 8 }}>PHÂN TÍCH AI — THIẾT BỊ</div>
              {AI_ANALYSIS.map((a, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '5px 0', borderBottom: '1px solid var(--line)' }}>
                  <span>{a.name}</span>
                  <span style={{ color: a.ok ? '#15803d' : '#d97706', fontWeight: 600 }}>{a.status}</span>
                </div>
              ))}
            </div>

            <button className="btn primary" style={{ width: '100%', justifyContent: 'center' }}>
              Đăng ký khung giờ này →
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="card" style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ fontSize: 13, color: 'var(--muted)' }}>
          <strong style={{ color: 'var(--text)' }}>Liên hệ Ban Quản lý Nhà thi đấu Tỉnh</strong><br />
          Địa chỉ: 123 Đường Thể Thao, Phường 5, TP. Tỉnh lỵ
        </div>
        <button className="btn primary" style={{ gap: 8 }}>
          <Phone size={15} /> Đường dây nóng: 0280.3855.999
        </button>
      </div>
    </>
  )
}
