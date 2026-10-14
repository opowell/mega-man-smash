// Bosses: three guardians holding Mega Men captive, and the Evil Mech.
// Each drops into its arena, waits for its energy bar to fill (ready), then fights.

import { Enemy } from './enemies.js';
import { rect, blob } from './gfx.js';
import { Puff, Spark } from './effects.js';

class Boss extends Enemy {
  constructor(world, cx, bottom, w, h, hp, name) {
    super(world, cx, bottom, w, h, hp);
    this.isBoss = true;
    this.name = name;
    this.inv = 0;
    this.invTime = 10;
    this.state = 'idle';
    this.timer = 0;
    this.ready = false;
    this.entered = false;
    this.contact = 4;
    this.step = 0;
    this.arena = world.arena;
    this.y = this.arena.top > 0 ? this.arena.top - 4 : -h - 20;
  }
  get floor() { return this.arena.floor; }
  hitBy(b) {
    if (this.inv > 0 || !this.ready) return 'absorb';
    this.inv = this.invTime;
    return this.damage(b.dmg);
  }
  die() {
    this.dead = true;
    this.world.bossDefeated(this);
  }
  setState(s) { this.state = s; this.timer = 0; }
  nextIn(seq) { const s = seq[this.step++ % seq.length]; this.setState(s); }
  tick() {
    this.t++;
    this.timer++;
    if (this.inv > 0) this.inv--;
  }
  dropIn() {
    this.fall();
    if (this.onGround && !this.entered) {
      this.entered = true;
      this.world.shake(8);
      this.world.sfx('land');
    }
  }
  // Paint colours, or white while flashing from a hit.
  col(c) { return this.flash > 0 && (this.flash >> 1) % 2 ? '#fcfcfc' : c; }
  r(ctx, x, y, w, h, c) { rect(ctx, x, y, w, h, this.col(c)); }
}

export class Golem extends Boss {
  constructor(world, cx, bottom) {
    super(world, cx, bottom, 28, 30, 28, 'MAGMA GOLEM');
  }
  update() {
    this.tick();
    if (!this.ready) { this.dropIn(); return; }
    const p = this.player;
    switch (this.state) {
      case 'idle':
        this.vx = 0;
        this.face();
        if (this.timer > 34) this.nextIn(['jump', 'throw', 'jump', 'jump', 'throw']);
        break;
      case 'jump':
        if (this.timer === 1) {
          this.vy = -5.6;
          this.vx = Math.max(-2.2, Math.min(2.2, (p.cx - this.cx) / 44));
        }
        if (this.hitWall) this.vx = 0;
        if (this.timer > 5 && this.onGround) {
          this.vx = 0;
          this.world.shake(6);
          this.world.sfx('land');
          for (const d of [-1, 1]) this.world.enemyShot(this.cx + d * 14, this.y + this.h - 8, d * 1.6, -2.5, { kind: 'fireball', w: 8, h: 8, grav: 0.2 });
          this.setState('idle');
        }
        break;
      case 'throw':
        this.face();
        if ([12, 28, 44].includes(this.timer)) {
          const n = (this.timer - 12) / 16;
          this.world.enemyShot(this.cx + this.facing * 12, this.y + 4, this.facing * (1 + n * 0.7), -4.2, { kind: 'fireball', w: 8, h: 8, grav: 0.2 });
          this.world.sfx('flame');
        }
        if (this.timer > 64) this.setState('idle');
        break;
    }
    this.fall();
  }
  draw(ctx, cam) {
    if (this.flash > 0) this.flash--;
    const X = Math.round(this.x - cam.x), Y = Math.round(this.y - cam.y);
    const f = this.facing;
    const throwing = this.state === 'throw' && this.timer % 16 < 8;
    const r = (x, y, w, h, c) => this.r(ctx, X + x, Y + y, w, h, c);
    // legs
    r(3, 22, 9, 8, '#000000'); r(4, 23, 7, 7, '#581000');
    r(16, 22, 9, 8, '#000000'); r(17, 23, 7, 7, '#581000');
    // body
    r(0, 6, 28, 18, '#000000');
    r(1, 7, 26, 16, '#881400');
    r(2, 8, 10, 4, '#a83000');
    r(6, 12, 1, 6, '#fca044'); r(6, 17, 6, 1, '#fca044'); r(18, 9, 1, 8, '#fca044'); r(18, 13, 5, 1, '#fca044');
    r(12, 13, 4, 4, this.t % 20 < 10 ? '#fce4a0' : '#fca044');
    // head
    r(7, 0, 14, 9, '#000000');
    r(8, 1, 12, 7, '#a83000');
    r(f > 0 ? 14 : 9, 3, 4, 2, '#fce4a0');
    r(f > 0 ? 16 : 9, 3, 2, 2, '#f83800');
    // arms
    const ax = f > 0 ? 25 : -4;
    if (throwing) { r(ax, -4, 7, 12, '#000000'); r(ax + 1, -3, 5, 10, '#881400'); blob(ctx, X + ax + 3, Y - 5, 3, 3, '#fca044'); }
    else { r(ax, 9, 7, 13, '#000000'); r(ax + 1, 10, 5, 11, '#881400'); }
    const bx = f > 0 ? -4 : 25;
    r(bx, 9, 7, 13, '#000000'); r(bx + 1, 10, 5, 11, '#881400');
  }
}

export class Bird extends Boss {
  constructor(world, cx, bottom) {
    super(world, cx, bottom, 30, 20, 28, 'CYCLONE BIRD');
    this.gravity = false;
    this.hoverY = 52;
  }
  update() {
    this.tick();
    const base = this.arena.x + 128;
    if (!this.ready) {
      this.y = Math.min(this.hoverY, this.y + 1.5);
      if (this.y >= this.hoverY) this.entered = true;
      return;
    }
    const p = this.player;
    switch (this.state) {
      case 'idle':
      case 'hover': {
        const tx = base + Math.sin(this.t * 0.025) * 84;
        this.x += Math.max(-1.6, Math.min(1.6, tx - this.cx));
        this.y = this.hoverY + Math.sin(this.t * 0.12) * 5;
        this.facing = Math.cos(this.t * 0.025) > 0 ? 1 : -1;
        if (this.timer % 34 === 17) {
          this.world.enemyShot(this.cx, this.y + this.h, Math.sign(p.cx - this.cx) * 0.7, 2.2, { kind: 'feather', w: 6, h: 6 });
          this.world.sfx('wind');
        }
        if (this.timer > 190) {
          this.setState('dive');
          this.target = { x: p.cx, y: Math.min(this.floor - 12, p.cy) };
          this.world.sfx('smashDive');
        }
        break;
      }
      case 'dive': {
        const dx = this.target.x - this.cx, dy = this.target.y - this.cy;
        const d = Math.hypot(dx, dy);
        this.facing = dx > 0 ? 1 : -1;
        if (d < 4 || this.y + this.h >= this.floor - 1 || this.timer > 120) this.setState('rise');
        else { this.x += (dx / d) * 3.6; this.y += (dy / d) * 3.6; }
        break;
      }
      case 'rise':
        this.y -= 2;
        if (this.timer % 12 === 0) for (const vx of [-1.5, 1.5]) this.world.enemyShot(this.cx, this.cy, vx, 0.6, { kind: 'feather', w: 6, h: 6 });
        if (this.y <= this.hoverY) { this.y = this.hoverY; this.setState('hover'); }
        break;
    }
  }
  draw(ctx, cam) {
    if (this.flash > 0) this.flash--;
    const X = Math.round(this.x - cam.x), Y = Math.round(this.y - cam.y);
    const f = this.facing;
    const r = (x, y, w, h, c) => this.r(ctx, X + (f > 0 ? x : 30 - x - w), Y + y, w, h, c);
    const flap = this.state === 'dive' ? 2 : (this.t >> 2) % 3;
    // wings
    const wy = [-8, 0, 6][flap];
    r(2, 6 + wy * 0.5, 14, 6, '#000000'); r(3, 7 + wy * 0.5, 12, 4, '#fcfcfc');
    r(0, 4 + wy, 10, 5, '#000000'); r(1, 5 + wy, 8, 3, '#a4e4fc');
    // body
    r(8, 6, 18, 12, '#000000');
    r(9, 7, 16, 10, '#3cbcfc');
    r(10, 12, 12, 4, '#a4e4fc');
    // head and beak
    r(20, 2, 9, 9, '#000000'); r(21, 3, 7, 7, '#3cbcfc');
    r(24, 4, 2, 2, '#fcfcfc'); r(25, 5, 1, 1, '#000000');
    r(28, 6, 4, 3, '#f8b800');
    // crest and tail
    r(21, 0, 3, 3, '#0058f8'); r(0, 9, 9, 3, '#0058f8');
    // talons
    r(12, 18, 2, 3, '#f8b800'); r(18, 18, 2, 3, '#f8b800');
  }
}

export class Dynamo extends Boss {
  constructor(world, cx, bottom) {
    super(world, cx, bottom, 22, 30, 28, 'SPARK DYNAMO');
  }
  update() {
    this.tick();
    if (!this.ready) { this.dropIn(); return; }
    const p = this.player;
    this.hidden = false;
    switch (this.state) {
      case 'idle':
        this.vx = 0;
        this.face();
        if (this.timer > 30) this.nextIn(['spark', 'volley', 'teleport', 'spark', 'jump', 'teleport']);
        break;
      case 'spark':
        this.face();
        if (this.timer === 18) {
          this.world.enemyShot(this.cx + this.facing * 12, this.floor - 6, this.facing * 2.4, 0, { kind: 'gspark', w: 12, h: 12, ground: true, dmg: 4 });
          this.world.sfx('charged');
        }
        if (this.timer > 40) this.setState('idle');
        break;
      case 'volley':
        this.face();
        if ([10, 22, 34].includes(this.timer)) {
          const n = (this.timer - 22) / 12;
          const dx = p.cx - this.cx, dy = p.cy - this.cy;
          const a = Math.atan2(dy, dx) + n * 0.25;
          this.world.enemyShot(this.cx, this.y + 6, Math.cos(a) * 2.6, Math.sin(a) * 2.6, { kind: 'bolt' });
          this.world.sfx('spread');
        }
        if (this.timer > 50) this.setState('idle');
        break;
      case 'teleport':
        this.hidden = this.timer < 36 && this.timer % 4 < 2;
        this.inv = Math.max(this.inv, 2);
        if (this.timer === 18) {
          this.x = this.cx < this.arena.x + 128 ? this.arena.x + 216 - this.w : this.arena.x + 40;
          this.world.sfx('teleport');
        }
        if (this.timer > 36) this.setState('idle');
        break;
      case 'jump':
        if (this.timer === 1) { this.vy = -5.8; this.vx = this.facing * 1.4; }
        if (this.hitWall) this.vx = 0;
        if (this.timer === 22) {
          for (const vx of [-1.6, 0, 1.6]) this.world.enemyShot(this.cx, this.y + this.h, vx, 2.4, { kind: 'bolt' });
          this.world.sfx('spread');
        }
        if (this.timer > 5 && this.onGround) { this.vx = 0; this.setState('idle'); }
        break;
    }
    this.fall();
  }
  draw(ctx, cam) {
    if (this.flash > 0) this.flash--;
    if (this.hidden) return;
    const X = Math.round(this.x - cam.x), Y = Math.round(this.y - cam.y);
    const r = (x, y, w, h, c) => this.r(ctx, X + x, Y + y, w, h, c);
    // antenna spark
    r(10, -6, 2, 6, '#000000');
    if (this.t % 6 < 3) { r(7, -9, 8, 3, '#fcfcfc'); r(9, -11, 4, 7, '#fcbc3c'); }
    // head
    r(4, 0, 14, 10, '#000000'); r(5, 1, 12, 8, '#fcbc3c'); r(5, 1, 12, 2, '#fce4a0');
    r(this.facing > 0 ? 11 : 6, 4, 5, 3, '#000000'); r(this.facing > 0 ? 13 : 7, 5, 2, 1, '#3cbcfc');
    // coil body
    r(2, 10, 18, 14, '#000000');
    for (let i = 0; i < 4; i++) { r(3, 11 + i * 3, 16, 2, i % 2 ? '#c84c0c' : '#fcbc3c'); }
    // arms
    r(-3, 11, 5, 9, '#000000'); r(-2, 12, 3, 7, '#7c7c7c');
    r(20, 11, 5, 9, '#000000'); r(21, 12, 3, 7, '#7c7c7c');
    // legs
    r(4, 24, 6, 6, '#000000'); r(5, 25, 4, 5, '#c84c0c');
    r(12, 24, 6, 6, '#000000'); r(13, 25, 4, 5, '#c84c0c');
  }
}

export class Mech extends Boss {
  constructor(world, cx, bottom) {
    super(world, cx, bottom, 50, 60, 80, 'THE EVIL MECH');
    this.invTime = 18;
    this.contact = 6;
    if (this.arena.top === 0) this.y = -100;
  }
  get phase2() { return this.hp <= 40; }
  update() {
    this.tick();
    if (!this.ready) {
      this.fall();
      if (this.onGround && !this.entered) {
        this.entered = true;
        this.world.shake(18);
        this.world.sfx('smash');
        for (let i = 0; i < 8; i++) this.world.effect(new Puff(this.x + i * 7, this.floor - 2, '#bcbcbc', (i - 3.5) * 0.5, -0.3));
      }
      return;
    }
    const p = this.player;
    const spd = this.phase2 ? 1.45 : 1;
    if (this.phase2 && this.t % 9 === 0) this.world.effect(new Puff(this.cx + (Math.random() * 40 - 20), this.y + 10, '#585858', 0, -0.6));
    if (this.phase2 && this.t % 14 === 0) this.world.effect(new Spark(this.x + Math.random() * this.w, this.y + 14 + Math.random() * 30, '#fce4a0', Math.random() * 2 - 1, -1, 12));
    const seq = this.phase2 ? ['stomp', 'laser', 'missiles', 'walk', 'barrage', 'laser', 'stomp', 'walk'] : ['walk', 'barrage', 'walk', 'stomp', 'missiles'];
    switch (this.state) {
      case 'idle':
        this.vx = 0;
        this.face();
        if (this.timer > (this.phase2 ? 18 : 32)) this.nextIn(seq);
        break;
      case 'walk':
        if (this.timer % 30 === 1) this.face();
        this.vx = this.facing * 0.7 * spd;
        if (this.timer % 20 === 0) { this.world.sfx('land'); this.world.shake(2); }
        if (this.hitWall) this.vx = 0;
        if (this.timer > 90) this.setState('idle');
        break;
      case 'barrage':
        this.vx = 0;
        this.face();
        for (let k = 0; k < 4; k++) {
          if (this.timer === 14 + k * Math.round(14 / spd)) {
            const sx = this.cx + this.facing * 22, sy = this.y + 14;
            const tx = p.cx + (k - 1.5) * 26, T = 52, g = 0.15;
            const vy = (this.floor - 6 - sy - 0.5 * g * T * T) / T;
            this.world.enemyShot(sx, sy, (tx - sx) / T, vy, { kind: 'mshell', w: 8, h: 8, grav: g, dmg: 4 });
            this.world.sfx('cannon');
          }
        }
        if (this.timer > 90) this.setState('idle');
        break;
      case 'stomp':
        if (this.timer < 22) { this.vx = 0; this.crouch = 4; }
        if (this.timer === 22) {
          this.crouch = 0;
          this.vy = -6.6;
          this.vx = Math.max(-2.6, Math.min(2.6, (p.cx - this.cx) / 54));
        }
        if (this.hitWall) this.vx = 0;
        if (this.timer > 26 && this.onGround) {
          this.vx = 0;
          this.world.shake(14);
          this.world.sfx('smash');
          for (const d of [-1, 1]) this.world.enemyShot(this.cx + d * 26, this.floor - 6, d * 2.6 * spd, 0, { kind: 'shock', w: 14, h: 12, ground: true, dmg: 4 });
          this.setState('idle');
        }
        break;
      case 'missiles':
        this.vx = 0;
        if (this.timer === 14 || this.timer === 34 || (this.phase2 && this.timer === 54)) {
          const sx = this.timer === 34 ? this.x + this.w + 2 : this.x - 2;
          this.world.enemyShot(sx, this.y + 8, (sx < this.cx ? -1 : 1) * 0.8, -2.6, { kind: 'missile', w: 10, h: 8, dmg: 4, hp: 1, homing: true, life: 280 });
          this.world.sfx('launch');
        }
        if (this.timer > 80) this.setState('idle');
        break;
      case 'laser':
        this.vx = 0;
        if (this.timer === 1) {
          this.face();
          this.laserY = Math.max(this.floor - 60, Math.min(this.floor - 8, p.cy));
        }
        if (this.timer < 50 && this.timer % 10 === 1) this.world.sfx('warn');
        if (this.timer === 50) {
          const ex = this.cx + this.facing * 26;
          const x0 = this.facing > 0 ? ex : this.arena.x + 16;
          const x1 = this.facing > 0 ? this.arena.x + 240 : ex;
          this.world.enemyShot(x0, this.laserY - 4, 0, 0, { kind: 'laser', w: x1 - x0, h: 8, dmg: 6, life: 34, persist: true, fixed: true });
          this.world.sfx('laser');
          this.world.shake(6);
        }
        if (this.timer > 92) this.setState('idle');
        break;
    }
    this.fall();
  }
  draw(ctx, cam) {
    if (this.flash > 0) this.flash--;
    const X = Math.round(this.x - cam.x), Y = Math.round(this.y - cam.y) + (this.crouch || 0);
    const r = (x, y, w, h, c) => this.r(ctx, X + x, Y + y, w, h, c);
    const f = this.facing;
    const walking = this.state === 'walk';
    const lift = walking ? Math.round(Math.sin(this.t * 0.2) * 3) : 0;
    const bottom = 60 - (this.crouch || 0);
    // legs
    for (const [lx, l] of [[6, lift], [32, -lift]]) {
      const ly = 40 - Math.max(0, l);
      r(lx, ly, 12, bottom - ly - 5, '#000000');
      r(lx + 1, ly + 1, 10, bottom - ly - 6, '#585858');
      r(lx + 2, ly + 1, 3, bottom - ly - 6, '#7c7c7c');
      r(lx - 3, bottom - 6 - Math.max(0, l), 18, 6, '#000000');
      r(lx - 2, bottom - 5 - Math.max(0, l), 16, 4, '#881400');
    }
    // torso
    r(0, 14, 50, 30, '#000000');
    r(1, 15, 48, 28, '#881400');
    r(2, 16, 46, 4, '#d82800');
    r(1, 30, 48, 2, '#581000');
    for (const rx of [4, 44]) for (const ry of [22, 36]) r(rx, ry, 2, 2, '#fca044');
    // core
    const pulse = (this.t >> 3) % 2;
    r(19, 22, 12, 12, '#000000');
    r(20, 23, 10, 10, this.phase2 ? (pulse ? '#fcfcfc' : '#f83800') : (pulse ? '#fca044' : '#e45c10'));
    r(22, 25, 4, 4, '#fce4a0');
    // head
    r(14, 0, 22, 16, '#000000');
    r(15, 1, 20, 14, '#585858');
    r(15, 1, 20, 3, '#7c7c7c');
    const charging = this.state === 'laser' && this.timer < 50;
    const eye = charging ? (this.timer % 6 < 3 ? '#fcfcfc' : '#fca044') : '#f83800';
    r(f > 0 ? 24 : 16, 6, 10, 5, '#000000');
    r(f > 0 ? 25 : 17, 7, 8, 3, eye);
    r(23, -4, 4, 5, '#000000'); r(24, -6, 2, 3, '#f83800');
    // shoulder cannons
    for (const [sx, dir] of [[-6, -1], [48, 1]]) {
      r(sx, 12, 10, 12, '#000000');
      r(sx + 1, 13, 8, 10, '#7c7c7c');
      r(sx + 1, 13, 8, 2, '#bcbcbc');
      r(sx + 3, 9, 4, 4, '#000000');
      r(sx + 4, 10, 2, 3, '#d82800');
      if (dir === f) { r(f > 0 ? sx + 9 : sx - 8, 15, 9, 5, '#000000'); r(f > 0 ? sx + 9 : sx - 7, 16, 8, 3, '#585858'); }
    }
    // laser warning line
    if (charging && this.laserY !== undefined && this.timer % 4 < 2) {
      const ex = this.cx + f * 26;
      const x0 = f > 0 ? ex : this.arena.x + 16, x1 = f > 0 ? this.arena.x + 240 : ex;
      rect(ctx, x0 - cam.x, this.laserY - cam.y, x1 - x0, 1, '#f83800');
    }
  }
}

const BOSSES = { golem: Golem, bird: Bird, dynamo: Dynamo, mech: Mech };

export function makeBoss(kind, world, cx, bottom) {
  return new BOSSES[kind](world, cx, bottom);
}
