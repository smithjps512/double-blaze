// Smith's built in music player, plus the headphone button.
//
// Product lesson: a web page cannot control Spotify, Apple Music, or the phone's
// main volume. Phones keep each app in its own box (a "sandbox") so one app
// cannot mess with another. So Smith brings its own music player and changes
// only its own volume.

import { PLAYLIST } from "./music/playlist.js";

// One second of silence, made in code. Playing it on a loop tells the phone
// "Smith is the app playing audio", so the headphone button gets sent to Smith.
function silentWav() {
  const rate = 8000;
  const samples = rate;
  const buf = new ArrayBuffer(44 + samples);
  const v = new DataView(buf);
  const w = (o, s) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  w(0, "RIFF");
  v.setUint32(4, 36 + samples, true);
  w(8, "WAVEfmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, rate, true);
  v.setUint32(28, rate, true);
  v.setUint16(32, 1, true);
  v.setUint16(34, 8, true);
  w(36, "data");
  v.setUint32(40, samples, true);
  for (let i = 0; i < samples; i++) v.setUint8(44 + i, 128);
  return URL.createObjectURL(new Blob([buf], { type: "audio/wav" }));
}

export class Player {
  constructor({ onChange, onButton, onNext }) {
    this.onChange = onChange;
    this.index = 0;
    this.volume = 0.6; // 0 to 1
    this.ducked = false;
    this.lastButton = 0;

    this.music = new Audio();
    this.music.preload = "none";
    this.music.addEventListener("ended", () => this.next());
    this.music.addEventListener("play", () => this._changed());
    this.music.addEventListener("pause", () => this._changed());

    this.keepalive = new Audio(silentWav());
    this.keepalive.loop = true;

    if ("mediaSession" in navigator) {
      const press = () => {
        // Ignore double reports of the same press.
        const now = Date.now();
        if (now - this.lastButton < 800) return;
        this.lastButton = now;
        onButton();
      };
      for (const action of ["play", "pause", "stop"]) {
        try {
          navigator.mediaSession.setActionHandler(action, press);
        } catch {}
      }
      try {
        navigator.mediaSession.setActionHandler("nexttrack", () => onNext());
      } catch {}
    }
  }

  get playing() {
    return !this.music.paused;
  }

  get title() {
    return PLAYLIST[this.index]?.title || "";
  }

  get volumePercent() {
    return Math.round(this.volume * 100);
  }

  // Must run inside a tap. Sets up audio so iPhones allow it later.
  unlock() {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (Ctx && !this.ctx) {
      this.ctx = new Ctx();
      // iPhones ignore audio.volume, so volume goes through a Web Audio gain knob instead.
      try {
        const source = this.ctx.createMediaElementSource(this.music);
        this.gain = this.ctx.createGain();
        source.connect(this.gain).connect(this.ctx.destination);
      } catch {
        this.gain = null;
      }
    }
    this.ctx?.resume();
    this._applyVolume();
    // iPhones only let an audio player start by itself later if it was started once
    // during a tap. So start the music player silently now and stop it right away.
    if (PLAYLIST.length && !this.music.src) {
      this.music.src = PLAYLIST[this.index].file;
      this.music.muted = true;
      this.music
        .play()
        .then(() => this.music.pause())
        .catch(() => {})
        .finally(() => {
          this.music.muted = false;
          this.keepAlive();
        });
    } else {
      this.keepAlive();
    }
  }

  // Keep the headphone button connected to Smith while music is off.
  keepAlive() {
    if (this.playing) return;
    this.keepalive.play().catch(() => {});
    this._setSession("Smith is ready", "Press play/pause to talk");
  }

  _setSession(title, artist) {
    if (!("mediaSession" in navigator) || !window.MediaMetadata) return;
    navigator.mediaSession.metadata = new MediaMetadata({ title, artist, album: "Smart Headphones" });
    navigator.mediaSession.playbackState = "playing";
  }

  _applyVolume() {
    const level = this.ducked ? Math.min(this.volume, 0.15) : this.volume;
    if (this.gain) this.gain.gain.value = level;
    else this.music.volume = level;
  }

  _changed() {
    if (this.playing) this._setSession(this.title, "Smith's Music");
    this.onChange?.();
  }

  // Returns the song title, or null if there are no songs.
  async play(songName) {
    if (!PLAYLIST.length) return null;
    if (songName) {
      const want = songName.toLowerCase();
      const found = PLAYLIST.findIndex((s) => s.title.toLowerCase().includes(want) || want.includes(s.title.toLowerCase()));
      if (found >= 0 && found !== this.index) {
        this.index = found;
        this.music.src = "";
      }
    }
    if (!this.music.src || !this.music.src.endsWith(PLAYLIST[this.index].file)) {
      this.music.src = PLAYLIST[this.index].file;
    }
    this.keepalive.pause();
    await this.ctx?.resume();
    this._applyVolume();
    try {
      await this.music.play();
    } catch {
      this.keepAlive();
      return null;
    }
    return this.title;
  }

  pause() {
    this.music.pause();
    this.keepAlive();
  }

  async next() {
    if (!PLAYLIST.length) return null;
    this.index = (this.index + 1) % PLAYLIST.length;
    this.music.src = PLAYLIST[this.index].file;
    return this.play();
  }

  // direction: "up" | "down" | "set". Returns the new volume as a percent.
  setVolume(direction, level) {
    if (direction === "up") this.volume = Math.min(1, this.volume + 0.2);
    else if (direction === "down") this.volume = Math.max(0.05, this.volume - 0.2);
    else if (Number.isFinite(level)) this.volume = Math.max(0, Math.min(1, level / 100));
    this._applyVolume();
    this.onChange?.();
    return this.volumePercent;
  }

  // Turn music down while Smith listens or talks, like a real assistant.
  duck(on) {
    this.ducked = on;
    this._applyVolume();
  }

  // A short two note "I'm listening" sound.
  chime(up = true) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const notes = up ? [660, 990] : [990, 660];
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, t + i * 0.12);
      g.gain.exponentialRampToValueAtTime(0.25, t + i * 0.12 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.12 + 0.18);
      osc.connect(g).connect(this.ctx.destination);
      osc.start(t + i * 0.12);
      osc.stop(t + i * 0.12 + 0.2);
    });
  }
}
