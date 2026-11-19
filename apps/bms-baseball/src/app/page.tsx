import { SignupForm } from "@/components/SignupForm";

const WELCOME = [
  {
    emoji: "🌱",
    title: "Never played? Perfect.",
    body: "Lots of great players started in middle school. Coaches will teach you what you need to know.",
  },
  {
    emoji: "🧢",
    title: "No gear? No problem.",
    body: "Bring sneakers, water, and a glove if you have one. If you don't, just let a coach know.",
  },
  {
    emoji: "🤝",
    title: "Bring a friend.",
    body: "Tryouts are more fun with a buddy. Send them this page so they can sign up too!",
  },
];

export default function Home() {
  return (
    <>
      <header className="sky relative overflow-hidden text-white">
        <div className="mx-auto max-w-3xl px-4 pb-16 pt-10 sm:pt-14">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm font-semibold backdrop-blur">
            <span aria-hidden>⚾</span> Blacksburg Middle School Baseball
          </p>
          <h1 className="mt-4 font-display text-4xl font-extrabold leading-tight sm:text-6xl">
            Play ball, <span className="text-gold">BMS!</span>
          </h1>
          <p className="mt-4 max-w-xl text-lg text-white/90 sm:text-xl">
            Tryouts are coming up for 6th, 7th, and 8th graders. Whether you have played for years or have
            never picked up a bat, <strong className="text-white">we want you to try out.</strong>
          </p>
          <a
            href="#signup"
            className="focus-ring mt-7 inline-flex items-center gap-2 rounded-full bg-gold px-6 py-3 text-lg font-bold text-ink shadow-card transition hover:bg-gold-dark"
          >
            Sign me up <span aria-hidden>→</span>
          </a>
          <p className="mt-3 text-sm text-white/75">Takes about 2 minutes.</p>
        </div>
        <div className="grass-edge h-5" aria-hidden />
      </header>

      <main id="main" className="mx-auto max-w-3xl px-4">
        <section aria-label="Everyone is welcome" className="-mt-6 grid gap-3 sm:grid-cols-3">
          {WELCOME.map((w) => (
            <div key={w.title} className="rounded-2xl bg-white p-5 shadow-card">
              <div className="text-3xl" aria-hidden>
                {w.emoji}
              </div>
              <h2 className="mt-2 font-display text-lg font-bold text-bms-deep">{w.title}</h2>
              <p className="mt-1 text-[15px] text-muted">{w.body}</p>
            </div>
          ))}
        </section>

        <section id="signup" className="scroll-mt-4 py-10">
          <SignupForm />
        </section>
      </main>

      <footer className="border-t border-bms/10 bg-white">
        <div className="mx-auto max-w-3xl px-4 py-6 text-sm text-muted">
          <p>
            Only the BMS baseball coaches see your answers. Signing up just means you are interested; it is not a
            promise to play, and you can still change your mind.
          </p>
          <p className="mt-2">Questions? Ask a coach or the front office at Blacksburg Middle School.</p>
        </div>
      </footer>
    </>
  );
}
