import { useEffect, useState } from 'react'

import { Panel } from '@/components/Panel'
import { adminApi, type AuditLogRecord } from '@/lib/admin-api'
import { useAdminSession } from '@/store/useAdminSession'

export default function AuditLogs() {
  const { token } = useAdminSession()
  const [logs, setLogs] = useState<AuditLogRecord[]>([])

  useEffect(() => {
    if (!token) return
    void adminApi.auditLogs(token).then(setLogs)
  }, [token])

  return (
    <Panel title="审计日志" description="记录关键登录、配置变更和系统事件">
      <div className="space-y-3">
        {logs.map((log) => (
          <article key={log.id} className="rounded-3xl border border-white/10 bg-black/20 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm font-medium text-white">{log.action}</div>
                <div className="mt-1 text-sm text-zinc-400">{log.detail}</div>
              </div>
              <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                {new Date(log.createdAt).toLocaleString()}
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-3 text-xs text-zinc-500">
              <span>actor: {log.actorUserId}</span>
              <span>target: {log.targetType}</span>
              <span>targetId: {log.targetId ?? '-'}</span>
            </div>
          </article>
        ))}
      </div>
    </Panel>
  )
}
