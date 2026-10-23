/**
 * Gravi en el Vacío — Fondo Procedural de la Megaestructura
 * Crea capas con efecto de paralaje, siluetas mecánicas y partículas de atmósfera.
 */

export class MegaestructuraBackground {
  constructor(scene, rng, worldWidth, worldHeight) {
    this.scene = scene;
    this.rng = rng;
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;

    this.layers = [];
    this.createLayers();
  }

  createLayers() {
    const { scene, rng, worldWidth, worldHeight } = this;

    // Capa 0: Fondo lejano (Cielo del Vacío / niebla crepuscular)
    const bgKey = rng.pick(['fondo1', 'fondo2', 'fondo3', 'fondo4', 'fondo5']);
    const bg = scene.add.image(0, 0, bgKey)
      .setOrigin(0, 0)
      .setDisplaySize(worldWidth * 1.5, worldHeight * 1.2)
      .setScrollFactor(0.05, 0.05)
      .setDepth(-100)
      .setTint(0x403855); // Matiz oscuro y frío

    this.layers.push(bg);

    // Capa 1: Siluetas lejanas de torres y vigas industriales (Gráficos procedurales)
    const farGraphics = scene.add.graphics().setScrollFactor(0.15, 0.1).setDepth(-80);
    farGraphics.fillStyle(0x0e111d, 0.7);

    for (let x = 0; x < worldWidth; x += rng.float(180, 360)) {
      const colWidth = rng.float(40, 110);
      const colHeight = rng.float(worldHeight * 0.5, worldHeight * 0.95);
      farGraphics.fillRect(x, worldHeight - colHeight, colWidth, colHeight);

      // Vigas horizontales cruzadas
      if (rng.next() > 0.4) {
        farGraphics.fillRect(x - 60, worldHeight - colHeight + rng.float(40, 150), colWidth + 120, 12);
      }
    }

    // Capa 2: Estructuras medias con luces tenues de Tejedores
    const midGraphics = scene.add.graphics().setScrollFactor(0.35, 0.25).setDepth(-50);
    midGraphics.fillStyle(0x181c2e, 0.85);

    for (let x = 50; x < worldWidth; x += rng.float(120, 260)) {
      const w = rng.float(24, 60);
      const h = rng.float(worldHeight * 0.4, worldHeight * 0.8);
      midGraphics.fillRect(x, worldHeight - h, w, h);

      // Pequeñas luces parpadeantes (sensores de los Tejedores)
      if (rng.next() > 0.3) {
        const lightY = worldHeight - h + rng.float(30, h - 30);
        const lightColor = rng.next() > 0.5 ? 0x3fe0f0 : 0xff8a4c;
        const lightDot = scene.add.circle(x + w / 2, lightY, 3, lightColor, 0.9)
          .setScrollFactor(0.35, 0.25)
          .setDepth(-49);

        // Animación suave de pulso
        scene.tweens.add({
          targets: lightDot,
          alpha: { from: 0.2, to: 0.9 },
          scale: { from: 0.8, to: 1.3 },
          duration: rng.float(1200, 2800),
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      }
    }

    // Capa 3: Cables colgantes en primer plano medio
    const cablesGraphics = scene.add.graphics().setScrollFactor(0.6, 0.4).setDepth(-30);
    cablesGraphics.lineStyle(2, 0x1a2133, 0.7);

    for (let x = 0; x < worldWidth; x += rng.float(200, 450)) {
      const p1x = x;
      const p1y = rng.float(0, 100);
      const p2x = x + rng.float(150, 300);
      const p2y = rng.float(0, 120);
      const midX = (p1x + p2x) / 2;
      const midY = Math.max(p1y, p2y) + rng.float(60, 160); // catenaria / caída del cable

      const curve = new Phaser.Curves.QuadraticBezier(
        new Phaser.Math.Vector2(p1x, p1y),
        new Phaser.Math.Vector2(midX, midY),
        new Phaser.Math.Vector2(p2x, p2y)
      );
      curve.draw(cablesGraphics);
    }
  }

  update() {
    // Parallax manejado automáticamente por setScrollFactor de Phaser
  }
}
