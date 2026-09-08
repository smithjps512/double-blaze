/**
 * Trail Crew: first day back.
 *
 * A deck for a teacher to present to a middle school class returning to a
 * software project they started last term. Every number in it was counted from
 * the repository, and every claim about what a tool does was checked against
 * the tool.
 */
const pptxgen = require("pptxgenjs");

const MAROON = "630031";
const ORANGE = "CF4420";
const DEEP = "4A0025";
const STONE = "F6F4F1";
const WHITE = "FFFFFF";
const INK = "1C1A19";
const MUTED = "75787B";
const GREEN = "2E4A3B";

const H = "Cambria";
const B = "Calibri";

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.333 x 7.5
pres.author = "Double Blaze";
pres.title = "Trail Crew: first day back";

const W = 13.333;
const M = 0.7; // page margin
const CW = W - M * 2; // content width

/* ---------------------------------------------------------------- helpers */

/** A light content slide with a title. */
function content(title, kicker) {
  const s = pres.addSlide();
  s.background = { color: STONE };
  if (kicker) {
    s.addText(kicker.toUpperCase(), {
      x: M, y: 0.42, w: CW, h: 0.28,
      fontFace: B, fontSize: 12, bold: true, color: ORANGE, charSpacing: 2,
      isTextBox: true, margin: 0,
    });
  }
  s.addText(title, {
    x: M, y: kicker ? 0.72 : 0.55, w: CW, h: 0.85,
    fontFace: H, fontSize: 34, bold: true, color: MAROON,
    isTextBox: true, margin: 0, valign: "top",
  });
  return s;
}

/** A dark divider or statement slide. */
function dark(color = MAROON) {
  const s = pres.addSlide();
  s.background = { color };
  return s;
}

/** A tinted card. Subtle fill and a soft shadow, never an edge stripe. */
function card(s, { x, y, w, h, fill = WHITE }) {
  s.addShape(pres.ShapeType.roundRect, {
    x, y, w, h, rectRadius: 0.09,
    fill: { color: fill },
    line: { color: "E4DED6", width: 1 },
    shadow: { type: "outer", angle: 90, blur: 8, offset: 1, opacity: 0.08, color: "000000" },
  });
}

/** The repeating motif: a number in a filled circle. */
function numberDot(s, n, x, y, { size = 0.46, fill = ORANGE, color = WHITE } = {}) {
  s.addShape(pres.ShapeType.ellipse, { x, y, w: size, h: size, fill: { color }, line: { color: fill, width: 0 } });
  s.addShape(pres.ShapeType.ellipse, { x, y, w: size, h: size, fill: { color: fill }, line: { width: 0 } });
  s.addText(String(n), {
    x, y, w: size, h: size,
    fontFace: B, fontSize: 15, bold: true, color,
    align: "center", valign: "middle", isTextBox: true, margin: 0,
  });
}

/**
 * n equal columns that exactly fill the content width.
 *
 * Every row of cards used to carry its own hand-picked width and gap, and three
 * of them quietly added up to more than the page, so nothing lined up down the
 * right hand side. Deriving the width from the page removes the arithmetic.
 */
function grid(n, gap = 0.36) {
  const w = (CW - gap * (n - 1)) / n;
  return { w, gap, x: (i) => M + i * (w + gap) };
}

function body(s, text, opts) {
  s.addText(text, {
    fontFace: B, fontSize: 15, color: INK, lineSpacing: 22,
    isTextBox: true, margin: 0, valign: "top", ...opts,
  });
}

/* ------------------------------------------------------------------ 1 title */
{
  const s = dark(MAROON);
  s.addShape(pres.ShapeType.ellipse, {
    x: 9.6, y: -1.5, w: 6.2, h: 6.2, fill: { color: DEEP }, line: { width: 0 },
  });
  s.addShape(pres.ShapeType.ellipse, {
    x: 11.4, y: 4.3, w: 3.4, h: 3.4, fill: { color: ORANGE }, line: { width: 0 }, transparency: 70,
  });
  s.addText("TRAIL CREW  ·  TERM TWO", {
    x: M, y: 1.9, w: 8.4, h: 0.34,
    fontFace: B, fontSize: 13, bold: true, color: "E9C9D6", charSpacing: 3,
    isTextBox: true, margin: 0,
  });
  s.addText("You already wrote\nthe hard part.", {
    x: M, y: 2.32, w: 8.6, h: 2.1,
    fontFace: H, fontSize: 48, bold: true, color: WHITE, lineSpacing: 52,
    isTextBox: true, margin: 0,
  });
  s.addText(
    "Last term you decided what to build. This term you find out whether you were right, design it properly, and make it run.",
    { x: M, y: 4.6, w: 8.0, h: 1.0, fontFace: B, fontSize: 16, color: "EBD9E1", lineSpacing: 24, isTextBox: true, margin: 0 },
  );
  s.addNotes(
    "Open here. The point of this slide is that nobody is starting over.\n\n" +
      "Say: the plans and the stories you wrote are not warm-up exercises, they are the specification. Everything we do this term is built out of them, and by the end of today you will have seen that happen on screen.\n\n" +
      "Do not go through the tools yet. Just set the frame.",
  );
}

/* --------------------------------------------------------------- 2 numbers */
{
  const s = content("Where we got to", "Since September");
  const stats = [
    ["14", "teams", "with a product plan"],
    ["40", "user stories", "written by you"],
    ["15", "prototypes", "you can click, right now"],
    ["1", "site", "already live on the internet"],
  ];
  const { w: cw, x: colX } = grid(4, 0.35);
  stats.forEach(([n, label, note], i) => {
    const x = colX(i);
    card(s, { x, y: 2.3, w: cw, h: 2.6 });
    s.addText(n, {
      x, y: 2.5, w: cw, h: 1.15,
      fontFace: H, fontSize: 60, bold: true, color: MAROON,
      align: "center", isTextBox: true, margin: 0,
    });
    s.addText(label, {
      x, y: 3.7, w: cw, h: 0.32,
      fontFace: B, fontSize: 15, bold: true, color: INK,
      align: "center", isTextBox: true, margin: 0,
    });
    s.addText(note, {
      x: x + 0.18, y: 4.05, w: cw - 0.36, h: 0.72,
      fontFace: B, fontSize: 12, color: "5A5F63",
      align: "center", isTextBox: true, margin: 0,
    });
  });
  body(s, "None of that was generated for you. Every screen in every prototype came from a sentence somebody in this room wrote down.", {
    x: M, y: 5.35, w: CW, h: 0.7, fontSize: 16, color: MUTED,
  });
  s.addNotes(
    "Read the numbers out. They are counted from the repository, not estimated.\n\n" +
      "The last line is the one that matters. If a team asks why their prototype looks thin, the honest answer is that their writing was thin, and that is fixable this week.\n\n" +
      "The one live site is Classic Cars. Do not explain it yet, it comes back at the end.",
  );
}

/* ------------------------------------------------- 3 what we are learning */
{
  const s = content("Three things, properly", "What we are learning");
  const cols = [
    [
      "1", "Write what to build",
      "A user story that somebody who has never met you could build from. Who it is for, what they do, and how you know it is finished.",
      "The skill: saying exactly what you mean.",
    ],
    [
      "2", "Design it",
      "Turn the story into screens in Figma, using the component names your own team already agreed on, so what you draw is what gets built.",
      "The skill: designing for a real material.",
    ],
    [
      "3", "Build it",
      "Make it run in Anvil, one pattern at a time, from documents that point at each other instead of one big pile of code.",
      "The skill: looking things up until you stop needing to.",
    ],
  ];
  const { w: cw, x: colX } = grid(3);
  cols.forEach(([n, title, text, skill], i) => {
    const x = colX(i);
    card(s, { x, y: 2.0, w: cw, h: 3.55 });
    numberDot(s, n, x + 0.35, 2.28);
    s.addText(title, {
      x: x + 0.35, y: 2.98, w: cw - 0.7, h: 0.45,
      fontFace: H, fontSize: 20, bold: true, color: MAROON, isTextBox: true, margin: 0,
    });
    s.addText(text, {
      x: x + 0.35, y: 3.46, w: cw - 0.7, h: 1.45,
      fontFace: B, fontSize: 13.5, color: INK, lineSpacing: 19, isTextBox: true, margin: 0,
    });
    s.addText(skill, {
      x: x + 0.35, y: 4.88, w: cw - 0.7, h: 0.5,
      fontFace: B, fontSize: 12.5, italic: true, color: ORANGE, lineSpacing: 17, isTextBox: true, margin: 0,
    });
  });
  body(s, "Three things, done properly, instead of eight done once. Testing, databases and the rest are real, and they are not this term.", {
    x: M, y: 5.8, w: CW, h: 0.6, fontSize: 15, color: MUTED,
  });
  s.addNotes(
    "This is the slide that manages expectations, for them and for you.\n\n" +
      "Say out loud that you have deliberately picked three things to go deep on rather than covering everything shallowly. Middle schoolers respond well to being told the plan.\n\n" +
      "The bottom line matters: when somebody asks 'why aren't we writing tests ourselves', the answer is that it is a real skill and it is not this term's skill.",
  );
}

/* ----------------------------------------------------------- 4 the chain */
{
  const s = dark(MAROON);
  s.addText("Everything is built from the story", {
    x: M, y: 0.75, w: CW, h: 0.7,
    fontFace: H, fontSize: 34, bold: true, color: WHITE, isTextBox: true, margin: 0,
  });
  s.addText("Change a story and the rest changes with it. That is not a slogan, it is how the tool actually works.", {
    x: M, y: 1.5, w: 9.6, h: 0.5, fontFace: B, fontSize: 15, color: "E9C9D6", isTextBox: true, margin: 0,
  });

  const chain = ["Your story", "Test plan", "Build card", "Architecture", "Code"];
  const bw = (CW - 4 * 0.32) / 5, gap = 0.32;
  chain.forEach((label, i) => {
    const x = M + i * (bw + gap);
    s.addShape(pres.ShapeType.roundRect, {
      x, y: 2.5, w: bw, h: 0.95, rectRadius: 0.1,
      fill: { color: i === 0 ? ORANGE : DEEP }, line: { color: i === 0 ? ORANGE : "7A2049", width: 1 },
    });
    s.addText(label, {
      x, y: 2.5, w: bw, h: 0.95,
      fontFace: B, fontSize: 14, bold: true, color: WHITE,
      align: "center", valign: "middle", isTextBox: true, margin: 0,
    });
    if (i < chain.length - 1) {
      s.addText("→", {
        x: x + bw, y: 2.5, w: gap, h: 0.95,
        fontFace: B, fontSize: 16, color: "C79AAF",
        align: "center", valign: "middle", isTextBox: true, margin: 0,
      });
    }
  });

  // Two things fall out of the chain rather than sitting on it, so they hang
  // below the box they come from with a short connector rather than floating in
  // a row of their own with a gap where nothing goes.
  const drop = (slot, label) => {
    const x = M + slot * (bw + gap);
    s.addText("↓", {
      x, y: 3.45, w: bw, h: 0.4,
      fontFace: B, fontSize: 15, color: "C79AAF", align: "center", isTextBox: true, margin: 0,
    });
    s.addShape(pres.ShapeType.roundRect, {
      x, y: 3.9, w: bw, h: 0.95, rectRadius: 0.1,
      fill: { color: DEEP }, line: { color: "7A2049", width: 1 },
    });
    s.addText(label, {
      x, y: 3.9, w: bw, h: 0.95,
      fontFace: B, fontSize: 14, bold: true, color: WHITE,
      align: "center", valign: "middle", isTextBox: true, margin: 0,
    });
  };
  drop(0, "Prototype");
  drop(3, "Design brief");

  s.addShape(pres.ShapeType.roundRect, {
    x: M + 4 * (bw + gap), y: 3.9, w: bw, h: 0.95, rectRadius: 0.1,
    fill: { color: DEEP }, line: { color: "7A2049", width: 1 },
  });
  s.addText("Figma", {
    x: M + 4 * (bw + gap), y: 3.9, w: bw, h: 0.95,
    fontFace: B, fontSize: 14, bold: true, color: WHITE,
    align: "center", valign: "middle", isTextBox: true, margin: 0,
  });
  s.addText("→", {
    x: M + 4 * (bw + gap) - gap, y: 3.9, w: gap, h: 0.95,
    fontFace: B, fontSize: 16, color: "C79AAF", align: "center", valign: "middle", isTextBox: true, margin: 0,
  });

  s.addText(
    "One sentence, five documents, two of which you never have to write.",
    { x: M, y: 5.35, w: CW, h: 0.5, fontFace: B, fontSize: 16, italic: true, color: "EBD9E1", isTextBox: true, margin: 0 },
  );
  s.addNotes(
    "Walk the top row left to right, then the second row.\n\n" +
      "The thing to land: the prototype, the test plan and the design brief are all generated. Nobody types them. So when a story changes, they change, and they cannot quietly disagree with each other.\n\n" +
      "This is also the honest answer to 'is the computer doing it for us'. It is doing the copying. You are doing the deciding.",
  );
}

/* -------------------------------------------------------- 5 section: write */
{
  const s = dark(DEEP);
  s.addShape(pres.ShapeType.ellipse, { x: 10.3, y: 1.5, w: 4.4, h: 4.4, fill: { color: MAROON }, line: { width: 0 } });
  s.addText("01", {
    x: M, y: 2.15, w: 3, h: 1.4,
    fontFace: H, fontSize: 72, bold: true, color: ORANGE, isTextBox: true, margin: 0,
  });
  s.addText("Write it", {
    x: M, y: 3.5, w: 8, h: 0.95,
    fontFace: H, fontSize: 44, bold: true, color: WHITE, isTextBox: true, margin: 0,
  });
  s.addText("The user story, and the thing it turns into while you are still typing.", {
    x: M, y: 4.5, w: 8.2, h: 0.6, fontFace: B, fontSize: 16, color: "E9C9D6", isTextBox: true, margin: 0,
  });
  s.addNotes("Short pause here. This is the section they will spend the most class time on.");
}

/* ------------------------------------------------------ 6 shape of a story */
{
  const s = content("A story has three parts", "The shape");
  const parts = [
    ["Narrative", "One sentence, in three pieces.",
      "As a teacher,\nI want to add points to a house,\nso that students can see their house going up during the week."],
    ["Acceptance criteria", "Your finish line. Things somebody could check by looking.",
      "•  A teacher can add up to 50 points at a time\n•  The scoreboard updates straight away"],
    ["Scenarios", "One story of one time somebody uses it.",
      "Given I am signed in as a teacher\nWhen I add 10 points to Gryffindor\nThen the scoreboard shows 10 more"],
  ];
  const { w: cw, x: colX } = grid(3);
  parts.forEach(([title, sub, example], i) => {
    const x = colX(i);
    card(s, { x, y: 1.95, w: cw, h: 3.5 });
    s.addText(title, {
      x: x + 0.32, y: 2.2, w: cw - 0.64, h: 0.4,
      fontFace: H, fontSize: 19, bold: true, color: MAROON, isTextBox: true, margin: 0,
    });
    s.addText(sub, {
      x: x + 0.32, y: 2.62, w: cw - 0.64, h: 0.62,
      fontFace: B, fontSize: 13, color: MUTED, lineSpacing: 17, isTextBox: true, margin: 0,
    });
    s.addShape(pres.ShapeType.roundRect, {
      x: x + 0.32, y: 3.32, w: cw - 0.64, h: 1.85, rectRadius: 0.07,
      fill: { color: "F0EBE4" }, line: { width: 0 },
    });
    s.addText(example, {
      x: x + 0.5, y: 3.46, w: cw - 1.0, h: 1.6,
      fontFace: B, fontSize: 12, color: INK, lineSpacing: 16, isTextBox: true, margin: 0,
    });
  });
  body(s, "“As a” names a kind of person, never a name. “So that” is the half everybody skips and the only part that says whether the feature is worth building.", {
    x: M, y: 5.7, w: CW, h: 0.7, fontSize: 15, color: MUTED,
  });
  s.addNotes(
    "Use the House Points example because it is a real story from this class.\n\n" +
      "Spend the most time on 'so that'. Ask the room: what goes wrong if this feature does not exist? If nobody can answer, the feature might not be worth building, and noticing that is the skill.\n\n" +
      "Do not explain Given/When/Then in depth yet. The next-but-one slide makes the case for it far better than any explanation.",
  );
}

/* ------------------------------------------------------- 7 the studio tour */
{
  const s = content("Where you write it", "The story studio");
  card(s, { x: M, y: 1.95, w: 6.0, h: 4.5 });
  s.addText("You type on the left", {
    x: M + 0.35, y: 2.2, w: 5.3, h: 0.4,
    fontFace: H, fontSize: 19, bold: true, color: MAROON, isTextBox: true, margin: 0,
  });
  const fields = ["Name it", "As a  /  I want  /  So that", "Acceptance criteria, as many as you need", "Given  /  When  /  Then"];
  fields.forEach((f, i) => {
    const y = 2.85 + i * 0.72;
    s.addShape(pres.ShapeType.roundRect, {
      x: M + 0.35, y, w: 5.3, h: 0.46, rectRadius: 0.06,
      fill: { color: "F0EBE4" }, line: { width: 0 },
    });
    s.addText(f, {
      x: M + 0.55, y, w: 5.0, h: 0.46,
      fontFace: B, fontSize: 13, color: INK, valign: "middle", isTextBox: true, margin: 0,
    });
  });
  s.addText("doubleblaze.solutions/trail-crew/write", {
    x: M + 0.35, y: 5.85, w: 5.3, h: 0.35,
    fontFace: B, fontSize: 12.5, bold: true, color: ORANGE, isTextBox: true, margin: 0,
  });

  const right = M + 6.4;
  card(s, { x: right, y: 1.95, w: CW - 6.4, h: 4.5 });
  s.addText("It answers on the right", {
    x: right + 0.35, y: 2.2, w: 4.6, h: 0.4,
    fontFace: H, fontSize: 19, bold: true, color: MAROON, isTextBox: true, margin: 0,
  });
  const answers = [
    ["Checks", "What is missing, and what is thin. Rules, not opinions, so you can argue with them."],
    ["Your story", "Exactly what would go into your team's file."],
    ["The test plan", "Built from what you typed. Watch it while you write."],
    ["What it takes to build", "Which patterns your own words point at."],
  ];
  answers.forEach(([t, d], i) => {
    const y = 2.82 + i * 0.88;
    numberDot(s, i + 1, right + 0.35, y, { size: 0.36 });
    s.addText(t, {
      x: right + 0.85, y: y - 0.03, w: 4.1, h: 0.28,
      fontFace: B, fontSize: 13.5, bold: true, color: INK, isTextBox: true, margin: 0,
    });
    s.addText(d, {
      x: right + 0.85, y: y + 0.25, w: 4.2, h: 0.5,
      fontFace: B, fontSize: 11.5, color: MUTED, lineSpacing: 14, isTextBox: true, margin: 0,
    });
  });
  s.addNotes(
    "Do this one live if the projector will cooperate. Open the studio and type a story badly on purpose.\n\n" +
      "Type a criterion like 'the app must be fun'. Watch the test plan produce nothing. Then fix it in front of them and watch a test appear. That thirty seconds is worth more than this whole slide.\n\n" +
      "Point out that nothing is saved until they send it, and nothing changes their team's file until you approve it.",
  );
}

/* --------------------------------------------------------- 8 the test plan */
{
  const s = content("Your test plan writes itself", "And the gap in it is the lesson");
  const rows = [
    ["T1", "Set it up so that I am signed in as a teacher.\nI add 10 points to Gryffindor.", "The scoreboard shows 10 more", "Your scenario"],
    ["T2", "You write this. What would you actually do\nto find out?", "A teacher can add up to 50 points at a time", "A criterion"],
  ];
  const cols = [0.5, 4.65, 4.4, 1.78];
  const xs = [M];
  cols.forEach((c, i) => xs.push(xs[i] + c + 0.2));
  // 0.5+4.65+4.4+1.78 + three 0.2 gaps = 11.93 = the content width exactly.

  ["#", "What somebody does", "It passes when", "Came from"].forEach((h, i) => {
    s.addText(h, {
      x: xs[i], y: 1.95, w: cols[i], h: 0.3,
      fontFace: B, fontSize: 12, bold: true, color: MAROON, charSpacing: 1, isTextBox: true, margin: 0,
    });
  });
  rows.forEach((r, ri) => {
    const y = 2.4 + ri * 1.15;
    card(s, { x: M, y: y - 0.12, w: CW, h: 1.0, fill: ri === 1 ? "FBF0EA" : WHITE });
    r.forEach((cell, ci) => {
      s.addText(cell, {
        x: xs[ci], y, w: cols[ci], h: 0.8,
        fontFace: B, fontSize: 12.5,
        color: ri === 1 && ci === 1 ? ORANGE : ci === 3 ? MUTED : INK,
        bold: ri === 1 && ci === 1,
        lineSpacing: 16, isTextBox: true, margin: 0, valign: "top",
      });
    });
  });

  card(s, { x: M, y: 4.85, w: CW, h: 1.35, fill: "EFF2EE" });
  s.addText("The scenario filled in both columns. The criterion only filled in one.", {
    x: M + 0.35, y: 5.05, w: CW - 0.7, h: 0.4,
    fontFace: H, fontSize: 19, bold: true, color: GREEN, isTextBox: true, margin: 0,
  });
  s.addText("A criterion tells you what has to be true. It never tells you what somebody does. That is what three extra lines of Given, When and Then buys you, and it is why they are worth typing.", {
    x: M + 0.35, y: 5.5, w: CW - 0.7, h: 0.6,
    fontFace: B, fontSize: 13.5, color: INK, lineSpacing: 18, isTextBox: true, margin: 0,
  });
  s.addNotes(
    "This is the single most useful slide in the deck. Do not rush it.\n\n" +
      "Ask them to spot the difference before you say it. Somebody will.\n\n" +
      "Then the important bit: you are not going to learn to write test plans this term. You are going to read the ones your stories produce, and use them to find out whether your story was any good. Writing them properly is a real job and it is a later job.",
  );
}

/* ------------------------------------------------- 9 what your stories said */
{
  const s = content("What your own stories already told us", "Read this before you argue with it");
  card(s, { x: M, y: 1.95, w: 6.1, h: 3.5, fill: "FBF0EA" });
  s.addText("One team wrote this", {
    x: M + 0.35, y: 2.18, w: 5.4, h: 0.32,
    fontFace: B, fontSize: 12, bold: true, color: ORANGE, charSpacing: 1, isTextBox: true, margin: 0,
  });
  s.addText("“The animation must be entertaining\nto as many people as possible.”", {
    x: M + 0.35, y: 2.6, w: 5.4, h: 0.9,
    fontFace: H, fontSize: 20, italic: true, color: INK, lineSpacing: 27, isTextBox: true, margin: 0,
  });
  s.addText("That is a real thing to want, and there is no way to look at a screen and check it. So it produces no test, and a note explaining why.\n\nIt is not a bad idea. It is an idea that is not finished yet.", {
    x: M + 0.35, y: 3.62, w: 5.4, h: 1.25,
    fontFace: B, fontSize: 13.5, color: INK, lineSpacing: 18, isTextBox: true, margin: 0,
  });

  const right = M + 6.5;
  const facts = [
    ["161", "tests came out of your 40 stories"],
    ["108", "of them are missing their steps, because they came from criteria and not scenarios"],
    ["14", "criteria across the class have no test at all, and every one is somebody's real sentence"],
  ];
  facts.forEach(([n, t], i) => {
    const y = 1.95 + i * 1.2;
    card(s, { x: right, y, w: CW - 6.5, h: 1.1 });
    s.addText(n, {
      x: right + 0.25, y, w: 1.0, h: 1.1,
      fontFace: H, fontSize: 30, bold: true, color: MAROON,
      valign: "middle", isTextBox: true, margin: 0,
    });
    s.addText(t, {
      x: right + 1.3, y: y + 0.12, w: CW - 6.5 - 1.55, h: 0.86,
      fontFace: B, fontSize: 12.5, color: INK, lineSpacing: 16, valign: "middle", isTextBox: true, margin: 0,
    });
  });

  body(s, "Nobody is in trouble. Every professional team writes criteria like that one, and the good ones notice.", {
    x: M, y: 5.75, w: CW, h: 0.6, fontSize: 15, color: MUTED,
  });
  s.addNotes(
    "Handle this slide with care. Do not name the team unless they volunteer it, and say the last line before anybody feels caught out.\n\n" +
      "The framing that works: the tool is not marking your work. It is telling you which sentences a stranger could not build from, which is exactly what a design review does at a real company.\n\n" +
      "If a team gets defensive, ask them what they would see on the screen if their criterion were true. They will usually answer it themselves in about ten seconds, and that answer is the rewritten criterion.",
  );
}

/* ------------------------------------------------------- 10 section: design */
{
  const s = dark(DEEP);
  s.addShape(pres.ShapeType.ellipse, { x: 10.3, y: 1.5, w: 4.4, h: 4.4, fill: { color: MAROON }, line: { width: 0 } });
  s.addText("02", {
    x: M, y: 2.15, w: 3, h: 1.4,
    fontFace: H, fontSize: 72, bold: true, color: ORANGE, isTextBox: true, margin: 0,
  });
  s.addText("Design it", {
    x: M, y: 3.5, w: 8, h: 0.95,
    fontFace: H, fontSize: 44, bold: true, color: WHITE, isTextBox: true, margin: 0,
  });
  s.addText("Figma, and the reason your layer names matter more than your colours.", {
    x: M, y: 4.5, w: 8.2, h: 0.6, fontFace: B, fontSize: 16, color: "E9C9D6", isTextBox: true, margin: 0,
  });
  s.addNotes("Designers sit up here. So should the builders, because the second half of this section is about them.");
}

/* --------------------------------------------------- 11 the design brief */
{
  const s = content("Your team already named every button", "Nobody told the designers this");
  body(s, "Open your team's design brief. It lists every screen in your app, and inside each one, the exact name of every label, box and button. Your builders agreed those names. Nobody wrote the page: it is your architecture, read back as a list of things to draw.", {
    x: M, y: 1.9, w: 9.2, h: 1.0, fontSize: 16,
  });

  card(s, { x: M, y: 3.1, w: 6.0, h: 3.0 });
  s.addText("Scoreboard", {
    x: M + 0.35, y: 3.35, w: 5.3, h: 0.35,
    fontFace: H, fontSize: 17, bold: true, color: MAROON, isTextBox: true, margin: 0,
  });
  const layers = [
    ["rp_houses", "RepeatingPanel"],
    ["    ↳ lbl_house_name", "Label"],
    ["    ↳ lbl_house_points", "Label"],
    ["btn_go_add_points", "Button, hidden from students"],
  ];
  layers.forEach(([name, type], i) => {
    const y = 3.88 + i * 0.5;
    s.addText(name, {
      x: M + 0.35, y, w: 2.9, h: 0.34,
      fontFace: "Courier New", fontSize: 12, color: INK, valign: "middle", isTextBox: true, margin: 0,
    });
    s.addText(type, {
      x: M + 3.35, y, w: 2.3, h: 0.34,
      fontFace: B, fontSize: 11.5, color: MUTED, valign: "middle", isTextBox: true, margin: 0,
    });
  });

  const right = M + 6.4;
  card(s, { x: right, y: 3.1, w: CW - 6.4, h: 3.0, fill: "FBF0EA" });
  s.addText("Use these as your Figma layer names", {
    x: right + 0.35, y: 3.35, w: 4.6, h: 0.35,
    fontFace: H, fontSize: 17, bold: true, color: MAROON, isTextBox: true, margin: 0,
  });
  s.addText(
    "Copy them exactly, underscores and all.\n\nThen your builder opens your design and finds their own components in it. If your layers are called Rectangle 41, they are guessing.\n\nIt costs ten seconds per layer and it is the difference between a design that gets built and one that gets admired.",
    { x: right + 0.35, y: 3.85, w: 4.7, h: 2.1, fontFace: B, fontSize: 13, color: INK, lineSpacing: 17, isTextBox: true, margin: 0 },
  );
  s.addNotes(
    "This is the slide that makes designers and builders talk to each other.\n\n" +
      "Point out that the design brief is generated from the architecture, so it cannot drift. If the builders change a component name, the brief changes.\n\n" +
      "One question to put to every team before they design anything: can you find every one of your components in this design? If the answer is no, they found the gap for free.",
  );
}

/* --------------------------------------------------------- 12 figma rules */
{
  const s = content("Figma, in five rules", "There is a step by step guide with pictures");
  const rules = [
    ["One frame per screen", "Named exactly as your design brief names it. Four screens inside one frame cannot be linked to each other."],
    ["Layer names are not decoration", "btn_save, lbl_error, rp_houses. This is also how the good animation works later."],
    ["Design what Anvil can build", "It has a fixed set of components. Figma will happily let you draw a gradient button nobody on your team can produce."],
    ["A repeating list is one row", "Design it once. Anvil stamps out a copy per row of data. Row three cannot look different from row one."],
    ["Draw the bad day", "Empty, wrong and full, not just the happy one. Your builder invents the other two at speed if you do not."],
  ];
  rules.forEach(([t, d], i) => {
    const y = 1.95 + i * 0.86;
    numberDot(s, i + 1, M, y + 0.08, { size: 0.42 });
    s.addText(t, {
      x: M + 0.62, y, w: 3.7, h: 0.62,
      fontFace: B, fontSize: 15, bold: true, color: MAROON,
      valign: "middle", isTextBox: true, margin: 0,
    });
    s.addText(d, {
      x: M + 4.6, y, w: CW - 4.6, h: 0.62,
      fontFace: B, fontSize: 13, color: INK, lineSpacing: 17,
      valign: "middle", isTextBox: true, margin: 0,
    });
  });
  s.addText("doubleblaze.solutions/build/prototype-steps.html  —  22 numbered steps, diagrams, and what to do when it goes wrong", {
    x: M, y: 6.4, w: CW, h: 0.4,
    fontFace: B, fontSize: 12.5, bold: true, color: ORANGE, isTextBox: true, margin: 0,
  });
  s.addNotes(
    "Do not teach Figma from this slide. They already like Figma and they will find it patronising.\n\n" +
      "Rule 3 is the one worth dwelling on: designing for a real material is what every designer who has ever worked with a factory has had to do, and it is not settling for less.\n\n" +
      "Send them to the step by step page for the actual buttons. It has the pictures.",
  );
}

/* --------------------------------------------------------- 13 three states */
{
  const s = content("Every screen has three states", "Designers almost always draw one");
  const states = [
    ["Empty", "Nothing has been added yet. On the first day your app is real, this is the only state anybody sees.", "FBF0EA"],
    ["Wrong", "Somebody typed something the app will not accept. Most of your teams already have an error label. Nobody has designed it.", "F5EEF6"],
    ["Full", "Somebody used it for a month. Forty rows, long names, a review that is a paragraph.", "EFF2EE"],
  ];
  const { w: cw, x: colX } = grid(3);
  states.forEach(([t, d, fill], i) => {
    const x = colX(i);
    card(s, { x, y: 2.1, w: cw, h: 2.75, fill });
    s.addText(t, {
      x: x + 0.35, y: 2.4, w: cw - 0.7, h: 0.5,
      fontFace: H, fontSize: 26, bold: true, color: MAROON, isTextBox: true, margin: 0,
    });
    s.addText(d, {
      x: x + 0.35, y: 3.0, w: cw - 0.7, h: 1.65,
      fontFace: B, fontSize: 13.5, color: INK, lineSpacing: 19, isTextBox: true, margin: 0,
    });
  });
  body(s, "And use your own real words. Real car names, real prices, the actual sentence from your story. Fake content is always exactly the right length, which hides every problem your layout has.", {
    x: M, y: 5.25, w: CW, h: 0.8, fontSize: 15, color: MUTED,
  });
  s.addNotes(
    "Ask the room which of the three they have drawn. It will be the happy one, every time, and that is not a criticism, it is what everybody does.\n\n" +
      "The lorem ipsum point at the bottom is worth ten seconds. Fake content being the perfect length is why designs fall apart the first time real data goes in.",
  );
}

/* -------------------------------------------------------- 14 section: build */
{
  const s = dark(DEEP);
  s.addShape(pres.ShapeType.ellipse, { x: 10.3, y: 1.5, w: 4.4, h: 4.4, fill: { color: MAROON }, line: { width: 0 } });
  s.addText("03", {
    x: M, y: 2.15, w: 3, h: 1.4,
    fontFace: H, fontSize: 72, bold: true, color: ORANGE, isTextBox: true, margin: 0,
  });
  s.addText("Build it", {
    x: M, y: 3.5, w: 8, h: 0.95,
    fontFace: H, fontSize: 44, bold: true, color: WHITE, isTextBox: true, margin: 0,
  });
  s.addText("Anvil, and three documents that point at each other on purpose.", {
    x: M, y: 4.5, w: 8.2, h: 0.6, fontFace: B, fontSize: 16, color: "E9C9D6", isTextBox: true, margin: 0,
  });
  s.addNotes("This is the section where the class splits hardest by confidence. Say early that looking things up is the job, not a sign of not knowing.");
}

/* -------------------------------------------------------- 15 the three docs */
{
  const s = content("Three documents, and the blanks between them", "Why you have to look things up");
  const docs = [
    ["Your build card", "What the feature is, and what has to be true before it is done.", "Start here. Always."],
    ["Your architecture", "The screens, the exact component names, the tables, and which patterns each feature needs.", "Only this page knows your names."],
    ["The Pattern Book", "The actual code. Shared by every team in every period.", "Every name in it is a blank."],
  ];
  const { w: cw, x: colX } = grid(3);
  docs.forEach(([t, d, tag], i) => {
    const x = colX(i);
    card(s, { x, y: 1.95, w: cw, h: 2.6 });
    numberDot(s, i + 1, x + 0.35, 2.22);
    s.addText(t, {
      x: x + 0.95, y: 2.28, w: cw - 1.3, h: 0.35,
      fontFace: H, fontSize: 18, bold: true, color: MAROON, valign: "middle", isTextBox: true, margin: 0,
    });
    s.addText(d, {
      x: x + 0.35, y: 2.85, w: cw - 0.7, h: 1.0,
      fontFace: B, fontSize: 13, color: INK, lineSpacing: 17, isTextBox: true, margin: 0,
    });
    s.addText(tag, {
      x: x + 0.35, y: 3.95, w: cw - 0.7, h: 0.4,
      fontFace: B, fontSize: 12.5, italic: true, color: ORANGE, isTextBox: true, margin: 0,
    });
  });

  card(s, { x: M, y: 4.75, w: CW, h: 1.3, fill: "F0EBE4" });
  s.addText("app_tables.___table_name___.add_row( ... )", {
    x: M + 0.4, y: 4.75, w: 5.6, h: 1.3,
    fontFace: "Courier New", fontSize: 14, bold: true, color: MAROON,
    valign: "middle", isTextBox: true, margin: 0,
  });
  s.addText("The blank is always a name only your team knows. You cannot copy the code without reading your own architecture, and that is deliberate. Looking something up four times is what makes you stop needing to look it up.", {
    x: M + 6.3, y: 4.75, w: CW - 6.3 - 0.4, h: 1.3,
    fontFace: B, fontSize: 13, color: INK, lineSpacing: 17,
    valign: "middle", isTextBox: true, margin: 0,
  });
  s.addNotes(
    "Be honest about the blanks. Tell them it is on purpose and tell them why: if we handed you finished code you would have a working app and you would not be able to build the next one.\n\n" +
      "The three kinds of stuck are the most useful thing you can drill into them:\n" +
      "1. I do not know what this should do  ->  build card\n" +
      "2. I know what it should do but not how to write it  ->  Pattern Book\n" +
      "3. I know the pattern but not what goes in the blank  ->  architecture\n\n" +
      "Getting them to name which one they are in before they put a hand up will save you half your working sessions.",
  );
}

/* ------------------------------------------------------------- 16 red text */
{
  const s = content("When Anvil shows you red text", "It is not you failing");
  card(s, { x: M, y: 1.95, w: 6.0, h: 3.95 });
  s.addText("First steps in Anvil", {
    x: M + 0.35, y: 2.2, w: 5.3, h: 0.4,
    fontFace: H, fontSize: 19, bold: true, color: MAROON, isTextBox: true, margin: 0,
  });
  s.addText(
    [
      "Where to type it, and what to click.",
      "The difference between a component's name and its text.",
      "Let Anvil write the handler. Do not type it yourself.",
      "One line, then run it. Not twenty lines, then run it.",
      "Anything that touches the database goes in a Server Module.",
    ].join("\n"),
    {
      x: M + 0.35, y: 2.68, w: 5.3, h: 3.1, fontFace: B, fontSize: 15, color: INK,
      bullet: true, paraSpaceAfter: 14, valign: "top", isTextBox: true, margin: 0,
    },
  );

  const right = M + 6.4;
  card(s, { x: right, y: 1.95, w: CW - 6.4, h: 3.95, fill: "FBF0EA" });
  s.addText("The error page", {
    x: right + 0.35, y: 2.2, w: 4.6, h: 0.4,
    fontFace: H, fontSize: 19, bold: true, color: MAROON, isTextBox: true, margin: 0,
  });
  s.addText("Ten errors you will actually hit, each one in plain words with what to check. Including the worst one, which is not an error at all:", {
    x: right + 0.35, y: 2.68, w: 4.7, h: 0.9,
    fontFace: B, fontSize: 13, color: INK, lineSpacing: 17, isTextBox: true, margin: 0,
  });
  s.addShape(pres.ShapeType.roundRect, {
    x: right + 0.35, y: 3.75, w: 4.7, h: 1.9, rectRadius: 0.07,
    fill: { color: WHITE }, line: { width: 0 },
  });
  s.addText("“My button does nothing.”", {
    x: right + 0.55, y: 3.95, w: 4.3, h: 0.35,
    fontFace: B, fontSize: 14, bold: true, color: MAROON, isTextBox: true, margin: 0,
  });
  s.addText("Nine times out of ten the handler is not connected to the button. The page tells you how to check in about fifteen seconds.", {
    x: right + 0.55, y: 4.35, w: 4.3, h: 1.1,
    fontFace: B, fontSize: 12, color: INK, lineSpacing: 16, isTextBox: true, margin: 0,
  });

  body(s, "Everything breaks. Reading an error message is a skill and this is the term you get good at it.", {
    x: M, y: 6.15, w: CW, h: 0.6, fontSize: 15, color: MUTED,
  });
  s.addNotes(
    "Say the bottom line and mean it. The single biggest predictor of whether a beginner keeps going is whether red text feels like information or like failure.\n\n" +
      "Tell them the error page exists before they need it, so that when they do need it they remember it is there.",
  );
}

/* ---------------------------------------------------------------- 17 spark */
{
  const s = content("Spark will help. It will not do it for you.", "And it is different in each place");
  const modes = [
    ["On your story", "Explains the shape, says what is thin, asks the question that unsticks you.", "It will not write your story."],
    ["On your build guide", "Works out which of the three kinds of stuck you are in and names the page and pattern.", "It will not write your code."],
    ["When something is broken", "Paste the red text. It explains what the error means and shows the fix.", "Here it does show code, because nothing you could look up contains your mistake."],
    ["On your design", "Answers straight. Can Anvil do this? Does my design match what my team is building?", "It will not invent a component name."],
  ];
  modes.forEach(([t, d, refusal], i) => {
    const y = 1.9 + i * 1.05;
    card(s, { x: M, y, w: CW, h: 0.92 });
    s.addText(t, {
      x: M + 0.3, y: y + 0.08, w: 2.9, h: 0.76,
      fontFace: B, fontSize: 14, bold: true, color: MAROON, valign: "middle", isTextBox: true, margin: 0,
    });
    s.addText(d, {
      x: M + 3.35, y: y + 0.08, w: 4.5, h: 0.76,
      fontFace: B, fontSize: 12.5, color: INK, lineSpacing: 16, valign: "middle", isTextBox: true, margin: 0,
    });
    s.addText(refusal, {
      x: M + 8.05, y: y + 0.08, w: CW - 8.35, h: 0.76,
      fontFace: B, fontSize: 12.5, italic: true, color: i === 2 ? GREEN : ORANGE, lineSpacing: 16, valign: "middle", isTextBox: true, margin: 0,
    });
  });
  body(s, "Do not spend the period trying to talk it into it. The limits are on purpose, and your teacher can see every question anybody asks.", {
    x: M, y: 6.25, w: CW, h: 0.5, fontSize: 14, color: MUTED,
  });
  s.addNotes(
    "Say the reason, not just the rule: a story Spark wrote is not yours, and you are the one standing up in the design review.\n\n" +
      "The third row is the interesting one. The line is not code or no code, it is whether the answer is already in their documents. An error message is not, so it helps properly.\n\n" +
      "Mention the logging plainly and without threat. It is so you can spot four teams stuck on the same thing at ten past ten, not to catch anybody out.",
  );
}

/* --------------------------------------------------------- 18 classic cars */
{
  const s = content("What finished looks like", "Classic Cars, live on the internet");
  body(s, "Three people, no developer among them. Their four user stories became four working pages, and they run the site themselves.", {
    x: M, y: 1.9, w: 9.0, h: 0.7, fontSize: 16,
  });
  const map = [
    ["Look through cool cars and their stats", "The car list, and a page for each car"],
    ["Read what each part of a car does", "The parts library"],
    ["Pick upgrades and watch the horsepower change", "The builder"],
    ["Take a quiz and find out my score", "The quiz"],
  ];
  s.addText("Their story", {
    x: M + 0.3, y: 2.75, w: 5.4, h: 0.3,
    fontFace: B, fontSize: 12, bold: true, color: MAROON, charSpacing: 1, isTextBox: true, margin: 0,
  });
  s.addText("The page it became", {
    x: M + 6.5, y: 2.75, w: 5.0, h: 0.3,
    fontFace: B, fontSize: 12, bold: true, color: MAROON, charSpacing: 1, isTextBox: true, margin: 0,
  });
  map.forEach(([a, b2], i) => {
    const y = 3.15 + i * 0.66;
    card(s, { x: M, y, w: CW, h: 0.56 });
    s.addText(a, {
      x: M + 0.3, y, w: 5.6, h: 0.56,
      fontFace: B, fontSize: 13, color: INK, valign: "middle", isTextBox: true, margin: 0,
    });
    s.addText("→", {
      x: M + 6.0, y, w: 0.4, h: 0.56,
      fontFace: B, fontSize: 14, color: ORANGE, valign: "middle", align: "center", isTextBox: true, margin: 0,
    });
    s.addText(b2, {
      x: M + 6.5, y, w: CW - 6.8, h: 0.56,
      fontFace: B, fontSize: 13, bold: true, color: MAROON, valign: "middle", isTextBox: true, margin: 0,
    });
  });
  s.addText("They also run the admin: they add the cars, the parts and the questions themselves, and the site changes the moment they save.", {
    x: M, y: 5.9, w: CW, h: 0.5,
    fontFace: B, fontSize: 14, italic: true, color: MUTED, isTextBox: true, margin: 0,
  });
  s.addNotes(
    "Open the site live if you can. It is the most persuasive thing in the deck.\n\n" +
      "The point to make is not that it looks good. It is that every page traces back to a sentence they wrote, and you can put their story next to the page and see it.\n\n" +
      "If time allows, open the admin and add a car in front of them. Watching a public page change because somebody typed in a box is the moment a lot of them get what a website actually is.",
  );
}

/* --------------------------------------------------------------- 19 videos */
{
  const s = content("Watch these when you are stuck", "Ten minutes each, and you can pause them");
  const groups = [
    ["Writing stories", ORANGE, [
      "What Are User Story Acceptance Criteria?",
      "User Stories and Acceptance Criteria EXAMPLE",
    ]],
    ["Figma", MAROON, [
      "Figma for Edu: Prototyping 101  (made by Figma, for schools)",
      "Figma Prototyping in 20 minutes",
      "Learn to Prototype in Figma: Beginners Guide",
    ]],
    ["Anvil", GREEN, [
      "Anvil in 80 Seconds",
      "Simple Calculator with Anvil: Python Web App for Beginners",
      "anvil.works/learn/tutorials  (the official ones, short and accurate)",
    ]],
  ];
  let y = 1.9;
  groups.forEach(([title, colour, items]) => {
    const h = 0.46 + items.length * 0.34;
    card(s, { x: M, y, w: CW, h });
    s.addShape(pres.ShapeType.ellipse, { x: M + 0.3, y: y + 0.22, w: 0.22, h: 0.22, fill: { color: colour }, line: { width: 0 } });
    s.addText(title, {
      x: M + 0.68, y: y + 0.14, w: 3.0, h: 0.36,
      fontFace: H, fontSize: 16, bold: true, color: colour, isTextBox: true, margin: 0,
    });
    items.forEach((it, i) => {
      s.addText(it, {
        x: M + 3.9, y: y + 0.12 + i * 0.34, w: CW - 4.2, h: 0.32,
        fontFace: B, fontSize: 12.5, color: INK, valign: "middle", isTextBox: true, margin: 0,
      });
    });
    y += h + 0.24;
  });
  s.addText("All of these live on one page:  doubleblaze.solutions/build/watch-list.html", {
    x: M, y: 6.6, w: CW, h: 0.34,
    fontFace: B, fontSize: 13, bold: true, color: ORANGE, isTextBox: true, margin: 0,
  });
  s.addText("If a link has gone, search the title, then tell your teacher and we will swap it for a better one.", {
    x: M, y: 6.94, w: CW, h: 0.34,
    fontFace: B, fontSize: 12, italic: true, color: MUTED, isTextBox: true, margin: 0,
  });
  s.addNotes(
    "These are titles rather than raw links so they survive a video being taken down, and so a student on a locked-down Chromebook can still find them.\n\n" +
      "Worth saying: watching a video is for getting the feel of a tool. It is not a substitute for the step by step pages, which are written for your actual project with your actual component names.",
  );
}

/* ----------------------------------------------------------- 20 where it is */
{
  const s = content("Where everything lives", "One address to remember");
  s.addText("doubleblaze.solutions/trail-crew", {
    x: M, y: 1.85, w: CW, h: 0.6,
    fontFace: H, fontSize: 30, bold: true, color: ORANGE, isTextBox: true, margin: 0,
  });
  s.addText("Every team, every prototype, and a link to everything below.", {
    x: M, y: 2.45, w: CW, h: 0.4,
    fontFace: B, fontSize: 14, color: MUTED, isTextBox: true, margin: 0,
  });

  const left = [
    ["Write a user story", "/trail-crew/write"],
    ["How a story works", "/build/writing-a-story.html"],
    ["How to build your app", "/build/instructions.html"],
    ["Designing for Anvil", "/build/figma.html"],
  ];
  const right = [
    ["Figma step by step", "/build/prototype-steps.html"],
    ["The Pattern Book", "/build/patterns.html"],
    ["First steps, and red text", "/build/first-steps.html"],
    ["Things to watch", "/build/watch-list.html"],
  ];
  const two = grid(2, 0.4);
  [left, right].forEach((col, ci) => {
    const x = two.x(ci);
    col.forEach(([label, url], i) => {
      const y = 3.05 + i * 0.72;
      card(s, { x, y, w: two.w, h: 0.6 });
      s.addText(label, {
        x: x + 0.28, y, w: 2.9, h: 0.6,
        fontFace: B, fontSize: 13, bold: true, color: INK, valign: "middle", isTextBox: true, margin: 0,
      });
      s.addText(url, {
        x: x + 3.25, y, w: two.w - 3.5, h: 0.6,
        fontFace: "Courier New", fontSize: 10.5, color: MAROON, valign: "middle", isTextBox: true, margin: 0,
      });
    });
  });
  s.addText("Your own team's pages, including your test plan and your design brief, are on your card in the gallery.", {
    x: M, y: 6.1, w: CW, h: 0.4,
    fontFace: B, fontSize: 13, italic: true, color: MUTED, isTextBox: true, margin: 0,
  });
  s.addNotes(
    "Put this one up while they get laptops out and leave it there.\n\n" +
      "Only one address needs remembering. Everything else is a link off the gallery, which is the point of having a gallery.",
  );
}

/* ----------------------------------------------------------- 21 this week */
{
  const s = dark(MAROON);
  s.addShape(pres.ShapeType.ellipse, { x: 10.6, y: 4.4, w: 4.0, h: 4.0, fill: { color: DEEP }, line: { width: 0 } });
  s.addText("Before you build anything", {
    x: M, y: 0.85, w: CW, h: 0.7,
    fontFace: H, fontSize: 34, bold: true, color: WHITE, isTextBox: true, margin: 0,
  });
  const todo = [
    ["Read your test plan", "It is already there, on your team's card. Find the criteria that produced no test. Those are yours to rewrite."],
    ["Write one new story", "In the studio. Watch the test plan while you type. Send it when it is not embarrassing."],
    ["Bring it to the review", "We go through them as a team. Come able to say why your feature is worth building."],
  ];
  todo.forEach(([t, d], i) => {
    const y = 1.95 + i * 1.35;
    s.addShape(pres.ShapeType.roundRect, {
      x: M, y, w: 9.6, h: 1.15, rectRadius: 0.1,
      fill: { color: DEEP }, line: { color: "7A2049", width: 1 },
    });
    numberDot(s, i + 1, M + 0.35, y + 0.35, { size: 0.44 });
    s.addText(t, {
      x: M + 1.0, y: y + 0.18, w: 8.3, h: 0.34,
      fontFace: B, fontSize: 16, bold: true, color: WHITE, isTextBox: true, margin: 0,
    });
    s.addText(d, {
      x: M + 1.0, y: y + 0.55, w: 8.3, h: 0.5,
      fontFace: B, fontSize: 13, color: "E9C9D6", lineSpacing: 17, isTextBox: true, margin: 0,
    });
  });
  s.addText("A story is a promise your team makes to itself about what you are building.", {
    x: M, y: 6.25, w: 9.8, h: 0.5,
    fontFace: H, fontSize: 17, italic: true, color: "F0D8E2", isTextBox: true, margin: 0,
  });
  s.addNotes(
    "End on the three actions and put the deck away. Do not add a fourth.\n\n" +
      "The closing line is worth saying slowly. If two people on a team read the same story differently, they have just found the argument they would otherwise have had in three weeks with half the app built wrong.\n\n" +
      "Then hand out laptops. The first working session should start with reading their own test plan, not with writing anything.",
  );
}

pres.writeFile({ fileName: "Trail-Crew-First-Day-Back.pptx" }).then((f) => console.log("wrote", f));
