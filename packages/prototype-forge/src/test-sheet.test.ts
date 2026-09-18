/**
 * The test sheet is made from a team's cards, so the checks are that the
 * team's own words are on it: every card heading, every Done when line as a
 * box, and the honest line when a card has no finish line at all.
 */

import { strict as assert } from "node:assert";
import { test } from "node:test";

import { parseCards } from "./cards";
import { renderTestSheet } from "./test-sheet";

const CARDS = `# Bus Buddy: build cards

## Card 1: Find my bus

**Your story.** As a student, I want to see when my bus is coming, so that I stop waiting in the rain.

**Done when:**
- [ ] The next bus time shows on the home screen
- [ ] It updates without refreshing

**Build it:** Architecture, Feature 1.

---

## Card 2: Set my stop

**Your story.** As a student, I want to pick my stop once, so that the app remembers it.

**Done when:**

**Build it:** Architecture, Feature 2.
`;

test("every card and every Done when line is on the sheet as a box", () => {
  const sheet = renderTestSheet(parseCards(CARDS), { productName: "Bus Buddy", teamName: "Period 1" });
  assert.match(sheet, /^# Bus Buddy: user test sheet/m);
  assert.match(sheet, /### Card 1: Find my bus/);
  assert.match(sheet, /### Card 2: Set my stop/);
  assert.match(sheet, /- ☐ The next bus time shows on the home screen/);
  assert.match(sheet, /- ☐ It updates without refreshing/);
  assert.match(sheet, /I want to see when my bus is coming/);
});

test("a card with no finish line says so instead of hiding it", () => {
  const sheet = renderTestSheet(parseCards(CARDS), { productName: "Bus Buddy" });
  assert.match(sheet, /This card has no Done when lines/);
});

test("the demo and the Word sheet are linked when given", () => {
  const sheet = renderTestSheet(parseCards(CARDS), { productName: "Bus Buddy", demoHref: "/demo/bus-buddy/", docxHref: "/build/user-test-sheet.docx" });
  assert.match(sheet, /\/demo\/bus-buddy\//);
  assert.match(sheet, /user-test-sheet\.docx/);
});

test("the five parts and the team response are all present", () => {
  const sheet = renderTestSheet([], { productName: "Empty" });
  for (const h of ["## Part 1", "## Part 2", "## Part 3", "## Part 4", "## Part 5", "## Team response"]) assert.ok(sheet.includes(h), h);
  assert.match(sheet, /no build cards yet/);
});
