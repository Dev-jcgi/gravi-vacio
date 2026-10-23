/**
 * Gravi en el Vacío — Prólogo Narrativo
 * Voz del abuelo (I.N.), diario flotante, subtítulos sincronizados y transición al Tutorial.
 */

import { CONFIG } from '../config.js';
import { DIALOGOS } from '../data/dialogos.js';
import { telemetria } from '../services/telemetria.js';

export class PrologoScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Prologo' });
  }

  create() {
    const { width, height } = this.cameras.main;

    // Fondo oscuro profundo
    this.add.rectangle(0, 0, width, height, 0x05060b).setOrigin(0, 0);

    // Música suave de piano
    this.musica = this.sound.add('musica-prologo', {
      volume: CONFIG.AUDIO.DEFAULT_MUSIC_VOLUME,
      loop: true
    });
    this.musica.play();

    // Ilustración del abuelo (I.N.) con aparición progresiva
    this.imgAbuelo = this.add.image(width / 2, height / 2 - 50, 'abuelo')
      .setScale(0.9)
      .setAlpha(0);

    // Caja de Subtítulos inferior
    const subBoxW = width - 200;
    const subBoxH = 120;
    const subBoxY = height - 100;

    const subBox = this.add.graphics();
    subBox.fillStyle(0x0e111d, 0.85);
    subBox.fillRoundedRect(width / 2 - subBoxW / 2, subBoxY - subBoxH / 2, subBoxW, subBoxH, 12);
    subBox.lineStyle(1.5, 0x3fe0f0, 0.4);
    subBox.strokeRoundedRect(width / 2 - subBoxW / 2, subBoxY - subBoxH / 2, subBoxW, subBoxH, 12);

    this.txtPersonaje = this.add.text(width / 2 - subBoxW / 2 + 30, subBoxY - 40, '', {
      fontFamily: 'monospace',
      fontSize: '15px',
      fontStyle: 'bold',
      color: '#3fe0f0'
    });

    this.txtDialogo = this.add.text(width / 2 - subBoxW / 2 + 30, subBoxY - 15, '', {
      fontFamily: 'sans-serif',
      fontSize: '17px',
      color: '#f0edf9',
      wordWrap: { width: subBoxW - 60 }
    });

    // Botón Saltar en esquina superior
    const btnSaltar = this.add.text(width - 40, 35, 'SALTAR [ESPACIO] ⏭', {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#8b84a6'
    }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });

    btnSaltar.on('pointerover', () => btnSaltar.setColor('#3fe0f0'));
    btnSaltar.on('pointerout', () => btnSaltar.setColor('#8b84a6'));
    btnSaltar.on('pointerdown', () => this.irAlTutorial());

    this.input.keyboard.on('keydown-SPACE', () => this.irAlTutorial());
    this.input.keyboard.on('keydown-ESC', () => this.irAlTutorial());

    // Iniciar secuencia narrativa
    this.reproducirSecuencia();
  }

  reproducirSecuencia() {
    const d1 = DIALOGOS['voz-abuelo-escenaprologodialogo1'];
    const d2 = DIALOGOS['voz-abuelo-escenaprologodialogo2'];

    // 1. Primer diálogo del abuelo
    this.txtPersonaje.setText(d1.personaje);
    this.txtDialogo.setText(d1.texto);

    // Animación de aparición de I.N.
    this.tweens.add({
      targets: this.imgAbuelo,
      alpha: 0.8,
      duration: 3000,
      ease: 'Sine.easeIn'
    });

    this.voz1 = this.sound.add('voz-abuelo-escenaprologodialogo1', {
      volume: CONFIG.AUDIO.DEFAULT_VOICE_VOLUME
    });
    this.voz1.play();

    // 2. Segundo diálogo cuando termine el primero
    this.voz1.once('complete', () => {
      this.txtPersonaje.setText(d2.personaje);
      this.txtDialogo.setText(d2.texto);

      this.voz2 = this.sound.add('voz-abuelo-escenaprologodialogo2', {
        volume: CONFIG.AUDIO.DEFAULT_VOICE_VOLUME
      });
      this.voz2.play();

      this.voz2.once('complete', () => {
        // Pausa breve dramática antes de entrar a la torre
        this.time.delayedCall(1500, () => {
          this.irAlTutorial();
        });
      });
    });
  }

  irAlTutorial() {
    if (this.haCambiado) return;
    this.haCambiado = true;

    telemetria.registrarEvento('COMPLETADO_PROLOGO', 'Prologo');

    this.sound.stopAll();
    this.cameras.main.fade(600, 7, 8, 14, false, (camera, progress) => {
      if (progress === 1) {
        this.scene.start('Tutorial');
      }
    });
  }
}
