/**
 * Gravi en el Vacío — HUD y Compás (Escena superpuesta)
 * Muestra el Compás de los Medidores (coordenadas, tiempo, regla Q),
 * subtítulos dinámicos de diálogos y menú de pausa.
 */

import { CONFIG } from '../config.js';

export class HUDScene extends Phaser.Scene {
  constructor() {
    super({ key: 'HUD' });
  }

  create() {
    const { width, height } = this.cameras.main;

    // Referencia a la escena del nivel actual
    this.escenaNivel = this.scene.get('Tutorial');

    // 1. Contenedor del Compás (esquina superior izquierda)
    this.crearCompas();

    // 2. Insignia de controles (esquina superior derecha)
    this.crearGuiaControles();

    // 3. Contenedor de subtítulos (zona inferior)
    this.crearCajaSubtitulos();

    // 4. Menú de pausa (oculto por defecto)
    this.crearMenuPausa();

    // Tecla de pausa (ESC)
    this.input.keyboard.on('keydown-ESC', () => {
      this.togglePausa();
    });

    // Tecla de modo medición (Q)
    this.input.keyboard.on('keydown-Q', () => {
      this.toggleModoMedicion();
    });

    this.modoMedicion = false;
  }

  crearCompas() {
    this.compasContainer = this.add.container(20, 20);

    // Fondo del Compás
    const bg = this.add.graphics();
    bg.fillStyle(0x0e111d, 0.85);
    bg.fillRoundedRect(0, 0, 240, 75, 10);
    bg.lineStyle(1.5, 0x3fe0f0, 0.6);
    bg.strokeRoundedRect(0, 0, 240, 75, 10);
    this.compasContainer.add(bg);

    // Título / Símbolo
    const icon = this.add.text(14, 10, '🧭 COMPÁS DE I.N.', {
      fontFamily: 'monospace',
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#3fe0f0'
    });
    this.compasContainer.add(icon);

    // Lectura de Coordenada X e Y
    this.txtPosicion = this.add.text(14, 30, 'Posición: x = 0.0 m', {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#eceaf6'
    });
    this.compasContainer.add(this.txtPosicion);

    // Lectura de Tiempo
    this.txtTiempo = this.add.text(14, 48, 'Tiempo: t = 0.0 s', {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#c65cff'
    });
    this.compasContainer.add(this.txtTiempo);
  }

  crearGuiaControles() {
    const { width } = this.cameras.main;
    const cont = this.add.container(width - 320, 20);

    const bg = this.add.graphics();
    bg.fillStyle(0x0e111d, 0.7);
    bg.fillRoundedRect(0, 0, 300, 36, 8);
    bg.lineStyle(1, 0x262a42, 0.8);
    bg.strokeRoundedRect(0, 0, 300, 36, 8);
    cont.add(bg);

    const txt = this.add.text(150, 18, 'A/D: Mover · Espacio: Salto · S: Agachar · E: Empujar', {
      fontFamily: 'sans-serif',
      fontSize: '10px',
      color: '#a5a0be'
    }).setOrigin(0.5);
    cont.add(txt);
  }

  crearCajaSubtitulos() {
    const { width, height } = this.cameras.main;
    this.subContainer = this.add.container(width / 2, height - 70);
    this.subContainer.setAlpha(0);

    const boxW = 760;
    const boxH = 75;

    const bg = this.add.graphics();
    bg.fillStyle(0x0a0d17, 0.92);
    bg.fillRoundedRect(-boxW / 2, -boxH / 2, boxW, boxH, 10);
    bg.lineStyle(1.5, 0x3fe0f0, 0.5);
    bg.strokeRoundedRect(-boxW / 2, -boxH / 2, boxW, boxH, 10);
    this.subContainer.add(bg);

    // Retrato del hablante
    this.subRetrato = this.add.image(-boxW / 2 + 40, 0, 'new-portrait')
      .setDisplaySize(48, 56);
    this.subContainer.add(this.subRetrato);

    // Texto de nombre
    this.subNombre = this.add.text(-boxW / 2 + 75, -24, 'New', {
      fontFamily: 'monospace',
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#3fe0f0'
    });
    this.subContainer.add(this.subNombre);

    // Texto de diálogo
    this.subTexto = this.add.text(-boxW / 2 + 75, -5, '', {
      fontFamily: 'sans-serif',
      fontSize: '13px',
      color: '#f0edf9',
      wordWrap: { width: boxW - 95 }
    });
    this.subContainer.add(this.subTexto);
  }

  mostrarSubtitulo(personaje, texto, duracionMs = 6000, portraitKey = 'new-portrait') {
    this.subNombre.setText(personaje);
    this.subTexto.setText(texto);
    if (this.textures.exists(portraitKey)) {
      this.subRetrato.setTexture(portraitKey);
    }

    this.tweens.killTweensOf(this.subContainer);
    this.tweens.add({
      targets: this.subContainer,
      alpha: 1,
      duration: 250,
      ease: 'Sine.easeOut'
    });

    if (this.subTimer) this.subTimer.remove();
    this.subTimer = this.time.delayedCall(duracionMs, () => {
      this.tweens.add({
        targets: this.subContainer,
        alpha: 0,
        duration: 300,
        ease: 'Sine.easeIn'
      });
    });
  }

  toggleModoMedicion() {
    this.modoMedicion = !this.modoMedicion;
    const msg = this.modoMedicion ? 'Regla del Compás: ACTIVA [Q]' : 'Regla del Compás: DESACTIVADA';
    this.mostrarSubtitulo('Compás', msg, 2000, 'gravi-portrait');
  }

  crearMenuPausa() {
    const { width, height } = this.cameras.main;
    this.pausaContainer = this.add.container(width / 2, height / 2);
    this.pausaContainer.setVisible(false);

    const overlay = this.add.rectangle(0, 0, width, height, 0x07080e, 0.8)
      .setInteractive();
    const caja = this.add.rectangle(0, 0, 420, 320, 0x111424)
      .setStrokeStyle(2, 0x3fe0f0, 0.8);

    const titulo = this.add.text(0, -110, 'PAUSA', {
      fontFamily: 'monospace',
      fontSize: '26px',
      fontStyle: 'bold',
      color: '#3fe0f0'
    }).setOrigin(0.5);

    // Botones de pausa
    const btnReanudar = this.crearBotonMenu(0, -40, 'REANUDAR', () => this.togglePausa());
    const btnReiniciar = this.crearBotonMenu(0, 20, 'REINICIAR PISO', () => {
      this.togglePausa();
      this.scene.get('Tutorial').scene.restart();
    });
    const btnSalir = this.crearBotonMenu(0, 80, 'VOLVER AL MENÚ', () => {
      this.togglePausa();
      this.scene.stop('Tutorial');
      this.scene.stop('HUD');
      this.scene.start('Menu');
    });

    this.pausaContainer.add([overlay, caja, titulo, btnReanudar, btnReiniciar, btnSalir]);
  }

  crearBotonMenu(x, y, texto, onClick) {
    const cont = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, 260, 40, 0x1b2035)
      .setStrokeStyle(1.5, 0x3fe0f0, 0.7)
      .setInteractive({ useHandCursor: true });

    const txt = this.add.text(0, 0, texto, {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#f0edf9'
    }).setOrigin(0.5);

    cont.add([bg, txt]);

    bg.on('pointerover', () => {
      bg.setFillStyle(0x3fe0f0, 0.3);
      txt.setColor('#3fe0f0');
    });
    bg.on('pointerout', () => {
      bg.setFillStyle(0x1b2035, 1);
      txt.setColor('#f0edf9');
    });
    bg.on('pointerdown', onClick);

    return cont;
  }

  togglePausa() {
    const nivel = this.scene.get('Tutorial');
    if (!nivel) return;

    if (nivel.scene.isPaused()) {
      nivel.scene.resume();
      this.pausaContainer.setVisible(false);
    } else {
      nivel.scene.pause();
      this.pausaContainer.setVisible(true);
    }
  }

  update() {
    const nivel = this.scene.get('Tutorial');
    if (nivel && nivel.gravi && !nivel.scene.isPaused()) {
      const xMetros = nivel.gravi.getMetrosX();
      this.txtPosicion.setText(`Posición: x = ${xMetros} m`);

      if (nivel.tiempoInicio) {
        const seg = ((this.time.now - nivel.tiempoInicio) / 1000).toFixed(1);
        this.txtTiempo.setText(`Tiempo: t = ${seg} s`);
      }
    }
  }
}
