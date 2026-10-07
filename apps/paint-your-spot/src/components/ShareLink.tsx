"use client";

import { useState } from "react";

export function ShareLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      if (navigator.share) {
        await navigator.share({ title: "Paint Your Spot at BMS", url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Share sheet dismissed, or clipboard blocked. The link is on screen either way.
    }
  }
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <input
        readOnly
        value={url}
        aria-label="Share link"
        onFocus={(e) => e.currentTarget.select()}
        className="min-w-0 flex-1 rounded-full border-2 border-asphalt bg-white px-5 py-3 font-medium"
      />
      <button
        type="button"
        onClick={copy}
        className="focus-ring rounded-full bg-asphalt px-6 py-3 font-bold text-tape hover:bg-asphalt-dark"
      >
        {copied ? "Copied!" : "Share the link"}
      </button>
    </div>
  );
}
