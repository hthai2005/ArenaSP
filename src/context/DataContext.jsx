import { createContext, useContext, useState } from 'react'
import {
  INITIAL_EQUIPMENT,
  INITIAL_HALLS,
  INITIAL_LOGS,
  INITIAL_STADIUMS,
} from '../data/mock'

const DataContext = createContext(null)

export function DataProvider({ children }) {
  const [stadiums, setStadiums] = useState(INITIAL_STADIUMS)
  const [halls, setHalls] = useState(INITIAL_HALLS)
  const [equipment, setEquipment] = useState(INITIAL_EQUIPMENT)
  const [logs, setLogs] = useState(INITIAL_LOGS)

  const addStadium = (item) => setStadiums((list) => [...list, { ...item, id: Date.now() }])
  const updateStadium = (id, patch) =>
    setStadiums((list) => list.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  const removeStadium = (id) => setStadiums((list) => list.filter((s) => s.id !== id))

  const addHall = (item) =>
    setHalls((list) => [...list, { ...item, id: Date.now(), code: `HT-${String(list.length + 1).padStart(2, '0')}` }])
  const updateHall = (id, patch) =>
    setHalls((list) => list.map((h) => (h.id === id ? { ...h, ...patch } : h)))
  const removeHall = (id) => setHalls((list) => list.filter((h) => h.id !== id))

  const addEquipment = (item) =>
    setEquipment((list) => [...list, { ...item, id: Date.now(), code: `TB-${String(list.length + 1).padStart(2, '0')}` }])
  const updateEquipment = (id, patch) =>
    setEquipment((list) => list.map((e) => (e.id === id ? { ...e, ...patch } : e)))
  const removeEquipment = (id) => setEquipment((list) => list.filter((e) => e.id !== id))

  const addLog = (item) => setLogs((list) => [{ ...item, id: Date.now() }, ...list])

  return (
    <DataContext.Provider
      value={{
        stadiums,
        halls,
        equipment,
        logs,
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
