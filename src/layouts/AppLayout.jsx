import { createContext, useContext, useState } from 'react'
import { Outlet } from 'react-router-dom'
import Header from '../components/Header'
import Sidebar from '../components/Sidebar'

const PageMetaContext = createContext(null)

export function usePageMeta() {
  return useContext(PageMetaContext)
}

export default function AppLayout() {
  const [meta, setMeta] = useState({ title: 'ArenaSP', crumbs: 'Trang chủ' })

  return (
    <PageMetaContext.Provider value={setMeta}>
      <div className="app-shell">
        <Sidebar />
        <div className="main">
          <Header title={meta.title} crumbs={meta.crumbs} />
          <div className="content">
            <Outlet />
          </div>
        </div>
      </div>
    </PageMetaContext.Provider>
  )
}

