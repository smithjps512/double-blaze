"use client";

import { useEffect, useState, type FormEvent, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import {
  statusToStageView,
  stepState,
  TRAILHEAD_STAGES,
  TRAILHEAD_TURNAROUND,
  TRAILHEAD_MONTHLY_CAP,
  TIP_PRESETS,
  TIP_MIN_CENTS,
  TIP_MAX_CENTS,
  type TrailheadSiteStatus,
} from "@/lib/trailhead";
import { BRAND } from "@/lib/brand";

/**
 * The client-safe status data. Mirrors PublicSiteStatus from trailhead-db, kept
 * as a plain interface here so this client component never imports server-only
 * code. It carries only fields safe to show the customer.
 */
interface DraftSection {
  type: string;
  heading: string;
  body: string;
}
interface DraftPage {
  slug: string;
  title: string;
  sections: DraftSection[];
}
interface Draft {
  site_title?: string;
  tagline?: string;
  color_palette?: Record<string, string>;
  tone_summary?: string;
  pages?: DraftPage[];
  notes_for_customer?: string;
}

export interface PublicStatusData {
  status: TrailheadSiteStatus;
  subdomain: string;
  siteName: string;
  liveUrl: string | null;
  footerCredit: boolean;
  previewSent: boolean;
  previewAccepted: boolean;
  createdAt: string;
  /** Present only at the review gate; shape validated where it is rendered. */
  draft: unknown;
}

const CONTACT_EMAIL = BRAND.email;

/**
 * How often the page re-checks its own status while we are the ones working.
 * Short enough that a customer watching sees the page advance on its own, long
 * enough to be gentle on the server and the client.
 */
const POLL_INTERVAL_MS = 15_000;

/**
 * Anchor for the action panel below the stepper. When the current step is one
 * the customer must act on, that step links here so a click jumps straight to
 * the call to action instead of making them hunt for it down the page.
 */
const ACTION_ANCHOR_ID = "your-action";

export function TrailheadStatusView({
  token,
  data,
}: {
  token: string;
  data: PublicStatusData;
}) {
  const view = statusToStageView(data.status, data.previewSent);

  // Make good on the copy ("this page updates on its own"). While the flow is
  // waiting on us (drafting, building, finishing the preview, waitlisted,
  // correcting), poll for the next status by re-running the server component,
  // which re-queries the DB and re-renders with fresh props. The moment the
  // status advances to a customer gate (waitingOn "you") or a terminal
  // milestone (waitingOn "none"), this effect re-runs, the condition is false,
  // and polling stops on its own. We skip ticks while the tab is hidden and
  // refresh once the instant it becomes visible again, so a backgrounded tab
  // never churns yet is current the moment the customer returns to it.
  const router = useRouter();
  const advancingOnOurSide = view.waitingOn === "us";

  useEffect(() => {
    if (!advancingOnOurSide) return;

    const tick = () => {
      if (typeof document !== "undefined" && document.hidden) return;
      router.refresh();
    };
    const onVisible = () => {
      if (!document.hidden) router.refresh();
    };

    const id = window.setInterval(tick, POLL_INTERVAL_MS);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [advancingOnOurSide, router]);

  return (
    <div className="container-page py-16 md:py-20">
      <div className="mx-auto max-w-3xl">
        <p className="eyebrow">Your Trailhead status</p>
        <h1 className="mt-3 text-3xl font-bold text-ink">{data.siteName}</h1>
        <p className="mt-2 text-ink/70">
          {data.subdomain}.doubleblaze.solutions
        </p>

        {view.special ? (
          <SpecialState special={view.special} />
        ) : (
          <>
            <Stepper currentIndex={view.currentIndex} />
            <div id={ACTION_ANCHOR_ID} className="mt-10 scroll-mt-24">
              <StagePanel token={token} data={data} />
            </div>
          </>
        )}

        <StuckHelp />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Accessible stepper: an ordered list with a real per-step state word, so the
// state is conveyed by text and aria-current, never by color alone.
// ---------------------------------------------------------------------------

function stateWord(state: "done" | "current" | "upcoming", waitingOnYou: boolean): string {
  if (state === "done") return "Done";
  if (state === "current") return waitingOnYou ? "Your turn" : "In progress";
  return "Up next";
}

/**
 * Smooth-scroll to the action panel. Kept as a click handler on a real anchor
 * (href={`#${ACTION_ANCHOR_ID}`}) so the jump still works without JS and stays
 * keyboard-accessible; this only upgrades the jump to a smooth scroll.
 */
function scrollToAction(e: MouseEvent<HTMLAnchorElement>) {
  const el = document.getElementById(ACTION_ANCHOR_ID);
  if (el) {
    e.preventDefault();
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function Stepper({ currentIndex }: { currentIndex: number }) {
  return (
    <ol className="mt-8 space-y-3" aria-label="Your build progress">
      {TRAILHEAD_STAGES.map((stage, i) => {
        const state = stepState(i, currentIndex);
        const waitingOnYou = stage.waitingOn === "you";
        const isCurrent = state === "current";
        // The current step is "actionable" only when the customer holds the
        // gate. That step links to the action panel below so a click (the
        // natural instinct) takes them straight to what they need to do.
        const actionable = isCurrent && waitingOnYou;

        const badge = (
          <span
            aria-hidden="true"
            className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
              state === "done"
                ? "bg-ridge-green text-stone-white"
                : isCurrent
                  ? waitingOnYou
                    ? "bg-trail-orange text-stone-white"
                    : "bg-ink text-stone-white"
                  : "bg-ink/10 text-ink/50"
            }`}
          >
            {state === "done" ? "✓" : i + 1}
          </span>
        );

        const labels = (
          <span className="flex flex-1 flex-wrap items-baseline justify-between gap-x-3">
            <span
              className={`font-medium ${
                state === "upcoming" ? "text-ink/50" : "text-ink"
              }`}
            >
              {stage.label}
            </span>
            <span
              className={`text-xs font-semibold uppercase tracking-wide ${
                isCurrent && waitingOnYou
                  ? "text-trail-orange"
                  : state === "done"
                    ? "text-ridge-green"
                    : "text-ink/50"
              }`}
            >
              {stateWord(state, waitingOnYou)}
              {actionable && <span aria-hidden="true"> ↓</span>}
            </span>
          </span>
        );

        return (
          <li
            key={stage.id}
            aria-current={isCurrent ? "step" : undefined}
            className={`rounded-lg border ${
              isCurrent
                ? waitingOnYou
                  ? "border-trail-orange bg-trail-orange/5"
                  : "border-ink/30 bg-ink/[0.03]"
                : "border-ink/10"
            }`}
          >
            {actionable ? (
              <a
                href={`#${ACTION_ANCHOR_ID}`}
                onClick={scrollToAction}
                aria-label={`${stage.label}: go to your action`}
                className="flex items-start gap-3 rounded-lg p-3 transition hover:bg-trail-orange/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-trail-orange"
              >
                {badge}
                {labels}
              </a>
            ) : (
              <div className="flex items-start gap-3 p-3">
                {badge}
                {labels}
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}

// ---------------------------------------------------------------------------
// Stage-specific panel
// ---------------------------------------------------------------------------

function StagePanel({ token, data }: { token: string; data: PublicStatusData }) {
  switch (data.status) {
    case "submitted":
      return (
        <WorkingPanel
          heading="We are drafting your content"
          body="Good news: this is happening for you right now. Spark is writing your copy and choosing a brand direction from what you told us. Nothing is built yet: you approve the words and the look first."
          estimate="usually ready within about 30 minutes, often much sooner"
        />
      );
    case "awaiting_approval":
      return <ReviewGate token={token} draft={(data.draft as Draft | null) ?? null} />;
    case "approved":
    case "building":
      return (
        <WorkingPanel
          heading="We are building your site"
          body="Your content is approved and Spark is building your site now. Sit tight, this is the fun part."
          estimate="usually ready within about 30 minutes, often much sooner"
        />
      );
    case "preview":
      if (!data.previewSent) {
        return (
          <WorkingPanel
            heading="We are finishing your site"
            body="Your site is built and we are putting the final touches on it before you see it. You are next."
            estimate="just a few more minutes"
          />
        );
      }
      return (
        <PreviewGate token={token} accepted={data.previewAccepted} />
      );
    case "published":
    case "exported":
    case "upgraded":
      return <LivePanel token={token} data={data} />;
    default:
      return null;
  }
}

function WorkingPanel({
  heading,
  body,
  estimate,
}: {
  heading: string;
  body: string;
  estimate: string;
}) {
  return (
    <div className="rounded-xl border border-ink/10 bg-stone-white p-6">
      <h2 className="text-xl font-bold text-ink">{heading}</h2>
      <p className="mt-2 text-ink/75">{body}</p>
      <p className="mt-3 text-sm text-ink/60">
        This is {estimate}. We will email you the moment it is your turn, and
        this page updates on its own, so there is nothing you need to watch.
      </p>
    </div>
  );
}

// ---- Review gate (customer action) --------------------------------------

function ReviewGate({ token, draft }: { token: string; draft: Draft | null }) {
  const [approving, setApproving] = useState(false);
  const [approved, setApproved] = useState(false);
  const [error, setError] = useState("");

  async function approve() {
    setApproving(true);
    setError("");
    try {
      const res = await fetch("/api/trailhead/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const body = await res.json();
      if (body.ok) setApproved(true);
      else setError(body.error ?? "Something went wrong.");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setApproving(false);
    }
  }

  if (approved) {
    return (
      <div className="rounded-xl border border-ridge-green/30 bg-ridge-green/5 p-6">
        <h2 className="text-xl font-bold text-ink">Approved. We are building it now.</h2>
        <p className="mt-2 text-ink/75">
          Thank you. We will build your site from exactly what you just approved
          and let you know when your preview is ready. This page will keep you
          posted.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border-2 border-trail-orange bg-trail-orange/5 p-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-trail-orange">
        Your turn. Nothing moves until you approve.
      </p>
      <h2 className="mt-2 text-xl font-bold text-ink">Review your draft</h2>
      <p className="mt-2 text-ink/75">
        We put together a clickable draft of your site: the words, the layout, and
        the colors. Open it and click through the pages. Focus on the flow and the
        look, not the buttons or forms. Those are placeholders in the draft and
        will be fully wired and working once we build it.
      </p>

      {draft ? (
        <>
          <div className="mt-6">
            <a
              href={`/api/trailhead/draft-preview/${token}`}
              target="_blank"
              rel="noreferrer"
              className="btn-secondary"
            >
              Open your clickable draft
            </a>
          </div>
          <p className="mt-3 text-sm text-ink/60">
            Opens in a new tab. If anything is off, tell us and we will change it
            before we build. When it says what you want it to say, approve it and
            we will build exactly this.
          </p>
        </>
      ) : (
        <p className="mt-6 text-sm text-ink/60">
          Your draft is being prepared. Check back shortly, this page will show it
          as soon as it is ready.
        </p>
      )}

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button
          onClick={approve}
          disabled={approving || !draft}
          className="btn-primary disabled:opacity-50"
        >
          {approving ? "Approving..." : "Approve and build"}
        </button>
        <a href={`mailto:${CONTACT_EMAIL}`} className="text-sm text-ink/70 underline">
          Ask for a change first
        </a>
      </div>
    </div>
  );
}

// ---- Preview gate (customer action) -------------------------------------

function PreviewGate({ token, accepted }: { token: string; accepted: boolean }) {
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(accepted);
  const [liveUrl, setLiveUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [showFix, setShowFix] = useState(false);

  async function accept() {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/trailhead/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const body = await res.json();
      if (body.ok) {
        setLiveUrl(body.liveUrl ?? null);
        setDone(true);
      } else setError(body.error ?? "Something went wrong.");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-xl border border-ridge-green/30 bg-ridge-green/5 p-6">
        <h2 className="text-xl font-bold text-ink">You are live. Congratulations.</h2>
        <p className="mt-2 text-ink/75">
          Your site is published and on the internet right now. This is your site,
          built with Double Blaze. Share it with anyone you like.
        </p>
        {liveUrl && (
          <div className="mt-4">
            <a
              href={liveUrl}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-impact-orange underline"
            >
              {liveUrl.replace(/^https?:\/\//, "")}
            </a>
            <div className="mt-3">
              <ShareLink url={liveUrl} />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border-2 border-trail-orange bg-trail-orange/5 p-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-trail-orange">
        Your turn. Take a look, then publish when you are happy.
      </p>
      <h2 className="mt-2 text-xl font-bold text-ink">Your preview is ready</h2>
      <p className="mt-2 text-ink/75">
        Your site is built. Open the preview and look it over. If everything is
        right, publish it and it goes live at your address in seconds. If we got
        something wrong (a misspelling, the wrong colors, copy that does not match
        what you approved) just tell us and we will fix it.
      </p>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <a
          href={`/api/trailhead/preview/${token}`}
          target="_blank"
          rel="noreferrer"
          className="btn-secondary"
        >
          View your preview
        </a>
        <button
          onClick={accept}
          disabled={submitting}
          className="btn-primary disabled:opacity-50"
        >
          {submitting ? "Publishing..." : "Publish my site"}
        </button>
        <button
          type="button"
          onClick={() => setShowFix((v) => !v)}
          aria-expanded={showFix}
          className="text-sm text-ink/70 underline"
        >
          Something needs fixing
        </button>
      </div>

      {showFix && (
        <div className="mt-6">
          <CorrectionSection token={token} />
        </div>
      )}
    </div>
  );
}

/**
 * A share control for the live site: copies the URL to the clipboard, with a
 * graceful fallback for browsers that block the async clipboard API.
 */
function ShareLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button onClick={copy} type="button" className="btn-secondary text-sm">
      {copied ? "Link copied" : "Copy link to share"}
    </button>
  );
}

// ---- Live panel: tip, export, correction, upgrade -----------------------

function LivePanel({ token, data }: { token: string; data: PublicStatusData }) {
  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-ridge-green/30 bg-ridge-green/5 p-6">
        <h2 className="text-xl font-bold text-ink">You are live</h2>
        {data.liveUrl && (
          <>
            <p className="mt-2 text-ink/75">
              Your site is published at{" "}
              <a
                href={data.liveUrl}
                className="font-medium text-impact-orange underline"
                target="_blank"
                rel="noreferrer"
              >
                {data.liveUrl.replace(/^https?:\/\//, "")}
              </a>
              .
            </p>
            <div className="mt-3">
              <ShareLink url={data.liveUrl} />
            </div>
          </>
        )}
      </div>

      <TipSection token={token} />
      <ExportSection token={token} />
      <CorrectionSection token={token} />
      <UpgradeSection token={token} />
    </div>
  );
}

function TipSection({ token }: { token: string }) {
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleTip(e: FormEvent) {
    e.preventDefault();
    setError("");
    let amountCents: number;
    if (useCustom) {
      const dollars = parseFloat(customAmount);
      if (!dollars || dollars <= 0) {
        setError("Please enter an amount.");
        return;
      }
      amountCents = Math.round(dollars * 100);
    } else if (selectedPreset !== null) {
      amountCents = selectedPreset * 100;
    } else {
      setError("Please select an amount.");
      return;
    }
    if (amountCents < TIP_MIN_CENTS || amountCents > TIP_MAX_CENTS) {
      setError("Please enter an amount between $1 and $1,000.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/trailhead/tip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, amount_cents: amountCents }),
      });
      const body = await res.json();
      if (body.checkout_url) window.location.href = body.checkout_url;
      else setError(body.error ?? "Something went wrong.");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-xl border border-ink/10 bg-stone-white p-6">
      <h2 className="text-lg font-bold text-ink">Tip</h2>
      <p className="mt-2 text-sm text-ink/75">
        A site like this normally runs a few thousand dollars to have built. You
        are going to pay whatever you think it was worth. There is no minimum,
        and there is no catch. Your site stays live whether you tip or not.
      </p>
      <p className="mt-2 text-sm text-ink/60">
        You do not have to decide today. This link is permanent.
      </p>
      <form onSubmit={handleTip} className="mt-6">
        <div className="flex flex-wrap gap-3">
          {TIP_PRESETS.map((amount) => (
            <button
              key={amount}
              type="button"
              onClick={() => {
                setSelectedPreset(amount);
                setUseCustom(false);
              }}
              className={`rounded-lg border px-5 py-3 text-sm font-semibold transition ${
                !useCustom && selectedPreset === amount
                  ? "border-trail-orange bg-trail-orange text-stone-white"
                  : "border-ink/20 bg-stone-white text-ink hover:border-ink/40"
              }`}
            >
              ${amount}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setUseCustom(true);
              setSelectedPreset(null);
            }}
            className={`rounded-lg border px-5 py-3 text-sm font-semibold transition ${
              useCustom
                ? "border-trail-orange bg-trail-orange text-stone-white"
                : "border-ink/20 bg-stone-white text-ink hover:border-ink/40"
            }`}
          >
            Name your own
          </button>
        </div>
        {useCustom && (
          <div className="mt-4 flex items-center gap-2">
            <span className="text-ink">$</span>
            <input
              type="number"
              min="1"
              max="1000"
              step="1"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              className="input w-32"
              placeholder="Amount"
            />
          </div>
        )}
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={submitting || (!selectedPreset && !useCustom)}
          className="btn-primary mt-4 disabled:opacity-50"
        >
          {submitting ? "Setting up..." : "Leave a tip"}
        </button>
      </form>
    </div>
  );
}

function ExportSection({ token }: { token: string }) {
  return (
    <div className="rounded-xl border border-ink/10 bg-stone-white p-6">
      <h2 className="text-lg font-bold text-ink">Export your files</h2>
      <p className="mt-2 text-sm text-ink/75">
        Download a zip of your site files (HTML, CSS, assets) to host anywhere.
        Free, always.
      </p>
      <a
        href={`/api/trailhead/export?token=${token}`}
        className="btn-secondary mt-4 inline-flex"
      >
        Download files
      </a>
    </div>
  );
}

function CorrectionSection({ token }: { token: string }) {
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!description.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/trailhead/correction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, description }),
      });
      const body = await res.json();
      if (body.ok) setSent(true);
      else setError(body.error ?? "Something went wrong.");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-xl border border-ridge-green/30 bg-ridge-green/5 p-6">
        <h2 className="text-lg font-bold text-ink">Correction requested</h2>
        <p className="mt-2 text-sm text-ink/75">
          We will review and fix it. You will hear from us soon.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-ink/10 bg-stone-white p-6">
      <h2 className="text-lg font-bold text-ink">Request a correction</h2>
      <p className="mt-2 text-sm text-ink/75">
        If we got something wrong (a misspelling, the wrong brand colors,
        messaging that does not match what you approved, a broken link, a factual
        error), tell us and we will fix it.
      </p>
      <p className="mt-2 text-sm text-ink/50">
        For added features, redesigns, or anything beyond what was approved, we
        would be glad to talk about an upgrade or a custom build.
      </p>
      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="input min-h-[80px]"
          placeholder="Describe the correction needed"
          rows={3}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={submitting || !description.trim()}
          className="btn-secondary disabled:opacity-50"
        >
          {submitting ? "Sending..." : "Request correction"}
        </button>
      </form>
    </div>
  );
}

function UpgradeSection({ token }: { token: string }) {
  return (
    <div className="rounded-xl border border-ridge-green/30 bg-ridge-green/5 p-6">
      <h2 className="text-lg font-bold text-ink">Ready for more?</h2>
      <p className="mt-2 text-sm text-ink/75">
        Want your own domain, a store, online booking, or automation? Upgrade to
        a paid package. Everything you have carries over, and your first month is
        on us through Trail Run.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <UpgradeButton token={token} tier="green" label="Green Trail: $199/mo" />
        <UpgradeButton token={token} tier="blue" label="Blue Trail: $499/mo" />
        <UpgradeButton token={token} tier="black" label="Black Trail: $999/mo" />
        <UpgradeButton token={token} tier="double_black" label="Double Black: $1,499/mo" />
      </div>
    </div>
  );
}

function UpgradeButton({
  token,
  tier,
  label,
}: {
  token: string;
  tier: string;
  label: string;
}) {
  const [loading, setLoading] = useState(false);
  async function handleUpgrade() {
    setLoading(true);
    try {
      const res = await fetch("/api/trailhead/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, tier }),
      });
      const body = await res.json();
      if (body.checkoutUrl) window.location.href = body.checkoutUrl;
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }
  return (
    <button
      onClick={handleUpgrade}
      disabled={loading}
      className="btn-secondary text-sm disabled:opacity-50"
    >
      {loading ? "..." : label}
    </button>
  );
}

// ---- Special states -----------------------------------------------------

function SpecialState({
  special,
}: {
  special: "waitlisted" | "correcting" | "declined";
}) {
  if (special === "waitlisted") {
    return (
      <div className="mt-8 rounded-xl border border-trail-orange/30 bg-trail-orange/5 p-6">
        <h2 className="text-xl font-bold text-ink">You are on the list for next month</h2>
        <p className="mt-2 text-ink/75">
          We build {TRAILHEAD_MONTHLY_CAP} sites a month so each one gets real
          attention. This month is full, so you are in line for next month. We
          work through the list in the order people join, and we will email you
          the moment your build opens up.
        </p>
        <p className="mt-3 text-sm text-ink/60">
          Nothing else is needed from you right now. Keep this page bookmarked:
          it is where your build picks up when it is your turn.
        </p>
      </div>
    );
  }

  if (special === "correcting") {
    return (
      <div className="mt-8 rounded-xl border border-ink/15 bg-stone-white p-6">
        <h2 className="text-xl font-bold text-ink">We are fixing something</h2>
        <p className="mt-2 text-ink/75">
          You asked us to correct something, and we are on it. Your site stays as
          it is until the fix is ready.
        </p>
        <p className="mt-3 text-sm text-ink/60">
          This usually takes about {TRAILHEAD_TURNAROUND.correctionBusinessDays}{" "}
          business days. We will let you know the moment it is done, and this page
          will update.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8 rounded-xl border border-ink/15 bg-stone-white p-6">
      <h2 className="text-xl font-bold text-ink">This request is closed</h2>
      <p className="mt-2 text-ink/75">
        We are not moving forward with this one. If that is a surprise or you
        think it is the wrong fit, we would still like to help point you to the
        right option.
      </p>
      <p className="mt-3 text-sm text-ink/60">
        Reach us at{" "}
        <a href={`mailto:${CONTACT_EMAIL}`} className="text-impact-orange underline">
          {CONTACT_EMAIL}
        </a>
        .
      </p>
    </div>
  );
}

// ---- Stuck help ---------------------------------------------------------

function StuckHelp() {
  return (
    <div className="mt-12 border-t border-ink/10 pt-6">
      <p className="text-sm text-ink/60">
        Does something seem stuck? Most stages take a few business days, so a
        quiet day or two is normal. If it has been longer than that or something
        looks wrong, email us at{" "}
        <a href={`mailto:${CONTACT_EMAIL}`} className="text-impact-orange underline">
          {CONTACT_EMAIL}
        </a>{" "}
        and we will take a look. Keep this page bookmarked: it always shows where
        your site stands.
      </p>
    </div>
  );
}
