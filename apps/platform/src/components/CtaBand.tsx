import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { INTAKE_HREF, INTAKE_LABEL } from "@/lib/site";

/** Closing call to action shared by the marketing pages. */
export function CtaBand({
  title = "Tell us what you need. The first conversation is free.",
  body = "We connect you with the right program management group for a free discovery call, and that call becomes your proposal.",
}: {
  title?: string;
  body?: string;
}) {
  return (
    <section className="bg-stone-white">
      <div className="container-page py-20 md:py-24">
        <div className="rounded-2xl bg-ink px-8 py-14 text-center text-stone-white md:px-16">
          <h2 className="text-3xl font-bold sm:text-4xl">{title}</h2>
          <p className="mx-auto mt-4 max-w-xl text-stone-white/80">{body}</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href={INTAKE_HREF} className="btn-primary">
              {INTAKE_LABEL}
            </Link>
            <a href={`mailto:${BRAND.email}`} className="btn-on-dark">
              {BRAND.email}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
