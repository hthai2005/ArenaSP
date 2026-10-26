import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  Download,
  Eye,
  FileText,
  MapPin,
  RefreshCw,
  Search,
  X,
} from 'lucide-react'

import {
  useNavigate,
} from 'react-router-dom'

import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { usePageMeta } from '../layouts/AppLayout'

const STATUS_LABEL = {
  PENDING:
    'Chờ Ban quản lý duyệt',

  APPROVED:
    'Đã phê duyệt – Đã xếp lịch',

  REJECTED:
    'Bị từ chối',

  CANCELLED:
    'Đã hủy',
}

const STATUS_BADGE = {
  pending:
    'badge-warning',

  approved:
    'badge-success',

  rejected:
    'badge-danger',

  cancelled:
    'badge-grey',
}

const CARD_CLS = {
  pending:
    'pending',

  approved:
    'approved',

  rejected:
    'rejected',

  cancelled:
    'cancelled',
}

function formatDate(value) {
  if (!value) {
    return '—'
  }

  return new Date(
    value,
  ).toLocaleDateString(
    'vi-VN',
  )
}

function formatTimeRange(
  start,
  end,
) {
  if (
    !start ||
    !end
  ) {
    return '—'
  }

  const startDate =
    new Date(start)

  const endDate =
    new Date(end)

  return (
    `${startDate.toLocaleTimeString(
      'vi-VN',
      {
        hour:
          '2-digit',

        minute:
          '2-digit',
      },
    )}–` +
    `${endDate.toLocaleTimeString(
      'vi-VN',
      {
        hour:
          '2-digit',

        minute:
          '2-digit',
      },
    )} ` +
    `(${startDate.toLocaleDateString(
      'vi-VN',
    )})`
  )
}

export default function MyBookings() {
  const setMeta =
    usePageMeta()

  const navigate =
    useNavigate()

  const { user } =
    useAuth()

  const {
    bookings,
    halls,
    refreshBookings,
    approveBooking,
    rejectBooking,
    cancelBooking,
  } = useData()

  const [
    activeTab,
    setActiveTab,
  ] =
    useState('all')

  const [
    q,
    setQ,
  ] =
    useState('')

  const [
    busyId,
    setBusyId,
  ] =
    useState(null)

  const [
    ok,
    setOk,
  ] =
    useState('')

  const [
    error,
    setError,
  ] =
    useState('')

  useEffect(() => {

    setMeta({
      title:
        user.role ===
        'user'
          ? 'Danh sách đơn đăng ký'
          : 'Quản lý yêu cầu đặt chỗ',

      crumbs:
        'Đơn vị · Đơn đăng ký thuê hội trường',
    })

  }, [
    setMeta,
    user.role,
  ])

  const hallName =
    (hallId) =>
      halls.find(
        (hall) =>
          hall.id ===
          Number(hallId),
      )?.name ||
      `Hall #${hallId}`

  const rows =
    useMemo(
      () =>
        bookings.map(
          (booking) => {

            const status =
              String(
                booking.status ||
                  '',
              ).toLowerCase()

            return {
              ...booking,

              status,

              statusLabel:
                STATUS_LABEL[
                  booking.status
                ] ||
                booking.status,

              sentAt:
                formatDate(
                  booking.createdAt,
                ),

              location:
                hallName(
                  booking.hallId,
                ),

              time:
                formatTimeRange(
                  booking.startTime,
                  booking.endTime,
                ),

              desc:
                booking.note ||
                '',
            }
          },
        ),
      [
        bookings,
        halls,
      ],
    )

  const counts =
    useMemo(
      () => ({
        all:
          rows.length,

        pending:
          rows.filter(
            (item) =>
              item.status ===
              'pending',
          ).length,

        approved:
          rows.filter(
            (item) =>
              item.status ===
              'approved',
          ).length,

        rejected:
          rows.filter(
            (item) =>
              item.status ===
              'rejected',
          ).length,

        cancelled:
          rows.filter(
            (item) =>
              item.status ===
              'cancelled',
          ).length,
      }),
      [rows],
    )

  const tabs = [
    {
      key: 'all',
      label: 'Tất cả',
      count: counts.all,
    },

    {
      key: 'pending',
      label: 'Chờ duyệt',
      count: counts.pending,
    },

    {
      key: 'approved',
      label: 'Đã duyệt',
      count: counts.approved,
    },

    {
      key: 'rejected',
      label: 'Từ chối',
      count: counts.rejected,
    },

    {
      key: 'cancelled',
      label: 'Đã hủy',
      count: counts.cancelled,
    },
  ]

  const filtered =
    rows.filter(
      (booking) => {

        const matchTab =
          activeTab ===
            'all' ||
          booking.status ===
            activeTab

        const keyword =
          q
            .trim()
            .toLowerCase()

        const matchQ =
          !keyword ||
          booking.title
            .toLowerCase()
            .includes(
              keyword,
            ) ||
          String(
            booking.id,
          )
            .toLowerCase()
            .includes(
              keyword,
            ) ||
          booking.location
            .toLowerCase()
            .includes(
              keyword,
            )

        return (
          matchTab &&
          matchQ
        )
      },
    )

  const canApprove =
    [
      'admin',
      'manager',
    ].includes(
      user.role,
    )

  const canReject =
    [
      'admin',
      'manager',
    ].includes(
      user.role,
    )

  const canCancel =
    [
      'admin',
      'manager',
      'user',
    ].includes(
      user.role,
    )

  async function runAction(
    id,
    action,
    message,
  ) {
    try {

      setBusyId(id)
      setOk('')
      setError('')

      await action(id)

      setOk(message)

    } catch (err) {

      setError(
        err.message,
      )

    } finally {

      setBusyId(null)
    }
  }

  function showDetails(
    booking,
  ) {
    window.alert(
      `Mã đơn: #${booking.id}\n` +
      `Sự kiện: ${booking.title}\n` +
      `Địa điểm: ${booking.location}\n` +
      `Thời gian: ${booking.time}\n` +
      `Trạng thái: ${booking.statusLabel}\n` +
      `Ghi chú: ${booking.desc || 'Không có'}`,
    )
  }

  return (
    <>

      <div
        style={{
          marginBottom:
            16,
        }}
      >

        <h2
          style={{
            margin:
              '0 0 4px',
          }}
        >
          {user.role ===
          'user'
            ? 'Danh sách đơn đăng ký thuê hội trường'
            : 'Quản lý đơn đăng ký thuê hội trường'}
        </h2>

        <p
          className="muted"
          style={{
            margin: 0,
            fontSize: 13,
          }}
        >
          Theo dõi tiến độ thẩm định của Ban Quản lý
          Nhà thi đấu Tỉnh theo thời gian thực và
          quản lý quyền phân bổ sân tập.
        </p>

      </div>

      {ok ? (
        <div className="alert success">
          {ok}
        </div>
      ) : null}

      {error ? (
        <div className="alert danger">
          {error}
        </div>
      ) : null}

      <div className="info-bar">

        <strong>
          Khu Vực Quản Lý Đơn Thuê Cơ Sở Vật Chất
        </strong>

        <span>
          Tài khoản: {user.name}
        </span>

        <span>
          Vai trò: {user.roleName || user.role}
        </span>

        <span
          style={{
            marginLeft:
              'auto',
          }}
        >
          🟢 Cổng tiếp nhận trực tuyến 24/7
        </span>

      </div>

      <div
        className="stats compact"
        style={{
          gridTemplateColumns:
            'repeat(4, 1fr)',

          marginBottom:
            16,
        }}
      >

        <div className="stat">
          <div>
            <strong>
              {counts.all}
            </strong>
            <span>
              Tổng số hồ sơ
            </span>
          </div>
        </div>

        <div className="stat">
          <div>
            <strong
              style={{
                color:
                  '#d97706',
              }}
            >
              {counts.pending}
            </strong>
            <span>
              Đang thẩm định
            </span>
          </div>
        </div>

        <div className="stat">
          <div>
            <strong
              style={{
                color:
                  'var(--success)',
              }}
            >
              {counts.approved}
            </strong>
            <span>
              Đã cấp phép
            </span>
          </div>
        </div>

        <div className="stat">
          <div>
            <strong
              style={{
                color:
                  'var(--danger)',
              }}
            >
              {counts.rejected +
                counts.cancelled}
            </strong>
            <span>
              Từ chối / Hủy
            </span>
          </div>
        </div>

      </div>

      <div className="tabs-bar">

        {tabs.map(
          (tab) => (

            <button
              key={tab.key}
              type="button"
              className={
                activeTab ===
                tab.key
                  ? 'active'
                  : ''
              }
              onClick={() =>
                setActiveTab(
                  tab.key,
                )
              }
            >
              {tab.label} ({tab.count})
            </button>
          ),
        )}

      </div>

      <div
        className="toolbar"
        style={{
          marginBottom:
            14,
        }}
      >

        <div
          style={{
            position:
              'relative',

            flex:
              1,

            maxWidth:
              360,
          }}
        >

          <Search
            size={15}
            style={{
              position:
                'absolute',

              left:
                10,

              top:
                '50%',

              transform:
                'translateY(-50%)',

              color:
                'var(--muted)',
            }}
          />

          <input
            placeholder="Tìm kiếm theo tên, mã đơn..."
            value={q}
            onChange={(e) =>
              setQ(
                e.target.value,
              )
            }
            style={{
              paddingLeft:
                32,

              width:
                '100%',

              border:
                '1px solid var(--line)',

              borderRadius:
                10,

              padding:
                '9px 12px 9px 32px',

              fontSize:
                13,
            }}
          />

        </div>

        <button
          type="button"
          className="btn ghost"
          onClick={() =>
            refreshBookings()
          }
        >
          <RefreshCw size={14} />
          Làm mới
        </button>

      </div>

      {filtered.map(
        (booking) => (

          <div
            key={booking.id}
            className={
              `booking-card ${CARD_CLS[booking.status] || ''}`
            }
          >

            <div className="booking-card-head">

              <div>

                <span
                  style={{
                    fontWeight:
                      700,

                    fontSize:
                      15,

                    marginRight:
                      10,
                  }}
                >
                  #{booking.id}
                </span>

                <span
                  className={
                    `badge ${STATUS_BADGE[booking.status] || 'badge-grey'}`
                  }
                >
                  {booking.statusLabel}
                </span>

              </div>

              <span
                className="muted"
                style={{
                  fontSize:
                    12,
                }}
              >
                Gửi lúc {booking.sentAt}
              </span>

            </div>

            <div
              style={{
                fontWeight:
                  600,

                fontSize:
                  14,

                marginBottom:
                  4,
              }}
            >
              {booking.title}
            </div>

            {booking.desc ? (

              <div
                style={{
                  fontSize:
                    13,

                  color:
                    'var(--muted)',

                  marginBottom:
                    8,

                  whiteSpace:
                    'pre-line',
                }}
              >
                {booking.desc}
              </div>

            ) : null}

            <div className="booking-meta">

              <span>
                <MapPin size={13} />
                {booking.location}
              </span>

              <span>
                🕐 {booking.time}
              </span>

            </div>

            <div className="booking-actions">

              <button
                type="button"
                className="btn ghost"
                style={{
                  fontSize:
                    13,
                }}
                onClick={() =>
                  showDetails(
                    booking,
                  )
                }
              >
                <Eye size={14} />
                Xem chi tiết
              </button>

              {booking.status ===
                'pending' &&
              canApprove ? (

                <button
                  type="button"
                  className="btn primary"
                  style={{
                    fontSize:
                      13,
                  }}
                  disabled={
                    busyId ===
                    booking.id
                  }
                  onClick={() =>
                    runAction(
                      booking.id,
                      approveBooking,
                      'Đã duyệt booking và tạo lịch hoạt động.',
                    )
                  }
                >
                  Duyệt đơn
                </button>

              ) : null}

              {booking.status ===
                'pending' &&
              canReject ? (

                <button
                  type="button"
                  className="btn"
                  style={{
                    fontSize:
                      13,

                    background:
                      '#fef2f2',

                    color:
                      'var(--danger)',

                    border:
                      '1px solid var(--danger)',
                  }}
                  disabled={
                    busyId ===
                    booking.id
                  }
                  onClick={() =>
                    runAction(
                      booking.id,
                      rejectBooking,
                      'Đã từ chối booking.',
                    )
                  }
                >
                  <X size={14} />
                  Từ chối
                </button>

              ) : null}

              {canCancel &&
              ![
                'rejected',
                'cancelled',
              ].includes(
                booking.status,
              ) ? (

                <button
                  type="button"
                  className="btn"
                  style={{
                    fontSize:
                      13,

                    background:
                      '#fef2f2',

                    color:
                      'var(--danger)',

                    border:
                      '1px solid var(--danger)',
                  }}
                  disabled={
                    busyId ===
                    booking.id
                  }
                  onClick={() => {

                    if (
                      !window.confirm(
                        `Hủy booking #${booking.id}?`,
                      )
                    ) {
                      return
                    }

                    runAction(
                      booking.id,
                      cancelBooking,
                      'Đã hủy booking.',
                    )
                  }}
                >
                  <X size={14} />
                  Hủy đơn
                </button>

              ) : null}

              {booking.status ===
                'approved' &&
              user.role ===
                'user' ? (

                <>

                  <button
                    type="button"
                    className="btn primary"
                    style={{
                      fontSize:
                        13,
                    }}
                    onClick={() =>
                      window.print()
                    }
                  >
                    <Download size={14} />
                    Giấy phép sử dụng (In/PDF)
                  </button>

                  <button
                    type="button"
                    className="btn ghost"
                    style={{
                      fontSize:
                        13,
                    }}
                    onClick={() =>
                      window.print()
                    }
                  >
                    <FileText size={14} />
                    In biên bản giao
                  </button>

                </>

              ) : null}

              {booking.status ===
                'rejected' &&
              user.role ===
                'user' ? (

                <button
                  type="button"
                  className="btn"
                  style={{
                    fontSize:
                      13,

                    background:
                      '#fff7ed',

                    color:
                      '#c2410c',

                    border:
                      '1px solid #fdba74',
                  }}
                  onClick={() =>
                    navigate(
                      `/booking/simple?hallId=${booking.hallId}`,
                    )
                  }
                >
                  <RefreshCw size={14} />
                  Đăng ký lại khung giờ khác
                </button>

              ) : null}

            </div>

          </div>
        ),
      )}

      {filtered.length ===
      0 ? (

        <div className="empty">
          <p>
            Không có đơn nào phù hợp.
          </p>
        </div>

      ) : null}

      <div
        className="card"
        style={{
          marginTop:
            8,

          display:
            'flex',

          justifyContent:
            'space-between',

          alignItems:
            'center',

          flexWrap:
            'wrap',

          gap:
            10,

          fontSize:
            13,
        }}
      >

        <span className="muted">
          Quy định xử lý hồ sơ thuê sân công vụ —
          Ban quản lý Nhà thi đấu Tỉnh.
        </span>

        <button
          type="button"
          className="btn ghost"
          style={{
            fontSize:
              13,
          }}
          onClick={() =>
            window.print()
          }
        >
          <Download size={14} />
          In / lưu PDF
        </button>

      </div>

    </>
  )
}