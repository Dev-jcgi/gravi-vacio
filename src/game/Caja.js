/**
 * Gravi en el Vacío — Objeto Empujable (Caja)
 * Representa una masa que el jugador debe desplazar a una coordenada objetivo.
 */

import { CONFIG } from '../config.js';

export class Caja extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'caja');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Escalar la textura original (347x447) a ~56x56 px (aprox. 0.9 metros)
    const targetSize = 56;
    this.setDisplaySize(targetSize, targetSize);
    this.setSize(targetSize, targetSize);

    this.setCollideWorldBounds(true);
    this.body.setGravityY(CONFIG.PHYSICS.GRAVITY);
    this.body.setDragX(CONFIG.PHYSICS.BOX_DRAG);
    this.body.setBounce(0);
    this.body.setMass(CONFIG.PHYSICS.BOX_MASS);
  }

  getMetrosX() {
    return (this.x / CONFIG.TILE_SIZE).toFixed(1);
  }
}
