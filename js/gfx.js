// Pixel art: sprites from character grids, themed tiles, backgrounds and decor.

export const W = 256;
export const H = 240;
export const TILE = 16;

const BASE = {
  k: '#000000', w: '#fcfcfc', s: '#fcd8a8', S: '#e09858',
  y: '#f8b800', Y: '#fce4a0', r: '#d82800', R: '#fc7460', o: '#e45c10', O: '#fca044',
  g: '#00a800', G: '#b8f818', n: '#7c7c7c', N: '#bcbcbc', b: '#0058f8', c: '#3cbcfc',
  p: '#8838f8', P: '#d8b8f8', m: '#881400', t: '#503000', T: '#ac7c00', x: '#f83800',
};

export const HERO_PAL = {
  mega: { D: '#0070ec', L: '#3cbcfc' },
  blaze: { D: '#b81020', L: '#fc7460' },
  gale: { D: '#008800', L: '#80d010' },
  volt: { D: '#c84c0c', L: '#fcbc3c' },
  charge: { D: '#3cbcfc', L: '#fcfcfc' },
  smash: { D: '#00a844', L: '#b8f818' },
  dark: { D: '#383838', L: '#7c7c7c', s: '#7c7c7c', w: '#bcbcbc' },
};

const HERO_STAND_TOP = [
  '......kkkk......',
  '....kkDDDDkk....',
  '...kDDLLDDDDk...',
  '..kDDLLDDDDDDk..',
  '..kDLDDDDkkkDk..',
  '..kDDDDksssssk..',
  '..kDDDkswksswk..',
  '..kDDDkswksswk..',
  '...kDDkssssssk..',
  '....kkkskkksk...',
  '...kkLLkkkkkk...',
  '..kDDkLLLLLkDk..',
  '.kDDDkLLLLLkDDk.',
  '.kLLkkLLLLLkkLLk',
];

export const SPRITES = {
  heroStand: [...HERO_STAND_TOP,
    '.kkk.kDDDDDk.kk.',
    '.....kLLkLLk....',
    '....kLLLkLLLk...',
    '....kDDk.kDDk...',
    '...kDDDk.kDDDk..',
    '..kDDDDk.kDDDDk.',
    '..kkkkkk.kkkkkk.'],
  heroRun1: [...HERO_STAND_TOP,
    '.kkk.kDDDDDk.kk.',
    '....kLLLkLLLk...',
    '...kLLLk..kLLk..',
    '..kDDDk....kDDk.',
    '.kDDDk.....kDDDk',
    '.kDDk.....kDDDDk',
    '.kkk......kkkkk.'],
  heroRun2: [...HERO_STAND_TOP,
    '..kk.kDDDDDk.kk.',
    '.....kLLLLk.....',
    '.....kLLLLk.....',
    '.....kDDDDk.....',
    '....kDDDDDDk....',
    '....kDDDDDDDk...',
    '....kkkkkkkk....'],
  heroJump: [
    '......kkkk......',
    '....kkDDDDkk....',
    '...kDDLLDDDDk...',
    '..kDDLLDDDDDDk..',
    '..kDLDDDDkkkDk..',
    '..kDDDDksssssk..',
    '..kDDDkswksswk..',
    '.kkDDDkswksswk..',
    'kLLkDDkssssssk..',
    'kDDkkkksskksk.kk',
    '.kDDkLLkkkkkkkLk',
    '..kkkLLLLLLkkDDk',
    '....kLLLLLLkDDk.',
    '....kLLLLLLkkk..',
    '....kDDDDDDk....',
    '....kLLLkLLLLk..',
    '...kLLLk.kDDDk..',
    '..kDDDk..kDDDDk.',
    '..kDDDk...kkkk..',
    '..kDDk..........',
    '..kkk...........'],
  heroClimb: [
    '......kkkk......',
    '....kkDDDDkk....',
    '...kDDDDDDDDk...',
    '..kDDLLDDDDDDk..',
    '..kDLLDDDDDDDk..',
    'kk.kDDDDDDDDk.kk',
    'kLk.kDDDDDDk.kLk',
    'kDDk.kkkkkk.kDDk',
    '.kDDkkLLLLkkDDk.',
    '..kDDkLLLLkDDk..',
    '...kkLLLLLLkk...',
    '....kLLLLLLk....',
    '....kDDDDDDk....',
    '....kLLkkLLk....',
    '....kLLk.kLLk...',
    '...kDDk..kDDk...',
    '...kDDk...kDDk..',
    '..kDDDk...kDDDk.',
    '..kkkk.....kkkk.'],
  heroHurt: [
    '......kkkk......',
    '....kkDDDDkk....',
    '...kDDLLDDDDk...',
    '..kDDLLDDDDDDk..',
    '..kDLDDDDkkkDk..',
    '..kDDDDksssssk..',
    '..kDDDksskskkk..',
    'kkkDDDkkssssk.kk',
    'kLLkDDkskkkskkLk',
    'kDDkkkksssskkDDk',
    '.kkk.kkkkkkk.kk.',
    '....kLLLLLLk....',
    '....kLLLLLLk....',
    '....kDDDDDDk....',
    '...kLLLkkLLLk...',
    '..kLLLk..kLLLk..',
    '.kDDDk....kDDDk.',
    '.kDDDk....kDDDk.',
    '.kkkk......kkkk.'],
  heroSmash: [
    '......kkkk.........',
    '....kkDDDDkk.......',
    '...kDDLLDDDDk......',
    '..kDDLLDDDDDDk.....',
    '..kDLDDDDkkkDk.....',
    '..kDDDDksssssk.....',
    '..kDDDkswksswk.....',
    '..kDDDkskksskk.....',
    '...kDDkssssssk.....',
    'kk..kkkskkksk......',
    'kLk.kLLkkkkkkk.....',
    'kDDkkLLLLLLkDDk....',
    '.kDDkLLLLLLkDDDk...',
    '..kkkLLLLLLk.kDDk..',
    '..kkkDDDDDDk.kDDk..',
    '.kLLLLLkkkk..kDDk..',
    'kLLLLLLk.....kDDk..',
    'kDDDDDk.....kLLLLk.',
    'kDDDDk.....kLLLLLLk',
    '.kkkk......kDLDLDLk',
    '...........kLLLLLLk',
    '............kkkkkk.'],
  heroSleep: [
    '......................',
    '..kkkk................',
    '.kDDDDk...............',
    'kDLLDDDk.kkkkkkk......',
    'kDLDDsskkLLLLLLLkkkkk.',
    'kDDDskksLLLLLLLLkDDDDk',
    'kDDDssssLLLLLLLLkLLLLk',
    'kDDDkkkkkDDDDDDkkDDDDk',
    '.kkkk..kkkkkkkk.kkkkk.'],
  arm: [
    'kkkkkk',
    'LLLLLk',
    'LLLLLk',
    'kkkkkk'],
  head: [
    '..kkkk..',
    '.kDDDDk.',
    'kDLDDDDk',
    'kDsssssk',
    'kDskssks',
    'kDsssssk',
    '.kskkskk',
    '..kkkk..'],
  oneUp: [
    '...kkkkkk...',
    '..kDDDDDDk..',
    '.kDLLDDDDDk.',
    'kDLDDDDDDDDk',
    'kDDksssssskk',
    'kDkswksswksk',
    'kDkswksswksk',
    'kDksssssssk.',
    '.kkskkkkssk.',
    '..kssssssk..',
    '...kkkkkk...'],
  metHide: [
    '......kkkk......',
    '....kkyyyykk....',
    '...kyyYYyyyyk...',
    '..kyyYyyyyyyyk..',
    '..kyyyyyyyyyyk..',
    '.kyyyyyyyyyyyyk.',
    '.kyyyyyyyyyyyyk.',
    'kkkkkkkkkkkkkkkk',
    'kyyyyyyyyyyyyyyk',
    'kkkkkkkkkkkkkkkk'],
  metOpen: [
    '......kkkk......',
    '....kkyyyykk....',
    '...kyyYYyyyyk...',
    '..kyyYyyyyyyyk..',
    '..kyyyyyyyyyyk..',
    '.kyyyyyyyyyyyyk.',
    'kkkkkkkkkkkkkkkk',
    'kyyyyyyyyyyyyyyk',
    'kkkkkkkkkkkkkkkk',
    '..knnnnnnnnnnk..',
    '..knnnwkknwkkk..',
    '..knnnnnnnnnnk..',
    '...kkk....kkk...',
    '..knnk....knnk..',
    '..kkkk....kkkk..'],
  heli1: [
    'kkkkkkkkkkkkkkk.',
    '.......k........',
    '.....kkkkk......',
    '...kkrrrrrkk....',
    '..krrRRrrrrrk...',
    '..krRrrwwwrrk...',
    '.krrrrwkkwrrrk..',
    '.krrrrwkkwrrrk..',
    '.krrrrrwwwrrrk..',
    '..krrrrrrrrrk...',
    '..kkrrrrrrrkk...',
    '...kknnnnnkk....',
    '.....kkkkk......'],
  heli2: [
    '....kkkkkkk.....',
    '.......k........',
    '.....kkkkk......',
    '...kkrrrrrkk....',
    '..krrRRrrrrrk...',
    '..krRrrwwwrrk...',
    '.krrrrwkkwrrrk..',
    '.krrrrwkkwrrrk..',
    '.krrrrrwwwrrrk..',
    '..krrrrrrrrrk...',
    '..kkrrrrrrrkk...',
    '...kknnnnnkk....',
    '.....kkkkk......'],
  joeGuard: [
    '....kkkkkk......',
    '...kggggggk.....',
    '..kgGGgggggk....',
    '..kgGkkkkkgk....',
    '..kgkwwkwwkk....',
    '..kgkkkkkkgk....',
    '...kggggggk.....',
    '..kkkkkkkkkkkkk.',
    '.kgggggggkNNNNk.',
    '.kgGgggggkNnnNk.',
    '.kgGgggggkNnnNk.',
    '.kgGgggggkNnnNk.',
    '.kgggggggkNnnNk.',
    '..kgggggkkNnnNk.',
    '..kkkkkkk.NNNNk.',
    '...kgk.kgkkkkk..',
    '...kgk.kgk......',
    '...kgk.kgk......',
    '..kggk.kggk.....',
    '..kkkk.kkkk.....'],
  joeOpen: [
    '....kkkkkk......',
    '...kggggggk.....',
    '..kgGGgggggk....',
    '..kgGkkkkkgk....',
    '..kgkwwkwwkk....',
    '..kgkkkkkkgk....',
    '...kggggggk.....',
    '..kkkkkkkkkkkkkk',
    '.kgggggggknnnnnk',
    '.kgGgggggknNNNnk',
    '.kgGgggggkkkkkkk',
    '.kgGgggggk......',
    '.kNNNNNNNNk.....',
    '.kNnnnnnnNk.....',
    '..kkkkkkkk......',
    '...kgk.kgk......',
    '...kgk.kgk......',
    '...kgk.kgk......',
    '..kggk.kggk.....',
    '..kkkk.kkkk.....'],
  crawl1: [
    '..k...k...k...k.',
    '.kpk.kpk.kpk.kpk',
    '.kppkkppkkppkkpk',
    'kpppppppppppppk.',
    'kpPPpppppppwkpk.',
    'kpPppppppppkkpk.',
    'kppppppppppppk..',
    '.kkkkkkkkkkkkk..',
    '..kk.kk..kk.kk..'],
  crawl2: [
    '..k...k...k...k.',
    '.kpk.kpk.kpk.kpk',
    '.kppkkppkkppkkpk',
    'kpppppppppppppk.',
    'kpPPpppppppwkpk.',
    'kpPppppppppkkpk.',
    'kppppppppppppk..',
    '.kkkkkkkkkkkkk..',
    '.kk.kk..kk.kk...'],
  turret: [
    '.....kkkkkk.....',
    '....knnnnnnk....',
    '...knNNnnnnnk...',
    '...knNkkknnnkkkk',
    '...knnkrrknnnnnk',
    '...knnkkknnkkkkk',
    '...knnnnnnnnk...',
    '..kkkkkkkkkkkk..',
    '..knnnnnnnnnnk..',
    '.knNNnnnnnnnnnk.',
    '.knnnnnnnnnnnnk.',
    'kkkkkkkkkkkkkkkk',
    'knnnnnnnnnnnnnnk',
    'kkkkkkkkkkkkkkkk'],
  hopSit: [
    '................',
    '.....kkkkkk.....',
    '...kkoooooOkk...',
    '..kooOOoooooOk..',
    '.kooOoooowwkook.',
    '.koooooowkkwook.',
    '.koooooowkkwook.',
    '.kooooooowwoook.',
    'kkkkkkkkkkkkkkkk',
    'kOOOOOOOOOOOOOOk',
    '.kkkkkkkkkkkkkk.',
    'koook......koook',
    'kkkkk......kkkkk'],
  hopJump: [
    '.....kkkkkk.....',
    '...kkoooooOkk...',
    '..kooOOoooooOk..',
    '.kooOoooowwkook.',
    '.koooooowkkwook.',
    '.koooooowkkwook.',
    '.kooooooowwoook.',
    'kkkkkkkkkkkkkkkk',
    'kOOOOOOOOOOOOOOk',
    '.kkkkkkkkkkkkkk.',
    '..kok......kok..',
    '..kok......kok..',
    '.kook......kook.',
    '.kooo......oook.',
    '.kkkk......kkkk.'],
  pelletS: [
    '.kkkk.',
    'kwwwwk',
    'kwYYwk',
    'kwyywk',
    'kwwwwk',
    '.kkkk.'],
  pelletL: [
    '..kkkkkkkk..',
    '.kwwwwwwwwk.',
    'kwwYYYYYYwwk',
    'kwYYYYYYYYwk',
    'kwyyyyyyyywk',
    'kwyyyyyyyywk',
    'kwyyyyyyyywk',
    'kwyyyyyyyywk',
    'kwYYYYYYYYwk',
    'kwwYYYYYYwwk',
    '.kwwwwwwwwk.',
    '..kkkkkkkk..'],
};

const spriteCache = new Map();

export function sprite(name, pal = 'mega', flip = false) {
  const key = name + '|' + pal + '|' + flip;
  let c = spriteCache.get(key);
  if (c) return c;
  const rows = SPRITES[name];
  const colors = { ...BASE, ...(HERO_PAL[pal] || HERO_PAL.mega) };
  c = document.createElement('canvas');
  c.width = Math.max(...rows.map((r) => r.length));
  c.height = rows.length;
  const x = c.getContext('2d');
  rows.forEach((row, j) => {
    for (let i = 0; i < row.length; i++) {
      const col = colors[row[i]];
      if (row[i] === '.' || !col) continue;
      x.fillStyle = col;
      x.fillRect(flip ? c.width - 1 - i : i, j, 1, 1);
    }
  });
  spriteCache.set(key, c);
  return c;
}

// Draw a sprite with its bottom-centre at (cx, bottom).
export function drawSprite(ctx, name, pal, cx, bottom, flip = false) {
  const s = sprite(name, pal, flip);
  ctx.drawImage(s, Math.round(cx - s.width / 2), Math.round(bottom - s.height));
  return s;
}

// A solid-colour silhouette of a sprite (for glows and hit flashes).
const silCache = new Map();
export function silhouette(name, pal, flip, color) {
  const key = name + pal + flip + color;
  let c = silCache.get(key);
  if (c) return c;
  const s = sprite(name, pal, flip);
  c = document.createElement('canvas');
  c.width = s.width;
  c.height = s.height;
  const x = c.getContext('2d');
  x.drawImage(s, 0, 0);
  x.globalCompositeOperation = 'source-in';
  x.fillStyle = color;
  x.fillRect(0, 0, c.width, c.height);
  silCache.set(key, c);
  return c;
}

// ---------------------------------------------------------------- helpers

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')];
}

export function hash(x, y, s = 0) {
  let h = (x * 374761393 + y * 668265263 + s * 1442695041) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

// A crisp filled ellipse, drawn one row at a time.
export function blob(ctx, cx, cy, rx, ry, color) {
  ctx.fillStyle = color;
  for (let y = -ry; y <= ry; y++) {
    const w = Math.round(rx * Math.sqrt(1 - (y * y) / (ry * ry)));
    ctx.fillRect(Math.round(cx - w), Math.round(cy + y), w * 2, 1);
  }
}

export function rect(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), w, h);
}

// ---------------------------------------------------------------- tiles

export const THEMES = {
  meadow: { sky: '#3cbcfc', top: ['#80d010', '#00a800'], fill: ['#ac7c00', '#7c3c00', '#503000'], alt: ['#e45c10', '#881400', '#fca044'], plank: ['#ac7c00', '#503000'], ladder: '#ac7c00' },
  ember: { sky: '#000000', top: ['#fca044', '#e45c10'], fill: ['#881400', '#581000', '#300000'], alt: ['#a81000', '#581000', '#e45c10'], plank: ['#7c7c7c', '#383838'], ladder: '#bcbcbc' },
  wind: { sky: '#a4e4fc', top: ['#b8f818', '#58d854'], fill: ['#bcbcbc', '#7c7c7c', '#585858'], alt: ['#d8d8d8', '#7c7c7c', '#fcfcfc'], plank: ['#fcfcfc', '#7c7c7c'], ladder: '#fcfcfc' },
  volt: { sky: '#000040', top: ['#3cbcfc', '#0078f8'], fill: ['#00788c', '#004058', '#00b8a8'], alt: ['#0058f8', '#000088', '#3cbcfc'], plank: ['#fcbc3c', '#7c4c00'], ladder: '#fcbc3c', metal: true },
  hangar: { sky: '#202020', top: ['#f8b800', '#000000'], fill: ['#787878', '#383838', '#a8a8a8'], alt: ['#787878', '#383838', '#a8a8a8'], plank: ['#a8a8a8', '#383838'], ladder: '#f8b800', metal: true },
  homeland: { sky: '#000058', top: ['#a4e4fc', '#3cbcfc'], fill: ['#0000bc', '#000088', '#3cbcfc'], alt: ['#6888fc', '#000088', '#b8b8f8'], plank: ['#a4e4fc', '#0058f8'], ladder: '#a4e4fc' },
  village: { sky: '#f87858', top: ['#58d854', '#00a800'], fill: ['#a87c50', '#7c5030', '#c8a070'], alt: ['#bcbcbc', '#7c7c7c', '#e0e0e0'], plank: ['#ac7c00', '#503000'], ladder: '#ac7c00' },
};

function tileSolid(theme, top, seed) {
  const T = THEMES[theme];
  const [c, x] = canvas(16, 16);
  const [base, dark, light] = T.fill;
  if (T.metal) {
    rect(x, 0, 0, 16, 16, base);
    rect(x, 0, 0, 16, 1, light);
    rect(x, 0, 0, 1, 16, light);
    rect(x, 0, 15, 16, 1, dark);
    rect(x, 15, 0, 1, 16, dark);
    rect(x, 3, 3, 1, 1, dark); rect(x, 12, 3, 1, 1, dark); rect(x, 3, 12, 1, 1, dark); rect(x, 12, 12, 1, 1, dark);
    rect(x, 2, 2, 1, 1, light); rect(x, 11, 2, 1, 1, light); rect(x, 2, 11, 1, 1, light); rect(x, 11, 11, 1, 1, light);
    if (top) {
      for (let i = 0; i < 16; i++) rect(x, i, 0, 1, 3, ((i + 16) >> 2) % 2 ? T.top[0] : T.top[1]);
      rect(x, 0, 3, 16, 1, dark);
    }
    return c;
  }
  for (let j = 0; j < 16; j++) {
    for (let i = 0; i < 16; i++) {
      const h = hash(i, j, seed);
      x.fillStyle = h < 0.12 ? dark : h > 0.95 ? light : base;
      x.fillRect(i, j, 1, 1);
    }
  }
  // a few darker pebbles
  for (let k = 0; k < 3; k++) {
    const px = Math.floor(hash(k, 9, seed) * 12) + 2;
    const py = Math.floor(hash(k, 7, seed) * 10) + (top ? 5 : 2);
    rect(x, px, py, 2, 2, dark);
    rect(x, px, py, 1, 1, light);
  }
  if (top) {
    rect(x, 0, 0, 16, 4, T.top[0]);
    for (let i = 0; i < 16; i++) {
      const d = 3 + Math.floor(hash(i, 1, seed) * 3);
      rect(x, i, 2, 1, d, T.top[1]);
      if (hash(i, 2, seed) > 0.7) rect(x, i, 0, 1, 1, T.top[1]);
    }
  }
  return c;
}

function tileAlt(theme, top) {
  const T = THEMES[theme];
  const [c, x] = canvas(16, 16);
  const [base, mortar, light] = T.alt;
  if (theme === 'volt' || theme === 'hangar') {
    rect(x, 0, 0, 16, 16, mortar);
    rect(x, 1, 1, 14, 14, base);
    rect(x, 1, 1, 14, 1, light);
    rect(x, 1, 1, 1, 14, light);
    for (let i = 0; i < 4; i++) rect(x, 4, 4 + i * 2, 8, 1, mortar);
    if (top && theme === 'hangar') for (let i = 0; i < 16; i++) rect(x, i, 0, 1, 2, ((i >> 2) % 2) ? '#f8b800' : '#000000');
    return c;
  }
  rect(x, 0, 0, 16, 16, mortar);
  for (let row = 0; row < 4; row++) {
    const off = row % 2 ? 4 : 0;
    for (let b = -1; b < 2; b++) {
      const bx = b * 8 + off;
      rect(x, bx + 1, row * 4 + 1, 7, 3, base);
      rect(x, bx + 1, row * 4 + 1, 7, 1, light);
    }
  }
  if (top && theme === 'village') rect(x, 0, 0, 16, 2, '#7c7c7c');
  return c;
}

function tileOneway(theme) {
  const T = THEMES[theme];
  const [c, x] = canvas(16, 16);
  const [a, b] = T.plank;
  rect(x, 0, 0, 16, 6, b);
  rect(x, 0, 0, 16, 5, a);
  rect(x, 0, 0, 16, 1, '#fcfcfc');
  if (T.metal) for (let i = 1; i < 16; i += 4) rect(x, i, 2, 2, 2, b);
  else { rect(x, 7, 1, 1, 4, b); rect(x, 1, 6, 2, 3, b); rect(x, 13, 6, 2, 3, b); }
  return c;
}

function tileLadder(theme) {
  const col = THEMES[theme].ladder;
  const [c, x] = canvas(16, 16);
  rect(x, 2, 0, 2, 16, col);
  rect(x, 12, 0, 2, 16, col);
  rect(x, 4, 0, 1, 16, '#000000');
  rect(x, 14, 0, 1, 16, '#000000');
  for (const y of [3, 11]) { rect(x, 4, y, 8, 2, col); rect(x, 4, y + 2, 8, 1, '#000000'); }
  return c;
}

function tileSpike(theme, dir) {
  const [c, x] = canvas(16, 16);
  const electric = theme === 'volt';
  const light = electric ? '#fcfcfc' : '#fcfcfc';
  const mid = electric ? '#fcbc3c' : '#bcbcbc';
  const dark = electric ? '#c84c0c' : '#7c7c7c';
  for (let s = 0; s < 2; s++) {
    for (let d = 0; d < 16; d++) {
      const half = Math.floor((16 - d) / 4);
      for (let e = -half; e <= half; e++) {
        const along = s * 8 + 4 + e;
        let px, py;
        if (dir === 'up') { px = along; py = 15 - d; } else if (dir === 'down') { px = along; py = d; } else if (dir === 'left') { px = 15 - d; py = along; } else { px = d; py = along; }
        x.fillStyle = e < 0 ? light : e === 0 ? mid : dark;
        x.fillRect(px, py, 1, 1);
      }
    }
  }
  return c;
}

function tileLava(frame) {
  const [c, x] = canvas(16, 16);
  rect(x, 0, 0, 16, 16, '#d82800');
  for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) if (hash(i, j, frame + 40) > 0.85) rect(x, i, j, 1, 1, '#f83800');
  for (let i = 0; i < 16; i++) {
    const h = Math.round(2 + Math.sin((i + frame * 4) * 0.8) * 1.5);
    rect(x, i, 0, 1, h, '#fca044');
    rect(x, i, 0, 1, 1, '#fce4a0');
  }
  return c;
}

function tileGate() {
  const [c, x] = canvas(16, 16);
  rect(x, 0, 0, 16, 16, '#7c7c7c');
  for (let y = 0; y < 16; y += 4) { rect(x, 0, y, 16, 3, '#bcbcbc'); rect(x, 0, y, 16, 1, '#fcfcfc'); }
  rect(x, 0, 0, 1, 16, '#383838');
  rect(x, 15, 0, 1, 16, '#383838');
  return c;
}

const tileCache = new Map();

export function tileSet(theme) {
  let t = tileCache.get(theme);
  if (t) return t;
  t = {
    solidTop: [0, 1, 2].map((s) => tileSolid(theme, true, s)),
    solid: [0, 1, 2].map((s) => tileSolid(theme, false, s + 5)),
    altTop: tileAlt(theme, true),
    alt: tileAlt(theme, false),
    oneway: tileOneway(theme),
    ladder: tileLadder(theme),
    spike: { up: tileSpike(theme, 'up'), down: tileSpike(theme, 'down'), left: tileSpike(theme, 'left'), right: tileSpike(theme, 'right') },
    lava: [0, 1, 2, 3].map(tileLava),
    gate: tileGate(),
  };
  tileCache.set(theme, t);
  return t;
}

// ---------------------------------------------------------------- decor

let blueTree = null;
export function blueTreeImage() {
  if (blueTree) return blueTree;
  const [c, x] = canvas(96, 104);
  // trunk and roots
  rect(x, 42, 52, 12, 52, '#503000');
  rect(x, 44, 52, 6, 52, '#7c3c00');
  rect(x, 45, 52, 2, 52, '#ac7c00');
  rect(x, 34, 96, 28, 8, '#503000');
  rect(x, 30, 100, 36, 4, '#503000');
  rect(x, 38, 94, 4, 4, '#7c3c00');
  rect(x, 56, 94, 4, 4, '#7c3c00');
  // branches
  for (let i = 0; i < 14; i++) { rect(x, 30 + i, 56 - i, 3, 3, '#503000'); rect(x, 52 + i, 50 - i, 3, 3, '#503000'); }
  // the famous blue canopy
  const blobs = [[48, 30, 34, 22], [24, 44, 20, 14], [72, 42, 22, 14], [36, 20, 18, 14], [62, 18, 20, 14], [48, 8, 16, 8]];
  for (const [bx, by, rx, ry] of blobs) blob(x, bx, by, rx + 1, ry + 1, '#000058');
  for (const [bx, by, rx, ry] of blobs) blob(x, bx, by, rx, ry, '#0058f8');
  for (const [bx, by, rx, ry] of blobs) blob(x, bx - 3, by - 3, rx - 6, ry - 5, '#3cbcfc');
  for (const [bx, by, rx, ry] of blobs) blob(x, bx - 6, by - 6, Math.max(2, rx - 14), Math.max(2, ry - 10), '#a4e4fc');
  for (let i = 0; i < 70; i++) {
    const px = Math.floor(hash(i, 3, 77) * 90) + 3;
    const py = Math.floor(hash(i, 5, 77) * 54) + 4;
    const d = x.getImageData(px, py, 1, 1).data;
    if (d[3]) rect(x, px, py, 2, 1, hash(i, 8, 1) > 0.5 ? '#0058f8' : '#a4e4fc');
  }
  // a few glowing blossoms
  for (let i = 0; i < 9; i++) {
    const px = Math.floor(hash(i, 11, 5) * 70) + 13;
    const py = Math.floor(hash(i, 13, 5) * 40) + 10;
    const d = x.getImageData(px, py, 1, 1).data;
    if (d[3]) { rect(x, px, py - 1, 1, 3, '#fcfcfc'); rect(x, px - 1, py, 3, 1, '#fcfcfc'); }
  }
  blueTree = c;
  return c;
}

const houseCache = new Map();
export function houseImage(variant) {
  let c = houseCache.get(variant);
  if (c) return c;
  const roofs = ['#b81020', '#0058f8', '#7c4c00'];
  const walls = ['#fce4a0', '#fcd8a8', '#e0e0e0'];
  const roof = roofs[variant % 3];
  const wall = walls[variant % 3];
  let x;
  [c, x] = canvas(48, 48);
  rect(x, 4, 16, 40, 32, '#000000');
  rect(x, 5, 17, 38, 31, wall);
  for (let j = 18; j < 48; j += 6) rect(x, 5, j, 38, 1, '#c8a070');
  // roof
  for (let j = 0; j < 16; j++) {
    const inset = 16 - j;
    rect(x, inset - 2, j, 52 - inset * 2, 1, '#000000');
    rect(x, inset - 1, j, 50 - inset * 2, 1, j % 4 === 3 ? '#000000' : roof);
  }
  rect(x, 0, 14, 48, 3, '#000000');
  rect(x, 1, 15, 46, 1, roof);
  // chimney
  rect(x, 34, 0, 6, 9, '#000000');
  rect(x, 35, 1, 4, 8, '#7c7c7c');
  // door and window
  rect(x, 9, 30, 12, 18, '#000000');
  rect(x, 10, 31, 10, 17, '#7c3c00');
  rect(x, 17, 39, 2, 2, '#f8b800');
  rect(x, 27, 24, 12, 10, '#000000');
  rect(x, 28, 25, 10, 8, '#f8d878');
  rect(x, 32, 25, 1, 8, '#000000');
  rect(x, 28, 28, 10, 1, '#000000');
  houseCache.set(variant, c);
  return c;
}

// The Life: a blue box, with the blue thing glowing inside.
export function drawLifeBox(ctx, x, y, t, opened = false) {
  const pulse = (t >> 3) % 2;
  if (!opened) {
    for (let i = 0; i < 3; i++) {
      const a = t * 0.06 + i * 2.1;
      rect(ctx, x + 7 + Math.cos(a) * 13, y + 6 + Math.sin(a) * 9, 2, 2, i % 2 ? '#fcfcfc' : '#3cbcfc');
    }
  }
  rect(ctx, x, y, 16, 16, '#000000');
  rect(ctx, x + 1, y + 1, 14, 14, '#0058f8');
  rect(ctx, x + 1, y + 1, 14, 3, opened ? '#000058' : '#3cbcfc');
  rect(ctx, x + 1, y + 1, 1, 14, '#3cbcfc');
  rect(ctx, x + 14, y + 4, 1, 11, '#0000bc');
  rect(ctx, x + 1, y + 4, 14, 1, '#000000');
  // the window, and the blue thing inside it
  rect(ctx, x + 4, y + 6, 8, 7, '#000000');
  if (!opened) {
    rect(ctx, x + 5, y + 7, 6, 5, pulse ? '#3cbcfc' : '#a4e4fc');
    rect(ctx, x + 7, y + 8, 2, 3, '#fcfcfc');
  } else {
    // the lid, knocked off to the side
    rect(ctx, x + 14, y + 11, 10, 5, '#000000');
    rect(ctx, x + 15, y + 12, 8, 3, '#3cbcfc');
  }
}

// ---------------------------------------------------------------- backgrounds

function hills(ctx, camX, par, baseY, amp, freq, color, seed) {
  ctx.fillStyle = color;
  const off = camX * par;
  for (let sx = 0; sx < W; sx += 2) {
    const wx = sx + off;
    const h = Math.sin(wx * freq + seed) * amp + Math.sin(wx * freq * 2.3 + seed * 2) * amp * 0.4;
    const top = Math.round(baseY - h);
    ctx.fillRect(sx, top, 2, H - top);
  }
}

function clouds(ctx, camX, par, y, color, t, spacing = 120) {
  const off = camX * par + t * 0.05;
  for (let i = -1; i < 4; i++) {
    const base = Math.floor(off / spacing) + i;
    const cx = base * spacing - off + hash(base, 1, 3) * 40;
    const cy = y + hash(base, 2, 3) * 30;
    blob(ctx, cx, cy, 18, 6, color);
    blob(ctx, cx + 12, cy - 4, 12, 6, color);
    blob(ctx, cx - 10, cy - 2, 10, 5, color);
  }
}

export function drawBackground(ctx, theme, camX, camY, t) {
  switch (theme) {
    case 'meadow':
      rect(ctx, 0, 0, W, H, '#3cbcfc');
      rect(ctx, 0, 0, W, 40, '#68a8fc');
      clouds(ctx, camX, 0.1, 30, '#fcfcfc', t);
      hills(ctx, camX, 0.2, 150, 24, 0.012, '#58d8a8', 1);
      hills(ctx, camX, 0.4, 175, 14, 0.025, '#00a844', 4);
      break;
    case 'ember': {
      rect(ctx, 0, 0, W, H, '#200000');
      const glow = 3 + Math.sin(t * 0.05) * 2;
      rect(ctx, 0, 150 + glow, W, H, '#400800');
      hills(ctx, camX, 0.3, 175, 18, 0.03, '#581000', 2);
      ctx.fillStyle = '#300000';
      const off = camX * 0.3;
      for (let sx = 0; sx < W; sx += 2) {
        const wx = sx + off;
        const h = 40 + Math.abs(Math.sin(wx * 0.05)) * 30 * (hash(Math.floor(wx / 24), 1) > 0.4 ? 1 : 0.3);
        ctx.fillRect(sx, 0, 2, h);
      }
      break;
    }
    case 'wind':
      rect(ctx, 0, 0, W, H, '#a4e4fc');
      rect(ctx, 0, 0, W, 60, '#6888fc');
      rect(ctx, 0, 60, W, 6, '#8cb8fc');
      clouds(ctx, camX, 0.15, 70, '#fcfcfc', t * 4, 90);
      hills(ctx, camX, 0.25, 200, 40, 0.01, '#9898d8', 3);
      clouds(ctx, camX, 0.5, 190, '#fcfcfc', t * 6, 70);
      break;
    case 'volt': {
      rect(ctx, 0, 0, W, H, '#000040');
      const off = Math.floor(camX * 0.5);
      ctx.fillStyle = '#000088';
      for (let gx = -(off % 32); gx < W; gx += 32) ctx.fillRect(gx, 0, 2, H);
      for (let gy = 8; gy < H; gy += 32) ctx.fillRect(0, gy, W, 2);
      ctx.fillStyle = '#383838';
      const o2 = Math.floor(camX * 0.7);
      for (let gx = -(o2 % 96); gx < W; gx += 96) { ctx.fillRect(gx + 20, 0, 10, H); ctx.fillRect(gx + 18, 60, 14, 6); ctx.fillRect(gx + 18, 140, 14, 6); }
      if (t % 240 < 6) { ctx.fillStyle = 'rgba(252,252,252,0.25)'; ctx.fillRect(0, 0, W, H); }
      break;
    }
    case 'hangar': {
      rect(ctx, 0, 0, W, H, '#202020');
      ctx.fillStyle = '#383838';
      const off = Math.floor(camX * 0.5);
      for (let gx = -(off % 64); gx < W + 64; gx += 64) {
        ctx.fillRect(gx, 0, 4, H);
        for (let i = 0; i < 64; i += 2) { ctx.fillRect(gx + i, 30 + i, 2, 2); ctx.fillRect(gx + 64 - i, 30 + i, 2, 2); }
        ctx.fillRect(gx, 30, 64, 3);
        ctx.fillRect(gx, 94, 64, 3);
      }
      const o2 = Math.floor(camX * 0.8);
      for (let gx = -(o2 % 128); gx < W; gx += 128) { rect(ctx, gx + 40, 120, 30, 6, '#f8b800'); for (let i = 0; i < 30; i += 6) rect(ctx, gx + 40 + i, 120, 3, 6, '#000000'); }
      break;
    }
    case 'village': {
      const bands = ['#5c2c6c', '#a0405c', '#e45c50', '#f87858', '#fca044', '#f8d878'];
      bands.forEach((c, i) => rect(ctx, 0, i * 22, W, 22, c));
      rect(ctx, 0, 132, W, H, '#f8d878');
      blob(ctx, 200 - camX * 0.05, 120, 16, 16, '#fcfcfc');
      hills(ctx, camX, 0.15, 140, 30, 0.015, '#8c3c5c', 5);
      // far rooftops
      ctx.fillStyle = '#5c2c4c';
      const off = camX * 0.4;
      for (let i = -1; i < 8; i++) {
        const base = Math.floor(off / 40) + i;
        const hx = base * 40 - off;
        const hh = 20 + hash(base, 4) * 20;
        ctx.fillRect(Math.round(hx), 185 - hh, 30, hh + 60);
        for (let j = 0; j < 12; j++) ctx.fillRect(Math.round(hx) + 15 - j - 2, 185 - hh - 12 + j, j * 2 + 4, 1);
      }
      // smoke from the Mech's raid
      for (let i = 0; i < 4; i++) {
        const sx = ((i * 97 - camX * 0.4) % 320 + 320) % 320 - 30;
        for (let k = 0; k < 6; k++) blob(ctx, sx + Math.sin(t * 0.02 + k) * 4 + k * 3, 150 - k * 16 - ((t * 0.3) % 16), 6 + k, 5 + k, '#4c3c4c');
      }
      break;
    }
    case 'homeland': {
      // a blue night over the Mega Men's home, full of blue trees
      const bands = ['#000040', '#000058', '#000088', '#0000bc', '#0058f8'];
      bands.forEach((c, i) => rect(ctx, 0, i * 28, W, 28, c));
      rect(ctx, 0, 140, W, H, '#0058f8');
      for (let i = 0; i < 40; i++) {
        const sx = ((hash(i, 1, 9) * 400 - camX * 0.05) % 400 + 400) % 400 - 72;
        const sy = hash(i, 2, 9) * 110;
        if ((t + i * 13) % 90 > 6) rect(ctx, sx, sy, hash(i, 4, 9) > 0.8 ? 2 : 1, 1, '#fcfcfc');
      }
      blob(ctx, 196 - camX * 0.03, 44, 15, 15, '#a4e4fc');
      blob(ctx, 192 - camX * 0.03, 40, 12, 12, '#fcfcfc');
      hills(ctx, camX, 0.15, 150, 22, 0.014, '#0000bc', 6);
      const tree = blueTreeImage();
      const off = camX * 0.3;
      for (let i = -1; i < 5; i++) {
        const base = Math.floor(off / 90) + i;
        const tx = base * 90 - off + hash(base, 5, 2) * 30;
        ctx.drawImage(tree, Math.round(tx), 118, 48, 52);
      }
      hills(ctx, camX, 0.4, 182, 10, 0.03, '#000088', 7);
      break;
    }
    default:
      rect(ctx, 0, 0, W, H, '#000000');
  }
}
