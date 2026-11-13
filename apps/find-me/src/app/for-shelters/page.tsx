import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "For shelters",
  description: "Get your adoptable pets in front of people who already fit them, with no extra work.",
};

const POINTS: [string, string][] = [
  ["Two minutes per pet, from your phone", "Snap a photo, tap a few buttons, and the pet is live. Only five fields are required."],
  ["Or no typing at all", "Already on ShelterLuv, PetPoint, Petfinder, or a spreadsheet? We can import from what you use today."],
  ["Inquiries from people who fit", "Adopters see why each pet matches their home before they contact you, and can share their answers with you."],
  ["Your own QR code", "Every adopter who scans it gets a care plan with vet and vaccine reminders, and you see each adoption check in."],
  ["Free for shelters", "Find Me exists to get more pets home. Shelters never pay to list."],
];

export default function ForSheltersPage() {
  return (
    <div className="container-page max-w-3xl py-12">
      <h1 className="font-display text-5xl font-extrabold leading-tight">More adoptions, less busywork.</h1>
      <p className="mt-4 text-lg text-muted">
        Find Me puts your adoptable dogs and cats in front of local people who already fit them, and follows up after
        adoption so your animals stay healthy at home.
      </p>
      <ul className="mt-10 grid gap-4">
        {POINTS.map(([t, d]) => (
          <li key={t} className="card p-6">
            <h2 className="text-xl font-semibold">{t}</h2>
            <p className="mt-1 text-muted">{d}</p>
          </li>
        ))}
      </ul>
      <div className="mt-10 rounded-3xl bg-pine p-8 text-white">
        <h2 className="font-display text-3xl font-extrabold">We are choosing our first partner shelters now.</h2>
        <p className="mt-2 text-white/85">Get in touch and we will set you up and walk your staff through it.</p>
        <Link href="mailto:yourteam@doubleblaze.solutions?subject=Find%20Me%20partner%20shelter" className="btn mt-5 bg-white text-pine hover:bg-cream">
          Become a partner shelter
        </Link>
      </div>
    </div>
  );
}
