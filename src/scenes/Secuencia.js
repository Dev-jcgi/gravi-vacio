/**
 * Gravi en el Vacío — Secuencias narrativas (Prólogo y escenas N-Transition de Unity)
 * Pantalla negra con viñeta, textos que aparecen y se desvanecen, voz y piano.
 * Al terminar (evento SceneTransition del AnimationClip) pasa a la escena siguiente.
 */

import { CONFIG } from '../config.js';
import { PROLOGO, TRANSICIONES } from '../data/secuencias.js';
import { Narrativa, indicacionOmitir, estilo } from '../game/UI.js';
import { telemetria } from '../services/telemetria.js';

export class SecuenciaScene extends Phaser.Scene {
  constructor(key) {
    super({ key });
  }

  create() {
    const datos = this.scene.key === 'Prologo' ? PROLOGO : TRANSICIONES[this.scene.key];
    this.datos = datos;
    this.terminado = false;
    this.cameras.main.setBackgroundColor('#000000');
    telemetria.registrarEvento('INICIO_ESCENA', this.scene.key);

    this.narrativa = new Narrativa(this, datos.lineas, { tam: 16 });

    this.sound.stopAll();
    this.musica = this.sound.add(datos.musica ?? CONFIG.AUDIO.TRACKS.PROLOGUE, { volume: CONFIG.AUDIO.DEFAULT_MUSIC_VOLUME });
    this.voces = [];

    const empezar = () => {
      this.empezado = true;
      this.musica.play();
      for (const v of datos.voces) {
        this.time.delayedCall(v.t * 1000, () => {
          if (this.terminado) return;
          const s = this.sound.add(v.clave, { volume: CONFIG.AUDIO.DEFAULT_VOICE_VOLUME });
          s.play();
          this.voces.push(s);
        });
      }
      this.time.delayedCall(datos.duracion * 1000, () => this.salir());
    };

    // El navegador bloquea el audio hasta la primera interacción
    if (this.sound.locked) {
      const aviso = this.add.text(this.scale.width / 2, this.scale.height / 2, 'HAZ CLIC PARA COMENZAR', estilo(16, '#d9d9d9'))
        .setOrigin(0.5).setDepth(10000);
      this.tweens.add({ targets: aviso, alpha: 0.3, duration: 700, yoyo: true, repeat: -1 });
      this.sound.once(Phaser.Sound.Events.UNLOCKED, () => {
        aviso.destroy();
        empezar();
      });
    } else {
      empezar();
    }

    indicacionOmitir(this, () => this.salir());
  }

  update(_t, delta) {
    if (this.empezado) this.narrativa.actualizar(delta / 1000);
  }

  salir() {
    if (this.terminado) return;
    this.terminado = true;
    telemetria.registrarEvento('FIN_ESCENA', this.scene.key, { segundos: +this.narrativa.tiempo.toFixed(1) });
    this.cameras.main.fadeOut(700, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.sound.stopAll();
      this.scene.start(this.datos.siguiente);
    });
  }
}
