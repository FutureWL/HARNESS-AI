import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, Bot, Plus, Send, Trash2, User } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { Panel } from '@/components/Panel'
import { adminApi, type AgentChatMessage, type AgentChatSession, type AgentProfile, type AgentSessionDetail } from '@/lib/admin-api'
import { useAdminSession } from '@/store/useAdminSession'

export default function AgentChat() {
  const { id: agentId, sessionId } = useParams<{ id: string; sessionId?: string }>()
  const navigate = useNavigate()
  const { token } = useAdminSession()

  const [agent, setAgent] = useState<AgentProfile | null>(null)
  const [sessions, setSessions] = useState<AgentChatSession[]>([])
  const [activeSession, setActiveSession] = useState<AgentChatSession | null>(null)
  const [messages, setMessages] = useState<AgentChatMessage[]>([])
  const [welcome, setWelcome] = useState('')
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [modelInfo, setModelInfo] = useState<{ model: string; mocked: boolean } | null>(null)
  const scrollRef = useRef<HTMLDivElement | null>(null)

  async function bootstrap() {
    if (!token || !agentId) return
    setLoading(true)
    setError('')
    try {
      const agentData = await adminApi.getAgent(token, agentId)
      setAgent(agentData)
      const sessionsData = await adminApi.listAgentSessions(token, agentId)
      setSessions(sessionsData)

      let target: AgentChatSession | undefined = sessionId
        ? sessionsData.find((s) => s.id === sessionId)
        : sessionsData[0]

      if (!target) {
        const created = await adminApi.createAgentSession(token, agentId, {})
        target = created.session
        setWelcome(created.welcomeMessage)
        setSessions((prev) => [created.session, ...prev])
      } else {
        setWelcome(agentData.welcomeMessage)
      }
      setActiveSession(target)
      await loadSession(target.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败')
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }

  async function loadSession(targetId: string) {
    if (!token || !agentId) return
    try {
      const detail: AgentSessionDetail = await adminApi.getAgentSession(token, agentId, targetId)
      setMessages(detail.messages)
      setActiveSession(detail.session)
      setWelcome(detail.agent.welcomeMessage)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载会话失败')
    }
  }

  useEffect(() => {
    bootstrap()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, agentId, sessionId])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  async function startNewSession() {
    if (!token || !agentId) return
    const created = await adminApi.createAgentSession(token, agentId, {})
    setSessions((prev) => [created.session, ...prev])
    setActiveSession(created.session)
    setMessages([])
    setWelcome(created.welcomeMessage)
    setModelInfo(null)
    navigate(`/agents/${agentId}/sessions/${created.session.id}`)
  }

  async function switchSession(target: AgentChatSession) {
    if (!token || !agentId) return
    setActiveSession(target)
    setMessages([])
    setModelInfo(null)
    await loadSession(target.id)
    navigate(`/agents/${agentId}/sessions/${target.id}`)
  }

  async function deleteCurrent() {
    if (!token || !agentId || !activeSession) return
    if (!confirm(`删除会话《${activeSession.title}》？`)) return
    await adminApi.deleteAgentSession(token, agentId, activeSession.id)
    const remaining = sessions.filter((s) => s.id !== activeSession.id)
    setSessions(remaining)
    if (remaining[0]) {
      switchSession(remaining[0])
    } else {
      startNewSession()
    }
  }

  async function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!token || !agentId || !activeSession) return
    const text = input.trim()
    if (!text) return
    setInput('')
    setSending(true)
    setError('')
    try {
      const result = await adminApi.postAgentMessage(token, agentId, activeSession.id, text)
      setMessages((prev) => [...prev, result.userMessage, result.assistantMessage])
      setModelInfo({
        model: result.model?.model ?? '(无模型)',
        mocked: result.mocked,
      })
      if (activeSession.title === `与《${result.agent.name}》的对话`) {
        setActiveSession({ ...activeSession, title: text.slice(0, 24) })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '发送失败')
    } finally {
      setSending(false)
    }
  }

  const empty = messages.length === 0

  return (
    <div className="grid h-[calc(100vh-7rem)] gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
      <Panel
        title="会话列表"
        description={`${agent?.name ?? '智能体'}`}
        action={
          <button
            type="button"
            onClick={startNewSession}
            className="inline-flex items-center gap-1 rounded-2xl border border-white/10 px-2 py-1 text-xs text-zinc-200 hover:border-cyan-300/30 hover:bg-cyan-400/10"
          >
            <Plus size={12} /> 新建
          </button>
        }
      >
        <div className="mb-3">
          <Link
            to="/agents"
            className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-cyan-200"
          >
            <ArrowLeft size={12} /> 返回智能体列表
          </Link>
        </div>
        {sessions.length === 0 ? (
          <div className="text-xs text-zinc-500">还没有会话</div>
        ) : (
          <ul className="space-y-1 overflow-y-auto pr-1" style={{ maxHeight: 'calc(100vh - 16rem)' }}>
            {sessions.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => switchSession(s)}
                  className={[
                    'w-full rounded-2xl px-3 py-2 text-left text-sm transition',
                    activeSession?.id === s.id
                      ? 'bg-cyan-400/15 text-cyan-100'
                      : 'text-zinc-300 hover:bg-white/5',
                  ].join(' ')}
                >
                  <div className="truncate">{s.title}</div>
                  <div className="mt-0.5 text-[10px] text-zinc-500">
                    {new Date(s.updatedAt).toLocaleString('zh-CN', { hour12: false })}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel
        title={
          <span className="flex items-center gap-2">
            <span className="text-xl">{agent?.avatar ?? '🤖'}</span>
            <span>{agent?.name ?? '加载中…'}</span>
            {agent?.status === 'disabled' ? (
              <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-xs text-amber-200">
                已停用
              </span>
            ) : null}
          </span>
        }
        description={agent?.description || ''}
        action={
          activeSession ? (
            <button
              type="button"
              onClick={deleteCurrent}
              className="inline-flex items-center gap-1 rounded-2xl border border-rose-400/20 px-3 py-1.5 text-xs text-rose-200 transition hover:bg-rose-400/10"
            >
              <Trash2 size={14} /> 删除会话
            </button>
          ) : null
        }
      >
        {loading ? (
          <div className="text-sm text-zinc-400">加载中…</div>
        ) : (
          <>
            <div ref={scrollRef} className="h-[calc(100vh-22rem)] overflow-y-auto rounded-3xl border border-white/10 bg-black/30 p-4">
              {empty ? (
                <div className="flex h-full items-center justify-center">
                  <div className="max-w-md rounded-3xl border border-white/10 bg-white/5 px-5 py-4 text-sm text-zinc-300">
                    {welcome || '你好，请告诉我你想聊什么。'}
                  </div>
                </div>
              ) : (
                <ul className="space-y-4">
                  {messages.map((m) => (
                    <li key={m.id} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {m.role === 'assistant' ? (
                        <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                          <Bot size={16} />
                        </div>
                      ) : null}
                      <div
                        className={[
                          'max-w-[78%] whitespace-pre-wrap rounded-3xl px-4 py-3 text-sm leading-7',
                          m.role === 'user'
                            ? 'bg-cyan-300 text-slate-900'
                            : 'border border-white/10 bg-white/5 text-white',
                        ].join(' ')}
                      >
                        {m.content}
                      </div>
                      {m.role === 'user' ? (
                        <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                          <User size={16} />
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {error ? (
              <div className="mt-3 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-2 text-sm text-rose-100">
                {error}
              </div>
            ) : null}

            {modelInfo ? (
              <div className="mt-2 text-xs text-zinc-500">
                模型 {modelInfo.model} · {modelInfo.mocked ? '演示模式' : '已联通'}
              </div>
            ) : null}

            <form onSubmit={handleSend} className="mt-3 flex items-end gap-3">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={2}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSend(e as unknown as FormEvent<HTMLFormElement>)
                  }
                }}
                placeholder={`给 ${agent?.name ?? '智能体'} 发消息（Enter 发送，Shift+Enter 换行）`}
                className="flex-1 resize-none rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/40 focus:bg-cyan-400/5"
              />
              <button
                type="submit"
                disabled={sending || agent?.status !== 'active'}
                className="inline-flex h-12 items-center gap-2 rounded-3xl bg-cyan-300 px-5 text-sm font-semibold text-slate-900 transition hover:bg-cyan-200 disabled:opacity-50"
              >
                <Send size={16} /> {sending ? '发送中…' : '发送'}
              </button>
            </form>
          </>
        )}
      </Panel>
    </div>
  )
}