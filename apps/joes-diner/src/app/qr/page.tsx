import type { Metadata } from "next";
import { headers } from "next/headers";
import QRCode from "qrcode";
import { Logo } from "@/components/Logo";

export const metadata: Metadata = { title: "QR sign" };
export const dynamic = "force-dynamic";

async function joinUrl(): Promise<string> {
  const base = process.env.NEXT_PUBLIC_SITE_URL;
  if (base) return `${base.replace(/\/$/, "")}/join`;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3005";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}/join`;
}

/** A printable sign for the door and the counter. */
export default async function QrPage() {
  const url = await joinUrl();
  const svg = await QRCode.toString(url, { type: "svg", margin: 1, errorCorrectionLevel: "M", color: { dark: "#1A1414", light: "#FFFFFF" } });
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-6 bg-white p-10 text-center print:p-0">
      <Logo className="h-40 w-auto" />
      <h1 className="font-display text-5xl text-joe">Get in line!</h1>
      <p className="text-2xl">Scan to check in from your phone and see the wait.</p>
      <div className="w-80" dangerouslySetInnerHTML={{ __html: svg }} aria-label={`QR code for ${url}`} role="img" />
      <ul className="space-y-1 text-xl">
        <li>
          <strong>The whole party must be here</strong> to be seated.
        </li>
        <li>
          <strong>Please stay close.</strong> We hold tables for about a minute.
        </li>
      </ul>
      <p className="text-sm text-muted">{url}</p>
    </main>
  );
}
