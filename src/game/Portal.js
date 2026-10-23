/**
 * Gravi en el Vacío — Portal (Portal.cs de Unity)
 * Dos zonas: al entrar en la primera el portal se abre (animación + sonido);
 * al tocar la segunda con el portal abierto se carga la siguiente escena.
 * El remolino de Unity es un Shader Graph; aquí se dibuja como textura procedural.
 */

export function crearTexturaPortal(scene) {
  const S = 128;
  const tex = scene.textures.createCanvas('portal-remolino', S, S);
  const ctx = tex.getContext();
  const c = S / 2;
  const glow = ctx.createRadialGradient(c, c, 4, c, c, c);
  glow.addColorStop(0, 'rgba(255,255,255,1)');
  glow.addColorStop(0.45, 'rgba(255,200,205,0.55)');
  glow.addColorStop(0.75, 'rgba(230,70,90,0.25)');
  glow.addColorStop(1, 'rgba(230,70,90,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, S, S);
  ctx.lineCap = 'round';
  for (let brazo = 0; brazo < 3; brazo++) {
    ctx.beginPath();
    for (let t = 0; t < 1; t += 0.01) {
      const ang = brazo * (Math.PI * 2 / 3) + t * Math.PI * 3.2;
      const r = 6 + t * (c - 12);
      const x = c + Math.cos(ang) * r;
      const y = c + Math.sin(ang) * r;
      if (t === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.95)';
    ctx.lineWidth = 6;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(214,40,70,0.7)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  tex.refresh();
}

export class Portal {
  /**
   * @param {Phaser.Scene} scene
   * @param {object} info - objeto "Portal Variant" exportado (posición, scripts y zonas)
   * @param {Array} zonas - zonas del portal [entrada, salida] en px
   * @param {Function} alCruzar - se llama al tocar la salida con el portal abierto
   */
  constructor(scene, { x, y, escala = 1, profundidad = 50, zonaEntrada, zonaSalida, alCruzar, abierto = false }) {
    this.scene = scene;
    this.zonaEntrada = zonaEntrada;
    this.zonaSalida = zonaSalida;
    this.alCruzar = alCruzar;
    this.abierto = false;
    this.cruzado = false;
    this.activo = true;
    this.base = escala;

    this.img = scene.add.image(x, y, 'portal-remolino').setDepth(profundidad).setBlendMode(Phaser.BlendModes.ADD);
    this.img.setScale(0.01 * escala).setAlpha(0);
    scene.tweens.add({ targets: this.img, angle: -360, duration: 2600, repeat: -1 });
    if (abierto) this.abrir(false);
  }

  setActivo(a) {
    this.activo = a;
    this.img.setVisible(a);
  }

  abrir(sonido = true) {
    if (this.abierto) return;
    this.abierto = true;
    if (sonido) this.scene.sound.play('sfx-portal', { volume: 0.7 });
    this.scene.tweens.add({ targets: this.img, scale: this.base, alpha: 1, duration: 900, ease: 'Back.Out' });
  }

  update(jugador) {
    if (!this.activo || this.cruzado || !jugador?.body) return;
    const b = jugador.body;
    const rj = new Phaser.Geom.Rectangle(b.x, b.y, b.width, b.height);
    if (!this.abierto && this.zonaEntrada && Phaser.Geom.Intersects.RectangleToRectangle(rj, this.zonaEntrada)) this.abrir();
    if (this.abierto && this.zonaSalida && Phaser.Geom.Intersects.RectangleToRectangle(rj, this.zonaSalida)) {
      this.cruzado = true;
      this.alCruzar?.();
    }
  }
}
