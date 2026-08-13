import type { Reason } from '@/features/recommender/types'
import { reasonText } from '@/features/recommender/score'

/** The "why" behind a recommendation — the feature that sets Cineva apart. */
export function ReasonChips({ reasons }: { reasons: Reason[] }) {
  if (!reasons.length) return null
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {reasons.map((reason, index) => (
        <span
          key={`${reason.kind}-${index}`}
          className="rounded-full border border-accent-violet/30 bg-accent-violet/10 px-2 py-0.5 text-[11px] leading-4 text-accent-violet"
        >
          {reasonText(reason)}
        </span>
      ))}
    </div>
  )
}
