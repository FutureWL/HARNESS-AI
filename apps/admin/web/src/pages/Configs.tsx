import { Save } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Panel } from '@/components/Panel'
import { StatusBadge } from '@/components/StatusBadge'
import {
  adminApi,
  type ModelProfileRecord,
  type SystemConfigRecord,
} from '@/lib/admin-api'
import { useAdminSession } from '@/store/useAdminSession'

export default function Configs() {
  const { token, profile } = useAdminSession()
  const [profiles, setProfiles] = useState<ModelProfileRecord[]>([])
  const [configs, setConfigs] = useState<SystemConfigRecord[]>([])

  useEffect(() => {
    if (!token) return
    void Promise.all([adminApi.modelProfiles(token), adminApi.systemConfigs(token)]).then(
      ([profileData, configData]) => {
        setProfiles(profileData)
        setConfigs(configData)
      },
    )
  }, [token])

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
      <Panel title="模型配置" description="后台集中维护可下发给桌面端的模型模板">
        <div className="grid gap-4 xl:grid-cols-2">
          {profiles.map((profile) => (
            <article key={profile.id} className="rounded-3xl border border-white/10 bg-black/20 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-white">{profile.model}</div>
                  <div className="mt-1 text-sm text-zinc-400">{profile.provider}</div>
                </div>
                <StatusBadge status={profile.enabled ? 'active' : 'disabled'} />
              </div>
              <p className="mt-4 text-sm leading-6 text-zinc-400">{profile.systemPrompt}</p>
              <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-300">
                {profile.apiBaseUrl}
              </div>
            </article>
          ))}
        </div>
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
