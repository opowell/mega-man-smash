// Regular enemies. world.enemies holds these and the bosses (bosses.js).

import { drawSprite, silhouette } from './gfx.js';
import { GRAV, MAXFALL } from './hero.js';

export class Enemy {
  constructor(world, cx, bottom, w, h, hp) {
    this.world = world;
    this.w = w;
    this.h = h;
    this.x = cx - w / 2;
    this.y = bottom - h;
    this.hp = hp;
    this.maxHp = hp;
    this.vx = 0;
    this.vy = 0;
    this.t = 0;
    this.flash = 0;
    this.facing = -1;
    this.contact = 2;
    this.dead = false;
    this.active = false;
    this.gravity = true;
  }

  get cx() { return this.x + this.w / 2; }
  get cy() { return this.y + this.h / 2; }
  get player() { return this.world.player; }

  face() { this.facing = this.player.cx < this.cx ? -1 : 1; }

  // What a player shot does to this enemy: 'deflect', 'absorb', 'hit' or 'kill'.
  hitBy(b) { return this.damage(b.dmg); }

  damage(dmg) {
    this.hp -= dmg;
    this.flash = 8;
    if (this.hp <= 0) { this.die(); return 'kill'; }
    this.world.sfx('hit');
    return 'hit';
  }

  die() {
    this.dead = true;
    this.world.enemyKilled(this);
  }

  fall() {
    if (!this.gravity) return;
    this.vy = Math.min(this.vy + GRAV, MAXFALL);
    this.world.move(this);
    if (this.y > this.world.rows * 16 + 32) { this.dead = true; this.world.enemyKilled(this, true); }
  }

  update() {}

  drawSprite(ctx, cam, name, flip = false, pal = 'mega') {
    if (this.flash > 0) this.flash--;
    const cx = this.cx - cam.x;
    const bottom = this.y + this.h - cam.y;
    if (this.flash > 0 && (this.flash >> 1) % 2) {
      const s = silhouette(name, pal, flip, '#fcfcfc');
      ctx.drawImage(s, Math.round(cx - s.width / 2), Math.round(bottom - s.height));
    } else drawSprite(ctx, name, pal, cx, bottom, flip);
  }

  draw(ctx, cam) {}
}

// Hard hat: hides under its helmet (shots bounce off), peeks out to shoot.
class Met extends Enemy {
  constructor(world, cx, bottom) {
    super(world, cx, bottom, 14, 12, 1);
    this.state = 'hide';
    this.timer = 0;
  }
  update() {
    this.face();
    const dx = Math.abs(this.player.cx - this.cx);
    this.timer++;
    if (this.state === 'hide') {
      if (dx > 110) this.timer = Math.min(this.timer, 20);
      if (this.timer > 70) { this.state = 'open'; this.timer = 0; }
    } else {
      if (this.timer === 14) {
        for (const vy of [-0.8, 0, 0.8]) this.world.enemyShot(this.cx + this.facing * 6, this.y + 6, this.facing * 2, vy);
      }
      if (this.timer > 56) { this.state = 'hide'; this.timer = 0; }
    }
    this.fall();
  }
  hitBy(b) {
    if (this.state === 'hide' && !b.guard) return 'deflect';
    return this.damage(b.dmg);
  }
  draw(ctx, cam) { this.drawSprite(ctx, cam, this.state === 'hide' ? 'metHide' : 'metOpen', this.facing > 0); }
}

// Heli-bot: flies after you, bobbing.
class Heli extends Enemy {
  constructor(world, cx, bottom) {
    super(world, cx, bottom, 14, 12, 1);
    this.gravity = false;
    this.contact = 2;
  }
  update() {
    this.t++;
    const p = this.player;
    const dx = p.cx - this.cx;
    this.vx = Math.max(-1.1, Math.min(1.1, this.vx + Math.sign(dx) * 0.05));
    const ty = p.cy - 26 + Math.sin(this.t * 0.07) * 14 + (Math.abs(dx) < 30 ? 26 : 0);
    this.vy = Math.max(-1, Math.min(1, (ty - this.cy) * 0.04));
    this.x += this.vx;
    this.y = Math.max(20, this.y + this.vy);
  }
  draw(ctx, cam) { this.drawSprite(ctx, cam, (this.t >> 2) % 2 ? 'heli1' : 'heli2'); }
}

// Shield Joe: blocks shots from the front until it lowers its shield to fire.
class Joe extends Enemy {
  constructor(world, cx, bottom) {
    super(world, cx, bottom, 16, 20, 5);
    this.contact = 3;
  }
  update() {
    this.t++;
    this.face();
    const c = this.t % 150;
    this.open = c > 95 && c < 140;
    if (c === 104 || c === 122) this.world.enemyShot(this.cx + this.facing * 10, this.y + 9, this.facing * 2.5, 0);
    if (this.onGround && Math.abs(this.player.cx - this.cx) < 50 && this.t % 100 === 50) this.vy = -3.6;
    this.fall();
  }
  hitBy(b) {
    if (!this.open && !b.guard && Math.sign(b.vx) === -this.facing) return 'deflect';
    return this.damage(b.dmg);
  }
  draw(ctx, cam) { this.drawSprite(ctx, cam, this.open ? 'joeOpen' : 'joeGuard', this.facing < 0); }
}

// Crawler: paces back and forth on spiky legs.
class Crawler extends Enemy {
  constructor(world, cx, bottom) {
    super(world, cx, bottom, 16, 9, 2);
    this.contact = 3;
    this.facing = -1;
  }
  update() {
    this.t++;
    this.vx = 0.6 * this.facing;
    this.fall();
    if (this.hitWall) this.facing = -this.facing;
    else if (this.onGround) {
      const fx = this.facing > 0 ? this.x + this.w + 1 : this.x - 1;
      if (!this.world.standableAt(fx, this.y + this.h + 2)) this.facing = -this.facing;
    }
  }
  draw(ctx, cam) { this.drawSprite(ctx, cam, (this.t >> 3) % 2 ? 'crawl1' : 'crawl2', this.facing < 0); }
}

// Turret: sits still and fires aimed shots.
class Turret extends Enemy {
  constructor(world, cx, bottom) {
    super(world, cx, bottom, 16, 14, 3);
    this.gravity = false;
  }
  update() {
    this.t++;
    this.face();
    const p = this.player;
    const dx = p.cx - this.cx, dy = p.cy - this.cy;
    if (this.t % 110 === 60 && Math.abs(dx) < 180) {
      const d = Math.hypot(dx, dy) || 1;
      this.world.enemyShot(this.cx + this.facing * 8, this.y + 4, (dx / d) * 2, (dy / d) * 2);
    }
  }
  draw(ctx, cam) { this.drawSprite(ctx, cam, 'turret', this.facing < 0); }
}

// Hopper: crouches, then leaps at you.
class Hopper extends Enemy {
  constructor(world, cx, bottom) {
    super(world, cx, bottom, 16, 12, 3);
    this.contact = 3;
    this.timer = 0;
  }
  update() {
    this.face();
    if (this.onGround) {
      this.vx = 0;
      if (++this.timer > 55) {
        this.timer = 0;
        this.vy = -4.6;
        this.vx = Math.sign(this.player.cx - this.cx) * 1.3;
      }
    }
    this.fall();
  }
  draw(ctx, cam) { this.drawSprite(ctx, cam, this.onGround ? 'hopSit' : 'hopJump'); }
}

const TYPES = { m: Met, b: Heli, j: Joe, c: Crawler, t: Turret, h: Hopper };

export function makeEnemy(ch, world, cx, bottom) {
  const C = TYPES[ch];
  return C ? new C(world, cx, bottom) : null;
}

