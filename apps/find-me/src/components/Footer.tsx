import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-line bg-cream-dim pb-20 sm:pb-0">
      <div className="container-page flex flex-col gap-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>Find Me helps local shelter pets find homes, and helps new owners give them a great start.</p>
        <nav aria-label="Footer" className="flex gap-4">
          <Link href="/privacy" className="focus-ring rounded hover:text-ink">
            Privacy
          </Link>
          <Link href="/for-shelters" className="focus-ring rounded hover:text-ink">
            For shelters
          </Link>
        </nav>
      </div>
    </footer>
  );
}
