/**
 * Launch Pad: start a plan for anything.
 *
 * A one day deck for sixth graders, not tied to any other unit. Three ideas
 * only: purpose is impact, there is always more than one user, and a user
 * story says who, what and why. About fifteen minutes of slides, then teams
 * work at /trail-crew/launch. Speaker notes on every slide.
 *
 * The running example, Finders Keepers, is the same one built as a prototype
 * in docs/launch/example-finders-keepers, so the last slide can show it.
 * No em dashes anywhere in this deck.
 *
 *   cd docs/presentations
 *   npm install pptxgenjs      # once
 *   node launch-pad.js
 */
const pptxgen = require("pptxgenjs");

const MAROON = "630031";
const ORANGE = "CF4420";
const DEEP = "4A0025";
const STONE = "F6F4F1";
const WHITE = "FFFFFF";
const INK = "1C1A19";
const MUTED = "75787B";
const GREEN = "2E6B4A";
const PINK = "E9C9D6";

const H = "Cambria";
const B = "Calibri";

const URL = "doubleblaze.solutions/trail-crew/launch";

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.333 x 7.5
pres.author = "Double Blaze";
pres.title = "Launch Pad: start a plan for anything";

const W = 13.333;
const M = 0.7;
const CW = W - M * 2;

/* ---------------------------------------------------------------- helpers */

function content(title, kicker) {
  const s = pres.addSlide();
  s.background = { color: STONE };
  if (kicker) {
    s.addText(kicker.toUpperCase(), {
      x: M, y: 0.42, w: CW, h: 0.28,
      fontFace: B, fontSize: 12, bold: true, color: ORANGE, charSpacing: 2, isTextBox: true, margin: 0,
    });
  }
  s.addText(title, {
    x: M, y: kicker ? 0.72 : 0.55, w: CW, h: 0.85,
    fontFace: H, fontSize: 34, bold: true, color: MAROON, isTextBox: true, margin: 0, valign: "top",
  });
  return s;
}

function dark(color = MAROON) {
  const s = pres.addSlide();
  s.background = { color };
  return s;
}

function card(s, { x, y, w, h, fill = WHITE }) {
  s.addShape(pres.ShapeType.roundRect, {
    x, y, w, h, rectRadius: 0.09,
    fill: { color: fill },
    line: { color: "E4DED6", width: 1 },
    shadow: { type: "outer", angle: 90, blur: 8, offset: 1, opacity: 0.08, color: "000000" },
  });
}

function numberDot(s, n, x, y, { size = 0.46, fill = ORANGE, color = WHITE, fontSize = 15 } = {}) {
  s.addShape(pres.ShapeType.ellipse, { x, y, w: size, h: size, fill: { color: fill }, line: { width: 0 } });
  s.addText(String(n), {
    x, y, w: size, h: size,
    fontFace: B, fontSize, bold: true, color, align: "center", valign: "middle", isTextBox: true, margin: 0,
  });
}

function grid(n, gap = 0.36) {
  const w = (CW - gap * (n - 1)) / n;
  return { w, gap, x: (i) => M + i * (w + gap) };
}

function body(s, text, opts) {
  s.addText(text, {
    fontFace: B, fontSize: 15, color: INK, lineSpacing: 22, isTextBox: true, margin: 0, valign: "top", ...opts,
  });
}

/** A section divider: the big number, the idea, the one line to remember. */
function divider(n, title, line, notes) {
  const s = dark(MAROON);
  s.addShape(pres.ShapeType.ellipse, { x: 9.9, y: 1.2, w: 5.2, h: 5.2, fill: { color: DEEP }, line: { width: 0 } });
  s.addText(String(n), {
    x: 9.9, y: 1.2, w: 5.2, h: 5.2,
    fontFace: H, fontSize: 200, bold: true, color: ORANGE, align: "center", valign: "middle", isTextBox: true, margin: 0,
  });
  s.addText(`STEP ${n} OF 3`, {
    x: M, y: 2.3, w: 8, h: 0.34, fontFace: B, fontSize: 13, bold: true, color: PINK, charSpacing: 3, isTextBox: true, margin: 0,
  });
  s.addText(title, {
    x: M, y: 2.7, w: 8.8, h: 1.1, fontFace: H, fontSize: 54, bold: true, color: WHITE, isTextBox: true, margin: 0,
  });
  s.addText(line, {
    x: M, y: 3.95, w: 8.6, h: 1.2, fontFace: B, fontSize: 24, color: "F3E3EA", lineSpacing: 32, isTextBox: true, margin: 0,
  });
  s.addNotes(notes);
  return s;
}

/* ------------------------------------------------------------------ 1 title */
{
  const s = dark(MAROON);
  s.addShape(pres.ShapeType.ellipse, { x: 9.6, y: -1.5, w: 6.2, h: 6.2, fill: { color: DEEP }, line: { width: 0 } });
  s.addShape(pres.ShapeType.ellipse, { x: 11.4, y: 4.3, w: 3.4, h: 3.4, fill: { color: ORANGE }, line: { width: 0 }, transparency: 70 });
  s.addText("LAUNCH PAD  ·  ONE DAY", {
    x: M, y: 1.9, w: 8.4, h: 0.34, fontFace: B, fontSize: 13, bold: true, color: PINK, charSpacing: 3, isTextBox: true, margin: 0,
  });
  s.addText("Every great thing\nstarts with a plan.", {
    x: M, y: 2.32, w: 8.8, h: 2.1, fontFace: H, fontSize: 50, bold: true, color: WHITE, lineSpacing: 56, isTextBox: true, margin: 0,
  });
  s.addText(
    "Today you will do the three things a real product team does before anybody builds anything. And then you will get to see your idea come to life.",
    { x: M, y: 4.65, w: 8.2, h: 1.1, fontFace: B, fontSize: 17, color: "EBD9E1", lineSpacing: 25, isTextBox: true, margin: 0 },
  );
  s.addNotes(
    "Open here. This is a fresh start after a choppy week, and it is a one day thing: nothing to catch up on, nothing they needed to have done before.\n\n" +
      "Say: today you are going to work the way people who make apps, games, and programs actually work. Not the coding part. The part before that, which decides whether the coding is worth doing.\n\n" +
      "Tease the ending: what you write today, I am going to turn into something you can click on.",
  );
}

/* ------------------------------------------------------- 2 somebody planned it */
{
  const s = content("Somebody planned all of this", "Before anything gets built");
  const things = [
    ["A game you play", "Somebody decided who it was for and what would make it fun to come back to."],
    ["Your bus route", "Somebody decided which stops, which times, and who gets picked up first."],
    ["The lunch line", "Somebody decided how hundreds of kids get fed in thirty minutes."],
    ["Blacksburg Transit", "Somebody decided where the buses go so people can get to work and class."],
  ];
  const { w: cw, x: colX } = grid(4, 0.32);
  things.forEach(([title, text], i) => {
    const x = colX(i);
    card(s, { x, y: 2.05, w: cw, h: 2.75 });
    s.addText(title, { x: x + 0.3, y: 2.3, w: cw - 0.6, h: 0.5, fontFace: H, fontSize: 20, bold: true, color: MAROON, isTextBox: true, margin: 0 });
    s.addText(text, { x: x + 0.3, y: 2.9, w: cw - 0.6, h: 1.7, fontFace: B, fontSize: 15, color: INK, lineSpacing: 21, isTextBox: true, margin: 0 });
  });
  body(s, "Before a single line of code or a single board was cut, someone answered three questions. Today, you answer them.", {
    x: M, y: 5.3, w: CW, h: 0.8, fontSize: 19, color: INK, bold: true,
  });
  s.addNotes(
    "Quick, conversational. Ask: what is an app or game you used this week? Take two answers.\n\n" +
      "Then: somebody sat down and planned that before it existed. The people who do that are called product managers or program managers, and it is a real job.\n\n" +
      "Point out that it is not only apps. A bus route and a lunch line are programs too. Anything that serves people can be planned this way.",
  );
}

/* --------------------------------------------------------- 3 three questions */
{
  const s = content("Three questions", "Today's plan");
  const qs = [
    ["1", "Why should it exist?", "Purpose", "Not what it does. The change it makes."],
    ["2", "Who is it for?", "Users", "There is always more than one."],
    ["3", "What do they need to do?", "User stories", "Who, what, and why, in one sentence."],
  ];
  const { w: cw, x: colX } = grid(3);
  qs.forEach(([n, q, label, line], i) => {
    const x = colX(i);
    card(s, { x, y: 2.0, w: cw, h: 3.0 });
    numberDot(s, n, x + 0.35, 2.3, { size: 0.6, fontSize: 20 });
    s.addText(label.toUpperCase(), { x: x + 1.1, y: 2.42, w: cw - 1.4, h: 0.36, fontFace: B, fontSize: 13, bold: true, color: ORANGE, charSpacing: 2, isTextBox: true, margin: 0 });
    s.addText(q, { x: x + 0.35, y: 3.1, w: cw - 0.7, h: 0.9, fontFace: H, fontSize: 24, bold: true, color: MAROON, isTextBox: true, margin: 0 });
    s.addText(line, { x: x + 0.35, y: 4.05, w: cw - 0.7, h: 0.8, fontFace: B, fontSize: 15, color: INK, lineSpacing: 21, isTextBox: true, margin: 0 });
  });
  card(s, { x: M, y: 5.4, w: CW, h: 1.05, fill: "FBEDE8" });
  s.addText([
    { text: "Then: ", options: { bold: true, color: ORANGE } },
    { text: "your team picks something that would make a difference in our community, and plans it. I will build a prototype of it from exactly what you write.", options: { color: INK } },
  ], { x: M + 0.35, y: 5.5, w: CW - 0.7, h: 0.85, fontFace: B, fontSize: 16, valign: "middle", isTextBox: true, margin: 0 });
  s.addNotes(
    "This is the whole day on one slide. Leave it up for a moment.\n\n" +
      "Say: we are only doing three things today, and we are doing them properly. There are lots more steps in a real plan, and we are not doing those today.\n\n" +
      "The bottom box is the hook. Make the promise clearly: what you write is what I build from. If your writing is clear, your prototype will be clear. That is the reason to take the next 15 minutes seriously.",
  );
}

/* ---------------------------------------------------------- 4 purpose divider */
divider(1, "Purpose", "Not what it does.\nThe change it makes.",
  "Say the line twice, slowly. This is the most important idea of the day and the one they will get wrong first.\n\n" +
    "Almost everyone, adults included, answers 'what is the purpose' with a description of the features. We are going to practice the difference.");

/* ----------------------------------------------------------- 5 does vs impact */
{
  const s = content("What it does vs. the impact it has", "Purpose");
  const half = (CW - 0.4) / 2;
  card(s, { x: M, y: 1.95, w: half, h: 3.4 });
  card(s, { x: M + half + 0.4, y: 1.95, w: half, h: 3.4, fill: "EAF4EE" });
  s.addText("WHAT IT DOES", { x: M + 0.4, y: 2.2, w: half - 0.8, h: 0.35, fontFace: B, fontSize: 14, bold: true, color: MUTED, charSpacing: 2, isTextBox: true, margin: 0 });
  s.addText("“An app that shows photos of everything in the lost and found.”", {
    x: M + 0.4, y: 2.7, w: half - 0.8, h: 1.5, fontFace: H, fontSize: 24, color: "5A5F63", lineSpacing: 32, isTextBox: true, margin: 0,
  });
  s.addText("True, but so what?", { x: M + 0.4, y: 4.5, w: half - 0.8, h: 0.5, fontFace: B, fontSize: 16, italic: true, color: MUTED, isTextBox: true, margin: 0 });

  const rx = M + half + 0.8;
  s.addText("THE IMPACT IT HAS", { x: rx, y: 2.2, w: half - 0.8, h: 0.35, fontFace: B, fontSize: 14, bold: true, color: GREEN, charSpacing: 2, isTextBox: true, margin: 0 });
  s.addText("“Kids get their stuff back before it is donated, and families stop buying the same jacket twice.”", {
    x: rx, y: 2.7, w: half - 0.8, h: 1.7, fontFace: H, fontSize: 24, bold: true, color: INK, lineSpacing: 32, isTextBox: true, margin: 0,
  });
  s.addText("Now I care.", { x: rx, y: 4.5, w: half - 0.8, h: 0.5, fontFace: B, fontSize: 16, italic: true, color: GREEN, isTextBox: true, margin: 0 });

  body(s, "The impact names who is better off, and how. It is the reason anyone would build the thing, use it, or pay for it.", {
    x: M, y: 5.7, w: CW, h: 0.8, fontSize: 18,
  });
  s.addNotes(
    "Our example for the whole day is Finders Keepers, a lost and found app for our school. You will see it again in every section.\n\n" +
      "Read the left side. Ask: is that true? Yes. Does it make you want to build it? Not really.\n\n" +
      "Read the right side. Ask: who is better off? (Kids, families.) How? (Get stuff back, save money.)\n\n" +
      "Notice the right side never mentions photos or an app at all. The purpose could be met a dozen ways; the app is just our idea for how.",
  );
}

/* ------------------------------------------------------------ 6 quick check */
{
  const s = content("Quick check: does, or impact?", "Thumbs up for impact, sideways for does");
  const items = [
    ["A", "A website with every park in Blacksburg on a map."],
    ["B", "Families who just moved here find places to play and meet neighbors in their first week."],
    ["C", "An app that shows the cafeteria menu."],
    ["D", "Fewer kids skip lunch, because they know what is being served before they get in line."],
  ];
  items.forEach(([n, text], i) => {
    const y = 1.95 + i * 1.05;
    card(s, { x: M, y, w: CW, h: 0.85 });
    numberDot(s, n, M + 0.25, y + 0.19, { fill: MAROON });
    s.addText(text, { x: M + 1.0, y, w: CW - 1.3, h: 0.85, fontFace: B, fontSize: 19, color: INK, valign: "middle", isTextBox: true, margin: 0 });
  });
  body(s, "Notice: A and B could be the same product. So could C and D. The purpose is what makes it worth building.", {
    x: M, y: 6.25, w: CW, h: 0.6, fontSize: 16, color: MUTED,
  });
  s.addNotes(
    "Read each one and have them vote with thumbs. Answers: A does, B impact, C does, D impact.\n\n" +
      "After D, ask: how did you know? Listen for 'it says who is better off' or 'it says what changes'. That is the test.\n\n" +
      "Point at the bottom line: the park map and the welcome-new-families idea could be the exact same website. Only one of those sentences makes somebody want to fund it.\n\n" +
      "If you have a minute: ask someone to turn C into an impact out loud.",
  );
}

/* --------------------------------------------------------- 7 purpose starter */
{
  const s = content("A sentence starter for your purpose", "Purpose");
  card(s, { x: M, y: 2.0, w: CW, h: 1.5, fill: WHITE });
  s.addText([
    { text: "________", options: { color: ORANGE, bold: true } },
    { text: " have a problem: ", options: { color: INK } },
    { text: "________", options: { color: ORANGE, bold: true } },
    { text: ".  Because of ", options: { color: INK } },
    { text: "[our idea]", options: { color: MAROON, bold: true } },
    { text: ", ", options: { color: INK } },
    { text: "________", options: { color: ORANGE, bold: true } },
    { text: ".", options: { color: INK } },
  ], { x: M + 0.4, y: 2.0, w: CW - 0.8, h: 1.5, fontFace: H, fontSize: 28, valign: "middle", isTextBox: true, margin: 0 });

  s.addText("FILLED IN", { x: M, y: 3.9, w: CW, h: 0.35, fontFace: B, fontSize: 13, bold: true, color: GREEN, charSpacing: 2, isTextBox: true, margin: 0 });
  body(s,
    "Students at our school have a problem: they lose jackets, water bottles and headphones every week, and most of it gets donated before anyone finds it. Because of Finders Keepers, kids get their things back and families stop buying the same jacket twice.",
    { x: M, y: 4.3, w: CW, h: 1.4, fontSize: 19, lineSpacing: 28 },
  );
  body(s, "You do not have to use the starter. It is there for when you are stuck.", { x: M, y: 6.1, w: CW, h: 0.5, fontSize: 15, color: MUTED });
  s.addNotes(
    "The Launch Pad page has a button that drops this starter into the purpose box, so they do not need to copy it down.\n\n" +
      "Point out the three blanks: who, what is wrong, and what changes. The last blank is the impact, and it is the one they will want to rush.\n\n" +
      "The page also checks their purpose: if it starts like 'It is an app that...' and never says what changes, it asks them for the impact. That is on purpose.",
  );
}

/* ----------------------------------------------------------- 8 users divider */
divider(2, "Users", "There is always\nmore than one.",
  "Say: every product has more than one kind of person who uses it or is affected by it. Always. If you only have one, you have not looked hard enough yet.\n\n" +
    "And the different users usually want different things. Noticing that is a big part of the job.");

/* ------------------------------------------------------------ 9 example users */
{
  const s = content("Who uses Finders Keepers?", "Users");
  const users = [
    ["Students", "They want their stuff back fast, without digging through a giant pile in front of everybody."],
    ["Front office staff", "They want the pile gone, and fewer interruptions at the desk."],
    ["Parents", "They do not want to pay for the same thing twice."],
    ["Custodians", "They find most of the lost things, and want a quick place to drop them off."],
  ];
  const { w: cw, x: colX } = grid(2, 0.4);
  users.forEach(([name, text], i) => {
    const x = colX(i % 2);
    const y = 1.95 + Math.floor(i / 2) * 1.85;
    card(s, { x, y, w: cw, h: 1.6 });
    s.addText(name, { x: x + 0.35, y: y + 0.2, w: cw - 0.7, h: 0.45, fontFace: H, fontSize: 22, bold: true, color: MAROON, isTextBox: true, margin: 0 });
    s.addText(text, { x: x + 0.35, y: y + 0.7, w: cw - 0.7, h: 0.8, fontFace: B, fontSize: 16, color: INK, lineSpacing: 22, isTextBox: true, margin: 0 });
  });
  body(s, "One sentence each: what matters to them. Notice that they do not all want the same thing.", {
    x: M, y: 5.85, w: CW, h: 0.6, fontSize: 18, bold: true,
  });
  s.addNotes(
    "Ask before you reveal much: if you only thought of 'students', who did you miss?\n\n" +
      "Custodians are the great one. They never open the app to find anything, but they are the ones who find most of the lost stuff. Leave them out and the app is empty.\n\n" +
      "Point at the difference: students care about speed and not being embarrassed. The office cares about the pile. Parents care about money. Same product, different reasons. Their stories will be different too.",
  );
}

/* --------------------------------------------------------- 10 forgotten users */
{
  const s = content("Finding the users you forgot", "Users");
  const qs = [
    ["Who uses it every day?", "Usually the easy one. Students."],
    ["Who runs it, fixes it, or keeps it up to date?", "The office staff who post the photos."],
    ["Who pays for it or has to say yes to it?", "Parents, the principal, the town."],
    ["Who is affected, even if they never open it?", "Custodians, neighbors, the people next in line."],
  ];
  qs.forEach(([q, a], i) => {
    const y = 1.95 + i * 1.08;
    numberDot(s, i + 1, M, y + 0.12, { size: 0.56, fontSize: 18 });
    s.addText(q, { x: M + 0.85, y, w: 7.2, h: 0.8, fontFace: H, fontSize: 22, bold: true, color: MAROON, valign: "middle", isTextBox: true, margin: 0 });
    s.addText(a, { x: M + 8.2, y, w: CW - 8.2, h: 0.8, fontFace: B, fontSize: 16, italic: true, color: MUTED, valign: "middle", isTextBox: true, margin: 0 });
  });
  body(s, "The ones people forget are almost always adults.", { x: M, y: 6.3, w: CW, h: 0.5, fontSize: 18, bold: true, color: ORANGE });
  s.addNotes(
    "These four questions are printed on the Launch Pad page beside the users box, so teams can use them while they work.\n\n" +
      "The page will also nudge a team whose users are all kids: 'Is there an adult who runs it, pays for it, or says yes to it?'\n\n" +
      "Quick practice if there is time: think of the school bus. Who are all the users? (Students, drivers, parents, the transportation office, other drivers on the road.)",
  );
}

/* ---------------------------------------------------------- 11 story divider */
divider(3, "User stories", "Who wants it, what they want,\nand why it matters to them.",
  "Say: a user story is one sentence that describes one feature, from one user's point of view.\n\n" +
    "Real software teams write hundreds of these. Every feature in every app you use started as one.");

/* ---------------------------------------------------------- 12 the template */
{
  const s = content("One sentence, three parts", "User stories");
  const parts = [
    ["As a", "student", "WHO", "Keeps you thinking about a real person, not “the user”."],
    ["I want to", "look through photos of everything turned in this week", "WHAT", "This part becomes the feature, the button, the screen."],
    ["so I can", "find my jacket before it gets donated", "WHY", "Proves it is worth building. The most important part."],
  ];
  parts.forEach(([lead, fill, tag, why], i) => {
    const y = 1.95 + i * 1.35;
    card(s, { x: M, y, w: CW, h: 1.15 });
    s.addText(tag, { x: M + 0.3, y: y + 0.12, w: 1.0, h: 0.3, fontFace: B, fontSize: 12, bold: true, color: ORANGE, charSpacing: 2, isTextBox: true, margin: 0 });
    s.addText([
      { text: lead + " ", options: { bold: true, color: MAROON } },
      { text: fill, options: { color: INK } },
    ], { x: M + 0.3, y: y + 0.42, w: 7.4, h: 0.6, fontFace: H, fontSize: 21, valign: "top", isTextBox: true, margin: 0 });
    s.addText(why, { x: M + 7.9, y: y + 0.1, w: CW - 8.2, h: 0.95, fontFace: B, fontSize: 15, color: "5A5F63", lineSpacing: 20, valign: "middle", isTextBox: true, margin: 0 });
  });
  body(s, "If you cannot finish the “so I can”, you might not have a feature yet.", { x: M, y: 6.1, w: CW, h: 0.5, fontSize: 18, bold: true, color: ORANGE });
  s.addNotes(
    "Spend real time here. This is the format they will type into: three boxes labeled As a, I want to, so I can.\n\n" +
      "Why it is written this way:\n" +
      "- WHO: the 'As a' should be one of the users from step 2. It forces you to picture a real person.\n" +
      "- WHAT: the 'I want to' is what the product does. In the prototype, this becomes the screen.\n" +
      "- WHY: the 'so I can' is the user's reason. It connects the feature back to the purpose. If you cannot fill it in, the feature might not matter.\n\n" +
      "Point out the 'why' sounds a lot like the purpose. That is not an accident: good stories add up to the purpose.",
  );
}

/* ------------------------------------------------------- 13 weak vs strong */
{
  const s = content("Weak story, strong story", "User stories");
  const pairs = [
    ["As a user, I want a search bar.", "As a student, I want to look through photos of everything turned in this week, so I can find my jacket before it gets donated.", "Which user? Why do they care?"],
    ["As a parent, I want the app to be good, so I can use it.", "As a parent, I want to get a message when something with my kid’s name on it is turned in, so I can stop buying replacements.", "“Good” is not something you can build."],
  ];
  pairs.forEach(([weak, strong, note], i) => {
    const y = 1.95 + i * 2.2;
    const lw = 4.4;
    card(s, { x: M, y, w: lw, h: 1.95 });
    card(s, { x: M + lw + 0.35, y, w: CW - lw - 0.35, h: 1.95, fill: "EAF4EE" });
    s.addText("WEAK", { x: M + 0.3, y: y + 0.15, w: 2, h: 0.3, fontFace: B, fontSize: 12, bold: true, color: MUTED, charSpacing: 2, isTextBox: true, margin: 0 });
    s.addText(weak, { x: M + 0.3, y: y + 0.45, w: lw - 0.6, h: 0.85, fontFace: H, fontSize: 18, color: "5A5F63", isTextBox: true, margin: 0 });
    s.addText(note, { x: M + 0.3, y: y + 1.35, w: lw - 0.6, h: 0.45, fontFace: B, fontSize: 14, italic: true, color: ORANGE, isTextBox: true, margin: 0 });
    const sx = M + lw + 0.65;
    s.addText("STRONG", { x: sx, y: y + 0.15, w: 2, h: 0.3, fontFace: B, fontSize: 12, bold: true, color: GREEN, charSpacing: 2, isTextBox: true, margin: 0 });
    s.addText(strong, { x: sx, y: y + 0.45, w: CW - lw - 0.95, h: 1.4, fontFace: H, fontSize: 18, color: INK, lineSpacing: 25, isTextBox: true, margin: 0 });
  });
  s.addNotes(
    "Read the weak one first and ask: what is wrong with it? Let them find it before you read the orange note.\n\n" +
      "First pair: 'a user' could be anyone, and a search bar is a solution, not a need. The strong one names who, says what they actually want to do, and why.\n\n" +
      "Second pair: 'good' and 'use it' say nothing. The strong one is specific enough that you could draw the screen.\n\n" +
      "Tip to give teams: try to write each story for a different user from step 2.",
  );
}

/* ------------------------------------------------- 14 acceptance criteria */
{
  const s = content("Bonus: how would we know it works?", "Acceptance criteria");
  body(s, "Teams that finish three stories can add checks under a story. Each one is something you could test, and the answer is yes or no.", {
    x: M, y: 1.75, w: CW, h: 0.8, fontSize: 18,
  });
  card(s, { x: M, y: 2.75, w: CW, h: 3.1 });
  s.addText("As a student, I want to look through photos of everything turned in this week, so I can find my jacket before it gets donated.", {
    x: M + 0.4, y: 2.95, w: CW - 0.8, h: 0.9, fontFace: H, fontSize: 19, italic: true, color: MAROON, isTextBox: true, margin: 0,
  });
  const checks = ["Every item has a photo", "The newest items show first", "I can tell where to go to pick it up"];
  checks.forEach((c, i) => {
    const y = 4.0 + i * 0.58;
    s.addText("✓", { x: M + 0.5, y, w: 0.4, h: 0.45, fontFace: B, fontSize: 20, bold: true, color: GREEN, isTextBox: true, margin: 0 });
    s.addText(c, { x: M + 1.0, y, w: CW - 1.5, h: 0.45, fontFace: B, fontSize: 19, color: INK, isTextBox: true, margin: 0 });
  });
  body(s, "“It looks cool” is not a check. “The newest items show first” is.", { x: M, y: 6.15, w: CW, h: 0.5, fontSize: 16, color: MUTED });
  s.addNotes(
    "This is a stretch goal. Do not let it eat the time for the three stories. On the page it is hidden behind a 'Bonus' link under each story.\n\n" +
      "The idea: acceptance criteria are how a team agrees the feature is done. If you could not check it with a yes or no, it is not a criterion yet.\n\n" +
      "Bonus for you: stories with checks make better prototypes, because each check gives the prototype something to show.",
  );
}

/* ------------------------------------------------------------- 15 your turn */
{
  const s = dark(INK);
  s.addText("YOUR TURN  ·  ABOUT 25 MINUTES", { x: M, y: 0.6, w: CW, h: 0.34, fontFace: B, fontSize: 13, bold: true, color: ORANGE, charSpacing: 3, isTextBox: true, margin: 0 });
  s.addText("Plan something that would make our community better", { x: M, y: 0.98, w: CW, h: 0.9, fontFace: H, fontSize: 34, bold: true, color: WHITE, isTextBox: true, margin: 0 });
  const steps = [
    ["Team up", "3 or 4 people. Pick a team name, not a real name. One Chromebook types."],
    ["Your idea", "An app, product, or program for our school, Blacksburg, a team, or a club."],
    ["Purpose", "Who is better off, and how? The impact, not what it does."],
    ["Users", "At least two. One sentence each on what matters to them."],
    ["User stories", "At least three. As a ___, I want to ___, so I can ___."],
  ];
  steps.forEach(([title, text], i) => {
    const y = 2.1 + i * 0.78;
    numberDot(s, i + 1, M, y + 0.06, { size: 0.5, fontSize: 16 });
    s.addText(title, { x: M + 0.75, y, w: 2.4, h: 0.62, fontFace: B, fontSize: 19, bold: true, color: WHITE, valign: "middle", isTextBox: true, margin: 0 });
    s.addText(text, { x: M + 3.15, y, w: CW - 3.15, h: 0.62, fontFace: B, fontSize: 17, color: "D9D6D2", valign: "middle", isTextBox: true, margin: 0 });
  });
  s.addShape(pres.ShapeType.roundRect, { x: M, y: 6.1, w: CW, h: 0.85, rectRadius: 0.09, fill: { color: ORANGE }, line: { width: 0 } });
  s.addText([
    { text: "Open:  ", options: { bold: true } },
    { text: URL, options: { bold: true, fontFace: "Consolas" } },
  ], { x: M + 0.35, y: 6.1, w: CW - 0.7, h: 0.85, fontFace: B, fontSize: 22, color: WHITE, valign: "middle", isTextBox: true, margin: 0 });
  s.addNotes(
    "Leave this slide up the whole work time.\n\n" +
      "Teams: everyone on a team types the same period and team name to open the same plan. One person types; teammates can open it on their own Chromebook and press Refresh to read along. It saves by itself.\n\n" +
      "Walk the room with three questions:\n" +
      "1. Read me your purpose. Who is better off? (If they describe features, ask 'so what changes?')\n" +
      "2. Who else uses this? Any adults?\n" +
      "3. Read me a story. What is the 'so I can'?\n\n" +
      "Teams stuck on an idea: the 'Your idea' tab has five prompts (what annoys you every week, what does a new kid not know, and so on).\n\n" +
      "Finished early: more stories, a different user for each, then the bonus acceptance criteria. The 'Read it out loud' tab shows the whole plan and what is still missing.",
  );
}

/* ---------------------------------------------------------------- 16 Monday */
{
  const s = dark(MAROON);
  s.addShape(pres.ShapeType.ellipse, { x: 9.6, y: 2.6, w: 6.2, h: 6.2, fill: { color: DEEP }, line: { width: 0 } });
  s.addText("WHAT HAPPENS NEXT", { x: M, y: 1.0, w: 8.4, h: 0.34, fontFace: B, fontSize: 13, bold: true, color: PINK, charSpacing: 3, isTextBox: true, margin: 0 });
  s.addText("Your idea,\nclickable.", { x: M, y: 1.45, w: 8.6, h: 2.0, fontFace: H, fontSize: 54, bold: true, color: WHITE, lineSpacing: 60, isTextBox: true, margin: 0 });
  body(s,
    "Over the weekend, your plan becomes a prototype you can click through. Every screen will come from something your team wrote today. The clearer you wrote it, the better it will be.",
    { x: M, y: 3.7, w: 8.2, h: 1.3, fontSize: 19, color: "F3E3EA", lineSpacing: 27 },
  );
  s.addText("Before you go: two teams, read us your purpose. Who is better off, and how?", {
    x: M, y: 5.45, w: 8.6, h: 0.9, fontFace: B, fontSize: 19, bold: true, color: WHITE, isTextBox: true, margin: 0,
  });
  s.addNotes(
    "Last five minutes. Ask two or three teams to read their purpose out loud. After each, ask the class: is that a 'does' or an 'impact'?\n\n" +
      "If you want to show what Monday looks like, open the Finders Keepers example prototype: the link is under 'Find your team' on the Launch Pad page. It was built from the exact purpose, users, and stories on these slides.\n\n" +
      "Over the weekend: npm run launch:export, touch up the files in docs/launch, then npm run launch:prototypes. See docs/launch/README.md.",
  );
}

pres.writeFile({ fileName: __dirname + "/Launch-Pad.pptx" }).then((f) => console.log("wrote", f));
