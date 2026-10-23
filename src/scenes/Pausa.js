/**
 * Gravi en el Vacío — Menú de pausa (Esc) sobre el nivel en curso
 */

import { estilo, boton, panel } from '../game/UI.js';
import { telemetria } from '../services/telemetria.js';

export class PausaScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Pausa' });
  }

  create({ nivel }) {
    const { width, height } = this.scale;
    this.add.rectangle(0, 0, width, height, 0x000000, 0.6).setOrigin(0);
    panel(this, width / 2, height / 2, 520, 330);
    this.add.text(width / 2, height / 2 - 110, 'PAUSA', estilo(22, '#3fd8e0')).setOrigin(0.5);

    const reanudar = () => {
      this.scene.resume(nivel);
      this.scene.stop();
    };
    boton(this, width / 2, height / 2 - 40, 'CONTINUAR', reanudar);
    boton(this, width / 2, height / 2 + 10, 'REINICIAR NIVEL', () => {
      telemetria.registrarEvento('REINICIO_NIVEL', nivel);
      this.sound.stopAll();
      this.scene.stop(nivel);
      this.scene.start(nivel);
    });
    boton(this, width / 2, height / 2 + 60, 'MENÚ PRINCIPAL', () => {
      telemetria.registrarEvento('SALIR_A_MENU', nivel);
      this.sound.stopAll();
      this.scene.stop(nivel);
      this.scene.start('Menu');
    });
    this.add.text(width / 2, height / 2 + 125, 'ESC: CONTINUAR', estilo(9, '#8a8a8a')).setOrigin(0.5);
    this.input.keyboard.once('keydown-ESC', reanudar);
    this.sound.pauseAll();
    this.events.once('shutdown', () => this.sound.resumeAll());
  }
}
