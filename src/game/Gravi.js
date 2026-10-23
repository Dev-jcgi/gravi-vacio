/**
 * Gravi en el Vacío — Controlador de Personaje (Gravi)
 * Soporta: caminar, correr (Shift), salto variable, coyote time (100ms),
 * buffer de salto (120ms), agacharse (cambio dinámico de hitbox) y empujar cajas.
 */

import { CONFIG } from '../config.js';

export class Gravi extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'gravi-idle');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Configuración física
    this.setCollideWorldBounds(true);
    this.body.setGravityY(CONFIG.PHYSICS.GRAVITY);
    this.body.setFriction(0.2, 0);

    // Dimensiones de Hitbox (pie: 28x54 px; agachada: 28x34 px)
    this.standingSize = { w: 28, h: 54, offsetX: 18, offsetY: 10 };
    this.crouchingSize = { w: 28, h: 32, offsetX: 18, offsetY: 32 };
    this.setSize(this.standingSize.w, this.standingSize.h);
    this.setOffset(this.standingSize.offsetX, this.standingSize.offsetY);

    // Teclas de control
    this.cursors = scene.input.keyboard.createCursorKeys();
    this.keys = scene.input.keyboard.addKeys({
      w: Phaser.Input.Keyboard.KeyCodes.W,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      s: Phaser.Input.Keyboard.KeyCodes.S,
      d: Phaser.Input.Keyboard.KeyCodes.D,
      shift: Phaser.Input.Keyboard.KeyCodes.SHIFT,
      ctrl: Phaser.Input.Keyboard.KeyCodes.CTRL,
      e: Phaser.Input.Keyboard.KeyCodes.E,
      q: Phaser.Input.Keyboard.KeyCodes.Q
    });

    // Estados internos
    this.isCrouching = false;
    this.isPushing = false;
    this.isFacingRight = true;

    // Ayudas de control (Game Feel)
    this.coyoteTimer = 0;       // ms restantes de coyote time
    this.jumpBufferTimer = 0;   // ms restantes de jump buffer
    this.wasOnFloor = false;
    this.hasJumpedThisAirtime = false;
  }

  update(time, delta) {
    const onFloor = this.body.onFloor();
    const { WALK_SPEED, RUN_SPEED, CROUCH_SPEED, JUMP_VELOCITY, VARIABLE_JUMP_CUT, COYOTE_TIME_MS, JUMP_BUFFER_MS } = CONFIG.PHYSICS;

    // 1. Gestión de Coyote Time
    if (onFloor) {
      this.coyoteTimer = COYOTE_TIME_MS;
      this.hasJumpedThisAirtime = false;
    } else {
      this.coyoteTimer = Math.max(0, this.coyoteTimer - delta);
    }

    // 2. Gestión de Jump Buffer
    const jumpJustPressed = Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
                            Phaser.Input.Keyboard.JustDown(this.cursors.space) ||
                            Phaser.Input.Keyboard.JustDown(this.keys.w);

    if (jumpJustPressed) {
      this.jumpBufferTimer = JUMP_BUFFER_MS;
    } else {
      this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - delta);
    }

    // 3. Agacharse
    const wantsToCrouch = (this.cursors.down.isDown || this.keys.s.isDown || this.keys.ctrl.isDown) && onFloor;
    this.setCrouching(wantsToCrouch);

    // 4. Salto
    const canJump = (onFloor || this.coyoteTimer > 0) && !this.hasJumpedThisAirtime && !this.isCrouching;
    if (this.jumpBufferTimer > 0 && canJump) {
      this.body.setVelocityY(JUMP_VELOCITY);
      this.jumpBufferTimer = 0;
      this.coyoteTimer = 0;
      this.hasJumpedThisAirtime = true;
    }

    // Salto variable: soltar el botón antes del ápice reduce la velocidad ascendente
    const jumpHeld = this.cursors.up.isDown || this.cursors.space.isDown || this.keys.w.isDown;
    if (!jumpHeld && this.body.velocity.y < -150) {
      this.body.setVelocityY(this.body.velocity.y * VARIABLE_JUMP_CUT);
    }

    // 5. Movimiento Horizontal
    const isRunning = this.keys.shift.isDown && !this.isCrouching;
    let targetSpeed = this.isCrouching ? CROUCH_SPEED : (isRunning ? RUN_SPEED : WALK_SPEED);

    let moveX = 0;
    if (this.cursors.left.isDown || this.keys.a.isDown) {
      moveX = -1;
      this.isFacingRight = false;
    } else if (this.cursors.right.isDown || this.keys.d.isDown) {
      moveX = 1;
      this.isFacingRight = true;
    }

    this.body.setVelocityX(moveX * targetSpeed);
    this.setFlipX(!this.isFacingRight);

    // 6. Animaciones
    this.updateAnimation(moveX, onFloor, isRunning);

    this.wasOnFloor = onFloor;
  }

  setCrouching(crouch) {
    if (this.isCrouching === crouch) return;
    this.isCrouching = crouch;

    if (crouch) {
      this.setSize(this.crouchingSize.w, this.crouchingSize.h);
      this.setOffset(this.crouchingSize.offsetX, this.crouchingSize.offsetY);
    } else {
      this.setSize(this.standingSize.w, this.standingSize.h);
      this.setOffset(this.standingSize.offsetX, this.standingSize.offsetY);
    }
  }

  updateAnimation(moveX, onFloor, isRunning) {
    if (!onFloor) {
      this.play('gravi-jump-anim', true);
    } else if (this.isPushing) {
      this.play('gravi-push-anim', true);
    } else if (this.isCrouching) {
      this.play('gravi-crouch-anim', true);
    } else if (moveX !== 0) {
      this.play(isRunning ? 'gravi-run-anim' : 'gravi-walk-anim', true);
    } else {
      this.play('gravi-idle-anim', true);
    }
  }

  // Coordenadas en metros para el Compás
  getMetrosX() {
    return (this.x / CONFIG.TILE_SIZE).toFixed(1);
  }

  getMetrosY() {
    return ((this.scene.physics.world.bounds.height - this.y) / CONFIG.TILE_SIZE).toFixed(1);
  }
}
