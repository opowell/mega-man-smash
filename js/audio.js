// Chiptune sound: synthesized effects and a small two-voice music sequencer.

// Tracks are space-separated steps (one eighth note each): a note like C5, F#4
// or Bb2, optionally held for n steps with ":n"; "-" (or "-:n") is a rest.
const SONGS = {
  title: {
    step: 0.15,
    lead: 'G4 C5 E5 G5:2 E5 G5:2 A5 G5 F5 E5 D5:2 G4:2 G4 C5 E5 G5:2 A5 B5:2 C6:2 B5 A5 G5:4',
    bass: 'C3 C3 G2 G2 C3 C3 G2 G2 F2 F2 C3 C3 G2 G2 G2 G2 C3 C3 G2 G2 F2 F2 G2 G2 A2 A2 F2 F2 G2 G2 G2 G2',
  },
  select: {
    step: 0.17,
    lead: 'C5 E5 G5 E5 D5 F5 A5 F5 E5 G5 C6 G5 F5 A5 G5 F5',
    bass: 'C3 G2 C3 G2 D3 A2 D3 A2 E3 B2 E3 B2 F3 C3 G3 G2',
  },
  meadow: {
    step: 0.15,
    lead: 'D5 G5 B5 D6:2 B5 G5:2 A5 B5 A5 G5 E5:2 D5:2 D5 G5 B5 D6:2 E6 D6:2 B5 C6 B5 A5 G5:4',
    bass: 'G2 G3 G2 G3 G2 G3 G2 G3 C3 C4 C3 C4 D3 D4 D3 D4 G2 G3 G2 G3 E2 E3 E2 E3 C3 C4 D3 D4 G2 G3 G2 G3',
  },
  homeland: {
    step: 0.15,
    lead: 'D5 F#5 A5 D6:2 A5 B5 A5 F#5 G5 A5 B5 A5:2 F#5:2 D5 F#5 A5 D6:2 E6 F#6:2 E6 D6 C#6 B5 A5:2 D6:2',
    bass: 'D3 A3 D3 A3 D3 A3 D3 A3 G2 D3 G2 D3 A2 E3 A2 E3 D3 A3 D3 A3 B2 F#3 B2 F#3 G2 D3 A2 E3 D3 A3 D3 A3',
  },
  ember: {
    step: 0.13,
    lead: 'A4 C5 E5 A5 G5 E5 C5 E5 F5 A5 C6 A5 G5:2 E5:2 A4 C5 E5 A5 B5 A5 G5 E5 D5 E5 F5 D5 E5:4',
    bass: 'A2 A2 A3 A2 A2 A2 A3 A2 F2 F2 F3 F2 G2 G2 G3 G2 A2 A2 A3 A2 A2 A2 A3 A2 D3 D3 D2 D3 E2 E3 E2 E3',
  },
  wind: {
    step: 0.16,
    lead: 'C5:2 F5 A5 C6:2 A5 F5 G5:2 A5 G5 F5:2 D5:2 C5:2 F5 A5 C6 D6 C6 A5 G5 A5 F5 D5 F5:4',
    bass: 'F2 C3 F3 C3 F2 C3 F3 C3 C3 G3 C4 G3 D3 A3 D4 A3 F2 C3 F3 C3 Bb2 F3 Bb3 F3 C3 G3 C4 G3 F2 C3 F3 C3',
  },
  volt: {
    step: 0.12,
    lead: 'E5 E5 G5 E5 B5 E5 A5 G5 E5 E5 G5 E5 D6 B5 A5 G5 C5 C5 E5 C5 G5 C5 F#5 E5 D5 D5 F#5 D5 A5 F#5 G5 F#5',
    bass: 'E2 E3 E2 E3 E2 E3 E2 E3 E2 E3 E2 E3 E2 E3 E2 E3 C2 C3 C2 C3 C2 C3 C2 C3 D2 D3 D2 D3 D2 D3 B1 B2',
  },
  hangar: {
    step: 0.16,
    lead: 'D5:2 F5 A5 D6:2 C6 A5 Bb5:2 A5 G5 A5:4 D5:2 F5 A5 C6:2 Bb5 A5 G5:2 F5 E5 D5:4',
    bass: 'D2 D3 D2 D3 D2 D3 D2 D3 Bb1 Bb2 Bb1 Bb2 A1 A2 A1 A2 D2 D3 D2 D3 F2 F3 F2 F3 G2 G3 G2 G3 A1 A2 A1 A2',
  },
  village: {
    step: 0.14,
    lead: 'C5 Eb5 G5 C6 Bb5 G5 Ab5 G5 F5 Ab5 C6 F6 Eb6 D6 C6 B5 C5 Eb5 G5 C6 D6 Eb6 D6 C6 Bb5 Ab5 G5 F5 G5:4',
    bass: 'C2 C3 C2 C3 C2 C3 C2 C3 F2 F3 F2 F3 G2 G3 G2 G3 C2 C3 C2 C3 Ab1 Ab2 Ab1 Ab2 Bb1 Bb2 Bb1 Bb2 G1 G2 G1 G2',
  },
  boss: {
    step: 0.11,
    lead: 'E5 F5 E5 D5 E5 G5 A5 B5 C6 B5 A5 G5 A5:2 E5:2 E5 F5 E5 D5 E5 G5 A5 B5 C6 D6 E6 D6 E6:4',
    bass: 'A1 A2 A1 A2 A1 A2 A1 A2 F1 F2 F1 F2 G1 G2 G1 G2 A1 A2 A1 A2 A1 A2 A1 A2 F1 F2 F1 F2 G1 G2 G1 G2',
  },
  clear: { step: 0.12, loop: false, lead: 'C5 E5 G5 C6 - G5 C6:6', bass: 'C3 - - - - G2 C3:6' },
  gameover: { step: 0.2, loop: false, lead: 'G4 F4 E4 D4 C4:6', bass: 'G2 F2 E2 D2 C2:6' },
  ending: {
    step: 0.17,
    lead: 'C5 E5 G5 C6:2 G5 A5:2 F5 A5 C6 F6:2 C6 D6:2 B5 D6 G6:2 F6 E6 D6 C6 B5 A5 G5:2 E6:2 C6:4',
    bass: 'C3 G3 C3 G3 C3 G3 A2 E3 F2 C3 F2 C3 F2 C3 D3 A3 G2 D3 G2 D3 G2 D3 G2 D3 F2 C3 G2 D3 C3 G3 C3 G3',
  },
};

const SEMI = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

function freq(note) {
  const m = /^([A-G])([#b]?)(\d)$/.exec(note);
  if (!m) return 0;
  const n = SEMI[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (Number(m[3]) + 1) * 12;
  return 440 * Math.pow(2, (n - 69) / 12);
}

function parse(track) {
  const events = [];
  let step = 0;
  for (const tok of track.trim().split(/\s+/)) {
    const [n, l] = tok.split(':');
    const len = Number(l || 1);
    if (n !== '-') events.push({ step, len, f: freq(n) });
    step += len;
  }
  return { events, length: step };
}

export class Sound {
  constructor() {
    this.ctx = null;
    this.muted = false;
    try { this.muted = localStorage.getItem('mms-muted') === '1'; } catch { /* storage unavailable */ }
    this.song = null;
    this.timer = null;
  }

  unlock() {
    if (!this.ctx) {
      try {
        this.ctx = new AudioContext();
      } catch { return; }
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.5;
      this.master.connect(this.ctx.destination);
      this.music = this.ctx.createGain();
      this.music.gain.value = 0.45;
      this.music.connect(this.master);
      this.fx = this.ctx.createGain();
      this.fx.gain.value = 0.7;
      this.fx.connect(this.master);
      const len = this.ctx.sampleRate;
      this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      if (this.wanted) this.play(this.wanted, true);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  toggleMute() {
    this.muted = !this.muted;
    try { localStorage.setItem('mms-muted', this.muted ? '1' : '0'); } catch { /* storage unavailable */ }
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.5;
  }

  tone(type, f0, f1, dur, vol = 0.3, delay = 0, dest = this.fx) {
    const c = this.ctx;
    const t = c.currentTime + delay;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(dest);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  noise(dur, vol = 0.3, cutoff = 3000, delay = 0, cutoffEnd = cutoff) {
    const c = this.ctx;
    const t = c.currentTime + delay;
    const s = c.createBufferSource();
    s.buffer = this.noiseBuf;
    const f = c.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(cutoff, t);
    f.frequency.exponentialRampToValueAtTime(Math.max(40, cutoffEnd), t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(f).connect(g).connect(this.fx);
    s.start(t, Math.random() * 0.5);
    s.stop(t + dur + 0.02);
  }

  sfx(name) {
    if (!this.ctx || this.muted) return;
    switch (name) {
      case 'shoot': this.tone('square', 1100, 700, 0.07, 0.15); break;
      case 'charged': this.tone('square', 400, 1400, 0.18, 0.2); this.noise(0.15, 0.15, 5000); break;
      case 'flame': this.noise(0.18, 0.25, 2500, 0, 300); this.tone('sawtooth', 300, 120, 0.15, 0.08); break;
      case 'wind': this.noise(0.12, 0.2, 6000, 0, 1500); break;
      case 'spread': this.tone('square', 1500, 900, 0.06, 0.12); this.tone('square', 1200, 600, 0.06, 0.08, 0.02); break;
      case 'cannon': this.noise(0.22, 0.35, 1800, 0, 150); this.tone('square', 220, 70, 0.18, 0.15); break;
      case 'charge': this.tone('square', 300, 900, 0.3, 0.05); break;
      case 'chargeFull': this.tone('triangle', 1200, 1250, 0.06, 0.12); break;
      case 'hit': this.noise(0.06, 0.25, 6000); this.tone('square', 600, 300, 0.05, 0.1); break;
      case 'tink': this.tone('triangle', 2400, 2200, 0.08, 0.2); break;
      case 'kill': this.noise(0.25, 0.3, 4000, 0, 200); this.tone('square', 500, 80, 0.2, 0.12); break;
      case 'explode': this.noise(0.5, 0.45, 2000, 0, 60); this.tone('square', 150, 40, 0.4, 0.15); break;
      case 'hurt': this.tone('square', 500, 120, 0.25, 0.2); this.noise(0.1, 0.2, 3000); break;
      case 'land': this.noise(0.05, 0.12, 900); break;
      case 'jump': this.tone('square', 300, 600, 0.08, 0.06); break;
      case 'doubleJump': this.tone('square', 500, 1000, 0.1, 0.1); this.noise(0.1, 0.12, 4000); break;
      case 'speedJump': this.tone('sawtooth', 200, 900, 0.25, 0.12); break;
      case 'loadUp': this.tone('square', 150 + Math.random() * 20, 160, 0.05, 0.05); break;
      case 'launch': this.tone('square', 200, 1600, 0.3, 0.18); this.noise(0.3, 0.25, 3000, 0, 300); break;
      case 'smash': this.noise(0.4, 0.5, 1500, 0, 60); this.tone('square', 180, 40, 0.35, 0.25); this.tone('triangle', 900, 300, 0.2, 0.2); break;
      case 'boom': this.noise(0.9, 0.6, 2500, 0, 50); this.tone('square', 140, 30, 0.7, 0.3); this.tone('triangle', 70, 30, 0.8, 0.4); this.tone('square', 600, 1800, 0.25, 0.12, 0.08); break;
      case 'smashDive': this.tone('square', 1600, 400, 0.18, 0.12); this.tone('triangle', 800, 200, 0.18, 0.15); break;
      case 'pickup': [0, 0.04, 0.08].forEach((d, i) => this.tone('square', 700 + i * 250, 700 + i * 250, 0.05, 0.12, d)); break;
      case 'oneup': [0, 0.07, 0.14, 0.21, 0.28].forEach((d, i) => this.tone('square', 523 * Math.pow(1.26, i), 523 * Math.pow(1.26, i), 0.07, 0.15, d)); break;
      case 'swap': this.tone('square', 400, 1600, 0.12, 0.12); this.tone('triangle', 800, 2000, 0.12, 0.12, 0.05); break;
      case 'select': this.tone('square', 1000, 1000, 0.04, 0.12); break;
      case 'confirm': this.tone('square', 800, 800, 0.05, 0.15); this.tone('square', 1200, 1200, 0.08, 0.15, 0.05); break;
      case 'teleport': this.tone('square', 300, 2400, 0.3, 0.1); break;
      case 'gate': this.noise(0.6, 0.3, 500, 0, 100); this.tone('square', 90, 60, 0.5, 0.15); break;
      case 'tick': this.tone('square', 1400, 1400, 0.025, 0.1); break;
      case 'death': [0, 0.08, 0.16].forEach((d) => this.tone('square', 900, 200, 0.2, 0.15, d)); break;
      case 'laser': this.tone('sawtooth', 120, 140, 0.7, 0.12); this.noise(0.7, 0.15, 7000); break;
      case 'warn': this.tone('square', 880, 880, 0.08, 0.12); break;
      case 'board': this.tone('square', 200, 400, 0.15, 0.15); this.tone('square', 400, 800, 0.15, 0.15, 0.15); break;
      case 'text': this.tone('square', 1800, 1800, 0.015, 0.04); break;
      case 'dig': this.noise(0.14, 0.3, 1200, 0, 200); this.tone('square', 160, 70, 0.1, 0.12); break;
      case 'glass': this.noise(0.35, 0.35, 8000, 0, 2500); this.tone('triangle', 3200, 1800, 0.12, 0.1); this.tone('triangle', 2600, 1400, 0.12, 0.08, 0.05); break;
      case 'door': this.tone('sawtooth', 140, 190, 0.5, 0.06); this.noise(0.4, 0.06, 700, 0, 400); break;
      case 'unlock': this.tone('square', 900, 900, 0.04, 0.12); this.tone('square', 1300, 1300, 0.08, 0.12, 0.07); break;
      case 'pause': this.tone('square', 1200, 600, 0.1, 0.12); break;
    }
  }

  play(name, force = false) {
    if (this.wanted === name && !force && this.timer) return;
    this.stop();
    this.wanted = name;
    if (!this.ctx || !SONGS[name]) return;
    const s = SONGS[name];
    const tracks = [
      { ...parse(s.lead), type: 'square', vol: 0.09 },
      { ...parse(s.bass), type: 'triangle', vol: 0.22 },
    ];
    const length = Math.max(...tracks.map((t) => t.length));
    const song = { s, tracks, length, step: 0, next: this.ctx.currentTime + 0.05 };
    this.song = song;
    this.timer = setInterval(() => this.schedule(song), 25);
    this.schedule(song);
  }

  schedule(song) {
    const c = this.ctx;
    while (song.next < c.currentTime + 0.15) {
      const stepInLoop = song.step % song.length;
      if (song.s.loop === false && song.step >= song.length) { this.stop(); return; }
      for (const tr of song.tracks) {
        for (const ev of tr.events) {
          if (ev.step !== stepInLoop) continue;
          const dur = ev.len * song.s.step * 0.92;
          const o = c.createOscillator();
          const g = c.createGain();
          o.type = tr.type;
          o.frequency.value = ev.f;
          const t = song.next;
          g.gain.setValueAtTime(0, t);
          g.gain.linearRampToValueAtTime(tr.vol, t + 0.005);
          g.gain.linearRampToValueAtTime(tr.vol * 0.7, t + Math.min(0.08, dur));
          g.gain.setValueAtTime(tr.vol * 0.7, t + dur - 0.02);
          g.gain.linearRampToValueAtTime(0, t + dur);
          o.connect(g).connect(this.music);
          o.start(t);
          o.stop(t + dur + 0.01);
        }
      }
      song.step++;
      song.next += song.s.step;
    }
  }

  stop() {
    clearInterval(this.timer);
    this.timer = null;
    this.song = null;
    this.wanted = null;
  }
}
