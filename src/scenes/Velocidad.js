/**
 * Gravi en el Vacío — Nivel 3: Velocidad (Speed_Level de Unity)
 * Tres retos v = d / t (12 m en 2 s, 40 m en 5 s, 140 m en 10 s). Antes de cada uno, camara.cs muestra
 * el salto durante 15 s con el enunciado. Cada ítem (caramelos.cs) cambia la fuerza de salto durante 10 s:
 * el correcto permite cruzar; los demás no. Si Gravi cae (y < -10 u), caramelocontroller.cs la devuelve
 * al punto de reaparición del reto actual y repone los ítems.
 */

import { NivelBase } from './NivelBase.js';
import { Caja, Plataforma, toca } from '../game/Objetos.js';
import { Escenario } from '../game/Escenario.js';
import { telemetria } from '../services/telemetria.js';

// Clips cross.anim (cian), crossroja.anim y crossamarilla.anim
const ANIM_CRUZ = {
  0: [0, 1, 2, 9, 10, 11, 12, 13, 14],
  3: [3, 4, 5, 15, 16, 17, 18, 19, 20],
  6: [6, 7, 8, 21, 22, 23, 24, 25, 26]
};
const RETOS = ['12 m / 2 s', '40 m / 5 s', '140 m / 10 s'];

export class VelocidadScene extends NivelBase {
  constructor() {
    super('Velocidad', 'velocidad', { ortho: 3.32, salto: 4, rutaJugador: /^Control\/Player$/ });
  }

  crearNivel() {
    const esc = this.esc;
    // Cajas para subir a las plataformas de los ítems
    this.cajas = esc.gruposPor(/^Box( \(\d+\))?$/).map((g) => new Caja(this, esc, g, this.jugador));
    for (const c of this.cajas) for (const o of this.cajas) if (c !== o) this.physics.add.collider(c.zona, o.zona);
    // Plataformas: sus Animator están desactivados en Unity, así que no se mueven
    const fijas = esc.gruposPor(/^Plataforma/).map((g) => new Plataforma(this, esc, g, this.jugador, null));
    this.plataformas = fijas;
    const pequeñas = esc.grupo('Plataformas');
    if (pequeñas) esc.solidificar(pequeñas);
    for (const c of this.cajas) this.physics.add.collider(c.zona, esc.solidos);

    // Ítems por reto (setsDeDulces) y puntos de reaparición (respawnPoints)
    const ctrl = esc.data.objetos.find((o) => o.scripts?.some((s) => s.script === 'caramelocontroller'));
    const campos = ctrl.scripts.find((s) => s.script === 'caramelocontroller').campos;
    const porRef = (ref) => esc.data.objetos.find((o) => o.id === ref || o.tid === ref);
    this.respawns = campos.respawnPoints.map(porRef);
    this.sets = campos.setsDeDulces.map((ref) => {
      const set = porRef(ref);
      return esc.data.objetos
        .filter((o) => o.ruta.startsWith(set.ruta + '/') && o.activo && o.scripts?.some((s) => s.script === 'caramelos'))
        .map((o) => {
          const c = o.scripts.find((s) => s.script === 'caramelos').campos;
          const zona = esc.data.zonas.find((z) => z.grupo === o.id);
          const grupo = esc.grupos.get(o.id);
          this.animarCruz(grupo);
          return { id: o.id, grupo, rect: Escenario.rect(zona), correcto: c.esDulceCorrecto === 1, boost: c.boostSalto, duracion: c.duracionBoost };
        });
    });
    this.setActual = 0;
    this.elegido = false;
    this.intentos = [0, 0, 0];

    // Cortes de cámara: Camara (n) → Camera (n+1) y el enunciado de Canvas (n)
    const camaras = esc.data.objetos.filter((o) => o.camera && /Mecanicas\/Camera/.test(o.ruta));
    this.cortes = esc.data.objetos.filter((o) => o.scripts?.some((s) => s.script === 'camara')).map((o) => {
      const campos2 = o.scripts.find((s) => s.script === 'camara').campos;
      const ref = Number(campos2.camaraSecundaria);
      const cam = camaras.reduce((a, b) => (Math.abs(Number(b.id) - ref) < Math.abs(Number(a.id) - ref) ? b : a));
      const sufijo = (o.nombre.match(/\(\d+\)/) || [''])[0];
      const txt = esc.data.objetos.find((t) => t.ruta === `Control/Mecanicas/Canvas${sufijo ? ' ' + sufijo : ''}/Panel/Text (Legacy)` && t.text?.text);
      return {
        rect: Escenario.rect(esc.data.zonas.find((z) => z.ruta === o.ruta)),
        cam, segundos: campos2.duracionCorte,
        texto: (txt?.text.text ?? '').replace(/\r/g, '').replace(/\n\./g, '.'),
        usado: false
      };
    }).sort((a, b) => a.rect.x - b.rect.x);

    this.iconoSobreGravi('speed_2');
    this.esc.animarGrupo(this.esc.grupo('speed_2'), 6);
  }

  animarCruz(grupo) {
    const img = grupo?.list.find((i) => i.texture.key === 'ui-crosshairs-crosshairs-static');
    if (!img) return;
    const n = Number(img.frame.name.split('_').pop());
    const cuadros = (ANIM_CRUZ[n] ?? ANIM_CRUZ[0]).map((k) => `crosshairs Static_${k}`);
    const sx = img.scaleX;
    const sy = img.scaleY;
    let i = 0;
    this.time.addEvent({
      delay: 113, loop: true,
      callback: () => {
        i = (i + 1) % cuadros.length;
        img.setFrame(cuadros[i]);
        img.setScale(sx, sy);
      }
    });
    this.tweens.add({ targets: grupo, y: grupo.y - 6, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
  }

  actualizarNivel(_t, delta) {
    for (const c of this.cajas) c.update();
    for (const p of this.plataformas) p.update(delta);
    const b = this.jugador.body;

    for (const c of this.cortes) {
      if (!c.usado && toca(b, c.rect)) {
        c.usado = true;
        telemetria.registrarEvento('VISTA_RETO', 'Velocidad', { reto: RETOS[this.cortes.indexOf(c)] });
        this.corteCamara({ x: c.cam.x, y: c.cam.y, ortho: c.cam.camera.ortho, segundos: c.segundos, texto: c.texto });
      }
    }

    // caramelos.cs: el primer ítem que toca Gravi en el reto actual
    if (!this.elegido) {
      const set = this.sets[this.setActual] ?? [];
      const item = set.find((it) => it.grupo.visible && toca(b, it.rect));
      if (item) this.elegir(item, set);
    }
  }

  elegir(item, set) {
    this.elegido = true;
    for (const it of set) if (it !== item) it.grupo.setVisible(false);
    this.jugador.saltoTemporal(item.boost, item.duracion);
    this.intentos[this.setActual]++;
    this.sound.play('sfx-boton', { volume: 0.6 });
    telemetria.registrarEvento('ITEM_ELEGIDO', 'Velocidad', {
      reto: RETOS[this.setActual], correcto: item.correcto, salto: item.boost, intento: this.intentos[this.setActual]
    });
    if (item.correcto) {
      this.jugador.setTint(0x9ff7ff);
      this.time.delayedCall(item.duracion * 1000, () => this.jugador.clearTint());
      if (this.setActual < this.sets.length - 1) {
        this.setActual++;
        this.elegido = false;
      }
    } else {
      this.jugador.setTint(0xff9a9a);
      this.time.delayedCall(item.duracion * 1000, () => this.jugador.clearTint());
    }
  }

  // caramelocontroller.ResetNivel: y < -10 u
  limiteCaida() {
    return 1000;
  }

  alCaer() {
    const r = this.respawns[this.setActual] ?? this.inicioJugador;
    this.reaparecer({ x: r.x, y: r.y });
    this.jugador.restaurarSalto();
    this.jugador.clearTint();
    this.elegido = false;
    for (const it of this.sets[this.setActual] ?? []) it.grupo.setVisible(true);
  }

  completar(siguiente) {
    super.completar(siguiente, { intentos: this.intentos });
  }
}
