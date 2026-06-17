export type UserStatus = 'active' | 'disabled'
export type DeviceStatus = 'online' | 'offline' | 'blocked'
export type LicenseStatus = 'active' | 'expired' | 'disabled'

export interface OrganizationRecord {
  id: string
  name: string
  code: string
  status: 'active' | 'disabled'
  createdAt: string
}

export interface AdminUserRecord {
  id: string
  organizationId: string
  email: string
  name: string
  role: 'super-admin' | 'org-admin' | 'ops' | 'end-user'
  status: UserStatus
  passwordHash: string
  lastLoginAt?: string
  createdAt: string
}

export interface DeviceRecord {
  id: string
  organizationId: string
  userId?: string
  deviceCode: string
  platform: 'windows' | 'macos' | 'linux'
  appVersion: string
  status: DeviceStatus
  lastSeenAt?: string
  createdAt: string
}

export interface LicenseRecord {
  id: string
  organizationId: string
  plan: string
  seatLimit: number
  expiresAt: string
  status: LicenseStatus
}

export interface ModelProfileRecord {
  id: string
  organizationId: string
  provider: string
  apiBaseUrl: string
  apiKey?: string
  model: string
  systemPrompt: string
  enabled: boolean
  updatedAt: string
}

export interface SystemConfigRecord {
  id: string
  organizationId: string
  configKey: string
  configValue: string | boolean | number
  updatedAt: string
}

export interface AuditLogRecord {
  id: string
  actorUserId: string
  action: string
  targetType: string
  targetId?: string
  detail: string
  createdAt: string
}

export interface SyncJobRecord {
  id: string
  deviceId: string
  jobType: string
  status: 'pending' | 'success' | 'failed'
  updatedAt: string
}

export type ChatMessageRole = 'user' | 'assistant' | 'system'

export interface ChatCitationRecord {
  documentId: string
  title: string
  snippet: string
}

export interface ChatMessageRecord {
  id: string
  sessionId: string
  userId: string
  role: ChatMessageRole
  content: string
  citations: ChatCitationRecord[]
  createdAt: string
}

export interface ChatSessionRecord {
  id: string
  userId: string
  organizationId: string
  title: string
  modelProfileId?: string
  createdAt: string
  updatedAt: string
}

export type AgentStatus = 'active' | 'disabled'

export interface AgentRecord {
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

export interface AgentChatMessageRecord {
  id: string
  sessionId: string
  agentId: string
  userId: string
  role: ChatMessageRole
  content: string
  citations: ChatCitationRecord[]
  createdAt: string
}

export interface AgentChatSessionRecord {
  id: string
  agentId: string
  userId: string
  organizationId: string
  title: string
  createdAt: string
  updatedAt: string
}

export interface PersistedAdminData {
  organizations: OrganizationRecord[]
  users: AdminUserRecord[]
  devices: DeviceRecord[]
  licenses: LicenseRecord[]
  modelProfiles: ModelProfileRecord[]
  systemConfigs: SystemConfigRecord[]
  auditLogs: AuditLogRecord[]
  syncJobs: SyncJobRecord[]
  chatSessions: ChatSessionRecord[]
  chatMessages: ChatMessageRecord[]
  agents: AgentRecord[]
  agentSessions: AgentChatSessionRecord[]
  agentMessages: AgentChatMessageRecord[]
}
