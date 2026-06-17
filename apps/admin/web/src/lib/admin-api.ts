export type ApiResponse<T> = {
  success: boolean
  data: T
}

export type AdminProfile = {
  id: string
  organizationId: string
  email: string
  name: string
  role: 'super-admin' | 'org-admin' | 'ops'
  status: 'active' | 'disabled'
  lastLoginAt?: string
  createdAt: string
}

export type DashboardOverview = {
  metrics: Array<{ label: string; value: number; delta: string }>
  alerts: string[]
}

export type AdminUser = AdminProfile

export type DeviceRecord = {
  id: string
  organizationId: string
  userId?: string
  deviceCode: string
  platform: 'windows' | 'macos' | 'linux'
  appVersion: string
  status: 'online' | 'offline' | 'blocked'
  lastSeenAt?: string
  createdAt: string
}

export type LicenseRecord = {
  id: string
  organizationId: string
  plan: string
  seatLimit: number
  expiresAt: string
  status: 'active' | 'expired' | 'disabled'
}

export type ModelProfileRecord = {
  id: string
  organizationId: string
  provider: string
  apiBaseUrl: string
  model: string
  systemPrompt: string
  enabled: boolean
  updatedAt: string
}

export type SystemConfigRecord = {
  id: string
  organizationId: string
  configKey: string
  configValue: string | boolean | number
  updatedAt: string
}

export type AuditLogRecord = {
  id: string
  actorUserId: string
  action: string
  targetType: string
  targetId?: string
  detail: string
  createdAt: string
}

export type LoginResponse = {
  accessToken: string
  profile: AdminProfile
  credentials: {
    email: string
    passwordHint: string
  }
}

export type AgentStatus = 'active' | 'disabled'

export type AgentProfile = {
  id: string
  userId: string
  organizationId: string
  name: string
  avatar: string
  description: string
  systemPrompt: string
  welcomeMessage: string
  modelProfileId?: string
  temperature: number
  maxTokens: number
  topP: number
  status: AgentStatus
  createdAt: string
  updatedAt: string
}

export type AgentInput = {
  name: string
  avatar?: string
  description?: string
  systemPrompt: string
  welcomeMessage?: string
  modelProfileId?: string
  temperature?: number
  maxTokens?: number
  topP?: number
  status?: AgentStatus
}

export type AgentPatch = Partial<AgentInput> & { modelProfileId?: string | null }

export type AgentChatMessage = {
  id: string
  sessionId: string
  agentId: string
  userId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  citations: { documentId: string; title: string; snippet: string }[]
  createdAt: string
}

export type AgentChatSession = {
  id: string
  agentId: string
  userId: string
  organizationId: string
  title: string
  createdAt: string
  updatedAt: string
}

export type AgentSessionDetail = {
  session: AgentChatSession
  agent: AgentProfile
  messages: AgentChatMessage[]
}

const API_BASE_URL = import.meta.env.VITE_ADMIN_API_BASE_URL ?? 'http://localhost:37203/api'

async function request<T>(path: string, options: RequestInit = {}, token?: string) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  })

  const payload = (await response.json()) as ApiResponse<T> & { message?: string }
  if (!response.ok || !payload.success) {
    throw new Error(payload.message ?? '请求失败')
  }

  return payload.data
}

export const adminApi = {
  login(email: string, password: string) {
    return request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  },
  me(token: string) {
    return request<AdminProfile>('/auth/me', {}, token)
  },
  dashboard(token: string) {
    return request<DashboardOverview>('/dashboard/overview', {}, token)
  },
  users(token: string) {
    return request<AdminUser[]>('/users', {}, token)
  },
  updateUserStatus(token: string, id: string, status: 'active' | 'disabled', actorUserId: string) {
    return request<AdminUser>(`/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, actorUserId }),
    }, token)
  },
  devices(token: string) {
    return request<DeviceRecord[]>('/devices', {}, token)
  },
  licenses(token: string) {
    return request<LicenseRecord[]>('/licenses', {}, token)
  },
  modelProfiles(token: string) {
    return request<ModelProfileRecord[]>('/model-profiles', {}, token)
  },
  createModelProfile(
    token: string,
    input: {
      provider: string
      apiBaseUrl: string
      apiKey?: string
      model: string
      systemPrompt?: string
      enabled?: boolean
    },
  ) {
    return request<ModelProfileRecord>('/model-profiles', {
      method: 'POST',
      body: JSON.stringify(input),
    }, token)
  },
  updateModelProfile(
    token: string,
    id: string,
    patch: {
      provider?: string
      apiBaseUrl?: string
      apiKey?: string | null
      model?: string
      systemPrompt?: string
      enabled?: boolean
    },
  ) {
    return request<ModelProfileRecord>(`/model-profiles/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }, token)
  },
  deleteModelProfile(token: string, id: string) {
    return request<{ id: string }>(`/model-profiles/${id}`, {
      method: 'DELETE',
    }, token)
  },
  systemConfigs(token: string) {
    return request<SystemConfigRecord[]>('/system-configs', {}, token)
  },
  updateSystemConfig(
    token: string,
    key: string,
    value: string | boolean | number,
    actorUserId: string,
  ) {
    return request<SystemConfigRecord>(`/system-configs/${key}`, {
      method: 'PUT',
      body: JSON.stringify({ value, actorUserId }),
    }, token)
  },
  auditLogs(token: string) {
    return request<AuditLogRecord[]>('/audit-logs', {}, token)
  },

  // ── Agents ─────────────────────────────────────────────────
  listAgents(token: string) {
    return request<AgentProfile[]>('/agents', {}, token)
  },
  getAgent(token: string, id: string) {
    return request<AgentProfile>(`/agents/${id}`, {}, token)
  },
  createAgent(token: string, input: AgentInput) {
    return request<AgentProfile>('/agents', {
      method: 'POST',
      body: JSON.stringify(input),
    }, token)
  },
  updateAgent(token: string, id: string, patch: AgentPatch) {
    return request<AgentProfile>(`/agents/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }, token)
  },
  deleteAgent(token: string, id: string) {
    return request<{ id: string }>(`/agents/${id}`, { method: 'DELETE' }, token)
  },
  duplicateAgent(token: string, id: string) {
    return request<AgentProfile>(`/agents/${id}/duplicate`, {
      method: 'POST',
    }, token)
  },
  listAgentSessions(token: string, agentId: string) {
    return request<AgentChatSession[]>(`/agents/${agentId}/sessions`, {}, token)
  },
  createAgentSession(token: string, agentId: string, input: { title?: string }) {
    return request<{ session: AgentChatSession; agent: AgentProfile; welcomeMessage: string }>(
      `/agents/${agentId}/sessions`,
      { method: 'POST', body: JSON.stringify(input) },
      token,
    )
  },
  getAgentSession(token: string, agentId: string, sessionId: string) {
    return request<AgentSessionDetail>(
      `/agents/${agentId}/sessions/${sessionId}`,
      {},
      token,
    )
  },
  deleteAgentSession(token: string, agentId: string, sessionId: string) {
    return request<{ id: string }>(
      `/agents/${agentId}/sessions/${sessionId}`,
      { method: 'DELETE' },
      token,
    )
  },
  postAgentMessage(
    token: string,
    agentId: string,
    sessionId: string,
    content: string,
  ) {
    return request<{
      userMessage: AgentChatMessage
      assistantMessage: AgentChatMessage
      agent: AgentProfile
      model: { id: string; provider: string; model: string; apiBaseUrl: string } | null
      mocked: boolean
    }>(`/agents/${agentId}/sessions/${sessionId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }, token)
  },
}
