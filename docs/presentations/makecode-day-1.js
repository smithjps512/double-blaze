/**
 * MakeCode Arcade, day 1: sprites and moving. A short deck for the Game
 * Studio unit's first MakeCode day (docs/lessons/game-studio/day-16.md):
 * the Watch steps on the projector, then the students' checklist.
 * Speaker notes on every slide. No em dashes anywhere in this deck.
 *
 *   cd docs/presentations && node makecode-day-1.js
 */
const pptxgen = require("pptxgenjs");

const MAROON = "630031", ORANGE = "CF4420", STONE = "F6F4F1", WHITE = "FFFFFF", INK = "1C1A19", MUTED = "75787B";
const ARCADE = "1B1530", PINK = "E9C9D6";
const BLUE = "3D7BD9", RED = "D2453B", GREEN = "2E8B57";
const H = "Cambria", B = "Calibri";
const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE";
pres.title = "MakeCode Arcade, day 1";
const W = 13.333, M = 0.7, CW = W - M * 2;

function slide(title, kicker) {
  const s = pres.addSlide();
  s.background = { color: STONE };
  [ORANGE, MAROON, "F2A516"].forEach((c, i) => s.addShape(pres.ShapeType.rect, { x: W - 1.05 + i * 0.22, y: 0.45, w: 0.16, h: 0.16, fill: { color: c }, line: { width: 0 } }));
  s.addText(kicker.toUpperCase(), { x: M, y: 0.42, w: CW - 1.2, h: 0.3, fontFace: B, fontSize: 12, bold: true, color: ORANGE, charSpacing: 2, margin: 0 });
  s.addText(title, { x: M, y: 0.74, w: CW, h: 0.8, fontFace: H, fontSize: 34, bold: true, color: MAROON, margin: 0, valign: "top" });
  return s;
}
function steps(s, items, y0 = 1.85, gap = 0.95, size = 22) {
  items.forEach((t, i) => {
    const y = y0 + i * gap;
    s.addShape(pres.ShapeType.ellipse, { x: M, y, w: 0.6, h: 0.6, fill: { color: ORANGE }, line: { width: 0 } });
    s.addText(String(i + 1), { x: M, y, w: 0.6, h: 0.6, fontFace: B, fontSize: 20, bold: true, color: WHITE, align: "center", valign: "middle", margin: 0 });
    s.addText(t, { x: M + 0.85, y: y - 0.1, w: CW - 0.9, h: 0.8, fontFace: B, fontSize: size, color: INK, valign: "middle", margin: 0 });
  });
}
function block(s, text, color, x, y, w) {
  s.addShape(pres.ShapeType.roundRect, { x, y, w, h: 0.7, rectRadius: 0.12, fill: { color }, line: { width: 0 } });
  s.addText(text, { x: x + 0.25, y, w: w - 0.5, h: 0.7, fontFace: B, fontSize: 20, bold: true, color: WHITE, valign: "middle", margin: 0 });
}

/* 1 title */
{
  const s = pres.addSlide();
  s.background = { color: ARCADE };
  for (let i = 0; i < 26; i++) s.addShape(pres.ShapeType.rect, { x: (i * 1.37) % W, y: ((i * 2.31) % 6.6) + 0.2, w: 0.06, h: 0.06, fill: { color: i % 3 ? "5B5280" : "F2A516" }, line: { width: 0 } });
  s.addText("GAME STUDIO  ·  MAKECODE DAY 1", { x: M, y: 1.9, w: 10, h: 0.4, fontFace: B, fontSize: 14, bold: true, color: "F2A516", charSpacing: 4, margin: 0 });
  s.addText("Make your hero move.", { x: M, y: 2.4, w: 11, h: 1.3, fontFace: H, fontSize: 54, bold: true, color: WHITE, margin: 0 });
  s.addText("Today you stop designing the rules and start writing them. By the end of class, the hero you drew moves when you press the arrows.", { x: M, y: 3.9, w: 9.5, h: 1.2, fontFace: B, fontSize: 20, color: PINK, margin: 0 });
  s.addText("arcade.makecode.com", { x: M, y: 5.6, w: 8, h: 0.6, fontFace: "Consolas", fontSize: 26, bold: true, color: "F2A516", margin: 0 });
  s.addNotes("Roles rotate today. This week everybody codes; the Developer is the studio's go-to person.\n\nAgain (5 min): each student says their game's main verb and its controls, from their Mechanics tab.\n\nThen: nobody types yet. Watch first.");
}

/* 2 the screen */
{
  const s = slide("Three parts of MakeCode", "Watch first, nobody types yet");
  const parts = [["Drawers", "Colored menus full of blocks. Each color is a kind of rule.", BLUE], ["Workspace", "Where you snap blocks together. This is your code.", ORANGE], ["Simulator", "Your game, running for real. Test it here.", GREEN]];
  const w = (CW - 0.8) / 3;
  parts.forEach(([t, d, c], i) => {
    const x = M + i * (w + 0.4);
    s.addShape(pres.ShapeType.roundRect, { x, y: 1.9, w, h: 3.3, rectRadius: 0.1, fill: { color: WHITE }, line: { color: c, width: 3 } });
    s.addShape(pres.ShapeType.rect, { x, y: 1.9, w, h: 0.25, fill: { color: c }, line: { width: 0 } });
    s.addText(t, { x: x + 0.35, y: 2.45, w: w - 0.7, h: 0.6, fontFace: H, fontSize: 28, bold: true, color: INK, margin: 0 });
    s.addText(d, { x: x + 0.35, y: 3.2, w: w - 0.7, h: 1.6, fontFace: B, fontSize: 19, color: INK, margin: 0 });
  });
  s.addText("Press New Project. Name it after your studio.", { x: M, y: 5.7, w: CW, h: 0.6, fontFace: B, fontSize: 22, bold: true, color: MAROON, margin: 0 });
  s.addNotes("On the projector: open arcade.makecode.com, press New Project, and name it after a studio. Point at the drawers (left), the workspace (middle) and the simulator (the little game screen).");
}

/* 3 make a hero */
{
  const s = slide("Step 1: make your hero", "Sprites drawer (blue)");
  block(s, "on start", "1F8A70", M, 1.9, 4.2);
  block(s, "set  mySprite  to  sprite [  ]  of kind  Player", BLUE, M + 0.4, 2.7, 8.2);
  steps(s, ["Open the Sprites drawer and drag that block into on start.", "Click the gray square. Draw your hero.", "Use your hero from your World tab."], 3.85, 0.85, 20);
  s.addNotes("Do it live: Sprites drawer, drag set mySprite to sprite of kind Player into on start, click the gray square, draw a hero in the image editor.\n\nSay: this is your hero from the World tab.");
}

/* 4 move it */
{
  const s = slide("Step 2: make it move", "Controller drawer (red)");
  block(s, "on start", "1F8A70", M, 1.9, 4.2);
  block(s, "set  mySprite  to  sprite [hero]  of kind  Player", BLUE, M + 0.4, 2.7, 8.2);
  block(s, "move  mySprite  with buttons   (+)", RED, M + 0.4, 3.5, 6.2);
  steps(s, ["Open the Controller drawer. Drag move mySprite with buttons under your hero.", "Click the simulator, then press the arrow keys. Your hero moves!"], 4.6, 0.9, 20);
  s.addNotes("Drag move mySprite with buttons under the sprite block. Click the simulator so it has focus, press the arrow keys. Celebrate the first move.");
}

/* 5 numbers are checks */
{
  const s = slide("Step 3: speed is a number", "Mechanics are exact rules");
  block(s, "move  mySprite  with buttons   vx  100   vy  100", RED, M, 1.9, 8.6);
  s.addText("Press the + on the block to see vx and vy. Change them.", { x: M, y: 2.85, w: CW, h: 0.5, fontFace: B, fontSize: 20, color: INK, margin: 0 });
  s.addShape(pres.ShapeType.roundRect, { x: M, y: 3.7, w: CW, h: 1.6, rectRadius: 0.1, fill: { color: "FBEDE8" }, line: { width: 0 } });
  s.addText([{ text: "That number is a check.  ", options: { bold: true, color: ORANGE } }, { text: "“The hero crosses the screen in 2 seconds” is something a tester can test.", options: { color: INK } }], { x: M + 0.4, y: 3.7, w: CW - 0.8, h: 1.6, fontFace: B, fontSize: 22, valign: "middle", margin: 0 });
  s.addText("Every block is a rule. You are now the computer from the paper prototype.", { x: M, y: 5.75, w: CW, h: 0.7, fontFace: H, fontSize: 24, bold: true, color: MAROON, margin: 0 });
  s.addNotes("Press the plus sign on move mySprite with buttons; vx and vy appear. Try 50, 100, 200 so they see the difference.\n\nSay out loud the bold line at the bottom: every block is a rule. You are now the computer from the paper prototype.");
}

/* 6 your turn */
{
  const s = slide("Your turn", "25 minutes  ·  your own Chromebook, studios sit together");
  steps(s, [
    "New project at arcade.makecode.com, named after your studio.",
    "A Player sprite: draw your studio's hero.",
    "Move it with buttons. Try 3 speeds. Write down the one that fits your game's feeling.",
    "Scene drawer (green): set the background color to match your world.",
    "Show your studio. The QA Lead tries to make the hero go off the screen. Can they?",
  ], 1.8, 0.88, 19);
  s.addText([{ text: "Hint for #5: ", options: { bold: true, color: ORANGE } }, { text: "look for stay in screen in the Sprites drawer.", options: { color: MUTED } }], { x: M, y: 6.35, w: CW, h: 0.45, fontFace: B, fontSize: 16, margin: 0 });
  s.addNotes("Leave this slide up during work time.\n\nWalk the room. Ask: what speed did you pick, and why does it fit your game's feeling?\n\nStuck? Every drawer is a color: moving is Controller (red), the hero is Sprites (blue), the background is Scene (green).");
}

/* 7 done when */
{
  const s = pres.addSlide();
  s.background = { color: MAROON };
  s.addText("DONE WHEN", { x: M, y: 1.6, w: 8, h: 0.4, fontFace: B, fontSize: 14, bold: true, color: PINK, charSpacing: 4, margin: 0 });
  s.addText("Your hero moves with the arrow keys, at a speed you chose and wrote down.", { x: M, y: 2.1, w: 11.5, h: 2, fontFace: H, fontSize: 40, bold: true, color: WHITE, margin: 0 });
  s.addText("Tomorrow: things that touch. Collecting, getting hit, score and lives.", { x: M, y: 4.8, w: 11, h: 0.8, fontFace: B, fontSize: 22, color: PINK, margin: 0 });
  s.addNotes("Last 2 minutes: a few students say their speed and why it fits their game. Remind them MakeCode saves in the browser; the same Chromebook tomorrow keeps their project.");
}

pres.writeFile({ fileName: __dirname + "/MakeCode-Day-1.pptx" }).then((f) => console.log("wrote", f));
