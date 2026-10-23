/**
 * Gravi en el Vacío — Portal de Transición entre Pisos
 * Se activa cuando los acertijos de medición del piso quedan resueltos.
 */

import { CONFIG } from '../config.js';

export class Portal extends Phaser.GameObjects.Container {
  constructor(scene, x, y) {
    super(scene, x, y);
    scene.add.existing(this);

    this.desbloqueado = false;

    // Aro exterior
    this.anilloExterior = scene.add.arc(0, 0, 36, 0, 360, false, 0x181e30, 0.8)
      .setStrokeStyle(3, 0x5a4a78, 0.8);
    this.add(this.anilloExterior);

    // Núcleo energético
    this.nucleo = scene.add.circle(0, 0, 24, 0x3a2e52, 0.6);
    this.add(this.nucleo);

    // Texto de estado
    this.texto = scene.add.text(0, -50, 'BLOQUEADO', {
      fontSize: '11px',
      fontFamily: 'monospace',
      color: '#8b84a6'
    }).setOrigin(0.5, 0.5);
    this.add(this.texto);

    // Zona física de contacto
    this.zona = scene.add.zone(x, y, 48, 64);
    scene.physics.add.existing(this.zona, true);

    // Animación suave de reposo
    scene.tweens.add({
      targets: this.nucleo,
      scale: 1.15,
      alpha: 0.8,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  desbloquear() {
    if (this.desbloqueado) return;
    this.desbloqueado = true;

    // Cambiar a color cian/magenta brillante
    this.anilloExterior.setStrokeStyle(3, 0x3fe0f0, 1);
    this.nucleo.setFillStyle(0xc65cff, 0.9);
    this.texto.setText('ASCENDER [E]').setColor('#3fe0f0');

    // Efecto de rotación energética
    this.scene.tweens.add({
      targets: this.anilloExterior,
      angle: 360,
      duration: 3000,
      repeat: -1,
      ease: 'Linear'
    });
  }
}
