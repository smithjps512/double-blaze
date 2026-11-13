import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy" };

/** Plain-language draft. Have counsel review before launch. */
export default function PrivacyPage() {
  return (
    <div className="container-page max-w-2xl py-12">
      <h1 className="font-display text-4xl font-extrabold">Privacy</h1>
      <div className="mt-6 flex flex-col gap-4 leading-relaxed">
        <p>Find Me collects only what it needs to match you with a pet and help you care for one.</p>
        <h2 className="text-xl font-semibold">What we keep</h2>
        <ul className="list-disc pl-6">
          <li>Your email address, to sign you in and send reminders you ask for.</li>
          <li>Your match quiz answers, to rank pets for you.</li>
          <li>Pets you save, shelters you contact, and your pet&apos;s care plan.</li>
        </ul>
        <h2 className="text-xl font-semibold">Who sees it</h2>
        <p>
          When you contact a shelter, that shelter sees your name, email, and note. They see your quiz answers only if you
          choose to share them. When you check in an adoption with a shelter&apos;s QR code, that shelter sees your email
          so they can confirm it. Nobody else sees your information, and we never sell it.
        </p>
        <h2 className="text-xl font-semibold">Your choices</h2>
        <p>
          You can use the match quiz without an account. Reminders can be turned off one by one. To delete your account and
          everything in it, email yourteam@doubleblaze.solutions.
        </p>
      </div>
    </div>
  );
}
