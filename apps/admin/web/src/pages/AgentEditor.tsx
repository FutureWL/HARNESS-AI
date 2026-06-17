import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Save } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { Panel } from '@/components/Panel'
import { adminApi, type AgentInput, type AgentProfile, type ModelProfileRecord } from '@/lib/admin-api'
import { useAdminSession } from '@/store/useAdminSession'

const AVATAR_OPTIONS = ['🤖', '🧠', '📚', '💼', '🔬', '🎨', '🛠️', '🩺', '🧑‍💻', '🧑‍🏫', '✨', '🪄']

type FormState = {
  name: string
  avatar: string
  description: string
  systemPrompt: string
  welcomeMessage: string
  modelProfileId: string
  temperature: number
  maxTokens: number
  topP: number
  status: 'active' | 'disabled'
}

const EMPTY: FormState = {
  name: '',
  avatar: '🤖',
  description: '',
  systemPrompt: '',
  welcomeMessage: '',
  modelProfileId: '',
  temperature: 0.7,
  maxTokens: 1024,
  topP: 1,
  status: 'active',
}

export default function AgentEditor() {
  const { id } = useParams<{ id?: string }>()
  const isEdit = Boolean(id) && id !== 'new'
  const navigate = useNavigate()
  const { token } = useAdminSession()

  const [profiles, setProfiles] = useState<ModelProfileRecord[]>([])
  const [form, setForm] = useState<FormState>(EMPTY)
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) return
    let cancelled = false
    async function bootstrap() {
      try {
        const list = await adminApi.modelProfiles(token)
        if (!cancelled) setProfiles(list)
        if (isEdit && id) {
          const agent = await adminApi.getAgent(token, id)
          if (!cancelled) applyAgent(agent)
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : '加载失败')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    bootstrap()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, id])

  function applyAgent(agent: AgentProfile) {
    setForm({
      name: agent.name,
      avatar: agent.avatar,
      description: agent.description,
      systemPrompt: agent.systemPrompt,
      welcomeMessage: agent.welcomeMessage,
      modelProfileId: agent.modelProfileId ?? '',
      temperature: agent.temperature,
      maxTokens: agent.maxTokens,
      topP: agent.topP,
      status: agent.status,
    })
  }

  function patch<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const promptHint = useMemo(
    () =>
      '用一段自然语言描述这个智能体的角色、能力、行为边界和回答风格。模型会把它当作 system 提示。',
    [],
  )

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!token) return
    setSaving(true)
    setError('')

    const input: AgentInput = {
      name: form.name.trim(),
      avatar: form.avatar.trim() || '🤖',
      description: form.description.trim(),
      systemPrompt: form.systemPrompt.trim(),
      welcomeMessage: form.welcomeMessage.trim(),
      modelProfileId: form.modelProfileId || undefined,
      temperature: Number(form.temperature),
      maxTokens: Number(form.maxTokens),
      topP: Number(form.topP),
      status: form.status,
    }

    try {
      if (isEdit && id) {
        await adminApi.updateAgent(token, id, { ...input })
        navigate(`/agents/${id}/edit`)
      } else {
        const created = await adminApi.createAgent(token, input)
        navigate(`/agents/${created.id}/edit`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <Panel
        title={isEdit ? '编辑智能体' : '新建智能体'}
        description="智能体 = 用户定义的角色 + 后端 system prompt + 绑定的模型。它可以独立与用户对话。"
        action={
          <Link
            to="/agents"
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-3 py-1.5 text-sm text-zinc-200 transition hover:border-cyan-300/30 hover:bg-cyan-400/10"
          >
            <ArrowLeft size={16} /> 返回列表
          </Link>
        }
      >
        {loading ? (
          <div className="text-sm text-zinc-400">加载中…</div>
        ) : (
          <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <div className="space-y-5">
              <Field label="名称" required>
                <input
                  value={form.name}
                  onChange={(e) => patch('name', e.target.value)}
                  placeholder="比如：项目知识助手"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-white outline-none focus:border-cyan-300/40 focus:bg-cyan-400/5"
                  required
                />
              </Field>

              <Field label="头像">
                <div className="flex flex-wrap gap-2">
                  {AVATAR_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => patch('avatar', emoji)}
                      className={[
                        'h-10 w-10 rounded-2xl border text-xl transition',
                        form.avatar === emoji
                          ? 'border-cyan-300/60 bg-cyan-400/10'
                          : 'border-white/10 bg-white/5 hover:border-cyan-300/30',
                      ].join(' ')}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="简介">
                <textarea
                  value={form.description}
                  onChange={(e) => patch('description', e.target.value)}
                  rows={2}
                  placeholder="一句话讲清楚它能帮用户做什么"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-white outline-none focus:border-cyan-300/40 focus:bg-cyan-400/5"
                />
              </Field>

              <Field
                label="后端定义（System Prompt）"
                required
                hint={promptHint}
              >
                <textarea
                  value={form.systemPrompt}
                  onChange={(e) => patch('systemPrompt', e.target.value)}
                  rows={10}
                  placeholder="你是一名严谨的技术布道师，回答时优先引用本知识库..."
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 font-mono text-sm text-white outline-none focus:border-cyan-300/40 focus:bg-cyan-400/5"
                  required
                />
              </Field>

              <Field label="欢迎语">
                <textarea
                  value={form.welcomeMessage}
                  onChange={(e) => patch('welcomeMessage', e.target.value)}
                  rows={2}
                  placeholder="用户首次进入会话时展示的开场白"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-white outline-none focus:border-cyan-300/40 focus:bg-cyan-400/5"
                />
              </Field>
            </div>

            <div className="space-y-5">
              <Field label="绑定模型" hint="未选择时，会回落到组织内第一个启用的模型。">
                <select
                  value={form.modelProfileId}
                  onChange={(e) => patch('modelProfileId', e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-white outline-none focus:border-cyan-300/40 focus:bg-cyan-400/5"
                >
                  <option value="">（不绑定，使用默认）</option>
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.provider} · {p.model}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label={`温度 temperature：${form.temperature.toFixed(2)}`}>
                <input
                  type="range"
                  min={0}
                  max={2}
                  step={0.05}
                  value={form.temperature}
                  onChange={(e) => patch('temperature', Number(e.target.value))}
                  className="w-full"
                />
              </Field>

              <Field label={`top_p：${form.topP.toFixed(2)}`}>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={form.topP}
                  onChange={(e) => patch('topP', Number(e.target.value))}
                  className="w-full"
                />
              </Field>

              <Field label="max_tokens">
                <input
                  type="number"
                  min={64}
                  max={32768}
                  value={form.maxTokens}
                  onChange={(e) => patch('maxTokens', Number(e.target.value))}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-white outline-none focus:border-cyan-300/40 focus:bg-cyan-400/5"
                />
              </Field>

              <Field label="状态">
                <div className="flex gap-2">
                  {(['active', 'disabled'] as const).map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => patch('status', value)}
                      className={[
                        'flex-1 rounded-2xl border px-3 py-2 text-sm transition',
                        form.status === value
                          ? 'border-cyan-300/60 bg-cyan-400/10 text-cyan-100'
                          : 'border-white/10 bg-white/5 text-zinc-300 hover:border-cyan-300/30',
                      ].join(' ')}
                    >
                      {value === 'active' ? '启用' : '停用'}
                    </button>
                  ))}
                </div>
              </Field>

              {error ? (
                <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={saving}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-cyan-200 disabled:opacity-50"
              >
                <Save size={16} /> {saving ? '保存中…' : isEdit ? '保存修改' : '创建智能体'}
              </button>
            </div>
          </form>
        )}
      </Panel>
    </div>
  )
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string
  hint?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm text-zinc-300">
        {label}
        {required ? <span className="ml-1 text-rose-300">*</span> : null}
      </span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-zinc-500">{hint}</span> : null}
    </label>
  )
}