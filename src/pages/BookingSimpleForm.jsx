import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  Lock,
  Save,
  Send,
  X,
} from 'lucide-react'

import {
  useNavigate,
  useSearchParams,
} from 'react-router-dom'

import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { usePageMeta } from '../layouts/AppLayout'

const EVENT_TYPES = [
  'Giải thi đấu chính thức',
  'Tập huấn đội tuyển',
  'Giao hữu / Giao lưu',
  'Hội nghị / Họp mặt',
  'Sự kiện cộng đồng',
]

const DRAFT_KEY =
  'arenasp-booking-draft'

function minutesBetween(
  start,
  end,
) {
  if (
    !start ||
    !end ||
    end <= start
  ) {
    return 0
  }

  const [
    sh,
    sm,
  ] =
    start
      .split(':')
      .map(Number)

  const [
    eh,
    em,
  ] =
    end
      .split(':')
      .map(Number)

  return (
    eh * 60 +
    em -
    (
      sh * 60 +
      sm
    )
  )
}

function formatDuration(
  minutes,
) {
  if (!minutes) {
    return 'Chưa xác định'
  }

  const hours =
    Math.floor(
      minutes / 60,
    )

  const mins =
    minutes % 60

  if (!mins) {
    return `${hours} tiếng`
  }

  if (!hours) {
    return `${mins} phút`
  }

  return `${hours} tiếng ${mins} phút`
}

function addMinutesToTime(time, minutes) {
  if (!time) {
    return ''
  }

  const [hour, minute] = time
    .split(':')
    .map(Number)

  const total =
    hour * 60 +
    minute +
    minutes

  if (total >= 24 * 60) {
    return '23:59'
  }

  const newHour =
    Math.floor(
      total / 60,
    )

  const newMinute =
    total % 60

  return `${String(newHour).padStart(2, '0')}:${String(newMinute).padStart(2, '0')}`
}

export default function BookingSimpleForm() {
  const setMeta =
    usePageMeta()

  const navigate =
    useNavigate()

  const [
    searchParams,
  ] =
    useSearchParams()

  const { user } =
    useAuth()

  const {
    halls,
    equipment:
      equipmentRows,
    createBooking,
  } = useData()

  const [
    form,
    setForm,
  ] =
    useState(
      () => {

        let draft = {}

        try {

          draft =
            JSON.parse(
              localStorage.getItem(
                DRAFT_KEY,
              ) || '{}',
            )

        } catch {

          draft = {}
        }

        return {
          representative:
            draft.representative ||
            user.name ||
            '',

          phone:
            draft.phone ||
            user.phone ||
            '',

          email:
            draft.email ||
            user.email ||
            '',

          eventType:
            draft.eventType ||
            EVENT_TYPES[0],

          title:
            draft.title ||
            '',

          expectedPeople:
            draft.expectedPeople ||
            '',

          note:
            draft.note ||
            '',

          hallId:
            searchParams.get(
              'hallId',
            ) ||
            draft.hallId ||
            '',

          date:
            searchParams.get(
              'date',
            ) ||
            draft.date ||
            '',

          start:
            searchParams.get(
              'start',
            ) ||
            draft.start ||
            '',

          end:
            searchParams.get(
              'end',
            ) ||
            draft.end ||
            '',
        }
      },
    )

  const [
    selectedEquipment,
    setSelectedEquipment,
  ] =
    useState({})

  const [
    agreed,
    setAgreed,
  ] =
    useState(false)

  const [
    draftSavedAt,
    setDraftSavedAt,
  ] =
    useState('')

  const [
    submitting,
    setSubmitting,
  ] =
    useState(false)

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
        'Đăng ký sử dụng hội trường',

      crumbs:
        'Trang chủ · Đăng ký thuê sân',
    })

  }, [setMeta])

  useEffect(() => {

    if (
      !form.hallId &&
      halls.length
    ) {

      const activeHall =
        halls.find(
          (hall) =>
            hall.status ===
            'active',
        )

      setForm(
        (current) => ({
          ...current,

          hallId:
            String(
              activeHall?.id ||
              halls[0].id,
            ),
        }),
      )
    }

  }, [
    halls,
    form.hallId,
  ])

  const selectedHall =
    halls.find(
      (hall) =>
        hall.id ===
        Number(
          form.hallId,
        ),
    )

  const availableEquipment =
    useMemo(
      () => {

        if (!form.hallId) {
          return []
        }

        const hallId =
          Number(
            form.hallId,
          )

        return equipmentRows.filter(
          (item) =>
            item.hallId ===
              hallId ||
            item.hallId ==
              null,
        )

      },
      [
        equipmentRows,
        form.hallId,
      ],
    )

  useEffect(() => {

    setSelectedEquipment(
      (current) => {

        const next = {}

        availableEquipment.forEach(
          (item) => {

            next[item.id] =
              current[item.id] ??
              item.status ===
                'active'
          },
        )

        return next
      },
    )

  }, [availableEquipment])

  const duration =
    minutesBetween(
      form.start,
      form.end,
    )

  const invalidTime =
    Boolean(
      form.start &&
      form.end,
    ) &&
    form.end <= form.start

  const minimumEndTime =
    form.start
      ? addMinutesToTime(
          form.start,
          1,
        )
      : ''

  function handleStartTimeChange(value) {

    setForm(
      (current) => {

        let nextEnd =
          current.end

        if (
          !nextEnd ||
          nextEnd <= value
        ) {

          nextEnd =
            addMinutesToTime(
              value,
              60,
            )
        }

        return {
          ...current,
          start: value,
          end: nextEnd,
        }
      },
    )

    setError('')
  }

  function setField(
    key,
    value,
  ) {

    setForm(
      (current) => ({
        ...current,
        [key]:
          value,
      }),
    )
  }

  function toggleEq(id) {

    setSelectedEquipment(
      (prev) => ({
        ...prev,
        [id]:
          !prev[id],
      }),
    )
  }

  function saveDraft() {

    localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify(
        form,
      ),
    )

    setDraftSavedAt(
      new Date()
        .toLocaleTimeString(
          'vi-VN',
          {
            hour:
              '2-digit',

            minute:
              '2-digit',
          },
        ),
    )

    setOk(
      'Đã lưu bản nháp trên trình duyệt.',
    )

    setError('')
  }

  async function submitBooking() {

    setOk('')
    setError('')

    if (!form.hallId) {
      setError(
        'Vui lòng chọn Hội trường / Sân ở Phần B.',
      )

      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      })

      return
    }

    if (!form.title.trim()) {
      setError(
        'Vui lòng nhập "Tên sự kiện dự kiến" ở Phần A.',
      )

      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      })

      return
    }

    if (!form.date) {
      setError(
        'Vui lòng chọn "Ngày sử dụng" ở Phần B.',
      )

      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      })

      return
    }

    if (!form.start) {
      setError(
        'Vui lòng chọn "Giờ bắt đầu" ở Phần B.',
      )

      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      })

      return
    }

    if (!form.end) {
      setError(
        'Vui lòng chọn "Giờ kết thúc" ở Phần B.',
      )

      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      })

      return
    }

    if (
      form.end <=
      form.start
    ) {

      setError(
        'Giờ kết thúc phải lớn hơn giờ bắt đầu.',
      )

      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      })

      return
    }

    if (!agreed) {

      setError(
        'Vui lòng tích chọn ô "Tôi đã đọc và đồng ý với các điều khoản sử dụng hội trường" ở cuối trang.',
      )

      return
    }

    if (
      !selectedHall ||
      selectedHall.status !==
        'active'
    ) {

      setError(
        'Hội trường hiện không hoạt động hoặc đang bảo trì.',
      )

      return
    }

    const equipmentNames =
      availableEquipment
        .filter(
          (item) =>
            selectedEquipment[
              item.id
            ],
        )
        .map(
          (item) =>
            item.name,
        )

    const noteParts = [
      `Loại sự kiện: ${form.eventType}`,

      form.representative
        ? `Người liên hệ: ${form.representative}`
        : '',

      form.phone
        ? `Điện thoại: ${form.phone}`
        : '',

      form.email
        ? `Email: ${form.email}`
        : '',

      form.expectedPeople
        ? `Số người dự kiến: ${form.expectedPeople}`
        : '',

      equipmentNames.length
        ? `Thiết bị yêu cầu: ${equipmentNames.join(', ')}`
        : '',

      form.note
        ? `Ghi chú: ${form.note}`
        : '',

    ].filter(Boolean)

    try {

      setSubmitting(true)

      await createBooking({
        hallId:
          Number(
            form.hallId,
          ),

        title:
          form.title.trim(),

        startTime:
          `${form.date}T${form.start}:00`,

        endTime:
          `${form.date}T${form.end}:00`,

        note:
          noteParts.join(
            '\n',
          ) ||
          null,
      })

      localStorage.removeItem(
        DRAFT_KEY,
      )

      setOk(
        'Gửi đăng ký thành công. Hồ sơ đang ở trạng thái chờ duyệt.',
      )

      setTimeout(
        () => {

          navigate(
            '/my-bookings',
          )

        },
        700,
      )

    } catch (err) {

      setError(
        err.message,
      )

    } finally {

      setSubmitting(false)
    }
  }

  return (
    <>

      <div
        style={{
          display:
            'flex',

          justifyContent:
            'space-between',

          alignItems:
            'flex-start',

          marginBottom:
            16,

          flexWrap:
            'wrap',

          gap:
            10,
        }}
      >

        <div>

          <div
            style={{
              display:
                'flex',

              gap:
                10,

              alignItems:
                'center',

              flexWrap:
                'wrap',

              marginBottom:
                4,
            }}
          >

            <h2
              style={{
                margin: 0,
              }}
            >
              Đăng ký sử dụng hội trường
            </h2>

            <span
              className="badge"
              style={{
                background:
                  '#f0fdf4',

                color:
                  '#15803d',

                border:
                  '1px solid #86efac',
              }}
            >
              Biểu mẫu số 04-BQL
            </span>

          </div>

          <p
            className="muted"
            style={{
              margin: 0,
              fontSize: 13,
            }}
          >
            Yêu cầu sẽ ở trạng thái{' '}
            <strong>
              Chờ duyệt
            </strong>{' '}
            cho đến khi ban quản lý
            xác nhận và ký duyệt.
          </p>

        </div>

        <div
          style={{
            textAlign:
              'right',
          }}
        >

          <div
            style={{
              fontSize:
                12,

              color:
                'var(--muted)',

              fontWeight:
                600,
            }}
          >
            HẠN MỨC TIẾP NHẬN
          </div>

          <div
            style={{
              fontSize:
                13,

              fontWeight:
                700,

              color:
                '#d97706',
            }}
          >
            Tối thiểu trước 72 giờ
          </div>

        </div>

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

      <div
        className="grid-2"
        style={{
          gridTemplateColumns:
            '1.2fr 1fr',

          gap:
            16,
        }}
      >

        <div>

          <div className="form-section">

            <div className="form-section-title">

              <span
                style={{
                  background:
                    'var(--navy)',

                  color:
                    '#fff',

                  borderRadius:
                    6,

                  padding:
                    '2px 8px',

                  fontSize:
                    11,
                }}
              >
                PHẦN A
              </span>

              01 – Thông tin Đơn vị &amp; Sự kiện

            </div>

            <div className="form-row">

              <label>
                Tên tổ chức / Đơn vị{' '}
                <span
                  style={{
                    color:
                      'var(--danger)',
                  }}
                >
                  *
                </span>
              </label>

              <div
                style={{
                  position:
                    'relative',
                }}
              >

                <input
                  value={
                    user.name ||
                    ''
                  }
                  disabled
                  style={{
                    paddingRight:
                      36,
                  }}
                />

                <Lock
                  size={14}
                  style={{
                    position:
                      'absolute',

                    right:
                      12,

                    top:
                      '50%',

                    transform:
                      'translateY(-50%)',

                    color:
                      'var(--muted)',
                  }}
                />

              </div>

              <div
                style={{
                  display:
                    'flex',

                  alignItems:
                    'center',

                  gap:
                    8,

                  marginTop:
                    6,
                }}
              >

                <span
                  className="muted"
                  style={{
                    fontSize:
                      12,
                  }}
                >
                  Thông tin lấy từ tài khoản đang đăng nhập.
                </span>

                <span
                  className="badge badge-success"
                  style={{
                    fontSize:
                      11,
                  }}
                >
                  Đã xác thực
                </span>

              </div>

            </div>

            <div className="grid-2">

              <div className="form-row">

                <label>
                  Người đại diện liên hệ
                </label>

                <input
                  value={
                    form.representative
                  }
                  onChange={(e) =>
                    setField(
                      'representative',
                      e.target.value,
                    )
                  }
                />

              </div>

              <div className="form-row">

                <label>
                  Số điện thoại
                </label>

                <input
                  value={
                    form.phone
                  }
                  onChange={(e) =>
                    setField(
                      'phone',
                      e.target.value,
                    )
                  }
                />

              </div>

            </div>

            <p
              className="muted"
              style={{
                fontSize:
                  12,

                color:
                  'var(--danger)',

                marginTop:
                  -8,

                marginBottom:
                  12,
              }}
            >
              Nhập chính xác để Ban quản lý
              có thể liên hệ khi cần xác minh hồ sơ.
            </p>

            <div className="form-row">

              <label>
                Email tiếp nhận công văn / thông báo
              </label>

              <input
                type="email"
                value={
                  form.email
                }
                onChange={(e) =>
                  setField(
                    'email',
                    e.target.value,
                  )
                }
              />

              <div className="note">
                Thông tin này được đính kèm trong ghi chú booking để Ban quản lý tham khảo.
              </div>

            </div>

            <div className="form-row">

              <label>
                Loại hình sự kiện{' '}
                <span
                  style={{
                    color:
                      'var(--danger)',
                  }}
                >
                  *
                </span>
              </label>

              <select
                value={
                  form.eventType
                }
                onChange={(e) =>
                  setField(
                    'eventType',
                    e.target.value,
                  )
                }
              >

                {EVENT_TYPES.map(
                  (type) => (
                    <option key={type}>
                      {type}
                    </option>
                  ),
                )}

              </select>

            </div>

            <div className="form-row">

              <label>
                Tên sự kiện dự kiến{' '}
                <span
                  style={{
                    color:
                      'var(--danger)',
                  }}
                >
                  *
                </span>
              </label>

              <input
                value={
                  form.title
                }
                onChange={(e) =>
                  setField(
                    'title',
                    e.target.value,
                  )
                }
              />

            </div>

            <div className="form-row">

              <label>
                Số lượng người dự kiến{' '}
                <span
                  style={{
                    color:
                      'var(--danger)',
                  }}
                >
                  *
                </span>
              </label>

              <div
                style={{
                  display:
                    'flex',

                  gap:
                    8,

                  alignItems:
                    'center',
                }}
              >

                <input
                  type="number"
                  min="1"
                  value={
                    form.expectedPeople
                  }
                  onChange={(e) =>
                    setField(
                      'expectedPeople',
                      e.target.value,
                    )
                  }
                  style={{
                    maxWidth:
                      120,
                  }}
                />

                <span
                  className="muted"
                  style={{
                    fontSize:
                      13,
                  }}
                >
                  người
                </span>

              </div>

            </div>

            <div
              style={{
                fontSize:
                  12,

                color:
                  'var(--muted)',

                margin:
                  '4px 0 12px',

                fontStyle:
                  'italic',
              }}
            >
              💾 {draftSavedAt
                ? `Bản nháp đã lưu lúc ${draftSavedAt}`
                : 'Bạn có thể lưu bản nháp trên trình duyệt.'}
            </div>

            <div className="form-row">

              <label>
                Ghi chú bổ sung
              </label>

              <textarea
                rows={3}
                value={
                  form.note
                }
                onChange={(e) =>
                  setField(
                    'note',
                    e.target.value,
                  )
                }
              />

            </div>

            <label className="check">

              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) =>
                  setAgreed(
                    e.target.checked,
                  )
                }
              />

              <span>
                Tôi đã đọc và đồng ý với các điều khoản sử dụng hội trường{' '}
                <span
                  style={{
                    color:
                      'var(--danger)',
                  }}
                >
                  *
                </span>
              </span>

            </label>

          </div>

        </div>

        <div>

          <div className="form-section">

            <div className="form-section-title">

              <span
                style={{
                  background:
                    '#d97706',

                  color:
                    '#fff',

                  borderRadius:
                    6,

                  padding:
                    '2px 8px',

                  fontSize:
                    11,
                }}
              >
                PHẦN B
              </span>

              02 – Địa điểm, Thời gian &amp; Thiết bị

            </div>

            <div className="form-row">

              <label>
                Chọn Hội trường / Sân{' '}
                <span
                  style={{
                    color:
                      'var(--danger)',
                  }}
                >
                  *
                </span>
              </label>

              <select
                value={
                  form.hallId
                }
                onChange={(e) =>
                  setField(
                    'hallId',
                    e.target.value,
                  )
                }
              >

                <option value="">
                  -- Chọn hội trường --
                </option>

                {halls.map(
                  (hall) => (

                    <option
                      key={
                        hall.id
                      }
                      value={
                        hall.id
                      }
                      disabled={
                        hall.status !==
                        'active'
                      }
                    >
                      {hall.code} - {hall.name} (Sức chứa {Number(hall.capacity || 0).toLocaleString('vi-VN')} chỗ)
                    </option>
                  ),
                )}

              </select>

            </div>

            <div className="form-row">

              <label>
                Ngày sử dụng{' '}
                <span
                  style={{
                    color:
                      'var(--danger)',
                  }}
                >
                  *
                </span>
              </label>

              <input
                type="date"
                value={
                  form.date
                }
                onChange={(e) =>
                  setField(
                    'date',
                    e.target.value,
                  )
                }
              />

            </div>

            <div className="grid-2">

              <div className="form-row">

                <label>
                  Giờ bắt đầu
                </label>

                <input
                  type="time"
                  value={
                    form.start
                  }
                  onChange={(e) =>
                    handleStartTimeChange(
                      e.target.value,
                    )
                  }
                />

              </div>

              <div className="form-row">

                <label>
                  Giờ kết thúc
                </label>

                <input
                  type="time"
                  value={
                    form.end
                  }
                  min={minimumEndTime}
                  onChange={(e) => {

                    setField(
                      'end',
                      e.target.value,
                    )

                    setError('')
                  }}
                />

              </div>

            </div>

            <div
              style={{
                marginBottom:
                  12,
              }}
            >

              {invalidTime ? (
                <span
                  className="badge"
                  style={{
                    background:
                      '#fef2f2',

                    color:
                      '#dc2626',

                    border:
                      '1px solid #fecaca',
                  }}
                >
                  ⚠️ Thời gian không hợp lệ: giờ kết thúc phải sau giờ bắt đầu.
                </span>
              ) : (
                <span className="badge badge-success">
                  Thời lượng: {formatDuration(duration)}
                </span>
              )}

              <p
                className="muted"
                style={{
                  fontSize:
                    12,

                  marginTop:
                    6,
                }}
              >
                Backend sẽ kiểm tra trùng lịch
                và trạng thái hội trường trước
                khi tiếp nhận yêu cầu.
              </p>

            </div>

            <div
              style={{
                background:
                  '#f0fdf4',

                border:
                  '1px solid #86efac',

                borderRadius:
                  10,

                padding:
                  '12px 14px',

                marginBottom:
                  16,
              }}
            >

              <div
                style={{
                  fontWeight:
                    700,

                  color:
                    '#15803d',

                  fontSize:
                    13,

                  marginBottom:
                    4,
                }}
              >
                CHÍNH SÁCH ĐƠN GIÁ NHÀ NƯỚC
              </div>

              <div
                style={{
                  fontSize:
                    13,

                  color:
                    '#166534',
                }}
              >
                Liên hệ Ban quản lý để được tư vấn mức phí phù hợp theo quy định hiện hành của UBND Tỉnh.
              </div>

            </div>

            <div
              style={{
                marginBottom:
                  16,
              }}
            >

              <div
                style={{
                  fontSize:
                    13,

                  fontWeight:
                    700,

                  marginBottom:
                    10,
                }}
              >
                Danh mục trang thiết bị yêu cầu đi kèm
              </div>

              {availableEquipment.length
                ? availableEquipment.map(
                    (eq) => (

                      <label
                        key={
                          eq.id
                        }
                        className="check"
                        style={{
                          display:
                            'flex',

                          marginBottom:
                            10,

                          alignItems:
                            'center',
                        }}
                      >

                        <input
                          type="checkbox"
                          checked={
                            Boolean(
                              selectedEquipment[
                                eq.id
                              ],
                            )
                          }
                          disabled={
                            eq.status !==
                            'active'
                          }
                          onChange={() =>
                            toggleEq(
                              eq.id,
                            )
                          }
                        />

                        <span
                          style={{
                            fontSize:
                              13,
                          }}
                        >
                          {eq.name}{' '}

                          {eq.quantity
                            ? `(SL: ${eq.quantity})`
                            : ''}

                          {eq.status !==
                          'active'
                            ? ' — không khả dụng'
                            : ''}
                        </span>

                      </label>
                    ),
                  )
                : (
                    <p
                      className="muted"
                      style={{
                        fontSize:
                          12,
                      }}
                    >
                      Chưa có thiết bị được khai báo cho khu vực này.
                    </p>
                  )}

            </div>

            {error ? (
              <div
                style={{
                  color:
                    '#dc2626',

                  fontSize:
                    13,

                  fontWeight:
                    600,

                  marginBottom:
                    10,

                  textAlign:
                    'right',

                  background:
                    '#fef2f2',

                  border:
                    '1px solid #fecaca',

                  padding:
                    '8px 12px',

                  borderRadius:
                    8,
                }}
              >
                ⚠️ {error}
              </div>
            ) : null}

            <div
              style={{
                display:
                  'flex',

                gap:
                  8,

                justifyContent:
                  'flex-end',

                flexWrap:
                  'wrap',
              }}
            >

              <button
                type="button"
                className="btn ghost"
                onClick={() =>
                  navigate(
                    '/portal',
                  )
                }
              >
                <X size={14} />
                Hủy bỏ
              </button>

              <button
                type="button"
                className="btn ghost"
                onClick={
                  saveDraft
                }
              >
                <Save size={14} />
                Lưu bản nháp
              </button>

              <button
                type="button"
                className="btn primary"
                disabled={
                  submitting ||
                  invalidTime
                }
                onClick={
                  submitBooking
                }
              >
                <Send size={14} />

                {submitting
                  ? 'Đang gửi...'
                  : 'Gửi đăng ký sử dụng'}
              </button>

            </div>

          </div>

          <div
            className="card"
            style={{
              fontSize:
                12,

              color:
                'var(--muted)',

              padding:
                14,
            }}
          >
            <strong
              style={{
                color:
                  'var(--text)',
              }}
            >
              Thông tin xử lý:
            </strong>{' '}

            Booking được gửi trực tiếp đến FastAPI
            và lưu vào MySQL với trạng thái PENDING.
            Ban quản lý có thể duyệt, từ chối hoặc
            hủy theo phân quyền.
          </div>

        </div>

      </div>

    </>
  )
}