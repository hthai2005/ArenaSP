import { createContext, useContext, useState } from 'react'
import { USERS } from '../data/mock'

const AuthContext = createContext(null)
const STORAGE_KEY = 'arenasp-user'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null
    } catch {
      return null
    }
  })

  const readExtraUsers = () => {
    try {
      return JSON.parse(localStorage.getItem('arenasp-extra-users')) || []
    } catch {
      return []
    }
  }

  const login = (email, password) => {
    const all = [...USERS, ...readExtraUsers()]
    const found = all.find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password,
    )
    if (!found) return { ok: false, message: 'Email hoặc mật khẩu không đúng.' }
    const safe = { ...found }
    delete safe.password
    localStorage.setItem(STORAGE_KEY, JSON.stringify(safe))
    setUser(safe)
    return { ok: true, role: safe.role }
  }

  const register = (payload) => {
    const all = [...USERS, ...readExtraUsers()]
    if (all.some((u) => u.email.toLowerCase() === payload.email.toLowerCase())) {
      return { ok: false, message: 'Email đã được đăng ký.' }
    }
    const next = {
      id: Date.now(),
      name: payload.name,
      email: payload.email,
      password: payload.password,
      role: 'user',
      title: 'Đơn vị sử dụng',
    }
    const list = [...extraUsers, next]
    localStorage.setItem('arenasp-extra-users', JSON.stringify(list))
    const safe = { ...next }
    delete safe.password
    localStorage.setItem(STORAGE_KEY, JSON.stringify(safe))
    setUser(safe)
    return { ok: true }
  }

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
