import { useEffect, useRef, useState } from 'react'
import { Bot, Calendar, ExternalLink, Plus, RefreshCw, Send, Zap } from 'lucide-react'
import { usePageMeta } from '../layouts/AppLayout'

// ── Mock data ─────────────────────────────────────────────────────────────
const HISTORY = [
  { id: 1, label: 'Hỏi lịch hội trường ngày 18/10', active: true },
  { id: 2, label: 'Quy trình xin cấp phép đặt sân...' },
  { id: 3, label: 'Giải thích gợi ý Random Forest...' },
  { id: 4, label: 'Nội quy mượn trang thiết bị...' },
]

const QUICK_ACTIONS = ['Gợi ý lịch trống', 'Xem lịch trống', 'Gửi đơn đăng ký', 'Nội quy sử dụng sân', 'Cảnh báo quá tải']

const INITIAL_MESSAGES = [
  {
    id: 1,
    role: 'user',
    time: '14:15',
    text: 'Chiều 18/10 nhà thi đấu chính còn trống không?',
  },
  {
    id: 2,
    role: 'ai',
    time: '14:15',
    content: 'table',
    slots: [
      { time: '14:00–16:00', status: 'Trống', load: '18%', statusColor: '#15803d' },
      { time: '16:00–18:00', status: 'Trống (tải trung bình)', load: '47%', statusColor: '#d97706' },
    ],
    actions: ['Mở lịch hội trường', 'Đăng ký giữ khung 14:00'],
  },
  {
    id: 3,
    role: 'user',
    time: '14:16',
    text: 'Vì sao hệ thống gợi ý 14:00 – 16:00?',
  },
  {
    id: 4,
    role: 'ai',
    time: '14:16',
    content: 'explain',
    columns: [
      { icon: '📊', title: 'Mức sử dụng thấp', desc: 'Khung 14:00 chỉ chiếm 18% tải hạ tầng' },
      { icon: '⚡', title: 'Tối ưu hạ tầng', desc: 'Phù hợp kế hoạch bảo trì định kỳ tuần này' },
      { icon: '🔄', title: 'Đệm bàn giao', desc: 'Đủ thời gian chuẩn bị cho sự kiện tối' },
    ],
    forecast: '24%',
  },
]

export default function AIAssistant() {
  const setMeta = usePageMeta()
  const [messages, setMessages] = useState(INITIAL_MESSAGES)
  const [input, setInput] = useState('')
  const [activeHistory, setActiveHistory] = useState(1)
  const bottomRef = useRef(null)

  useEffect(() => {
    setMeta({ title: 'Trợ lý AI', crumbs: 'Trợ lý Điều hành Sân bãi AI' })
  }, [setMeta])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function handleSend() {
    if (!input.trim()) return
    const userMsg = { id: Date.now(), role: 'user', time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }), text: input }
    const aiReply = {
      id: Date.now() + 1,
      role: 'ai',
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      content: 'text',
      text: 'Cảm ơn câu hỏi của bạn. Hệ thống đang xử lý thông tin và sẽ phản hồi trong giây lát. Vui lòng thử lại hoặc liên hệ Ban quản lý qua đường dây nóng 0280.3855.999.',
    }
    setMessages((prev) => [...prev, userMsg, aiReply])
    setInput('')
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="ai-layout">
      {/* Sidebar */}
      <div className="ai-sidebar">
        <button className="btn primary" style={{ justifyContent: 'center', borderRadius: 10, fontSize: 13 }}>
          <Plus size={15} /> Đoạn chat mới
          <span style={{ marginLeft: 'auto', fontSize: 11, opacity: .7 }}>Ctrl+K</span>
        </button>

        <div>
          <div className="ai-sidebar-title">Lịch sử tra cứu gần đây: 4 phiên</div>
          {HISTORY.map((h) => (
            <div
              key={h.id}
              className={`ai-history-item ${activeHistory === h.id ? 'active' : ''}`}
              onClick={() => setActiveHistory(h.id)}
            >
              {h.label}
            </div>
          ))}
        </div>

        <div style={{ borderTop: '1px solid var(--line)', paddingTop: 12 }}>
          <div className="ai-sidebar-title">Phiên trực đồng bộ</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>
            <div>🟢 Cập nhật lịch Tỉnh: <strong>15:32 hôm nay</strong></div>
            <div>⚡ Độ trễ phản hồi: <strong>320ms</strong></div>
            <div>✅ Độ tin cậy: <strong>99.4%</strong></div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--line)', paddingTop: 12 }}>
          <div className="ai-sidebar-title">Nguyên tắc gia tốc tiếp</div>
          <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0, lineHeight: 1.6 }}>
            Hệ thống ưu tiên phân tích dữ liệu lịch sử 12 tuần để dự báo tình trạng hội trường và đề xuất khung giờ tối ưu.
          </p>
        </div>
      </div>

      {/* Chat area */}
      <div className="ai-chat">
        {/* Header */}
        <div className="ai-chat-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h2 style={{ marginBottom: 2 }}>
                <Bot size={18} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                Trợ lý Điều hành Sân bãi AI
                <span className="muted" style={{ fontSize: 13, fontWeight: 400, marginLeft: 8 }}>| Mô hình hỗ trợ công vụ v2.4</span>
              </h2>
              <p className="muted" style={{ margin: 0, fontSize: 12 }}>
                Tích hợp dữ liệu Điều đồ Khung giờ · Tối ưu hóa tài nguyên · Quản lý quyền cấp phép UBND Tỉnh
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span className="status-online">Hệ thống trực tuyến</span>
              <button className="icon-btn ghost" title="Làm mới"><RefreshCw size={15} /></button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="ai-messages">
          {messages.map((msg) => (
            <div key={msg.id} className={`chat-msg ${msg.role}`}>
              <div className={`chat-avatar ${msg.role}`}>
                {msg.role === 'ai' ? <Bot size={14} /> : 'CLB'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>
                  {msg.role === 'ai' ? 'Trợ lý AI' : 'CLB Bóng rổ Tỉnh'} · {msg.time}
                </div>
                <div className={`chat-bubble ${msg.role}`}>
                  {msg.content === 'text' && <p style={{ margin: 0 }}>{msg.text}</p>}
                  {msg.role === 'user' && <p style={{ margin: 0 }}>{msg.text}</p>}

                  {msg.content === 'table' && (
                    <>
                      <p style={{ margin: '0 0 8px' }}>Chiều 18/10, Nhà thi đấu chính còn 2 khung trống:</p>
                      <table className="ai-table">
                        <thead>
                          <tr><th>Khung giờ</th><th>Trạng thái</th><th>Tải</th></tr>
                        </thead>
                        <tbody>
                          {msg.slots.map((s, i) => (
                            <tr key={i}>
                              <td><strong>{s.time}</strong></td>
                              <td style={{ color: s.statusColor, fontWeight: 600 }}>{s.status}</td>
                              <td>{s.load}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                        {msg.actions.map((a) => (
                          <button key={a} className="btn" style={{ fontSize: 12, padding: '6px 12px' }}>{a}</button>
                        ))}
                      </div>
                    </>
                  )}

                  {msg.content === 'explain' && (
                    <>
                      <p style={{ margin: '0 0 10px' }}>Hệ thống gợi ý 14:00–16:00 dựa trên 3 yếu tố chính:</p>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 10 }}>
                        {msg.columns.map((c, i) => (
                          <div key={i} style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
                            <div style={{ fontSize: 20, marginBottom: 4 }}>{c.icon}</div>
                            <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 4 }}>{c.title}</div>
                            <div style={{ fontSize: 12, color: 'var(--muted)' }}>{c.desc}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ background: '#f0fdf4', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#15803d' }}>
                        📊 Dự báo tỷ lệ chiếm dụng: <strong>{msg.forecast}</strong>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Quick actions */}
        <div className="ai-quick-actions">
          <Zap size={14} style={{ color: 'var(--muted)', flexShrink: 0 }} />
          {QUICK_ACTIONS.map((a) => (
            <button key={a} className="ai-quick-btn" onClick={() => setInput(a)}>
              {a}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="ai-input-bar">
          <textarea
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Nhập câu hỏi về lịch thi đấu, sân bãi, quy định hoặc đề xuất điều phối..."
          />
          <button className="ai-send-btn" onClick={handleSend} disabled={!input.trim()}>
            <Send size={16} /> Gửi
          </button>
        </div>

        {/* Footer */}
        <div style={{ padding: '8px 20px', fontSize: 11, color: 'var(--muted)', borderTop: '1px solid var(--line)', background: '#fff' }}>
          Trợ lý AI có thể đưa ra câu trả lời chưa cập nhật đột xuất của UBND Tỉnh. Luôn xác nhận với Ban quản lý trước khi thực hiện đặt chỗ chính thức.
        </div>
      </div>
    </div>
  )
}
