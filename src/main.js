/**
 * Gravi en el Vacío — Punto de entrada (Phaser 3.90)
 * Recorrido igual al juego Unity: Prólogo → Menú → Tutorial → Tiempo → Distancia → Velocidad
 * → PreFinal → Final → Aula educativa (con sus escenas de transición).
 */

import Phaser from 'phaser';
import { CONFIG } from './config.js';
import { initFirebase } from './services/firebase.js';

import { BootScene } from './scenes/Boot.js';
import { PrivacidadScene } from './scenes/Privacidad.js';
import { MenuScene } from './scenes/Menu.js';
import { SecuenciaScene } from './scenes/Secuencia.js';
import { TutorialScene } from './scenes/Tutorial.js';
import { TiempoScene } from './scenes/Tiempo.js';
import { DistanciaScene } from './scenes/Distancia.js';
import { VelocidadScene } from './scenes/Velocidad.js';
import { PreFinalScene, FinalScene, AulaScene, FinScene } from './scenes/Finales.js';
import { PausaScene } from './scenes/Pausa.js';

initFirebase();

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game-container',
  width: CONFIG.WIDTH,
  height: CONFIG.HEIGHT,
  backgroundColor: '#000000',
  pixelArt: true,
  roundPixels: false,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 0 }, debug: false }
  },
  scene: [
    BootScene,
    PrivacidadScene,
    new SecuenciaScene('Prologo'),
    MenuScene,
    TutorialScene,
    new SecuenciaScene('Transicion0'),
    TiempoScene,
    new SecuenciaScene('Transicion1'),
    DistanciaScene,
    new SecuenciaScene('Transicion3'),
    VelocidadScene,
    new SecuenciaScene('Transicion4'),
    PreFinalScene,
    FinalScene,
    AulaScene,
    FinScene,
    PausaScene
  ]
});

window.__GRAVI_GAME__ = game;
