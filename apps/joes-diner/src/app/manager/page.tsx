import type { Metadata } from "next";
import { isManager, managerCodeIsSet } from "@/lib/auth";
import { getStore } from "@/lib/store";
import { DemoBanner } from "@/components/DemoBanner";
import { Logo } from "@/components/Logo";
import { addStaff, pairThisDevice, revoke, setActive, setCode, signIn, signOut } from "./actions";

export const metadata: Metadata = { title: "Manager" };
export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = {
  code: "That manager code is not right.",
  wait: "Too many tries. Wait a few minutes.",
  name: "Enter a name.",
  format: "Codes are 4 digits.",
  taken: "Someone already has that code. Pick another.",
  role: "Pick what this tablet is for.",
  seat: "Pick a table from 101 to 110.",
};

const OK: Record<string, string> = { staff: "Added.", code: "Code saved." };

export default async function ManagerPage({ searchParams }: { searchParams: Promise<{ e?: string; ok?: string }> }) {
  const { e, ok } = await searchParams;
  const store = getStore();
  const signedIn = await isManager();

  if (!signedIn) {
    return (
      <main className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center gap-4 p-6 text-center">
        <Logo className="h-28 w-auto" />
        <h1 className="text-2xl font-black">Manager</h1>
        {!managerCodeIsSet() && <p className="text-joe">The manager code is not set up yet (JOES_MANAGER_CODE).</p>}
        <form action={signIn} className="w-full space-y-3">
          <input name="code" type="password" inputMode="numeric" className="field text-center" placeholder="Manager code" autoComplete="off" aria-label="Manager code" />
          {e && <p className="font-bold text-joe">{ERRORS[e] ?? "Try again."}</p>}
          <button className="btn-primary w-full">Sign in</button>
        </form>
      </main>
    );
  }

  const [staff, devices] = await Promise.all([store.listStaff(), store.listDevices()]);
  const tables = Array.from({ length: 10 }, (_, i) => String(101 + i));

  return (
    <>
      <DemoBanner />
      <main className="mx-auto max-w-3xl space-y-8 p-6">
        <header className="flex items-center gap-4">
          <Logo className="h-16 w-auto" />
          <h1 className="flex-1 text-3xl font-black">Manager</h1>
          {!store.demo && (
            <form action={signOut}>
              <button className="btn-small bg-white">Sign out</button>
            </form>
          )}
        </header>
        {e && <p className="rounded-2xl bg-joe-light p-3 font-bold text-joe">{ERRORS[e] ?? "Something was not right."}</p>}
        {ok && <p className="rounded-2xl bg-open-light p-3 font-bold text-open">{OK[ok] ?? "Saved."}</p>}

        <section className="panel p-5">
          <h2 className="text-xl font-black">Staff and codes</h2>
          <p className="text-muted">
            Each server has a 4-digit code for marking tables ready. Codes say who did what; they are not passwords.
          </p>
          <ul className="mt-4 divide-y divide-line">
            {staff.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center gap-3 py-3">
                <span className={`flex-1 font-bold ${s.active ? "" : "text-muted line-through"}`}>
                  {s.name} <span className="font-normal text-muted">· {s.role}</span>
                </span>
                {s.active && (
                  <form action={setCode} className="flex gap-2">
                    <input type="hidden" name="id" value={s.id} />
                    <input name="code" inputMode="numeric" pattern="[0-9]{4}" maxLength={4} className="field w-24 py-2 text-base" placeholder="New code" aria-label={`New code for ${s.name}`} />
                    <button className="btn-small bg-ink text-white">Set</button>
                  </form>
                )}
                <form action={setActive}>
                  <input type="hidden" name="id" value={s.id} />
                  <input type="hidden" name="active" value={s.active ? "0" : "1"} />
                  <button className="btn-small bg-white">{s.active ? "Deactivate" : "Reactivate"}</button>
                </form>
              </li>
            ))}
          </ul>
          <form action={addStaff} className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto_auto_auto]">
            <input name="name" className="field py-2 text-base" placeholder="Name" aria-label="Name" />
            <select name="role" className="field py-2 text-base" aria-label="Role" defaultValue="server">
              <option value="server">Server</option>
              <option value="cook">Cook</option>
              <option value="manager">Manager</option>
            </select>
            <input name="code" inputMode="numeric" pattern="[0-9]{4}" maxLength={4} className="field w-28 py-2 text-base" placeholder="Code" aria-label="Code" />
            <button className="btn-primary">Add</button>
          </form>
        </section>

        <section className="panel p-5">
          <h2 className="text-xl font-black">Set up this tablet</h2>
          <p className="text-muted">Open this page on the tablet itself, pick what it is for, and it goes to that screen from now on.</p>
          <form action={pairThisDevice} className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
            <select name="role" className="field py-2 text-base" aria-label="This tablet is the" defaultValue="staff">
              <option value="staff">Staff screen (behind the bar)</option>
              <option value="checkin">Check-in counter (front door)</option>
              <option value="table">A table</option>
              <option value="kitchen">Kitchen (coming next)</option>
              <option value="bell">Bell monitor (coming next)</option>
            </select>
            <select name="seat" className="field py-2 text-base" aria-label="Which table" defaultValue="">
              <option value="">Table (if a table)</option>
              {tables.map((t) => (
                <option key={t} value={t}>
                  Table {t}
                </option>
              ))}
            </select>
            <button className="btn-dark">Pair this tablet</button>
          </form>
          <h3 className="label mt-6">Paired tablets</h3>
          <ul className="mt-2 divide-y divide-line">
            {devices.length === 0 && <li className="py-2 text-muted">None yet.</li>}
            {devices.map((d) => (
              <li key={d.id} className="flex items-center gap-3 py-2">
                <span className="flex-1 font-bold">{d.label}</span>
                <span className="text-sm text-muted">{d.lastSeenAt ? `seen ${new Date(d.lastSeenAt).toLocaleString("en-US", { timeZone: "America/New_York", weekday: "short", hour: "numeric", minute: "2-digit" })}` : "not seen yet"}</span>
                <form action={revoke}>
                  <input type="hidden" name="id" value={d.id} />
                  <button className="btn-small bg-white">Remove</button>
                </form>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel p-5">
          <h2 className="text-xl font-black">QR code for the door</h2>
          <p className="text-muted">Guests scan it to check in from their phones.</p>
          <a className="btn-light mt-3" href="/qr">
            Open the printable sign
          </a>
        </section>
      </main>
    </>
  );
}
