/**
 * Gravi en el Vacío — Carga de recursos (Boot)
 * Carga las escenas y texturas exportadas de Unity, los sprites de Gravi, la música y las voces.
 */

import { CONFIG } from '../config.js';
import { crearTexturaPortal } from '../game/Portal.js';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Boot' });
  }

  preload() {
    const { width, height } = this.cameras.main;

    const barra = this.add.graphics();
    const marco = this.add.graphics();
    marco.lineStyle(2, 0x3fd8e0, 0.8);
    marco.strokeRect(width / 2 - 200, height / 2 - 10, 400, 20);
    this.add.text(width / 2, height / 2 - 44, 'GRAVI EN EL VACÍO', {
      fontFamily: CONFIG.FUENTE, fontSize: '20px', color: '#e8e8e8'
    }).setOrigin(0.5);
    this.load.on('progress', (v) => {
      barra.clear();
      barra.fillStyle(0x3fd8e0, 1);
      barra.fillRect(width / 2 - 196, height / 2 - 6, 392 * v, 12);
    });

    // 1. Índice de escenas y texturas exportadas de Unity (tools/exportar_unity.py)
    this.load.json('indice', 'assets/unity/indice.json');
    this.load.json('manifest', 'assets/manifest.json');
    this.load.on('filecomplete-json-indice', (_k, _t, indice) => {
      for (const t of indice.texturas) {
        this.load.atlas(t, `assets/unity/tex/${t}.png`, `assets/unity/tex/${t}.json`);
      }
      for (const e of indice.escenas) {
        this.load.json(`esc-${e}`, `assets/unity/escenas/${e}.json`);
      }
    });
    this.load.on('filecomplete-json-manifest', (_k, _t, manifest) => {
      for (const [clave, ruta] of Object.entries(manifest.audio)) {
        if (!this.cache.audio.exists(clave)) this.load.audio(clave, `assets/${ruta}`);
      }
    });

    // 2. Animaciones de Gravi (hojas de Resources/Sprites/Character, 64 px = 0.64 u)
    for (const k of ['gravi-idle', 'gravi-idle-side', 'gravi-walk', 'gravi-run', 'gravi-jump', 'gravi-push']) {
      this.load.spritesheet(k, `assets/sprites/${k}.png`, { frameWidth: 64, frameHeight: 64 });
    }
    this.load.spritesheet('gravi-crouch', 'assets/sprites/gravi-crouch.png', { frameWidth: 41, frameHeight: 64 });

    // 3. Efectos de sonido de Unity
    this.load.audio('sfx-portal', 'assets/audio/sfx/portal.mp3');
    this.load.audio('sfx-boton', 'assets/audio/sfx/boton.mp3');
    this.load.audio('sfx-metal', 'assets/audio/sfx/metal.mp3');
  }

  async create() {
    this.crearAnimaciones();
    crearTexturaPortal(this);
    try {
      await document.fonts.load(`16px ${CONFIG.FUENTE}`);
    } catch {
      // Sin la fuente se usa monospace
    }

    const privacidadAceptada = localStorage.getItem(CONFIG.STORAGE.PRIVACY_ACCEPTED) === '1';
    this.scene.start(privacidadAceptada ? 'Prologo' : 'Privacidad');
  }

  crearAnimaciones() {
    const a = this.anims;
    const hoja = (key, sheet, end, frameRate, repeat = -1) =>
      a.create({ key, frames: a.generateFrameNumbers(sheet, { start: 0, end }), frameRate, repeat });
    hoja('gravi-idle-anim', 'gravi-idle', 10, 8);
    hoja('gravi-idle-side-anim', 'gravi-idle-side', 4, 6);
    hoja('gravi-walk-anim', 'gravi-walk', 8, 10);
    hoja('gravi-run-anim', 'gravi-run', 6, 14);
    hoja('gravi-jump-anim', 'gravi-jump', 14, 14, 0);
    hoja('gravi-crouch-anim', 'gravi-crouch', 6, 12, 0);
    hoja('gravi-push-anim', 'gravi-push', 10, 10);
  }
}
