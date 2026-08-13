import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'

export function SearchBar({ className = '', autoFocus = false }: { className?: string; autoFocus?: boolean }) {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = query.trim()
    if (trimmed) navigate(`/search?q=${encodeURIComponent(trimmed)}`)
  }

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`} role="search">
      <svg
        viewBox="0 0 24 24"
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m21 21-4.3-4.3" strokeLinecap="round" />
      </svg>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search films"
        aria-label="Search films"
        autoFocus={autoFocus}
        className="w-full rounded-lg border border-white/10 bg-surface py-2 pl-9 pr-3 text-sm text-fg placeholder:text-muted/70 focus:border-accent-violet focus:outline-none"
      />
    </form>
  )
}
