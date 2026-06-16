import type { PropsWithChildren, ReactNode } from 'react'

type PanelProps = PropsWithChildren<{
  title: string
  description?: string
  action?: ReactNode
}>

export function Panel({ title, description, action, children }: PanelProps) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.28)]">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          {description ? <p className="mt-1 text-sm text-zinc-400">{description}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}
