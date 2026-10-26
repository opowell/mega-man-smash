// The tank: climbs walls, double jumps, speed jumps and load-up jumps.
// The Mega Man piloting it (world.active) picks the cannon.

import { HERO_PAL, rect } from './gfx.js';
import { Puff, Spark } from './effects.js';
import { MAXFALL } from './hero.js';

const DRIVE = 1.6;
const BOOST = 3.0;
const CANNON = {
  mega: { max: 4 },
  blaze: { max: 3 },
  gale: { max: 6 },
  volt: { max: 9 },
};

export class Tank {
  constructor(world, cx, bottom) {
    this.world = world;
    this.w = 22;
    this.h = 22;
    this.x = cx - this.w / 2;
    this.y = bottom - this.h;
    this.vx = 0;
    this.vy = 0;
    this.facing = 1;
    this.hp = world.id === 'village' ? 64 : 40;
    this.maxHp = this.hp;
    this.inv = 0;
    this.hurtT = 0;
    this.shootT = 0;
    this.anim = 0;
    this.tread = 0;
    this.wall = 0;        // -1 / 1 while clinging to a wall on that side
    this.usedDouble = false;
    this.speedJump = false;
    this.loading = false;
    this.load = 0;
    this.launched = false;
    this.isTank = true;
  }

  get cx() { return this.x + this.w / 2; }
  get cy() { return this.y + this.h / 2; }

  hurt(dmg, srcX) {
    if (this.inv > 0) return;
    this.hp = Math.max(0, this.hp - dmg);
    this.world.sfx('hurt');
    if (this.hp <= 0) { this.world.playerDown('hp'); return; }
    this.inv = 70;
    this.hurtT = 12;
    this.loading = false;
    if (!this.wall) this.vx = srcX < this.cx ? 1.5 : -1.5;
  }

  get smashing() { return !this.onGround && !this.wall && this.vy > 1.5; }

  update(inp) {
    const w = this.world;
    this.anim++;
    if (this.inv > 0) this.inv--;
    if (this.shootT > 0) this.shootT--;
    if (this.hurtT > 0) this.hurtT--;

    if (this.wall) { this.updateWall(inp); return; }

    const dir = this.hurtT > 0 ? 0 : (inp.held('right') ? 1 : 0) - (inp.held('left') ? 1 : 0);
    if (dir && !this.loading) this.facing = dir;
    const target = dir * (inp.held('boost') ? BOOST : DRIVE);

    if (this.onGround) {
      const accel = Math.abs(target) > Math.abs(this.vx) && Math.sign(target) === Math.sign(this.vx || target) ? 0.12 : 0.3;
      this.vx = approach(this.vx, this.loading ? 0 : target, accel);
      if (inp.held('boost') && dir && Math.abs(this.vx) > 2.4 && this.anim % 3 === 0) w.effect(new Puff(this.cx - this.facing * 12, this.y + this.h - 2, '#bcbcbc', -this.facing * 0.5, -0.2));
    } else if (this.speedJump) {
      if (dir && Math.sign(dir) !== Math.sign(this.vx)) this.vx = approach(this.vx, 0, 0.1);
    } else if (dir) {
      this.vx = approach(this.vx, target, 0.15);
    }
    this.tread += this.vx;

    // load-up jump: hold down, then hold jump; let go of jump to launch
    if (this.onGround && !this.loading && inp.held('down') && inp.pressed('jump')) {
      this.loading = true;
      this.load = 0;
    }
    if (this.loading) {
      if (inp.held('jump')) {
        this.load = Math.min(60, this.load + 1);
        if (this.anim % 6 === 0) w.sfx('loadUp');
        if (this.anim % 3 === 0) w.effect(new Spark(this.cx + (Math.random() * 24 - 12), this.y + this.h, this.load >= 60 ? '#fcfcfc' : '#b8f818', 0, -1 - Math.random() * 1.5, 16));
      } else {
        this.loading = false;
        if (this.load > 12) {
          this.vy = -4.6 - 4.2 * (this.load / 60);
          this.launched = true;
          w.sfx('launch');
          for (let i = 0; i < 6; i++) w.effect(new Puff(this.cx + (i - 2.5) * 5, this.y + this.h, '#bcbcbc', (i - 2.5) * 0.4, -0.2));
        } else {
          this.vy = -4.6;
          w.sfx('jump');
        }
      }
    } else if (inp.pressed('jump')) {
      if (this.onGround) {
        if (Math.abs(this.vx) >= 2.6) {
          this.vy = -3.4;
          this.speedJump = true;
          w.sfx('speedJump');
        } else {
          this.vy = -4.6;
          w.sfx('jump');
        }
      } else if (!this.usedDouble) {
        this.vy = -4.4;
        this.usedDouble = true;
        this.launched = false;
        w.sfx('doubleJump');
        w.effect(new Puff(this.cx - 6, this.y + this.h, '#fcfcfc', -0.6, 0.3));
        w.effect(new Puff(this.cx + 6, this.y + this.h, '#fcfcfc', 0.6, 0.3));
      }
    }
    if (this.vy < -1.5 && !inp.held('jump') && !this.launched) this.vy = -1.5;

    this.vy = Math.min(this.vy + (this.speedJump ? 0.1 : 0.25), MAXFALL);
    const wasGround = this.onGround;
    const fall = this.vy;
    w.move(this);
    if (this.speedJump && !this.onGround && this.anim % 2 === 0) w.effect(new Spark(this.cx - this.facing * 10, this.cy, '#fcbc3c', -this.facing, 0, 12));
    if (this.onGround) {
      if (!wasGround) {
        w.sfx('land');
        if (fall > 4) {
          w.shake(4);
          w.effect(new Puff(this.x, this.y + this.h, '#bcbcbc', -0.8, -0.2));
          w.effect(new Puff(this.x + this.w, this.y + this.h, '#bcbcbc', 0.8, -0.2));
        }
      }
      this.usedDouble = false;
      this.speedJump = false;
      this.launched = false;
    }

    // hold toward a wall to cling to it
    if (dir && this.hitWall === dir && !this.loading) {
      this.wall = dir;
      this.vx = 0;
      this.vy = 0;
      this.speedJump = false;
      this.launched = false;
      this.usedDouble = false;
      w.sfx('land');
    }

    if (inp.pressed('shoot') && !this.loading) this.fire();
  }

  updateWall(inp) {
    const w = this.world;
    const side = this.wall;
    if (inp.pressed('jump')) {
      this.wall = 0;
      this.vx = -side * 2.4;
      this.vy = -4.4;
      this.facing = -side;
      w.sfx('jump');
      w.effect(new Puff(side > 0 ? this.x + this.w : this.x, this.cy, '#bcbcbc', -side * 0.5, 0));
      return;
    }
    const dir = this.hurtT > 0 ? 0 : (inp.held('right') ? 1 : 0) - (inp.held('left') ? 1 : 0);
    if (dir === -side) {
      this.wall = 0;
      this.vx = -side;
      this.facing = -side;
      return;
    }
    const up = inp.held('up'), down = inp.held('down');
    this.vx = 0;
    this.vy = up ? -1.6 : down ? 1.6 : 0;
    this.tread += -this.vy * side;
    w.move(this);
    if (down && this.onGround) { this.wall = 0; this.facing = side; return; }
    if (!w.wallBeside(this, side)) {
      this.wall = 0;
      if (up) {
        // popped over the top of the wall
        this.vy = -2.6;
        this.vx = side * 1.6;
        this.facing = side;
      }
      return;
    }
    if (inp.pressed('shoot')) this.fire();
  }

  fire() {
    const w = this.world;
    const pilot = w.active;
    const own = w.bullets.filter((b) => b.owner === 'p' && b.src === 'tank').length;
    if (own >= CANNON[pilot].max) return;
    this.shootT = 10;
    let bx, by, ux, uy;
    if (this.wall) { bx = this.cx; by = this.y - 6; ux = 0; uy = -1; }
    else { bx = this.cx + this.facing * 17; by = this.y + 4; ux = this.facing; uy = 0; }
    // the rocket leaves the way the gun points: forward, or up when clinging to a wall
    const base = Math.atan2(uy, ux);
    const rocket = (da, o = {}) => w.rocket('tank', bx, by, base + da, o);
    switch (pilot) {
      case 'mega': rocket(0); break;
      case 'blaze': rocket(0, { dmg: 4, pierce: true, guard: true }); break;
      case 'gale': rocket(-0.12); rocket(0.12); break;
      case 'volt': for (const a of [-0.3, 0, 0.3]) rocket(a, { dmg: 2 }); break;
    }
    w.sfx('cannon');
    w.effect(new Puff(bx, by, '#fce4a0', ux * 0.5, uy * 0.5));
    if (this.onGround && !this.wall) this.vx -= this.facing * 0.4;
  }

  draw(ctx, cam) {
    if (this.inv > 0 && (this.inv >> 1) % 2) return;
    const pal = HERO_PAL[this.world.active];
    const flash = this.loading && this.load >= 60 && this.anim % 4 < 2;
    ctx.save();
    if (this.wall) {
      ctx.translate(Math.round(this.cx - cam.x), Math.round(this.cy - cam.y));
      if (this.wall > 0) ctx.rotate(-Math.PI / 2);
      else { ctx.rotate(Math.PI / 2); ctx.scale(-1, 1); }
      drawTankBody(ctx, -16, -12, pal, this.tread, flash, this.shootT, 0);
    } else {
      ctx.translate(Math.round(this.cx - cam.x), Math.round(this.y + this.h - cam.y));
      if (this.facing < 0) ctx.scale(-1, 1);
      const squash = this.loading ? Math.min(3, Math.floor(this.load / 15)) : 0;
      drawTankBody(ctx, -16, -24, pal, this.tread, flash, this.shootT, squash);
    }
    ctx.restore();
  }
}

function approach(v, target, step) {
  if (v < target) return Math.min(target, v + step);
  return Math.max(target, v - step);
}

// The tank, 32x24, facing right, with its top-left at (ox, oy).
export function drawTankBody(ctx, ox, oy, pal, tread = 0, flash = false, recoil = 0, squash = 0) {
  const r = (x, y, w, h, c) => rect(ctx, ox + x, oy + y, w, h, c);
  const D = flash ? '#fcfcfc' : pal.D;
  const L = flash ? '#fcfcfc' : pal.L;
  // treads
  r(1, 15, 30, 9, '#000000');
  r(2, 16, 28, 7, '#383838');
  for (const wx of [6, 12, 19, 25]) {
    r(wx - 2, 17, 5, 5, '#7c7c7c');
    r(wx - 1, 18, 3, 3, '#bcbcbc');
    r(wx, 19, 1, 1, '#383838');
  }
  const ph = ((Math.floor(tread) % 4) + 4) % 4;
  for (let x = 2 + ph; x < 30; x += 4) { r(x, 16, 2, 1, '#bcbcbc'); }
  for (let x = 29 - ph; x > 2; x -= 4) { r(x - 1, 22, 2, 1, '#bcbcbc'); }
  const s = squash;
  // hull
  r(2, 9 + s, 28, 7, '#000000');
  r(3, 10 + s, 26, 5, D);
  r(3, 10 + s, 26, 2, L);
  r(3, 13 + s, 26, 1, '#000000');
  r(26, 10 + s, 3, 3, '#fcfcfc');
  r(4, 14 + s, 2, 1, '#fce4a0');
  // turret with the pilot
  r(9, 2 + s, 14, 8, '#000000');
  r(10, 3 + s, 12, 6, '#bcbcbc');
  r(10, 3 + s, 12, 1, '#fcfcfc');
  r(13, 4 + s, 7, 4, '#000000');
  r(14, 4 + s, 4, 3, D);
  r(14, 4 + s, 2, 1, L);
  r(17, 5 + s, 2, 2, '#fcd8a8');
  // cannon
  const back = recoil > 6 ? 2 : 0;
  r(21 - back, 4 + s, 11, 4, '#000000');
  r(22 - back, 5 + s, 9, 2, '#7c7c7c');
  r(22 - back, 5 + s, 9, 1, '#bcbcbc');
  r(29 - back, 3 + s, 3, 6, '#000000');
  r(30 - back, 4 + s, 1, 4, '#bcbcbc');
}
