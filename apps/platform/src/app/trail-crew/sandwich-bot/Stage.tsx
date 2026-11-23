import { STAGE } from "@/lib/sandwich-bot/catalog";
import type { View } from "@/lib/sandwich-bot/timeline";
import type { Obj, Substance } from "@/lib/sandwich-bot/types";
import { get } from "@/lib/sandwich-bot/world";
import { Arm, Bubble, CounterFront, CounterTop, FridgeDoor, HandArt, KitchenBack, MessArt, ObjectArt, RobotBody } from "./Art";

/**
 * Draws one moment of a scene. Back to front: wall, fridge, Chef Byte's body,
 * counter, what is on the counter, arms, what is held or on the hat, hands,
 * the floor, then the speech bubble on top of everything.
 */
export default function Stage({ view, title }: { view: View; title?: string }) {
  const { world, pos, robot } = view;
  const objs = [...world.objects].filter((o) => pos.has(o.id) && !pos.get(o.id)!.hidden);
  objs.sort((a, b) => pos.get(a.id)!.order - pos.get(b.id)!.order);
  const at = (layer: number) => objs.filter((o) => pos.get(o.id)!.layer === layer && o.kind !== "fridge");
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
          {at(0).map(draw)}
          <g transform={`translate(${fp.x} ${fp.y})`}>
            <FridgeDoor open={fridge.open} />
          </g>
        </g>
      )}
      <RobotBody x={robot.x} bob={robot.bob} face={robot.face} question={robot.question} />
      <CounterTop left={fridge ? STAGE.COUNTER_LEFT : 0} />
      <CounterFront left={fridge ? STAGE.COUNTER_LEFT : 0} />
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
