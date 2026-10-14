// One stage being played: tiles, physics, enemies, shots, the camera, and the
// flow from READY through boss fights to stage clear.

import { W, H, tileSet, drawBackground, blueTreeImage, houseImage, drawLifeBox, drawSprite, rect, blob, HERO_PAL } from './gfx.js';
import { LEVELS, HEROES, HERO_ORDER } from './levels.js';
import { Hero } from './hero.js';
import { Tank, drawTankBody } from './tank.js';
import { makeEnemy } from './enemies.js';
import { makeBoss } from './bosses.js';
import { Explosion, DeathBurst, Puff, SmashFlare, Ring, FloatText, SlamBoom, BigText } from './effects.js';
import { drawText, wrap } from './font.js';

const EMPTY = 0, SOLID = 1, ALT = 2, ONEWAY = 3, LADDER = 4, SPIKE = 5, LAVA = 6, GATE = 7, ROOF = 8;
const TILE_OF = { '#': SOLID, '=': ALT, '-': ONEWAY, H: LADDER, '^': SPIKE, '~': LAVA, D: GATE };

const NULL_IN = { held: () => false, pressed: () => false, released: () => false, anyPressed: () => false };

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

class Lift {
  constructor(x, y, span) {
    this.x0 = x; this.x = x; this.y = y; this.w = 32; this.h = 8; this.span = span; this.dir = 1; this.dx = 0;
  }
  update() {
    let nx = this.x + 0.75 * this.dir;
    if (nx > this.x0 + this.span) { nx = this.x0 + this.span; this.dir = -1; }
    if (nx < this.x0) { nx = this.x0; this.dir = 1; }
    this.dx = nx - this.x;
    this.x = nx;
  }
}

const WAKE_LINES = [
  '. . .',
  'UNDER THE BLUE TREE, MEGA MAN WAKES UP.',
  "DR. LIGHT (RADIO): MEGA MAN! THANK GOODNESS YOU'RE ONLINE.",
  'THE EVIL MECH HAS TAKEN OVER THE VILLAGE, AND ITS ARMY HAS SEALED YOUR BROTHERS - BLAZE, GALE AND VOLT - IN CAPSULES.',
  "FREE THEM AND THEY'LL FIGHT BY YOUR SIDE. THEN FIND THE TANK IN THE IRON HANGAR. YOU'LL NEED IT TO SMASH THAT MECH!",
];

const OUTROS = {
  meadow: ['DR. LIGHT: GOOD WORK! CHOOSE YOUR NEXT STAGE. THE CAVES, THE CLIFFS AND THE PLANT EACH HIDE A CAPSULE.'],
  homeland: ['DR. LIGHT: THE LIFE IS YOURS! NOW EVERY MEGA MAN CAN DO THE SUPER MEGA MAN SLAM BASH, IN EVERY STAGE.'],
  hangar: ['THE TANK IS YOURS!', 'DR. LIGHT: THE VILLAGE IS NEXT. DEFEAT EVERY ONE OF THE MECH\'S ROBOTS AND THE GATE TO THE SQUARE WILL OPEN.'],
};

const LIFE_LINES = [
  'A BLUE BOX! THE MEGA MEN CALL IT THE LIFE.',
  'INSIDE IS THE BLUE THING. ITS POWER GOES TO EVERY MEGA MAN!',
  'PRESS Z AGAIN AND AGAIN IN THE AIR: DOUBLE, DOUBLE, DOUBLE, DOUBLE, DOUBLE JUMP!',
  'IN THE AIR, HOLD DOWN AND PRESS X: SUPER MEGA MAN SLAM BASH! BOOM - IT THROWS YOU UP HIGH.',
  'UP HIGH, HOLD DOWN AND PRESS X TO SHOOT DOWN. EVERY SHOT PUSHES YOU UP!',
];

const VILLAGE_INTRO = [
  'DR. LIGHT: THIS IS IT - THE VILLAGE. THE MECH\'S ROBOTS ARE EVERYWHERE.',
  'SMASH ALL OF THEM. ONCE THE LAST ONE FALLS, THE GATE TO THE VILLAGE SQUARE OPENS... AND THE EVIL MECH WILL BE WAITING.',
];

export class World {
  constructor(game, id, run) {
    this.game = game;
    this.id = id;
    this.def = LEVELS[id];
    this.theme = this.def.theme;
    this.tiles = tileSet(this.theme);
    this.run = run || { checkpoint: null, inTank: !!this.def.tank, killed: new Set(), active: 'mega', introDone: false };
    this.t = 0;
    this.timer = 0;
    this.cam = { x: 0, y: 0 };
    this.shakeT = 0;
    this.bullets = [];
    this.effects = [];
    this.items = [];
    this.enemies = [];
    this.lifts = [];
    this.decor = [];
    this.signs = [];
    this.checkpoints = [];
    this.goal = null;
    this.tankPickup = null;
    this.bossSpawn = null;
    this.gateCol = null;
    this.boss = null;
    this.bossStarted = false;
    this.bossBar = 0;
    this.camLock = null;
    this.capsule = null;
    this.lifeBox = null;
    this.dialog = null;
    this.message = null;
    this.pause = null;
    this.load();

    const heroes = game.save.heroes;
    this.party = {};
    for (const h of heroes) this.party[h] = 28;
    this.active = heroes.includes(this.run.active) ? this.run.active : heroes[0];
    this.inTank = this.run.inTank;
    const spawn = this.run.checkpoint || this.start;
    this.player = this.inTank ? new Tank(this, spawn.x, spawn.y) : new Hero(this, spawn.x, spawn.y);
    this.lastSafe = { ...spawn };
    for (const c of this.checkpoints) if (this.run.checkpoint && c.x <= this.run.checkpoint.x) c.reached = true;
    this.updateCamera();

    this.enemiesLeft = this.enemies.length;
    this.gateClosed = !!this.def.clearAll && this.enemiesLeft > 0;
    this.wake = this.def.wake && !this.run.introDone && !game.save.cleared.meadow;
    if (this.wake) {
      this.phase = 'wake';
      game.sound.stop();
    } else {
      this.phase = 'ready';
      game.sound.play(this.def.music);
    }
  }

  get sound() { return this.game.sound; }
  sfx(n) { this.game.sound.sfx(n); }

  // ------------------------------------------------------------ loading

  load() {
    const screens = this.def.screens;
    this.rows = 15;
    this.cols = screens.length * 16;
    this.map = new Uint8Array(this.cols * this.rows);
    let sign = 0, houses = 0;
    const houseSpots = [];
    for (let s = 0; s < screens.length; s++) {
      for (let r = 0; r < 15; r++) {
        for (let c = 0; c < 16; c++) {
          const ch = screens[s][r][c] || '.';
          const x = s * 16 + c;
          const cx = x * 16 + 8, bottom = (r + 1) * 16;
          if (TILE_OF[ch] !== undefined) {
            this.map[r * this.cols + x] = TILE_OF[ch];
            if (ch === 'D' && this.gateCol === null) this.gateCol = x;
            continue;
          }
          switch (ch) {
            case 'P': this.start = { x: cx, y: bottom }; break;
            case 'T': this.decor.push({ kind: 'tree', x: cx, y: bottom }); break;
            case 'C': this.checkpoints.push({ x: cx, y: bottom, reached: false }); break;
            case '?': this.signs.push({ x: x * 16, y: r * 16, text: (this.def.signs || [])[sign++] || '' }); break;
            case 'G': this.goal = { x: x * 16, y: bottom - 32, w: 16, h: 32 }; break;
            case 'K': if (!this.run.inTank) this.tankPickup = { x: cx, y: bottom, box: { x: cx - 14, y: bottom - 24, w: 28, h: 24 } }; break;
            case 'B': case 'M': this.bossSpawn = { x: cx, y: bottom }; break;
            case 'L': case 'l': this.lifts.push(new Lift(x * 16, r * 16, ch === 'L' ? 96 : 48)); break;
            case 'R': this.decor.push({ kind: 'house', x: x * 16, y: bottom, variant: houses++ }); houseSpots.push([x, r]); break;
            case 'e': case 'E': case '1': this.items.push(this.makeItem(ch, cx, bottom)); break;
            case 'X': this.lifeBox = { x: cx - 8, y: bottom - 16, w: 16, h: 16, opened: !!this.game.save.life, t: 0 }; break;
            default: {
              const id = x + ',' + r;
              if (this.run.killed.has(id)) break;
              const e = makeEnemy(ch, this, cx, bottom);
              if (e) { e.id = id; this.enemies.push(e); }
            }
          }
        }
      }
    }
    // a house's roof is a ledge
    for (const [x, r] of houseSpots) for (let i = 0; i < 3; i++) if (this.tile(x + i, r - 2) === EMPTY) this.map[(r - 2) * this.cols + x + i] = ROOF;
    if (this.gateCol !== null) {
      // the arena's ceiling (if any) over the boss's spawn, so bosses drop in under it
      let top = 0;
      const bc = this.bossSpawn ? Math.floor(this.bossSpawn.x / 16) : this.gateCol + 8;
      while (top < this.rows && this.solidTile(bc, top)) top++;
      this.arena = { x: this.gateCol * 16, floor: this.bossSpawn ? this.bossSpawn.y : 192, top: top * 16 };
    }
  }

  makeItem(type, cx, bottom, ttl = Infinity) {
    const [w, h] = type === 'e' ? [6, 6] : [12, 12];
    return { type, x: cx - w / 2, y: bottom - h, w, h, vx: 0, vy: 0, ttl };
  }

  // ------------------------------------------------------------ tiles & physics

  tile(c, r) {
    if (c < 0 || c >= this.cols) return SOLID;
    if (r < 0 || r >= this.rows) return EMPTY;
    return this.map[r * this.cols + c];
  }
  solidTile(c, r) {
    const t = this.tile(c, r);
    return t === SOLID || t === ALT || t === SPIKE || (t === GATE && this.gateClosed);
  }
  solidAt(px, py) { return this.solidTile(Math.floor(px / 16), Math.floor(py / 16)); }
  tileAt(px, py) { return this.tile(Math.floor(px / 16), Math.floor(py / 16)); }
  ladderTop(c, r) { return this.tile(c, r) === LADDER && this.tile(c, r - 1) !== LADDER; }
  standableAt(px, py) {
    const c = Math.floor(px / 16), r = Math.floor(py / 16);
    const t = this.tile(c, r);
    return this.solidTile(c, r) || t === ONEWAY || t === ROOF || this.ladderTop(c, r);
  }
  ladderX(px, py) {
    const c = Math.floor(px / 16), r = Math.floor(py / 16);
    return this.tile(c, r) === LADDER ? c * 16 + 8 : null;
  }
  wallBeside(e, side) {
    const px = side > 0 ? e.x + e.w + 1 : e.x - 1;
    for (let py = e.y + 3; py <= e.y + e.h - 3; py += 4) if (this.solidAt(px, py)) return true;
    return this.solidAt(px, e.y + e.h - 3);
  }

  move(e) {
    const carry = e.lift && e.onGround ? e.lift.dx : 0;
    e.lift = null;
    e.hitWall = 0;
    e.onGround = false;
    const dx = e.vx + carry;
    e.x += dx;
    const r0 = Math.floor(e.y / 16), r1 = Math.floor((e.y + e.h - 0.01) / 16);
    if (dx > 0) {
      const c = Math.floor((e.x + e.w - 0.01) / 16);
      for (let r = r0; r <= r1; r++) if (this.solidTile(c, r)) { e.x = c * 16 - e.w; e.hitWall = 1; break; }
    } else if (dx < 0) {
      const c = Math.floor(e.x / 16);
      for (let r = r0; r <= r1; r++) if (this.solidTile(c, r)) { e.x = (c + 1) * 16; e.hitWall = -1; break; }
    }
    const prevBottom = e.y + e.h;
    e.y += e.vy;
    if (e.y < 0 && e.vy < 0 && e.wall) { e.y = 0; e.vy = 0; }
    const c0 = Math.floor(e.x / 16), c1 = Math.floor((e.x + e.w - 0.01) / 16);
    if (e.vy >= 0) {
      const r = Math.floor((e.y + e.h) / 16);
      const top = r * 16;
      for (let c = c0; c <= c1; c++) {
        const t = this.tile(c, r);
        if (this.solidTile(c, r) || ((t === ONEWAY || t === ROOF || this.ladderTop(c, r)) && prevBottom <= top + 0.01 && !e.ladder)) {
          e.y = top - e.h;
          e.vy = 0;
          e.onGround = true;
          break;
        }
      }
      if (!e.onGround) {
        for (const l of this.lifts) {
          if (e.x + e.w > l.x && e.x < l.x + l.w && prevBottom <= l.y + 0.01 && e.y + e.h >= l.y) {
            e.y = l.y - e.h;
            e.vy = 0;
            e.onGround = true;
            e.lift = l;
            break;
          }
        }
      }
    } else {
      const r = Math.floor(e.y / 16);
      for (let c = c0; c <= c1; c++) if (this.solidTile(c, r)) { e.y = (r + 1) * 16; e.vy = 0; e.hitCeil = true; break; }
    }
  }

  touchesHazard(e) {
    const spike = (px, py) => this.tileAt(px, py) === SPIKE;
    // probes sit well inside the body: spikes taper to points, so the outer
    // few pixels of a tile are mostly empty space
    const xs = [e.x + 4, e.x + e.w / 2, e.x + e.w - 4];
    const ys = [e.y + 4, e.y + e.h / 2, e.y + e.h - 4];
    if (xs.some((x) => spike(x, e.y + e.h + 0.5) || spike(x, e.y - 0.5))) return true;
    if (ys.some((y) => spike(e.x - 0.5, y) || spike(e.x + e.w + 0.5, y))) return true;
    return this.tileAt(e.x + e.w / 2, e.y + e.h - 4) === LAVA;
  }

  // ------------------------------------------------------------ spawning

  effect(fx) { this.effects.push(fx); }
  shake(n) { this.shakeT = Math.max(this.shakeT, n); }
  explode(x, y, size = 1) { this.effects.push(new Explosion(x, y, size)); }

  playerShot(b) { this.bullets.push({ owner: 'p', ...b }); }
  enemyShot(x, y, vx, vy, o = {}) {
    const w = o.w || 6, h = o.h || 6;
    this.bullets.push({ owner: 'e', kind: 'ball', dmg: 3, ...o, x: x - (o.fixed ? 0 : w / 2), y: o.fixed ? y : y - h / 2, w, h, vx, vy });
  }

  drop(x, y) {
    const r = Math.random();
    const type = r < 0.03 ? '1' : r < 0.12 ? 'E' : r < 0.36 ? 'e' : null;
    if (type) { const it = this.makeItem(type, x, y + 6, 420); it.vy = -2; this.items.push(it); }
  }

  enemyKilled(e, silent = false) {
    if (!silent) {
      this.explode(e.cx, e.cy);
      this.sfx('kill');
      this.drop(e.cx, e.cy);
    }
    if (e.isBoss) return;
    if (this.def.clearAll) this.run.killed.add(e.id);
    this.enemiesLeft--;
    if (this.def.clearAll && this.enemiesLeft <= 0 && this.gateClosed) {
      this.gateClosed = false;
      this.sfx('gate');
      this.shake(10);
      this.showMessage('THE GATE IS OPEN!', 150);
    }
  }

  // Green shockwaves either side of a landed Smash Punch.
  smashQuake(h) {
    const floor = h.y + h.h;
    this.sfx('smash');
    this.shake(8);
    this.effect(new SmashFlare(h.cx, floor));
    for (const d of [-1, 1]) this.playerShot({ src: 'quake', x: h.cx + d * 8 - 6, y: floor - 14, w: 12, h: 14, vx: d * 3, vy: 0, dmg: 2, pierce: true, guard: true, ground: true, life: 24, kind: 'quake' });
  }

  // The Super Mega Man Slam Bash landing: a blue boom that hits everything
  // nearby, and bigger shockwaves than the Smash Punch.
  slamBoom(h) {
    const floor = h.y + h.h;
    this.sfx('boom');
    this.shake(16);
    this.effect(new SlamBoom(h.cx, floor));
    this.effect(new BigText(h.cx, floor - 44, 'BOOM!'));
    this.playerShot({ src: 'boom', x: h.cx - 56, y: floor - 72, w: 112, h: 80, vx: 0, vy: 0, dmg: 4, pierce: true, guard: true, fixed: true, life: 8, kind: 'boom' });
    for (const d of [-1, 1]) this.playerShot({ src: 'quake', x: h.cx + d * 8 - 7, y: floor - 18, w: 14, h: 18, vx: d * 3.5, vy: 0, dmg: 3, pierce: true, guard: true, ground: true, life: 40, kind: 'bquake' });
  }

  openLifeBox() {
    const b = this.lifeBox;
    b.opened = true;
    b.t = 0;
    this.game.save.life = true;
    this.game.persist();
    for (const h in this.party) this.party[h] = 28;
    this.sfx('oneup');
    this.shake(6);
    this.effect(new Ring(b.x + 8, b.y + 8, '#3cbcfc'));
    this.effect(new Ring(this.player.cx, this.player.cy, '#fcfcfc'));
    this.effect(new BigText(b.x + 8, b.y - 30, 'THE LIFE!'));
    this.say(LIFE_LINES);
  }

  // ------------------------------------------------------------ player state changes

  playerDown(cause) {
    if (!['play', 'bossIntro', 'bossDying'].includes(this.phase)) return;
    const p = this.player;
    if (this.inTank) {
      if (cause === 'hazard' && p.hp > 10) {
        p.hp -= 10;
        this.sfx('hurt');
        p.x = this.lastSafe.x - p.w / 2;
        p.y = this.lastSafe.y - p.h;
        p.vx = p.vy = 0;
        p.wall = 0;
        p.inv = 90;
        this.effect(new Ring(p.cx, p.cy, '#fcfcfc'));
        return;
      }
      p.hp = 0;
      this.die();
      return;
    }
    this.party[this.active] = 0;
    const next = this.nextAlive();
    if (!next) { this.die(); return; }
    this.effect(new DeathBurst(p.cx, p.cy, this.active));
    this.sfx('death');
    this.showMessage(HEROES[this.active].name + ' IS DOWN!', 90);
    this.phase = 'ko';
    this.timer = 0;
  }

  nextAlive() {
    const list = HERO_ORDER.filter((h) => this.party[h] > 0);
    if (!list.length) return null;
    const i = HERO_ORDER.indexOf(this.active);
    for (let k = 1; k <= HERO_ORDER.length; k++) {
      const h = HERO_ORDER[(i + k) % HERO_ORDER.length];
      if (this.party[h] > 0) return h;
    }
    return null;
  }

  respawnNext() {
    const next = this.nextAlive();
    if (!next) { this.phase = 'play'; this.die(); return; }
    this.active = this.run.active = next;
    this.player = new Hero(this, this.lastSafe.x, this.lastSafe.y);
    this.player.inv = 60;
    this.phase = 'teleport';
    this.timer = 0;
  }

  die() {
    const p = this.player;
    this.effect(new DeathBurst(p.cx, p.cy, this.active));
    if (this.inTank) { for (let i = 0; i < 5; i++) this.explode(p.x + Math.random() * p.w, p.y + Math.random() * p.h, 1.2); }
    this.sfx('death');
    this.sound.stop();
    this.phase = 'dead';
    this.timer = 0;
  }

  lifeLost() {
    this.game.lives--;
    if (this.game.lives <= 0) this.game.gameOver();
    else this.game.restartStage(this.id, this.run);
  }

  swapHero(target) {
    const list = HERO_ORDER.filter((h) => this.party[h] !== undefined && (this.inTank || this.party[h] > 0));
    let id = target;
    if (typeof target === 'number') {
      const i = list.indexOf(this.active);
      id = list[(i + target + list.length) % list.length];
    }
    if (!id || id === this.active || !list.includes(id)) return;
    this.active = this.run.active = id;
    if (this.player.charge) this.player.charge = 0;
    this.sfx('swap');
    this.effect(new Ring(this.player.cx, this.player.cy, HERO_PAL[id].L));
    this.effect(new FloatText(this.player.cx, this.player.y - 10, HEROES[id].name, HERO_PAL[id].L, drawText));
  }

  boardTank() {
    const k = this.tankPickup;
    this.tankPickup = null;
    this.inTank = this.run.inTank = true;
    this.player = new Tank(this, k.x, k.y);
    this.player.inv = 30;
    this.sfx('board');
    this.effect(new Ring(k.x, k.y - 12, '#fcfcfc'));
    this.showMessage('TANK ACQUIRED!', 120);
  }

  // ------------------------------------------------------------ story beats

  say(pages, onDone) {
    const chunks = [];
    for (const p of pages) {
      const lines = wrap(p, 34);
      for (let i = 0; i < lines.length; i += 4) chunks.push(lines.slice(i, i + 4));
    }
    this.dialog = { pages: chunks, i: 0, chars: 0, onDone };
  }

  showMessage(text, frames = 120) { this.message = { text, t: frames }; }

  startBoss() {
    this.bossStarted = true;
    this.gateClosed = true;
    this.sfx('gate');
    this.camLock = this.arena.x;
    this.phase = 'bossIntro';
    this.timer = 0;
    this.bossBar = 0;
    this.sound.stop();
    this.boss = makeBoss(this.def.boss, this, this.bossSpawn.x, this.bossSpawn.y);
    this.boss.active = true;
    this.enemies.push(this.boss);
  }

  bossDefeated(boss) {
    this.phase = 'bossDying';
    this.timer = 0;
    this.sound.stop();
    this.bullets = this.bullets.filter((b) => b.owner === 'p');
    this.dyingBoss = boss;
  }

  updateBossDying() {
    const b = this.dyingBoss;
    const big = this.def.boss === 'mech';
    const end = big ? 130 : 70;
    if (this.timer < end && this.timer % (big ? 6 : 8) === 0) {
      this.explode(b.x + Math.random() * b.w, b.y + Math.random() * b.h, big ? 1.6 : 1.1);
      this.sfx('explode');
      if (big) this.shake(6);
    }
    if (this.timer === end) {
      this.effect(new DeathBurst(b.cx, b.cy, big ? 'blaze' : 'volt'));
      this.sfx('death');
    }
    if (this.timer === end + 70) {
      if (big) {
        this.phase = 'clear';
        this.timer = 0;
        this.sound.play('clear');
        this.ending = true;
      } else {
        this.capsule = { x: this.arena.x + 128 - 12, y: -40, w: 24, h: 32, vy: 0, landed: false, hero: this.def.reward };
        this.phase = 'play';
      }
    }
  }

  rescue() {
    const c = this.capsule;
    if (c.rescued) return;
    c.rescued = true;
    const id = c.hero;
    this.game.addHero(id);
    this.party[id] = 28;
    this.sfx('oneup');
    this.effect(new Ring(c.x + 12, c.y + 16, HERO_PAL[id].L));
    const hd = HEROES[id];
    this.say([
      `${hd.name} IS FREE!`,
      `${hd.name}: THANKS, BROTHER! I'M WITH YOU. ${hd.about}`,
      'PRESS Q OR E (OR 1-4) TO SWITCH MEGA MEN ANY TIME - EVEN TO SWAP THE PILOT OF THE TANK.',
    ], () => this.stageClear());
  }

  stageClear() {
    if (this.phase === 'clear') return;
    this.phase = 'clear';
    this.timer = 0;
    this.sound.play('clear');
  }

  enterPlay() {
    this.phase = 'play';
    this.timer = 0;
    if (this.id === 'village' && !this.run.introDone) {
      this.run.introDone = true;
      this.say(VILLAGE_INTRO);
    }
  }

  // ------------------------------------------------------------ update

  update(inp) {
    this.t++;
    if (this.shakeT > 0) this.shakeT--;
    if (this.game.debug) this.debugKeys(inp);
    if (this.pause) { this.updatePause(inp); return; }
    if (this.dialog) {
      this.updateDialog(inp);
      this.effects = this.effects.filter((f) => f.update());
      return;
    }
    if (this.message && --this.message.t <= 0) this.message = null;
    this.timer++;
    switch (this.phase) {
      case 'wake': if (this.timer === 50) this.say(WAKE_LINES, () => { this.phase = 'waking'; this.timer = 0; }); break;
      case 'waking':
        if (this.timer > 30) {
          this.phase = 'play';
          this.run.introDone = true;
          this.sound.play(this.def.music);
        }
        break;
      case 'ready': if (this.timer > 80) { this.phase = 'teleport'; this.timer = 0; } break;
      case 'teleport': this.updateTeleport(); break;
      case 'ko': this.updateWorld(inp, false); if (this.timer > 75) this.respawnNext(); break;
      case 'dead': this.updateWorld(inp, false); if (this.timer > 170) this.lifeLost(); break;
      case 'play': this.updateWorld(inp, true); break;
      case 'bossIntro': this.updateWorld(inp, true); this.updateBossIntro(); break;
      case 'bossDying': this.updateWorld(inp, true); this.updateBossDying(); break;
      case 'clear': this.updateClear(); break;
    }
    this.updateCamera();
  }

  updateTeleport() {
    const p = this.player;
    if (this.timer === 1) { this.beamY = this.cam.y - 30; this.beamDone = 0; this.sfx('teleport'); }
    const target = p.y + p.h - 24;
    if (this.beamY < target) this.beamY = Math.min(target, this.beamY + 9);
    else if (++this.beamDone > 10) this.enterPlay();
  }

  updateBossIntro() {
    const b = this.boss;
    if (!b.entered || Math.abs(this.cam.x - this.camLock) > 1) return;
    if (this.bossBar < 28) {
      if (this.t % 2 === 0) { this.bossBar++; this.sfx('tick'); }
      return;
    }
    b.ready = true;
    this.phase = 'play';
    this.sound.play('boss');
  }

  updateClear() {
    const p = this.player;
    p.vx = 0;
    if (!this.beamOut) { p.vy = Math.min(p.vy + 0.25, 7); this.move(p); }
    this.effects = this.effects.filter((f) => f.update());
    if (this.timer === 150) {
      if (this.ending) {
        this.say(['THE EVIL MECH IS SMASHED!', 'ONE BY ONE, THE VILLAGERS PEEK OUT OF THEIR HOUSES... AND START TO CHEER.', 'DR. LIGHT: YOU DID IT, MEGA MEN! THE VILLAGE IS FREE.'], () => this.game.completeStage(this.id));
        return;
      }
      if (OUTROS[this.id]) { this.say(OUTROS[this.id], () => { this.beamOut = true; this.timer = 151; this.sfx('teleport'); }); return; }
      this.beamOut = true;
      this.sfx('teleport');
    }
    if (this.beamOut) this.beamUp = (this.beamUp || 0) + 8;
    if (this.timer > 210) this.game.completeStage(this.id);
  }

  updateWorld(inp, withPlayer) {
    for (const l of this.lifts) l.update();
    const p = this.player;
    const control = this.phase === 'play' || this.phase === 'bossDying';
    if (withPlayer) {
      p.update(control ? inp : NULL_IN);
      if (p.y < 0 && p.isTank && p.wall) p.y = 0;
      if (this.touchesHazard(p) || p.y > this.rows * 16 + 16) this.playerDown('hazard');
    }
    if (withPlayer && control && this.phase === 'play') {
      if (inp.pressed('next')) this.swapHero(1);
      if (inp.pressed('prev')) this.swapHero(-1);
      HERO_ORDER.forEach((h, i) => { if (inp.pressed('hero' + (i + 1))) this.swapHero(h); });
      if (inp.pressed('start')) this.openPause();
    }

    const cam = this.cam;
    for (const e of this.enemies) {
      if (e.dead) continue;
      e.active = e.isBoss || (e.x + e.w > cam.x - 24 && e.x < cam.x + W + 24);
      if (e.active) e.update();
    }
    this.updateBullets();
    this.updateItems();
    if (withPlayer && this.phase !== 'ko' && this.phase !== 'dead') this.playerVsEnemies();
    if (this.capsule && !this.capsule.landed) {
      const c = this.capsule;
      c.vy = Math.min(c.vy + 0.25, 6);
      c.y += c.vy;
      if (c.y + c.h >= this.arena.floor) { c.y = this.arena.floor - c.h; c.landed = true; this.shake(4); this.sfx('land'); }
    }
    this.effects = this.effects.filter((f) => f.update());
    this.enemies = this.enemies.filter((e) => !e.dead);
    if (withPlayer && this.phase === 'play') this.checkTriggers();
  }

  updateBullets() {
    const p = this.player;
    for (const b of this.bullets) {
      if (b.homing) {
        const dx = p.cx - (b.x + b.w / 2), dy = p.cy - (b.y + b.h / 2);
        const want = Math.atan2(dy, dx);
        let ang = Math.atan2(b.vy, b.vx);
        let diff = want - ang;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        ang += clamp(diff, -0.045, 0.045);
        const sp = Math.min(2, Math.hypot(b.vx, b.vy) + 0.03);
        b.vx = Math.cos(ang) * sp;
        b.vy = Math.sin(ang) * sp;
        if (this.t % 4 === 0) this.effect(new Puff(b.x + b.w / 2, b.y + b.h / 2, '#bcbcbc', 0, 0));
      }
      if (b.grav) b.vy += b.grav;
      b.x += b.vx;
      b.y += b.vy;
      if (b.life !== undefined && --b.life <= 0) b.dead = true;
      if (b.fixed) continue;
      if (b.ground) {
        const fx = b.vx > 0 ? b.x + b.w : b.x;
        if (this.solidAt(fx, b.y + b.h / 2) || !this.standableAt(b.x + b.w / 2, b.y + b.h + 2)) b.dead = true;
      } else if (this.solidAt(b.x + b.w / 2, b.y + b.h / 2)) {
        b.dead = true;
        this.effect(new Puff(b.x + b.w / 2, b.y + b.h / 2, '#fce4a0', 0, 0));
      }
      if (b.x + b.w < this.cam.x - 40 || b.x > this.cam.x + W + 40 || b.y > H + 40 || b.y < -80) b.dead = true;
    }

    for (const b of this.bullets) {
      if (b.owner !== 'p' || b.dead) continue;
      for (const e of this.enemies) {
        if (e.dead || !e.active || b.hits?.has(e) || !overlap(b, e)) continue;
        const res = e.hitBy(b);
        if (res === 'deflect') {
          b.owner = 'x';
          b.vx = -b.vx * 0.7;
          b.vy = -3;
          b.grav = 0.2;
          this.sfx('tink');
          break;
        }
        if (res === 'absorb') { if (!b.pierce) b.dead = true; else (b.hits ||= new Set()).add(e); break; }
        (b.hits ||= new Set()).add(e);
        if (!b.pierce) { b.dead = true; break; }
      }
      if (b.dead || b.owner !== 'p') continue;
      for (const eb of this.bullets) {
        if (eb.owner === 'e' && eb.hp && !eb.dead && overlap(b, eb)) {
          eb.dead = true;
          this.explode(eb.x + eb.w / 2, eb.y + eb.h / 2, 0.7);
          this.sfx('kill');
          if (!b.pierce) { b.dead = true; break; }
        }
      }
    }

    if (this.phase === 'play' || this.phase === 'bossDying') {
      for (const b of this.bullets) {
        if (b.owner !== 'e' || b.dead || !overlap(b, p)) continue;
        if (p.inv > 0 || (!p.isTank && p.shielded)) continue;
        p.hurt(b.dmg, b.x + b.w / 2);
        if (!b.persist) b.dead = true;
        if (this.phase !== 'play') break;
      }
    }
    this.bullets = this.bullets.filter((b) => !b.dead);
  }

  updateItems() {
    const p = this.player;
    for (const it of this.items) {
      if (it.ttl !== Infinity || it.vy) {
        it.vy = Math.min(it.vy + 0.25, 4);
        this.move(it);
      }
      if (--it.ttl <= 0) it.dead = true;
      if (this.phase === 'play' && overlap(it, p)) {
        it.dead = true;
        if (it.type === '1') {
          this.game.lives = Math.min(9, this.game.lives + 1);
          this.sfx('oneup');
          this.effect(new FloatText(p.cx, p.y - 8, '1UP', '#fcfcfc', drawText));
        } else {
          const n = it.type === 'e' ? 4 : 12;
          p.hp = Math.min(p.maxHp, p.hp + n);
          this.sfx('pickup');
        }
      }
    }
    this.items = this.items.filter((i) => !i.dead);
  }

  playerVsEnemies() {
    const p = this.player;
    for (const e of this.enemies) {
      if (e.dead || !e.active || !overlap(p, e)) continue;
      if (p.isTank) {
        if (p.vy > 1.2 && p.y + p.h - p.vy <= e.y + 8) {
          const dmg = e.isBoss ? 3 : p.launched || p.speedJump ? 6 : 4;
          e.hitBy({ dmg, guard: true, vx: 0 });
          p.vy = -3.8;
          p.usedDouble = false;
          p.launched = false;
          p.speedJump = false;
          this.sfx('smash');
          this.shake(4);
          this.effect(new SmashFlare(p.cx, p.y + p.h));
          continue;
        }
        p.hurt(e.contact, e.cx);
      } else if (p.smashing) {
        if (p.smashHits.has(e)) continue;
        p.smashHits.add(e);
        const res = e.hitBy({ dmg: 3, guard: true, vx: 0 });
        this.effect(new SmashFlare(p.cx, p.y + p.h));
        this.sfx('smash');
        if (e.isBoss || res !== 'kill') {
          if (p.super) { p.slamLand(true); continue; }
          p.smashing = false;
          p.vy = -4.5;
        }
      } else {
        p.hurt(e.contact, e.cx);
      }
    }
  }

  checkTriggers() {
    const p = this.player;
    for (const c of this.checkpoints) {
      if (!c.reached && p.cx >= c.x) {
        c.reached = true;
        this.run.checkpoint = { x: c.x, y: c.y };
        this.sfx('select');
      }
    }
    if (p.onGround && !p.lift && !p.wall) {
      const b = p.y + p.h + 2;
      const ok = (x) => this.standableAt(x, b) && this.tileAt(x, b) !== SPIKE;
      if (ok(p.x + 1) && ok(p.x + p.w - 1)) this.lastSafe = { x: p.cx, y: p.y + p.h };
    }
    this.activeSign = this.signs.find((s) => Math.abs(p.cx - (s.x + 8)) < 22 && Math.abs(p.y + p.h - (s.y + 16)) < 28) || null;
    if (this.goal && overlap(p, this.goal)) this.stageClear();
    if (this.tankPickup && !this.inTank && overlap(p, this.tankPickup.box)) this.boardTank();
    if (this.gateCol !== null && !this.bossStarted && !this.gateClosed && p.x > (this.gateCol + 1) * 16 + 4) this.startBoss();
    if (this.capsule && this.capsule.landed && overlap(p, this.capsule)) this.rescue();
    // the whole column above the box counts, so jumping over it still finds it
    const lb = this.lifeBox;
    if (lb && !lb.opened && !this.inTank && overlap(p, { x: lb.x, y: -64, w: lb.w, h: lb.y + lb.h + 64 })) this.openLifeBox();
  }

  updateCamera() {
    const maxX = this.cols * 16 - W;
    if (this.camLock !== null) {
      this.cam.x += clamp(this.camLock - this.cam.x, -3, 3);
      return;
    }
    let target = clamp(this.player.cx - W / 2, 0, maxX);
    // don't peek into a boss arena before its gate
    if (this.gateCol !== null && !this.bossStarted) target = Math.min(target, this.gateCol * 16 + 16 - W);
    this.cam.x = target;
  }

  // ------------------------------------------------------------ dialog & pause

  updateDialog(inp) {
    const d = this.dialog;
    const total = d.pages[d.i].join(' ').length;
    const advance = inp.anyPressed('jump', 'shoot', 'start');
    if (d.chars < total) {
      d.chars++;
      if (d.chars % 3 === 0) this.sfx('text');
      if (advance) d.chars = total;
    } else if (advance) {
      d.i++;
      d.chars = 0;
      this.sfx('select');
      if (d.i >= d.pages.length) {
        this.dialog = null;
        d.onDone?.();
      }
    }
  }

  openPause() {
    const items = [...HERO_ORDER.filter((h) => this.party[h] !== undefined), 'exit'];
    this.pause = { items, idx: Math.max(0, items.indexOf(this.active)) };
    this.sfx('pause');
  }

  updatePause(inp) {
    const pz = this.pause;
    if (inp.pressed('down')) { pz.idx = (pz.idx + 1) % pz.items.length; this.sfx('select'); }
    if (inp.pressed('up')) { pz.idx = (pz.idx + pz.items.length - 1) % pz.items.length; this.sfx('select'); }
    if (inp.pressed('start')) { this.pause = null; this.sfx('pause'); return; }
    if (inp.anyPressed('jump', 'shoot')) {
      const it = pz.items[pz.idx];
      if (it === 'exit') { this.game.toStageSelect(); return; }
      if (this.inTank || this.party[it] > 0) { this.pause = null; this.swapHero(it); }
      else this.sfx('tink');
    }
  }

  debugKeys(inp) {
    const p = this.player;
    if (inp.rawPressed('KeyN')) {
      const spots = [...this.checkpoints.map((c) => c.x), this.gateCol !== null ? this.gateCol * 16 - 24 : null, this.goal ? this.goal.x - 24 : null].filter((x) => x !== null && x > p.cx + 20).sort((a, b) => a - b);
      if (spots.length) { p.x = spots[0] - p.w / 2; p.y = 20; p.vy = 0; p.wall = 0; }
    }
    if (inp.rawPressed('KeyI')) { this.invincible = !this.invincible; this.showMessage(this.invincible ? 'INVINCIBLE' : 'MORTAL', 60); }
    if (this.invincible) p.inv = Math.max(p.inv, 2);
    if (inp.rawPressed('KeyK')) for (const e of this.enemies) if (e.active && !e.isBoss && !e.dead) e.die();
    if (inp.rawPressed('KeyB') && this.boss && !this.boss.dead) this.boss.hp = 1;
    if (inp.rawPressed('KeyG')) {
      for (const h of HERO_ORDER) { this.game.addHero(h); if (this.party[h] === undefined) this.party[h] = 28; }
      this.game.save.life = true;
      this.game.persist();
      this.showMessage('ALL MEGA MEN + THE LIFE', 60);
    }
  }

  // ------------------------------------------------------------ drawing

  draw(ctx) {
    const sh = this.shakeT > 0 ? () => Math.round(Math.random() * 4 - 2) : () => 0;
    const cam = { x: Math.round(this.cam.x) + sh(), y: sh() };
    drawBackground(ctx, this.theme, cam.x, 0, this.t);
    this.drawDecor(ctx, cam);
    this.drawTiles(ctx, cam);
    this.drawObjects(ctx, cam);
    if (this.lifeBox) this.drawLifeBox(ctx, cam);
    for (const it of this.items) this.drawItem(ctx, cam, it);
    for (const e of this.enemies) if (e.active) e.draw(ctx, cam);
    this.drawPlayer(ctx, cam);
    for (const b of this.bullets) drawBullet(ctx, cam, b, this.t);
    for (const f of this.effects) f.draw(ctx, cam);
    this.drawHud(ctx);
    if (this.activeSign && !this.dialog && this.phase === 'play') this.drawBox(ctx, wrap(this.activeSign.text, 34), 30);
    if (this.message) {
      rect(ctx, 0, 104, W, 15, '#000000');
      drawText(ctx, this.message.text, W / 2, 108, '#fcfcfc', { align: 'center' });
    }
    if (this.phase === 'ready' && (this.timer >> 3) % 2 === 0) drawText(ctx, 'READY', W / 2, 108, '#fcfcfc', { align: 'center' });
    if (this.dialog) this.drawDialog(ctx);
    if (this.pause) this.drawPause(ctx);
  }

  drawDecor(ctx, cam) {
    for (const d of this.decor) {
      if (d.kind === 'tree') ctx.drawImage(blueTreeImage(), Math.round(d.x - 48 - cam.x), Math.round(d.y - 104 - cam.y));
      else if (d.kind === 'house') {
        if (d.x + 48 < cam.x || d.x > cam.x + W) continue;
        ctx.drawImage(houseImage(d.variant), Math.round(d.x - cam.x), Math.round(d.y - 48 - cam.y));
        if (this.ending && this.phase === 'clear' && this.timer > 60) {
          // villagers peek out of the doors
          const vx = Math.round(d.x - cam.x) + 12, vy = Math.round(d.y - cam.y) - 16;
          blob(ctx, vx + 3, vy, 3, 3, '#fcd8a8');
          rect(ctx, vx, vy + 3, 7, 12, ['#0058f8', '#00a800', '#d82800'][d.variant % 3]);
          if ((this.t >> 4) % 2) { rect(ctx, vx - 2, vy - 2, 2, 5, '#fcd8a8'); rect(ctx, vx + 7, vy - 2, 2, 5, '#fcd8a8'); }
        }
      }
    }
  }

  drawTiles(ctx, cam) {
    const T = this.tiles;
    const c0 = Math.max(0, Math.floor(cam.x / 16)), c1 = Math.min(this.cols - 1, Math.floor((cam.x + W) / 16));
    for (let r = 0; r < this.rows; r++) {
      for (let c = c0; c <= c1; c++) {
        const t = this.map[r * this.cols + c];
        if (t === EMPTY) continue;
        const x = c * 16 - cam.x, y = r * 16 - cam.y;
        const above = this.tile(c, r - 1);
        const v = (c * 7 + r * 13) % 3;
        let img = null;
        switch (t) {
          case SOLID: img = above === SOLID || above === ALT || above === SPIKE || r === 0 ? T.solid[v] : T.solidTop[v]; break;
          case ALT: img = above === EMPTY || above === LADDER || above === ONEWAY ? T.altTop : T.alt; break;
          case ONEWAY: img = T.oneway; break;
          case LADDER: img = T.ladder; break;
          case SPIKE: {
            const open = (cc, rr) => !this.solidTile(cc, rr) && this.tile(cc, rr) !== LAVA;
            img = open(c, r - 1) ? T.spike.up : open(c - 1, r) ? T.spike.left : open(c + 1, r) ? T.spike.right : T.spike.down;
            if (open(c, r - 1) || open(c - 1, r) || open(c + 1, r) || open(c, r + 1)) { rect(ctx, x, y, 16, 16, this.theme === 'volt' ? '#000040' : '#383838'); }
            break;
          }
          case LAVA:
            if (above === LAVA) rect(ctx, x, y, 16, 16, '#d82800');
            else img = T.lava[((this.t >> 3) + c) % 4];
            break;
          case GATE:
            if (this.gateClosed) img = T.gate;
            else { rect(ctx, x, y, 2, 16, '#383838'); rect(ctx, x + 14, y, 2, 16, '#383838'); }
            break;
        }
        if (img) ctx.drawImage(img, x, y);
      }
    }
  }

  drawObjects(ctx, cam) {
    for (const l of this.lifts) {
      const x = Math.round(l.x - cam.x), y = Math.round(l.y - cam.y);
      rect(ctx, x, y, 32, 8, '#000000');
      rect(ctx, x + 1, y + 1, 30, 6, '#d82800');
      rect(ctx, x + 1, y + 1, 30, 2, '#fc7460');
      rect(ctx, x + 6, y + 8, 4, 3 + ((this.t >> 2) % 2), '#fca044');
      rect(ctx, x + 22, y + 8, 4, 3 + ((this.t >> 2) % 2), '#fca044');
    }
    for (const c of this.checkpoints) {
      const x = Math.round(c.x - cam.x), y = Math.round(c.y - cam.y);
      if (x < -16 || x > W + 16) continue;
      rect(ctx, x, y - 24, 2, 24, '#7c7c7c');
      rect(ctx, x + 2, y - 24 + (c.reached ? 0 : 14), 9, 6, c.reached ? '#00a800' : '#bcbcbc');
    }
    for (const s of this.signs) {
      const x = Math.round(s.x - cam.x), y = Math.round(s.y - cam.y);
      if (x < -16 || x > W + 16) continue;
      rect(ctx, x + 7, y + 8, 2, 8, '#503000');
      rect(ctx, x + 1, y + 1, 14, 9, '#000000');
      rect(ctx, x + 2, y + 2, 12, 7, '#ac7c00');
      drawText(ctx, '?', x + 6, y + 2, '#fcfcfc');
    }
    if (this.goal) {
      const g = this.goal;
      const x = Math.round(g.x - cam.x), y = Math.round(g.y - cam.y);
      rect(ctx, x - 4, y + 28, 24, 4, '#000000');
      rect(ctx, x - 3, y + 29, 22, 2, '#7c7c7c');
      if ((this.t >> 2) % 2) { rect(ctx, x, y - 16, 16, 44, 'rgba(60,188,252,0.35)'); rect(ctx, x + 5, y - 16, 6, 44, 'rgba(252,252,252,0.5)'); }
      drawText(ctx, 'EXIT', x + 8, y - 26, '#fcfcfc', { align: 'center', shadow: '#000000' });
    }
    if (this.tankPickup) {
      const k = this.tankPickup;
      ctx.save();
      ctx.translate(Math.round(k.x - cam.x), Math.round(k.y - cam.y));
      drawTankBody(ctx, -16, -24, HERO_PAL.dark, 0);
      ctx.restore();
      if ((this.t >> 4) % 2) drawText(ctx, 'TANK', k.x - cam.x, k.y - 36 - cam.y, '#f8b800', { align: 'center', shadow: '#000000' });
    }
    if (this.capsule) {
      const c = this.capsule;
      const x = Math.round(c.x - cam.x), y = Math.round(c.y - cam.y);
      rect(ctx, x, y + 26, 24, 6, '#000000'); rect(ctx, x + 1, y + 27, 22, 4, '#7c7c7c');
      rect(ctx, x + 2, y, 20, 26, '#000000');
      rect(ctx, x + 3, y + 1, 18, 25, c.rescued ? '#203040' : '#a4e4fc');
      if (!c.rescued) {
        drawSprite(ctx, 'head', c.hero, x + 12, y + 20);
        rect(ctx, x + 5, y + 3, 2, 18, '#fcfcfc');
      }
      rect(ctx, x + 1, y - 3, 22, 4, '#000000'); rect(ctx, x + 2, y - 2, 20, 2, (this.t >> 3) % 2 ? '#f83800' : '#fca044');
    }
  }

  drawLifeBox(ctx, cam) {
    const b = this.lifeBox;
    b.t++;
    const x = Math.round(b.x - cam.x), y = Math.round(b.y - cam.y);
    if (x < -40 || x > W + 40) return;
    drawLifeBox(ctx, x, y, this.t, b.opened);
    if (!b.opened && (this.t >> 4) % 2) drawText(ctx, 'THE LIFE', x + 8, y - 16, '#3cbcfc', { align: 'center', shadow: '#000000' });
    // the blue thing floats up out of the open box
    if (b.opened && b.t < 40) {
      const oy = y + 6 - b.t;
      blob(ctx, x + 8, oy, 5, 5, b.t % 4 < 2 ? '#3cbcfc' : '#fcfcfc');
      blob(ctx, x + 8, oy, 2, 2, '#fcfcfc');
    }
  }

  drawItem(ctx, cam, it) {
    if (it.ttl < 90 && (this.t >> 2) % 2) return;
    const cx = it.x + it.w / 2 - cam.x, bottom = it.y + it.h - cam.y;
    if (it.type === 'e') drawSprite(ctx, 'pelletS', 'mega', cx, bottom);
    else if (it.type === 'E') drawSprite(ctx, 'pelletL', 'mega', cx, bottom);
    else drawSprite(ctx, 'oneUp', 'mega', cx, bottom);
  }

  drawPlayer(ctx, cam) {
    const p = this.player;
    switch (this.phase) {
      case 'wake': case 'waking': {
        if (this.phase === 'waking') {
          drawSprite(ctx, 'heroJump', this.active, p.cx - cam.x, p.y + p.h - cam.y - Math.min(6, this.timer, 30 - this.timer));
          return;
        }
        drawSprite(ctx, 'heroSleep', this.active, p.cx - cam.x, p.y + p.h - cam.y);
        const z = (this.t >> 5) % 3;
        for (let i = 0; i <= z; i++) drawText(ctx, 'Z', p.cx - cam.x - 6 + i * 6, p.y - cam.y - i * 7 - ((this.t >> 2) % 4), '#fcfcfc');
        return;
      }
      case 'ready': case 'ko': case 'dead': return;
      case 'teleport': {
        const target = p.y + p.h - 24;
        if (this.beamY < target) { this.drawBeam(ctx, p.cx - cam.x, this.beamY - cam.y); return; }
        if (this.beamDone < 8 && (this.beamDone >> 1) % 2) { this.drawBeam(ctx, p.cx - cam.x, target - cam.y); return; }
        break;
      }
      case 'clear':
        if (this.beamOut) { this.drawBeam(ctx, p.cx - cam.x, p.y + p.h - 24 - cam.y - (this.beamUp || 0)); return; }
        break;
    }
    p.draw(ctx, cam);
  }

  drawBeam(ctx, x, y) {
    const col = HERO_PAL[this.active].L;
    const w = this.inTank ? 8 : 4;
    rect(ctx, x - w / 2 - 1, y, w + 2, 24, '#000000');
    rect(ctx, x - w / 2, y + 1, w, 22, col);
    rect(ctx, x - 1, y + 1, 2, 22, '#fcfcfc');
  }

  drawBox(ctx, lines, y) {
    const h = lines.length * 10 + 8;
    rect(ctx, 14, y, W - 28, h, '#fcfcfc');
    rect(ctx, 15, y + 1, W - 30, h - 2, '#000000');
    lines.forEach((l, i) => drawText(ctx, l, 22, y + 5 + i * 10, '#fcfcfc'));
  }

  drawDialog(ctx) {
    const d = this.dialog;
    const lines = d.pages[d.i];
    const y = this.player.y + this.player.h > 150 ? 30 : 168;
    rect(ctx, 10, y, W - 20, 62, '#fcfcfc');
    rect(ctx, 11, y + 1, W - 22, 60, '#000000');
    let left = d.chars;
    lines.forEach((l, i) => {
      if (left <= 0) return;
      const shown = l.slice(0, left);
      const speaker = /^[A-Z. ]+(\([A-Z]+\))?:/.exec(l);
      if (speaker && i === 0) {
        drawText(ctx, shown.slice(0, speaker[0].length), 20, y + 8 + i * 12, '#3cbcfc');
        drawText(ctx, shown.slice(speaker[0].length), 20 + speaker[0].length * 6, y + 8 + i * 12, '#fcfcfc');
      } else drawText(ctx, shown, 20, y + 8 + i * 12, '#fcfcfc');
      left -= l.length + 1;
    });
    if (d.chars >= lines.join(' ').length && (this.t >> 4) % 2) drawText(ctx, '>', W - 22, y + 50, '#fcfcfc');
  }

  drawPause(ctx) {
    const pz = this.pause;
    rect(ctx, 24, 24, W - 48, 184, '#fcfcfc');
    rect(ctx, 25, 25, W - 50, 182, '#000040');
    drawText(ctx, 'PAUSE', W / 2, 32, '#fcfcfc', { align: 'center' });
    drawText(ctx, `${this.def.name}`, W / 2, 44, '#3cbcfc', { align: 'center' });
    pz.items.forEach((it, i) => {
      const y = 62 + i * 20;
      const sel = i === pz.idx;
      if (sel && (this.t >> 3) % 2) drawText(ctx, '>', 34, y + 2, '#fcfcfc');
      if (it === 'exit') { drawText(ctx, 'EXIT STAGE', 56, y + 2, sel ? '#fcfcfc' : '#bcbcbc'); return; }
      drawSprite(ctx, 'head', this.party[it] > 0 || this.inTank ? it : 'dark', 48, y + 9);
      drawText(ctx, HEROES[it].name + (it === this.active ? (this.inTank ? ' (PILOT)' : ' *') : ''), 56, y, sel ? '#fcfcfc' : '#bcbcbc');
      const hp = this.party[it];
      rect(ctx, 56, y + 10, 58, 4, '#000000');
      rect(ctx, 57, y + 11, Math.round((hp / 28) * 56), 2, hp > 0 ? '#fce4a0' : '#7c7c7c');
      if (hp <= 0 && !this.inTank) drawText(ctx, 'DOWN', 122, y + 8, '#d82800');
    });
    const sel = pz.items[pz.idx];
    if (sel !== 'exit') wrap(HEROES[sel].about, 30).forEach((l, i) => drawText(ctx, l, 36, 162 + i * 10, '#f8b800'));
    drawSprite(ctx, 'head', 'mega', 40, 204);
    drawText(ctx, 'X' + this.game.lives, 48, 197, '#fcfcfc');
    drawText(ctx, 'ENTER: RESUME', W - 34, 197, '#7c7c7c', { align: 'right' });
  }

  drawHud(ctx) {
    const p = this.player;
    const pal = HERO_PAL[this.active];
    drawBar(ctx, 12, 12, Math.ceil((p.hp / p.maxHp) * 28), this.inTank ? '#fce4a0' : '#fce4a0', pal.L);
    if (this.inTank) drawText(ctx, 'T', 13, 72, '#fcfcfc');
    // the team
    let x = 26;
    for (const h of HERO_ORDER) {
      if (this.party[h] === undefined) continue;
      const alive = this.inTank || this.party[h] > 0;
      if (h === this.active) { rect(ctx, x - 1, 11, 10, 10, '#fcfcfc'); rect(ctx, x, 12, 8, 8, '#000000'); }
      drawSprite(ctx, 'head', alive ? h : 'dark', x + 4, 20);
      if (!this.inTank) {
        rect(ctx, x, 22, 8, 2, '#000000');
        rect(ctx, x, 22, Math.round((this.party[h] / 28) * 8), 2, alive ? '#fce4a0' : '#7c7c7c');
      }
      x += 12;
    }
    drawText(ctx, 'X' + this.game.lives, 26, 27, '#fcfcfc', { shadow: '#000000' });
    if (this.game.save.life) drawLifeIcon(ctx, 46, 27, this.t);
    if (this.def.clearAll && !this.bossStarted) {
      const left = this.enemiesLeft;
      drawText(ctx, left > 0 ? `ROBOTS LEFT ${left}` : 'GATE OPEN >', W / 2 + 10, 12, left > 0 ? '#fcfcfc' : '#b8f818', { align: 'center', shadow: '#000000' });
    }
    if (this.boss && !this.boss.dead && this.bossStarted) {
      drawBar(ctx, W - 20, 12, Math.ceil((Math.max(0, this.boss.hp) / this.boss.maxHp) * Math.min(28, this.bossBar)), '#fce4a0', '#f83800');
    }
  }
}

function drawLifeIcon(ctx, x, y, t) {
  rect(ctx, x, y, 8, 8, '#000000');
  rect(ctx, x + 1, y + 1, 6, 6, '#0058f8');
  rect(ctx, x + 1, y + 1, 6, 1, '#3cbcfc');
  rect(ctx, x + 3, y + 3, 2, 3, (t >> 4) % 2 ? '#fcfcfc' : '#a4e4fc');
}

function drawBar(ctx, x, y, ticks, fill, edge) {
  rect(ctx, x, y, 8, 58, '#000000');
  for (let i = 0; i < 28; i++) {
    const ty = y + 56 - i * 2;
    if (i < ticks) {
      rect(ctx, x + 1, ty, 6, 1, fill);
      rect(ctx, x + 3, ty, 2, 1, '#fcfcfc');
      rect(ctx, x + 1, ty, 1, 1, edge);
      rect(ctx, x + 6, ty, 1, 1, edge);
    }
  }
}

function drawBullet(ctx, cam, b, t) {
  const x = Math.round(b.x - cam.x), y = Math.round(b.y - cam.y);
  const cx = x + b.w / 2, cy = y + b.h / 2;
  const f = (t >> 1) % 2;
  switch (b.kind) {
    case 'pellet': rect(ctx, x, y, b.w, b.h, '#f8b800'); rect(ctx, x + 1, y + 1, b.w - 2, b.h - 2, '#fcfcfc'); break;
    case 'charged':
      if (!b.vx) {
        // fired straight down or up
        blob(ctx, cx, cy, 6, 8, f ? '#3cbcfc' : '#a4e4fc');
        blob(ctx, cx, cy + (b.vy > 0 ? 2 : -2), 4, 5, '#fcfcfc');
        rect(ctx, cx - 1, b.vy > 0 ? y - 6 : y + b.h, 2, 6, '#3cbcfc');
        break;
      }
      blob(ctx, cx, cy, 8, 6, f ? '#3cbcfc' : '#a4e4fc');
      blob(ctx, cx + (b.vx > 0 ? 2 : -2), cy, 5, 4, '#fcfcfc');
      rect(ctx, b.vx > 0 ? x - 6 : x + b.w, cy - 1, 6, 2, '#3cbcfc');
      break;
    case 'flame': case 'fireShell':
      blob(ctx, cx, cy, b.w / 2, b.h / 2, f ? '#f83800' : '#fca044');
      blob(ctx, cx + (b.vx > 0 ? 1 : -1), cy, b.w / 4, b.h / 4, '#fce4a0');
      break;
    case 'wind': case 'windShell':
      if (b.h > b.w) {
        rect(ctx, x + 2, y, 2, b.h, '#fcfcfc');
        rect(ctx, x, y + 2, 2, b.h - 4, '#b8f818');
        rect(ctx, x + b.w - 2, y + 2, 2, b.h - 4, '#b8f818');
        break;
      }
      rect(ctx, x, y + 2, b.w, 2, '#fcfcfc');
      rect(ctx, x + 2, y, b.w - 4, 2, '#b8f818');
      rect(ctx, x + 2, y + b.h - 2, b.w - 4, 2, '#b8f818');
      break;
    case 'spark': case 'voltShell':
      rect(ctx, cx - 1, y, 2, b.h, '#fcbc3c');
      rect(ctx, x, cy - 1, b.w, 2, '#fcbc3c');
      rect(ctx, cx - 1, cy - 1, 2, 2, '#fcfcfc');
      break;
    case 'shell':
      rect(ctx, x, y, 8, 6, '#000000');
      rect(ctx, x + 1, y + 1, 6, 4, '#bcbcbc');
      rect(ctx, b.vx >= 0 ? x + 5 : x + 1, y + 1, 2, 4, '#fce4a0');
      break;
    case 'quake':
      for (let i = 0; i < 3; i++) {
        const hh = 6 + ((t + i * 3) % 6) * 2;
        rect(ctx, x + i * 4, y + b.h - hh, 3, hh, i === 1 ? '#fcfcfc' : f ? '#b8f818' : '#58f898');
      }
      break;
    case 'bquake':
      for (let i = 0; i < 4; i++) {
        const hh = 8 + ((t + i * 3) % 6) * 2;
        rect(ctx, x + i * 4 - 1, y + b.h - hh, 3, hh, i === 1 || i === 2 ? '#fcfcfc' : f ? '#3cbcfc' : '#0058f8');
      }
      break;
    case 'boom': break;
    case 'ball': rect(ctx, x, y, 6, 6, '#000000'); rect(ctx, x + 1, y + 1, 4, 4, '#fca044'); rect(ctx, x + 2, y + 2, 2, 2, '#fcfcfc'); break;
    case 'fireball': blob(ctx, cx, cy, 4, 4, f ? '#f83800' : '#fca044'); blob(ctx, cx, cy, 2, 2, '#fce4a0'); break;
    case 'feather': rect(ctx, x, y + 2, 6, 2, '#fcfcfc'); rect(ctx, x + 1, y + 1, 3, 1, '#a4e4fc'); rect(ctx, x + 2, y + 4, 3, 1, '#a4e4fc'); break;
    case 'gspark':
      blob(ctx, cx, cy, 6, 6, f ? '#fcbc3c' : '#fcfcfc');
      for (let i = 0; i < 4; i++) rect(ctx, cx + Math.cos(t + i * 1.6) * 8, cy + Math.sin(t + i * 1.6) * 8, 2, 2, '#fcbc3c');
      break;
    case 'bolt': rect(ctx, x, y, 6, 6, f ? '#fcbc3c' : '#fcfcfc'); break;
    case 'mshell': blob(ctx, cx, cy, 4, 4, '#000000'); blob(ctx, cx, cy, 3, 3, '#7c7c7c'); rect(ctx, cx - 1, cy - 2, 2, 2, '#fcfcfc'); break;
    case 'shock':
      for (let i = 0; i < 4; i++) {
        const hh = 4 + ((t + i * 2) % 5) * 2;
        rect(ctx, x + i * 3 + 1, y + b.h - hh, 3, hh, i % 2 ? '#fca044' : '#bcbcbc');
      }
      break;
    case 'missile': {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(Math.atan2(b.vy, b.vx));
      rect(ctx, -6, -3, 12, 6, '#000000');
      rect(ctx, -5, -2, 9, 4, '#bcbcbc');
      rect(ctx, 3, -2, 3, 4, '#f83800');
      rect(ctx, -8, -1, 3, 2, f ? '#fca044' : '#fce4a0');
      ctx.restore();
      break;
    }
    case 'laser':
      rect(ctx, x, y, b.w, b.h, f ? '#f83800' : '#fca044');
      rect(ctx, x, y + 2, b.w, b.h - 4, '#fcfcfc');
      break;
    default: rect(ctx, x, y, b.w, b.h, '#fcfcfc');
  }
}
