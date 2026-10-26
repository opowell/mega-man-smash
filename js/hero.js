// A Mega Man on foot. Which one is world.active: they share these moves and
// differ in speed, jump and weapon (see HEROES in levels.js).

import { HEROES } from './levels.js';
import { drawSprite, sprite, silhouette, rect, HERO_PAL } from './gfx.js';
import { Spark, Ring, Puff } from './effects.js';

export const GRAV = 0.25;
export const MAXFALL = 7;
// With the Life: jumps in the air before landing (double, double, double, double, double jump).
const AIR_JUMPS = 5;
// The rocket thrusts for 13 seconds (60 steps a second).
export const ROCKET_TIME = 13 * 60;
const SPRINT = 1.8;
// The rocket booster (wood + dynamite + bomb): everything on foot is this much faster.
const BOOSTER = 1.4;
const WALL_SLIDE = 1.2;

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
    this.rocketT = 0;          // steps of rocket left
    this.rescue = false;       // the rocket ran out: one air jump to save yourself, even without the Life
    this.sprinting = false;
    this.kickT = 0;            // steps left of a wall jump's push away from the wall
    this.kickDir = 0;
    this.wallSide = 0;         // -1 / 1 while sliding down a wall on that side
    this.swingT = 0;           // steps left of a pickaxe swing
    this.rocketCool = 0;
    this.shotLock = false;     // a swing or a rocket used this press of Shoot: no charging
  }

  get cx() { return this.x + this.w / 2; }
  get cy() { return this.y + this.h / 2; }
  get def() { return HEROES[this.world.active]; }
  get hp() { return this.world.party[this.world.active]; }
  set hp(v) { this.world.party[this.world.active] = Math.max(0, Math.min(28, v)); }
  get maxHp() { return 28; }
  // The Life (the blue box) turns the Smash Punch into the Super Mega Man Slam Bash.
  get hasBooster() { return !!this.world.game.save.booster; }
  get hasLife() { return !!this.world.game.save.life; }
  get hasPickaxe() { return !!this.world.game.save.pickaxe; }
  get hasLauncher() { return !!this.world.game.save.launcher; }
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
    if (this.swingT > 0) this.swingT--;
    if (this.rocketCool > 0) this.rocketCool--;
    this.sprinting = false;

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
      this.rescue = false;
      this.airJumps = AIR_JUMPS;
    }

    if (this.ladder) { this.updateLadder(inp); return; }

    const dir = (inp.held('right') ? 1 : 0) - (inp.held('left') ? 1 : 0);
    if (dir) this.facing = dir;
    this.sprinting = !!dir && inp.held('boost');
    const fast = (this.sprinting ? SPRINT : 1) * (this.hasBooster ? BOOSTER : 1);
    this.vx = dir * d.speed * fast;
    if (this.kickT > 0) { this.kickT--; this.vx = this.kickDir * d.speed * fast * 1.2; }
    if (this.hasBooster && dir && this.onGround && this.anim % 3 === 0) {
      w.effect(new Spark(this.cx - dir * 7, this.y + this.h - 6, Math.random() < 0.5 ? '#f87858' : '#fcd838', -dir * 1.2, 0, 8));
    }
    // in the air against a wall you are holding toward: slide down it, and jump off it
    this.wallSide = !this.onGround && dir && this.kickT === 0 && this.rocketT <= 0 && this.vy >= 0 && w.wallBeside(this, dir) ? dir : 0;
    if (this.sprinting && this.onGround && this.anim % 4 === 0) w.effect(new Puff(this.cx - dir * 6, this.y + this.h - 2, '#bcbcbc', -dir * 0.4, -0.2));

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
    } else if (inp.pressed('jump') && this.wallSide) {
      // wall jump: up and away from the wall, as many times as you like
      this.kickDir = -this.wallSide;
      this.kickT = 10;
      this.facing = this.kickDir;
      this.vx = this.kickDir * d.speed * fast * 1.2;
      this.vy = d.jump;
      this.wallSide = 0;
      w.sfx('jump');
      w.effect(new Puff(this.cx - this.kickDir * 6, this.cy, '#fcfcfc', this.kickDir * 0.3, -0.2));
    } else if (inp.pressed('jump') && this.rocketT <= 0 && (this.hasLife || this.rescue) && this.airJumps > 0 && !(this.sky && inp.held('down'))) {
      this.airJumps--;
      this.vy = d.jump;
      w.sfx('doubleJump');
      w.effect(new Ring(this.cx, this.y + this.h, '#3cbcfc'));
    }
    if (this.vy < -1 && !inp.held('jump') && !this.sky && this.rocketT <= 0) this.vy = -1;
    this.vy = Math.min(this.vy + GRAV, MAXFALL);
    if (this.wallSide && this.vy > WALL_SLIDE) {
      this.vy = WALL_SLIDE;
      if (this.anim % 5 === 0) w.effect(new Puff(this.cx + this.wallSide * 6, this.y + this.h - 4, '#bcbcbc', 0, 0.3));
    }
    if (this.rocketT > 0) this.rocketStep(inp);
    // the top of the screen is as high as a Mega Man can fly
    if ((this.hasLife || this.rocketT > 0) && this.y < 0 && this.vy < 0) { this.y = 0; this.vy = 0; }
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

  // Found the rocket: hold Jump to fly up for 13 seconds.
  getRocket() {
    this.rocketT = ROCKET_TIME;
    this.rescue = false;
    this.world.sfx('launch');
  }

  rocketStep(inp) {
    const w = this.world;
    this.rocketT--;
    if (inp.held('jump')) {
      this.vy = Math.max(this.vy - 0.55, -2.8);
      this.onGround = false;
      if (this.rocketT % 3 === 0) {
        w.effect(new Spark(this.cx - 3 + Math.random() * 6, this.y + this.h, Math.random() < 0.5 ? '#f87858' : '#fcd838', 0, 1.6, 12));
      }
      if (this.rocketT % 12 === 0) w.sfx('flame');
    }
    if (this.rocketT === 0) {
      // out of fuel: a double jump can still save you
      this.rescue = true;
      if (!this.hasLife) this.airJumps = 1;
      else this.airJumps = Math.max(this.airJumps, 1);
      w.sfx('chargeFull');
    }
  }

  // Landed on an enemy's head: bounce, and a jump to save yourself with.
  stompBounce() {
    this.vy = -4.4;
    this.onGround = false;
    this.rescue = true;
    this.airJumps = Math.max(this.airJumps, 1);
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
    if (!inp.held('shoot')) this.shotLock = false;
    if (inp.pressed('shoot')) {
      if (this.onGround && !this.ladder && inp.held('down') && this.hasPickaxe) {
        // Down + X on the ground: swing the pickaxe
        this.shotLock = true;
        this.charge = 0;
        this.world.swing(this);
        return;
      }
      if (this.hasLauncher && inp.held('boost')) {
        // Boost + X: a rocket
        this.shotLock = true;
        this.charge = 0;
        this.fireRocket();
        return;
      }
      this.fire(false);
    }
    if (this.shotLock) { this.charge = 0; return; }
    // every Mega Man can hold shoot to charge a bigger shot
    if (inp.held('shoot')) {
      this.charge++;
      if (this.charge === 24) this.world.sfx('charge');
      if (this.charge === 60) this.world.sfx('chargeFull');
    } else {
      if (this.charge >= 60) this.fire(true);
      this.charge = 0;
    }
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
    if (w.inTank) { w.rocket('hero', bx, by, dir > 0 ? 0 : Math.PI, charged ? { dmg: 6, pierce: true, guard: true } : {}); return; }
    const shot = (o) => w.playerShot({ src: 'hero', x: bx - o.w / 2, y: by - o.h / 2, ...o });
    switch (charged && d.shot === 'buster' ? 'charged' : d.shot) {
      case 'buster':
        shot({ w: 6, h: 4, vx: 4.5 * dir, vy: 0, dmg: 1, kind: 'pellet' });
        w.sfx('shoot');
        break;
      case 'charged':
        shot({ w: 16, h: 12, vx: 4.5 * dir, vy: 0, dmg: 4, pierce: true, guard: true, kind: 'charged' });
        w.sfx('charged');
        break;
      case 'flame':
        if (charged) shot({ w: 22, h: 16, vx: 3.5 * dir, vy: 0, dmg: 4, pierce: true, guard: true, life: 55, kind: 'flame' });
        else shot({ w: 12, h: 8, vx: 3.5 * dir, vy: 0, dmg: 2, pierce: true, guard: true, life: 45, kind: 'flame' });
        w.sfx(charged ? 'charged' : 'flame');
        break;
      case 'wind':
        if (charged) shot({ w: 18, h: 14, vx: 5.5 * dir, vy: 0, dmg: 4, pierce: true, guard: true, kind: 'wind' });
        else shot({ w: 10, h: 8, vx: 5.5 * dir, vy: 0, dmg: 1, kind: 'wind' });
        w.sfx(charged ? 'charged' : 'wind');
        break;
      case 'spread':
        for (const a of charged ? [-0.56, -0.28, 0, 0.28, 0.56] : [-0.28, 0, 0.28]) {
          shot({ w: charged ? 8 : 5, h: charged ? 8 : 5, vx: Math.cos(a) * 4.2 * dir, vy: Math.sin(a) * 4.2, dmg: charged ? 3 : 1, kind: 'spark' });
        }
        w.sfx(charged ? 'charged' : 'spread');
        break;
    }
  }

  // The rocket launcher: a rocket the way the Mega Man aims (forward, up, or down up in the sky).
  fireRocket() {
    const w = this.world;
    if (this.rocketCool > 0 || w.bullets.filter((b) => b.owner === 'p' && b.src === 'launcher').length >= 2) return;
    this.rocketCool = 24;
    this.shootT = 16;
    this.shotAim = this.aim;
    const bx = this.aim ? this.cx : this.cx + this.facing * 11;
    const by = this.aim ? (this.aim > 0 ? this.y + this.h + 2 : this.y - 4) : this.y + 10;
    w.rocket('launcher', bx, by, this.aim ? this.aim * Math.PI / 2 : this.facing > 0 ? 0 : Math.PI, { dmg: 5 });
    w.effect(new Puff(bx, by, '#fce4a0', this.facing * 0.5, 0));
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
    if (w.inTank) {
      w.rocket('hero', bx, by, dir > 0 ? Math.PI / 2 : -Math.PI / 2, charged ? { dmg: 6, pierce: true, guard: true } : {});
      if (dir > 0) this.vy = Math.min(this.vy, charged ? -6 : -3.6);
      return;
    }
    const shot = (o) => w.playerShot({ src: 'hero', x: bx - o.w / 2, y: by - o.h / 2, vx: 0, ...o, vy: o.vy * dir });
    switch (charged && this.def.shot === 'buster' ? 'charged' : this.def.shot) {
      case 'buster': shot({ w: 4, h: 6, vy: 5, dmg: 1, kind: 'pellet' }); w.sfx('shoot'); break;
      case 'charged': shot({ w: 12, h: 16, vy: 5, dmg: 4, pierce: true, guard: true, kind: 'charged' }); w.sfx('charged'); break;
      case 'flame':
        if (charged) shot({ w: 16, h: 22, vy: 4, dmg: 4, pierce: true, guard: true, life: 55, kind: 'flame' });
        else shot({ w: 8, h: 12, vy: 4, dmg: 2, pierce: true, guard: true, life: 45, kind: 'flame' });
        w.sfx(charged ? 'charged' : 'flame');
        break;
      case 'wind':
        if (charged) shot({ w: 14, h: 18, vy: 5.5, dmg: 4, pierce: true, guard: true, kind: 'wind' });
        else shot({ w: 8, h: 10, vy: 5.5, dmg: 1, kind: 'wind' });
        w.sfx(charged ? 'charged' : 'wind');
        break;
      case 'spread':
        for (const a of charged ? [-0.56, -0.28, 0, 0.28, 0.56] : [-0.28, 0, 0.28]) {
          shot({ w: charged ? 8 : 5, h: charged ? 8 : 5, vx: Math.sin(a) * 4.2, vy: Math.cos(a) * 4.2, dmg: charged ? 3 : 1, kind: 'spark' });
        }
        w.sfx(charged ? 'charged' : 'spread');
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
    if (this.swingT > 0) {
      // the pickaxe: raised, then out in front, then down into the dirt
      const f = this.facing, fx = cx + f * 8;
      const pose = this.swingT > 9 ? 0 : this.swingT > 4 ? 1 : 2;
      if (pose === 0) {
        rect(ctx, fx - 1, bottom - 30, 3, 14, '#000000'); rect(ctx, fx, bottom - 29, 1, 12, '#c84c0c');
        rect(ctx, fx - 5, bottom - 32, 11, 4, '#000000'); rect(ctx, fx - 4, bottom - 31, 9, 2, '#bcbcbc');
      } else if (pose === 1) {
        const sx = f > 0 ? cx + 3 : cx - 15;
        rect(ctx, sx, bottom - 15, 12, 3, '#000000'); rect(ctx, sx + 1, bottom - 14, 10, 1, '#c84c0c');
        const hx = f > 0 ? cx + 13 : cx - 18;
        rect(ctx, hx, bottom - 20, 5, 12, '#000000'); rect(ctx, hx + 1, bottom - 19, 3, 10, '#bcbcbc');
      } else {
        rect(ctx, fx - 1, bottom - 14, 3, 14, '#000000'); rect(ctx, fx, bottom - 13, 1, 12, '#c84c0c');
        rect(ctx, fx - 5, bottom - 5, 11, 4, '#000000'); rect(ctx, fx - 4, bottom - 4, 9, 2, '#bcbcbc');
      }
    }
    if (this.rocketT > 0) {
      const bx = this.facing > 0 ? cx - 8 : cx + 5;
      rect(ctx, bx, bottom - 17, 3, 9, '#000000');
      rect(ctx, bx + 1, bottom - 16, 1, 7, this.rocketT < 180 && (this.anim >> 2) % 2 ? '#f83800' : '#bcbcbc');
      if (!this.onGround && this.anim % 4 < 2) rect(ctx, bx, bottom - 8, 3, 4, '#fcd838');
    }
    if (this.hasBooster && this.rocketT <= 0) {
      const bx = this.facing > 0 ? cx - 7 : cx + 4;
      rect(ctx, bx, bottom - 15, 3, 7, '#000000');
      rect(ctx, bx + 1, bottom - 14, 1, 5, '#f83800');
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

