import { createContext, useContext, useState } from 'react'
import { api, getToken, mapAppUser, setToken } from '../api/client'

const AuthContext = createContext(null)
const STORAGE_KEY = 'arenasp-user'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    if (!getToken()) {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null
    } catch {
      return null
    }
  })

  const persist = (next) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    setUser(next)
  }

  const login = async (email, password) => {
    try {
      const data = await api('/api/auth/login', {
        method: 'POST',
        auth: false,
        body: { username: email.trim(), password },
      })
      setToken(data.access_token)
      const mapped = mapAppUser(data.user)
      persist(mapped)
      return { ok: true, role: mapped.role }
    } catch (err) {
      return { ok: false, message: err.message }
    }
  }

  const register = async (payload) => {
    try {
      await api('/api/auth/register', {
        method: 'POST',
        auth: false,
        body: {
          fullName: payload.name,
          email: payload.email,
          phone: payload.phone,
          password: payload.password,
        },
      })
      return login(payload.email, payload.password)
    } catch (err) {
      return { ok: false, message: err.message }
    }
  }

  const logout = () => {
    setToken(null)
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
