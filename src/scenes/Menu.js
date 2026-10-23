/**
 * Gravi en el Vacío — Menú principal (MainMenu de Unity)
 * Ilustración de IlustrationMainMenu (torres, luna, Gravi de espaldas y franja de azules)
 * que aparece poco a poco con el título "Gravi en el Vacio" y el piano de apertura.
 */

import { CONFIG } from '../config.js';
import { estilo, boton, panel } from '../game/UI.js';
import { telemetria } from '../services/telemetria.js';

const NIVELES = [
  ['TUTORIAL', 'Tutorial'],
  ['NIVEL 1 · TIEMPO', 'Transicion0'],
  ['NIVEL 2 · DISTANCIA', 'Transicion1'],
  ['NIVEL 3 · VELOCIDAD', 'Transicion3'],
  ['FINAL', 'Transicion4'],
  ['AULA EDUCATIVA', 'Aula']
];

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Menu' });
  }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#000000');
    telemetria.registrarEvento('INICIO_ESCENA', 'Menu');

    if (!this.sound.get(CONFIG.AUDIO.TRACKS.PROLOGUE)?.isPlaying) {
      this.sound.stopAll();
      this.sound.play(CONFIG.AUDIO.TRACKS.PROLOGUE, { volume: CONFIG.AUDIO.DEFAULT_MUSIC_VOLUME, loop: true });
    }

    // Ilustración (capas de 800×600 de Scenes/2-Menu), con los tintes de Unity
    const ilus = this.add.container(width * 0.33, height / 2 + 10);
    const torres = [
      this.add.image(-330, -40, 'environment-cyberpunk2-background-background1', 'background1').setScale(0.55, 1.2).setTint(0x2b2a2a),
      this.add.image(300, -10, 'environment-cyberpunk2-background-background2', 'background2_0').setScale(0.45, 0.95).setTint(0x483939)
    ];
    const franja = this.add.image(0, 0, '2-menu-paleta-de-azules', 'Paleta_de_azules').setScale(3, 1.2);
    const luna = this.add.image(0, -20, '2-menu-luz', 'Luz').setScale(1.08);
    const gravi = this.add.image(0, 0, '2-menu-character', 'Character').setScale(1.2).setTint(0x4e5173);
    ilus.add([...torres, franja, luna, gravi]);
    for (const o of ilus.list) {
      const a = o === gravi ? 1 : o === luna ? 0.9 : 0.97;
      o.setAlpha(0);
      this.tweens.add({ targets: o, alpha: a, duration: 3000, ease: 'Sine.easeIn' });
    }
    this.tweens.add({ targets: gravi, y: -6, duration: 3200, yoyo: true, repeat: -1, ease: 'Sine.InOut' });

    // Título y botones (MainMenuUI: botones CRT con la fuente Press Start 2P)
    const x = width * 0.76;
    const titulo = this.add.text(x, 150, 'Gravi en el Vacío', estilo(30, '#ffffff', { align: 'center' })).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: titulo, alpha: 1, duration: 2500, delay: 600 });

    this.principal = this.add.container(0, 0).setAlpha(0);
    this.principal.add([
      boton(this, x, 300, 'JUGAR', () => this.ir('Tutorial', 'CLICK_JUGAR')),
      boton(this, x, 360, 'ELEGIR NIVEL', () => this.mostrar(this.niveles)),
      boton(this, x, 420, 'VER PRÓLOGO', () => this.ir('Prologo', 'CLICK_PROLOGO')),
      boton(this, x, 480, 'CRÉDITOS', () => this.mostrar(this.creditos))
    ]);
    this.tweens.add({ targets: this.principal, alpha: 1, duration: 1200, delay: 1600 });

    this.niveles = this.add.container(0, 0).setVisible(false);
    this.niveles.add(panel(this, x, 390, 470, 470));
    this.niveles.add(this.add.text(x, 190, 'ELEGIR NIVEL', estilo(16, '#3fd8e0')).setOrigin(0.5));
    NIVELES.forEach(([n, k], i) => this.niveles.add(boton(this, x, 250 + i * 50, n, () => this.ir(k, 'CLICK_NIVEL', { nivel: k }), 14)));
    this.niveles.add(boton(this, x, 570, '← VOLVER', () => this.mostrar(this.principal), 12));

    this.creditos = this.add.container(0, 0).setVisible(false);
    this.creditos.add(panel(this, x, 380, 520, 420));
    this.creditos.add(this.add.text(x, 380, [
      'GRAVI EN EL VACÍO',
      '',
      'Juego serio de cinemática',
      '(tiempo, distancia y velocidad)',
      '',
      'Equipo Gravi',
      'Tesis UNISUR',
      '',
      'Versión web: Phaser 3',
      'Basada en el juego de Unity'
    ], estilo(12, '#d9d9d9', { align: 'center' })).setOrigin(0.5));
    this.creditos.add(boton(this, x, 560, '← VOLVER', () => this.mostrar(this.principal), 12));

    this.add.text(width / 2, height - 22, 'Los datos de juego son anónimos · Ver aviso de privacidad en el sitio',
      estilo(8, '#6f6f6f')).setOrigin(0.5);
  }

  mostrar(c) {
    for (const k of [this.principal, this.niveles, this.creditos]) k.setVisible(k === c).setAlpha(1);
  }

  ir(escena, evento, datos = {}) {
    if (this.saliendo) return;
    this.saliendo = true;
    telemetria.registrarEvento(evento, 'Menu', datos);
    this.cameras.main.fadeOut(700, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.sound.stopAll();
      this.scene.start(escena);
    });
  }
}
