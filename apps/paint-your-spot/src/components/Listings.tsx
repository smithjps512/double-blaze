import { formatMoney, type Settings } from "@/lib/settings";

interface Listing {
  mls: string;
  ribbon: string;
  title: string;
  tagline: string;
  features: string[];
  priceLabel: string;
  price: string;
  accent: "tape" | "blue" | "asphalt";
}

function ListingCard({ l }: { l: Listing }) {
  const ribbon =
    l.accent === "blue" ? "bg-bms text-white" : l.accent === "tape" ? "bg-tape text-ink" : "bg-asphalt text-tape";
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border-2 border-asphalt bg-white shadow-sign">
      <div className={`flex items-center justify-between px-5 py-2 font-stencil text-lg uppercase tracking-wider ${ribbon}`}>
        <span>{l.ribbon}</span>
        <span className="text-sm opacity-80">{l.mls}</span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-2xl font-extrabold leading-tight">{l.title}</h3>
        <p className="mt-1 text-muted">{l.tagline}</p>
        <ul className="mt-4 space-y-2 text-sm">
          {l.features.map((f) => (
            <li key={f} className="flex gap-2">
              <span aria-hidden className="mt-1.5 h-2 w-2 shrink-0 rotate-45 bg-tape ring-1 ring-bms" />
              <span>{f}</span>
            </li>
          ))}
        </ul>
        <div className="mt-auto pt-5">
          <div className="flex items-end justify-between border-t-2 border-dashed border-asphalt/20 pt-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">{l.priceLabel}</span>
            <span className="font-display text-2xl font-extrabold">{l.price}</span>
          </div>
        </div>
      </div>
    </article>
  );
}

function BossTeaser() {
  return (
    <article className="asphalt flex flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-asphalt p-8 text-center text-chalk shadow-sign">
      <p className="text-5xl" aria-hidden>
        👀
      </p>
      <h3 className="mt-4 font-display text-2xl font-extrabold">Something is happening here</h3>
      <p className="mt-2 text-chalk/70">Listing details withheld. Nothing to see. Carry on.</p>
    </article>
  );
}

export function Listings({ settings, isBoss }: { settings: Settings; isBoss: boolean }) {
  const soon = "Coming soon";
  const term = settings.term_text.trim();
  const potGoal = formatMoney(settings.boss_pot_goal) ?? "$100";

  const standard: Listing = {
    mls: "MLS BMS-001",
    ribbon: "Just listed",
    title: "Standard Lot",
    tagline: "Charming starter spot with endless potential. Bring your vision.",
    features: [
      "One full parking space of blank asphalt canvas",
      "Paint it yourself, or request an art student",
      "Your name on the deed, and on the pavement",
      ...(term ? [term] : []),
    ],
    priceLabel: "Asking",
    price: formatMoney(settings.standard_fee) ?? soon,
    accent: "tape",
  };

  const prime: Listing = {
    mls: "MLS BMS-002",
    ribbon: "Prime real estate",
    title: "Prime Real Estate",
    tagline: "Steps from the doors. Location, location, location.",
    features: [
      "Shortest walk on rainy mornings",
      "Maximum curb appeal, guaranteed foot traffic",
      "Very limited inventory, act accordingly",
    ],
    priceLabel: "Asking",
    price: formatMoney(settings.prime_fee) ?? soon,
    accent: "blue",
  };

  const boss: Listing = {
    mls: "MLS BMS-000",
    ribbon: "Exclusive",
    title: "Paint the Boss",
    tagline: "Dr. Johnson's spot. Owner not consulted.",
    features: [
      "He keeps his spot and parks there like always",
      `Staff chip into a group pot. At ${potGoal}, contributors vote on the design`,
      "He gets no say. Zero. None.",
      "Painted over a weekend and revealed as a surprise",
    ],
    priceLabel: "Group pot goal",
    price: potGoal,
    accent: "asphalt",
  };

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <ListingCard l={standard} />
      <ListingCard l={prime} />
      {isBoss ? <BossTeaser /> : <ListingCard l={boss} />}
    </div>
  );
}
