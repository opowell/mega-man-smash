// Title, stage select, game over, the ending, and the Launchpad preview.

import { W, H, drawBackground, blueTreeImage, drawLifeBox, drawSprite, sprite, silhouette, rect, blob, tileSet, HERO_PAL, houseImage } from './gfx.js';
import { drawText } from './font.js';
import { LEVELS, STAGE_ORDER, HERO_ORDER } from './levels.js';
import { drawTankBody } from './tank.js';

// The stage select grid: four across, two rows.
const COLS = 4;

function logo(ctx, x, y, t) {
  const outline = (text, px, py, scale, color, shadow) => {
    const o = Math.ceil(scale / 2);
    drawText(ctx, text, px + o, py + o, shadow, { scale, align: 'center' });
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) drawText(ctx, text, px + dx, py + dy, '#000000', { scale, align: 'center' });
    drawText(ctx, text, px, py, color, { scale, align: 'center' });
  };
  outline('MEGA MAN', x, y, 3, '#3cbcfc', '#0058f8');
  outline('SMASH', x, y + 26, 4, t % 8 < 4 ? '#b8f818' : '#58f898', '#00a800');
}

function ground(ctx, theme, y, offset) {
  const T = tileSet(theme);
  for (let x = -16; x < W + 16; x += 16) {
    const px = x - (Math.floor(offset) % 16);
    ctx.drawImage(T.solidTop[(Math.floor((x + offset) / 16) % 3 + 3) % 3], px, y);
    for (let yy = y + 16; yy < H; yy += 16) ctx.drawImage(T.solid[0], px, yy);
  }
}

export class TitleScene {
  constructor(game) {
    this.game = game;
    this.t = 0;
    this.items = game.hasProgress ? ['CONTINUE', 'NEW GAME'] : ['START'];
    this.idx = 0;
    game.sound.play('title');
  }
  update(inp) {
    this.t++;
    if (this.items.length > 1 && (inp.pressed('up') || inp.pressed('down'))) { this.idx = 1 - this.idx; this.game.sound.sfx('select'); }
    if (inp.anyPressed('start', 'jump', 'shoot')) {
      this.game.sound.sfx('confirm');
      if (this.items[this.idx] === 'CONTINUE') this.game.continueGame();
      else this.game.newGame();
    }
  }
  draw(ctx) {
    const t = this.t;
    drawBackground(ctx, 'meadow', t * 0.5, 0, t);
    ground(ctx, 'meadow', 192, t * 0.5);
    ctx.drawImage(blueTreeImage(), 150, 88);
    drawSprite(ctx, 'heroStand', 'mega', 168, 192);
    logo(ctx, W / 2, 28, t);
    this.items.forEach((it, i) => {
      const y = 112 + i * 14;
      drawText(ctx, it, W / 2 - 50, y, '#fcfcfc', { shadow: '#000000' });
      if (i === this.idx && (t >> 4) % 2) drawText(ctx, '>', W / 2 - 60, y, '#fcfcfc', { shadow: '#000000' });
    });
    drawText(ctx, 'ARROWS MOVE  Z JUMP  X SHOOT', W / 2, 206, '#fcfcfc', { align: 'center', shadow: '#000000' });
    drawText(ctx, 'Q/E SWITCH  SHIFT BOOST  M MUTE', W / 2, 218, '#fcfcfc', { align: 'center', shadow: '#000000' });
  }
}

export class StageSelectScene {
  constructor(game, from) {
    this.game = game;
    this.t = 0;
    const i = from ? STAGE_ORDER.indexOf(from) : 0;
    // land on the next stage that still needs clearing
    let idx = i;
    for (let k = 1; k <= STAGE_ORDER.length; k++) {
      const s = STAGE_ORDER[(i + k) % STAGE_ORDER.length];
      if (game.unlocked(s) && !game.save.cleared[s]) { idx = STAGE_ORDER.indexOf(s); break; }
    }
    this.idx = Math.max(0, idx);
    game.sound.play('select');
  }
  update(inp) {
    this.t++;
    const count = STAGE_ORDER.length;
    const rows = Math.ceil(count / COLS);
    const row = Math.floor(this.idx / COLS);
    const inRow = Math.min(COLS, count - row * COLS);
    let c = this.idx % COLS, r = row;
    if (inp.pressed('left')) c = (c + inRow - 1) % inRow;
    if (inp.pressed('right')) c = (c + 1) % inRow;
    if (inp.pressed('up')) r = (r + rows - 1) % rows;
    if (inp.pressed('down')) r = (r + 1) % rows;
    const n = Math.min(count - 1, r * COLS + c);
    if (n !== this.idx) { this.idx = n; this.game.sound.sfx('select'); }
    if (inp.anyPressed('start', 'jump', 'shoot')) {
      const id = STAGE_ORDER[this.idx];
      if (this.game.unlocked(id)) { this.game.sound.sfx('confirm'); this.game.startStage(id); }
      else this.game.sound.sfx('tink');
    }
  }
  draw(ctx) {
    const g = this.game;
    rect(ctx, 0, 0, W, H, '#000058');
    for (let y = 0; y < H; y += 8) rect(ctx, 0, y, W, 1, '#000040');
    drawText(ctx, 'STAGE SELECT', W / 2, 12, '#fcfcfc', { align: 'center', scale: 2 });
    STAGE_ORDER.forEach((id, i) => {
      const x = 4 + (i % COLS) * 63, y = 36 + Math.floor(i / COLS) * 84;
      const sel = i === this.idx;
      const open = g.unlocked(id);
      rect(ctx, x, y, 60, 72, sel && (this.t >> 3) % 2 ? '#fcfcfc' : '#3cbcfc');
      rect(ctx, x + 2, y + 2, 56, 68, '#000000');
      rect(ctx, x + 4, y + 4, 52, 50, open ? '#0058f8' : '#202020');
      ctx.save();
      ctx.beginPath();
      ctx.rect(x + 4, y + 4, 52, 50);
      ctx.clip();
      this.icon(ctx, id, x + 30, y + 52, open);
      ctx.restore();
      drawText(ctx, LEVELS[id].short, x + 30, y + 59, open ? '#fcfcfc' : '#7c7c7c', { align: 'center' });
      if (g.save.cleared[id]) drawText(ctx, 'CLEAR', x + 30, y + 8, '#b8f818', { align: 'center', shadow: '#000000' });
    });
    // the team
    drawText(ctx, 'TEAM', 14, 210, '#7c7c7c');
    HERO_ORDER.forEach((h, i) => {
      const have = g.save.heroes.includes(h);
      ctx.drawImage(sprite('head', have ? h : 'dark'), 46 + i * 20, 206, 16, 16);
    });
    if (g.save.life) {
      drawLifeBox(ctx, 170, 206, this.t);
    }
    if (g.save.cleared.hangar) {
      ctx.save();
      ctx.translate(140, 222);
      ctx.scale(0.5, 0.5);
      drawTankBody(ctx, 0, -24, HERO_PAL.mega, 0);
      ctx.restore();
    }
    drawText(ctx, 'LIVES X' + g.lives, W - 14, 210, '#fcfcfc', { align: 'right' });
    const id = STAGE_ORDER[this.idx];
    const reward = { ember: 'FREE BLAZE MAN', wind: 'FREE GALE MAN', volt: 'FREE VOLT MAN', hangar: 'FIND THE TANK', village: 'SMASH THE EVIL MECH', meadow: 'WHERE IT ALL BEGAN', homeland: g.save.life ? 'THE MEGA MEN\'S HOME' : 'FIND THE LIFE' }[id];
    drawText(ctx, g.unlocked(id) ? reward : 'LOCKED', W / 2, 224, '#f8b800', { align: 'center' });
  }
  icon(ctx, id, cx, bottom, open) {
    if (!open) { drawText(ctx, '?', cx, bottom - 30, '#7c7c7c', { scale: 3, align: 'center' }); return; }
    const rescued = (h) => this.game.save.heroes.includes(h);
    switch (id) {
      case 'meadow': ctx.drawImage(blueTreeImage(), cx - 30, bottom - 52, 60, 65); break;
      case 'homeland':
        rect(ctx, cx - 32, bottom - 50, 64, 50, '#000058');
        for (let i = 0; i < 10; i++) rect(ctx, cx - 26 + ((i * 23) % 52), bottom - 46 + ((i * 17) % 22), 1, 1, '#fcfcfc');
        ctx.drawImage(blueTreeImage(), cx - 36, bottom - 40, 36, 39);
        rect(ctx, cx - 32, bottom - 6, 64, 6, '#3cbcfc');
        ctx.save();
        ctx.translate(cx + 2, bottom - 30);
        ctx.scale(1.5, 1.5);
        drawLifeBox(ctx, 0, 0, this.t, false);
        ctx.restore();
        break;
      case 'ember': case 'wind': case 'volt': {
        const h = { ember: 'blaze', wind: 'gale', volt: 'volt' }[id];
        rect(ctx, cx - 32, bottom - 50, 64, 50, { ember: '#581000', wind: '#68a8fc', volt: '#000040' }[id]);
        const img = rescued(h) ? sprite('heroStand', h) : silhouette('heroStand', h, false, '#000000');
        ctx.drawImage(img, cx - 16, bottom - 44, 32, 42);
        if (!rescued(h)) drawText(ctx, '?', cx, bottom - 30, '#fcfcfc', { scale: 2, align: 'center' });
        break;
      }
      case 'hangar':
        rect(ctx, cx - 32, bottom - 50, 64, 50, '#383838');
        ctx.save();
        ctx.translate(cx, bottom - 6);
        ctx.scale(1.5, 1.5);
        drawTankBody(ctx, -16, -24, this.game.save.cleared.hangar ? HERO_PAL.mega : HERO_PAL.dark, 0);
        ctx.restore();
        break;
      case 'village':
        rect(ctx, cx - 32, bottom - 50, 64, 50, '#e45c50');
        ctx.drawImage(houseImage(0), cx - 34, bottom - 40, 40, 40);
        // the Mech's head looming over the roofs
        rect(ctx, cx + 2, bottom - 44, 26, 20, '#000000');
        rect(ctx, cx + 3, bottom - 43, 24, 18, '#585858');
        rect(ctx, cx + 8, bottom - 37, 14, 6, '#000000');
        rect(ctx, cx + 9, bottom - 36, 12, 4, (Math.floor(Date.now() / 300) % 2) ? '#f83800' : '#fca044');
        rect(ctx, cx - 2, bottom - 24, 34, 24, '#881400');
        break;
    }
  }
}

export class GameOverScene {
  constructor(game) {
    this.game = game;
    this.t = 0;
    this.idx = 0;
    game.sound.play('gameover');
  }
  update(inp) {
    this.t++;
    if (inp.pressed('up') || inp.pressed('down')) { this.idx = 1 - this.idx; this.game.sound.sfx('select'); }
    if (this.t > 40 && inp.anyPressed('start', 'jump', 'shoot')) {
      this.game.sound.sfx('confirm');
      if (this.idx === 0) this.game.continueGame();
      else this.game.toTitle();
    }
  }
  draw(ctx) {
    rect(ctx, 0, 0, W, H, '#000000');
    drawText(ctx, 'GAME OVER', W / 2, 80, '#fcfcfc', { align: 'center', scale: 3 });
    ['CONTINUE', 'TITLE'].forEach((it, i) => {
      drawText(ctx, it, W / 2 - 30, 130 + i * 16, '#fcfcfc');
      if (i === this.idx && (this.t >> 4) % 2) drawText(ctx, '>', W / 2 - 42, 130 + i * 16, '#fcfcfc');
    });
  }
}

const CREDITS = [
  'THE EVIL MECH IS SMASHED!',
  '',
  'THE VILLAGE IS FREE,',
  'AND THE BLUE TREE',
  'STILL STANDS.',
  '',
  'STARRING',
  '',
  'MEGA MAN',
  'BLAZE MAN',
  'GALE MAN',
  'VOLT MAN',
  'AND THE TANK',
  '',
  '',
  'THANK YOU FOR PLAYING',
  '',
  'MEGA MAN SMASH',
];

export class EndingScene {
  constructor(game) {
    this.game = game;
    this.t = 0;
    game.sound.play('ending');
  }
  update(inp) {
    this.t++;
    if (this.t > 120 && inp.anyPressed('start') || (this.done && inp.anyPressed('start', 'jump', 'shoot'))) this.game.toTitle();
  }
  draw(ctx) {
    const t = this.t;
    drawBackground(ctx, 'village', t * 0.3, 0, t);
    ground(ctx, 'village', 192, t * 0.3);
    ctx.drawImage(blueTreeImage(), 10, 88);
    const heroes = this.game.save.heroes;
    heroes.forEach((h, i) => {
      const jump = Math.abs(Math.sin((t + i * 15) * 0.08)) * 10;
      drawSprite(ctx, jump > 6 ? 'heroJump' : 'heroStand', h, 108 + i * 22, 192 - jump);
    });
    ctx.save();
    ctx.translate(212, 192);
    drawTankBody(ctx, -16, -24, HERO_PAL.mega, t * 0.2);
    ctx.restore();
    const scroll = Math.min(t * 0.4, CREDITS.length * 12 + 40);
    CREDITS.forEach((line, i) => {
      const y = 200 - scroll + i * 12;
      if (y > 8 && y < 160) drawText(ctx, line, W / 2, y, '#fcfcfc', { align: 'center', shadow: '#000000' });
    });
    if (scroll >= CREDITS.length * 12 + 40) {
      this.done = true;
      drawText(ctx, 'THE END', W / 2, 70, '#fcfcfc', { align: 'center', scale: 3, shadow: '#000000' });
      if ((t >> 5) % 2) drawText(ctx, 'PRESS START', W / 2, 110, '#fcfcfc', { align: 'center', shadow: '#000000' });
    }
  }
}

// A still for the Launchpad: Mega Man leaping, fist swinging down in green energy.
export class PreviewScene {
  constructor(game) { this.game = game; this.t = 0; }
  update() { this.t++; }
  draw(ctx) {
    const S = ctx.canvas.width;
    // the scene behind, drawn at 2x
    const bg = document.createElement('canvas');
    bg.width = S / 2;
    bg.height = S / 2;
    const b = bg.getContext('2d');
    b.imageSmoothingEnabled = false;
    rect(b, 0, 0, 128, 128, '#3cbcfc');
    rect(b, 0, 0, 128, 24, '#68a8fc');
    blob(b, 100, 18, 14, 5, '#fcfcfc');
    blob(b, 110, 14, 9, 5, '#fcfcfc');
    for (let x = 0; x < 128; x += 2) { const h = Math.sin(x * 0.05 + 1) * 8; rect(b, x, 84 - h, 2, 60, '#58d8a8'); }
    b.drawImage(blueTreeImage(), -30, 4);
    const T = tileSet('meadow');
    for (let x = 0; x < 128; x += 16) { b.drawImage(T.solidTop[(x / 16) % 3], x, 104); b.drawImage(T.solid[0], x, 120); }
    // cracks where the fist will land
    for (const [dx, dy, w] of [[-14, 2, 6], [-8, 5, 4], [6, 3, 7], [12, 6, 4], [-2, 8, 3]]) rect(b, 78 + dx, 104 + dy, w, 1, '#000000');
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(bg, 0, 0, S, S);

    // shockwave of green energy on the ground
    const gx = 156, gy = 208;
    ctx.fillStyle = '#58f898';
    for (let i = 0; i < 14; i++) {
      const a = -Math.PI + (i / 13) * Math.PI;
      for (let k = 0; k < 9; k++) {
        const d = 22 + k * 4;
        ctx.fillRect(Math.round(gx + Math.cos(a) * d), Math.round(gy + Math.sin(a) * d * 0.55), 4, 4);
      }
    }
    ctx.fillStyle = '#b8f818';
    for (let i = 0; i < 14; i++) {
      const a = -Math.PI + (i / 13) * Math.PI + 0.1;
      for (let k = 0; k < 5; k++) ctx.fillRect(Math.round(gx + Math.cos(a) * (12 + k * 4)), Math.round(gy + Math.sin(a) * (12 + k * 4) * 0.55), 4, 4);
    }
    blob(ctx, gx, gy - 2, 22, 7, '#fcfcfc');

    // energy streaks trailing from above
    for (let i = 0; i < 9; i++) {
      const x = 92 + i * 10 + ((i * 7) % 5);
      const len = 30 + ((i * 13) % 4) * 14;
      rect(ctx, x, 8 + ((i * 11) % 5) * 6, 4, len, i % 2 ? '#58f898' : '#b8f818');
    }

    // Mega Man, 4x, with a green glow
    const scale = 4;
    const hero = sprite('heroSmash', 'mega');
    const hx = 92, hy = 52;
    // the arc of the fist swinging down
    const ax = hx + 9 * scale, ay = hy + 9 * scale;
    for (let k = 0; k < 3; k++) {
      const rad = 52 + k * 6;
      for (let a = -1.25; a < 1.15; a += 0.035) {
        rect(ctx, ax + Math.cos(a) * rad, ay + Math.sin(a) * rad, 4, 4, ['#fcfcfc', '#b8f818', '#58f898'][k]);
      }
    }
    for (const [color, grow] of [['#00a844', 12], ['#58f898', 8], ['#b8f818', 4]]) {
      const sil = silhouette('heroSmash', 'mega', false, color);
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1], [1, -1], [-1, 1]]) ctx.drawImage(sil, hx + dx * grow, hy + dy * grow, hero.width * scale, hero.height * scale);
    }
    ctx.drawImage(hero, hx, hy, hero.width * scale, hero.height * scale);
    // the fist crackles
    const fx = hx + 15 * scale, fy = hy + 20 * scale;
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const d = 22 + (i % 3) * 5;
      rect(ctx, fx + Math.cos(a) * d - 2, fy + Math.sin(a) * d * 0.8 - 2, 4, 4, i % 2 ? '#fcfcfc' : '#58f898');
    }

    // title
    for (const [dx, dy] of [[-2, 0], [2, 0], [0, -2], [0, 2]]) drawText(ctx, 'MEGA MAN SMASH', S / 2 + dx, 228 + dy, '#000000', { scale: 2, align: 'center' });
    drawText(ctx, 'MEGA MAN SMASH', S / 2, 228, '#fcfcfc', { scale: 2, align: 'center' });
  }
}

