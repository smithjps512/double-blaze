// Smith's voice: the phone's built in text to speech (speechSynthesis).
// Each phone has different voices, so the settings panel lists what this phone has.

const synth = window.speechSynthesis;
let chosenVoice = null;
let current = null; // keep a reference so Chrome does not drop the "end" event

export const canSpeak = !!synth;

export function listVoices() {
  if (!synth) return [];
  const voices = synth.getVoices().filter((v) => v.lang && v.lang.toLowerCase().startsWith("en"));
  return voices.sort((a, b) => Number(b.localService) - Number(a.localService) || a.name.localeCompare(b.name));
}

export function onVoicesReady(callback) {
  if (!synth) return;
  callback();
  synth.addEventListener?.("voiceschanged", callback);
}

export function setVoice(name) {
  chosenVoice = listVoices().find((v) => v.name === name) || null;
}

// iPhones only allow speech after a tap. Call this inside the first tap.
export function unlockSpeech() {
  if (!synth) return;
  const u = new SpeechSynthesisUtterance(" ");
  u.volume = 0;
  synth.speak(u);
}

export function stopSpeaking() {
  synth?.cancel();
}

export function speak(text) {
  return new Promise((resolve) => {
    if (!synth || !text) return resolve();
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    if (chosenVoice) {
      u.voice = chosenVoice;
      u.lang = chosenVoice.lang;
    } else {
      u.lang = "en-US";
    }
    u.rate = 1.02;
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(safety);
      resolve();
    };
    // Some browsers forget to say "I'm done talking", so stop waiting after a while.
    const safety = setTimeout(finish, 2500 + text.length * 90);
    u.onend = finish;
    u.onerror = finish;
    current = u;
    synth.speak(u);
  });
}
