import type { Species } from "@/lib/types";

const TINTS = ["#FCE9E2", "#E3EFEC", "#FDF3D6", "#EDE4F7", "#E2EEF9"];

function tint(seed: string): string {
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return TINTS[h % TINTS.length];
}

/**
 * The shelter's photo, or a friendly drawn placeholder with the animal's
 * initial while the shelter has not added one.
 */
export function AnimalPhoto({
  name,
  species,
  photoUrl,
  className = "",
  sizes = "(min-width: 640px) 33vw, 100vw",
}: {
  name: string;
  species: Species;
  photoUrl: string | null;
  className?: string;
  sizes?: string;
}) {
  if (photoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={photoUrl} alt={`Photo of ${name}`} sizes={sizes} className={`object-cover ${className}`} loading="lazy" />;
  }
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden ${className}`}
      style={{ background: tint(name) }}
      role="img"
      aria-label={`${name}, photo coming soon`}
    >
      <svg viewBox="0 0 120 120" className="h-2/3 w-2/3 opacity-90" aria-hidden="true">
        {species === "dog" ? (
          <g fill="#1F4E4A">
            <path d="M30 42c-8-2-14 8-12 22 1 7 6 9 10 6l6-18Z" opacity=".75" />
            <path d="M90 42c8-2 14 8 12 22-1 7-6 9-10 6l-6-18Z" opacity=".75" />
            <ellipse cx="60" cy="62" rx="30" ry="32" opacity=".2" />
            <circle cx="49" cy="58" r="4" />
            <circle cx="71" cy="58" r="4" />
            <ellipse cx="60" cy="74" rx="7" ry="5" />
            <path d="M60 79v6m-7 2c4 3 10 3 14 0" stroke="#1F4E4A" strokeWidth="3" fill="none" strokeLinecap="round" />
          </g>
        ) : (
          <g fill="#1F4E4A">
            <path d="M34 30l10 22H28Z" opacity=".75" />
            <path d="M86 30L76 52h16Z" opacity=".75" />
            <ellipse cx="60" cy="64" rx="30" ry="28" opacity=".2" />
            <ellipse cx="49" cy="60" rx="4" ry="5" />
            <ellipse cx="71" cy="60" rx="4" ry="5" />
            <path d="M56 70h8l-4 4Z" />
            <path d="M30 70h16M30 76h16M74 70h16M74 76h16" stroke="#1F4E4A" strokeWidth="2" strokeLinecap="round" opacity=".6" />
          </g>
        )}
      </svg>
      <span className="absolute bottom-3 right-4 font-display text-4xl font-extrabold text-pine/30">{name.charAt(0)}</span>
    </div>
  );
}
