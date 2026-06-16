import type { ReactNode } from 'react'

type MetricCardProps = {
  title: string
  value: number
  delta: string
  icon: ReactNode
}

export function MetricCard({ title, value, delta, icon }: MetricCardProps) {
  return (
    <article className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur">
      <div className="mb-5 flex items-center justify-between">
        <span className="text-xs uppercase tracking-[0.24em] text-zinc-400">{title}</span>
        <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-2 text-cyan-200">
          {icon}
        </div>
      </div>
      <div className="text-3xl font-semibold text-white">{value}</div>
      <div className="mt-2 text-sm text-zinc-400">{delta}</div>
    </article>
  )
}
