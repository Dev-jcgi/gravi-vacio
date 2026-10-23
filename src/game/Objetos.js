/**
 * Gravi en el Vacío — Objetos interactivos de los niveles de Unity
 *  - Caja: Box.prefab (Rigidbody2D dinámico que Gravi empuja con E)
 *  - Plataforma: plataformas movidas por AnimationClips (subirybajar, subir, dañado, New Animation)
 *  - zonaToca: utilidad para triggers (OnTriggerEnter2D)
 */

import { CONFIG } from '../config.js';
import { Escenario } from './Escenario.js';

export function rectDe(body) {
  return new Phaser.Geom.Rectangle(body.x, body.y, body.width, body.height);
}

export function toca(body, rect) {
  return Phaser.Geom.Intersects.RectangleToRectangle(rectDe(body), rect);
}

/** Cuerpo físico invisible del tamaño del BoxCollider2D exportado; el grupo visual lo sigue. */
function cuerpoDe(scene, esc, grupo, dinamico) {
  const info = grupo.getData('info');
  const s = esc.solidosDe(info.id)[0];
  const [x, y, w, h] = s ? s.r : [info.x - 20, info.y - 20, 40, 40];
  const z = scene.add.zone(x + w / 2, y + h / 2, w, h);
  scene.physics.add.existing(z, !dinamico);
  return { zona: z, dx: grupo.x - (x + w / 2), dy: grupo.y - (y + h / 2) };
}

export class Caja {
  constructor(scene, esc, grupo, jugador) {
    this.scene = scene;
    this.grupo = grupo;
    this.jugador = jugador;
    const { zona, dx, dy } = cuerpoDe(scene, esc, grupo, true);
    this.zona = zona;
    this.dx = dx;
    this.dy = dy;
    this.body = zona.body;
    this.body.setGravityY(CONFIG.PHYSICS.GRAVITY);
    this.body.setDragX(2000);
    // pushable = false: Gravi no la mueve al chocar, pero sí colisiona con el suelo (immovable no lo haría)
    this.body.pushable = false;
    this.body.setMaxVelocityY(1400);
    this.fija = false;
    scene.physics.add.collider(zona, esc.solidos);
    this.colJugador = scene.physics.add.collider(jugador, zona);
  }

  fijar() {
    this.fija = true;
    this.jugador.isPushing = false;
    this.body.setVelocity(0, 0);
    this.body.setAllowGravity(false);
    this.body.moves = false;
  }

  update() {
    const j = this.jugador;
    const b = this.body;
    if (!this.fija) {
      // Empujar: E + moverse hacia la caja estando junto a ella (PlayerMovement.cs → GetPushableHit)
      const dir = j.direccion;
      const jb = j.body;
      const alLado = Math.abs((jb.bottom) - b.bottom) < 40 &&
        ((dir > 0 && Math.abs(jb.right - b.left) < 8) || (dir < 0 && Math.abs(b.right - jb.left) < 8));
      const empujando = j.pulsandoEmpujar && dir !== 0 && alLado;
      j.isPushing = empujando || (j.isPushing && j.pulsandoEmpujar && dir !== 0 && alLado);
      b.pushable = false;
      if (empujando) b.setVelocityX(dir * CONFIG.PHYSICS.PUSH_SPEED);
      else if (b.blocked.down) b.setVelocityX(0);
    }
    this.grupo.setPosition(this.zona.x + this.dx, this.zona.y + this.dy);
  }

  get rect() {
    return rectDe(this.body);
  }
}

/**
 * Plataforma movida por claves [[t, xUnity, yUnity], …] (posición local = mundo, el padre está en 0,0).
 * Solo se pisa por arriba, como las plataformas de los niveles de Unity.
 */
export class Plataforma {
  constructor(scene, esc, grupo, jugador, claves = null) {
    this.scene = scene;
    this.grupo = grupo;
    const { zona, dx, dy } = cuerpoDe(scene, esc, grupo, true);
    this.zona = zona;
    this.dx = dx;
    this.dy = dy;
    this.body = zona.body;
    this.body.setAllowGravity(false);
    this.body.setImmovable(true);
    this.body.moves = false;
    this.body.pushable = false;
    // Solo se pisa por arriba (no empuja a Gravi dentro de los muros). El contacto se resuelve a mano en
    // update(): Arcade deja atravesar cuerpos cinemáticos que suben.
    Object.assign(this.body.checkCollision, { down: false, left: false, right: false });
    this.jugador = jugador;
    this.t = 0;
    this.setClaves(claves);
  }

  /** Cambia de clip; continúa desde el instante del nuevo clip más cercano a la posición actual. */
  setClaves(claves) {
    this.claves = claves;
    this.t = 0;
    if (!claves) return;
    const dur = claves[claves.length - 1][0];
    let mejor = Infinity;
    for (let t = 0; t < dur; t += 0.02) {
      this.t = t;
      const o = this.objetivo();
      const d = Math.hypot(o.x - this.dx - this.zona.x, o.y - this.dy - this.zona.y);
      if (d < mejor) {
        mejor = d;
        this.t0 = t;
      }
    }
    this.t = this.t0 ?? 0;
  }

  objetivo() {
    const k = this.claves;
    const dur = k[k.length - 1][0];
    const t = dur > 0 ? this.t % dur : 0;
    for (let i = 1; i < k.length; i++) {
      if (t <= k[i][0]) {
        const [t0, x0, y0] = k[i - 1];
        const [t1, x1, y1] = k[i];
        const u = Phaser.Math.Easing.Sine.InOut((t - t0) / Math.max(1e-6, t1 - t0));
        return { x: (x0 + (x1 - x0) * u) * 100, y: -(y0 + (y1 - y0) * u) * 100 };
      }
    }
    return { x: k[0][1] * 100, y: -k[0][2] * 100 };
  }

  update(delta) {
    const b = this.body;
    const topeAntes = b.y;
    if (this.claves) {
      this.t += delta / 1000;
      const o = this.objetivo();
      this.zona.setPosition(o.x - this.dx, o.y - this.dy);
      b.x = this.zona.x - b.width / 2;
      b.y = this.zona.y - b.height / 2;
    }
    this.grupo.setPosition(this.zona.x + this.dx, this.zona.y + this.dy);
    this.montar(topeAntes, delta);
  }

  // Gravi se apoya en la cara superior si venía de arriba (o la plataforma la alcanzó al subir)
  montar(topeAntes, delta) {
    const j = this.jugador.body;
    const b = this.body;
    const tope = b.y;
    const dentroX = j.right > b.x + 2 && j.x < b.right - 2;
    const margen = Math.max(0, j.velocity.y) * (delta / 1000) + 6;
    const venia = j.bottom <= Math.max(topeAntes, tope) + margen && j.bottom >= Math.min(topeAntes, tope) - 2;
    this.jugador.sobrePlataforma = false;
    if (dentroX && venia && j.velocity.y >= -1) {
      j.y = tope - j.height;
      j.velocity.y = 0;
      j.blocked.down = true;
      this.jugador.sobrePlataforma = true;
    }
  }
}

export { Escenario };
