import { Input } from './input.js';
import { Sound } from './audio.js';
import { Game } from './game.js';

const params = new URLSearchParams(location.search);
const preview = params.has('preview');
const canvas = document.getElementById('screen');
if (preview) canvas.height = 256;
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

const input = new Input();
const sound = new Sound();
input.onAny(() => sound.unlock());
addEventListener('pointerdown', () => sound.unlock());

const game = new Game(ctx, input, sound, { preview, debug: params.has('debug'), stage: params.get('stage') });
if (params.has('debug')) window.game = game;

function fit() {
  const s = Math.min(innerWidth / canvas.width, innerHeight / canvas.height);
  const scale = s >= 2 ? Math.floor(s) : s;
  canvas.style.width = canvas.width * scale + 'px';
  canvas.style.height = canvas.height * scale + 'px';
}
addEventListener('resize', fit);
fit();

const STEP = 1000 / 60;
let last = performance.now();
let acc = 0;
function frame(now) {
  acc += Math.min(100, now - last);
  last = now;
  while (acc >= STEP) {
    input.poll();
    game.update();
    acc -= STEP;
  }
  game.draw();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
