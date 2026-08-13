export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-white/5 bg-surface px-6 py-16 text-center">
      <p className="text-sm font-medium text-fg">We couldn&apos;t load films.</p>
      {message ? <p className="mt-1 max-w-md text-xs text-muted">{message}</p> : null}
      {onRetry ? (
        <button
          onClick={onRetry}
          className="mt-6 rounded-lg bg-accent-violet px-4 py-2 text-sm font-medium text-white transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-violet"
        >
          Try again
        </button>
      ) : null}
    </div>
  )
}
