import { HEADQUARTERS, OFFICES } from "@/lib/practice";

/** Where we work: the central office in Austin, then every other office. */
export function OfficesBand({ tone = "muted" }: { tone?: "muted" | "plain" }) {
  const others = OFFICES.filter((o) => o.city !== HEADQUARTERS.city);
  return (
    <section className={tone === "muted" ? "bg-ink/[0.03]" : "bg-stone-white"}>
      <div className="container-page py-20 md:py-24">
        <div className="max-w-2xl">
          <p className="eyebrow">Office and service locations</p>
          <h2 className="mt-3 text-3xl font-bold text-ink sm:text-4xl">
            {OFFICES.length} office and service locations. Central office in Austin.
          </h2>
          <p className="mt-4 text-lg text-ink/75">
            Local team members in or near every city, close to your people and
            your sites, from Texas to both coasts.
          </p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-12">
          <div className="rounded-xl bg-blaze-maroon p-6 text-stone-white md:col-span-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-trail-orange">
              Central office
            </p>
            <p className="mt-2 text-2xl font-bold">
              {HEADQUARTERS.city}, {HEADQUARTERS.state}
            </p>
          </div>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:col-span-8 lg:grid-cols-4">
            {others.map((o) => (
              <li
                key={o.city}
                className="rounded-xl border border-ink/10 bg-stone-white px-4 py-3"
              >
                <span className="block font-semibold text-ink">{o.city}</span>
                <span className="text-xs text-ink/60">{o.state}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
