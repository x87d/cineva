import type { ReactNode } from 'react'

export function EmptyState({ title, hint }: { title: string; hint?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-white/10 px-6 py-16 text-center">
      <p className="text-sm font-medium text-white">{title}</p>
      {hint ? <p className="mt-1 max-w-md text-xs text-muted">{hint}</p> : null}
    </div>
  )
}
