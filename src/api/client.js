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
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    return detail.map((item) => item.msg || JSON.stringify(item)).join(' ')
  }
  return 'Yêu cầu không thành công.'
}

export async function api(path, { method = 'GET', body, auth = true } = {}) {
  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (auth) {
    const token = getToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  let res
  try {
    res = await fetch(path, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new Error('Không kết nối được máy chủ. Hãy chạy uvicorn cổng 8000.')
  }

  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const error = new Error(messageFromDetail(data?.detail))
    error.status = res.status
    throw error
  }
  return data
}

export function mapAppUser(raw) {
  const roleName = String(raw.role || raw.roleName || '').toUpperCase()
  let role = 'admin'
  if (roleName === 'STAFF') role = 'staff'
  else if (roleName === 'ORGANIZATION') role = 'user'

  return {
    id: raw.id,
    name: raw.fullName || raw.full_name || raw.name || raw.username,
    email: raw.email || '',
    phone: raw.phone || '',
    role,
    title:
      role === 'staff'
        ? 'Nhân viên vận hành'
        : role === 'user'
          ? 'Đơn vị sử dụng'
          : 'Ban quản lý nhà thi đấu',
  }
}
