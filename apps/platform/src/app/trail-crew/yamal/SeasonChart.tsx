import type { Season } from "@/data/yamal";
import s from "./tracker.module.css";

/**
 * Goals and assists per season, as grouped bars.
 *
 * Server-rendered SVG with no script. Two series, so a legend is present and
 * both are direct-labelled at their peak only; every bar carries a title for
 * hover, and the full table lives on the seasons page for anyone who wants
 * the numbers rather than the shape. The season in progress is drawn lighter
 * so it does not read as a collapse.
 */

const W = 640;
const H = 260;
const PAD = { top: 18, right: 12, bottom: 36, left: 36 };

export function SeasonChart({ seasons }: { seasons: Season[] }) {
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const baseline = PAD.top + plotH;

  const rawMax = Math.max(1, ...seasons.map((x) => Math.max(x.total.goals, x.total.assists)));
  const step = rawMax > 30 ? 10 : 5;
  const max = Math.ceil(rawMax / step) * step;
  const ticks = Array.from({ length: max / step + 1 }, (_, i) => i * step);
  const y = (v: number) => baseline - (v / max) * plotH;

  const groupW = plotW / seasons.length;
  const barW = Math.min(34, groupW * 0.32);
  const gap = 2;

  const peakGoals = Math.max(...seasons.map((x) => x.total.goals));
  const peakAssists = Math.max(...seasons.map((x) => x.total.assists));

  return (
    <figure className={s.chart} style={{ margin: 0 }}>
      <div className={s.chartHead}>
        <h3>Goals and assists by season, all competitions</h3>
        <ul className={s.legend} aria-label="Legend">
          <li>
            <span className={`${s.swatch} ${s.swatchGoals}`} aria-hidden /> Goals
          </li>
          <li>
            <span className={`${s.swatch} ${s.swatchAssists}`} aria-hidden /> Assists
          </li>
        </ul>
      </div>
      <svg
        className={s.svg}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Goals and assists per season for Barcelona. ${seasons
          .map((x) => `${x.label}: ${x.total.goals} goals, ${x.total.assists} assists`)
          .join(". ")}.`}
      >
        <defs>
          <clipPath id="plot">
            <rect x={PAD.left} y={0} width={plotW} height={baseline} />
          </clipPath>
        </defs>

        {ticks.map((t) => (
          <g key={t}>
            <line className={s.grid} x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} />
            <text className={s.axis} x={PAD.left - 8} y={y(t) + 4} textAnchor="end">
              {t}
            </text>
          </g>
        ))}

        <g clipPath="url(#plot)">
          {seasons.map((season, i) => {
            const cx = PAD.left + groupW * i + groupW / 2;
            const gx = cx - barW - gap / 2;
            const ax = cx + gap / 2;
            const gTop = y(season.total.goals);
            const aTop = y(season.total.assists);
            const cls = season.inProgress ? `${s.group} ${s.inProgress}` : s.group;
            return (
              <g key={season.id} className={cls}>
                <rect className={s.barGoals} x={gx} y={gTop} width={barW} height={baseline - gTop + 4} rx={4}>
                  <title>{`${season.label}: ${season.total.goals} goals in ${season.total.apps} games`}</title>
                </rect>
                <rect className={s.barAssists} x={ax} y={aTop} width={barW} height={baseline - aTop + 4} rx={4}>
                  <title>{`${season.label}: ${season.total.assists} assists in ${season.total.apps} games`}</title>
                </rect>
                {season.total.goals === peakGoals && season.total.goals > 0 && (
                  <text className={s.barLabel} x={gx + barW / 2} y={gTop - 5}>
                    {season.total.goals}
                  </text>
                )}
                {season.total.assists === peakAssists && season.total.assists > 0 && (
                  <text className={s.barLabel} x={ax + barW / 2} y={aTop - 5}>
                    {season.total.assists}
                  </text>
                )}
              </g>
            );
          })}
        </g>

        <line className={s.grid} x1={PAD.left} x2={W - PAD.right} y1={baseline} y2={baseline} />

        {seasons.map((season, i) => (
          <text
            key={season.id}
            className={s.axis}
            x={PAD.left + groupW * i + groupW / 2}
            y={baseline + 18}
            textAnchor="middle"
          >
            {season.label}
            {season.inProgress ? " so far" : ""}
          </text>
        ))}
      </svg>
    </figure>
  );
}
