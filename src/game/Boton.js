/**
 * Gravi en el Vacío — Sensor de Presión / Botón de Coordenada
 * Detecta cuando una masa (Caja o Gravi) se posiciona sobre él.
 */

import { CONFIG } from '../config.js';

export class Boton extends Phaser.GameObjects.Container {
  constructor(scene, x, y, anchoMetros = 1) {
    super(scene, x, y);
    scene.add.existing(this);

    this.anchoPx = anchoMetros * CONFIG.TILE_SIZE;
    this.altoPx = 14;
    this.estaActivo = false;

    // Placa base
    this.base = scene.add.rectangle(0, 0, this.anchoPx, this.altoPx, 0x1f2438)
      .setStrokeStyle(2, 0x3fe0f0, 0.7);
    this.add(this.base);

    // Núcleo luminoso del sensor
    this.indicador = scene.add.rectangle(0, 0, this.anchoPx - 8, this.altoPx - 6, 0x3fe0f0, 0.5);
    this.add(this.indicador);

    // Etiqueta de coordenada en metros (para el aprendizaje de la posición)
    const coordMetrosX = (x / CONFIG.TILE_SIZE).toFixed(0);
    this.etiqueta = scene.add.text(0, 18, `x = ${coordMetrosX} m`, {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#3fe0f0'
    }).setOrigin(0.5, 0);
    this.add(this.etiqueta);

    // Zona física de colisión / solapamiento
    this.zona = scene.add.zone(x, y - 5, this.anchoPx, this.altoPx + 10);
    scene.physics.add.existing(this.zona, true); // cuerpo estático
  }

  activar() {
    if (this.estaActivo) return;
    this.estaActivo = true;

    // Transición visual a verde activado
    this.base.setStrokeStyle(2, 0x4ade80, 1);
    this.indicador.setFillStyle(0x4ade80, 0.9);
    this.etiqueta.setColor('#4ade80').setText(this.etiqueta.text + ' ✓');

    this.scene.tweens.add({
      targets: this.indicador,
      scaleY: 0.4,
      duration: 150,
      yoyo: false
    });

    this.emit('activado');
  }

  desactivar() {
    if (!this.estaActivo) return;
    this.estaActivo = false;

    this.base.setStrokeStyle(2, 0x3fe0f0, 0.7);
    this.indicador.setFillStyle(0x3fe0f0, 0.5);
    this.indicador.setScale(1);

    this.emit('desactivado');
  }
}
