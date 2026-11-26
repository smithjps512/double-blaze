/* eslint-disable @next/next/no-img-element */

/** Joe's logo: the cook with breakfast and a burger. */
export function Logo({ className = "h-16 w-auto" }: { className?: string }) {
  return <img src="/joes-logo.png" alt="Joe's, Breakfast All Day" className={className} />;
}
