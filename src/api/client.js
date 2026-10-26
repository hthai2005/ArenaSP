const TOKEN_KEY = 'arenasp-token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

function messageFromDetail(detail) {
  if (!detail) return 'Yêu cầu không thành công.'

  if (typeof detail === 'string') {
    return detail
  }

  if (Array.isArray(detail)) {
    return detail
      .map((item) => item.msg || JSON.stringify(item))
      .join(' ')
  }

  return 'Yêu cầu không thành công.'
}

export async function api(
  path,
  {
    method = 'GET',
    body,
    auth = true,
  } = {},
) {
  const headers = {}

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }

  if (auth) {
    const token = getToken()

    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
  }

  let res

  try {
    res = await fetch(path, {
      method,
      headers,
      body:
        body !== undefined
          ? JSON.stringify(body)
          : undefined,
    })
  } catch {
    throw new Error(
      'Không kết nối được máy chủ. Hãy chạy backend ở cổng 8000.',
    )
  }

  const data = await res.json().catch(() => null)

  if (!res.ok) {
    const error = new Error(
      messageFromDetail(data?.detail),
    )

    error.status = res.status
    error.data = data

    throw error
  }

  return data
}

export function mapAppUser(raw) {
  const roleName = String(
    raw.role ||
      raw.roleName ||
      '',
  ).toUpperCase()

  const roleMap = {
    ADMIN: 'admin',
    MANAGER: 'manager',
    STAFF: 'staff',
    ORGANIZATION: 'user',
  }

  const titleMap = {
    ADMIN: 'Quản trị hệ thống',
    MANAGER: 'Ban quản lý nhà thi đấu',
    STAFF: 'Nhân viên vận hành',
    ORGANIZATION: 'Đơn vị sử dụng',
  }

  return {
    id: raw.id,

    name:
      raw.fullName ||
      raw.full_name ||
      raw.name ||
      raw.username,

    email: raw.email || '',

    phone: raw.phone || '',

    role:
      roleMap[roleName] ||
      'user',

    roleName,

    title:
      titleMap[roleName] ||
      'Người dùng',

    status:
      raw.status ||
      'ACTIVE',
  }
}