/**
 * Gravi en el Vacío — Punto de Entrada Principal (Phaser 3.90)
 */

import Phaser from 'phaser';
import { CONFIG } from './config.js';
import { initFirebase } from './services/firebase.js';

// Importación de Escenas
import { BootScene } from './scenes/Boot.js';
import { PrivacidadScene } from './scenes/Privacidad.js';
import { MenuScene } from './scenes/Menu.js';
import { PrologoScene } from './scenes/Prologo.js';
import { TutorialScene } from './scenes/Tutorial.js';
import { HUDScene } from './scenes/HUD.js';

// Inicialización asíncrona de Firebase (si existen credenciales)
initFirebase();

const gameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: CONFIG.WIDTH,
  height: CONFIG.HEIGHT,
  pixelArt: true,
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 }, // La gravedad específica se aplica por cuerpo
      debug: false
    }
  },
  scene: [
    BootScene,
    PrivacidadScene,
    MenuScene,
    PrologoScene,
    TutorialScene,
    HUDScene
  ]
};

const game = new Phaser.Game(gameConfig);

// Exponer instancia para depuración en consola si fuera necesario
window.__GRAVI_GAME__ = game;
