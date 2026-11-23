import type { JSX } from "react";
import { STAGE, SUBSTANCE_COLOR } from "@/lib/sandwich-bot/catalog";
import type { Face, Mess, Obj, Spread, Substance } from "@/lib/sandwich-bot/types";

/**
 * Cartoon drawings. Every object is drawn with (0, 0) at the middle of its
 * base, growing upward, so the stage only has to translate and rotate it.
 * Thick outlines and flat bright colors so it reads from the back of a room.
 *
 * To add an object: add a case to ObjectArt. Unknown kinds draw a labeled box.
 */

const INK = "#2B2321";
const LINE = { stroke: INK, strokeWidth: 4, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };

const LID: Record<string, string> = { "pb-jar": "#D6402E", "jelly-jar": "#7B3FA0", "mayo-jar": "#4BA3D9" };
const LABEL: Record<string, string> = { "pb-jar": "PEANUT\nBUTTER", "jelly-jar": "JELLY", "mayo-jar": "MAYO" };

function Smile({ sub, x, y, size, thin }: { sub: Substance; x: number; y: number; size: number; thin?: boolean }) {
  const c = SUBSTANCE_COLOR[sub];
  const w = thin ? 3 : 8;
  return (
    <g transform={`translate(${x} ${y})`} fill="none" stroke={c} strokeWidth={w} strokeLinecap="round">
      <circle cx={-size * 0.35} cy={-size * 0.25} r={thin ? 2 : 4} fill={c} />
      <circle cx={size * 0.35} cy={-size * 0.25} r={thin ? 2 : 4} fill={c} />
      <path d={`M ${-size * 0.5} ${size * 0.1} Q 0 ${size * 0.6} ${size * 0.5} ${size * 0.1}`} />
    </g>
  );
}

function spreadLayers(spreads: Spread[], w: number, y: number, down: boolean) {
  const layers = spreads.filter((s) => !s.face);
  return layers.map((s, i) => (
    <rect
      key={i}
      x={-w / 2 + 8}
      y={down ? y + i * 6 : y - 6 - i * 6}
      width={w - 16}
      height={s.thin ? 3 : 7}
      rx={3}
      fill={SUBSTANCE_COLOR[s.sub]}
      stroke={INK}
      strokeWidth={1.5}
    />
  ));
}

export function ObjectArt({ o, inBag }: { o: Obj; inBag?: boolean }): JSX.Element {
  switch (o.kind) {
    case "bread-bag": {
      const folded = !!o.s.folded;
      const w = folded ? 150 : 280;
      const h = folded ? 70 : 110;
      const faces = o.spreads.filter((s) => s.face);
      const smears = o.spreads.filter((s) => !s.face);
      return (
        <g>
          <rect x={-w / 2} y={-h} width={w} height={h} rx={28} fill="rgba(214,233,255,0.55)" {...LINE} stroke="#5B7BA6" />
          {folded && (
            <>
              <path d={`M ${-w / 2 + 10} ${-h / 2} L ${w / 2 - 10} ${-h / 2}`} stroke="#5B7BA6" strokeWidth={4} strokeDasharray="10 8" />
              {faces.map((f, i) => (
                <rect key={i} x={-w / 2 + 14} y={-h / 2 - 5 + i * 6} width={w - 28} height={5} rx={2} fill={SUBSTANCE_COLOR[f.sub]} />
              ))}
            </>
          )}
          {!folded &&
            faces.map((f, i) => <Smile key={i} sub={f.sub} x={i % 2 === 0 ? -70 : 70} y={-h / 2} size={64} thin={f.thin} />)}
          {smears.map((s, i) => (
            <ellipse key={`s${i}`} cx={-20 + i * 40} cy={-h + 14} rx={50} ry={10} fill={SUBSTANCE_COLOR[s.sub]} opacity={0.9} />
          ))}
          {o.s.tie === "on" ? (
            <g transform={`translate(${w / 2 - 14} ${-h / 2})`}>
              <path d="M -6 -22 L 6 22 M 6 -22 L -6 22" stroke="#E2B93B" strokeWidth={7} strokeLinecap="round" />
            </g>
          ) : (
            <>
              <path d={`M ${w / 2 - 8} ${-h + 10} l 22 -10 M ${w / 2 - 8} ${-12} l 22 10`} stroke="#5B7BA6" strokeWidth={4} />
              <path d={`M ${w / 2 + 10} -4 q 14 -10 28 0`} stroke="#E2B93B" strokeWidth={7} fill="none" strokeLinecap="round" />
            </>
          )}
        </g>
      );
    }
    case "bread-slice": {
      if (inBag) {
        return (
          <g>
            <path d="M -21 0 L -21 -70 Q -21 -92 0 -92 Q 21 -92 21 -70 L 21 0 Z" fill="#F3D9A4" stroke="#B5762F" strokeWidth={4} />
          </g>
        );
      }
      const toast = Number(o.s.toasted ?? 0);
      const fill = ["#F6DFAE", "#E3AE5E", "#B87A36", "#7A4A22"][Math.min(3, toast)];
      const squish = o.s.squished ? 0.6 : 1;
      const down = o.flipped;
      return (
        <g transform={`scale(1 ${squish})`}>
          {down && spreadLayers(o.spreads, 140, 0, true)}
          <rect x={-70} y={-26} width={140} height={26} rx={10} fill={fill} stroke="#9A5F22" strokeWidth={5} />
          <rect x={-60} y={-22} width={120} height={8} rx={4} fill="#FFF3D3" opacity={0.6} />
          {!down && spreadLayers(o.spreads, 140, -26, false)}
          {o.spreads
            .filter((s) => s.face && !down)
            .map((s, i) => (
              <Smile key={i} sub={s.sub} x={0} y={-13} size={26} thin={s.thin} />
            ))}
          {o.s.cut && <path d="M -30 -30 L 30 4" stroke={INK} strokeWidth={4} />}
        </g>
      );
    }
    case "pb-jar":
    case "jelly-jar":
    case "mayo-jar": {
      const level = Number(o.s.level ?? 1);
      const fill = SUBSTANCE_COLOR[o.kind === "pb-jar" ? "pb" : o.kind === "jelly-jar" ? "jelly" : "mayo"];
      const label = LABEL[o.kind].split("\n");
      return (
        <g>
          <rect x={-46} y={-92} width={92} height={92} rx={16} fill="rgba(255,255,255,0.7)" {...LINE} />
          <rect x={-40} y={-6 - 80 * level} width={80} height={80 * level} rx={10} fill={fill} />
          <rect x={-46} y={-70} width={92} height={40} fill="#FFF8E7" stroke={INK} strokeWidth={3} />
          {label.map((t, i) => (
            <text key={i} x={0} y={-52 + i * 16 + (label.length === 1 ? 8 : 0)} textAnchor="middle" fontSize={label.length === 1 ? 20 : 14} fontWeight={900} fill={INK} fontFamily="system-ui, sans-serif">
              {t}
            </text>
          ))}
          {o.open ? (
            <g transform="translate(70 -4) rotate(-8)">
              <rect x={-26} y={-14} width={52} height={14} rx={4} fill={LID[o.kind]} {...LINE} />
            </g>
          ) : (
            <rect x={-48} y={-112} width={96} height={24} rx={6} fill={LID[o.kind]} {...LINE} />
          )}
        </g>
      );
    }
    case "butter-knife": {
      const c = o.s.coated as Substance | undefined;
      return (
        <g transform="translate(0 -6)">
          <rect x={-30} y={-7} width={58} height={14} rx={7} fill="#7A4B2A" {...LINE} />
          <path d="M 28 -6 L 104 -6 Q 118 0 104 6 L 28 6 Z" fill="#D9DEE5" {...LINE} />
          {c && <path d={o.s.thin ? "M 34 6 L 104 6" : "M 40 -2 L 100 -2"} stroke={SUBSTANCE_COLOR[c]} strokeWidth={o.s.thin ? 3 : 9} strokeLinecap="round" />}
        </g>
      );
    }
    case "spoon":
      return (
        <g transform="translate(0 -6)">
          <rect x={-40} y={-5} width={70} height={10} rx={5} fill="#C9D0D8" {...LINE} />
          <ellipse cx={42} cy={0} rx={18} ry={11} fill="#D9DEE5" {...LINE} />
        </g>
      );
    case "plate":
      return (
        <g>
          <path d="M -110 -16 L 110 -16 L 90 0 L -90 0 Z" fill="#FFFFFF" {...LINE} />
          <path d="M -92 -12 L 92 -12" stroke="#4BA3D9" strokeWidth={4} />
        </g>
      );
    case "cheese":
      return (
        <g>
          <rect x={-60} y={-10} width={120} height={10} rx={2} fill="#FFC928" {...LINE} />
          <circle cx={-20} cy={-5} r={3} fill="#E0A800" />
          <circle cx={25} cy={-5} r={3} fill="#E0A800" />
        </g>
      );
    case "ham":
      return <rect x={-65} y={-10} width={130} height={10} rx={5} fill="#F59BB0" {...LINE} />;
    case "lettuce":
      return <path d="M -65 0 Q -55 -18 -40 -8 Q -25 -20 -10 -8 Q 5 -20 20 -8 Q 35 -20 50 -8 Q 62 -16 65 0 Z" fill="#6CC24A" {...LINE} />;
    case "tomato":
      return o.s.cut ? (
        <g>
          {[-36, 0, 36].map((x) => (
            <ellipse key={x} cx={x} cy={-7} rx={18} ry={7} fill="#E8412C" {...LINE} />
          ))}
        </g>
      ) : (
        <g>
          <circle cx={0} cy={-31} r={31} fill="#E8412C" {...LINE} />
          <path d="M -10 -62 L 0 -54 L 10 -62" stroke="#3F8F2F" strokeWidth={6} fill="none" strokeLinecap="round" />
        </g>
      );
    case "toaster": {
      const on = !!o.s.on;
      return (
        <g>
          <rect x={-95} y={-130} width={190} height={130} rx={30} fill="#C7CED6" {...LINE} />
          <rect x={-60} y={-136} width={44} height={14} rx={6} fill={INK} />
          <rect x={16} y={-136} width={44} height={14} rx={6} fill={INK} />
          <rect x={98} y={on ? -40 : -90} width={18} height={14} rx={4} fill={INK} />
          {on && <rect x={-70} y={-30} width={140} height={8} rx={4} fill="#FF6B2C" />}
        </g>
      );
    }
    case "bowl": {
      const c = (o.s.contents as string[]) ?? [];
      return (
        <g>
          {c.includes("milk") && <ellipse cx={0} cy={-58} rx={70} ry={12} fill="#FFFFFF" stroke="#C9D8E8" strokeWidth={3} />}
          {c.includes("cereal") &&
            [-40, -15, 10, 35].map((x, i) => <circle key={i} cx={x} cy={-62 - (i % 2) * 6} r={9} fill="none" stroke="#E7B24A" strokeWidth={6} />)}
          <path d="M -80 -60 Q -78 0 0 0 Q 78 0 80 -60 Z" fill="#FF8FA3" {...LINE} />
        </g>
      );
    }
    case "cereal-box":
      return (
        <g>
          <rect x={-60} y={-180} width={120} height={180} rx={6} fill="#FF7A1A" {...LINE} />
          <text x={0} y={-130} textAnchor="middle" fontSize={22} fontWeight={900} fill="#FFF" fontFamily="system-ui, sans-serif">
            CRUNCH
          </text>
          <text x={0} y={-104} textAnchor="middle" fontSize={22} fontWeight={900} fill="#FFF" fontFamily="system-ui, sans-serif">
            O&apos;s
          </text>
          {[-25, 5, 30].map((x, i) => (
            <circle key={i} cx={x} cy={-60 + i * 8} r={12} fill="none" stroke="#FFD43B" strokeWidth={7} />
          ))}
          {o.open && <path d="M -60 -180 L -80 -212 M 60 -180 L 80 -212" {...LINE} strokeWidth={6} />}
        </g>
      );
    case "milk":
      return (
        <g>
          <path d="M -42 0 L -42 -120 L 0 -150 L 42 -120 L 42 0 Z" fill="#FFFFFF" {...LINE} />
          <rect x={-42} y={-90} width={84} height={44} fill="#4BA3D9" />
          <text x={0} y={-60} textAnchor="middle" fontSize={20} fontWeight={900} fill="#FFF" fontFamily="system-ui, sans-serif">
            MILK
          </text>
          {!o.open && <rect x={4} y={-150} width={22} height={14} rx={3} fill="#2E6FD1" {...LINE} />}
        </g>
      );
    case "pan":
      return (
        <g>
          <rect x={100} y={-22} width={90} height={14} rx={7} fill={INK} />
          <path d="M -115 -30 L 115 -30 L 100 0 L -100 0 Z" fill="#3B3F46" {...LINE} />
        </g>
      );
    case "stove": {
      const on = !!o.s.on;
      return (
        <g>
          <rect x={-160} y={-34} width={320} height={34} rx={8} fill="#E9ECEF" {...LINE} />
          {[-80, 80].map((x) => (
            <ellipse key={x} cx={x} cy={-34} rx={58} ry={10} fill={on ? "#FF5A1F" : INK} />
          ))}
          <circle cx={136} cy={-17} r={9} fill={on ? "#FF5A1F" : "#8B9096"} stroke={INK} strokeWidth={3} />
        </g>
      );
    }
    case "egg":
      if (o.s.cracked) {
        return (
          <g>
            <path d="M -40 0 Q -46 -12 -24 -12 Q -10 -22 12 -12 Q 44 -14 40 0 Z" fill={o.s.cooked ? "#FFF6E8" : "#FFFFFF"} stroke={o.s.cooked ? "#D8A35B" : "#CCCCCC"} strokeWidth={3} />
            <circle cx={0} cy={-10} r={11} fill="#FFC21A" stroke="#E09B00" strokeWidth={2} />
          </g>
        );
      }
      return <ellipse cx={0} cy={-28} rx={22} ry={28} fill="#FFF8EC" {...LINE} />;
    case "egg-carton":
      return (
        <g>
          <rect x={-90} y={-36} width={180} height={36} rx={6} fill="#C9B79C" {...LINE} />
          {o.open ? <path d="M -90 -36 L -100 -90 L 80 -90 L 90 -36" fill="#D8C8AE" {...LINE} /> : <rect x={-92} y={-52} width={184} height={18} rx={6} fill="#D8C8AE" {...LINE} />}
        </g>
      );
    case "fridge":
      return <FridgeArt open={o.open} />;
    default:
      return (
        <g>
          <rect x={-40} y={-60} width={80} height={60} fill="#EEE" {...LINE} />
          <text x={0} y={-24} textAnchor="middle" fontSize={14}>
            {o.kind}
          </text>
        </g>
      );
  }
}

/** The fridge body. Its door is drawn separately (FridgeDoor) so contents sit between. */
function FridgeArt({ open }: { open: boolean }) {
  return (
    <g>
      <rect x={-115} y={-640} width={230} height={640} rx={20} fill={open ? "#EAF6FF" : "#F4F7FA"} {...LINE} />
      {open && [-460, -290, -120].map((y) => <rect key={y} x={-105} y={y} width={210} height={8} fill="#B9D6EA" />)}
    </g>
  );
}

export function FridgeDoor({ open }: { open: boolean }) {
  if (open) {
    return <path d="M 115 -640 L 165 -610 L 165 -30 L 115 0 Z" fill="#F4F7FA" {...LINE} />;
  }
  return (
    <g>
      <rect x={-115} y={-640} width={230} height={640} rx={20} fill="#F4F7FA" {...LINE} />
      <path d="M -115 -420 L 115 -420" {...LINE} />
      <rect x={80} y={-560} width={14} height={90} rx={7} fill="#9AA3AD" />
      <rect x={80} y={-380} width={14} height={110} rx={7} fill="#9AA3AD" />
    </g>
  );
}

export function MessArt({ m }: { m: Mess }) {
  const c = SUBSTANCE_COLOR[m.sub];
  return (
    <g transform={`translate(${m.x} ${m.y})`}>
      <ellipse cx={0} cy={-2} rx={m.r} ry={m.r * 0.3} fill={c} stroke={INK} strokeWidth={2} opacity={0.92} />
      <circle cx={m.r * 0.8} cy={-m.r * 0.25} r={m.r * 0.18} fill={c} stroke={INK} strokeWidth={2} />
    </g>
  );
}

// ---------------------------------------------------------------------------
// The kitchen and Chef Byte.
// ---------------------------------------------------------------------------

export function KitchenBack() {
  const tiles = [];
  for (let x = 0; x < STAGE.W; x += 80) {
    for (let y = 420; y < STAGE.COUNTER_Y; y += 60) {
      tiles.push(<rect key={`${x}-${y}`} x={x + ((y / 60) % 2) * 40} y={y} width={78} height={58} fill="#FFFFFF" opacity={0.5} />);
    }
  }
  return (
    <g>
      <rect x={0} y={0} width={STAGE.W} height={STAGE.H} fill="#FFE9B8" />
      <rect x={0} y={420} width={STAGE.W} height={STAGE.COUNTER_Y - 420} fill="#BDE8E4" />
      {tiles}
      <g transform="translate(1180 60)">
        <rect x={0} y={0} width={300} height={230} rx={14} fill="#9ED8FF" {...LINE} />
        <path d="M 150 0 L 150 230 M 0 115 L 300 115" {...LINE} />
        <circle cx={240} cy={60} r={30} fill="#FFE066" />
      </g>
    </g>
  );
}

export function CounterFront({ left = STAGE.COUNTER_LEFT }: { left?: number }) {
  return (
    <g>
      <rect x={left - 10} y={STAGE.COUNTER_Y} width={STAGE.W} height={22} fill="#2E8C83" {...LINE} />
      <rect x={left} y={STAGE.COUNTER_Y + 22} width={STAGE.W} height={STAGE.FLOOR_Y - STAGE.COUNTER_Y - 50} fill="#F28C38" {...LINE} />
      {(left < 100 ? [130, 430, 730, 1030, 1330] : [400, 700, 1000, 1300]).map((x) => (
        <g key={x}>
          <rect x={x - 120} y={STAGE.COUNTER_Y + 50} width={240} height={150} rx={10} fill="#F6A35C" {...LINE} />
          <circle cx={x} cy={STAGE.COUNTER_Y + 70} r={8} fill={INK} />
        </g>
      ))}
      <rect x={0} y={STAGE.FLOOR_Y - 28} width={STAGE.W} height={STAGE.H - STAGE.FLOOR_Y + 28} fill="#8B6B4E" />
      <rect x={0} y={STAGE.FLOOR_Y - 28} width={STAGE.W} height={6} fill="#6E5139" />
    </g>
  );
}

/** Counter top surface, drawn behind the objects that stand on it. */
export function CounterTop({ left = STAGE.COUNTER_LEFT }: { left?: number }) {
  return <rect x={left - 10} y={STAGE.COUNTER_Y - 6} width={STAGE.W} height={10} fill="#3AA79C" />;
}

function Eyes({ face }: { face: Face }) {
  const eye = (cx: number) => {
    switch (face) {
      case "confused":
        return cx < 0 ? <circle cx={cx} cy={-8} r={11} fill="#7DF9FF" /> : <path d={`M ${cx - 12} -6 L ${cx + 12} -6`} stroke="#7DF9FF" strokeWidth={7} strokeLinecap="round" />;
      case "proud":
      case "happy":
        return <path d={`M ${cx - 13} -2 Q ${cx} -20 ${cx + 13} -2`} stroke="#7DF9FF" strokeWidth={7} fill="none" strokeLinecap="round" />;
      case "oops":
        return <path d={`M ${cx - 10} -16 L ${cx + 10} 4 M ${cx + 10} -16 L ${cx - 10} 4`} stroke="#7DF9FF" strokeWidth={6} strokeLinecap="round" />;
      case "wait":
        return <path d={`M ${cx - 12} -6 L ${cx + 12} -6`} stroke="#7DF9FF" strokeWidth={7} strokeLinecap="round" />;
      case "work":
        return <rect x={cx - 11} y={-14} width={22} height={14} rx={4} fill="#7DF9FF" />;
      case "think":
      default:
        return <circle cx={cx} cy={-8} r={10} fill="#7DF9FF" />;
    }
  };
  const mouth =
    face === "confused" ? (
      <path d="M -18 26 Q -6 18 6 26 Q 14 32 20 24" stroke="#7DF9FF" strokeWidth={6} fill="none" strokeLinecap="round" />
    ) : face === "oops" ? (
      <ellipse cx={0} cy={26} rx={10} ry={8} fill="#7DF9FF" />
    ) : face === "wait" || face === "work" ? (
      <path d="M -16 26 L 16 26" stroke="#7DF9FF" strokeWidth={6} strokeLinecap="round" />
    ) : (
      <path d="M -22 18 Q 0 40 22 18" stroke="#7DF9FF" strokeWidth={6} fill="none" strokeLinecap="round" />
    );
  return (
    <g>
      {eye(-30)}
      {eye(30)}
      {mouth}
    </g>
  );
}

/** Body, head and hat. Drawn before the counter, which hides the legs. */
export function RobotBody({ x, bob, face, question }: { x: number; bob: number; face: Face; question: boolean }) {
  const dy = bob > 0 ? -14 * bob : 0;
  const shrug = bob < 0 ? -bob : 0;
  return (
    <g transform={`translate(${x} ${dy})`}>
      <rect x={-88} y={340} width={176} height={300} rx={36} fill="#2BB3C0" {...LINE} />
      <rect x={-60} y={410} width={120} height={46} rx={10} fill="#FFFFFF" {...LINE} strokeWidth={3} />
      <text x={0} y={441} textAnchor="middle" fontSize={22} fontWeight={900} fill={INK} fontFamily="system-ui, sans-serif">
        CHEF BYTE
      </text>
      <circle cx={-30} cy={490} r={10} fill="#FF7A1A" stroke={INK} strokeWidth={3} />
      <circle cx={0} cy={490} r={10} fill="#FFD43B" stroke={INK} strokeWidth={3} />
      <circle cx={30} cy={490} r={10} fill="#6CC24A" stroke={INK} strokeWidth={3} />
      <rect x={-20} y={318} width={40} height={26} fill="#8B9096" {...LINE} strokeWidth={3} />
      <g transform={`translate(0 ${-shrug * 12})`}>
        <rect x={-82} y={190} width={164} height={134} rx={34} fill="#3CC6D3" {...LINE} />
        <rect x={-64} y={212} width={128} height={92} rx={22} fill="#1E2B3A" />
        <g transform="translate(0 250)">
          <Eyes face={face} />
        </g>
        <circle cx={-90} cy={258} r={12} fill="#FF7A1A" stroke={INK} strokeWidth={3} />
        <circle cx={90} cy={258} r={12} fill="#FF7A1A" stroke={INK} strokeWidth={3} />
        {/* Chef hat */}
        <g>
          <rect x={-58} y={160} width={116} height={36} rx={8} fill="#FFFFFF" {...LINE} />
          <circle cx={-40} cy={146} r={28} fill="#FFFFFF" {...LINE} />
          <circle cx={0} cy={134} r={34} fill="#FFFFFF" {...LINE} />
          <circle cx={40} cy={146} r={28} fill="#FFFFFF" {...LINE} />
          <rect x={-56} y={156} width={112} height={16} fill="#FFFFFF" />
        </g>
        {question && (
          <text x={120} y={180} fontSize={110} fontWeight={900} fill="#FF7A1A" stroke={INK} strokeWidth={4} fontFamily="system-ui, sans-serif">
            ?
          </text>
        )}
      </g>
    </g>
  );
}

export function Arm({ from, to }: { from: { x: number; y: number }; to: { x: number; y: number } }) {
  const mx = (from.x + to.x) / 2;
  const my = Math.max(from.y, to.y) + 30;
  const d = `M ${from.x} ${from.y} Q ${mx} ${my} ${to.x} ${to.y}`;
  return (
    <g>
      <path d={d} stroke={INK} strokeWidth={26} fill="none" strokeLinecap="round" />
      <path d={d} stroke="#9AA3AD" strokeWidth={18} fill="none" strokeLinecap="round" strokeDasharray="22 8" />
    </g>
  );
}

export function HandArt({ at, mess }: { at: { x: number; y: number }; mess?: Substance[] }) {
  return (
    <g transform={`translate(${at.x} ${at.y})`}>
      <circle r={20} fill="#C9D0D8" stroke={INK} strokeWidth={4} />
      {(mess ?? []).map((m, i) => (
        <ellipse key={m} cx={-4 + i * 8} cy={6 - i * 4} rx={12} ry={8} fill={SUBSTANCE_COLOR[m]} stroke={INK} strokeWidth={2} />
      ))}
    </g>
  );
}

/** Word wrapping for the speech bubble. */
export function wrap(text: string, max = 24): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > max && cur) {
      lines.push(cur);
      cur = w;
    } else cur = (cur + " " + w).trim();
  }
  if (cur) lines.push(cur);
  return lines;
}

export function Bubble({ robotX, text }: { robotX: number; text: string }) {
  const lines = wrap(text, 26);
  const fs = 36;
  const w = Math.min(560, Math.max(...lines.map((l) => l.length)) * fs * 0.56 + 48);
  const h = lines.length * fs * 1.2 + 32;
  const right = robotX < 950;
  const x = right ? Math.min(STAGE.W - w - 16, robotX + 130) : Math.max(16, robotX - 130 - w);
  const y = Math.max(16, 200 - h);
  const tail = right ? `M ${x + 30} ${y + h - 4} L ${robotX + 80} ${235} L ${x + 80} ${y + h - 4}` : `M ${x + w - 30} ${y + h - 4} L ${robotX - 80} ${235} L ${x + w - 80} ${y + h - 4}`;
  return (
    <g>
      <path d={tail} fill="#FFFFFF" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      <rect x={x} y={y} width={w} height={h} rx={24} fill="#FFFFFF" stroke={INK} strokeWidth={4} />
      <rect x={x + 20} y={y + h - 8} width={80} height={10} fill="#FFFFFF" />
      {lines.map((l, i) => (
        <text key={i} x={x + 24} y={y + 16 + fs + i * fs * 1.2 - 6} fontSize={fs} fontWeight={700} fill={INK} fontFamily="system-ui, sans-serif">
          {l}
        </text>
      ))}
    </g>
  );
}
