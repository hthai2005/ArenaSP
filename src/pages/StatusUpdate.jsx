import {
  useEffect,
  useState,
} from 'react'

import StatusBadge from '../components/StatusBadge'
import { useData } from '../context/DataContext'
import { usePageMeta } from '../layouts/AppLayout'

function parseTarget(
  log,
  halls,
  equipment,
) {
  const [
    kind,
    rawId,
  ] =
    String(
      log.target || '',
    ).split(':')

  const id =
    Number(rawId)

  if (kind === 'hall') {

    const item =
      halls.find(
        (hall) =>
          hall.id === id,
      )

    return {
      name:
        item?.name ||
        log.target,

      status:
        item?.status ||
        'active',
    }
  }

  if (
    kind ===
    'equipment'
  ) {

    const item =
      equipment.find(
        (eq) =>
          eq.id === id,
      )

    return {
      name:
        item?.name ||
        log.target,

      status:
        item?.status ||
        'active',
    }
  }

  return {
    name:
      log.target ||
      'Không xác định',

    status:
      'active',
  }
}

export default function StatusUpdate() {
  const setMeta =
    usePageMeta()

  const {
    halls,
    equipment,
    updateHall,
    updateEquipment,
    logs,
    refreshLogs,
  } = useData()

  const [
    kind,
    setKind,
  ] = useState('hall')

  const [
    targetId,
    setTargetId,
  ] = useState(
    halls[0]?.id || '',
  )

  const [
    status,
    setStatus,
  ] = useState('active')

  const [
    note,
    setNote,
  ] = useState('')

  const [
    ok,
    setOk,
  ] = useState('')

  const [
    error,
    setError,
  ] = useState('')

  useEffect(() => {

    setMeta({
      title:
        'Ghi nhận & cập nhật tình trạng sân bãi – thiết bị trong ngày',

      crumbs:
        'Trang chủ · Vận hành sân bãi',
    })

  }, [setMeta])

  useEffect(() => {

    const list =
      kind === 'hall'
        ? halls
        : equipment

    if (
      !list.some(
        (item) =>
          item.id ===
          Number(targetId),
      )
    ) {
      setTargetId(
        list[0]?.id || '',
      )
    }

  }, [
    kind,
    halls,
    equipment,
    targetId,
  ])

  const options =
    kind === 'hall'
      ? halls
      : equipment

  const submit =
    async (e) => {

      e.preventDefault()

      if (!targetId) {
        return
      }

      try {

        const patch = {
          status,

          ...(note.trim()
            ? {
                description:
                  note.trim(),
              }
            : {}),
        }

        if (
          kind === 'hall'
        ) {

          await updateHall(
            Number(targetId),
            patch,
          )

        } else {

          await updateEquipment(
            Number(targetId),
            patch,
          )
        }

        await refreshLogs()

        setNote('')
        setError('')
        setOk(
          'Đã cập nhật trạng thái.',
        )

      } catch (err) {

        setOk('')
        setError(
          err.message,
        )
      }
    }

  const recentLogs =
    logs
      .filter(
        (log) =>
          [
            'UPDATE_HALL',
            'UPDATE_EQUIPMENT',
          ].includes(
            log.action,
          ),
      )
      .slice(0, 10)

  return (
    <div className="split-page">

      <form
        className="card form"
        onSubmit={submit}
      >

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

        <h3>
          1. Chọn đối tượng cần cập nhật
        </h3>

        <div className="choice">

          <button
            type="button"
            className={
              kind === 'hall'
                ? 'on'
                : ''
            }
            onClick={() =>
              setKind('hall')
            }
          >
            Hội trường & sân thi đấu
          </button>

          <button
            type="button"
            className={
              kind === 'eq'
                ? 'on'
                : ''
            }
            onClick={() =>
              setKind('eq')
            }
          >
            Trang thiết bị chuyên dụng
          </button>

        </div>

        <h3>
          2. Danh mục chọn cụ thể
        </h3>

        <select
          value={targetId}
          onChange={(e) =>
            setTargetId(
              e.target.value,
            )
          }
        >

          {options.map(
            (o) => (
              <option
                key={o.id}
                value={o.id}
              >
                {o.name}
              </option>
            ),
          )}

        </select>

        <h3>
          3. Chuyển đổi trạng thái mới
        </h3>

        <div className="status-picks">

          {[
            [
              'active',
              'Hoạt động',
            ],

            [
              'maintenance',
              'Bảo trì / Sửa chữa',
            ],

            [
              'inactive',
              'Ngưng sử dụng',
            ],

          ].map(
            ([
              value,
              label,
            ]) => (

              <button
                key={value}
                type="button"
                className={
                  `pick ${value} ${
                    status === value
                      ? 'on'
                      : ''
                  }`
                }
                onClick={() =>
                  setStatus(
                    value,
                  )
                }
              >
                {label}
              </button>
            ),
          )}

        </div>

        <h3>
          4. Ghi chú hiện trường
        </h3>

        <textarea
          rows={4}
          value={note}
          onChange={(e) =>
            setNote(
              e.target.value,
            )
          }
          placeholder="Ví dụ: thay thế bóng đèn góc A..."
        />

        <p
          className="muted"
          style={{
            fontSize: 11,
            marginTop: 6,
          }}
        >
          Trạng thái và ghi chú (nếu có)
          được lưu vào backend.
          Nhật ký hệ thống được backend
          tự động ghi nhận.
        </p>

        <div className="form-actions">

          <button
            className="btn primary"
            type="submit"
          >
            Xác nhận & cập nhật trạng thái
          </button>

        </div>

      </form>

      <aside className="card">

        <h3>
          Nhật ký cập nhật gần nhất
        </h3>

        <ul className="timeline">

          {recentLogs.map(
            (log) => {

              const target =
                parseTarget(
                  log,
                  halls,
                  equipment,
                )

              return (
                <li key={log.id}>

                  <div>

                    <strong>
                      {target.name}
                    </strong>

                    <StatusBadge
                      status={
                        target.status
                      }
                    />

                  </div>

                  <p>
                    {log.description ||
                      log.action}
                  </p>

                  <small>

                    {log.createdAt
                      ? new Date(
                          log.createdAt,
                        ).toLocaleString(
                          'vi-VN',
                        )
                      : '—'}

                    {log.userId
                      ? ` · User #${log.userId}`
                      : ''}

                  </small>

                </li>
              )
            },
          )}

        </ul>

        {recentLogs.length ===
        0 ? (
          <p className="muted">
            Chưa có nhật ký cập nhật.
          </p>
        ) : null}

      </aside>

    </div>
  )
}