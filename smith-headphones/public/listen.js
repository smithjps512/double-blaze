// Smith's ears: the browser's speech recognition (Web Speech API).
//
// Product lesson: a web page can only listen while it is open on the screen.
// When the phone locks or you switch apps, iPhone and Android turn the page's
// microphone off. Only Siri and Google Assistant are allowed to listen all the
// time, because Apple and Google built them into the phone itself. That is why
// the demo phone has to stay unlocked with Smith on screen.
//
// Privacy note: Chrome sends the sound to Google, and Safari may send it to Apple,
// to turn speech into text. Smith itself never saves any of it.

const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
export const canListen = !!Recognition;

// Fuzzy "Hey Smith": speech to text often hears "hey smit", "a smith", "hey myth".
const WAKE = /(?:^|\b)(?:hey|hay|hi|hey there|a|ok|okay|yo)[\s,.!]*(?:smith|smit|smiths|smyth|smitty|smiff|smif|myth|smithy)\b[\s,.!?]*/i;
const WAKE_AT_START = /^\s*(?:smith|smit|smyth)\b[\s,.!?]*/i;

export function findWake(text) {
  const m = text.match(WAKE) || text.match(WAKE_AT_START);
  if (!m) return null;
  return { rest: text.slice(m.index + m[0].length).trim() };
}

export class Listener {
  constructor({ onWake, onInterim, onProblem }) {
    this.onWake = onWake; // (restOfSentence) => void
    this.onInterim = onInterim; // (text) => void, live captions
    this.onProblem = onProblem; // (kind) => void
    this.mode = "off"; // "off" | "wake" | "once"
    this.rec = null;
    this.restarts = [];
  }

  _make(continuous) {
    const rec = new Recognition();
    rec.lang = "en-US";
    rec.continuous = continuous;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    return rec;
  }

  _kill() {
    const rec = this.rec;
    this.rec = null;
    if (!rec) return;
    rec.onresult = rec.onend = rec.onerror = null;
    try {
      rec.abort();
    } catch {}
  }

  stop() {
    this.mode = "off";
    clearTimeout(this.wakeTimer);
    this._kill();
  }

  // Wake word mode: keep listening quietly for "Hey Smith".
  startWake() {
    if (!canListen) return;
    this.stop();
    this.mode = "wake";
    this._runWake();
  }

  _runWake() {
    if (this.mode !== "wake") return;
    const rec = this._make(true);
    this.rec = rec;
    let heard = null;

    const fire = () => {
      if (this.mode !== "wake" || heard === null) return;
      const rest = heard;
      this.stop();
      this.onWake(rest);
    };

    rec.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;
        const wake = findWake(text);
        if (!wake) continue;
        heard = wake.rest;
        this.onInterim?.(text);
        clearTimeout(this.wakeTimer);
        // Wait for the speaker to finish the sentence ("Hey Smith, tell me a joke").
        if (event.results[i].isFinal) return fire();
        this.wakeTimer = setTimeout(fire, 1200);
      }
    };
    rec.onerror = (event) => {
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        this.mode = "off";
        this.onProblem?.("mic-blocked");
      }
    };
    rec.onend = () => {
      if (this.rec !== rec || this.mode !== "wake") return;
      // Browsers stop listening every so often. Start again, unless it keeps failing.
      const now = Date.now();
      this.restarts = this.restarts.filter((t) => now - t < 10000);
      this.restarts.push(now);
      if (this.restarts.length > 8) {
        this.mode = "off";
        this.onProblem?.("wake-unstable");
        return;
      }
      setTimeout(() => this._runWake(), 250);
    };
    try {
      rec.start();
    } catch {
      setTimeout(() => this._runWake(), 500);
    }
  }

  // Listen for one sentence and return it ("" if nobody spoke).
  listenOnce({ maxWaitMs = 7000, silenceMs = 1300 } = {}) {
    if (!canListen) return Promise.resolve("");
    this.stop();
    this.mode = "once";
    return new Promise((resolve) => {
      const rec = this._make(false);
      this.rec = rec;
      let text = "";
      let settled = false;
      let silenceTimer;
      const finish = () => {
        if (settled) return;
        settled = true;
        clearTimeout(silenceTimer);
        clearTimeout(giveUp);
        if (this.rec === rec) this.stop();
        resolve(text.trim());
      };
      const giveUp = setTimeout(finish, maxWaitMs);

      rec.onresult = (event) => {
        text = Array.from(event.results)
          .map((r) => r[0].transcript)
          .join(" ");
        this.onInterim?.(text);
        clearTimeout(silenceTimer);
        if (event.results[event.results.length - 1].isFinal) return finish();
        // iPhones do not always mark speech as finished, so a short pause counts as done.
        silenceTimer = setTimeout(finish, silenceMs);
      };
      rec.onerror = (event) => {
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          this.onProblem?.("mic-blocked");
        }
        finish();
      };
      rec.onend = finish;
      try {
        rec.start();
      } catch {
        finish();
      }
    });
  }
}
