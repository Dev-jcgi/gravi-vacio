/**
 * Gravi en el Vacío — Nivel 1: Tiempo (Time_Level 1 de Unity)
 * Rompecabezas de 16 piezas (4 × 4) del retrato del abuelo con cronómetro (Puzzle.cs: tiempoLimite = 70).
 * Mientras se arma, Gravi espera de frente (jugadorFalso). Al completarlo, o al agotarse el tiempo,
 * aparece Gravi jugable y se activa el portal hacia 1-Transition.
 */

import { CONFIG } from '../config.js';
import { NivelBase } from './NivelBase.js';
import { estilo, enUI } from '../game/UI.js';
import { telemetria } from '../services/telemetria.js';

const TIEMPO_LIMITE = 70; // Puzzle.tiempoLimite en la escena de Unity
const LADO = 112;          // px de cada casilla en pantalla
const SEP = 10;
const SNAP = 40;           // piezasROM.cs: encaja a menos de 50 px (en el lienzo de 1080 p)

export class TiempoScene extends NivelBase {
  constructor() {
    super('Tiempo', 'tiempo', { ortho: 3.012, salto: 4, rutaJugador: /^Player$/ });
  }

  crearNivel() {
    // Gravi de frente (Control/Player → front) mientras dura el rompecabezas
    this.falso = this.esc.gruposPor('Player').find((g) => g.getData('info').ruta === 'Control/Player');
    this.falso?.setVisible(true).setDepth(this.jugador.depth);
    this.jugador.setVisible(false);
    this.jugador.bloquear(true);
    this.portal?.setActivo(false);
    this.estado = 'espera';
  }

  terminarIntro() {
    super.terminarIntro();
    // el Gravi real sigue oculto hasta terminar el rompecabezas
    this.jugador.setVisible(false);
    this.jugador.bloquear(true);
  }

  alTerminarIntro() {
    this.crearRompecabezas();
  }

  crearRompecabezas() {
    const { WIDTH: W, HEIGHT: H } = CONFIG;
    this.ui = enUI(this, this.add.container(0, 0).setDepth(9000));
    const tex = this.textures.get('abuelo-isaac-newton-pixelart-1');
    // 16 recortes de Isaac_Newton_pixelart 1.png ordenados por fila y columna
    const frames = tex.getFrameNames()
      .map((n) => tex.get(n))
      .sort((a, b) => Math.round(a.cutY / 128) - Math.round(b.cutY / 128) || a.cutX - b.cutX);

    const total = 4 * LADO + 3 * SEP;
    const x0 = W * 0.25 - total / 2;
    const y0 = 118;
    const xp = W * 0.72 - total / 2;
    this.casillas = [];
    for (let i = 0; i < 16; i++) {
      const cx = x0 + (i % 4) * (LADO + SEP) + LADO / 2;
      const cy = y0 + Math.floor(i / 4) * (LADO + SEP) + LADO / 2;
      this.ui.add(this.add.image(cx, cy, 'ui-inventory-pack-blue-slot-ui', 'slot_UI').setScale(LADO / 21).setAlpha(0.85));
      this.casillas.push({ x: cx, y: cy });
    }

    // Piezas revueltas a la derecha
    const orden = Phaser.Utils.Array.Shuffle([...Array(16).keys()]);
    this.piezas = frames.map((f, i) => {
      const pos = orden[i];
      const img = this.add.image(xp + (pos % 4) * (LADO + SEP) + LADO / 2, y0 + Math.floor(pos / 4) * (LADO + SEP) + LADO / 2,
        'abuelo-isaac-newton-pixelart-1', f.name).setDisplaySize(LADO, LADO).setInteractive({ draggable: true, useHandCursor: true });
      img.setData('i', i);
      this.ui.add(img);
      return img;
    });
    this.colocadas = 0;
    this.movimientos = 0;

    this.input.on('dragstart', (_p, img) => {
      if (this.estado !== 'jugando' || img.getData('ok')) return;
      this.ui.bringToTop(img);
      img.setScale(img.scaleX * 1.05, img.scaleY * 1.05);
    });
    this.input.on('drag', (_p, img, x, y) => {
      if (this.estado !== 'jugando' || img.getData('ok')) return;
      img.setPosition(x, y);
    });
    this.input.on('dragend', (_p, img) => {
      if (this.estado !== 'jugando' || img.getData('ok')) return;
      img.setDisplaySize(LADO, LADO);
      this.movimientos++;
      const c = this.casillas[img.getData('i')];
      if (Phaser.Math.Distance.Between(img.x, img.y, c.x, c.y) < SNAP) {
        img.setPosition(c.x, c.y).setData('ok', true).disableInteractive();
        this.colocadas++;
        this.sound.play('sfx-boton', { volume: 0.4 });
        if (this.colocadas === 16) this.terminarRompecabezas(true);
      }
    });

    // Reloj de arena (Animator_Time) y cronómetro mm:ss
    const nombres = this.textures.get('ai-sora-tiempo-2').getFrameNames().sort();
    if (!this.anims.exists('reloj-arena')) {
      this.anims.create({ key: 'reloj-arena', frames: nombres.map((n) => ({ key: 'ai-sora-tiempo-2', frame: n })), frameRate: 4, repeat: -1 });
    }
    const reloj = this.add.sprite(W / 2 - 150, 52, 'ai-sora-tiempo-2', nombres[0]).play('reloj-arena');
    reloj.setScale(64 / reloj.height);
    this.textoTiempo = this.add.text(W / 2 + 30, 52, '01:10', estilo(40, '#ffffff')).setOrigin(0.5);
    this.ui.add([reloj, this.textoTiempo]);
    this.ui.setAlpha(0);
    this.tweens.add({ targets: this.ui, alpha: 1, duration: 500 });

    this.ayuda.setVisible(false);
    this.restante = TIEMPO_LIMITE;
    this.estado = 'jugando';
    this.inicioPuzzle = this.time.now;
    telemetria.registrarEvento('INICIO_ROMPECABEZAS', 'Tiempo', { limite: TIEMPO_LIMITE });
  }

  actualizarNivel(_t, delta) {
    if (this.estado !== 'jugando') return;
    this.restante = Math.max(0, this.restante - delta / 1000);
    const m = Math.floor(this.restante / 60);
    const s = Math.floor(this.restante % 60);
    this.textoTiempo.setText(`${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    if (this.restante <= 10) this.textoTiempo.setColor('#ff5050');
    if (this.restante <= 0) this.terminarRompecabezas(false);
  }

  // Puzzle.PuzzleCompletado / PuzzleFallido: en ambos casos Gravi recupera el control y aparece el portal
  terminarRompecabezas(completo) {
    if (this.estado !== 'jugando') return;
    this.estado = 'fin';
    const segundos = +((this.time.now - this.inicioPuzzle) / 1000).toFixed(1);
    telemetria.registrarEvento(completo ? 'ROMPECABEZAS_COMPLETADO' : 'ROMPECABEZAS_TIEMPO_AGOTADO', 'Tiempo', {
      segundos, colocadas: this.colocadas, movimientos: this.movimientos, limite: TIEMPO_LIMITE
    });
    this.resultado = { completo, segundosRompecabezas: segundos, colocadas: this.colocadas };
    for (const p of this.piezas) p.disableInteractive();

    const aviso = enUI(this, this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT - 70,
      completo ? '¡RETRATO COMPLETO!' : 'SE AGOTÓ EL TIEMPO', estilo(20, completo ? '#3fd8e0' : '#ff5050')).setOrigin(0.5).setDepth(9100));
    this.time.delayedCall(completo ? 1200 : 2200, () => {
      this.tweens.add({ targets: [this.ui, aviso], alpha: 0, duration: 600, onComplete: () => aviso.destroy() });
      this.falso?.setVisible(false);
      this.ayuda.setVisible(true);
      this.jugador.setVisible(true);
      this.jugador.bloquear(false);
      this.portal?.setActivo(true);
      this.mostrarDialogo('Se ha activado el portal, ¡vamos!', 0.05);
    });
  }

  completar(siguiente) {
    super.completar(siguiente, this.resultado ?? {});
  }
}
