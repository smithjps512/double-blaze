import { BRAND } from "@/lib/brand";

/**
 * Wordmark. The two stacked marks are trail "blazes" (the painted rectangles
 * that mark a path), nodding to the Double Blaze name.
 */
export function Logo({ onDark = false }: { onDark?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span
        aria-hidden="true"
        className="inline-flex flex-col gap-0.5"
      >
        <span className="block h-3 w-2 rounded-[1px] bg-trail-orange" />
        <span className="block h-3 w-2 rounded-[1px] bg-blaze-maroon" />
      </span>
      <span
        className={`font-display text-lg font-bold leading-none tracking-tight ${
          onDark ? "text-stone-white" : "text-ink"
        }`}
      >
        {BRAND.shortName}
      </span>
    </span>
  );
}
