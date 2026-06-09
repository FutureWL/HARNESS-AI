import type { SearchResult } from './search'

export interface HarnessSettings {
  apiBaseUrl: string
  apiKey: string
  model: string
  systemPrompt: string
  dataDir: string
}

export interface ChatCitation {
  documentId: string
  title: string
  filePath: string
  snippet: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  citations: ChatCitation[]
  createdAt: string
}

export interface ChatAnswer {
  message: ChatMessage
  context: SearchResult[]
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  traceId: string
}
