import { useState } from 'react'

interface Props {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  autoComplete?: string
  minLength?: number
  required?: boolean
  autoFocus?: boolean
  id?: string
}

/** Password field with a show/hide toggle. Defaults to hidden. */
export function PasswordInput({
  value,
  onChange,
  placeholder = 'Password',
  autoComplete = 'current-password',
  minLength,
  required = true,
  autoFocus = false,
  id,
}: Props) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="relative">
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        required={required}
        minLength={minLength}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        className="w-full rounded-lg border border-white/10 bg-base py-2.5 pl-3 pr-11 text-sm text-fg placeholder:text-muted/60 focus:border-accent-violet focus:outline-none"
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        title={visible ? 'Hide password' : 'Show password'}
        className="absolute right-1 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-md text-muted transition hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-violet"
      >
        {visible ? (
          // Eye with a slash — currently visible, click to hide
          <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="M3 3l18 18" strokeLinecap="round" />
            <path d="M10.6 10.6a2 2 0 002.8 2.8" strokeLinecap="round" />
            <path d="M9.4 5.2A9.5 9.5 0 0112 5c5 0 9 4.5 9 7 0 .9-.7 2.2-1.9 3.5M6.2 6.8C4 8.2 3 10.2 3 12c0 2.5 4 7 9 7 1.4 0 2.7-.3 3.8-.9" strokeLinecap="round" />
          </svg>
        ) : (
          // Plain eye — currently hidden, click to show
          <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="M3 12s3.5-7 9-7 9 7 9 7-3.5 7-9 7-9-7-9-7z" strokeLinejoin="round" />
            <circle cx="12" cy="12" r="2.6" />
          </svg>
        )}
      </button>
    </div>
  )
}
