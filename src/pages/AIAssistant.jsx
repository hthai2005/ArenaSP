import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bot, Loader2, Plus, RefreshCw, Send, Zap } from 'lucide-react'
import { usePageMeta } from '../layouts/AppLayout'
import { api } from '../api/client'

// ── Quick suggestions & History ──────────────────────────────────────────
const HISTORY = [
  { id: 1, label: 'Hỏi lịch hội trường ngày 18/10', query: 'Chiều 18/10 nhà thi đấu chính còn trống không?' },
  { id: 2, label: 'Quy trình xin cấp phép đặt sân...', query: 'Quy trình xin cấp phép đặt sân' },
  { id: 3, label: 'Giải thích gợi ý Random Forest...', query: 'Vì sao hệ thống gợi ý khung giờ này?' },
  { id: 4, label: 'Nội quy mượn trang thiết bị...', query: 'Nội quy mượn trang thiết bị' },
]

const QUICK_ACTIONS = [
  'Gợi ý lịch trống',
  'Xem lịch trống',
  'Gửi đơn đăng ký',
  'Nội quy sử dụng sân',
  'Cảnh báo quá tải',
]

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
    text: 'Chiều ngày 18/10/2026, khu vực Sân trung tâm đa năng A (HT-01) có tình trạng khung giờ như sau:',
    slots: [
      { time: '14:00–16:00', status: 'Trống', load: '18%', statusColor: '#15803d' },
      { time: '16:00–18:00', status: 'Trống (tải trung bình)', load: '47%', statusColor: '#d97706' },
      { time: '18:00–20:00', status: 'Đã có lịch', load: '100%', statusColor: '#dc2626' },
    ],
    actions: ['Mở lịch HT-01', 'Đăng ký giữ khung 14:00', 'Giải thích gợi ý Random Forest'],
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
    text: 'Hệ thống đề xuất khung giờ cho khu vực Sân trung tâm đa năng A dựa trên 3 yếu tố cốt lõi từ mô hình Random Forest Regressor:',
    columns: [
      { icon: '📊', title: 'Mức sử dụng thấp', desc: 'Khung 14:00 chỉ chiếm 18% tải hạ tầng dự kiến' },
      { icon: '⚡', title: 'Tối ưu hạ tầng', desc: 'Phù hợp kế hoạch bảo trì định kỳ tuần này' },
      { icon: '🔄', title: 'Đệm bàn giao', desc: 'Đảm bảo khoảng cách 45 phút chuẩn bị sự kiện tối' },
    ],
    forecast: '24%',
  },
]

function formatText(text) {
  if (!text) return null
  return text.split('\n').map((line, idx) => {
    const parts = line.split(/(\*\*.*?\*\*)/g)
    return (
      <span
        key={idx}
        style={{
          display: 'block',
          minHeight: line ? undefined : '0.4em',
          marginBottom: line.startsWith('###') ? 6 : 2,
        }}
      >
        {parts.map((part, pIdx) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={pIdx}>{part.slice(2, -2)}</strong>
          }
          if (part.startsWith('### ')) {
            return (
              <strong key={pIdx} style={{ fontSize: 14, color: 'var(--primary)' }}>
                {part.slice(4)}
              </strong>
            )
          }
          return part
        })}
      </span>
    )
  })
}

export default function AIAssistant() {
  const navigate = useNavigate()
  const setMeta = usePageMeta()
  const [messages, setMessages] = useState(INITIAL_MESSAGES)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeHistory, setActiveHistory] = useState(1)
  const bottomRef = useRef(null)

  useEffect(() => {
    setMeta({ title: 'Trợ lý AI', crumbs: 'Trợ lý Điều hành Sân bãi AI' })
  }, [setMeta])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function handleSend(textToSend) {
    const query = (textToSend || input).trim()
    if (!query || loading) return

    const now = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    const userMsg = {
      id: Date.now(),
      role: 'user',
      time: now,
      text: query,
    }

    setMessages((prev) => [...prev, userMsg])
    if (!textToSend) setInput('')
    setLoading(true)

    try {
      const res = await api('/api/assistant/chat', {
        method: 'POST',
        body: { message: query },
      })

      const aiReply = {
        id: Date.now() + 1,
        role: 'ai',
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        content: res.content || 'text',
        text: res.text,
        slots: res.slots,
        actions: res.actions,
        columns: res.columns,
        forecast: res.forecast,
      }
      setMessages((prev) => [...prev, aiReply])
    } catch (err) {
      const errorReply = {
        id: Date.now() + 1,
        role: 'ai',
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        content: 'text',
        text: `⚠️ ${err.message || 'Không thể kết nối với Trợ lý AI. Vui lòng kiểm tra lại dịch vụ Backend.'}`,
      }
      setMessages((prev) => [...prev, errorReply])
    } finally {
      setLoading(false)
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleActionClick(actionText) {
    if (actionText.includes('Mở lịch')) {
      navigate('/schedules')
    } else if (actionText.includes('Đăng ký')) {
      navigate('/bookings')
    } else {
      handleSend(actionText)
    }
  }

  function handleNewChat() {
    setMessages([
      {
        id: Date.now(),
        role: 'ai',
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        content: 'text',
        text: 'Xin chào! Tôi là **Trợ lý Điều hành Sân bãi AI (ArenaSP)**.\n\nTôi có thể giúp bạn kiểm tra lịch trống, phân tích mức tải từ mô hình Random Forest, hướng dẫn quy trình đặt sân hoặc tra cứu nội quy sử dụng nhà thi đấu. Vui lòng đặt câu hỏi hoặc chọn tác vụ nhanh bên dưới!',
        actions: ['Gợi ý lịch trống', 'Xem lịch trống', 'Gửi đơn đăng ký'],
      },
    ])
  }

  return (
    <div className="ai-layout">
      {/* Sidebar */}
      <div className="ai-sidebar">
        <button
          className="btn primary"
          style={{ justifyContent: 'center', borderRadius: 10, fontSize: 13 }}
          onClick={handleNewChat}
        >
          <Plus size={15} /> Đoạn chat mới
          <span style={{ marginLeft: 'auto', fontSize: 11, opacity: 0.7 }}>Ctrl+K</span>
        </button>

        <div>
          <div className="ai-sidebar-title">Lịch sử tra cứu gần đây</div>
          {HISTORY.map((h) => (
            <div
              key={h.id}
              className={`ai-history-item ${activeHistory === h.id ? 'active' : ''}`}
              onClick={() => {
                setActiveHistory(h.id)
                handleSend(h.query)
              }}
            >
              {h.label}
            </div>
          ))}
        </div>

        <div style={{ borderTop: '1px solid var(--line)', paddingTop: 12 }}>
          <div className="ai-sidebar-title">Mô hình AI tích hợp</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>
            <div>🌲 Thuật toán: <strong>Random Forest Regressor</strong></div>
            <div>⚡ Thời gian phản hồi: <strong>&lt; 150ms</strong></div>
            <div>🟢 Dữ liệu học: <strong>360 lịch trình mẫu</strong></div>
            <div>✅ Cơ sở dữ liệu: <strong>MySQL (XAMPP)</strong></div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--line)', paddingTop: 12 }}>
          <div className="ai-sidebar-title">Nguyên tắc điều phối</div>
          <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0, lineHeight: 1.6 }}>
            Hệ thống tự động liên kết cơ sở dữ liệu thời gian thực và mô hình học máy để dự báo tỉ lệ lấp đầy, giúp tối ưu hóa hạ tầng và phân luồng sự kiện hợp lý.
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
                <span className="muted" style={{ fontSize: 13, fontWeight: 400, marginLeft: 8 }}>
                  | Tích hợp Random Forest &amp; DB XAMPP
                </span>
              </h2>
              <p className="muted" style={{ margin: 0, fontSize: 12 }}>
                Tích hợp dữ liệu Điều đồ Khung giờ · Tối ưu hóa tài nguyên · Quản lý quyền cấp phép UBND Tỉnh
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span className="status-online">Hệ thống trực tuyến</span>
              <button className="icon-btn ghost" title="Đoạn chat mới" onClick={handleNewChat}>
                <RefreshCw size={15} />
              </button>
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
                  {msg.role === 'ai' ? 'Trợ lý AI' : 'Người dùng'} · {msg.time}
                </div>
                <div className={`chat-bubble ${msg.role}`}>
                  {msg.content === 'text' && <div style={{ margin: 0 }}>{formatText(msg.text)}</div>}
                  {msg.role === 'user' && <p style={{ margin: 0 }}>{msg.text}</p>}

                  {msg.content === 'table' && (
                    <>
                      <div style={{ margin: '0 0 8px' }}>
                        {formatText(msg.text || 'Tình trạng khung giờ tại khu vực thi đấu:')}
                      </div>
                      {msg.slots && msg.slots.length > 0 && (
                        <table className="ai-table">
                          <thead>
                            <tr>
                              <th>Khung giờ</th>
                              <th>Trạng thái</th>
                              <th>Tải dự kiến</th>
                            </tr>
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
                      )}
                      {msg.actions && msg.actions.length > 0 && (
                        <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                          {msg.actions.map((a) => (
                            <button
                              key={a}
                              className="btn"
                              style={{ fontSize: 12, padding: '6px 12px', cursor: 'pointer' }}
                              onClick={() => handleActionClick(a)}
                            >
                              {a}
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}

                  {msg.content === 'explain' && (
                    <>
                      <div style={{ margin: '0 0 10px' }}>
                        {formatText(msg.text || 'Phân tích dự báo dựa trên mô hình Random Forest:')}
                      </div>
                      {msg.columns && msg.columns.length > 0 && (
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                            gap: 8,
                            marginBottom: 10,
                          }}
                        >
                          {msg.columns.map((c, i) => (
                            <div
                              key={i}
                              style={{
                                background: '#f8fafc',
                                borderRadius: 8,
                                padding: '10px 12px',
                                textAlign: 'center',
                                border: '1px solid #e2e8f0',
                              }}
                            >
                              <div style={{ fontSize: 20, marginBottom: 4 }}>{c.icon}</div>
                              <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 4 }}>{c.title}</div>
                              <div style={{ fontSize: 12, color: 'var(--muted)' }}>{c.desc}</div>
                            </div>
                          ))}
                        </div>
                      )}
                      {msg.forecast && (
                        <div
                          style={{
                            background: '#f0fdf4',
                            borderRadius: 8,
                            padding: '8px 12px',
                            fontSize: 13,
                            color: '#15803d',
                            fontWeight: 500,
                          }}
                        >
                          📊 Dự báo tỷ lệ chiếm dụng (Random Forest): <strong>{msg.forecast}</strong>
                        </div>
                      )}
                      {msg.actions && msg.actions.length > 0 && (
                        <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                          {msg.actions.map((a) => (
                            <button
                              key={a}
                              className="btn"
                              style={{ fontSize: 12, padding: '6px 12px', cursor: 'pointer' }}
                              onClick={() => handleActionClick(a)}
                            >
                              {a}
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {loading && (
            <div className="chat-msg ai">
              <div className="chat-avatar ai">
                <Bot size={14} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>
                  Trợ lý AI · Đang phân tích...
                </div>
                <div
                  className="chat-bubble ai"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
                >
                  <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
                  <span style={{ fontSize: 13, color: 'var(--muted)' }}>
                    Đang tra cứu cơ sở dữ liệu &amp; suy luận mô hình Random Forest...
                  </span>
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Quick actions */}
        <div className="ai-quick-actions">
          <Zap size={14} style={{ color: 'var(--muted)', flexShrink: 0 }} />
          {QUICK_ACTIONS.map((a) => (
            <button
              key={a}
              className="ai-quick-btn"
              onClick={() => handleSend(a)}
              disabled={loading}
            >
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
            disabled={loading}
            placeholder="Nhập câu hỏi về lịch thi đấu, sân bãi, quy định hoặc đề xuất điều phối..."
          />
          <button
            className="ai-send-btn"
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
          >
            {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={16} />} Gửi
          </button>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '8px 20px',
            fontSize: 11,
            color: 'var(--muted)',
            borderTop: '1px solid var(--line)',
            background: '#fff',
          }}
        >
          Trợ lý AI kết hợp dữ liệu nhà thi đấu thời gian thực và thuật toán Random Forest. Luôn xác nhận với Ban quản lý trước khi thực hiện đặt chỗ chính thức.
        </div>
      </div>
    </div>
  )
}
