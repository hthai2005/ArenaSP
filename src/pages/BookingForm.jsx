import { useEffect, useState } from 'react'
import { AlertTriangle, Calendar, ChevronDown, Lock, Send, Save, X } from 'lucide-react'
import { usePageMeta } from '../layouts/AppLayout'

const TIME_SLOTS = [
  { time: '06:00–08:30', status: 'available', label: 'Khả dụng', load: '12%' },
  { time: '08:30–10:30', status: 'selected', label: 'Đang chọn', load: '34%' },
  { time: '14:00–16:00', status: 'warning', label: 'Quá tải 96%', load: '96%' },
  { time: '16:00–18:00', status: 'warning', label: 'Tải 96%', load: '96%' },
]

const RF_SUGGESTIONS = [
  { time: '08:30–10:30', day: 'Thứ Năm, 15/10', score: 88, cls: 'good', scoreColor: '#15803d' },
  { time: '10:00–12:00', day: 'Thứ Sáu, 16/10', score: 82, cls: 'ok', scoreColor: '#d97706' },
  { time: '16:00–18:00', day: 'Chủ Nhật, 18/10', score: 75, cls: 'low', scoreColor: '#dc2626' },
]

export default function BookingForm() {
  const setMeta = usePageMeta()
  const [selectedSlot, setSelectedSlot] = useState('08:30–10:30')
  const [showFactors, setShowFactors] = useState(false)
  const [checked1, setChecked1] = useState(false)
  const [checked2, setChecked2] = useState(false)
  const [checked3, setChecked3] = useState(false)
  const [optAC, setOptAC] = useState(true)
  const [optVIP, setOptVIP] = useState(false)

  useEffect(() => {
    setMeta({
      title: 'Hồ sơ đăng ký thuê hội trường',
      crumbs: 'Trang chủ · Điều phối thể chế · Đăng ký hội trường',
    })
  }, [setMeta])

  return (
    <>
      {/* Page title */}
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 6 }}>
            <h2 style={{ margin: 0 }}>Hồ sơ Đăng ký Thuê Hội trường &amp; Sân vận động</h2>
            <span className="badge badge-success">ML Random Forest v3.2</span>
            <span className="badge" style={{ background: '#eff6ff', color: '#1d4ed8' }}>Tự động phân tích thời gian thực</span>
          </div>
        </div>
      </div>

      {/* Alert */}
      <div className="alert warning" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <strong>Cảnh báo nguy cơ quá tải &amp; xung đột lịch – Tải đa kiện: 48%</strong>
            <div style={{ fontSize: 13, marginTop: 3 }}>
              Khung 18:00–20:00 có nguy cơ quá tải hạ tầng. Hệ thống đề xuất chuyển sang khung giờ tối ưu hơn.
            </div>
          </div>
        </div>
        <button className="btn" style={{ background: '#fff', border: '1px solid #d97706', color: '#9a6b00', fontSize: 13, whiteSpace: 'nowrap' }}>
          Xem khung giờ ý →
        </button>
      </div>

      {/* 2-column layout */}
      <div className="grid-2" style={{ gridTemplateColumns: '1.2fr 1fr', gap: 16 }}>
        {/* LEFT */}
        <div>
          {/* Section 1 */}
          <div className="form-section">
            <div className="form-section-title">🏛 Đơn vị &amp; Người đại diện <span className="badge" style={{ background: '#eff6ff', color: '#1d4ed8', fontSize: 11 }}>Hồ sơ pháp lý</span></div>
            <div className="form-row">
              <label>Tên tổ chức / Đơn vị</label>
              <input defaultValue="CLB Bóng rổ Thể thao Thành phố (Đoàn Thanh niên)" />
            </div>
            <div className="grid-2">
              <div className="form-row">
                <label>Mã định danh / MST</label>
                <input defaultValue="0318992021" />
              </div>
              <div className="form-row">
                <label>Cấp quản lý</label>
                <input defaultValue="Liên đoàn / CLB Tỉnh" disabled />
              </div>
            </div>
            <div className="grid-2">
              <div className="form-row">
                <label>Người phụ trách</label>
                <input defaultValue="Nguyễn Văn Hoàng Nam" />
              </div>
              <div className="form-row">
                <label>SĐT liên lạc</label>
                <input defaultValue="0918 342 988" />
              </div>
            </div>
          </div>

          {/* Section 2 */}
          <div className="form-section">
            <div className="form-section-title">📋 Nội dung sự kiện &amp; Quy mô</div>
            <div className="form-row">
              <label>Tên sự kiện</label>
              <input defaultValue="Giải Vô địch Bóng rổ Thành niên Tỉnh Mở rộng 2026" />
            </div>
            <div className="grid-2">
              <div className="form-row">
                <label>Phân loại sự kiện</label>
                <select defaultValue="competition">
                  <option value="competition">Giải thi đấu thể cao</option>
                  <option value="training">Tập huấn</option>
                  <option value="other">Khác</option>
                </select>
              </div>
              <div className="form-row">
                <label>Dự kiến số người</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input defaultValue="350" style={{ maxWidth: 100 }} />
                  <span className="muted" style={{ fontSize: 13 }}>VĐV – COV</span>
                </div>
              </div>
            </div>

            <div style={{ background: '#fff7ed', border: '1px solid #fbbf24', borderRadius: 10, padding: '10px 14px', fontSize: 13, marginBottom: 12 }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Hồ sơ thuê hội trường A (Ngày 18/10/2026)</div>
              <div className="muted">Khung giờ 18:00–20:00 • <span style={{ color: '#c2410c', fontWeight: 600 }}>Có cảnh báo tải cao</span></div>
            </div>

            <div style={{ display: 'flex', gap: 16, marginBottom: 12, flexWrap: 'wrap' }}>
              <label className="check"><input type="checkbox" checked={optAC} onChange={e => setOptAC(e.target.checked)} /> Điều hòa trung tâm</label>
              <label className="check"><input type="checkbox" checked={optVIP} onChange={e => setOptVIP(e.target.checked)} /> Khu vực phòng VIP</label>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
              <label className="check"><input type="checkbox" checked={checked1} onChange={e => setChecked1(e.target.checked)} /> Tôi cam kết bảo đảm an toàn sức khỏe cho người tham dự</label>
              <label className="check"><input type="checkbox" checked={checked2} onChange={e => setChecked2(e.target.checked)} /> Đã có phương án PCCC và thoát hiểm</label>
              <label className="check"><input type="checkbox" checked={checked3} onChange={e => setChecked3(e.target.checked)} /> Đồng ý hệ thống sử dụng mô hình Random Forest để đề xuất lịch tối ưu</label>
            </div>

            {/* Preview card */}
            <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 10, padding: '10px 14px', fontSize: 13 }}>
              <div style={{ fontWeight: 600, color: '#15803d', marginBottom: 2 }}>🟢 Khu vực đã chọn</div>
              <div style={{ fontWeight: 700 }}>Nhà thi đấu Đa năng Trung tâm</div>
              <div className="muted">Sức chứa 2.400 chỗ · Chuẩn bị FIBA</div>
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div>
          {/* Slot selection */}
          <div className="form-section">
            <div className="form-section-title">
              📅 Chọn Hội trường &amp; Ngày diễn ra
              <span className="badge badge-warning" style={{ fontSize: 11, marginLeft: 'auto' }}>Kỳ điều phối: Tuần 42</span>
            </div>
            <div className="form-row">
              <label>Khu vực / Hội trường</label>
              <select>
                <option>Hội trường A – Sân Đa năng Chính</option>
                <option>Hội trường B – Nhà tập</option>
              </select>
            </div>
            <div className="form-row">
              <label>Ngày thi đấu</label>
              <input type="date" defaultValue="2026-10-18" />
            </div>

            <div style={{ marginBottom: 12 }}>
              {TIME_SLOTS.map((s) => (
                <div
                  key={s.time}
                  className={`slot-option ${s.status === 'selected' && selectedSlot === s.time ? 'selected' : s.status}`}
                  onClick={() => s.status !== 'danger' && setSelectedSlot(s.time)}
                >
                  <div>
                    <strong>{s.time}</strong>
                    <span className="muted" style={{ fontSize: 12, display: 'block' }}>{s.label}</span>
                  </div>
                  <span style={{
                    fontSize: 12, fontWeight: 700,
                    color: s.load >= '90' ? '#dc2626' : s.load >= '50' ? '#d97706' : '#15803d'
                  }}>Tải {s.load}</span>
                </div>
              ))}
            </div>

            <div className="alert danger" style={{ fontSize: 13 }}>
              <AlertTriangle size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
              <strong>18:00–20:00</strong> – Khung đã chọn ban đầu → Cần chuyển cơ sở điểm
            </div>
          </div>

          {/* RF suggestions */}
          <div className="form-section">
            <div className="form-section-title">
              🤖 Gợi ý từ mô hình Random Forest
              <span className="badge" style={{ background: '#eff6ff', color: '#1d4ed8', fontSize: 11, marginLeft: 'auto' }}>AI Dispatcher</span>
            </div>

            {RF_SUGGESTIONS.map((r, i) => (
              <div key={i} className={`rf-card ${r.cls}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>{r.time}</strong>
                    <span className="muted" style={{ fontSize: 12, display: 'block' }}>{r.day}</span>
                  </div>
                  <span style={{ fontWeight: 700, fontSize: 16, color: r.scoreColor }}>{r.score}%</span>
                </div>
              </div>
            ))}

            <p className="muted" style={{ fontSize: 12, margin: '10px 0' }}>
              Lưu ý: Kết quả Random Forest chỉ mang tính chất hỗ trợ. Quyết định cuối cùng thuộc về Ban quản lý.
            </p>

            <div className="collapsible-section">
              <div className="collapsible-header" onClick={() => setShowFactors(!showFactors)}>
                Các yếu tố trọng số Random Forest xem xét
                <ChevronDown size={15} style={{ transform: showFactors ? 'rotate(180deg)' : 'none', transition: '.2s' }} />
              </div>
              {showFactors && (
                <div className="collapsible-body">
                  <ul style={{ paddingLeft: 16, margin: 0 }}>
                    <li>Mật độ sự kiện trong tuần (trọng số 0.32)</li>
                    <li>Lịch sử sử dụng cùng khung giờ (trọng số 0.28)</li>
                    <li>Số lượng người tham dự dự kiến (trọng số 0.22)</li>
                    <li>Yêu cầu thiết bị kèm theo (trọng số 0.18)</li>
                  </ul>
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <button className="btn ghost"><X size={14} /> Hủy bỏ</button>
              <button className="btn ghost"><Save size={14} /> Lưu nháp</button>
              <button className="btn primary"><Send size={14} /> Gửi đăng ký</button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
