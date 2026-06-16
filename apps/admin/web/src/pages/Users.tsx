import { useEffect, useState } from 'react'

import { Panel } from '@/components/Panel'
import { StatusBadge } from '@/components/StatusBadge'
import { adminApi, type AdminUser } from '@/lib/admin-api'
import { useAdminSession } from '@/store/useAdminSession'

export default function Users() {
  const { token, profile } = useAdminSession()
  const [users, setUsers] = useState<AdminUser[]>([])

  useEffect(() => {
    if (!token) return
    void adminApi.users(token).then(setUsers)
  }, [token])

  async function toggleStatus(user: AdminUser) {
    if (!token || !profile) return
    const nextStatus = user.status === 'active' ? 'disabled' : 'active'
    const updated = await adminApi.updateUserStatus(token, user.id, nextStatus, profile.id)
    setUsers((current) => current.map((item) => (item.id === updated.id ? updated : item)))
  }

  return (
    <Panel title="用户管理" description="管理后台管理员和组织成员状态">
      <div className="overflow-hidden rounded-3xl border border-white/10">
        <table className="min-w-full divide-y divide-white/10 text-left">
          <thead className="bg-white/5 text-xs uppercase tracking-[0.2em] text-zinc-500">
            <tr>
              <th className="px-4 py-3">姓名</th>
              <th className="px-4 py-3">邮箱</th>
              <th className="px-4 py-3">角色</th>
              <th className="px-4 py-3">状态</th>
              <th className="px-4 py-3">最近登录</th>
              <th className="px-4 py-3 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 bg-black/20 text-sm text-zinc-200">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-4 py-4">{user.name}</td>
                <td className="px-4 py-4 text-zinc-400">{user.email}</td>
                <td className="px-4 py-4">{user.role}</td>
                <td className="px-4 py-4">
                  <StatusBadge status={user.status} />
                </td>
                <td className="px-4 py-4 text-zinc-400">
                  {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : '-'}
                </td>
                <td className="px-4 py-4 text-right">
                  <button
                    type="button"
                    onClick={() => void toggleStatus(user)}
                    className="rounded-2xl border border-white/10 px-3 py-2 text-xs uppercase tracking-[0.14em] text-zinc-200 transition hover:border-cyan-300/40 hover:bg-cyan-400/10"
                  >
                    {user.status === 'active' ? '禁用' : '启用'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}
