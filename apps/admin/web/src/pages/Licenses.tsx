import { useEffect, useState } from 'react'

import { Panel } from '@/components/Panel'
import { StatusBadge } from '@/components/StatusBadge'
import { adminApi, type LicenseRecord } from '@/lib/admin-api'
import { useAdminSession } from '@/store/useAdminSession'

export default function Licenses() {
  const { token } = useAdminSession()
  const [licenses, setLicenses] = useState<LicenseRecord[]>([])

  useEffect(() => {
    if (!token) return
    void adminApi.licenses(token).then(setLicenses)
  }, [token])

  return (
    <Panel title="授权管理" description="追踪席位数量、套餐类型与到期情况">
      <div className="grid gap-4 lg:grid-cols-2">
        {licenses.map((license) => (
          <article key={license.id} className="rounded-3xl border border-white/10 bg-black/20 p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">License</div>
                <h3 className="mt-2 text-xl font-semibold text-white">{license.plan}</h3>
              </div>
              <StatusBadge status={license.status} />
            </div>
            <div className="mt-6 grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-zinc-300">
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">席位数</span>
                <span>{license.seatLimit}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">到期时间</span>
                <span>{new Date(license.expiresAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">组织 ID</span>
                <span>{license.organizationId}</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </Panel>
  )
}
