import Link from "next/link";
import { getViewer } from "@/lib/viewer";

export async function Header() {
  const { viewer } = await getViewer();
  return (
    <header className="asphalt text-chalk">
      <div className="mx-auto flex max-w-content items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="focus-ring group flex items-center gap-3 rounded">
          <span aria-hidden className="flex h-9 w-9 items-center justify-center rounded-md border-x-4 border-lane">
            <span className="h-2 w-5 -rotate-12 rounded-full bg-tape" />
          </span>
          <span className="leading-tight">
            <span className="block font-display text-lg font-extrabold tracking-tight">Paint Your Spot</span>
            <span className="block text-xs text-chalk/70">Blacksburg Middle School</span>
          </span>
        </Link>
        <nav className="flex items-center gap-2 text-sm">
          {viewer?.isAdmin && (
            <Link href="/admin" className="focus-ring rounded px-3 py-2 font-medium text-chalk/90 hover:text-tape">
              Admin
            </Link>
          )}
          {viewer ? (
            <>
              <Link href="/interest" className="focus-ring hidden rounded px-3 py-2 font-medium text-chalk/90 hover:text-tape sm:inline">
                My answers
              </Link>
              <form action="/auth/sign-out" method="post">
                <button className="focus-ring rounded border border-chalk/30 px-3 py-2 font-medium hover:border-tape hover:text-tape">
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <a
              href="/auth/sign-in?next=/interest"
              className="focus-ring rounded border border-chalk/30 px-3 py-2 font-medium hover:border-tape hover:text-tape"
            >
              Staff sign in
            </a>
          )}
        </nav>
      </div>
      <div aria-hidden className="tape h-2" />
    </header>
  );
}
