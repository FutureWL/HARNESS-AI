import clsx from 'clsx'

type StatusBadgeProps = {
  status: string
}

const statusClassMap: Record<string, string> = {
  active: 'bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-400/20',
  online: 'bg-cyan-500/15 text-cyan-200 ring-1 ring-cyan-400/20',
  success: 'bg-cyan-500/15 text-cyan-200 ring-1 ring-cyan-400/20',
  pending: 'bg-amber-500/15 text-amber-200 ring-1 ring-amber-400/20',
  expired: 'bg-rose-500/15 text-rose-200 ring-1 ring-rose-400/20',
  blocked: 'bg-rose-500/15 text-rose-200 ring-1 ring-rose-400/20',
  disabled: 'bg-zinc-500/20 text-zinc-300 ring-1 ring-white/10',
  offline: 'bg-zinc-500/20 text-zinc-300 ring-1 ring-white/10',
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium uppercase tracking-[0.18em]',
        statusClassMap[status] ?? 'bg-white/5 text-zinc-200 ring-1 ring-white/10',
      )}
    >
      {status}
    </span>
  )
}
