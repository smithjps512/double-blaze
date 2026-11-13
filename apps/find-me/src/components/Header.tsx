import Link from "next/link";
import { unreadCount } from "@/lib/conversations";
import { getViewer } from "@/lib/viewer";
import { Logo } from "./Logo";

export async function Header() {
  const { viewer, db } = await getViewer();
  const isStaff = Boolean(viewer && (viewer.shelterIds.length > 0 || viewer.isAdmin));
  const unread = viewer && db ? await unreadCount(db, viewer.id) : 0;
  // `short` is the phone tab bar label.
  const links = [
    { href: "/animals", label: "Browse", short: "Browse" },
    { href: "/match", label: "Find my match", short: "Match" },
    { href: "/lost-found", label: "Lost & found", short: "Lost & found" },
    { href: "/my", label: "My pets", short: "My pets" },
    ...(isStaff ? [{ href: "/staff", label: "Shelter", short: "Shelter" }] : []),
  ];
  return (
    <>
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
          {viewer && (
            <Link href="/messages" className="focus-ring relative rounded-full px-3 py-2 font-medium hover:bg-cream-dim">
              Messages
              {unread > 0 && (
                <span className="ml-1 rounded-full bg-ember px-2 py-0.5 text-xs font-bold text-white">
                  {unread}
                  <span className="sr-only"> unread</span>
                </span>
              )}
            </Link>
          )}
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
        {viewer && (
          <Link href="/messages" className="btn-secondary px-4 py-2 text-sm sm:hidden">
            Messages{unread > 0 ? ` (${unread})` : ""}
          </Link>
        )}
        {!viewer && (
          <Link href="/sign-in" className="btn-secondary px-4 py-2 text-sm sm:hidden">
            Sign in
          </Link>
        )}
      </div>
    </header>
    {/* Outside the header on purpose: its backdrop-blur would make the header
        the containing block, pinning this "fixed" bar under it, not to the screen. */}
    <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 grid border-t border-line bg-white sm:hidden"
        style={{ gridTemplateColumns: `repeat(${links.length}, minmax(0, 1fr))`, paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="focus-ring px-1 py-3 text-center text-xs font-semibold leading-tight text-pine">
            {l.short}
          </Link>
        ))}
      </nav>
    </>
  );
}
