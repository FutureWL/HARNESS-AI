import {
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Pencil,
  Plus,
  Save,
  Trash2,
  XCircle,
} from 'lucide-react'
import { FormEvent, useEffect, useState } from 'react'

import { Panel } from '@/components/Panel'
import { StatusBadge } from '@/components/StatusBadge'
import {
  adminApi,
  type ModelProfileRecord,
  type SystemConfigRecord,
} from '@/lib/admin-api'
import { useAdminSession } from '@/store/useAdminSession'

const QUICK_TEMPLATES: Array<{
  label: string
  provider: string
  apiBaseUrl: string
  model: string
  hint: string
}> = [
  {
    label: 'DeepSeek（推荐）',
    provider: 'DeepSeek (OpenAI Compatible)',
    apiBaseUrl: 'https://api.deepseek.com',
    model: 'deepseek-v4-flash',
    hint: '速度快、价格低。在 platform.deepseek.com/api_keys 申请 key。',
  },
  {
    label: 'OpenAI',
    provider: 'OpenAI',
    apiBaseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
    hint: 'OpenAI 官方端点，base_url 末尾带 /v1。',
  },
  {
    label: 'Azure OpenAI',
    provider: 'Azure OpenAI',
    apiBaseUrl: 'https://YOUR-RESOURCE.openai.azure.com/openai/deployments/YOUR-DEPLOY',
    model: 'gpt-4o-mini',
    hint: 'Azure 需要把 deployment 路径填到 apiBaseUrl，key 用 Azure portal 的 key。',
  },
  {
    label: '通义千问 DashScope（OpenAI 兼容）',
    provider: 'Tongyi (DashScope)',
    apiBaseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    model: 'qwen-plus',
    hint: '阿里 DashScope 的 OpenAI 兼容模式。',
  },
  {
    label: '月之暗面 Moonshot（OpenAI 兼容）',
    provider: 'Moonshot',
    apiBaseUrl: 'https://api.moonshot.cn/v1',
    model: 'moonshot-v1-8k',
    hint: 'Moonshot Kimi 大模型，OpenAI 兼容。',
  },
  {
    label: '本地 Ollama（OpenAI 兼容）',
    provider: 'Ollama (Local)',
    apiBaseUrl: 'http://127.0.0.1:11434/v1',
    model: 'llama3.1',
    hint: '本地 Ollama 起的 OpenAI 兼容端口，可不填 key。',
  },
]

type ProfileForm = {
  provider: string
  apiBaseUrl: string
  apiKey: string
  model: string
  systemPrompt: string
  enabled: boolean
}

const EMPTY_FORM: ProfileForm = {
  provider: 'DeepSeek (OpenAI Compatible)',
  apiBaseUrl: 'https://api.deepseek.com',
  apiKey: '',
  model: 'deepseek-v4-flash',
  systemPrompt: '',
  enabled: true,
}

export default function Configs() {
  const { token, profile } = useAdminSession()
  const [profiles, setProfiles] = useState<ModelProfileRecord[]>([])
  const [configs, setConfigs] = useState<SystemConfigRecord[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<ProfileForm>(EMPTY_FORM)
  const [showKey, setShowKey] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (!token) return
    void reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  async function reload() {
    if (!token) return
    const [p, c] = await Promise.all([
      adminApi.modelProfiles(token),
      adminApi.systemConfigs(token),
    ])
    setProfiles(p)
    setConfigs(c)
  }

  function openCreate() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setError('')
    setSuccess('')
    setShowKey(false)
    setShowForm(true)
  }

  function openEdit(p: ModelProfileRecord) {
    setEditingId(p.id)
    setForm({
      provider: p.provider,
      apiBaseUrl: p.apiBaseUrl,
      apiKey: p.apiKey ?? '',
      model: p.model,
      systemPrompt: p.systemPrompt,
      enabled: p.enabled,
    })
    setError('')
    setSuccess('')
    setShowKey(false)
    setShowForm(true)
  }

  function applyTemplate(idx: number) {
    const tpl = QUICK_TEMPLATES[idx]
    setForm((prev) => ({
      ...prev,
      provider: tpl.provider,
      apiBaseUrl: tpl.apiBaseUrl,
      model: tpl.model,
    }))
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!token) return
    setError('')
    setSuccess('')
    if (!form.provider.trim() || !form.apiBaseUrl.trim() || !form.model.trim()) {
      setError('提供商、API 地址、模型名称 不能为空')
      return
    }
    setSaving(true)
    try {
      if (editingId) {
        await adminApi.updateModelProfile(token, editingId, {
          provider: form.provider.trim(),
          apiBaseUrl: form.apiBaseUrl.trim(),
          apiKey: form.apiKey.trim() ? form.apiKey.trim() : null,
          model: form.model.trim(),
          systemPrompt: form.systemPrompt.trim(),
          enabled: form.enabled,
        })
        setSuccess(`已更新《${form.provider} · ${form.model}》`)
      } else {
        await adminApi.createModelProfile(token, {
          provider: form.provider.trim(),
          apiBaseUrl: form.apiBaseUrl.trim(),
          apiKey: form.apiKey.trim() || undefined,
          model: form.model.trim(),
          systemPrompt: form.systemPrompt.trim(),
          enabled: form.enabled,
        })
        setSuccess(`已新增《${form.provider} · ${form.model}》`)
      }
      await reload()
      setShowForm(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(p: ModelProfileRecord) {
    if (!token) return
    if (!confirm(`确认删除模型配置《${p.provider} · ${p.model}》？已绑定的智能体将回退到默认。`))
      return
    await adminApi.deleteModelProfile(token, p.id)
    await reload()
  }

  async function handleToggleEnabled(p: ModelProfileRecord) {
    if (!token) return
    await adminApi.updateModelProfile(token, p.id, { enabled: !p.enabled })
    await reload()
  }

  async function toggleConfig(config: SystemConfigRecord) {
    if (!token || !profile || typeof config.configValue !== 'boolean') return
    const updated = await adminApi.updateSystemConfig(
      token,
      config.configKey,
      !config.configValue,
      profile.id,
    )
    setConfigs((current) => current.map((item) => (item.id === updated.id ? updated : item)))
  }

  return (
    <div className="space-y-6">
      <Panel
        title="模型配置"
        description="集中维护 LLM 端点、API Key 与模型名。智能体可直接选择这里的配置。"
        action={
          !showForm ? (
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-2xl bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-cyan-200"
            >
              <Plus size={16} /> 新增模型配置
            </button>
          ) : null
        }
      >
        {showForm ? (
          <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-2">
            <div className="lg:col-span-2">
              <div className="mb-2 text-xs text-zinc-500">快速模板（点击填入，再补 key）</div>
              <div className="flex flex-wrap gap-2">
                {QUICK_TEMPLATES.map((tpl, idx) => (
                  <button
                    key={tpl.label}
                    type="button"
                    onClick={() => applyTemplate(idx)}
                    className="rounded-2xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-200 transition hover:border-cyan-300/40 hover:bg-cyan-400/10"
                  >
                    {tpl.label}
                  </button>
                ))}
              </div>
            </div>

            <Field label="提供商">
              <input
                value={form.provider}
                onChange={(e) => setForm((p) => ({ ...p, provider: e.target.value }))}
                placeholder="例如：DeepSeek (OpenAI Compatible)"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-white outline-none focus:border-cyan-300/40 focus:bg-cyan-400/5"
              />
            </Field>

            <Field label="模型名" required>
              <input
                value={form.model}
                onChange={(e) => setForm((p) => ({ ...p, model: e.target.value }))}
                placeholder="deepseek-v4-flash / gpt-4o-mini / qwen-plus ..."
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-white outline-none focus:border-cyan-300/40 focus:bg-cyan-400/5"
                required
              />
            </Field>

            <Field
              label="API Base URL"
              required
              hint="OpenAI 兼容端点。DeepSeek 写 https://api.deepseek.com；OpenAI 写 https://api.openai.com/v1。"
            >
              <input
                value={form.apiBaseUrl}
                onChange={(e) => setForm((p) => ({ ...p, apiBaseUrl: e.target.value }))}
                placeholder="https://api.deepseek.com"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 font-mono text-sm text-white outline-none focus:border-cyan-300/40 focus:bg-cyan-400/5"
                required
              />
            </Field>

            <Field
              label="API Key"
              hint={
                editingId && form.apiKey
                  ? '留空表示不修改原 key；想清空就显式置空。'
                  : '本地 Ollama / Mock 服务可不填。'
              }
            >
              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 focus-within:border-cyan-300/40 focus-within:bg-cyan-400/5">
                <KeyRound size={16} className="text-zinc-500" />
                <input
                  type={showKey ? 'text' : 'password'}
                  value={form.apiKey}
                  onChange={(e) => setForm((p) => ({ ...p, apiKey: e.target.value }))}
                  placeholder="sk-..."
                  className="flex-1 bg-transparent font-mono text-sm text-white outline-none placeholder:text-zinc-500"
                />
                <button
                  type="button"
                  onClick={() => setShowKey((v) => !v)}
                  className="text-zinc-400 transition hover:text-cyan-200"
                  title={showKey ? '隐藏' : '显示'}
                >
                  {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </Field>

            <div className="lg:col-span-2">
              <Field label="默认 System Prompt（可选）" hint="该配置被智能体绑定时，会作为初始 system 消息；智能体自身的 systemPrompt 优先级更高。">
                <textarea
                  value={form.systemPrompt}
                  onChange={(e) => setForm((p) => ({ ...p, systemPrompt: e.target.value }))}
                  rows={3}
                  placeholder="你是一个严谨的中文技术助手..."
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-300/40 focus:bg-cyan-400/5"
                />
              </Field>
            </div>

            <div className="lg:col-span-2 flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-zinc-300">
                <input
                  type="checkbox"
                  checked={form.enabled}
                  onChange={(e) => setForm((p) => ({ ...p, enabled: e.target.checked }))}
                  className="h-4 w-4 accent-cyan-300"
                />
                启用此配置
              </label>
            </div>

            {error ? (
              <div className="lg:col-span-2 flex items-start gap-2 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
                <XCircle size={16} className="mt-0.5" /> {error}
              </div>
            ) : null}

            <div className="lg:col-span-2 flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-2xl bg-cyan-300 px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-cyan-200 disabled:opacity-50"
              >
                <Save size={16} /> {saving ? '保存中…' : editingId ? '保存修改' : '新增配置'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-2xl border border-white/10 px-4 py-2.5 text-sm text-zinc-200 transition hover:border-white/30"
              >
                取消
              </button>
              {success ? (
                <span className="inline-flex items-center gap-1 text-sm text-emerald-300">
                  <CheckCircle2 size={14} /> {success}
                </span>
              ) : null}
            </div>
          </form>
        ) : profiles.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 px-6 py-12 text-center text-zinc-400">
            <KeyRound size={32} className="mx-auto mb-3 text-zinc-500" />
            <div className="text-base text-white">还没有任何模型配置</div>
            <div className="mt-1 text-sm">点击「新增模型配置」填入 API Key。</div>
          </div>
        ) : (
          <ul className="grid gap-4 xl:grid-cols-2">
            {profiles.map((p) => (
              <li
                key={p.id}
                className="rounded-3xl border border-white/10 bg-black/20 p-5 transition hover:border-cyan-300/30"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="truncate text-base font-semibold">{p.provider}</div>
                      <StatusBadge status={p.enabled ? 'active' : 'disabled'} />
                    </div>
                    <div className="mt-1 truncate font-mono text-sm text-cyan-200">{p.model}</div>
                    <div className="mt-2 truncate font-mono text-xs text-zinc-500">{p.apiBaseUrl}</div>
                  </div>
                  <div className="flex shrink-0 flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => openEdit(p)}
                      className="inline-flex items-center gap-1 rounded-2xl border border-white/10 px-3 py-1.5 text-xs text-zinc-200 transition hover:border-cyan-300/30 hover:bg-cyan-400/10"
                    >
                      <Pencil size={12} /> 编辑
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleToggleEnabled(p)}
                      className="rounded-2xl border border-white/10 px-3 py-1.5 text-xs text-zinc-300 transition hover:border-white/30"
                    >
                      {p.enabled ? '停用' : '启用'}
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(p)}
                      className="inline-flex items-center gap-1 rounded-2xl border border-rose-400/20 px-3 py-1.5 text-xs text-rose-200 transition hover:bg-rose-400/10"
                    >
                      <Trash2 size={12} /> 删除
                    </button>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-300">
                  <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">API Key</span>
                  <div className="mt-1 font-mono text-xs">
                    {p.apiKey ? (
                      <span className="text-emerald-300">
                        ●●●●●●●●●●●●{' '}
                        <span className="text-zinc-500">（已配置，{p.apiKey.length} 位）</span>
                      </span>
                    ) : (
                      <span className="text-amber-300">未配置（将走演示/无 key 回落）</span>
                    )}
                  </div>
                </div>

                {p.systemPrompt ? (
                  <div className="mt-3 text-xs leading-6 text-zinc-500">
                    <span className="text-zinc-400">默认 Prompt：</span>
                    {p.systemPrompt.slice(0, 80)}
                    {p.systemPrompt.length > 80 ? '…' : ''}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="系统开关" description="支持直接在后台切换桌面端策略">
        <div className="grid gap-4 md:grid-cols-2">
          {configs.map((config) => (
            <article key={config.id} className="rounded-3xl border border-white/10 bg-black/20 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-white">{config.configKey}</div>
                  <div className="mt-1 text-sm text-zinc-400">
                    最近更新时间：{new Date(config.updatedAt).toLocaleString()}
                  </div>
                </div>
                <StatusBadge status={String(config.configValue)} />
              </div>
              <button
                type="button"
                onClick={() => void toggleConfig(config)}
                disabled={typeof config.configValue !== 'boolean'}
                className="mt-5 inline-flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-2 text-sm text-zinc-200 transition hover:border-cyan-300/40 hover:bg-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Save size={16} />
                切换配置
              </button>
            </article>
          ))}
        </div>
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