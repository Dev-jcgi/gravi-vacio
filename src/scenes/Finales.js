/**
 * Gravi en el Vacío — Escenas finales (PreFinal, Final_Level y AulaEducativo de Unity)
 * Cinemáticas guiadas por los Timeline de Unity (Cinematic_EndTimeline, DirectorTimeline y
 * AulaEducativaTimeline): activaciones, voces, textos y cambio de escena en los mismos segundos.
 * Elementos comunes: ascensor (platform_0), bloques que caen (FallingBlockSpawner.cs),
 * capas con parallax (ParallaxAscensor.cs), música "Birthplace" y crujido metálico.
 */

import { CONFIG } from '../config.js';
import { Escenario } from '../game/Escenario.js';
import { Portal } from '../game/Portal.js';
import { estilo, indicacionOmitir, panel, boton } from '../game/UI.js';
import { telemetria } from '../services/telemetria.js';

class Cinematica extends Phaser.Scene {
  constructor(key, nombre, { ortho, camara, siguiente, duracion }) {
    super({ key });
    this.nombre = nombre;
    this.cfg = { ortho, camara, siguiente, duracion };
  }

  create() {
    this.t = 0;
    this.terminado = false;
    this.eventos = [];
    const cam = this.cameras.main;
    cam.setBackgroundColor('#000000');

    // capas: mundo con el zoom de Unity, interfaz sin zoom
    this.capaMundo = this.add.layer();
    this.capaUI = this.add.layer().setDepth(1);
    this.camUI = this.cameras.add(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
    cam.ignore(this.capaUI);
    this.camUI.ignore(this.capaMundo);
    const barrer = () => {
      for (const go of [...this.children.list]) if (go !== this.capaMundo && go !== this.capaUI) this.capaMundo.add(go);
    };
    this.events.on(Phaser.Scenes.Events.POST_UPDATE, barrer);

    this.esc = new Escenario(this, this.nombre, { fisica: false });
    cam.setZoom(CONFIG.HEIGHT / (2 * this.cfg.ortho * CONFIG.PPU));
    cam.centerOn(this.cfg.camara.x, this.cfg.camara.y);
    for (const n of ['Background_End']) this.esc.grupo(n)?.setVisible(false);

    // Negro de Background_End (pantalla completa, en la capa de interfaz)
    this.negro = this.add.rectangle(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT, 0x000000).setOrigin(0).setAlpha(0).setDepth(50);
    this.subtitulo = this.add.text(CONFIG.WIDTH / 2, 600, '', estilo(15, '#ffffff', {
      align: 'center', stroke: '#000000', strokeThickness: 5, wordWrap: { width: 1000 }
    })).setOrigin(0.5).setDepth(60);
    this.capaUI.add([this.negro, this.subtitulo]);

    this.sound.stopAll();
    this.sound.play(CONFIG.AUDIO.TRACKS.FINAL, { volume: CONFIG.AUDIO.DEFAULT_MUSIC_VOLUME, loop: true });
    this.sound.play('sfx-metal', { volume: 0.25, loop: true });

    this.bloques = [];
    this.tBloque = 0;
    telemetria.registrarEvento('INICIO_ESCENA', this.scene.key);
    this.crear();
    indicacionOmitir(this, () => this.salir());
  }

  crear() {}

  /** Programa una acción en el segundo t de la línea de tiempo. */
  en(t, fn) {
    this.eventos.push({ t, fn, hecho: false });
  }

  /** Activa un grupo entre t0 y t1 (Activation Track). */
  activo(nombre, t0, t1) {
    const g = typeof nombre === 'string' ? this.esc.grupo(nombre) : nombre;
    if (!g) return;
    g.setVisible(false);
    this.en(t0, () => g.setVisible(true));
    if (t1 != null) this.en(t1, () => g.setVisible(false));
  }

  negroEntre(t0, t1, fundido = 0.6) {
    this.en(t0, () => this.tweens.add({ targets: this.negro, alpha: 1, duration: fundido * 1000 }));
    if (t1 != null) this.en(t1, () => this.tweens.add({ targets: this.negro, alpha: 0, duration: fundido * 1000 }));
  }

  voz(t, clave) {
    this.en(t, () => this.sound.play(clave, { volume: CONFIG.AUDIO.DEFAULT_VOICE_VOLUME }));
  }

  /** Subtítulos repartidos entre t0 y t1 (cada línea con su fundido). */
  subtitulos(lineas, t0, t1) {
    const d = (t1 - t0) / lineas.length;
    lineas.forEach((l, i) => {
      this.en(t0 + i * d, () => {
        this.subtitulo.setText(l.replace(/\s*\n\s*/g, ' ').trim()).setAlpha(0);
        this.tweens.add({ targets: this.subtitulo, alpha: 1, duration: Math.min(500, d * 300) });
      });
    });
    this.en(t1, () => this.tweens.add({ targets: this.subtitulo, alpha: 0, duration: 400 }));
  }

  // FallingBlockSpawner.cs: un bloque cada 0.2 s entre x = -15 y 4, desde y = 4, gravedad 0.2
  bloquesQueCaen(delta) {
    this.tBloque += delta;
    if (this.tBloque >= 200) {
      this.tBloque = 0;
      const tex = this.textures.get('ronment-cyberpunk2-second-layer-2-second-layer-1');
      const f = Phaser.Utils.Array.GetRandom(tex.getFrameNames());
      const b = this.add.image(Phaser.Math.Between(-1500, 400), -400, tex.key, f).setScale(0.18).setDepth(5);
      b.vy = 0;
      this.bloques.push(b);
    }
    for (const b of this.bloques) {
      b.vy += 981 * 0.2 * (delta / 1000);
      b.y += b.vy * (delta / 1000);
    }
    this.bloques = this.bloques.filter((b) => (b.y > 1200 ? (b.destroy(), false) : true));
  }

  update(_t, delta) {
    if (this.terminado) return;
    this.t += delta / 1000;
    for (const e of this.eventos) {
      if (!e.hecho && this.t >= e.t) {
        e.hecho = true;
        e.fn();
      }
    }
    this.bloquesQueCaen(delta);
    this.actualizar(delta);
    if (this.t >= this.cfg.duracion) this.salir();
  }

  actualizar() {}

  salir() {
    if (this.terminado) return;
    this.terminado = true;
    telemetria.registrarEvento('FIN_ESCENA', this.scene.key, { segundos: +this.t.toFixed(1) });
    for (const c of [this.cameras.main, this.camUI]) c.fadeOut(800, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.sound.stopAll();
      this.alSalir();
    });
  }

  alSalir() {
    this.scene.start(this.cfg.siguiente);
  }

  /** Sprite de Gravi con las hojas de animación (Control_Character_End). */
  gravi(x, y) {
    return this.add.sprite(x, y, 'gravi-idle-side').play('gravi-idle-side-anim').setDepth(this.esc.profundidad('platform_0') + 1);
  }
}

// ---------------------------------------------------------------- PreFinal
export class PreFinalScene extends Cinematica {
  constructor() {
    super('PreFinal', 'prefinal', { ortho: 3.63, camara: { x: -300, y: 0 }, siguiente: 'Final', duracion: 34 });
  }

  crear() {
    const pj = this.esc.objeto(/^Control\/Player$/);
    const plat = this.esc.grupo('platform_0');
    this.esc.animarGrupo(plat, 12);
    this.portal = new Portal(this, { x: pj.x, y: pj.y, escala: 1.06, profundidad: plat.depth, abierto: true });
    this.g = this.gravi(pj.x, pj.y).setAlpha(0);
    const suelo = plat.y - 50; // pies de Gravi sobre el ascensor
    const g = this.g;
    // Timeline: aparece en el portal, camina, salta dos veces y queda de frente sobre el ascensor
    this.en(1.5, () => this.tweens.add({ targets: g, alpha: 1, duration: 500 }));
    this.en(6.17, () => {
      g.play('gravi-walk-anim');
      this.tweens.add({ targets: g, x: pj.x + 230, duration: 2250 });
    });
    this.en(8.42, () => {
      g.play('gravi-jump-anim');
      this.tweens.add({ targets: g, x: pj.x + 380, duration: 1250 });
      this.tweens.add({ targets: g, y: pj.y - 60, duration: 450, ease: 'Sine.Out', yoyo: false,
        onComplete: () => this.tweens.add({ targets: g, y: (pj.y + suelo) / 2, duration: 800, ease: 'Sine.In' }) });
    });
    this.en(9.88, () => {
      g.play('gravi-walk-anim');
      this.tweens.add({ targets: g, x: plat.x - 140, duration: 3600 });
    });
    this.en(13.92, () => {
      g.play('gravi-jump-anim');
      this.tweens.add({ targets: g, x: plat.x, duration: 1230 });
      this.tweens.add({ targets: g, y: g.y - 70, duration: 450, ease: 'Sine.Out',
        onComplete: () => this.tweens.add({ targets: g, y: suelo, duration: 780, ease: 'Sine.In' }) });
    });
    this.en(15.4, () => g.play('gravi-idle-anim'));

    // 24 s: negro, voz de Gravi y los cuatro textos (TextFadeInPrefinal-1…4)
    this.negroEntre(24, null, 0.4);
    this.voz(24.37, 'voz-gravi-escenaprefinaldialogo1-1');
    const textos = [['Ahora todo cobra sentido.', 24.37, 2.37], ['El tiempo, la distancia y la velocidad.', 26.73, 3.02],
      ['Pero más que eso…', 29.75, 1.83], ['su legado.', 31.58, 2.0]];
    for (const [txt, t0, d] of textos) {
      this.en(t0, () => {
        const t = this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2, txt, estilo(20, '#ffffff')).setOrigin(0.5).setAlpha(0).setDepth(70);
        this.capaUI.add(t);
        this.tweens.add({ targets: t, alpha: 1, duration: (d / 2) * 1000, yoyo: true, onComplete: () => t.destroy() });
      });
    }
  }

  actualizar() {
    // la cámara sigue a Gravi en horizontal (CameraZone "Room")
    const cam = this.cameras.main;
    const x = Phaser.Math.Clamp(this.g.x, -900, 300);
    cam.centerOn(Phaser.Math.Linear(cam.midPoint.x, x, 0.05), cam.midPoint.y);
  }
}

// ---------------------------------------------------------------- Final
export class FinalScene extends Cinematica {
  constructor() {
    super('Final', 'final', { ortho: 2.93, camara: { x: -418, y: 298 }, siguiente: 'Aula', duracion: 39.78 });
  }

  crear() {
    const pj = this.esc.grupo('Player');
    pj?.setVisible(false);
    this.g = this.gravi(pj.x, pj.y).play('gravi-idle-anim');
    this.esc.animarGrupo(this.esc.grupo('platform_0'), 12);
    this.esc.animarGrupo(this.esc.grupo('Logo'), 12);
    for (const n of ['Tiempo-2_0', 'Distance_0', 'speed_1', 'New-2_0']) this.esc.animarGrupo(this.esc.grupo(n), 6);
    // Capas que se desplazan hacia abajo: el ascensor "sube" (ParallaxAscensor: 0.3 / 0.6 / 1 u/s)
    this.capas = [['Back', 30], ['Midle-1', 60], ['Midle-2', 100]].map(([n, v]) => [this.esc.grupo(n), v]).filter(([g]) => g);

    this.negroEntre(0, null, 0);
    this.negro.setAlpha(1);
    this.en(3, () => this.tweens.add({ targets: this.negro, alpha: 0, duration: 800 }));
    this.activo('Logo', 3, 4);
    this.activo('Tiempo-2_0', 4, 7.54);
    this.activo('Distance_0', 7.54, 11.68);
    this.activo('speed_1', 11.68, 17.21);
    this.activo('Gravi', 17.21, 23.07);
    this.activo('New-2_0', 23.07, 27.67);
    this.en(27.67, () => this.esc.grupo('Logo')?.setVisible(true));

    // Voces del abuelo, New y Gravi con los textos Txt1…Txt16 como subtítulos
    this.voz(4, 'voz-abuelo-escenafinal-level');
    this.subtitulos(['Conocí que el tiempo…', 'lo controla todo.', 'Aprendí que para conocer el mundo…', 'primero debía medirlo.',
      'Medí lo que recorría…', 'lo comparé con el tiempo.', 'Lo llamé velocidad.', 'Y tú, Gravi…',
      'tú eras mi mayor experimento.', 'El más perfecto.'], 4.3, 21.9);
    this.voz(23.52, 'voz-new-escenafinalleveldialogo1');
    this.subtitulos(['Ahora entiendes...', 'por qué te dejó este diario.', 'Es tu historia.'], 23.52, 27.4);
    this.voz(29.2, 'voz-gravi-escenafinal-leveldialogo1');
    this.subtitulos(['Gracias, abuelo.', 'Por enseñarme…', 'y poder llegar a donde estás tú.'], 29.2, 33.95);

    this.en(35, () => this.tweens.add({ targets: this.negro, alpha: 1, duration: 600 }));
    this.en(35.75, () => {
      const t = this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2, 'Continuará...', estilo(22, '#ffffff')).setOrigin(0.5).setAlpha(0).setDepth(70);
      this.capaUI.add(t);
      this.tweens.add({ targets: t, alpha: 1, duration: 1500, yoyo: true }); // TextFinalAbuelo.anim
    });
  }

  actualizar(delta) {
    for (const [g, v] of this.capas) g.y += v * (delta / 1000);
  }
}

// ---------------------------------------------------------------- Aula educativa
const TEXTOS_AULA = {
  tiempo: ['Bienvenid@ al Aula Educativa.', '¿Recuerdas cuando Gravi debía mover piezas en un tiempo preciso?',
    'El tiempo es eso… la medida entre un antes y un después.', 'Por ejemplo, si inicias un cronómetro y conduces un vehículo durante 10 segundos…',
    'ese intervalo se llama tiempo transcurrido.', 'En física, lo usamos para saber cuánto tarda algo en pasar.'],
  distancia: ['Ahora piensa en el nivel donde Gravi tenía que elegir caminos.',
    'No todos llevaban al mismo lugar... ni medían lo mismo. Eso es la distancia.',
    'La distancia es la cantidad de espacio que hay entre dos puntos.', 'Se mide en metros, y en física nos ayuda a saber cuánto se ha recorrido.',
    'Pero cuidado: no siempre lo más corto es lo mejor… como en la vida, ¿no?'],
  velocidad: ['¿Notaste cómo Gravi saltaba entre plataformas que se movían? Para eso necesitaba velocidad.',
    'La velocidad nos dice qué tan rápido se recorre una distancia en un tiempo determinado.',
    'En el Movimiento Rectilíneo Uniforme (MRU),', 'la velocidad siempre es constante, como una canción con ritmo parejo.',
    'Así, si recorres 20 metros en 4 segundos… vas a 5 metros por segundo. Fácil, ¿verdad?'],
  cierre: ['La física no es solo números… es entender cómo nos movemos, cómo vivimos.', 'Y si alguna vez dudas… recuerda:',
    'El conocimiento… es movimiento.', 'cada paso que das tiene tiempo, distancia y dirección.',
    'Y sí, ¡es importante para casi todo lo que se mueve!']
};

export class AulaScene extends Cinematica {
  constructor() {
    super('Aula', 'aula', { ortho: 2.93, camara: { x: -422, y: 13 }, siguiente: 'Menu', duracion: 84.58 });
  }

  crear() {
    this.esc.grupo('Player')?.setVisible(false);
    for (const n of ['Tiempo-2_0', 'Distance_0', 'speed_1', 'Gravi']) this.esc.grupo(n)?.setVisible(false);
    this.esc.animarGrupo(this.esc.grupo('New-2_0'), 6);
    this.subtitulo.setY(655);

    this.negro.setAlpha(1);
    this.en(2, () => this.tweens.add({ targets: this.negro, alpha: 0, duration: 600 }));
    // AulaEducativaTimeline
    this.activo('aulaeducativa', 2, 3.58);
    this.activo('TimeLevel', 3.58, 6.86);
    this.activo('ejemplotiempo', 7.02, 24.89);
    this.activo('DistanceLevel', 25, 31.37);
    this.activo('ejemplodistancia', 31.52, 44.83);
    this.activo('SpeedLevel', 45, 50.3);
    this.activo('ejemplovelocidad', 50.32, 59.27);
    this.activo('5segundos', 62.13, 68.46);
    this.activo('Fisica', 68.93, 72.9);
    this.activo('Paso', 75.29, 80);
    this.activo('adios', 81.03, 82.43);
    const rules = this.esc.grupo('Rules');
    if (rules) {
      rules.setVisible(false);
      for (const [a, b] of [[7.02, 24.89], [31.52, 44.83], [50.32, 59.4], [62.13, 72.9], [74.98, 79.98]]) {
        this.en(a, () => rules.setVisible(true));
        this.en(b, () => rules.setVisible(false));
      }
    }

    this.voz(2, 'voz-aulaeducativo-dialogo1');
    this.subtitulos(TEXTOS_AULA.tiempo, 2, 24.88);
    this.voz(25, 'voz-aulaeducativo-dialogo2');
    this.subtitulos(TEXTOS_AULA.distancia, 25, 44.83);
    this.voz(45, 'voz-aulaeducativo-dialogo3-1');
    this.subtitulos(TEXTOS_AULA.velocidad, 45, 73.08);
    this.voz(73.12, 'voz-aulaeducativo-dialogo4');
    this.subtitulos(TEXTOS_AULA.cierre, 73.12, 82.4);
    this.en(82.43, () => this.tweens.add({ targets: this.negro, alpha: 1, duration: 800 }));
  }

  // ExitGame (CerrarJuego.cs): en la web se muestra el cierre y se vuelve al menú
  alSalir() {
    telemetria.registrarEvento('JUEGO_COMPLETADO', 'Aula');
    this.scene.start('Fin');
  }
}

// ---------------------------------------------------------------- Cierre web
export class FinScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Fin' });
  }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#000000');
    panel(this, width / 2, height / 2, 760, 380);
    this.add.text(width / 2, height / 2 - 120, 'GRAVI EN EL VACÍO', estilo(22, '#3fd8e0')).setOrigin(0.5);
    this.add.text(width / 2, height / 2 - 40, '¡Gracias por jugar!\n\nEl conocimiento… es movimiento.', estilo(14, '#ffffff', { align: 'center' })).setOrigin(0.5);
    boton(this, width / 2, height / 2 + 70, 'VOLVER AL MENÚ', () => this.scene.start('Menu'));
    boton(this, width / 2, height / 2 + 120, 'JUGAR DE NUEVO', () => this.scene.start('Prologo'), 14);
    this.cameras.main.fadeIn(800, 0, 0, 0);
  }
}
