import { AlertCircle, ArrowRight, KeyRound, ShieldCheck } from 'lucide-react'
import { FormEvent, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { adminApi } from '@/lib/admin-api'
import { useAdminSession } from '@/store/useAdminSession'

export default function Login() {
  const navigate = useNavigate()
  const { setSession } = useAdminSession()
  const [email, setEmail] = useState('admin@harness.local')
  const [password, setPassword] = useState('admin123456')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const hint = useMemo(() => '默认演示账号：admin@harness.local / admin123456', [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      const payload = await adminApi.login(email, password)
      setSession(payload)
      navigate('/dashboard')
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '登录失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.18),_transparent_28%),linear-gradient(180deg,#050816_0%,#0b1120_50%,#030712_100%)] px-6 py-10 text-white">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-[36px] border border-white/10 bg-white/5 p-8 shadow-[0_40px_120px_rgba(0,0,0,0.45)] backdrop-blur-xl lg:p-10">
          <div className="inline-flex items-center gap-3 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-100">
            <ShieldCheck size={16} />
            Harness AI 后台控制中心
          </div>
          <h1 className="mt-6 max-w-2xl text-4xl font-semibold leading-tight lg:text-5xl">
            把用户、设备、授权与模型配置，统一收拢到一个后台里。
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-300">
            这是面向 `HARNESS-AI` 的运营控制台首版，专门负责管理桌面软件的用户、配置、设备状态和后台策略。
          </p>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              ['用户治理', '统一查看账号状态、组织归属与角色分配'],
              ['配置下发', '集中维护模型策略、系统参数与远程开关'],
              ['设备运维', '追踪桌面端在线情况、同步状态与授权生命周期'],
            ].map(([title, description]) => (
              <div key={title} className="rounded-3xl border border-white/10 bg-black/20 p-4">
                <div className="text-sm font-medium text-white">{title}</div>
                <div className="mt-2 text-sm leading-6 text-zinc-400">{description}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[32px] border border-white/10 bg-black/35 p-6 shadow-[0_30px_100px_rgba(0,0,0,0.5)] backdrop-blur-xl lg:p-8">
          <div className="mb-6">
            <div className="text-sm uppercase tracking-[0.26em] text-zinc-500">管理员登录</div>
            <h2 className="mt-3 text-2xl font-semibold">进入 Control Center</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-400">{hint}</p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm text-zinc-300">邮箱</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-zinc-500 focus:border-cyan-300/40 focus:bg-cyan-400/5"
                placeholder="admin@harness.local"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm text-zinc-300">密码</span>
              <div className="flex items-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3 focus-within:border-cyan-300/40 focus-within:bg-cyan-400/5">
                <KeyRound size={18} className="mr-3 text-zinc-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full bg-transparent text-white outline-none placeholder:text-zinc-500"
                  placeholder="请输入密码"
                />
              </div>
            </label>

            {error ? (
              <div className="flex items-start gap-3 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
                <AlertCircle size={18} className="mt-0.5" />
                <span>{error}</span>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? '登录中...' : '进入后台'}
              <ArrowRight size={18} />
            </button>
          </form>
        </section>
      </div>
    </div>
  )
}
