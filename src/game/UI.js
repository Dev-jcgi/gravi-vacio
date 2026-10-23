/**
 * Gravi en el Vacío — Interfaz con la estética del juego Unity
 * (fuente Press Start 2P, paneles "Text ScreenPads" azules, textos narrativos que aparecen y se desvanecen).
 */

import { CONFIG } from '../config.js';

export const estilo = (tam = 16, color = '#ffffff', extra = {}) => ({
  fontFamily: CONFIG.FUENTE,
  fontSize: `${tam}px`,
  color,
  lineSpacing: Math.round(tam * 0.6),
  ...extra
});

/** Panel azul pixelado (Text_Screen01.png de Unity) estirado como nine-slice. */
export function panel(scene, x, y, w, h, escala = 3) {
  // fondo oscuro detrás del marco (el sprite de Unity es semitransparente)
  const fondo = scene.add.rectangle(x, y, w - 24, h - 24, 0x061016, 0.82);
  const p = scene.add.nineslice(x, y, 'ui-text-screenpads-blue-text-screen01', 'Text_Screen01',
    w / escala, h / escala, 9, 9, 9, 9).setScale(escala).setOrigin(0.5);
  return scene.add.container(0, 0, [fondo, p]);
}

/**
 * Cuadro de diálogo de Animacion.cs: aparece al tocar una zona, escribe el texto letra por letra
 * (delay de Unity), bloquea a Gravi mientras tanto y se cierra 1 s después.
 */
export class Dialogo {
  constructor(scene) {
    this.scene = scene;
    const { width, height } = scene.scale;
    this.c = scene.add.container(0, 0).setScrollFactor(0).setDepth(9000).setVisible(false);
    scene.capaUI?.add(this.c);
    const w = Math.min(980, width - 80);
    const y = height - 105;
    this.c.add(panel(scene, width / 2, y, w, 150));
    const marco = scene.add.image(width / 2 - w / 2 + 78, y, 'ui-inventory-pack-blue-slot-ui', 'slot_UI').setScale(5.2);
    this.retrato = scene.add.sprite(width / 2 - w / 2 + 78, y + 2, 'robot-idle').setScale(1.55);
    this.nombre = scene.add.text(width / 2 - w / 2 + 150, y - 50, 'NEW', estilo(14, '#3fd8e0'));
    this.texto = scene.add.text(width / 2 - w / 2 + 150, y - 20, '', estilo(16, '#ffffff', { wordWrap: { width: w - 190 } }));
    this.c.add([marco, this.retrato, this.nombre, this.texto]);
    const frames = scene.textures.get('robot-idle').getFrameNames().sort();
    if (!scene.anims.exists('robot-idle-anim')) {
      scene.anims.create({ key: 'robot-idle-anim', frames: frames.map((f) => ({ key: 'robot-idle', frame: f })), frameRate: 6, repeat: -1 });
    }
    this.cola = [];
    this.activo = false;
  }

  /**
   * @param {string} texto
   * @param {object} op - { delay: s por letra (0.09 en Unity), jugador: Gravi a bloquear, nombre, alTerminar }
   */
  mostrar(texto, op = {}) {
    if (this.activo) {
      this.cola.push([texto, op]);
      return;
    }
    const { delay = 0.06, jugador = null, nombre = 'NEW', alTerminar = null, espera = 1.2 } = op;
    this.activo = true;
    this.c.setVisible(true).setAlpha(0);
    this.scene.tweens.add({ targets: this.c, alpha: 1, duration: 150 });
    this.retrato.play('robot-idle-anim');
    this.nombre.setText(nombre);
    this.texto.setText('');
    jugador?.bloquear(true);
    let i = 0;
    this.evento?.remove();
    this.evento = this.scene.time.addEvent({
      delay: delay * 1000,
      repeat: texto.length - 1,
      callback: () => {
        i++;
        this.texto.setText(texto.slice(0, i));
        if (i >= texto.length) {
          this.scene.time.delayedCall(espera * 1000, () => this.cerrar(jugador, alTerminar));
        }
      }
    });
  }

  cerrar(jugador, alTerminar) {
    this.scene.tweens.add({
      targets: this.c, alpha: 0, duration: 200,
      onComplete: () => {
        this.c.setVisible(false);
        this.activo = false;
        jugador?.bloquear(false);
        alTerminar?.();
        const sig = this.cola.shift();
        if (sig) this.mostrar(...sig);
      }
    });
  }
}

/**
 * Secuencia de textos narrativos sobre fondo negro (Narratives.prefab y Canvas/Narrative de los niveles).
 * Cada línea: { texto, claves: [[t, alfa], …] } con los tiempos de las animaciones de Unity.
 */
export class Narrativa {
  constructor(scene, lineas, { fondo = true, y = null, tam = 22, autor = null, profundidad = 9500 } = {}) {
    this.scene = scene;
    const { width, height } = scene.scale;
    this.c = scene.add.container(0, 0).setScrollFactor(0).setDepth(profundidad);
    scene.capaUI?.add(this.c);
    if (fondo) {
      this.fondo = scene.add.rectangle(0, 0, width, height, 0x000000).setOrigin(0);
      this.c.add(this.fondo);
      if (scene.textures.exists('backend-credits-vignette')) {
        this.c.add(scene.add.image(width / 2, height / 2, 'backend-credits-vignette').setDisplaySize(width, height).setAlpha(0.35));
      }
    }
    this.textos = lineas.map((l) => {
      const t = scene.add.text(width / 2, l.y ?? y ?? height / 2, l.texto, estilo(l.tam ?? tam, l.color ?? '#ffffff', {
        align: 'center', wordWrap: { width: width - 200 }
      })).setOrigin(0.5).setAlpha(0);
      this.c.add(t);
      return { t, claves: l.claves };
    });
    this.tiempo = 0;
  }

  /** Avanza la animación (segundos). */
  actualizar(dt) {
    this.tiempo += dt;
    for (const { t, claves } of this.textos) t.setAlpha(interpolar(claves, this.tiempo));
  }

  ocultarFondo(duracion = 600) {
    if (this.fondo) this.scene.tweens.add({ targets: this.fondo, alpha: 0, duration: duracion });
  }

  destruir() {
    this.c.destroy();
  }
}

/** Interpolación lineal de claves [[t, v], …] como las curvas de Unity. */
export function interpolar(claves, t) {
  if (!claves.length) return 0;
  if (t <= claves[0][0]) return claves[0][0] === 0 ? claves[0][1] : 0;
  for (let i = 1; i < claves.length; i++) {
    const [t0, v0] = claves[i - 1];
    const [t1, v1] = claves[i];
    if (t <= t1) return v0 + (v1 - v0) * ((t - t0) / Math.max(1e-6, t1 - t0));
  }
  return claves[claves.length - 1][1];
}

/** Agrega un objeto a la capa de interfaz (sin zoom) si la escena la tiene. */
export function enUI(scene, obj) {
  scene.capaUI?.add(obj);
  return obj;
}

/** Botón de texto con el estilo del menú de Unity. */
export function boton(scene, x, y, texto, alPulsar, tam = 18) {
  const t = scene.add.text(x, y, texto, estilo(tam, '#d9d9d9')).setOrigin(0.5).setInteractive({ useHandCursor: true });
  t.on('pointerover', () => t.setColor('#3fd8e0').setScale(1.05));
  t.on('pointerout', () => t.setColor('#d9d9d9').setScale(1));
  t.on('pointerdown', () => {
    scene.sound.play('sfx-boton', { volume: 0.5 });
    alPulsar();
  });
  return t;
}

/** Indicación de omitir (Espacio / clic) para secuencias narrativas. */
export function indicacionOmitir(scene, alOmitir, texto = 'ESPACIO: OMITIR') {
  const { width } = scene.scale;
  const t = scene.add.text(width - 24, 24, texto, estilo(10, '#8a8a8a')).setOrigin(1, 0).setScrollFactor(0).setDepth(9999)
    .setInteractive({ useHandCursor: true });
  scene.capaUI?.add(t);
  t.on('pointerdown', alOmitir);
  const tecla = () => alOmitir();
  scene.input.keyboard.once('keydown-SPACE', tecla);
  scene.input.keyboard.once('keydown-ENTER', tecla);
  return t;
}
