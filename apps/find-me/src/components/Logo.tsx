/** A paw inside a location pin: found, and nearby. */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <path d="M16 2C9.4 2 4 7.2 4 13.7 4 22.4 16 30 16 30s12-7.6 12-16.3C28 7.2 22.6 2 16 2Z" fill="#D9481F" />
      <g fill="#FFF8F0">
        <ellipse cx="16" cy="16.5" rx="4.2" ry="3.6" />
        <circle cx="11.3" cy="11.6" r="1.8" />
        <circle cx="14.4" cy="9.3" r="1.8" />
        <circle cx="17.6" cy="9.3" r="1.8" />
        <circle cx="20.7" cy="11.6" r="1.8" />
      </g>
    </svg>
  );
}
