/**
 * Gravi en el Vacío — Controlador de Gravi
 * Basado en PlayerMovement.cs de Unity (moveSpeed, jumpForce, agacharse con S/Ctrl, empujar con E)
 * con las ayudas de control de la versión web: correr con Shift, salto variable,
 * coyote time (100 ms) y buffer de salto (120 ms).
 */

import { CONFIG } from '../config.js';

export class Gravi extends Phaser.Physics.Arcade.Sprite {
  /**
   * @param {number} x, y - posición del transform del Player en Unity (px de Phaser)
   * @param {object} opciones - { salto: jumpForce de Unity (4 por defecto) }
   */
  constructor(scene, x, y, { salto = 4 } = {}) {
    super(scene, x, y, 'gravi-idle-side');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.saltoBase = salto;
    this.salto = salto;
    this.body.setGravityY(CONFIG.PHYSICS.GRAVITY);
    this.body.setMaxVelocityY(1400);

    // Colisionadores de Player.prefab: cápsula 0.33 × 0.64 u de pie, caja 0.39 × 0.37 u agachada
    this.tamPie = { w: 30, h: 62, ox: 17, oy: 1 };
    this.tamAgachada = { w: 36, h: 37, ox: 14, oy: 26 };
    this.aplicarTam(this.tamPie);

    this.cursors = scene.input.keyboard.createCursorKeys();
    this.keys = scene.input.keyboard.addKeys('W,A,S,D,E,SHIFT,CTRL');

    this.isCrouching = false;
    this.isPushing = false;
    this.mirandoDerecha = true;
    this.bloqueado = false;
    this.coyote = 0;
    this.buffer = 0;
    this.saltoUsado = false;
    this.play('gravi-idle-side-anim');
  }

  aplicarTam(t) {
    this.tam = t;
    this.body.setSize(t.w, t.h, false);
    this.ajustarOffset();
  }

  // Las hojas de Gravi no miden lo mismo (agacharse: 41 px de ancho): el cuerpo se centra en el cuadro
  ajustarOffset() {
    const dx = (64 - this.frame.width) / 2;
    this.body.setOffset(this.tam.ox - dx, this.tam.oy - (64 - this.frame.height));
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);
    this.ajustarOffset();
  }

  /** Cambia temporalmente la fuerza de salto (caramelos.cs → AplicarSaltoTemporal). */
  saltoTemporal(fuerza, segundos) {
    this.salto = fuerza;
    this.timerSalto?.remove();
    this.timerSalto = this.scene.time.delayedCall(segundos * 1000, () => { this.salto = this.saltoBase; });
  }

  restaurarSalto() {
    this.timerSalto?.remove();
    this.salto = this.saltoBase;
  }

  bloquear(b = true) {
    this.bloqueado = b;
    if (b) {
      this.body.setVelocityX(0);
      this.isPushing = false;
      this.play('gravi-idle-side-anim', true);
    }
  }

  get pulsandoEmpujar() {
    return this.keys.E.isDown;
  }

  get direccion() {
    if (this.bloqueado) return 0;
    if (this.cursors.left.isDown || this.keys.A.isDown) return -1;
    if (this.cursors.right.isDown || this.keys.D.isDown) return 1;
    return 0;
  }

  update(_time, delta) {
    const P = CONFIG.PHYSICS;
    const enSuelo = this.body.blocked.down || this.body.touching.down || this.sobrePlataforma;

    if (this.bloqueado) {
      this.body.setVelocityX(0);
      if (enSuelo) this.play('gravi-idle-side-anim', true);
      return;
    }

    if (enSuelo) {
      this.coyote = P.COYOTE_TIME_MS;
      this.saltoUsado = false;
    } else {
      this.coyote = Math.max(0, this.coyote - delta);
    }

    const JD = Phaser.Input.Keyboard.JustDown;
    if (JD(this.cursors.up) || JD(this.cursors.space) || JD(this.keys.W)) this.buffer = P.JUMP_BUFFER_MS;
    else this.buffer = Math.max(0, this.buffer - delta);

    // Agacharse (S o Ctrl, como en Unity)
    const quiereAgacharse = (this.cursors.down.isDown || this.keys.S.isDown || this.keys.CTRL.isDown) && enSuelo;
    if (quiereAgacharse !== this.isCrouching) {
      if (!quiereAgacharse && this.techoEncima()) {
        // no se puede poner de pie bajo un techo bajo
      } else {
        this.isCrouching = quiereAgacharse;
        this.aplicarTam(quiereAgacharse ? this.tamAgachada : this.tamPie);
        if (!quiereAgacharse) this.y -= 0.5;
      }
    }

    // Salto (velocidad = jumpForce de Unity × 100 px)
    if (this.buffer > 0 && (enSuelo || this.coyote > 0) && !this.saltoUsado && !this.isCrouching) {
      this.body.setVelocityY(-this.salto * 100 * P.JUMP_FACTOR);
      this.buffer = 0;
      this.coyote = 0;
      this.saltoUsado = true;
    }
    const sosteniendo = this.cursors.up.isDown || this.cursors.space.isDown || this.keys.W.isDown;
    if (!sosteniendo && this.body.velocity.y < -150) this.body.setVelocityY(this.body.velocity.y * P.VARIABLE_JUMP_CUT);

    // Movimiento horizontal
    const dir = this.direccion;
    const corriendo = this.keys.SHIFT.isDown && !this.isCrouching;
    let vel = this.isCrouching ? P.CROUCH_SPEED : corriendo ? P.RUN_SPEED : P.WALK_SPEED;
    if (this.isPushing) vel = P.PUSH_SPEED;
    if (dir !== 0) this.mirandoDerecha = dir > 0;
    this.body.setVelocityX(dir * vel);
    this.setFlipX(!this.mirandoDerecha);

    // Animaciones (Character.controller: Idle, walk, jump, crouch, empujar)
    if (!enSuelo) this.play('gravi-jump-anim', true);
    else if (this.isPushing && dir !== 0) this.play('gravi-push-anim', true);
    else if (this.isCrouching) this.play('gravi-crouch-anim', true);
    else if (dir !== 0) this.play(corriendo ? 'gravi-run-anim' : 'gravi-walk-anim', true);
    else this.play('gravi-idle-side-anim', true);
  }

  techoEncima() {
    const b = this.body;
    const r = new Phaser.Geom.Rectangle(b.x + 2, b.bottom - this.tamPie.h, b.width - 4, this.tamPie.h - b.height);
    const cuerpos = this.scene.physics.overlapRect(r.x, r.y, r.width, r.height, false, true);
    return cuerpos.length > 0;
  }

  /** Centro del cuerpo en unidades de Unity (para telemetría). */
  get unidades() {
    return { x: +(this.x / 100).toFixed(2), y: +(-this.y / 100).toFixed(2) };
  }
}
