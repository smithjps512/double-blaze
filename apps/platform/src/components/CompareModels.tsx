/**
 * How Double Blaze's model compares with how programs are usually bought.
 * Columns describe common practice, not any named firm, so every row stays
 * fair: "often" and "usually" are deliberate.
 */
const COLUMNS = ["Typical consulting firm", "Typical agency or dev shop", "Double Blaze"] as const;

const ROWS: { label: string; values: [string, string, string] }[] = [
  {
    label: "What you pay for",
    values: ["Hours, often open-ended", "The deliverable, then change orders", "Program management only"],
  },
  {
    label: "Software, design, and content",
    values: ["Billed by the hour, or by a separate vendor", "Billed by the project", "Included"],
  },
  {
    label: "Licenses and seats",
    values: ["Often per user", "Often per user or per month", "Unlimited users, no license fees"],
  },
  {
    label: "Who owns the work",
    values: ["Varies by contract", "Varies; often licensed back to you", "You do"],
  },
  {
    label: "Hosting",
    values: ["Marked up or bundled", "Marked up or bundled", "At our cost, shown openly"],
  },
  {
    label: "Price",
    values: ["Rate card, quoted per engagement", "Quoted per project", "Published, fixed per step"],
  },
  {
    label: "Expertise",
    values: ["Deep, at big-firm rates", "Usually one discipline", "Seven practice areas, specialists on demand"],
  },
];

export function CompareModels({ tone = "light" }: { tone?: "light" | "muted" }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-ink/10 bg-stone-white">
      <table className="w-full min-w-[720px] border-collapse text-left text-sm">
        <caption className="sr-only">
          How the Double Blaze pricing model compares with typical consulting firms and agencies
        </caption>
        <thead>
          <tr className={tone === "muted" ? "bg-ink/[0.04]" : "bg-ink/[0.03]"}>
            <th scope="col" className="w-[22%] px-4 py-3 font-semibold text-ink">
              <span className="sr-only">Compare</span>
            </th>
            {COLUMNS.map((c, i) => (
              <th
                key={c}
                scope="col"
                className={
                  i === 2
                    ? "bg-blaze-maroon px-4 py-3 font-semibold text-stone-white"
                    : "px-4 py-3 font-semibold text-ink/70"
                }
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-ink/10">
          {ROWS.map((row) => (
            <tr key={row.label}>
              <th scope="row" className="px-4 py-3 font-semibold text-ink">
                {row.label}
              </th>
              {row.values.map((v, i) => (
                <td
                  key={i}
                  className={
                    i === 2
                      ? "bg-blaze-maroon/[0.06] px-4 py-3 font-semibold text-blaze-maroon"
                      : "px-4 py-3 text-ink/65"
                  }
                >
                  {v}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
