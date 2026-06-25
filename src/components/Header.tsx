import Link from "next/link";
import { Logo } from "./Logo";
import { RegionSelector } from "./RegionSelector";
import { NAV_LINKS } from "@/lib/site";
import { activeRegions, HOME_REGION_SLUG } from "@/lib/regions";

/**
 * Sticky site header. Mobile nav uses a native <details> disclosure so it is
 * keyboard accessible and works without client-side JavaScript.
 *
 * The region selector lists the active regions from the static seed (zero
 * secrets, fully static) and defaults to the home region.
 */
export function Header() {
  const regions = activeRegions().map((r) => ({ slug: r.slug, name: r.name }));
  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-stone-white/90 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between">
        <Link href="/" aria-label={`${"Double Blaze"} home`}>
          <Logo />
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-ink/80 transition-colors hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
          <RegionSelector regions={regions} currentSlug={HOME_REGION_SLUG} />
          <Link href="/start-a-project" className="btn-primary">
            Start a project
          </Link>
        </nav>

        <details className="group relative md:hidden">
          <summary
            className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-md border border-ink/15 [&::-webkit-details-marker]:hidden"
            aria-label="Open menu"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M3 5h14M3 10h14M3 15h14"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
            </svg>
          </summary>
          <div className="absolute right-0 mt-2 w-56 rounded-lg border border-ink/10 bg-stone-white p-2 shadow-lg">
            <nav aria-label="Mobile" className="flex flex-col">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-md px-3 py-2.5 text-sm font-medium text-ink/80 hover:bg-ink/5"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/regions"
                className="rounded-md px-3 py-2.5 text-sm font-medium text-ink/80 hover:bg-ink/5"
              >
                Regions
              </Link>
              <Link
                href="/start-a-project"
                className="btn-primary mt-2 w-full"
              >
                Start a project
              </Link>
            </nav>
          </div>
        </details>
      </div>
    </header>
  );
}
