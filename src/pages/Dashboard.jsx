import {
  useEffect,
} from 'react'

import {
  Building2,
  CircuitBoard,
  Users,
  Warehouse,
} from 'lucide-react'

import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { usePageMeta } from '../layouts/AppLayout'
import StatusBadge from '../components/StatusBadge'

function formatDateTime(
  value,
) {
  if (!value) {
    return '—'
  }

  return new Date(
    value,
  ).toLocaleString(
    'vi-VN',
  )
}

export default function Dashboard() {
  const setMeta =
    usePageMeta()

  const { user } =
    useAuth()

  const {
    stadiums,
    halls,
    equipment,
    bookings,
    logs,
    dashboardReport,
    occupancy,
  } = useData()

  useEffect(() => {

    setMeta({
      title:
        'Tổng quan vận hành cơ sở thể thao tỉnh',

      crumbs:
        'Trang chủ · Vận hành',
    })

  }, [setMeta])

  const activeHalls =
    halls.filter(
      (hall) =>
        hall.status ===
        'active',
    ).length

  const maintEq =
    equipment.filter(
      (item) =>
        item.status !==
        'active',
    ).length

  const capacity =
    halls.reduce(
      (
        sum,
        hall,
      ) =>
        sum +
        Number(
          hall.capacity ||
          0,
        ),
      0,
    )

  const attentionEq =
    equipment.filter(
      (item) =>
        item.status !==
        'active',
    )

  const hallName =
    (hallId) =>
      halls.find(
        (hall) =>
          hall.id ===
          Number(hallId),
      )?.name ||
      'Khu kỹ thuật chung'

  const pendingBookings =
    bookings.filter(
      (booking) =>
        booking.status ===
        'PENDING',
    ).length

  return (
    <>

      <div className="stats">

        <article className="stat">

          <Warehouse />

          <div>

            <span>
              Số nhà thi đấu
            </span>

            <strong>
              {String(
                dashboardReport
                  ?.totalStadiums ??
                stadiums.length,
              ).padStart(
                2,
                '0',
              )}
            </strong>

          </div>

        </article>

        <article className="stat">

          <Building2 />

          <div>

            <span>
              Hội trường / sân
            </span>

            <strong>
              {String(
                dashboardReport
                  ?.totalHalls ??
                halls.length,
              ).padStart(
                2,
                '0',
              )}
            </strong>

            <small>
              {dashboardReport
                ?.activeHalls ??
                activeHalls}{' '}
              đang hoạt động
            </small>

          </div>

        </article>

        <article className="stat">

          <CircuitBoard />

          <div>

            <span>
              Thiết bị cần chú ý
            </span>

            <strong>
              {String(
                maintEq,
              ).padStart(
                2,
                '0',
              )}
            </strong>

            <small>
              {dashboardReport
                ?.pendingBookings ??
                pendingBookings}{' '}
              booking chờ duyệt
            </small>

          </div>

        </article>

        <article className="stat">

          <Users />

          <div>

            <span>
              Tổng sức chứa
            </span>

            <strong>
              {capacity.toLocaleString(
                'vi-VN',
              )}
            </strong>

            {dashboardReport ? (

              <small>
                Lấp đầy TB:{' '}
                {Number(
                  dashboardReport.averageOccupancy ||
                  0,
                ).toFixed(
                  1,
                )}
                %
              </small>

            ) : null}

          </div>

        </article>

      </div>

      <div className="grid-main">

        <section className="card">

          <h3>
            Phân bổ tài nguyên & sức chứa cơ sở
          </h3>

          <table>

            <thead>

              <tr>
                <th>
                  Hội trường
                </th>

                <th>
                  Loại
                </th>

                <th>
                  Sức chứa
                </th>

                <th>
                  Trạng thái
                </th>
              </tr>

            </thead>

            <tbody>

              {halls.map(
                (hall) => (

                  <tr key={hall.id}>

                    <td>
                      {hall.name}
                    </td>

                    <td>
                      {hall.type}
                    </td>

                    <td>
                      {Number(
                        hall.capacity ||
                        0,
                      ).toLocaleString(
                        'vi-VN',
                      )}
                    </td>

                    <td>
                      <StatusBadge
                        status={
                          hall.status
                        }
                      />
                    </td>

                  </tr>
                ),
              )}

            </tbody>

          </table>

        </section>

        <section className="card">

          <h3>
            Thiết bị cần chú ý
          </h3>

          {attentionEq.length ===
          0 ? (

            <p className="muted">
              Không có thiết bị bảo trì hoặc ngưng sử dụng.
            </p>

          ) : (

            <ul className="plain-list">

              {attentionEq.map(
                (item) => (

                  <li key={item.id}>

                    <div className="item-text">

                      <strong>
                        {hallName(
                          item.hallId,
                        )}
                      </strong>

                      <span>
                        {item.name}
                      </span>

                    </div>

                    <StatusBadge
                      status={
                        item.status
                      }
                    />

                  </li>
                ),
              )}

            </ul>

          )}

        </section>

      </div>

      <div
        className="grid-main"
        style={{
          marginTop:
            16,
        }}
      >

        <section className="card">

          <h3>
            Thống kê lấp đầy hội trường
          </h3>

          {occupancy.length ? (

            <table>

              <thead>

                <tr>

                  <th>
                    Hội trường
                  </th>

                  <th>
                    Số lịch
                  </th>

                  <th>
                    Thời gian sử dụng
                  </th>

                  <th>
                    Lấp đầy
                  </th>

                </tr>

              </thead>

              <tbody>

                {occupancy.map(
                  (row) => (

                    <tr
                      key={
                        row.hallId ??
                        row.hall_id
                      }
                    >

                      <td>
                        {row.hallCode ??
                          row.hall_code}
                        {' - '}
                        {row.hallName ??
                          row.hall_name}
                      </td>

                      <td>
                        {row.scheduleCount ??
                          row.schedule_count}
                      </td>

                      <td>
                        {Number(
                          row.usageMinutes ??
                          row.usage_minutes ??
                          0,
                        ).toLocaleString(
                          'vi-VN',
                        )}{' '}
                        phút
                      </td>

                      <td>

                        <strong>
                          {Number(
                            row.usagePercent ??
                            row.usage_percent ??
                            0,
                          ).toFixed(
                            1,
                          )}
                          %
                        </strong>

                      </td>

                    </tr>
                  ),
                )}

              </tbody>

            </table>

          ) : (

            <p className="muted">
              {user.role ===
              'staff'
                ? 'Tài khoản STAFF không có quyền REPORT_VIEW.'
                : 'Chưa có dữ liệu thống kê lấp đầy.'}
            </p>

          )}

        </section>

        <section className="card">

          <h3>
            Nhật ký hoạt động gần đây
          </h3>

          {logs.length ? (

            <ul className="timeline">

              {logs
                .slice(
                  0,
                  8,
                )
                .map(
                  (log) => (

                    <li key={log.id}>

                      <div>
                        <strong>
                          {log.action}
                        </strong>
                      </div>

                      <p>
                        {log.description ||
                          log.target}
                      </p>

                      <small>
                        {formatDateTime(
                          log.createdAt,
                        )}

                        {log.userId
                          ? ` · User #${log.userId}`
                          : ''}
                      </small>

                    </li>
                  ),
                )}

            </ul>

          ) : (

            <p className="muted">
              {user.role ===
              'admin'
                ? 'Chưa có nhật ký hoạt động.'
                : 'Nhật ký chỉ hiển thị khi tài khoản có quyền LOG_VIEW.'}
            </p>

          )}

        </section>

      </div>

    </>
  )
}