import { redirect } from "next/navigation";
import { currentDevice, screenFor } from "@/lib/auth";
import { getStore } from "@/lib/store";
import { DemoBanner } from "@/components/DemoBanner";
import { Logo } from "@/components/Logo";

export const dynamic = "force-dynamic";

/**
 * A paired tablet goes straight to its screen. In demo mode this page lists
 * every screen so the app can be shown. Otherwise it points to setup.
 */
export default async function Home() {
  const store = getStore();
  if (!store.demo) {
    const device = await currentDevice();
    if (device) redirect(screenFor(device));
  }
  const screens = [
    { href: "/staff", title: "Staff screen", note: "Behind the bar. Waitlist, floor, rotation." },
    { href: "/checkin", title: "Check-in counter", note: "The tablet at the front door." },
    { href: "/join", title: "Check in by phone", note: "Where the QR code at the door goes." },
    { href: "/qr", title: "QR code sign", note: "Print it for the door and the counter." },
    { href: "/manager", title: "Manager", note: "Staff, codes, and pairing tablets." },
  ];
  return (
    <>
      <DemoBanner />
      <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center gap-6 p-8">
        <Logo className="h-40 w-auto" />
        <h1 className="font-display text-4xl text-joe">Welcome to Joe&apos;s</h1>
        {store.demo ? (
          <ul className="grid w-full gap-3 sm:grid-cols-2">
            {screens.map((s) => (
              <li key={s.href}>
                <a href={s.href} className="panel focus-ring block h-full p-5 transition hover:border-joe">
                  <span className="block text-xl font-black">{s.title}</span>
                  <span className="block text-muted">{s.note}</span>
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center">
            <p className="text-lg text-muted">This device is not set up yet.</p>
            <div className="mt-4 flex justify-center gap-3">
              <a className="btn-primary" href="/join">
                Check in
              </a>
              <a className="btn-light" href="/manager">
                Manager
              </a>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
