import Link from "next/link";
import type { StaffContext } from "@/lib/staff";

/** What a non-staff visitor sees on any /staff page. */
export function StaffGate({ ctx, next }: { ctx: Exclude<StaffContext, { kind: "demo" } | { kind: "staff" }>; next: string }) {
  return (
    <section className="mx-auto max-w-lg px-4 py-16 text-center">
      <h1 className="font-display text-4xl font-extrabold">Shelter staff</h1>
      {ctx.kind === "signed-out" ? (
        <>
          <p className="mt-3 text-muted">Sign in with the email your shelter registered with Find Me.</p>
          <Link href={`/sign-in?next=${encodeURIComponent(next)}`} className="btn-primary mt-6">
            Sign in
          </Link>
        </>
      ) : (
        <p className="mt-3 text-muted">
          {ctx.viewer.email} is not set up as shelter staff yet. Ask your shelter manager, or{" "}
          <Link href="/for-shelters" className="underline">
            bring your shelter to Find Me
          </Link>
          .
        </p>
      )}
    </section>
  );
}

export function ShelterSwitcher({ ctx, path }: { ctx: Extract<StaffContext, { kind: "demo" } | { kind: "staff" }>; path: string }) {
  if (ctx.shelters.length < 2) return null;
  return (
    <form method="get" action={path} className="flex items-center gap-2 text-sm">
      <label htmlFor="shelter" className="font-semibold">
        Shelter
      </label>
      <select id="shelter" name="shelter" defaultValue={ctx.shelter.id} className="field w-auto py-2">
        {ctx.shelters.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
      <button className="btn-quiet">Switch</button>
    </form>
  );
}
