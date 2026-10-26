import {
  Fragment,
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  ChevronLeft,
  ChevronRight,
  Phone,
  X,
} from 'lucide-react'

import {
  useNavigate,
  useSearchParams,
} from 'react-router-dom'

import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { usePageMeta } from '../layouts/AppLayout'

const SESSIONS = [
  {
    label:
      'Sáng (06:00–12:00)',
    start:
      '06:00',
    end:
      '12:00',
  },

  {
    label:
      'Chiều (13:00–17:00)',
    start:
      '13:00',
    end:
      '17:00',
  },

  {
    label:
      'Tối (18:00–22:00)',
    start:
      '18:00',
    end:
      '22:00',
  },
]

const SLOT_LABELS = {
  free: {
    label: 'Trống',
    cls: 'slot-free',
  },

  approved: {
    label: 'Đã duyệt',
    cls: 'slot-approved',
  },

  pending: {
    label: 'Chờ duyệt',
    cls: 'slot-pending',
  },

  maintenance: {
    label: 'Bảo trì',
    cls: 'slot-maintenance',
  },

  overload: {
    label: 'Cảnh báo tải',
    cls: 'slot-overload',
  },
}

function pad(value) {
  return String(value)
    .padStart(
      2,
      '0',
    )
}

function toDateKey(date) {
  return (
    `${date.getFullYear()}-` +
    `${pad(
      date.getMonth() + 1,
    )}-` +
    `${pad(
      date.getDate(),
    )}`
  )
}

function startOfWeek(date) {
  const current =
    new Date(date)

  current.setHours(
    0,
    0,
    0,
    0,
  )

  const day =
    current.getDay() || 7

  current.setDate(
    current.getDate() -
      day +
      1,
  )

  return current
}

function addDays(
  date,
  amount,
) {
  const result =
    new Date(date)

  result.setDate(
    result.getDate() +
      amount,
  )

  return result
}

function weekNumber(date) {
  const target =
    new Date(
      Date.UTC(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
      ),
    )

  const day =
    target.getUTCDay() || 7

  target.setUTCDate(
    target.getUTCDate() +
      4 -
      day,
  )

  const yearStart =
    new Date(
      Date.UTC(
        target.getUTCFullYear(),
        0,
        1,
      ),
    )

  return Math.ceil(
    (
      (
        target -
        yearStart
      ) /
        86400000 +
      1
    ) /
      7,
  )
}

function overlaps(
  startA,
  endA,
  startB,
  endB,
) {
  return (
    startA < endB &&
    endA > startB
  )
}

function equipmentStatusLabel(
  status,
) {
  if (
    status ===
    'maintenance'
  ) {
    return {
      text:
        'Đang bảo trì',
      ok:
        false,
    }
  }

  if (
    status ===
    'inactive'
  ) {
    return {
      text:
        'Ngưng sử dụng',
      ok:
        false,
    }
  }

  return {
    text:
      'Hoạt động tốt',
    ok:
      true,
  }
}

export default function ScheduleView() {
  const setMeta =
    usePageMeta()

  const navigate =
    useNavigate()

  const { user } =
    useAuth()

  const {
    halls,
    equipment,
    schedules,
    bookings,
    predictions,
  } = useData()

  const [
    searchParams,
  ] =
    useSearchParams()

  const [
    view,
    setView,
  ] =
    useState('week')

  const [
    selectedSlot,
    setSelectedSlot,
  ] =
    useState(null)

  const [
    weekOffset,
    setWeekOffset,
  ] =
    useState(0)

  const [
    hallFilter,
    setHallFilter,
  ] =
    useState(
      searchParams.get(
        'hallId',
      ) || 'all',
    )

  useEffect(() => {

    setMeta({
      title:
        'Tra cứu lịch sử dụng',

      crumbs:
        'Lịch & đặt chỗ · Tra cứu',
    })

  }, [setMeta])

  const monday =
    useMemo(
      () => {

        const start =
          startOfWeek(
            new Date(),
          )

        return addDays(
          start,
          weekOffset * 7,
        )

      },
      [weekOffset],
    )

  const days =
    useMemo(
      () => {

        const labels = [
          'T2',
          'T3',
          'T4',
          'T5',
          'T6',
          'T7',
          'CN',
        ]

        return labels.map(
          (
            label,
            index,
          ) => {

            const dateObj =
              addDays(
                monday,
                index,
              )

            return {
              label,

              dateObj,

              key:
                toDateKey(
                  dateObj,
                ),

              date:
                `${pad(
                  dateObj.getDate(),
                )}/${pad(
                  dateObj.getMonth() +
                    1,
                )}`,
            }
          },
        )

      },
      [monday],
    )

  const visibleDays =
    view === 'day'
      ? [days[0]]
      : days

  const visibleHalls =
    hallFilter === 'all'
      ? halls
      : halls.filter(
          (hall) =>
            hall.id ===
            Number(
              hallFilter,
            ),
        )

  function getSlotStatus(
    hall,
    session,
    day,
  ) {

    if (
      hall.status !==
      'active'
    ) {
      return 'maintenance'
    }

    const slotStart =
      new Date(
        `${day.key}T${session.start}:00`,
      )

    const slotEnd =
      new Date(
        `${day.key}T${session.end}:00`,
      )

    const hasSchedule =
      schedules.some(
        (item) => {

          if (
            item.hallId !==
              hall.id ||
            item.status ===
              'CANCELLED'
          ) {
            return false
          }

          return overlaps(
            new Date(
              item.startTime,
            ),

            new Date(
              item.endTime,
            ),

            slotStart,
            slotEnd,
          )
        },
      )

    if (hasSchedule) {
      return 'approved'
    }

    const hasPendingBooking =
      bookings.some(
        (item) => {

          if (
            item.hallId !==
              hall.id ||
            item.status !==
              'PENDING'
          ) {
            return false
          }

          return overlaps(
            new Date(
              item.startTime,
            ),

            new Date(
              item.endTime,
            ),

            slotStart,
            slotEnd,
          )
        },
      )

    if (
      hasPendingBooking
    ) {
      return 'pending'
    }

    const highRisk =
      predictions.some(
        (item) =>
          item.hallId ===
            hall.id &&
          String(
            item.predictionDate,
          ).slice(
            0,
            10,
          ) ===
            day.key &&
          item.riskLevel ===
            'HIGH',
      )

    if (highRisk) {
      return 'overload'
    }

    return 'free'
  }

  const weeklyUsage =
    useMemo(
      () => {

        if (
          !visibleHalls.length
        ) {
          return 0
        }

        let occupied = 0
        let total = 0

        visibleHalls.forEach(
          (hall) => {

            SESSIONS.forEach(
              (session) => {

                days.forEach(
                  (day) => {

                    total += 1

                    const status =
                      getSlotStatus(
                        hall,
                        session,
                        day,
                      )

                    if (
                      status ===
                      'approved'
                    ) {
                      occupied += 1
                    }
                  },
                )
              },
            )
          },
        )

        return total
          ? (
              occupied /
              total
            ) *
              100
          : 0

      },
      [
        visibleHalls,
        days,
        schedules,
        bookings,
        predictions,
      ],
    )

  function handleSlotClick(
    hall,
    sessionIdx,
    day,
    status,
  ) {
    setSelectedSlot({
      hallId:
        hall.id,

      sessionIdx,

      day,

      status,
    })
  }

  const selectedHall =
    selectedSlot
      ? halls.find(
          (hall) =>
            hall.id ===
            selectedSlot.hallId,
        )
      : null

  const selectedEquipment =
    selectedHall
      ? equipment.filter(
          (item) =>
            item.hallId ===
              selectedHall.id ||
            item.hallId ==
              null,
        )
      : []

  const weekEnd =
    days[6]?.dateObj

  return (
    <>

      <div
        style={{
          marginBottom: 20,
        }}
      >

        <div
          style={{
            display:
              'flex',

            justifyContent:
              'space-between',

            alignItems:
              'flex-start',

            flexWrap:
              'wrap',

            gap:
              12,
          }}
        >

          <div>

            <h2
              style={{
                margin:
                  '0 0 4px',
              }}
            >
              Tra cứu lịch sử dụng &amp; Khung giờ khả dụng
            </h2>

            <p
              className="muted"
              style={{
                margin: 0,
                fontSize: 13,
              }}
            >
              Kiểm tra tình trạng vận hành,
              tải khán đài và bảo trì kỹ thuật
              trước khi tạo hồ sơ thuê sân.
            </p>

          </div>

          <span
            className="badge badge-success"
            style={{
              fontSize: 13,
              padding:
                '6px 14px',
            }}
          >
            Tỷ lệ sử dụng tuần này: {weeklyUsage.toFixed(1)}%
          </span>

        </div>

      </div>

      <div
        className="toolbar"
        style={{
          marginBottom: 14,
        }}
      >

        <select
          style={{
            minWidth: 220,
          }}
          value={
            hallFilter
          }
          onChange={(e) => {

            setHallFilter(
              e.target.value,
            )

            setSelectedSlot(
              null,
            )
          }}
        >

          <option value="all">
            Tất cả khu vực
          </option>

          {halls.map(
            (hall) => (
              <option
                key={hall.id}
                value={hall.id}
              >
                {hall.code} - {hall.name}
              </option>
            ),
          )}

        </select>

        <div className="week-nav">

          <button
            type="button"
            onClick={() =>
              setWeekOffset(
                (w) =>
                  w - 1,
              )
            }
          >
            <ChevronLeft
              size={14}
            />
          </button>

          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              padding:
                '0 4px',
            }}
          >
            Tuần {weekNumber(monday)}: {days[0]?.date} – {days[6]?.date}/{weekEnd?.getFullYear()}
          </span>

          <button
            type="button"
            onClick={() =>
              setWeekOffset(
                (w) =>
                  w + 1,
              )
            }
          >
            <ChevronRight
              size={14}
            />
          </button>

        </div>

        <div
          className="toggle-view"
          style={{
            marginLeft:
              'auto',
          }}
        >

          <button
            type="button"
            className={
              view === 'day'
                ? 'active'
                : ''
            }
            onClick={() =>
              setView('day')
            }
          >
            Ngày
          </button>

          <button
            type="button"
            className={
              view === 'week'
                ? 'active'
                : ''
            }
            onClick={() =>
              setView('week')
            }
          >
            Tuần (Chi tiết)
          </button>

        </div>

      </div>

      <div className="legend-bar">

        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color:
              'var(--muted)',
          }}
        >
          Chú giải:
        </span>

        {Object.entries(
          SLOT_LABELS,
        ).map(
          ([
            key,
            value,
          ]) => (

            <span
              key={key}
              className="legend-dot"
            >

              <span
                className={
                  value.cls
                }
                style={{
                  display:
                    'inline-block',

                  width:
                    12,

                  height:
                    12,

                  borderRadius:
                    3,
                }}
              />

              {value.label}

            </span>
          ),
        )}

      </div>

      <div
        style={{
          display:
            'grid',

          gridTemplateColumns:
            selectedSlot
              ? '1fr 320px'
              : '1fr',

          gap:
            16,
        }}
      >

        <div
          className="card"
          style={{
            padding: 12,
            overflowX:
              'auto',
          }}
        >

          <table className="schedule-grid">

            <thead>

              <tr>

                <th
                  style={{
                    minWidth: 130,
                  }}
                >
                  Hội trường / Khung giờ
                </th>

                {visibleDays.map(
                  (day) => (

                    <th key={day.key}>

                      {day.label}

                      <br />

                      <span
                        style={{
                          fontWeight:
                            400,

                          fontSize:
                            10,
                        }}
                      >
                        {day.date}
                      </span>

                    </th>
                  ),
                )}

              </tr>

            </thead>

            <tbody>

              {visibleHalls.map(
                (hall) => (

                  <Fragment
                    key={hall.id}
                  >

                    <tr>

                      <td
                        className="hall-label"
                        rowSpan={
                          SESSIONS.length +
                          1
                        }
                        style={{
                          verticalAlign:
                            'top',

                          paddingTop:
                            12,
                        }}
                      >

                        <div
                          style={{
                            fontWeight:
                              700,
                          }}
                        >
                          {hall.name}
                        </div>

                        <div
                          style={{
                            fontSize:
                              11,

                            color:
                              'var(--muted)',

                            marginTop:
                              2,
                          }}
                        >
                          {Number(
                            hall.capacity ||
                              0,
                          ).toLocaleString(
                            'vi-VN',
                          )}{' '}
                          chỗ
                        </div>

                      </td>

                    </tr>

                    {SESSIONS.map(
                      (
                        session,
                        sessionIdx,
                      ) => (

                        <tr
                          key={`${hall.id}-${sessionIdx}`}
                        >

                          {visibleDays.map(
                            (day) => {

                              const status =
                                getSlotStatus(
                                  hall,
                                  session,
                                  day,
                                )

                              const info =
                                SLOT_LABELS[
                                  status
                                ]

                              const isSelected =
                                selectedSlot &&
                                selectedSlot.hallId ===
                                  hall.id &&
                                selectedSlot.sessionIdx ===
                                  sessionIdx &&
                                selectedSlot.day.key ===
                                  day.key

                              return (

                                <td
                                  key={
                                    day.key
                                  }
                                  style={{
                                    padding:
                                      2,
                                  }}
                                >

                                  <div
                                    className={
                                      `slot-cell ${info.cls}`
                                    }
                                    onClick={() =>
                                      handleSlotClick(
                                        hall,
                                        sessionIdx,
                                        day,
                                        status,
                                      )
                                    }
                                    style={
                                      isSelected
                                        ? {
                                            outline:
                                              '2px solid var(--navy)',

                                            outlineOffset:
                                              -2,
                                          }
                                        : {}
                                    }
                                  >

                                    <span>
                                      {info.label}
                                    </span>

                                    <span
                                      style={{
                                        fontSize:
                                          10,

                                        fontWeight:
                                          400,
                                      }}
                                    >
                                      {session.start}
                                    </span>

                                  </div>

                                </td>
                              )
                            },
                          )}

                        </tr>
                      ),
                    )}

                  </Fragment>
                ),
              )}

            </tbody>

          </table>

          {visibleHalls.length ===
          0 ? (

            <p className="muted">
              Chưa có hội trường phù hợp.
            </p>

          ) : null}

        </div>

        {selectedSlot &&
        selectedHall ? (

          <div
            className="card slot-detail-panel"
            style={{
              padding: 16,
            }}
          >

            <div
              style={{
                display:
                  'flex',

                justifyContent:
                  'space-between',

                alignItems:
                  'center',

                marginBottom:
                  12,
              }}
            >

              <strong
                style={{
                  fontSize:
                    14,
                }}
              >
                Chi tiết khung giờ đã chọn
              </strong>

              <button
                type="button"
                className="icon-btn"
                onClick={() =>
                  setSelectedSlot(
                    null,
                  )
                }
                style={{
                  padding: 4,
                }}
              >
                <X size={16} />
              </button>

            </div>

            <img
              src={
                selectedHall.image
              }
              alt=""
              style={{
                width:
                  '100%',

                height:
                  120,

                objectFit:
                  'cover',

                borderRadius:
                  10,

                marginBottom:
                  12,
              }}
            />

            <div
              style={{
                fontSize: 13,
                marginBottom:
                  10,
              }}
            >

              <div
                style={{
                  fontWeight:
                    700,

                  marginBottom:
                    4,
                }}
              >
                {selectedHall.name}
              </div>

              <div className="muted">
                Mã khu vực: {selectedHall.code || `HALL-${selectedHall.id}`}
              </div>

              <div
                className="muted"
                style={{
                  marginTop:
                    2,
                }}
              >
                Thời gian: {SESSIONS[selectedSlot.sessionIdx].start}–
                {SESSIONS[selectedSlot.sessionIdx].end} —{' '}
                {selectedSlot.day.label}{' '}
                {selectedSlot.day.date}/
                {selectedSlot.day.dateObj.getFullYear()}
              </div>

              <div
                className="muted"
                style={{
                  marginTop:
                    2,
                }}
              >
                Địa điểm: {selectedHall.name}
              </div>

            </div>

            <div
              className="alert"
              style={{
                background:
                  '#f0fdf4',

                color:
                  '#15803d',

                marginBottom:
                  10,

                fontSize:
                  13,
              }}
            >

              <strong>
                Trạng thái:
              </strong>{' '}

              {SLOT_LABELS[selectedSlot.status].label}

              <br />

              Sức phục vụ:{' '}
              {Number(
                selectedHall.capacity ||
                  0,
              ).toLocaleString(
                'vi-VN',
              )}{' '}
              chỗ

            </div>

            <div
              style={{
                marginBottom:
                  12,
              }}
            >

              <div
                style={{
                  fontSize:
                    12,

                  fontWeight:
                    700,

                  color:
                    'var(--muted)',

                  marginBottom:
                    8,
                }}
              >
                TRANG THIẾT BỊ HIỆN CÓ
              </div>

              {selectedEquipment.length
                ? selectedEquipment.map(
                    (item) => {

                      const info =
                        equipmentStatusLabel(
                          item.status,
                        )

                      return (

                        <div
                          key={
                            item.id
                          }
                          style={{
                            display:
                              'flex',

                            justifyContent:
                              'space-between',

                            gap:
                              8,

                            fontSize:
                              12,

                            padding:
                              '5px 0',

                            borderBottom:
                              '1px solid var(--line)',
                          }}
                        >

                          <span>
                            {item.name}
                          </span>

                          <span
                            style={{
                              color:
                                info.ok
                                  ? '#15803d'
                                  : '#d97706',

                              fontWeight:
                                600,
                            }}
                          >
                            {info.text}
                          </span>

                        </div>
                      )
                    },
                  )
                : (
                    <div
                      className="muted"
                      style={{
                        fontSize:
                          12,
                      }}
                    >
                      Chưa có thiết bị được khai báo.
                    </div>
                  )}

            </div>

            <button
              type="button"
              className="btn primary"
              style={{
                width:
                  '100%',

                justifyContent:
                  'center',
              }}
              disabled={
                user.role !==
                  'user' ||
                ![
                  'free',
                  'overload',
                ].includes(
                  selectedSlot.status,
                )
              }
              onClick={() => {

                const session =
                  SESSIONS[
                    selectedSlot.sessionIdx
                  ]

                navigate(
                  `/booking/simple?hallId=${selectedHall.id}&date=${selectedSlot.day.key}&start=${session.start}&end=${session.end}`,
                )
              }}
            >
              Đăng ký khung giờ này →
            </button>

          </div>

        ) : null}

      </div>

      <div
        className="card"
        style={{
          marginTop: 8,

          display:
            'flex',

          justifyContent:
            'space-between',

          alignItems:
            'center',

          flexWrap:
            'wrap',

          gap:
            12,
        }}
      >

        <div
          style={{
            fontSize: 13,
            color:
              'var(--muted)',
          }}
        >

          <strong
            style={{
              color:
                'var(--text)',
            }}
          >
            Liên hệ Ban Quản lý Nhà thi đấu Tỉnh
          </strong>

          <br />

          Địa chỉ: 123 Đường Thể Thao,
          Phường 5, TP. Tỉnh lỵ

        </div>

        <button
          type="button"
          className="btn primary"
          style={{
            gap: 8,
          }}
        >
          <Phone size={15} />
          Đường dây nóng: 0280.3855.999
        </button>

      </div>

    </>
  )
}