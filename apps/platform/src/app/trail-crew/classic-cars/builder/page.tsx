import { listParts, upgradeParts, STOCK_HORSEPOWER } from "@/lib/showcase-db";
import { TEAM } from "../team";
import Builder from "./Builder";
import s from "../showcase.module.css";

/**
 * Story 4, the horsepower builder: "I want to pick upgrades and watch the
 * horsepower change, so that I can see what actually makes a car more
 * powerful."
 *
 * The upgrades are the parts rows with an hp_gain, so adding a part in the
 * admin puts it on this screen too. That is the connection worth showing the
 * team: they wrote one thing down and it turned up in three places.
 */
export const dynamic = "force-dynamic";

export default async function BuilderPage() {
  const upgrades = upgradeParts(await listParts(TEAM));

  return (
    <main className={`${s.wrap} ${s.narrow}`}>
      <div style={{ paddingTop: 54 }}>
        <p className={s.eyebrow}>Build one</p>
        <h1 className={s.pageTitle}>Start with a stock engine. Bolt things on.</h1>
        <p className={s.lede}>
          You begin at {STOCK_HORSEPOWER} horsepower. Tick something and the
          number moves straight away. Untick it and it goes back.
        </p>
      </div>

      {upgrades.length === 0 ? (
        <div className={s.empty}>
          <strong>No upgrades yet.</strong>
          A part shows up here once somebody gives it a horsepower number in the
          admin.
        </div>
      ) : (
        <Builder base={STOCK_HORSEPOWER} upgrades={upgrades.map((p) => ({
          id: p.id,
          slug: p.slug,
          name: p.name,
          gain: p.hpGain ?? 0,
          note: p.ifUpgraded,
        }))} />
      )}
    </main>
  );
}
