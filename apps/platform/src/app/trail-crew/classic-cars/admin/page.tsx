import Link from "next/link";
import { isSignedIn, passcodeIsConfigured } from "@/lib/showcase-auth";
import { listCars, listParts, listQuiz } from "@/lib/showcase-db";
import { TEAM } from "../team";
import AdminConsole from "./AdminConsole";
import SignInForm from "./SignInForm";
import s from "../showcase.module.css";

/**
 * The admin.
 *
 * This is the actual point of building the site for this team rather than with
 * them. They are three people without a developer, so they were never going to
 * write the code; what they can absolutely do is run it. Adding a car here and
 * watching it appear on a page anybody can open is the thing most people never
 * see, and it is most of what running a website really is.
 */
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const configured = passcodeIsConfigured();
  const signedIn = configured && (await isSignedIn(TEAM));

  if (!signedIn) {
    return (
      <main className={s.wrap}>
        <SignInForm team={TEAM} configured={configured} />
      </main>
    );
  }

  const [cars, parts, quiz] = await Promise.all([listCars(TEAM), listParts(TEAM), listQuiz(TEAM)]);

  return (
    <main className={s.wrap}>
      <div style={{ paddingTop: 46 }}>
        <p className={s.eyebrow}>Admin</p>
        <h1 className={s.pageTitle}>Everything on the site is a row in here</h1>
        <p className={s.lede}>
          Change something and it changes on the live site the moment you save.
          There is no separate step where somebody publishes it, because the page
          is built out of these rows every time it loads. Go and look:{" "}
          <Link href="/trail-crew/classic-cars">the site</Link>.
        </p>
      </div>

      <div className={s.adminBanner}>
        <strong>How you got in here.</strong> One passcode, shared by all of you.
        That means this site cannot tell which of you added a car, and your
        teacher cannot take one person&rsquo;s access away without changing it
        for everybody. Plenty of small real sites work exactly like this. When
        you need to answer &ldquo;who did this&rdquo;, that is the day you build
        accounts, and now you know what accounts are actually for.
      </div>

      <AdminConsole team={TEAM} cars={cars} parts={parts} quiz={quiz} />
    </main>
  );
}
