import { useEffect, useState } from 'react'
import { Download, Eye, FileText, MapPin, RefreshCw, RotateCcw, Search, X } from 'lucide-react'
import { usePageMeta } from '../layouts/AppLayout'

const BOOKINGS = [
  {
    id: 'DK-2026-089',
    status: 'pending',
    statusLabel: 'Chờ Ban quản lý duyệt',
    sentAt: '12/10/2026',
    title: 'Buổi tập chuyên sâu Đội tuyển U19 Tỉnh',
    desc: 'Chuẩn bị cho Vòng chung kết Giải Bóng rổ Trẻ Vô địch Quốc gia 2026',
    location: 'Nhà thi đấu chính (Sàn A)',
    time: '14:00–16:00 (18/10/2026)',
    scale: '32 VĐV & BHL',
  },
  {
    id: 'DK-2026-074',
    status: 'approved',
    statusLabel: 'Đã phê duyệt – Đã xếp lịch',
    sentAt: '05/10/2026',
    title: 'Giao hữu Bóng rổ Mở rộng – CLB Tỉnh vs CLB Đại học SP',
    desc: 'Trận giao hữu thân thiện giữa hai CLB.',
    location: 'Nhà thi đấu chính',
    time: '08:00–11:30 (15/10/2026)',
    decision: '184/QĐ-BGLTDTT',
  },
  {
    id: 'DK-2026-061',
    status: 'rejected',
    statusLabel: 'Bị từ chối',
    sentAt: '01/10/2026',
    title: 'Tập huấn Trọng tài & Giao lưu CLB Cuối tuần',
    desc: '',
    rejectReason:
      'Trùng lịch giải cấp tỉnh (Giải Vô địch Câu lạc bộ Tỉnh mở rộng 2026 được ưu tiên theo chỉ thị Sở VHTT).',
    location: 'Sân thi đấu phụ',
    time: '18:00–21:00 (10/10/2026)',
    altSlots: 3,
  },
  {
    id: 'DK-2026-055',
    status: 'cancelled',
    statusLabel: 'Người dùng đã hủy',
    sentAt: '20/09/2026',
    title: 'Họp mặt thành viên CLB Thể thao Quý III',
    desc: '',
    location: 'Nhà tập đa năng',
    time: '09:00–11:00 (28/09/2026)',
    feeNote: 'Đã hoàn trả 100% cọc',
  },
]

const TABS = [
  { key: 'all', label: 'Tất cả', count: 4 },
  { key: 'pending', label: 'Chờ duyệt', count: 1 },
  { key: 'approved', label: 'Đã duyệt', count: 1 },
  { key: 'rejected', label: 'Từ chối', count: 1 },
  { key: 'cancelled', label: 'Đã hủy', count: 1 },
]

const STATUS_BADGE = {
  pending: 'badge-warning',
  approved: 'badge-success',
  rejected: 'badge-danger',
  cancelled: 'badge-grey',
}

const CARD_CLS = {
  pending: 'pending',
  approved: 'approved',
  rejected: 'rejected',
  cancelled: 'cancelled',
}

export default function MyBookings() {
  const setMeta = usePageMeta()
  const [activeTab, setActiveTab] = useState('all')
  const [q, setQ] = useState('')

  useEffect(() => {
    setMeta({ title: 'Danh sách đơn đăng ký', crumbs: 'Đơn vị · Đơn đăng ký thuê hội trường' })
  }, [setMeta])

  const filtered = BOOKINGS.filter((b) => {
    const matchTab = activeTab === 'all' || b.status === activeTab
    const matchQ = q === '' || b.title.toLowerCase().includes(q.toLowerCase()) || b.id.toLowerCase().includes(q.toLowerCase())
    return matchTab && matchQ
  })

  return (
    <>
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ margin: '0 0 4px' }}>Danh sách đơn đăng ký thuê hội trường</h2>
        <p className="muted" style={{ margin: 0, fontSize: 13 }}>
          Theo dõi tiến độ thẩm định của Ban Quản lý Nhà thi đấu Tỉnh theo thời gian thực và quản lý quyền phân bổ sân tập.
        </p>
      </div>

      {/* Info bar */}
      <div className="info-bar">
        <strong>Khu Vực Quản Lý Đơn Thuê Cơ Sở Vật Chất</strong>
        <span>Tổ chức phụ trách: CLB Bóng rổ Tỉnh</span>
        <span>Mã đơn vị: DV-TDT-082</span>
        <span style={{ marginLeft: 'auto' }}>🟢 Cổng tiếp nhận trực tuyến 24/7</span>
      </div>

      {/* Stats */}
      <div className="stats compact" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 16 }}>
        <div className="stat"><div><strong>4</strong><span>Tổng số hồ sơ</span></div></div>
        <div className="stat"><div><strong style={{ color: '#d97706' }}>1</strong><span>Đang thẩm định</span></div></div>
        <div className="stat"><div><strong style={{ color: 'var(--success)' }}>1</strong><span>Đã cấp phép</span></div></div>
        <div className="stat"><div><strong style={{ color: 'var(--danger)' }}>2</strong><span>Từ chối / Hủy</span></div></div>
      </div>

      {/* Tabs */}
      <div className="tabs-bar">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={activeTab === t.key ? 'active' : ''}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="toolbar" style={{ marginBottom: 14 }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 360 }}>
          <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
          <input
            placeholder="Tìm kiếm theo tên, mã đơn..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ paddingLeft: 32, width: '100%', border: '1px solid var(--line)', borderRadius: 10, padding: '9px 12px 9px 32px', fontSize: 13 }}
          />
        </div>
      </div>

      {/* Cards */}
      {filtered.map((b) => (
        <div key={b.id} className={`booking-card ${CARD_CLS[b.status]}`}>
          <div className="booking-card-head">
            <div>
              <span style={{ fontWeight: 700, fontSize: 15, marginRight: 10 }}>#{b.id}</span>
              <span className={`badge ${STATUS_BADGE[b.status]}`}>{b.statusLabel}</span>
            </div>
            <span className="muted" style={{ fontSize: 12 }}>Gửi lúc {b.sentAt}</span>
          </div>

          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{b.title}</div>
          {b.desc && <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 8 }}>{b.desc}</div>}

          {b.rejectReason && (
            <div className="alert danger" style={{ fontSize: 13, marginBottom: 8 }}>
              <strong>Lý do từ chối:</strong> {b.rejectReason}
            </div>
          )}

          <div className="booking-meta">
            <span><MapPin size={13} /> {b.location}</span>
            <span>🕐 {b.time}</span>
            {b.scale && <span>👥 {b.scale}</span>}
            {b.decision && <span style={{ color: 'var(--success)', fontWeight: 600 }}>Quyết định số: {b.decision}</span>}
            {b.altSlots && <span style={{ color: '#d97706' }}>Giải pháp: Có {b.altSlots} khung giờ thay thế</span>}
            {b.feeNote && <span style={{ color: 'var(--success)' }}>Tình trạng phí: {b.feeNote}</span>}
          </div>

          <div className="booking-actions">
            {b.status === 'pending' && (
              <>
                <button className="btn primary" style={{ fontSize: 13 }}><Eye size={14} /> Xem chi tiết</button>
                <button className="btn" style={{ fontSize: 13, background: '#fef2f2', color: 'var(--danger)', border: '1px solid var(--danger)' }}>
                  <X size={14} /> Hủy đơn
                </button>
              </>
            )}
            {b.status === 'approved' && (
              <>
                <button className="btn primary" style={{ fontSize: 13 }}><Download size={14} /> Giấy phép sử dụng (PDF)</button>
                <button className="btn ghost" style={{ fontSize: 13 }}><FileText size={14} /> In biên bản giao</button>
              </>
            )}
            {b.status === 'rejected' && (
              <>
                <button className="btn" style={{ fontSize: 13, background: '#fff7ed', color: '#c2410c', border: '1px solid #fdba74' }}>
                  <RefreshCw size={14} /> Đăng ký lại khung giờ khác
                </button>
                <button className="btn ghost" style={{ fontSize: 13 }}><Eye size={14} /> Xem chi tiết đơn</button>
              </>
            )}
            {b.status === 'cancelled' && (
              <button className="btn ghost" style={{ fontSize: 13 }}><Eye size={14} /> Xem lại thông tin</button>
            )}
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <div className="empty"><p>Không có đơn nào phù hợp.</p></div>
      )}

      {/* Footer note */}
      <div className="card" style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, fontSize: 13 }}>
        <span className="muted">Quy định xử lý hồ sơ thuê sân công vụ — Ban quản lý Nhà thi đấu Tỉnh.</span>
        <button className="btn ghost" style={{ fontSize: 13 }}><Download size={14} /> Tải Quy chế số 14/QĐ-TDTT</button>
      </div>
    </>
  )
}
