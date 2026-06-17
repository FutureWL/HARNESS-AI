import { LogOut, ShieldCheck } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import type { PropsWithChildren } from 'react'

import { useAdminSession } from '@/store/useAdminSession'

const navItems = [
  { to: '/dashboard', label: '仪表盘' },
  { to: '/agents', label: '智能体' },
  { to: '/users', label: '用户管理' },
  { to: '/devices', label: '设备管理' },
  { to: '/licenses', label: '授权管理' },
  { to: '/configs', label: '系统配置' },
  { to: '/audit-logs', label: '审计日志' },
]

export function AdminShell({ children }: PropsWithChildren) {
  const { profile, clearSession } = useAdminSession()

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.12),_transparent_26%),linear-gradient(180deg,#09090f_0%,#0f172a_55%,#09090f_100%)] text-white">
      <div className="mx-auto grid min-h-screen max-w-[1600px] grid-cols-1 gap-6 px-6 py-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="rounded-[28px] border border-white/10 bg-black/25 p-5 backdrop-blur-xl">
          <div className="mb-8 flex items-center gap-3">
            <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-3 text-cyan-200">
              <ShieldCheck size={20} />
            </div>
            <div>
              <div className="text-sm uppercase tracking-[0.28em] text-cyan-200">Harness</div>
              <div className="text-xl font-semibold">Control Center</div>
            </div>
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  [
                    'block rounded-2xl px-4 py-3 text-sm transition',
                    isActive
                      ? 'bg-cyan-400/15 text-cyan-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]'
                      : 'text-zinc-400 hover:bg-white/5 hover:text-white',
                  ].join(' ')
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs uppercase tracking-[0.24em] text-zinc-500">当前账号</div>
            <div className="mt-3 text-lg font-semibold">{profile?.name ?? '未登录'}</div>
            <div className="mt-1 text-sm text-zinc-400">{profile?.email ?? '-'}</div>
            <button
              type="button"
              onClick={clearSession}
              className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-white/10 px-3 py-2 text-sm text-zinc-200 transition hover:border-cyan-300/30 hover:bg-cyan-400/10"
            >
              <LogOut size={16} />
              退出登录
            </button>
          </div>
        </aside>

        <main className="rounded-[32px] border border-white/10 bg-black/20 p-6 backdrop-blur-xl">
          {children}
        </main>
      </div>
    </div>
  )
}
