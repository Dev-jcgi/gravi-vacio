/**
 * Gravi en el Vacío — Tutorial (Tutorial_Level de Unity)
 * Moverse, saltar, agacharse bajo la estructura y empujar la caja al botón (PlataformaBoton.cs)
 * para activar la plataforma que sube y baja; después el portal lleva a 0-Transition.
 */

import { NivelBase } from './NivelBase.js';
import { Caja, Plataforma, toca } from '../game/Objetos.js';
import { Escenario } from '../game/Escenario.js';
import { telemetria } from '../services/telemetria.js';

// Clips de "imagen_2025-06-24_204937500-removebg-preview.controller": dañado (en espera) y subirybajar (activada)
const DANADO = [[0, 20.6465, -0.08], [1.37, 21.35, -0.08], [2.9, 20.31, -0.08], [4.3, 20.6465, -0.08]];
const SUBIR_Y_BAJAR = [[0, 20.6465, -0.12], [1.52, 20.6465, 2.7], [3.02, 20.6465, -0.12]];

export class TutorialScene extends NivelBase {
  constructor() {
    super('Tutorial', 'tutorial', { ortho: 3, salto: 4 });
  }

  crearNivel() {
    const caja = this.esc.grupo('Box-1-Tutoriallevel');
    this.caja = new Caja(this, this.esc, caja, this.jugador);
    this.plataforma = new Plataforma(this, this.esc, this.esc.grupo(/^Plataforma/), this.jugador, DANADO);
    this.physics.add.collider(this.caja.zona, this.plataforma.zona);

    const zb = this.esc.zonas(/(^|\/)boton$/)[0];
    this.zonaBoton = zb ? Escenario.rect(zb) : null;
    this.botonActivado = false;
  }

  actualizarNivel(_t, delta) {
    this.caja.update();
    this.plataforma.update(delta);
    if (!this.botonActivado && this.zonaBoton && toca(this.caja.body, this.zonaBoton)) {
      this.botonActivado = true;
      this.sound.play('sfx-boton', { volume: 0.8 });
      this.caja.fijar();
      this.plataforma.setClaves(SUBIR_Y_BAJAR);
      telemetria.registrarEvento('CAJA_EN_BOTON', 'Tutorial', { segundos: this.segundos() });
    }
  }
}
