import Link from "next/link";
import { notFound } from "next/navigation";
import { consoleIsOpen, isSignedIn } from "@/lib/showcase-auth";
import { getCarById, sourcesForCar } from "@/lib/showcase-db";
import { TEAM } from "../../../team";
import SignInForm from "../../SignInForm";
import CarEditor from "./CarEditor";
import s from "../../../showcase.module.css";

/**
 * One car's research page.
 *
 * Its own page rather than a row that expands, because researching a car is an
 * afternoon's work with ten questions and a reference list, and that does not
 * belong in a list. This is also what a real content management system looks
 * like: a list of things, and a page per thing.
 */
export const dynamic = "force-dynamic";

export default async function EditCarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!consoleIsOpen() && !(await isSignedIn(TEAM))) {
    return (
      <main className={s.wrap}>
        <SignInForm team={TEAM} configured />
      </main>
    );
  }

  const car = await getCarById(TEAM, id);
  if (!car) notFound();
  const sources = await sourcesForCar(TEAM, id);

  return (
    <main className={s.wrap}>
      <Link href="/trail-crew/classic-cars/admin" className={s.back}>
        ← All cars
      </Link>
      <div style={{ paddingTop: 10 }}>
        <p className={s.eyebrow}>Researching</p>
        <h1 className={s.pageTitle}>{car.name}</h1>
        <p className={s.lede}>
          Every box on this page is a question somebody has to go and find the
          answer to. You cannot save any of it until you have said where you
          found it, and that is not the site being awkward: a fact with nothing
          behind it is just something somebody typed.
        </p>
      </div>

      <CarEditor team={TEAM} car={car} sources={sources} />

      <p className={s.footnote}>
        When you are happy with it,{" "}
        <Link href={`/trail-crew/classic-cars/cars/${car.slug}`}>
          look at the page everybody else sees
        </Link>
        . Your sources are on the bottom of it, with your names nowhere on it.
      </p>
    </main>
  );
}
