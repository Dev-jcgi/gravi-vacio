/**
 * Gravi en el Vacío — Robot Mentor (New)
 * Unidad de mantenimiento de los Tejedores que acompaña a Gravi.
 */

export class NewRobot extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'new-idle');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.body.setAllowGravity(false);
    this.body.setImmovable(true);
    this.setSize(30, 34);

    this.play('new-idle-anim');

    // Movimiento de flotación vertical suave
    scene.tweens.add({
      targets: this,
      y: y - 8,
      duration: 1600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Pequeño halo de luz
    this.luz = scene.add.circle(x, y, 20, 0x3fe0f0, 0.15).setDepth(-1);
    scene.tweens.add({
      targets: this.luz,
      y: y - 8,
      scale: 1.2,
      duration: 1600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  update() {
    this.luz.setPosition(this.x, this.y);
  }
}
