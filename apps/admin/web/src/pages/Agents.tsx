import { useEffect, useState } from 'react'
import { Bot, Copy, MessageSquare, Pencil, Plus, Trash2 } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

import { Panel } from '@/components/Panel'
import { StatusBadge } from '@/components/StatusBadge'
import { adminApi, type AgentProfile } from '@/lib/admin-api'
import { useAdminSession } from '@/store/useAdminSession'

export default function Agents() {
  const { token, profile } = useAdminSession()
  const navigate = useNavigate()
  const [agents, setAgents] = useState<AgentProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [workingId, setWorkingId] = useState<string | null>(null)

  async function reload() {
    if (!token) return
    setLoading(true)
    setError('')
    try {
      const data = await adminApi.listAgents(token)
      setAgents(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  async function handleDelete(agent: AgentProfile) {
    if (!token) return
    if (!confirm(`确认删除智能体《${agent.name}》及其所有会话？`)) return
    setWorkingId(agent.id)
    try {
      await adminApi.deleteAgent(token, agent.id)
      await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败')
    } finally {
      setWorkingId(null)
    }
  }

  async function handleDuplicate(agent: AgentProfile) {
    if (!token) return
    setWorkingId(agent.id)
    try {
      await adminApi.duplicateAgent(token, agent.id)
      await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : '复制失败')
    } finally {
      setWorkingId(null)
    }
  }

  async function startChat(agent: AgentProfile) {
    if (!token) return
    setWorkingId(agent.id)
    try {
      const result = await adminApi.createAgentSession(token, agent.id, {})
      navigate(`/agents/${agent.id}/sessions/${result.session.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : '开启会话失败')
    } finally {
      setWorkingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <Panel
        title="智能体"
        description="为不同场景定义专属助手：自定义人设、后端规则、可绑定的模型，让用户直接与之对话。"
        action={
          <Link
            to="/agents/new"
            className="inline-flex items-center gap-2 rounded-2xl bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-cyan-200"
          >
            <Plus size={16} /> 新建智能体
          </Link>
        }
      >
        {loading ? (
          <div className="text-sm text-zinc-400">加载中…</div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        ) : agents.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 px-6 py-12 text-center text-zinc-400">
            <Bot size={36} className="mx-auto mb-3 text-zinc-500" />
            <div className="text-base text-white">还没有任何智能体</div>
            <div className="mt-1 text-sm">点击右上角「新建智能体」开始定义你的第一个助手。</div>
          </div>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {agents.map((agent) => (
              <li
                key={agent.id}
                className="rounded-3xl border border-white/10 bg-black/30 p-5 transition hover:border-cyan-300/30 hover:bg-black/40"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-2xl">
                    <span>{agent.avatar || '🤖'}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="truncate text-base font-semibold">{agent.name}</div>
                      <StatusBadge tone={agent.status === 'active' ? 'green' : 'gray'}>
                        {agent.status === 'active' ? '启用' : '停用'}
                      </StatusBadge>
                    </div>
                    <div className="mt-1 line-clamp-2 text-sm text-zinc-400">
                      {agent.description || '尚未填写简介'}
                    </div>
                  </div>
                </div>

                <div className="mt-4 space-y-1 text-xs text-zinc-500">
                  <div>温度 {agent.temperature.toFixed(2)} · max_tokens {agent.maxTokens} · top_p {agent.topP.toFixed(2)}</div>
                  <div>最近更新 {new Date(agent.updatedAt).toLocaleString('zh-CN', { hour12: false })}</div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => startChat(agent)}
                    disabled={workingId === agent.id || agent.status !== 'active'}
                    className="inline-flex items-center gap-1 rounded-2xl bg-cyan-300 px-3 py-1.5 text-xs font-semibold text-slate-900 transition hover:bg-cyan-200 disabled:opacity-50"
                  >
                    <MessageSquare size={14} /> 开始对话
                  </button>
                  <Link
                    to={`/agents/${agent.id}/edit`}
                    className="inline-flex items-center gap-1 rounded-2xl border border-white/10 px-3 py-1.5 text-xs text-zinc-200 transition hover:border-cyan-300/30 hover:bg-cyan-400/10"
                  >
                    <Pencil size={14} /> 编辑
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDuplicate(agent)}
                    disabled={workingId === agent.id}
                    className="inline-flex items-center gap-1 rounded-2xl border border-white/10 px-3 py-1.5 text-xs text-zinc-200 transition hover:border-cyan-300/30 hover:bg-cyan-400/10 disabled:opacity-50"
                  >
                    <Copy size={14} /> 复制
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(agent)}
                    disabled={workingId === agent.id || agent.userId !== profile?.id}
                    title={agent.userId !== profile?.id ? '仅创建者可删除' : ''}
                    className="inline-flex items-center gap-1 rounded-2xl border border-rose-400/20 px-3 py-1.5 text-xs text-rose-200 transition hover:bg-rose-400/10 disabled:opacity-50"
                  >
                    <Trash2 size={14} /> 删除
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  )
}