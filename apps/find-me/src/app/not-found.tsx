import Link from "next/link";

export default function NotFound() {
  return (
    <section className="mx-auto max-w-lg px-4 py-20 text-center">
      <h1 className="font-display text-5xl font-extrabold">This one wandered off</h1>
      <p className="mt-3 text-muted">We could not find that page. The pet may have been adopted, which is good news.</p>
      <Link href="/animals" className="btn-primary mt-6">
        See who is waiting
      </Link>
    </section>
  );
}
