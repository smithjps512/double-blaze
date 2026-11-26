import { Logo } from "./Logo";

/** Shown on a screen this tablet is not paired for. */
export function NotSetUp({ screen }: { screen: string }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <Logo className="h-32 w-auto" />
      <h1 className="text-2xl font-black">This tablet is not set up for the {screen}.</h1>
      <p className="max-w-md text-muted">A manager can pair it on the manager page.</p>
      <a className="btn-dark" href="/manager">
        Manager page
      </a>
    </main>
  );
}
