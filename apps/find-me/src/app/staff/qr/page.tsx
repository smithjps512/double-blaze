import type { Metadata } from "next";
import Link from "next/link";
import QRCode from "qrcode";
import { Logo } from "@/components/Logo";
import { PrintButton } from "@/components/PrintButton";
import { StaffGate } from "@/components/StaffGate";
import { siteUrl } from "@/lib/data";
import { staffContext } from "@/lib/staff";

export const metadata: Metadata = { title: "Adoption QR poster", robots: { index: false } };
export const dynamic = "force-dynamic";

/** A printable poster for the adoption desk. One code per shelter. */
export default async function QrPage({ searchParams }: { searchParams: Promise<{ shelter?: string }> }) {
  const ctx = await staffContext((await searchParams).shelter);
  if (ctx.kind === "signed-out" || ctx.kind === "not-staff") return <StaffGate ctx={ctx} next="/staff/qr" />;
  const url = `${siteUrl()}/adopt/${ctx.shelter.adoptionCode}`;
  const svg = await QRCode.toString(url, { type: "svg", margin: 1, errorCorrectionLevel: "M", color: { dark: "#1E1B18", light: "#FFFFFF" } });

  return (
    <div className="container-page max-w-2xl py-10">
      <div className="flex items-center justify-between gap-3 print:hidden">
        <Link href={`/staff?shelter=${ctx.shelter.id}`} className="btn-quiet -ml-3">
          ← Dashboard
        </Link>
        <PrintButton />
      </div>
      <article className="mt-4 rounded-3xl border-4 border-ember bg-white p-8 text-center print:mt-0 print:border-8">
        <div className="flex items-center justify-center gap-2">
          <Logo className="h-10 w-10" />
          <span className="font-display text-3xl font-extrabold">Find Me</span>
        </div>
        <h1 className="mt-6 font-display text-4xl font-extrabold leading-tight">Just adopted? Congratulations!</h1>
        <p className="mx-auto mt-3 max-w-md text-lg">
          Scan with your phone camera for a free care plan for your new pet, with reminders for vet visits, vaccines, and
          more.
        </p>
        <div className="mx-auto mt-6 w-64 max-w-full" dangerouslySetInnerHTML={{ __html: svg }} aria-label={`QR code linking to ${url}`} role="img" />
        <p className="mt-4 text-sm text-muted">
          Or visit <span className="font-semibold text-ink">{url.replace(/^https?:\/\//, "")}</span>
        </p>
        <p className="mt-6 font-semibold text-pine">{ctx.shelter.name}</p>
      </article>
      <p className="mt-4 text-sm text-muted print:hidden">
        Print this for your adoption desk, or show it on a tablet. The code is unique to {ctx.shelter.name}: everyone who
        scans it lands on your pets.
      </p>
    </div>
  );
}
