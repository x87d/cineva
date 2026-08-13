interface Props {
  value: number | null
  onChange: (rating: number | null) => void
  size?: 'sm' | 'md'
}

/** 1–5 stars. Clicking the current rating again clears it. */
export function StarRating({ value, onChange, size = 'md' }: Props) {
  const dimension = size === 'sm' ? 'h-4 w-4' : 'h-6 w-6'
  return (
    <div className="flex items-center gap-1" role="group" aria-label="Your rating">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = value !== null && star <= value
        return (
          <button
            key={star}
            onClick={() => onChange(value === star ? null : star)}
            aria-label={`${star} star${star === 1 ? '' : 's'}`}
            aria-pressed={filled}
            className="transition hover:scale-110"
          >
            <svg
              viewBox="0 0 24 24"
              className={`${dimension} ${filled ? 'text-accent-coral' : 'text-muted/40'}`}
              fill={filled ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z" strokeLinejoin="round" />
            </svg>
          </button>
        )
      })}
    </div>
  )
}
