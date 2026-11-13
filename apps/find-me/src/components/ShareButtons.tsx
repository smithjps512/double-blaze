"use client";

import { useState } from "react";

/**
 * The brief's idea: post in the app first, then share to social media, so
 * the public sees the post but the conversation happens safely in Find Me.
 */
export function ShareButtons({ url, title, flyerHref }: { url: string; title: string; flyerHref: string }) {
  const [copied, setCopied] = useState(false);
  const canShare = typeof navigator !== "undefined" && "share" in navigator;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link", url);
    }
  };
  return (
    <div className="flex flex-wrap gap-2">
      {canShare && (
        <button type="button" className="btn-primary px-4 py-2 text-sm" onClick={() => navigator.share({ title, url }).catch(() => {})}>
          Share
        </button>
      )}
      <button type="button" className="btn-secondary px-4 py-2 text-sm" onClick={copy}>
        {copied ? "Link copied" : "Copy link"}
      </button>
      <a
        className="btn-secondary px-4 py-2 text-sm"
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        Facebook
      </a>
      <a className="btn-secondary px-4 py-2 text-sm" href={flyerHref}>
        Print a flyer
      </a>
    </div>
  );
}
