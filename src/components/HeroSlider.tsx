"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { HeroEyebrow, HeroIntro } from "./RegionAware";

/**
 * Homepage hero as a two-slide slider. Slide 1 is the enterprise hero
 * (region-aware), slide 2 is the results-first Trail Run slide. The trust bar
 * lives outside this component, fixed below it.
 *
 * Accessibility: keyboard arrows, visible previous/next and dots, and
 * prefers-reduced-motion disables auto-advance. When auto-advancing, it pauses
 * on hover and on focus. An optional ?hero=results deep-link opens slide 2.
 */
const SLIDE_COUNT = 2;
const AUTO_ADVANCE_MS = 8000;

export function HeroSlider() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [autoOk, setAutoOk] = useState(false);
  const regionRef = useRef<HTMLDivElement>(null);

  // Client-only: honor a ?hero=results deep-link without forcing a Suspense
  // boundary on the static page.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("hero") === "results") {
      setIndex(1);
    }
  }, []);

  // Auto-advance only when motion is allowed.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setAutoOk(!mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!autoOk || paused) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % SLIDE_COUNT), AUTO_ADVANCE_MS);
    return () => clearInterval(id);
  }, [autoOk, paused]);

  const go = useCallback((next: number) => {
    setIndex(((next % SLIDE_COUNT) + SLIDE_COUNT) % SLIDE_COUNT);
  }, []);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      go(index - 1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      go(index + 1);
    }
  }

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Double Blaze highlights"
      className="relative overflow-hidden bg-blaze-maroon text-stone-white"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-impact-orange/30 to-transparent"
      />
      <div
        ref={regionRef}
        tabIndex={0}
        onKeyDown={onKeyDown}
        aria-live="polite"
        className="container-page relative py-20 outline-none md:py-28"
      >
        {index === 0 ? <SlideEnterprise /> : <SlideResults />}

        {/* Controls */}
        <div className="mt-10 flex items-center gap-4">
          <button
            type="button"
            onClick={() => go(index - 1)}
            aria-label="Previous slide"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-stone-white/30 text-stone-white transition hover:bg-stone-white/10"
          >
            &larr;
          </button>
          <button
            type="button"
            onClick={() => go(index + 1)}
            aria-label="Next slide"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-stone-white/30 text-stone-white transition hover:bg-stone-white/10"
          >
            &rarr;
          </button>
          <div className="ml-2 flex gap-2">
            {Array.from({ length: SLIDE_COUNT }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => go(i)}
                aria-label={`Show slide ${i + 1}`}
                aria-current={i === index}
                className={`h-2.5 w-2.5 rounded-full transition ${
                  i === index ? "bg-trail-orange" : "bg-stone-white/40 hover:bg-stone-white/70"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function SlideEnterprise() {
  return (
    <div className="md:max-w-3xl lg:max-w-4xl" role="group" aria-roledescription="slide" aria-label="1 of 2">
      <p className="eyebrow text-trail-orange/90">
        <HeroEyebrow />
      </p>
      <h1 className="mt-4 text-4xl font-bold leading-[1.05] sm:text-5xl lg:text-6xl">
        Enterprise-grade technology, built right here at home.
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-relaxed text-stone-white/85">
        <HeroIntro />
      </p>
      <div className="mt-9 flex flex-col gap-3 sm:flex-row">
        <Link href="/start-a-project" className="btn-primary">
          Start a project
        </Link>
        <Link href="/services" className="btn-on-dark">
          See what we build
        </Link>
      </div>
    </div>
  );
}

function SlideResults() {
  return (
    <div className="md:max-w-3xl lg:max-w-4xl" role="group" aria-roledescription="slide" aria-label="2 of 2">
      <p className="eyebrow text-trail-orange/90">Pay for results, not promises</p>
      <h1 className="mt-4 text-4xl font-bold leading-[1.05] sm:text-5xl lg:text-6xl">
        Pay for results, not promises.
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-relaxed text-stone-white/85">
        Everyone else bills you up front and hopes it works. We flipped that. We
        automate your business and get it running first, you see a full 30 days
        of real results, and the bill only comes if you decide it earned one.
      </p>
      <div className="mt-9 flex flex-col gap-3 sm:flex-row">
        <Link href="/trail-run" className="btn-primary">
          Start free with Trail Run
        </Link>
        <Link href="/trail-run#how-it-works" className="btn-on-dark">
          How it works
        </Link>
      </div>
    </div>
  );
}
