import { type ReactNode, useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { AdminShell } from '@/components/AdminShell'
import AgentChat from '@/pages/AgentChat'
import AgentEditor from '@/pages/AgentEditor'
import Agents from '@/pages/Agents'
import AuditLogs from '@/pages/AuditLogs'
import Configs from '@/pages/Configs'
import Dashboard from '@/pages/Dashboard'
import Devices from '@/pages/Devices'
import Licenses from '@/pages/Licenses'
import Login from '@/pages/Login'
import Users from '@/pages/Users'
import { useAdminSession } from '@/store/useAdminSession'

function ProtectedLayout({ children }: { children: ReactNode }) {
  const { token, hydrated } = useAdminSession()

  if (!hydrated) {
    return <div className="min-h-screen bg-slate-950" />
  }

  if (!token) {
    return <Navigate to="/login" replace />
  }

  return <AdminShell>{children}</AdminShell>
}

export default function App() {
  const hydrate = useAdminSession((state) => state.hydrate)

  useEffect(() => {
    hydrate()
  }, [hydrate])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedLayout>
              <Dashboard />
            </ProtectedLayout>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedLayout>
              <Users />
            </ProtectedLayout>
          }
        />
        <Route
          path="/devices"
          element={
            <ProtectedLayout>
              <Devices />
            </ProtectedLayout>
          }
        />
        <Route
          path="/licenses"
          element={
            <ProtectedLayout>
              <Licenses />
            </ProtectedLayout>
          }
        />
        <Route
          path="/configs"
          element={
            <ProtectedLayout>
              <Configs />
            </ProtectedLayout>
          }
        />
        <Route
          path="/audit-logs"
          element={
            <ProtectedLayout>
              <AuditLogs />
            </ProtectedLayout>
          }
        />
        <Route
          path="/agents"
          element={
            <ProtectedLayout>
              <Agents />
            </ProtectedLayout>
          }
        />
        <Route
          path="/agents/new"
          element={
            <ProtectedLayout>
              <AgentEditor />
            </ProtectedLayout>
          }
        />
        <Route
          path="/agents/:id/edit"
          element={
            <ProtectedLayout>
              <AgentEditor />
            </ProtectedLayout>
          }
        />
        <Route
          path="/agents/:id/sessions"
          element={
            <ProtectedLayout>
              <AgentChat />
            </ProtectedLayout>
          }
        />
        <Route
          path="/agents/:id/sessions/:sessionId"
          element={
            <ProtectedLayout>
              <AgentChat />
            </ProtectedLayout>
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
