import { STAGE } from "@/lib/sandwich-bot/catalog";
import type { View } from "@/lib/sandwich-bot/timeline";
import type { Obj, Substance } from "@/lib/sandwich-bot/types";
import { KINDS } from "@/lib/sandwich-bot/catalog";
import { get, rootOf } from "@/lib/sandwich-bot/world";
import { Arm, Bubble, CounterFront, CounterTop, FridgeDoor, HandArt, KitchenBack, MessArt, ObjectArt, RobotBody, StorageFront } from "./Art";

/**
 * Draws one moment of a scene. Back to front: wall, fridge, Chef Byte's body,
 * counter, what is on the counter, arms, what is held or on the hat, hands,
 * the floor, then the speech bubble on top of everything.
 */
export default function Stage({ view, title }: { view: View; title?: string }) {
  const { world, pos, robot } = view;
  const objs = [...world.objects].filter((o) => pos.has(o.id) && !pos.get(o.id)!.hidden);
  objs.sort((a, b) => pos.get(a.id)!.order - pos.get(b.id)!.order);
  // Storage (fridge, pantry, cupboard, drawer) and what is inside it are drawn together.
  const store = (o: Obj) => {
    const r = rootOf(world, o);
    return KINDS[r.kind].storage ? r : undefined;
  };
  const at = (layer: number) => objs.filter((o) => pos.get(o.id)!.layer === layer && !store(o));
  const inside = (f: Obj) => objs.filter((o) => o.id !== f.id && store(o)?.id === f.id);
  const cabinets = world.objects.filter((o) => o.kind === "pantry" || o.kind === "cupboard");
  const drawers = world.objects.filter((o) => o.kind === "drawer");
  const fridge = world.objects.find((o) => o.kind === "fridge");
  const fp = fridge ? pos.get(fridge.id) : undefined;
  const bobY = robot.bob > 0 ? -14 * robot.bob : 0;
  const shoulderL = { x: robot.x - STAGE.SHOULDER_DX, y: STAGE.SHOULDER_Y + bobY };
  const shoulderR = { x: robot.x + STAGE.SHOULDER_DX, y: STAGE.SHOULDER_Y + bobY };
  const handMess = (key: "handL" | "handR") => world.messes.filter((m) => m.onRobot === key).map((m) => m.sub as Substance);
  const floorMess = world.messes.filter((m) => !m.onRobot && m.y >= STAGE.FLOOR_Y - 10);
  const counterMess = world.messes.filter((m) => !m.onRobot && m.y < STAGE.FLOOR_Y - 10);

  const draw = (o: Obj) => {
    const p = pos.get(o.id)!;
    const parent = o.place.type === "in" ? get(world, o.place.ref) : undefined;
    return (
      <g key={o.id} transform={`translate(${p.x} ${p.y}) rotate(${p.rot}) scale(${p.scale})`}>
        <ObjectArt o={o} inBag={parent?.kind === "bread-bag"} />
      </g>
    );
  };

  return (
    <svg viewBox={`0 0 ${STAGE.W} ${STAGE.H}`} role="img" aria-label={title ?? "Chef Byte's kitchen"} className="block h-full w-full" preserveAspectRatio="xMidYMid meet">
      <KitchenBack />
      {fridge && fp && (
        <g>
          <g transform={`translate(${fp.x} ${fp.y})`}>
            <ObjectArt o={fridge} />
          </g>
          {inside(fridge).map(draw)}
          <g transform={`translate(${fp.x} ${fp.y})`}>
            <FridgeDoor open={fridge.open} />
          </g>
        </g>
      )}
      {cabinets.map((c) => {
        const cp = pos.get(c.id)!;
        return (
          <g key={c.id}>
            <g transform={`translate(${cp.x} ${cp.y})`}>
              <ObjectArt o={c} />
            </g>
            {inside(c).map(draw)}
            <g transform={`translate(${cp.x} ${cp.y})`}>
              <StorageFront o={c} />
            </g>
          </g>
        );
      })}
      <RobotBody x={robot.x} bob={robot.bob} face={robot.face} question={robot.question} />
      <CounterTop left={fridge ? STAGE.COUNTER_LEFT : 0} />
      <CounterFront left={fridge ? STAGE.COUNTER_LEFT : 0} />
      {drawers.map((d) => {
        const dp = pos.get(d.id)!;
        return (
          <g key={d.id}>
            {d.open && inside(d).map(draw)}
            <g transform={`translate(${dp.x} ${dp.y})`}>
              <StorageFront o={d} />
            </g>
          </g>
        );
      })}
      {counterMess.map((m, i) => (
        <MessArt key={`c${i}`} m={m} />
      ))}
      {at(1).map(draw)}
      <Arm from={shoulderL} to={robot.handL} />
      <Arm from={shoulderR} to={robot.handR} />
      {at(2).map(draw)}
      <HandArt at={robot.handL} mess={handMess("handL")} />
      <HandArt at={robot.handR} mess={handMess("handR")} />
      {floorMess.map((m, i) => (
        <MessArt key={`f${i}`} m={m} />
      ))}
      {at(3).map(draw)}
      {robot.say && <Bubble robotX={robot.x} text={robot.say} />}
    </svg>
  );
}
