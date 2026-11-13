import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { AnimalPhoto } from "@/components/AnimalPhoto";
import { Logo } from "@/components/Logo";
import { PrintButton } from "@/components/PrintButton";
import { siteUrl } from "@/lib/data";
import { getReport, reportTitle } from "@/lib/reports-data";
import { SIZE_LABEL } from "@/lib/types";

export const metadata: Metadata = { title: "Flyer", robots: { index: false } };

/**
 * A printable flyer for telephone poles and mailboxes. It carries a QR code
 * to the post instead of a phone number, so tips come through Find Me and
 * the owner's number is not on every pole in town.
 */
export default async function FlyerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = await getReport(id);
  if (!r) notFound();
  const url = `${siteUrl()}/lost-found/${r.id}`;
  const svg = await QRCode.toString(url, { type: "svg", margin: 1, errorCorrectionLevel: "M" });
  const lost = r.kind === "lost";

  return (
    <div className="container-page max-w-2xl py-8">
      <div className="flex items-center justify-between gap-3 print:hidden">
        <Link href={`/lost-found/${r.id}`} className="btn-quiet -ml-3">
          ← Back to the post
        </Link>
        <PrintButton />
      </div>
      <article className="mt-4 flex flex-col items-center gap-4 bg-white p-8 text-center print:mt-0 print:p-0">
        <p className={`w-full py-3 font-display text-6xl font-extrabold uppercase tracking-widest text-white ${lost ? "bg-ember" : "bg-pine"}`}>
          {lost ? "Lost" : "Found"} {r.species}
        </p>
        <AnimalPhoto
          name={r.name || (r.species === "dog" ? "Dog" : "Cat")}
          species={r.species}
          photoUrl={r.photoUrl}
          className="aspect-[4/3] w-full max-w-md rounded-2xl"
          sizes="448px"
        />
        <h1 className="font-display text-5xl font-extrabold">{lost && r.name ? r.name : reportTitle(r)}</h1>
        <p className="text-2xl">
          {r.colors}
          {r.species === "dog" ? ` · ${SIZE_LABEL[r.size]}` : ""}
        </p>
        <p className="text-xl text-muted">
          {lost ? "Last seen" : "Found"} {r.seenOn} · {r.areaText}
        </p>
        {r.description && <p className="max-w-lg">{r.description}</p>}
        <div className="mt-2 flex items-center gap-6 text-left">
          <div className="w-40" dangerouslySetInnerHTML={{ __html: svg }} role="img" aria-label={`QR code linking to ${url}`} />
          <div>
            <p className="text-xl font-bold">{lost ? "Seen this pet?" : "Is this your pet?"}</p>
            <p>Scan to message {lost ? "the owner" : "the finder"} privately.</p>
            <p className="mt-2 text-sm text-muted">{url.replace(/^https?:\/\//, "")}</p>
            <p className="mt-3 flex items-center gap-2 text-sm font-semibold">
              <Logo className="h-6 w-6" /> Find Me
            </p>
          </div>
        </div>
      </article>
    </div>
  );
}
