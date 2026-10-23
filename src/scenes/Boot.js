/**
 * Gravi en el Vacío — Escena de Carga y Creación de Animaciones (Boot)
 */

import { CONFIG } from '../config.js';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Boot' });
  }

  preload() {
    const { width, height } = this.cameras.main;

    // Barra de progreso y texto estilizados
    const progressBox = this.add.graphics();
    const progressBar = this.add.graphics();
    progressBox.fillStyle(0x131726, 0.8);
    progressBox.fillRoundedRect(width / 2 - 160, height / 2 - 12, 320, 24, 6);
    progressBox.lineStyle(2, 0x3fe0f0, 0.6);
    progressBox.strokeRoundedRect(width / 2 - 160, height / 2 - 12, 320, 24, 6);

    const txtTitulo = this.add.text(width / 2, height / 2 - 50, 'GRAVI EN EL VACÍO', {
      fontFamily: 'monospace',
      fontSize: '24px',
      color: '#3fe0f0'
    }).setOrigin(0.5);

    const txtSubtitulo = this.add.text(width / 2, height / 2 + 35, 'Cargando registros de la Constante...', {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#9590b3'
    }).setOrigin(0.5);

    this.load.on('progress', (value) => {
      progressBar.clear();
      progressBar.fillStyle(0x3fe0f0, 0.9);
      progressBar.fillRoundedRect(width / 2 - 156, height / 2 - 8, 312 * value, 16, 4);
    });

    // 1. Cargar el manifest generado
    this.load.json('manifest', 'assets/manifest.json');

    // 2. Cargar spritesheets de personajes
    this.load.spritesheet('gravi-idle', 'assets/sprites/gravi-idle.png', { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet('gravi-idle-side', 'assets/sprites/gravi-idle-side.png', { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet('gravi-walk', 'assets/sprites/gravi-walk.png', { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet('gravi-run', 'assets/sprites/gravi-run.png', { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet('gravi-jump', 'assets/sprites/gravi-jump.png', { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet('gravi-push', 'assets/sprites/gravi-push.png', { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet('gravi-crouch', 'assets/sprites/gravi-crouch.png', { frameWidth: 41, frameHeight: 64 });
    this.load.spritesheet('new-idle', 'assets/sprites/new-idle.png', { frameWidth: 30, frameHeight: 34 });

    // 3. Sprites estáticos e ilustraciones
    this.load.image('caja', 'assets/sprites/caja.png');
    this.load.image('plataforma', 'assets/sprites/plataforma.png');
    this.load.image('gravi-portrait', 'assets/sprites/gravi-portrait.png');
    this.load.image('new-portrait', 'assets/sprites/new-portrait.png');
    this.load.image('abuelo', 'assets/sprites/abuelo.png');

    // 4. Tilesets y Fondos
    this.load.image('estructura', 'assets/tiles/estructura.png');
    this.load.image('estructura-fondo', 'assets/tiles/estructura-fondo.png');
    this.load.image('cables', 'assets/tiles/cables.png');

    for (let i = 1; i <= 5; i++) {
      this.load.image(`fondo${i}`, `assets/bg/fondo${i}.jpg`);
    }

    // 5. Música principal
    this.load.audio('musica-prologo', 'assets/audio/musica-prologo.mp3');
    this.load.audio('musica-niveles', 'assets/audio/musica-niveles.mp3');
    this.load.audio('musica-final', 'assets/audio/musica-final.mp3');

    // 6. Voces principales de la Etapa 1 (Prólogo y Tutorial)
    this.load.audio('voz-abuelo-escenaprologodialogo1', 'assets/audio/voces/voz-abuelo-escenaprologodialogo1.mp3');
    this.load.audio('voz-abuelo-escenaprologodialogo2', 'assets/audio/voces/voz-abuelo-escenaprologodialogo2.mp3');
    this.load.audio('voz-new-escenatutorial-leveldialogo1', 'assets/audio/voces/voz-new-escenatutorial-leveldialogo1.mp3');
    this.load.audio('voz-new-escenatutorial-leveldialogo2', 'assets/audio/voces/voz-new-escenatutorial-leveldialogo2.mp3');
  }

  create() {
    this.crearAnimaciones();

    // Comprobar si el usuario ya aprobó el consentimiento de privacidad
    const privacidadAceptada = localStorage.getItem(CONFIG.STORAGE.PRIVACY_ACCEPTED) === '1';

    if (!privacidadAceptada) {
      this.scene.start('Privacidad');
    } else {
      this.scene.start('Menu');
    }
  }

  crearAnimaciones() {
    const { anims } = this;

    anims.create({
      key: 'gravi-idle-anim',
      frames: anims.generateFrameNumbers('gravi-idle', { start: 0, end: 10 }),
      frameRate: 8,
      repeat: -1
    });

    anims.create({
      key: 'gravi-walk-anim',
      frames: anims.generateFrameNumbers('gravi-walk', { start: 0, end: 8 }),
      frameRate: 10,
      repeat: -1
    });

    anims.create({
      key: 'gravi-run-anim',
      frames: anims.generateFrameNumbers('gravi-run', { start: 0, end: 6 }),
      frameRate: 12,
      repeat: -1
    });

    anims.create({
      key: 'gravi-jump-anim',
      frames: anims.generateFrameNumbers('gravi-jump', { start: 0, end: 14 }),
      frameRate: 14,
      repeat: 0
    });

    anims.create({
      key: 'gravi-crouch-anim',
      frames: anims.generateFrameNumbers('gravi-crouch', { start: 0, end: 6 }),
      frameRate: 8,
      repeat: 0
    });

    anims.create({
      key: 'gravi-push-anim',
      frames: anims.generateFrameNumbers('gravi-push', { start: 0, end: 10 }),
      frameRate: 10,
      repeat: -1
    });

    anims.create({
      key: 'new-idle-anim',
      frames: anims.generateFrameNumbers('new-idle', { start: 0, end: 4 }),
      frameRate: 6,
      repeat: -1
    });
  }
}
