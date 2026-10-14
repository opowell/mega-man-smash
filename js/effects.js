// Short-lived visual effects. Each has update() -> alive? and draw(ctx, cam).

import { blob, rect, HERO_PAL } from './gfx.js';
import { drawText } from './font.js';

export class Explosion {
  constructor(x, y, size = 1) { this.x = x; this.y = y; this.t = 0; this.size = size; }
  update() { return ++this.t < 18; }
  draw(ctx, cam) {
    const x = this.x - cam.x, y = this.y - cam.y;
    const r = Math.round((2 + this.t * 0.7) * this.size);
    const colors = ['#fcfcfc', '#fce4a0', '#fca044', '#e45c10'];
    const c = colors[Math.min(3, this.t >> 2)];
    if (this.t < 12) blob(ctx, x, y, r, r, c);
    if (this.t > 3) blob(ctx, x, y, Math.max(1, r - 4), Math.max(1, r - 4), this.t < 10 ? '#fcfcfc' : '#000000');
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2 + Math.PI / 4;
      rect(ctx, x + Math.cos(a) * r * 1.4, y + Math.sin(a) * r * 1.4, 2, 2, c);
    }
  }
}

// The classic: rings of energy orbs flying out from where a hero fell.
export class DeathBurst {
  constructor(x, y, pal) { this.x = x; this.y = y; this.t = 0; this.pal = HERO_PAL[pal] || HERO_PAL.mega; }
  update() { return ++this.t < 150; }
  draw(ctx, cam) {
    const frame = (this.t >> 2) % 2;
    for (let ring = 0; ring < 2; ring++) {
      const speed = ring ? 1.4 : 2.6;
      for (let i = 0; i < 8; i++) {
        const a = i * Math.PI / 4;
        const d = this.t * speed;
        const x = this.x + Math.cos(a) * d - cam.x;
        const y = this.y + Math.sin(a) * d - cam.y;
        if (x < -10 || x > 266 || y < -10 || y > 250) continue;
        blob(ctx, x, y, frame ? 5 : 4, frame ? 5 : 4, this.pal.L);
        blob(ctx, x, y, 2, 2, '#fcfcfc');
      }
    }
  }
}

export class Puff {
  constructor(x, y, color = '#fcfcfc', vx = 0, vy = -0.3) { this.x = x; this.y = y; this.t = 0; this.color = color; this.vx = vx; this.vy = vy; }
  update() { this.x += this.vx; this.y += this.vy; return ++this.t < 16; }
  draw(ctx, cam) {
    const r = 2 + (this.t >> 2);
    if (this.t < 12 || this.t % 2) blob(ctx, this.x - cam.x, this.y - cam.y, r, Math.max(1, r - 1), this.color);
  }
}

export class Spark {
  constructor(x, y, color, vx, vy, life = 20) { this.x = x; this.y = y; this.color = color; this.vx = vx; this.vy = vy; this.t = 0; this.life = life; }
  update() { this.x += this.vx; this.y += this.vy; this.vx *= 0.95; this.vy *= 0.95; return ++this.t < this.life; }
  draw(ctx, cam) { if (this.t % 3 !== 2) rect(ctx, this.x - cam.x, this.y - cam.y, 2, 2, this.color); }
}

// Green energy flaring up where a Smash Punch lands.
export class SmashFlare {
  constructor(x, y) { this.x = x; this.y = y; this.t = 0; }
  update() { return ++this.t < 24; }
  draw(ctx, cam) {
    const x = this.x - cam.x, y = this.y - cam.y;
    const r = this.t * 3;
    ctx.fillStyle = this.t % 4 < 2 ? '#b8f818' : '#58f898';
    for (let i = 0; i < 12; i++) {
      const a = -Math.PI + (i / 11) * Math.PI;
      const len = 4 + ((i * 7) % 5) * 2;
      for (let k = 0; k < len; k++) {
        const d = r + k;
        ctx.fillRect(Math.round(x + Math.cos(a) * d), Math.round(y + Math.sin(a) * d * 0.7), 2, 2);
      }
    }
    if (this.t < 8) { blob(ctx, x, y - 2, 14 - this.t, 5, '#fcfcfc'); }
  }
}

export class Ring {
  constructor(x, y, color) { this.x = x; this.y = y; this.color = color; this.t = 0; }
  update() { return ++this.t < 14; }
  draw(ctx, cam) {
    const r = 4 + this.t * 2;
    ctx.fillStyle = this.color;
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      ctx.fillRect(Math.round(this.x - cam.x + Math.cos(a) * r), Math.round(this.y - cam.y + Math.sin(a) * r), 2, 2);
    }
  }
}

export class FloatText {
  constructor(x, y, text, color, draw) { this.x = x; this.y = y; this.text = text; this.color = color; this.t = 0; this.drawText = draw; }
  update() { this.y -= 0.4; return ++this.t < 50; }
  draw(ctx, cam) { this.drawText(ctx, this.text, this.x - cam.x, this.y - cam.y, this.color, { align: 'center' }); }
}

// The Super Mega Man Slam Bash boom: a pillar of blue energy shoots up from
// the ground while rings of it race outward.
export class SlamBoom {
  constructor(x, y) { this.x = x; this.y = y; this.t = 0; }
  update() { return ++this.t < 36; }
  draw(ctx, cam) {
    const x = this.x - cam.x, y = this.y - cam.y, t = this.t;
    const flick = t % 4 < 2;
    // the pillar
    if (t < 20) {
      const h = Math.min(120, t * 14);
      const w = Math.max(2, 22 - t);
      rect(ctx, x - w / 2 - 2, y - h, w + 4, h, flick ? '#0058f8' : '#3cbcfc');
      rect(ctx, x - w / 4, y - h, w / 2, h, '#fcfcfc');
    }
    // rings racing out along the ground
    for (let k = 0; k < 3; k++) {
      const r = t * (4 - k) + k * 6;
      ctx.fillStyle = k === 0 ? '#fcfcfc' : k === 1 ? '#3cbcfc' : '#0058f8';
      for (let i = 0; i < 20; i++) {
        const a = -Math.PI + (i / 19) * Math.PI;
        ctx.fillRect(Math.round(x + Math.cos(a) * r), Math.round(y + Math.sin(a) * r * 0.45), 3, 3);
      }
    }
    // chunks of ground thrown up
    for (let i = 0; i < 8; i++) {
      const vx = (i - 3.5) * 1.1, vy = -4 - (i % 3);
      const px = x + vx * t, py = y + vy * t + 0.18 * t * t;
      if (py < y + 4) rect(ctx, px, py, 3, 3, i % 2 ? '#a4e4fc' : '#0000bc');
    }
    if (t < 6) blob(ctx, x, y - 4, 26 - t * 2, 9, '#fcfcfc');
  }
}

// Big outlined words that pop up and float away, like BOOM!
export class BigText {
  constructor(x, y, text) { this.x = x; this.y = y; this.text = text; this.t = 0; }
  update() { this.y -= 0.5; return ++this.t < 50; }
  draw(ctx, cam) {
    if (this.t > 36 && this.t % 2) return;
    const x = this.x - cam.x, y = this.y - cam.y;
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [2, 2]]) drawText(ctx, this.text, x + dx, y + dy, '#000058', { scale: 2, align: 'center' });
    drawText(ctx, this.text, x, y, this.t % 6 < 3 ? '#fcfcfc' : '#3cbcfc', { scale: 2, align: 'center' });
  }
}
