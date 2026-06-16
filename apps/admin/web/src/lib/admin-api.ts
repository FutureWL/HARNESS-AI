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

const API_BASE_URL = import.meta.env.VITE_ADMIN_API_BASE_URL ?? 'http://localhost:3201/api'

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
}
