// Keyboard, gamepad and on-screen touch buttons, read once per game step.

const KEYS = {
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  KeyZ: 'jump', Space: 'jump', KeyK: 'jump',
  KeyX: 'shoot', KeyJ: 'shoot',
  ShiftLeft: 'boost', ShiftRight: 'boost', KeyC: 'boost', KeyL: 'boost',
  KeyQ: 'prev', KeyE: 'next',
  Enter: 'start', KeyP: 'start', Escape: 'start',
  KeyM: 'mute',
  Digit1: 'hero1', Digit2: 'hero2', Digit3: 'hero3', Digit4: 'hero4',
};

const PAD_BUTTONS = { 0: 'jump', 1: 'boost', 2: 'shoot', 3: 'shoot', 4: 'prev', 5: 'next', 6: 'boost', 7: 'boost', 9: 'start', 8: 'start', 12: 'up', 13: 'down', 14: 'left', 15: 'right' };

export class Input {
  constructor() {
    this.keys = new Set();     // held on the keyboard
    this.taps = new Set();     // went down since the last poll (so quick taps are never lost)
    this.touch = new Set();    // held on the touch overlay
    this.cur = new Set();
    this.prev = new Set();
    this.rawKeys = new Set();  // KeyboardEvent.code values pressed since the last poll (debug keys)
    this.listeners = [];
    addEventListener('keydown', (e) => {
      const a = KEYS[e.code];
      if (a) {
        e.preventDefault();
        if (!this.keys.has(a)) this.taps.add(a);
        this.keys.add(a);
      }
      if (!e.repeat) this.rawKeys.add(e.code);
      this.listeners.forEach((f) => f());
    });
    addEventListener('keyup', (e) => {
      const a = KEYS[e.code];
      if (a) this.keys.delete(a);
    });
    addEventListener('blur', () => this.keys.clear());
    this.setupTouch();
  }

  onAny(f) { this.listeners.push(f); }

  setupTouch() {
    const box = document.getElementById('touch');
    if (!box || !matchMedia('(pointer: coarse)').matches) return;
    box.hidden = false;
    for (const b of box.querySelectorAll('[data-a]')) {
      const actions = b.dataset.a.split(' ');
      const on = (e) => {
        e.preventDefault();
        b.setPointerCapture?.(e.pointerId);
        actions.forEach((a) => { if (!this.touch.has(a)) this.taps.add(a); this.touch.add(a); });
        b.classList.add('on');
        this.listeners.forEach((f) => f());
      };
      const off = (e) => {
        e.preventDefault();
        actions.forEach((a) => this.touch.delete(a));
        b.classList.remove('on');
      };
      b.addEventListener('pointerdown', on);
      b.addEventListener('pointerup', off);
      b.addEventListener('pointercancel', off);
      b.addEventListener('lostpointercapture', off);
    }
  }

  poll() {
    this.prev = this.cur;
    const cur = new Set([...this.keys, ...this.taps, ...this.touch]);
    this.taps.clear();
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const p of pads) {
      if (!p) continue;
      p.buttons.forEach((b, i) => { if (b.pressed && PAD_BUTTONS[i]) cur.add(PAD_BUTTONS[i]); });
      const [ax, ay] = p.axes;
      if (ax < -0.45) cur.add('left');
      if (ax > 0.45) cur.add('right');
      if (ay < -0.55) cur.add('up');
      if (ay > 0.55) cur.add('down');
      if (cur.size) this.listeners.forEach((f) => f());
    }
    this.cur = cur;
    this.raw = this.rawKeys;
    this.rawKeys = new Set();
  }

  held(a) { return this.cur.has(a); }
  pressed(a) { return this.cur.has(a) && !this.prev.has(a); }
  released(a) { return !this.cur.has(a) && this.prev.has(a); }
  anyPressed(...as) { return as.some((a) => this.pressed(a)); }
  rawPressed(code) { return this.raw?.has(code); }
}
