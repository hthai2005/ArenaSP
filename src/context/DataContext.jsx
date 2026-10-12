import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { api } from '../api/client'
import { useAuth } from './AuthContext'

const DataContext = createContext(null)

function mapStadium(item) {
  return {
    id: item.id,
    name: item.name,
    officialName: item.officialName ?? item.official_name ?? '',
    address: item.address,
    area: item.area ?? 0,
    capacity: item.capacity ?? 0,
    description: item.description ?? '',
    status: item.status,
  }
}

function mapHall(item) {
  return {
    id: item.id,
    code: item.code,
    name: item.name,
    stadiumId: item.stadiumId ?? item.stadium_id,
    type: item.type ?? '',
    capacity: item.capacity ?? 0,
    equipment: item.equipment ?? '',
    status: item.status,
    image: item.image || 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&q=80',
    description: item.description ?? '',
  }
}

function mapEquipment(item) {
  return {
    id: item.id,
    code: item.code,
    name: item.name,
    hallId: item.hallId ?? item.hall_id ?? null,
    quantity: item.quantity,
    status: item.status,
    inspectedAt: item.inspectedAt || item.inspected_at || '',
  }
}

export function DataProvider({ children }) {
  const { user, logout } = useAuth()
  const [stadiums, setStadiums] = useState([])
  const [halls, setHalls] = useState([])
  const [equipment, setEquipment] = useState([])
  const [logs, setLogs] = useState([])

  const handleAuthError = useCallback(
    (err) => {
      if (err.status === 401) logout()
      throw err
    },
    [logout],
  )

  const refresh = useCallback(async () => {
    if (!user) {
      setStadiums([])
      setHalls([])
      setEquipment([])
      return
    }
    try {
      const [stadiumRows, hallRows, equipmentRows] = await Promise.all([
        api('/api/stadiums/').catch((err) => (err.status === 403 ? [] : handleAuthError(err))),
        api('/api/halls/').catch((err) => (err.status === 403 ? [] : handleAuthError(err))),
        api('/api/equipments/').catch((err) => (err.status === 403 ? [] : handleAuthError(err))),
      ])
      setStadiums((stadiumRows || []).map(mapStadium))
      setHalls((hallRows || []).map(mapHall))
      setEquipment((equipmentRows || []).map(mapEquipment))
    } catch {
      /* 401 đã logout */
    }
  }, [user, handleAuthError])

  useEffect(() => {
    refresh()
  }, [refresh])

  const addStadium = async (item) => {
    const created = await api('/api/stadiums/', { method: 'POST', body: item }).catch(handleAuthError)
    await refresh()
    return created
  }

  const updateStadium = async (id, patch) => {
    await api(`/api/stadiums/${id}`, { method: 'PUT', body: patch }).catch(handleAuthError)
    await refresh()
  }

  const removeStadium = async (id) => {
    await api(`/api/stadiums/${id}`, { method: 'DELETE' }).catch(handleAuthError)
    await refresh()
  }

  const addHall = async (item) => {
    await api('/api/halls/', {
      method: 'POST',
      body: {
        stadiumId: item.stadiumId,
        name: item.name,
        type: item.type,
        capacity: item.capacity,
        status: item.status,
        description: item.equipment || item.description || null,
        image: item.image || null,
      },
    }).catch(handleAuthError)
    await refresh()
  }

  const updateHall = async (id, patch) => {
    await api(`/api/halls/${id}`, {
      method: 'PUT',
      body: {
        stadiumId: patch.stadiumId,
        name: patch.name,
        type: patch.type,
        capacity: patch.capacity,
        status: patch.status,
        description: patch.equipment || patch.description,
        image: patch.image,
      },
    }).catch(handleAuthError)
    await refresh()
  }

  const removeHall = async (id) => {
    await api(`/api/halls/${id}`, { method: 'DELETE' }).catch(handleAuthError)
    await refresh()
  }

  const addEquipment = async (item) => {
    await api('/api/equipments/', {
      method: 'POST',
      body: {
        name: item.name,
        hallId: item.hallId || null,
        quantity: item.quantity,
        inspectedAt: item.inspectedAt || null,
        status: item.status,
      },
    }).catch(handleAuthError)
    await refresh()
  }

  const updateEquipment = async (id, patch) => {
    await api(`/api/equipments/${id}`, {
      method: 'PUT',
      body: {
        name: patch.name,
        hallId: patch.hallId === '' ? null : patch.hallId,
        quantity: patch.quantity,
        inspectedAt: patch.inspectedAt || null,
        status: patch.status,
      },
    }).catch(handleAuthError)
    await refresh()
  }

  const removeEquipment = async (id) => {
    await api(`/api/equipments/${id}`, { method: 'DELETE' }).catch(handleAuthError)
    await refresh()
  }

  const addLog = (item) => setLogs((list) => [{ ...item, id: Date.now() }, ...list])

  return (
    <DataContext.Provider
      value={{
        stadiums,
        halls,
        equipment,
        logs,
        refresh,
        addStadium,
        updateStadium,
        removeStadium,
        addHall,
        updateHall,
        removeHall,
        addEquipment,
        updateEquipment,
        removeEquipment,
        addLog,
      }}
    >
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used inside DataProvider')
  return ctx
}
