import { useEffect, useState } from 'react'
import { Calendar, Lock, Save, Send, X } from 'lucide-react'
import { usePageMeta } from '../layouts/AppLayout'

const VENUES = [
  'Nhà thi đấu chính (Sức chứa 5.000 chỗ)',
  'Nhà tập đa năng (Sức chứa 1.200 chỗ)',
  'Sân thi đấu phụ (Sức chứa 600 chỗ)',
]

const EVENT_TYPES = [
  'Giải thi đấu chính thức',
  'Tập huấn đội tuyển',
  'Giao hữu / Giao lưu',
  'Hội nghị / Họp mặt',
  'Sự kiện cộng đồng',
]

const EQUIPMENT_LIST = [
  { id: 'eq1', label: 'Bảng điểm điện tử đa môn trung tâm', checked: true },
  { id: 'eq2', label: 'Hệ thống âm thanh Line Array & Micro đại biểu', checked: true },
  { id: 'eq3', label: 'Thảm thi đấu phụ (Khu kỹ thuật)', checked: false },
  { id: 'eq4', label: 'Hệ thống điều hòa nhiệt độ trung tâm', checked: true },
]

export default function BookingSimpleForm() {
  const setMeta = usePageMeta()
  const [equipment, setEquipment] = useState(
    Object.fromEntries(EQUIPMENT_LIST.map((e) => [e.id, e.checked]))
  )
  const [agreed, setAgreed] = useState(false)

  useEffect(() => {
    setMeta({
      title: 'Đăng ký sử dụng hội trường',
      crumbs: 'Trang chủ · Đăng ký thuê sân',
    })
  }, [setMeta])

  function toggleEq(id) {
    setEquipment((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <>
      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 4 }}>
            <h2 style={{ margin: 0 }}>Đăng ký sử dụng hội trường</h2>
            <span className="badge" style={{ background: '#f0fdf4', color: '#15803d', border: '1px solid #86efac' }}>
              Biểu mẫu số 04-BQL
            </span>
          </div>
          <p className="muted" style={{ margin: 0, fontSize: 13 }}>
            Yêu cầu sẽ ở trạng thái <strong>Chờ duyệt</strong> cho đến khi ban quản lý xác nhận và ký duyệt.
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>HẠN MỨC TIẾP NHẬN</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#d97706' }}>Tối thiểu trước 72 giờ</div>
        </div>
      </div>

      <div className="grid-2" style={{ gridTemplateColumns: '1.2fr 1fr', gap: 16 }}>
        {/* PART A */}
        <div>
          <div className="form-section">
            <div className="form-section-title">
              <span style={{ background: 'var(--navy)', color: '#fff', borderRadius: 6, padding: '2px 8px', fontSize: 11 }}>PHẦN A</span>
              01 – Thông tin Đơn vị &amp; Sự kiện
            </div>

            {/* Org name */}
            <div className="form-row">
              <label>Tên tổ chức / Đơn vị <span style={{ color: 'var(--danger)' }}>*</span></label>
              <div style={{ position: 'relative' }}>
                <input
                  defaultValue="CLB Bóng rổ Tỉnh"
                  disabled
                  style={{ paddingRight: 36 }}
                />
                <Lock size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                <span className="muted" style={{ fontSize: 12 }}>Tài khoản thuộc khối Liên đoàn &amp; Câu lạc bộ thể thao cơ sở cấp tỉnh.</span>
                <span className="badge badge-success" style={{ fontSize: 11 }}>Đã xác thực</span>
              </div>
            </div>

            <div className="grid-2">
              <div className="form-row">
                <label>Người đại diện liên hệ</label>
                <input defaultValue="Nguyễn Văn Hùng" />
              </div>
              <div className="form-row">
                <label>Số điện thoại</label>
                <input defaultValue="0912 345 678" />
              </div>
            </div>
            <p className="muted" style={{ fontSize: 12, color: 'var(--danger)', marginTop: -8, marginBottom: 12 }}>
              Nhập chính xác để nhận mã xác thực và SMS phê duyệt.
            </p>

            <div className="form-row">
              <label>Email tiếp nhận công văn / thông báo</label>
              <input type="email" defaultValue="clbbongro.tinh@gmail.com" />
              <div className="note">Bản scan giấy phép sử dụng có chữ ký số sẽ gửi về email này.</div>
            </div>

            <div className="form-row">
              <label>Loại hình sự kiện <span style={{ color: 'var(--danger)' }}>*</span></label>
              <select defaultValue="Giải thi đấu chính thức">
                {EVENT_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>

            <div className="form-row">
              <label>Tên sự kiện dự kiến <span style={{ color: 'var(--danger)' }}>*</span></label>
              <input defaultValue="Giải bóng rổ phong trào U19 tỉnh lần thứ IV" />
            </div>

            <div className="form-row">
              <label>Số lượng người dự kiến <span style={{ color: 'var(--danger)' }}>*</span></label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input type="number" defaultValue="360" style={{ maxWidth: 120 }} />
                <span className="muted" style={{ fontSize: 13 }}>người</span>
              </div>
            </div>

            <div style={{ fontSize: 12, color: 'var(--muted)', margin: '4px 0 12px', fontStyle: 'italic' }}>
              💾 Bản nháp được lưu tự động lúc 11:42
            </div>

            <div className="form-row">
              <label>Ghi chú bổ sung</label>
              <textarea rows={3} defaultValue="Cần mã cửa khán đài B cho cổ động viên, bố trí bàn kỹ thuật VĐV tại rìa sân." />
            </div>

            <label className="check">
              <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} />
              <span>Tôi đã đọc và đồng ý với các điều khoản sử dụng hội trường <span style={{ color: 'var(--danger)' }}>*</span></span>
            </label>
          </div>
        </div>

        {/* PART B */}
        <div>
          <div className="form-section">
            <div className="form-section-title">
              <span style={{ background: '#d97706', color: '#fff', borderRadius: 6, padding: '2px 8px', fontSize: 11 }}>PHẦN B</span>
              02 – Địa điểm, Thời gian &amp; Thiết bị
            </div>

            <div className="form-row">
              <label>Chọn Hội trường / Sân <span style={{ color: 'var(--danger)' }}>*</span></label>
              <div style={{ position: 'relative' }}>
                <select defaultValue={VENUES[0]}>
                  {VENUES.map((v) => <option key={v}>{v}</option>)}
                </select>
              </div>
            </div>

            <div className="form-row">
              <label>Ngày sử dụng <span style={{ color: 'var(--danger)' }}>*</span></label>
              <input type="date" defaultValue="2026-10-18" />
            </div>

            <div className="grid-2">
              <div className="form-row">
                <label>Giờ bắt đầu</label>
                <input type="time" defaultValue="14:00" />
              </div>
              <div className="form-row">
                <label>Giờ kết thúc</label>
                <input type="time" defaultValue="16:00" />
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <span className="badge badge-success">Thời lượng: 2 tiếng</span>
              <p className="muted" style={{ fontSize: 12, marginTop: 6 }}>
                Lịch thi đấu Chủ Nhật tuần thứ 42. Đã bao gồm 15 phút giãn cách vệ sinh sân.
              </p>
            </div>

            {/* Pricing card */}
            <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
              <div style={{ fontWeight: 700, color: '#15803d', fontSize: 13, marginBottom: 4 }}>
                CHÍNH SÁCH ĐƠN GIÁ NHÀ NƯỚC
              </div>
              <div style={{ fontSize: 13, color: '#166534' }}>
                Liên hệ Ban quản lý để được tư vấn mức phí phù hợp theo quy định hiện hành của UBND Tỉnh.
              </div>
            </div>

            {/* Equipment */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Danh mục trang thiết bị yêu cầu đi kèm</div>
              {EQUIPMENT_LIST.map((eq) => (
                <label key={eq.id} className="check" style={{ display: 'flex', marginBottom: 10, alignItems: 'center' }}>
                  <input
                    type="checkbox"
                    checked={equipment[eq.id]}
                    onChange={() => toggleEq(eq.id)}
                  />
                  <span style={{ fontSize: 13 }}>{eq.label}</span>
                </label>
              ))}
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <button className="btn ghost"><X size={14} /> Hủy bỏ</button>
              <button className="btn ghost"><Save size={14} /> Lưu bản nháp</button>
              <button className="btn primary" disabled={!agreed}>
                <Send size={14} /> Gửi đăng ký sử dụng
              </button>
            </div>
          </div>

          {/* Footer note */}
          <div className="card" style={{ fontSize: 12, color: 'var(--muted)', padding: 14 }}>
            <strong style={{ color: 'var(--text)', display: 'block', marginBottom: 4 }}>
              Gợi ý khung giờ (Random Forest) – GIAI ĐOẠN 2
            </strong>
            Thuật toán phân tích mật độ sử dụng theo lịch sử sẽ được tích hợp ở giai đoạn 2 để đề xuất
            khung giờ tối ưu và giảm xung đột lịch. Hiện tại vui lòng liên hệ Ban quản lý để được hỗ trợ.
          </div>
        </div>
      </div>
    </>
  )
}
