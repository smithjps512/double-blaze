import type { Metadata } from "next";
import { Quiz } from "@/components/Quiz";
import { loadAnswers } from "@/lib/answers";
import { safeNext } from "@/lib/auth-rules";
import { DEFAULT_ANSWERS } from "@/lib/quiz";

export const metadata: Metadata = { title: "Find my match" };

export default async function MatchPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const saved = await loadAnswers();
  return (
    <div className="container-page py-10">
      <div className="mx-auto mb-6 max-w-xl text-center">
        <h1 className="font-display text-4xl font-extrabold">Find my match</h1>
        <p className="mt-2 text-muted">About two minutes. Honest answers make better matches; there are no wrong ones.</p>
      </div>
      <Quiz initial={saved ?? DEFAULT_ANSWERS} next={safeNext(next, "/matches")} returning={Boolean(saved)} />
    </div>
  );
}
