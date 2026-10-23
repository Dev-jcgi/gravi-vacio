/**
 * Gravi en el Vacío — Nivel 2: Distancia (Distance_Level de Unity)
 * Tres caminos de cajas (cada caja "mide 10 metros"); solo el de 100 m lleva al portal.
 *  - ActivadorConteo / ContadorPorGround: al entrar a la zona de caminos aparece "Distancia: N mts."
 *    y suma 10 m por cada caja que pisa Gravi.
 *  - camara.cs: vista general de los tres caminos durante 16 s.
 *  - TP.cs: al entrar a un camino empieza una espera de 40 s; al terminar, Gravi aparece junto al portal.
 *  - Plataforma con el clip "subir" para llegar a los caminos de arriba.
 */

import { NivelBase } from './NivelBase.js';
import { Caja, Plataforma, toca } from '../game/Objetos.js';
import { Escenario } from '../game/Escenario.js';
import { estilo, enUI, panel } from '../game/UI.js';
import { telemetria } from '../services/telemetria.js';

const SUBIR = [[0, 17.34, -0.95], [4.92, 17.34, 6.91], [10.02, 17.34, -0.95]];
const CAMINOS = { 'CAMINO UNO': 'uno', 'CAMINO DOS': 'dos', 'CAMINO TRES': 'tres' };

export class DistanciaScene extends NivelBase {
  constructor() {
    super('Distancia', 'distancia', { ortho: 4, salto: 5, rutaJugador: /^Control\/Player$/ });
  }

  crearNivel() {
    this.plataforma = new Plataforma(this, this.esc, this.esc.grupo('Plataforma'), this.jugador, SUBIR);
    this.cajas = this.esc.gruposPor(/^Box( \(\d+\))?$/).map((g) => new Caja(this, this.esc, g, this.jugador));
    for (const c of this.cajas) for (const o of this.cajas) if (c !== o) this.physics.add.collider(c.zona, o.zona);

    // Ejemplo "10 m: A → B" (Box_Cambios + Distance_0) y flecha sobre Gravi
    this.esc.animarGrupo(this.esc.grupo('Distance_0'), 8);
    this.iconoSobreGravi('Flecha');
    this.esc.animarGrupo(this.esc.grupo('Flecha'), 8);

    const zona = (n) => this.esc.data.zonas.find((z) => z.nombre === n);
    this.zContador = Escenario.rect(zona('Contador'));
    this.zCamara = Escenario.rect(zona('Camara'));
    this.camSecundaria = this.esc.objeto(/Elementos\/Camera \(1\)$/);
    this.tps = this.esc.objetos(/Elementos\/tp( \(\d\))?$/).map((o) => ({
      rect: Escenario.rect(this.esc.data.zonas.find((z) => z.ruta === o.ruta)),
      espera: o.scripts[0].campos.tiempoDeEspera,
      destino: this.esc.data.objetos.find((d) => d.tid === o.scripts[0].campos.destinoTeleport || d.id === o.scripts[0].campos.destinoTeleport)
    }));

    this.metros = 0;
    this.conteo = false;
    this.camaraUsada = false;
    this.tp = null;
    this.camino = null;
    this.teletransportes = 0;
  }

  // ContadorPorGround.cs: +10 m por cada caja base8 nueva que toca Gravi (mín. 0.2 s entre puntos)
  alTocarSolido(z) {
    if (!this.conteo) return;
    const ruta = z.getData('ruta') || '';
    if (!/base8/.test(ruta) || z === this.ultimaCaja) return;
    if (this.time.now - (this.tUltimo ?? -1e9) < 200) return;
    this.ultimaCaja = z;
    this.tUltimo = this.time.now;
    this.metros += 10;
    this.textoMetros.setText(`Distancia: ${this.metros} mts.`);
    const camino = Object.keys(CAMINOS).find((k) => ruta.includes(k));
    if (camino && CAMINOS[camino] !== this.camino) {
      this.camino = CAMINOS[camino];
      telemetria.registrarEvento('CAMINO_ELEGIDO', 'Distancia', { camino: this.camino, segundos: this.segundos() });
    }
  }

  actualizarNivel(_t, delta) {
    this.plataforma.update(delta);
    for (const c of this.cajas) c.update();
    const b = this.jugador.body;

    if (!this.conteo && toca(b, this.zContador)) this.activarConteo();

    if (!this.camaraUsada && toca(b, this.zCamara)) {
      this.camaraUsada = true;
      telemetria.registrarEvento('VISTA_GENERAL', 'Distancia');
      const c = this.camSecundaria;
      this.corteCamara({ x: c.x, y: c.y, ortho: c.camera.ortho, segundos: 16 });
    }

    // TP.cs: la primera zona que toca inicia la espera de 40 s
    if (!this.tp) {
      const tp = this.tps.find((t) => toca(b, t.rect));
      if (tp) this.iniciarTP(tp);
    } else if (!this.enCorte) {
      this.tp.restante -= delta / 1000;
      this.textoTP.setText(`⌛ ${Math.max(0, Math.ceil(this.tp.restante))} s`);
      if (this.tp.restante <= 0) this.teletransportar();
    }
  }

  activarConteo() {
    this.conteo = true;
    this.metros = 0;
    const ui = enUI(this, this.add.container(0, 0).setDepth(9000));
    ui.add(panel(this, 190, 46, 330, 60));
    this.textoMetros = this.add.text(190, 46, 'Distancia: 0 mts.', estilo(14, '#ffffff')).setOrigin(0.5);
    this.textoTP = this.add.text(190, 92, '', estilo(11, '#ffd34d')).setOrigin(0.5);
    ui.add([this.textoMetros, this.textoTP]);
  }

  iniciarTP(tp) {
    this.tp = { ...tp, restante: tp.espera };
    telemetria.registrarEvento('INICIO_CAMINOS', 'Distancia', { espera: tp.espera });
  }

  teletransportar() {
    const d = this.tp.destino;
    this.teletransportes++;
    telemetria.registrarEvento('TELETRANSPORTE', 'Distancia', { metros: this.metros, camino: this.camino, segundos: this.segundos() });
    this.tp = null;
    this.textoTP.setText('');
    if (!d) return;
    this.cameras.main.flash(400, 255, 255, 255);
    this.jugador.body.reset(d.x, d.y - 120);
  }

  completar(siguiente) {
    super.completar(siguiente, { metros: this.metros, camino: this.camino, teletransportes: this.teletransportes });
  }

  limiteCaida() {
    return 1200;
  }
}
