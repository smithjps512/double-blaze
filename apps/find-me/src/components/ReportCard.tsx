import Link from "next/link";
import type { Report } from "@/lib/reports";
import { reportTitle } from "@/lib/reports-data";
import { SIZE_LABEL } from "@/lib/types";
import { AnimalPhoto } from "./AnimalPhoto";

export function ReportBadge({ report, large = false }: { report: Pick<Report, "kind" | "status">; large?: boolean }) {
  const cls = large ? "px-4 py-1.5 text-base" : "";
  if (report.status === "reunited") return <span className={`chip bg-sun font-bold text-ink ${cls}`}>Reunited</span>;
  return report.kind === "lost" ? (
    <span className={`chip bg-ember font-bold uppercase tracking-wide text-white ${cls}`}>Lost</span>
  ) : (
    <span className={`chip bg-pine font-bold uppercase tracking-wide text-white ${cls}`}>Found</span>
  );
}

export function daysAgoLabel(iso: string, today = new Date().toISOString().slice(0, 10)): string {
  const d = Math.round((Date.parse(today) - Date.parse(iso)) / 86_400_000);
  if (d <= 0) return "today";
  if (d === 1) return "yesterday";
  return `${d} days ago`;
}

export function ReportCard({ report, note }: { report: Report; note?: string }) {
  return (
    <article className="card relative flex gap-4 overflow-hidden p-3 transition hover:-translate-y-0.5">
      <AnimalPhoto
        name={report.name || (report.species === "dog" ? "Dog" : "Cat")}
        species={report.species}
        photoUrl={report.photoUrl}
        className="h-28 w-28 shrink-0 rounded-2xl"
        sizes="112px"
      />
      <div className="flex min-w-0 flex-col gap-1 py-1">
        <div className="flex flex-wrap items-center gap-2">
          <ReportBadge report={report} />
          <span className="text-xs text-muted">{daysAgoLabel(report.seenOn)}</span>
        </div>
        <h3 className="font-display text-xl font-extrabold leading-tight">
          <Link href={`/lost-found/${report.id}`} className="focus-ring rounded after:absolute after:inset-0">
            {reportTitle(report)}
          </Link>
        </h3>
        <p className="truncate text-sm">
          {report.colors}
          {report.species === "dog" ? ` · ${SIZE_LABEL[report.size]}` : ""}
        </p>
        <p className="truncate text-sm text-muted">{report.areaText}</p>
        {note && <p className="text-xs font-semibold text-pine">{note}</p>}
      </div>
    </article>
  );
}
