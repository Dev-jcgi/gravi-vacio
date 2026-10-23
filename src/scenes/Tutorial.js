/**
 * Gravi en el Vacío — Piso 0: Tutorial (Dominio del Movimiento y Posición)
 * Construido con generación procedural de tramos y validado por física.
 */

import { CONFIG } from '../config.js';
import { createRNG } from '../procgen/rng.js';
import { GeneradorPiso0 } from '../procgen/niveles.js';
import { MegaestructuraBackground } from '../procgen/megaestructura.js';
import { Gravi } from '../game/Gravi.js';
import { NewRobot } from '../game/New.js';
import { Caja } from '../game/Caja.js';
import { Boton } from '../game/Boton.js';
import { Portal } from '../game/Portal.js';
import { DIALOGOS } from '../data/dialogos.js';
import { telemetria } from '../services/telemetria.js';

export class TutorialScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Tutorial' });
  }

  create() {
    this.tiempoInicio = this.time.now;
    telemetria.registrarEvento('INICIO_NIVEL', 'Tutorial', { piso: 0, concepto: 'Posición' });

    // 1. Generación Procedural del Nivel
    this.rng = createRNG();
    const generador = new GeneradorPiso0(this.rng);
    const nivelData = generador.generar();

    // Límites del mundo de física
    this.physics.world.setBounds(0, 0, nivelData.anchoMundoPx, nivelData.altoMundoPx);

    // 2. Fondo Procedural en Capas (Megaestructura con paralaje)
    this.fondo = new MegaestructuraBackground(this, this.rng, nivelData.anchoMundoPx, nivelData.altoMundoPx);

    // 3. Construcción del Tilemap a partir de la matriz de tramos
    const map = this.make.tilemap({
      data: nivelData.datosMapa,
      tileWidth: CONFIG.TILE_SIZE,
      tileHeight: CONFIG.TILE_SIZE
    });

    const tileset = map.addTilesetImage('estructura', 'estructura', CONFIG.TILE_SIZE, CONFIG.TILE_SIZE, 0, 0);
    this.capaSuelo = map.createLayer(0, tileset, 0, 0);
    this.capaSuelo.setCollisionByExclusion([-1]);

    // 4. Entidades del juego
    const { puntosClave } = nivelData;

    // Robot Mentor (New)
    this.newRobot = new NewRobot(this, puntosClave.posicionNew.x, puntosClave.posicionNew.y);

    // Sensor de Coordenada (Botón)
    this.boton = new Boton(this, puntosClave.boton.x, puntosClave.boton.y, 1.2);

    // Caja Empujable
    this.caja = new Caja(this, puntosClave.caja.x, puntosClave.caja.y);

    // Portal de Salida
    this.portal = new Portal(this, puntosClave.portal.x, puntosClave.portal.y);

    // Gravi (Personaje Jugador)
    this.gravi = new Gravi(this, puntosClave.spawnGravi.x, puntosClave.spawnGravi.y);

    // 5. Colisiones físicas
    this.physics.add.collider(this.gravi, this.capaSuelo);
    this.physics.add.collider(this.caja, this.capaSuelo);

    // Interacción de empuje entre Gravi y la Caja
    this.physics.add.collider(this.gravi, this.caja, (gravi, caja) => {
      const dirX = Math.sign(caja.x - gravi.x);
      const isPushInput = (dirX > 0 && (gravi.cursors.right.isDown || gravi.keys.d.isDown)) ||
                          (dirX < 0 && (gravi.cursors.left.isDown || gravi.keys.a.isDown));

      if (isPushInput) {
        gravi.isPushing = true;
        caja.body.setVelocityX(dirX * CONFIG.PHYSICS.PUSH_SPEED);
      } else {
        gravi.isPushing = false;
      }
    });

    // 6. Cámara cinemática que sigue a Gravi
    this.cameras.main.setBounds(0, 0, nivelData.anchoMundoPx, nivelData.altoMundoPx);
    this.cameras.main.startFollow(this.gravi, true, 0.08, 0.08);
    this.cameras.main.setDeadzone(80, 40);

    // 7. Iniciar Escena de Interfaz (HUD) en paralelo
    this.scene.launch('HUD');
    this.hud = this.scene.get('HUD');

    // 8. Música de Nivel
    this.musicaNivel = this.sound.add('musica-niveles', {
      volume: CONFIG.AUDIO.DEFAULT_MUSIC_VOLUME,
      loop: true
    });
    this.musicaNivel.play();

    // 9. Diálogo inicial de New
    this.time.delayedCall(1200, () => {
      this.reproducirDialogoInicial();
    });

    // Estado del nivel
    this.nivelCompletado = false;
    this.haEntradoEnTriggerDeTutorial = false;
  }

  reproducirDialogoInicial() {
    const d1 = DIALOGOS['voz-new-escenatutorial-leveldialogo1'];
    if (this.hud && d1) {
      this.hud.mostrarSubtitulo(d1.personaje, d1.texto, 8000, 'new-portrait');
    }

    if (this.sound.get('voz-new-escenatutorial-leveldialogo1')) {
      this.sound.play('voz-new-escenatutorial-leveldialogo1', {
        volume: CONFIG.AUDIO.DEFAULT_VOICE_VOLUME
      });
    }
  }

  update(time, delta) {
    if (this.gravi) {
      this.gravi.update(time, delta);
    }
    if (this.newRobot) {
      this.newRobot.update();
    }

    // Comprobar si la caja está sobre el botón (sensor de coordenadas)
    if (!this.boton.estaActivo && this.caja) {
      const distCajaBoton = Math.abs(this.caja.x - this.boton.x);
      if (distCajaBoton < 30) {
        this.boton.activar();
        this.portal.desbloquear();
        telemetria.registrarEvento('CAJA_EN_SENSOR', 'Tutorial', {
          posicionCajaX: this.caja.getMetrosX(),
          posicionBotonX: (this.boton.x / CONFIG.TILE_SIZE).toFixed(1)
        });

        if (this.hud) {
          this.hud.mostrarSubtitulo('New', '¡Excelente! Has situado la masa en la coordenada exacta. El portal está abierto.', 6000, 'new-portrait');
        }
      }
    }

    // Comprobar si Gravi llega al portal desbloqueado
    if (this.portal.desbloqueado && !this.nivelCompletado) {
      const distGraviPortal = Phaser.Math.Distance.Between(this.gravi.x, this.gravi.y, this.portal.x, this.portal.y);
      if (distGraviPortal < 50) {
        this.completarPiso();
      }
    }
  }

  completarPiso() {
    this.nivelCompletado = true;
    const tiempoTotalSeg = ((this.time.now - this.tiempoInicio) / 1000).toFixed(1);

    telemetria.registrarEvento('COMPLETADO_NIVEL', 'Tutorial', {
      piso: 0,
      tiempoTotalSeg,
      concepto: 'Posición y Movimiento'
    });

    localStorage.setItem(CONFIG.STORAGE.LAST_COMPLETED_FLOOR, '0');

    if (this.hud) {
      this.hud.mostrarSubtitulo('Compás', `¡Piso 0 completado en ${tiempoTotalSeg} s! Ascendiendo a la siguiente sección...`, 4000, 'gravi-portrait');
    }

    this.cameras.main.fade(1200, 7, 8, 14, false, (camera, progress) => {
      if (progress === 1) {
        this.sound.stopAll();
        this.scene.stop('HUD');
        this.scene.start('Menu');
      }
    });
  }
}
