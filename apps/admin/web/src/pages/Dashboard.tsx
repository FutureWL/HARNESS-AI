import { Activity, HardDrive, Shield, Users } from 'lucide-react'
import { useEffect, useState } from 'react'

import { MetricCard } from '@/components/MetricCard'
import { Panel } from '@/components/Panel'
import { StatusBadge } from '@/components/StatusBadge'
import { adminApi, type DashboardOverview, type ModelProfileRecord, type SystemConfigRecord } from '@/lib/admin-api'
import { useAdminSession } from '@/store/useAdminSession'

export default function Dashboard() {
  const { token } = useAdminSession()
  const [overview, setOverview] = useState<DashboardOverview | null>(null)
  const [profiles, setProfiles] = useState<ModelProfileRecord[]>([])
  const [configs, setConfigs] = useState<SystemConfigRecord[]>([])

  useEffect(() => {
    if (!token) return

    void Promise.all([
      adminApi.dashboard(token),
      adminApi.modelProfiles(token),
      adminApi.systemConfigs(token),
    ]).then(([overviewData, profileData, configData]) => {
      setOverview(overviewData)
      setProfiles(profileData)
      setConfigs(configData)
    })
  }, [token])

  const icons = [<Shield size={18} />, <Users size={18} />, <Activity size={18} />, <HardDrive size={18} />]

  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm uppercase tracking-[0.24em] text-zinc-500">系统总览</div>
        <h1 className="mt-3 text-3xl font-semibold text-white">后台运行状态</h1>
        <p className="mt-2 text-sm leading-6 text-zinc-400">
          聚焦查看当前组织、用户、设备和授权状态，并快速检查模型配置是否已正确下发。
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-4">
        {(overview?.metrics ?? []).map((metric, index) => (
          <MetricCard
            key={metric.label}
            title={metric.label}
            value={metric.value}
            delta={metric.delta}
            icon={icons[index] ?? <Shield size={18} />}
          />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Panel title="模型配置模板" description="当前组织正在使用的远程模型配置">
          <div className="space-y-3">
            {profiles.map((profile) => (
              <div key={profile.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-base font-medium text-white">{profile.model}</div>
                    <div className="mt-1 text-sm text-zinc-400">{profile.provider}</div>
                  </div>
                  <StatusBadge status={profile.enabled ? 'active' : 'disabled'} />
                </div>
                <div className="mt-3 text-sm text-zinc-500">{profile.apiBaseUrl}</div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="策略快照" description="后台下发给桌面端的关键开关">
          <div className="space-y-3">
            {configs.map((config) => (
              <div key={config.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                <div>
                  <div className="text-sm font-medium text-white">{config.configKey}</div>
                  <div className="mt-1 text-xs text-zinc-500">最近更新：{new Date(config.updatedAt).toLocaleString()}</div>
                </div>
                <StatusBadge status={String(config.configValue)} />
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel title="系统提醒" description="当前控制中心的重要提示">
        <div className="grid gap-3 md:grid-cols-2">
          {(overview?.alerts ?? []).map((item) => (
            <div key={item} className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4 text-sm leading-6 text-cyan-50">
              {item}
            </div>
          ))}
        </div>
      </Panel>
    </div>
  )
}
