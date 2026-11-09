import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, ChevronDown, Save, Send, X } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { usePageMeta } from '../layouts/AppLayout'

const DRAFT_KEY = 'arenasp-advanced-booking-draft'

const TIME_SLOTS = [
  { start: '06:00', end: '08:30' },
  { start: '08:30', end: '10:30' },
  { start: '10:30', end: '12:30' },
  { start: '14:00', end: '16:00' },
  { start: '16:00', end: '18:00' },
  { start: '18:00', end: '20:00' },
]

const EVENT_TYPES = [
  { value: 'competition', label: 'Giải thi đấu thể thao' },
  { value: 'training', label: 'Tập huấn' },
  { value: 'friendly', label: 'Giao hữu / Giao lưu' },
  { value: 'conference', label: 'Hội nghị / Họp mặt' },
  { value: 'other', label: 'Khác' },
]

function parseDateTime(date, time) {
  if (!date || !time) return null
  return new Date(`${date}T${time}:00`)
}

function overlaps(startA, endA, startB, endB) {
  return startA < endB && endA > startB
}

function getLocalDate() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function getPredictionUsage(item) {
  return Number(
    item?.predictedUsage ??
      item?.utilizationRate ??
      item?.predicted_usage ??
      item?.utilization_rate ??
      0,
  )
}

function getPredictionRisk(item) {
  return (
    item?.riskLevel ??
    item?.warningLevel ??
    item?.risk_level ??
    item?.warning_level ??
    'LOW'
  )
}

function getRecommendedTime(item) {
  return (
    item?.recommendedTime ??
    item?.recommended_time ??
    item?.recommendedSlot ??
    item?.recommended_slot ??
    ''
  )
}

function riskLabel(value) {
  switch (String(value || '').toUpperCase()) {
    case 'HIGH':
      return 'Cao'

    case 'MEDIUM':
      return 'Trung bình'

    default:
      return 'Thấp'
  }
}

export default function BookingForm() {
  const setMeta = usePageMeta()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()

  const {
    halls,
    equipment,
    schedules,
    bookings,
    predictions,
    createBooking,
    runPrediction,
  } = useData()

  const [form, setForm] = useState(() => {
    let draft = {}

    try {
      draft = JSON.parse(
        localStorage.getItem(DRAFT_KEY) || '{}',
      )
    } catch {
      draft = {}
    }

    return {
      organization: draft.organization || '',
      taxId: draft.taxId || '',
      managementLevel:
        draft.managementLevel || 'Liên đoàn / CLB Tỉnh',

      representative:
        draft.representative ||
        user?.fullName ||
        user?.name ||
        '',

      phone:
        draft.phone ||
        user?.phone ||
        '',

      title:
        draft.title || '',

      eventType:
        draft.eventType || 'competition',

      expectedPeople:
        draft.expectedPeople || '',

      hallId:
        searchParams.get('hallId') ||
        draft.hallId ||
        '',

      date:
        draft.date || '',

      start:
        draft.start || '',

      end:
        draft.end || '',

      note:
        draft.note || '',
    }
  })

  const [
    selectedEquipment,
    setSelectedEquipment,
  ] = useState({})

  const [
    showFactors,
    setShowFactors,
  ] = useState(false)

  const [
    checkedSafety,
    setCheckedSafety,
  ] = useState(false)

  const [
    checkedFire,
    setCheckedFire,
  ] = useState(false)

  const [
    checkedRF,
    setCheckedRF,
  ] = useState(true)

  const [
    predictionResult,
    setPredictionResult,
  ] = useState(null)

  const [
    predicting,
    setPredicting,
  ] = useState(false)

  const [
    submitting,
    setSubmitting,
  ] = useState(false)

  const [
    message,
    setMessage,
  ] = useState('')

  const [
    error,
    setError,
  ] = useState('')

  useEffect(() => {
    setMeta({
      title: 'Hồ sơ đăng ký thuê hội trường',
      crumbs:
        'Trang chủ · Điều phối thể chế · Đăng ký hội trường',
    })
  }, [setMeta])

  useEffect(() => {
    if (!user) return

    setForm((current) => ({
      ...current,

      representative:
        current.representative ||
        user.fullName ||
        user.name ||
        '',

      phone:
        current.phone ||
        user.phone ||
        '',
    }))
  }, [user])

  useEffect(() => {
    if (
      form.hallId ||
      !halls.length
    ) {
      return
    }

    const activeHall =
      halls.find(
        (hall) =>
          hall.status === 'active',
      )

    if (!activeHall) return

    setForm((current) => ({
      ...current,

      hallId:
        String(activeHall.id),
    }))
  }, [
    halls,
    form.hallId,
  ])

  const selectedHall =
    useMemo(
      () =>
        halls.find(
          (hall) =>
            Number(hall.id) ===
            Number(form.hallId),
        ),
      [
        halls,
        form.hallId,
      ],
    )

  const hallEquipment =
    useMemo(
      () => {
        if (!form.hallId) {
          return []
        }

        return equipment.filter(
          (item) =>
            item.hallId == null ||
            Number(item.hallId) ===
              Number(form.hallId),
        )
      },
      [
        equipment,
        form.hallId,
      ],
    )

  useEffect(() => {
    setSelectedEquipment(
      (current) => {
        const next = {}

        hallEquipment.forEach(
          (item) => {
            next[item.id] =
              Boolean(
                current[item.id],
              )
          },
        )

        return next
      },
    )
  }, [hallEquipment])

  const savedPrediction =
    useMemo(
      () => {
        if (
          !form.hallId ||
          !form.date
        ) {
          return null
        }

        return (
          predictions.find(
            (item) => {
              const predictionHallId =
                item.hallId ??
                item.hall_id ??
                item.hall?.id

              const predictionDate =
                String(
                  item.predictionDate ??
                    item.prediction_date ??
                    item.date ??
                    '',
                ).slice(0, 10)

              return (
                Number(
                  predictionHallId,
                ) ===
                  Number(
                    form.hallId,
                  ) &&
                predictionDate ===
                  form.date
              )
            },
          ) || null
        )
      },
      [
        predictions,
        form.hallId,
        form.date,
      ],
    )

  const activePrediction =
    predictionResult ||
    savedPrediction

  useEffect(() => {
    setPredictionResult(null)
  }, [
    form.hallId,
    form.date,
  ])

  const slotRows =
    useMemo(
      () => {
        return TIME_SLOTS.map(
          (slot) => {
            const selected =
              form.start ===
                slot.start &&
              form.end ===
                slot.end

            if (
              !form.hallId ||
              !form.date
            ) {
              return {
                ...slot,

                selected,

                status:
                  selected
                    ? 'selected'
                    : 'available',

                label:
                  selected
                    ? 'Đang chọn'
                    : 'Khả dụng',
              }
            }

            const slotStart =
              parseDateTime(
                form.date,
                slot.start,
              )

            const slotEnd =
              parseDateTime(
                form.date,
                slot.end,
              )

            const hallId =
              Number(
                form.hallId,
              )

            const scheduleConflict =
              schedules.some(
                (item) => {
                  const itemHallId =
                    Number(
                      item.hallId ??
                        item.hall_id,
                    )

                  const itemStatus =
                    String(
                      item.status ||
                        '',
                    ).toUpperCase()

                  if (
                    itemHallId !==
                      hallId ||
                    itemStatus ===
                      'CANCELLED'
                  ) {
                    return false
                  }

                  const start =
                    new Date(
                      item.startTime ??
                        item.start_time,
                    )

                  const end =
                    new Date(
                      item.endTime ??
                        item.end_time,
                    )

                  if (
                    Number.isNaN(
                      start.getTime(),
                    ) ||
                    Number.isNaN(
                      end.getTime(),
                    )
                  ) {
                    return false
                  }

                  return overlaps(
                    slotStart,
                    slotEnd,
                    start,
                    end,
                  )
                },
              )

            if (
              scheduleConflict
            ) {
              return {
                ...slot,

                selected: false,

                status:
                  'danger',

                label:
                  'Đã có lịch',
              }
            }

            const bookingConflict =
              bookings.some(
                (item) => {
                  const itemHallId =
                    Number(
                      item.hallId ??
                        item.hall_id,
                    )

                  const itemStatus =
                    String(
                      item.status ||
                        '',
                    ).toUpperCase()

                  if (
                    itemHallId !==
                      hallId ||
                    ![
                      'PENDING',
                      'APPROVED',
                    ].includes(
                      itemStatus,
                    )
                  ) {
                    return false
                  }

                  const start =
                    new Date(
                      item.startTime ??
                        item.start_time,
                    )

                  const end =
                    new Date(
                      item.endTime ??
                        item.end_time,
                    )

                  if (
                    Number.isNaN(
                      start.getTime(),
                    ) ||
                    Number.isNaN(
                      end.getTime(),
                    )
                  ) {
                    return false
                  }

                  return overlaps(
                    slotStart,
                    slotEnd,
                    start,
                    end,
                  )
                },
              )

            if (
              bookingConflict
            ) {
              return {
                ...slot,

                selected: false,

                status:
                  'warning',

                label:
                  'Đang có yêu cầu',
              }
            }

            return {
              ...slot,

              selected,

              status:
                selected
                  ? 'selected'
                  : 'available',

              label:
                selected
                  ? 'Đang chọn'
                  : 'Khả dụng',
            }
          },
        )
      },
      [
        bookings,
        form.date,
        form.end,
        form.hallId,
        form.start,
        schedules,
      ],
    )

  function setField(
    key,
    value,
  ) {
    setForm(
      (current) => ({
        ...current,
        [key]: value,
      }),
    )

    setError('')
    setMessage('')
  }

  function selectSlot(
    slot,
  ) {
    if (
      slot.status ===
        'danger' ||
      slot.status ===
        'warning'
    ) {
      return
    }

    setForm(
      (current) => ({
        ...current,
        start: slot.start,
        end: slot.end,
      }),
    )

    setError('')
    setMessage('')
  }

  function toggleEquipment(
    id,
  ) {
    setSelectedEquipment(
      (current) => ({
        ...current,

        [id]:
          !current[id],
      }),
    )
  }

  function saveDraft() {
    localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify(form),
    )

    setError('')

    setMessage(
      'Đã lưu bản nháp trên trình duyệt.',
    )
  }

  async function analyzePrediction() {
    setError('')
    setMessage('')

    if (!form.hallId) {
      setError(
        'Vui lòng chọn hội trường trước khi dự báo.',
      )

      return
    }

    if (!form.date) {
      setError(
        'Vui lòng chọn ngày trước khi dự báo.',
      )

      return
    }

    try {
      setPredicting(true)

      const result =
        await runPrediction(
          Number(
            form.hallId,
          ),
          form.date,
        )

      setPredictionResult(
        result,
      )

      setMessage(
        'Đã chạy dự báo Random Forest.',
      )
    } catch (err) {
      setError(
        err?.message ||
          'Không thể chạy dự báo Random Forest.',
      )
    } finally {
      setPredicting(false)
    }
  }

  function applyRecommendedTime() {
    const recommended =
      getRecommendedTime(
        activePrediction,
      )

    const times =
      String(
        recommended,
      ).match(
        /\d{2}:\d{2}/g,
      )

    if (
      !times ||
      times.length < 2
    ) {
      setError(
        'Kết quả dự báo chưa có khung giờ hợp lệ.',
      )

      return
    }

    setForm(
      (current) => ({
        ...current,

        start:
          times[0],

        end:
          times[1],
      }),
    )
  }

  async function submitBooking() {
    setError('')
    setMessage('')

    if (!form.hallId) {
      setError(
        'Vui lòng chọn hội trường.',
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

    if (
      !form.title.trim()
    ) {
      setError(
        'Vui lòng nhập tên sự kiện.',
      )

      return
    }

    if (
      !form.expectedPeople ||
      Number(
        form.expectedPeople,
      ) <= 0
    ) {
      setError(
        'Vui lòng nhập số người dự kiến hợp lệ.',
      )

      return
    }

    if (
      selectedHall.capacity &&
      Number(
        form.expectedPeople,
      ) >
        Number(
          selectedHall.capacity,
        )
    ) {
      setError(
        `Số người dự kiến vượt sức chứa ${Number(
          selectedHall.capacity,
        ).toLocaleString(
          'vi-VN',
        )} chỗ của hội trường.`,
      )

      return
    }

    if (
      !form.date ||
      !form.start ||
      !form.end
    ) {
      setError(
        'Vui lòng chọn ngày và khung giờ.',
      )

      return
    }

    if (
      form.end <=
      form.start
    ) {
      setError(
        'Giờ kết thúc phải sau giờ bắt đầu.',
      )

      return
    }

    if (
      !checkedSafety ||
      !checkedFire
    ) {
      setError(
        'Vui lòng xác nhận cam kết an toàn và phương án PCCC.',
      )

      return
    }

    const selectedEquipmentNames =
      hallEquipment
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

    const eventTypeLabel =
      EVENT_TYPES.find(
        (item) =>
          item.value ===
          form.eventType,
      )?.label ||
      form.eventType

    const noteParts = [
      form.organization
        ? `Đơn vị: ${form.organization}`
        : '',

      form.taxId
        ? `MST/Mã định danh: ${form.taxId}`
        : '',

      form.managementLevel
        ? `Cấp quản lý: ${form.managementLevel}`
        : '',

      form.representative
        ? `Người phụ trách: ${form.representative}`
        : '',

      form.phone
        ? `SĐT: ${form.phone}`
        : '',

      `Loại sự kiện: ${eventTypeLabel}`,

      `Số người dự kiến: ${form.expectedPeople}`,

      selectedEquipmentNames.length
        ? `Thiết bị yêu cầu: ${selectedEquipmentNames.join(', ')}`
        : '',

      'Cam kết an toàn: Có',

      'Phương án PCCC: Có',

      checkedRF
        ? 'Cho phép Random Forest gợi ý lịch: Có'
        : 'Cho phép Random Forest gợi ý lịch: Không',

      activePrediction
        ? `Dự báo sử dụng: ${getPredictionUsage(
            activePrediction,
          ).toFixed(1)}% - Mức rủi ro ${riskLabel(
            getPredictionRisk(
              activePrediction,
            ),
          )}`
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
          ),
      })

      localStorage.removeItem(
        DRAFT_KEY,
      )

      navigate(
        '/my-bookings',
      )
    } catch (err) {
      setError(
        err?.message ||
          'Không thể gửi đăng ký.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <div
        style={{
          marginBottom: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 10,
        }}
      >
        <div>
          <div
            style={{
              display: 'flex',
              gap: 10,
              alignItems: 'center',
              flexWrap: 'wrap',
              marginBottom: 6,
            }}
          >
            <h2 style={{ margin: 0 }}>
              Hồ sơ Đăng ký Thuê Hội trường &amp; Sân vận động
            </h2>

            <span className="badge badge-success">
              Random Forest
            </span>

            <span
              className="badge"
              style={{
                background: '#eff6ff',
                color: '#1d4ed8',
              }}
            >
              Kết nối Backend API
            </span>
          </div>
        </div>
      </div>

      {error ? (
        <div className="alert danger">
          <AlertTriangle
            size={15}
            style={{
              marginRight: 6,
              verticalAlign: 'middle',
            }}
          />

          {error}
        </div>
      ) : null}

      {message ? (
        <div className="alert success">
          {message}
        </div>
      ) : null}

      {activePrediction ? (
        <div
          className="alert warning"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
            marginBottom: 16,
          }}
        >
          <div>
            <strong>
              Dự báo mức sử dụng:{' '}
              {getPredictionUsage(
                activePrediction,
              ).toFixed(1)}
              %
            </strong>

            <div
              style={{
                fontSize: 13,
                marginTop: 3,
              }}
            >
              Mức rủi ro:{' '}

              <strong>
                {riskLabel(
                  getPredictionRisk(
                    activePrediction,
                  ),
                )}
              </strong>

              {getRecommendedTime(
                activePrediction,
              )
                ? ` · Gợi ý: ${getRecommendedTime(
                    activePrediction,
                  )}`
                : ''}
            </div>
          </div>

          {getRecommendedTime(
            activePrediction,
          ) ? (
            <button
              className="btn"
              type="button"
              onClick={
                applyRecommendedTime
              }
            >
              Chọn giờ gợi ý
            </button>
          ) : null}
        </div>
      ) : null}

      <div
        className="grid-2"
        style={{
          gridTemplateColumns:
            '1.2fr 1fr',
          gap: 16,
        }}
      >
        <div>
          <div className="form-section">
            <div className="form-section-title">
              🏛 Đơn vị &amp; Người đại diện

              <span
                className="badge"
                style={{
                  background:
                    '#eff6ff',

                  color:
                    '#1d4ed8',

                  fontSize: 11,

                  marginLeft: 8,
                }}
              >
                Hồ sơ pháp lý
              </span>
            </div>

            <div className="form-row">
              <label>
                Tên tổ chức / Đơn vị
              </label>

              <input
                value={
                  form.organization
                }
                onChange={(e) =>
                  setField(
                    'organization',
                    e.target.value,
                  )
                }
              />
            </div>

            <div className="grid-2">
              <div className="form-row">
                <label>
                  Mã định danh / MST
                </label>

                <input
                  value={
                    form.taxId
                  }
                  onChange={(e) =>
                    setField(
                      'taxId',
                      e.target.value,
                    )
                  }
                />
              </div>

              <div className="form-row">
                <label>
                  Cấp quản lý
                </label>

                <input
                  value={
                    form.managementLevel
                  }
                  onChange={(e) =>
                    setField(
                      'managementLevel',
                      e.target.value,
                    )
                  }
                />
              </div>
            </div>

            <div className="grid-2">
              <div className="form-row">
                <label>
                  Người phụ trách
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
                  SĐT liên lạc
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
          </div>

          <div className="form-section">
            <div className="form-section-title">
              📋 Nội dung sự kiện &amp; Quy mô
            </div>

            <div className="form-row">
              <label>
                Tên sự kiện *
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

            <div className="grid-2">
              <div className="form-row">
                <label>
                  Phân loại sự kiện
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
                    (item) => (
                      <option
                        key={
                          item.value
                        }
                        value={
                          item.value
                        }
                      >
                        {item.label}
                      </option>
                    ),
                  )}
                </select>
              </div>

              <div className="form-row">
                <label>
                  Dự kiến số người *
                </label>

                <div
                  style={{
                    display: 'flex',
                    gap: 8,
                    alignItems: 'center',
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
                      maxWidth: 120,
                    }}
                  />

                  <span
                    className="muted"
                    style={{
                      fontSize: 13,
                    }}
                  >
                    người
                  </span>
                </div>
              </div>
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

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                marginBottom: 12,
              }}
            >
              <label className="check">
                <input
                  type="checkbox"
                  checked={
                    checkedSafety
                  }
                  onChange={(e) =>
                    setCheckedSafety(
                      e.target.checked,
                    )
                  }
                />

                Tôi cam kết bảo đảm an toàn cho người tham dự *
              </label>

              <label className="check">
                <input
                  type="checkbox"
                  checked={
                    checkedFire
                  }
                  onChange={(e) =>
                    setCheckedFire(
                      e.target.checked,
                    )
                  }
                />

                Đã có phương án PCCC và thoát hiểm *
              </label>

              <label className="check">
                <input
                  type="checkbox"
                  checked={
                    checkedRF
                  }
                  onChange={(e) =>
                    setCheckedRF(
                      e.target.checked,
                    )
                  }
                />

                Đồng ý hệ thống sử dụng Random Forest để đề xuất lịch tối ưu
              </label>
            </div>

            {selectedHall ? (
              <div
                style={{
                  background:
                    '#f0fdf4',

                  border:
                    '1px solid #86efac',

                  borderRadius:
                    10,

                  padding:
                    '10px 14px',

                  fontSize:
                    13,
                }}
              >
                <div
                  style={{
                    fontWeight:
                      600,

                    color:
                      '#15803d',

                    marginBottom:
                      2,
                  }}
                >
                  🟢 Khu vực đã chọn
                </div>

                <div
                  style={{
                    fontWeight:
                      700,
                  }}
                >
                  {selectedHall.name}
                </div>

                <div className="muted">
                  Sức chứa{' '}
                  {Number(
                    selectedHall.capacity ||
                      0,
                  ).toLocaleString(
                    'vi-VN',
                  )}{' '}
                  chỗ

                  {selectedHall.type
                    ? ` · ${selectedHall.type}`
                    : ''}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div>
          <div className="form-section">
            <div className="form-section-title">
              📅 Chọn Hội trường &amp; Ngày diễn ra
            </div>

            <div className="form-row">
              <label>
                Khu vực / Hội trường *
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
                      {hall.code
                        ? `${hall.code} - `
                        : ''}

                      {hall.name}
                    </option>
                  ),
                )}
              </select>
            </div>

            <div className="form-row">
              <label>
                Ngày thi đấu *
              </label>

              <input
                type="date"
                min={
                  getLocalDate()
                }
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

            <div
              style={{
                marginBottom:
                  12,
              }}
            >
              {slotRows.map(
                (slot) => {
                  const disabled =
                    slot.status ===
                      'danger' ||
                    slot.status ===
                      'warning'

                  return (
                    <div
                      key={`${slot.start}-${slot.end}`}
                      className={`slot-option ${slot.status}`}
                      onClick={() =>
                        !disabled &&
                        selectSlot(
                          slot,
                        )
                      }
                      style={{
                        cursor:
                          disabled
                            ? 'not-allowed'
                            : 'pointer',

                        opacity:
                          disabled
                            ? 0.65
                            : 1,
                      }}
                    >
                      <div>
                        <strong>
                          {slot.start}–{slot.end}
                        </strong>

                        <span
                          className="muted"
                          style={{
                            fontSize:
                              12,

                            display:
                              'block',
                          }}
                        >
                          {slot.label}
                        </span>
                      </div>

                      <span
                        style={{
                          fontSize:
                            12,

                          fontWeight:
                            700,
                        }}
                      >
                        {slot.status ===
                        'selected'
                          ? 'Đã chọn'
                          : slot.status ===
                              'available'
                            ? 'Trống'
                            : slot.status ===
                                'warning'
                              ? 'Chờ duyệt'
                              : 'Bận'}
                      </span>
                    </div>
                  )
                },
              )}
            </div>
          </div>

          <div className="form-section">
            <div className="form-section-title">
              🤖 Gợi ý từ mô hình Random Forest
            </div>

            <button
              type="button"
              className="btn"
              onClick={
                analyzePrediction
              }
              disabled={
                predicting ||
                !form.hallId ||
                !form.date
              }
              style={{
                marginBottom:
                  12,
              }}
            >
              {predicting
                ? 'Đang phân tích...'
                : 'Phân tích Random Forest'}
            </button>

            {activePrediction ? (
              <div className="rf-card good">
                <div
                  style={{
                    display:
                      'flex',

                    justifyContent:
                      'space-between',

                    alignItems:
                      'center',
                  }}
                >
                  <div>
                    <strong>
                      Mức sử dụng dự báo
                    </strong>

                    <span
                      className="muted"
                      style={{
                        fontSize:
                          12,

                        display:
                          'block',
                      }}
                    >
                      {getRecommendedTime(
                        activePrediction,
                      )
                        ? `Khung giờ gợi ý: ${getRecommendedTime(
                            activePrediction,
                          )}`
                        : `Mức rủi ro: ${riskLabel(
                            getPredictionRisk(
                              activePrediction,
                            ),
                          )}`}
                    </span>
                  </div>

                  <span
                    style={{
                      fontWeight:
                        700,

                      fontSize:
                        16,
                    }}
                  >
                    {getPredictionUsage(
                      activePrediction,
                    ).toFixed(
                      1,
                    )}
                    %
                  </span>
                </div>
              </div>
            ) : (
              <p className="muted">
                Chọn hội trường và ngày, sau đó bấm “Phân tích Random Forest”.
              </p>
            )}

            <p
              className="muted"
              style={{
                fontSize:
                  12,

                margin:
                  '10px 0',
              }}
            >
              Kết quả Random Forest chỉ mang tính chất hỗ trợ.
              Backend vẫn kiểm tra trùng lịch trước khi tạo booking.
            </p>

            <div className="collapsible-section">
              <div
                className="collapsible-header"
                onClick={() =>
                  setShowFactors(
                    !showFactors,
                  )
                }
              >
                Các yếu tố Random Forest xem xét

                <ChevronDown
                  size={15}
                  style={{
                    transform:
                      showFactors
                        ? 'rotate(180deg)'
                        : 'none',

                    transition:
                      '.2s',
                  }}
                />
              </div>

              {showFactors ? (
                <div className="collapsible-body">
                  <ul
                    style={{
                      paddingLeft:
                        16,

                      margin:
                        0,
                    }}
                  >
                    <li>
                      Hội trường được chọn
                    </li>

                    <li>
                      Sức chứa hội trường
                    </li>

                    <li>
                      Thứ trong tuần
                    </li>

                    <li>
                      Tháng
                    </li>

                    <li>
                      Ngày cuối tuần
                    </li>
                  </ul>
                </div>
              ) : null}
            </div>

            <div
              style={{
                marginTop:
                  16,
              }}
            >
              <strong>
                Thiết bị yêu cầu
              </strong>

              {hallEquipment.length ? (
                hallEquipment.map(
                  (item) => (
                    <label
                      className="check"
                      key={
                        item.id
                      }
                      style={{
                        marginTop:
                          8,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={
                          Boolean(
                            selectedEquipment[
                              item.id
                            ],
                          )
                        }
                        disabled={
                          item.status !==
                          'active'
                        }
                        onChange={() =>
                          toggleEquipment(
                            item.id,
                          )
                        }
                      />

                      {item.name}

                      {item.quantity
                        ? ` (SL: ${item.quantity})`
                        : ''}

                      {item.status !==
                      'active'
                        ? ' — không khả dụng'
                        : ''}
                    </label>
                  ),
                )
              ) : (
                <p className="muted">
                  Chưa có thiết bị cho hội trường này.
                </p>
              )}
            </div>

            <div
              style={{
                display:
                  'flex',

                gap:
                  8,

                marginTop:
                  16,

                justifyContent:
                  'flex-end',

                flexWrap:
                  'wrap',
              }}
            >
              <button
                className="btn ghost"
                type="button"
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
                className="btn ghost"
                type="button"
                onClick={
                  saveDraft
                }
              >
                <Save size={14} />
                Lưu nháp
              </button>

              <button
                className="btn primary"
                type="button"
                disabled={
                  submitting
                }
                onClick={
                  submitBooking
                }
              >
                <Send size={14} />

                {submitting
                  ? 'Đang gửi...'
                  : 'Gửi đăng ký'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}