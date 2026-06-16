import { useEffect, useState } from 'react'

import { Panel } from '@/components/Panel'
import { StatusBadge } from '@/components/StatusBadge'
import { adminApi, type DeviceRecord } from '@/lib/admin-api'
import { useAdminSession } from '@/store/useAdminSession'

export default function Devices() {
  const { token } = useAdminSession()
  const [devices, setDevices] = useState<DeviceRecord[]>([])

  useEffect(() => {
    if (!token) return
    void adminApi.devices(token).then(setDevices)
  }, [token])

  return (
    <Panel title="设备管理" description="查看桌面端设备在线状态、版本和最近心跳">
      <div className="grid gap-4 xl:grid-cols-2">
        {devices.map((device) => (
          <article key={device.id} className="rounded-3xl border border-white/10 bg-black/20 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm uppercase tracking-[0.2em] text-zinc-500">{device.platform}</div>
                <h3 className="mt-2 text-xl font-semibold text-white">{device.deviceCode}</h3>
                <div className="mt-2 text-sm text-zinc-400">版本 {device.appVersion}</div>
              </div>
              <StatusBadge status={device.status} />
            </div>
            <div className="mt-5 grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-zinc-300">
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">组织 ID</span>
                <span>{device.organizationId}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">用户 ID</span>
                <span>{device.userId ?? '-'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">最近心跳</span>
                <span>{device.lastSeenAt ? new Date(device.lastSeenAt).toLocaleString() : '-'}</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </Panel>
  )
}
