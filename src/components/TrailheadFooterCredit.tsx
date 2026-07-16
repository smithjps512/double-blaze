/**
 * Footer credit for Trailhead sites. Present on every published Trailhead
 * site, removed automatically on upgrade to any paid tier.
 */
export function TrailheadFooterCredit() {
  return (
    <p className="py-4 text-center text-xs text-ink/40">
      <a
        href="https://doubleblaze.solutions"
        className="hover:text-ink/60"
        target="_blank"
        rel="noopener noreferrer"
      >
        Built by Double Blaze
      </a>
    </p>
  );
}
