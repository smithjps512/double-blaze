import Link from "next/link";
import { Logo } from "./Logo";
import { BRAND } from "@/lib/brand";
import { INTAKE_HREF, INTAKE_LABEL, NAV_LINKS } from "@/lib/site";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-auto bg-ink text-stone-white">
      <div className="container-page py-14">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <Logo onDark />
            <p className="mt-4 text-sm leading-relaxed text-stone-white/70">
              {BRAND.positioning}
            </p>
            <p className="mt-2 text-sm text-stone-white/55">
              Central office: Austin, Texas
            </p>
            <span className="mt-5 inline-flex w-fit items-center gap-2 rounded-full border border-stone-white/25 px-3 py-1 text-xs font-semibold text-stone-white/80">
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 rounded-full bg-trail-orange"
              />
              Veteran-owned
            </span>
          </div>

          <nav
            aria-label="Footer"
            className="flex flex-wrap gap-x-10 gap-y-3"
          >
            <div className="flex flex-col gap-3">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-stone-white/70 transition-colors hover:text-stone-white"
                >
                  {link.label}
                </Link>
              ))}
            </div>
            <div className="flex flex-col gap-3">
              <Link
                href={INTAKE_HREF}
                className="text-sm text-stone-white/70 transition-colors hover:text-stone-white"
              >
                {INTAKE_LABEL}
              </Link>
              <a
                href={`mailto:${BRAND.email}`}
                className="text-sm text-stone-white/70 transition-colors hover:text-stone-white"
              >
                {BRAND.email}
              </a>
            </div>
          </nav>
        </div>

        {/* Clean entity attribution per spec section 9 (certification firewall). */}
        <div className="mt-12 border-t border-stone-white/15 pt-6">
          <p className="text-xs leading-relaxed text-stone-white/55">
            {BRAND.legalLine}
          </p>
          <p className="mt-1 text-xs text-stone-white/55">
            &copy; {year} Double Blaze Solutions, LLC. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
