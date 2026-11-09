/**
 * Game pitch: a fill-in template for the Game Studio unit's pitch day.
 *
 * Students make a copy and type over every gray [bracketed] prompt. Each
 * slide is one part of a 60 second pitch, in the order the class learned
 * them: the one-liner, the feeling (a game's purpose), the players, the core
 * loop, the hero and world, the mechanics as exact rules, level 1 as a player
 * story, and why it can be built in six weeks. Speaker notes on every slide
 * say what to say out loud. Opens in PowerPoint and Google Slides.
 * No em dashes anywhere in this deck.
 *
 *   cd docs/presentations
 *   npm install pptxgenjs      # once
 *   node pitch-template.js
 */
const pptxgen = require("pptxgenjs");

const MAROON = "630031";
const ORANGE = "CF4420";
const DEEP = "4A0025";
const STONE = "F6F4F1";
const WHITE = "FFFFFF";
const INK = "1C1A19";
const MUTED = "75787B";
const PROMPT = "9A9590"; // the gray students type over
const ARCADE = "1B1530";
const PINK = "E9C9D6";

const H = "Cambria";
const B = "Calibri";

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.333 x 7.5
pres.author = "Trail Crew Studio";
pres.title = "Game Pitch Template";

const W = 13.333;
const M = 0.7;
const CW = W - M * 2;

/* ---------------------------------------------------------------- helpers */

function slide(title, kicker, bg = STONE) {
  const s = pres.addSlide();
  s.background = { color: bg };
  // A little pixel trio in the corner, so every slide feels like the same game.
  [ORANGE, MAROON, "F2A516"].forEach((c, i) =>
    s.addShape(pres.ShapeType.rect, { x: W - 1.05 + i * 0.22, y: 0.45, w: 0.16, h: 0.16, fill: { color: c }, line: { width: 0 } }),
  );
  if (kicker) {
    s.addText(kicker.toUpperCase(), { x: M, y: 0.42, w: CW - 1.2, h: 0.3, fontFace: B, fontSize: 12, bold: true, color: ORANGE, charSpacing: 2, isTextBox: true, margin: 0 });
  }
  s.addText(title, { x: M, y: 0.74, w: CW, h: 0.75, fontFace: H, fontSize: 32, bold: true, color: bg === STONE ? MAROON : WHITE, isTextBox: true, margin: 0, valign: "top" });
  return s;
}

/**
 * A labeled box with a gray prompt to type over. The label stays; the prompt
 * is what students select and replace.
 */
function fill(s, { x, y, w, h, label, prompt, size = 18, align = "left", bg = WHITE, labelColor = MAROON }) {
  s.addShape(pres.ShapeType.roundRect, {
    x, y, w, h, rectRadius: 0.08,
    fill: { color: bg }, line: { color: "D9D2C8", width: 1.25, dashType: "dash" },
  });
  if (label) {
    s.addText(label, { x: x + 0.22, y: y + 0.12, w: w - 0.44, h: 0.32, fontFace: B, fontSize: 12, bold: true, color: labelColor, charSpacing: 1, isTextBox: true, margin: 0 });
  }
  const top = label ? 0.46 : 0.12;
  s.addText(prompt, {
    x: x + 0.22, y: y + top, w: w - 0.44, h: h - top - 0.12,
    fontFace: B, fontSize: size, color: PROMPT, italic: true, align, valign: "top", isTextBox: true, margin: 0,
  });
}

function tip(s, text, y = 6.75) {
  s.addText([{ text: "Tip: ", options: { bold: true, color: ORANGE } }, { text, options: { color: MUTED } }], {
    x: M, y, w: CW - 1.2, h: 0.4, fontFace: B, fontSize: 13, isTextBox: true, margin: 0,
  });
}

/* --------------------------------------------------------- 0 how to use */
{
  const s = slide("How to use this template", "Read me first, then delete this slide");
  const steps = [
    "Make your own copy (File, Make a copy), and give it your studio name.",
    "Click each gray [bracketed] prompt, select it, and type your own words over it.",
    "Keep it short. Big words, few words: you talk, the slide shows.",
    "Open the speaker notes under each slide: they say what to say out loud.",
    "Your whole pitch is 60 seconds, about 7 seconds a slide. Practice once out loud.",
    "Delete this slide before you pitch.",
  ];
  steps.forEach((t, i) => {
    const y = 1.85 + i * 0.72;
    s.addShape(pres.ShapeType.ellipse, { x: M, y, w: 0.48, h: 0.48, fill: { color: ORANGE }, line: { width: 0 } });
    s.addText(String(i + 1), { x: M, y, w: 0.48, h: 0.48, fontFace: B, fontSize: 16, bold: true, color: WHITE, align: "center", valign: "middle", isTextBox: true, margin: 0 });
    s.addText(t, { x: M + 0.75, y: y - 0.04, w: CW - 1, h: 0.56, fontFace: B, fontSize: 19, color: INK, valign: "middle", isTextBox: true, margin: 0 });
  });
  s.addNotes("For the teacher: students fill in slides 2 to 9. Each slide is one idea from the Game Studio unit. The speaker notes on each slide coach them on what to say, so a pitch sounds like talking, not reading.");
}

/* ----------------------------------------------------------- 1 title */
{
  const s = pres.addSlide();
  s.background = { color: ARCADE };
  for (let i = 0; i < 26; i++) {
    const x = (i * 1.37) % W, y = ((i * 2.31) % 6.6) + 0.2;
    s.addShape(pres.ShapeType.rect, { x, y, w: 0.06, h: 0.06, fill: { color: i % 3 ? "5B5280" : "F2A516" }, line: { width: 0 } });
  }
  s.addText("PRESS START", { x: M, y: 0.7, w: 6, h: 0.35, fontFace: B, fontSize: 14, bold: true, color: "F2A516", charSpacing: 4, isTextBox: true, margin: 0 });
  fill(s, { x: M, y: 1.3, w: CW, h: 1.55, label: "GAME NAME", prompt: "[Your game's name]", size: 44, bg: "2B2347", labelColor: PINK });
  fill(s, { x: M, y: 3.1, w: CW, h: 1.5, label: "THE ONE-LINER", prompt: "[It's a ___ game where you ___ so that you feel ___.]", size: 24, bg: "2B2347", labelColor: PINK });
  fill(s, { x: M, y: 4.85, w: 6.2, h: 1.15, label: "STUDIO", prompt: "[Your studio name]", size: 22, bg: "2B2347", labelColor: PINK });
  fill(s, { x: M + 6.5, y: 4.85, w: CW - 6.5, h: 1.15, label: "GENRE", prompt: "[Platformer? Racer? Puzzle? Survival?]", size: 20, bg: "2B2347", labelColor: PINK });
  s.addText("Studio names only, never real names.", { x: M, y: 6.4, w: CW, h: 0.4, fontFace: B, fontSize: 13, color: "9C93C9", isTextBox: true, margin: 0 });
  s.addNotes(
    "SAY (about 7 seconds): \"We are [studio name], and this is [game name]. It's a [genre] game where you [what you do] so that you feel [the feeling].\"\n\n" +
      "The one-liner is the most important sentence in the whole pitch. If someone only remembers one thing, it is this.",
  );
}

/* ------------------------------------------------------- 2 the feeling */
{
  const s = slide("The feeling", "Why this game should exist");
  fill(s, { x: M, y: 1.75, w: CW, h: 1.9, label: "WHEN YOU PLAY OUR GAME, YOU FEEL...", prompt: "[ONE BIG FEELING WORD: brave? sneaky? unstoppable? chill?]", size: 40, align: "center" });
  fill(s, { x: M, y: 3.9, w: CW, h: 1.8, label: "BECAUSE...", prompt: "[What in the game makes you feel that way? \"Because the floor tilts and you barely make every jump.\"]", size: 20 });
  tip(s, "A game's purpose is the feeling it gives the player. Every slide after this should make that feeling stronger.", 6.1);
  s.addNotes(
    "SAY: \"When you play [game], you feel [feeling], because [reason].\"\n\n" +
      "This is the game's PURPOSE. For apps, the purpose was the impact. For games, it is the feeling. Say the feeling word with energy.",
  );
}

/* ---------------------------------------------------------- 3 players */
{
  const s = slide("Who plays it", "There is always more than one player");
  const half = (CW - 0.4) / 2;
  fill(s, { x: M, y: 1.75, w: half, h: 2.15, label: "PLAYER 1", prompt: "[Explorers? Competitors? Collectors? Builders?]\n\n[What they want from the game]", size: 18 });
  fill(s, { x: M + half + 0.4, y: 1.75, w: half, h: 2.15, label: "PLAYER 2", prompt: "[A different kind of player]\n\n[What THEY want, which is different]", size: 18 });
  fill(s, { x: M, y: 4.15, w: CW, h: 1.5, label: "THE GROWN-UP WHO SAYS YES", prompt: "[A parent or teacher. Why would they be OK with this game?]", size: 18 });
  tip(s, "Different players want different things. Show how your game gives each of them something.", 6.05);
  s.addNotes(
    "SAY: \"Our game is for [player 1], who want [want], and [player 2], who want [want]. And parents like it because [reason].\"\n\n" +
      "Remember: there is ALWAYS more than one user. The adult who says yes is a user too.",
  );
}

/* --------------------------------------------------------- 4 core loop */
{
  const s = slide("The core loop", "What you do, over and over");
  const n = 4, bw = 2.35, gap = (CW - n * bw) / (n - 1), y = 1.95;
  for (let i = 0; i < n; i++) {
    const x = M + i * (bw + gap);
    s.addShape(pres.ShapeType.ellipse, { x, y, w: bw, h: bw, fill: { color: WHITE }, line: { color: ORANGE, width: 2.5, dashType: "dash" } });
    s.addText(i === 3 ? "[verb 4,\nor delete]" : `[verb ${i + 1}]`, { x, y, w: bw, h: bw, fontFace: B, fontSize: 22, italic: true, color: PROMPT, align: "center", valign: "middle", isTextBox: true, margin: 0 });
    if (i < n - 1) s.addText("→", { x: x + bw, y: y + bw / 2 - 0.4, w: gap, h: 0.8, fontFace: B, fontSize: 36, bold: true, color: ORANGE, align: "center", valign: "middle", isTextBox: true, margin: 0 });
  }
  s.addText("↺  and again", { x: M, y: 4.4, w: CW, h: 0.45, fontFace: B, fontSize: 18, bold: true, color: ORANGE, align: "center", isTextBox: true, margin: 0 });
  const half = (CW - 0.4) / 2;
  fill(s, { x: M, y: 5.0, w: half, h: 1.25, label: "YOU WIN WHEN...", prompt: "[reach the flag on level 3?]", size: 18 });
  fill(s, { x: M + half + 0.4, y: 5.0, w: half, h: 1.25, label: "YOU LOSE WHEN...", prompt: "[run out of 3 lives?]", size: 18 });
  tip(s, "One word per circle: run, jump, collect, upgrade. Details go on the mechanics slide.", 6.5);
  s.addNotes(
    "SAY: \"In [game] you [verb], [verb], [verb], and do it again. You win when [win], and you lose when [lose].\"\n\n" +
      "Point at the circles as you say each verb. If you can say the loop in one breath, it is a good loop.",
  );
}

/* ------------------------------------------------------- 5 hero & world */
{
  const s = slide("The hero and the world", "Who, where, and what is in the way");
  fill(s, { x: M, y: 1.75, w: 4.1, h: 4.3, label: "DRAW OR PASTE YOUR HERO", prompt: "[Insert a drawing, an emoji, or a picture you made. No pictures of real people.]", size: 16, align: "center" });
  const x2 = M + 4.4, w2 = CW - 4.4;
  fill(s, { x: x2, y: 1.75, w: w2, h: 1.0, label: "HERO", prompt: "[Name, and one thing about them]", size: 18 });
  fill(s, { x: x2, y: 2.85, w: w2, h: 1.0, label: "GOAL", prompt: "[What the hero wants]", size: 18 });
  fill(s, { x: x2, y: 3.95, w: w2, h: 1.0, label: "OBSTACLE", prompt: "[What is in the way]", size: 18 });
  fill(s, { x: x2, y: 5.05, w: w2, h: 1.0, label: "SETTING", prompt: "[Where it happens]", size: 18 });
  s.addNotes(
    "SAY: \"You play as [hero], who wants [goal]. But [obstacle]. It all happens in [setting].\"\n\n" +
      "This is the story in one breath. Hero, goal, obstacle: that is every story ever told.",
  );
}

/* --------------------------------------------------------- 6 mechanics */
{
  const s = slide("The mechanics", "The rules, exact enough to build");
  const cols = [["MECHANIC", 2.9], ["BUTTON", 2.3], ["EXACT RULE (how far? how fast? how many?)", CW - 5.2]];
  let x = M;
  cols.forEach(([t, w]) => {
    s.addShape(pres.ShapeType.rect, { x, y: 1.7, w, h: 0.5, fill: { color: MAROON }, line: { color: WHITE, width: 1 } });
    s.addText(t, { x: x + 0.15, y: 1.7, w: w - 0.3, h: 0.5, fontFace: B, fontSize: 12, bold: true, color: WHITE, valign: "middle", isTextBox: true, margin: 0 });
    x += w;
  });
  const rows = [
    ["[Jump]", "[A button]", "[Jumps 2 tiles high, once per press]"],
    ["[mechanic 2]", "[button]", "[exact rule with a number]"],
    ["[mechanic 3]", "[button]", "[exact rule with a number]"],
  ];
  rows.forEach((r, i) => {
    let cx = M;
    r.forEach((t, j) => {
      const w = cols[j][1];
      s.addShape(pres.ShapeType.rect, { x: cx, y: 2.2 + i * 1.05, w, h: 1.05, fill: { color: WHITE }, line: { color: "D9D2C8", width: 1 } });
      s.addText(t, { x: cx + 0.15, y: 2.2 + i * 1.05, w: w - 0.3, h: 1.05, fontFace: B, fontSize: 18, italic: true, color: PROMPT, valign: "middle", isTextBox: true, margin: 0 });
      cx += w;
    });
  });
  tip(s, "\"You jump high\" can't be built. \"Jumps 2 tiles high, once per press\" can. Numbers make it buildable.", 5.6);
  s.addNotes(
    "SAY: \"Here are the rules. [Read one mechanic and its exact rule.]\" You do not have to read all three: pick the coolest one.\n\n" +
      "The example row (Jump) is there to copy the pattern: replace it with your own mechanic.",
  );
}

/* ----------------------------------------------------- 7 level 1 story */
{
  const s = slide("Level 1, as a player story", "Who, what, why, and how we know it works");
  fill(s, { x: M, y: 1.7, w: CW, h: 1.3, label: "THE STORY", prompt: "[As a player, I want to ___, so I can ___.]", size: 22 });
  fill(s, { x: M, y: 3.2, w: CW, h: 1.05, label: "ONE CHECK (a tester could answer yes or no)", prompt: "[The jump clears a 2 tile gap.]", size: 18 });
  fill(s, { x: M, y: 4.45, w: CW, h: 1.6, label: "⛈️ A BAD DAY", prompt: "[Given ___ (what is already true), when ___ (the player does something), then ___ (what the game does).]", size: 18, bg: "FFF7E6" });
  s.addNotes(
    "SAY: \"In level 1, as a player, I want to [what], so I can [why]. We will know it works when [check]. And if [bad day], the game [what it does].\"\n\n" +
      "This is what makes our pitch different from most: we already know how to TEST it. Say the check with confidence.",
  );
}

/* --------------------------------------------------- 8 buildable in 6 */
{
  const s = slide("Why we can build it in six weeks", "Scope: small enough to finish, big enough to be fun");
  const checks = [
    ["One hero", "[Our hero is ___]"],
    ["One core loop", "[Our loop is ___ → ___ → ___]"],
    ["Three levels", "[Level 1 ___, level 2 ___, level 3 ___]"],
  ];
  checks.forEach(([t, p], i) => {
    const y = 1.8 + i * 1.3;
    s.addShape(pres.ShapeType.roundRect, { x: M, y, w: 0.7, h: 0.7, rectRadius: 0.08, fill: { color: WHITE }, line: { color: ORANGE, width: 2.5 } });
    s.addText("☐", { x: M, y, w: 0.7, h: 0.7, fontFace: B, fontSize: 30, color: ORANGE, align: "center", valign: "middle", isTextBox: true, margin: 0 });
    s.addText(t, { x: M + 0.95, y: y - 0.05, w: 3.2, h: 0.8, fontFace: H, fontSize: 24, bold: true, color: MAROON, valign: "middle", isTextBox: true, margin: 0 });
    fill(s, { x: M + 4.2, y: y - 0.1, w: CW - 4.2, h: 0.95, prompt: p, size: 18 });
  });
  fill(s, { x: M, y: 5.75, w: CW, h: 0.95, label: "THE ONE THING WE ARE CUTTING TO FINISH ON TIME", prompt: "[A cool idea we are saving for version 2]", size: 17 });
  s.addNotes(
    "SAY: \"We can build this in six weeks: one hero, one loop, three levels. We are saving [cut idea] for version 2.\"\n\n" +
      "Cutting something on purpose shows you think like a real studio. Every real game cuts ideas to ship on time. Type an X or a check mark in each box.",
  );
}

/* ----------------------------------------------------------- 9 closing */
{
  const s = pres.addSlide();
  s.background = { color: MAROON };
  s.addShape(pres.ShapeType.ellipse, { x: 9.6, y: -1.5, w: 6.2, h: 6.2, fill: { color: DEEP }, line: { width: 0 } });
  s.addText("THANK YOU", { x: M, y: 0.8, w: 8, h: 0.35, fontFace: B, fontSize: 14, bold: true, color: PINK, charSpacing: 4, isTextBox: true, margin: 0 });
  fill(s, { x: M, y: 1.35, w: 8.6, h: 1.6, label: "OUR GAME, IN ONE LAST LINE", prompt: "[Say the one-liner again, with energy]", size: 26, bg: "7A1A47", labelColor: PINK });
  fill(s, { x: M, y: 3.2, w: 8.6, h: 1.4, label: "WE NEED YOUR HELP WITH...", prompt: "[A question for the class: \"Should level 3 be in the dark?\"]", size: 20, bg: "7A1A47", labelColor: PINK });
  fill(s, { x: M, y: 4.85, w: 8.6, h: 1.25, label: "STUDIO", prompt: "[Studio name, and each person's role: Producer, Game Designer, Developer, QA Lead]", size: 17, bg: "7A1A47", labelColor: PINK });
  s.addNotes(
    "SAY: \"[One-liner again.] We'd love your help: [question]. We are [studio], thank you!\"\n\n" +
      "End with the question, then stop and listen. The class gets to ask you one question each.",
  );
}

pres.writeFile({ fileName: __dirname + "/Game-Pitch-Template.pptx" }).then((f) => console.log("wrote", f));
