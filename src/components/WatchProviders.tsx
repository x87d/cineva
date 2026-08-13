import { useState } from 'react'
import { REGIONS, loadRegion, saveRegion, regionName } from '@/lib/regions'
import type { WatchProvider, WatchProviderCountry } from '@/types/movie'

const LOGO_BASE = 'https://image.tmdb.org/t/p/w92'

function ProviderRow({ label, providers }: { label: string; providers?: WatchProvider[] }) {
  if (!providers?.length) return null
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="w-16 shrink-0 text-xs uppercase tracking-wider text-muted">{label}</span>
      <div className="flex flex-wrap gap-2">
        {providers.map((provider) => (
          <div
            key={provider.provider_id}
            title={provider.provider_name}
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-base/60 py-1.5 pl-1.5 pr-3"
          >
            {provider.logo_path ? (
              <img
                src={`${LOGO_BASE}${provider.logo_path}`}
                alt=""
                loading="lazy"
                className="h-6 w-6 rounded"
              />
            ) : null}
            <span className="text-xs text-fg">{provider.provider_name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Where a film can actually be watched. Data is TMDB's, sourced from JustWatch. */
export function WatchProviders({
  providers,
}: {
  providers: Record<string, WatchProviderCountry> | undefined
}) {
  const [region, setRegion] = useState(loadRegion)

  const forRegion = providers?.[region]
  const hasAny = Boolean(
    forRegion && (forRegion.flatrate || forRegion.rent || forRegion.buy || forRegion.free),
  )

  // Somewhere else it *is* available — worth telling the user.
  const elsewhere = providers
    ? Object.keys(providers).filter((code) => providers[code]?.flatrate?.length).length
    : 0

  return (
    <section className="rounded-2xl border border-white/5 bg-surface p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold text-fg">Where to watch</h2>
        <select
          aria-label="Your country"
          value={region}
          onChange={(e) => {
            setRegion(e.target.value)
            saveRegion(e.target.value)
          }}
          className="rounded-lg border border-white/10 bg-base px-3 py-1.5 text-sm text-fg focus:border-accent-violet focus:outline-none"
        >
          {REGIONS.map((r) => (
            <option key={r.code} value={r.code}>
              {r.name}
            </option>
          ))}
        </select>
      </div>

      {hasAny ? (
        <div className="space-y-3">
          <ProviderRow label="Stream" providers={forRegion?.flatrate} />
          <ProviderRow label="Free" providers={forRegion?.free} />
          <ProviderRow label="Rent" providers={forRegion?.rent} />
          <ProviderRow label="Buy" providers={forRegion?.buy} />
          {forRegion?.link ? (
            <a
              href={forRegion.link}
              target="_blank"
              rel="noreferrer"
              className="inline-block pt-1 text-sm text-accent-violet hover:underline"
            >
              See full availability →
            </a>
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-muted">
          Not on any streaming service in {regionName(region)} right now.
          {elsewhere > 0 ? ` It's streaming in ${elsewhere} other countries — try another above.` : ''}
        </p>
      )}

      <p className="mt-4 border-t border-white/5 pt-3 text-[11px] text-muted/70">
        Availability data from JustWatch via TMDB.
      </p>
    </section>
  )
}
