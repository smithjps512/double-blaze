"use client";

import Link from "next/link";

/**
 * Region selector (task item 3). Lists the active regions plus an
 * "Other / not listed" escape hatch, routing the visitor to the region page.
 * No geolocation: the visitor chooses. Built on a native <details> disclosure so
 * it is keyboard accessible and works without client-side JavaScript.
 *
 * `regions` is computed server-side from the (DB-resolved) active set, so this
 * component carries no secrets and renders the same in a zero-secrets build.
 */
export function RegionSelector({
  regions,
  currentSlug,
  className = "",
}: {
  regions: { slug: string; name: string }[];
  currentSlug?: string;
  className?: string;
}) {
  const current = regions.find((r) => r.slug === currentSlug);
  const label = current ? current.name : "Choose your region";

  if (regions.length === 0) return null;

  return (
    <details className={`group relative ${className}`}>
      <summary
        className="flex cursor-pointer list-none items-center gap-1.5 rounded-md border border-ink/15 px-3 py-2 text-sm font-medium text-ink/80 hover:text-ink [&::-webkit-details-marker]:hidden"
        aria-label="Choose your region"
      >
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path
            d="M10 2.5c-3 0-5.5 2.4-5.5 5.4 0 3.9 5.5 9.6 5.5 9.6s5.5-5.7 5.5-9.6c0-3-2.5-5.4-5.5-5.4Z"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <circle cx="10" cy="7.9" r="1.9" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        <span className="max-w-[12rem] truncate">{label}</span>
        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true" className="transition-transform group-open:rotate-180">
          <path d="M5 8l5 5 5-5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </summary>
      <div className="absolute right-0 z-50 mt-2 w-60 rounded-lg border border-ink/10 bg-stone-white p-2 shadow-lg">
        <nav aria-label="Regions" className="flex flex-col">
          {regions.map((r) => (
            <Link
              key={r.slug}
              href={`/regions/${r.slug}`}
              aria-current={r.slug === currentSlug ? "page" : undefined}
              className="rounded-md px-3 py-2 text-sm font-medium text-ink/80 hover:bg-ink/5 aria-[current=page]:text-impact-orange"
            >
              {r.name}
            </Link>
          ))}
          <Link
            href="/start-a-project"
            className="mt-1 border-t border-ink/10 px-3 pt-2.5 pb-1 text-sm font-medium text-ink/60 hover:text-ink"
          >
            Other / not listed
          </Link>
        </nav>
      </div>
    </details>
  );
}
