import {
  useEffect,
  useState,
} from 'react'

import {
  useNavigate,
} from 'react-router-dom'

import StatusBadge from '../components/StatusBadge'
import { useData } from '../context/DataContext'
import { usePageMeta } from '../layouts/AppLayout'

export default function Portal() {
  const setMeta =
    usePageMeta()

  const navigate =
    useNavigate()

  const {
    halls,
  } = useData()

  const [
    q,
    setQ,
  ] =
    useState('')

  useEffect(() => {

    setMeta({
      title:
        'Cổng thông tin đơn vị thuê',

      crumbs:
        'Cổng đơn vị · Hội trường & sân',
    })

  }, [setMeta])

  const list =
    halls.filter(
      (hall) =>
        hall.name
          .toLowerCase()
          .includes(
            q.toLowerCase(),
          ),
    )

  return (
    <>

      <section className="hero-portal">

        <div>

          <p className="eyebrow">
            Hệ thống thể thao tỉnh
          </p>

          <h2>
            Tra cứu & tham quan cơ sở vật chất nhà thi đấu tỉnh
          </h2>

          <p>
            Xem hội trường, sức chứa, trạng thái
            và gửi yêu cầu đặt chỗ trực tuyến.
          </p>

        </div>

        <div className="hero-stats">

          <div>
            <strong>
              {halls.length}
            </strong>
            <span>
              hội trường / sân
            </span>
          </div>

          <div>
            <strong>
              {halls
                .reduce(
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
                .toLocaleString(
                  'vi-VN',
                )}
            </strong>
            <span>
              sức chứa
            </span>
          </div>

          <div>
            <strong>
              24/7
            </strong>
            <span>
              tra cứu online
            </span>
          </div>

        </div>

      </section>

      <div className="toolbar">

        <input
          placeholder="Tìm hội trường..."
          value={q}
          onChange={(e) =>
            setQ(
              e.target.value,
            )
          }
        />

      </div>

      <div className="card-grid">

        {list.map(
          (hall) => (

            <article
              className="hall-card"
              key={hall.id}
            >

              <img
                src={hall.image}
                alt=""
              />

              <div>

                <StatusBadge
                  status={
                    hall.status
                  }
                />

                <h3>
                  {hall.name}
                </h3>

                <p>
                  {Number(
                    hall.capacity ||
                    0,
                  ).toLocaleString(
                    'vi-VN',
                  )}{' '}
                  chỗ · {hall.type}
                </p>

                <p className="muted">
                  {hall.description ||
                    hall.equipment ||
                    'Chưa có mô tả.'}
                </p>

                <div className="row-gap">

                  <button
                    className="btn ghost"
                    type="button"
                    onClick={() =>
                      navigate(
                        `/schedule?hallId=${hall.id}`,
                      )
                    }
                  >
                    Xem chi tiết
                  </button>

                  <button
                    className="btn"
                    type="button"
                    disabled={
                      hall.status !==
                      'active'
                    }
                    title={
                      hall.status ===
                      'active'
                        ? 'Gửi yêu cầu đặt chỗ'
                        : 'Khu vực hiện không hoạt động'
                    }
                    onClick={() =>
                      navigate(
                        `/booking/simple?hallId=${hall.id}`,
                      )
                    }
                  >
                    Gửi yêu cầu đặt chỗ
                  </button>

                </div>

              </div>

            </article>
          ),
        )}

      </div>

    </>
  )
}