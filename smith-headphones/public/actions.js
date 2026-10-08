// The things Smith can do. Claude picks the tool; this file makes it happen on the phone.

import { CONTACTS } from "./contacts.js";

const $ = (id) => document.getElementById(id);
const isIOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

export const contactNames = CONTACTS.map((c) => c.name);

export function findContact(name = "") {
  const want = name.toLowerCase().replace(/^my\s+/, "").trim();
  return (
    CONTACTS.find((c) => c.name.toLowerCase() === want) ||
    CONTACTS.find((c) => c.aliases.some((a) => a.toLowerCase().replace(/^my\s+/, "") === want)) ||
    CONTACTS.find((c) => want.includes(c.name.toLowerCase()))
  );
}

// ---------- Timer ----------

let timer = null;

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m >= 60 ? `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${m}:${String(s).padStart(2, "0")}`;
}

export function setTimer(seconds, label, onDone) {
  clearInterval(timer?.interval);
  timer = null;
  $("timer").hidden = true;
  if (!seconds) return;
  const endsAt = Date.now() + seconds * 1000;
  const name = (label || "").trim();
  const tick = () => {
    const left = Math.max(0, Math.round((endsAt - Date.now()) / 1000));
    $("timerText").textContent = `${name ? name + " " : ""}${formatTime(left)}`;
    if (left === 0) {
      clearInterval(timer.interval);
      timer = null;
      $("timer").hidden = true;
      onDone(name);
    }
  };
  timer = { interval: setInterval(tick, 250) };
  $("timer").hidden = false;
  tick();
}

export function cancelTimer() {
  setTimer(0);
}

// ---------- Calls and texts ----------
//
// Product lesson: a web page is not allowed to secretly call or text anyone.
// Imagine if any website could text your whole contact list! Apple and Google
// only let the Phone and Messages apps do that, and you have to tap to send.
// So Smith asks first, then opens the real app with everything filled in, and
// a person makes the final tap. In demo mode, nothing real happens at all.

function telLink(number) {
  return `tel:${number.replace(/[^\d+]/g, "")}`;
}

function smsLink(number, body) {
  // iPhones use "&body=", Android uses "?body=".
  return `sms:${number.replace(/[^\d+]/g, "")}${isIOS ? "&" : "?"}body=${encodeURIComponent(body)}`;
}

function openSheet(html) {
  $("phoneSheet").innerHTML = html;
  $("phone").hidden = false;
  $("phone").querySelector("[data-close]")?.addEventListener("click", closeSheet);
}

export function closeSheet() {
  $("phone").hidden = true;
  $("phoneSheet").innerHTML = "";
}

const escapeHtml = (s) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// Ask a yes or no question out loud and on screen. Resolves true or false.
export async function askYesNo(question, { speak, listenOnce, stopListening }) {
  const buttons = new Promise((resolve) => {
    $("confirm").hidden = false;
    $("confirmQuestion").textContent = question;
    $("confirmYes").onclick = () => resolve(true);
    $("confirmNo").onclick = () => resolve(false);
  });
  await speak(question);
  let settled = false;
  const voice = (async () => {
    // Give two chances to hear a clear answer.
    for (let i = 0; i < 2 && !settled; i++) {
      const answer = (await listenOnce()).toLowerCase();
      if (/\b(no|nope|nah|cancel|stop|don't|do not|never mind)\b/.test(answer)) return false;
      if (/\b(yes|yeah|yep|yup|sure|send|send it|do it|ok|okay|call|go|please|correct)\b/.test(answer)) return true;
      if (!answer) break;
    }
    return null;
  })();
  // If the voice answer was unclear, the buttons stay up for a bit.
  // No answer at all counts as "no", so nothing gets sent by accident.
  const tooLate = () => new Promise((resolve) => setTimeout(() => resolve(false), 15000));
  const result = await Promise.race([buttons, voice.then((v) => (v === null ? Promise.race([buttons, tooLate()]) : v))]);
  settled = true;
  stopListening();
  $("confirm").hidden = true;
  return result;
}

export async function doCall(contact, { demo, speak }) {
  if (demo) {
    openSheet(`
      <div class="sheet-call">
        <div class="avatar">${escapeHtml(contact.name[0])}</div>
        <div class="sheet-title">Calling ${escapeHtml(contact.name)}...</div>
        <div class="sheet-sub">Demo mode: no real call</div>
        <button class="big-btn red" data-close>Hang up</button>
      </div>`);
    await speak(`Calling ${contact.name}. This is a pretend call, so nobody will answer.`);
    setTimeout(closeSheet, 4000);
    return;
  }
  openSheet(`
    <div class="sheet-call">
      <div class="avatar">${escapeHtml(contact.name[0])}</div>
      <div class="sheet-title">Call ${escapeHtml(contact.name)}</div>
      <a class="big-btn green" href="${telLink(contact.number)}">Tap to call</a>
      <button class="link-btn" data-close>Cancel</button>
    </div>`);
  await speak(`Tap the green button to call ${contact.name}.`);
}

export async function doText(contact, message, { demo, speak }) {
  if (demo) {
    openSheet(`
      <div class="sheet-text">
        <div class="sheet-title">To: ${escapeHtml(contact.name)}</div>
        <div class="bubble">${escapeHtml(message)}</div>
        <div class="sheet-sub">Delivered (demo mode, nothing was really sent)</div>
        <button class="big-btn" data-close>Done</button>
      </div>`);
    await speak("Sent!");
    setTimeout(closeSheet, 5000);
    return;
  }
  openSheet(`
    <div class="sheet-text">
      <div class="sheet-title">To: ${escapeHtml(contact.name)}</div>
      <div class="bubble">${escapeHtml(message)}</div>
      <a class="big-btn green" href="${smsLink(contact.number, message)}">Tap to open Messages</a>
      <button class="link-btn" data-close>Cancel</button>
    </div>`);
  await speak("Tap the green button, then press send.");
}
