// Holds the save and lives, and switches between scenes.

import { World } from './world.js';
import { TitleScene, StageSelectScene, GameOverScene, EndingScene, PreviewScene } from './scenes.js';
import { HERO_ORDER, LEVELS } from './levels.js';

const SAVE_KEY = 'mega-man-smash';
const fresh = () => ({ heroes: ['mega'], cleared: {} });

export class Game {
  constructor(ctx, input, sound, opts = {}) {
    this.ctx = ctx;
    this.input = input;
    this.sound = sound;
    this.debug = !!opts.debug;
    this.save = this.loadSave();
    this.lives = 3;
    if (opts.preview) this.scene = new PreviewScene(this);
    else if (opts.stage && LEVELS[opts.stage] && this.debug) {
      this.save.cleared.meadow = true;
      this.startStage(opts.stage);
    } else this.scene = new TitleScene(this);
  }

  loadSave() {
    try {
      const s = JSON.parse(localStorage.getItem(SAVE_KEY));
      if (s && Array.isArray(s.heroes) && s.cleared) return s;
    } catch { /* no save, or storage unavailable */ }
    return fresh();
  }

  persist() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(this.save)); } catch { /* storage unavailable */ }
  }

  get hasProgress() { return !!this.save.cleared.meadow; }

  unlocked(id) {
    if (id === 'meadow') return true;
    if (id === 'village') return !!this.save.cleared.hangar;
    return !!this.save.cleared.meadow;
  }

  newGame() {
    this.save = fresh();
    this.persist();
    this.lives = 3;
    this.startStage('meadow');
  }

  continueGame() {
    this.lives = 3;
    this.toStageSelect();
  }

  startStage(id) { this.scene = new World(this, id); }
  restartStage(id, run) { this.scene = new World(this, id, run); }

  addHero(id) {
    if (!this.save.heroes.includes(id)) {
      this.save.heroes.push(id);
      this.save.heroes.sort((a, b) => HERO_ORDER.indexOf(a) - HERO_ORDER.indexOf(b));
      this.persist();
    }
  }

  completeStage(id) {
    this.save.cleared[id] = true;
    this.persist();
    if (id === 'village') this.scene = new EndingScene(this);
    else this.toStageSelect(id);
  }

  toStageSelect(from) { this.scene = new StageSelectScene(this, from); }
  toTitle() { this.scene = new TitleScene(this); }
  gameOver() { this.scene = new GameOverScene(this); }

  update() {
    if (this.input.pressed('mute')) this.sound.toggleMute();
    this.scene.update(this.input);
  }

  draw() { this.scene.draw(this.ctx); }
}
