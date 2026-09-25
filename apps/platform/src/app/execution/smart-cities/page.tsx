import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentRole } from "@/lib/server-auth";
import { isStaffRole } from "@/lib/auth";
import { SMART_CITIES, MODE_LABELS } from "@/lib/smart-cities";
import { leaderboard, listAnswers } from "@/lib/smart-cities-db";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { SmartCityAnswers, SmartCityBoards } from "@/components/SmartCityTeacher";

export const metadata = { title: "Period 3 Smart Cities" };
export const dynamic = "force-dynamic";

/**
 * The teacher's page for the Period 3 Smart Cities: answers waiting for
 * approval, what is already showing on each city, and the leaderboards.
 * Staff only.
 */
export default async function SmartCitiesTeacherPage() {
  const role = await getCurrentRole();
  if (role && !isStaffRole(role)) redirect("/portal");

  const configured = !!getSupabaseServiceClient();
  const [pending, approved] = await Promise.all([listAnswers("pending"), listAnswers("approved")]);
  const boards = await Promise.all(
    SMART_CITIES.flatMap((city) =>
      city.modes.map(async (mode) => ({
        city: city.slug,
        cityName: city.name,
        mode,
        modeLabel: MODE_LABELS[mode],
        rows: (await leaderboard(city.slug, mode, null)) ?? [],
      })),
    ),
  );
  const cities = Object.fromEntries(SMART_CITIES.map((c) => [c.slug, { name: c.name, questions: c.questions }]));

  return (
    <section className="bg-stone-white">
      <div className="container-page py-14">
        <p className="eyebrow">Period 3</p>
        <h1 className="mt-3 font-display text-3xl font-bold text-ink">Smart Cities</h1>
        <p className="mt-3 max-w-2xl text-ink/70">
          Students answer each city&rsquo;s &ldquo;Questions for the designer&rdquo; on the{" "}
          <Link href="/demo/period-3-smart-cities/" className="underline">
            city pages
          </Link>
          . Nothing appears for the class until you approve it. Screening only tags an answer; it
          never hides one.
        </p>

        {!configured && (
          <p className="mt-5 max-w-2xl rounded-md border border-trail-orange/40 bg-trail-orange/5 px-4 py-3 text-sm text-ink/80">
            <strong>The database is not connected here.</strong> Answers and leaderboards need
            Supabase and migration <code>0039_smart_cities.sql</code>.
          </p>
        )}

        <SmartCityAnswers pending={pending} approved={approved} cities={cities} />

        <h2 className="mt-12 font-display text-xl font-bold text-ink">Leaderboards</h2>
        <p className="mt-1 max-w-2xl text-sm text-ink/60">
          Initials only. Remove an entry or clear a board if something shouldn&rsquo;t be there.
        </p>
        <SmartCityBoards boards={boards} />
      </div>
    </section>
  );
}
