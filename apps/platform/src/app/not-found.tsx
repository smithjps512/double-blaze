import Link from "next/link";

export default function NotFound() {
  return (
    <section className="bg-stone-white">
      <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
        <p className="eyebrow">Off the trail</p>
        <h1 className="mt-4 text-4xl font-bold text-ink">Page not found</h1>
        <p className="mt-3 max-w-md text-ink/70">
          We could not find that page. Let us point you back to the path.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/" className="btn-primary">
            Back to home
          </Link>
          <Link href="/start-a-project" className="btn-secondary">
            Start a project
          </Link>
        </div>
      </div>
    </section>
  );
}
