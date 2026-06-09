export interface DocumentRecord {
  id: string
  title: string
  filePath: string
  extension: string
  excerpt: string
  tags: string[]
  createdAt: string
  updatedAt: string
  chunkCount: number
}

export interface DocumentDetail extends DocumentRecord {
  contentPreview: string
}

export interface ImportFailure {
  path: string
  error: string
}

export interface ImportSummary {
  imported: number
  updated: number
  skipped: number
  failures: ImportFailure[]
}
