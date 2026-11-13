import Link from "next/link";
import { getViewer } from "@/lib/viewer";
import { Logo } from "./Logo";

export async function Header() {
  const { viewer } = await getViewer();
  const isStaff = Boolean(viewer && (viewer.shelterIds.length > 0 || viewer.isAdmin));
  const links = [
    { href: "/animals", label: "Browse" },
    { href: "/match", label: "Find my match" },
    { href: "/my", label: "My pets" },
    ...(isStaff ? [{ href: "/staff", label: "Shelter" }] : []),
  ];
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-cream/95 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link href="/" className="focus-ring flex items-center gap-2 rounded-lg" aria-label="Find Me home">
          <Logo className="h-8 w-8" />
          <span className="font-display text-xl font-extrabold tracking-tight">Find Me</span>
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-1 sm:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="focus-ring rounded-full px-3 py-2 font-medium hover:bg-cream-dim">
              {l.label}
            </Link>
          ))}
          {viewer ? (
            <form action="/auth/sign-out" method="post">
              <button className="focus-ring rounded-full px-3 py-2 text-muted hover:bg-cream-dim">Sign out</button>
            </form>
          ) : (
            <Link href="/sign-in" className="btn-secondary ml-2 px-4 py-2">
              Sign in
            </Link>
          )}
        </nav>
        {/* Phones get a bottom tab bar instead. */}
        {!viewer && (
          <Link href="/sign-in" className="btn-secondary px-4 py-2 text-sm sm:hidden">
            Sign in
          </Link>
        )}
      </div>
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 grid border-t border-line bg-white sm:hidden"
        style={{ gridTemplateColumns: `repeat(${links.length}, minmax(0, 1fr))`, paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="focus-ring py-3 text-center text-sm font-semibold text-pine">
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
