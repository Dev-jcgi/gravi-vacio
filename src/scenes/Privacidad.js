/**
 * Gravi en el Vacío — Escena de Aviso de Privacidad y Consentimiento
 * Obligatoria antes de iniciar partida (Requisito ético de Tesis UNISUR).
 */

import { CONFIG } from '../config.js';
import { telemetria } from '../services/telemetria.js';

export class PrivacidadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Privacidad' });
  }

  create() {
    const { width, height } = this.cameras.main;

    // Fondo oscuro con gradiente
    const bg = this.add.graphics();
    bg.fillStyle(0x07080e, 1);
    bg.fillRect(0, 0, width, height);

    // Contenedor principal de la tarjeta de consentimiento
    const cardW = 860;
    const cardH = 540;
    const cardX = width / 2 - cardW / 2;
    const cardY = height / 2 - cardH / 2;

    const card = this.add.graphics();
    card.fillStyle(0x111424, 0.95);
    card.fillRoundedRect(cardX, cardY, cardW, cardH, 16);
    card.lineStyle(2, 0x3fe0f0, 0.5);
    card.strokeRoundedRect(cardX, cardY, cardW, cardH, 16);

    // Encabezado
    this.add.text(width / 2, cardY + 45, 'AVISO DE PRIVACIDAD Y CONSENTIMIENTO', {
      fontFamily: 'monospace',
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#3fe0f0'
    }).setOrigin(0.5);

    this.add.text(width / 2, cardY + 80, 'Proyecto de Investigación y Tesis — Serious Games (UNISUR)', {
      fontFamily: 'sans-serif',
      fontSize: '14px',
      color: '#c65cff'
    }).setOrigin(0.5);

    // Texto informativo
    const textoAviso = [
      'Bienvenido a «Gravi en el Vacío», una experiencia educativa diseñada para la comprensión de conceptos de física clásica (Movimiento Rectilíneo Uniforme).',
      '',
      'Para evaluar el impacto pedagógico de este software como parte de una investigación de tesis universitaria, el juego registra métricas anónimas:',
      '• Tiempos empleados en cada reto y mecánica.',
      '• Decisiones numéricas y selecciones de velocidad (v = d / t).',
      '• Avance entre pisos y reintentos.',
      '',
      '🔒 PROTECCIÓN TOTAL DE DATOS PERSONALES:',
      '• NO se recopilan nombres, correos electrónicos, contraseñas ni ubicaciones.',
      '• NO se almacena tu dirección IP ni identificadores de hardware.',
      '• La sesión se identifica únicamente mediante un código temporal anónimo.',
      '',
      'Al presionar «Aceptar y Continuar», autorizas el uso académico y confidencial de estas métricas.'
    ].join('\n');

    this.add.text(cardX + 45, cardY + 115, textoAviso, {
      fontFamily: 'sans-serif',
      fontSize: '14px',
      lineSpacing: 4,
      color: '#d6d2e8',
      wordWrap: { width: cardW - 90 }
    });

    // Botón Aceptar y Continuar
    const btnAceptar = this.add.container(width / 2 - 140, cardY + cardH - 55);
    const btnBg = this.add.rectangle(0, 0, 240, 44, 0x3fe0f0)
      .setInteractive({ useHandCursor: true });
    const btnTxt = this.add.text(0, 0, 'ACEPTAR Y CONTINUAR', {
      fontFamily: 'monospace',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#07080e'
    }).setOrigin(0.5);
    btnAceptar.add([btnBg, btnTxt]);

    btnBg.on('pointerover', () => btnBg.setFillStyle(0x73ecfa));
    btnBg.on('pointerout', () => btnBg.setFillStyle(0x3fe0f0));
    btnBg.on('pointerdown', () => {
      localStorage.setItem(CONFIG.STORAGE.PRIVACY_ACCEPTED, '1');
      telemetria.registrarEvento('CONSENTIMIENTO_ACEPTADO', 'Privacidad');
      this.scene.start('Menu');
    });

    // Botón Solo Modo Local (sin telemetría en la nube)
    const btnLocal = this.add.container(width / 2 + 140, cardY + cardH - 55);
    const btnLocalBg = this.add.rectangle(0, 0, 240, 44, 0x1f2438)
      .setStrokeStyle(1, 0x8b84a6)
      .setInteractive({ useHandCursor: true });
    const btnLocalTxt = this.add.text(0, 0, 'JUGAR SOLO EN LOCAL', {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#b5b0cd'
    }).setOrigin(0.5);
    btnLocal.add([btnLocalBg, btnLocalTxt]);

    btnLocalBg.on('pointerover', () => btnLocalBg.setFillStyle(0x2a314d));
    btnLocalBg.on('pointerout', () => btnLocalBg.setFillStyle(0x1f2438));
    btnLocalBg.on('pointerdown', () => {
      localStorage.setItem(CONFIG.STORAGE.PRIVACY_ACCEPTED, '1');
      this.scene.start('Menu');
    });
  }
}
