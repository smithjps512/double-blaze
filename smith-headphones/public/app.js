// Smith's main loop: listen, think, speak, then go back to sleep.

import { speak, stopSpeaking, unlockSpeech, listVoices, onVoicesReady, setVoice, canSpeak } from "./speak.js";
import { Listener, canListen } from "./listen.js";
import { Player } from "./player.js";
import { contactNames, findContact, setTimer, askYesNo, doCall, doText, closeSheet } from "./actions.js";

const $ = (id) => document.getElementById(id);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- Settings (saved on this phone only) ----------

const settings = { voice: "", demo: true, wake: true, model: "fast", passcode: "" };
try {
  Object.assign(settings, JSON.parse(localStorage.getItem("smith-settings") || "{}"));
} catch {}
function saveSettings() {
  try {
    localStorage.setItem("smith-settings", JSON.stringify(settings));
  } catch {}
}

// ---------- Screen states ----------

const LABELS = { sleeping: "Sleeping", listening: "Listening...", thinking: "Thinking...", speaking: "Speaking" };
let state = "sleeping";

function setState(next) {
  state = next;
  document.body.dataset.state = next;
  $("stateLabel").textContent = LABELS[next];
  $("talkBtn").textContent = next === "listening" ? "Stop" : next === "speaking" ? "Interrupt" : "Tap to talk";
}

function setHint(text) {
  $("hint").textContent = text;
}

function defaultHint() {
  if (!canListen) return "This browser cannot listen. Use Safari or Chrome, or type in settings.";
  return settings.wake ? 'Say "Hey Smith" or press your headphone button' : "Press your headphone button or tap to talk";
}

function refreshPlayer() {
  $("nowPlaying").hidden = !player.playing;
  $("songTitle").textContent = player.title;
  $("volFill").style.width = `${player.volumePercent}%`;
}

// ---------- The parts ----------

const listener = new Listener({
  onWake: (rest) => (rest.length > 1 ? converse(rest) : startListening()),
  onInterim: (text) => ($("heard").textContent = text),
  onProblem: (kind) => {
    if (kind === "mic-blocked") setHint("Microphone is blocked. Allow it in your browser settings, then reload.");
    if (kind === "wake-unstable") setHint("Wake word paused. Press your headphone button or tap to talk.");
  },
});

const player = new Player({
  onChange: refreshPlayer,
  onButton: () => {
    // Headphone play/pause button: the students' physical backup control.
    if (player.playing) player.pause();
    buttonPress();
  },
  onNext: () => player.next(),
});

let started = false;
let session = 0; // each new conversation gets a number, so old ones can be cancelled
let history = []; // short memory, lives only in this page
const pendingAnnouncements = [];

async function say(text) {
  listener.stop(); // do not let Smith hear itself
  player.duck(true);
  setState("speaking");
  $("said").textContent = text;
  await speak(text);
}

function goIdle() {
  setState("sleeping");
  player.duck(false);
  player.keepAlive();
  setHint(defaultHint());
  if (pendingAnnouncements.length) return announce(pendingAnnouncements.shift());
  if (settings.wake && canListen && document.visibilityState === "visible") listener.startWake();
}

// Something Smith needs to say on its own, like a timer going off.
async function announce(text) {
  if (state !== "sleeping") return pendingAnnouncements.push(text);
  const my = ++session;
  player.chime(true);
  await wait(300);
  player.chime(true);
  await wait(300);
  await say(text);
  if (my === session) goIdle();
}

function buttonPress() {
  if (!started) return;
  if (state === "listening") {
    session++;
    listener.stop();
    player.chime(false);
    return goIdle();
  }
  if (state === "thinking") return;
  startListening();
}

async function startListening() {
  const my = ++session;
  stopSpeaking();
  closeSheet();
  listener.stop();
  player.duck(true);
  setState("listening");
  $("heard").textContent = "...";
  player.chime(true);
  await wait(250); // let the chime finish before the mic opens
  if (my !== session) return;
  const text = await listener.listenOnce();
  if (my !== session) return;
  if (!text) {
    player.chime(false);
    return goIdle();
  }
  await converse(text, my);
}

async function askSmith(text) {
  try {
    const res = await fetch("/api/smith", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        history,
        model: settings.model,
        contacts: contactNames,
        passcode: settings.passcode,
      }),
    });
    return await res.json();
  } catch {
    return { say: "I cannot reach the internet right now.", actions: [] };
  }
}

function remember(userText, smithText) {
  history.push({ role: "user", content: userText }, { role: "assistant", content: smithText || "Okay." });
  history = history.slice(-6); // the last 3 back and forth turns
}

const DEFAULT_LINES = {
  play_music: "Here comes some music!",
  pause_music: "Paused.",
  next_song: "Next song!",
  set_volume: "Done.",
  set_timer: "Timer set.",
};

async function converse(text, my = ++session) {
  if (!started) return;
  listener.stop();
  closeSheet();
  player.duck(true);
  $("heard").textContent = text;
  setState("thinking");

  const data = await askSmith(text);
  if (my !== session) return;

  const actions = Array.isArray(data.actions) ? data.actions : [];
  const phoneAction = actions.find((a) => a.name === "start_call" || a.name === "send_text");
  let line = data.say || "";

  // Quick actions happen before Smith talks.
  for (const { name, input } of actions) {
    if (name === "pause_music") player.pause();
    if (name === "set_volume") player.setVolume(input.direction, Number(input.level));
    if (name === "set_timer") setTimer(Number(input.seconds) || 0, input.label, (label) => announce(`Your ${label ? label + " " : ""}timer is done!`));
  }

  if (phoneAction) {
    line = await runPhoneAction(phoneAction, my);
  } else {
    if (!line) line = DEFAULT_LINES[actions[0]?.name] || "Hmm, I am not sure what to say.";
    await say(line);
    if (my !== session) return;
    // Music starts after Smith finishes talking, so you can hear both.
    for (const { name, input } of actions) {
      let ok = true;
      if (name === "play_music") ok = await player.play(input.song);
      if (name === "next_song") ok = await player.next();
      if (!ok) await say("Hmm, the music would not start. Try tapping to talk and asking again.");
    }
  }

  remember(text, line);
  if (my === session) goIdle();
}

// Calls and texts always get a spoken yes or no first.
async function runPhoneAction({ name, input }, my) {
  const contact = findContact(input.contact);
  if (!contact) {
    const line = `I could not find ${input.contact || "that person"} in your contacts.`;
    await say(line);
    return line;
  }
  const isText = name === "send_text";
  const message = (input.message || "").trim();
  const question = isText ? `Texting ${contact.name}: ${message}. Send it?` : `Call ${contact.name}?`;

  setState("listening");
  const yes = await askYesNo(question, {
    speak: async (t) => {
      await say(t);
      setState("listening");
      $("heard").textContent = "...";
    },
    listenOnce: () => listener.listenOnce({ maxWaitMs: 6000 }),
    stopListening: () => listener.stop(),
  });
  if (my !== session) return question;

  if (!yes) {
    await say(isText ? "Okay, I won't send it." : "Okay, no call.");
    return question;
  }
  const helpers = { demo: settings.demo, speak: say };
  if (isText) await doText(contact, message, helpers);
  else await doCall(contact, helpers);
  return isText ? `Sent a text to ${contact.name}.` : `Started a call to ${contact.name}.`;
}

// ---------- Keep the screen awake ----------

let wakeLock = null;
async function keepScreenOn() {
  try {
    wakeLock = await navigator.wakeLock?.request("screen");
  } catch {}
}
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState !== "visible" || !started) return;
  if (!wakeLock || wakeLock.released) keepScreenOn();
  if (state === "sleeping") goIdle();
});

// ---------- Buttons and settings ----------

$("startBtn").addEventListener("click", async () => {
  unlockSpeech();
  player.unlock();
  keepScreenOn();
  $("start").hidden = true;
  started = true;
  if (!canSpeak) setHint("This browser cannot talk. Try Safari or Chrome.");
  await say("Hi, I'm Smith! Say hey Smith, or press your headphone button.");
  goIdle();
});

$("talkBtn").addEventListener("click", () => {
  if (state === "speaking") stopSpeaking();
  buttonPress();
});

$("settingsBtn").addEventListener("click", () => ($("settings").hidden = false));
$("settingsClose").addEventListener("click", () => ($("settings").hidden = true));

function fillVoices() {
  const select = $("voiceSelect");
  const voices = listVoices();
  select.innerHTML = "";
  for (const v of voices) {
    const opt = document.createElement("option");
    opt.value = v.name;
    opt.textContent = `${v.name} (${v.lang})`;
    select.append(opt);
  }
  if (!voices.length) select.innerHTML = "<option>Phone default</option>";
  if (voices.some((v) => v.name === settings.voice)) select.value = settings.voice;
  setVoice(select.value);
}
onVoicesReady(fillVoices);

$("voiceSelect").addEventListener("change", (e) => {
  settings.voice = e.target.value;
  setVoice(settings.voice);
  saveSettings();
});
$("voiceTest").addEventListener("click", (e) => {
  e.preventDefault();
  unlockSpeech();
  speak("Hi! I'm Smith. Do you like this voice?");
});

$("demoToggle").checked = settings.demo;
$("demoToggle").addEventListener("change", (e) => {
  settings.demo = e.target.checked;
  saveSettings();
});

$("wakeToggle").checked = settings.wake;
$("wakeToggle").addEventListener("change", (e) => {
  settings.wake = e.target.checked;
  saveSettings();
  if (!started) return;
  if (settings.wake && state === "sleeping") goIdle();
  if (!settings.wake && state === "sleeping") listener.stop();
  setHint(defaultHint());
});

$("modelSelect").value = settings.model;
$("modelSelect").addEventListener("change", (e) => {
  settings.model = e.target.value;
  saveSettings();
});

$("passcode").value = settings.passcode;
$("passcode").addEventListener("change", (e) => {
  settings.passcode = e.target.value.trim();
  saveSettings();
});

$("typeForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const text = $("typeInput").value.trim();
  if (!text || !started) return;
  $("typeInput").value = "";
  $("settings").hidden = true;
  stopSpeaking();
  converse(text);
});

setHint(defaultHint());
refreshPlayer();
