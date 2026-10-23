/**
 * Gravi en el Vacío — Base común de los niveles jugables
 * Construye el escenario exportado de Unity, coloca a Gravi, la cámara (CameraController.cs:
 * sigue al jugador con desplazamiento (0, 2) y suavizado 0.1 s), la música, la introducción
 * narrativa, los diálogos de las zonas (Animacion.cs), el portal (Portal.cs) y la pausa.
 */

import { CONFIG } from '../config.js';
import { INTROS } from '../data/secuencias.js';
import { Escenario } from '../game/Escenario.js';
import { Gravi } from '../game/Gravi.js';
import { Portal } from '../game/Portal.js';
import { Dialogo, Narrativa, indicacionOmitir, estilo, enUI, panel } from '../game/UI.js';
import { telemetria } from '../services/telemetria.js';

// Escenas de Unity → escenas web
export const ESCENA_WEB = {
  '0-Transition': 'Transicion0',
  '1-Transition': 'Transicion1',
  '3-Transition': 'Transicion3',
  '4-Transition': 'Transicion4'
};

export class NivelBase extends Phaser.Scene {
  /**
   * @param {string} key - clave de la escena Phaser
   * @param {string} nombre - escena exportada (tutorial, tiempo, distancia, velocidad)
   * @param {object} op - { ortho: tamaño ortográfico de la cámara de Unity, salto: jumpForce }
   */
  constructor(key, nombre, op) {
    super({ key });
    this.nombre = nombre;
    this.op = op;
  }

  create() {
    this.fin = false;
    this.inicio = this.time.now;
    this.cameras.main.setBackgroundColor('#000000');
    this.cameras.main.setZoom(CONFIG.HEIGHT / (2 * this.op.ortho * CONFIG.PPU));
    this.physics.world.setBounds(-1e5, -1e5, 2e5, 2e5);
    this.prepararCapas();

    this.esc = new Escenario(this, this.nombre);

    // Gravi en la posición del Player de Unity
    const p = this.op.rutaJugador ? this.esc.objeto(this.op.rutaJugador) : this.esc.objeto(/(^|\/)Player$/);
    for (const g of this.esc.gruposPor('Player')) g.setVisible(false);
    this.inicioJugador = { x: p.x, y: p.y };
    this.jugador = new Gravi(this, p.x, p.y, { salto: this.op.salto ?? 4 });
    // Unity dibuja a Gravi según su sortingOrder: encima de todo lo que tiene orden menor o igual
    const gJ = this.esc.gruposPor('Player').find((g) => g.getData('info').id === p.id) ?? this.esc.grupo('Player');
    const ordenJ = Math.max(0, ...(gJ?.getData('info').sprites.map((s) => s[12]) ?? [0]));
    this.jugador.setDepth(this.esc.profundidadSobre(ordenJ));
    this.physics.add.collider(this.jugador, this.esc.solidos, (_j, z) => this.alTocarSolido(z));

    const cam = this.cameras.main;
    cam.startFollow(this.jugador, true, 0.12, 0.12);
    cam.setFollowOffset(0, 200);

    this.dialogo = new Dialogo(this);
    this.zonasDialogo = this.prepararDialogos();
    this.portal = this.crearPortal();

    this.musica = this.sound.get(CONFIG.AUDIO.TRACKS.LEVELS);
    this.sound.stopAll();
    this.musica = this.sound.add(CONFIG.AUDIO.TRACKS.LEVELS, { volume: CONFIG.AUDIO.DEFAULT_MUSIC_VOLUME, loop: true });
    this.musica.play();

    this.input.keyboard.on('keydown-ESC', () => this.pausar());
    this.ayudaControles();

    telemetria.registrarEvento('INICIO_NIVEL', this.scene.key);
    this.crearNivel();
    this.reproducirIntro();
  }

  // Dos capas y dos cámaras: el mundo con el zoom de la cámara de Unity y la interfaz a escala 1
  prepararCapas() {
    this.capaMundo = this.add.layer();
    this.capaUI = this.add.layer().setDepth(1);
    this.camUI = this.cameras.add(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
    this.cameras.main.ignore(this.capaUI);
    this.camUI.ignore(this.capaMundo);
    const barrer = () => {
      for (const go of [...this.children.list]) {
        if (go !== this.capaMundo && go !== this.capaUI) this.capaMundo.add(go);
      }
    };
    this.events.on(Phaser.Scenes.Events.POST_UPDATE, barrer);
    this.events.once(Phaser.Scenes.Events.CREATE, barrer);
  }

  /** Funde ambas cámaras a negro (o desde negro). */
  fundir(salida, ms, alTerminar) {
    for (const c of [this.cameras.main, this.camUI]) (salida ? c.fadeOut(ms, 0, 0, 0) : c.fadeIn(ms, 0, 0, 0));
    if (alTerminar) this.cameras.main.once(salida ? 'camerafadeoutcomplete' : 'camerafadeincomplete', alTerminar);
  }

  /** Cada nivel agrega aquí su mecánica. */
  crearNivel() {}

  /** Llamado cuando termina la introducción y el jugador puede moverse. */
  alTerminarIntro() {}

  ayudaControles() {
    const t = this.add.text(CONFIG.WIDTH - 16, 14, '←/→ MOVER  ESPACIO SALTAR  S AGACHAR  E EMPUJAR  ESC PAUSA',
      estilo(8, '#8f8f8f')).setOrigin(1, 0).setScrollFactor(0).setDepth(9800);
    this.ayuda = enUI(this, t);
  }

  // Introducción en negro con los textos del Canvas/Narrative y la voz de New (Control*_Level.anim)
  reproducirIntro() {
    const intro = INTROS[this.nombre];
    if (!intro) return this.terminarIntro();
    this.jugador.bloquear(true);
    this.jugador.setVisible(false);
    this.intro = new Narrativa(this, intro.lineas, { tam: 14 });
    this.vocesIntro = intro.voces.map((v) => this.time.delayedCall(v.t * 1000, () => {
      if (!this.intro) return;
      this.vozIntro = this.sound.add(v.clave, { volume: CONFIG.AUDIO.DEFAULT_VOICE_VOLUME });
      this.vozIntro.play();
    }));
    this.timerIntro = this.time.delayedCall(intro.duracion * 1000, () => this.terminarIntro());
    this.omitir = indicacionOmitir(this, () => this.terminarIntro());
  }

  terminarIntro() {
    if (this.introTerminada) return;
    this.introTerminada = true;
    this.timerIntro?.remove();
    this.vocesIntro?.forEach((e) => e.remove());
    this.omitir?.destroy();
    if (this.intro) {
      const n = this.intro;
      this.intro = null;
      n.ocultarFondo(700);
      for (const { t } of n.textos) this.tweens.add({ targets: t, alpha: 0, duration: 400 });
      this.time.delayedCall(800, () => n.destruir());
    }
    this.jugador.setVisible(true);
    this.jugador.bloquear(false);
    this.cameras.main.fadeIn(500, 0, 0, 0);
    this.alTerminarIntro();
  }

  // Zonas con Animacion.cs: texto que se escribe letra por letra la primera vez que Gravi las toca
  prepararDialogos() {
    const lista = [];
    for (const o of this.esc.data.objetos) {
      const s = o.scripts?.find((x) => x.script === 'Animacion');
      if (!s) continue;
      const z = this.esc.data.zonas.find((zz) => zz.ruta === o.ruta);
      if (!z) continue;
      lista.push({ rect: Escenario.rect(z), texto: s.campos.fullText, delay: s.campos.delay ?? 0.09, usado: false, nombre: o.nombre });
    }
    return lista;
  }

  revisarDialogos() {
    const b = this.jugador.body;
    const r = new Phaser.Geom.Rectangle(b.x, b.y, b.width, b.height);
    for (const z of this.zonasDialogo) {
      if (z.usado || !Phaser.Geom.Intersects.RectangleToRectangle(r, z.rect)) continue;
      z.usado = true;
      this.mostrarDialogo(z.texto, z.delay);
      telemetria.registrarEvento('DIALOGO', this.scene.key, { zona: z.nombre });
    }
  }

  mostrarDialogo(texto, delay = 0.05, op = {}) {
    // En Unity el texto se escribe a 0.09 s por letra; en la web se acelera un poco para no frenar el ritmo
    this.dialogo.mostrar(texto, { delay: Math.min(delay, 0.05), jugador: this.jugador, ...op });
  }

  // Portal Variant: zona grande = entrada (abre), zona pequeña = salida (carga la escena)
  crearPortal() {
    const o = this.esc.data.objetos.find((x) => x.scripts?.some((s) => s.script === 'Portal'));
    if (!o) return null;
    const campos = o.scripts.find((s) => s.script === 'Portal').campos;
    const zonas = this.esc.data.zonas.filter((z) => String(z.grupo) === String(o.id)).sort((a, b) => b.r[2] * b.r[3] - a.r[2] * a.r[3]);
    const vis = this.esc.gruposPor(/^Portal/).find((g) => g.getData('info').id === String(o.id));
    vis?.setVisible(false);
    const portal = new Portal(this, {
      x: o.x, y: o.y, escala: 0.8 * (o.sx ?? 1), profundidad: vis?.depth ?? 100,
      zonaEntrada: zonas[0] ? Escenario.rect(zonas[0]) : null,
      zonaSalida: zonas[1] ? Escenario.rect(zonas[1]) : Escenario.rect(zonas[0]),
      alCruzar: () => this.completar(ESCENA_WEB[campos.sceneToLoad] ?? campos.sceneToLoad)
    });
    portal.setActivo(o.activo);
    return portal;
  }

  update(time, delta) {
    if (this.intro) this.intro.actualizar(delta / 1000);
    if (this.fin) return;
    this.jugador.update(time, delta);
    this.revisarDialogos();
    this.portal?.update(this.jugador);
    this.actualizarNivel(time, delta);
    this.moverIcono();
    if (this.jugador.y > this.limiteCaida()) this.alCaer();
  }

  actualizarNivel() {}

  /** Gravi choca con un sólido del escenario (OnCollisionEnter2D). */
  alTocarSolido() {}

  /**
   * camara.cs: cambia a la cámara secundaria durante unos segundos con el texto
   * "Tiempo restante: N s" y bloquea a Gravi. Devuelve una promesa que se cumple al volver.
   */
  corteCamara({ x, y, ortho, segundos, texto = null }) {
    const cam = this.cameras.main;
    this.jugador.bloquear(true);
    this.enCorte = true;
    cam.stopFollow();
    const zoomAntes = cam.zoom;
    cam.pan(x, y, 900, 'Sine.easeInOut');
    cam.zoomTo(CONFIG.HEIGHT / (2 * ortho * CONFIG.PPU), 900, 'Sine.easeInOut');

    const ui = enUI(this, this.add.container(0, 0).setDepth(9200));
    const cuenta = this.add.text(CONFIG.WIDTH / 2, 40, '', estilo(18, '#ffffff', { stroke: '#000000', strokeThickness: 4 })).setOrigin(0.5);
    ui.add(cuenta);
    if (texto) {
      ui.add(panel(this, CONFIG.WIDTH / 2, CONFIG.HEIGHT - 120, 900, 170));
      ui.add(this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT - 120, texto, estilo(13, '#ffffff', { align: 'center', wordWrap: { width: 840 } })).setOrigin(0.5));
    }
    let restante = segundos;
    const pintar = () => cuenta.setText(`Tiempo restante: ${Math.ceil(restante)} s`);
    pintar();
    return new Promise((resolve) => {
      const ev = this.time.addEvent({
        delay: 100,
        loop: true,
        callback: () => {
          restante -= 0.1;
          pintar();
          if (restante > 0) return;
          ev.remove();
          ui.destroy();
          cam.zoomTo(zoomAntes, 700, 'Sine.easeInOut');
          cam.pan(this.jugador.x, this.jugador.y - 200, 700, 'Sine.easeInOut', false, (_c, prog) => {
            if (prog < 1) return;
            cam.startFollow(this.jugador, true, 0.12, 0.12);
            cam.setFollowOffset(0, 200);
            this.jugador.bloquear(false);
            this.enCorte = false;
            resolve();
          });
        }
      });
      // Espacio/Enter acortan la vista general
      const saltar = () => { restante = Math.min(restante, 0.1); };
      this.input.keyboard.once('keydown-ENTER', saltar);
    });
  }

  /** Icono que flota sobre la cabeza de Gravi (Flecha A→B en Distancia, d/t en Velocidad). */
  iconoSobreGravi(nombreGrupo) {
    const g = this.esc.grupo(nombreGrupo);
    if (!g) return;
    g.setVisible(true);
    this.icono = g;
  }

  moverIcono() {
    if (!this.icono) return;
    this.icono.setVisible(this.jugador.visible);
    this.icono.setPosition(this.jugador.x, this.jugador.y - 52 + Math.sin(this.time.now / 300) * 3);
    this.icono.setDepth(this.jugador.depth + 1);
  }

  limiteCaida() {
    return this.esc.data.limites[3] + 400;
  }

  alCaer() {
    this.reaparecer(this.inicioJugador);
  }

  reaparecer({ x, y }) {
    telemetria.registrarEvento('CAIDA', this.scene.key, { ...this.jugador.unidades });
    this.jugador.setPosition(x, y);
    this.jugador.body.setVelocity(0, 0);
    this.cameras.main.flash(250, 0, 0, 0);
  }

  pausar() {
    if (this.fin || this.scene.isPaused()) return;
    this.scene.launch('Pausa', { nivel: this.scene.key });
    this.scene.pause();
  }

  segundos() {
    return +((this.time.now - this.inicio) / 1000).toFixed(1);
  }

  completar(siguiente, datos = {}) {
    if (this.fin) return;
    this.fin = true;
    this.jugador.bloquear(true);
    telemetria.registrarEvento('COMPLETADO_NIVEL', this.scene.key, { segundos: this.segundos(), ...datos });
    try {
      localStorage.setItem(CONFIG.STORAGE.LAST_COMPLETED_FLOOR, this.scene.key);
    } catch {
      // almacenamiento no disponible
    }
    this.fundir(true, 800, () => {
      this.sound.stopAll();
      this.scene.start(siguiente);
    });
  }
}
