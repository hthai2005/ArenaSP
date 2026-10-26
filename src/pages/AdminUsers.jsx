import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  RefreshCw,
  Search,
  ShieldCheck,
  Users,
} from 'lucide-react'

import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { usePageMeta } from '../layouts/AppLayout'


const ROLES = [
  {
    id: 1,
    name: 'ADMIN',
    label: 'Quản trị viên',
  },
  {
    id: 2,
    name: 'MANAGER',
    label: 'Ban quản lý',
  },
  {
    id: 3,
    name: 'STAFF',
    label: 'Nhân viên vận hành',
  },
  {
    id: 4,
    name: 'ORGANIZATION',
    label: 'Đơn vị sử dụng',
  },
]


function mapUser(item) {
  return {
    id: item.id,

    username:
      item.username || '',

    fullName:
      item.fullName ??
      item.full_name ??
      '',

    email:
      item.email || '',

    phone:
      item.phone || '',

    roleId:
      item.roleId ??
      item.role_id,

    role:
      item.role || '',

    status:
      item.status || 'ACTIVE',
  }
}


function roleLabel(role) {
  const found =
    ROLES.find(
      (item) =>
        item.name === role,
    )

  return found?.label || role
}


function roleBadge(role) {
  if (role === 'ADMIN') {
    return 'badge-danger'
  }

  if (role === 'MANAGER') {
    return 'badge-warning'
  }

  if (role === 'STAFF') {
    return 'badge-success'
  }

  return 'badge-grey'
}


export default function AdminUsers() {
  const setMeta =
    usePageMeta()

  const { user } =
    useAuth()


  const [
    users,
    setUsers,
  ] = useState([])


  const [
    search,
    setSearch,
  ] = useState('')


  const [
    loading,
    setLoading,
  ] = useState(false)


  const [
    busyId,
    setBusyId,
  ] = useState(null)


  const [
    error,
    setError,
  ] = useState('')


  const [
    success,
    setSuccess,
  ] = useState('')


  useEffect(() => {
    setMeta({
      title:
        'Quản trị người dùng',

      crumbs:
        'Trang chủ · Quản trị · Người dùng',
    })
  }, [setMeta])


  // ==================================================
  // LOAD USERS
  // ==================================================

  const loadUsers =
    useCallback(
      async () => {
        try {
          setLoading(true)
          setError('')

          const rows =
            await api(
              '/api/users/',
            )

          setUsers(
            (rows || [])
              .map(mapUser),
          )
        } catch (err) {
          setError(
            err.message ||
              'Không thể tải danh sách người dùng.',
          )
        } finally {
          setLoading(false)
        }
      },
      [],
    )


  useEffect(() => {
    loadUsers()
  }, [loadUsers])


  // ==================================================
  // CHANGE ROLE
  // ==================================================

  const changeRole =
    async (
      targetUser,
      roleId,
    ) => {
      try {
        setBusyId(
          targetUser.id,
        )

        setError('')
        setSuccess('')

        await api(
          `/api/users/${targetUser.id}/role`,
          {
            method: 'PUT',

            body: {
              roleId:
                Number(roleId),
            },
          },
        )

        setSuccess(
          `Đã cập nhật vai trò cho ${targetUser.fullName || targetUser.username}.`,
        )

        await loadUsers()
      } catch (err) {
        setError(
          err.message,
        )
      } finally {
        setBusyId(null)
      }
    }


  // ==================================================
  // CHANGE STATUS
  // ==================================================

  const changeStatus =
    async (
      targetUser,
      nextStatus,
    ) => {
      try {
        setBusyId(
          targetUser.id,
        )

        setError('')
        setSuccess('')

        await api(
          `/api/users/${targetUser.id}/status`,
          {
            method: 'PUT',

            body: {
              status:
                nextStatus,
            },
          },
        )

        setSuccess(
          `Đã cập nhật trạng thái tài khoản ${targetUser.username}.`,
        )

        await loadUsers()
      } catch (err) {
        setError(
          err.message,
        )
      } finally {
        setBusyId(null)
      }
    }


  // ==================================================
  // FILTER
  // ==================================================

  const filteredUsers =
    useMemo(
      () => {
        const keyword =
          search
            .trim()
            .toLowerCase()

        if (!keyword) {
          return users
        }

        return users.filter(
          (item) =>
            `${item.id} ${item.username} ${item.fullName} ${item.email} ${item.phone} ${item.role}`
              .toLowerCase()
              .includes(
                keyword,
              ),
        )
      },
      [
        users,
        search,
      ],
    )


  const adminCount =
    users.filter(
      (item) =>
        item.role ===
        'ADMIN',
    ).length


  const managerCount =
    users.filter(
      (item) =>
        item.role ===
        'MANAGER',
    ).length


  const staffCount =
    users.filter(
      (item) =>
        item.role ===
        'STAFF',
    ).length


  const organizationCount =
    users.filter(
      (item) =>
        item.role ===
        'ORGANIZATION',
    ).length


  return (
    <>

      {/* THỐNG KÊ */}

      <div className="stats">

        <article className="stat">

          <ShieldCheck />

          <div>
            <span>
              Quản trị viên
            </span>

            <strong>
              {adminCount}
            </strong>
          </div>

        </article>


        <article className="stat">

          <Users />

          <div>
            <span>
              Ban quản lý
            </span>

            <strong>
              {managerCount}
            </strong>
          </div>

        </article>


        <article className="stat">

          <Users />

          <div>
            <span>
              Nhân viên
            </span>

            <strong>
              {staffCount}
            </strong>
          </div>

        </article>


        <article className="stat">

          <Users />

          <div>
            <span>
              Đơn vị sử dụng
            </span>

            <strong>
              {organizationCount}
            </strong>
          </div>

        </article>

      </div>


      {/* THÔNG BÁO */}

      {success ? (
        <div className="alert success">
          {success}
        </div>
      ) : null}


      {error ? (
        <div className="alert danger">
          {error}
        </div>
      ) : null}


      {/* TOOLBAR */}

      <div className="toolbar">

        <div
          style={{
            position:
              'relative',
          }}
        >

          <Search
            size={16}
            style={{
              position:
                'absolute',

              left:
                10,

              top:
                11,

              color:
                '#64748b',
            }}
          />


          <input
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value,
              )
            }
            placeholder="Tìm tên, email, số điện thoại..."
            style={{
              paddingLeft:
                34,

              minWidth:
                320,
            }}
          />

        </div>


        <button
          type="button"
          className="btn ghost"
          onClick={loadUsers}
          disabled={loading}
        >

          <RefreshCw
            size={15}
          />

          {loading
            ? 'Đang tải...'
            : 'Làm mới'}

        </button>

      </div>


      {/* TABLE */}

      <section className="card">

        <div
          style={{
            display:
              'flex',

            justifyContent:
              'space-between',

            alignItems:
              'center',

            marginBottom:
              14,
          }}
        >

          <div>

            <h3
              style={{
                margin:
                  0,
              }}
            >
              Danh sách tài khoản
            </h3>


            <p
              className="muted"
              style={{
                margin:
                  '4px 0 0',
              }}
            >
              Tổng cộng {users.length} tài khoản
            </p>

          </div>

        </div>


        <div
          style={{
            overflowX:
              'auto',
          }}
        >

          <table>

            <thead>

              <tr>
                <th>ID</th>
                <th>Người dùng</th>
                <th>Liên hệ</th>
                <th>Vai trò</th>
                <th>Trạng thái</th>
              </tr>

            </thead>


            <tbody>

              {filteredUsers.map(
                (item) => {

                  const isSelf =
                    item.id ===
                    user.id

                  const busy =
                    busyId ===
                    item.id


                  return (

                    <tr key={item.id}>

                      <td>
                        #{item.id}
                      </td>


                      <td>

                        <strong>
                          {item.fullName ||
                            item.username}
                        </strong>


                        <div className="muted">
                          @{item.username}
                        </div>


                        {isSelf ? (
                          <div
                            style={{
                              marginTop:
                                4,
                            }}
                          >
                            <span className="badge badge-success">
                              Tài khoản của bạn
                            </span>
                          </div>
                        ) : null}

                      </td>


                      <td>

                        <div>
                          {item.email ||
                            '—'}
                        </div>

                        <div className="muted">
                          {item.phone ||
                            'Chưa có số điện thoại'}
                        </div>

                      </td>


                      <td>

                        <div
                          style={{
                            marginBottom:
                              7,
                          }}
                        >
                          <span
                            className={
                              `badge ${roleBadge(
                                item.role,
                              )}`
                            }
                          >
                            {roleLabel(
                              item.role,
                            )}
                          </span>
                        </div>


                        <select
                          value={
                            item.roleId
                          }
                          disabled={
                            busy ||
                            isSelf
                          }
                          onChange={(e) =>
                            changeRole(
                              item,
                              e.target.value,
                            )
                          }
                        >

                          {ROLES.map(
                            (role) => (

                              <option
                                key={
                                  role.id
                                }
                                value={
                                  role.id
                                }
                              >
                                {role.label}
                              </option>
                            ),
                          )}

                        </select>

                      </td>


                      <td>

                        <div
                          style={{
                            marginBottom:
                              7,
                          }}
                        >

                          <span
                            className={
                              item.status ===
                              'ACTIVE'
                                ? 'badge badge-success'
                                : 'badge badge-danger'
                            }
                          >

                            {item.status ===
                            'ACTIVE'
                              ? 'Đang hoạt động'
                              : 'Đã khóa'}

                          </span>

                        </div>


                        <select
                          value={
                            item.status
                          }
                          disabled={
                            busy ||
                            isSelf
                          }
                          onChange={(e) =>
                            changeStatus(
                              item,
                              e.target.value,
                            )
                          }
                        >

                          <option value="ACTIVE">
                            ACTIVE - Hoạt động
                          </option>

                          <option value="INACTIVE">
                            INACTIVE - Khóa tài khoản
                          </option>

                        </select>

                      </td>

                    </tr>
                  )
                },
              )}

            </tbody>

          </table>

        </div>


        {!loading &&
        filteredUsers.length ===
          0 ? (

          <p className="muted">
            Không tìm thấy tài khoản phù hợp.
          </p>

        ) : null}

      </section>

    </>
  )
}