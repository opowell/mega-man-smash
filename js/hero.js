// A Mega Man on foot. Which one is world.active: they share these moves and
// differ in speed, jump and weapon (see HEROES in levels.js).

import { HEROES } from './levels.js';
import { drawSprite, sprite, silhouette, rect, HERO_PAL } from './gfx.js';
import { Spark, Ring } from './effects.js';

export const GRAV = 0.25;
export const MAXFALL = 7;
// With the Life: jumps in the air before landing (double, double, double, double, double jump).
const AIR_JUMPS = 5;

export class Hero {
  constructor(world, cx, bottom) {
    this.world = world;
    this.w = 12;
    this.h = 20;
    this.x = cx - this.w / 2;
    this.y = bottom - this.h;
    this.vx = 0;
    this.vy = 0;
    this.facing = 1;
    this.onGround = false;
    this.ladder = false;
    this.inv = 0;
    this.hurtT = 0;
    this.shootT = 0;
    this.charge = 0;
    this.anim = 0;
    this.smashing = false;
    this.landT = 0;
    this.airJumps = 0;
    this.sky = false;          // thrown up by a Slam Bash boom: Down + X shoots down
    this.pendingLaunch = false;
    this.armorT = 0;
    this.downCool = 0;
  }

  get cx() { return this.x + this.w / 2; }
  get cy() { return this.y + this.h / 2; }
  get def() { return HEROES[this.world.active]; }
  get hp() { return this.world.party[this.world.active]; }
  set hp(v) { this.world.party[this.world.active] = Math.max(0, Math.min(28, v)); }
  get maxHp() { return 28; }
  // The Life (the blue box) turns the Smash Punch into the Super Mega Man Slam Bash.
  get hasLife() { return !!this.world.game.save.life; }
  get shielded() { return this.smashing || this.pendingLaunch || this.armorT > 0; }

  hurt(dmg, srcX) {
    if (this.inv > 0 || this.shielded) return;
    this.hp -= dmg;
    this.world.sfx('hurt');
    if (this.hp <= 0) { this.world.playerDown('hp'); return; }
    this.hurtT = 20;
    this.inv = 90;
    this.facing = srcX < this.cx ? -1 : 1;
    this.ladder = false;
    this.charge = 0;
  }

  update(inp) {
    const w = this.world;
    const d = this.def;
    this.anim++;
    if (this.inv > 0) this.inv--;
    if (this.shootT > 0) this.shootT--;
    if (this.armorT > 0) this.armorT--;
    if (this.downCool > 0) this.downCool--;

    if (this.hurtT > 0) {
      this.hurtT--;
      this.vx = -this.facing * 0.6;
      this.vy = Math.min(this.vy + GRAV, MAXFALL);
      w.move(this);
      return;
    }

    if (this.smashing) {
      this.vx = 0;
      this.vy = this.super ? 8 : 7;
      w.move(this);
      const colors = this.super ? ['#3cbcfc', '#fcfcfc'] : ['#b8f818', '#58f898'];
      if (this.anim % 2 === 0 || this.super) w.effect(new Spark(this.cx + (Math.random() * 16 - 8), this.y + Math.random() * 10, colors[Math.random() < 0.5 ? 0 : 1], 0, -1.5, 14));
      if (this.onGround) {
        if (this.super) { this.slamLand(false); return; }
        this.smashing = false;
        this.landT = 14;
        w.smashQuake(this);
      }
      return;
    }
    if (this.landT > 0) {
      this.landT--;
      this.vx = 0;
      this.vy = Math.min(this.vy + GRAV, MAXFALL);
      w.move(this);
      if (this.landT === 0 && this.pendingLaunch) this.launch();
      return;
    }
    if (this.onGround) {
      this.sky = false;
      this.airJumps = AIR_JUMPS;
    }

    if (this.ladder) { this.updateLadder(inp); return; }

    const dir = (inp.held('right') ? 1 : 0) - (inp.held('left') ? 1 : 0);
    if (dir) this.facing = dir;
    this.vx = dir * d.speed;

    // grab a ladder: up from in front of one, or down from the top of one
    if (inp.held('up') && !inp.held('down')) {
      const lx = w.ladderX(this.cx, this.cy) ?? w.ladderX(this.cx, this.y + this.h - 2);
      if (lx !== null) { this.startLadder(lx); return; }
    }
    if (inp.held('down') && this.onGround && !inp.held('shoot')) {
      const lx = w.ladderX(this.cx, this.y + this.h + 2);
      if (lx !== null) { this.startLadder(lx); this.y += 6; return; }
    }

    if (inp.pressed('jump') && this.onGround) {
      this.vy = d.jump;
      w.sfx('jump');
    } else if (inp.pressed('jump') && this.hasLife && this.airJumps > 0 && !(this.sky && inp.held('down'))) {
      this.airJumps--;
      this.vy = d.jump;
      w.sfx('doubleJump');
      w.effect(new Ring(this.cx, this.y + this.h, '#3cbcfc'));
    }
    if (this.vy < -1 && !inp.held('jump') && !this.sky) this.vy = -1;
    this.vy = Math.min(this.vy + GRAV, MAXFALL);
    // the top of the screen is as high as a Mega Man can fly
    if (this.hasLife && this.y < 0 && this.vy < 0) { this.y = 0; this.vy = 0; }
    this.gliding = false;
    if (d.glide && inp.held('jump') && this.vy > 0.8) {
      this.vy = 0.8;
      this.gliding = true;
    }

    const wasGround = this.onGround;
    w.move(this);
    if (this.onGround && !wasGround) w.sfx('land');

    // Smash Punch: in the air, hold down and press shoot. With the Life it is
    // the Super Mega Man Slam Bash, and once its boom has thrown you up,
    // Down + Shoot fires downward instead and Down + Jump slams again.
    const slamKey = this.sky ? inp.pressed('jump') : inp.pressed('shoot');
    if (!this.onGround && inp.held('down') && slamKey) {
      this.smashing = true;
      this.super = this.hasLife;
      this.sky = false;
      this.smashHits = new Set();
      this.charge = 0;
      this.vy = 7;
      w.sfx('smashDive');
      return;
    }
    // hold Up to shoot up; up high after a Slam Bash, hold Down to shoot down
    this.aim = this.sky && inp.held('down') ? 1 : inp.held('up') ? -1 : 0;
    this.handleShoot(inp);
  }

  // A Slam Bash hit the ground (or a boss): BOOM, and up the Mega Man goes.
  slamLand(midair) {
    this.smashing = false;
    this.world.slamBoom(this);
    this.pendingLaunch = true;
    if (midair) this.launch();
    else this.landT = 10;
  }

  launch() {
    this.pendingLaunch = false;
    this.landT = 0;
    this.vy = -9.2;
    this.onGround = false;
    this.sky = true;
    this.airJumps = AIR_JUMPS;
    this.armorT = 30;
    this.world.sfx('launch');
  }

  startLadder(lx) {
    this.ladder = true;
    this.aim = 0;
    this.x = lx - this.w / 2;
    this.vx = 0;
    this.vy = 0;
    this.charge = 0;
  }

  updateLadder(inp) {
    const w = this.world;
    if (inp.pressed('jump')) { this.ladder = false; this.vy = 0; return; }
    const dir = (inp.held('right') ? 1 : 0) - (inp.held('left') ? 1 : 0);
    if (dir) this.facing = dir;
    const up = inp.held('up'), down = inp.held('down');
    this.vy = this.shootT > 0 ? 0 : up ? -1.3 : down ? 1.3 : 0;
    if (this.vy) this.anim++;
    this.y += this.vy;
    const feet = this.y + this.h;
    if (this.vy < 0 && w.ladderX(this.cx, feet - 1) === null) {
      // climbed off the top: stand on it
      this.y = Math.round(feet / 16) * 16 - this.h;
      this.ladder = false;
      this.onGround = true;
      return;
    }
    if (this.vy > 0) {
      if (w.solidAt(this.cx, feet)) {
        this.y = Math.floor(feet / 16) * 16 - this.h;
        this.ladder = false;
        this.onGround = true;
        return;
      }
      if (w.ladderX(this.cx, this.cy) === null && w.ladderX(this.cx, feet - 1) === null) { this.ladder = false; return; }
    }
    this.handleShoot(inp);
  }

  handleShoot(inp) {
    const d = this.def;
    if (inp.pressed('shoot')) this.fire(false);
    if (d.shot === 'buster') {
      if (inp.held('shoot')) {
        this.charge++;
        if (this.charge === 24) this.world.sfx('charge');
        if (this.charge === 60) this.world.sfx('chargeFull');
      } else {
        if (this.charge >= 60) this.fire(true);
        this.charge = 0;
      }
    } else this.charge = 0;
  }

  fire(charged) {
    if (this.aim) { this.fireVertical(this.aim, charged); return; }
    const w = this.world;
    const d = this.def;
    const own = w.bullets.filter((b) => b.owner === 'p' && b.src === 'hero').length;
    if (!charged && own >= d.max) return;
    const dir = this.facing;
    const bx = this.cx + dir * 11;
    const by = this.y + 10;
    this.shootT = 16;
    this.shotAim = 0;
    const shot = (o) => w.playerShot({ src: 'hero', x: bx - o.w / 2, y: by - o.h / 2, ...o });
    switch (charged ? 'charged' : d.shot) {
      case 'buster':
        shot({ w: 6, h: 4, vx: 4.5 * dir, vy: 0, dmg: 1, kind: 'pellet' });
        w.sfx('shoot');
        break;
      case 'charged':
        shot({ w: 16, h: 12, vx: 4.5 * dir, vy: 0, dmg: 4, pierce: true, guard: true, kind: 'charged' });
        w.sfx('charged');
        break;
      case 'flame':
        shot({ w: 12, h: 8, vx: 3.5 * dir, vy: 0, dmg: 2, pierce: true, guard: true, life: 45, kind: 'flame' });
        w.sfx('flame');
        break;
      case 'wind':
        shot({ w: 10, h: 8, vx: 5.5 * dir, vy: 0, dmg: 1, kind: 'wind' });
        w.sfx('wind');
        break;
      case 'spread':
        for (const a of [-0.28, 0, 0.28]) shot({ w: 5, h: 5, vx: Math.cos(a) * 4.2 * dir, vy: Math.sin(a) * 4.2, dmg: 1, kind: 'spark' });
        w.sfx('spread');
        break;
    }
  }

  // Shooting straight up (dir -1) or down (dir 1). Down only happens up in
  // the air after a Slam Bash, and every shot down pushes the Mega Man up.
  fireVertical(dir, charged) {
    const w = this.world;
    if (dir > 0) {
      if (!charged && this.downCool > 0) return;
      this.downCool = 7;
    } else {
      const own = w.bullets.filter((b) => b.owner === 'p' && b.src === 'hero').length;
      if (!charged && own >= this.def.max) return;
    }
    const bx = this.cx, by = dir > 0 ? this.y + this.h + 2 : this.y - 4;
    this.shootT = 16;
    this.shotAim = dir;
    const shot = (o) => w.playerShot({ src: 'hero', x: bx - o.w / 2, y: by - o.h / 2, vx: 0, ...o, vy: o.vy * dir });
    switch (charged ? 'charged' : this.def.shot) {
      case 'buster': shot({ w: 4, h: 6, vy: 5, dmg: 1, kind: 'pellet' }); w.sfx('shoot'); break;
      case 'charged': shot({ w: 12, h: 16, vy: 5, dmg: 4, pierce: true, guard: true, kind: 'charged' }); w.sfx('charged'); break;
      case 'flame': shot({ w: 8, h: 12, vy: 4, dmg: 2, pierce: true, guard: true, life: 45, kind: 'flame' }); w.sfx('flame'); break;
      case 'wind': shot({ w: 8, h: 10, vy: 5.5, dmg: 1, kind: 'wind' }); w.sfx('wind'); break;
      case 'spread':
        for (const a of [-0.28, 0, 0.28]) shot({ w: 5, h: 5, vx: Math.sin(a) * 4.2, vy: Math.cos(a) * 4.2, dmg: 1, kind: 'spark' });
        w.sfx('spread');
        break;
    }
    if (dir > 0) {
      this.vy = Math.min(this.vy, charged ? -6 : -3.6);
      w.effect(new Spark(bx - 4, by, '#fcfcfc', -0.6, 1, 10));
      w.effect(new Spark(bx + 2, by, '#3cbcfc', 0.6, 1, 10));
    }
  }

  pose() {
    if (this.smashing || this.landT > 0) return 'heroSmash';
    if (this.hurtT > 0) return 'heroHurt';
    if (this.ladder) return this.shootT > 0 ? 'heroJump' : 'heroClimb';
    if (!this.onGround) return 'heroJump';
    if (this.vx !== 0) return (this.anim >> 3) % 2 ? 'heroRun2' : 'heroRun1';
    return 'heroStand';
  }

  draw(ctx, cam) {
    if (this.inv > 0 && this.hurtT === 0 && (this.inv >> 1) % 2) return;
    const name = this.pose();
    let pal = this.world.active;
    if (this.charge >= 60 && (this.anim >> 1) % 2) pal = 'charge';
    else if (this.charge >= 24 && (this.anim >> 3) % 2) pal = 'charge';
    const flip = name === 'heroClimb' ? (this.anim >> 3) % 2 === 1 : this.facing < 0;
    const cx = Math.round(this.cx - cam.x);
    const bottom = Math.round(this.y + this.h - cam.y);
    if (this.smashing || this.landT > 0) drawGlow(ctx, name, pal, cx, bottom, flip, this.anim, this.super && this.hasLife);
    else if (this.armorT > 0 || (this.sky && this.anim % 8 < 2)) drawGlow(ctx, name, pal, cx, bottom, flip, this.anim, true);
    drawSprite(ctx, name, pal, cx, bottom, flip);
    if (this.shootT > 0 && name !== 'heroSmash' && name !== 'heroHurt') {
      if (this.shotAim) {
        // the buster pointed straight up, or straight down
        const ax = cx + (this.facing > 0 ? 2 : -7);
        const ay = this.shotAim < 0 ? bottom - 28 : bottom - 6;
        rect(ctx, ax, ay, 5, 10, '#000000');
        rect(ctx, ax + 1, ay + 1, 3, 8, HERO_PAL[pal].L);
        rect(ctx, ax + 1, this.shotAim < 0 ? ay + 1 : ay + 7, 3, 2, HERO_PAL[pal].D);
      } else {
        const arm = sprite('arm', pal, this.facing < 0);
        ctx.drawImage(arm, this.facing > 0 ? cx + 3 : cx - 9, bottom - 11);
      }
    }
    if (this.gliding && this.anim % 6 < 3) {
      rect(ctx, cx - 9, bottom - 14, 2, 6, '#fcfcfc');
      rect(ctx, cx + 7, bottom - 14, 2, 6, '#fcfcfc');
    }
  }
}

// A flickering aura behind a sprite: green Smash energy, or blue for the Life.
export function drawGlow(ctx, name, pal, cx, bottom, flip, t, blue = false) {
  const colors = blue ? ['#3cbcfc', '#fcfcfc'] : ['#58f898', '#b8f818'];
  const sil = silhouette(name, pal, flip, colors[t % 4 < 2 ? 0 : 1]);
  const x = Math.round(cx - sil.width / 2), y = Math.round(bottom - sil.height);
  for (const [dx, dy] of [[-2, 0], [2, 0], [0, -2], [0, 2], [-1, -1], [1, -1], [-1, 1], [1, 1]]) ctx.drawImage(sil, x + dx, y + dy);
}

