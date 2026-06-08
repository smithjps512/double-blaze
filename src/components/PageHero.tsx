import type { ReactNode } from "react";

export function PageHero({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  children?: ReactNode;
}) {
  return (
    <section className="border-b border-ink/10 bg-blaze-maroon text-stone-white">
      <div className="container-page py-16 md:py-20">
        <p className="eyebrow text-trail-orange/90">{eyebrow}</p>
        <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight sm:text-5xl">
          {title}
        </h1>
        {intro && (
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-stone-white/85">
            {intro}
          </p>
        )}
        {children}
      </div>
    </section>
  );
}
