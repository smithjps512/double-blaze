import { isFinished, type CareGuide, type ScheduledTask } from "@/lib/care-plan";

const KIND_LABEL: Record<ScheduledTask["kind"], string> = {
  vet: "Vet",
  vaccine: "Vaccine",
  prevention: "Prevention",
  admin: "To do",
  grooming: "Grooming",
  training: "Settling in",
  feeding: "Daily",
};

function friendlyDate(iso: string, today: string): string {
  const days = Math.round((Date.parse(iso) - Date.parse(today)) / 86_400_000);
  if (days < 0) return `Overdue by ${-days} ${-days === 1 ? "day" : "days"}`;
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  if (days < 14) return `Due in ${days} days`;
  const sameYear = iso.slice(0, 4) === today.slice(0, 4);
  return `Due ${new Date(iso + "T12:00:00Z").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  })}`;
}

/**
 * The care plan. Read-only when `actions` is not given (demo preview); with
 * actions, each task gets Done and a reminder switch.
 */
export function CarePlanView({
  petName,
  guide,
  tasks,
  today,
  actions,
}: {
  petName: string;
  guide: CareGuide[];
  tasks: ScheduledTask[];
  today: string;
  actions?: { complete: (f: FormData) => Promise<void>; toggle: (f: FormData) => Promise<void> };
}) {
  const active = tasks.filter((t) => t.enabled && !isFinished(t)).sort((a, b) => a.dueOn.localeCompare(b.dueOn));
  const done = tasks.filter((t) => isFinished(t));
  const optional = tasks.filter((t) => !t.enabled && !isFinished(t));

  const row = (t: ScheduledTask, mode: "active" | "optional") => (
    <li key={t.key} className="card flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="chip bg-pine-light text-pine">{KIND_LABEL[t.kind]}</span>
          {mode === "active" && (
            <span className={`text-sm font-semibold ${t.dueOn < today ? "text-ember-dark" : "text-muted"}`}>
              {friendlyDate(t.dueOn, today)}
            </span>
          )}
          {t.repeatDays && <span className="text-xs text-muted">Repeats every {t.repeatDays === 1 ? "day" : `${t.repeatDays} days`}</span>}
        </div>
        <h3 className="mt-2 text-lg font-semibold">{t.title}</h3>
        <p className="text-sm text-muted">{t.details}</p>
      </div>
      {actions && (
        <div className="flex shrink-0 gap-2">
          {mode === "active" && (
            <form action={actions.complete}>
              <input type="hidden" name="taskId" value={t.id} />
              <button className="btn-primary px-4 py-2 text-sm">Done</button>
            </form>
          )}
          <form action={actions.toggle}>
            <input type="hidden" name="taskId" value={t.id} />
            <button className="btn-secondary px-4 py-2 text-sm">{mode === "active" ? "Turn off" : "Remind me"}</button>
          </form>
        </div>
      )}
    </li>
  );

  return (
    <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
      <section aria-labelledby="upcoming">
        <h2 id="upcoming" className="font-display text-2xl font-extrabold">
          Coming up for {petName}
        </h2>
        <ul className="mt-4 grid gap-3">{active.map((t) => row(t, "active"))}</ul>
        {optional.length > 0 && (
          <>
            <h3 className="mt-8 font-semibold">Optional reminders</h3>
            <ul className="mt-3 grid gap-3">{optional.map((t) => row(t, "optional"))}</ul>
          </>
        )}
        {done.length > 0 && (
          <>
            <h3 className="mt-8 font-semibold">Done</h3>
            <ul className="mt-2 grid gap-1 text-sm text-muted">
              {done.map((t) => (
                <li key={t.key}>✓ {t.title}</li>
              ))}
            </ul>
          </>
        )}
      </section>
      <aside aria-labelledby="guide" className="flex flex-col gap-4">
        <h2 id="guide" className="font-display text-2xl font-extrabold">
          The basics
        </h2>
        {guide.map((g) => (
          <div key={g.heading} className={`rounded-2xl p-5 ${g.heading.startsWith("When to call") ? "bg-ember-light" : "bg-white border border-line"}`}>
            <h3 className="font-semibold">{g.heading}</h3>
            <p className="mt-1 text-sm">{g.body}</p>
          </div>
        ))}
        <p className="text-xs text-muted">
          This plan is general guidance, not veterinary advice. Your vet sets your pet&apos;s real schedule.
        </p>
      </aside>
    </div>
  );
}
