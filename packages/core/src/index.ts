import { randomUUID } from 'node:crypto'
import { readFile, readdir, stat } from 'node:fs/promises'
import path from 'node:path'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)

export interface Document {
  id: string
  title: string
  content: string
  tags: string[]
  createdAt: string
  updatedAt: string
}

export interface SearchResult {
  id: string
  title: string
  snippet: string
  score: number
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface Settings {
  model: string
  apiKey: string
  baseUrl: string
}

// ─── Document store (SQLite) ──────────────────────────────────────────────────
import Database from 'better-sqlite3'

class DocumentStore {
  private db: Database.Database

  constructor(dbPath: string) {
    this.db = new Database(dbPath)
    this.db.pragma('journal_mode = WAL')
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        tags TEXT NOT NULL DEFAULT '[]',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE VIRTUAL TABLE IF NOT EXISTS documents_fts USING fts5(
        id UNINDEXED, title, content, tags,
        content='documents', content_rowid='rowid'
      );
      CREATE TRIGGER IF NOT EXISTS documents_ai AFTER INSERT ON documents BEGIN
        INSERT INTO documents_fts(rowid, id, title, content, tags)
        VALUES (new.rowid, new.id, new.title, new.content, new.tags);
      END;
      CREATE TRIGGER IF NOT EXISTS documents_ad AFTER DELETE ON documents BEGIN
        INSERT INTO documents_fts(documents_fts, rowid, id, title, content, tags)
        VALUES('delete', old.rowid, old.id, old.title, old.content, old.tags);
      END;
      CREATE TRIGGER IF NOT EXISTS documents_au AFTER UPDATE ON documents BEGIN
        INSERT INTO documents_fts(documents_fts, rowid, id, title, content, tags)
        VALUES('delete', old.rowid, old.id, old.title, old.content, old.tags);
        INSERT INTO documents_fts(rowid, id, title, content, tags)
        VALUES (new.rowid, new.id, new.title, new.content, new.tags);
      END;
    `)
  }

  insert(doc: Document) {
    this.db.prepare(
      `INSERT INTO documents (id, title, content, tags, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(doc.id, doc.title, doc.content, JSON.stringify(doc.tags), doc.createdAt, doc.updatedAt)
  }

  findById(id: string): Document | null {
    const row = this.db.prepare(`SELECT * FROM documents WHERE id = ?`).get(id) as Record<string, unknown> | undefined
    if (!row) return null
    return { id: row.id as string, title: row.title as string, content: row.content as string, tags: JSON.parse(row.tags as string), createdAt: row.created_at as string, updatedAt: row.updated_at as string }
  }

  search(query: string, limit = 10): SearchResult[] {
    const rows = this.db.prepare(`
      SELECT d.id, d.title, snippet(documents_fts, 2, '<mark>', '</mark>', '…', 32) as snippet,
             bm25(documents_fts) as score
      FROM documents_fts
      JOIN documents d ON d.id = documents_fts.id
      WHERE documents_fts MATCH ?
      ORDER BY score
      LIMIT ?
    `).all(query, limit) as Record<string, unknown>[]
    return rows.map(r => ({ id: r.id as string, title: r.title as string, snippet: r.snippet as string, score: Math.abs(r.score as number) }))
  }

  list(query?: string): Document[] {
    const rows = query
      ? this.search(query, 50)
      : this.db.prepare(`SELECT id FROM documents ORDER BY created_at DESC`).all() as Record<string, unknown>[]

    if (query) return rows.map(r => this.findById(r.id as string)!).filter(Boolean)
    return (rows as Record<string, unknown>[]).map(r => this.findById(r.id as string)!).filter(Boolean)
  }

  updateMeta(id: string, title: string, tags?: string[]) {
    const existing = this.findById(id)
    if (!existing) return
    const updated = { ...existing, title, tags: tags ?? existing.tags, updatedAt: new Date().toISOString() }
    this.db.prepare(`UPDATE documents SET title=?, tags=?, updated_at=? WHERE id=?`)
      .run(updated.title, JSON.stringify(updated.tags), updated.updatedAt, id)
  }
}

// ─── Chat store (JSON file) ───────────────────────────────────────────────────
interface ChatSession {
  messages: ChatMessage[]
}

class ChatStore {
  private sessions = new Map<string, ChatSession>()
  private sessionsPath: string

  constructor(dir: string) {
    this.sessionsPath = path.join(dir, 'chat-sessions.json')
  }

  async load() {
    try {
      const raw = await readFile(this.sessionsPath, 'utf-8')
      const data = JSON.parse(raw) as Record<string, ChatMessage[]>
      for (const [id, messages] of Object.entries(data)) {
        this.sessions.set(id, { messages })
      }
    } catch {}
  }

  save() {
    const data: Record<string, ChatMessage[]> = {}
    for (const [id, session] of this.sessions) data[id] = session.messages
    import('node:fs').then(({ writeFileSync }) =>
      writeFileSync(this.sessionsPath, JSON.stringify(data, null, 2))
    )
  }

  getOrCreate(sessionId: string) {
    if (!this.sessions.has(sessionId)) this.sessions.set(sessionId, { messages: [] })
    return this.sessions.get(sessionId)!
  }

  addMessage(sessionId: string, msg: ChatMessage) {
    this.getOrCreate(sessionId).messages.push(msg)
    this.save()
  }

  listMessages(sessionId: string) {
    return this.getOrCreate(sessionId).messages
  }
}

// ─── Settings store ────────────────────────────────────────────────────────────
class SettingsStore {
  private settings: Settings = { model: '', apiKey: '', baseUrl: '' }
  private path: string

  constructor(dir: string) {
    this.path = path.join(dir, 'settings.json')
  }

  async load() {
    try {
      const raw = await readFile(this.path, 'utf-8')
      this.settings = { ...this.settings, ...JSON.parse(raw) }
    } catch {}
  }

  get(): Settings { return { ...this.settings } }

  update(patch: Record<string, string>) {
    this.settings = { ...this.settings, ...patch }
    import('node:fs').then(({ writeFileSync }) =>
      writeFileSync(this.path, JSON.stringify(this.settings, null, 2))
    )
  }
}

// ─── File import ──────────────────────────────────────────────────────────────
async function readFileContent(filePath: string): Promise<string> {
  const ext = path.extname(filePath).toLowerCase()
  const content = await readFile(filePath, 'utf-8')
  if (ext === '.md' || ext === '.txt') return content
  if (ext === '.pdf') {
    try {
// eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse: (data: Buffer) => Promise<{ text: string }> = require('pdf-parse')
      const data = await pdfParse(Buffer.from(content, 'binary'))
      return data.text
    } catch {
      return '[PDF 解析失败]'
    }
  }
  return content
}

async function* walkDir(dir: string): AsyncGenerator<string> {
  const entries = await readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) yield* walkDir(full)
    else if (/\.(md|txt|pdf)$/i.test(entry.name)) yield full
  }
}

// ─── HarnessService ───────────────────────────────────────────────────────────
export class HarnessService {
  private docs!: DocumentStore
  private chat!: ChatStore
  private settings!: SettingsStore
  private dataDir: string

  constructor(dataDir: string) {
    this.dataDir = dataDir
  }

  async initialize() {
    const db = require('better-sqlite3')
    const dbPath = path.join(this.dataDir, 'harness.db')
    // ensure data dir
    await import('node:fs').then(({ mkdirSync }) => mkdirSync(this.dataDir, { recursive: true }))
    this.docs = new DocumentStore(dbPath)
    this.chat = new ChatStore(this.dataDir)
    this.settings = new SettingsStore(this.dataDir)
    await this.chat.load()
    await this.settings.load()
  }

  async importFiles(paths: string[]): Promise<Document[]> {
    const imported: Document[] = []
    for (const p of paths) {
      const st = await stat(p)
      const fileEntries = await readdir(p, { withFileTypes: true })
      const files = st.isDirectory()
        ? fileEntries.filter(e => /\.(md|txt|pdf)$/i.test(e.name)).map(e => path.join(p, e.name))
        : [p]

      for (const file of files) {
        const content = await readFileContent(file)
        const doc: Document = {
          id: randomUUID(),
          title: path.basename(file, path.extname(file)),
          content,
          tags: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        this.docs.insert(doc)
        imported.push(doc)
      }
    }
    return imported
  }

  listDocuments(query?: string): Document[] {
    return this.docs.list(query)
  }

  getDocument(id: string): Document | null {
    return this.docs.findById(id)
  }

  updateDocumentMeta(payload: { id: string; title: string; tags?: string[] }): Document | null {
    this.docs.updateMeta(payload.id, payload.title, payload.tags)
    return this.docs.findById(payload.id)
  }

  search(query: string, limit = 10): SearchResult[] {
    return this.docs.search(query, limit)
  }

  async ask(question: string, sessionId: string): Promise<ChatMessage> {
    const cfg = this.settings.get()
    const msgs = this.chat.listMessages(sessionId)
    const docs = this.search(question, 5)

    // Build RAG context
    const context = docs.length
      ? `【参考文档】\n${docs.map(d => `## ${d.title}\n${d.snippet || d.title}`).join('\n\n')}`
      : '（未检索到相关文档）'

    const prompt = `你是一个个人知识助手，基于用户的知识库回答问题。\n\n${context}\n\n【用户问题】\n${question}`

    let reply = '请先在设置中配置 AI API Key'
    if (cfg.apiKey) {
      try {
        const res = await fetch(`${cfg.baseUrl || 'https://api.openai.com'}/v1/chat/completions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${cfg.apiKey}` },
          body: JSON.stringify({ model: cfg.model || 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], stream: false }),
        })
        const json = await res.json() as { choices?: { message?: { content?: string } }[] }
        reply = json?.choices?.[0]?.message?.content || 'AI 未返回有效回答'
      } catch (e) {
        reply = `请求失败: ${e instanceof Error ? e.message : String(e)}`
      }
    }

    const userMsg: ChatMessage = { id: randomUUID(), role: 'user', content: question, timestamp: new Date().toISOString() }
    const assistantMsg: ChatMessage = { id: randomUUID(), role: 'assistant', content: reply, timestamp: new Date().toISOString() }
    this.chat.addMessage(sessionId, userMsg)
    this.chat.addMessage(sessionId, assistantMsg)
    return assistantMsg
  }

  listMessages(sessionId: string): ChatMessage[] {
    return this.chat.listMessages(sessionId)
  }

  getSettings(): Settings {
    return this.settings.get()
  }

  updateSettings(payload: Record<string, string>): Settings {
    this.settings.update(payload)
    return this.settings.get()
  }
}
