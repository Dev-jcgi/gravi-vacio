/**
 * Gravi en el Vacío — Menú Principal
 */

import { CONFIG } from '../config.js';
import { telemetria } from '../services/telemetria.js';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Menu' });
  }

  create() {
    const { width, height } = this.cameras.main;

    // Fondo del menú
    this.add.image(width / 2, height / 2, 'fondo1')
      .setDisplaySize(width, height)
      .setTint(0x383452);

    // Partículas de polvo y óxido flotando
    const particles = this.add.particles(0, 0, 'gravi-portrait', {
      x: { min: 0, max: width },
      y: { min: 0, max: height },
      scale: { start: 0.02, end: 0.05 },
      alpha: { start: 0.4, end: 0 },
      speedY: { min: -10, max: -30 },
      speedX: { min: -5, max: 5 },
      lifespan: 4000,
      frequency: 200,
      blendMode: 'ADD'
    });
    particles.setAlpha(0.3);

    // Música de ambiente
    if (!this.sound.get('musica-prologo') && !this.sound.get('musica-niveles')) {
      this.sound.play('musica-prologo', {
        volume: CONFIG.AUDIO.DEFAULT_MUSIC_VOLUME,
        loop: true
      });
    }

    // Título Principal
    this.add.text(width / 2, 140, 'GRAVI EN EL VACÍO', {
      fontFamily: 'monospace',
      fontSize: '44px',
      fontStyle: 'bold',
      color: '#3fe0f0',
      stroke: '#07080e',
      strokeThickness: 6
    }).setOrigin(0.5);

    this.add.text(width / 2, 195, 'FÍSICA Y CINEMÁTICA EN LA MEGAESTRUCTURA', {
      fontFamily: 'sans-serif',
      fontSize: '15px',
      letterSpacing: 4,
      color: '#c65cff'
    }).setOrigin(0.5);

    // Ilustración de Gravi pequeña en el menú
    this.add.sprite(width / 2, 270, 'gravi-idle').setScale(1.5).play('gravi-idle-anim');

    // Botones del Menú
    const startY = 360;
    const spacing = 58;

    this.crearBoton(width / 2, startY, 'JUGAR PRÓLOGO', () => {
      this.sound.stopAll();
      telemetria.registrarEvento('CLICK_JUGAR_PROLOGO', 'Menu');
      this.scene.start('Prologo');
    });

    this.crearBoton(width / 2, startY + spacing, 'PISO 0: TUTORIAL', () => {
      this.sound.stopAll();
      telemetria.registrarEvento('CLICK_TUTORIAL', 'Menu');
      this.scene.start('Tutorial');
    });

    this.crearBoton(width / 2, startY + spacing * 2, 'CRÉDITOS', () => {
      this.mostrarCreditos();
    });

    // Pie de página
    this.add.text(width / 2, height - 30, 'Serious Games UNISUR · Versión Web 1.0 (Phaser 3.90)', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#65607e'
    }).setOrigin(0.5);
  }

  crearBoton(x, y, texto, onClick) {
    const contenedor = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, 280, 44, 0x121528)
      .setStrokeStyle(1.5, 0x3fe0f0, 0.7)
      .setInteractive({ useHandCursor: true });

    const txt = this.add.text(0, 0, texto, {
      fontFamily: 'monospace',
      fontSize: '15px',
      fontStyle: 'bold',
      color: '#e7e4f8'
    }).setOrigin(0.5);

    contenedor.add([bg, txt]);

    bg.on('pointerover', () => {
      bg.setFillStyle(0x3fe0f0, 0.25);
      bg.setStrokeStyle(2, 0x3fe0f0, 1);
      txt.setColor('#3fe0f0');
    });

    bg.on('pointerout', () => {
      bg.setFillStyle(0x121528, 1);
      bg.setStrokeStyle(1.5, 0x3fe0f0, 0.7);
      txt.setColor('#e7e4f8');
    });

    bg.on('pointerdown', onClick);

    return contenedor;
  }

  mostrarCreditos() {
    const { width, height } = this.cameras.main;
    const panel = this.add.container(width / 2, height / 2);

    const bgOverlay = this.add.rectangle(0, 0, width, height, 0x07080e, 0.85)
      .setInteractive();
    const caja = this.add.rectangle(0, 0, 600, 380, 0x111424)
      .setStrokeStyle(2, 0xc65cff, 0.8);

    const titulo = this.add.text(0, -140, 'CRÉDITOS DEL PROYECTO', {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#3fe0f0',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const creditosTxt = [
      'GRAVI EN EL VACÍO',
      'Proyecto de Tesis de Grado en Serious Games',
      'Universidad del Sur (UNISUR)',
      '',
      '• Diseño y Programación: Equipo Gravi',
      '• Universo y Guion: Inspirado en la estética de Tsutomu Nihei',
      '• Motor Web: Phaser 3.90 + Vite + Firebase',
      '• Pedagogía: Aprendizaje activo de cinemática (MRU)',
      '',
      'Agradecimiento especial a los docentes evaluadores y estudiantes.'
    ].join('\n');

    const desc = this.add.text(0, -10, creditosTxt, {
      fontFamily: 'sans-serif',
      fontSize: '14px',
      lineSpacing: 5,
      color: '#c9c5de',
      align: 'center'
    }).setOrigin(0.5);

    const btnCerrar = this.add.rectangle(0, 140, 140, 36, 0x3fe0f0)
      .setInteractive({ useHandCursor: true });
    const txtCerrar = this.add.text(0, 140, 'CERRAR', {
      fontFamily: 'monospace',
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#07080e'
    }).setOrigin(0.5);

    btnCerrar.on('pointerdown', () => panel.destroy());

    panel.add([bgOverlay, caja, titulo, desc, btnCerrar, txtCerrar]);
  }
}
