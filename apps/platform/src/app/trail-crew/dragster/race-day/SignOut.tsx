"use client";

import { useRouter } from "next/navigation";

export default function SignOut() {
  const router = useRouter();
  return (
    <button
      type="button"
      className="text-ink/60 underline-offset-2 hover:text-trail-orange hover:underline"
      onClick={async () => {
        await fetch("/api/race-day/sign-in", { method: "DELETE" }).catch(() => null);
        router.refresh();
      }}
    >
      Sign out
    </button>
  );
}
