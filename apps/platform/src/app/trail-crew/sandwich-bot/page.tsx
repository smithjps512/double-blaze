import Link from "next/link";
import Gate from "../dragster/race-day/Gate";
import SignOut from "../dragster/race-day/SignOut";
import { isConfigured, isInClass } from "@/lib/race-day/auth";
import { credits } from "@/lib/sandwich-bot/credits";
import { SCRIPTS } from "@/lib/sandwich-bot/submissions";
import Thumb from "./Thumb";

/**
 * The gallery: a card per scene with a Play button. Credits come from the
 * server setting, after the password check.
 */
export const dynamic = "force-dynamic";

export default async function SandwichBotGallery() {
  if (!(await isInClass())) return <Gate role="class" configured={isConfigured("class")} title="Sandwich Bot is for our class" />;
  const names = credits();
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <p className="text-lg font-bold uppercase tracking-widest text-[#B23A18]">Intro to Technology</p>
          <h1 className="text-5xl font-black">Sandwich Bot</h1>
          <p className="mt-2 max-w-3xl text-2xl">
            Chef Byte follows your instructions exactly as written. Computers do what you say, not what you mean.
          </p>
        </div>
        <span className="ml-auto flex gap-5 text-lg">
          <Link href="/trail-crew/sandwich-bot/library" className="font-bold underline underline-offset-4">
            Kitchen library
          </Link>
          <SignOut />
        </span>
      </div>
      <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {SCRIPTS.map((s) => {
          const by = s.id.startsWith("sample") ? "Sample" : names[s.id];
          return (
            <li key={s.id} className="flex flex-col overflow-hidden rounded-2xl border-4 border-[#2B2321] bg-white shadow-[0_6px_0_#2B2321]">
              <div className="aspect-[16/9] border-b-4 border-[#2B2321]">
                <Thumb id={s.id} />
              </div>
              <div className="flex flex-1 flex-col p-4">
                <h2 className="text-2xl font-black leading-tight">{s.title}</h2>
                <p className="mt-1 text-lg">
                  Goal: {s.goal.name} · {s.steps.length} steps
                </p>
                <p className="text-lg text-[#2B2321]/70">{by ? `Made by ${by}` : " "}</p>
                <Link
                  href={`/trail-crew/sandwich-bot/${s.id}`}
                  className="mt-4 rounded-xl border-4 border-[#2B2321] bg-[#FFD43B] px-5 py-3 text-center text-2xl font-black shadow-[0_4px_0_#2B2321]"
                >
                  ▶ Play
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
