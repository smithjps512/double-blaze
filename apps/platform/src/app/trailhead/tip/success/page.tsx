import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Thank you for your tip",
};

export default function TipSuccessPage() {
  return (
    <div className="container-page py-20 text-center">
      <h1 className="text-3xl font-bold text-ink">Thank you.</h1>
      <p className="mx-auto mt-4 max-w-xl text-lg text-ink/75">
        We appreciate the tip. Your site stays live, and if you ever want to
        upgrade or need anything else, we are here.
      </p>
      <div className="mt-8">
        <Link href="/trailhead" className="btn-primary">
          Back to Trailhead
        </Link>
      </div>
    </div>
  );
}
